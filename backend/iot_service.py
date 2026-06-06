# iot_service.py — Appels API IoT + conversions
import httpx
import os
from typing import Optional

IOT_BASE_URL = os.getenv("IOT_BASE_URL", "http://guardian.pro-leaf.com:8083/wx/android/behive")

def convert_env(raw: dict) -> dict:
    def safe(val, divisor=1):
        try:
            v = float(val)
            if v == -9999:
                return None
            return round(v / divisor, 2)
        except (TypeError, ValueError):
            return None

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
            v = float(val)
            if v == -9999:
                return None
            return round(v / divisor, 2)
        except (TypeError, ValueError):
            return None

    detail = raw.get("detail") or {}
    pool   = detail.get("pool") or []

    tank = None
    for p in pool:
        if p.get("no") == 1:
            tank = p
            break

    if not tank:
        return {"ph": None, "ec": None, "temp_eau": None, "niveau_eau": None}

    return {
        "ph":         safe(tank.get("tankPh"),  100),
        "ec":         safe(tank.get("tankEc"),  100),
        "temp_eau":   safe(tank.get("tankWt"),   10),
        "niveau_eau": safe(tank.get("wl"),       100),
    }


async def fetch_env(device_id: int, token: str) -> Optional[dict]:
    url     = f"{IOT_BASE_URL}/detailR"
    headers = {"Authorization": token}
    params  = {"deviceId": device_id}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers, params=params)

        data = resp.json()

        # FIX: handle error codes BEFORE raise_for_status
        # Pro-Leaf returns 418 / 501 / 200 with errno in body
        errno = data.get("errno") or data.get("code")
        if errno and int(errno) not in (0, 200):
            msg = data.get("msg") or data.get("errmsg") or f"errno {errno}"
            print(f"[IoT ENV] Device {device_id}: {msg} ({errno})")
            return None

        raw       = data.get("data") or data
        converted = convert_env(raw)
        converted["raw"] = raw.get("detail") or raw

        # Check if we actually got valid data
        has_data = any(v is not None for k, v in converted.items() if k != "raw")
        if not has_data:
            print(f"[IoT ENV] Device {device_id}: réponse vide — {data}")
            return None

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

        data = resp.json()

        # Handle error codes
        errno = data.get("errno") or data.get("code")
        if errno and int(errno) not in (0, 200):
            msg = data.get("msg") or data.get("errmsg") or f"errno {errno}"
            print(f"[IoT IRR] Device {device_id}: {msg} ({errno})")
            return None

        raw       = data.get("data") or data
        converted = convert_irr(raw)
        converted["raw"] = raw
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
