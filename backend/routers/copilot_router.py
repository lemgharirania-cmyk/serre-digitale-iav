# routers/copilot_router.py — Terra : assistant conversationnel IA
# Utilise Groq (llama-3.3-70b) avec rotation automatique de clés API
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

GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"

# ─── Rotation automatique de clés Groq ────────────────────────
# Ajouter GROQ_API_KEY_1 et GROQ_API_KEY_2 sur Render + .env
# Si une clé échoue (rate limit, erreur), bascule automatiquement

def get_groq_keys() -> list[str]:
    keys = []
    for var in ["GROQ_API_KEY_1", "GROQ_API_KEY_2", "GROQ_API_KEY"]:
        k = os.getenv(var)
        if k and k not in keys:
            keys.append(k)
    return keys

# ─── Base de connaissances AgroBioTech ────────────────────────

CAMPUS_KNOWLEDGE = """
=== CAMPUS AGROBIOTECH — IAV HASSAN II, RABAT ===
Complexe de 5 serres de recherche reliées par un couloir central + bloc technique + bloc gestion.
Coordonnées : 33.9716°N, -6.8539°W. Investissement : 13 millions de dirhams.
Système IoT : Guardian Pro-Leaf, collecte toutes les 2 minutes.
Supervision : salle de contrôle centrale 24/7.
Couverture sémantique : 39 hotspots AR — 6 catégories thématiques.

═══════════════════════════════════════════════════════════════
PARTIE 1 — LES 5 UNITÉS DE RECHERCHE
═══════════════════════════════════════════════════════════════

--- S01 — UNITÉ GÉNÉTIQUE & AMÉLIORATION DES PLANTES ---
Code : S01 | Couleur : vert #22C55E
Mission : sélection variétale, croisements, évaluation des performances agronomiques.
Étude des caractères de résistance, qualité et rendement.
Production de lignées améliorées pour expérimentation.
Cultures : espèces améliorées (lignées en sélection)
Accès : Personnel autorisé uniquement
Capteurs : 2 ENV (T°, HR, VPD, CO₂) + 2 IRR (pH, EC, T°eau, niveau)
Optimums : T° 20-25°C | HR 60-75% | VPD 0.8-1.2 kPa | CO₂ 500-1000 ppm
Note : variation ±2°C peut affecter l'expression génique — précision critique

--- S02 — UNITÉ HORTICULTURE ---
Code : S02 | Couleur : cyan #06B6D4
Mission : plateforme pédagogique, expérimentale et de recherche en production horticole.
Recherche appliquée : maraîchage, horticulture ornementale, gestion de l'eau, nutrition, stress biotique/abiotique.
Cultures : maraîchage & horticulture ornementale — notamment COURGETTE (Cucurbita pepo)
Accès : Étudiants et personnel
Capteurs : 2 ENV + 2 IRR
Optimums : T° 18-26°C | HR 65-80% | VPD 0.8-1.5 kPa
Note : en-dessous de 15°C la croissance ralentit, au-delà de 30°C stress thermique
Recherche courgette : eau magnétisée + gypse agricole pour tolérance stress salin

--- S03 — UNITÉ AGRONOMIE ---
Code : S03 | Couleur : ambre #F59E0B
Mission : expérimentation agronomique sur grandes cultures et systèmes de production.
Études sur fertilisation, irrigation et gestion des intrants agricoles.
Cultures : grandes cultures — Blé, Orge, Légumineuses
Accès : Étudiants et personnel
Capteurs : 2 ENV + 2 IRR
Optimums : T° 18-28°C | HR 60-75%
Note : somme de températures (degrés-jours) détermine la maturité des cultures

--- S04 — UNITÉ HYDROPONIE & SYSTÈMES INNOVANTS ---
Code : S04 | Couleur : violet #8B5CF6
Mission : culture hors-sol avec solution nutritive recirculante (NFT, DWC).
Cultures : FRAISIER NFT (Fragaria × ananassa), Basilic, Laitue — PAS DE TOMATE
Système : NFT (Nutrient Film Technique) / DWC (Deep Water Culture)
Accès : Étudiants et personnel
Capteurs : 2 ENV + 2 IRR
Optimums : T° 18-24°C | pH 5.5-6.5 | EC 1.5-2.5 mS/cm | T° solution 18-22°C
Note : au-dessus de 28°C, O₂ dissous chute → risque Pythium sur racines
Recette NS Fraise NFT (Incrocci) : NO₃=9.99 / NH₄=1.0 / P=1.0 / K=5.5 / Ca=3.5 / Mg=1.2 / EC=1.70 mS/cm

--- S05 — UNITÉ PROTECTION DES PLANTES ---
Code : S05 | Couleur : rouge #EF4444
Mission : étude et gestion des maladies, ravageurs et adventices.
Développement de méthodes de lutte biologique et intégrée.
Spécimens en étude :
- CACTUS MALADE (Cactacées) : cochenilles farineuses, pourriture cladodes, chlorose aréoles
- TOMATE MALADE (Solanum lycopersicum) : mildiou (P.infestans), Botrytis, ToMV, TYLCV, Alternariose
- BLÉ MALADE : Septoriose (Z.tritici), Fusariose, Oïdium (Blumeria graminis)
- AVOCATIER (Persea americana) : Cercosporose, Phytophthora cinnamomi
- PLANTE X : spécimen non identifié en caractérisation
Accès : Personnel autorisé | Zone de quarantaine stricte

═══════════════════════════════════════════════════════════════
PARTIE 2 — ÉQUIPEMENTS & CONTRÔLE CLIMATIQUE
═══════════════════════════════════════════════════════════════

Seuils automatiques (configurables par serre dans le dashboard) :
- Ventilation : cooling jour > 25°C | cooling nuit > 20°C | deadband ±2°C
- Chauffage : heating jour < 20°C | heating nuit < 15°C | deadband ±2°C
- Brumisation/Humidification : HR < 60% (jour/nuit)
- Déshumidification : HR > 80% (jour/nuit)
- CO₂ injection : < 1000 ppm (système prévu, non commissioning)
- Ombrage extérieur : déploie > 30°C, rétracte < 25°C
- Ombrage intérieur : déploie > 28°C
- Fenêtres : ouverture/fermeture automatique via station météo

Équipements techniques :
- Brumisateur : refroidissement évaporatif + hausse HR
- Refroidissement adiabatique (CTA) : abaisse T° quand > seuil max
- Station de fertigation : prépare solution nutritive, ajuste pH/EC, fertilise N/P/K/Ca/Mg/S
- Chaudière : chauffe circuit d'eau pour fertigation et zone racinaire tablettes
- Adoucisseur : échangeur ionique, réduit dureté < 7°f, prévient calcaire goutteurs

═══════════════════════════════════════════════════════════════
PARTIE 3 — ESPACES & INFRASTRUCTURE
═══════════════════════════════════════════════════════════════

- Salle de contrôle : pilotage 24/7 — ventilation, chauffage, refroidissement, CO₂, éclairage
- Salle de fertigation : préparation solutions nutritives, contrôle pH/EC
- Salle de lavage : désinfection matériel, prévention contaminations croisées
- Salle de préparation : mise en place cultures et matériel
- Bloc gestion technique et administrative : bureaux du complexe
- Couloir central : circulation entre les 5 unités
- Zone extérieure : extérieur du complexe

═══════════════════════════════════════════════════════════════
PARTIE 4 — VALEURS DE RÉFÉRENCE AGRONOMIQUES
═══════════════════════════════════════════════════════════════

Température air : 18-28°C (optimum 20-25°C)
Humidité relative : 60-80%
VPD : 0.8-1.5 kPa
CO₂ : 400-1200 ppm
pH solution : 5.5-7.0
EC : 1.5-3.5 mS/cm
Température eau : 18-22°C
Niveau eau : 0.6-1.0 m
"""

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

