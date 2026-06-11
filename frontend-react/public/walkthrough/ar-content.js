/* ═══════════════════════════════════════════════════════════════════════
   ar-content.js  —  Single source of truth for all AR cards
   AgroBioTech Géoportail · IAV Hassan II Rabat
   ═══════════════════════════════════════════════════════════════════════

   HOW TO USE IN EACH VIEWER:
     1. Remove AR_CONTENT, NS_RECIPES, NS_BARS, renderARTab, openSimpleAR,
        switchTab, closeAR, getARDef, getCssClass, updateHotspotDots
        and the AR CSS block from the viewer HTML.
     2. Add in <head>:
          <link rel="stylesheet" href="ar-content.css">
     3. Add before </body>:
          <script src="ar-content.js"></script>
     4. The viewer must define these globals before ar-content.js loads:
          window.AR_VIEWER   = 'serrehydroponie'  // viewer id
          window.iotData     = null               // populated by fetchIoT()
          window.thresholds  = {}                // populated by fetchThresholds()
          window.outsideTemp = null               // populated by fetchOutsideTemp()
          window.activeAR    = null
          window.activeTab   = 0

   LANGUAGE:
     window.currentLang = 'FR' | 'EN' | 'AR'
     Change via setLang('EN') — rerenders open card + updates UI

   AUDIO HOOKS (for future hotspot audio):
     window.AR_AUDIO = {
       'fraise': { FR: 'audio/fr/fraise.mp3', EN: '...', AR: '...' },
       ...
     }
     When a hotspot opens, ar-content.js will call playARAudio(key, lang)
     if AR_AUDIO[key]?.[lang] exists.

   ORGANISATION:
     Section 1  —  Translations T{FR, EN, AR}
     Section 2  —  NS_RECIPES + NS_BARS (calculator data)
     Section 3  —  AR_CONTENT (all 39 hotspot definitions)
     Section 4  —  Engine (renderARTab, openSimpleAR, switchTab, closeAR…)
═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 1 — TRANSLATIONS
   Keys used throughout renderARTab and openSimpleAR.
   Add EN + AR alongside every FR string.
═══════════════════════════════════════════════════════════════════════ */
window.currentLang = window.currentLang || 'FR';

const T = {
  FR: {
    arOn:              'AR ON',
    arOff:             'AR OFF',
    active:            'ACTIF',
    inactive:          'INACTIF',
    awaiting:          'En attente des données…',
    refresh:           '⟳  Actualiser',
    liveData:          'DONNÉES EN DIRECT',
    systemState:       'ÉTAT DU SYSTÈME',
    resource:          'RESSOURCE',
    stationFert:       'STATION DE FERTIGATION',
    liveReadings:      'MESURES EN TEMPS RÉEL',
    simulator:         'SIMULATEUR — FORMULE NS',
    macros:            'MACROÉLÉMENTS (mM)',
    cropLabel:         'Culture / Recette Incrocci',
    ecTarget:          'EC cible',
    phTarget:          'pH cible',
    phCorrection:      'correction H₂SO₄',
    calcLink:          'Dashboard → Calculateur NS',
    incrocci:          'Formule Incrocci / EUPHOROS EU-FP7 · IAV Hassan II',
    catMap: {
      fraise:            'SYSTÈME BIOLOGIQUE',
      co2:               'CONTRÔLE CLIMATIQUE',
      brumisateur:       'CONTRÔLE CLIMATIQUE',
      ventilation:       'CONTRÔLE CLIMATIQUE',
      'système de refroidissement': 'CONTRÔLE CLIMATIQUE',
      fertigation:       'SYSTÈME HYDROPONIQUE',
      sensors:           'TÉLÉMÉTRIE IOT',
      'ventilation dehors': 'CONTRÔLE CLIMATIQUE',
      'rideaux auto':    'CONTRÔLE CLIMATIQUE',
      'fenetre auto':    'CONTRÔLE CLIMATIQUE',
      'système de ventilation': 'CONTRÔLE CLIMATIQUE',
      monitoring:        'SUPERVISION',
      'station de fertigation': 'SYSTÈME HYDROPONIQUE',
    },
    tabNames: {
      'Infos générales': 'Infos générales',
      'IoT':             'IoT',
      'Calculateur':     'Calculateur',
    },
    sensorLabels: {
      temperature: 'Température',
      humidite:    'Humidité',
      vpd:         'VPD',
      ph:          'pH solution',
      ec:          'Conductivité EC',
      niveau_eau:  'Niveau eau',
    },
  },
  EN: {
    arOn:              'AR ON',
    arOff:             'AR OFF',
    active:            'ACTIVE',
    inactive:          'INACTIVE',
    awaiting:          'Waiting for data…',
    refresh:           '⟳  Refresh',
    loading:           'Querying sensors…',
    liveData:          'LIVE DATA',
    systemState:       'SYSTEM STATE',
    resource:          'RESOURCE',
    stationFert:       'FERTIGATION STATION',
    liveReadings:      'LIVE READINGS',
    simulator:         'SIMULATOR — NS RECIPE',
    macros:            'MACRONUTRIENTS (mM)',
    cropLabel:         'Crop / Incrocci Recipe',
    ecTarget:          'Target EC',
    phTarget:          'Target pH',
    phCorrection:      'H₂SO₄ correction',
    calcLink:          'Dashboard → NS Calculator',
    incrocci:          'Incrocci / EUPHOROS EU-FP7 formula · IAV Hassan II',
    catMap: {
      fraise:            'BIOLOGICAL SYSTEM',
      co2:               'CLIMATE CONTROL',
      brumisateur:       'CLIMATE CONTROL',
      ventilation:       'CLIMATE CONTROL',
      'système de refroidissement': 'CLIMATE CONTROL',
      fertigation:       'HYDROPONIC SYSTEM',
      sensors:           'IOT TELEMETRY',
      'ventilation dehors': 'CLIMATE CONTROL',
      'rideaux auto':    'CLIMATE CONTROL',
      'fenetre auto':    'CLIMATE CONTROL',
      'système de ventilation': 'CLIMATE CONTROL',
      monitoring:        'SUPERVISION',
      'station de fertigation': 'HYDROPONIC SYSTEM',
    },
    tabNames: {
      'Infos générales': 'General info',
      'IoT':             'IoT',
      'Calculateur':     'Calculator',
    },
    sensorLabels: {
      temperature: 'Temperature',
      humidite:    'Humidity',
      vpd:         'VPD',
      ph:          'Solution pH',
      ec:          'EC Conductivity',
      niveau_eau:  'Water level',
    },
  },
  AR: {
    arOn:              'AR تشغيل',
    arOff:             'AR إيقاف',
    active:            'نشط',
    inactive:          'غير نشط',
    awaiting:          'في انتظار البيانات…',
    refresh:           '⟳  تحديث',
    loading:           'استجواب أجهزة الاستشعار…',
    liveData:          'بيانات مباشرة',
    systemState:       'حالة النظام',
    resource:          'مصدر',
    stationFert:       'محطة التسميد',
    liveReadings:      'قراءات فورية',
    simulator:         'محاكي — وصفة المحلول الغذائي',
    macros:            'العناصر الكبرى (mM)',
    cropLabel:         'المحصول / وصفة إنكروتشي',
    ecTarget:          'الهدف EC',
    phTarget:          'الهدف pH',
    phCorrection:      'تصحيح H₂SO₄',
    calcLink:          'لوحة التحكم ← الحاسبة',
    incrocci:          'وصفة إنكروتشي / EUPHOROS EU-FP7 · IAV Hassan II',
    catMap: {
      fraise:            'نظام بيولوجي',
      co2:               'تحكم مناخي',
      brumisateur:       'تحكم مناخي',
      ventilation:       'تحكم مناخي',
      'système de refroidissement': 'تحكم مناخي',
      fertigation:       'النظام المائي',
      sensors:           'قياس عن بُعد',
      'ventilation dehors': 'تحكم مناخي',
      'rideaux auto':    'تحكم مناخي',
      'fenetre auto':    'تحكم مناخي',
      'système de ventilation': 'تحكم مناخي',
      monitoring:        'مراقبة',
      'station de fertigation': 'النظام المائي',
    },
    tabNames: {
      'Infos générales': 'معلومات عامة',
      'IoT':             'IoT',
      'Calculateur':     'الحاسبة',
    },
    sensorLabels: {
      temperature: 'الحرارة',
      humidite:    'الرطوبة',
      vpd:         'VPD',
      ph:          'درجة الحموضة',
      ec:          'التوصيل الكهربائي',
      niveau_eau:  'مستوى الماء',
    },
  },
};

function t(key) { return T[window.currentLang]?.[key] ?? T.FR[key] ?? key; }
function tCat(desc) { return T[window.currentLang]?.catMap?.[desc] ?? T.FR.catMap?.[desc] ?? 'DIGITAL TWIN'; }
function tTab(name) { return T[window.currentLang]?.tabNames?.[name] ?? name; }
function tSensor(key) { return T[window.currentLang]?.sensorLabels?.[key] ?? T.FR.sensorLabels?.[key] ?? key; }

/* ── Language switcher ── */
function setLang(lang) {
  window.currentLang = lang;
  // Update lang pill active state
  document.querySelectorAll('.lang-pill').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
  // RTL for Arabic
  const card = document.getElementById('ar-card');
  if(card) card.setAttribute('dir', lang === 'AR' ? 'rtl' : 'ltr');
  // Update AR toggle label
  const lbl = document.getElementById('ar-toggle-label');
  if(lbl) {
    const arEnabled = document.getElementById('ar-toggle')?.classList.contains('ar-on');
    lbl.textContent = arEnabled ? t('arOn') : t('arOff');
  }
  // Re-render open card
  if(window.activeAR) {
    const def = getARDef(window.activeAR);
    if(def) renderARTab(window.activeTab || 0, def);
  }
  // Refresh hero text (title / category / status) in the new language
  if(window.activeAR) arSetHeroText(window.activeAR);
  // Play audio for current hotspot in new lang (future hook)
  if(window.activeAR) playARAudio(window.activeAR, lang);
}

/* ── Audio hook (ready for future MP3s) ── */
window.AR_AUDIO = window.AR_AUDIO || {};
function playARAudio(key, lang) {
  const audio = window.AR_AUDIO?.[key]?.[lang || window.currentLang];
  if(!audio) return;
  if(window._arAudioEl) { window._arAudioEl.pause(); window._arAudioEl.currentTime = 0; }
  window._arAudioEl = new Audio(audio);
  window._arAudioEl.play().catch(()=>{});
}

