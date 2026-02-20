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
    role: str = "user" # Can be "admin" or "user"
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
    area: str
    difficulty: str = "Medium"
    estimated_time: str = "30 mins"
    is_global: bool = True
    owner_id: Optional[str] = None # For custom tasks

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
    category: str
    price_range: str
    description: str
    long_description: Optional[str] = None # More detail
    pros: List[str] = Field(default_factory=list) # Pros
    cons: List[str] = Field(default_factory=list) # Cons
    image_url: Optional[str] = None
    affiliate_link: Optional[str] = None

class Guide(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str
    content: str
    category: str = "Methodology" # "Methodology", "Room-Specific", "Mental Health"
    author: str = "SpringZen Team"
    published_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    image_url: Optional[str] = None

class GlossaryTerm(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    term: str
    definition: str
    source: Optional[str] = None

class Statistic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    value: str
    source: str
    year: str
    description: Optional[str] = None


# --- Dependencies ---

async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        # For public read access, we might return None, but for write access we need authentication
        # Let's verify token strictly here.
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
        
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

async def get_optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "SpringZen API is running"}

# --- Auth Routes (Same as before) ---
@api_router.post("/auth/callback")
async def auth_callback(request: Request, response: Response):
    data = await request.json()
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")

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
    
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        user_id = existing_user["user_id"]
        role = existing_user.get("role", "user") # Keep existing role
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Determine role: First user created is admin, others are users.
        count = await db.users.count_documents({})
        role = "admin" if count == 0 else "user" 
        
        new_user = User(user_id=user_id, email=email, name=name, picture=picture, role=role)
        await db.users.insert_one(new_user.model_dump())

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    new_session = UserSession(user_id=user_id, session_token=session_token, expires_at=expires_at)
    await db.user_sessions.insert_one(new_session.model_dump())

    response = JSONResponse(content={"user": {"user_id": user_id, "name": name, "email": email, "picture": picture, "role": role}})
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", expires=expires_at.strftime("%a, %d %b %Y %H:%M:%S GMT"))
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

# --- CMS Routes (Modifying Articles/Products) ---

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, payload: dict, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can modify products")
    
    # Remove immutable fields if present
    payload.pop("id", None)
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": payload}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
        
    updated_doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated_doc

@api_router.put("/guides/{guide_id}")
async def update_guide(guide_id: str, payload: dict, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can modify guides")

    payload.pop("id", None)
    
    result = await db.guides.update_one(
        {"id": guide_id},
        {"$set": payload}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Guide not found")
        
    updated_doc = await db.guides.find_one({"id": guide_id}, {"_id": 0})
    return updated_doc

# --- Content Routes ---

@api_router.get("/products", response_model=List[Product])
async def get_products():
    return await db.products.find({}, {"_id": 0}).to_list(1000)

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/guides", response_model=List[Guide])
async def get_guides():
    return await db.guides.find({}, {"_id": 0}).to_list(1000)

@api_router.get("/guides/{guide_id}", response_model=Guide)
async def get_guide(guide_id: str):
    guide = await db.guides.find_one({"id": guide_id}, {"_id": 0})
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")
    return guide

@api_router.get("/glossary", response_model=List[GlossaryTerm])
async def get_glossary():
    return await db.glossary.find({}, {"_id": 0}).sort("term", 1).to_list(1000)

@api_router.get("/stats", response_model=List[Statistic])
async def get_stats():
    return await db.stats.find({}, {"_id": 0}).to_list(1000)

@api_router.get("/tasks")
async def get_tasks(user: User = Depends(get_current_user)):
    global_tasks = await db.tasks.find({"is_global": True}, {"_id": 0}).to_list(1000)
    custom_tasks = await db.tasks.find({"is_global": False, "owner_id": user.user_id}, {"_id": 0}).to_list(1000)
    
    user_statuses = await db.user_task_status.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    completed_ids = {s["task_id"] for s in user_statuses if s["is_completed"]}
    
    result = []
    for t in global_tasks + custom_tasks:
        t_dict = dict(t)
        t_dict["is_completed"] = t["id"] in completed_ids
        result.append(t_dict)
    return result

@api_router.post("/tasks/toggle")
async def toggle_task(payload: dict, user: User = Depends(get_current_user)):
    task_id = payload.get("task_id")
    if not task_id:
        raise HTTPException(status_code=400, detail="Missing task_id")
    
    existing = await db.user_task_status.find_one({"user_id": user.user_id, "task_id": task_id})
    if existing:
        new_status = not existing["is_completed"]
        await db.user_task_status.update_one(
            {"user_id": user.user_id, "task_id": task_id},
            {"$set": {"is_completed": new_status, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"task_id": task_id, "is_completed": new_status}
    else:
        new_status_doc = UserTaskStatus(user_id=user.user_id, task_id=task_id, is_completed=True)
        await db.user_task_status.insert_one(new_status_doc.model_dump())
        return {"task_id": task_id, "is_completed": True}

@api_router.post("/tasks/add")
async def add_custom_task(payload: dict, user: User = Depends(get_current_user)):
    title = payload.get("title")
    area = payload.get("area", "General")
    if not title:
        raise HTTPException(status_code=400, detail="Missing title")
        
    new_task = Task(title=title, area=area, is_global=False, description="Personal task", owner_id=user.user_id)
    await db.tasks.insert_one(new_task.model_dump())
    return new_task

# --- Seed Route (Massive Expansion) ---

@api_router.post("/seed")
async def seed_database():
    await db.tasks.delete_many({"is_global": True})
    await db.products.delete_many({})
    await db.guides.delete_many({})
    await db.glossary.delete_many({})
    await db.stats.delete_many({})

    # 1. TASKS
    tasks_data = [
        Task(title="Deep Clean Fridge", description="Remove all food, wipe shelves with baking soda solution, check expiration dates.", area="Kitchen", difficulty="Medium", estimated_time="45 mins"),
        Task(title="Organize Pantry", description="Group items by category (grains, cans, spices). Use clear bins.", area="Kitchen", difficulty="Medium", estimated_time="1 hour"),
        Task(title="Degrease Range Hood", description="Soak filters in hot soapy water.", area="Kitchen", difficulty="Hard", estimated_time="30 mins"),
        Task(title="Clean Oven", description="Run self-clean cycle or use heavy-duty cleaner.", area="Kitchen", difficulty="Hard", estimated_time="2 hours"),
        Task(title="Declutter Wardrobe", description="KonMari method: Does it spark joy? Donate unused items.", area="Bedroom", difficulty="Hard", estimated_time="2 hours"),
        Task(title="Rotate Mattress", description="Rotate 180 degrees for even wear.", area="Bedroom", difficulty="Easy", estimated_time="15 mins"),
        Task(title="Wash Bedding & Pillows", description="Launder duvet covers, pillows, and mattress protectors.", area="Bedroom", difficulty="Medium", estimated_time="1.5 hours"),
        Task(title="Clean Windows", description="Wash inside and out. Use squeegee for streak-free finish.", area="Living Room", difficulty="Medium", estimated_time="1 hour"),
        Task(title="Shampoo Carpets/Rugs", description="Deep clean to remove winter dust and allergens.", area="Living Room", difficulty="Hard", estimated_time="2 hours"),
        Task(title="Dust Ceiling Fans", description="Use a pillowcase to trap dust from blades.", area="Living Room", difficulty="Easy", estimated_time="20 mins"),
        Task(title="Scrub Grout", description="Use toothbrush and grout cleaner for tiles.", area="Bathroom", difficulty="Hard", estimated_time="1 hour"),
        Task(title="Organize Medicine Cabinet", description="Discard expired meds safely.", area="Bathroom", difficulty="Easy", estimated_time="30 mins"),
    ]
    await db.tasks.insert_many([t.model_dump() for t in tasks_data])

    # 2. PRODUCTS (More Details)
    products_data = [
        Product(
            name="iRobot Roomba j8+", brand="iRobot", category="Cleaning", price_range="$$$",
            description="Top-rated robot vacuum that empties itself.",
            long_description="The Roomba j8+ is designed to handle homes with pets. It avoids obstacles like cords and pet waste, empties itself for up to 60 days, and maps your home for targeted cleaning.",
            pros=["Self-emptying base", "Object avoidance", "Great for pet hair"],
            cons=["Expensive", "Requires bag replacements for base"],
            image_url="https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=1000",
            affiliate_link="https://www.amazon.com/s?k=roomba+j8%2B"
        ),
        Product(
            name="OXO Good Grips POP Containers", brand="OXO", category="Organization", price_range="$$",
            description="Airtight, stackable, and space-efficient.",
            long_description="These containers are the gold standard for pantry organization. The push-button mechanism creates an airtight seal with one touch, keeping dry foods fresh. The modular stacking system saves space.",
            pros=["Airtight seal", "Dishwasher safe", "Stackable design"],
            cons=["Can crack if dropped", "Pricey per unit"],
            image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000",
            affiliate_link="https://www.amazon.com/s?k=oxo+pop+containers"
        ),
        Product(
            name="The Pink Stuff Paste", brand="Stardrops", category="Cleaning", price_range="$",
            description="Viral multi-purpose cleaner paste.",
            long_description="A tough cleaning paste that is gentle on surfaces but tough on stains. Ideal for cleaning saucepans, barbecues, ceramic tiles, glass, rust, sinks, uPVC, garden furniture, paintwork, boats, cookertops, copper and much more.",
            pros=["Cheap", "Versatile", "Effective on tough stains"],
            cons=["Can be abrasive on delicate surfaces", "Requires rinsing"],
            image_url="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=1000",
            affiliate_link="https://www.amazon.com/s?k=the+pink+stuff"
        ),
        Product(
            name="Dyson V15 Detect", brand="Dyson", category="Cleaning", price_range="$$$",
            description="Cordless vacuum with laser dust detection.",
            long_description="The Dyson V15 Detect features a laser that reveals microscopic dust on hard floors. It automatically adapts suction power based on floor type and dust volume. Up to 60 minutes of run time.",
            pros=["Laser reveals hidden dust", "Powerful suction", "LCD screen stats"],
            cons=["Very expensive", "Trigger must be held down"],
            image_url="https://images.unsplash.com/photo-1558317374-a309d24467c3?auto=format&fit=crop&q=80&w=1000",
            affiliate_link="https://www.amazon.com/s?k=dyson+v15"
        ),
        Product(
            name="Method All-Purpose Cleaner", brand="Method", category="Cleaning", price_range="$",
            description="Plant-based cleaner that smells great.",
            long_description="This biodegradable formula cuts through grease and grime on most non-porous surfaces. It's cruelty-free and comes in bottles made from 100% recycled plastic.",
            pros=["Eco-friendly", "Great scents", "Non-toxic"],
            cons=["Not a disinfectant", "Less effective on heavy grease"],
            image_url="https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=1000",
            affiliate_link="https://www.amazon.com/s?k=method+cleaner"
        ),
        Product(
            name="Container Store Elfa System", brand="Elfa", category="Organization", price_range="$$$",
            description="Customizable shelving and drawer system.",
            long_description="Elfa is a completely customizable shelving and drawer system suitable for closets, pantries, offices, and garages. Known for its durability and flexibility.",
            pros=["Highly customizable", "Durable steel construction", "10-year warranty"],
            cons=["Requires installation", "Expensive"],
            image_url="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=1000",
            affiliate_link="https://www.containerstore.com/s/elfa/1"
        )
    ]
    await db.products.insert_many([p.model_dump() for p in products_data])

    # 3. GUIDES (More Detailed)
    guides_data = [
        Guide(
            title="The KonMari Method™ Explained", subtitle="Spark Joy in Your Home", category="Methodology",
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
            title="Swedish Death Cleaning (Döstädning)", subtitle="A Practical Approach to Decluttering", category="Methodology",
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
            title="Ultimate Spring Cleaning Checklist 2025", subtitle="Room-by-Room Breakdown", category="Room-Specific",
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
        Guide(
            title="Zone Cleaning: The FlyLady Method", subtitle="15 Minutes at a Time", category="Methodology",
            content="""The FlyLady method focuses on building routines and tackling your home in 'zones' to avoid burnout. 

**Core Concepts:**
* **Shine Your Sink:** Start every day with a clean, shiny kitchen sink.
* **15-Minute Dashes:** Set a timer and clean as much as you can. Stop when it rings.
* **Zones:** Divide your home into 5 zones. Spend one week focusing deeply on one zone.
    * Zone 1: Entrance/Dining Room
    * Zone 2: Kitchen
    * Zone 3: Main Bathroom/Another Room
    * Zone 4: Master Bedroom
    * Zone 5: Living Room

This method is perfect for busy parents or those overwhelmed by mess.""",
            image_url="https://images.unsplash.com/photo-1484154218962-a1c00207099b?auto=format&fit=crop&q=80&w=1000"
        ),
        Guide(
            title="Digital Decluttering Guide", subtitle="Organize Your Virtual Life", category="Mental Health",
            content="""Spring cleaning isn't just for physical spaces. Your digital life needs maintenance too.

**The Checklist:**
1. **Inbox Zero:** Unsubscribe from newsletters you don't read. Archive old emails.
2. **Desktop Cleanup:** Move files into folders. Delete screenshots.
3. **Phone Photos:** Delete duplicates and blurry shots. Back up to the cloud.
4. **Apps:** Delete apps you haven't used in 3 months.
5. **Passwords:** Update old passwords and enable 2FA using a password manager.

A clean digital space reduces anxiety and improves productivity.""",
            image_url="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=1000"
        )
    ]
    guides_dicts = []
    for g in guides_data:
        d = g.model_dump()
        d['published_date'] = d['published_date'].isoformat()
        guides_dicts.append(d)
    await db.guides.insert_many(guides_dicts)

    # 4. GLOSSARY (New)
    glossary_data = [
        GlossaryTerm(term="HEPA Filter", definition="High Efficiency Particulate Air filter. Traps 99.97% of dust, pollen, mold, bacteria, and any airborne particles with a size of 0.3 microns."),
        GlossaryTerm(term="Decanting", definition="The process of removing food or supplies from original packaging and placing them into clear, matching containers to reduce visual clutter."),
        GlossaryTerm(term="Zone Cleaning", definition="A cleaning method where you focus on one specific area (zone) of the house for a set period (e.g., a week) rather than trying to clean the whole house at once."),
        GlossaryTerm(term="Microfiber", definition="Synthetic fiber finer than one denier or decitex/thread. Excellent for cleaning because it traps dirt and bacteria positively charged."),
        GlossaryTerm(term="Swedish Death Cleaning", definition="A decluttering method focused on removing unnecessary items so loved ones don't have to deal with them after one passes away."),
        GlossaryTerm(term="Minimalism", definition="A lifestyle of living with less. In organizing, it focuses on keeping only items that serve a purpose or bring joy."),
        GlossaryTerm(term="Gray Water", definition="Gently used water from bathroom sinks, showers, tubs, and washing machines that can be reused for landscape irrigation."),
        GlossaryTerm(term="Oeko-Tex", definition="A certification that ensures textiles are free from harmful substances."),
        GlossaryTerm(term="Visual Clutter", definition="The mental load caused by seeing disorganized items, mismatched colors, or excessive objects in a space."),
    ]
    await db.glossary.insert_many([g.model_dump() for g in glossary_data])

    # 5. STATISTICS (New)
    stats_data = [
        Statistic(label="Americans who Spring Clean", value="80%", source="American Cleaning Institute (ACI)", year="2024", description="80% of Americans prefer spring cleaning to doing their taxes."),
        Statistic(label="Global Organization Market", value="$13.13 Billion", source="Verified Market Research", year="2024", description="Expected to reach $17.67 Billion by 2032."),
        Statistic(label="Decluttering Motivation", value="79%", source="Nextdoor Survey", year="2024", description="79% of people cite 'eliminating clutter/freeing up space' as their main motivation."),
        Statistic(label="Mood Improvement", value="94%", source="Nextdoor Survey", year="2024", description="94% of people report being in a better mood after cleaning."),
        Statistic(label="Market Growth (CAGR)", value="4.3%", source="Verified Market Research", year="2024-2032", description="Steady growth in the home organization sector."),
    ]
    await db.stats.insert_many([s.model_dump() for s in stats_data])

    return {"message": "Database seeded with rich, extensive content!"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
