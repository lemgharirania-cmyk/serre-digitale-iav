import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL manquante — vérifier les variables Render")

safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
print(f"[DB] Connexion vers: ...@{safe_url}")

# FIX: port 5432 sur pooler Supabase = mode Session → remplacer par 6543 (Transaction)
# Le mode Transaction supporte correctement les pools asyncpg multi-connexions
if "pooler.supabase.com:5432" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace(":5432/", ":6543/")
    print("[DB] Port corrigé: 5432 → 6543 (mode Transaction pooler)")

_pool = None

async def get_pool():
    global _pool
    if _pool is None:
        try:
            _pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=1,       # FIX: 1 au lieu de 2 — le pooler Supabase free tier
                max_size=5,       # limite à 5 connexions simultanées max
                ssl="require",    # toujours requis avec Supabase
                max_inactive_connection_lifetime=300,  # recycle les connexions idle
                command_timeout=30,
            )
            print("[DB] ✅ Pool de connexions créé")
        except Exception as e:
            print(f"[DB] ❌ Echec création pool: {e}")
            raise
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        print("[DB] Pool fermé")

async def get_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
