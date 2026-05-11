"""
AgroBioTech — Manifest Generator
Run once from D:\walkthrough\
Scans all zone folders and generates manifest.json + saves hotspot data

Usage:
    cd D:\walkthrough
    python generate_manifest.py

Output: images/manifest.json
"""

import os, json, glob

ROOT     = os.path.dirname(os.path.abspath(__file__))
IMG_DIR  = os.path.join(ROOT, "images")
OUT_FILE = os.path.join(IMG_DIR, "manifest.json")

ZONES = [
    { "id": "agronomie",              "label": "Agronomie",                  "folder": "Agronomie",                 "color": "#6dbc85", "icon": "🌾", "unit": "S03" },
    { "id": "bloc-protection",        "label": "Bloc Protection des Plantes", "folder": "Bloc protection des plantes","color": "#f0a030", "icon": "🔬", "unit": "BPP" },
    { "id": "couloir-bloc",           "label": "Couloir Bloc Technique",      "folder": "Couloir bloc technique",    "color": "#9aa09a", "icon": "🚪", "unit": "—"   },
    { "id": "couloir-serre",          "label": "Couloir Serre",               "folder": "Couloir serre",             "color": "#9aa09a", "icon": "🚶", "unit": "—"   },
    { "id": "exterieur",              "label": "Extérieur",                   "folder": "Extérieur",                 "color": "#5ba8d8", "icon": "🌿", "unit": "—"   },
    { "id": "genetique",              "label": "Génétique",                   "folder": "Génétique",                 "color": "#6dbc85", "icon": "🧬", "unit": "S01" },
    { "id": "horticulture",           "label": "Horticulture",                "folder": "Horticulture",              "color": "#6dbc85", "icon": "🌸", "unit": "S02" },
    { "id": "hydroponie",             "label": "Hydroponie",                  "folder": "Hydroponie",                "color": "#6dbc85", "icon": "💧", "unit": "S04" },
    { "id": "local-technique",        "label": "Local Technique",             "folder": "Local technique",           "color": "#9aa09a", "icon": "⚙️", "unit": "—"   },
    { "id": "salle-controle",         "label": "Salle de Contrôle",           "folder": "Salle de controle",         "color": "#5ba8d8", "icon": "📡", "unit": "—"   },
    { "id": "salle-fertigation",      "label": "Salle de Fertigation",        "folder": "Salle de fertigation",      "color": "#5ba8d8", "icon": "💊", "unit": "—"   },
    { "id": "salle-lavage",           "label": "Salle de Lavage",             "folder": "Salle de lavage",           "color": "#9aa09a", "icon": "🚿", "unit": "—"   },
    { "id": "salle-preparation",      "label": "Salle de Préparation",        "folder": "Salle de préparation",      "color": "#9aa09a", "icon": "🧪", "unit": "—"   },
    { "id": "unite-protection", "label": "Unité Protection des Plantes", "folder": "Unité Protection des plantes", "color": "#6dbc85", "icon": "🌱", "unit": "S05" },
]

manifest = { "zones": [], "hotspots": {}, "tours": {} }

print(f"Scanning {IMG_DIR}\n")

for zone in ZONES:
    folder_path = os.path.join(IMG_DIR, zone["folder"])
    if not os.path.exists(folder_path):
        print(f"  ⚠ NOT FOUND: {zone['folder']}")
        continue

    # Get all JPGs sorted
    jpgs = sorted([
        f for f in os.listdir(folder_path)
        if f.lower().endswith(('.jpg', '.jpeg')) and not f.startswith('.')
    ])

    scenes = [
        {
            "id":    f"{zone['id']}__{i:03d}",
            "file":  f"images/{zone['folder']}/{jpg}",
            "label": f"{zone['label']} — {i+1}/{len(jpgs)}",
            "zoneId": zone["id"],
        }
        for i, jpg in enumerate(jpgs)
    ]

    zone_entry = {
        "id":     zone["id"],
        "label":  zone["label"],
        "folder": zone["folder"],
        "color":  zone["color"],
        "icon":   zone["icon"],
        "unit":   zone["unit"],
        "scenes": scenes,
    }
    manifest["zones"].append(zone_entry)
    manifest["hotspots"][zone["id"]] = {}  # will be filled by editor

    print(f"  ✓ {zone['label']:35s} {len(jpgs):3d} images")

# Save manifest
with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"\n✅ manifest.json saved → {OUT_FILE}")
print(f"   {len(manifest['zones'])} zones, {sum(len(z['scenes']) for z in manifest['zones'])} scenes total")
print(f"\nNext: open editor.html in your browser (via python -m http.server 8000)")
