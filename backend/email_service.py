# email_service.py
import os, random, string
from datetime import datetime, timedelta
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── Config SMTP ──────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST",     "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER",     "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM    = os.getenv("EMAIL_FROM",    SMTP_USER)

# ── Unités pour alertes capteurs ────────────────────────────
UNITES = {
    "temperature": "°C", "humidite": "%", "vpd": "kPa",
    "ph": "pH", "ec": "mS/cm", "niveau_eau": "m", "co2": "PPM"
}


# ════════════════════════════════════════════════════════════
#  VÉRIFICATION EMAIL — génération du code
# ════════════════════════════════════════════════════════════

def generate_verification_code() -> str:
    """Génère un code numérique à 6 chiffres"""
    return ''.join(random.choices(string.digits, k=6))

def get_code_expiry() -> datetime:
    """Le code expire dans 30 minutes"""
    return datetime.utcnow() + timedelta(minutes=30)


async def send_verification_email(
    to_email: str,
    code: str,
    nom: str = ""
) -> bool:
    """Envoie l'email avec le code de vérification à 6 chiffres"""

    # DEBUG — visible dans les logs Render
    print(f"[Email] DEBUG SMTP_USER='{SMTP_USER}' EMAIL_FROM='{EMAIL_FROM}' TO='{to_email}'")

    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[Email] SMTP non configuré — code non envoyé à {to_email}")
        print(f"[Email] Code de test : {code}")
        return False

    subject = "Votre code de vérification — Serre Digitale IAV"

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
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
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"SDI IAV Hassan II <{EMAIL_FROM}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            use_tls=True,
        )
        print(f"[Email] ✅ Code de vérification envoyé à {to_email}")
        return True
    except Exception as e:
        print(f"[Email] ❌ Erreur envoi vérification: {e}")
        return False


# ════════════════════════════════════════════════════════════
#  ALERTES CAPTEURS
# ════════════════════════════════════════════════════════════

async def send_alert_email(
    to_email: str,
    serre_nom: str,
    capteur: str,
    valeur: float,
    seuil_min: float,
    seuil_max: float
):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[Email] SMTP non configuré — alerte non envoyée pour {serre_nom}")
        return False

    unite     = UNITES.get(capteur, "")
    direction = "en dessous du minimum" if (seuil_min and valeur < seuil_min) else "au dessus du maximum"
    seuil_val = seuil_min if (seuil_min and valeur < seuil_min) else seuil_max

    subject = f"Alerte Serre — {serre_nom} — {capteur.capitalize()}"
    body = f"""<html><body style="font-family:Arial,sans-serif;color:#333">
<div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:20px;border-radius:8px">
    <h2 style="color:#15803d">Serre Digitale Intelligente — IAV Hassan II</h2>
    <h3 style="color:#dc2626">Alerte Capteur Détectée</h3>
    <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;font-weight:bold">Serre</td><td>{serre_nom}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold">Capteur</td><td>{capteur.capitalize()}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Valeur</td><td style="color:#dc2626;font-size:1.2em"><b>{valeur} {unite}</b></td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold">Seuil</td><td>{seuil_val} {unite} ({direction})</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Plage autorisée</td><td>{seuil_min} – {seuil_max} {unite}</td></tr>
    </table>
</div>
</body></html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = EMAIL_FROM
    msg["To"]      = to_email
    msg.attach(MIMEText(body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            use_tls=True,
        )
        print(f"[Email] ✅ Alerte envoyée à {to_email} pour {serre_nom} — {capteur}")
        return True
    except Exception as e:
        print(f"[Email] ❌ Erreur envoi alerte: {e}")
        return False
