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


# ─── Base de connaissances AgroBioTech ────────────────────

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
Mission : plateforme pédagogique, expérimentale et de recherche en production horticole sous environnement contrôlé.
Recherche appliquée : maraîchage, horticulture ornementale, gestion de l'eau, nutrition, stress biotique/abiotique.
Infrastructure équipée de systèmes avancés de contrôle climatique et fertigation.
Cultures : maraîchage & horticulture ornementale — notamment COURGETTE (Cucurbita pepo)
Accès : Étudiants et personnel
Capteurs : 2 ENV + 2 IRR
Optimums : T° 18-26°C | HR 65-80% | VPD 0.8-1.5 kPa
Note : en-dessous de 15°C la croissance ralentit, au-delà de 30°C stress thermique
Recherche en cours sur la courgette :
- Efficacité de l'eau magnétisée et du gypse agricole pour la gestion du stress salin
- Impact du traitement magnétique de l'eau d'irrigation sur la tolérance à la salinité
- Effet du gypse sur les propriétés physico-chimiques du sol en conditions salines

--- S03 — UNITÉ AGRONOMIE ---
Code : S03 | Couleur : ambre #F59E0B
Mission : expérimentation agronomique sur grandes cultures et systèmes de production.
Études sur fertilisation, irrigation et gestion des intrants agricoles.
Évaluation de nouvelles variétés céréalières et légumineuses.
Cultures : grandes cultures — Blé, Orge, Légumineuses
Accès : Étudiants et personnel
Capteurs : 2 ENV + 2 IRR
Optimums : T° 18-28°C | HR 60-75%
Note : la somme de températures (degrés-jours) détermine la maturité des cultures céréalières

--- S04 — UNITÉ HYDROPONIE & SYSTÈMES INNOVANTS ---
Code : S04 | Couleur : violet #8B5CF6
Mission : culture hors-sol avec solution nutritive recirculante (NFT, DWC).
Expérimentation sur production de légumes et petits fruits.
Monitoring IoT temps réel : pH, EC, température, niveau de solution.
Cultures : FRAISIER NFT (Fragaria × ananassa), Basilic, Laitue — PAS DE TOMATE
Système : NFT (Nutrient Film Technique) / DWC (Deep Water Culture)
Accès : Étudiants et personnel
Capteurs : 2 ENV + 2 IRR
Optimums : T° 18-24°C | pH 5.5-6.5 | EC 1.5-2.5 mS/cm | T° solution 18-22°C
Note : au-dessus de 28°C, l'O₂ dissous chute, risque Pythium sur racines
Recette NS Fraise NFT (Incrocci) : NO₃=9.99 / NH₄=1.0 / P=1.0 / K=5.5 / Ca=3.5 / Mg=1.2 / EC=1.70 mS/cm
Caractéristiques fraisier : substrat inerte (fibre de coco ou perlite), irrigation par cycles courts, fructification continue, sensible à l'oïdium et au Botrytis

--- S05 — UNITÉ PROTECTION DES PLANTES ---
Code : S05 | Couleur : rouge #EF4444
Mission : étude et gestion des maladies, ravageurs et adventices.
Développement de méthodes de lutte biologique et intégrée contre les bioagresseurs.
Formation aux techniques phytosanitaires et protection raisonnée.
Cultures et spécimens en étude phytopathologique :
- CACTUS MALADE (Cactacées, Amérique tropicale, zone quarantaine)
- TOMATE MALADE (Solanum lycopersicum, Solanacées) — multiples variants
- BLÉ MALADE — études phytopathologiques sur résistance variétale
- AVOCATIER (Persea americana, Lauracées, Mésoamérique) — observation phytosanitaire
- PLANTE X — spécimen non identifié en caractérisation
Accès : Personnel autorisé
Note : zone de quarantaine, conditions strictes pour éviter propagation bioagresseurs

═══════════════════════════════════════════════════════════════
PARTIE 2 — CULTURES & PATHOLOGIES DÉTAILLÉES
═══════════════════════════════════════════════════════════════

--- FRAISIER NFT (S04 Hydroponie) ---
Espèce : Fragaria × ananassa | Famille : Rosacées
Système : NFT (Nutrient Film Technique)
Substrat : inerte (fibre de coco ou perlite)
Conditions : pH 5.5-6.5, EC 1.70 mS/cm cible, irrigation par cycles courts
Sensibilités : Oïdium et Botrytis cinerea
Fructification : continue

--- COURGETTE (S02 Horticulture) ---
Espèce : Cucurbita pepo | Famille : Cucurbitacées
Système : sol ou substrat
Conditions optimales : T° jour 22-28°C, T° nuit 15-18°C, HR 60-70%, plein soleil
Caractéristiques : plante rampante à croissance rapide, tuteurage/palissage vertical
Pollinisation : manuelle ou par insectes auxiliaires
Récolte : stade immature (15-20 cm) pour meilleure qualité gustative
Recherche en cours : eau magnétisée, gypse agricole, gestion stress salin