/* ── Inject lang pill HTML next to AR toggle ── */
function injectLangSwitcher() {
  const toggle = document.getElementById('ar-toggle');
  if(!toggle || document.getElementById('lang-switcher')) return;
  const sw = document.createElement('div');
  sw.id = 'lang-switcher';
  sw.innerHTML = ['FR','EN','AR'].map(l =>
    `<button class="lang-pill${l === window.currentLang ? ' active' : ''}" data-lang="${l}" onclick="setLang('${l}')">${l}</button>`
  ).join('');
  toggle.insertAdjacentElement('afterend', sw);
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 2 — NS CALCULATOR DATA
═══════════════════════════════════════════════════════════════════════ */
const NS_RECIPES = [
  {n:'Fraise NFT',      g:'Petits fruits', ec:1.70, ph:'5.5–6.5', no3:9.99,  nh4:1.0, p:1.0,  k:5.5, ca:3.5, mg:1.2, note:'Culture en cours — S04 Hydroponie'},
  {n:'Laitue',          g:'Feuillus',      ec:2.38, ph:'5.8–6.5', no3:16.0,  nh4:2.0, p:2.0,  k:10.0,ca:4.5, mg:1.0, note:'Cycle court 30–45 jours'},
  {n:'Tomate',          g:'Solanacées',    ec:2.09, ph:'5.5–6.5', no3:14.0,  nh4:1.0, p:1.0,  k:8.0, ca:4.0, mg:1.5, note:'Standard Incrocci EUPHOROS'},
  {n:'Concombre',       g:'Cucurbitacées', ec:2.00, ph:'5.5–6.2', no3:15.0,  nh4:1.0, p:1.2,  k:7.0, ca:4.0, mg:1.5, note:'Haute productivité NFT'},
  {n:'Basilic',         g:'Aromates',      ec:1.60, ph:'5.8–6.5', no3:11.0,  nh4:1.0, p:1.2,  k:6.0, ca:3.0, mg:1.0, note:'Aromatique — cycle 3 semaines'},
  {n:'Hoagland ×1',     g:'Scientifique',  ec:1.99, ph:'5.5–6.5', no3:14.0,  nh4:1.0, p:1.0,  k:6.0, ca:4.0, mg:2.0, note:'Référence scientifique universelle'},
];
const NS_BARS = [
  {l:'NO₃⁻', k:'no3', max:20, c:'#38bdf8'},
  {l:'K⁺',   k:'k',   max:12, c:'#4ade80'},
  {l:'Ca²⁺', k:'ca',  max:6,  c:'#f59e0b'},
  {l:'NH₄⁺', k:'nh4', max:3,  c:'#a78bfa'},
  {l:'P',    k:'p',   max:3,  c:'#fb7185'},
  {l:'Mg²⁺', k:'mg',  max:3,  c:'#34d399'},
];

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 3 — AR_CONTENT
   All 39 hotspot definitions for all viewers.
   Keys are matched by the hotspot's data-ar attribute in the viewer HTML.
   To add/edit a card: find the key below and modify title, sections,
   tabs, statusText, thresholds etc. No viewer file needs to change.
═══════════════════════════════════════════════════════════════════════ */
const AR_CONTENT = {



  'fraise': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(220,80,80,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C12 22 4 16 4 10a8 8 0 0 1 16 0c0 6-8 12-8 12z"/><circle cx="9" cy="10" r="1" fill="rgba(220,80,80,.9)" stroke="none"/><circle cx="13" cy="8.5" r="1" fill="rgba(220,80,80,.9)" stroke="none"/><circle cx="15" cy="12" r="1" fill="rgba(220,80,80,.9)" stroke="none"/><path d="M10 5C9 3 7 3 7.5 1.5M12 4V2M14 5C15 3 17 3 16.5 1.5" stroke-width="1.3"/></svg>`,



    iconBg:'rgba(244,100,100,.18)', iconBorder:'rgba(255,150,150,.3)',



    color:'#ef4444', statusText:'Culture active', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 60%, rgba(244,100,100,.25) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${100+i*50}" cy="${55+Math.sin(i)*15}" r="${6+i*2}" fill="rgba(244,100,100,.${1+i%3})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.4}s infinite"/>`).join('')}</svg>`,



    title:'Fraises — Fragaria × ananassa',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Variété',v:'Fragaria × ananassa'},



        {k:'Famille',v:'Rosacées'},



        {k:'Système',v:'Hors-sol hydroponique',tag:'blue'},



        {k:'Stade',v:'À COMPLÉTER'},



      ]},



      {label:'CONDITIONS OPTIMALES',items:[



        {k:'Température',v:'18 – 22 °C'},



        {k:'Humidité',v:'60 – 75 %'},



        {k:'pH solution',v:'5.8 – 6.2'},



        {k:'EC solution',v:'1.0 – 1.4 mS/cm'},



        {k:'Photopériode',v:'12 – 16 h'},



      ]},



      {label:'CULTURE',bullets:[



        'Cultivée en gouttières surélevées pour optimiser la collecte de solution nutritive.',



        'Le substrat inerte (fibre de coco ou perlite) assure drainage et aération racinaire.',



        'Irrigation programmée par cycles courts, pH et EC ajustés en continu.',



      ]},



    ],



  },







  'courgette': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="14" rx="6" ry="4"/><path d="M12 10V6M10 7l2-1 2 1"/><path d="M6 14c0 3 2.5 5 6 5s6-2 6-5"/></svg>`,



    iconBg:'rgba(74,222,128,.18)', iconBorder:'rgba(74,222,128,.3)',



    color:'#22c55e', statusText:'Culture active', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 60%, rgba(74,222,128,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2].map(i=>`<ellipse cx="${120+i*55}" cy="60" rx="${10+i*3}" ry="6" fill="rgba(74,222,128,.${2+i%2})" style="animation:hero-float ${2.2+i*.4}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Courgette — Cucurbita pepo',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Espèce',v:'Cucurbita pepo'},



        {k:'Famille',v:'Cucurbitacées'},



        {k:'Système',v:'Sol ou substrat',tag:'green'},



        {k:'Stade',v:'À COMPLÉTER'},



      ]},



      {label:'CONDITIONS OPTIMALES',items:[



        {k:'Température jour',v:'22 – 28 °C'},



        {k:'Température nuit',v:'15 – 18 °C'},



        {k:'Humidité',v:'60 – 70 %'},



        {k:'Apport eau',v:'À COMPLÉTER'},



      ]},



      {label:'CULTURE',bullets:[



        'Plante rampante à croissance rapide requérant un tuteurage ou un palissage vertical.',



        'Pollinisation nécessaire — assurée manuellement ou par insectes auxiliaires.',



        'Récolte à stade immature (15–20 cm) pour meilleure qualité gustative.',



      ]},



    ],



  },







  'co2': {



    icon:`<svg width="34" height="22" viewBox="0 0 24 14" fill="none" stroke="rgba(5,150,105,.9)" stroke-width="1.4" stroke-linecap="round"><circle cx="3" cy="7" r="2.5"/><circle cx="12" cy="7" r="3.2"/><circle cx="21" cy="7" r="2.5"/><line x1="5.5" y1="7" x2="8.8" y2="7"/><line x1="15.2" y1="7" x2="18.5" y2="7"/></svg>`,



    iconBg:'rgba(16,185,129,.18)', iconBorder:'rgba(52,211,153,.3)',



    color:'#10b981', statusText:'Injection active',
    statusText_en:'Injection active',
    statusText_ar:'الحقن نشط', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<circle cx="${80+i*50}" cy="${50+Math.sin(i*1.2)*20}" r="${3+i%3}" fill="rgba(110,231,183,.4)" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Injection CO₂',
    title_en:'CO₂ Injection',
    title_ar:'حقن CO₂',



    tabs:['Info','IoT'],



    stateKey:'co2',



    thresholds:[



      {label:'VPD (proxy CO₂)',key:'vpd',unit:'kPa',min:0,max:2,



       onWhen:'VPD > seuil minimum — injection active pour stimuler photosynthèse',



       offWhen:'VPD en dessous du seuil — injection suspendue'},



    ],



    sections:[



      {label:'FONCTIONS',bullets:[



        'L\'enrichissement en CO₂ stimule la photosynthèse et accélère la croissance végétale.',



        'L\'objectif est de maintenir une concentration entre 800 et 1200 ppm en journée.',



        'L\'injection est automatiquement suspendue la nuit ou lorsque la ventilation est ouverte.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Source',v:'Bouteille CO₂ comprimé'},



        {k:'Concentration cible',v:'800 – 1200 ppm'},



        {k:'Déclenchement',v:'Capteur VPD / minuterie'},



        {k:'Sécurité',v:'Coupure ventilation active'},



      ]},



    ],



  },







  'brumisateur': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(13,148,136,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="10" height="6" rx="2"/><path d="M12 12h3"/><path d="M17 8l1.5-2M17 12h1.5M17 16l1.5 2"/><circle cx="20" cy="8" r="1" fill="rgba(13,148,136,.9)" stroke="none"/><circle cx="21" cy="12" r="1" fill="rgba(13,148,136,.9)" stroke="none"/><circle cx="20" cy="16" r="1" fill="rgba(13,148,136,.9)" stroke="none"/></svg>`,



    iconBg:'rgba(45,212,191,.18)', iconBorder:'rgba(94,234,212,.3)',



    color:'#14b8a6', statusText:'Brumisation active',
    statusText_en:'Misting active',
    statusText_ar:'الرذاذ نشط', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(45,212,191,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${90+i*55} 40 Q${95+i*55} 55 ${90+i*55} 70" stroke="rgba(94,234,212,.${3+i%2})" stroke-width="1.5" fill="none" style="animation:hero-float ${1.6+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Brumisateur Haute Pression',
    title_en:'High-Pressure Misting System',
    title_ar:'نظام الرذاذ عالي الضغط',



    tabs:['Info','IoT'],



    stateKey:'brumisateur',



    thresholds:[



      {label:'Température',key:'temperature',unit:'°C',min:15,max:40,



       onWhen:'T° dépasse le seuil max ou humidité insuffisante',



       offWhen:'Température et humidité dans les plages cibles'},



    ],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Produit un brouillard de gouttelettes < 10 µm qui s\'évaporent avant d\'atteindre le sol.',



        'Assure le refroidissement adiabatique de l\'air ambiant et maintien de l\'humidité.',



        'Activé lorsque la température dépasse le seuil maximal ou l\'humidité descend sous le seuil.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Pression',v:'À COMPLÉTER bar'},



        {k:'Débit',v:'À COMPLÉTER L/h'},



        {k:'Buse',v:'Céramique haute pression'},



        {k:'Contrôle',v:'Automatique / seuil'},



      ]},



    ],



  },







  'système de refroidissement': {



    icon:`<svg width="30" height="26" viewBox="0 0 24 20" fill="none" stroke="rgba(37,99,235,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="2" width="22" height="14" rx="2.5"/><line x1="5" y1="5" x2="5" y2="13" stroke-width="1.3" opacity=".7"/><line x1="8.5" y1="5" x2="8.5" y2="13" stroke-width="1.3" opacity=".7"/><line x1="12" y1="5" x2="12" y2="13" stroke-width="1.3" opacity=".7"/><line x1="15.5" y1="5" x2="15.5" y2="13" stroke-width="1.3" opacity=".7"/><line x1="19" y1="5" x2="19" y2="13" stroke-width="1.3" opacity=".7"/></svg>`,



    iconBg:'rgba(59,130,246,.18)', iconBorder:'rgba(147,197,253,.3)',



    color:'#3b82f6', statusText:'Refroidissement actif',
    statusText_en:'Cooling active',
    statusText_ar:'التبريد نشط', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 45%, rgba(59,130,246,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<line x1="${70+i*50}" y1="35" x2="${70+i*50}" y2="85" stroke="rgba(147,197,253,.${2+i%3})" stroke-width="${1+i%2}" style="animation:hero-float ${2+i*.25}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Système de Refroidissement',
    title_en:'Cooling System',
    title_ar:'نظام التبريد',



    tabs:['Info','IoT'],



    stateKey:'système de refroidissement',



    thresholds:[



      {label:'Température serre',key:'temperature',unit:'°C',min:15,max:40,



       onWhen:'Température dépasse le seuil maximal configuré',



       offWhen:'Température dans la plage optimale'},



    ],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Assure le maintien de la température dans la plage optimale pour les cultures.',



        'Fonctionne conjointement avec la ventilation mécanique et le système de brumisation.',



        'Activé automatiquement lorsque la température mesurée dépasse le seuil maximal.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Type',v:'À COMPLÉTER'},



        {k:'Puissance',v:'À COMPLÉTER kW'},



        {k:'Seuil déclenchement',v:'T° > max configuré'},



        {k:'Contrôle',v:'Automatique'},



      ]},



    ],



  },







  'fertigation': {



    icon:`<svg width="28" height="30" viewBox="0 0 24 26" fill="none" stroke="rgba(2,132,199,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="10" rx="2"/><text x="7.5" y="10" font-size="4" font-weight="700" fill="rgba(2,132,199,.9)" stroke="none" font-family="monospace">NPK</text><line x1="8" y1="12" x2="8" y2="18"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="16" y1="12" x2="16" y2="18"/></svg>`,



    iconBg:'rgba(14,165,233,.18)', iconBorder:'rgba(56,189,248,.3)',



    color:'#0ea5e9', statusText:'Fertigation active', statusText_en:'Fertigation active', statusText_ar:'التسميد نشط', type:'fertigation',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(14,165,233,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2].map(i=>`<ellipse cx="${110+i*60}" cy="${70+i*5}" rx="8" ry="12" fill="rgba(56,189,248,.${2+i})" style="animation:hero-float ${2+i*.4}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Station de Fertigation',
    title_en:'Fertigation Station',
    title_ar:'محطة التسميد',



    tabs:['Info','IoT'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Prépare et distribue la solution nutritive aux cultures à intervalles programmés.',



        'Ajuste dynamiquement pH et EC en fonction des mesures en temps réel.',



        'Permet la fertilisation précise en éléments macro et micro selon le stade végétatif.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Volume réservoir',v:'À COMPLÉTER L'},



        {k:'pH cible',v:'5.5 – 6.5'},



        {k:'EC cible',v:'1.0 – 2.2 mS/cm'},



        {k:'Fréquence cycles',v:'Programmable'},



        {k:'Régulation',v:'Automatique',tag:'blue'},



      ]},



    ],



  },







  'ventilation': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(37,99,235,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 10c0 0-.5-2.5 1-3.5s3 .5 2 2.5"/><path d="M13.7 13c0 0 2 1 2 2.5s-1.5 2-2.5-.2"/><path d="M10.3 13c0 0-2 1-2 2.5s1.5 2 2.5-.2"/></svg>`,



    iconBg:'rgba(59,130,246,.18)', iconBorder:'rgba(147,197,253,.3)',



    color:'#3b82f6', statusText:'Ventilation active',
    statusText_en:'Ventilation active',
    statusText_ar:'التهوية نشطة', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${80+i*60} 35 Q${100+i*60} 60 ${80+i*60} 85" stroke="rgba(147,197,253,.${2+i%3})" stroke-width="1.5" fill="none" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Ventilation Mécanique',
    title_en:'Mechanical Ventilation',
    title_ar:'التهوية الميكانيكية',



    tabs:['Info','IoT'],



    stateKey:'ventilation',



    thresholds:[



      {label:'Température',key:'temperature',unit:'°C',min:15,max:40,



       onWhen:'T° proche du seuil max ou humidité excessive',



       offWhen:'Conditions climatiques dans les plages optimales'},



    ],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Assure le renouvellement d\'air et évacue la chaleur et l\'excès d\'humidité.',



        'Maintient la concentration en CO₂ à un niveau optimal pour la photosynthèse.',



        'Activée automatiquement selon les seuils de température et d\'humidité.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Type',v:'Extracteur axial'},



        {k:'Débit',v:'À COMPLÉTER m³/h'},



        {k:'Contrôle',v:'Thermostat + hygrostat'},



        {k:'Vitesse',v:'À COMPLÉTER tr/min'},



      ]},



    ],



  },







  'ventilation dehors': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(8,145,178,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="12" height="16" rx="2"/><line x1="5" y1="8" x2="11" y2="8" opacity=".6"/><line x1="5" y1="11" x2="11" y2="11" opacity=".6"/><line x1="5" y1="14" x2="11" y2="14" opacity=".6"/><path d="M15 8l4 0M17 12l4 0M15 16l4 0" stroke-width="1.6"/></svg>`,



    iconBg:'rgba(6,182,212,.18)', iconBorder:'rgba(103,232,249,.3)',



    color:'#06b6d4', statusText:'Ventilation extérieure',
    statusText_en:'Ventilation active',
    statusText_ar:'التهوية نشطة', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${60+i*70} 50 L${100+i*70} 50" stroke="rgba(103,232,249,.${3+i%2})" stroke-width="2" style="animation:hero-float ${1.5+i*.2}s ease-in-out ${i*.15}s infinite"/>`).join('')}</svg>`,



    title:'Ventilation Extérieure',
    title_en:'External Ventilation',
    title_ar:'التهوية الخارجية',



    tabs:['Info','IoT'],



    stateKey:'ventilation dehors',



    thresholds:[



      {label:'Température',key:'temperature',unit:'°C',min:15,max:40,



       onWhen:'T° proche du seuil max ou humidité excessive — extraction active',



       offWhen:'Conditions dans les plages — ventilation en veille'},



    ],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Extracteur mural assurant l\'évacuation de l\'air vicié vers l\'extérieur.',



        'Complémente la ventilation zénithale naturelle par les fenêtres automatiques.',



        'Synchronisé avec les capteurs intérieurs pour une régulation dynamique.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Emplacement',v:'Mur pignon extérieur'},



        {k:'Type',v:'Extracteur centrifuge'},



        {k:'Débit',v:'À COMPLÉTER m³/h'},



        {k:'Contrôle',v:'Automatique'},



      ]},



    ],



  },







  'sensors': {

    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(109,40,217,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1.5" fill="rgba(109,40,217,.9)" stroke="none"/></svg>`,

    iconBg:'rgba(109,40,217,.18)', iconBorder:'rgba(196,181,253,.3)',

    color:'#8b5cf6', statusText:'Actif',
    statusText_en:'Active',
    statusText_ar:'نشط',
    type:'sensor',

    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,.22) 0%, transparent 65%)',

    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">
      ${[0,1,2].map(i=>`<circle cx="185" cy="60" r="${28+i*22}" stroke="rgba(196,181,253,.${18-i*5})" stroke-width="1" fill="none" style="animation:hero-pulse ${2+i*.6}s ease-in-out ${i*.4}s infinite"/>`).join('')}
      ${[0,1,2,3,4].map(i=>`<circle cx="${65+i*60}" cy="${52+Math.sin(i)*12}" r="3.5" fill="rgba(167,139,250,.${6-i})" style="animation:hero-float ${1.8+i*.25}s ease-in-out ${i*.2}s infinite"/>`).join('')}
      <path d="M50 72 Q120 48 185 60 Q250 72 320 50" stroke="rgba(196,181,253,.25)" stroke-width="1.2" fill="none"/>
    </svg>`,

    title:'Capteurs IoT Environnementaux',
    title_en:'Environmental IoT Sensors',
    title_ar:'مستشعرات IoT البيئية',

    tabs:['Info'],

    /* ─ Audio paths — swap placeholders with real MP3s when recorded ─ */
    audio:{
      FR:'audio/fr/sensors.mp3',
      EN:'audio/en/sensors.mp3',
      AR:'audio/ar/sensors.mp3',
    },

    sections:[], /* content handled by renderSensorsCard — see engine Section 4 */

  },







  'rideaux auto': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(180,83,9,.85)" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="4" x2="22" y2="4"/><circle cx="5" cy="4" r="1" fill="rgba(180,83,9,.85)" stroke="none"/><circle cx="10" cy="4" r="1" fill="rgba(180,83,9,.85)" stroke="none"/><circle cx="15" cy="4" r="1" fill="rgba(180,83,9,.85)" stroke="none"/><circle cx="20" cy="4" r="1" fill="rgba(180,83,9,.85)" stroke="none"/><path d="M4 5 Q5 10 4 15 Q3.5 18 5 21"/><path d="M20 5 Q19 10 20 15 Q20.5 18 19 21"/></svg>`,



    iconBg:'rgba(217,119,6,.18)', iconBorder:'rgba(251,191,36,.3)',



    color:'#fbbf24', statusText:'Rideaux déployés',
    statusText_en:'Curtains deployed',
    statusText_ar:'الستائر منتشرة', type:'system',



    heroGradient:'radial-gradient(ellipse at 35% 55%, rgba(217,119,6,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none"><rect x="130" y="10" width="110" height="3" rx="1.5" fill="rgba(251,191,36,.3)"/>${[0,1,2].map(i=>`<path d="M${135+i*35} 13 Q${138+i*35} 40 ${135+i*35} 70" stroke="rgba(251,191,36,.${2+i})" stroke-width="1.5" fill="none" style="animation:hero-float ${2.5+i*.4}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Écrans thermique',
    title_en:'Thermic Screens',
    title_ar:'الشاشات الحرارية ',



    tabs:['Info','IoT'],



    stateKey:'rideaux auto',



    thresholds:[



      {label:'Température extérieure',key:'outsideTemp',unit:'°C',min:-5,max:45,



       onWhen:'Température extérieure entre 10°C et 32°C',



       offWhen:'Température extérieure hors plage de déploiement'},



    ],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Réduit les pertes thermiques nocturnes en formant une barrière isolante sous la toiture.',



        'Assure un ombrage thermique en journée pour prévenir la surchauffe estivale.',



        'Le déploiement est conditionné par la température extérieure pour éviter le confinement.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Matériau',v:'À COMPLÉTER'},



        {k:'Transmission lumière',v:'À COMPLÉTER'},



        {k:'Plage déploiement',v:'10 – 32 °C ext.'},



        {k:'Contrôle',v:'Automatique'},



      ]},



    ],



  },







  'fenetre auto': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(8,145,178,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21" opacity=".4"/><line x1="2" y1="12" x2="22" y2="12" opacity=".4"/><path d="M3 4 L8 4 Q6 7 6 11 L3 12Z" fill="rgba(103,232,249,.2)"/><path d="M18 5l3 0M19.5 3.5l1.5 1.5-1.5 1.5" stroke-width="1.4"/></svg>`,



    iconBg:'rgba(6,182,212,.18)', iconBorder:'rgba(103,232,249,.3)',



    color:'#22d3ee', statusText:'Ouverture active',
    statusText_en:'Opening active',
    statusText_ar:'الفتح نشط', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 50%, rgba(6,182,212,.25) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${140+i*22} 40 L${155+i*22} 55 L${140+i*22} 70" stroke="rgba(103,232,249,.${2+i%3})" stroke-width="1.3" fill="none" style="animation:hero-float ${1.8+i*.2}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Fenêtres Automatiques',
    title_en:'Automatic Windows',
    title_ar:'النوافذ الأوتوماتيكية',



    tabs:['Info','IoT'],



    stateKey:'fenetre auto',



    thresholds:[



      {label:'Température serre',key:'temperature',unit:'°C',min:15,max:40,



       onWhen:'T° intérieure > seuil max et T° extérieure plus fraîche',



       offWhen:'Conditions non favorables à l\'ouverture'},



    ],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Assure une ventilation naturelle par effet cheminée — l\'air chaud s\'échappe par les châssis zénithaux.',



        'Ouverture conditionnée : T° intérieure > seuil max ET T° extérieure plus fraîche.',



        'Extraction passive silencieuse, complémentaire à la ventilation mécanique.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Type',v:'Châssis zénithaux'},



        {k:'Déclenchement',v:'ΔT intérieur / extérieur'},



        {k:'Ouverture',v:'À COMPLÉTER'},



        {k:'Sécurité',v:'À COMPLÉTER'},



      ]},



    ],



  },







  'système de ventilation': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(37,99,235,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 10c0 0-.5-2.5 1-3.5s3 .5 2 2.5"/><path d="M13.7 13c0 0 2 1 2 2.5s-1.5 2-2.5-.2"/><path d="M10.3 13c0 0-2 1-2 2.5s1.5 2 2.5-.2"/><circle cx="12" cy="12" r="6" stroke-dasharray="3 3" opacity=".3"/></svg>`,



    iconBg:'rgba(59,130,246,.18)', iconBorder:'rgba(147,197,253,.3)',



    color:'#3b82f6', statusText:'Actif',
    statusText_en:'Active',
    statusText_ar:'نشط', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${80+i*60} 35 Q${100+i*60} 60 ${80+i*60} 85" stroke="rgba(147,197,253,.${2+i%3})" stroke-width="1.5" fill="none" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Système de Ventilation Général',
    title_en:'General Ventilation System',
    title_ar:'نظام التهوية العام',



    tabs:['Info'],



    sections:[



      {label:'COMPOSANTS',bullets:[



        'Ensemble des extracteurs mécaniques, fenêtres automatiques et rideaux thermiques.',



        'Régulation centralisée depuis la salle de contrôle via automates programmables.',



        'Monitoring en temps réel des paramètres climatiques par les capteurs IoT.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Type',v:'Hybride — mécanique + naturel'},



        {k:'Contrôle',v:'Automate PLC'},



        {k:'Capteurs',v:'T°, HR, VPD'},



        {k:'Protocole',v:'Guardian Pro API'},



      ]},



    ],



  },







  // ── Couloir Serre — Signage ──



  'unité génétique et amélioration des plantes': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M12 3C9 3 7 5.5 7 8c0 3 2 5 5 5s5-2 5-5c0-2.5-2-5-5-5z"/><path d="M9 13c-2 1-3 3-3 5h12c0-2-1-4-3-5"/><path d="M10 8c0 0 1 2 2 2s2-2 2-2" opacity=".5"/></svg>`,



    iconBg:'rgba(16,185,129,.18)', iconBorder:'rgba(52,211,153,.3)',



    color:'#10b981', statusText:'Unité S01', type:'system',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(16,185,129,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${80+i*65}" cy="${55+Math.sin(i)*10}" r="${4+i%3}" fill="rgba(52,211,153,.3)" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Unité Génétique et Amélioration',



    tabs:['Info'],



    sections:[



      {label:'MISSION',bullets:[



        'Recherche sur l\'amélioration génétique des plantes cultivées en conditions contrôlées.',



        'Sélection variétale, croisements et évaluation de performances agronomiques.',



        'Travaux sur la résistance aux maladies et l\'adaptation aux stress climatiques.',



      ]},



      {label:'INFORMATIONS',items:[



        {k:'Code serre',v:'S01',tag:'green'},



        {k:'Surface',v:'À COMPLÉTER m²'},



        {k:'Cultures',v:'Espèces améliorées'},



        {k:'Accès',v:'Personnel autorisé'},



      ]},



    ],



  },







  'unité horticulture': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M12 22V10M12 10C12 6 8 4 5 5c0 4 3 6 7 5M12 10C12 6 16 4 19 5c0 4-3 6-7 5"/><path d="M8 18c-2 1-3 2-3 4h14c0-2-1-3-3-4" opacity=".5"/></svg>`,



    iconBg:'rgba(34,197,94,.18)', iconBorder:'rgba(74,222,128,.3)',



    color:'#22c55e', statusText:'Unité S02', type:'system',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(34,197,94,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${90+i*55} ${75-i*5} Q${100+i*55} 45 ${110+i*55} ${75-i*5}" stroke="rgba(74,222,128,.${3+i%2})" stroke-width="1.5" fill="none" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Unité Horticulture',



    tabs:['Info'],



    sections:[



      {label:'MISSION',bullets:[



        'Culture et expérimentation de plantes horticoles ornementales et maraîchères.',



        'Étude des techniques de production en conditions de serre contrôlée.',



        'Formation pratique des étudiants aux méthodes horticoles modernes.',



      ]},



      {label:'INFORMATIONS',items:[



        {k:'Code serre',v:'S02',tag:'green'},



        {k:'Surface',v:'À COMPLÉTER m²'},



        {k:'Cultures',v:'Horticulture ornementale'},



        {k:'Accès',v:'Étudiants et personnel'},



      ]},



    ],



  },







  'unité agronomie': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M3 20h18M3 20l3-8h12l3 8"/><path d="M8 12V8c0-2 1.5-4 4-4s4 2 4 4v4"/><line x1="12" y1="12" x2="12" y2="20"/></svg>`,



    iconBg:'rgba(251,191,36,.18)', iconBorder:'rgba(253,224,71,.3)',



    color:'#f59e0b', statusText:'Unité S03', type:'system',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(251,191,36,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<line x1="${80+i*50}" y1="75" x2="${80+i*50}" y2="${40+i*7}" stroke="rgba(253,224,71,.${3+i%2})" stroke-width="${1+i%2}" style="animation:hero-float ${2+i*.25}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Unité Agronomie',



    tabs:['Info'],



    sections:[



      {label:'MISSION',bullets:[



        'Expérimentation agronomique sur les grandes cultures et les systèmes de production.',



        'Études sur la fertilisation, l\'irrigation et la gestion des intrants agricoles.',



        'Évaluation de nouvelles variétés céréalières et légumineuses.',



      ]},



      {label:'INFORMATIONS',items:[



        {k:'Code serre',v:'S03',tag:'amber'},



        {k:'Surface',v:'À COMPLÉTER m²'},



        {k:'Cultures',v:'Grandes cultures'},



        {k:'Accès',v:'Étudiants et personnel'},



      ]},



    ],



  },







  'unité protection des plantes': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" opacity=".7"/></svg>`,



    iconBg:'rgba(239,68,68,.18)', iconBorder:'rgba(252,165,165,.3)',



    color:'#ef4444', statusText:'Unité S05', type:'system',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(239,68,68,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${95+i*55} ${65-i*4} Q${100+i*55} 42 ${105+i*55} ${65-i*4}" stroke="rgba(252,165,165,.${3+i%2})" stroke-width="1.5" fill="none" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Unité Protection des Plantes',



    tabs:['Info'],



    sections:[



      {label:'MISSION',bullets:[



        'Étude et gestion des maladies, ravageurs et adventices affectant les cultures.',



        'Développement de méthodes de lutte biologique et intégrée contre les bioagresseurs.',



        'Formation aux techniques phytosanitaires et à la protection raisonnée des végétaux.',



      ]},



      {label:'INFORMATIONS',items:[



        {k:'Code serre',v:'S05',tag:'red'},



        {k:'Surface',v:'À COMPLÉTER m²'},



        {k:'Spécialité',v:'Phytopathologie & entomologie'},



        {k:'Accès',v:'Étudiants et personnel'},



      ]},



    ],



  },







  'unité hydroponie': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(14,165,233,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M8 14c0 2 2 4 4 4s4-2 4-4" opacity=".5"/></svg>`,



    iconBg:'rgba(14,165,233,.18)', iconBorder:'rgba(56,189,248,.3)',



    color:'#0ea5e9', statusText:'Unité S04', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(14,165,233,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${90+i*55} 40 Q${100+i*55} 60 ${90+i*55} 80" stroke="rgba(56,189,248,.${2+i%3})" stroke-width="1.5" fill="none" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Unité Hydroponie',



    tabs:['Info'],



    sections:[



      {label:'MISSION',bullets:[



        'Culture hors-sol en système hydroponique avec solution nutritive recirculante.',



        'Expérimentation sur la production de légumes et petits fruits en NFT et DWC.',



        'Monitoring IoT en temps réel de pH, EC, température et niveau de solution.',



      ]},



      {label:'INFORMATIONS',items:[



        {k:'Code serre',v:'S04',tag:'blue'},



        {k:'Surface',v:'À COMPLÉTER m²'},



        {k:'Système',v:'NFT / DWC'},



        {k:'Monitoring',v:'Guardian Pro IoT',tag:'blue'},



      ]},



    ],



  },







  // ── Couloir Bloc — Signage ──



  'salle de lavage': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(14,165,233,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 4 0v2"/><path d="M8 13a4 4 0 0 0 8 0" opacity=".5"/></svg>`,



    iconBg:'rgba(14,165,233,.18)', iconBorder:'rgba(56,189,248,.3)',



    color:'#0ea5e9', statusText:'Salle de service', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(14,165,233,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${90+i*55}" cy="${55+i*5}" r="${4+i%3}" fill="rgba(56,189,248,.${2+i%3})" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Salle de Lavage',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Nettoyage et décontamination du matériel végétal et des équipements de culture.',



        'Gestion des effluents et traitement des eaux de rinçage avant rejet ou recyclage.',



        'Prévention de la contamination croisée entre les unités de culture.',



      ]},



      {label:'ÉQUIPEMENTS',items:[



        {k:'Bacs lavage',v:'À COMPLÉTER'},



        {k:'Eau chaude',v:'Disponible'},



        {k:'Évacuation',v:'Réseau assainissement'},



        {k:'Désinfection',v:'Protocole établi'},



      ]},



    ],



  },







  'salle technique de commandes': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="8" cy="10" r="2" opacity=".6"/><line x1="13" y1="8" x2="18" y2="8"/><line x1="13" y1="12" x2="16" y2="12"/></svg>`,



    iconBg:'rgba(139,92,246,.18)', iconBorder:'rgba(196,181,253,.3)',



    color:'#8b5cf6', statusText:'Salle de contrôle', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<rect x="${70+i*55}" y="${45+i*3}" width="${8+i%3}" height="${30-i*3}" rx="2" fill="rgba(196,181,253,.${2+i%3})" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Salle Technique de Commandes',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Centralise le pilotage et la supervision des équipements techniques des serres.',



        'Automates programmables (PLC) gérant l\'irrigation, la ventilation et le chauffage.',



        'Interface SCADA pour la visualisation et le contrôle en temps réel des paramètres.',



      ]},



      {label:'ÉQUIPEMENTS',items:[



        {k:'Automates',v:'PLC industriels'},



        {k:'Interface',v:'SCADA / HMI'},



        {k:'Connectivité',v:'Réseau Guardian Pro'},



        {k:'Supervision',v:'24h / 7j',tag:'blue'},



      ]},



    ],



  },







  'local technique d\'équipements': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(107,114,128,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,



    iconBg:'rgba(107,114,128,.18)', iconBorder:'rgba(156,163,175,.3)',



    color:'#6b7280', statusText:'Local technique', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(107,114,128,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${80+i*65}" cy="${55+i*5}" r="${5+i%3}" fill="rgba(156,163,175,.${2+i%3})" stroke="none" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Local Technique d\'Équipements',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Stockage et maintenance des équipements techniques et pièces de rechange.',



        'Espace de travail pour les interventions de maintenance sur le matériel.',



        'Accès réservé au personnel technique qualifié.',



      ]},



      {label:'CONTENU',items:[



        {k:'Outillage',v:'Électrique et mécanique'},



        {k:'Pièces',v:'Pompes, vannes, capteurs'},



        {k:'Sécurité',v:'Accès restreint'},



        {k:'Inventaire',v:'Gestion CMMS'},



      ]},



    ],



  },







  'salle de fertilisation et traitement d\'eau': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(14,165,233,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="12" y1="11" x2="12" y2="17"/></svg>`,



    iconBg:'rgba(14,165,233,.18)', iconBorder:'rgba(56,189,248,.3)',



    color:'#0ea5e9', statusText:'Salle de fertigation', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(14,165,233,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${90+i*55} 40 Q${95+i*55} 60 ${90+i*55} 80" stroke="rgba(56,189,248,.${2+i%3})" stroke-width="1.5" fill="none" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Salle de Fertilisation et Traitement',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Préparation des solutions fertilisantes concentrées pour les unités de culture.',



        'Traitement de l\'eau d\'irrigation : filtration, déminéralisation et adoucissement.',



        'Contrôle analytique de la qualité de l\'eau avant distribution aux serres.',



      ]},



      {label:'ÉQUIPEMENTS',items:[



        {k:'Traitement',v:'Osmose inverse / Adoucisseur'},



        {k:'Stockage',v:'Cuves concentrés A et B'},



        {k:'Analyses',v:'pH-mètre, conductivimètre'},



        {k:'Distribution',v:'Réseau sous pression'},



      ]},



    ],



  },







  'salle de réunion': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/><circle cx="9" cy="13" r="1.5" fill="rgba(99,102,241,.9)" stroke="none"/><circle cx="15" cy="13" r="1.5" fill="rgba(99,102,241,.9)" stroke="none"/></svg>`,



    iconBg:'rgba(99,102,241,.18)', iconBorder:'rgba(165,180,252,.3)',



    color:'#6366f1', statusText:'Salle de réunion', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<circle cx="${70+i*55}" cy="60" r="${4+i%3}" fill="rgba(165,180,252,.${2+i%3})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Salle de Réunion',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Espace de travail collaboratif pour les réunions d\'équipe et séances de travail.',



        'Utilisée pour les formations, présentations et soutenances de projets.',



        'Équipée de supports audiovisuels pour les présentations techniques.',



      ]},



      {label:'ÉQUIPEMENTS',items:[



        {k:'Capacité',v:'À COMPLÉTER personnes'},



        {k:'Projection',v:'Vidéoprojecteur / Écran'},



        {k:'Connectivité',v:'WiFi + filaire'},



        {k:'Mobilier',v:'Table conférence'},



      ]},



    ],



  },







  'salle de préparation': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(234,179,8,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4V2M16 4V2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="15" x2="16" y2="15" opacity=".5"/></svg>`,



    iconBg:'rgba(234,179,8,.18)', iconBorder:'rgba(253,224,71,.3)',



    color:'#eab308', statusText:'Salle de préparation', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(234,179,8,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<rect x="${80+i*60}" y="${45+i*5}" width="12" height="${25-i*3}" rx="2" fill="rgba(253,224,71,.${2+i%3})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Salle de Préparation',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Préparation des semis, greffage et multiplication végétative des plants.',



        'Acclimatation des jeunes plants avant transplantation en serre de production.',



        'Stockage et préparation des substrats et mélanges terreau.',



      ]},



      {label:'ÉQUIPEMENTS',items:[



        {k:'Tables de travail',v:'Inox, ergonomiques'},



        {k:'Éclairage',v:'LED spectre croissance'},



        {k:'Hygiène',v:'Protocole de biosécurité'},



        {k:'Stockage',v:'Substrats et intrants'},



      ]},



    ],



  },







  // ── Extérieur ──



  'bloc gestion technique et administrative': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,



    iconBg:'rgba(99,102,241,.18)', iconBorder:'rgba(165,180,252,.3)',



    color:'#6366f1', statusText:'Bâtiment administratif', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none"><rect x="120" y="20" width="130" height="80" rx="4" fill="rgba(165,180,252,.1)" stroke="rgba(165,180,252,.3)" stroke-width="1"/>${[0,1,2].map(i=>`<rect x="${135+i*40}" y="35" width="20" height="25" rx="2" fill="rgba(165,180,252,.15)" style="animation:hero-float ${2+i*.4}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Bloc Gestion Technique et Administrative',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Héberge les bureaux de l\'équipe de direction et d\'encadrement du campus AgroBioTech.',



        'Centralise la gestion administrative et logistique du site.',



        'Comprend les salles de réunion, la salle de contrôle et les locaux techniques.',



      ]},



      {label:'INFORMATIONS',items:[



        {k:'Type',v:'Bâtiment permanent'},



        {k:'Surface',v:'À COMPLÉTER m²'},



        {k:'Niveaux',v:'À COMPLÉTER'},



        {k:'Localisation',v:'Entrée campus AgroBioTech'},



      ]},



    ],



  },







  'serre': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M3 12L12 4l9 8"/><rect x="5" y="12" width="14" height="9" rx="1"/><path d="M9 21v-6h6v6"/></svg>`,



    iconBg:'rgba(34,197,94,.18)', iconBorder:'rgba(74,222,128,.3)',



    color:'#22c55e', statusText:'Complexe de serres', type:'system',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(34,197,94,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none"><path d="M80 80L185 30L290 80" stroke="rgba(74,222,128,.3)" stroke-width="1.5"/><rect x="90" y="80" width="190" height="30" fill="rgba(74,222,128,.08)" stroke="rgba(74,222,128,.25)" stroke-width="1"/></svg>`,



    title:'Complexe de Serres AgroBioTech',



    tabs:['Info'],



    sections:[



      {label:'STRUCTURE',bullets:[



        'Ensemble de 5 unités de serres spécialisées interconnectées par un couloir central.',



        'Construction en verre et aluminium avec toiture en arc, maximisant la luminosité.',



        'Superficie totale d\'environ 2 000 m² dédiés à la recherche et l\'expérimentation.',



      ]},



      {label:'UNITÉS',items:[



        {k:'S01',v:'Génétique et Amélioration',tag:'green'},



        {k:'S02',v:'Horticulture',tag:'green'},



        {k:'S03',v:'Agronomie',tag:'green'},



        {k:'S04',v:'Hydroponie',tag:'blue'},



        {k:'S05',v:'Protection des Plantes',tag:'amber'},



      ]},



    ],



  },







  'bloc protection des plantes': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(251,146,60,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" opacity=".7"/></svg>`,



    iconBg:'rgba(251,146,60,.18)', iconBorder:'rgba(253,186,116,.3)',



    color:'#f97316', statusText:'Unité S05', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(251,146,60,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${90+i*60}" cy="${55+i*5}" r="${4+i%3}" fill="rgba(253,186,116,.${2+i%3})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Bloc Protection des Plantes',



    tabs:['Info'],



    sections:[



      {label:'MISSION',bullets:[



        'Diagnostic phytosanitaire et étude des maladies fongiques, virales et bactériennes.',



        'Évaluation et développement de méthodes de lutte biologique et intégrée.',



        'Conservation de collections de plantes malades pour la recherche.',



      ]},



      {label:'INFORMATIONS',items:[



        {k:'Code serre',v:'S05',tag:'amber'},



        {k:'Surface',v:'À COMPLÉTER m²'},



        {k:'Spécialité',v:'Phytopathologie'},



        {k:'Accès',v:'Personnel autorisé',tag:'amber'},



      ]},



    ],



  },







  'ventilation ext': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(8,145,178,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 10c0 0-.5-2.5 1-3.5s3 .5 2 2.5"/><path d="M13.7 13c0 0 2 1 2 2.5s-1.5 2-2.5-.2"/><path d="M10.3 13c0 0-2 1-2 2.5s1.5 2 2.5-.2"/><circle cx="12" cy="12" r="7" stroke-dasharray="3 3" opacity=".25"/></svg>`,



    iconBg:'rgba(6,182,212,.18)', iconBorder:'rgba(103,232,249,.3)',



    color:'#06b6d4', statusText:'Ventilation extérieure', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${60+i*70} 50 L${100+i*70} 50" stroke="rgba(103,232,249,.${3+i%2})" stroke-width="2" style="animation:hero-float ${1.5+i*.2}s ease-in-out ${i*.15}s infinite"/>`).join('')}</svg>`,



    title:'Ventilation Extérieure',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Extracteur de toiture assurant la ventilation naturelle assistée du complexe.',



        'Évacuation de l\'air chaud et humide par convection thermique.',



        'Entretien minimal — pièces mécaniques accessibles depuis la toiture.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Type',v:'Éolienne de ventilation'},



        {k:'Emplacement',v:'Toiture serre'},



        {k:'Entraînement',v:'Thermique / éolien'},



        {k:'Maintenance',v:'Annuelle'},



      ]},



    ],



  },







  'le truc exterieur': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(107,114,128,.9)" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3" opacity=".6"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/></svg>`,



    iconBg:'rgba(107,114,128,.18)', iconBorder:'rgba(156,163,175,.3)',



    color:'#6b7280', statusText:'Équipement extérieur', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(107,114,128,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${80+i*65}" cy="${55+i*5}" r="${4+i%3}" fill="rgba(156,163,175,.${2+i%3})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Équipement Extérieur',



    tabs:['Info'],



    sections:[



      {label:'INFORMATIONS',bullets:[



        'Équipement ou infrastructure extérieure du campus AgroBioTech.',



        'Description à compléter lors de la visite de terrain.',



      ]},



      {label:'DÉTAILS',items:[



        {k:'Type',v:'À COMPLÉTER'},



        {k:'Fonction',v:'À COMPLÉTER'},



        {k:'Emplacement',v:'Extérieur campus'},



      ]},



    ],



  },







  // ── Unite-Protection — Phyto plants ──



  'avocatier': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,.9)" stroke-width="1.5" stroke-linecap="round"><ellipse cx="12" cy="13" rx="5" ry="7"/><circle cx="12" cy="14" r="2.5" fill="rgba(139,92,246,.3)" stroke="rgba(139,92,246,.6)" stroke-width="1"/><path d="M12 6V3M10 4l2-1 2 1"/></svg>`,



    iconBg:'rgba(74,222,128,.18)', iconBorder:'rgba(74,222,128,.3)',



    color:'#22c55e', statusText:'Spécimen en observation', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 60%, rgba(74,222,128,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<ellipse cx="${90+i*55}" cy="${60+i*3}" rx="${8+i*2}" ry="${12+i*2}" fill="rgba(74,222,128,.${1+i%3})" style="animation:hero-float ${2+i*.35}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Avocatier — Persea americana',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Espèce',v:'Persea americana'},



        {k:'Famille',v:'Lauracées'},



        {k:'Origine',v:'Mésoamérique'},



        {k:'Statut',v:'Observation phytosanitaire',tag:'amber'},



      ]},



      {label:'CONDITIONS OPTIMALES',items:[



        {k:'Température',v:'18 – 30 °C'},



        {k:'Humidité',v:'60 – 75 %'},



        {k:'Lumière',v:'Plein soleil à mi-ombre'},



        {k:'Sol',v:'Bien drainé, pH 6–7'},



      ]},



      {label:'PATHOLOGIES ÉTUDIÉES',bullets:[



        'Cercosporose : taches brunes à nécrotiques sur feuilles causées par Cercospora sp.',



        'Pourriture phytophthoreenne des racines — Phytophthora cinnamomi.',



        'Observation de la résistance variétale aux principaux agents pathogènes.',



      ]},



    ],



  },







  'cactus malade': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(251,146,60,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M12 22v-8M12 14c0-4 2-6 2-10M12 14c0-4-2-6-2-10"/><path d="M8 16h8"/><circle cx="15" cy="8" r="2" fill="rgba(239,68,68,.2)" stroke="rgba(239,68,68,.6)" stroke-width="1"/></svg>`,



    iconBg:'rgba(251,146,60,.18)', iconBorder:'rgba(253,186,116,.3)',



    color:'#f97316', statusText:'Sujet malade en étude', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(251,146,60,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2].map(i=>`<circle cx="${110+i*65}" cy="${55+i*5}" r="${6+i*2}" fill="rgba(253,186,116,.${2+i%2})" style="animation:hero-float ${2+i*.35}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Cactus — Spécimen en observation',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Famille',v:'Cactacées'},



        {k:'Origine',v:'Amérique tropicale'},



        {k:'Statut',v:'Sujet malade',tag:'amber'},



        {k:'Pathologie',v:'En cours de diagnostic'},



      ]},



      {label:'PATHOLOGIES OBSERVÉES',bullets:[



        'Pourriture molle ou sèche du pivot ou des cladodes — agents fongiques ou bactériens.',



        'Cochenilles farineuses et cochenilles à carapace — infestations fréquentes en serre.',



        'Chlorose des aréoles pouvant indiquer une carence ou une infection virale.',



      ]},



      {label:'PROTOCOLE',items:[



        {k:'Isolement',v:'Zone quarantaine'},



        {k:'Traitement',v:'En évaluation'},



        {k:'Suivi',v:'Hebdomadaire'},



      ]},



    ],



  },







  'tomates malades': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,.9)" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="14" r="6"/><path d="M12 8c0-2 1-4 2-4M12 8c0-2-1-4-2-4M10 9l2-1 2 1"/><circle cx="10" cy="14" r="1" fill="rgba(239,68,68,.6)" stroke="none"/><circle cx="14" cy="16" r="1" fill="rgba(239,68,68,.6)" stroke="none"/></svg>`,



    iconBg:'rgba(239,68,68,.18)', iconBorder:'rgba(252,165,165,.3)',



    color:'#ef4444', statusText:'Étude phytopathologique', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(239,68,68,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${90+i*55}" cy="${55+i*5}" r="${7+i*2}" fill="rgba(252,165,165,.${2+i%2})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Tomates — Étude phytopathologique',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Espèce',v:'Solanum lycopersicum'},



        {k:'Famille',v:'Solanacées'},



        {k:'Statut',v:'Plants malades en étude',tag:'amber'},



        {k:'Pathologie',v:'Agents multiples'},



      ]},



      {label:'MALADIES ÉTUDIÉES',bullets:[



        'Mildiou — Phytophthora infestans : taches huileuses évoluant en nécroses.',



        'Botrytis cinerea : pourriture grise affectant tiges, feuilles et fruits.',



        'Virus de la mosaïque de la tomate (ToMV) et virus TY (TYLCV).',



        'Alternariose — Alternaria solani : taches concentriques sur feuilles.',



      ]},



      {label:'OBJECTIFS RECHERCHE',items:[



        {k:'Type d\'étude',v:'Épidémiologie'},



        {k:'Méthode',v:'Inoculation contrôlée'},



        {k:'Application',v:'Lutte intégrée'},



      ]},



    ],



  },







  'tomate malades': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,.9)" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="14" r="6"/><path d="M12 8c0-2 1-4 2-4M12 8c0-2-1-4-2-4M10 9l2-1 2 1"/><circle cx="10" cy="14" r="1" fill="rgba(239,68,68,.6)" stroke="none"/><circle cx="14" cy="16" r="1" fill="rgba(239,68,68,.6)" stroke="none"/></svg>`,



    iconBg:'rgba(239,68,68,.18)', iconBorder:'rgba(252,165,165,.3)',



    color:'#ef4444', statusText:'Étude phytopathologique', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(239,68,68,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${90+i*55}" cy="${55+i*5}" r="${7+i*2}" fill="rgba(252,165,165,.${2+i%2})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Tomate — Étude phytopathologique',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Espèce',v:'Solanum lycopersicum'},



        {k:'Famille',v:'Solanacées'},



        {k:'Statut',v:'Plant malade en étude',tag:'amber'},



        {k:'Pathologie',v:'En cours de diagnostic'},



      ]},



      {label:'MALADIES ÉTUDIÉES',bullets:[



        'Mildiou — Phytophthora infestans : taches huileuses évoluant en nécroses.',



        'Botrytis cinerea : pourriture grise affectant tiges, feuilles et fruits.',



        'Virus de la mosaïque de la tomate (ToMV) et virus TY (TYLCV).',



      ]},



    ],



  },







  'tomate malade': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,.9)" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="14" r="6"/><path d="M12 8c0-2 1-4 2-4M10 9l2-1 2 1"/><circle cx="10" cy="14" r="1" fill="rgba(239,68,68,.6)" stroke="none"/></svg>`,



    iconBg:'rgba(239,68,68,.18)', iconBorder:'rgba(252,165,165,.3)',



    color:'#ef4444', statusText:'Étude phytopathologique', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(239,68,68,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2].map(i=>`<circle cx="${100+i*65}" cy="${55+i*5}" r="${6+i*2}" fill="rgba(252,165,165,.${2+i%2})" style="animation:hero-float ${2+i*.35}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Tomate — Spécimen pathologique',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Espèce',v:'Solanum lycopersicum'},



        {k:'Statut',v:'Sujet malade',tag:'amber'},



        {k:'Pathologie',v:'En cours de diagnostic'},



      ]},



      {label:'SYMPTÔMES',bullets:[



        'Observation de symptômes caractéristiques de maladie fongique ou virale.',



        'Plant isolé pour étude en conditions contrôlées de l\'unité phytosanitaire.',



      ]},



    ],



  },







  'ble malade': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,.9)" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="22" x2="12" y2="6"/><path d="M12 6L9 3M12 6L15 3"/><path d="M9 9l3-1 3 1M9 12l3-1 3 1M9 15l3-1 3 1"/></svg>`,



    iconBg:'rgba(251,191,36,.18)', iconBorder:'rgba(253,224,71,.3)',



    color:'#f59e0b', statusText:'Céréale en observation', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(251,191,36,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<line x1="${80+i*50}" y1="75" x2="${80+i*50}" y2="${30+i*5}" stroke="rgba(253,224,71,.${3+i%2})" stroke-width="${1+i%2}" style="animation:hero-float ${2+i*.25}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Blé — Étude phytopathologique',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Espèce',v:'Triticum aestivum'},



        {k:'Famille',v:'Poacées (Graminées)'},



        {k:'Statut',v:'Céréale en observation',tag:'amber'},



        {k:'Pathologie',v:'En cours de diagnostic'},



      ]},



      {label:'MALADIES ÉTUDIÉES',bullets:[



        'Rouille brune — Puccinia triticina : pustules rouille-orangé sur feuilles.',



        'Septoriose — Septoria tritici : taches chlorotiques avec pycnides noires.',



        'Oïdium — Blumeria graminis f. sp. tritici : feutrage blanc pulvérulent.',



        'Fusariose de l\'épi — Fusarium culmorum : décoloration et stérilité.',



      ]},



      {label:'IMPORTANCE',items:[



        {k:'Enjeu',v:'Sécurité alimentaire'},



        {k:'Méthode',v:'Lutte intégrée'},



        {k:'Application',v:'Sélection variétale résistante'},



      ]},



    ],



  },







  'blé malade': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,.9)" stroke-width="1.5" stroke-linecap="round"><line x1="12" y1="22" x2="12" y2="6"/><path d="M12 6L9 3M12 6L15 3"/><path d="M9 9l3-1 3 1M9 12l3-1 3 1M9 15l3-1 3 1"/></svg>`,



    iconBg:'rgba(251,191,36,.18)', iconBorder:'rgba(253,224,71,.3)',



    color:'#f59e0b', statusText:'Céréale en observation', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(251,191,36,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<line x1="${80+i*50}" y1="75" x2="${80+i*50}" y2="${30+i*5}" stroke="rgba(253,224,71,.${3+i%2})" stroke-width="${1+i%2}" style="animation:hero-float ${2+i*.25}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Blé — Étude phytopathologique',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Espèce',v:'Triticum aestivum'},



        {k:'Famille',v:'Poacées'},



        {k:'Statut',v:'Sujet malade',tag:'amber'},



      ]},



      {label:'MALADIES ÉTUDIÉES',bullets:[



        'Rouille brune — Puccinia triticina : pustules rouille-orangé sur feuilles.',



        'Septoriose — Septoria tritici : taches chlorotiques avec pycnides noires.',



        'Fusariose de l\'épi — Fusarium culmorum.',



      ]},



    ],



  },







  'plante x': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,.9)" stroke-width="1.5" stroke-linecap="round"><path d="M12 22V10M12 10C10 6 6 5 4 7c2 3 6 4 8 3M12 10C14 6 18 5 20 7c-2 3-6 4-8 3"/><circle cx="12" cy="8" r="2" fill="rgba(139,92,246,.2)" stroke-width="1"/></svg>`,



    iconBg:'rgba(139,92,246,.18)', iconBorder:'rgba(196,181,253,.3)',



    color:'#8b5cf6', statusText:'Spécimen non identifié', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 55%, rgba(139,92,246,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<circle cx="${90+i*55}" cy="${55+i*5}" r="${5+i%3}" fill="rgba(196,181,253,.${2+i%3})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Plante X — Spécimen non identifié',



    tabs:['Info'],



    sections:[



      {label:'STATUT',items:[



        {k:'Identification',v:'En cours',tag:'purple'},



        {k:'Famille',v:'À déterminer'},



        {k:'Origine',v:'À déterminer'},



        {k:'Statut sanitaire',v:'En observation'},



      ]},



      {label:'OBSERVATIONS',bullets:[



        'Spécimen en cours d\'identification taxonomique par l\'équipe phytosanitaire.',



        'Présence de symptômes à caractériser pour diagnostic différentiel.',



        'Fiche d\'identification à compléter après analyses complémentaires.',



      ]},



    ],



  },







  'avocat': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,.9)" stroke-width="1.5" stroke-linecap="round"><ellipse cx="12" cy="13" rx="5" ry="7"/><circle cx="12" cy="14" r="2.5" fill="rgba(139,92,246,.3)" stroke="rgba(139,92,246,.6)" stroke-width="1"/><path d="M12 6V3"/></svg>`,



    iconBg:'rgba(74,222,128,.18)', iconBorder:'rgba(74,222,128,.3)',



    color:'#22c55e', statusText:'En observation', type:'plant',



    heroGradient:'radial-gradient(ellipse at 40% 60%, rgba(74,222,128,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<ellipse cx="${90+i*55}" cy="${60+i*3}" rx="${8+i*2}" ry="${12+i*2}" fill="rgba(74,222,128,.${1+i%3})" style="animation:hero-float ${2+i*.35}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Avocat — Persea americana',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Espèce',v:'Persea americana'},



        {k:'Famille',v:'Lauracées'},



        {k:'Statut',v:'Spécimen en observation',tag:'green'},



      ]},



      {label:'PATHOLOGIES',bullets:[



        'Cercosporose : taches brunes à nécrotiques sur feuilles.',



        'Pourriture phytophthoreenne des racines — Phytophthora cinnamomi.',



      ]},



    ],



  },







  // ── Salle de contrôle ──



  'monitoring': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><polyline points="5 10 8 7 11 10 14 7 17 10" stroke-width="1.5"/><circle cx="17" cy="9" r="1.5" fill="#4ade80" stroke="none"/></svg>`,



    iconBg:'rgba(99,102,241,.18)', iconBorder:'rgba(165,180,252,.3)',



    color:'#6366f1', statusText:'Système actif', type:'sensor',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<line x1="${60+i*55}" y1="${80-Math.sin(i)*25}" x2="${115+i*55}" y2="${80-Math.sin(i+1)*25}" stroke="rgba(165,180,252,.${3+i%2})" stroke-width="1.5" style="animation:hero-float ${2+i*.2}s ease-in-out ${i*.15}s infinite"/>`).join('')}</svg>`,



    title:'Système de Monitoring AgroBioTech',



    tabs:['IoT','Info'],



    sections:[



      {label:'FONCTIONNALITÉS',bullets:[



        'Collecte et visualisation en temps réel des données de toutes les serres.',



        'Alertes automatiques en cas de dépassement de seuils critiques.',



        'Archivage historique des mesures pour analyse et optimisation.',



        'Accès distant via le géoportail web AgroBioTech.',



      ]},



      {label:'INFRASTRUCTURE',items:[



        {k:'Capteurs',v:'5 serres — Guardian Pro'},



        {k:'Fréquence',v:'Toutes les 5 min'},



        {k:'API',v:'REST — Render backend'},



        {k:'Dashboard',v:'Géoportail Vercel',tag:'blue'},



      ]},



    ],



  },







  // ── Station de fertigation + équipements ──



  'station de fertigation': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(2,132,199,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="5" width="7" height="10" rx="1.5"/><rect x="14" y="5" width="7" height="10" rx="1.5"/><path d="M10 10h4M12 7v6"/><path d="M6 15v4M18 15v4M10 19h4"/></svg>`,



    iconBg:'rgba(14,165,233,.18)', iconBorder:'rgba(56,189,248,.3)',



    color:'#0ea5e9', statusText:'Station active', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(14,165,233,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2].map(i=>`<rect x="${100+i*65}" y="${35+i*5}" width="25" height="45" rx="3" fill="rgba(56,189,248,.${1+i%2})" stroke="rgba(56,189,248,.4)" stroke-width="1" style="animation:hero-float ${2+i*.4}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Station de Fertigation',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Système automatisé de préparation et distribution de la solution nutritive.',



        'Injection proportionnelle de concentrés A, B, acide et base pour ajustement pH.',



        'Gestion des cycles d\'irrigation par minuterie ou sonde de détection.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Cuves concentrés',v:'A + B séparées'},



        {k:'pH cible',v:'5.5 – 6.5'},



        {k:'EC cible',v:'1.0 – 2.2 mS/cm'},



        {k:'Cycles',v:'Programmables'},



        {k:'Contrôle',v:'Automatique + manuel',tag:'blue'},



      ]},



    ],



  },







  'chaudière': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><path d="M9 5V3M15 5V3"/><path d="M7 19v2M17 19v2"/></svg>`,



    iconBg:'rgba(239,68,68,.18)', iconBorder:'rgba(252,165,165,.3)',



    color:'#ef4444', statusText:'Chaudière', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(239,68,68,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${100+i*50} 70 Q${110+i*50} 50 ${100+i*50} 30" stroke="rgba(252,165,165,.${3+i%2})" stroke-width="1.5" fill="none" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Chaudière',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Production d\'eau chaude pour le chauffage des serres par radiateurs ou plancher chauffant.',



        'Maintien des températures nocturnes en dessous des seuils critiques pour les cultures.',



        'Alimentation du circuit de chauffage de la solution nutritive en hydroponie.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Type',v:'À COMPLÉTER'},



        {k:'Puissance',v:'À COMPLÉTER kW'},



        {k:'Combustible',v:'À COMPLÉTER'},



        {k:'Température',v:'À COMPLÉTER °C'},



      ]},



    ],



  },







  'audoucisseur': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(14,165,233,.9)" stroke-width="1.5" stroke-linecap="round"><ellipse cx="12" cy="10" rx="5" ry="7"/><path d="M7 14c0 3 2.5 5 5 5s5-2 5-5"/><path d="M9 7l3-2 3 2" opacity=".5"/></svg>`,



    iconBg:'rgba(14,165,233,.18)', iconBorder:'rgba(56,189,248,.3)',



    color:'#0ea5e9', statusText:'Adoucisseur actif', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(14,165,233,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<ellipse cx="${90+i*55}" cy="${55+i*5}" rx="10" ry="${18+i*2}" fill="rgba(56,189,248,.${1+i%3})" style="animation:hero-float ${2+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Adoucisseur d\'Eau',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Réduction de la dureté de l\'eau d\'irrigation par échange ionique (résines cationiques).',



        'Prévient le colmatage des goutteurs et l\'accumulation de calcaire dans les canalisations.',



        'Améliore l\'efficacité des solutions fertilisantes en réduisant les interférences calciques.',



      ]},



      {label:'PARAMÈTRES',items:[



        {k:'Type',v:'Échangeur ionique'},



        {k:'Capacité',v:'À COMPLÉTER L/h'},



        {k:'Régénération',v:'NaCl — automatique'},



        {k:'Dureté cible',v:'< 7 °f'},



      ]},



    ],



  },



};

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 4 — ENGINE
   Card logic. Viewers call openSimpleAR(key) from hotspot onclick.
   Everything else is internal.
