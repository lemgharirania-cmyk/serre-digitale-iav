# iot_service.py — Appels API IoT + conversions
import httpx
import os
from typing import Optional

IOT_BASE_URL = os.getenv("IOT_BASE_URL", "http://guardian.pro-leaf.com:8083/wx/android/behive")

# ─── Règles de conversion ────────────────────────────────────
# L'API retourne les données dans response.data.detail
# Champs ENV : temp ÷10, humid ÷10, vpd ÷100, co2 brut, ppfd brut
# Champs IRR : ph ÷100, ec ÷100, waterTemp ÷10, waterLevel ÷100

def convert_env(raw: dict) -> dict:
    def safe(val, divisor=1):
        try:
            return round(float(val) / divisor, 2) if val is not None else None
        except (TypeError, ValueError):
            return None
    # Les données sont dans raw["detail"] si présent, sinon raw directement
    d = raw.get("detail") or raw
    return {
        "temperature": safe(d.get("temp"),   10),
        "humidite":    safe(d.get("humid"),  10),
        "vpd":         safe(d.get("vpd"),   100),
        "co2":         safe(d.get("co2"),     1),
        "luminosite":  safe(d.get("ppfd"),    1),
    }

def convert_irr(raw: dict) -> dict:
    def safe(val, divisor=1):
        try:
            return round(float(val) / divisor, 2) if val is not None else None
        except (TypeError, ValueError):
            return None
    d = raw.get("detail") or raw
    return {
        "ph":         safe(d.get("ph")        or d.get("phValue"),         100),
        "ec":         safe(d.get("ec")        or d.get("ecValue"),         100),
        "temp_eau":   safe(d.get("waterTemp") or d.get("waterTemperature"), 10),
        "niveau_eau": safe(d.get("waterLevel") or d.get("level"),          100),
    }

async def fetch_env(device_id: int, token: str) -> Optional[dict]:
    url     = f"{IOT_BASE_URL}/detailR"
    headers = {"Authorization": token}
    params  = {"deviceId": device_id}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()
            raw  = data.get("data") or data
            converted = convert_env(raw)
            converted["raw"] = raw.get("detail") or raw
            return converted
    except Exception as e:
        print(f"[IoT ENV] Erreur device {device_id}: {e}")
        return None

async def fetch_irr(device_id: int, token: str) -> Optional[dict]:
    url     = f"{IOT_BASE_URL}/detail"
    headers = {"Authorization": token}
    params  = {"deviceId": device_id}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()
            if data.get("errno") == 418 or data.get("code") == 418:
                print(f"[IoT IRR] Device {device_id}: pas de permission (418)")
                return None
            raw  = data.get("data") or data
            converted = convert_irr(raw)
            converted["raw"] = raw.get("detail") or raw
            return converted
    except Exception as e:
        print(f"[IoT IRR] Erreur device {device_id}: {e}")
        return None

async def fetch_serre_data(serre: dict) -> dict:
    import asyncio
    env_data, irr_data = await asyncio.gather(
        fetch_env(serre["env_device_id"], serre["env_token"]),
        fetch_irr(serre["irr_device_id"], serre["irr_token"]),
    )
    if env_data and any(v is not None for k, v in env_data.items() if k != "raw"):
        statut = "ok"
    elif env_data:
        statut = "partiel"
    else:
        statut = "erreur"
    return {
        "serre_id":      serre["id"],
        "code":          serre["code"],
        "nom_fr":        serre["nom_fr"],
        "nom_en":        serre["nom_en"],
        "couleur":       serre["couleur"],
        "matterport_id": serre["matterport_id"],
        "env":           env_data,
        "irr":           irr_data,
        "statut":        statut,
    }
