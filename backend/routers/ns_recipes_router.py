# ============================================================================
#  ns_recipes_router.py  —  Router FastAPI (recettes solution nutritive)
#  Version asyncpg : utilise TON pool existant (database.get_pool).
#  -> aucune variable d'env supplémentaire, aucune librairie en plus.
# ----------------------------------------------------------------------------
#  Intégration dans main.py :
#      from ns_recipes_router import router as ns_recipes_router
#      ...
#      app = FastAPI(...)
#      app.include_router(ns_recipes_router)   # APRÈS app = FastAPI(...)
#
#  Pré-requis : avoir exécuté ns_recipes.sql dans Supabase (table ns_recipes).
# ============================================================================
import json
import inspect
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from database import get_pool  # <-- ton pool asyncpg existant

router = APIRouter(prefix="/api/ns/recipes", tags=["ns-recipes"])


# --- Récupération du pool (gère get_pool sync OU async) --------------------
async def _pool():
    p = get_pool()
    if inspect.isawaitable(p):
        p = await p
    return p


# --- Schémas ----------------------------------------------------------------
class IonTarget(BaseModel):
    # Macro (mmol/L)
    no3: float = 0; nh4: float = 0; p: float = 0; k: float = 0; ca: float = 0
    mg: float = 0; na: float = 0; so4: float = 0; cl: float = 0
    # Micro (µmol/L)
    fe: float = 0; b: float = 0; cu: float = 0; zn: float = 0; mn: float = 0; mo: float = 0


class RecipeIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    target: IonTarget
    group_name: str = "Personnalisée"
    validated: bool = False
    ec_target: Optional[float] = None
    greenhouse: Optional[str] = None      # S01..S05
    created_by: Optional[str] = None


class RecipeOut(RecipeIn):
    id: str
    created_at: datetime
    updated_at: datetime


# --- Helpers ----------------------------------------------------------------
COLS = "id, name, group_name, target, validated, ec_target, greenhouse, created_by, created_at, updated_at"

def _row_to_dict(row) -> dict:
    d = dict(row)
    d["id"] = str(d["id"])
    # asyncpg renvoie jsonb en str par défaut -> on parse
    tgt = d.get("target")
    if isinstance(tgt, str):
        tgt = json.loads(tgt)
    d["target"] = tgt or {}
    if d.get("ec_target") is not None:
        d["ec_target"] = float(d["ec_target"])
    return d


# --- Endpoints --------------------------------------------------------------
@router.get("", response_model=list[RecipeOut])
async def list_recipes(
    greenhouse: Optional[str] = Query(None, description="Filtrer par serre S01..S05"),
    search: Optional[str] = Query(None, description="Filtre texte sur le nom"),
):
    pool = await _pool()
    sql = f"""
        SELECT {COLS} FROM ns_recipes
        WHERE ($1::text IS NULL OR greenhouse = $1)
          AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%')
        ORDER BY created_at DESC
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, greenhouse, search)
    return [_row_to_dict(r) for r in rows]


@router.post("", response_model=RecipeOut, status_code=201)
async def create_recipe(body: RecipeIn):
    pool = await _pool()
    sql = f"""
        INSERT INTO ns_recipes (name, group_name, target, validated, ec_target, greenhouse, created_by)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
        RETURNING {COLS}
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            sql, body.name, body.group_name, json.dumps(body.target.model_dump()),
            body.validated, body.ec_target, body.greenhouse, body.created_by,
        )
    if not row:
        raise HTTPException(500, "Échec de l'enregistrement de la recette.")
    return _row_to_dict(row)


@router.put("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(recipe_id: str, body: RecipeIn):
    pool = await _pool()
    sql = f"""
        UPDATE ns_recipes
           SET name = $2, group_name = $3, target = $4::jsonb,
               validated = $5, ec_target = $6, greenhouse = $7, created_by = $8
         WHERE id = $1::uuid
        RETURNING {COLS}
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            sql, recipe_id, body.name, body.group_name, json.dumps(body.target.model_dump()),
            body.validated, body.ec_target, body.greenhouse, body.created_by,
        )
    if not row:
        raise HTTPException(404, "Recette introuvable.")
    return _row_to_dict(row)


@router.delete("/{recipe_id}", status_code=204)
async def delete_recipe(recipe_id: str):
    pool = await _pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("DELETE FROM ns_recipes WHERE id = $1::uuid RETURNING id", recipe_id)
    if not row:
        raise HTTPException(404, "Recette introuvable.")
    return None
