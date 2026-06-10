# routers/copilot_router.py — SDI Copilot : assistant conversationnel IA
# Agrège les données live IoT + alertes + seuils et proxifie vers Claude API
# Route : POST /api/copilot/chat  (protégée JWT)

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

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-flash-8b"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:streamGenerateContent"

# ─── Schémas ────────────────────────────────────────────────

class CopilotMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class CopilotRequest(BaseModel):
    messages: list[CopilotMessage]
    lang: Optional[str] = "fr"  # fr | en | ar

# ─── Collecte contexte ─────────────────────────────────────

async def build_context(db) -> dict:
    """Agrège toutes les données live pour construire le contexte du prompt."""

    # 1. Données IoT live (dernière mesure par serre)
    iot_rows = await db.fetch("""
        SELECT DISTINCT ON (serre_id, type_api)
            serre_id, type_api, temperature, humidite, vpd, co2, luminosite,
            ph, ec, temp_eau, niveau_eau, capture_at
        FROM mesures_iot
        WHERE capture_at > NOW() - INTERVAL '30 minutes'
        ORDER BY serre_id, type_api, capture_at DESC
    """)

    # 2. Serres
    serres_rows = await db.fetch("""
        SELECT id, code, nom_fr, nom_en, actif FROM serres ORDER BY code
    """)
    serres_map = {s["id"]: dict(s) for s in serres_rows}

    # 3. Alertes des dernières 48h
    alertes_rows = await db.fetch("""
        SELECT a.id, a.serre_id, a.capteur, a.valeur, a.seuil_depasse,
               a.message, a.created_at, a.lue, s.code as serre_code, s.nom_fr
        FROM alertes a
        JOIN serres s ON s.id = a.serre_id
        WHERE a.created_at > NOW() - INTERVAL '48 hours'
        ORDER BY a.created_at DESC
        LIMIT 20
    """)

    # 4. Seuils configurés
    seuils_rows = await db.fetch("""
        SELECT t.serre_id, t.capteur, t.valeur_min, t.valeur_max, t.actif, s.code
        FROM thresholds t
        JOIN serres s ON s.id = t.serre_id
        WHERE t.actif = TRUE
        ORDER BY s.code, t.capteur
    """)

    # 5. Statistiques 7 derniers jours par serre
    stats_rows = await db.fetch("""
        SELECT
            serre_id,
            type_api,
            AVG(temperature) as avg_temp,
            MIN(temperature) as min_temp,
            MAX(temperature) as max_temp,
            AVG(humidite) as avg_hum,
            AVG(vpd) as avg_vpd,
            AVG(co2) as avg_co2,
            AVG(ph) as avg_ph,
            AVG(ec) as avg_ec,
            COUNT(*) as nb_mesures
        FROM mesures_iot
        WHERE capture_at > NOW() - INTERVAL '7 days'
          AND temperature IS NOT NULL
        GROUP BY serre_id, type_api
        ORDER BY serre_id
    """)

    # ── Formatage ──────────────────────────────────────────

    # Données live par serre
    live_by_serre = {}
    for row in iot_rows:
        sid = row["serre_id"]
        if sid not in live_by_serre:
            live_by_serre[sid] = {"env": None, "irr": None}
        if row["type_api"] == "ENV":
            live_by_serre[sid]["env"] = {
                "temperature": row["temperature"],
                "humidite": row["humidite"],
                "vpd": row["vpd"],
                "co2": row["co2"],
                "luminosite": row["luminosite"],
                "capture_at": str(row["capture_at"]) if row["capture_at"] else None,
            }
        elif row["type_api"] == "IRR":
            live_by_serre[sid]["irr"] = {
                "ph": row["ph"],
                "ec": row["ec"],
                "temp_eau": row["temp_eau"],
                "niveau_eau": row["niveau_eau"],
                "capture_at": str(row["capture_at"]) if row["capture_at"] else None,
            }

    serres_context = []
    for serre in serres_rows:
        sid = serre["id"]
        live = live_by_serre.get(sid, {"env": None, "irr": None})
        serres_context.append({
            "code": serre["code"],
            "nom": serre["nom_fr"],
            "actif": serre["actif"],
            "env": live["env"],
            "irr": live["irr"],
        })

    alertes_context = []
    for a in alertes_rows:
        alertes_context.append({
            "serre": a["serre_code"],
            "capteur": a["capteur"],
            "valeur": float(a["valeur"]) if a["valeur"] else None,
            "seuil_depasse": a["seuil_depasse"],
            "message": a["message"],
            "heure": str(a["created_at"]),
            "lue": a["lue"],
        })

    seuils_context = []
    for s in seuils_rows:
        seuils_context.append({
            "serre": s["code"],
            "capteur": s["capteur"],
            "min": float(s["valeur_min"]) if s["valeur_min"] else None,
            "max": float(s["valeur_max"]) if s["valeur_max"] else None,
        })

    stats_context = []
    for s in stats_rows:
        sid = s["serre_id"]
        serre_info = serres_map.get(sid, {})
        stats_context.append({
            "serre": serre_info.get("code", f"id:{sid}"),
            "type": s["type_api"],
            "avg_temp": round(float(s["avg_temp"]), 1) if s["avg_temp"] else None,
            "min_temp": round(float(s["min_temp"]), 1) if s["min_temp"] else None,
            "max_temp": round(float(s["max_temp"]), 1) if s["max_temp"] else None,
            "avg_hum": round(float(s["avg_hum"]), 1) if s["avg_hum"] else None,
            "avg_vpd": round(float(s["avg_vpd"]), 2) if s["avg_vpd"] else None,
            "avg_co2": round(float(s["avg_co2"]), 0) if s["avg_co2"] else None,
            "avg_ph": round(float(s["avg_ph"]), 2) if s["avg_ph"] else None,
            "avg_ec": round(float(s["avg_ec"]), 2) if s["avg_ec"] else None,
            "nb_mesures": s["nb_mesures"],
        })

    return {
        "serres": serres_context,
        "alertes_48h": alertes_context,
        "seuils": seuils_context,
        "stats_7j": stats_context,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def build_system_prompt(context: dict, lang: str) -> str:
    """Construit le system prompt avec les données live injectées."""

    ctx_json = json.dumps(context, ensure_ascii=False, indent=2, default=str)

    if lang == "en":
        intro = (
            "You are SDI Copilot, the intelligent assistant of the AgroBioTech Geoportal "
            "(IAV Hassan II, Rabat). You help greenhouse managers analyze real-time sensor data, "
            "understand alerts, and make informed decisions about crop management.\n\n"
            "Answer concisely in English. Use the live data provided below. "
            "For agronomic questions, use standard reference values: "
            "temperature 18-28°C, humidity 60-80%, VPD 0.8-1.5 kPa, CO₂ 400-1200 ppm, "
            "pH 5.5-7.0, EC 1.5-3.5 mS/cm."
        )
    elif lang == "ar":
        intro = (
            "أنت SDI Copilot، المساعد الذكي لبوابة AgroBioTech الجغرافية "
            "(معهد الحسن الثاني للزراعة والبيطرة، الرباط). "
            "تساعد مديري البيوت المحمية على تحليل بيانات الاستشعار الحية وفهم التنبيهات "
            "واتخاذ قرارات مدروسة بشأن إدارة المحاصيل.\n\n"
            "أجب باختصار باللغة العربية. استخدم البيانات الحية المقدمة أدناه."
        )
    else:
        intro = (
            "Tu es SDI Copilot, l'assistant intelligent du Géoportail AgroBioTech "
            "(IAV Hassan II, Rabat). Tu aides les responsables des serres à analyser "
            "les données capteurs en temps réel, comprendre les alertes et prendre des décisions "
            "éclairées sur la gestion des cultures.\n\n"
            "Réponds de façon concise en français. Utilise les données live ci-dessous. "
            "Pour les questions agronomiques, les valeurs de référence standard sont : "
            "température 18-28°C, humidité 60-80%, VPD 0.8-1.5 kPa, CO₂ 400-1200 ppm, "
            "pH 5.5-7.0, EC 1.5-3.5 mS/cm.\n\n"
            "Les codes des serres : S01=Génétique, S02=Horticulture, S03=Agronomie, "
            "S04=Hydroponie, S05=Protection des Plantes."
        )

    return f"""{intro}

--- DONNÉES LIVE DU SYSTÈME (mise à jour automatique) ---
{ctx_json}
--- FIN DES DONNÉES ---

Règles :
- Cite toujours les valeurs numériques exactes depuis les données live.
- Si une donnée est manquante ou null, dis-le clairement.
- Pour les alertes, explique la cause probable et une action corrective.
- Réponds directement sans reformuler la question.
- Maximum 200 mots sauf si une analyse détaillée est demandée.
"""


# ─── Endpoint principal ────────────────────────────────────

@router.post("/chat")
async def copilot_chat(
    request: CopilotRequest,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """Endpoint principal du SDI Copilot — proxifie vers Gemini API (gratuit) avec contexte live."""

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY non configurée")

    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages vides")

    # Agrégation des données live
    try:
        context = await build_context(db)
    except Exception as e:
        context = {"error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()}

    system_prompt = build_system_prompt(context, request.lang or "fr")

    # Construction de l'historique au format Gemini
    # Le system prompt passe dans systemInstruction, pas dans contents
    contents = []
    for m in request.messages:
        role = "user" if m.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m.content}]})

    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 1024,
            "temperature": 0.7,
        },
    }

    url = f"{GEMINI_URL}?key={GEMINI_API_KEY}&alt=sse"

    async def generate():
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    err = await response.aread()
                    yield f"data: {json.dumps({'error': err.decode()})}\n\n"
                    return

                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data_str = line[5:].strip()
                    if not data_str or data_str == "[DONE]":
                        yield "data: [DONE]\n\n"
                        break
                    try:
                        data = json.loads(data_str)
                        # Gemini : candidates[0].content.parts[0].text
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                text = part.get("text", "")
                                if text:
                                    yield f"data: {json.dumps({'text': text})}\n\n"
                    except json.JSONDecodeError:
                        pass

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