═══════════════════════════════════════════════════════════════════════ */

function getARDef(desc){



  if(!desc) return null;



  let key = desc.toLowerCase().trim();



  const _al = {


'système de chauffage': 'chauffage',
'tablettes': 'tablettes',   // then add the key to AR_CONTENT
'lumiere': 'lumiere',

    'ventilation':'ventilation',



    'brumisateur':'brumisateur',



    'co2':'co2',



    'sensors':'sensors',



    'fenetres':'fenetre auto',



    'rideaux':'rideaux auto',



    'blé':'blé',



  };



  key = _al[key] || key;



  return AR_CONTENT[key] || null;



}

function getCssClass(arKey){



  const t = AR_CONTENT[arKey]?.type;



  return t==='plant'?'hs-ar-plant':t==='sensor'?'hs-ar-sensor':'hs-ar-system';



}











function updateHotspotDots(){



  document.querySelectorAll('[data-state-dot]').forEach(dot=>{



    const key = dot.getAttribute('data-state-dot');



    const state = hsGetState(key);



    if(state === null) return;



    const on = state === 'on';



    dot.style.background = on ? '#22c55e' : '#ef4444';



    dot.style.boxShadow = on ? '0 0 4px rgba(34,197,94,.6)' : '0 0 4px rgba(239,68,68,.5)';



    dot.style.display = 'block';



  });



}







function openSimpleAR(desc){



  const def = getARDef(desc);



  if(!def){ console.warn('No AR content for:', desc); return; }



  window.activeAR = desc; window.activeTab = 0;







  // ── Hero background gradient ──



  const bg = document.getElementById('ar-hero-bg');



  const c = def.color || '#059669';



  bg.style.background = `linear-gradient(135deg, ${c}cc 0%, ${c}88 100%)`;



  const hero = document.getElementById('ar-hero');



  hero.style.background = def.heroGradient



    ? `linear-gradient(135deg, ${c}bb 0%, ${c}77 100%), ${def.heroGradient}`



    : `linear-gradient(135deg, ${c}bb 0%, ${c}55 100%)`;







  // ── Hero animated SVG ──



  const anim = document.getElementById('ar-hero-anim');



  anim.innerHTML = def.heroAnim || '';







  // ── Icon ──



  const iw = document.getElementById('ar-icon-wrap');



  iw.style.background = 'rgba(255,255,255,.25)';



  iw.style.borderColor = 'rgba(255,255,255,.5)';



iw.innerHTML = def.icon || '';






  // ── Category label + title ──



  const catMap = {



    fraise:'SYSTÈME BIOLOGIQUE', co2:'CONTRÔLE CLIMATIQUE',



    brumisateur:'CONTRÔLE CLIMATIQUE', ventilation:'CONTRÔLE CLIMATIQUE',



    'système de refroidissement':'CONTRÔLE CLIMATIQUE',



    fertigation:'SYSTÈME HYDROPONIQUE', sensors:'TÉLÉMÉTRIE IOT',



    'ventilation dehors':'CONTRÔLE CLIMATIQUE',



    'rideaux auto':'CONTRÔLE CLIMATIQUE', 'fenetre auto':'CONTRÔLE CLIMATIQUE'



  };



  document.getElementById('ar-category-label').textContent = (typeof tCat==='function' ? tCat(desc) : (catMap[desc] || 'DIGITAL TWIN'));



  document.getElementById('ar-title').textContent = def['title_'+(window.currentLang||'FR').toLowerCase()] || def.title;











  // ── Big state pill ──



  const _pill = document.getElementById('ar-state-pill');



  const _pillTxt = document.getElementById('ar-state-pill-text');



  const _reasonStrip = document.getElementById('ar-reason-strip');



  const _reasonTxt = document.getElementById('ar-reason-text');



  const _state = def.stateKey ? hsGetState(def.stateKey) : null;



  if(_state === null){



    _pill.className = 'ar-state-pill unknown';



    _pillTxt.textContent = def['statusText_'+(window.currentLang||'FR').toLowerCase()] || def.statusText || '—';



    _reasonStrip.style.display = 'none';



  } else {



    const _on = _state === 'on';



    _pill.className = 'ar-state-pill ' + (_on ? 'on' : 'off');



    _pillTxt.textContent = _on ? (typeof t==='function'?t('active'):'ACTIF') : (typeof t==='function'?t('inactive'):'INACTIF');



    const _reason = def.thresholds?.length



      ? (_on ? def.thresholds[0].onWhen : def.thresholds[0].offWhen)



      : (_on ? 'Système en fonctionnement' : 'Système en veille');



    _reasonStrip.style.display = 'block';



    _reasonTxt.textContent = _reason;



  }







  // ── Tab accent color via CSS var ──



  document.getElementById('ar-card').style.setProperty('--accent', def.color || '#059669');







  // ── Render first tab directly (no tab bar) ──



  renderARTab(0, def);







  // ── Stagger reset (replay animation on each open) ──



  ['ar-stagger-1','ar-stagger-2','ar-stagger-3'].forEach(cls=>{



    document.querySelectorAll('.'+cls).forEach(el=>{



      el.style.animation='none';



      requestAnimationFrame(()=>{ el.style.animation=''; });



    });



  });







  renderARTab(0, def);



  document.getElementById('ar-card').classList.add('open');



}

function switchTab(i, isAR){



  activeTab=i;



  document.querySelectorAll('.ar-tab').forEach((t,ti)=>t.classList.toggle('active',ti===i));



  if(activeAR) {



    const def = getARDef(activeAR);



    if(def) renderARTab(i, def);



  }



}

function renderARTab(i, def){



  const el = document.getElementById('ar-content');



  el.style.animation='none';



  requestAnimationFrame(()=>{ el.style.animation='ar-fade-up .22s ease both'; });







  const tagColors = {



    green:'background:#f0fdf4;border-color:#86efac;color:#15803d',



    blue:'background:#eff6ff;border-color:#93c5fd;color:#1d4ed8',



    purple:'background:#f5f3ff;border-color:#c4b5fd;color:#6d28d9',



    teal:'background:#f0fdfa;border-color:#5eead4;color:#0f766e',



    amber:'background:#fffbeb;border-color:#fcd34d;color:#b45309',



  };







  let html = '';







  // ── Equipment custom card (descriptive — live IoT lives in Capteurs) ──
  if(def.type === 'equipment'){ renderEquipmentCard(el, def); return; }
  if(def.type === 'info'){ renderInfoCard(el, def); return; }

  // ── Live sensor readings section (if IoT tab exists) ──



  if(def.tabs.includes('IoT')){



    if(!iotData){



      html += `<div class="ar-section-title">DONNÉES EN DIRECT</div>



        <div class="iot-loading">Interrogation capteurs…</div>`;



    } else {



      const env=iotData.env||{}, irr=iotData.irr||{};



      const fmt = v => v!=null ? Number(v).toFixed(1) : '—';



      // ── Use live dashboard thresholds (from Seuils.jsx) ──
      const tT = getThresh('temperature');
      const hT = getThresh('humidite');
      const pT = getThresh('ph');
      const eT = getThresh('ec');

      const rows=[
        {label:'Température',    val:env.temperature, unit:'°C',    min:tT.valeur_min, max:tT.valeur_max, ok:env.temperature!=null && env.temperature>=tT.valeur_min && env.temperature<=tT.valeur_max},
        {label:'Humidité',       val:env.humidite,    unit:'%',     min:hT.valeur_min, max:hT.valeur_max, ok:env.humidite!=null    && env.humidite   >=hT.valeur_min && env.humidite   <=hT.valeur_max},
        {label:'pH solution',    val:irr.ph,          unit:'pH',    min:pT.valeur_min, max:pT.valeur_max, ok:irr.ph!=null          && irr.ph          >=pT.valeur_min && irr.ph          <=pT.valeur_max},
        {label:'Conductivité EC',val:irr.ec,          unit:'mS/cm', min:eT.valeur_min, max:eT.valeur_max, ok:irr.ec!=null          && irr.ec          >=eT.valeur_min && irr.ec          <=eT.valeur_max},
      ];



      html += `<div class="ar-section-title">DONNÉES EN DIRECT</div>`;



      html += rows.map(r=>{
        const rangeHint = (r.min!=null && r.max!=null)
          ? `<span style="font-size:9px;color:rgba(0,0,0,.3);display:block;margin-top:1px;font-family:'DM Mono',monospace">${Number(r.min).toFixed(1)}–${Number(r.max).toFixed(1)} ${r.unit}</span>`
          : '';
        return `
        <div class="ar-sensor-row">
          <span class="ar-sensor-label">${r.label}${rangeHint}</span>
          <span class="ar-sensor-val">${fmt(r.val)}</span>
          <span class="ar-sensor-unit">${r.unit}</span>
          <div class="ar-sensor-dot ${r.val==null?'na':r.ok?'ok':'warn'}"></div>
        </div>`;
      }).join('');



      html += `<div class="iot-refresh" onclick="fetchIoT().then(()=>renderARTab(0,getARDef(activeAR)))">⟳ &nbsp;Actualiser</div>`;



    }



  }







  // ── État du système: threshold bars (for state-aware cards) ──



  if(def.thresholds && def.thresholds.length && iotData){



    const env = iotData.env||{};



    html += `<div class="ar-section-title">ÉTAT DU SYSTÈME</div>



      <div class="ar-thresh-block">`;



    def.thresholds.forEach(t => {



      let val = t.key === 'outsideTemp' ? outsideTemp : env[t.key];



      const fmt = val != null ? Number(val).toFixed(1) : '—';



      const dT  = getThresh(t.key);
      const lo  = dT.valeur_min ?? t.min;
      const hi  = dT.valeur_max ?? t.max;
      const pct = val != null && hi !== lo ? Math.min(100,Math.max(0,((val-lo)/(hi-lo))*100)) : 0;
      const inRange = val != null && val >= lo && val <= hi;



      const state = hsGetState(def.stateKey);



      const barColor = state==='on' ? (inRange ? 'var(--accent,#059669)' : '#f59e0b') : 'rgba(0,0,0,.18)';



      html += `<div class="ar-thresh-row">



        <span class="ar-thresh-label">${t.label}</span>



        <span><span class="ar-thresh-val">${fmt}</span><span class="ar-thresh-unit"> ${t.unit}</span></span>



      </div>



      <div class="ar-thresh-bar-wrap">



        <div class="ar-thresh-bar" style="width:${pct}%;background:${barColor}"></div>



      </div>`;



    });



    // Reason



    const _st = hsGetState(def.stateKey);



    const _reason = _st === null ? 'En attente des données…'



      : _st === 'on' ? def.thresholds[0].onWhen : def.thresholds[0].offWhen;



    const _rc = _st === 'on' ? 'on' : _st === null ? 'unknown' : 'off';



    html += `<div class="ar-thresh-reason ${_rc}">



      <span class="ar-thresh-dot" style="background:${_st==='on'?'#22c55e':_st===null?'rgba(0,0,0,.2)':'#f59e0b'}"></span>



      ${_reason}



    </div></div>`;



  }







  // ── Sensors custom card ──
  if(def.type === 'sensor'){
    renderSensorsCard(el, def);
    return;
  }

  // ── Fertigation custom card ──
  if(def.type === 'fertigation'){
    const lang = (window.currentLang||'FR').toLowerCase();
    const irr = (window.iotData?.irr)||{};
    const ph  = irr.ph  != null ? Number(irr.ph)  : null;
    const ec  = irr.ec  != null ? Number(irr.ec)  : null;
    const tw  = irr.temp_eau != null ? Number(irr.temp_eau) : null;
    const f2  = v => v!=null ? Number(v).toFixed(2) : '—';
    const f1  = v => v!=null ? Number(v).toFixed(1) : '—';
    const phT = (typeof getThresh==='function') ? getThresh('ph') : {valeur_min:5.5,valeur_max:6.5};
    const ecT = (typeof getThresh==='function') ? getThresh('ec') : {valeur_min:1.0,valeur_max:2.2};
    const phOk = ph!=null && ph>=phT.valeur_min && ph<=phT.valeur_max;
    const ecOk = ec!=null && ec>=ecT.valeur_min && ec<=ecT.valeur_max;

    // Labels
    const L = {
      phLabel:   {fr:'pH actuel',   en:'Current pH',    ar:'pH الحالي'},
      ecLabel:   {fr:'EC (mS/cm)',  en:'EC (mS/cm)',    ar:'EC (mS/cm)'},
      twLabel:   {fr:'Temp. eau',   en:'Water temp.',   ar:'حرارة الماء'},
      ok:        {fr:'✓ Normal',    en:'✓ Normal',      ar:'✓ عادي'},
      warn:      {fr:'⚠ Hors cible',en:'⚠ Off target',  ar:'⚠ خارج الهدف'},
      secWhat:   {fr:'Ce que fait cette station',en:'What this station does',ar:'ما تفعله المحطة'},
      secRanges: {fr:'Plages cibles',en:'Target ranges',ar:'النطاقات المستهدفة'},
      secSet:    {fr:'Réglages',    en:'Settings',       ar:'الإعدادات'},
      vol:       {fr:'Volume réservoir',en:'Tank volume',ar:'حجم الخزان'},
      cyc:       {fr:'Cycles',      en:'Cycles',         ar:'الدورات'},
      reg:       {fr:'Régulation',  en:'Regulation',     ar:'التنظيم'},
      auto:      {fr:'Automatique', en:'Automatic',      ar:'تلقائي'},
      prog:      {fr:'Programmable',en:'Programmable',   ar:'قابل للبرمجة'},
      refresh:   {fr:'Actualiser',  en:'Refresh',        ar:'تحديث'},
      live:      {fr:'Données en direct',en:'Live data', ar:'بيانات مباشرة'},
    };
    const tl = k => L[k]?.[lang] || L[k]?.fr || k;

    // What-items
    const whatFR=['Prépare et distribue la solution nutritive automatiquement','Ajuste pH et EC en temps réel selon les capteurs','Adapte les nutriments au stade de croissance','Irrigation programmée par cycles, 24h/24'];
    const whatEN=['Prepares and distributes nutrient solution automatically','Adjusts pH and EC in real time from sensor data','Adapts nutrients to the plant growth stage','Scheduled irrigation cycles, 24/7'];
    const whatAR=['تحضير وتوزيع المحلول الغذائي تلقائياً','ضبط pH والـ EC فوريًا حسب المستشعرات','تكييف العناصر مع مرحلة نمو النبات','دورات ري مبرمجة على مدار الساعة'];
    const icons=['⚗️','⚙️','🌱','⏱️'];
    const whatArr = lang==='en'?whatEN:lang==='ar'?whatAR:whatFR;

    // Range calcs
    const phMin=phT.valeur_min||5.5, phMax=phT.valeur_max||6.5;
    const ecMin=ecT.valeur_min||1.0, ecMax=ecT.valeur_max||2.2;
    const phSlo=4,phShi=8,ecSlo=0,ecShi=3;
    const pct=(v,lo,hi)=>Math.min(100,Math.max(0,((v-lo)/(hi-lo))*100));
    const phPtr = ph!=null ? pct(ph,phSlo,phShi) : null;
    const ecPtr = ec!=null ? pct(ec,ecSlo,ecShi) : null;
    const phFl  = pct(phMin,phSlo,phShi);
    const phFw  = pct(phMax,phSlo,phShi)-phFl;
    const ecFl  = pct(ecMin,ecSlo,ecShi);
    const ecFw  = pct(ecMax,ecSlo,ecShi)-ecFl;

    html += '<div class="fert-live-strip">'
      +'<div class="fert-live-metric"><div class="fert-lm-val">'+f2(ph)+'</div><div class="fert-lm-label">'+tl('phLabel')+'</div>'+(ph!=null?'<div class="fert-lm-status '+(phOk?'fert-lm-ok':'fert-lm-warn')+'">'+tl(phOk?'ok':'warn')+'</div>':'')+'</div>'
      +'<div class="fert-live-metric"><div class="fert-lm-val">'+f2(ec)+'</div><div class="fert-lm-label">'+tl('ecLabel')+'</div>'+(ec!=null?'<div class="fert-lm-status '+(ecOk?'fert-lm-ok':'fert-lm-warn')+'">'+tl(ecOk?'ok':'warn')+'</div>':'')+'</div>'
      +'<div class="fert-live-metric"><div class="fert-lm-val">'+(tw!=null?f1(tw)+'°':'—')+'</div><div class="fert-lm-label">'+tl('twLabel')+'</div>'+(tw!=null?'<div class="fert-lm-status fert-lm-ok">'+tl('ok')+'</div>':'')+'</div>'
      +'</div>';

    html += '<div class="ar-section-title">'+tl('secWhat')+'</div>'
      +'<div class="fert-what-grid">'
      +whatArr.map((w,i)=>'<div class="fert-what-card"><div class="fert-what-icon">'+icons[i]+'</div><div class="fert-what-text">'+w+'</div></div>').join('')
      +'</div>';

    html += '<div class="ar-section-title">'+tl('secRanges')+'</div>';
    html += '<div class="fert-range-wrap">'
      +'<div class="fert-range-label"><span>pH '+phMin+' – '+phMax+'</span><span class="'+(phOk?'fert-lm-ok':'fert-lm-warn')+'">'+(ph!=null?f2(ph):'')+'</span></div>'
      +'<div class="fert-range-track">'
      +'<div class="fert-range-fill" style="width:'+phFw.toFixed(1)+'%;margin-left:'+phFl.toFixed(1)+'%;opacity:.4"></div>'
      +(phPtr!=null?'<div class="fert-range-pointer'+(phOk?'':' warn')+'" style="left:'+phPtr.toFixed(1)+'%"></div>':'')
      +'</div><div class="fert-range-ticks"><span>'+phSlo+'</span><span>'+phShi+'</span></div></div>';

    html += '<div class="fert-range-wrap">'
      +'<div class="fert-range-label"><span>EC '+ecMin+' – '+ecMax+' mS/cm</span><span class="'+(ecOk?'fert-lm-ok':'fert-lm-warn')+'">'+(ec!=null?f2(ec)+' mS/cm':'')+'</span></div>'
      +'<div class="fert-range-track">'
      +'<div class="fert-range-fill" style="width:'+ecFw.toFixed(1)+'%;margin-left:'+ecFl.toFixed(1)+'%;opacity:.4"></div>'
      +(ecPtr!=null?'<div class="fert-range-pointer'+(ecOk?'':' warn')+'" style="left:'+ecPtr.toFixed(1)+'%"></div>':'')
      +'</div><div class="fert-range-ticks"><span>'+ecSlo+'</span><span>'+ecShi+'</span></div></div>';

    html += '<div class="ar-section-title">'+tl('secSet')+'</div>'
      +'<div class="fert-param-rows">'
      +'<div class="fert-param-row"><span class="fert-param-label">'+tl('vol')+'</span><span class="fert-param-val">500 L</span></div>'
      +'<div class="fert-param-row"><span class="fert-param-label">'+tl('cyc')+'</span><span class="fert-param-val">'+tl('prog')+'</span></div>'
      +'<div class="fert-param-row"><span class="fert-param-label">'+tl('reg')+'</span><span class="fert-param-val">'+tl('auto')+'</span></div>'
      +'</div>';

    html += '<div class="fert-footer">'
      +'<span class="fert-sync">⟳ '+tl('live')+'</span>'
      +'<button class="fert-detail-btn" onclick="typeof fetchIoT!==\'undefined\'&&fetchIoT().then(()=>renderARTab(window.activeTab||0,getARDef(window.activeAR)))">↺ '+tl('refresh')+'</button>'
      +'</div>';

    el.innerHTML = html;
    return;
  }

  // ── Static info sections ──

  html += def.sections.map(sec => {



    let s = `<div class="ar-section-title">${sec.label}</div>`;



    if(sec.items) s += sec.items.map(item=>`



      <div class="ar-info-row">



        <span class="ar-info-label">${item.k}</span>



        ${item.tag



          ? `<span class="ar-badge" style="${tagColors[item.tag]||''}">${item.v}</span>`



          : `<span class="ar-info-value">${item.v}</span>`}



      </div>`).join('');



    if(sec.bullets) s += `<div class="ar-bullets">${sec.bullets.map(b=>



      `<div class="ar-bullet"><div class="ar-bullet-dot"></div><span>${b}</span></div>`).join('')}</div>`;



    return s;



  }).join('');







  // ── Video if present ──



  if(def.video){



    html += `<div class="ar-section-title">RESSOURCE</div>



      <div class="video-wrap">



        <iframe src="https://www.youtube.com/embed/${def.video.id}?rel=0" allowfullscreen></iframe>



      </div>



      <p class="video-desc">${def.video.desc}</p>`;



  }







  el.innerHTML = html;



}

