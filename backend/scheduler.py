# scheduler.py — Collecte IoT toutes les 2 minutes + vérification seuils
import asyncio
import json
from datetime import datetime
from iot_service import fetch_env, fetch_irr
from email_service import send_alert_email
from database import get_pool

async def collect_and_store():
    """Collecte toutes les serres, stocke en DB, vérifie les seuils."""
    print(f"[Scheduler] 📡 Collecte IoT — {datetime.now().strftime('%H:%M:%S')}")
    pool = await get_pool()

    async with pool.acquire() as db:
        serres = await db.fetch("SELECT * FROM serres WHERE actif = TRUE")

        for serre in serres:
            serre = dict(serre)

            # ── ENV ──────────────────────────────────────────
            try:
                env = await fetch_env(serre["env_device_id"], serre["env_token"])
                if env:
                    raw = env.pop("raw", {})
                    # FIX: supprimé ON CONFLICT DO NOTHING — chaque collecte doit être sauvegardée
                    await db.execute("""
                        INSERT INTO mesures_iot
                            (serre_id, type_api, temperature, humidite, vpd, co2, luminosite, raw_data)
                        VALUES ($1, 'ENV', $2, $3, $4, $5, $6, $7)
                    """, serre["id"],
                        env.get("temperature"), env.get("humidite"),
                        env.get("vpd"), env.get("co2"), env.get("luminosite"),
                        json.dumps(raw)
                    )
                    print(f"[Scheduler] ✅ ENV serre {serre['code']} sauvegardée")
                    for capteur in ["temperature", "humidite", "vpd", "co2"]:
                        val = env.get(capteur)
                        if val is not None:
                            await check_threshold(db, serre, capteur, val)
            except Exception as e:
                print(f"[Scheduler] ❌ ENV serre {serre['id']}: {e}")

            # ── IRR ──────────────────────────────────────────
            try:
                irr = await fetch_irr(serre["irr_device_id"], serre["irr_token"])
                if irr:
                    raw = irr.pop("raw", {})
                    # FIX: supprimé ON CONFLICT DO NOTHING — chaque collecte doit être sauvegardée
                    await db.execute("""
                        INSERT INTO mesures_iot
                            (serre_id, type_api, ph, ec, temp_eau, niveau_eau, raw_data)
                        VALUES ($1, 'IRR', $2, $3, $4, $5, $6)
                    """, serre["id"],
                        irr.get("ph"), irr.get("ec"),
                        irr.get("temp_eau"), irr.get("niveau_eau"),
                        json.dumps(raw)
                    )
                    print(f"[Scheduler] ✅ IRR serre {serre['code']} sauvegardée")
                    for capteur in ["ph", "ec", "niveau_eau"]:
                        val = irr.get(capteur)
                        if val is not None:
                            await check_threshold(db, serre, capteur, val)
            except Exception as e:
                print(f"[Scheduler] ❌ IRR serre {serre['id']}: {e}")

    print(f"[Scheduler] ✅ Collecte terminée pour {len(serres)} serres")


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
            # Anti-spam : pas d'alerte si une alerte existe déjà dans les 10 dernières minutes
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
        print(f"[Threshold] ❌ serre {serre['id']} / {capteur}: {e}")


async def start_scheduler():
    cycle = 0
    print("[Scheduler] 🚀 Démarrage du scheduler IoT")
    while True:
        try:
            await collect_and_store()

            # Nettoyage toutes les 24h (720 cycles × 2 min)
            if cycle % 720 == 0 and cycle > 0:
                try:
                    pool = await get_pool()
                    async with pool.acquire() as db:
                        deleted = await db.fetchval("""
                            DELETE FROM mesures_iot
                            WHERE capture_at < NOW() - INTERVAL '90 days'
                            RETURNING count(*)
                        """)
                        print(f"[Cleanup] 🗑️ {deleted or 0} anciennes mesures supprimées")
                except Exception as e:
                    print(f"[Cleanup] ❌ Erreur nettoyage: {e}")

            cycle += 1
        except Exception as e:
            print(f"[Scheduler] ❌ Erreur cycle {cycle}: {e}")

        await asyncio.sleep(120)
