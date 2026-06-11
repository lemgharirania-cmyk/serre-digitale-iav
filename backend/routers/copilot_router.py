# routers/copilot_router.py — SDI Copilot : assistant conversationnel IA
# Utilise Groq (llama-3.3-70b) — gratuit, rapide, fiable
# Routes : POST /api/copilot/chat (JWT) + POST /api/copilot/public (sans auth)

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import json
import os
from datetime import datetime, timezone

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/copilot", tags=["Copilot"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL   = "llama-3.3-70b-versatile"
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"

# ─── Schémas ────────────────────────────────────────────────

class CopilotMessage(BaseModel):
    role: str
    content: str

class CopilotRequest(BaseModel):
    messages: list[CopilotMessage]
    lang: Optional[str] = "fr"

class PublicCopilotRequest(BaseModel):
    messages: list[CopilotMessage]
    lang: Optional[str] = "fr"
    live_snapshot: Optional[list] = []

# ─── Collecte contexte DB ──────────────────────────────────

async def build_context(db) -> dict:
    iot_rows = await db.fetch("""
        SELECT DISTINCT ON (serre_id, type_api)
            serre_id, type_api, temperature, humidite, vpd, co2, luminosite,
            ph, ec, temp_eau, niveau_eau, capture_at
        FROM mesures_iot
        WHERE capture_at > NOW() - INTERVAL '30 minutes'
        ORDER BY serre_id, type_api, capture_at DESC
    """)
    serres_rows = await db.fetch("SELECT id, code, nom_fr, nom_en, actif FROM serres ORDER BY code")
    serres_map  = {s["id"]: dict(s) for s in serres_rows}

    alertes_rows = await db.fetch("""
        SELECT a.id, a.serre_id, a.capteur, a.valeur, a.seuil_min, a.seuil_max,
               a.message_fr as message, a.created_at, a.lu, s.code as serre_code, s.nom_fr
        FROM alertes a JOIN serres s ON s.id = a.serre_id
        WHERE a.created_at > NOW() - INTERVAL '48 hours'
        ORDER BY a.created_at DESC LIMIT 20
    """)
    seuils_rows = await db.fetch("""
        SELECT t.serre_id, t.capteur, t.valeur_min, t.valeur_max, t.actif, s.code
        FROM thresholds t JOIN serres s ON s.id = t.serre_id
        WHERE t.actif = TRUE ORDER BY s.code, t.capteur
    """)
    stats_rows = await db.fetch("""
        SELECT serre_id, type_api,
               AVG(temperature) as avg_temp, MIN(temperature) as min_temp, MAX(temperature) as max_temp,
               AVG(humidite) as avg_hum, AVG(vpd) as avg_vpd, AVG(co2) as avg_co2,
               AVG(ph) as avg_ph, AVG(ec) as avg_ec, COUNT(*) as nb_mesures
        FROM mesures_iot
        WHERE capture_at > NOW() - INTERVAL '7 days' AND temperature IS NOT NULL
        GROUP BY serre_id, type_api ORDER BY serre_id
    """)

    live_by_serre = {}
    for row in iot_rows:
        sid = row["serre_id"]
        if sid not in live_by_serre:
            live_by_serre[sid] = {"env": None, "irr": None}
        if row["type_api"] == "ENV":
            live_by_serre[sid]["env"] = {
                "temperature": row["temperature"], "humidite": row["humidite"],
                "vpd": row["vpd"], "co2": row["co2"], "luminosite": row["luminosite"],
                "capture_at": str(row["capture_at"]) if row["capture_at"] else None,
            }
        elif row["type_api"] == "IRR":
            live_by_serre[sid]["irr"] = {
                "ph": row["ph"], "ec": row["ec"],
                "temp_eau": row["temp_eau"], "niveau_eau": row["niveau_eau"],
                "capture_at": str(row["capture_at"]) if row["capture_at"] else None,
            }

    return {
        "serres": [{"code": s["code"], "nom": s["nom_fr"], "actif": s["actif"],
                    **live_by_serre.get(s["id"], {"env": None, "irr": None})} for s in serres_rows],
        "alertes_48h": [{"serre": a["serre_code"], "capteur": a["capteur"],
                         "valeur": float(a["valeur"]) if a["valeur"] else None,
                         "message": a["message"], "heure": str(a["created_at"]), "lu": a["lu"]}
                        for a in alertes_rows],
        "seuils": [{"serre": s["code"], "capteur": s["capteur"],
                    "min": float(s["valeur_min"]) if s["valeur_min"] else None,
                    "max": float(s["valeur_max"]) if s["valeur_max"] else None}
                   for s in seuils_rows],
        "stats_7j": [{"serre": serres_map.get(s["serre_id"], {}).get("code", "?"),
                      "avg_temp": round(float(s["avg_temp"]), 1) if s["avg_temp"] else None,
                      "avg_hum": round(float(s["avg_hum"]), 1) if s["avg_hum"] else None,
                      "avg_vpd": round(float(s["avg_vpd"]), 2) if s["avg_vpd"] else None}
                     for s in stats_rows],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# ─── System prompts ────────────────────────────────────────

def build_system_prompt(context: dict, lang: str) -> str:
    ctx_json = json.dumps(context, ensure_ascii=False, indent=2, default=str)
    if lang == "en":
        intro = ("You are SDI Copilot, the intelligent assistant of the AgroBioTech Geoportal "
                 "(IAV Hassan II, Rabat). Help greenhouse managers analyze real-time sensor data, "
                 "understand alerts, and make decisions. Answer concisely in English. "
                 "Reference values: temp 18-28°C, humidity 60-80%, VPD 0.8-1.5 kPa, "
                 "CO₂ 400-1200 ppm, pH 5.5-7.0, EC 1.5-3.5 mS/cm. "
                 "Codes: S01=Genetics, S02=Horticulture, S03=Agronomy, S04=Hydroponics, S05=Plant Protection.")
    elif lang == "ar":
        intro = ("أنت SDI Copilot، مساعد بوابة AgroBioTech (IAV Hassan II، الرباط). "
                 "أجب باختصار باللغة العربية. استخدم البيانات الحية أدناه.")
    else:
        intro = ("Tu es SDI Copilot, l'assistant du Géoportail AgroBioTech (IAV Hassan II, Rabat). "
                 "Tu aides les responsables à analyser les données IoT, comprendre les alertes et "
                 "prendre des décisions. Réponds de façon concise en français. "
                 "Valeurs de référence : température 18-28°C, humidité 60-80%, VPD 0.8-1.5 kPa, "
                 "CO₂ 400-1200 ppm, pH 5.5-7.0, EC 1.5-3.5 mS/cm. "
                 "Codes : S01=Génétique, S02=Horticulture, S03=Agronomie, S04=Hydroponie, S05=Protection des Plantes.")
    return f"{intro}\n\n--- DONNÉES LIVE ---\n{ctx_json}\n--- FIN ---\n\nMax 200 mots. Cite les valeurs exactes."

def build_public_system_prompt(live_snapshot: list, lang: str) -> str:
    snapshot_json = json.dumps(live_snapshot, ensure_ascii=False, default=str)
    if lang == "en":
        intro = ("You are SDI Copilot, public assistant of the AgroBioTech Geoportal (IAV Hassan II, Rabat). "
                 "Help visitors discover the 5 research greenhouses. Answer concisely in English. "
                 "No access to private data (alerts, thresholds). Direct admin questions to the dashboard.")
    elif lang == "ar":
        intro = ("أنت SDI Copilot، المساعد العام لبوابة AgroBioTech (IAV Hassan II، الرباط). "
                 "أجب باختصار باللغة العربية.")
    else:
        intro = ("Tu es SDI Copilot, l'assistant public du Géoportail AgroBioTech (IAV Hassan II, Rabat). "
                 "Tu aides les visiteurs à découvrir les 5 serres du campus. Réponds de façon concise en français. "
                 "Tu n'as pas accès aux données privées. Pour les fonctions admin, oriente vers le dashboard.")
    return f"{intro}\n\n--- DONNÉES IoT LIVE ---\n{snapshot_json}\n--- FIN ---\n\nMax 150 mots."

# ─── Helper Groq streaming ─────────────────────────────────

async def call_groq_stream(messages: list, system: str):
    """Appelle Groq API en streaming OpenAI-compatible et yield les chunks SSE."""
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "system", "content": system}] + messages,
        "max_tokens": 1024,
        "temperature": 0.7,
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", GROQ_URL, json=payload, headers=headers) as response:
            if response.status_code != 200:
                err = await response.aread()
                yield f"data: {json.dumps({'error': err.decode()})}\n\n"
                return
            async for line in response.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    yield "data: [DONE]\n\n"
                    return
                try:
                    data = json.loads(data_str)
                    delta = data.get("choices", [{}])[0].get("delta", {})
                    text  = delta.get("content", "")
                    if text:
                        yield f"data: {json.dumps({'text': text})}\n\n"
                except json.JSONDecodeError:
                    pass
    yield "data: [DONE]\n\n"

# ─── Endpoint privé (JWT) ──────────────────────────────────

@router.post("/chat")
async def copilot_chat(request: CopilotRequest, db=Depends(get_db), user=Depends(get_current_user)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY non configurée")
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages vides")

    try:
        context = await build_context(db)
    except Exception as e:
        context = {"error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()}

    system  = build_system_prompt(context, request.lang or "fr")
    msgs    = [{"role": m.role, "content": m.content} for m in request.messages[-10:]]

    return StreamingResponse(
        call_groq_stream(msgs, system),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

# ─── Endpoint public (sans JWT) ───────────────────────────

@router.post("/public")
async def copilot_public(request: PublicCopilotRequest, db=Depends(get_db)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY non configurée")
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages vides")

    system = build_public_system_prompt(request.live_snapshot or [], request.lang or "fr")
    msgs   = [{"role": m.role, "content": m.content} for m in request.messages[-8:]]

    return StreamingResponse(
        call_groq_stream(msgs, system),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
