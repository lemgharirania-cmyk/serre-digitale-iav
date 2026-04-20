# email_service.py — Alertes email via SMTP
import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM    = os.getenv("EMAIL_FROM", "serres@agrobiotech.ma")

UNITES = {
    "temperature": "°C", "humidite": "%", "vpd": "kPa",
    "ph": "pH", "ec": "mS/cm", "niveau_eau": "m", "co2": "PPM"
}

async def send_alert_email(to_email: str, serre_nom: str, capteur: str, valeur: float, seuil_min: float, seuil_max: float):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[Email] SMTP non configuré — alerte non envoyée pour {serre_nom}")
        return False

    unite = UNITES.get(capteur, "")
    direction = "en dessous du minimum" if (seuil_min and valeur < seuil_min) else "au dessus du maximum"
    seuil_val = seuil_min if (seuil_min and valeur < seuil_min) else seuil_max

    subject = f"🚨 Alerte Serre — {serre_nom} — {capteur.capitalize()}"
    body = f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="background:#f0fdf4; border-left:4px solid #16a34a; padding:20px; border-radius:8px;">
        <h2 style="color:#15803d;">🌿 Serre Digitale Intelligente — IAV Hassan II</h2>
        <h3 style="color:#dc2626;">⚠️ Alerte Capteur Détectée</h3>
        <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px; font-weight:bold;">Serre</td><td>{serre_nom}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:8px; font-weight:bold;">Capteur</td><td>{capteur.capitalize()}</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">Valeur mesurée</td><td style="color:#dc2626; font-size:1.2em;"><b>{valeur} {unite}</b></td></tr>
            <tr style="background:#f9fafb;"><td style="padding:8px; font-weight:bold;">Seuil</td><td>{seuil_val} {unite} ({direction})</td></tr>
            <tr><td style="padding:8px; font-weight:bold;">Plage autorisée</td><td>{seuil_min} – {seuil_max} {unite}</td></tr>
        </table>
        <p style="margin-top:16px; color:#666; font-size:0.9em;">
            Connectez-vous au dashboard pour gérer les seuils.<br>
            <i>Serre Digitale Intelligente — PFE IAV Hassan II 2024–2025</i>
        </p>
    </div>
    </body></html>
    """

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
            start_tls=True,
        )
        print(f"[Email] ✅ Alerte envoyée à {to_email} pour {serre_nom} — {capteur}")
        return True
    except Exception as e:
        print(f"[Email] ❌ Erreur envoi: {e}")
        return False
