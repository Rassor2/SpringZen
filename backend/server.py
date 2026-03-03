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

class Subscriber(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Dependencies ---

async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
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

# --- Auth Routes ---
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
        role = existing_user.get("role", "user") 
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
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

# --- CMS Routes (Modifying/Adding Articles/Products) ---

@api_router.post("/products")
async def create_product(product: Product, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add products")
    
    await db.products.insert_one(product.model_dump())
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, payload: dict, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can modify products")
    
    payload.pop("id", None)
    result = await db.products.update_one({"id": product_id}, {"$set": payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
        
    updated_doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated_doc

@api_router.post("/guides")
async def create_guide(guide: Guide, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add guides")
    
    # Ensure datetime is serializable if created manually
    if isinstance(guide.published_date, datetime):
         pass # Pydantic handles this
    
    guide_dict = guide.model_dump()
    guide_dict['published_date'] = guide_dict['published_date'].isoformat()
    
    await db.guides.insert_one(guide_dict)
    return guide

@api_router.put("/guides/{guide_id}")
async def update_guide(guide_id: str, payload: dict, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can modify guides")

    payload.pop("id", None)
    result = await db.guides.update_one({"id": guide_id}, {"$set": payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Guide not found")
        
    updated_doc = await db.guides.find_one({"id": guide_id}, {"_id": 0})
    return updated_doc

# --- Newsletter Routes ---

@api_router.post("/subscribe")
async def subscribe(payload: dict):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Missing email")
    existing = await db.subscribers.find_one({"email": email})
    if existing:
        return {"message": "Already subscribed"}
    new_sub = Subscriber(email=email)
    await db.subscribers.insert_one(new_sub.model_dump())
    return {"message": "Subscribed successfully"}

@api_router.get("/admin/subscribers")
async def get_subscribers(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    subs = await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return subs

@api_router.delete("/admin/subscribers/{sub_id}")
async def delete_subscriber(sub_id: str, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.subscribers.delete_one({"id": sub_id})
    return {"message": "Deleted"}

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
        await db.user_task_status.update_one({"user_id": user.user_id, "task_id": task_id}, {"$set": {"is_completed": new_status, "updated_at": datetime.now(timezone.utc)}})
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

# --- Seed Route (MASSIVE EXPANSION) ---

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
        Task(title="Wipe Kitchen Cabinets", description="Clean exterior fronts and handles.", area="Kitchen", difficulty="Easy", estimated_time="20 mins"),
        Task(title="Descale Kettle/Coffee Maker", description="Run a vinegar cycle to remove mineral buildup.", area="Kitchen", difficulty="Easy", estimated_time="15 mins"),

        Task(title="Declutter Wardrobe", description="KonMari method: Does it spark joy? Donate unused items.", area="Bedroom", difficulty="Hard", estimated_time="2 hours"),
        Task(title="Rotate Mattress", description="Rotate 180 degrees for even wear.", area="Bedroom", difficulty="Easy", estimated_time="15 mins"),
        Task(title="Wash Bedding & Pillows", description="Launder duvet covers, pillows, and mattress protectors.", area="Bedroom", difficulty="Medium", estimated_time="1.5 hours"),
        Task(title="Vacuum Under Bed", description="Move the bed if possible to catch dust bunnies.", area="Bedroom", difficulty="Medium", estimated_time="20 mins"),

        Task(title="Clean Windows", description="Wash inside and out. Use squeegee for streak-free finish.", area="Living Room", difficulty="Medium", estimated_time="1 hour"),
        Task(title="Shampoo Carpets/Rugs", description="Deep clean to remove winter dust and allergens.", area="Living Room", difficulty="Hard", estimated_time="2 hours"),
        Task(title="Dust Ceiling Fans", description="Use a pillowcase to trap dust from blades.", area="Living Room", difficulty="Easy", estimated_time="20 mins"),
        Task(title="Wipe Baseboards", description="Clean dust and scuffs from all baseboards.", area="Living Room", difficulty="Medium", estimated_time="30 mins"),

        Task(title="Scrub Grout", description="Use toothbrush and grout cleaner for tiles.", area="Bathroom", difficulty="Hard", estimated_time="1 hour"),
        Task(title="Organize Medicine Cabinet", description="Discard expired meds safely.", area="Bathroom", difficulty="Easy", estimated_time="30 mins"),
        Task(title="Wash Shower Curtain", description="Launder or replace liner.", area="Bathroom", difficulty="Easy", estimated_time="15 mins"),
        Task(title="Clean Exhaust Fan", description="Vacuum dust from the bathroom vent.", area="Bathroom", difficulty="Easy", estimated_time="10 mins"),
    ]
    await db.tasks.insert_many([t.model_dump() for t in tasks_data])

    # 2. PRODUCTS (Expanded Market Place)
    products_data = [
        Product(name="iRobot Roomba j8+", brand="iRobot", category="Cleaning", price_range="$$$", description="Top-rated robot vacuum that empties itself.", 
                long_description="The Roomba j8+ is designed to handle homes with pets. It avoids obstacles like cords and pet waste, empties itself for up to 60 days.", pros=["Self-emptying", "Smart Mapping"], cons=["Pricey"], image_url="https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=roomba+j8%2B"),
        Product(name="OXO Good Grips POP Containers", brand="OXO", category="Organization", price_range="$$", description="Airtight, stackable, and space-efficient.", 
                long_description="Gold standard for pantry organization. Push-button airtight seal.", pros=["Airtight", "Modular"], cons=["Brittle if dropped"], image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=oxo+pop"),
        Product(name="The Pink Stuff Paste", brand="Stardrops", category="Cleaning", price_range="$", description="Viral multi-purpose cleaner paste.", 
                long_description="Tough on stains, gentle on surfaces. Ideal for saucepans, barbecues, ceramic tiles.", pros=["Cheap", "Effective"], cons=["Abrasive"], image_url="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=pink+stuff"),
        Product(name="Dyson V15 Detect", brand="Dyson", category="Cleaning", price_range="$$$", description="Cordless vacuum with laser dust detection.", 
                long_description="Features a laser that reveals microscopic dust on hard floors.", pros=["Powerful", "Laser detect"], cons=["Expensive"], image_url="https://images.unsplash.com/photo-1558317374-a309d24467c3?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=dyson+v15"),
        Product(name="Method All-Purpose Cleaner", brand="Method", category="Cleaning", price_range="$", description="Plant-based cleaner that smells great.", 
                long_description="Biodegradable formula cuts through grease. Cruelty-free.", pros=["Eco-friendly", "Good scent"], cons=["Not disinfectant"], image_url="https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=method+cleaner"),
        Product(name="Elfa Drawer System", brand="Container Store", category="Organization", price_range="$$$", description="Customizable shelving and drawer system.", 
                long_description="Completely customizable for closets, pantries, offices.", pros=["Customizable", "Durable"], cons=["Installation needed"], image_url="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.containerstore.com/s/elfa/1"),
        Product(name="Scrub Daddy Sponge", brand="Scrub Daddy", category="Cleaning", price_range="$", description="Texture changing sponge.", 
                long_description="Soft in warm water, firm in cool water. Resists odors.", pros=["Versatile", "Durable"], cons=["None"], image_url="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=scrub+daddy"),
        Product(name="Bissell Little Green", brand="Bissell", category="Cleaning", price_range="$$", description="Portable carpet cleaner.", 
                long_description="Removes spots and stains from carpets and upholstery.", pros=["Portable", "Effective"], cons=["Loud"], image_url="https://images.unsplash.com/photo-1558317374-a309d24467c3?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=bissell+little+green"),
        Product(name="Label Maker D30", brand="Phomemo", category="Organization", price_range="$", description="Bluetooth label printer.", 
                long_description="Print labels from your phone. Inkless thermal printing.", pros=["Wireless", "No ink"], cons=["Small labels only"], image_url="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=phomemo+d30"),
        Product(name="Under Bed Storage Bags", brand="Various", category="Organization", price_range="$", description="Large capacity fabric containers.", 
                long_description="Store seasonal clothes and blankets dust-free.", pros=["Spacious", "Clear window"], cons=["Soft sides"], image_url="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=under+bed+storage"),
        Product(name="Microfiber Cloth Pack", brand="Amazon Basics", category="Cleaning", price_range="$", description="Non-abrasive cleaning cloths.", 
                long_description="Cleans with or without chemical cleaners, leaves lint-free results.", pros=["Reusable", "Cheap"], cons=["Wash separately"], image_url="https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=microfiber+cloths"),
        Product(name="Cable Management Box", brand="Various", category="Organization", price_range="$", description="Hides power strips and cords.", 
                long_description="Keep cords organized and hidden. Safer for kids and pets.", pros=["Neat look", "Safety"], cons=["Plastic"], image_url="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=1000", affiliate_link="https://www.amazon.com/s?k=cable+management+box"),
    ]
    await db.products.insert_many([p.model_dump() for p in products_data])

    # 3. GUIDES (Expanded)
    guides_data = [
        Guide(title="The KonMari Method™ Explained", subtitle="Spark Joy in Your Home", category="Methodology", content="Tidying by category, not location. Keep only what sparks joy.", image_url="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="Swedish Death Cleaning", subtitle="A Practical Approach", category="Methodology", content="Decluttering so others don't have to.", image_url="https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="Spring Cleaning Checklist 2025", subtitle="Room-by-Room", category="Room-Specific", content="Systematic approach to deep cleaning.", image_url="https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="Zone Cleaning: FlyLady", subtitle="15 Minutes at a Time", category="Methodology", content="Avoid burnout by cleaning in zones.", image_url="https://images.unsplash.com/photo-1484154218962-a1c00207099b?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="Digital Decluttering", subtitle="Organize Virtual Life", category="Mental Health", content="Inbox zero and photo backup strategies.", image_url="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="Pantry Organization 101", subtitle="Function over Form", category="Room-Specific", content="How to organize for efficiency, not just aesthetics.", image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="Eco-Friendly Cleaning", subtitle="Green Solutions", category="Methodology", content="Vinegar, baking soda, and lemon juice hacks.", image_url="https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="Capsule Wardrobe Guide", subtitle="Less is More", category="Methodology", content="Simplify your closet to 30 items or less.", image_url="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=1000"),
    ]
    
    guides_dicts = []
    for g in guides_data:
        d = g.model_dump()
        d['published_date'] = d['published_date'].isoformat()
        guides_dicts.append(d)
    await db.guides.insert_many(guides_dicts)
    
    # 4. GLOSSARY (Preserved)
    glossary_data = [
        GlossaryTerm(term="HEPA Filter", definition="High Efficiency Particulate Air filter."),
        GlossaryTerm(term="Decanting", definition="Removing food from packaging into clear containers."),
        GlossaryTerm(term="Zone Cleaning", definition="Focusing on one area at a time."),
        GlossaryTerm(term="Microfiber", definition="Synthetic fiber excellent for cleaning."),
        GlossaryTerm(term="Swedish Death Cleaning", definition="Decluttering for end-of-life preparation."),
        GlossaryTerm(term="Minimalism", definition="Living with less."),
        GlossaryTerm(term="Gray Water", definition="Reusing water for irrigation."),
        GlossaryTerm(term="Oeko-Tex", definition="Textile safety certification."),
        GlossaryTerm(term="Visual Clutter", definition="Mental load from disorganized visual fields."),
        GlossaryTerm(term="Knolling", definition="Arranging related objects in parallel or 90-degree angles."),
    ]
    await db.glossary.insert_many([g.model_dump() for g in glossary_data])

    # 5. STATS (Preserved)
    stats_data = [
        Statistic(label="Americans who Spring Clean", value="80%", source="ACI", year="2024"),
        Statistic(label="Global Organization Market", value="$13.13 Billion", source="Verified Market Research", year="2024"),
        Statistic(label="Decluttering Motivation", value="79%", source="Nextdoor", year="2024"),
        Statistic(label="Mood Improvement", value="94%", source="Nextdoor", year="2024"),
        Statistic(label="Market Growth (CAGR)", value="4.3%", source="Verified Market Research", year="2024-2032"),
    ]
    await db.stats.insert_many([s.model_dump() for s in stats_data])

    return {"message": "Database seeded with massive marketplace content!"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
