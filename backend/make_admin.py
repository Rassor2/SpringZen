import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

async def main():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'spring_zen_db')]
    
    # Update all users to be admin for this demo
    result = await db.users.update_many({}, {"$set": {"role": "admin"}})
    print(f"Updated {result.modified_count} users to admin")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