function closeAR(){
  document.getElementById('ar-card').classList.remove('open');
  /* ── Stop any playing audio ── */
  if(window._arAudioEl){ window._arAudioEl.pause(); window._arAudioEl.currentTime=0; }
  window.activeAR=null;
}

/* ═══════════════════════════════════════════════════════════════════════
   SENSORS CARD — custom renderer
   Called from renderARTab when def.type === 'sensor'
   All strings FR/EN/AR inline. Audio auto-matches window.currentLang.
═══════════════════════════════════════════════════════════════════════ */
function renderSensorsCard(el, def){
  const lang = (window.currentLang||'FR');
  const L = {
    /* ── Section titles ── */
    secInfo:    {FR:'PRÉSENTATION',          EN:'OVERVIEW',             AR:'نظرة عامة'},
    secSensors: {FR:'CAPTEURS INSTALLÉS',    EN:'INSTALLED SENSORS',    AR:'المستشعرات المثبتة'},
    secProto:   {FR:'PROTOCOLE',             EN:'PROTOCOL',             AR:'البروتوكول'},
    secAudio:   {FR:'NARRATION AUDIO',       EN:'AUDIO NARRATION',      AR:'التعليق الصوتي'},
    /* ── Overview ── */
    ovDesc:     {
      FR:'Ce réseau de capteurs IoT surveille en continu les paramètres environnementaux et de la solution nutritive dans chaque serre. Les données sont transmises toutes les 5 minutes à la plateforme Guardian Pro et accessibles en temps réel depuis le géoportail.',
      EN:'This IoT sensor network continuously monitors environmental and nutrient solution parameters across every greenhouse. Data is transmitted every 5 minutes to the Guardian Pro platform and accessible in real time from the geoportal.',
      AR:'تراقب شبكة المستشعرات هذه باستمرار المعاملات البيئية ومحلول التغذية في كل بيت زجاجي. تُرسل البيانات كل 5 دقائق إلى منصة Guardian Pro ويمكن الوصول إليها في الوقت الفعلي.',
    },
    /* ── Protocol labels ── */
    protoFreq:  {FR:'Fréquence',         EN:'Frequency',        AR:'التردد'},
    protoFreqV: {FR:'Toutes les 5 min',  EN:'Every 5 min',      AR:'كل 5 دقائق'},
    protoTx:    {FR:'Transmission',      EN:'Transmission',     AR:'الإرسال'},
    protoTxV:   {FR:'WiFi → Guardian Pro', EN:'WiFi → Guardian Pro', AR:'WiFi ← Guardian Pro'},
    protoApi:   {FR:'API',               EN:'API',              AR:'واجهة API'},
    /* ── Sensor names ── */
    sTempName:  {FR:'Température & Humidité',  EN:'Temperature & Humidity', AR:'الحرارة والرطوبة'},
    sTempType:  {FR:'Sonde combinée T°+HR',    EN:'Combined T°+RH probe',   AR:'مسبار T°+RH مدمج'},
    sTempDesc:  {
      FR:'Mesure la température de l\'air (°C) et l\'humidité relative (%) à l\'intérieur de la serre. Ces deux valeurs sont indispensables pour réguler le climat et prévenir les maladies fongiques.',
      EN:'Measures air temperature (°C) and relative humidity (%) inside the greenhouse. Both values are essential for climate regulation and preventing fungal diseases.',
      AR:'يقيس درجة حرارة الهواء (°C) والرطوبة النسبية (%) داخل البيت الزجاجي. القيمتان ضروريتان لتنظيم المناخ ومنع الأمراض الفطرية.',
    },
    sVpdName:   {FR:'VPD — Déficit de Pression Vapeur', EN:'VPD — Vapour Pressure Deficit', AR:'VPD — عجز ضغط البخار'},
    sVpdType:   {FR:'Calculé (T°+HR)',   EN:'Calculated (T°+RH)',  AR:'محسوب (T°+RH)'},
    sVpdDesc:   {
      FR:'Le VPD (kPa) est calculé à partir de la température et de l\'humidité. Il indique la capacité de l\'air à absorber la transpiration des plantes — un VPD bien contrôlé optimise l\'absorption de l\'eau et des nutriments.',
      EN:'VPD (kPa) is calculated from temperature and humidity. It indicates the air\'s capacity to absorb plant transpiration — a well-controlled VPD optimises water and nutrient uptake.',
      AR:'يُحسب VPD (كيلو باسكال) من الحرارة والرطوبة. يشير إلى قدرة الهواء على امتصاص نتح النبات — VPD جيد يُحسّن امتصاص الماء والعناصر الغذائية.',
    },
    sPhName:    {FR:'pH de la Solution',   EN:'Solution pH',          AR:'درجة حموضة المحلول'},
    sPhType:    {FR:'Sonde pH inline',     EN:'Inline pH probe',      AR:'مسبار pH مدمج'},
    sPhDesc:    {
      FR:'Mesure le pH de la solution nutritive en continu. Un pH hors plage (idéalement 5,5–6,5) bloque l\'assimilation des éléments minéraux par les racines, quelle que soit leur concentration dans la solution.',
      EN:'Continuously measures the pH of the nutrient solution. A pH out of range (ideally 5.5–6.5) blocks mineral uptake by the roots, regardless of their concentration in the solution.',
      AR:'يقيس pH محلول التغذية باستمرار. pH خارج النطاق (المثالي 5.5–6.5) يعيق امتصاص العناصر المعدنية بواسطة الجذور بغض النظر عن تركيزها.',
    },
    sEcName:    {FR:'Conductivité EC',        EN:'EC Conductivity',       AR:'التوصيل الكهربائي EC'},
    sEcType:    {FR:'Conductivimètre inline',  EN:'Inline conductivity meter', AR:'مقياس توصيلية مدمج'},
    sEcDesc:    {
      FR:'Mesure la concentration totale en sels minéraux de la solution (mS/cm). Un EC trop bas signifie une sous-nutrition ; trop élevé, il provoque un stress osmotique qui brûle les racines.',
      EN:'Measures the total mineral salt concentration of the solution (mS/cm). Too low means under-nutrition; too high causes osmotic stress that burns the roots.',
      AR:'يقيس التركيز الكلي للأملاح المعدنية في المحلول (mS/cm). منخفض جداً يعني سوء التغذية؛ مرتفع جداً يسبب إجهاداً أسموزياً يحرق الجذور.',
    },
    sWlName:    {FR:'Niveau d\'Eau',          EN:'Water Level',           AR:'مستوى الماء'},
    sWlType:    {FR:'Capteur ultrasonique',   EN:'Ultrasonic sensor',     AR:'مستشعر فوق صوتي'},
    sWlDesc:    {
      FR:'Mesure le niveau de la solution dans le réservoir par ultrasons sans contact direct..',
      EN:'Measures the solution level in the tank using ultrasound .',
      AR:'يقيس مستوى المحلول في الخزان بالموجات فوق الصوتية دون تلامس مباشر.',
    },
    /* ── Audio ── */
    audioPlay:  {FR:'Écouter la présentation', EN:'Listen to the presentation', AR:'استمع إلى الشرح'},
    audioPause: {FR:'Pause',                   EN:'Pause',                      AR:'إيقاف مؤقت'},
    audioLang:  {FR:'Narration en français',   EN:'English narration',          AR:'الشرح بالعربية'},
    audioNA:    {FR:'Audio non disponible',    EN:'Audio not available',        AR:'الصوت غير متاح'},
  };

  const tx = k => L[k]?.[lang] ?? L[k]?.FR ?? k;

  /* ── Sensor data ── */
  const sensors = [
    {tiIcon:'ti-temperature',    key:'temp',   name:tx('sTempName'), type:tx('sTempType'), desc:tx('sTempDesc'), color:'#0284c7', iconColor:'#0284c7', bg:'rgba(14,165,233,.08)',  border:'rgba(14,165,233,.2)'},
    {tiIcon:'ti-calculator',     key:'vpd',    name:tx('sVpdName'),  type:tx('sVpdType'),  desc:tx('sVpdDesc'),  color:'#7c3aed', iconColor:'#7c3aed', bg:'rgba(139,92,246,.08)', border:'rgba(139,92,246,.2)'},
    {tiIcon:'ti-droplet',        key:'ph',     name:tx('sPhName'),   type:tx('sPhType'),   desc:tx('sPhDesc'),   color:'#059669', iconColor:'#059669', bg:'rgba(16,185,129,.08)', border:'rgba(16,185,129,.2)'},
    {tiIcon:'ti-bolt',           key:'ec',     name:tx('sEcName'),   type:tx('sEcType'),   desc:tx('sEcDesc'),   color:'#b45309', iconColor:'#b45309', bg:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.2)'},
    {tiIcon:'ti-waves',          key:'niveau', name:tx('sWlName'),   type:tx('sWlType'),   desc:tx('sWlDesc'),   color:'#0e7490', iconColor:'#0e7490', bg:'rgba(6,182,212,.08)',  border:'rgba(6,182,212,.2)'},
  ];

  /* ── Audio state ── */
  const audioSrc = def.audio?.[lang];
  const hasAudio = !!audioSrc;
  const isPlaying = window._arAudioEl && !window._arAudioEl.paused && window._arAudioEl._arKey === 'sensors' && window._arAudioEl._arLang === lang;

  /* ── Build HTML ── */
  let html = '';

  /* 0 — Live data (only card showing live IoT) */
  html += eqSensorsLiveHTML(lang);

  /* 1 — Overview removed */

  /* 2 — Sensor cards */
  html += `<div class="ar-section-title" style="margin-top:16px">${tx('secSensors')}</div>
  <div class="sns-list">`;

  sensors.forEach((s, i) => {
    const isWide = i === sensors.length - 1 && sensors.length % 2 !== 0;
    const pingClass = s.key === 'vpd' ? 'sns-ping sns-ping-slow' : 'sns-ping';
    const pingLabel = s.key === 'vpd'
      ? (lang==='AR'?'محسوب':lang==='EN'?'Computed':'Calculé')
      : (lang==='AR'?'متصل':lang==='EN'?'Online':'En ligne');
    const iconHtml = `<span class="sns-item-icon" style="background:${s.bg};border-color:${s.border}">${eqIcon(s.tiIcon, s.iconColor)}</span>`;
    if (isWide) {
      html += `
      <div class="sns-item sns-item-wide" style="background:${s.bg};border-color:${s.border}">
        ${iconHtml}
        <div class="sns-item-header">
          <div class="sns-item-meta">
            <span class="sns-item-name" style="color:${s.color}">${s.name}</span>
            <span class="sns-item-type">${s.type}</span>
          </div>
          <p class="sns-item-desc">${s.desc}</p>
          <div class="sns-ping-row"><span class="${pingClass}"></span><span class="sns-ping-label">${pingLabel}</span></div>
        </div>
      </div>`;
    } else {
      html += `
      <div class="sns-item" style="background:${s.bg};border-color:${s.border}">
        ${iconHtml}
        <div class="sns-item-name" style="color:${s.color}">${s.name}</div>
        <div class="sns-item-type">${s.type}</div>
        <div class="sns-ping-row"><span class="${pingClass}"></span><span class="sns-ping-label">${pingLabel}</span></div>
      </div>`;
    }
  });
  html += `</div>`;

  /* 3 — Protocol */
  html += `<div class="ar-section-title" style="margin-top:16px">${tx('secProto')}</div>
  <div class="sns-proto">
    <div class="sns-proto-row">
      <span class="sns-proto-label">${tx('protoFreq')}</span>
      <span class="sns-proto-val">${tx('protoFreqV')}</span>
    </div>
    <div class="sns-proto-row">
      <span class="sns-proto-label">${tx('protoTx')}</span>
      <span class="sns-proto-val">${tx('protoTxV')}</span>
    </div>
    <div class="sns-proto-row">
      <span class="sns-proto-label">${tx('protoApi')}</span>
      <span class="sns-proto-val sns-proto-api">guardian.pro-leaf.com</span>
    </div>
  </div>`;

  /* 4 — Audio player */
  html += `<div class="ar-section-title" style="margin-top:16px">${tx('secAudio')}</div>
  <div class="sns-audio-wrap">
    <div class="sns-audio-lang">${tx('audioLang')}</div>
    <button class="sns-audio-btn${hasAudio?'':' sns-audio-disabled'}" id="sns-audio-btn"
      onclick="snsToggleAudio()"
      ${hasAudio?'':' disabled title="'+(tx('audioNA'))+'"'}>
      <div class="sns-audio-play-circle">
        <span class="sns-audio-icon" id="sns-audio-icon">${isPlaying?'⏸':'▶'}</span>
      </div>
      <div class="sns-audio-text">
        <span class="sns-audio-main" id="sns-audio-label">${isPlaying ? tx('audioPause') : tx('audioPlay')}</span>
        <span class="sns-audio-sub">Introduction au réseau de capteurs</span>
      </div>
      <span class="sns-audio-dur">1:24</span>
    </button>
    ${!hasAudio ? `<span class="sns-audio-na">${tx('audioNA')}</span>` : ''}
  </div>`;

  el.innerHTML = html;
}

