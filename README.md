# 🌿 Serre Digitale Intelligente — IAV Hassan II

Géoportail web interactif pour le campus AgroBioTech.  
PFE Ingénieur Géomètre Topographe | IAV Hassan II | 2024–2025

---

## 🚀 Lancer le projet en local

### Prérequis
- Docker Desktop installé et lancé
- Python 3.11+
- Node.js (optionnel, pour le frontend)

### Étape 1 — Cloner et configurer
```bash
git clone <ton-repo>
cd geoportail
cp .env.example .env
# Édite .env avec tes vraies valeurs
```

### Étape 2 — Lancer la base de données
```bash
docker-compose up db -d
# Attendre ~15 secondes que PostgreSQL démarre
```

### Étape 3 — Lancer le backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Étape 4 — Ouvrir le frontend
Ouvre `frontend/index.html` dans ton navigateur  
ou utilise Live Server dans VS Code.

---

## 📁 Structure du projet

```
geoportail/
├── db/
│   └── schema.sql          ← Schéma base de données
├── backend/
│   ├── main.py             ← API FastAPI
│   ├── routers/            ← Routes par module
│   └── requirements.txt
├── frontend/
│   ├── index.html          ← Page principale
│   ├── css/
│   ├── js/
│   └── dashboard/          ← Interface gérant
├── docker-compose.yml
├── .env                    ← ⚠️ Ne pas committer
└── .gitignore
```

---

## 🌐 Déploiement

| Composant | Service | URL |
|---|---|---|
| Frontend | Vercel | `serre-digitale-iav.vercel.app` |
| Backend | Railway | `api-serre-digitale.railway.app` |
| Base de données | Railway | Interne |

---

## 📡 APIs IoT

Base URL : `http://guardian.pro-leaf.com:8083/wx/android/behive`

- ENV : `/detailR?deviceId=XXXX`
- IRR : `/detail?deviceId=XXXX`

Conversions : température ÷10 · humidité ÷10 · pH ÷100 · EC ÷100 · VPD ÷100
