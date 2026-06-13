# scheduler.py — Collecte IoT toutes les 2 minutes + vérification seuils
import asyncio
import json
from datetime import datetime
from iot_service import fetch_env, fetch_irr
from email_service import send_alert_email
from database import get_pool


# ─── Journal des transitions équipements ────────────────────────────────────

async def record_journal_transitions(db, serre: dict, env: dict, jour: bool):
    """
    Compare l'état calculé des équipements avec le dernier état enregistré
    et insère une ligne dans journal_actions pour chaque transition détectée.
    Appelé après chaque collecte ENV réussie.
    """
    temp  = env.get("temperature")
    humid = env.get("humidite")
    co2   = env.get("co2")

    if temp is None and humid is None:
        return

    # Charger les params internes depuis la DB (fallback sur defaults)
    pi_rows = await db.fetch(
        "SELECT action, seuil, deadband FROM params_internes WHERE serre_id = $1",
        serre["id"]
    )
    pi = {r["action"]: {"seuil": float(r["seuil"]), "deadband": float(r["deadband"])} for r in pi_rows}

    DEFAULTS = {
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
    for k, v in DEFAULTS.items():
        pi.setdefault(k, v)

    periode = "jour" if jour else "nuit"

    def calc_vent(t):
        if t is None: return None
        p = pi[f"ventilation_{periode}"]
        if t > p["seuil"]: return "actif"
        if t > p["seuil"] - p["deadband"]: return "neutre"
        return "inactif"

    def calc_chauf(t):
        if t is None: return None
        p = pi[f"chauffage_{periode}"]
        if t < p["seuil"]: return "actif"
        if t < p["seuil"] + p["deadband"]: return "neutre"
        return "inactif"

    def calc_brum(h):
        if h is None: return None
        p = pi[f"humidification_{periode}"]
        if h < p["seuil"]: return "actif"
        if h < p["seuil"] + p["deadband"]: return "neutre"
        return "inactif"

    def calc_dehum(h):
        if h is None: return None
        p = pi[f"deshumidification_{periode}"]
        if h > p["seuil"]: return "actif"
        if h > p["seuil"] - p["deadband"]: return "neutre"
        return "inactif"

    def calc_co2inj(c):
        if c is None or not jour: return None
        p = pi["co2_injection"]
        if c < p["seuil"] - p["deadband"]: return "actif"
        if c < p["seuil"]: return "neutre"
        return "inactif"

    def calc_co2purge(c):
        if c is None or jour: return None
        p = pi["co2_purge"]
        if c > p["seuil"] + p["deadband"]: return "actif"
        if c > p["seuil"]: return "neutre"
        return "inactif"

    etats_maintenant = {
        "ventilation":       (calc_vent(temp),      temp,  pi[f"ventilation_{periode}"]["seuil"]),
        "chauffage":         (calc_chauf(temp),      temp,  pi[f"chauffage_{periode}"]["seuil"]),
        "brumisateur":       (calc_brum(humid),      humid, pi[f"humidification_{periode}"]["seuil"]),
        "deshumidification": (calc_dehum(humid),     humid, pi[f"deshumidification_{periode}"]["seuil"]),
        "co2_injection":     (calc_co2inj(co2),      co2,   pi["co2_injection"]["seuil"]),
        "co2_purge":         (calc_co2purge(co2),    co2,   pi["co2_purge"]["seuil"]),
    }

    # Dernier état enregistré par action (fenêtre 4h pour survivre aux redémarrages)
    derniers = await db.fetch("""
        SELECT DISTINCT ON (action) action, etat
        FROM journal_actions
        WHERE serre_id = $1 AND timestamp > NOW() - INTERVAL '4 hours'
        ORDER BY action, timestamp DESC
    """, serre["id"])
    dernier_etat = {r["action"]: r["etat"] for r in derniers}

    for action, (etat_calc, valeur, seuil_ref) in etats_maintenant.items():
        if etat_calc is None or etat_calc == "neutre":
            continue  # on ne log que les passages francs actif / inactif

        if etat_calc != dernier_etat.get(action):
            try:
                await db.execute("""
                    INSERT INTO journal_actions
                        (serre_id, action, etat, valeur_capteur, seuil_reference, periode)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, serre["id"], action, etat_calc,
                     round(valeur, 2) if valeur is not None else None,
                     round(seuil_ref, 2) if seuil_ref is not None else None,
                     periode)
                print(f"[Journal] {serre['code']} {action}: {dernier_etat.get(action, '?')} -> {etat_calc}")
            except Exception as e:
                print(f"[Journal] ERREUR serre {serre['id']} / {action}: {e}")


async def collect_and_store():
    """Collecte toutes les serres, stocke en DB, vérifie les seuils."""
    print(f"[Scheduler] Collecte IoT — {datetime.now().strftime('%H:%M:%S')}")
    pool = await get_pool()

    async with pool.acquire() as db:
        serres = await db.fetch("SELECT * FROM serres WHERE actif = TRUE")

        for serre in serres:
            serre = dict(serre)

            # ── ENV ──────────────────────────────────────────
            try:
                env = await fetch_env(serre["env_device_id"], serre["env_token"])
                env_valide = env and any(
                    env.get(k) is not None
                    for k in ["temperature", "humidite", "vpd", "co2", "luminosite"]
                )
                if env_valide:
                    raw = env.pop("raw", {})
                    await db.execute("""
                        INSERT INTO mesures_iot
                            (serre_id, type_api, temperature, humidite, vpd, co2, luminosite, raw_data)
                        VALUES ($1, 'ENV', $2, $3, $4, $5, $6, $7)
                    """, serre["id"],
                        env.get("temperature"), env.get("humidite"),
                        env.get("vpd"), env.get("co2"), env.get("luminosite"),
                        json.dumps(raw)
                    )
                    print(f"[Scheduler] ENV serre {serre['code']} sauvegardée")
                    # Détecter et enregistrer les transitions d'état des équipements
                    _h    = datetime.now().hour + datetime.now().minute / 60
                    _jour = 6.5 <= _h <= 19.5
                    await record_journal_transitions(db, serre, env, _jour)
                    for capteur in ["temperature", "humidite", "vpd", "co2"]:
                        val = env.get(capteur)
                        if val is not None:
                            await check_threshold(db, serre, capteur, val)
                else:
                    print(f"[Scheduler] ENV serre {serre['code']} — pas de données valides")
            except Exception as e:
                print(f"[Scheduler] ENV serre {serre['id']}: {e}")

            # ── IRR ──────────────────────────────────────────
            try:
                irr = await fetch_irr(serre["irr_device_id"], serre["irr_token"])
                if irr:
                    raw = irr.pop("raw", {})

                    # Séparer les capteurs chimiques (ph/ec/temp_eau) du niveau d'eau
                    # niveau_eau peut être valide même quand les autres sont à -9999
                    ph        = irr.get("ph")
                    ec        = irr.get("ec")
                    temp_eau  = irr.get("temp_eau")
                    niveau    = irr.get("niveau_eau")

                    chimiques_valides = any(v is not None for v in [ph, ec, temp_eau])
                    niveau_valide     = niveau is not None

                    if chimiques_valides or niveau_valide:
                        await db.execute("""
                            INSERT INTO mesures_iot
                                (serre_id, type_api, ph, ec, temp_eau, niveau_eau, raw_data)
                            VALUES ($1, 'IRR', $2, $3, $4, $5, $6)
                        """, serre["id"], ph, ec, temp_eau, niveau, json.dumps(raw))
                        print(f"[Scheduler] IRR serre {serre['code']} sauvegardée"
                              + ("" if chimiques_valides else " (niveau_eau seulement)"))

                        for capteur, val in [("ph", ph), ("ec", ec), ("niveau_eau", niveau)]:
                            if val is not None:
                                await check_threshold(db, serre, capteur, val)
                    else:
                        print(f"[Scheduler] IRR serre {serre['code']} — aucune donnée valide")
            except Exception as e:
                print(f"[Scheduler] IRR serre {serre['id']}: {e}")

    print(f"[Scheduler] Collecte terminée pour {len(serres)} serres")


async def check_threshold(db, serre: dict, capteur: str, valeur):
    """Vérifie si une valeur dépasse les seuils et envoie une alerte si besoin."""
    if valeur is None:
        return
    try:
        threshold = await db.fetchrow("""
            SELECT * FROM thresholds
            WHERE serre_id = $1 AND capteur = $2 AND actif = TRUE
        """, serre["id"], capteur)

        if not threshold:
            return

        threshold = dict(threshold)
        vmin = threshold.get("valeur_min")
        vmax = threshold.get("valeur_max")
        alerte = False
        msg_fr = msg_en = ""

        if vmin is not None and valeur < vmin:
            alerte = True
            msg_fr = f"{capteur} trop bas : {valeur} (min: {vmin})"
            msg_en = f"{capteur} too low: {valeur} (min: {vmin})"
        elif vmax is not None and valeur > vmax:
            alerte = True
            msg_fr = f"{capteur} trop élevé : {valeur} (max: {vmax})"
            msg_en = f"{capteur} too high: {valeur} (max: {vmax})"

        if alerte:
            recent = await db.fetchrow("""
                SELECT id FROM alertes
                WHERE serre_id = $1 AND capteur = $2
                  AND created_at > NOW() - INTERVAL '10 minutes'
            """, serre["id"], capteur)

            if not recent:
                alerte_id = await db.fetchval("""
                    INSERT INTO alertes
                        (serre_id, capteur, valeur, seuil_min, seuil_max, message_fr, message_en)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                """, serre["id"], capteur, valeur, vmin, vmax, msg_fr, msg_en)

                email = threshold.get("email_alerte")
                if email and alerte_id:
                    sent = await send_alert_email(email, serre["nom_fr"], capteur, valeur, vmin, vmax)
                    if sent:
                        await db.execute(
                            "UPDATE alertes SET email_envoye = TRUE WHERE id = $1",
                            alerte_id
                        )
    except Exception as e:
        print(f"[Threshold] serre {serre['id']} / {capteur}: {e}")


async def start_scheduler():
    cycle = 0
    print("[Scheduler] Démarrage du scheduler IoT")
    while True:
        try:
            await collect_and_store()

            if cycle % 720 == 0 and cycle > 0:
                try:
                    pool = await get_pool()
                    async with pool.acquire() as db:
                        deleted = await db.fetchval("""
                            DELETE FROM mesures_iot
                            WHERE capture_at < NOW() - INTERVAL '90 days'
                            RETURNING count(*)
                        """)
                        print(f"[Cleanup] {deleted or 0} anciennes mesures supprimées")
                except Exception as e:
                    print(f"[Cleanup] Erreur nettoyage: {e}")

            cycle += 1
        except Exception as e:
            print(f"[Scheduler] Erreur cycle {cycle}: {e}")

        await asyncio.sleep(120)
