# email_service.py — utilise Resend API (HTTP) au lieu de SMTP
# Render bloque tous les ports SMTP (25, 465, 587)
import os, random, string, httpx
from datetime import datetime, timedelta

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM     = os.getenv("EMAIL_FROM", "onboarding@resend.dev")

UNITES = {
    "temperature": "°C", "humidite": "%", "vpd": "kPa",
    "ph": "pH", "ec": "mS/cm", "niveau_eau": "m", "co2": "PPM"
}


def generate_verification_code() -> str:
    return ''.join(random.choices(string.digits, k=6))

def get_code_expiry() -> datetime:
    return datetime.utcnow() + timedelta(minutes=30)


async def _send_resend(to_email: str, subject: str, html: str) -> bool:
    """Envoi via Resend API HTTP — contourne le blocage SMTP de Render."""
    if not RESEND_API_KEY:
        print(f"[Email] ❌ RESEND_API_KEY non configurée")
        return False
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from":    f"SDI IAV Hassan II <{EMAIL_FROM}>",
                    "to":      [to_email],
                    "subject": subject,
                    "html":    html,
                }
            )
        if resp.status_code == 200 or resp.status_code == 201:
            print(f"[Email] ✅ Envoyé à {to_email} (Resend id: {resp.json().get('id')})")
            return True
        else:
            print(f"[Email] ❌ Resend erreur {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"[Email] ❌ Exception Resend: {e}")
        return False


async def send_verification_email(to_email: str, code: str, nom: str = "") -> bool:
    print(f"[Email] Envoi code vérification → {to_email}")
    subject = "Votre code de vérification — Serre Digitale IAV"
    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f8f6">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:18px;
              overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#22C55E,#06B6D4);padding:32px 40px">
      <h1 style="color:white;margin:0;font-size:22px">Serre Digitale Intelligente</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">
        AgroBioTech · IAV Hassan II · Rabat
      </p>
    </div>
    <div style="padding:36px 40px">
      <p style="font-size:15px;color:#0c1f17;margin-bottom:8px">
        Bonjour{' ' + nom if nom else ''},
      </p>
      <p style="font-size:14px;color:#33463d;margin-bottom:24px">
        Voici votre code de vérification pour activer votre compte admin :
      </p>
      <div style="background:#f0fdf4;border:2px solid #22C55E;border-radius:14px;
                  padding:28px;text-align:center;margin:0 0 24px">
        <div style="font-family:'Courier New',monospace;font-size:44px;font-weight:700;
                    letter-spacing:14px;color:#2f9a64;line-height:1">
          {code}
        </div>
        <div style="font-size:12px;color:#6b7e75;margin-top:10px">
          Ce code expire dans <strong>30 minutes</strong>
        </div>
      </div>
      <p style="font-size:13px;color:#6b7e75;line-height:1.6">
        Entrez ce code dans le formulaire d'inscription pour valider votre adresse email.<br>
        Si vous n'avez pas demandé ce code, ignorez cet email.
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;
                font-size:11px;color:#9aa8a0;text-align:center">
      Serre Digitale Intelligente · IAV Hassan II · Rabat, Maroc
    </div>
  </div>
</body></html>"""
    return await _send_resend(to_email, subject, html)


async def send_alert_email(
    to_email: str, serre_nom: str, capteur: str,
    valeur: float, seuil_min: float, seuil_max: float
) -> bool:
    print(f"[Email] Envoi alerte {capteur} → {to_email}")
    unite     = UNITES.get(capteur, "")
    direction = "en dessous du minimum" if (seuil_min and valeur < seuil_min) else "au dessus du maximum"
    seuil_val = seuil_min if (seuil_min and valeur < seuil_min) else seuil_max
    subject   = f"Alerte Serre — {serre_nom} — {capteur.capitalize()}"
    html = f"""<html><body style="font-family:Arial,sans-serif;color:#333">
<div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:20px;border-radius:8px;max-width:520px;margin:40px auto">
    <h2 style="color:#15803d">Serre Digitale Intelligente — IAV Hassan II</h2>
    <h3 style="color:#dc2626">Alerte Capteur Détectée</h3>
    <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;font-weight:bold">Serre</td><td>{serre_nom}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold">Capteur</td><td>{capteur.capitalize()}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Valeur</td>
            <td style="color:#dc2626;font-size:1.2em"><b>{valeur} {unite}</b></td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold">Seuil</td>
            <td>{seuil_val} {unite} ({direction})</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Plage autorisée</td>
            <td>{seuil_min} – {seuil_max} {unite}</td></tr>
    </table>
</div>
</body></html>"""
    return await _send_resend(to_email, subject, html)