--- AVOCATIER (S05 Protection) ---
Espèce : Persea americana | Famille : Lauracées | Origine : Mésoamérique
Conditions : T° 18-30°C, HR 60-75%, plein soleil à mi-ombre, sol bien drainé pH 6-7
Pathologies étudiées :
- Cercosporose (Cercospora sp.) : taches brunes à nécrotiques sur feuilles
- Pourriture phytophthoréenne des racines (Phytophthora cinnamomi)
- Évaluation de la résistance variétale

--- CACTUS MALADE (S05 Protection) ---
Famille : Cactacées | Origine : Amérique tropicale | Statut : sujet malade en étude
Pathologies observées :
- Pourriture molle ou sèche des cladodes — agents fongiques ou bactériens
- Cochenilles farineuses et à carapace — infestations fréquentes en serre
- Chlorose des aréoles — possible carence ou infection virale
Protocole : zone quarantaine, traitement en évaluation, suivi hebdomadaire

--- TOMATE MALADE (S05 Protection) ---
Espèce : Solanum lycopersicum | Famille : Solanacées
Statut : plants malades en étude — agents multiples
Maladies étudiées :
- Mildiou (Phytophthora infestans) : taches huileuses évoluant en nécroses
- Pourriture grise (Botrytis cinerea) : sur tiges, feuilles et fruits
- Virus de la mosaïque (ToMV) et Virus TY (TYLCV) : feuilles jaunes en cuillère
- Alternariose (Alternaria solani) : taches concentriques sur feuilles
Recherche : épidémiologie, inoculation contrôlée, lutte intégrée

--- BLÉ MALADE (S05 Protection) ---
Statut : étude phytopathologique
Maladies étudiées :
- Septoriose (Zymoseptoria tritici) : lésions nécrotiques avec pycnides
- Fusariose de l'épi (Fusarium spp.) : risque de mycotoxines
- Oïdium (Blumeria graminis) : feutrage blanc poudreux
Objectifs : étude de résistance variétale, notation au champ, sélection variétale

═══════════════════════════════════════════════════════════════
PARTIE 3 — ÉQUIPEMENTS TECHNIQUES (6 hotspots)
═══════════════════════════════════════════════════════════════

--- BRUMISATEUR ---
Génère un brouillard d'eau pour refroidissement évaporatif et hausse de l'HR.
Activation : HR < seuil minimal. Double bénéfice : baisse T° et hausse HR.
Fonctionne conjointement avec ventilation et système de refroidissement.

--- SYSTÈME DE REFROIDISSEMENT (Adiabatique) ---
Type : évaporatif adiabatique.
Abaisse la T° en augmentant l'HR. Activation : T° intérieure > seuil max (~30°C).
Protège les cultures du stress thermique.

--- STATION DE FERTIGATION ---
Prépare et distribue la solution nutritive aux cultures à intervalles programmés.
Ajuste dynamiquement pH et EC en temps réel.
Fertilisation précise en macroéléments (N, P, K, Ca, Mg, S) et micros selon stade végétatif.
Optimise efficacité de l'eau et des intrants.
Tabs : Info + IoT.

--- CHAUDIÈRE ---
Chauffe l'eau du circuit de fertigation, maintient T° optimale pour absorption nutriments par racines.
Alimente le système de chauffage de la zone racinaire des tablettes mobiles.
Substrat chaud stimule activité racinaire et absorption des minéraux.
Fonctionnement automatique selon T° consigne du circuit d'eau.

--- ADOUCISSEUR D'EAU ---
Type : échangeur ionique (résines cationiques).
Réduction de la dureté de l'eau d'irrigation par échange ionique.
Prévient le colmatage des goutteurs et l'accumulation de calcaire.
Améliore l'efficacité des solutions fertilisantes.
Régénération : automatique au chlorure de sodium (NaCl). Dureté cible : < 7 °f.

═══════════════════════════════════════════════════════════════
PARTIE 4 — CONTRÔLE CLIMATIQUE (7 hotspots)
═══════════════════════════════════════════════════════════════

--- INJECTION CO₂ ---
Statut : système conçu, pas encore en commissioning.
Compense l'appauvrissement en CO₂ des cultures denses, stimule la photosynthèse.
Activation : CO₂ < 400 ppm.

--- VENTILATION NATURELLE ---
Toits ouvrants pilotés par station météo.
Laisse entrer l'air extérieur et évacue l'air chaud et humide.
Réapprovisionne le CO₂, assèche le feuillage — limite Botrytis et mildiou.
Renouvelle l'air naturellement, sans ventilation mécanique.
Contrôle : station météo (T°, HR, vent, précipitations).
Seuils : cooling jour > 25°C | cooling nuit > 20°C | deadband ±2°C.

--- VENTILATION EXTÉRIEURE / DEHORS / TOITURE ---
Trois variantes complémentaires pour renouvellement d'air.

--- RIDEAUX AUTOMATIQUES (Ombrage) ---
Écran thermique et d'ombrage.
Ombrage extérieur : déploie > 30°C, rétracte < 25°C.
Ombrage intérieur : déploie > 28°C.