/* ── Audio toggle for sensors card ── */
function snsToggleAudio(){
  const def = getARDef('sensors');
  if(!def) return;
  const lang = window.currentLang || 'FR';
  const src  = def.audio?.[lang];
  const btn  = document.getElementById('sns-audio-btn');
  const icon = document.getElementById('sns-audio-icon');
  const lbl  = document.getElementById('sns-audio-label');

  const L_pause = {FR:'Pause', EN:'Pause', AR:'إيقاف مؤقت'};
  const L_play  = {FR:'Écouter la présentation', EN:'Listen to the presentation', AR:'استمع إلى الشرح'};

  /* If already playing this lang — pause */
  if(window._arAudioEl && !window._arAudioEl.paused
     && window._arAudioEl._arKey==='sensors'
     && window._arAudioEl._arLang===lang){
    window._arAudioEl.pause();
    if(icon) icon.textContent='▶';
    if(lbl)  lbl.textContent=L_play[lang]||L_play.FR;
    return;
  }

  /* Stop whatever was playing */
  if(window._arAudioEl){ window._arAudioEl.pause(); window._arAudioEl.currentTime=0; }

  if(!src) return;
  const audio = new Audio(src);
  audio._arKey  = 'sensors';
  audio._arLang = lang;
  window._arAudioEl = audio;

  audio.play().then(()=>{
    if(icon) icon.textContent='⏸';
    if(lbl)  lbl.textContent=L_pause[lang]||L_pause.FR;
  }).catch(()=>{
    if(icon) icon.textContent='▶';
  });

  audio.addEventListener('ended', ()=>{
    if(icon) icon.textContent='▶';
    if(lbl)  lbl.textContent=L_play[lang]||L_play.FR;
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   EQUIPMENT CARDS — Pass 1 redesign (glassmorphism · multilingual)
   · Live IoT values appear ONLY in the Capteurs card (eqSensorsLiveHTML).
   · Equipment cards are descriptive: what-grid · trigger conditions ·
     spec range (config seuil, not live) · real-time-monitoring chips ·
     settings · audio. No live values are pulled for these cards.
   · Augments existing AR_CONTENT defs in place — backward compatible.
   ───────────────────────────────────────────────────────────────────── */
function eqPx(o, lang){ return (o && (o[lang] ?? o.FR)) || ''; }

/* ── Inline SVG icon set (no external font dependency) ── */
const EQ_ICONS = {
'ti-leaf':'<path d="M5 21c0-9 5.5-15 15-15 0 9.5-6 15-15 15Z"/><path d="M5 21C9.5 16.5 13.5 12.5 18 9"/>',
'ti-moon':'<path d="M20 14.4A8 8 0 1 1 9.6 4 6.5 6.5 0 0 0 20 14.4Z"/>',
'ti-lock':'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
'ti-trending-up':'<path d="M3 17l6-6 4 4 8-8"/><path d="M16 7h5v5"/>',
'ti-cylinder':'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/>',
'ti-target':'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
'ti-cpu':'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
'ti-cloud':'<path d="M6.5 18A4.5 4.5 0 0 1 7 9a5 5 0 0 1 9.6 1.6A3.5 3.5 0 0 1 17 18Z"/>',
'ti-temperature':'<path d="M12 3a2 2 0 0 0-2 2v9.1a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2Z"/><line x1="12" y1="9" x2="12" y2="15"/>',
'ti-temperature-minus':'<path d="M10 3.8A2 2 0 0 1 14 5v9.1a4 4 0 1 1-4 0V5c0-.45.15-.86.4-1.2"/><path d="M17 6h5"/>',
'ti-temperature-plus':'<path d="M10 3.8A2 2 0 0 1 14 5v9.1a4 4 0 1 1-4 0V5c0-.45.15-.86.4-1.2"/><path d="M19.5 3.5v5M17 6h5"/>',
'ti-droplet':'<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/>',
'ti-gauge':'<path d="M5 18a8 8 0 1 1 14 0"/><path d="M12 14l3.5-3.5"/><circle cx="12" cy="14" r="1.3" fill="currentColor" stroke="none"/>',
'ti-spray':'<rect x="8" y="10" width="7" height="11" rx="2"/><path d="M8 10V6h7v4"/><path d="M17 5h2M17 8h2M18 3h2M18 10h2"/>',
'ti-windmill':'<circle cx="12" cy="12" r="1.7"/><path d="M12 10.3c-.3-2.6.2-5.6-1.7-6.1C8.7 3.7 7.6 6.1 9.8 7.4M13.7 12c2.6-.3 5.6.2 6.1-1.7.6-1.6-1.8-2.7-2.9-.5M12 13.7c.3 2.6-.2 5.6 1.7 6.1 1.6.6 2.7-1.8.5-2.9M10.3 12c-2.6.3-5.6-.2-6.1 1.7-.6 1.6 1.8 2.7 2.9.5"/>',
'ti-settings':'<circle cx="12" cy="12" r="3"/><path d="M12 2v3.5M12 18.5V22M3.5 7l3 1.7M17.5 15.3l3 1.7M3.5 17l3-1.7M17.5 8.7l3-1.7"/>',
'ti-bolt':'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
'ti-arrow-up-right':'<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
'ti-refresh':'<path d="M4.5 12a7.5 7.5 0 0 1 12.9-5.2L20 9"/><path d="M20 4v5h-5"/><path d="M19.5 12a7.5 7.5 0 0 1-12.9 5.2L4 15"/><path d="M4 20v-5h5"/>',
'ti-wind':'<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h8a2.5 2.5 0 1 1-2.5 2.5"/>',
'ti-sun':'<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M5 19l1.7-1.7"/>',
'ti-stack':'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
'ti-arrow-up':'<path d="M12 20V5"/><path d="m6 11 6-6 6 6"/>',
'ti-volume-off':'<path d="M5 9v6h4l5 4V5L9 9z"/><path d="m17 9 4 6M21 9l-4 6"/>',
'ti-shield':'<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
'ti-window':'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 12h16M12 3v18"/>',
'ti-arrows-maximize':'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
'ti-flask':'<path d="M9 3h6M10 3v6.5L5.2 18A2 2 0 0 0 7 21h10a2 2 0 0 0 1.8-3L14 9.5V3"/><path d="M7.5 15h9"/>',
'ti-adjustments':'<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.1"/><circle cx="15" cy="12" r="2.1"/><circle cx="7" cy="17" r="2.1"/>',
'ti-plant':'<path d="M12 21v-7"/><path d="M12 14c0-3-2-5.2-5.2-5.2C6.8 11.8 8.8 14 12 14Z"/><path d="M12 12.5c0-3.2 2.2-6 6-6 0 3.2-2.8 6-6 6Z"/>',
'ti-clock':'<circle cx="12" cy="12" r="8"/><path d="M12 8v4.2l2.8 1.8"/>',
'ti-bucket':'<path d="M5.5 8h13l-1.4 11.2a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8z"/><path d="M4 8a8 3 0 0 1 16 0"/>',
'ti-waves':'<path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
'ti-player-play-filled':'<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
'ti-player-stop-filled':'<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
'ti-progress-alert':'<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>',
'ti-calculator':'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 7h7"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
};
function eqIcon(key, color){
  const p = EQ_ICONS[key] || EQ_ICONS['ti-cpu'];
  const c = color ? ' style="color:'+color+'"' : '';
  return '<svg class="eq-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'+c+'>'+p+'</svg>';
}


(function augmentEquipmentDefs(){
  if(typeof AR_CONTENT === 'undefined') return;

  const TC = {FR:'à confirmer', EN:'to confirm', AR:'قيد التأكيد'};   // flagged unknown spec
  const M = {
    temp:{FR:'Température',EN:'Temperature',AR:'الحرارة'},
    hum: {FR:'Humidité',EN:'Humidity',AR:'الرطوبة'},
    vpd: {FR:'VPD',EN:'VPD',AR:'VPD'},
    co2: {FR:'CO₂',EN:'CO₂',AR:'CO₂'},
    text:{FR:'T° extérieure',EN:'Outdoor temp.',AR:'الحرارة الخارجية'},
    ph:  {FR:'pH',EN:'pH',AR:'pH'},
    ec:  {FR:'EC',EN:'EC',AR:'EC'},
    niv: {FR:'Niveau eau',EN:'Water level',AR:'مستوى الماء'},
  };

  const EQ = {

    /* ── CO₂ — designed, NOT yet commissioned ── */
    'co2': {
      status: {FR:'Automatique', EN:'Automatic', AR:'تلقائي'},
      audio:  {FR:'audio/fr/co2.mp3', EN:'audio/en/co2.mp3', AR:'audio/ar/co2.mp3'},
      eq: {
          what: [
          {i:'ti-leaf',       FR:'Compense l\u2019appauvrissement en CO\u2082 des cultures denses et stimule la photosynthèse.', EN:'Compensates CO\u2082 depletion in dense crops and boosts photosynthesis.', AR:'يعوّض نضوب CO\u2082 في الزراعة الكثيفة ويعزز التمثيل الضوئي.'},
          {i:'ti-moon',       FR:'Injection suspendue la nuit — pas de photosynthèse.', EN:'Injection paused at night — no photosynthesis.', AR:'يُوقف الحقن ليلاً — لا تمثيل ضوئي.'},
          {i:'ti-lock',       FR:'Se coupe si la ventilation s\u2019ouvre, pour éviter les pertes.', EN:'Cuts off when ventilation opens, to avoid losses.', AR:'يتوقف عند فتح التهوية لتفادي الهدر.'},
          {i:'ti-trending-up',FR:'Peut augmenter les rendements de 20 à 30 %.', EN:'Can raise yields by 20–30%.', AR:'قد يرفع الإنتاجية بنسبة 20–30٪.'},
        ],
        trigger: {
          on:  {FR:'Journée · ventilation fermée · photosynthèse active', EN:'Day · ventilation closed · active photosynthesis', AR:'نهاراً · التهوية مغلقة · تمثيل ضوئي نشط'},
          off: {FR:'Nuit, ventilation ouverte ou cible atteinte', EN:'Night, ventilation open or target reached', AR:'ليلاً، التهوية مفتوحة أو بلوغ الهدف'},
        },
        band: {title:{FR:'Concentration CO\u2082 (cible)',EN:'CO\u2082 concentration (target)',AR:'تركيز CO\u2082 (الهدف)'}, unit:'ppm', scaleMin:400, scaleMax:2000, rangeLo:800, rangeHi:1200},
        monitor: [M.co2, M.vpd],
        set: [
          {i:'ti-cylinder', k:{FR:'Source',EN:'Source',AR:'المصدر'}, v:{FR:'Bouteille CO\u2082 comprimé',EN:'Compressed CO\u2082 cylinder',AR:'أسطوانة CO\u2082 مضغوط'}},
          {i:'ti-target',   k:{FR:'Cible',EN:'Target',AR:'الهدف'}, v:'800 – 1200 ppm'},
          {i:'ti-gauge',    k:{FR:'Mesure',EN:'Measurement',AR:'القياس'}, v:{FR:'Capteur CO₂ continu',EN:'Continuous CO₂ sensor',AR:'مستشعر CO₂ مستمر'}},
          {i:'ti-cpu',      k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Automatique (prévu)',EN:'Automatic (planned)',AR:'تلقائي (مُخطط)'}},
        ],
      },
    },

    /* ── Brumisateur — interior T°/humidity ── */
    'brumisateur': {
      status: {FR:'Automatique — piloté par capteurs', EN:'Automatic — sensor-driven', AR:'تلقائي — تتحكم به المستشعرات'},
      audio:  {FR:'audio/fr/brumisateur.mp3', EN:'audio/en/brumisateur.mp3', AR:'audio/ar/brumisateur.mp3'},
      eq: {
        what: [
          {i:'ti-cloud',             FR:'Brouillard de gouttelettes < 10 µm qui s\u2019évaporent en suspension.', EN:'Fog of <10 µm droplets that evaporate in suspension.', AR:'ضباب من قطيرات < 10 ميكرومتر تتبخر معلّقة.'},
          {i:'ti-temperature-minus', FR:'Réduit le VPD — un VPD élevé ferme les stomates et freine la photosynthèse.', EN:'Reduces VPD — high VPD closes stomata and slows photosynthesis.', AR:'يقلل VPD — ارتفاعه يُغلق الثغور ويُبطئ التمثيل الضوئي.'},
          {i:'ti-droplet',           FR:'Maintient l\u2019humidité dans la plage cible en temps réel.', EN:'Holds humidity in the target range in real time.', AR:'يحافظ على الرطوبة ضمن النطاق المستهدف فورياً.'},
          {i:'ti-seedling',          FR:'Critique au repiquage — les jeunes plants ne peuvent compenser les pertes hydriques.', EN:'Critical at transplanting — young plants cannot offset water loss.', AR:'بالغ الأهمية عند الشتل — الشتلات لا تعوّض الفقد المائي.'},
        ],
        trigger: {
          on:  {FR:'VPD élevé, T° au-dessus du seuil ou humidité trop basse', EN:'High VPD, temp. above threshold or humidity too low', AR:'VPD مرتفع أو الحرارة فوق العتبة أو الرطوبة منخفضة'},
          off: {FR:'T° et humidité dans les plages cibles', EN:'Temp. and humidity within target ranges', AR:'الحرارة والرطوبة ضمن النطاقات'},
        },
        band: {title:{FR:'Température ambiante',EN:'Ambient temperature',AR:'الحرارة المحيطة'}, unit:'°C', scaleMin:15, scaleMax:40, seuil:28},
        monitor: [M.temp, M.hum, M.vpd],
        set: [
          {i:'ti-spray',   k:{FR:'Buse',EN:'Nozzle',AR:'الفوهة'}, v:{FR:'Céramique HP',EN:'High-pressure ceramic',AR:'سيراميك عالي الضغط'}},
          {i:'ti-cpu',     k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Automatique',EN:'Automatic',AR:'تلقائي'}},
        ],
      },
    },

    /* ── Système de refroidissement — interior T° ── */
    'système de refroidissement': {
      status: {FR:'Automatique — selon T° intérieure', EN:'Automatic — by indoor temp.', AR:'تلقائي — حسب الحرارة الداخلية'},
      audio:  {FR:'audio/fr/refroidissement.mp3', EN:'audio/en/refroidissement.mp3', AR:'audio/ar/refroidissement.mp3'},
      eq: {
        what: [
          {i:'ti-droplet',     FR:'Refroidissement adiabatique — l\u2019eau en s\u2019évaporant prélève la chaleur de l\u2019air et l\u2019abaisse en température.', EN:'Adiabatic cooling — water absorbs heat as it evaporates, lowering air temperature.', AR:'تبريد أدياباتي — يمتص الماء الحرارة عند التبخر فيخفّض حرارة الهواء.'},
          {i:'ti-waves',       FR:'Abaisse la T° tout en relevant l\u2019humidité relative — double effet bénéfique.', EN:'Lowers temperature while raising relative humidity — a dual benefit.', AR:'يخفّض الحرارة مع رفع الرطوبة النسبية — تأثير مزدوج مفيد.'},
          {i:'ti-cpu',         FR:'S\u2019active quand la T° dépasse le seuil maximal.', EN:'Activates when temp. exceeds the max threshold.', AR:'يُفعَّل عند تجاوز الحرارة الحد الأقصى.'},
          {i:'ti-leaf',        FR:'Protège les cultures du stress thermique.', EN:'Protects crops from heat stress.', AR:'يحمي المحاصيل من الإجهاد الحراري.'},
        ],
        trigger: {
          on:  {FR:'T° intérieure au-dessus du seuil maximal', EN:'Indoor temp. above the max threshold', AR:'الحرارة الداخلية فوق الحد الأقصى'},
          off: {FR:'Température dans la plage optimale', EN:'Temperature within the optimal range', AR:'الحرارة ضمن النطاق الأمثل'},
        },
        band: {title:{FR:'Température serre',EN:'Greenhouse temperature',AR:'حرارة الدفيئة'}, unit:'°C', scaleMin:15, scaleMax:40, seuil:30},
        monitor: [M.temp],
        set: [
          {i:'ti-settings',         k:{FR:'Type',EN:'Type',AR:'النوع'}, v:{FR:'Adiabatique (évaporation)',EN:'Adiabatic (evaporative)',AR:'أدياباتي (تبخّري)'}},
          {i:'ti-temperature-plus', k:{FR:'Seuil',EN:'Threshold',AR:'العتبة'}, v:{FR:'T° > max',EN:'Temp > max',AR:'حرارة > الحد الأقصى'}},
          {i:'ti-cpu',              k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Automatique',EN:'Automatic',AR:'تلقائي'}},
        ],
      },
    },

    /* ── Ventilation naturelle — toits ouvrants pilotés par station météo ── */
    'ventilation': {
      title:  {FR:'Système de Ventilation Naturelle', EN:'Natural Ventilation System', AR:'نظام التهوية الطبيعية'},
      status: {FR:'Automatique — station météo', EN:'Automatic — weather station', AR:'تلقائي — محطة الأرصاد'},
      audio:  {FR:'audio/fr/ventilation.mp3', EN:'audio/en/ventilation.mp3', AR:'audio/ar/ventilation.mp3'},
      eq: {
        what: [
          {i:'ti-window',     FR:'Toits ouvrants laissant entrer l\u2019air extérieur et évacuer l\u2019air chaud et humide.', EN:'Roof vents allow fresh air in and exhausts hot humid air.', AR:'فتحات سقفية تُدخل هواءً منعشاً وتطرد الهواء الحار الرطب.'},
          {i:'ti-leaf',       FR:'Réapprovisionne le CO\u2082 et assèche le feuillage — limite Botrytis et mildiou.', EN:'Replenishes CO\u2082 and dries foliage — limits Botrytis and mildew.', AR:'يُجدد CO\u2082 ويُجفف الأوراق — يحدّ من البوتريتيس والبياض.'},
          {i:'ti-refresh',    FR:'Renouvelle l\u2019air naturellement — sans ventilation mécanique.', EN:'Renews the air naturally — no mechanical ventilation.', AR:'يجدد الهواء طبيعياً — بدون تهوية ميكانيكية.'},
          {i:'ti-cpu',        FR:'Commandé par station météo (T°, HR, vent et précipitations).', EN:'Driven by weather station (temp., RH, wind and rainfall).', AR:'يُدار بمحطة الأرصاد (الحرارة، الرطوبة، الرياح والأمطار).'},
        ],
        trigger: {
          on:  {FR:'Station météo : conditions favorables — fenêtres ouvertes', EN:'Weather station: favourable conditions — vents open', AR:'محطة الأرصاد: ظروف ملائمة — الفتحات مفتوحة'},
          off: {FR:'Vent fort, pluie, gel ou T° défavorable — fenêtres fermées', EN:'Strong wind, rain, frost or unfavourable temp. — vents closed', AR:'رياح قوية أو أمطار أو صقيع أو حرارة غير مناسبة — الفتحات مغلقة'},
        },
        band: {title:{FR:'Température serre',EN:'Greenhouse temperature',AR:'حرارة الدفيئة'}, unit:'°C', scaleMin:15, scaleMax:40, seuil:30},
        monitor: [M.temp, M.hum],
        set: [
          {i:'ti-window', k:{FR:'Type',EN:'Type',AR:'النوع'}, v:{FR:'Toits ouvrants / châssis zénithaux',EN:'Roof vents / zenith frames',AR:'فتحات سقفية / هياكل زينيثية'}},
          {i:'ti-cpu',    k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Station météorologique',EN:'Weather station',AR:'محطة الأرصاد'}},
        ],
      },
    },

    /* ── Rideaux automatiques — exterior T°, NOT yet integrated ── */
    'rideaux auto': {
      status: {FR:'Automatique — T° et éclairement', EN:'Automatic — temp. and irradiance', AR:'تلقائي — الحرارة والإشعاع'},
      audio:  {FR:'audio/fr/rideaux.mp3', EN:'audio/en/rideaux.mp3', AR:'audio/ar/rideaux.mp3'},
      eq: {
          what: [
          {i:'ti-moon',        FR:'Écran intérieur (nuit) — barrière isolante réduisant les pertes de chaleur par rayonnement et convection.', EN:'Interior screen (night) — insulating barrier reducing heat loss by radiation and convection.', AR:'شاشة داخلية (ليلاً) — حاجز عازل يحدّ من فقد الحرارة بالإشعاع والحمل.'},
          {i:'ti-sun',         FR:'Écran extérieur (jour) — intercepte le rayonnement solaire avant qu\u2019il pénètre dans la serre.', EN:'Exterior screen (day) — intercepts solar radiation before it enters the greenhouse.', AR:'شاشة خارجية (نهاراً) — تعترض الإشعاع الشمسي قبل دخوله الدفيئة.'},
          {i:'ti-gauge',       FR:'Déploiement automatisé selon l\u2019éclairement et la T° — en cohérence avec les autres équipements.', EN:'Automated deployment by irradiance and temperature — coordinated with other equipment.', AR:'نشر آلي حسب الإشعاع والحرارة — منسّق مع سائر التجهيزات.'},
          {i:'ti-cpu',         FR:'Piloté par la station météo extérieure (prévu).', EN:'Driven by the outdoor weather station (planned).', AR:'يُدار بمحطة الطقس الخارجية (مُخطط).'},
        ],
        trigger: {
          onLabel:  {FR:'DÉPLOYÉ',EN:'DEPLOYED',AR:'مُنشور'},
          offLabel: {FR:'NON DÉPLOYÉ',EN:'NOT DEPLOYED',AR:'غير مُنشور'},
          on:  {FR:'T° et éclairement dans la plage — isolation nocturne ou ombrage diurne', EN:'Temp. and irradiance within range — night insulation or daytime shading', AR:'الحرارة والإشعاع ضمن النطاق — عزل ليلي أو تظليل نهاري'},
          off: {FR:'Conditions hors plage — rétraction pour protéger la culture', EN:'Conditions out of range — retracted to protect crops', AR:'الظروف خارج النطاق — يُطوى لحماية المحصول'},
        },
        band: {title:{FR:'Température extérieure',EN:'Outdoor temperature',AR:'الحرارة الخارجية'}, unit:'°C', scaleMin:-5, scaleMax:45, rangeLo:10, rangeHi:32},
        monitor: [M.text],
        set: [
          {i:'ti-cpu',   k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Automatique (prévu)',EN:'Automatic (planned)',AR:'تلقائي (مُخطط)'}},
        ],
      },
    },

    /* ── Fenêtres automatiques — CORRECTED: exterior T° ONLY ── */
    'fenetre auto': {
      status: {FR:'Automatique — selon T° extérieure', EN:'Automatic — by outdoor temp.', AR:'تلقائي — حسب الحرارة الخارجية'},
      audio:  {FR:'audio/fr/fenetres.mp3', EN:'audio/en/fenetres.mp3', AR:'audio/ar/fenetres.mp3'},
      eq: {
        what: [
          {i:'ti-arrow-up',   FR:'Ventilation naturelle par effet cheminée (châssis zénithaux).', EN:'Natural stack-effect ventilation (roof vents).', AR:'تهوية طبيعية بتأثير المدخنة (فتحات سقفية).'},
          {i:'ti-cpu',        FR:'Commandées par la station météo : T°, HR, vitesse du vent et précipitations.', EN:'Driven by the weather station: temp., RH, wind speed and rainfall.', AR:'تُدار بمحطة الأرصاد: الحرارة والرطوبة والرياح والأمطار.'},
          {i:'ti-leaf',       FR:'Assèche le feuillage et réapprovisionne le CO\u2082 — limite Botrytis et mildiou.', EN:'Dries foliage and replenishes CO\u2082 — limits Botrytis and mildew.', AR:'يُجفف الأوراق ويُجدد CO\u2082 — يحدّ من البوتريتيس والبياض الزغبي.'},
          {i:'ti-shield',     FR:'Se referment en cas de vent fort, de pluie ou de T° défavorable.', EN:'Close when there is strong wind, rain or unfavourable temperature.', AR:'تُغلق عند رياح قوية أو أمطار أو حرارة غير مناسبة.'},
                  {i:'ti-shield', FR:'Moustiquaire intégrée — empêche les insectes ravageurs de pénétrer dans la serre.', EN:'Integrated mosquito net — prevents pest insects from entering the greenhouse.', AR:'شبك مدمج ضد الحشرات — يمنع الآفات من الدخول.'},
        ],
        trigger: {
          onLabel:  {FR:'OUVERTURE',EN:'OPENING',AR:'الفتح'},
          offLabel: {FR:'FERMETURE',EN:'CLOSING',AR:'الإغلاق'},
          on:  {FR:'Station météo favorable — T°, HR, vent et pluie dans les plages', EN:'Favourable weather station readings — temp., RH, wind and rainfall within ranges', AR:'محطة الأرصاد مواتية — الحرارة والرطوبة والرياح والأمطار ضمن النطاقات'},
          off: {FR:'Vent fort, pluie, gel ou T° extérieure défavorable', EN:'Strong wind, rain, frost or unfavourable outdoor temp.', AR:'رياح قوية أو أمطار أو صقيع أو حرارة خارجية غير مناسبة'},
        },
        /* band removed — meteo station multi-param trigger */
        monitor: [M.text],
        set: [
          {i:'ti-window',          k:{FR:'Type',EN:'Type',AR:'النوع'}, v:{FR:'Châssis zénithaux',EN:'Roof vents',AR:'فتحات سقفية'}},
          {i:'ti-cpu',             k:{FR:'Déclenchement',EN:'Trigger',AR:'التشغيل'}, v:{FR:'Station météorologique',EN:'Weather station',AR:'محطة الأرصاد'}},
          {i:'ti-arrows-maximize', k:{FR:'Plage',EN:'Range',AR:'النطاق'}, v:TC, pending:true},
          {i:'ti-cpu',             k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Automatique',EN:'Automatic',AR:'تلقائي'}},
          {i:'ti-shield',          k:{FR:'Protection insectes',EN:'Insect protection',AR:'حماية الحشرات'}, v:{FR:'Moustiquaire intégrée',EN:'Integrated mosquito net',AR:'شبك حماية مدمج'}},
        ],
      },
    },

    /* ── Station de fertigation — calculator placeholder (file coming) ── */
    'fertigation': {
      status: {FR:'Automatique — pH & EC régulés', EN:'Automatic — pH & EC regulated', AR:'تلقائي — ضبط pH وEC'},
      audio:  {FR:'audio/fr/fertigation.mp3', EN:'audio/en/fertigation.mp3', AR:'audio/ar/fertigation.mp3'},
      eq: {
        what: [
          {i:'ti-flask',       FR:'Prépare et distribue la solution nutritive.', EN:'Prepares and distributes the nutrient solution.', AR:'يحضّر ويوزّع المحلول الغذائي.'},
          {i:'ti-adjustments', FR:'Ajuste pH et EC selon les capteurs.', EN:'Adjusts pH and EC from the sensors.', AR:'يضبط pH وEC حسب المستشعرات.'},
          {i:'ti-plant',       FR:'Adapte les nutriments au stade de croissance.', EN:'Adapts nutrients to the growth stage.', AR:'يكيّف العناصر مع مرحلة النمو.'},
          {i:'ti-clock',       FR:'Irrigation programmée par cycles, 24 h/24.', EN:'Scheduled irrigation in cycles, 24/7.', AR:'ري مبرمج بدورات على مدار الساعة.'},
        ],
        bands: [
          {title:{FR:'pH cible',EN:'Target pH',AR:'pH المستهدف'}, unit:'', scaleMin:4, scaleMax:8, rangeLo:5.5, rangeHi:6.5},
          {title:{FR:'EC cible',EN:'Target EC',AR:'EC المستهدف'}, unit:'mS/cm', scaleMin:0, scaleMax:3, rangeLo:1.0, rangeHi:2.2},
        ],
        monitor: [M.ph, M.ec, M.niv],
        calc: 'inline',
        set: [
          {i:'ti-bucket',  k:{FR:'Réservoir',EN:'Tank',AR:'الخزان'}, v:'500 L'},
          {i:'ti-droplet', k:{FR:'pH cible',EN:'Target pH',AR:'pH المستهدف'}, v:'5.5 – 6.5'},
          {i:'ti-bolt',    k:{FR:'EC cible',EN:'Target EC',AR:'EC المستهدف'}, v:'1.0 – 2.2 mS/cm'},
          {i:'ti-cpu',     k:{FR:'Régulation',EN:'Regulation',AR:'التنظيم'}, v:{FR:'Automatique',EN:'Automatic',AR:'تلقائي'}},
        ],
      },
    },

    /* ── Système de chauffage à l'air chaud ── */
    'chauffage': {
      title:  {FR:'Système de Chauffage', EN:'Heating System', AR:'نظام التدفئة'},
      status: {FR:'Automatique — selon T° intérieure', EN:'Automatic — by indoor temp.', AR:'تلقائي — حسب الحرارة الداخلية'},
      audio:  {FR:'audio/fr/chauffage.mp3', EN:'audio/en/chauffage.mp3', AR:'audio/ar/chauffage.mp3'},
      eq: {
        what: [
          {i:'ti-temperature-plus', FR:'Diffuse de l\u2019air chaud quand la T° intérieure descend sous le seuil requis.', EN:'Diffuses hot air when indoor temperature drops below the required threshold.', AR:'ينفث هواءً ساخناً حين تنخفض الحرارة الداخلية عن الحد المطلوب.'},
          {i:'ti-shield',           FR:'Réduit la condensation sur le feuillage — limite les maladies cryptogamiques.', EN:'Reduces condensation on foliage — limits cryptogamic diseases.', AR:'يقلل التكاثف على الأوراق — يحدّ من الأمراض الفطرية.'},
          {i:'ti-leaf',             FR:'Maintient les cultures dans leur plage thermique optimale.', EN:'Keeps crops within their optimal temperature range.', AR:'يحافظ على المحاصيل ضمن نطاقها الحراري الأمثل.'},
          {i:'ti-droplet',          FR:'Peut alimenter le circuit de chauffage de la zone racinaire.', EN:'Can feed the root-zone heating circuit.', AR:'يمكنه تغذية دائرة تدفئة المنطقة الجذرية.'},
        ],
        trigger: {
          on:  {FR:'T° intérieure sous le seuil minimum requis', EN:'Indoor temp. below the required minimum', AR:'الحرارة الداخلية تحت الحد الأدنى المطلوب'},
          off: {FR:'T° intérieure dans la plage optimale', EN:'Indoor temp. within the optimal range', AR:'الحرارة الداخلية ضمن النطاق الأمثل'},
        },
        band: {title:{FR:'Température serre',EN:'Greenhouse temperature',AR:'حرارة الدفيئة'}, unit:'°C', scaleMin:5, scaleMax:35, seuil:15},
        monitor: [M.temp, M.hum],
        set: [
          {i:'ti-settings', k:{FR:'Type',EN:'Type',AR:'النوع'}, v:{FR:'Chauffage à air chaud',EN:'Hot-air heating',AR:'تدفئة بهواء ساخن'}},
          {i:'ti-cpu',      k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Automatique',EN:'Automatic',AR:'تلقائي'}},
        ],
      },
    },

    /* ── Lampes LED — piloté par luxmètre ── */
    'lumiere': {
      title:  {FR:'Lampes LED', EN:'LED Lighting', AR:'إضاءة LED'},
      status: {FR:'Automatique — piloté par luxmètre', EN:'Automatic — luxmeter-driven', AR:'تلقائي — محكوم بمقياس الإضاءة'},
      audio:  {FR:'audio/fr/lumiere.mp3', EN:'audio/en/lumiere.mp3', AR:'audio/ar/lumiere.mp3'},
      eq: {
        what: [
          {i:'ti-sun',              FR:'Complète la lumière naturelle lorsqu\u2019elle est insuffisante pour la photosynthèse.', EN:'Supplements natural light when insufficient for photosynthesis.', AR:'تُكمّل الضوء الطبيعي حين يكون غير كافٍ للتمثيل الضوئي.'},
          {i:'ti-gauge',            FR:'Pilotées par luxmètre — allumage sous le seuil, extinction au-dessus.', EN:'Controlled by luxmeter — on below threshold, off when sufficient.', AR:'محكومة بمقياس الإضاءة — تُضاء دون العتبة وتُطفأ فوقها.'},
          {i:'ti-moon',             FR:'Prolongent la durée d\u2019éclairement en début et fin de journée.', EN:'Extend the photoperiod at the start and end of the day.', AR:'تُطيل فترة الإضاءة في بداية النهار ونهايته.'},
          {i:'ti-temperature-minus',FR:'Faible dégagement de chaleur — n\u2019altèrent pas le climat de la serre.', EN:'Low heat output — do not disturb the greenhouse climate.', AR:'انبعاث حراري منخفض — لا يؤثر على مناخ الدفيئة.'},
        ],
        trigger: {
          on:  {FR:'Éclairement naturel sous le seuil (luxmètre)', EN:'Natural light below threshold (luxmeter)', AR:'الإضاءة الطبيعية تحت العتبة (مقياس الإضاءة)'},
          off: {FR:'Lumière naturelle suffisante', EN:'Natural light sufficient', AR:'الضوء الطبيعي كافٍ'},
        },
        band: {title:{FR:'Éclairement (luxmètre)',EN:'Illuminance (luxmeter)',AR:'شدة الإضاءة (مقياس)'}, unit:'klux', scaleMin:0, scaleMax:100, seuil:30},
        monitor: [M.temp],
        set: [
          {i:'ti-sun',  k:{FR:'Type',EN:'Type',AR:'النوع'}, v:{FR:'LED spectre de croissance',EN:'Growth-spectrum LED',AR:'LED بطيف النمو'}},
          {i:'ti-gauge',k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Luxmètre automatique',EN:'Automatic luxmeter',AR:'مقياس إضاءة تلقائي'}},
        ],
      },
    },


    /* ── Tables Mobiles — chauffage racinaire par eau chaude ── */
    'tablettes': {
      title:  {FR:'Tables Mobiles', EN:'Mobile Tables', AR:'الطاولات المتنقلة'},
      status: {FR:'Chauffage racinaire', EN:'Root-zone heating', AR:'تدفئة المنطقة الجذرية'},
      audio:  {FR:'audio/fr/tablettes.mp3', EN:'audio/en/tablettes.mp3', AR:'audio/ar/tablettes.mp3'},
      eq: {
        what: [
          {i:'ti-stack',           FR:'Tables sur rails — mobilité pour optimiser l\u2019espace et faciliter l\u2019entretien.', EN:'Rail-mounted tables — mobility to optimise space and ease maintenance.', AR:'طاولات على قضبان — حركية لتحسين استغلال المساحة وتسهيل الصيانة.'},
          {i:'ti-droplet',         FR:'Tuyaux d\u2019eau chaude intégrés sous la surface pour réchauffer la zone racinaire.', EN:'Integrated hot-water pipes beneath the surface to warm the root zone.', AR:'أنابيب ماء ساخن مدمجة تحت السطح لتدفئة المنطقة الجذرية.'},
          {i:'ti-temperature-plus',FR:'Un substrat chaud stimule l\u2019activité racinaire et l\u2019absorption de l\u2019eau et des minéraux.', EN:'A warm substrate stimulates root activity and uptake of water and minerals.', AR:'الركيزة الدافئة تُحفّز نشاط الجذور وامتصاص الماء والمعادن.'},
          {i:'ti-leaf',            FR:'Culture hors-sol en pots — contrôle étroit du substrat, du volume et de la nutrition.', EN:'Soilless pot culture — tight control of substrate, volume and nutrition.', AR:'زراعة بدون تربة في أواني — تحكم دقيق في الركيزة والحجم والتغذية.'},
        ],
        trigger: {
          on:  {FR:'Période fraîche — circuit eau chaude racinaire activé', EN:'Cool period — root-zone hot-water circuit active', AR:'فترة باردة — دارة الماء الساخن الجذري نشطة'},
          off: {FR:'T° substrat dans la plage optimale', EN:'Substrate temp. within the optimal range', AR:'حرارة الركيزة ضمن النطاق الأمثل'},
        },
        band: {title:{FR:'T° zone racinaire',EN:'Root-zone temperature',AR:'حرارة المنطقة الجذرية'}, unit:'°C', scaleMin:5, scaleMax:35, seuil:18},
        monitor: [M.temp, M.hum],
        set: [
          {i:'ti-stack',  k:{FR:'Type',EN:'Type',AR:'النوع'}, v:{FR:'Tables mobiles sur rails',EN:'Rail-mounted mobile tables',AR:'طاولات متنقلة على قضبان'}},
          {i:'ti-droplet',k:{FR:'Chauffage',EN:'Heating',AR:'التدفئة'}, v:{FR:'Circuit eau chaude racinaire',EN:'Root-zone hot-water circuit',AR:'دارة ماء ساخن جذري'}},
          {i:'ti-cpu',    k:{FR:'Contrôle',EN:'Control',AR:'التحكم'}, v:{FR:'Automatique — T° substrat',EN:'Automatic — substrate temp.',AR:'تلقائي — حرارة الركيزة'}},
        ],
      },
    },

  };  /* ← EQ closing */

  /* catMap entries for new equipment */
  if(T?.FR?.catMap){
    T.FR.catMap['chauffage'] = 'CHAUFFAGE'; T.EN.catMap['chauffage'] = 'HEATING';  T.AR.catMap['chauffage'] = 'التدفئة';
    T.FR.catMap['lumiere']   = 'ÉCLAIRAGE'; T.EN.catMap['lumiere']   = 'LIGHTING'; T.AR.catMap['lumiere']   = 'الإضاءة';
    T.FR.catMap['tablettes'] = 'ÉQUIPEMENT DE CULTURE'; T.EN.catMap['tablettes'] = 'GROWING EQUIPMENT'; T.AR.catMap['tablettes'] = 'معدات الزراعة';
  }
  Object.keys(EQ).forEach(k => {
    if(!AR_CONTENT[k]) AR_CONTENT[k] = {title:EQ[k].title?.FR||k, color:'#059669', tabs:['Info'], sections:[], thresholds:[]};
    const d = AR_CONTENT[k];
    if(k === 'lumiere'){
  d.icon = eqIcon('ti-sun','#f59e0b');

  d.iconBg = 'rgba(245,158,11,.18)';
  d.iconBorder = 'rgba(252,211,77,.3)';
  d.color = '#f59e0b';
}
if(k === 'tablettes'){
  d.icon = eqIcon('ti-stack','#10b981');

  d.iconBg = 'rgba(16,185,129,.18)';
  d.iconBorder = 'rgba(110,231,183,.3)';
  d.color = '#10b981';
}
    if(k === 'chauffage'){
  d.icon = eqIcon('ti-temperature-plus','#ef4444');
  d.iconBg = 'rgba(239,68,68,.18)';
  d.iconBorder = 'rgba(252,165,165,.3)';
  d.color = '#ef4444';

  d.heroGradient =
    'radial-gradient(ellipse at 50% 50%, rgba(239,68,68,.25) 0%, transparent 65%)';

  d.heroAnim = `
    <svg style="position:absolute;inset:0;width:100%;height:100%"
         viewBox="0 0 370 120" fill="none">
      <circle cx="120" cy="60" r="8" fill="rgba(239,68,68,.25)"/>
      <circle cx="180" cy="45" r="10" fill="rgba(239,68,68,.18)"/>
      <circle cx="240" cy="70" r="7" fill="rgba(239,68,68,.22)"/>
    </svg>`;
}


    d.type = 'equipment';
    d.tabs = ['Info'];
    d.stateKey = null;
    d.eq = EQ[k].eq;
    d.audio = EQ[k].audio;
    d.statusText    = EQ[k].status.FR;
    d.statusText_en = EQ[k].status.EN;
    d.statusText_ar = EQ[k].status.AR;
    if(EQ[k].title){ d.title = EQ[k].title.FR; d.title_en = EQ[k].title.EN; d.title_ar = EQ[k].title.AR; }
  });
})();

/* ── Equipment card renderer (descriptive · glassmorphism) ── */
function renderEquipmentCard(el, def){
  const lang = window.currentLang || 'FR';
  const e = def.eq;
  if(!e){ el.innerHTML = ''; return; }
  const px = o => eqPx(o, lang);
  const UI = {
    secWhat:    {FR:'CE QUE FAIT CE SYSTÈME',EN:'WHAT THIS SYSTEM DOES',AR:'ما يقوم به هذا النظام'},
    secTrigger: {FR:'CONDITIONS DE DÉCLENCHEMENT',EN:'TRIGGER CONDITIONS',AR:'شروط التشغيل'},
    secMonitor: {FR:'SUIVI EN TEMPS RÉEL',EN:'REAL-TIME MONITORING',AR:'المراقبة الفورية'},
    secSet:     {FR:'RÉGLAGES',EN:'SETTINGS',AR:'الإعدادات'},
    secCalc:    {FR:'CALCULATEUR DE SOLUTION',EN:'NUTRIENT SOLUTION CALCULATOR',AR:'حاسبة المحلول الغذائي'},
    secAudio:   {FR:'PRÉSENTATION AUDIO',EN:'AUDIO GUIDE',AR:'الشرح الصوتي'},
    onLabel:    {FR:'ACTIVATION',EN:'ACTIVATION',AR:'تشغيل'},
    offLabel:   {FR:'ARRÊT',EN:'STOP',AR:'إيقاف'},
    monitorNote:{FR:'Suivi via les capteurs IoT — valeurs en direct dans la carte Capteurs.',EN:'Monitored via the IoT sensors — live values in the Capteurs card.',AR:'تتم المراقبة عبر مستشعرات IoT — القيم المباشرة في بطاقة المستشعرات.'},
    calcTitle:  {FR:'Calculateur de solution nutritive',EN:'Nutrient solution calculator',AR:'حاسبة المحلول الغذائي'},
    calcSub:    {FR:'Module à intégrer — basé sur la calculatrice du dashboard.',EN:'Module to integrate — based on the dashboard calculator.',AR:'وحدة قيد الدمج — مبنية على حاسبة لوحة التحكم.'},
    audioPlay:  {FR:'Écouter la présentation',EN:'Listen to the presentation',AR:'استمع إلى الشرح'},
    audioPause: {FR:'Pause',EN:'Pause',AR:'إيقاف مؤقت'},
    audioLang:  {FR:'Narration en français',EN:'English narration',AR:'الشرح بالعربية'},
    audioSub:   {FR:'Présentation du système',EN:'System presentation',AR:'عرض النظام'},
    audioNA:    {FR:'Audio bientôt disponible',EN:'Audio available soon',AR:'الصوت متاح قريباً'},
  };

  el.classList.add('eq-card');
  let h = '';

  if(e.pending){
    h += `<div class="eq-pending">${eqIcon('ti-progress-alert')}<div class="eq-pending-txt">${px(e.pending)}</div></div>`;
  }

  if(e.what && e.what.length){
    h += `<div class="ar-section-title eq-sec">${px(UI.secWhat)}</div><div class="eq-what-grid">`
      + e.what.map((w,idx) => `<div class="eq-what-card" style="animation-delay:${idx*60}ms"><div class="eq-what-icon">${eqIcon(w.i)}</div><div class="eq-what-txt">${px(w)}</div></div>`).join('')
      + `</div>`;
  }

  if(e.trigger){
    const onL  = px(e.trigger.onLabel  || UI.onLabel);
    const offL = px(e.trigger.offLabel || UI.offLabel);
    h += `<div class="ar-section-title eq-sec">${px(UI.secTrigger)}</div>`
      + `<div class="eq-trigger">`
      +   `<div class="eq-trigger-col on"><div class="eq-trigger-head">${eqIcon('ti-player-play-filled')}${onL}</div><div class="eq-trigger-txt">${px(e.trigger.on)}</div></div>`
      +   `<div class="eq-trigger-col"><div class="eq-trigger-head off">${eqIcon('ti-player-stop-filled')}${offL}</div><div class="eq-trigger-txt">${px(e.trigger.off)}</div></div>`
      + `</div>`;
  }

  const bands = (e.bands || (e.band ? [e.band] : [])).filter(b => !b.pending);
  if(bands.length){
    h += `<div class="ar-section-title eq-sec">${px(bands[0].title)}</div>`;
    bands.forEach((b, idx) => { if(idx) h += `<div class="ar-section-title eq-sec">${px(b.title)}</div>`; h += eqBandHTML(b, lang); });
  }

  if(e.monitor && e.monitor.length){
    h += `<div class="ar-section-title eq-sec">${px(UI.secMonitor)}</div>`
      + `<div class="eq-monitor"><div class="eq-monitor-chips">`
      + e.monitor.map(m => `<span class="eq-chip"><span class="eq-chip-dot"></span>${px(m)}</span>`).join('')
      + `</div><div class="eq-monitor-note">${px(UI.monitorNote)}</div></div>`;
  }

  if(e.set && e.set.length){
    const filtSet = e.set.filter(s => !s.pending);
    if(filtSet.length){
      h += `<div class="ar-section-title eq-sec">${px(UI.secSet)}</div><div class="eq-set">`
        + filtSet.map(s => {
            const val = (typeof s.v === 'string') ? s.v : px(s.v);
            return `<div class="eq-set-row"><span class="eq-set-icon">${eqIcon(s.i)}</span><span class="eq-set-label">${px(s.k)}</span><span class="eq-set-val">${val}</span></div>`;
          }).join('')
        + `</div>`;
    }
  }

  if(e.calc){
    h += `<div class="ar-section-title eq-sec">${px(UI.secCalc)}</div>`;
    if(e.calc === 'inline' && typeof buildFertigCalcHTML === 'function'){
      h += buildFertigCalcHTML(lang);
    } else {
      h += `<div class="eq-calc"><div class="eq-calc-icon">${eqIcon('ti-calculator')}</div>`
         + `<div class="eq-calc-body"><div class="eq-calc-title">${px(UI.calcTitle)}</div><div class="eq-calc-sub">${px(UI.calcSub)}</div></div></div>`;
    }
  }

  /* audio player — reuses the sns-audio component */
  const audioSrc = def.audio && def.audio[lang];
  const hasAudio = !!audioSrc;
  const isPlaying = window._arAudioEl && !window._arAudioEl.paused
    && window._arAudioEl._arKey === window.activeAR && window._arAudioEl._arLang === lang;
  h += `<div class="ar-section-title eq-sec" style="margin-top:18px">${px(UI.secAudio)}</div>`
    + `<div class="sns-audio-wrap"><div class="sns-audio-lang">${px(UI.audioLang)}</div>`
    + `<button class="sns-audio-btn${hasAudio?'':' sns-audio-disabled'}" id="sns-audio-btn" onclick="eqToggleAudio()" ${hasAudio?'':'disabled'}>`
    +   `<div class="sns-audio-play-circle"><span class="sns-audio-icon" id="sns-audio-icon">${isPlaying?'⏸':'▶'}</span></div>`
    +   `<div class="sns-audio-text"><span class="sns-audio-main" id="sns-audio-label">${isPlaying?px(UI.audioPause):px(UI.audioPlay)}</span><span class="sns-audio-sub">${px(UI.audioSub)}</span></div>`
    + `</button>`
    + (hasAudio ? '' : `<span class="sns-audio-na">${px(UI.audioNA)}</span>`)
    + `</div>`;

  el.innerHTML = h;
  if(e.calc === 'inline') setTimeout(() => { if(window.arcUpdate) window.arcUpdate(); }, 0);
}

/* ── Spec range band (config seuil OR range — never live) ── */
function eqBandHTML(b, lang){
  const px = o => eqPx(o, lang);
  const span = (b.scaleMax - b.scaleMin) || 1;
  const pc = v => Math.min(100, Math.max(0, ((v - b.scaleMin) / span) * 100));
  let label = '', marker = '';
  if(b.pending){
    label = `<span>${px({FR:'Pilotée par la T° extérieure',EN:'Driven by outdoor temp.',AR:'حسب الحرارة الخارجية'})}</span><b>${px({FR:'à confirmer',EN:'to confirm',AR:'قيد التأكيد'})}</b>`;
    marker = `<div class="eq-band-fill" style="left:0;width:100%;opacity:.22"></div>`;
  } else if(b.rangeLo != null){
    const l = pc(b.rangeLo), w = pc(b.rangeHi) - l;
    label = `<span>${px({FR:'Plage cible',EN:'Target range',AR:'النطاق المستهدف'})}</span><b>${b.rangeLo} – ${b.rangeHi}${b.unit?' '+b.unit:''}</b>`;
    marker = `<div class="eq-band-fill" style="left:${l}%;width:${w}%"></div>`;
  } else if(b.seuil != null){
    label = `<span>${px({FR:'Seuil d\u2019activation',EN:'Activation threshold',AR:'عتبة التشغيل'})}</span><b>${b.seuil} ${b.unit}</b>`;
    marker = `<div class="eq-band-fill" style="left:0;width:${pc(b.seuil)}%;opacity:.28"></div><div class="eq-band-seuil" style="left:${pc(b.seuil)}%"></div>`;
  }
  return `<div class="eq-band"><div class="eq-band-label">${label}</div><div class="eq-band-track">${marker}</div>`
    + `<div class="eq-band-ticks"><span>${b.scaleMin}${b.unit?' '+b.unit:''}</span><span>${b.scaleMax}${b.unit?' '+b.unit:''}</span></div></div>`;
}

/* ── Capteurs live-data grid (the ONLY card with live IoT) ── */
function eqSensorsLiveHTML(lang){
  const px = o => eqPx(o, lang);
  const iot = window.iotData;
  const head = ''; /* DONNÉES EN DIRECT header removed */
  if(!iot){ return head + `<div class="sns-live-loading">${px({FR:'',EN:'',AR:''})}</div>`; }
  const env = iot.env || {}, irr = iot.irr || {};
  const thr = k => (typeof getThresh === 'function') ? getThresh(k) : {};
  const fmt = v => v != null ? Number(v).toFixed(1) : '—';
  const LBL = {
    temperature:{FR:'Température',EN:'Temperature',AR:'الحرارة'},
    humidite:   {FR:'Humidité',EN:'Humidity',AR:'الرطوبة'},
    vpd:        {FR:'VPD',EN:'VPD',AR:'VPD'},
    ph:         {FR:'pH solution',EN:'Solution pH',AR:'pH المحلول'},
    ec:         {FR:'Conductivité',EN:'Conductivity',AR:'التوصيل'},
    niveau_eau: {FR:'Niveau eau',EN:'Water level',AR:'مستوى الماء'},
  };
  function cell(key, val, unit, t){
    const lo = t && t.valeur_min, hi = t && t.valeur_max;
    let st = 'na';
    if(val != null && lo != null && hi != null) st = (val >= lo && val <= hi) ? 'ok' : 'warn';
    else if(val != null && lo == null) st = 'ok';
    const range = (lo != null && hi != null) ? `${Number(lo).toFixed(1)}–${Number(hi).toFixed(1)}` : '';
    return `<div class="sns-live-cell"><div class="sns-live-k">${px(LBL[key])}</div>`
      + `<div class="sns-live-vrow"><span class="sns-live-v">${fmt(val)}</span><span class="sns-live-u">${unit}</span></div>`
      + `<div class="sns-live-foot"><span class="sns-live-status-dot ${st}"></span><span class="sns-live-range">${range}</span></div></div>`;
  }
  const cells = [
    cell('temperature', env.temperature, '°C',    thr('temperature')),
    cell('humidite',    env.humidite,    '%',     thr('humidite')),
    cell('vpd',         env.vpd,         'kPa',   null),
    cell('ph',          irr.ph,          '',      thr('ph')),
    cell('ec',          irr.ec,          'mS/cm', thr('ec')),
    cell('niveau_eau',  irr.niveau_eau,  '%',     null),
  ].join('');
  const refresh = `onclick="(typeof fetchIoT!=='undefined')&&fetchIoT().then(()=>renderARTab(0,getARDef(window.activeAR)))"`;
  return head
    + `<div class="sns-live-head"><span class="sns-live-dot"></span><span class="sns-live-label">${px({FR:'EN DIRECT',EN:'LIVE',AR:'مباشر'})}</span>`
    + `<span class="sns-live-time" ${refresh}>⟳ ${px({FR:'actualiser',EN:'refresh',AR:'تحديث'})}</span></div>`
    + `<div class="sns-live-grid">${cells}</div>`;
}

/* ── Audio toggle for equipment cards (language-linked) ── */
function eqToggleAudio(){
  const def = getARDef(window.activeAR);
  if(!def) return;
  const lang = window.currentLang || 'FR';
  const src  = def.audio && def.audio[lang];
  const icon = document.getElementById('sns-audio-icon');
  const lbl  = document.getElementById('sns-audio-label');
  const L_pause = {FR:'Pause', EN:'Pause', AR:'إيقاف مؤقت'};
  const L_play  = {FR:'Écouter la présentation', EN:'Listen to the presentation', AR:'استمع إلى الشرح'};

  if(window._arAudioEl && !window._arAudioEl.paused
     && window._arAudioEl._arKey === window.activeAR
     && window._arAudioEl._arLang === lang){
    window._arAudioEl.pause();
    if(icon) icon.textContent = '▶';
    if(lbl)  lbl.textContent = L_play[lang] || L_play.FR;
    return;
  }
  if(window._arAudioEl){ window._arAudioEl.pause(); window._arAudioEl.currentTime = 0; }
  if(!src) return;
  const audio = new Audio(src);
  audio._arKey  = window.activeAR;
  audio._arLang = lang;
  window._arAudioEl = audio;
  audio.play().then(()=>{
    if(icon) icon.textContent = '⏸';
    if(lbl)  lbl.textContent = L_pause[lang] || L_pause.FR;
  }).catch(()=>{ if(icon) icon.textContent = '▶'; });
  audio.addEventListener('ended', ()=>{
    if(icon) icon.textContent = '▶';
    if(lbl)  lbl.textContent = L_play[lang] || L_play.FR;
  });
}


/* ═══════════════════════════════════════════════════════════════════════
   PASS 2a — Living-organism cards (crops + plant pathology)
   · One reusable multilingual renderer: renderInfoCard(el, def)
   · Driven by def.card = { pending?, sections:[{title,kind,items,note}], }
     kinds: 'facts' | 'grid' | 'bullets' | 'chips'
   · Reuses the Pass-1 glass components (eq-*) + inline SVG icons.
   · Augments existing defs in place — full FR/EN/AR, no placeholders.
   ───────────────────────────────────────────────────────────────────── */

/* extra inline icons (added to the existing EQ_ICONS object) */
Object.assign(EQ_ICONS, {
  'ti-point':'<circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none"/>',
  'ti-map-pin':'<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  'ti-flag':'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  'ti-virus':'<circle cx="12" cy="12" r="5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M18.4 5.6l-2 2M5.6 18.4l2-2"/><circle cx="12" cy="3" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="21" r=".9" fill="currentColor" stroke="none"/>',
  'ti-bug':'<rect x="8" y="9" width="8" height="9" rx="4"/><path d="M8 12H4M20 12h-4M8 16l-3 2M16 16l3 2M8 10 5 8M16 10l3-2M12 5v4"/><path d="M10 6l2-2 2 2"/>',
  'ti-microscope':'<path d="M6 20h11"/><path d="M5 23h14"/><path d="M10 20V9"/><path d="M10 9a3.5 3.5 0 1 1 4 3"/><path d="M8 9h4"/>',
  'ti-scissors':'<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 8l12 9M20 7 8 16"/>',
  'ti-flower':'<circle cx="12" cy="12" r="2"/><circle cx="12" cy="6.5" r="2.3"/><circle cx="12" cy="17.5" r="2.3"/><circle cx="6.5" cy="12" r="2.3"/><circle cx="17.5" cy="12" r="2.3"/>',
  'ti-seedling':'<path d="M12 20v-8"/><path d="M12 12c0-3 2.5-5 5.5-5 0 3-2.5 5-5.5 5z"/><path d="M12 13c0-2.5-2-4.5-5-4.5 0 2.5 2 4.5 5 4.5z"/>',
  'ti-test-pipe':'<path d="M14 3 7 17a3 3 0 0 0 5.6 2L19 5"/><path d="M9 13h7"/><path d="M13 3h5"/>',
  'ti-grain':'<circle cx="12" cy="6" r="2"/><circle cx="9" cy="11" r="2"/><circle cx="15" cy="11" r="2"/><circle cx="12" cy="16" r="2"/>',
});

/* ── reusable info-card renderer ── */
function renderInfoCard(el, def){
  const lang = window.currentLang || 'FR';
  const c = def.card;
  if(!c){ el.innerHTML = ''; return; }
  const px = o => eqPx(o, lang);
  const UI = {
    secAudio:  {FR:'PRÉSENTATION AUDIO',EN:'AUDIO GUIDE',AR:'الشرح الصوتي'},
    audioPlay: {FR:'Écouter la présentation',EN:'Listen to the presentation',AR:'استمع إلى الشرح'},
    audioPause:{FR:'Pause',EN:'Pause',AR:'إيقاف مؤقت'},
    audioLang: {FR:'Narration en français',EN:'English narration',AR:'الشرح بالعربية'},
    audioSub:  {FR:'Présentation de la fiche',EN:'Card presentation',AR:'عرض البطاقة'},
    audioNA:   {FR:'Audio bientôt disponible',EN:'Audio available soon',AR:'الصوت متاح قريباً'},
  };
  el.classList.add('eq-card');
  let h = '';

  if(c.pending){
    h += `<div class="eq-pending">${eqIcon('ti-progress-alert')}<div class="eq-pending-txt">${px(c.pending)}</div></div>`;
  }

  (c.sections || []).forEach(sec => {
    if(sec.kind === 'facts'){
      const filtFacts = sec.items.filter(it => !it.flag);
      if(!filtFacts.length) return;
      h += `<div class="ar-section-title eq-sec">${px(sec.title)}</div>`;
      h += `<div class="eq-set">` + filtFacts.map(it => {
        const val = (typeof it.v === 'string') ? it.v : px(it.v);
        return `<div class="eq-set-row"><span class="eq-set-icon">${eqIcon(it.i || 'ti-point')}</span><span class="eq-set-label">${px(it.k)}</span><span class="eq-set-val">${val}</span></div>`;
      }).join('') + `</div>`;
    } else {
      h += `<div class="ar-section-title eq-sec">${px(sec.title)}</div>`;
      if(sec.kind === 'grid'){
        h += `<div class="eq-what-grid">` + sec.items.map((it, idx) =>
          `<div class="eq-what-card" style="animation-delay:${idx*60}ms"><div class="eq-what-icon">${eqIcon(it.i || 'ti-point')}</div><div class="eq-what-txt">${px(it)}</div></div>`
        ).join('') + `</div>`;
      } else if(sec.kind === 'bullets'){
        h += `<ul class="info-bullets">` + sec.items.map(it => `<li>${px(it)}</li>`).join('') + `</ul>`;
      } else if(sec.kind === 'chips'){
        h += `<div class="eq-monitor"><div class="eq-monitor-chips">` +
          sec.items.map(it => `<span class="eq-chip"><span class="eq-chip-dot"></span>${px(it)}</span>`).join('') +
          `</div>` + (sec.note ? `<div class="eq-monitor-note">${px(sec.note)}</div>` : '') + `</div>`;
      }
    }
  });

  /* audio player — reuses the sns-audio component */
  const audioSrc = def.audio && def.audio[lang];
  const hasAudio = !!audioSrc;
  const isPlaying = window._arAudioEl && !window._arAudioEl.paused
    && window._arAudioEl._arKey === window.activeAR && window._arAudioEl._arLang === lang;
  h += `<div class="ar-section-title eq-sec" style="margin-top:18px">${px(UI.secAudio)}</div>`
    + `<div class="sns-audio-wrap"><div class="sns-audio-lang">${px(UI.audioLang)}</div>`
    + `<button class="sns-audio-btn${hasAudio?'':' sns-audio-disabled'}" id="sns-audio-btn" onclick="eqToggleAudio()" ${hasAudio?'':'disabled'}>`
    +   `<div class="sns-audio-play-circle"><span class="sns-audio-icon" id="sns-audio-icon">${isPlaying?'⏸':'▶'}</span></div>`
    +   `<div class="sns-audio-text"><span class="sns-audio-main" id="sns-audio-label">${isPlaying?px(UI.audioPause):px(UI.audioPlay)}</span><span class="sns-audio-sub">${px(UI.audioSub)}</span></div>`
    + `</button>`
    + (hasAudio ? '' : `<span class="sns-audio-na">${px(UI.audioNA)}</span>`)
    + `</div>`;

  el.innerHTML = h;
}

/* ── Pass 2a content + augmentation ── */
(function augmentInfoDefs(){
  if(typeof AR_CONTENT === 'undefined') return;

  const addCat = (key, fr, en, ar) => {
    if(typeof T === 'undefined') return;
    if(T.FR && T.FR.catMap) T.FR.catMap[key] = fr;
    if(T.EN && T.EN.catMap) T.EN.catMap[key] = en;
    if(T.AR && T.AR.catMap) T.AR.catMap[key] = ar;
  };
  const CAT_CROP = ['CULTURE','CROP','محصول'];
  const CAT_PATH = ['PHYTOPATHOLOGIE','PLANT PATHOLOGY','أمراض النبات'];

  // localized labels reused across cards
  const Lk = {
    espece:{FR:'Espèce',EN:'Species',AR:'النوع'},
    famille:{FR:'Famille',EN:'Family',AR:'الفصيلة'},
    systeme:{FR:'Système',EN:'System',AR:'النظام'},
    origine:{FR:'Origine',EN:'Origin',AR:'الأصل'},
    statut:{FR:'Statut',EN:'Status',AR:'الحالة'},
    temp:{FR:'Température',EN:'Temperature',AR:'الحرارة'},
    tempJ:{FR:'Température jour',EN:'Day temperature',AR:'حرارة النهار'},
    tempN:{FR:'Température nuit',EN:'Night temperature',AR:'حرارة الليل'},
    hum:{FR:'Humidité',EN:'Humidity',AR:'الرطوبة'},
    ph:{FR:'pH solution',EN:'Solution pH',AR:'pH المحلول'},
    ec:{FR:'EC solution',EN:'Solution EC',AR:'EC المحلول'},
    photo:{FR:'Photopériode',EN:'Photoperiod',AR:'الفترة الضوئية'},
    light:{FR:'Lumière',EN:'Light',AR:'الإضاءة'},
    sol:{FR:'Sol',EN:'Soil',AR:'التربة'},
    isolement:{FR:'Isolement',EN:'Isolation',AR:'العزل'},
    traitement:{FR:'Traitement',EN:'Treatment',AR:'العلاج'},
    suivi:{FR:'Suivi',EN:'Monitoring',AR:'المتابعة'},
    etude:{FR:'Type d\u2019étude',EN:'Study type',AR:'نوع الدراسة'},
    methode:{FR:'Méthode',EN:'Method',AR:'الطريقة'},
    application:{FR:'Application',EN:'Application',AR:'التطبيق'},
  };
  const monitorNote = {FR:'Suivi via les capteurs IoT — valeurs en direct dans la carte Capteurs.',EN:'Monitored via the IoT sensors — live values in the Capteurs card.',AR:'تتم المراقبة عبر مستشعرات IoT — القيم المباشرة في بطاقة المستشعرات.'};
  const Mt = {FR:'Température',EN:'Temperature',AR:'الحرارة'}, Mh = {FR:'Humidité',EN:'Humidity',AR:'الرطوبة'}, Mph={FR:'pH',EN:'pH',AR:'pH'}, Mec={FR:'EC',EN:'EC',AR:'EC'};

  const secId   = {FR:'IDENTIFICATION',EN:'IDENTIFICATION',AR:'التعريف'};
  const secOpt  = {FR:'CONDITIONS OPTIMALES',EN:'OPTIMAL CONDITIONS',AR:'الظروف المثلى'};
  const secCult = {FR:'CULTURE',EN:'CULTIVATION',AR:'الزراعة'};
  const secMon  = {FR:'SUIVI EN TEMPS RÉEL',EN:'REAL-TIME MONITORING',AR:'المراقبة الفورية'};
  const secDis  = {FR:'MALADIES ÉTUDIÉES',EN:'DISEASES STUDIED',AR:'الأمراض المدروسة'};
  const secProto= {FR:'PROTOCOLE',EN:'PROTOCOL',AR:'البروتوكول'};
  const secObj  = {FR:'OBJECTIFS DE RECHERCHE',EN:'RESEARCH OBJECTIVES',AR:'أهداف البحث'};

  const INFO = {

    /* ───── CROPS ───── */
    'fraise': {
      status:['Culture active','Active crop','محصول نشط'],
      audio:['audio/fr/fraise.mp3','audio/en/fraise.mp3','audio/ar/fraise.mp3'],
      card:{ sections:[
        {title:secId, kind:'facts', items:[
          {i:'ti-seedling', k:Lk.espece, v:'Fragaria × ananassa'},
          {i:'ti-plant',    k:Lk.famille, v:{FR:'Rosacées',EN:'Rosaceae',AR:'الوردية'}},
          {i:'ti-droplet',  k:Lk.systeme, v:{FR:'Hydroponie hors-sol',EN:'Soilless hydroponics',AR:'زراعة مائية بدون تربة'}},
        ]},
        {title:secOpt, kind:'facts', items:[
          {i:'ti-temperature', k:Lk.temp,  v:'18 – 22 °C'},
          {i:'ti-droplet',     k:Lk.hum,   v:'60 – 75 %'},
          {i:'ti-flask',       k:Lk.ph,    v:'5.8 – 6.2'},
          {i:'ti-bolt',        k:Lk.ec,    v:'1.0 – 1.4 mS/cm'},
          {i:'ti-sun',         k:Lk.photo, v:'12 – 16 h'},
        ]},
        {title:secCult, kind:'grid', items:[
          {i:'ti-droplet', FR:'Cultivée en gouttières surélevées, solution nutritive recyclée.', EN:'Grown in raised gutters with recirculated nutrient solution.', AR:'تُزرع في مزاريب مرتفعة مع إعادة تدوير المحلول الغذائي.'},
          {i:'ti-grain',   FR:'Substrat inerte (fibre de coco ou perlite) pour le drainage.', EN:'Inert substrate (coco coir or perlite) for drainage.', AR:'ركيزة خاملة (ألياف جوز الهند أو البرليت) للتصريف.'},
          {i:'ti-clock',   FR:'Irrigation par cycles courts, pH et EC ajustés en continu.', EN:'Short irrigation cycles, pH and EC continuously adjusted.', AR:'ري بدورات قصيرة، ضبط pH وEC باستمرار.'},
          {i:'ti-leaf',    FR:'Fructification continue, sensible à l\u2019oïdium et au Botrytis.', EN:'Continuous fruiting, sensitive to powdery mildew and Botrytis.', AR:'إثمار مستمر، حساس للبياض الدقيقي والبوتريتيس.'},
        ]},
        {title:secMon, kind:'chips', items:[Mt,Mh,Mph,Mec], note:monitorNote},
      ]},
    },

    'courgette': {
      status:['Culture active','Active crop','محصول نشط'],
      audio:['audio/fr/courgette.mp3','audio/en/courgette.mp3','audio/ar/courgette.mp3'],
      card:{ sections:[
        {title:secId, kind:'facts', items:[
          {i:'ti-seedling', k:Lk.espece,  v:'Cucurbita pepo'},
          {i:'ti-plant',    k:Lk.famille, v:{FR:'Cucurbitacées',EN:'Cucurbitaceae',AR:'القرعية'}},
          {i:'ti-stack',    k:Lk.systeme, v:{FR:'Sol ou substrat',EN:'Soil or substrate',AR:'تربة أو ركيزة'}},
        ]},
        {title:secOpt, kind:'facts', items:[
          {i:'ti-temperature',      k:Lk.tempJ, v:'22 – 28 °C'},
          {i:'ti-temperature-minus',k:Lk.tempN, v:'15 – 18 °C'},
          {i:'ti-droplet',          k:Lk.hum,   v:'60 – 70 %'},
          {i:'ti-sun',              k:Lk.light, v:{FR:'Plein soleil',EN:'Full sun',AR:'شمس كاملة'}},
        ]},
        {title:{FR:'RECHERCHE EN COURS',EN:'ONGOING RESEARCH',AR:'البحث الجاري'}, kind:'grid', items:[
          {i:'ti-droplet',  FR:'Évaluation de l\u2019efficacité de l\u2019eau magnétisée et du gypse agricole comme approches de gestion du stress salin sur la culture de la courgette (Cucurbita pepo L.).',EN:'Evaluation of magnetised water and agricultural gypsum as salt-stress management approaches on zucchini (Cucurbita pepo L.).',AR:'تقييم فعالية الماء الممغنط والجبس الزراعي كمقاربتين لإدارة الإجهاد الملحي على الكوسة (Cucurbita pepo L.).'},
          {i:'ti-test-pipe',FR:'Analyse de l\u2019impact du traitement magnétique de l\u2019eau d\u2019irrigation sur la tolérance à la salinité et de l\u2019effet du gypse sur les propriétés physico-chimiques du sol soumis à des conditions salines.',EN:'Analysis of the impact of magnetic water treatment on salinity tolerance and of gypsum on the physico-chemical properties of soil under saline conditions.',AR:'تحليل تأثير المعالجة المغناطيسية لمياه الري على تحمّل الملوحة وتأثير الجبس على الخصائص الفيزيوكيميائية للتربة في ظروف ملحية.'},
          {i:'ti-chart-bar',FR:'Quantification des effets individuels et combinés sur la qualité de l\u2019eau, les caractéristiques du sol, la croissance et le développement des plantes ainsi que sur les performances agronomiques et productives de la culture.',EN:'Quantification of individual and combined effects on water quality, soil properties, plant growth and development, and the agronomic and productive performance of the crop.',AR:'قياس التأثيرات الفردية والمدمجة على جودة المياه وخصائص التربة ونمو النباتات وتطورها والأداء الزراعي والإنتاجي للمحصول.'},
        ]},
        {title:secMon, kind:'chips', items:[Mt,Mh], note:monitorNote},
      ]},
    },

    'avocatier': {
      status:['Spécimen en observation','Specimen under observation','عينة قيد المراقبة'],
      audio:['audio/fr/avocatier.mp3','audio/en/avocatier.mp3','audio/ar/avocatier.mp3'],
      card:{ sections:[
        {title:secId, kind:'facts', items:[
          {i:'ti-seedling', k:Lk.espece,  v:'Persea americana'},
          {i:'ti-plant',    k:Lk.famille, v:{FR:'Lauracées',EN:'Lauraceae',AR:'الغارية'}},
          {i:'ti-map-pin',  k:Lk.origine, v:{FR:'Mésoamérique',EN:'Mesoamerica',AR:'أمريكا الوسطى'}},
        ]},
        {title:secOpt, kind:'facts', items:[
          {i:'ti-temperature', k:Lk.temp,  v:'18 – 30 °C'},
          {i:'ti-droplet',     k:Lk.hum,   v:'60 – 75 %'},
          {i:'ti-sun',         k:Lk.light, v:{FR:'Plein soleil à mi-ombre',EN:'Full sun to part shade',AR:'شمس كاملة إلى ظل جزئي'}},
          {i:'ti-stack',       k:Lk.sol,   v:{FR:'Bien drainé, pH 6–7',EN:'Well-drained, pH 6–7',AR:'جيد التصريف، pH 6–7'}},
        ]},
        {title:secDis, kind:'bullets', items:[
          {FR:'Cercosporose : taches nécrotiques foliaires (Cercospora sp.).', EN:'Cercospora leaf spot: necrotic leaf lesions (Cercospora sp.).', AR:'تبقع سركوسبورا: آفات نخرية على الأوراق (Cercospora sp.).'},
          {FR:'Pourriture racinaire à Phytophthora cinnamomi.', EN:'Root rot caused by Phytophthora cinnamomi.', AR:'تعفن الجذور بفعل Phytophthora cinnamomi.'},
          {FR:'Évaluation de la résistance variétale aux pathogènes.', EN:'Assessment of varietal resistance to pathogens.', AR:'تقييم مقاومة الأصناف لمسببات الأمراض.'},
        ]},
      ]},
    },

    'plante x': {
      status:['Espèce à confirmer','Species to confirm','النوع قيد التأكيد'],
      audio:null,
      card:{
        pending:{FR:'Spécimen non encore identifié — fiche à compléter par l\u2019unité.',EN:'Specimen not yet identified — record to be completed by the unit.',AR:'العينة لم تُعرَّف بعد — البطاقة قيد الاستكمال من الوحدة.'},
        sections:[
          {title:secId, kind:'facts', items:[
            {i:'ti-seedling', k:Lk.espece,  v:{FR:'à confirmer',EN:'to confirm',AR:'قيد التأكيد'}, flag:true},
            {i:'ti-plant',    k:Lk.famille, v:{FR:'à confirmer',EN:'to confirm',AR:'قيد التأكيد'}, flag:true},
            {i:'ti-flag',     k:Lk.statut,  v:{FR:'En cours d\u2019identification',EN:'Being identified',AR:'قيد التعريف'}},
          ]},
        ],
      },
    },

    /* ───── PLANT PATHOLOGY ───── */
    'cactus malade': {
      status:['Sujet malade en étude','Diseased specimen under study','عينة مريضة قيد الدراسة'],
      audio:['audio/fr/cactus.mp3','audio/en/cactus.mp3','audio/ar/cactus.mp3'],
      card:{ sections:[
        {title:secId, kind:'facts', items:[
          {i:'ti-plant',   k:Lk.famille, v:{FR:'Cactacées',EN:'Cactaceae',AR:'الصباريات'}},
          {i:'ti-map-pin', k:Lk.origine, v:{FR:'Amérique tropicale',EN:'Tropical America',AR:'أمريكا الاستوائية'}},
          {i:'ti-flag',    k:Lk.statut,  v:{FR:'Sujet malade',EN:'Diseased',AR:'مريض'}},
        ]},
        {title:{FR:'PATHOLOGIES OBSERVÉES',EN:'OBSERVED PATHOLOGIES',AR:'الأمراض الملاحظة'}, kind:'bullets', items:[
          {FR:'Pourriture molle ou sèche des cladodes — agents fongiques ou bactériens.', EN:'Soft or dry rot of cladodes — fungal or bacterial agents.', AR:'تعفن طري أو جاف للسيقان — عوامل فطرية أو بكتيرية.'},
          {FR:'Cochenilles farineuses et à carapace — infestations fréquentes en serre.', EN:'Mealybugs and scale insects — common greenhouse infestations.', AR:'البق الدقيقي والحشرات القشرية — إصابات شائعة في الدفيئة.'},
          {FR:'Chlorose des aréoles — carence ou infection possible.', EN:'Areole chlorosis — possible deficiency or infection.', AR:'اصفرار الهالات — نقص أو عدوى محتملة.'},
        ]},
        {title:secProto, kind:'facts', items:[
          {i:'ti-lock',    k:Lk.isolement,  v:{FR:'Zone quarantaine',EN:'Quarantine zone',AR:'منطقة حجر'}},
          {i:'ti-flask',   k:Lk.traitement, v:{FR:'En évaluation',EN:'Under evaluation',AR:'قيد التقييم'}},
          {i:'ti-clock',   k:Lk.suivi,      v:{FR:'Hebdomadaire',EN:'Weekly',AR:'أسبوعي'}},
        ]},
      ]},
    },

    'tomate malade': {
      status:['Étude phytopathologique','Plant pathology study','دراسة أمراض النبات'],
      audio:['audio/fr/tomate.mp3','audio/en/tomate.mp3','audio/ar/tomate.mp3'],
      card:{ sections:[
        {title:secId, kind:'facts', items:[
          {i:'ti-seedling', k:Lk.espece,  v:'Solanum lycopersicum'},
          {i:'ti-plant',    k:Lk.famille, v:{FR:'Solanacées',EN:'Solanaceae',AR:'الباذنجانية'}},
          {i:'ti-flag',     k:Lk.statut,  v:{FR:'Plants malades',EN:'Diseased plants',AR:'نباتات مريضة'}},
        ]},
        {title:secDis, kind:'bullets', items:[
          {FR:'Mildiou (Phytophthora infestans) — taches huileuses puis nécroses.', EN:'Late blight (Phytophthora infestans) — oily lesions then necrosis.', AR:'اللفحة المتأخرة (Phytophthora infestans) — بقع زيتية ثم نخر.'},
          {FR:'Pourriture grise (Botrytis cinerea) sur tiges, feuilles et fruits.', EN:'Grey mould (Botrytis cinerea) on stems, leaves and fruit.', AR:'العفن الرمادي (Botrytis cinerea) على السيقان والأوراق والثمار.'},
          {FR:'Viroses : mosaïque (ToMV) et feuilles jaunes en cuillère (TYLCV).', EN:'Viruses: mosaic (ToMV) and yellow leaf curl (TYLCV).', AR:'فيروسات: الموزاييك (ToMV) وتجعد واصفرار الأوراق (TYLCV).'},
          {FR:'Alternariose (Alternaria solani) — taches concentriques.', EN:'Early blight (Alternaria solani) — concentric spots.', AR:'اللفحة المبكرة (Alternaria solani) — بقع متحدة المركز.'},
        ]},
        {title:secObj, kind:'facts', items:[
          {i:'ti-microscope', k:Lk.etude,       v:{FR:'Épidémiologie',EN:'Epidemiology',AR:'علم الأوبئة'}},
          {i:'ti-test-pipe',  k:Lk.methode,     v:{FR:'Inoculation contrôlée',EN:'Controlled inoculation',AR:'تلقيح محكوم'}},
          {i:'ti-shield',     k:Lk.application, v:{FR:'Lutte intégrée',EN:'Integrated pest management',AR:'المكافحة المتكاملة'}},
        ]},
      ]},
    },

    'blé malade': {
      status:['Céréale en observation','Cereal under observation','حبوب قيد المراقبة'],
      audio:['audio/fr/ble.mp3','audio/en/ble.mp3','audio/ar/ble.mp3'],
      card:{ sections:[
        {title:secId, kind:'facts', items:[
          {i:'ti-seedling', k:Lk.espece,  v:'Triticum aestivum'},
          {i:'ti-plant',    k:Lk.famille, v:{FR:'Poacées',EN:'Poaceae',AR:'النجيلية'}},
          {i:'ti-flag',     k:Lk.statut,  v:{FR:'Plants en étude',EN:'Plants under study',AR:'نباتات قيد الدراسة'}},
        ]},
        {title:secDis, kind:'bullets', items:[
          {FR:'Rouilles (Puccinia spp.) — pustules orangées à brunes sur feuilles.', EN:'Rusts (Puccinia spp.) — orange to brown pustules on leaves.', AR:'الأصداء (Puccinia spp.) — بثرات برتقالية إلى بنية على الأوراق.'},
          {FR:'Septoriose (Zymoseptoria tritici) — taches nécrotiques à pycnides.', EN:'Septoria leaf blotch (Zymoseptoria tritici) — necrotic lesions with pycnidia.', AR:'تبقع الأوراق السبتوري (Zymoseptoria tritici) — آفات نخرية مع بكنيدات.'},
          {FR:'Fusariose de l\u2019épi (Fusarium spp.) — risque de mycotoxines.', EN:'Fusarium head blight (Fusarium spp.) — mycotoxin risk.', AR:'لفحة السنابل (Fusarium spp.) — خطر السموم الفطرية.'},
          {FR:'Oïdium (Blumeria graminis) — feutrage blanc poudreux.', EN:'Powdery mildew (Blumeria graminis) — white powdery growth.', AR:'البياض الدقيقي (Blumeria graminis) — نمو أبيض مسحوقي.'},
        ]},
        {title:secObj, kind:'facts', items:[
          {i:'ti-microscope', k:Lk.etude,       v:{FR:'Résistance variétale',EN:'Varietal resistance',AR:'مقاومة الأصناف'}},
          {i:'ti-test-pipe',  k:Lk.methode,     v:{FR:'Notation au champ',EN:'Field scoring',AR:'تقييم حقلي'}},
          {i:'ti-shield',     k:Lk.application, v:{FR:'Sélection variétale',EN:'Plant breeding',AR:'تربية الأصناف'}},
        ]},
      ]},
    },
  };

  // category labels
  addCat('fraise', ...CAT_CROP);
  addCat('courgette', ...CAT_CROP);
  addCat('avocatier', ...CAT_CROP);
  addCat('avocat', ...CAT_CROP);
  addCat('plante x', ...CAT_CROP);
  addCat('cactus malade', ...CAT_PATH);
  addCat('tomate malade', ...CAT_PATH);
  addCat('tomate malades', ...CAT_PATH);
  addCat('tomates malades', ...CAT_PATH);
  addCat('blé malade', ...CAT_PATH);
  addCat('ble malade', ...CAT_PATH);

  // localized hero titles (keep existing FR title; add EN/AR)
  const TITLES = {
    'fraise':        ['Fraise — Fragaria × ananassa','Strawberry — Fragaria × ananassa','الفراولة — Fragaria × ananassa'],
    'courgette':     ['Courgette — Cucurbita pepo','Zucchini — Cucurbita pepo','الكوسة — Cucurbita pepo'],
    'avocatier':     ['Avocatier — Persea americana','Avocado — Persea americana','الأفوكادو — Persea americana'],
    'plante x':      ['Spécimen — à identifier','Specimen — to identify','عينة — قيد التعريف'],
    'cactus malade': ['Cactus — spécimen pathologique','Cactus — diseased specimen','صبار — عينة مريضة'],
    'tomate malade': ['Tomate — étude phytopathologique','Tomato — plant pathology study','الطماطم — دراسة أمراض النبات'],
    'blé malade':    ['Blé — étude phytopathologique','Wheat — plant pathology study','القمح — دراسة أمراض النبات'],
  };

  function applyOne(key, content){
    const d = AR_CONTENT[key];
    if(!d){ console.warn('[info] def missing:', key); return; }
    d.type = 'info';
    d.tabs = ['Info'];
    d.stateKey = null;
    d.card = content.card;
    d.audio = content.audio ? {FR:content.audio[0],EN:content.audio[1],AR:content.audio[2]} : null;
    d.statusText    = content.status[0];
    d.statusText_en = content.status[1];
    d.statusText_ar = content.status[2];
    const tt = TITLES[key];
    if(tt){ d.title = tt[0]; d.title_en = tt[1]; d.title_ar = tt[2]; }
  }

  Object.keys(INFO).forEach(k => applyOne(k, INFO[k]));

  // alias spellings used by different viewers → same content
  const ALIAS = { 'avocat':'avocatier', 'tomate malades':'tomate malade', 'tomates malades':'tomate malade', 'ble malade':'blé malade' };
  Object.keys(ALIAS).forEach(k => {
    const src = INFO[ALIAS[k]];
    if(src) applyOne(k, src);
    // alias keeps its own title if the canonical one differs only by spelling
    const tt = TITLES[ALIAS[k]];
    if(tt && AR_CONTENT[k]){ AR_CONTENT[k].title = tt[0]; AR_CONTENT[k].title_en = tt[1]; AR_CONTENT[k].title_ar = tt[2]; }
  });
})();


Object.assign(EQ_ICONS, {
'ti-dna':'<path d="M7 4c0 4 10 5.5 10 8s-10 4-10 8"/><path d="M17 4c0 4-10 5.5-10 8s10 4 10 8"/><path d="M8.4 7h7.2M7.8 10.2h8.4M7.8 13.8h8.4M8.4 17h7.2"/>',
'ti-users':'<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.5"/><path d="M18.5 19.5a5.5 5.5 0 0 0-3-4.7"/>',
'ti-presentation':'<rect x="3" y="4" width="18" height="11" rx="1.5"/><path d="M12 15v4M9.5 21l2.5-2 2.5 2"/>',
'ti-building':'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-3h4v3"/>',
});

/* INFO2_START — units, technical rooms & misc (Pass 2) */
(function augmentInfoDefs2(){
  if(typeof AR_CONTENT === 'undefined') return;
  const TC = {FR:'à confirmer',EN:'to confirm',AR:'قيد التأكيد'};
  const addCat = (k,fr,en,ar)=>{ if(typeof T==='undefined')return; if(T.FR&&T.FR.catMap)T.FR.catMap[k]=fr; if(T.EN&&T.EN.catMap)T.EN.catMap[k]=en; if(T.AR&&T.AR.catMap)T.AR.catMap[k]=ar; };
  const mNote = {FR:'Suivi via les capteurs IoT — valeurs en direct dans la carte Capteurs.',EN:'Monitored via the IoT sensors — live values in the Capteurs card.',AR:'تتم المراقبة عبر مستشعرات IoT — القيم المباشرة في بطاقة المستشعرات.'};
  const Mt={FR:'Température',EN:'Temperature',AR:'الحرارة'},Mh={FR:'Humidité',EN:'Humidity',AR:'الرطوبة'},Mph={FR:'pH',EN:'pH',AR:'pH'},Mec={FR:'EC',EN:'EC',AR:'EC'};
  const S = {
    mission:{FR:'MISSION',EN:'MISSION',AR:'المهمة'}, info:{FR:'INFORMATIONS',EN:'INFORMATION',AR:'معلومات'},
    fonc:{FR:'FONCTIONS',EN:'FUNCTIONS',AR:'الوظائف'}, equip:{FR:'ÉQUIPEMENTS',EN:'EQUIPMENT',AR:'التجهيزات'},
    param:{FR:'PARAMÈTRES',EN:'PARAMETERS',AR:'المعايير'}, compo:{FR:'COMPOSANTS',EN:'COMPONENTS',AR:'المكونات'},
    struct:{FR:'STRUCTURE',EN:'STRUCTURE',AR:'البنية'}, unites:{FR:'UNITÉS',EN:'UNITS',AR:'الوحدات'},
    feat:{FR:'FONCTIONNALITÉS',EN:'FEATURES',AR:'الميزات'}, infra:{FR:'INFRASTRUCTURE',EN:'INFRASTRUCTURE',AR:'البنية التحتية'},
  };
  const Lacces={FR:'Accès',EN:'Access',AR:'الدخول'}, Lcode={FR:'Code serre',EN:'Greenhouse code',AR:'رمز الدفيئة'},
        Lsurf={FR:'Surface',EN:'Area',AR:'المساحة'}, Lcult={FR:'Cultures',EN:'Crops',AR:'المحاصيل'},
        Lstaff={FR:'Étudiants & personnel',EN:'Students & staff',AR:'الطلبة والموظفون'};

  const INFO2 = {
    /* ───── UNITS ───── */
    'unité génétique et amélioration des plantes': { status:['Recherche active','Active research','بحث نشط'], card:{sections:[
      {title:S.mission, kind:'grid', items:[
        {i:'ti-dna',       FR:'Sélection variétale, croisements et évaluation des performances agronomiques.',EN:'Varietal selection, crossbreeding and agronomic performance evaluation.',AR:'الانتخاب الصنفي والتهجين وتقييم الأداء الزراعي.'},
        {i:'ti-microscope',FR:'Étude des caractères de résistance, de qualité et de rendement.',EN:'Study of resistance, quality and yield traits.',AR:'دراسة صفات المقاومة والجودة والإنتاجية.'},
        {i:'ti-seedling',  FR:'Production de lignées améliorées destinées à l\u2019expérimentation.',EN:'Production of improved lines for experimentation.',AR:'إنتاج سلالات محسّنة مخصّصة للتجارب.'},
      ]},
      {title:S.info, kind:'facts', items:[
        {i:'ti-flag',k:Lcode,v:'S01'},
        {i:'ti-arrows-maximize',k:Lsurf,v:TC,flag:true},
        {i:'ti-plant',k:Lcult,v:{FR:'Espèces améliorées',EN:'Improved species',AR:'أنواع محسّنة'}},
        {i:'ti-lock',k:Lacces,v:{FR:'Personnel autorisé',EN:'Authorized staff',AR:'موظفون مخوّلون'}},
      ]},
      {title:{FR:'SUIVI EN TEMPS RÉEL',EN:'REAL-TIME MONITORING',AR:'المراقبة الفورية'}, kind:'chips', items:[Mt,Mh], note:mNote},
    ]}},

    'unité horticulture': { status:['Recherche active','Active research','بحث نشط'], card:{sections:[
      {title:S.mission, kind:'grid', items:[
        {i:'ti-flower',    FR:'Plateforme pédagogique, expérimentale et de recherche dédiée à la production horticole sous environnement contrôlé, conduisant des essais scientifiques et la formation pratique des étudiants.',EN:'A pedagogical, experimental and research platform dedicated to horticultural production under a controlled environment, conducting scientific trials and hands-on student training.',AR:'منصة تعليمية وتجريبية وبحثية مخصصة للإنتاج البستاني في بيئة مضبوطة، تُجري تجارب علمية وتدريباً عملياً للطلبة.'},
        {i:'ti-microscope',FR:'Développement de projets de recherche appliquée dans les domaines du maraîchage, de l\u2019horticulture, de la gestion de l\u2019eau, de la nutrition des cultures et du stress biotique et abiotique.',EN:'Development of applied research projects in market gardening, horticulture, water management, crop nutrition and biotic and abiotic stress.',AR:'تطوير مشاريع البحث التطبيقي في مجالات البستنة الخضراء والحضرية وإدارة المياه وتغذية المحاصيل والإجهاد الحيوي وغير الحيوي.'},
        {i:'ti-settings',  FR:'Infrastructure équipée de systèmes avancés de contrôle climatique et de fertigation pour étudier la réponse des plantes à leur milieu et mettre au point des itinéraires techniques économes en ressources.',EN:'Infrastructure equipped with advanced climate-control and fertigation systems to study plant responses and develop resource-efficient technical crop management pathways.',AR:'بنية تحتية مزوّدة بأنظمة متقدمة للتحكم المناخي والتسميد بالري لدراسة استجابة النباتات ووضع مسارات تقنية موفِّرة للموارد.'},
      ]},
      {title:S.info, kind:'facts', items:[
        {i:'ti-flag',k:Lcode,v:'S02'},
        {i:'ti-arrows-maximize',k:Lsurf,v:TC,flag:true},
        {i:'ti-plant',k:Lcult,v:{FR:'Maraîchage & horticulture',EN:'Market gardening & horticulture',AR:'بستنة وخضروات'}},
        {i:'ti-lock',k:Lacces,v:Lstaff},
      ]},
      {title:{FR:'SUIVI EN TEMPS RÉEL',EN:'REAL-TIME MONITORING',AR:'المراقبة الفورية'}, kind:'chips', items:[Mt,Mh], note:mNote},
    ]}},

    'unité agronomie': { status:['Recherche active','Active research','بحث نشط'], card:{sections:[
      {title:S.mission, kind:'grid', items:[
        {i:'ti-grain',    FR:'Expérimentation sur les grandes cultures et les systèmes de production.',EN:'Trials on field crops and production systems.',AR:'تجارب على المحاصيل الحقلية وأنظمة الإنتاج.'},
        {i:'ti-seedling', FR:'Évaluation de nouvelles variétés céréalières et de légumineuses.',EN:'Evaluation of new cereal and legume varieties.',AR:'تقييم أصناف جديدة من الحبوب والبقوليات.'},
        {i:'ti-test-pipe',FR:'Optimisation des itinéraires techniques et de la fertilisation.',EN:'Optimisation of crop management and fertilisation.',AR:'تحسين المسارات التقنية والتسميد.'},
      ]},
      {title:S.info, kind:'facts', items:[
        {i:'ti-flag',k:Lcode,v:'S03'},
        {i:'ti-arrows-maximize',k:Lsurf,v:TC,flag:true},
        {i:'ti-plant',k:Lcult,v:{FR:'Grandes cultures',EN:'Field crops',AR:'محاصيل حقلية'}},
        {i:'ti-lock',k:Lacces,v:Lstaff},
      ]},
      {title:{FR:'SUIVI EN TEMPS RÉEL',EN:'REAL-TIME MONITORING',AR:'المراقبة الفورية'}, kind:'chips', items:[Mt,Mh], note:mNote},
    ]}},

    'unité protection des plantes': { status:['Recherche active','Active research','بحث نشط'], card:{sections:[
      {title:S.mission, kind:'grid', items:[
        {i:'ti-virus',     FR:'Étude des maladies, ravageurs et adventices affectant les cultures.',EN:'Study of diseases, pests and weeds affecting crops.',AR:'دراسة الأمراض والآفات والأعشاب الضارة بالمحاصيل.'},
        {i:'ti-shield',    FR:'Développement de méthodes de lutte biologique et intégrée.',EN:'Development of biological and integrated control methods.',AR:'تطوير أساليب المكافحة الحيوية والمتكاملة.'},
        {i:'ti-microscope',FR:'Diagnostic phytosanitaire et conservation de plantes malades pour la recherche.',EN:'Phytosanitary diagnosis and conservation of diseased plants for research.',AR:'التشخيص الوقائي وحفظ النباتات المريضة للبحث.'},
      ]},
      {title:S.info, kind:'facts', items:[
        {i:'ti-flag',k:Lcode,v:'S05'},
        {i:'ti-arrows-maximize',k:Lsurf,v:TC,flag:true},
        {i:'ti-target',k:{FR:'Spécialité',EN:'Specialty',AR:'التخصص'},v:{FR:'Phytopathologie & entomologie',EN:'Plant pathology & entomology',AR:'أمراض النبات والحشرات'}},
        {i:'ti-lock',k:Lacces,v:Lstaff},
      ]},
      {title:{FR:'SUIVI EN TEMPS RÉEL',EN:'REAL-TIME MONITORING',AR:'المراقبة الفورية'}, kind:'chips', items:[Mt,Mh], note:mNote},
    ]}},

    'unité hydroponie': { status:['Recherche active','Active research','بحث نشط'], card:{sections:[
      {title:S.mission, kind:'grid', items:[
        {i:'ti-droplet', FR:'Culture hors-sol avec solution nutritive recirculante (NFT, DWC).',EN:'Soilless culture with recirculating nutrient solution (NFT, DWC).',AR:'زراعة بدون تربة مع محلول مغذٍّ مُعاد التدوير (NFT، DWC).'},
        {i:'ti-seedling',FR:'Expérimentation sur la production de légumes et de petits fruits.',EN:'Trials on vegetable and small-fruit production.',AR:'تجارب على إنتاج الخضروات والفواكه الصغيرة.'},
        {i:'ti-gauge',   FR:'Monitoring IoT en temps réel : pH, EC, température et niveau.',EN:'Real-time IoT monitoring: pH, EC, temperature and level.',AR:'مراقبة IoT آنية: pH وEC والحرارة والمستوى.'},
      ]},
      {title:S.info, kind:'facts', items:[
        {i:'ti-flag',k:Lcode,v:'S04'},
        {i:'ti-settings',k:{FR:'Système',EN:'System',AR:'النظام'},v:'NFT / DWC'},
        {i:'ti-cpu',k:{FR:'Monitoring',EN:'Monitoring',AR:'المراقبة'},v:'Guardian Pro IoT'},
        {i:'ti-lock',k:Lacces,v:Lstaff},
      ]},
      {title:{FR:'SUIVI EN TEMPS RÉEL',EN:'REAL-TIME MONITORING',AR:'المراقبة الفورية'}, kind:'chips', items:[Mt,Mh,Mph,Mec], note:mNote},
    ]}},

    /* ───── TECHNICAL ROOMS ───── */
    'salle technique de commandes': { status:['Supervision 24/7','24/7 supervision','إشراف على مدار الساعة'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-cpu',         FR:'Centre de pilotage de la serre : données relevées en continu par les capteurs et la station météo centralisées et visualisées.',EN:'Greenhouse control centre: data collected continuously by sensors and the weather station, centralised and visualised.',AR:'مركز قيادة الدفيئة: البيانات التي تجمعها أجهزة الاستشعار ومحطة الأرصاد الجوية باستمرار مُجمَّعة ومُتاحة للعرض.'},
        {i:'ti-adjustments', FR:'Suivi et ajustement des équipements de régulation : ventilation, chauffage, refroidissement et brumisation.',EN:'Monitoring and adjustment of regulation equipment: ventilation, heating, cooling and misting.',AR:'متابعة وضبط تجهيزات التنظيم: التهوية والتدفئة والتبريد والرذاذ.'},
        {i:'ti-leaf',        FR:'Supervision de l’éclairage, de l’injection de CO₂ et de la fertigation depuis ce point central.',EN:'Supervision of lighting, CO₂ injection and fertigation from this central point.',AR:'الإشراف على الإضاءة وحقن ثاني أكسيد الكربون والتسميد بالري من هذا المركز.'},
      ]},
    ]}},

    'salle de lavage': { status:['Local technique','Technical room','مرفق تقني'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-droplets',     FR:'Lavage et désinfection du matériel de culture \u2014 pots, plateaux, outils et équipements \u2014 ainsi que, le cas échéant, les récoltes.',EN:'Washing and disinfecting growing equipment \u2014 pots, trays, tools and supplies \u2014 and harvests when applicable.',AR:'غسل وتعقيم مواد الزراعة \u2014 أواني وأدراج وأدوات وتجهيزات \u2014 وكذلك المحاصيل عند الاقتضاء.'},
        {i:'ti-shield-check', FR:'Propreté rigoureuse limitant les contaminations croisées, rôle essentiel dans la prévention sanitaire des cultures.',EN:'Rigorous cleanliness limits cross-contamination and plays an essential role in crop health prevention.',AR:'النظافة الدقيقة تحدّ من التلوث المتبادل وتؤدي دوراً أساسياً في الوقاية الصحية للمزروعات.'},
        {i:'ti-seedling',     FR:'Travaux préparatoires en amont de la mise en culture : semis, repiquage, conditionnement des substrats, préparation des plants et des échantillons avant transfert en serre.',EN:'Upstream preparatory work: sowing, pricking out, substrate conditioning, and preparation of plants and samples before transfer to the greenhouse.',AR:'أعمال تحضيرية سابقة للزراعة: بذر وشتل وتهيئة الركائز وإعداد الشتلات والعينات قبل النقل إلى الدفيئة.'},
      ]},
    ]}},

    'salle de préparation': { status:['Local technique','Technical room','مرفق تقني'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-flask',     FR:'La salle fait office de laboratoire de l\u2019unité : réalisation des manipulations de base et des opérations sophistiquées exigeant des conditions contrôlées, dont la culture in vitro.',EN:'The room serves as the unit laboratory: performing basic procedures and sophisticated operations requiring controlled conditions, including in-vitro culture.',AR:'تعمل الغرفة مختبراً للوحدة: إجراء التحضيرات الأساسية والعمليات الدقيقة التي تستلزم ظروفاً مضبوطة، بما فيها الزراعة في المختبر.'},
        {i:'ti-test-pipe', FR:'Siège des analyses requises pour le suivi des cultures et des essais expérimentaux.',EN:'The site for analyses required to monitor crops and experimental trials.',AR:'مقر التحاليل اللازمة لمتابعة المزروعات والتجارب.'},
        {i:'ti-microscope',FR:'Offre l\u2019environnement maîtrisé nécessaire aux préparations délicates et à la production des données scientifiques sur lesquelles s\u2019appuie le travail expérimental.',EN:'Provides the controlled environment needed for delicate preparations and the production of scientific data underpinning experimental work.',AR:'يوفر البيئة المضبوطة اللازمة للتحضيرات الدقيقة وإنتاج البيانات العلمية التي يرتكز عليها العمل التجريبي.'},
      ]},
    ]}},

    'salle de réunion': { status:['Espace commun','Common space','فضاء مشترك'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-users',       FR:'Espace de coordination et d\u2019échange : réunions de travail, encadrement et débriefings pédagogiques.',EN:'Space for coordination and exchange: work meetings, supervision and educational debriefs.',AR:'فضاء للتنسيق والتبادل: اجتماعات العمل والإشراف والإحاطات التعليمية.'},
        {i:'ti-presentation',FR:'Présentation des projets de recherche.',EN:'Presentation of research projects.',AR:'عرض مشاريع البحث.'},
        {i:'ti-world',       FR:'Réception des partenaires nationaux et internationaux.',EN:'Reception of national and international partners.',AR:'استقبال الشركاء الوطنيين والدوليين.'},
      ]},
    ]}},

    'bloc gestion technique et administrative': { status:['Bâtiment permanent','Permanent building','مبنى دائم'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-building',FR:'Centralise la gestion administrative et logistique du site.',EN:'Centralises site administration and logistics.',AR:'تُركّز التدبير الإداري واللوجستي للموقع.'},
        {i:'ti-stack',   FR:'Regroupe salles de réunion, salle de contrôle et locaux techniques.',EN:'Houses meeting rooms, the control room and technical premises.',AR:'يضم قاعات الاجتماعات وغرفة التحكم والمرافق التقنية.'},
      ]},
      {title:S.info, kind:'facts', items:[
        {i:'ti-building',k:{FR:'Type',EN:'Type',AR:'النوع'},v:{FR:'Bâtiment permanent',EN:'Permanent building',AR:'مبنى دائم'}},
        {i:'ti-arrows-maximize',k:Lsurf,v:TC,flag:true},
        {i:'ti-stack',k:{FR:'Niveaux',EN:'Levels',AR:'الطوابق'},v:TC,flag:true},
        {i:'ti-map-pin',k:{FR:'Localisation',EN:'Location',AR:'الموقع'},v:{FR:'Entrée du campus',EN:'Campus entrance',AR:'مدخل الحرم'}},
      ]},
    ]}},

    /* ───── STRUCTURE / MISC ───── */
    'serre': { status:['5 unités spécialisées','5 specialised units','5 وحدات متخصصة'], card:{sections:[
      {title:S.struct, kind:'grid', items:[
        {i:'ti-window',FR:'Construction en verre et aluminium à toiture en arc, maximisant la luminosité.',EN:'Glass-and-aluminium structure with arched roof, maximising daylight.',AR:'هيكل من الزجاج والألمنيوم بسقف مقوّس يعظّم الإضاءة الطبيعية.'},
        {i:'ti-stack', FR:'Cinq unités spécialisées reliées par un couloir central.',EN:'Five specialised units linked by a central corridor.',AR:'خمس وحدات متخصصة مرتبطة بممر مركزي.'},
        {i:'ti-gauge', FR:'Climat et irrigation supervisés depuis la salle de contrôle.',EN:'Climate and irrigation supervised from the control room.',AR:'المناخ والري يُشرَف عليهما من غرفة التحكم.'},
      ]},
      {title:S.unites, kind:'facts', items:[
        {i:'ti-dna',    k:{FR:'S01',EN:'S01',AR:'S01'},v:{FR:'Génétique & Amélioration',EN:'Genetics & Breeding',AR:'الوراثة والتحسين'}},
        {i:'ti-flower', k:{FR:'S02',EN:'S02',AR:'S02'},v:{FR:'Horticulture',EN:'Horticulture',AR:'البستنة'}},
        {i:'ti-grain',  k:{FR:'S03',EN:'S03',AR:'S03'},v:{FR:'Agronomie',EN:'Agronomy',AR:'علوم الفلاحة'}},
        {i:'ti-droplet',k:{FR:'S04',EN:'S04',AR:'S04'},v:{FR:'Hydroponie',EN:'Hydroponics',AR:'الزراعة المائية'}},
        {i:'ti-shield', k:{FR:'S05',EN:'S05',AR:'S05'},v:{FR:'Protection des Plantes',EN:'Plant Protection',AR:'وقاية النباتات'}},
      ]},
    ]}},

    'monitoring': { status:['Temps réel','Real-time','آني'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-cpu',         FR:'Centre de pilotage de la serre : données relevées en continu par les capteurs et la station météo centralisées et visualisées.',EN:'The greenhouse control centre: data collected continuously by sensors and the weather station, centralised and visualised.',AR:'مركز قيادة الدفيئة: البيانات التي تجمعها أجهزة الاستشعار ومحطة الأرصاد الجوية باستمرار مُجمَّعة ومُتاحة للعرض.'},
        {i:'ti-adjustments', FR:'Suivi et ajustement des équipements de régulation : ventilation, chauffage, refroidissement et brumisation.',EN:'Monitoring and adjustment of regulation equipment: ventilation, heating, cooling and misting.',AR:'متابعة وضبط تجهيزات التنظيم: التهوية والتدفئة والتبريد والرذاذ.'},
        {i:'ti-leaf',        FR:'Supervision de l\u2019éclairage, de l\u2019injection de CO\u2082 et de la fertigation depuis ce point central.',EN:'Supervision of lighting, CO\u2082 injection and fertigation from this central point.',AR:'الإشراف على الإضاءة وحقن ثاني أكسيد الكربون والتسميد بالري من هذا المركز.'},
      ]},
    ]}},

    'station de fertigation': { status:['Automatisée','Automated','مؤتمتة'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-flask',       FR:'Préparation précise des solutions nutritives.',EN:'Precise preparation of nutrient solutions.',AR:'تحضير دقيق للمحاليل المغذية.'},
        {i:'ti-gauge',       FR:'Contrôle du pH et de la conductivité électrique (CE) de la solution nutritive.',EN:'Control of pH and electrical conductivity (EC) of the nutrient solution.',AR:'مراقبة درجة الحموضة والتوصيلية الكهربائية للمحلول المغذي.'},
        {i:'ti-adjustments', FR:'Ajustement des doses d\u2019engrais selon les besoins des cultures.',EN:'Adjustment of fertiliser doses to crop requirements.',AR:'ضبط جرعات الأسمدة وفق احتياجات المحاصيل.'},
        {i:'ti-list',        FR:'Gestion de plusieurs programmes de fertilisation.',EN:'Management of multiple fertilisation programmes.',AR:'إدارة برامج تسميد متعددة.'},
      ]},
      {title:{FR:'PRINCIPES',EN:'PRINCIPLES',AR:'المبادئ'}, kind:'grid', items:[
        {i:'ti-droplet',     FR:'La fertigation associe en un seul geste l\u2019irrigation et la nutrition par injection automatisée des fertilisants dans le réseau d\u2019irrigation.',EN:'Fertigation combines irrigation and nutrition in a single operation via automated injection of fertilisers into the irrigation network.',AR:'التسميد بالري يجمع الري والتغذية في عملية واحدة عبر الحقن التلقائي للأسمدة في شبكة الري.'},
        {i:'ti-bolt',        FR:'La CE renseigne sur la concentration totale en sels dissous ; le pH conditionne la disponibilité des éléments nutritifs \u2014 un pH mal maîtrisé peut bloquer l\u2019assimilation du fer, du phosphore ou d\u2019autres éléments.',EN:'EC reflects the total dissolved salt concentration; pH governs nutrient availability \u2014 poor pH control can block uptake of iron, phosphorus and other elements.',AR:'التوصيلية الكهربائية تعكس تركيز الأملاح الذائبة الكلية؛ ودرجة الحموضة تتحكم في توافر العناصر الغذائية \u2014 فسوء ضبطها قد يعيق امتصاص الحديد والفوسفور وغيرهما.'},
        {i:'ti-leaf',        FR:'Pilotage fin des macroéléments (azote, phosphore, potassium, calcium, magnésium, soufre) et des oligoéléments pour ajuster la nutrition au stade de la culture et optimiser l\u2019efficience de l\u2019eau et des intrants.',EN:'Fine-tuned management of macroelements (N, P, K, Ca, Mg, S) and microelements to match nutrition to the crop stage and optimise water and input efficiency.',AR:'ضبط دقيق للعناصر الكبرى (N, P, K, Ca, Mg, S) والعناصر الصغرى لمواءمة التغذية مع مرحلة المحصول وتحسين كفاءة الماء والمدخلات.'},
      ]},
    ]}},

    'chaudière': { status:['Automatique — T° < seuil','Automatic — temp. below threshold','تلقائي — حرارة تحت العتبة'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-temperature-plus',FR:'Chauffe l\u2019eau du circuit de fertigation et maintient sa temp\u00e9rature dans la plage optimale pour l\u2019absorption des nutriments par les racines.',EN:'Heats the water in the fertigation circuit and maintains its temperature in the optimal range for nutrient uptake by the roots.',AR:'\u064a\u064f\u0633\u062e\u0651\u0646 \u0645\u0627\u0621 \u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u0633\u0645\u064a\u062f \u0628\u0627\u0644\u0631\u064a \u0648\u064a\u062d\u0627\u0641\u0638 \u0639\u0644\u0649 \u062f\u0631\u062c\u0629 \u062d\u0631\u0627\u0631\u062a\u0647 \u0641\u064a \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0623\u0645\u062b\u0644.'},
        {i:'ti-droplet',         FR:'Alimente le syst\u00e8me de chauffage de la zone racinaire des tablettes mobiles \u2014 un substrat chaud stimule l\u2019activit\u00e9 racinaire et l\u2019absorption des min\u00e9raux.',EN:'Feeds the root-zone heating circuit of the mobile tables \u2014 a warm substrate stimulates root activity and mineral uptake.',AR:'\u064a\u063a\u0630\u0651\u064a \u062f\u0627\u0631\u0629 \u062a\u062f\u0641\u0626\u0629 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062c\u0630\u0631\u064a\u0629 \u0644\u0637\u0627\u0648\u0644\u0627\u062a \u0627\u0644\u0632\u0631\u0627\u0639\u0629 \u0627\u0644\u0645\u062a\u0646\u0642\u0644\u0629.'},
        {i:'ti-settings',        FR:'Fonctionne en mode automatique selon la temp\u00e9rature consigne du circuit d\u2019eau.',EN:'Operates automatically according to the water circuit set-point temperature.',AR:'\u064a\u0639\u0645\u0644 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 \u0648\u0641\u0642 \u062f\u0631\u062c\u0629 \u0627\u0644\u062d\u0631\u0627\u0631\u0629 \u0627\u0644\u0645\u0636\u0628\u0648\u0637\u0629 \u0644\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0621.'},
      ]},
    ]}},

    'audoucisseur': { status:['Traitement de l\u2019eau','Water treatment','معالجة المياه'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-droplet',FR:'Réduction de la dureté de l\u2019eau par échange ionique.',EN:'Reduces water hardness by ion exchange.',AR:'خفض عسر الماء بالتبادل الأيوني.'},
        {i:'ti-refresh',FR:'Régénération automatique de la résine au chlorure de sodium (NaCl).',EN:'Automatic resin regeneration with sodium chloride (NaCl).',AR:'تجديد تلقائي للراتنج بكلوريد الصوديوم (NaCl).'},
        {i:'ti-shield', FR:'Protège les circuits d\u2019irrigation et de fertigation du calcaire.',EN:'Protects the irrigation and fertigation lines from scale.',AR:'يحمي دارات الري والتسميد من الترسبات الكلسية.'},
      ]},
      {title:S.param, kind:'facts', items:[
        {i:'ti-settings',k:{FR:'Type',EN:'Type',AR:'النوع'},v:{FR:'Échangeur ionique',EN:'Ion exchanger',AR:'مبادل أيوني'}},
        {i:'ti-cylinder',k:{FR:'Capacité',EN:'Capacity',AR:'السعة'},v:TC,flag:true},
        {i:'ti-refresh',k:{FR:'Régénération',EN:'Regeneration',AR:'التجديد'},v:{FR:'NaCl — automatique',EN:'NaCl — automatic',AR:'NaCl — تلقائي'}},
        {i:'ti-droplet',k:{FR:'Dureté cible',EN:'Target hardness',AR:'العسر المستهدف'},v:'< 7 °f'},
      ]},
    ]}},

    /* ───── VENTILATION VARIANTS ───── */
    'système de ventilation': { status:['Hybride · automatique','Hybrid · automatic','هجين · تلقائي'], card:{sections:[
      {title:S.compo, kind:'grid', items:[
        {i:'ti-wind', FR:'Extracteurs mécaniques, fenêtres automatiques et rideaux thermiques.',EN:'Mechanical extractors, automatic vents and thermal screens.',AR:'شفاطات ميكانيكية ونوافذ تلقائية وستائر حرارية.'},
        {i:'ti-cpu',  FR:'Régulation centralisée par automates depuis la salle de contrôle.',EN:'Centralised PLC regulation from the control room.',AR:'تنظيم مركزي بالمتحكمات من غرفة التحكم.'},
        {i:'ti-gauge',FR:'Monitoring en temps réel de la température, de l\u2019humidité et du VPD.',EN:'Real-time monitoring of temperature, humidity and VPD.',AR:'مراقبة آنية للحرارة والرطوبة وVPD.'},
      ]},
      {title:S.param, kind:'facts', items:[
        {i:'ti-settings',k:{FR:'Type',EN:'Type',AR:'النوع'},v:{FR:'Hybride — mécanique + naturel',EN:'Hybrid — mechanical + natural',AR:'هجين — ميكانيكي + طبيعي'}},
        {i:'ti-cpu',k:{FR:'Contrôle',EN:'Control',AR:'التحكم'},v:{FR:'Automate PLC',EN:'PLC',AR:'متحكم PLC'}},
        {i:'ti-gauge',k:{FR:'Capteurs',EN:'Sensors',AR:'المستشعرات'},v:{FR:'T°, HR, VPD',EN:'T°, RH, VPD',AR:'حرارة، رطوبة، VPD'}},
        {i:'ti-cloud',k:{FR:'Protocole',EN:'Protocol',AR:'البروتوكول'},v:'Guardian Pro API'},
      ]},
      {title:{FR:'SUIVI EN TEMPS RÉEL',EN:'REAL-TIME MONITORING',AR:'المراقبة الفورية'}, kind:'chips', items:[Mt,Mh], note:mNote},
    ]}},

    'ventilation dehors': { status:['Extraction mécanique','Mechanical extraction','شفط ميكانيكي'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-wind', FR:'Complémente la ventilation zénithale naturelle des fenêtres automatiques.',EN:'Complements the natural roof ventilation from the automatic vents.',AR:'تكمّل التهوية العلوية الطبيعية للنوافذ التلقائية.'},
        {i:'ti-gauge',FR:'Synchronisée avec les capteurs intérieurs pour une régulation dynamique.',EN:'Synchronised with indoor sensors for dynamic regulation.',AR:'متزامنة مع المستشعرات الداخلية لتنظيم ديناميكي.'},
      ]},
      {title:S.param, kind:'facts', items:[
        {i:'ti-map-pin',k:{FR:'Emplacement',EN:'Location',AR:'الموقع'},v:{FR:'Mur pignon extérieur',EN:'Exterior gable wall',AR:'الجدار الجانبي الخارجي'}},
        {i:'ti-windmill',k:{FR:'Type',EN:'Type',AR:'النوع'},v:{FR:'Extracteur centrifuge',EN:'Centrifugal extractor',AR:'شفاط طرد مركزي'}},
        {i:'ti-wind',k:{FR:'Débit',EN:'Airflow',AR:'التدفق'},v:TC,flag:true},
        {i:'ti-adjustments',k:{FR:'Contrôle',EN:'Control',AR:'التحكم'},v:{FR:'Automatique',EN:'Automatic',AR:'تلقائي'}},
      ]},
    ]}},

    'ventilation ext': { status:['Naturelle assistée','Assisted natural','طبيعية مُعزَّزة'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-windmill',FR:'Extracteur de toiture assurant la ventilation naturelle assistée.',EN:'Roof extractor providing assisted natural ventilation.',AR:'شفاط سقفي يوفّر تهوية طبيعية مُعزَّزة.'},
        {i:'ti-settings',FR:'Entretien minimal — pièces mécaniques accessibles depuis la toiture.',EN:'Minimal maintenance — mechanical parts accessible from the roof.',AR:'صيانة قليلة — أجزاء ميكانيكية يسهل الوصول إليها من السقف.'},
      ]},
      {title:S.param, kind:'facts', items:[
        {i:'ti-windmill',k:{FR:'Type',EN:'Type',AR:'النوع'},v:{FR:'Éolienne de ventilation',EN:'Wind-driven turbine',AR:'دوّارة تهوية'}},
        {i:'ti-map-pin',k:{FR:'Emplacement',EN:'Location',AR:'الموقع'},v:{FR:'Toiture de la serre',EN:'Greenhouse roof',AR:'سقف الدفيئة'}},
        {i:'ti-refresh',k:{FR:'Maintenance',EN:'Maintenance',AR:'الصيانة'},v:{FR:'Annuelle',EN:'Annual',AR:'سنوية'}},
      ]},
    ]}},

    'le truc exterieur': { status:['À documenter','To document','قيد التوثيق'], card:{sections:[
      {title:S.info, kind:'grid', items:[
        {i:'ti-map-pin',       FR:'Équipement ou infrastructure extérieure du campus AgroBioTech.',EN:'Outdoor equipment or infrastructure of the AgroBioTech campus.',AR:'تجهيز أو بنية خارجية بحرم AgroBioTech.'},
        {i:'ti-progress-alert',FR:'Caractéristiques à préciser lors de la visite de terrain.',EN:'Details to be confirmed during the field visit.',AR:'تفاصيل تُحدَّد أثناء الزيارة الميدانية.'},
      ]},
      {title:S.info, kind:'facts', items:[
        {i:'ti-settings',k:{FR:'Type',EN:'Type',AR:'النوع'},v:TC,flag:true},
        {i:'ti-target',k:{FR:'Fonction',EN:'Function',AR:'الوظيفة'},v:TC,flag:true},
        {i:'ti-map-pin',k:{FR:'Emplacement',EN:'Location',AR:'الموقع'},v:{FR:'Extérieur du campus',EN:'Campus exterior',AR:'خارج الحرم'}},
      ]},
    ]}},

    /* ─ corridor hotspots — exact manifest arDesc keys ─ */
    'salle de fertilisation et traitement d\'eau': { status:['Automatisée','Automated','مؤتمتة'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-flask',       FR:'Préparation précise des solutions nutritives.',EN:'Precise preparation of nutrient solutions.',AR:'تحضير دقيق للمحاليل المغذية.'},
        {i:'ti-gauge',       FR:'Contrôle du pH et de la conductivité électrique (CE) de la solution nutritive.',EN:'Control of pH and electrical conductivity (EC) of the nutrient solution.',AR:'مراقبة درجة الحموضة والتوصيلية الكهربائية للمحلول المغذي.'},
        {i:'ti-adjustments', FR:'Ajustement des doses d’engrais selon les besoins des cultures.',EN:'Adjustment of fertiliser doses to crop requirements.',AR:'ضبط جرعات الأسمدة وفق احتياجات المحاصيل.'},
        {i:'ti-list',        FR:'Gestion de plusieurs programmes de fertilisation.',EN:'Management of multiple fertilisation programmes.',AR:'إدارة برامج تسميد متعددة.'},
      ]},
      {title:{FR:'PRINCIPES',EN:'PRINCIPLES',AR:'المبادئ'}, kind:'grid', items:[
        {i:'ti-droplet',     FR:'La fertigation associe en un seul geste l’irrigation et la nutrition par injection automatisée des fertilisants dans le réseau d’irrigation.',EN:'Fertigation combines irrigation and nutrition in a single step via automated injection of fertilisers into the irrigation network.',AR:'التسميد بالري يجمع الري والتغذية في عملية واحدة عبر الحقن التلقائي للأسمدة في شبكة الري.'},
        {i:'ti-bolt',        FR:'La CE renseigne sur la concentration totale en sels dissous ; le pH conditionne la disponibilité des éléments nutritifs — un pH mal maîtrisé peut bloquer l’assimilation du fer, du phosphore ou d’autres éléments.',EN:'EC reflects the total dissolved salt concentration; pH governs nutrient availability — poor pH control can block uptake of iron, phosphorus and other elements.',AR:'التوصيلية تعكس تركيز الأملاح الذائبة، ودرجة الحموضة تتحكم في توافر العناصر الغذائية.'},
        {i:'ti-leaf',        FR:'Pilotage fin des macroéléments (azote, phosphore, potassium, calcium, magnésium, soufre) et des oligоéléments pour ajuster la nutrition au stade de la culture et optimiser l’efficience de l’eau et des intrants.',EN:'Fine-tuned management of macroelements (N, P, K, Ca, Mg, S) and microelements to match crop stage and optimise water and input efficiency.',AR:'ضبط دقيق للعناصر الكبرى (N, P, K, Ca, Mg, S) والصغرى لمواءمة التغذية مع مرحلة المحصول وتحسين كفاءة الماء والمدخلات.'},
      ]},
    ]}},

    'local technique d\'\u00e9quipements': { status:['Automatisation','Automation','أتمتة'], card:{sections:[
      {title:S.fonc, kind:'grid', items:[
        {i:'ti-cpu',     FR:'Abrite les boîtiers d’automatisation et de contrôle qui assurent la gestion automatisée des serres.',EN:'Houses the automation and control cabinets that manage the greenhouses automatically.',AR:'يضم خزانات الأتمتة والتحكم التي تتولى الإدارة الآلية للدفيئات.'},
        {i:'ti-settings',FR:'Pilotage de l’irrigation, de la ventilation, du chauffage, du refroidissement et des équipements climatiques.',EN:'Control of irrigation, ventilation, heating, cooling and climate equipment.',AR:'التحكم في الري والتهوية والتدفئة والتبريد وتجهيزات المناخ.'},
        {i:'ti-cloud',   FR:'Connexion au réseau de capteurs Guardian Pro de chaque unité de culture.',EN:'Connection to the Guardian Pro sensor network of each growing unit.',AR:'الاتصال بشبكة مستشعرات Guardian Pro لكل وحدة زراعة.'},
      ]},
    ]}},

  };

  const CATS = {
    'unité génétique et amélioration des plantes':['UNITÉ DE RECHERCHE','RESEARCH UNIT','وحدة بحثية'],
    'unité horticulture':['UNITÉ DE RECHERCHE','RESEARCH UNIT','وحدة بحثية'],
    'unité agronomie':['UNITÉ DE RECHERCHE','RESEARCH UNIT','وحدة بحثية'],
    'unité protection des plantes':['UNITÉ DE RECHERCHE','RESEARCH UNIT','وحدة بحثية'],
    'unité hydroponie':['UNITÉ DE RECHERCHE','RESEARCH UNIT','وحدة بحثية'],
    'salle technique de commandes':['LOCAL TECHNIQUE','TECHNICAL ROOM','مرفق تقني'],
    'salle de lavage':['LOCAL TECHNIQUE','TECHNICAL ROOM','مرفق تقني'],
    'salle de préparation':['LOCAL TECHNIQUE','TECHNICAL ROOM','مرفق تقني'],
    'salle de réunion':['ESPACE COMMUN','COMMON SPACE','فضاء مشترك'],
    'bloc gestion technique et administrative':['ADMINISTRATION','ADMINISTRATION','الإدارة'],
    'serre':['COMPLEXE DE SERRES','GREENHOUSE COMPLEX','مجمّع الدفيئات'],
    'monitoring':['SUPERVISION','MONITORING','الإشراف'],
    'station de fertigation':['STATION TECHNIQUE','TECHNICAL STATION','محطة تقنية'],
    'chaudière':['ÉQUIPEMENT TECHNIQUE','TECHNICAL EQUIPMENT','معدات تقنية'],
    'audoucisseur':['TRAITEMENT DE L\u2019EAU','WATER TREATMENT','معالجة المياه'],
    'système de ventilation':['VENTILATION','VENTILATION','التهوية'],
    'ventilation dehors':['VENTILATION','VENTILATION','التهوية'],
    'ventilation ext':['VENTILATION','VENTILATION','التهوية'],
    'le truc exterieur':['EXTÉRIEUR','OUTDOOR','الخارج'],
  };

  const TT = {
    'unité génétique et amélioration des plantes':['Unité Génétique & Amélioration','Genetics & Breeding Unit','وحدة الوراثة والتحسين'],
    'unité horticulture':['Unité Horticulture','Horticulture Unit','وحدة البستنة'],
    'unité agronomie':['Unité Agronomie','Agronomy Unit','وحدة علوم الفلاحة'],
    'unité protection des plantes':['Unité Protection des Plantes','Plant Protection Unit','وحدة وقاية النباتات'],
    'unité hydroponie':['Unité Hydroponie','Hydroponics Unit','وحدة الزراعة المائية'],
    'salle technique de commandes':['Salle Technique de Commandes','Control Room','غرفة التحكم'],
    'salle de lavage':['Salle de Lavage','Washing Room','غرفة الغسل'],
    'salle de préparation':['Salle de Préparation','Preparation Room','غرفة التحضير'],
    'salle de réunion':['Salle de Réunion','Meeting Room','قاعة الاجتماعات'],
    'bloc gestion technique et administrative':['Bloc Gestion & Administration','Administration Building','مبنى الإدارة'],
    'serre':['Complexe de Serres AgroBioTech','AgroBioTech Greenhouse Complex','مجمّع دفيئات AgroBioTech'],
    'monitoring':['Système de Monitoring','Monitoring System','نظام المراقبة'],
    'station de fertigation':['Station de Fertigation','Fertigation Station','محطة التسميد بالري'],
    'salle de fertilisation et traitement d\'eau':['Salle de Fertilisation','Fertilisation Room','قاعة التسميد'],
    'local technique d\'\u00e9quipements':['Local Technique',"Local Technique",'\u0627\u0644\u0645\u062d\u0644 \u0627\u0644\u062a\u0642\u0646\u064a'],
    'chaudière':['Chaudière','Boiler','غلاية'],
    'audoucisseur':['Adoucisseur d\u2019Eau','Water Softener','مُليّن الماء'],
    'système de ventilation':['Système de Ventilation','Ventilation System','نظام التهوية'],
    'ventilation dehors':['Ventilation Extérieure','Exterior Ventilation','التهوية الخارجية'],
    'ventilation ext':['Ventilation de Toiture','Roof Ventilation','تهوية السقف'],
    'le truc exterieur':['Zone / Équipement Extérieur','Outdoor Area / Equipment','منطقة / تجهيز خارجي'],
  };

  /* audio file stems for info cards — add audio/{lang}/{stem}.mp3 to activate */
  const _AUDIO2 = {
    'unité génétique et amélioration des plantes': 'genetique',
    'unité horticulture':                          'horticulture',
    'unité agronomie':                             'agronomie',
    'unité protection des plantes':                'protection',
    'unité hydroponie':                            'hydroponie',
    'salle technique de commandes':                'salle-controle',
    'salle de lavage':                             'salle-lavage',
    'salle de préparation':                        'salle-preparation',
    'salle de réunion':                            'salle-reunion',
    'bloc gestion technique et administrative':    'administration',
    'serre':                                       'complexe-serres',
    'bloc protection des plantes':                 'protection',
    'monitoring':                                  'monitoring',
    'station de fertigation':                      'station-fertigation',
    'chaudière':                                   'chaudiere',
    'audoucisseur':                                'adoucisseur',
    'système de ventilation':                      'systeme-ventilation',
    'ventilation dehors':                          'ventilation-dehors',
    'ventilation ext':                             'ventilation-toiture',
    'le truc exterieur':                           'exterieur',
    'salle de fertilisation et traitement d\'eau': 'salle-fertigation',
    'local technique d\'\u00e9quipements':              'local-technique',
  };
  function _audioObj(stem){ return stem ? {FR:'audio/fr/'+stem+'.mp3',EN:'audio/en/'+stem+'.mp3',AR:'audio/ar/'+stem+'.mp3'} : null; }

  function applyOne2(key, content){
    const d = AR_CONTENT[key];
    if(!d){ console.warn('[info2] def missing:', key); return; }
    d.type = 'info'; d.tabs = ['Info']; d.stateKey = null;
    d.card = content.card; d.audio = _audioObj(_AUDIO2[key]);
    d.statusText = content.status[0]; d.statusText_en = content.status[1]; d.statusText_ar = content.status[2];
    const tt = TT[key]; if(tt){ d.title = tt[0]; d.title_en = tt[1]; d.title_ar = tt[2]; }
    const ct = CATS[key]; if(ct) addCat(key, ct[0], ct[1], ct[2]);
  }

  Object.keys(INFO2).forEach(k => applyOne2(k, INFO2[k]));

  /* alias: bloc protection des plantes → same card as unité protection, own title + category */
  if(AR_CONTENT['bloc protection des plantes'] && INFO2['unité protection des plantes']){
    applyOne2('bloc protection des plantes', INFO2['unité protection des plantes']);
    const d = AR_CONTENT['bloc protection des plantes'];
    d.title = 'Bloc Protection des Plantes'; d.title_en = 'Plant Protection Block'; d.title_ar = 'مبنى وقاية النباتات';
    addCat('bloc protection des plantes', 'UNITÉ DE RECHERCHE','RESEARCH UNIT','وحدة بحثية');
  }
})();
/* INFO2_END */


