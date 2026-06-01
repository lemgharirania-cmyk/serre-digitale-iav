# 🌿 Serre Digitale Intelligente — IAV Hassan II

Géoportail web interactif pour le suivi en temps réel des serres du campus AgroBioTech.  
**PFE Ingénieur Géomètre Topographe | IAV Hassan II | 2024–2025**

---

## 🌐 Déploiement Production

| Composant | Service | URL |
|---|---|---|
| Frontend | Vercel | `https://serre-digitale-iav.vercel.app` |
| Backend API | Render | `https://serre-digitale-iav.onrender.com` |
| Base de données | Supabase | PostgreSQL — West EU (Ireland) |

---

## 📁 Structure du projet

```
serre-digitale-iav/
├── backend/                    ← API FastAPI (Python 3.11)
│   ├── main.py                 ← Point d'entrée FastAPI
│   ├── database.py             ← Connexion asyncpg + pool
│   ├── auth.py                 ← JWT + bcrypt
│   ├── scheduler.py            ← Collecte IoT toutes les 2 min
│   ├── iot_service.py          ← Appels API Pro-Leaf
│   ├── email_service.py        ← Alertes email
│   ├── requirements.txt
│   └── routers/
│       ├── auth_router.py      ← /api/auth
│       ├── iot_router.py       ← /api/iot
│       ├── dashboard_router.py ← /api/dashboard
│       └── serres_router.py    ← /api/serres
└── frontend-react/             ← React 19 + Vite + Tailwind
    └── src/
        ├── api/                ← client.js (appels backend)
        ├── components/         ← Composants réutilisables
        ├── pages/              ← Pages de l'application
        ├── hooks/              ← Custom hooks React
        └── App.jsx
```

---

## 🚀 Lancer en local

### Backend
```bash
cd backend
pip install -r requirements.txt

# Créer un fichier .env (ne jamais committer)
cp .env.example .env
# Remplir DATABASE_URL, SECRET_KEY, IOT_BASE_URL

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend-react
npm install
npm run dev
```

API Docs disponibles sur : `http://localhost:8000/api/docs`

---

## 📡 APIs IoT — Pro-Leaf

| Type | Endpoint |
|---|---|
| ENV (température, humidité, VPD...) | `/detailR?deviceId=XXXX` |
| IRR (pH, EC, eau...) | `/detail?deviceId=XXXX` |

Base URL : `http://guardian.pro-leaf.com:8083/wx/android/behive`

Conversions : `température ÷10` · `humidité ÷10` · `pH ÷100` · `EC ÷100` · `VPD ÷100`

---

## 🏗️ Architecture

```
IoT Pro-Leaf API
      ↓ (toutes les 2 min via scheduler)
  Supabase PostgreSQL
      ↓
  FastAPI sur Render
      ↓
  React sur Vercel
```

---

## 🗄️ Base de données

**8 tables principales :**
- `serres` — 5 serres actives (S01–S05)
- `mesures_iot` — données capteurs (ENV + IRR)
- `alertes` — alertes seuils dépassés
- `thresholds` — seuils configurables par serre
- `utilisateurs` — comptes admin/gérant
- `matterport_scenes` — scans 3D Matterport
- `medias` — photos/vidéos associées
- `Table` — (réservé)

**Rétention des données :** 90 jours (nettoyage automatique quotidien)

---

## 🔐 Sécurité

- Authentification JWT (24h expiry)
- Mots de passe hashés bcrypt
- Variables sensibles dans Render Environment Variables
- `.env` jamais commité dans git

---

## 📊 Serres monitoreées

| Code | Nom | Capteurs ENV | Capteurs IRR |
|---|---|---|---|
| S01 | Génétique & Amélioration des Plantes | ✅ | ✅ |
| S02 | Horticulture | ✅ | ✅ |
| S03 | Agronomie | ✅ | ✅ |
| S04 | Hydroponie & Systèmes Innovants | ✅ | ✅ |
| S05 | Protection des Plantes | ✅ | ✅ |