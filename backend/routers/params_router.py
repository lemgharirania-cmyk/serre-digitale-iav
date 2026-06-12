# routers/params_router.py
# ─────────────────────────────────────────────────────────────────
#  Intervalles de pilotage des équipements (visualisation uniquement)
#  GET  /api/params/{serre_id}            — lecture (JWT requis)
#  PUT  /api/params/{serre_id}/{action}   — modification (restreint à la serre de l'admin)
#  PUT  /api/params/{serre_id}/batch      — mise à jour groupée
# ─────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/params", tags=["Params internes"])

# ── Actions valides ───────────────────────────────────────────
ACTIONS_VALIDES = {
    "ventilation_jour", "ventilation_nuit",
    "chauffage_jour",   "chauffage_nuit",
    "humidification_jour", "humidification_nuit",
    "deshumidification_jour", "deshumidification_nuit",
    "co2_injection", "co2_purge",
}

# ── Modèles ───────────────────────────────────────────────────
class ParamUpdate(BaseModel):
    seuil:    float = Field(..., ge=-50, le=5000, description="Valeur seuil de déclenchement")
    deadband: float = Field(..., ge=0,   le=500,  description="Zone morte (hysteresis)")

class BatchParamUpdate(BaseModel):
    # Dict { action: { seuil, deadband } }
    params: dict[str, ParamUpdate]


# ── Helper : vérification accès serre ────────────────────────
def check_serre_access(user: dict, serre_id: int):
    """
    Lève 403 si l'utilisateur n'a pas le droit de modifier cette serre.
    unit='ALL' → super-admin, accès total.
    unit='S01'…'S05' → accès à la serre correspondante uniquement.
    """
    unit = user.get("unit", "ALL")
    if unit in ("ALL", "SUPERADMIN"):
        return  # super-admin : autorisé partout

    # Extraire l'identifiant numérique depuis 'S01'…'S05'
    try:
        allowed_id = int(unit.replace("S0", "").replace("S", ""))
    except ValueError:
        raise HTTPException(status_code=403, detail="Unité utilisateur non reconnue.")

    if serre_id != allowed_id:
        raise HTTPException(
            status_code=403,
            detail=f"Accès refusé. Votre compte est limité à la serre {unit}."
        )


# ── GET /api/params/{serre_id} ────────────────────────────────
@router.get("/{serre_id}")
async def get_params(
    serre_id: int,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Retourne les intervalles de pilotage d'une serre.
    Accessible à tout utilisateur authentifié (lecture seule pour les autres serres).
    """
    serre = await db.fetchrow("SELECT id, code, nom_fr FROM serres WHERE id=$1", serre_id)
    if not serre:
        raise HTTPException(status_code=404, detail="Serre introuvable.")

    rows = await db.fetch(
        "SELECT action, seuil, deadband, updated_at, updated_by "
        "FROM params_internes WHERE serre_id=$1 ORDER BY action",
        serre_id
    )

    # Si aucune ligne en base (table pas encore migrée ou serre neuve),
    # on renvoie les valeurs hardcodées par défaut
    if not rows:
        defaults = _defaults()
        return {
            "serre_id": serre_id,
            "code":     serre["code"],
            "source":   "defaults",
            "params":   defaults
        }

    return {
        "serre_id": serre_id,
        "code":     serre["code"],
        "source":   "database",
        "params":   {r["action"]: {"seuil": float(r["seuil"]), "deadband": float(r["deadband"]), "updated_at": r["updated_at"]} for r in rows}
    }


# ── PUT /api/params/{serre_id}/{action} ───────────────────────
@router.put("/{serre_id}/{action}")
async def update_param(
    serre_id: int,
    action:   str,
    data:     ParamUpdate,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Met à jour un seul paramètre de pilotage.
    Restreint à l'admin de la serre concernée (ou super-admin).
    """
    if action not in ACTIONS_VALIDES:
        raise HTTPException(status_code=400, detail=f"Action inconnue : {action}. Valeurs acceptées : {sorted(ACTIONS_VALIDES)}")

    check_serre_access(user, serre_id)

    await db.execute("""
        INSERT INTO params_internes (serre_id, action, seuil, deadband, updated_at, updated_by)
        VALUES ($1, $2, $3, $4, NOW(), $5)
        ON CONFLICT (serre_id, action) DO UPDATE SET
            seuil      = EXCLUDED.seuil,
            deadband   = EXCLUDED.deadband,
            updated_at = NOW(),
            updated_by = EXCLUDED.updated_by
    """, serre_id, action, data.seuil, data.deadband, user["id"])

    return {"message": f"Paramètre '{action}' mis à jour pour la serre {serre_id}."}


# ── PUT /api/params/{serre_id}/batch ─────────────────────────
@router.put("/{serre_id}/batch")
async def update_params_batch(
    serre_id: int,
    data:     BatchParamUpdate,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Met à jour plusieurs paramètres en une seule requête.
    Restreint à l'admin de la serre concernée (ou super-admin).
    """
    check_serre_access(user, serre_id)

    invalides = [a for a in data.params if a not in ACTIONS_VALIDES]
    if invalides:
        raise HTTPException(status_code=400, detail=f"Actions inconnues : {invalides}")

    for action, p in data.params.items():
        await db.execute("""
            INSERT INTO params_internes (serre_id, action, seuil, deadband, updated_at, updated_by)
            VALUES ($1, $2, $3, $4, NOW(), $5)
            ON CONFLICT (serre_id, action) DO UPDATE SET
                seuil      = EXCLUDED.seuil,
                deadband   = EXCLUDED.deadband,
                updated_at = NOW(),
                updated_by = EXCLUDED.updated_by
        """, serre_id, action, p.seuil, p.deadband, user["id"])

    return {"message": f"{len(data.params)} paramètre(s) mis à jour pour la serre {serre_id}."}


# ── Valeurs par défaut (fallback si table vide) ───────────────
def _defaults():
    return {
        "ventilation_jour":       {"seuil": 25,   "deadband": 2},
        "ventilation_nuit":       {"seuil": 20,   "deadband": 2},
        "chauffage_jour":         {"seuil": 20,   "deadband": 2},
        "chauffage_nuit":         {"seuil": 15,   "deadband": 2},
        "humidification_jour":    {"seuil": 60,   "deadband": 5},
        "humidification_nuit":    {"seuil": 60,   "deadband": 5},
        "deshumidification_jour": {"seuil": 80,   "deadband": 5},
        "deshumidification_nuit": {"seuil": 80,   "deadband": 5},
        "co2_injection":          {"seuil": 1000, "deadband": 50},
        "co2_purge":              {"seuil": 500,  "deadband": 50},
    }
