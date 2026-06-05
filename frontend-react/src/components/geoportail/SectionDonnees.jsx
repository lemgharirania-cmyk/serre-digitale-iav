// src/components/geoportail/SectionDonnees.jsx
import { useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Info, AlertTriangle, CheckCircle, Thermometer, Droplets, Wind, Leaf, FlaskConical, Zap, Waves, BarChart2 } from 'lucide-react'
import { iotAPI } from '../../api/client'

// Lucide icon components mapped per parameter
const PARAM_ICONS = {
  temperature: Thermometer,
  humidite:    Droplets,
  vpd:         Wind,
  co2:         Leaf,
  ph:          FlaskConical,
  ec:          Zap,
  temp_eau:    Waves,
  niveau_eau:  BarChart2,
}

const SERRES = [
  { code:'S01', color:'#22C55E', nameFr:'Génétique & Amélioration des Plantes', nameEn:'Plant Genetics & Improvement' },
  { code:'S02', color:'#06B6D4', nameFr:'Horticulture',                          nameEn:'Horticulture' },
  { code:'S03', color:'#F59E0B', nameFr:'Agronomie',                             nameEn:'Agronomy' },
  { code:'S04', color:'#8B5CF6', nameFr:'Hydroponie & Systèmes Innovants',       nameEn:'Hydroponics & Innovative Systems' },
  { code:'S05', color:'#EF4444', nameFr:'Protection des Plantes',                nameEn:'Plant Protection' },
]

