# ============================================================
#  Serre Digitale Intelligente — IAV Hassan II
#  Backend FastAPI  |  main.py
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import asyncio
import os

load_dotenv()

from database import get_pool, close_pool
from scheduler import start_scheduler
from routers import auth_router, iot_router, dashboard_router, serres_router

# ─── App ────────────────────────────────────────────────────
app = FastAPI(
    title="Serre Digitale Intelligente — API",
    description="Géoportail AgroBioTech · IAV Hassan II · PFE 2024-2025",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# ─── CORS ───────────────────────────────────────────────────
origins = os.getenv("CORS_ORIGINS", "http://localhost:5500").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(iot_router.router)
app.include_router(dashboard_router.router)
app.include_router(serres_router.router)

# ─── Startup / Shutdown ─────────────────────────────────────
@app.on_event("startup")
async def startup():
    await get_pool()
    print("✅ Connexion DB établie")
    # Lance le scheduler IoT en tâche de fond
    asyncio.create_task(start_scheduler())
    print("✅ Scheduler IoT démarré (collecte toutes les 2 min)")

@app.on_event("shutdown")
async def shutdown():
    await close_pool()

# ─── Health check ───────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "app": "Serre Digitale Intelligente",
        "institution": "IAV Hassan II",
        "status": "online",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
