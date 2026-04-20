# routers/serres_router.py — Infos serres + Matterport — PUBLIC
from fastapi import APIRouter, Depends, HTTPException
from database import get_db

router = APIRouter(prefix="/api/serres", tags=["Serres"])

@router.get("/")
async def get_all_serres(db=Depends(get_db)):
    """Liste toutes les serres avec leurs infos — PUBLIC."""
    rows = await db.fetch("SELECT * FROM serres WHERE actif=TRUE ORDER BY code")
    return [dict(r) for r in rows]

@router.get("/{serre_id}")
async def get_serre(serre_id: int, db=Depends(get_db)):
    serre = await db.fetchrow("SELECT * FROM serres WHERE id=$1", serre_id)
    if not serre:
        raise HTTPException(status_code=404, detail="Serre introuvable")
    return dict(serre)

@router.get("/matterport/scenes")
async def get_scenes(db=Depends(get_db)):
    """Tous les scans Matterport disponibles — PUBLIC."""
    rows = await db.fetch(
        "SELECT * FROM matterport_scenes WHERE actif=TRUE ORDER BY ordre"
    )
    return [dict(r) for r in rows]

@router.get("/matterport/scenes/{type}")
async def get_scenes_by_type(type: str, db=Depends(get_db)):
    rows = await db.fetch(
        "SELECT * FROM matterport_scenes WHERE type=$1 AND actif=TRUE ORDER BY ordre", type
    )
    return [dict(r) for r in rows]

@router.get("/{serre_id}/medias")
async def get_medias(serre_id: int, db=Depends(get_db)):
    """Médias (photos/vidéos/audios) d'une serre — PUBLIC."""
    rows = await db.fetch(
        "SELECT * FROM medias WHERE serre_id=$1 ORDER BY ordre", serre_id
    )
    return [dict(r) for r in rows]
