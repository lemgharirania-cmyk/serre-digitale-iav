-- ============================================================
--  Géoportail — Serre Digitale Intelligente IAV Hassan II
--  Schema PostgreSQL + PostGIS  |  PFE Rania
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- TABLE : utilisateurs  (doit être créée avant thresholds)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateurs (
    id              SERIAL        PRIMARY KEY,
    nom             VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   DEFAULT 'gerant' CHECK (role IN ('admin', 'gerant')),
    actif           BOOLEAN       DEFAULT TRUE,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    last_login      TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- TABLE : serres
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS serres (
    id              SERIAL        PRIMARY KEY,
    code            VARCHAR(10)   NOT NULL UNIQUE,
    nom_fr          VARCHAR(150)  NOT NULL,
    nom_en          VARCHAR(150)  NOT NULL,
    description_fr  TEXT,
    description_en  TEXT,
    unite           VARCHAR(20),
    surface_m2      FLOAT,
    cultures        TEXT,
    -- Position sur plan schématique (%)
    pos_x           FLOAT         DEFAULT 50.0,
    pos_y           FLOAT         DEFAULT 50.0,
    couleur         VARCHAR(20)   DEFAULT '#86efac',
    -- IoT ENV
    env_device_id   INTEGER,
    env_token       VARCHAR(64),
    -- IoT IRR
    irr_device_id   INTEGER,
    irr_token       VARCHAR(64),
    -- Matterport
    matterport_id   VARCHAR(30),
    matterport_url  TEXT,
    actif           BOOLEAN       DEFAULT TRUE,
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE : mesures_iot
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mesures_iot (
    id              BIGSERIAL     PRIMARY KEY,
    serre_id        INTEGER       NOT NULL REFERENCES serres(id) ON DELETE CASCADE,
    type_api        VARCHAR(5)    NOT NULL CHECK (type_api IN ('ENV', 'IRR')),
    temperature     FLOAT,
    humidite        FLOAT,
    vpd             FLOAT,
    co2             FLOAT,
    luminosite      FLOAT,
    ph              FLOAT,
    ec              FLOAT,
    temp_eau        FLOAT,
    niveau_eau      FLOAT,
    raw_data        JSONB,
    capture_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mesures_serre_time ON mesures_iot (serre_id, capture_at DESC);
CREATE INDEX IF NOT EXISTS idx_mesures_time ON mesures_iot (capture_at DESC);

-- ------------------------------------------------------------
-- TABLE : thresholds
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS thresholds (
    id              SERIAL        PRIMARY KEY,
    serre_id        INTEGER       NOT NULL REFERENCES serres(id) ON DELETE CASCADE,
    capteur         VARCHAR(30)   NOT NULL,
    valeur_min      FLOAT,
    valeur_max      FLOAT,
    email_alerte    VARCHAR(150),
    actif           BOOLEAN       DEFAULT TRUE,
    updated_at      TIMESTAMPTZ   DEFAULT NOW(),
    UNIQUE (serre_id, capteur)
);

-- ------------------------------------------------------------
-- TABLE : alertes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertes (
    id              SERIAL        PRIMARY KEY,
    serre_id        INTEGER       NOT NULL REFERENCES serres(id),
    capteur         VARCHAR(30)   NOT NULL,
    valeur          FLOAT         NOT NULL,
    seuil_min       FLOAT,
    seuil_max       FLOAT,
    message_fr      TEXT,
    message_en      TEXT,
    email_envoye    BOOLEAN       DEFAULT FALSE,
    lu              BOOLEAN       DEFAULT FALSE,
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE : matterport_scenes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matterport_scenes (
    id              SERIAL        PRIMARY KEY,
    nom_fr          VARCHAR(150)  NOT NULL,
    nom_en          VARCHAR(150)  NOT NULL,
    matterport_id   VARCHAR(30)   NOT NULL UNIQUE,
    matterport_url  TEXT,
    serre_id        INTEGER       REFERENCES serres(id),
    type            VARCHAR(20)   DEFAULT 'serre' CHECK (type IN ('serre','couloir','technique','exterieur','merge')),
    actif           BOOLEAN       DEFAULT TRUE,
    ordre           INTEGER       DEFAULT 0
);

-- ------------------------------------------------------------
-- TABLE : medias  (pour Mattertags SDK)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medias (
    id              SERIAL        PRIMARY KEY,
    serre_id        INTEGER       REFERENCES serres(id) ON DELETE CASCADE,
    type            VARCHAR(10)   NOT NULL CHECK (type IN ('photo','video','audio','document')),
    titre_fr        VARCHAR(200),
    titre_en        VARCHAR(200),
    description_fr  TEXT,
    description_en  TEXT,
    url             TEXT          NOT NULL,
    mattertag_sid   VARCHAR(50),
    ordre           INTEGER       DEFAULT 0,
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
--  DONNÉES INITIALES
-- ============================================================

INSERT INTO serres (
    code, nom_fr, nom_en, description_fr, description_en,
    unite, surface_m2, cultures,
    pos_x, pos_y, couleur,
    env_device_id, env_token, irr_device_id, irr_token,
    matterport_id, matterport_url
) VALUES
(
    'S01', 'Génétique & Amélioration des Plantes', 'Plant Genetics & Improvement',
    '[INSÉRER DESCRIPTION UNITÉ 1]', '[INSERT UNIT 1 DESCRIPTION]',
    'Unité 1', NULL, '[INSÉRER CULTURES]',
    38.0, 22.0, '#86efac',
    1685, 'y4vzne2m4v2dxbvp262d7e47kij9ddtx',
    1696, 'y4vzne2m4v2dxbvp262d7e47kij9ddtx',
    'vG3pzqGDsvE', 'https://my.matterport.com/show/?m=vG3pzqGDsvE'
),(
    'S02', 'Horticulture', 'Horticulture',
    '[INSÉRER DESCRIPTION UNITÉ 2]', '[INSERT UNIT 2 DESCRIPTION]',
    'Unité 2', NULL, '[INSÉRER CULTURES]',
    57.0, 22.0, '#6ee7b7',
    1880, 'qdqwz9ki4723gncg0ckl56g01cixy491',
    1881, 'qdqwz9ki4723gncg0ckl56g01cixy491',
    'ewVdkig18XN', 'https://my.matterport.com/show/?m=ewVdkig18XN'
),(
    'S03', 'Agronomie', 'Agronomy',
    '[INSÉRER DESCRIPTION UNITÉ 3]', '[INSERT UNIT 3 DESCRIPTION]',
    'Unité 3', NULL, '[INSÉRER CULTURES]',
    76.0, 22.0, '#34d399',
    1883, 'ajtxwej13koe45a2dj45v2iltfitsfhz',
    1884, 'ajtxwej13koe45a2dj45v2iltfitsfhz',
    'ximB8o6Y7HL', 'https://my.matterport.com/show/?m=ximB8o6Y7HL'
),(
    'S04', 'Hydroponie & Systèmes Innovants', 'Hydroponics & Innovative Systems',
    '[INSÉRER DESCRIPTION UNITÉ 4]', '[INSERT UNIT 4 DESCRIPTION]',
    'Unité 4', NULL, '[INSÉRER CULTURES]',
    76.0, 75.0, '#2dd4bf',
    1879, 'xvvf0j51nmxtauwgik377gphi4mjsjfk',
    1882, 'xvvf0j51nmxtauwgik377gphi4mjsjfk',
    'PMVdAWZFaEn', 'https://my.matterport.com/show/?m=PMVdAWZFaEn'
),(
    'S05', 'Protection des Plantes', 'Plant Protection',
    '[INSÉRER DESCRIPTION UNITÉ 5]', '[INSERT UNIT 5 DESCRIPTION]',
    'Unité 5', NULL, '[INSÉRER CULTURES]',
    57.0, 75.0, '#a3e635',
    1688, 'x9gkn8zev12l9x4iiytl9qradavbdi9a',
    1692, 'x9gkn8zev12l9x4iiytl9qradavbdi9a',
    'nkZ8GQuN2ep', 'https://my.matterport.com/show/?m=nkZ8GQuN2ep'
)
ON CONFLICT (code) DO NOTHING;

-- Tous les scans Matterport
INSERT INTO matterport_scenes (nom_fr, nom_en, matterport_id, matterport_url, serre_id, type, ordre) VALUES
('Vue Complète',            'Full View',                'R1sCgCSGJMQ', 'https://my.matterport.com/show/?m=R1sCgCSGJMQ', NULL, 'merge',     0),
('Extérieur',               'Exterior',                 'XgEA1hS6oGD', 'https://my.matterport.com/show/?m=XgEA1hS6oGD', NULL, 'exterieur', 1),
('Couloir Principal',       'Main Corridor',            'geDWdk2gcB2', 'https://my.matterport.com/show/?m=geDWdk2gcB2', NULL, 'couloir',   2),
('Génétique',               'Genetics',                 'vG3pzqGDsvE', 'https://my.matterport.com/show/?m=vG3pzqGDsvE', 1,    'serre',     3),
('Horticulture',            'Horticulture',             'ewVdkig18XN', 'https://my.matterport.com/show/?m=ewVdkig18XN', 2,    'serre',     4),
('Agronomie',               'Agronomy',                 'ximB8o6Y7HL', 'https://my.matterport.com/show/?m=ximB8o6Y7HL', 3,    'serre',     5),
('Hydroponie',              'Hydroponics',              'PMVdAWZFaEn', 'https://my.matterport.com/show/?m=PMVdAWZFaEn', 4,    'serre',     6),
('Protection des Plantes',  'Plant Protection',         'nkZ8GQuN2ep', 'https://my.matterport.com/show/?m=nkZ8GQuN2ep', 5,    'serre',     7),
('Salle de Lavage',         'Washing Room',             'LVZFUX6t46N', 'https://my.matterport.com/show/?m=LVZFUX6t46N', NULL, 'technique', 8),
('Local Technique',         'Equipment Room',           'op7eKJyN347', 'https://my.matterport.com/show/?m=op7eKJyN347', NULL, 'technique', 9),
('Salle de Commande',       'Control Room',             'hy3jqT45C99', 'https://my.matterport.com/show/?m=hy3jqT45C99', NULL, 'technique', 10),
('Salle de Préparation',    'Preparation Room',         'tg9epaXEhgK', 'https://my.matterport.com/show/?m=tg9epaXEhgK', NULL, 'technique', 11),
('Bloc de Protection',      'Protection Block',         'teWd9VjkgAA', 'https://my.matterport.com/show/?m=teWd9VjkgAA', NULL, 'technique', 12),
('Salle de Fertilisation',  'Fertilization Room',       'Sgqh5fQymzW', 'https://my.matterport.com/show/?m=Sgqh5fQymzW', NULL, 'technique', 13)
ON CONFLICT (matterport_id) DO NOTHING;

-- Admin par défaut  |  mot de passe : Admin2024!  (À changer après déploiement)
INSERT INTO utilisateurs (nom, email, mot_de_passe, role)
VALUES ('Administrateur IAV', 'admin@agrobiotech.ma',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBa.72k19.UifzEr/5YMcLO2', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Thresholds par défaut pour toutes les serres
INSERT INTO thresholds (serre_id, capteur, valeur_min, valeur_max)
SELECT s.id, t.capteur, t.vmin, t.vmax
FROM serres s
CROSS JOIN (VALUES
    ('temperature', 15.0, 35.0),
    ('humidite',    40.0, 90.0),
    ('vpd',          0.4,  2.0),
    ('ph',           5.5,  7.5),
    ('ec',           0.5,  3.5),
    ('niveau_eau',   0.1,  1.0)
) AS t(capteur, vmin, vmax)
ON CONFLICT (serre_id, capteur) DO NOTHING;