/* ════════════════════════════════════════════════════════════════════════
   INLINE FERTIGATION NS CALCULATOR
   Triggered when e.calc === 'inline' in renderEquipmentCard.
   Based on Incrocci EUPHOROS sequential method.
════════════════════════════════════════════════════════════════════════ */
window._arcCrops = {
  fraise:    {fr:'Fraise',    en:'Strawberry', ar:'\u0641\u0631\u0627\u0648\u0644\u0629', NO3:11,  NH4:1.2, P:1.5, K:6.5, Ca:3.5, Mg:1.5, SO4:1.5, EC:1.2, pH:5.8},
  tomate:    {fr:'Tomate',    en:'Tomato',     ar:'\u0637\u0645\u0627\u0637\u0645',      NO3:12,  NH4:1.5, P:1.5, K:7,   Ca:4,   Mg:2,   SO4:3,   EC:2.5, pH:5.8},
  laitue:    {fr:'Laitue',    en:'Lettuce',    ar:'\u062e\u0633',                       NO3:10,  NH4:1,   P:1.5, K:5.5, Ca:3,   Mg:1.5, SO4:2,   EC:1.8, pH:6.0},
  concombre: {fr:'Concombre', en:'Cucumber',   ar:'\u062e\u064a\u0627\u0631',           NO3:13,  NH4:1.5, P:1.5, K:7.5, Ca:4.5, Mg:2,   SO4:2.5, EC:2.2, pH:5.8},
  poivron:   {fr:'Poivron',   en:'Pepper',     ar:'\u0641\u0644\u0641\u0644',           NO3:12,  NH4:1,   P:1.5, K:7,   Ca:4,   Mg:2,   SO4:2.5, EC:2.3, pH:5.8},
  courgette: {fr:'Courgette', en:'Zucchini',   ar:'\u0643\u0648\u0633\u0627',           NO3:11,  NH4:1,   P:1.5, K:6,   Ca:3.5, Mg:1.5, SO4:2,   EC:2.0, pH:6.0},
};