// ── Descriptions détaillées par paramètre ET par serre ───────
export const POPUP_INFO = {
  temperature: {
    icon: null,
    labelFr: 'Température de l\'air',
    labelEn: 'Air Temperature',
    unit: '°C',
    optimal: { min: 18, max: 28 },
    serres: {
      S01: {
        fr: 'En serre Génétique, la température est contrôlée avec précision pour les expériences de croisement végétal. Une variation de ±2°C peut affecter l\'expression des gènes et les résultats des sélections variétales. Optimum : 20–25°C.',
        en: 'In the Genetics greenhouse, temperature is precisely controlled for plant crossing experiments. A ±2°C variation can affect gene expression and variety selection results. Optimum: 20–25°C.',
      },
      S02: {
        fr: 'Pour l\'horticulture, la température influence la floraison et la qualité des fruits. En dessous de 15°C, la croissance ralentit. Au-delà de 30°C, le stress thermique provoque des dommages irréversibles aux cultures ornementales.',
        en: 'For horticulture, temperature influences flowering and fruit quality. Below 15°C, growth slows. Above 30°C, heat stress causes irreversible damage to ornamental crops.',
      },
      S03: {
        fr: 'En agronomie, la température conditionne les cycles phénologiques. La somme de températures (degrés-jours) détermine la date de maturité des cultures céréalières et maraîchères cultivées dans cette serre.',
        en: 'In agronomy, temperature conditions phenological cycles. The sum of temperatures (degree-days) determines the maturity date of cereal and vegetable crops grown in this greenhouse.',
      },
      S04: {
        fr: 'En hydroponie, la température de l\'air est liée à celle de la solution nutritive. Au-dessus de 28°C, la teneur en oxygène dissous chute et favorise le développement de pathogènes racinaires comme Pythium. Maintenir entre 20–24°C.',
        en: 'In hydroponics, air temperature is linked to nutrient solution temperature. Above 28°C, dissolved oxygen content drops and promotes root pathogens like Pythium. Maintain between 20–24°C.',
      },
      S05: {
        fr: 'En protection des plantes, la température influe sur le développement des ravageurs et des agents pathogènes. Certains insectes comme les acariens se reproduisent 2× plus vite à 30°C qu\'à 20°C. Un suivi précis permet d\'ajuster les traitements.',
        en: 'In plant protection, temperature influences pest and pathogen development. Some insects like mites reproduce 2× faster at 30°C than at 20°C. Precise monitoring allows adjusting treatments.',
      },
    },
  },
  humidite: {
    icon: null,
    labelFr: 'Humidité relative',
    labelEn: 'Relative Humidity',
    unit: '%',
    optimal: { min: 60, max: 80 },
    serres: {
      S01: {
        fr: 'Pour les travaux de génétique, une humidité stable entre 60–75% prévient la déshydratation des fleurs lors de la pollinisation manuelle et protège les cultures en chambre de culture contrôlée.',
        en: 'For genetics work, stable humidity between 60–75% prevents flower dehydration during manual pollination and protects crops in controlled culture chambers.',
      },
      S02: {
        fr: 'L\'humidité relative est critique en horticulture. Au-dessus de 85%, le risque de Botrytis (pourriture grise) et d\'oïdium augmente fortement sur les plantes ornementales. En dessous de 50%, la transpiration excessive affecte la qualité des fleurs coupées.',
        en: 'Relative humidity is critical in horticulture. Above 85%, the risk of Botrytis (gray mold) and powdery mildew increases strongly on ornamental plants. Below 50%, excessive transpiration affects cut flower quality.',
      },
      S03: {
        fr: 'En agronomie, l\'humidité affecte l\'efficacité des traitements phytosanitaires et la germination. Une humidité excessive pendant la floraison des céréales favorise la fusariose et les mycotoxines.',
        en: 'In agronomy, humidity affects the effectiveness of phytosanitary treatments and germination. Excessive humidity during cereal flowering promotes Fusarium and mycotoxins.',
      },
      S04: {
        fr: 'En hydroponie, l\'humidité élevée (70–80%) est généralement maintenue car les racines n\'absorbent pas depuis le sol. Cependant, elle doit rester sous 85% pour éviter les maladies foliaires sur les cultures à haute valeur comme la laitue et le basilic.',
        en: 'In hydroponics, high humidity (70–80%) is generally maintained since roots do not absorb from soil. However, it must stay below 85% to avoid foliar diseases on high-value crops like lettuce and basil.',
      },
      S05: {
        fr: 'En protection des plantes, l\'humidité détermine le développement épidémique des agents pathogènes. Les maladies fongiques nécessitent une humidité >90% pendant plusieurs heures pour germer. Le contrôle de l\'humidité est la première ligne de défense.',
        en: 'In plant protection, humidity determines the epidemic development of pathogens. Fungal diseases require >90% humidity for several hours to germinate. Humidity control is the first line of defense.',
      },
    },
  },
  vpd: {
    icon: null,
    labelFr: 'Déficit de Pression de Vapeur',
    labelEn: 'Vapour Pressure Deficit',
    unit: 'kPa',
    optimal: { min: 0.8, max: 1.5 },
    serres: {
      S01: {
        fr: 'Le VPD est l\'indicateur clé de la transpiration végétale. En génétique, un VPD bien contrôlé (0.8–1.2 kPa) assure une absorption optimale des minéraux et une croissance régulière des plantes mères utilisées pour les croisements.',
        en: 'VPD is the key indicator of plant transpiration. In genetics, well-controlled VPD (0.8–1.2 kPa) ensures optimal mineral absorption and regular growth of mother plants used for crosses.',
      },
      S02: {
        fr: 'En horticulture, un VPD élevé (>2 kPa) provoque un stress hydrique qui affecte la qualité et la durée de vie post-récolte des fleurs. Un VPD faible (<0.4 kPa) favorise les maladies. La zone optimale est 0.8–1.5 kPa.',
        en: 'In horticulture, high VPD (>2 kPa) causes water stress affecting flower quality and post-harvest shelf life. Low VPD (<0.4 kPa) promotes diseases. The optimal zone is 0.8–1.5 kPa.',
      },
      S03: {
        fr: 'Pour les cultures agronomiques, le VPD guide les décisions d\'irrigation. Un VPD de 1.0–1.5 kPa indique que la plante transpire activement et absorbe les nutriments. Les valeurs nocturnes doivent être inférieures à 0.5 kPa pour permettre la récupération.',
        en: 'For agronomic crops, VPD guides irrigation decisions. A VPD of 1.0–1.5 kPa indicates the plant is actively transpiring and absorbing nutrients. Nighttime values should be below 0.5 kPa to allow recovery.',
      },
      S04: {
        fr: 'En hydroponie, le VPD est particulièrement important car les plantes dépendent entièrement de l\'absorption racinaire en solution. Un VPD de 0.8–1.2 kPa maximise la vitesse de croissance et l\'efficacité d\'utilisation de l\'eau dans les systèmes NFT et DWC.',
        en: 'In hydroponics, VPD is particularly important as plants depend entirely on root absorption in solution. A VPD of 0.8–1.2 kPa maximizes growth rate and water use efficiency in NFT and DWC systems.',
      },
      S05: {
        fr: 'En protection des plantes, surveiller le VPD permet de prédire les infections fongiques. Un VPD proche de 0 (saturation) crée des conditions idéales pour la germination des spores. Les traitements préventifs sont déclenchés quand le VPD reste sous 0.3 kPa plus de 4h.',
        en: 'In plant protection, monitoring VPD helps predict fungal infections. VPD near 0 (saturation) creates ideal conditions for spore germination. Preventive treatments are triggered when VPD stays below 0.3 kPa for more than 4h.',
      },
    },
  },
  co2: {
    icon: null,
    labelFr: 'Dioxyde de Carbone',
    labelEn: 'Carbon Dioxide',
    unit: 'ppm',
    optimal: { min: 400, max: 1200 },
    serres: {
      S01: {
        fr: 'Un enrichissement en CO₂ à 800–1000 ppm accélère significativement la croissance des plantes en cours de sélection génétique, permettant d\'obtenir plus de générations par an. Essentiel pour les programmes d\'amélioration variétale.',
        en: 'CO₂ enrichment at 800–1000 ppm significantly accelerates growth of plants undergoing genetic selection, allowing more generations per year. Essential for variety improvement programs.',
      },
      S02: {
        fr: 'L\'enrichissement en CO₂ améliore la qualité et la durée de vie des fleurs coupées en horticulture. À 1000 ppm, les rosiers produisent des tiges plus longues et des fleurs plus grandes. L\'enrichissement est particulièrement rentable durant les mois d\'hiver.',
        en: 'CO₂ enrichment improves the quality and shelf life of cut flowers in horticulture. At 1000 ppm, rose bushes produce longer stems and larger flowers. Enrichment is particularly cost-effective during winter months.',
      },
      S03: {
        fr: 'En agronomie, l\'élévation du CO₂ à 600–800 ppm augmente le rendement des cultures de 15–25% et améliore l\'efficacité d\'utilisation de l\'eau. Cependant, certaines études montrent une diminution de la teneur en protéines des céréales à fort CO₂.',
        en: 'In agronomy, raising CO₂ to 600–800 ppm increases crop yield by 15–25% and improves water use efficiency. However, some studies show decreased protein content in cereals at high CO₂.',
      },
      S04: {
        fr: 'En hydroponie, l\'enrichissement en CO₂ (800–1200 ppm) est standard pour maximiser la photosynthèse. La laitue, le basilic et les tomates répondent fortement à l\'enrichissement. Le retour sur investissement est estimé à 3–6 mois selon la culture.',
        en: 'In hydroponics, CO₂ enrichment (800–1200 ppm) is standard to maximize photosynthesis. Lettuce, basil and tomatoes respond strongly to enrichment. Return on investment is estimated at 3–6 months depending on the crop.',
      },
      S05: {
        fr: 'En protection des plantes, surveiller le CO₂ aide à détecter les niveaux d\'activité biologique. Un CO₂ anormalement bas peut indiquer une forte consommation par des organismes nuisibles. Des taux élevés à 2000+ ppm ont parfois un effet suppressif sur certains insectes.',
        en: 'In plant protection, monitoring CO₂ helps detect biological activity levels. Abnormally low CO₂ may indicate high consumption by harmful organisms. High levels of 2000+ ppm sometimes have a suppressive effect on certain insects.',
      },
    },
  },
  ph: {
    icon: null,
    labelFr: 'Potentiel Hydrogène (pH)',
    labelEn: 'Hydrogen Potential (pH)',
    unit: '',
    optimal: { min: 5.5, max: 7.0 },
    serres: {
      S01: {
        fr: 'En génétique végétale, le pH de l\'eau d\'irrigation est maintenu entre 6.0–7.0 pour les cultures en sol. Un pH inadapté bloque l\'absorption de microéléments essentiels (Fe, Mn, Zn) et masque les effets génétiques étudiés.',
        en: 'In plant genetics, irrigation water pH is maintained between 6.0–7.0 for soil crops. Unsuitable pH blocks absorption of essential microelements (Fe, Mn, Zn) and masks the genetic effects being studied.',
      },
      S02: {
        fr: 'Pour les cultures horticoles, le pH optimal varie selon l\'espèce : 6.0–6.5 pour la plupart des fleurs, 5.5–6.0 pour les azalées et rhododendrons (plantes acidophiles). Un ajustement précis est effectué avec de l\'acide phosphorique ou nitrique.',
        en: 'For horticultural crops, optimal pH varies by species: 6.0–6.5 for most flowers, 5.5–6.0 for azaleas and rhododendrons (acidophilic plants). Precise adjustment is made with phosphoric or nitric acid.',
      },
      S03: {
        fr: 'En agronomie, le pH du sol influence la disponibilité de tous les nutriments. Entre 6.0–7.0, la majorité des éléments sont maximalement disponibles. En dehors de cette plage, même un sol riche en nutriments devient déficient pour la plante.',
        en: 'In agronomy, soil pH influences the availability of all nutrients. Between 6.0–7.0, most elements are maximally available. Outside this range, even a nutrient-rich soil becomes deficient for the plant.',
      },
      S04: {
        fr: 'En hydroponie, le pH de la solution nutritive est le paramètre le plus critique. Entre 5.5–6.5, tous les nutriments sont disponibles. Le pH dérive naturellement vers le haut (absorption des anions) et doit être ajusté quotidiennement. Surveiller toutes les 4–8 heures.',
        en: 'In hydroponics, nutrient solution pH is the most critical parameter. Between 5.5–6.5, all nutrients are available. pH naturally drifts upward (anion absorption) and must be adjusted daily. Monitor every 4–8 hours.',
      },
      S05: {
        fr: 'En protection des plantes, le pH de l\'eau utilisée pour les traitements phytosanitaires est crucial. De nombreux pesticides sont dégradés par hydrolyse alcaline au-delà de pH 7.5. Le pH optimal pour les applications de fongicides et insecticides est 5.0–7.0.',
        en: 'In plant protection, the pH of water used for phytosanitary treatments is crucial. Many pesticides are degraded by alkaline hydrolysis above pH 7.5. The optimal pH for fungicide and insecticide applications is 5.0–7.0.',
      },
    },
  },
  ec: {
    icon: null,
    labelFr: 'Conductivité Électrique',
    labelEn: 'Electrical Conductivity',
    unit: 'mS/cm',
    optimal: { min: 1.5, max: 3.5 },
    serres: {
      S01: {
        fr: 'En génétique, une EC de 1.5–2.5 mS/cm est maintenue pour les cultures standards. Des EC plus élevées (3–5 mS/cm) peuvent être testées lors d\'expériences sur la tolérance au stress salin. Chaque génotype réagit différemment à la concentration en sels.',
        en: 'In genetics, an EC of 1.5–2.5 mS/cm is maintained for standard crops. Higher ECs (3–5 mS/cm) can be tested during experiments on salt stress tolerance. Each genotype reacts differently to salt concentration.',
      },
      S02: {
        fr: 'Pour les plantes ornementales, une EC de 1.5–2.5 mS/cm est généralement recommandée. Des EC élevées peuvent provoquer des brûlures foliaires sur les plantes à feuillage délicat. Les cactées et succulentes tolèrent des EC jusqu\'à 4 mS/cm.',
        en: 'For ornamental plants, an EC of 1.5–2.5 mS/cm is generally recommended. High ECs can cause leaf burn on delicate foliage plants. Cacti and succulents tolerate ECs up to 4 mS/cm.',
      },
      S03: {
        fr: 'En agronomie, l\'EC de l\'eau d\'irrigation est un indicateur clé de salinité. Au Maroc, les eaux souterraines peuvent avoir des EC élevées (>3 mS/cm) affectant la productivité. Le suivi permet d\'adapter les variétés et les pratiques culturales.',
        en: 'In agronomy, irrigation water EC is a key salinity indicator. In Morocco, groundwater can have high ECs (>3 mS/cm) affecting productivity. Monitoring allows adapting varieties and cultural practices.',
      },
      S04: {
        fr: 'En hydroponie, l\'EC est le paramètre principal de gestion de la nutrition. Pour la laitue : 1.2–2.0 mS/cm. Pour la tomate : 2.5–4.0 mS/cm. Pour le basilic : 1.6–2.2 mS/cm. Une EC trop basse = carences. Une EC trop haute = stress osmotique et brûlures racinaires.',
        en: 'In hydroponics, EC is the main nutrition management parameter. For lettuce: 1.2–2.0 mS/cm. For tomato: 2.5–4.0 mS/cm. For basil: 1.6–2.2 mS/cm. Too low EC = deficiencies. Too high EC = osmotic stress and root burn.',
      },
      S05: {
        fr: 'En protection des plantes, l\'EC de l\'eau de traitement influence l\'efficacité des produits phytosanitaires. Une EC élevée (eau dure) peut réduire l\'efficacité de certains herbicides et fongicides systémiques. L\'eau adoucie ou de pluie est préférée.',
        en: 'In plant protection, treatment water EC influences the effectiveness of phytosanitary products. High EC (hard water) can reduce the effectiveness of certain systemic herbicides and fungicides. Softened or rainwater is preferred.',
      },
    },
  },
  temp_eau: {
    icon: null,
    labelFr: 'Température de l\'eau',
    labelEn: 'Water Temperature',
    unit: '°C',
    optimal: { min: 18, max: 22 },
    serres: {
      S01: { fr: 'La température de l\'eau d\'irrigation affecte l\'activité microbienne du substrat. Entre 18–22°C, les micro-organismes bénéfiques sont actifs et la décomposition de la matière organique est optimale pour les cultures en milieu contrôlé.', en: 'Irrigation water temperature affects substrate microbial activity. Between 18–22°C, beneficial microorganisms are active and organic matter decomposition is optimal for controlled environment crops.' },
      S02: { fr: 'Pour les plantes ornementales, une eau trop froide (<15°C) provoque un choc thermique racinaire réduisant l\'absorption des nutriments. En hiver, l\'eau est préchauffée avant l\'irrigation pour maintenir la croissance des espèces tropicales.', en: 'For ornamental plants, too cold water (<15°C) causes root thermal shock reducing nutrient absorption. In winter, water is preheated before irrigation to maintain growth of tropical species.' },
      S03: { fr: 'En agronomie, la température de l\'eau d\'irrigation influence la germination et le développement racinaire. L\'eau froide en début de saison retarde la levée. Une eau à 20–25°C favorise une meilleure installation des cultures.', en: 'In agronomy, irrigation water temperature influences germination and root development. Cold water at the start of the season delays emergence. Water at 20–25°C promotes better crop establishment.' },
      S04: { fr: 'En hydroponie, la température de la solution nutritive est critique pour la teneur en oxygène dissous. À 20°C : ~9 mg/L d\'O₂ dissous. À 30°C : seulement ~7 mg/L. Des températures élevées favorisent Pythium et réduisent la croissance racinaire. Maintenir entre 18–22°C absolument.', en: 'In hydroponics, nutrient solution temperature is critical for dissolved oxygen content. At 20°C: ~9 mg/L dissolved O₂. At 30°C: only ~7 mg/L. High temperatures promote Pythium and reduce root growth. Maintain between 18–22°C absolutely.' },
      S05: { fr: 'En protection des plantes, la température de l\'eau de traitement affecte la stabilité et l\'efficacité des produits. Certains produits biologiques (Trichoderma, Bacillus) sont dégradés au-delà de 30°C. L\'eau fraîche (18–22°C) est recommandée pour tous les traitements.', en: 'In plant protection, treatment water temperature affects product stability and effectiveness. Some biological products (Trichoderma, Bacillus) are degraded above 30°C. Cool water (18–22°C) is recommended for all treatments.' },
    },
  },
  niveau_eau: {
    icon: null,
    labelFr: 'Niveau d\'eau',
    labelEn: 'Water Level',
    unit: 'm',
    optimal: { min: 0.6, max: 1.0 },
    serres: {
      S01: { fr: 'Le niveau d\'eau dans les réservoirs d\'irrigation permet d\'anticiper les besoins en réalimentation. Un niveau critique (<20%) déclenche une alerte pour éviter l\'interruption de l\'irrigation des cultures génétiques sensibles aux stress hydriques.', en: 'Water level in irrigation tanks allows anticipating refill needs. A critical level (<20%) triggers an alert to avoid interruption of irrigation for genetic crops sensitive to water stress.' },
      S02: { fr: 'En horticulture, une surveillance continue du niveau d\'eau prévient les ruptures d\'irrigation catastrophiques pour les fleurs coupées. Une interruption de 24h peut provoquer des pertes irréversibles sur des cultures à haute valeur commerciale.', en: 'In horticulture, continuous water level monitoring prevents catastrophic irrigation breaks for cut flowers. A 24h interruption can cause irreversible losses on high commercial value crops.' },
      S03: { fr: 'En agronomie, le niveau d\'eau dans les cuves de fertigation est géré selon les besoins des cultures. La demande augmente fortement par temps chaud et lors des stades critiques (floraison, remplissage des grains). Les alertes sont configurées à 30% et 10%.', en: 'In agronomy, water level in fertigation tanks is managed according to crop needs. Demand increases strongly in hot weather and during critical stages (flowering, grain filling). Alerts are set at 30% and 10%.' },
      S04: { fr: 'En hydroponie, le niveau de la solution nutritive dans les réservoirs centraux est critique. Les systèmes NFT et DWC consomment de l\'eau continuellement par évapotranspiration. Un niveau bas concentre la solution (EC et pH dérivent). Maintenir entre 60–100%.', en: 'In hydroponics, nutrient solution level in central tanks is critical. NFT and DWC systems continuously consume water through evapotranspiration. Low level concentrates the solution (EC and pH drift). Maintain between 60–100%.' },
      S05: { fr: 'En protection des plantes, le niveau d\'eau des cuves de traitement est suivi pour garantir la disponibilité des produits en cas d\'alerte phytosanitaire urgente. Une capacité minimale de 50% est maintenue pour pouvoir intervenir rapidement sur toute la serre.', en: 'In plant protection, treatment tank water level is monitored to ensure product availability in case of urgent phytosanitary alert. A minimum capacity of 50% is maintained to be able to intervene quickly across the entire greenhouse.' },
    },
  },
}

