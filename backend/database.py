import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://geoportail_user:geoportail_pass_2024@localhost:5433/geoportail")

safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
print(f"👉 DATABASE_URL USED: ...@{safe_url}")

_pool = None

async def get_pool():
    global _pool
    if _pool is None:
        is_railway = "railway.internal" in DATABASE_URL or "rlwy.net" in DATABASE_URL
        if is_railway:
            _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10, ssl="require")
        else:
            _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

async def get_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
        