# routers/iot_router.py — Endpoints IoT publics
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from iot_service import fetch_serre_data
import asyncio

router = APIRouter(prefix="/api/iot", tags=["IoT"])


async def get_last_values(db, serre_id: int) -> dict:
    """Récupère les dernières valeurs ENV et IRR depuis la base de données."""

    # Dernière mesure ENV
    env_row = await db.fetchrow("""
        SELECT temperature, humidite, vpd, co2, luminosite, capture_at
        FROM mesures_iot
        WHERE serre_id = $1 AND type_api = 'ENV'
          AND temperature IS NOT NULL
        ORDER BY capture_at DESC
        LIMIT 1
    """, serre_id)

    # Dernière mesure IRR
    irr_row = await db.fetchrow("""
        SELECT ph, ec, temp_eau, niveau_eau, capture_at
        FROM mesures_iot
        WHERE serre_id = $1 AND type_api = 'IRR'
          AND (ph IS NOT NULL OR ec IS NOT NULL OR temp_eau IS NOT NULL OR niveau_eau IS NOT NULL)
        ORDER BY capture_at DESC
        LIMIT 1
    """, serre_id)

    env = None
    if env_row:
        env = {
            "temperature": env_row["temperature"],
            "humidite":    env_row["humidite"],
            "vpd":         env_row["vpd"],
            "co2":         env_row["co2"],
            "luminosite":  env_row["luminosite"],
        }

    irr = None
    if irr_row:
        irr = {
            "ph":          irr_row["ph"],
            "ec":          irr_row["ec"],
            "temp_eau":    irr_row["temp_eau"],
            "niveau_eau":  irr_row["niveau_eau"],
        }

    return {"env": env, "irr": irr}


@router.get("/live")
async def get_all_live(db=Depends(get_db)):
    """Données live de toutes les serres — lues depuis la DB (collecte scheduler toutes les 2 min)."""
    serres = await db.fetch("SELECT * FROM serres WHERE actif=TRUE ORDER BY code")
    results = []
    for serre in serres:
        s = dict(serre)
        vals = await get_last_values(db, s["id"])
        env = vals["env"]
        irr = vals["irr"]

        if env and any(v is not None for v in env.values()):
            statut = "ok"
        elif env:
            statut = "partiel"
        else:
            statut = "erreur"

        results.append({
            "serre_id":      s["id"],
            "code":          s["code"],
            "nom_fr":        s["nom_fr"],
            "nom_en":        s["nom_en"],
            "couleur":       s["couleur"],
            "matterport_id": s.get("matterport_id"),
            "env":           env,
            "irr":           irr,
            "statut":        statut,
        })

    return {"serres": results, "count": len(results)}


@router.get("/live/{serre_code}")
async def get_serre_live(serre_code: str, db=Depends(get_db)):
    """Données live d'une serre spécifique — PUBLIC."""
    serre = await db.fetchrow(
        "SELECT * FROM serres WHERE code=$1 AND actif=TRUE", serre_code.upper()
    )
    if not serre:
        raise HTTPException(status_code=404, detail="Serre introuvable")
    s = dict(serre)
    vals = await get_last_values(db, s["id"])
    env = vals["env"]
    irr = vals["irr"]

    statut = "ok" if env and any(v is not None for v in env.values()) else "erreur"
    return {
        "serre_id":      s["id"],
        "code":          s["code"],
        "nom_fr":        s["nom_fr"],
        "nom_en":        s["nom_en"],
        "couleur":       s["couleur"],
        "matterport_id": s.get("matterport_id"),
        "env":           env,
        "irr":           irr,
        "statut":        statut,
    }


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
                "time":  row["capture_at"].isoformat(),
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
    nb_serres  = await db.fetchval("SELECT COUNT(*) FROM serres WHERE actif=TRUE")
    nb_mesures = await db.fetchval(
        "SELECT COUNT(*) FROM mesures_iot WHERE capture_at > NOW() - INTERVAL '24 hours'"
    )
    nb_alertes = await db.fetchval("SELECT COUNT(*) FROM alertes WHERE lu=FALSE")
    derniere   = await db.fetchval("SELECT MAX(capture_at) FROM mesures_iot")
    return {
        "nb_serres":          nb_serres,
        "nb_capteurs_actifs": nb_serres * 2,
        "mesures_24h":        nb_mesures,
        "alertes_actives":    nb_alertes,
        "derniere_mesure":    derniere.isoformat() if derniere else None,
    }