function getStatus(value, optimal) {
  if (value == null) return 'unknown'
  if (value < optimal.min || value > optimal.max) return 'warning'
  return 'ok'
}

function StatusIcon({ status, color }) {
  if (status === 'ok')      return <CheckCircle size={13} color={color} />
  if (status === 'warning') return <AlertTriangle size={13} color="#F59E0B" />
  return <Info size={13} color="#64748B" />
}

// ── ParamCard with rich popup ─────────────────────────────────
function ParamCard({ paramKey, value, serreCode, lang, darkMode, serreColor }) {
  const [showPopup, setShowPopup] = useState(false)
  const [hovered,   setHovered]   = useState(false)
  const info   = POPUP_INFO[paramKey]
  if (!info) return null

  const hasVal = value != null
  const status = hasVal ? getStatus(value, info.optimal) : 'unknown'
  const cardColor = status === 'warning' ? '#F59E0B' : status === 'ok' ? serreColor : '#64748B'
  const desc   = info.serres[serreCode]?.[lang === 'fr' ? 'fr' : 'en'] || ''

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => { setHovered(true); setShowPopup(true) }}
      onMouseLeave={() => { setHovered(false); setShowPopup(false) }}
    >
      {/* Card */}
      <div style={{
        borderRadius: '16px', padding: '20px 14px', textAlign: 'center',
        background: hovered
          ? `${cardColor}12`
          : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
        border: `1px solid ${hovered ? cardColor + '40' : (darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)')}`,
        cursor: 'default', transition: 'all 0.25s ease',
        boxShadow: hovered ? `0 8px 24px ${cardColor}18` : 'none',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}>
        {/* Status dot */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <StatusIcon status={status} color={cardColor} />
        </div>

        {/* Icon */}
<div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
  {(() => {
    const IconCmp = PARAM_ICONS[paramKey];
    return IconCmp ? (
      <IconCmp
        size={20}
        color={hovered ? cardColor : (darkMode ? '#64748B' : '#94A3B8')}
      />
    ) : null;
  })()}
</div>

        {/* Label */}
        <div style={{ fontSize: '10px', color: darkMode ? '#64748B' : '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
          {lang === 'fr' ? info.labelFr : info.labelEn}
        </div>

        {/* Value */}
        <div style={{ fontSize: '2rem', fontWeight: 900, color: hasVal ? cardColor : (darkMode ? '#64748B' : '#94A3B8'), fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>
          {hasVal ? value : '—'}
        </div>
        {hasVal && <div style={{ fontSize: '11px', color: darkMode ? '#64748B' : '#94A3B8', marginTop: '4px' }}>{info.unit}</div>}

        {/* Optimal range */}
        <div style={{
          marginTop: '10px', fontSize: '10px',
          color: status === 'warning' ? '#F59E0B' : (darkMode ? '#475569' : '#CBD5E1'),
          fontFamily: 'monospace',
        }}>
          {lang === 'fr' ? 'Opt.' : 'Opt.'} {info.optimal.min}–{info.optimal.max} {info.unit}
        </div>
      </div>

      {/* ── Rich Popup ── */}
      {showPopup && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '280px',
          background: darkMode ? 'rgba(7,17,31,0.97)' : 'rgba(255,255,255,0.98)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '16px',
          padding: '16px',
          zIndex: 200,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(20px)',
          animation: 'popupIn 0.2s ease',
        }}>

          {/* Popup header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:`${cardColor}15` }}>
              {(() => { const IconCmp = PARAM_ICONS[paramKey]; return IconCmp ? <IconCmp size={15} color={cardColor} strokeWidth={1.8} /> : null; })()}
            </span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: cardColor }}>
                {lang === 'fr' ? info.labelFr : info.labelEn}
              </div>
              <div style={{ fontSize: '10px', color: darkMode ? '#475569' : '#94A3B8', fontFamily: 'monospace' }}>
                {SERRES.find(s => s.code === serreCode)?.[lang === 'fr' ? 'nameFr' : 'nameEn']?.split('&')[0].trim()}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <StatusIcon status={status} color={cardColor} />
              <span style={{ fontSize: '10px', color: status === 'ok' ? cardColor : '#F59E0B', fontWeight: 600 }}>
                {status === 'ok' ? (lang === 'fr' ? 'Optimal' : 'Optimal') : (lang === 'fr' ? 'Attention' : 'Warning')}
              </span>
            </div>
          </div>

          {/* Current value highlight */}
          {hasVal && (
            <div style={{
              background: `${cardColor}12`, border: `1px solid ${cardColor}25`,
              borderRadius: '10px', padding: '8px 12px', marginBottom: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '11px', color: darkMode ? '#94A3B8' : '#6b7280' }}>
                {lang === 'fr' ? 'Valeur actuelle' : 'Current value'}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: cardColor, fontFamily: 'monospace' }}>
                {value} <span style={{ fontSize: '12px' }}>{info.unit}</span>
              </span>
            </div>
          )}

          {/* Optimal range bar */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: darkMode ? '#475569' : '#94A3B8', marginBottom: '4px' }}>
              <span>{lang === 'fr' ? 'Zone optimale' : 'Optimal zone'}</span>
              <span style={{ fontFamily: 'monospace' }}>{info.optimal.min}–{info.optimal.max} {info.unit}</span>
            </div>
            <div style={{ height: '4px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: '20%', right: '20%', top: 0, height: '100%', background: `${cardColor}60`, borderRadius: '2px' }} />
              {hasVal && (
                <div style={{
                  position: 'absolute',
                  left: `${Math.min(95, Math.max(2, ((value - info.optimal.min * 0.5) / (info.optimal.max * 1.5 - info.optimal.min * 0.5)) * 100))}%`,
                  top: '50%', transform: 'translate(-50%,-50%)',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: cardColor, boxShadow: `0 0 6px ${cardColor}`,
                }} />
              )}
            </div>
          </div>

          {/* Description specific to serre */}
          <div style={{ fontSize: '12px', color: darkMode ? '#CBD5E1' : '#475569', lineHeight: 1.65 }}>
            {desc}
          </div>

          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
            width: 12, height: 12, background: darkMode ? 'rgba(7,17,31,0.97)' : 'rgba(255,255,255,0.98)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderTop: 'none', borderLeft: 'none',
            transform: 'translateX(-50%) rotate(45deg)',
          }} />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function SectionDonnees({ lang, liveData, countdown, onRefresh, darkMode }) {
  const [idx, setIdx] = useState(0)
  const serre = liveData?.[idx] || {}
  const meta  = SERRES[idx]
  const env   = serre.env || {}
  const irr   = serre.irr || {}

  const cardBg     = darkMode ? 'rgba(16,27,46,0.8)' : '#FFFFFF'
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor  = darkMode ? '#F8FAFC' : '#0F172A'
  const mutedColor = darkMode ? '#64748B' : '#94A3B8'

  const T = {
    title:  lang === 'fr' ? 'Monitoring des Capteurs'              : 'Sensor Monitoring',
    badge:  lang === 'fr' ? 'IoT · Temps Réel'                    : 'IoT · Real Time',
    live:   lang === 'fr' ? 'Données en temps réel'               : 'Real-time data',
    env:    lang === 'fr' ? 'Environnement'                        : 'Environment',
    irr:    lang === 'fr' ? 'Irrigation'                           : 'Irrigation',
    noIrr:  lang === 'fr' ? 'Données d\'irrigation non disponibles pour cette unité' : 'Irrigation data unavailable for this unit',
    hover:  lang === 'fr' ? 'Survolez une carte pour plus d\'informations' : 'Hover a card for more information',
  }

  return (
    <section id="donnees" style={{ padding: '5rem 3rem', scrollMarginTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '100px', padding: '6px 18px', marginBottom: '1rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', animation: 'hdrPulse 2s ease-in-out infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.badge}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: textColor, fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em' }}>{T.title}</h2>
          <p style={{ fontSize: '13px', color: mutedColor, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Info size={13} />
            {T.hover}
          </p>
        </div>

        {/* Serre selector */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '6px', boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <button onClick={() => setIdx(i => (i - 1 + 5) % 5)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={15} />
            </button>
            {SERRES.map((s, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                border: `1px solid ${idx === i ? s.color + '50' : 'transparent'}`,
                background: idx === i ? `${s.color}15` : 'transparent',
                color: idx === i ? s.color : mutedColor,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
                {lang === 'fr' ? s.nameFr.split('&')[0].trim() : s.nameEn.split('&')[0].trim()}
              </button>
            ))}
            <button onClick={() => setIdx(i => (i + 1) % 5)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Refresh bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '12px 20px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', animation: 'hdrPulse 2s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontSize: '14px', color: mutedColor, flex: 1 }}>{T.live}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', fontFamily: "'Outfit',sans-serif" }}>{countdown}</span>
          <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> {lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>

        {/* Serre name */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '14px 20px', background: `${meta.color}08`, border: `1px solid ${meta.color}20`, borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
            <span style={{ fontSize: '17px', fontWeight: 800, color: textColor, fontFamily: "'Outfit',sans-serif" }}>
              {lang === 'fr' ? meta.nameFr : meta.nameEn}
            </span>
            <span style={{ fontSize: '11px', color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}25`, padding: '3px 10px', borderRadius: '100px', fontWeight: 700 }}>
              {serre.statut === 'ok' ? 'LIVE' : 'PARTIEL'}
            </span>
          </div>
        </div>

        {/* ENV cards */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: mutedColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>{T.env}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {['temperature','humidite','vpd','co2'].map(key => (
              <ParamCard key={key} paramKey={key} value={env[key]} serreCode={meta.code} lang={lang} darkMode={darkMode} serreColor={meta.color} />
            ))}
          </div>
        </div>

        {/* IRR cards */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: mutedColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>{T.irr}</div>
          {serre.irr ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              {['ph','ec','temp_eau','niveau_eau'].map(key => (
                <ParamCard key={key} paramKey={key} value={irr[key]} serreCode={meta.code} lang={lang} darkMode={darkMode} serreColor={meta.color} />
              ))}
            </div>
          ) : (
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '2rem', textAlign: 'center', color: mutedColor, fontSize: '14px' }}>{T.noIrr}</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes hdrPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes popupIn  { from{opacity:0;transform:translateX(-50%) translateY(6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </section>
  )
}