/* Sequential fertilizer assignment (Incrocci, 2011):
   1. Ca(NO3)2 for Ca  2. NH4NO3 for NH4  3. KH2PO4 for P
   4. KNO3 for remaining K  5. MgSO4 for Mg              */
window.arcCompute = function(cropKey, volumeL){
  const c = window._arcCrops[cropKey];
  if(!c || !volumeL || volumeL <= 0) return null;
  const V = +volumeL;
  // g = concentration(mmol/L) × MW(g/mol) × Volume(L) / 1000
  const g = (mmol, MW) => Math.max(0, +(mmol * MW * V / 1000).toFixed(1));
  const Krem = Math.max(0, c.K - c.P); // K remaining after KH2PO4 provides one K per P
  return {
    EC : c.EC,
    pH : c.pH,
    doses: [
      {name:'Ca(NO\u2083)\u2082\u00b74H\u2082O', g:g(c.Ca, 236.15),  tank:'A', mM:+c.Ca.toFixed(1)},
      {name:'NH\u2084NO\u2083',                  g:g(c.NH4, 80.04),   tank:'A', mM:+c.NH4.toFixed(1)},
      {name:'KH\u2082PO\u2084',                  g:g(c.P, 136.09),    tank:'B', mM:+c.P.toFixed(1)},
      {name:'KNO\u2083',                         g:g(Krem, 101.10),   tank:'B', mM:+Krem.toFixed(1)},
      {name:'MgSO\u2084\u00b77H\u2082O',         g:g(c.Mg, 246.48),  tank:'B', mM:+c.Mg.toFixed(1)},
    ],
  };
};

