# email_service.py — Brevo API (HTTP) — contourne le blocage SMTP de Render
import os, random, string, httpx
from datetime import datetime, timedelta

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
EMAIL_FROM    = os.getenv("EMAIL_FROM", "kawtarnafia86@gmail.com")
EMAIL_FROM_NAME = "Serre Digitale IAV Hassan II"

UNITES = {
    "temperature": "°C", "humidite": "%", "vpd": "kPa",
    "ph": "pH", "ec": "mS/cm", "niveau_eau": "m", "co2": "PPM"
}


def generate_verification_code() -> str:
    return ''.join(random.choices(string.digits, k=6))

def get_code_expiry() -> datetime:
    return datetime.utcnow() + timedelta(minutes=30)


async def _send_brevo(to_email: str, to_name: str, subject: str, html: str) -> bool:
    """Envoi via Brevo API HTTP — port 443, non bloqué par Render."""
    if not BREVO_API_KEY:
        print(f"[Email] ❌ BREVO_API_KEY non configurée")
        return False
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "sender":   {"name": EMAIL_FROM_NAME, "email": EMAIL_FROM},
                    "to":       [{"email": to_email, "name": to_name}],
                    "subject":  subject,
                    "htmlContent": html,
                }
            )
        if resp.status_code in (200, 201):
            data = resp.json()
            print(f"[Email] ✅ Envoyé à {to_email} (id: {data.get('messageId', '?')})")
            return True
        else:
            print(f"[Email] ❌ Brevo erreur {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"[Email] ❌ Exception Brevo: {e}")
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
    return await _send_brevo(to_email, nom or to_email, subject, html)


async def send_alert_email(
    to_email: str, serre_nom: str, capteur: str,
    valeur: float, seuil_min: float, seuil_max: float
) -> bool:
    print(f"[Email] Envoi alerte {capteur} → {to_email}")
    unite     = UNITES.get(capteur, "")
    direction = "en dessous du minimum" if (seuil_min and valeur < seuil_min) else "au dessus du maximum"
    seuil_val = seuil_min if (seuil_min and valeur < seuil_min) else seuil_max
    subject   = f"⚠️ Alerte Serre — {serre_nom} — {capteur.capitalize()}"
    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f8f6">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:18px;
              overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#DC2626,#EF4444);padding:32px 40px">
      <h1 style="color:white;margin:0;font-size:22px">⚠️ Alerte Capteur</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">
        Serre Digitale Intelligente · IAV Hassan II
      </p>
    </div>
    <div style="padding:36px 40px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="background:#fef2f2">
          <td style="padding:12px;font-weight:600;color:#374151;width:40%">Serre</td>
          <td style="padding:12px;color:#111827">{serre_nom}</td>
        </tr>
        <tr>
          <td style="padding:12px;font-weight:600;color:#374151">Capteur</td>
          <td style="padding:12px;color:#111827">{capteur.capitalize()}</td>
        </tr>
        <tr style="background:#fef2f2">
          <td style="padding:12px;font-weight:600;color:#374151">Valeur mesurée</td>
          <td style="padding:12px;color:#DC2626;font-size:18px;font-weight:700">
            {valeur} {unite}
          </td>
        </tr>
        <tr>
          <td style="padding:12px;font-weight:600;color:#374151">Seuil dépassé</td>
          <td style="padding:12px;color:#374151">{seuil_val} {unite} ({direction})</td>
        </tr>
        <tr style="background:#fef2f2">
          <td style="padding:12px;font-weight:600;color:#374151">Plage normale</td>
          <td style="padding:12px;color:#374151">{seuil_min} – {seuil_max} {unite}</td>
        </tr>
      </table>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;
                font-size:11px;color:#9aa8a0;text-align:center">
      Serre Digitale Intelligente · IAV Hassan II · Rabat, Maroc
    </div>
  </div>
</body></html>"""
    return await _send_brevo(to_email, to_email, subject, html)
