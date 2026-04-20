# routers/iot_router.py — Endpoints IoT publics
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from iot_service import fetch_env, fetch_irr, fetch_serre_data
import asyncio

router = APIRouter(prefix="/api/iot", tags=["IoT"])

@router.get("/live")
async def get_all_live(db=Depends(get_db)):
    """Données live de toutes les serres — PUBLIC."""
    serres = await db.fetch("SELECT * FROM serres WHERE actif=TRUE ORDER BY code")
    tasks = [fetch_serre_data(dict(s)) for s in serres]
    results = await asyncio.gather(*tasks)
    return {"serres": results, "count": len(results)}

@router.get("/live/{serre_code}")
async def get_serre_live(serre_code: str, db=Depends(get_db)):
    """Données live d'une serre spécifique — PUBLIC."""
    serre = await db.fetchrow("SELECT * FROM serres WHERE code=$1 AND actif=TRUE", serre_code.upper())
    if not serre:
        raise HTTPException(status_code=404, detail="Serre introuvable")
    return await fetch_serre_data(dict(serre))

@router.get("/historique/{serre_id}")
async def get_historique(
    serre_id: int,
    capteur: str = "temperature",
    heures: int = 24,
    db=Depends(get_db)
):
    """Historique d'un capteur pour une serre — PUBLIC (graphiques)."""
    rows = await db.fetch("""
        SELECT capture_at,
               temperature, humidite, vpd, co2, luminosite,
               ph, ec, temp_eau, niveau_eau
        FROM mesures_iot
        WHERE serre_id=$1
          AND capture_at > NOW() - ($2 || ' hours')::INTERVAL
        ORDER BY capture_at ASC
    """, serre_id, str(heures))

    data = []
    for row in rows:
        val = dict(row).get(capteur)
        if val is not None:
            data.append({
                "time": row["capture_at"].isoformat(),
                "value": val
            })
    return {"serre_id": serre_id, "capteur": capteur, "data": data}

@router.get("/historique/{serre_id}/tous")
async def get_historique_tous(serre_id: int, heures: int = 24, db=Depends(get_db)):
    """Tous les capteurs d'une serre sur une période."""
    rows = await db.fetch("""
        SELECT capture_at, type_api,
               temperature, humidite, vpd, co2,
               ph, ec, temp_eau, niveau_eau
        FROM mesures_iot
        WHERE serre_id=$1
          AND capture_at > NOW() - ($2 || ' hours')::INTERVAL
        ORDER BY capture_at ASC
    """, serre_id, str(heures))
    return {"data": [dict(r) for r in rows]}

@router.get("/stats")
async def get_stats(db=Depends(get_db)):
    """Statistiques globales — PUBLIC (pour le Hero)."""
    nb_serres   = await db.fetchval("SELECT COUNT(*) FROM serres WHERE actif=TRUE")
    nb_mesures  = await db.fetchval("SELECT COUNT(*) FROM mesures_iot WHERE capture_at > NOW() - INTERVAL '24 hours'")
    nb_alertes  = await db.fetchval("SELECT COUNT(*) FROM alertes WHERE lu=FALSE")
    derniere    = await db.fetchval("SELECT MAX(capture_at) FROM mesures_iot")
    return {
        "nb_serres":         nb_serres,
        "nb_capteurs_actifs": nb_serres * 2,  # ENV + IRR par serre
        "mesures_24h":       nb_mesures,
        "alertes_actives":   nb_alertes,
        "derniere_mesure":   derniere.isoformat() if derniere else None
    }
