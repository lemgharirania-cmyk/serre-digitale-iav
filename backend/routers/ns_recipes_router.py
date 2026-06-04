# ============================================================================
#  ns_recipes_router.py  —  Router FastAPI pour les recettes (table ns_recipes)
# ----------------------------------------------------------------------------
#  Intégration dans ton app principale :
#
#      from ns_recipes_router import router as ns_recipes_router
#      app.include_router(ns_recipes_router)
#
#  Variables d'environnement attendues (déjà présentes sur Render) :
#      SUPABASE_URL              = https://xxxx.supabase.co
#      SUPABASE_SERVICE_ROLE_KEY = eyJ...   (clé service côté serveur, jamais
#                                            exposée au frontend)
#
#  Dépendance :  pip install supabase
#  (Si tu accèdes déjà à Postgres via asyncpg/SQLAlchemy, voir la note en bas.)
# ============================================================================
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from supabase import create_client, Client

# --- Client Supabase (singleton) -------------------------------------------
_SUPABASE_URL = os.environ["SUPABASE_URL"]
_SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_KEY"]
_supabase: Client = create_client(_SUPABASE_URL, _SUPABASE_KEY)

TABLE = "ns_recipes"
router = APIRouter(prefix="/api/ns/recipes", tags=["ns-recipes"])


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


# --- Endpoints --------------------------------------------------------------
@router.get("", response_model=list[RecipeOut])
def list_recipes(
    greenhouse: Optional[str] = Query(None, description="Filtrer par serre S01..S05"),
    search: Optional[str] = Query(None, description="Filtre texte sur le nom"),
):
    """Liste les recettes personnalisées (les recettes officielles du tableur
    restent embarquées côté frontend)."""
    q = _supabase.table(TABLE).select("*").order("created_at", desc=True)
    if greenhouse:
        q = q.eq("greenhouse", greenhouse)
    if search:
        q = q.ilike("name", f"%{search}%")
    res = q.execute()
    return res.data or []


@router.post("", response_model=RecipeOut, status_code=201)
def create_recipe(body: RecipeIn):
    payload = body.model_dump()
    payload["target"] = body.target.model_dump()  # jsonb
    res = _supabase.table(TABLE).insert(payload).execute()
    if not res.data:
        raise HTTPException(500, "Échec de l'enregistrement de la recette.")
    return res.data[0]


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: str, body: RecipeIn):
    payload = body.model_dump()
    payload["target"] = body.target.model_dump()
    res = _supabase.table(TABLE).update(payload).eq("id", recipe_id).execute()
    if not res.data:
        raise HTTPException(404, "Recette introuvable.")
    return res.data[0]


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: str):
    res = _supabase.table(TABLE).delete().eq("id", recipe_id).execute()
    if not res.data:
        raise HTTPException(404, "Recette introuvable.")
    return None


# ============================================================================
#  Variante SQLAlchemy / asyncpg (si tu n'utilises pas supabase-py)
#  --------------------------------------------------------------------------
#  Remplace les corps de fonction par des requêtes sur ta session, ex. :
#
#      from sqlalchemy import text
#      rows = (await session.execute(
#          text("select * from ns_recipes order by created_at desc")
#      )).mappings().all()
#      return [dict(r) for r in rows]
#
#  Le contrat JSON (RecipeIn / RecipeOut) reste identique, donc le client
#  TypeScript (nsRecipesApi.ts) n'a pas à changer.
# ============================================================================