# ─── Endpoint PUBLIC (sans JWT) ────────────────────────────
# Utilisé par la page publique du Géoportail
# Ne reçoit pas de données privées (alertes, seuils) — seulement le snapshot IoT
# envoyé par le frontend depuis /api/iot/live (déjà public)

class PublicCopilotRequest(BaseModel):
    messages: list[CopilotMessage]
    lang: Optional[str] = "fr"
    live_snapshot: Optional[list] = []   # données IoT envoyées par le frontend


def build_public_system_prompt(live_snapshot: list, lang: str) -> str:
    """System prompt allégé pour le copilot public — pas de données sensibles."""

    snapshot_json = json.dumps(live_snapshot, ensure_ascii=False, default=str)

    if lang == "en":
        intro = (
            "You are SDI Copilot, the public assistant of the AgroBioTech Geoportal "
            "(IAV Hassan II, Rabat, Morocco). You help visitors discover the 5 research "
            "greenhouses of the campus and understand their current environmental conditions.\n\n"
            "Answer concisely in English. Use the live data snapshot below when relevant. "
            "For agronomic reference: temperature 18-28°C, humidity 60-80%, VPD 0.8-1.5 kPa, "
            "CO₂ 400-1200 ppm, pH 5.5-7.0, EC 1.5-3.5 mS/cm.\n\n"
            "Greenhouse codes: S01=Genetics, S02=Horticulture, S03=Agronomy, "
            "S04=Hydroponics, S05=Plant Protection.\n\n"
            "You do NOT have access to private data (alerts, thresholds, user accounts). "
            "For admin features, politely direct users to log into the dashboard."
        )
    elif lang == "ar":
        intro = (
            "أنت SDI Copilot، المساعد العام لبوابة AgroBioTech الجغرافية "
            "(معهد الحسن الثاني للزراعة والبيطرة، الرباط، المغرب). "
            "تساعد الزوار على اكتشاف البيوت المحمية الخمس للحرم الجامعي "
            "وفهم الظروف البيئية الحالية.\n\n"
            "أجب باختصار باللغة العربية. استخدم بيانات الاستشعار الحية أدناه عند الاقتضاء.\n\n"
            "رموز البيوت المحمية: S01=الوراثة، S02=البستنة، S03=الزراعة، "
            "S04=الزراعة المائية، S05=وقاية النباتات."
        )
    else:
        intro = (
            "Tu es SDI Copilot, l'assistant public du Géoportail AgroBioTech "
            "(IAV Hassan II, Rabat, Maroc). Tu aides les visiteurs à découvrir les 5 serres "
            "de recherche du campus et à comprendre leurs conditions environnementales actuelles.\n\n"
            "Réponds de façon concise en français. Utilise le snapshot IoT ci-dessous quand pertinent. "
            "Valeurs de référence agronomiques : température 18-28°C, humidité 60-80%, "
            "VPD 0.8-1.5 kPa, CO₂ 400-1200 ppm, pH 5.5-7.0, EC 1.5-3.5 mS/cm.\n\n"
            "Codes des serres : S01=Génétique, S02=Horticulture, S03=Agronomie, "
            "S04=Hydroponie, S05=Protection des Plantes.\n\n"
            "Tu n'as PAS accès aux données privées (alertes, seuils, comptes utilisateurs). "
            "Pour les fonctionnalités admin, oriente poliment l'utilisateur vers le dashboard."
        )

    return f"""{intro}

--- DONNÉES IoT LIVE (snapshot public) ---
{snapshot_json}
--- FIN ---

Règles :
- Cite les valeurs numériques exactes du snapshot quand disponibles.
- Si une valeur est null ou absente, dis-le simplement.
- Maximum 150 mots sauf si une explication détaillée est demandée.
- Reste accessible et pédagogique pour un visiteur non-spécialiste.
"""


@router.post("/public")
async def copilot_public(request: PublicCopilotRequest, db=Depends(get_db)):
    """Endpoint public du SDI Copilot — sans JWT, contexte IoT fourni par le frontend."""

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY non configurée")

    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages vides")

    system_prompt = build_public_system_prompt(
        request.live_snapshot or [], request.lang or "fr"
    )

    contents = []
    for m in request.messages:
        role = "user" if m.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m.content}]})

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": 512, "temperature": 0.7},
    }

    url = f"{GEMINI_URL}?key={GEMINI_API_KEY}&alt=sse"

    async def generate():
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    err = await response.aread()
                    yield f"data: {json.dumps({'error': err.decode()})}\n\n"
                    return
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data_str = line[5:].strip()
                    if not data_str or data_str == "[DONE]":
                        yield "data: [DONE]\n\n"
                        break
                    try:
                        data = json.loads(data_str)
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                text = part.get("text", "")
                                if text:
                                    yield f"data: {json.dumps({'text': text})}\n\n"
                    except json.JSONDecodeError:
                        pass
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
