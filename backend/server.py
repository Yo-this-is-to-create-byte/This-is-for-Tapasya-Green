from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

from auth import hash_password, verify_password
from routes.users import router as users_router
from routes.enquiries import router as enquiries_router
from routes.content import router as content_router
from routes.uploads import router as uploads_router
from seed import seed_defaults

# --- MongoDB ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


def get_db():
    return db


# --- App ---
app = FastAPI(title="Prochem Tapasya API")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "prochem-tapasya-api", "status": "ok"}


api_router.include_router(users_router)
api_router.include_router(enquiries_router)
api_router.include_router(content_router)
api_router.include_router(uploads_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# --- Startup: bootstrap admin + seed + indexes ---
@app.on_event("startup")
async def on_startup():
    # Object storage session key
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

    # Indexes
    try:
        await db.users.create_index("email", unique=True)
        await db.enquiries.create_index([("created_at", -1)])
        await db.products.create_index("slug", unique=True)
        await db.categories.create_index("slug", unique=True)
        await db.blog_posts.create_index("slug", unique=True)
        await db.blog_categories.create_index("slug", unique=True)
        await db.pages.create_index("slug", unique=True)
    except Exception as e:
        logger.warning(f"Index creation issue: {e}")

    # Admin bootstrap (idempotent)
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower().strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if admin_email and admin_password:
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            await db.users.insert_one(
                {
                    "email": admin_email,
                    "password_hash": hash_password(admin_password),
                    "name": "Admin",
                    "role": "admin",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            logger.info(f"Bootstrapped admin user: {admin_email}")
        else:
            # If password changed via env, refresh hash to match .env
            if not verify_password(admin_password, existing.get("password_hash", "")):
                await db.users.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}},
                )
                logger.info(f"Refreshed admin password from env for: {admin_email}")

    # Seed content defaults
    await seed_defaults(db)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
