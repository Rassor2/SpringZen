from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

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

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    area: str  # e.g., "Kitchen", "Bedroom", "General"
    difficulty: str = "Medium" # Easy, Medium, Hard
    estimated_time: str = "30 mins"

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
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

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "SpringZen API is running"}

# Tasks Routes
@api_router.get("/tasks", response_model=List[Task])
async def get_tasks():
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    return tasks

# Products Routes
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

# Guides Routes
@api_router.get("/guides", response_model=List[Guide])
async def get_guides():
    guides = await db.guides.find({}, {"_id": 0}).to_list(1000)
    return guides


# Seed Route
@api_router.post("/seed")
async def seed_database():
    # Clear existing collections to avoid duplicates on re-seed
    await db.tasks.delete_many({})
    await db.products.delete_many({})
    await db.guides.delete_many({})

    # Seed Tasks
    tasks_data = [
        Task(title="Declutter Wardrobe", description="Sort clothes into Keep, Donate, Trash piles.", area="Bedroom", difficulty="Hard", estimated_time="2 hours"),
        Task(title="Deep Clean Fridge", description="Remove expired food, wipe shelves, organize jars.", area="Kitchen", difficulty="Medium", estimated_time="45 mins"),
        Task(title="Organize Pantry", description="Group items by category, use clear bins.", area="Kitchen", difficulty="Medium", estimated_time="1 hour"),
        Task(title="Clean Windows", description="Wash inside and out for maximum light.", area="Living Room", difficulty="Medium", estimated_time="1 hour"),
        Task(title="Sort Paperwork", description="File important docs, shred unnecessary mail.", area="Office", difficulty="Easy", estimated_time="30 mins"),
        Task(title="Rotate Mattress", description="Rotate for even wear.", area="Bedroom", difficulty="Easy", estimated_time="15 mins"),
        Task(title="Clean Grout", description="Scrub bathroom tile grout.", area="Bathroom", difficulty="Hard", estimated_time="1.5 hours"),
    ]
    await db.tasks.insert_many([t.model_dump() for t in tasks_data])

    # Seed Products
    products_data = [
        Product(name="Clear Storage Bins (Set of 4)", category="Organization", price_range="$$", description="Perfect for pantry or closet organization. Stackable and durable.", image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000", affiliate_link="#"),
        Product(name="Label Maker Pro", category="Tools", price_range="$", description="Essential for keeping everything identified and tidy.", image_url="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=1000", affiliate_link="#"),
        Product(name="Bamboo Drawer Dividers", category="Organization", price_range="$$", description="Expandable dividers for kitchen or dresser drawers.", image_url="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=1000", affiliate_link="#"),
        Product(name="Natural All-Purpose Cleaner", category="Cleaning", price_range="$", description="Eco-friendly cleaner for all surfaces.", image_url="https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=1000", affiliate_link="#"),
    ]
    await db.products.insert_many([p.model_dump() for p in products_data])

    # Seed Guides
    guides_data = [
        Guide(title="The 7-Day Declutter Challenge", subtitle="Transform your home in just one week.", content="Day 1: Kitchen. Day 2: Living Room. Day 3: Bathrooms...", image_url="https://images.unsplash.com/photo-1484154218962-a1c00207099b?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="KonMari vs Hygge", subtitle="Which philosophy suits your lifestyle?", content="Comparing the joy of sparking joy with the coziness of Hygge...", image_url="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000"),
        Guide(title="Spring Cleaning Checklist 2025", subtitle="Don't miss a spot with our ultimate list.", content="Download our printable checklist or use the interactive one in the app!", image_url="https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?auto=format&fit=crop&q=80&w=1000"),
    ]
    
    # Convert datetime to string for MongoDB insertion, though Pydantic usually handles it well, 
    # motor sometimes prefers dicts.
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
