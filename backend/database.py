# database.py — Connexion PostgreSQL avec asyncpg
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "postgresql://geoportail_user:geoportail_pass_2024@localhost:5433/geoportail"
_pool = None

async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

async def get_db():
    """Dependency FastAPI — retourne une connexion depuis le pool."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn

print("👉 DATABASE_URL USED:", DATABASE_URL)