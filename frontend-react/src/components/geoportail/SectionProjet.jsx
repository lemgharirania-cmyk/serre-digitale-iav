// src/components/geoportail/SectionProjet.jsx
import { useState, useEffect } from 'react'
import { Leaf, Activity, Thermometer, Shield, X, Wifi, Droplets, Wind, Sun, FlaskConical, Waves, Gauge, Database, Bell, LayoutDashboard, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

// ── Modal content per stat ────────────────────────────────────
const MODALS = {
  serres: {
    titleFr: 'Serres Connectées', titleEn: 'Connected Greenhouses',
    subtitleFr: 'Infrastructure IoT intelligente · 5 unités de recherche',
    subtitleEn: 'Smart IoT infrastructure · 5 research units',
    badgesFr: ['5 serres actives', '10 capteurs', 'Monitoring 24/7'],
    badgesEn: ['5 active greenhouses', '10 sensors', '24/7 monitoring'],
    cards: [
      {
        iconEl: Wifi, color: '#22C55E',
        titleFr: 'Fonction', subtitleFr: 'Infrastructure intelligente',
        textFr: 'Serres équipées de systèmes IoT permettant le monitoring climatique, l\'irrigation automatisée et la supervision environnementale en temps réel.',
        titleEn: 'Function', subtitleEn: 'Smart infrastructure',
        textEn: 'Greenhouses equipped with IoT systems enabling climate monitoring, automated irrigation and real-time environmental supervision.',
        tagsFr: ['IoT', 'Monitoring', 'Temps réel'], tagsEn: ['IoT', 'Monitoring', 'Real-time'],
      },
      {
        iconEl: Thermometer, color: '#F59E0B',
        titleFr: 'Paramètres suivis', subtitleFr: 'Paramètres agronomiques',
        textFr: 'Température (T°) · Humidité relative (HR%) · Déficit de Pression de Vapeur (VPD) · Dioxyde de carbone (CO₂) · Luminosité (PPFD) · Potentiel hydrogène (pH) · Conductivité Électrique (EC) · Température eau (T°eau) · Niveau eau (Niv.).',
        titleEn: 'Monitored parameters', subtitleEn: 'Agronomic parameters',
        textEn: 'Temperature (T°) · Relative Humidity (RH%) · Vapour Pressure Deficit (VPD) · Carbon dioxide (CO₂) · Light intensity (PPFD) · Hydrogen potential (pH) · Electrical Conductivity (EC) · Water temperature (T°water) · Water level (Level).',
        tagsFr: ['ENV', 'IRR', '8 paramètres'], tagsEn: ['ENV', 'IRR', '8 parameters'],
      },
      {
        iconEl: Gauge, color: '#8B5CF6',
        titleFr: 'Pilotage', subtitleFr: 'Gestion automatisée',
        textFr: 'Les systèmes de contrôle permettent le pilotage du climat, de la fertigation, de la ventilation et des besoins hydriques selon les conditions de culture.',
        titleEn: 'Control', subtitleEn: 'Automated management',
        textEn: 'Control systems allow management of climate, fertigation, ventilation and water needs according to cultivation conditions.',
        tagsFr: ['Automatisation', 'Fertigation', 'Ventilation'], tagsEn: ['Automation', 'Fertigation', 'Ventilation'],
      },
      {
        iconEl: Globe, color: '#06B6D4',
        titleFr: 'Jumeau numérique', subtitleFr: 'Visualisation interactive',
        textFr: 'Les données collectées sont intégrées au jumeau numérique afin de faciliter la surveillance, l\'analyse et l\'interprétation des conditions environnementales.',
        titleEn: 'Digital twin', subtitleEn: 'Interactive visualization',
        textEn: 'Collected data is integrated into the digital twin to facilitate monitoring, analysis and interpretation of environmental conditions.',
        tagsFr: ['Digital Twin', '3D', 'Géoportail'], tagsEn: ['Digital Twin', '3D', 'Geoportal'],
      },
    ],
  },
  capteurs: {
    titleFr: 'Capteurs Actifs', titleEn: 'Active Sensors',
    subtitleFr: 'Modules multi-capteurs · Environnement & Irrigation',
    subtitleEn: 'Multi-sensor modules · Environment & Irrigation',
    badgesFr: ['10 capteurs', '2 types', 'Pro-Leaf IoT'],
    badgesEn: ['10 sensors', '2 types', 'Pro-Leaf IoT'],
    cards: [
      {
        iconEl: Wind, color: '#22C55E',
        titleFr: 'Multi-capteurs environnementaux', subtitleFr: 'Modules ENV',
        textFr: 'Chaque serre dispose d\'un module multi-capteurs mesurant simultanément la Température (T°), l\'Humidité relative (HR%), le Déficit de Pression de Vapeur (VPD), le Dioxyde de carbone (CO₂) et la Luminosité (PPFD).',
        titleEn: 'Environmental multi-sensors', subtitleEn: 'ENV modules',
        textEn: 'Each greenhouse has a multi-sensor module measuring simultaneously Temperature (T°), Relative Humidity (RH%), Vapour Pressure Deficit (VPD), Carbon Dioxide (CO₂) and Light intensity (PPFD).',
        tagsFr: ['T°', 'HR%', 'VPD', 'CO₂', 'PPFD'], tagsEn: ['T°', 'RH%', 'VPD', 'CO₂', 'PPFD'],
      },
      {
        iconEl: Droplets, color: '#06B6D4',
        titleFr: 'Monitoring irrigation', subtitleFr: 'Modules IRR',
        textFr: 'Les systèmes de fertigation assurent le suivi du Potentiel Hydrogène (pH), de la Conductivité Électrique (EC), de la Température de l\'eau (T°eau) et du Niveau des réservoirs (Niv.).',
        titleEn: 'Irrigation monitoring', subtitleEn: 'IRR modules',
        textEn: 'Fertigation systems monitor Hydrogen Potential (pH), Electrical Conductivity (EC), Water Temperature (T°water) and Tank Level (Level).',
        tagsFr: ['pH', 'EC', 'T°eau', 'Niveau'], tagsEn: ['pH', 'EC', 'T°water', 'Level'],
      },
      {
        iconEl: Wifi, color: '#F59E0B',
        titleFr: 'Communication IoT', subtitleFr: 'Transmission des données',
        textFr: 'Les mesures sont collectées automatiquement via l\'infrastructure IoT Pro-Leaf et synchronisées avec le géoportail à intervalles réguliers.',
        titleEn: 'IoT communication', subtitleEn: 'Data transmission',
        textEn: 'Measurements are automatically collected via the Pro-Leaf IoT infrastructure and synchronized with the geoportal at regular intervals.',
        tagsFr: ['Pro-Leaf', 'API REST', 'Automatique'], tagsEn: ['Pro-Leaf', 'REST API', 'Automatic'],
      },
      {
        iconEl: Database, color: '#8B5CF6',
        titleFr: 'Historisation', subtitleFr: 'Base de données',
        textFr: 'Les données environnementales sont archivées afin de permettre le suivi historique, l\'analyse des variations et la visualisation graphique.',
        titleEn: 'Historization', subtitleEn: 'Database',
        textEn: 'Environmental data is archived to enable historical monitoring, variation analysis and graphical visualization.',
        tagsFr: ['PostgreSQL', 'Historique', 'Graphiques'], tagsEn: ['PostgreSQL', 'History', 'Charts'],
      },
    ],
  },
  mesures: {
    titleFr: 'Mesures Collectées', titleEn: 'Collected Measures',
    subtitleFr: 'Acquisition continue · ~3 600 mesures/jour',
    subtitleEn: 'Continuous acquisition · ~3,600 measures/day',
    badgesFr: ['Toutes les 2 min', '8 paramètres', '5 serres'],
    badgesEn: ['Every 2 min', '8 parameters', '5 greenhouses'],
    cards: [
      {
        iconEl: Activity, color: '#F59E0B',
        titleFr: 'Fréquence', subtitleFr: 'Acquisition continue',
        textFr: 'Les paramètres environnementaux sont enregistrés automatiquement toutes les 2 minutes pour chaque serre, garantissant un suivi précis et continu.',
        titleEn: 'Frequency', subtitleEn: 'Continuous acquisition',
        textEn: 'Environmental parameters are automatically recorded every 2 minutes for each greenhouse, ensuring precise and continuous monitoring.',
        tagsFr: ['2 min', 'Automatique', '24h/24'], tagsEn: ['2 min', 'Automatic', '24/7'],
      },
      {
        iconEl: Gauge, color: '#22C55E',
        titleFr: 'Volume quotidien', subtitleFr: 'Données générées',
        textFr: 'Le système produit plusieurs milliers de mesures par jour, permettant un suivi détaillé et granulaire des conditions de culture dans chaque unité.',
        titleEn: 'Daily volume', subtitleEn: 'Generated data',
        textEn: 'The system produces thousands of measurements per day, enabling detailed and granular monitoring of cultivation conditions in each unit.',
        tagsFr: ['~720/serre/jour', '~3 600 total', 'Granulaire'], tagsEn: ['~720/greenhouse/day', '~3,600 total', 'Granular'],
      },
      {
        iconEl: FlaskConical, color: '#06B6D4',
        titleFr: 'Analyse temporelle', subtitleFr: 'Historique des variations',
        textFr: 'Les données archivées permettent de visualiser l\'évolution des paramètres climatiques (Température, Humidité, VPD, CO₂) et des conditions d\'irrigation (pH, EC) dans le temps.',
        titleEn: 'Temporal analysis', subtitleEn: 'Variation history',
        textEn: 'Archived data allows visualization of the evolution of climate parameters (Temperature, Humidity, VPD, CO₂) and irrigation conditions (pH, EC) over time.',
        tagsFr: ['Tendances', 'Zoom', 'Historique'], tagsEn: ['Trends', 'Zoom', 'History'],
      },
      {
        iconEl: Bell, color: '#8B5CF6',
        titleFr: 'Exploitation', subtitleFr: 'Aide au monitoring',
        textFr: 'Les mesures servent à détecter les anomalies, comparer les conditions de culture inter-serres et améliorer la supervision agronomique globale.',
        titleEn: 'Exploitation', subtitleEn: 'Monitoring support',
        textEn: 'Measurements are used to detect anomalies, compare inter-greenhouse cultivation conditions and improve overall agronomic supervision.',
        tagsFr: ['Anomalies', 'Comparaison', 'Supervision'], tagsEn: ['Anomalies', 'Comparison', 'Supervision'],
      },
    ],
  },
  monitoring: {
    titleFr: 'Monitoring 24h/24 · 7j/7', titleEn: '24/7 Continuous Monitoring',
    subtitleFr: 'Surveillance automatisée · Alertes · Dashboard',
    subtitleEn: 'Automated surveillance · Alerts · Dashboard',
    badgesFr: ['Temps réel', 'Alertes auto', 'Accès web'],
    badgesEn: ['Real-time', 'Auto alerts', 'Web access'],
    cards: [
      {
        iconEl: Activity, color: '#22C55E',
        titleFr: 'Surveillance continue', subtitleFr: 'Monitoring temps réel',
        textFr: 'Le système assure une surveillance continue des paramètres environnementaux (Température, Humidité relative, VPD, CO₂, pH, EC) sans intervention manuelle.',
        titleEn: 'Continuous surveillance', subtitleEn: 'Real-time monitoring',
        textEn: 'The system ensures continuous monitoring of environmental parameters (Temperature, Relative Humidity, VPD, CO₂, pH, EC) without manual intervention.',
        tagsFr: ['Automatique', 'Continu', 'Sans interruption'], tagsEn: ['Automatic', 'Continuous', 'Uninterrupted'],
      },
      {
        iconEl: Bell, color: '#EF4444',
        titleFr: 'Alertes intelligentes', subtitleFr: 'Détection d\'anomalies',
        textFr: 'Des seuils agronomiques peuvent être définis afin de générer des alertes automatiques par email lorsque certaines conditions dépassent les limites configurées.',
        titleEn: 'Smart alerts', subtitleEn: 'Anomaly detection',
        textEn: 'Agronomic thresholds can be configured to generate automatic email alerts when certain conditions exceed the defined limits.',
        tagsFr: ['Seuils', 'Email', 'Automatique'], tagsEn: ['Thresholds', 'Email', 'Automatic'],
      },
      {
        iconEl: LayoutDashboard, color: '#06B6D4',
        titleFr: 'Interface administrateur', subtitleFr: 'Dashboard de supervision',
        textFr: 'Le géoportail permet aux responsables de consulter les données, les graphiques historiques, les alertes actives et les historiques de mesures via une interface dédiée.',
        titleEn: 'Admin interface', subtitleEn: 'Supervision dashboard',
        textEn: 'The geoportal allows managers to consult data, historical charts, active alerts and measurement histories via a dedicated interface.',
        tagsFr: ['Graphiques', 'Alertes', 'Export'], tagsEn: ['Charts', 'Alerts', 'Export'],
      },
      {
        iconEl: Globe, color: '#8B5CF6',
        titleFr: 'Accessibilité', subtitleFr: 'Plateforme web interactive',
        textFr: 'Les informations du jumeau numérique sont accessibles depuis une interface web immersive dédiée au monitoring des serres intelligentes, sans installation requise.',
        titleEn: 'Accessibility', subtitleEn: 'Interactive web platform',
        textEn: 'Digital twin information is accessible from an immersive web interface dedicated to smart greenhouse monitoring, with no installation required.',
        tagsFr: ['Web', 'Immersif', 'Multi-device'], tagsEn: ['Web', 'Immersive', 'Multi-device'],
      },
    ],
  },
}

// ── Side Panel Modal ──────────────────────────────────────────
function StatModal({ statKey, lang, darkMode, onClose, accentColor }) {
  const d = MODALS[statKey]
  if (!d) return null
  const title    = lang === 'fr' ? d.titleFr    : d.titleEn
  const subtitle = lang === 'fr' ? d.subtitleFr : d.subtitleEn
  const badges   = lang === 'fr' ? d.badgesFr   : d.badgesEn

  const panelBg  = darkMode
    ? 'linear-gradient(160deg, #0D1F38 0%, #0A1828 50%, #0C1E32 100%)'
    : '#FFFFFF'
  const cardBg   = darkMode ? 'rgba(255,255,255,0.04)' : '#F9FAFB'
  const cardBord = darkMode ? 'rgba(255,255,255,0.07)' : '#E5E7EB'
  const textMain = darkMode ? '#F0F6FF' : '#111827'
  const textSub  = darkMode ? '#7A9AB8' : '#6B7280'
  const textBody = darkMode ? '#B8CEDE' : '#4B5563'
  const tagBg    = darkMode ? `${accentColor}14` : '#ECFDF5'
  const tagColor = darkMode ? accentColor : '#16A34A'

  // Close on Escape key
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop — semi-transparent, click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(4px)',
          animation: 'backdropFadeIn 0.25s ease',
        }}
      />

      {/* Side panel — slides in from right */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1000,
        width: '420px', maxWidth: '90vw',
        background: panelBg,
        backdropFilter: 'blur(20px)',
        borderLeft: darkMode
          ? `1px solid rgba(34,197,94,0.12)`
          : '1px solid rgba(0,0,0,0.1)',
        boxShadow: darkMode
          ? '-24px 0 80px rgba(0,0,0,0.55), -2px 0 0 rgba(34,197,94,0.08)'
          : '-24px 0 60px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
        animation: 'panelSlideIn 0.3s cubic-bezier(0.32,0.72,0,1)',
        overflowY: 'auto',
      }}>

        {/* Decorative top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: `linear-gradient(90deg, transparent, ${accentColor}60, ${accentColor}, ${accentColor}60, transparent)`,
          pointerEvents: 'none',
        }} />

        {/* Ambient glow orb */}
        {darkMode && (
          <div style={{
            position: 'absolute', top: '80px', right: '-40px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
            filter: 'blur(30px)', pointerEvents: 'none',
          }} />
        )}

        <div style={{ padding: '28px 24px', position: 'relative', flex: 1 }}>

          {/* Panel header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div style={{ flex: 1, paddingRight: '12px' }}>
              <div style={{
                fontSize: '22px', fontWeight: 800, color: textMain,
                lineHeight: 1.2, fontFamily: "'Outfit',sans-serif",
                letterSpacing: '-0.03em',
              }}>
                {title}
              </div>
              <div style={{ fontSize: '13px', color: textSub, marginTop: '5px', fontWeight: 500 }}>{subtitle}</div>
            </div>
            <button onClick={onClose} style={{
              width: '38px', height: '38px', borderRadius: '12px', border: 'none', flexShrink: 0,
              background: darkMode ? 'rgba(255,255,255,0.07)' : '#F3F4F6',
              color: textSub, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: '0.2s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.12)' : '#E5E7EB'
                e.currentTarget.style.color = darkMode ? '#F0F6FF' : '#111827'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.07)' : '#F3F4F6'
                e.currentTarget.style.color = textSub
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {badges.map((b, i) => (
              <span key={i} style={{
                background: tagBg, color: tagColor,
                border: `1px solid ${accentColor}28`,
                padding: '5px 12px', borderRadius: '999px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em',
              }}>{b}</span>
            ))}
          </div>

          {/* Divider */}
          <div style={{
            height: '1px', marginBottom: '18px',
            background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          }} />

          {/* Cards — vertical stack (better for narrow panel) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {d.cards.map((card, i) => {
            const Icon = card.iconEl
            const cardTitle = lang === 'fr' ? card.titleFr    : card.titleEn
            const cardSub   = lang === 'fr' ? card.subtitleFr : card.subtitleEn
            const cardText  = lang === 'fr' ? card.textFr     : card.textEn
            const cardTags  = lang === 'fr' ? card.tagsFr     : card.tagsEn

            return (
              <div key={i} style={{
                background: cardBg,
                border: `1px solid ${cardBord}`,
                borderRadius: '20px', padding: '18px 20px',
                transition: '0.25s ease',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform   = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = card.color + '60'
                  e.currentTarget.style.boxShadow   = `0 10px 25px ${card.color}15`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform   = 'translateY(0)'
                  e.currentTarget.style.borderColor = cardBord
                  e.currentTarget.style.boxShadow   = 'none'
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '14px', flexShrink: 0,
                    background: `${card.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={card.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: card.color }}>{cardTitle}</div>
                    <div style={{ fontSize: '12px', color: textSub, marginTop: '1px' }}>{cardSub}</div>
                  </div>
                </div>
                {/* Text */}
                <div style={{ fontSize: '13px', lineHeight: 1.7, color: textBody }}>{cardText}</div>
                {/* Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {cardTags.map((t, j) => (
                    <span key={j} style={{
                      background: `${card.color}12`, color: card.color,
                      border: `1px solid ${card.color}25`,
                      padding: '3px 9px', borderRadius: '999px',
                      fontSize: '11px', fontWeight: 600,
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            )
          })}
          </div>
        </div>
        </div>

      <style>{`
        @keyframes panelSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes backdropFadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  )
}

// ── Stat bubble ───────────────────────────────────────────────
function StatBubble({ statKey, icon: Icon, value, label, color, darkMode, index, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), index * 150); return () => clearTimeout(t) }, [index])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: darkMode ? (hovered ? `${color}18` : '#101B2E') : (hovered ? `${color}08` : '#FFFFFF'),
        border: `1px solid ${hovered ? color + '50' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
        borderRadius: '20px', padding: '22px 20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        boxShadow: hovered
          ? `0 16px 48px ${color}25, 0 0 0 1px ${color}20`
          : darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)',
        transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
        transform: mounted ? (hovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0)') : 'translateY(20px)',
        opacity: mounted ? 1 : 0,
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: '50px', height: '50px', borderRadius: '14px', flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hovered ? `0 0 20px ${color}30` : 'none',
        transition: 'all 0.6s ease',
      }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, color, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: darkMode ? '#64748B' : '#94A3B8', marginTop: '4px', fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <div style={{ width: '3px', height: '40px', borderRadius: '2px', background: `linear-gradient(to bottom, ${color}, transparent)` }} />
        <div style={{ fontSize: '10px', color: hovered ? color : (darkMode ? '#64748B' : '#CBD5E1'), fontWeight: 700, letterSpacing: '0.06em', transition: 'color 0.3s' }}>
          {hovered ? 'INFO ▸' : '···'}
        </div>
      </div>
    </div>
  )
}



// ── SloganCard ────────────────────────────────────────────────
const SLOGAN_CONTENT = {
  fr: {
    line1:  'Chaque plante raconte',
    accent: 'son histoire.',
    line2:  'Nous la rendons visible.',
    pills:  ['IoT', 'Jumeau Numérique', 'VR'],
    footer: 'Serre Digitale Intelligente · IAV Hassan II · AgroBioTech · 2025–2026',
  },
  en: {
    line1:  'Every plant tells',
    accent: 'its story.',
    line2:  'We make it visible.',
    pills:  ['IoT', 'Digital Twin', 'VR'],
    footer: 'Smart Digital Greenhouse · IAV Hassan II · AgroBioTech · 2025–2026',
  },
}

const SLOGAN_THEME = {
  dark: {
    cardBg:      'linear-gradient(160deg, #060d1a 0%, #07111f 50%, #050e1b 100%)',
    cardBorder:  'rgba(34,197,94,0.14)',
    cardShadow:  '0 0 0 1px rgba(34,197,94,0.06), 0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
    titleColor:  '#f8fafc',
    line2Color:  '#e2e8f0',
    pillColor:   'rgba(148,163,184,0.85)',
    footerColor: 'rgba(100,116,139,0.8)',
    titleShadow: '0 0 40px rgba(34,197,94,0.18), 0 2px 40px rgba(0,0,0,0.4)',
    badgeBg:     'rgba(34,197,94,0.10)',
    badgeBorder: 'rgba(34,197,94,0.28)',
    badgeShadow: '0 0 20px rgba(34,197,94,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
    badgeText:   '#4ade80',
    radialFg:    'rgba(34,197,94,0.12)',
    radialMid:   'rgba(34,197,94,0.05)',
    dividerColor:'rgba(34,197,94,0.55)',
    orbOpacity:  ['0.06','0.05','0.04'],
    particleMax: 0.7,
  },
  light: {
    cardBg:      'linear-gradient(160deg, #f0fff4 0%, #ffffff 50%, #f0fdf4 100%)',
    cardBorder:  'rgba(34,197,94,0.22)',
    cardShadow:  '0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(34,197,94,0.08)',
    titleColor:  '#0f172a',
    line2Color:  '#1e293b',
    pillColor:   '#64748b',
    footerColor: '#94a3b8',
    titleShadow: '0 2px 20px rgba(34,197,94,0.10)',
    badgeBg:     '#ecfdf5',
    badgeBorder: 'rgba(34,197,94,0.30)',
    badgeShadow: '0 0 12px rgba(34,197,94,0.06)',
    badgeText:   '#16a34a',
    radialFg:    'rgba(34,197,94,0.07)',
    radialMid:   'rgba(34,197,94,0.03)',
    dividerColor:'rgba(34,197,94,0.40)',
    orbOpacity:  ['0.04','0.03','0.02'],
    particleMax: 0.4,
  },
}

// Pure CSS particles — no JS loop, no Framer Motion, GPU-only via transform+opacity
// Each particle uses a unique @keyframes name to allow different drift paths
function SloganParticles({ darkMode }) {
  const max = darkMode ? 0.7 : 0.4
  const particles = [
    { id: 'p1', size: 20, duration: 11, delay: 0,   left: 'calc(50% - 8vw)', blur: 8  },
    { id: 'p2', size: 14, duration: 14, delay: -4,  left: 'calc(50% + 8vw)', blur: 6  },
    { id: 'p3', size: 17, duration: 9,  delay: -6,  left: 'calc(50% - 2vw)', blur: 7  },
  ]
  return (
    <>
      <style>{`
        @keyframes particleRise1 {
          0%   { transform: translateY(110%) translateX(0px);   opacity: 0; }
          10%  { opacity: ${max}; }
          80%  { opacity: ${max}; }
          100% { transform: translateY(-110%) translateX(18px); opacity: 0; }
        }
        @keyframes particleRise2 {
          0%   { transform: translateY(110%) translateX(0px);    opacity: 0; }
          10%  { opacity: ${max}; }
          80%  { opacity: ${max}; }
          100% { transform: translateY(-110%) translateX(-14px); opacity: 0; }
        }
        @keyframes particleRise3 {
          0%   { transform: translateY(110%) translateX(0px);   opacity: 0; }
          10%  { opacity: ${max}; }
          80%  { opacity: ${max}; }
          100% { transform: translateY(-110%) translateX(10px); opacity: 0; }
        }
      `}</style>
      {particles.map(({ id, size, duration, delay, left, blur }, idx) => (
        <div
          key={id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left,
            bottom: 0,
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(74,222,128,0.9) 0%, rgba(34,197,94,0.5) 40%, transparent 70%)',
            filter: `blur(${blur}px)`,
            boxShadow: `0 0 ${size * 1.2}px ${size * 0.5}px rgba(34,197,94,0.22)`,
            animation: `particleRise${idx + 1} ${duration}s ${delay}s ease-in-out infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </>
  )
}

function SloganCard({ lang = 'fr', darkMode = true }) {
  const c = SLOGAN_CONTENT[lang] ?? SLOGAN_CONTENT.fr
  const t = darkMode ? SLOGAN_THEME.dark : SLOGAN_THEME.light

  return (
    <>
      <style>{`
        @keyframes sloganPing { 75%,100% { transform:scale(2); opacity:0; } }
      `}</style>

      <motion.div
        key={darkMode ? 'dark' : 'light'}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: '28px',
          border: `1px solid ${t.cardBorder}`,
          background: t.cardBg, boxShadow: t.cardShadow,
          padding: '4rem 2.5rem',
        }}
      >
        {/* Radial glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at 50% 55%, ${t.radialFg} 0%, ${t.radialMid} 30%, transparent 70%)`,
        }} />

        {/* Ambient orbs */}
        {[
          { style: { top: '-80px', left: '10%' },    size: '260px', i: 0 },
          { style: { bottom: '-60px', right: '8%' }, size: '220px', i: 1 },
          { style: { top: '30%', right: '-40px' },   size: '180px', i: 2 },
        ].map(({ style, size, i }) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
            width: size, height: size,
            background: `radial-gradient(circle, rgba(34,197,94,${t.orbOpacity[i]}) 0%, transparent 70%)`,
            filter: 'blur(80px)', ...style,
          }} />
        ))}

        {/* Particles — pure CSS, no JS loop */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <SloganParticles darkMode={darkMode} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              borderRadius: '999px', padding: '6px 16px',
              background: t.badgeBg, border: `1px solid ${t.badgeBorder}`,
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              boxShadow: t.badgeShadow,
            }}
          >
            <span style={{ position: 'relative', display: 'flex', width: '7px', height: '7px' }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', opacity: 0.75, animation: 'sloganPing 2s cubic-bezier(0,0,0.2,1) infinite' }} />
              <span style={{ position: 'relative', width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block' }} />
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: t.badgeText, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
              LIVE DIGITAL TWIN
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
              fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.04em',
              color: t.titleColor, textShadow: t.titleShadow, margin: 0,
            }}
          >
            {c.line1}{' '}
            <span style={{
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.35))',
            }}>{c.accent}</span>
            <br />
            <span style={{ color: t.line2Color, fontWeight: 700 }}>{c.line2}</span>
          </motion.h2>

          {/* Pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}
          >
            {c.pills.map((pill, i) => (
              <span key={pill} style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', color: t.pillColor, textTransform: 'uppercase' }}>
                {pill}{i < c.pills.length - 1 && <span style={{ marginLeft: '12px', color: 'rgba(34,197,94,0.4)' }}>·</span>}
              </span>
            ))}
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'center', width: '100%', maxWidth: '280px' }}
          >
            <div style={{ height: '1px', background: `linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.25) 20%, ${t.dividerColor} 50%, rgba(34,197,94,0.25) 80%, transparent 100%)` }} />
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontSize: '11px', fontWeight: 500, color: t.footerColor, letterSpacing: '0.06em', margin: 0 }}
          >
            {c.footer}
          </motion.p>
        </div>
      </motion.div>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function SectionProjet({ lang, stats, darkMode }) {
  const [openModal,  setOpenModal]  = useState(null)
  const [openColor,  setOpenColor]  = useState('#22C55E')
  const [expanded,   setExpanded]   = useState(false)   // ← text expand state

  const T = {
    fr: {
      badge: 'Notre Projet · PFE 2025–2026', title1: 'Serre Digitale', title2: 'Intelligente',
      p1: "Ce travail s'inscrit dans le domaine de l'agriculture intelligente et porte sur l'utilisation du concept de jumeau numérique pour la surveillance et le monitoring des serres agricoles. L'objectif principal est de développer un géoportail interactif permettant de centraliser, visualiser et exploiter les données environnementales issues des systèmes de culture sous serre. À travers une représentation numérique immersive associée aux données collectées en temps réel, le projet vise à améliorer la compréhension du fonctionnement des serres, à faciliter l'interprétation des informations agronomiques et à renforcer les capacités de suivi des conditions environnementales.",
      p2: "L'approche adoptée repose sur l'intégration de plusieurs technologies complémentaires, notamment l'Internet des Objets (IoT), les systèmes de monitoring en temps réel, la visualisation 3D immersive et les outils de gestion géospatiale. Les données issues des capteurs environnementaux sont collectées, transmises et intégrées dans un jumeau numérique permettant de représenter de manière dynamique l'état des installations et des paramètres de culture. Le géoportail développé permet ainsi d'offrir une interface interactive destinée à la consultation, à la visualisation et à l'analyse des données, tout en facilitant le suivi des conditions optimales de fonctionnement et l'aide à la décision dans un contexte de serre intelligente.",
    },
    en: {
      badge: 'Our Project · Final Year 2025–2026', title1: 'Smart Digital', title2: 'Greenhouse',
      p1: "This work falls within the field of smart agriculture and focuses on the use of the digital twin concept for the monitoring and surveillance of agricultural greenhouses. The main objective is to develop an interactive geoportal enabling the centralization, visualization and exploitation of environmental data from greenhouse cultivation systems. Through an immersive digital representation combined with real-time collected data, the project aims to improve the understanding of greenhouse operations, facilitate the interpretation of agronomic information and enhance environmental monitoring capabilities.",
      p2: "The adopted approach is based on the integration of several complementary technologies, including the Internet of Things (IoT), real-time monitoring systems, immersive 3D visualization and geospatial management tools. Data from environmental sensors is collected, transmitted and integrated into a digital twin enabling dynamic representation of facility status and cultivation parameters. The developed geoportal thus provides an interactive interface for data consultation, visualization and analysis, while facilitating the monitoring of optimal operating conditions and decision-making support in a smart greenhouse context.",
    }
  }[lang]

  const mesures24h = stats?.mesures_24h ? (Math.round(stats.mesures_24h/100)*100).toLocaleString() : '—'

  const STATS = [
    { key:'serres',    icon:Leaf,        value:'5',        color:'#22C55E', label: lang==='fr' ? 'Serres connectées'   : 'Connected greenhouses' },
    { key:'capteurs',  icon:Activity,    value:'10',       color:'#06B6D4', label: lang==='fr' ? 'Capteurs actifs'     : 'Active sensors' },
    { key:'mesures',   icon:Thermometer, value:mesures24h, color:'#F59E0B', label: lang==='fr' ? "Mesures aujourd'hui" : 'Measures today' },
    { key:'monitoring',icon:Shield,      value:'24/7',     color:'#8B5CF6', label: lang==='fr' ? 'Monitoring continu'  : 'Continuous monitoring' },
  ]

  const cardBg     = darkMode ? '#101B2E' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const textSecond = darkMode ? '#CBD5E1' : '#475569'

  return (
    <section id="projet" style={{ padding: '6rem 3rem', scrollMarginTop: '80px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div className="projet-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start', marginBottom: '2rem' }}>

          {/* Left */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px', padding: '2.5rem', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', display: 'inline-block', animation: 'sdiPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 900, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.75rem' }}>
              {T.title1}<br /><span style={{ color: '#22C55E' }}>{T.title2}</span>
            </h1>
            {/* Text with expand/collapse */}
            <div style={{ position: 'relative' }}>
              <div style={{
                maxHeight: expanded ? '600px' : '120px',
                overflow: 'hidden',
                transition: 'max-height 0.55s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
              }}>
                <p style={{ fontSize: '15px', color: textSecond, lineHeight: 1.9, marginBottom: '1.25rem' }}>{T.p1}</p>
                <p style={{ fontSize: '15px', color: textSecond, lineHeight: 1.9 }}>{T.p2}</p>
              </div>

              {/* Blur fade overlay — only when collapsed */}
              {!expanded && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px',
                  background: darkMode
                    ? 'linear-gradient(to bottom, transparent, #101B2E)'
                    : 'linear-gradient(to bottom, transparent, #FFFFFF)',
                  pointerEvents: 'none',
                  borderRadius: '0 0 8px 8px',
                }} />
              )}
            </div>

            {/* Lire la suite / Réduire button */}
            <button
              onClick={() => setExpanded(x => !x)}
              style={{
                marginTop: expanded ? '16px' : '4px',
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: 'transparent',
                border: `1px solid ${darkMode ? 'rgba(34,197,94,0.28)' : 'rgba(34,197,94,0.35)'}`,
                borderRadius: '999px',
                padding: '7px 18px',
                fontSize: '13px', fontWeight: 600,
                color: '#22C55E',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(34,197,94,0.1)'
                e.currentTarget.style.boxShadow = '0 0 14px rgba(34,197,94,0.2)'
                e.currentTarget.style.borderColor = 'rgba(34,197,94,0.55)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = darkMode ? 'rgba(34,197,94,0.28)' : 'rgba(34,197,94,0.35)'
              }}
            >
              {expanded
                ? (lang === 'fr' ? '↑ Réduire' : '↑ Collapse')
                : (lang === 'fr' ? 'Lire la suite →' : 'Read more →')
              }
            </button>
          </div>

          {/* Right — stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {STATS.map((s, i) => (
              <StatBubble key={s.key} statKey={s.key} icon={s.icon} value={s.value} label={s.label} color={s.color} darkMode={darkMode} index={i}
                onClick={() => { setOpenModal(s.key); setOpenColor(s.color) }}
              />
            ))}
            <div style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8', textAlign: 'center', marginTop: '4px' }}>
              {lang === 'fr' ? 'Cliquez pour plus de détails' : 'Click for more details'}
            </div>
          </div>
        </div>

        {/* Slogan — full width */}
        <SloganCard lang={lang} darkMode={darkMode} />
      </div>

      {openModal && (
        <StatModal statKey={openModal} lang={lang} darkMode={darkMode} accentColor={openColor} onClose={() => setOpenModal(null)} />
      )}

      <style>{`@keyframes sdiPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.85)}}`}</style>
    </section>
  )
}
