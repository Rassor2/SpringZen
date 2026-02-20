from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'spring_zen_db')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# --- Models ---

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    area: str  # e.g., "Kitchen", "Bedroom", "General"
    difficulty: str = "Medium" # Easy, Medium, Hard
    estimated_time: str = "30 mins"
    is_global: bool = True # True for seeded tasks, False for custom user tasks

class UserTaskStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    task_id: str
    is_completed: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    brand: str
    category: str # "Organization", "Cleaning", "Tools"
    price_range: str # "$", "$$", "$$$"
    description: str
    image_url: Optional[str] = None
    affiliate_link: Optional[str] = None

class Guide(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str
    content: str # Markdown or HTML
    author: str = "SpringZen Team"
    published_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    image_url: Optional[str] = None

# --- Dependencies ---

async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        # Fallback to Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": session_token})
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
        
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
        
    return User(**user_doc)

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "SpringZen API is running"}

# --- Auth Routes ---

@api_router.post("/auth/callback")
async def auth_callback(request: Request, response: Response):
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")

    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            emergent_res = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            emergent_res.raise_for_status()
            user_data = emergent_res.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=401, detail="Failed to verify session with provider")

    email = user_data.get("email")
    name = user_data.get("name")
    picture = user_data.get("picture")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update info if changed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = User(
            user_id=user_id,
            email=email,
            name=name,
            picture=picture
        )
        await db.users.insert_one(new_user.model_dump())

    # Create Session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    new_session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    # Store datetime as ISO format for Mongo compatibility if needed, 
    # but Motor handles datetime objects. To be safe, we can store as is.
    await db.user_sessions.insert_one(new_session.model_dump())

    # Set Cookie
    response = JSONResponse(content={"user": {"user_id": user_id, "name": name, "email": email, "picture": picture}})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True, 
        samesite="none",
        expires=expires_at.strftime("%a, %d %b %Y %H:%M:%S GMT")
    )
    return response

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(response: Response, request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token")
    return response


# --- Planner Routes ---

@api_router.get("/tasks")
async def get_tasks(user: User = Depends(get_current_user)):
    # 1. Get Global Tasks
    global_tasks = await db.tasks.find({"is_global": True}, {"_id": 0}).to_list(1000)
    
    # 2. Get User's Custom Tasks
    custom_tasks = await db.tasks.find({"is_global": False, "user_id": user.user_id}, {"_id": 0}).to_list(1000) # Assuming we add user_id to custom tasks later, for now schema doesn't have it but we'll add it dynamically
    
    all_tasks_def = global_tasks # For now, let's stick to global + completion status. 
    # If we want custom tasks, we need to modify Task model to support owner_id.
    # The Task model above has `is_global`.
    # Let's fetch custom tasks where `owner_id` (not defined in model explicitly but we can use generic field or assume schema flexibility)
    
    # 3. Get User's Completion Status
    user_statuses = await db.user_task_status.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    completed_task_ids = {s["task_id"] for s in user_statuses if s["is_completed"]}
    
    # Merge
    result = []
    for t in global_tasks:
        t_dict = t
        t_dict["is_completed"] = t["id"] in completed_task_ids
        result.append(t_dict)
        
    # We can also handle custom tasks here if we implement the "Add Task" feature
    user_custom_tasks = await db.tasks.find({"is_global": False, "owner_id": user.user_id}, {"_id": 0}).to_list(1000)
    for t in user_custom_tasks:
        t_dict = t
        t_dict["is_completed"] = t["id"] in completed_task_ids
        result.append(t_dict)
        
    return result

@api_router.post("/tasks/toggle")
async def toggle_task(payload: dict, user: User = Depends(get_current_user)):
    task_id = payload.get("task_id")
    if not task_id:
        raise HTTPException(status_code=400, detail="Missing task_id")
        
    # Check if status exists
    existing = await db.user_task_status.find_one({"user_id": user.user_id, "task_id": task_id})
    
    if existing:
        new_status = not existing["is_completed"]
        await db.user_task_status.update_one(
            {"user_id": user.user_id, "task_id": task_id},
            {"$set": {"is_completed": new_status, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"task_id": task_id, "is_completed": new_status}
    else:
        # Create new
        new_status_doc = UserTaskStatus(
            user_id=user.user_id,
            task_id=task_id,
            is_completed=True
        )
        await db.user_task_status.insert_one(new_status_doc.model_dump())
        return {"task_id": task_id, "is_completed": True}

@api_router.post("/tasks/add")
async def add_custom_task(payload: dict, user: User = Depends(get_current_user)):
    title = payload.get("title")
    area = payload.get("area", "General")
    if not title:
        raise HTTPException(status_code=400, detail="Missing title")
        
    new_task = Task(
        title=title,
        area=area,
        is_global=False,
        description="Personal task",
        difficulty="Medium",
        estimated_time="30 mins"
    )
    task_dict = new_task.model_dump()
    task_dict["owner_id"] = user.user_id # Add owner_id manually
    
    await db.tasks.insert_one(task_dict)
    
    # Also mark as not completed (optional, or just rely on absence of status)
    return new_task


# --- Products & Guides Routes (Public) ---
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/guides", response_model=List[Guide])
async def get_guides():
    guides = await db.guides.find({}, {"_id": 0}).to_list(1000)
    return guides


# Seed Route (Updated)
@api_router.post("/seed")
async def seed_database():
    # Clear existing collections to avoid duplicates on re-seed
    await db.tasks.delete_many({"is_global": True})
    await db.products.delete_many({})
    await db.guides.delete_many({})

    # Seed Tasks (More Comprehensive)
    tasks_data = [
        # Kitchen
        Task(title="Deep Clean Fridge", description="Remove all food, wipe shelves with baking soda solution, check expiration dates.", area="Kitchen", difficulty="Medium", estimated_time="45 mins"),
        Task(title="Organize Pantry", description="Group items by category (grains, cans, spices). Use clear bins.", area="Kitchen", difficulty="Medium", estimated_time="1 hour"),
        Task(title="Degrease Range Hood", description="Soak filters in hot soapy water.", area="Kitchen", difficulty="Hard", estimated_time="30 mins"),
        Task(title="Clean Oven", description="Run self-clean cycle or use heavy-duty cleaner.", area="Kitchen", difficulty="Hard", estimated_time="2 hours"),
        
        # Bedroom
        Task(title="Declutter Wardrobe", description="KonMari method: Does it spark joy? Donate unused items.", area="Bedroom", difficulty="Hard", estimated_time="2 hours"),
        Task(title="Rotate Mattress", description="Rotate 180 degrees for even wear.", area="Bedroom", difficulty="Easy", estimated_time="15 mins"),
        Task(title="Wash Bedding & Pillows", description="Launder duvet covers, pillows, and mattress protectors.", area="Bedroom", difficulty="Medium", estimated_time="1.5 hours"),
        
        # Living Room
        Task(title="Clean Windows", description="Wash inside and out. Use squeegee for streak-free finish.", area="Living Room", difficulty="Medium", estimated_time="1 hour"),
        Task(title="Shampoo Carpets/Rugs", description="Deep clean to remove winter dust and allergens.", area="Living Room", difficulty="Hard", estimated_time="2 hours"),
        Task(title="Dust Ceiling Fans", description="Use a pillowcase to trap dust from blades.", area="Living Room", difficulty="Easy", estimated_time="20 mins"),
        
        # Bathroom
        Task(title="Scrub Grout", description="Use toothbrush and grout cleaner for tiles.", area="Bathroom", difficulty="Hard", estimated_time="1 hour"),
        Task(title="Organize Medicine Cabinet", description="Discard expired meds safely.", area="Bathroom", difficulty="Easy", estimated_time="30 mins"),
    ]
    await db.tasks.insert_many([t.model_dump() for t in tasks_data])

    # Seed Products (Real Products)
    products_data = [
        Product(
            name="iRobot Roomba j8+ Self-Emptying Vacuum", 
            brand="iRobot",
            category="Cleaning", 
            price_range="$$$", 
            description="Top-rated robot vacuum that empties itself. Essential for maintaining clean floors effortlessly during spring.", 
            image_url="https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=1000", 
            affiliate_link="https://www.amazon.com/s?k=roomba+j8%2B"
        ),
        Product(
            name="OXO Good Grips POP Containers (10-Piece Set)", 
            brand="OXO",
            category="Organization", 
            price_range="$$", 
            description="Airtight, stackable, and space-efficient. The gold standard for pantry organization.", 
            image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000", 
            affiliate_link="https://www.amazon.com/s?k=oxo+pop+containers"
        ),
        Product(
            name="BISSELL Little Green Multi-Purpose Cleaner", 
            brand="BISSELL",
            category="Cleaning", 
            price_range="$$", 
            description="Portable carpet and upholstery cleaner. Perfect for spots and stains on sofas and stairs.", 
            image_url="https://images.unsplash.com/photo-1558317374-a309d24467c3?auto=format&fit=crop&q=80&w=1000", 
            affiliate_link="https://www.amazon.com/s?k=bissell+little+green"
        ),
        Product(
            name="The Pink Stuff Miracle Cleaning Paste", 
            brand="Stardrops",
            category="Cleaning", 
            price_range="$", 
            description="Viral multi-purpose cleaner. Tough on stains, gentle on surfaces. Great for ovens and sinks.", 
            image_url="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=1000", 
            affiliate_link="https://www.amazon.com/s?k=the+pink+stuff"
        ),
        Product(
            name="Bamboo Drawer Dividers (Expandable)", 
            brand="Various",
            category="Organization", 
            price_range="$$", 
            description="Instantly organize kitchen utensils or dresser drawers with these sustainable bamboo dividers.", 
            image_url="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=1000", 
            affiliate_link="https://www.amazon.com/s?k=bamboo+drawer+dividers"
        ),
        Product(
            name="Swedish Dishcloths (10 Pack)", 
            brand="Various",
            category="Cleaning", 
            price_range="$", 
            description="Eco-friendly alternative to paper towels. Super absorbent and reusable.", 
            image_url="https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&q=80&w=1000", 
            affiliate_link="https://www.amazon.com/s?k=swedish+dishcloths"
        ),
    ]
    await db.products.insert_many([p.model_dump() for p in products_data])

    # Seed Guides (Real Content Summaries)
    guides_data = [
        Guide(
            title="The KonMari Method™ Explained", 
            subtitle="Spark Joy in Your Home", 
            content="""The KonMari Method™, created by Marie Kondo, is a way of life and a state of mind that encourages cherishing the things that spark joy in people's lives. 
            
**Key Principles:**
1. **Commit yourself to tidying up.**
2. **Imagine your ideal lifestyle.**
3. **Finish discarding first.**
4. **Tidy by category, not by location.**
5. **Follow the right order:** Clothes, Books, Papers, Komono (Misc), Sentimental Items.
6. **Ask yourself if it sparks joy.**

Don't just tidy your room; change your life. This method isn't just about cleaning, it's about learning what you value.""", 
            image_url="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000"
        ),
        Guide(
            title="Swedish Death Cleaning (Döstädning)", 
            subtitle="A Practical Approach to Decluttering", 
            content="""Based on the book by Margareta Magnusson, Swedish Death Cleaning is a method of downsizing and organizing your possessions so that your loved ones won't be burdened by them after you pass away. But it's not morbid—it's liberating!

**How to Start:**
* **Start with the easy stuff:** Clothes, kitchenware, or the 'junk drawer'.
* **Don't start with photos/letters:** You'll get stuck in memory lane.
* **Ask:** "Will anyone I know be happier if I save this?"
* **Gift things away now:** Give items to family members who actually want them while you're still here to see them enjoy it.

It's about living a lighter, more organized life *now*.""", 
            image_url="https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?auto=format&fit=crop&q=80&w=1000"
        ),
        Guide(
            title="Ultimate Spring Cleaning Checklist 2025", 
            subtitle="Room-by-Room Breakdown", 
            content="""Follow this systematic approach to tackle your entire home without getting overwhelmed.

**Kitchen:**
* Deep clean fridge & freezer (toss expired).
* Degrease cabinet fronts.
* Clean oven and microwave.
* Organize pantry.

**Living Areas:**
* Wash windows and treatments.
* Steam clean upholstery.
* Dust baseboards and crown molding.
* Sanitize remotes and switches.

**Bedrooms:**
* Wash all bedding (including comforters).
* Rotate mattress.
* Switch seasonal wardrobe.
* Vacuum under the bed.

**Bathrooms:**
* Scrub grout and tile.
* Replace shower curtain liner.
* Discard expired toiletries.
* Clean exhaust fan.""", 
            image_url="https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=1000"
        ),
    ]
    
    guides_dicts = []
    for g in guides_data:
        d = g.model_dump()
        d['published_date'] = d['published_date'].isoformat()
        guides_dicts.append(d)
        
    await db.guides.insert_many(guides_dicts)

    return {"message": "Database seeded successfully with SpringZen content!"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