# ─── Collecte contexte DB enrichi ─────────────────────────────

async def build_context(db) -> dict:
    # 1. Données live 30min
    iot_rows = await db.fetch("""
        SELECT DISTINCT ON (serre_id, type_api)
            serre_id, type_api, temperature, humidite, vpd, co2, luminosite,
            ph, ec, temp_eau, niveau_eau, capture_at
        FROM mesures_iot
        WHERE capture_at > NOW() - INTERVAL '30 minutes'
        ORDER BY serre_id, type_api, capture_at DESC
    """)

    # 2. Infos serres
    serres_rows = await db.fetch("SELECT id, code, nom_fr, nom_en, actif FROM serres ORDER BY code")
    serres_map  = {s["id"]: dict(s) for s in serres_rows}

    # 3. Alertes 48h
    alertes_rows = await db.fetch("""
        SELECT a.id, a.serre_id, a.capteur, a.valeur, a.seuil_min, a.seuil_max,
               a.message_fr as message, a.created_at, a.lu, s.code as serre_code, s.nom_fr
        FROM alertes a JOIN serres s ON s.id = a.serre_id
        WHERE a.created_at > NOW() - INTERVAL '48 hours'
        ORDER BY a.created_at DESC LIMIT 15
    """)

    # 4. Seuils actifs
    seuils_rows = await db.fetch("""
        SELECT t.serre_id, t.capteur, t.valeur_min, t.valeur_max, t.actif, s.code
        FROM thresholds t JOIN serres s ON s.id = t.serre_id
        WHERE t.actif = TRUE ORDER BY s.code, t.capteur
    """)

    # 5. Stats 7 jours
    stats_rows = await db.fetch("""
        SELECT serre_id, type_api,
               AVG(temperature) as avg_temp, MIN(temperature) as min_temp, MAX(temperature) as max_temp,
               AVG(humidite) as avg_hum, MIN(humidite) as min_hum, MAX(humidite) as max_hum,
               AVG(vpd) as avg_vpd, AVG(co2) as avg_co2,
               AVG(ph) as avg_ph, AVG(ec) as avg_ec,
               COUNT(*) as nb_mesures
        FROM mesures_iot
        WHERE capture_at > NOW() - INTERVAL '7 days' AND temperature IS NOT NULL
        GROUP BY serre_id, type_api ORDER BY serre_id
    """)

    # 6. Journal équipements (dernières 24h)
    try:
        journal_rows = await db.fetch("""
            SELECT j.serre_id, j.action, j.etat, j.valeur_capteur,
                   j.seuil_reference, j.periode, j.timestamp, s.code
            FROM journal_actions j JOIN serres s ON s.id = j.serre_id
            WHERE j.timestamp > NOW() - INTERVAL '24 hours'
            ORDER BY j.timestamp DESC LIMIT 20
        """)
    except Exception:
        journal_rows = []

    # 7. Params internes (seuils équipements configurés)
    try:
        params_rows = await db.fetch("""
            SELECT p.serre_id, p.action, p.seuil, p.deadband, s.code
            FROM params_internes p JOIN serres s ON s.id = p.serre_id
            ORDER BY s.code, p.action
        """)
    except Exception:
        params_rows = []

    # ── Assembler les données live par serre ──
    live_by_serre = {}
    for row in iot_rows:
        sid = row["serre_id"]
        if sid not in live_by_serre:
            live_by_serre[sid] = {"env": None, "irr": None}
        if row["type_api"] == "ENV":
            live_by_serre[sid]["env"] = {
                "temperature": row["temperature"], "humidite": row["humidite"],
                "vpd": row["vpd"], "co2": row["co2"], "luminosite": row["luminosite"],
            }
        elif row["type_api"] == "IRR":
            live_by_serre[sid]["irr"] = {
                "ph": row["ph"], "ec": row["ec"],
                "temp_eau": row["temp_eau"], "niveau_eau": row["niveau_eau"],
            }

    return {
        "serres": [{"code": s["code"], "nom": s["nom_fr"], "actif": s["actif"],
                    **live_by_serre.get(s["id"], {"env": None, "irr": None})} for s in serres_rows],
        "alertes_48h": [{"serre": a["serre_code"], "capteur": a["capteur"],
                         "valeur": float(a["valeur"]) if a["valeur"] else None,
                         "message": a["message"], "lu": a["lu"]}
                        for a in alertes_rows],
        "seuils": [{"serre": s["code"], "capteur": s["capteur"],
                    "min": float(s["valeur_min"]) if s["valeur_min"] else None,
                    "max": float(s["valeur_max"]) if s["valeur_max"] else None}
                   for s in seuils_rows],
        "stats_7j": [{"serre": serres_map.get(s["serre_id"], {}).get("code", "?"),
                      "avg_temp": round(float(s["avg_temp"]), 1) if s["avg_temp"] else None,
                      "min_temp": round(float(s["min_temp"]), 1) if s["min_temp"] else None,
                      "max_temp": round(float(s["max_temp"]), 1) if s["max_temp"] else None,
                      "avg_hum":  round(float(s["avg_hum"]),  1) if s["avg_hum"]  else None,
                      "avg_vpd":  round(float(s["avg_vpd"]),  2) if s["avg_vpd"]  else None,
                      "avg_co2":  round(float(s["avg_co2"]),  0) if s["avg_co2"]  else None,
                      "avg_ph":   round(float(s["avg_ph"]),   2) if s["avg_ph"]   else None,
                      "avg_ec":   round(float(s["avg_ec"]),   2) if s["avg_ec"]   else None,
}
                     for s in stats_rows],
        "journal_24h": [{"serre": j["code"], "action": j["action"], "etat": j["etat"],
                         "valeur": float(j["valeur_capteur"]) if j["valeur_capteur"] else None,
                         "seuil": float(j["seuil_reference"]) if j["seuil_reference"] else None,
                         "periode": j["periode"]}
                        for j in journal_rows],
        "params_internes": [{"serre": p["code"], "action": p["action"],
                             "seuil": float(p["seuil"]), "deadband": float(p["deadband"])}
                            for p in params_rows],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# ─── System prompts ────────────────────────────────────────

def build_system_prompt(context: dict, lang: str) -> str:
    ctx_json = json.dumps(context, ensure_ascii=False, indent=2, default=str)
    if lang == "en":
        intro = (
            "You are Terra, the intelligent assistant of the AgroBioTech Geoportal "
            "(IAV Hassan II, Rabat). You are an expert in the 5 research greenhouses of the campus. "
            "Help managers analyze real-time sensor data, understand alerts, and make agronomic decisions. "
            "Answer concisely in English. Always cite exact numeric values from live data."
        )
    elif lang == "ar":
        intro = (
            "أنت Terra، المساعد الذكي لبوابة AgroBioTech (IAV Hassan II، الرباط). "
            "أنت خبير في البيوت المحمية الخمس للحرم الجامعي. أجب باختصار باللغة العربية."
        )
    else:
        intro = (
            "Tu es Terra, l'assistant intelligent du Géoportail AgroBioTech (IAV Hassan II, Rabat). "
            "Tu es expert des 5 serres de recherche du campus et de leur fonctionnement. "
            "Tu aides les responsables à analyser les données IoT en temps réel, comprendre les alertes, "
            "consulter l'historique des équipements et prendre des décisions agronomiques précises. "
            "Réponds de façon concise en français. Cite toujours les valeurs numériques exactes. "
            "Tu as accès aux données live, aux alertes 48h, aux statistiques 7 jours, "
            "au journal des équipements 24h et aux paramètres de pilotage configurés."
        )
    return (
        f"{intro}\n\n"
        f"--- BASE DE CONNAISSANCES CAMPUS ---\n{CAMPUS_KNOWLEDGE}\n--- FIN CONNAISSANCES ---\n\n"
        f"--- DONNÉES TEMPS RÉEL & HISTORIQUE ---\n{ctx_json}\n--- FIN DONNÉES ---\n\n"
        f"Priorité : utilise les données live pour les valeurs actuelles. "
        f"Utilise stats_7j pour les tendances. Utilise journal_24h pour l'état des équipements. "
        f"Utilise alertes_48h pour les incidents. Max 250 mots."
    )

def build_public_system_prompt(live_snapshot: list, lang: str) -> str:
    snapshot_json = json.dumps(live_snapshot, ensure_ascii=False, default=str)
    if lang == "en":
        intro = (
            "You are Terra, the public assistant of the AgroBioTech Geoportal (IAV Hassan II, Rabat). "
            "You help visitors discover the 5 research greenhouses of the campus. "
            "Answer concisely in English. No access to private data (alerts, thresholds). "
            "Direct admin questions to the dashboard."
        )
    elif lang == "ar":
        intro = (
            "أنت Terra، المساعد العام لبوابة AgroBioTech (IAV Hassan II، الرباط). "
            "تساعد الزوار على اكتشاف البيوت المحمية الخمس. أجب باختصار باللغة العربية."
        )
    else:
        intro = (
            "Tu es Terra, l'assistant public du Géoportail AgroBioTech (IAV Hassan II, Rabat). "
            "Tu aides les visiteurs à découvrir les 5 serres de recherche du campus IAV Hassan II. "
            "Réponds de façon concise et pédagogique en français. "
            "Tu n'as pas accès aux données privées (alertes, seuils, journal). "
            "Pour les fonctions admin, oriente vers le dashboard."
        )
    return (
        f"{intro}\n\n"
        f"--- BASE DE CONNAISSANCES CAMPUS ---\n{CAMPUS_KNOWLEDGE}\n--- FIN CONNAISSANCES ---\n\n"
        f"--- DONNÉES IoT LIVE (snapshot) ---\n{snapshot_json}\n--- FIN ---\n\n"
        f"Max 150 mots. Sois pédagogique pour un visiteur non-spécialiste."
    )

# ─── Helper Groq streaming avec rotation de clés ──────────────

async def call_groq_stream(messages: list, system: str):
    """Appelle Groq avec rotation automatique des clés API."""
    keys = get_groq_keys()
    if not keys:
        yield f"data: {json.dumps({'error': 'Aucune clé GROQ_API_KEY configurée'})}\n\n"
        yield "data: [DONE]\n\n"
        return

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "system", "content": system}] + messages,
        "max_tokens": 512,
        "temperature": 0.7,
        "stream": True,
    }

    last_error = None
    for i, key in enumerate(keys):
        try:
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", GROQ_URL, json=payload, headers=headers) as response:
                    if response.status_code == 429:
                        # Rate limit → essayer la clé suivante
                        last_error = f"Rate limit clé {i+1}"
                        print(f"[Terra] {last_error} — rotation vers clé suivante")
                        continue
                    if response.status_code != 200:
                        err = await response.aread()
                        last_error = err.decode()
                        print(f"[Terra] Erreur clé {i+1}: {response.status_code}")
                        continue
                    # Succès — streamer la réponse
                    async for line in response.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        data_str = line[5:].strip()
                        if data_str == "[DONE]":
                            yield "data: [DONE]\n\n"
                            return
                        try:
                            data  = json.loads(data_str)
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            text  = delta.get("content", "")
                            if text:
                                yield f"data: {json.dumps({'text': text})}\n\n"
                        except json.JSONDecodeError:
                            pass
                    yield "data: [DONE]\n\n"
                    return
        except Exception as e:
            last_error = str(e)
            print(f"[Terra] Exception clé {i+1}: {e}")
            continue

    # Toutes les clés ont échoué
    yield f"data: {json.dumps({'error': f'Toutes les clés Groq ont échoué: {last_error}'})}\n\n"
    yield "data: [DONE]\n\n"

# ─── Endpoint privé (JWT) ──────────────────────────────────

@router.post("/chat")
async def copilot_chat(request: CopilotRequest, db=Depends(get_db), user=Depends(get_current_user)):
    keys = get_groq_keys()
    if not keys:
        raise HTTPException(status_code=500, detail="Aucune GROQ_API_KEY configurée")
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages vides")

    try:
        context = await build_context(db)
    except Exception as e:
        context = {"error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()}

    system = build_system_prompt(context, request.lang or "fr")
    msgs   = [{"role": m.role, "content": m.content} for m in request.messages[-10:]]

    return StreamingResponse(
        call_groq_stream(msgs, system),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

# ─── Endpoint public (sans JWT) ───────────────────────────

@router.post("/public")
async def copilot_public(request: PublicCopilotRequest, db=Depends(get_db)):
    keys = get_groq_keys()
    if not keys:
        raise HTTPException(status_code=500, detail="Aucune GROQ_API_KEY configurée")
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages vides")

    system = build_public_system_prompt(request.live_snapshot or [], request.lang or "fr")
    msgs   = [{"role": m.role, "content": m.content} for m in request.messages[-8:]]

    return StreamingResponse(
        call_groq_stream(msgs, system),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