window.arcResultsHTML = function(data, lang){
  if(!data) return '<div class="arc-err">\u2014</div>';
  const lbl = {
    ta:{FR:'Cuve', EN:'Tank', AR:'\u062e\u0632\u0627\u0646'},
    no:{FR:'M\u00e9thode s\u00e9quentielle Incrocci \u2014 Dissoudre A avant B. Ajuster pH et EC mesur\u00e9s.',
        EN:'Sequential Incrocci method \u2014 Dissolve A before B. Adjust measured pH and EC.',
        AR:'\u0637\u0631\u064a\u0642\u0629 Incrocci \u0627\u0644\u062a\u0633\u0644\u0633\u0644\u064a\u0629 \u2014 \u0623\u0630\u0628 A \u0642\u0628\u0644 B. \u0639\u062f\u0651\u0644 pH \u0648EC \u0627\u0644\u0645\u0642\u064a\u0633\u064a\u0646.'},
  };
  const lk = (k) => lbl[k]?.[lang] || lbl[k]?.FR || '';
  const tc = t => t === 'A' ? '#0891b2' : '#059669';
  return `
    <div class="arc-kpis">
      <div class="arc-kpi"><b class="arc-kv">${data.EC}</b><span class="arc-kl">EC mS/cm</span></div>
      <div class="arc-kpi"><b class="arc-kv">${data.pH}</b><span class="arc-kl">pH cible</span></div>
    </div>
    <div class="arc-table">
      ${data.doses.filter(d => d.g > 0).map(d => `
        <div class="arc-dr">
          <span class="arc-fn">${d.name}</span>
          <span class="arc-ft" style="background:${tc(d.tank)}1a;color:${tc(d.tank)};border:1px solid ${tc(d.tank)}55">${lk('ta')} ${d.tank}</span>
          <span class="arc-fg"><b>${d.g}</b>\u202fg</span>
        </div>`).join('')}
    </div>
    <p class="arc-note">${lk('no')}</p>`;
};

window.arcUpdate = function(){
  const sel = document.getElementById('arc-crop');
  const inp = document.getElementById('arc-vol');
  const res = document.getElementById('arc-res');
  if(!sel || !inp || !res) return;
  res.innerHTML = window.arcResultsHTML(
    window.arcCompute(sel.value, +inp.value || 100),
    window.currentLang || 'FR'
  );
};

function buildFertigCalcHTML(lang){
  const crops = window._arcCrops || {};
  const names = {FR:'Culture', EN:'Crop', AR:'\u0627\u0644\u0645\u062d\u0635\u0648\u0644'};
  const vols  = {FR:'Volume final', EN:'Final volume', AR:'\u0627\u0644\u062d\u062c\u0645 \u0627\u0644\u0643\u0644\u064a'};
  const px    = o => (o && o[lang]) || o?.FR || '';
  const options = Object.keys(crops).map(k => {
    const c = crops[k];
    const n = lang === 'AR' ? c.ar : lang === 'EN' ? c.en : c.fr;
    return `<option value="${k}">${n}</option>`;
  }).join('');
  const initKey  = Object.keys(crops)[0] || 'fraise';
  const initHTML = window.arcResultsHTML(window.arcCompute(initKey, 100), lang);
  return `
    <div class="arc-wrap">
      <div class="arc-controls">
        <div class="arc-field">
          <span class="arc-lbl">${px(names)}</span>
          <select class="arc-sel" id="arc-crop" onchange="window.arcUpdate()">${options}</select>
        </div>
        <div class="arc-field">
          <span class="arc-lbl">${px(vols)}</span>
          <div class="arc-vinp">
            <input class="arc-inp" id="arc-vol" type="number" value="100" min="1" max="9999" oninput="window.arcUpdate()">
            <span class="arc-unit">L</span>
          </div>
        </div>
      </div>
      <div id="arc-res" class="arc-res">${initHTML}</div>
    </div>`;
}

/* ── Refresh hero text (title / category / status pill) for the current language ── */
function arSetHeroText(desc){
  const def = (typeof getARDef==='function') ? getARDef(desc) : null;
  if(!def) return;
  const lc = (window.currentLang||'FR').toLowerCase();
  const catEl   = document.getElementById('ar-category-label');
  const titleEl = document.getElementById('ar-title');
  const pill    = document.getElementById('ar-state-pill');
  const pillTxt = document.getElementById('ar-state-pill-text');
  const rStrip  = document.getElementById('ar-reason-strip');
  const rTxt    = document.getElementById('ar-reason-text');
  if(catEl)   catEl.textContent   = (typeof tCat==='function') ? tCat(desc) : (catEl.textContent||'DIGITAL TWIN');
  if(titleEl) titleEl.textContent = def['title_'+lc] || def.title || titleEl.textContent;
  const state = (def.stateKey && typeof hsGetState==='function') ? hsGetState(def.stateKey) : null;
  if(pillTxt){
    if(state === null){
      if(pill) pill.className = 'ar-state-pill unknown';
      pillTxt.textContent = def['statusText_'+lc] || def.statusText || '—';
      if(rStrip) rStrip.style.display = 'none';
    } else {
      const on = state === 'on';
      if(pill) pill.className = 'ar-state-pill ' + (on ? 'on' : 'off');
      pillTxt.textContent = on ? (typeof t==='function'?t('active'):'ACTIF') : (typeof t==='function'?t('inactive'):'INACTIF');
      if(rStrip) rStrip.style.display = 'block';
      if(rTxt && def.thresholds && def.thresholds.length) rTxt.textContent = on ? def.thresholds[0].onWhen : def.thresholds[0].offWhen;
    }
  }
}

/* ── Auto-inject lang switcher when DOM ready ── */
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLangSwitcher);
} else {
  injectLangSwitcher();
}
