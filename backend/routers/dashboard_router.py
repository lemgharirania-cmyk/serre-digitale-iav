# routers/dashboard_router.py — Endpoints privés gérants
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth import get_current_user
import io
import csv

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# ─── Thresholds ─────────────────────────────────────────────

class ThresholdUpdate(BaseModel):
    valeur_min:   Optional[float] = None
    valeur_max:   Optional[float] = None
    email_alerte: Optional[str]   = None
    actif:        Optional[bool]  = True

@router.get("/thresholds")
async def get_all_thresholds(db=Depends(get_db), user=Depends(get_current_user)):
    rows = await db.fetch("""
        SELECT t.*, s.nom_fr, s.code
        FROM thresholds t
        JOIN serres s ON s.id = t.serre_id
        ORDER BY s.code, t.capteur
    """)
    return [dict(r) for r in rows]

@router.get("/thresholds/{serre_id}")
async def get_serre_thresholds(serre_id: int, db=Depends(get_db), user=Depends(get_current_user)):
    rows = await db.fetch(
        "SELECT * FROM thresholds WHERE serre_id=$1 ORDER BY capteur", serre_id
    )
    return [dict(r) for r in rows]

@router.put("/thresholds/{serre_id}/{capteur}")
async def update_threshold(
    serre_id: int, capteur: str,
    data: ThresholdUpdate,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    await db.execute("""
        INSERT INTO thresholds (serre_id, capteur, valeur_min, valeur_max, email_alerte, actif, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (serre_id, capteur)
        DO UPDATE SET
            valeur_min   = EXCLUDED.valeur_min,
            valeur_max   = EXCLUDED.valeur_max,
            email_alerte = EXCLUDED.email_alerte,
            actif        = EXCLUDED.actif,
            updated_at   = NOW()
    """, serre_id, capteur, data.valeur_min, data.valeur_max, data.email_alerte, data.actif)
    return {"message": f"Seuil {capteur} mis à jour pour serre {serre_id}"}

# ─── Alertes ────────────────────────────────────────────────

@router.get("/alertes")
async def get_alertes(non_lues: bool = False, db=Depends(get_db), user=Depends(get_current_user)):
    query = """
        SELECT a.*, s.nom_fr, s.code
        FROM alertes a JOIN serres s ON s.id = a.serre_id
    """
    if non_lues:
        query += " WHERE a.lu = FALSE"
    query += " ORDER BY a.created_at DESC LIMIT 100"
    rows = await db.fetch(query)
    return [dict(r) for r in rows]

@router.put("/alertes/{alerte_id}/lue")
async def marquer_lue(alerte_id: int, db=Depends(get_db), user=Depends(get_current_user)):
    await db.execute("UPDATE alertes SET lu=TRUE WHERE id=$1", alerte_id)
    return {"message": "Alerte marquée comme lue"}

@router.put("/alertes/tout-lire")
async def tout_lire(db=Depends(get_db), user=Depends(get_current_user)):
    await db.execute("UPDATE alertes SET lu=TRUE WHERE lu=FALSE")
    return {"message": "Toutes les alertes marquées comme lues"}

# ─── Comparaison serres ──────────────────────────────────────

@router.get("/comparaison")
async def comparer_serres(
    capteur: str = "temperature",
    heures: int = 24,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    serres = await db.fetch("SELECT id, code, nom_fr FROM serres WHERE actif=TRUE")
    result = []
    for serre in serres:
        rows = await db.fetch(f"""
            SELECT capture_at, {capteur} as valeur
            FROM mesures_iot
            WHERE serre_id=$1
              AND {capteur} IS NOT NULL
              AND capture_at > NOW() - ($2 || ' hours')::INTERVAL
            ORDER BY capture_at ASC
        """, serre["id"], str(heures))
        result.append({
            "serre_id": serre["id"],
            "code":     serre["code"],
            "nom_fr":   serre["nom_fr"],
            "data": [{"time": r["capture_at"].isoformat(), "value": r["valeur"]} for r in rows]
        })
    return result

# ─── Export CSV (no pandas needed) ──────────────────────────

COLUMNS = [
    ("capture_at",  "Date/Heure"),
    ("type_api",    "Type"),
    ("temperature", "Température (°C)"),
    ("humidite",    "Humidité (%)"),
    ("vpd",         "VPD (kPa)"),
    ("co2",         "CO2 (PPM)"),
    ("luminosite",  "Luminosité (lux)"),
    ("ph",          "pH"),
    ("ec",          "EC (mS/cm)"),
    ("temp_eau",    "Temp. Eau (°C)"),
    ("niveau_eau",  "Niveau Eau (m)"),
]

@router.get("/export/{serre_id}")
async def export_data(
    serre_id: int,
    format: str = "csv",
    heures: int = 168,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    serre = await db.fetchrow("SELECT * FROM serres WHERE id=$1", serre_id)
    if not serre:
        raise HTTPException(status_code=404, detail="Serre introuvable")

    rows = await db.fetch("""
        SELECT capture_at, type_api,
               temperature, humidite, vpd, co2, luminosite,
               ph, ec, temp_eau, niveau_eau
        FROM mesures_iot
        WHERE serre_id=$1
          AND capture_at > NOW() - ($2 || ' hours')::INTERVAL
        ORDER BY capture_at ASC
    """, serre_id, str(heures))

    if not rows:
        raise HTTPException(status_code=404, detail="Aucune donnée disponible")

    nom_fichier = f"serre_{serre['code']}_{heures}h"

    # CSV — pure Python, no pandas
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([label for _, label in COLUMNS])
    for row in rows:
        r = dict(row)
        writer.writerow([
            r["capture_at"].strftime("%Y-%m-%d %H:%M:%S") if r["capture_at"] else "",
            r["type_api"],
            r["temperature"], r["humidite"], r["vpd"], r["co2"], r["luminosite"],
            r["ph"], r["ec"], r["temp_eau"], r["niveau_eau"],
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={nom_fichier}.csv"}
    )

# ─── Utilisateurs (admin only) ───────────────────────────────

class NouvelUtilisateur(BaseModel):
    nom:          str
    email:        str
    mot_de_passe: str
    role:         str = "gerant"
    serre_id:     Optional[int] = None

@router.get("/utilisateurs")
async def list_users(db=Depends(get_db), user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    rows = await db.fetch("SELECT id, nom, email, role, actif, created_at, last_login FROM utilisateurs")
    return [dict(r) for r in rows]

@router.post("/utilisateurs")
async def create_user(data: NouvelUtilisateur, db=Depends(get_db), user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    from auth import hash_password
    hashed = hash_password(data.mot_de_passe)
    await db.execute("""
        INSERT INTO utilisateurs (nom, email, mot_de_passe, role)
        VALUES ($1, $2, $3, $4)
    """, data.nom, data.email, hashed, data.role)
    return {"message": f"Utilisateur {data.email} créé"}