--- FENÊTRES AUTOMATIQUES ---
Ouverture/fermeture automatique selon conditions climatiques.
Note : si LED éteinte → équipement arrivé en fin de course (complètement ouvert ou fermé).

--- CHAUFFAGE ---
Activation : heating jour < 15°C | heating nuit < 12°C.
Maintien des T° nocturnes en dessous des seuils critiques.

═══════════════════════════════════════════════════════════════
PARTIE 5 — CHAÎNE DE MESURE IoT (2 hotspots)
═══════════════════════════════════════════════════════════════

--- CAPTEURS ENVIRONNEMENTAUX (SENSORS) ---
Mesures : Température air, HR, VPD, CO₂, Luminosité.
Fréquence : collecte toutes les 2 minutes par scheduler.

--- SYSTÈME DE MONITORING AGROBIOTECH ---
Collecte et visualisation temps réel des données de toutes les serres.
Alertes automatiques en cas de dépassement de seuils critiques.
Supervision climat et irrigation depuis la salle de contrôle.

═══════════════════════════════════════════════════════════════
PARTIE 6 — ESPACES ADMINISTRATIFS & TECHNIQUES (7 hotspots)
═══════════════════════════════════════════════════════════════

--- SALLE DE LAVAGE ---
Lavage et désinfection du matériel de culture (pots, plateaux, outils) et récoltes.
Propreté rigoureuse limite contaminations croisées — rôle essentiel en prévention sanitaire.

--- SALLE TECHNIQUE DE COMMANDES (Salle de Contrôle) ---
Centre de pilotage 24/7 — centralise données capteurs et station météo.
Suivi et ajustement ventilation, chauffage, refroidissement, brumisation.
Supervision éclairage, injection CO₂, fertigation.

--- SALLE DE RÉUNION ---
Espace de coordination pour équipes de recherche et formations du complexe.

--- SALLE DE PRÉPARATION ---
Espace dédié à la préparation du matériel et des cultures avant mise en place.

--- BLOC GESTION TECHNIQUE ET ADMINISTRATIVE ---
Bureaux administratifs du complexe AgroBioTech.

--- COMPLEXE DE SERRES ---
Structure verre-aluminium avec toitures arquées maximisant la lumière naturelle.
5 unités spécialisées reliées par un couloir central.
Climat et irrigation supervisés depuis la salle de contrôle.

--- ZONE EXTÉRIEURE ---
Extérieur du complexe AgroBioTech.

═══════════════════════════════════════════════════════════════
PARTIE 7 — SEUILS AGRONOMIQUES & ÉQUIPEMENTS
═══════════════════════════════════════════════════════════════

Valeurs de référence agronomiques :
- Température : 18-28°C (optimum 20-25°C)
- HR : 60-80%
- VPD : 0.8-1.5 kPa
- CO₂ : 400-1200 ppm (naturel 400, enrichi jusqu'à 1200)
- pH solution : 5.5-7.0
- EC : 1.5-3.5 mS/cm
- T° eau : 18-22°C
- Niveau eau : 0.6-1.0 m

Seuils équipements automatiques :
- Ventilation : cooling jour > 25°C | cooling nuit > 20°C | deadband ±2°C
- Chauffage : heating jour < 15°C | heating nuit < 12°C
- Ombrage extérieur : déploie > 30°C, rétracte < 25°C
- Ombrage intérieur : déploie > 28°C
- Brumisation : déclenche si HR < 50%
- Déshumidification : déclenche si HR > 85%
- CO₂ injection : déclenche si < 400 ppm (système non commissioning)
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
            "Tu es expert des 5 serres de recherche du campus. "
            "Tu aides les responsables à analyser les données IoT, comprendre les alertes et "
            "prendre des décisions agronomiques précises. "
            "Réponds de façon concise en français. Cite toujours les valeurs numériques exactes."
        )
    return (
        f"{intro}\n\n"
        f"--- BASE DE CONNAISSANCES CAMPUS ---\n{CAMPUS_KNOWLEDGE}\n--- FIN CONNAISSANCES ---\n\n"
        f"--- DONNÉES LIVE TEMPS RÉEL ---\n{ctx_json}\n--- FIN DONNÉES ---\n\n"
        f"Priorité : utilise les données live pour les valeurs actuelles. "
        f"Utilise la base de connaissances pour le contexte agronomique. Max 200 mots."
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
            "Tu aides les visiteurs à découvrir les 5 serres de recherche du campus. "
            "Réponds de façon concise en français. "
            "Tu n'as pas accès aux données privées (alertes, seuils). "
            "Pour les fonctions admin, oriente vers le dashboard."
        )
    return (
        f"{intro}\n\n"
        f"--- BASE DE CONNAISSANCES CAMPUS ---\n{CAMPUS_KNOWLEDGE}\n--- FIN CONNAISSANCES ---\n\n"
        f"--- DONNÉES IoT LIVE (snapshot) ---\n{snapshot_json}\n--- FIN ---\n\n"
        f"Max 150 mots. Sois pédagogique pour un visiteur non-spécialiste."
    )

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
