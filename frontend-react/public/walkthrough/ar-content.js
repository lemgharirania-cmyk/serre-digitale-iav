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
    loading:           'Interrogation capteurs…',
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
    fonctions:  'FONCTIONS',
    parametres: 'PARAMÈTRES',
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
    fonctions:  'FUNCTIONS',
    parametres: 'PARAMETERS',
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
    fonctions:  'الوظائف',
    parametres: 'المعاملات',
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
  // Re-render open card (content + header)
  if(window.activeAR) {
    const def = getARDef(window.activeAR);
    if(def) {
      // Update header title
      const _t = lang==='EN' ? (def.title_en||def.title) : lang==='AR' ? (def.title_ar||def.title) : def.title;
      const titleEl = document.getElementById('ar-title');
      if(titleEl) titleEl.textContent = _t;
      // Update category label
      const catEl = document.getElementById('ar-category-label');
      if(catEl) catEl.textContent = tCat(window.activeAR);
      // Update status pill
      const pillEl = document.getElementById('ar-state-pill-text');
      if(pillEl && def.stateKey == null) {
        const _s = lang==='EN' ? (def.statusText_en||def.statusText) : lang==='AR' ? (def.statusText_ar||def.statusText) : def.statusText;
        pillEl.textContent = _s || '—';
      }
      // Re-render tab content
      renderARTab(window.activeTab || 0, def);
    }
  }
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
  // If already in HTML, just sync the active state
  const existing = document.getElementById('lang-switcher');
  if(existing) {
    existing.querySelectorAll('.lang-pill').forEach(el => {
      el.classList.toggle('active', el.dataset.lang === window.currentLang);
    });
    return;
  }
  // Otherwise inject dynamically (for viewers without baked-in switcher)
  const toggle = document.getElementById('ar-toggle');
  if(!toggle) return;
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
    title_en:'Strawberries — Fragaria × ananassa',
    title_ar:'الفراولة — Fragaria × ananassa',
    statusText_en:'Active crop',
    statusText_ar:'محصول نشط',



    tabs:['Info'],



    sections:[



      {label:'IDENTIFICATION',items:[



        {k:'Variété',v:'Fragaria × ananassa'},



        {k:'Famille',v:'Rosacées'},



        {k:'Système',v:'Hors-sol hydroponique',tag:'blue'},



        {k:'Stade',v:'À COMPLÉTER'},


], items_en:[{k:'Variety',v:'Fragaria × ananassa'},{k:'Family',v:'Rosaceae'},{k:'System',v:'Soilless hydroponic',tag:'blue'},{k:'Stage',v:'TO COMPLETE'}], items_ar:[{k:'الصنف',v:'Fragaria × ananassa'},{k:'الفصيلة',v:'Rosaceae'},{k:'النظام',v:'زراعة مائية',tag:'blue'},{k:'المرحلة',v:'يُستكمل'}]},



      {label:'CONDITIONS OPTIMALES',items:[



        {k:'Température',v:'18 – 22 °C'},



        {k:'Humidité',v:'60 – 75 %'},



        {k:'pH solution',v:'5.8 – 6.2'},



        {k:'EC solution',v:'1.0 – 1.4 mS/cm'},



        {k:'Photopériode',v:'12 – 16 h'},


], items_en:[{k:'Temperature',v:'18 – 22 °C'},{k:'Humidity',v:'60 – 75 %'},{k:'Solution pH',v:'5.8 – 6.2'},{k:'Solution EC',v:'1.0 – 1.4 mS/cm'},{k:'Photoperiod',v:'12 – 16 h'}], items_ar:[{k:'الحرارة',v:'18 – 22 °C'},{k:'الرطوبة',v:'60 – 75 %'},{k:'حموضة المحلول',v:'5.8 – 6.2'},{k:'توصيل المحلول',v:'1.0 – 1.4 mS/cm'},{k:'الفترة الضوئية',v:'12 – 16 ساعة'}]},



      {label:'CULTURE',bullets:[



        'Cultivée en gouttières surélevées pour optimiser la collecte de solution nutritive.',



        'Le substrat inerte (fibre de coco ou perlite) assure drainage et aération racinaire.',



        'Irrigation programmée par cycles courts, pH et EC ajustés en continu.',


], bullets_en:['Grown in elevated gutters to optimise nutrient solution recovery.','Inert substrate (coco fibre or perlite) ensures drainage and root aeration.','Irrigation scheduled in short cycles; pH and EC adjusted continuously.'], bullets_ar:['تُزرع في أحواض مرتفعة لتحسين استرداد المحلول الغذائي.','الركيزة الخاملة تضمن الصرف وتهوية الجذور.','ري بدورات قصيرة مع ضبط مستمر للـ pH والـ EC.']},



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



    color:'#10b981', statusText:'Injection active', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<circle cx="${80+i*50}" cy="${50+Math.sin(i*1.2)*20}" r="${3+i%3}" fill="rgba(110,231,183,.4)" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Injection CO₂',
    title_en:'CO₂ Injection',
    title_ar:'حقن CO₂',
    statusText_en:'Injection active',
    statusText_ar:'الحقن نشط',



    tabs:['Info'],



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


], bullets_en:['CO₂ enrichment stimulates photosynthesis and accelerates plant growth.','The goal is to maintain a concentration between 800 and 1200 ppm during the day.','Injection is automatically suspended at night or when ventilation is open.'], bullets_ar:['إثراء CO₂ يحفز التمثيل الضوئي ويسرع نمو النبات.','الهدف هو الحفاظ على تركيز بين 800 و1200 جزء/مليون خلال النهار.','يتوقف الحقن تلقائياً ليلاً أو عند فتح التهوية.']},



      {label:'PARAMÈTRES',items:[



        {k:'Source',v:'Bouteille CO₂ comprimé'},



        {k:'Concentration cible',v:'800 – 1200 ppm'},



        {k:'Déclenchement',v:'Capteur VPD / minuterie'},



        {k:'Sécurité',v:'Coupure ventilation active'},


], items_en:[{k:'Source',v:'Compressed CO₂ cylinder'},{k:'Target concentration',v:'800 – 1200 ppm'},{k:'Trigger',v:'VPD sensor / timer'},{k:'Safety',v:'Active ventilation cutoff'}], items_ar:[{k:'المصدر',v:'أسطوانة CO₂ مضغوطة'},{k:'التركيز المستهدف',v:'800 – 1200 جزء/مليون'},{k:'التشغيل',v:'مستشعر VPD / مؤقت'},{k:'الأمان',v:'قطع التهوية الفعالة'}]},



    ],



  },







  'brumisateur': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(13,148,136,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="10" height="6" rx="2"/><path d="M12 12h3"/><path d="M17 8l1.5-2M17 12h1.5M17 16l1.5 2"/><circle cx="20" cy="8" r="1" fill="rgba(13,148,136,.9)" stroke="none"/><circle cx="21" cy="12" r="1" fill="rgba(13,148,136,.9)" stroke="none"/><circle cx="20" cy="16" r="1" fill="rgba(13,148,136,.9)" stroke="none"/></svg>`,



    iconBg:'rgba(45,212,191,.18)', iconBorder:'rgba(94,234,212,.3)',



    color:'#14b8a6', statusText:'Brumisation active', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(45,212,191,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${90+i*55} 40 Q${95+i*55} 55 ${90+i*55} 70" stroke="rgba(94,234,212,.${3+i%2})" stroke-width="1.5" fill="none" style="animation:hero-float ${1.6+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Brumisateur Haute Pression',
    title_en:'High-Pressure Misting System',
    title_ar:'نظام الرذاذ عالي الضغط',
    statusText_en:'Misting active',
    statusText_ar:'الرذاذ نشط',



    tabs:['Info'],



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


], bullets_en:['Produces a mist of droplets < 10 µm that evaporate before reaching the ground.','Provides adiabatic cooling of ambient air and maintains humidity.','Activated when temperature exceeds the maximum threshold or humidity drops below minimum.'], bullets_ar:['يُنتج ضباباً من قطيرات أقل من 10 ميكرون تتبخر قبل وصولها للأرض.','يوفر تبريداً للهواء المحيط ويحافظ على الرطوبة.','يُفعَّل عند تجاوز درجة الحرارة الحد الأقصى أو انخفاض الرطوبة.']},



      {label:'PARAMÈTRES',items:[



        {k:'Pression',v:'À COMPLÉTER bar'},



        {k:'Débit',v:'À COMPLÉTER L/h'},



        {k:'Buse',v:'Céramique haute pression'},



        {k:'Contrôle',v:'Automatique / seuil'},


], items_en:[{k:'Pressure',v:'TO COMPLETE bar'},{k:'Flow rate',v:'TO COMPLETE L/h'},{k:'Nozzle',v:'High-pressure ceramic'},{k:'Control',v:'Automatic / threshold'}], items_ar:[{k:'الضغط',v:'يُستكمل bar'},{k:'معدل التدفق',v:'يُستكمل L/h'},{k:'الفوهة',v:'خزفية عالية الضغط'},{k:'التحكم',v:'تلقائي / حسب العتبة'}]},



    ],



  },







  'système de refroidissement': {



    icon:`<svg width="30" height="26" viewBox="0 0 24 20" fill="none" stroke="rgba(37,99,235,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="2" width="22" height="14" rx="2.5"/><line x1="5" y1="5" x2="5" y2="13" stroke-width="1.3" opacity=".7"/><line x1="8.5" y1="5" x2="8.5" y2="13" stroke-width="1.3" opacity=".7"/><line x1="12" y1="5" x2="12" y2="13" stroke-width="1.3" opacity=".7"/><line x1="15.5" y1="5" x2="15.5" y2="13" stroke-width="1.3" opacity=".7"/><line x1="19" y1="5" x2="19" y2="13" stroke-width="1.3" opacity=".7"/></svg>`,



    iconBg:'rgba(59,130,246,.18)', iconBorder:'rgba(147,197,253,.3)',



    color:'#3b82f6', statusText:'Refroidissement actif', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 45%, rgba(59,130,246,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<line x1="${70+i*50}" y1="35" x2="${70+i*50}" y2="85" stroke="rgba(147,197,253,.${2+i%3})" stroke-width="${1+i%2}" style="animation:hero-float ${2+i*.25}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Système de Refroidissement',
    title_en:'Cooling System',
    title_ar:'نظام التبريد',
    statusText_en:'Cooling active',
    statusText_ar:'التبريد نشط',



    tabs:['Info'],



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



    color:'#0ea5e9', statusText:'Fertigation active', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 55%, rgba(14,165,233,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2].map(i=>`<ellipse cx="${110+i*60}" cy="${70+i*5}" rx="8" ry="12" fill="rgba(56,189,248,.${2+i})" style="animation:hero-float ${2+i*.4}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Station de Fertigation',
    title_en:'Fertigation Station',
    title_ar:'محطة التسميد',
    statusText_en:'Fertigation active',
    statusText_ar:'التسميد نشط',



    tabs:['Info'],



    sections:[



      {label:'FONCTIONS',bullets:[



        'Prépare et distribue la solution nutritive aux cultures à intervalles programmés.',



        'Ajuste dynamiquement pH et EC en fonction des mesures en temps réel.',



        'Permet la fertilisation précise en éléments macro et micro selon le stade végétatif.',


], bullets_en:['Prepares and distributes the nutrient solution to crops at programmed intervals.','Dynamically adjusts pH and EC based on real-time measurements.','Enables precise fertilisation with macro and micro elements according to growth stage.'], bullets_ar:['تحضير وتوزيع المحلول الغذائي على المحاصيل وفق جداول مبرمجة.','ضبط pH والـ EC ديناميكياً بناءً على القياسات الفورية.','تسميد دقيق بالعناصر الكبرى والصغرى حسب مرحلة النمو.']},



      {label:'PARAMÈTRES',items:[



        {k:'Volume réservoir',v:'À COMPLÉTER L'},



        {k:'pH cible',v:'5.5 – 6.5'},



        {k:'EC cible',v:'1.0 – 2.2 mS/cm'},



        {k:'Fréquence cycles',v:'Programmable'},



        {k:'Régulation',v:'Automatique',tag:'blue'},


], items_en:[{k:'Tank volume',v:'TO COMPLETE L'},{k:'Target pH',v:'5.5 – 6.5'},{k:'Target EC',v:'1.0 – 2.2 mS/cm'},{k:'Cycle frequency',v:'Programmable'},{k:'Regulation',v:'Automatic',tag:'blue'}], items_ar:[{k:'حجم الخزان',v:'يُستكمل L'},{k:'الهدف pH',v:'5.5 – 6.5'},{k:'الهدف EC',v:'1.0 – 2.2 mS/cm'},{k:'تكرار الدورات',v:'قابل للبرمجة'},{k:'التنظيم',v:'تلقائي',tag:'blue'}]},



    ],



  },







  'ventilation': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(37,99,235,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 10c0 0-.5-2.5 1-3.5s3 .5 2 2.5"/><path d="M13.7 13c0 0 2 1 2 2.5s-1.5 2-2.5-.2"/><path d="M10.3 13c0 0-2 1-2 2.5s1.5 2 2.5-.2"/></svg>`,



    iconBg:'rgba(59,130,246,.18)', iconBorder:'rgba(147,197,253,.3)',



    color:'#3b82f6', statusText:'Ventilation active', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${80+i*60} 35 Q${100+i*60} 60 ${80+i*60} 85" stroke="rgba(147,197,253,.${2+i%3})" stroke-width="1.5" fill="none" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Ventilation Mécanique',
    title_en:'Mechanical Ventilation',
    title_ar:'التهوية الميكانيكية',
    statusText_en:'Ventilation active',
    statusText_ar:'التهوية نشطة',



    tabs:['Info'],



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


], bullets_en:['Renews air and removes excess heat and humidity.','Maintains CO₂ concentration at an optimal level for photosynthesis.','Activated automatically based on temperature and humidity thresholds.'], bullets_ar:['تجديد الهواء وإزالة الحرارة الزائدة والرطوبة.','الحفاظ على تركيز CO₂ عند المستوى الأمثل للتمثيل الضوئي.','تشغيل تلقائي وفق عتبات الحرارة والرطوبة.']},



      {label:'PARAMÈTRES',items:[



        {k:'Type',v:'Extracteur axial'},



        {k:'Débit',v:'À COMPLÉTER m³/h'},



        {k:'Contrôle',v:'Thermostat + hygrostat'},



        {k:'Vitesse',v:'À COMPLÉTER tr/min'},


], items_en:[{k:'Type',v:'Axial extractor'},{k:'Flow rate',v:'TO COMPLETE m³/h'},{k:'Control',v:'Thermostat + hygrostat'},{k:'Speed',v:'TO COMPLETE rpm'}], items_ar:[{k:'النوع',v:'مستخرج محوري'},{k:'معدل التدفق',v:'يُستكمل m³/h'},{k:'التحكم',v:'منظم حرارة + منظم رطوبة'},{k:'السرعة',v:'يُستكمل rpm'}]},



    ],



  },







  'ventilation dehors': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(8,145,178,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="12" height="16" rx="2"/><line x1="5" y1="8" x2="11" y2="8" opacity=".6"/><line x1="5" y1="11" x2="11" y2="11" opacity=".6"/><line x1="5" y1="14" x2="11" y2="14" opacity=".6"/><path d="M15 8l4 0M17 12l4 0M15 16l4 0" stroke-width="1.6"/></svg>`,



    iconBg:'rgba(6,182,212,.18)', iconBorder:'rgba(103,232,249,.3)',



    color:'#06b6d4', statusText:'Ventilation extérieure', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${60+i*70} 50 L${100+i*70} 50" stroke="rgba(103,232,249,.${3+i%2})" stroke-width="2" style="animation:hero-float ${1.5+i*.2}s ease-in-out ${i*.15}s infinite"/>`).join('')}</svg>`,



    title:'Ventilation Extérieure',



    tabs:['Info'],



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



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(109,40,217,.9)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="7" width="18" height="12" rx="2"/><line x1="6" y1="11" x2="6" y2="15" stroke-width="1.8"/><line x1="9" y1="10" x2="9" y2="15" stroke-width="1.8"/><line x1="12" y1="9" x2="12" y2="15" stroke-width="1.8"/><line x1="15" y1="11" x2="15" y2="15" stroke-width="1.8"/><line x1="18" y1="12" x2="18" y2="15" stroke-width="1.8"/><circle cx="20" cy="8" r="1.5" fill="#4ade80" stroke="none"/></svg>`,



    iconBg:'rgba(109,40,217,.18)', iconBorder:'rgba(196,181,253,.3)',



    color:'#8b5cf6', statusText:'Actif', type:'sensor',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3,4].map(i=>`<line x1="${60+i*55}" y1="${80-i*5}" x2="${60+i*55}" y2="80" stroke="rgba(196,181,253,.${3+i%3})" stroke-width="${2+i%2}" style="animation:hero-float ${1.5+i*.2}s ease-in-out ${i*.15}s infinite"/>`).join('')}</svg>`,



    title:'Capteurs IoT Environnementaux',
    title_en:'Environmental IoT Sensors',
    title_ar:'مستشعرات IoT البيئية',
    statusText_en:'Active',
    statusText_ar:'نشط',



    tabs:['IoT','Info'],



    sections:[



      {label:'CAPTEURS INSTALLÉS',items:[



        {k:'Température / HR',v:'Sonde T+HR combinée',tag:'blue'},



        {k:'VPD',v:'Calculé (T+HR)'},



        {k:'pH solution',v:'Sonde pH inline'},



        {k:'EC',v:'Conductivimètre inline'},



        {k:'Niveau eau',v:'Capteur ultrasonique'},


], items_en:[{k:'Temperature / RH',v:'Combined T+RH probe',tag:'blue'},{k:'VPD',v:'Calculated (T+RH)'},{k:'Solution pH',v:'Inline pH probe'},{k:'EC',v:'Inline conductivity meter'},{k:'Water level',v:'Ultrasonic sensor'}], items_ar:[{k:'الحرارة / الرطوبة',v:'مسبار T+RH مدمج',tag:'blue'},{k:'VPD',v:'محسوب (T+RH)'},{k:'حموضة المحلول',v:'مسبار pH مضمّن'},{k:'EC',v:'مقياس توصيل مضمّن'},{k:'مستوى الماء',v:'مستشعر فوق صوتي'}]},



      {label:'PROTOCOLE',items:[



        {k:'Fréquence lecture',v:'Toutes les 5 min'},



        {k:'Transmission',v:'WiFi → Guardian Pro'},



        {k:'API',v:'guardian.pro-leaf.com'},


], items_en:[{k:'Reading frequency',v:'Every 5 min'},{k:'Transmission',v:'WiFi → Guardian Pro'},{k:'API',v:'guardian.pro-leaf.com'}], items_ar:[{k:'تكرار القراءة',v:'كل 5 دقائق'},{k:'الإرسال',v:'WiFi → Guardian Pro'},{k:'واجهة البرمجة',v:'guardian.pro-leaf.com'}]},



    ],



  },







  'rideaux auto': {



    icon:`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(180,83,9,.85)" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="4" x2="22" y2="4"/><circle cx="5" cy="4" r="1" fill="rgba(180,83,9,.85)" stroke="none"/><circle cx="10" cy="4" r="1" fill="rgba(180,83,9,.85)" stroke="none"/><circle cx="15" cy="4" r="1" fill="rgba(180,83,9,.85)" stroke="none"/><circle cx="20" cy="4" r="1" fill="rgba(180,83,9,.85)" stroke="none"/><path d="M4 5 Q5 10 4 15 Q3.5 18 5 21"/><path d="M20 5 Q19 10 20 15 Q20.5 18 19 21"/></svg>`,



    iconBg:'rgba(217,119,6,.18)', iconBorder:'rgba(251,191,36,.3)',



    color:'#fbbf24', statusText:'Rideaux déployés', type:'system',



    heroGradient:'radial-gradient(ellipse at 35% 55%, rgba(217,119,6,.22) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none"><rect x="130" y="10" width="110" height="3" rx="1.5" fill="rgba(251,191,36,.3)"/>${[0,1,2].map(i=>`<path d="M${135+i*35} 13 Q${138+i*35} 40 ${135+i*35} 70" stroke="rgba(251,191,36,.${2+i})" stroke-width="1.5" fill="none" style="animation:hero-float ${2.5+i*.4}s ease-in-out ${i*.3}s infinite"/>`).join('')}</svg>`,



    title:'Rideaux Automatiques',
    title_en:'Automatic Curtains',
    title_ar:'الستائر الأوتوماتيكية',
    statusText_en:'Curtains deployed',
    statusText_ar:'الستائر منتشرة',



    tabs:['Info'],



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



    color:'#22d3ee', statusText:'Ouverture active', type:'system',



    heroGradient:'radial-gradient(ellipse at 45% 50%, rgba(6,182,212,.25) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${140+i*22} 40 L${155+i*22} 55 L${140+i*22} 70" stroke="rgba(103,232,249,.${2+i%3})" stroke-width="1.3" fill="none" style="animation:hero-float ${1.8+i*.2}s ease-in-out ${i*.25}s infinite"/>`).join('')}</svg>`,



    title:'Fenêtres Automatiques',
    title_en:'Automatic Windows',
    title_ar:'النوافذ الأوتوماتيكية',
    statusText_en:'Opening active',
    statusText_ar:'الفتح نشط',



    tabs:['Info'],



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



    color:'#3b82f6', statusText:'Actif', type:'system',



    heroGradient:'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,.2) 0%, transparent 65%)',



    heroAnim:`<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 370 120" fill="none">${[0,1,2,3].map(i=>`<path d="M${80+i*60} 35 Q${100+i*60} 60 ${80+i*60} 85" stroke="rgba(147,197,253,.${2+i%3})" stroke-width="1.5" fill="none" style="animation:hero-float ${1.8+i*.3}s ease-in-out ${i*.2}s infinite"/>`).join('')}</svg>`,



    title:'Système de Ventilation Général',



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



  iw.innerHTML = def.icon;







  // ── Category label + title ──



  const catMap = {



    fraise:'SYSTÈME BIOLOGIQUE', co2:'CONTRÔLE CLIMATIQUE',



    brumisateur:'CONTRÔLE CLIMATIQUE', ventilation:'CONTRÔLE CLIMATIQUE',



    'système de refroidissement':'CONTRÔLE CLIMATIQUE',



    fertigation:'SYSTÈME HYDROPONIQUE', sensors:'TÉLÉMÉTRIE IOT',



    'ventilation dehors':'CONTRÔLE CLIMATIQUE',



    'rideaux auto':'CONTRÔLE CLIMATIQUE', 'fenetre auto':'CONTRÔLE CLIMATIQUE'



  };



  document.getElementById('ar-category-label').textContent = tCat(desc);



  const _lang = window.currentLang || 'FR';
  const _title = _lang==='EN' ? (def.title_en||def.title) : _lang==='AR' ? (def.title_ar||def.title) : def.title;
  document.getElementById('ar-title').textContent = _title;











  // ── Big state pill ──



  const _pill = document.getElementById('ar-state-pill');



  const _pillTxt = document.getElementById('ar-state-pill-text');



  const _reasonStrip = document.getElementById('ar-reason-strip');



  const _reasonTxt = document.getElementById('ar-reason-text');



  const _state = def.stateKey ? hsGetState(def.stateKey) : null;



  if(_state === null){



    _pill.className = 'ar-state-pill unknown';



    const _stTxt = _lang==='EN' ? (def.statusText_en||def.statusText) : _lang==='AR' ? (def.statusText_ar||def.statusText) : def.statusText;
    _pillTxt.textContent = _stTxt || '—';



    _reasonStrip.style.display = 'none';



  } else {



    const _on = _state === 'on';



    _pill.className = 'ar-state-pill ' + (_on ? 'on' : 'off');



    _pillTxt.textContent = _on ? t('active') : t('inactive');



    const _reason = def.thresholds?.length



      ? (_on ? def.thresholds[0].onWhen : def.thresholds[0].offWhen)



      : (_on ? 'Système en fonctionnement' : 'Système en veille');



    _reasonStrip.style.display = 'block';



    _reasonTxt.textContent = _reason;



  }







  // ── Tab accent color via CSS var ──



  document.getElementById('ar-card').style.setProperty('--accent', def.color || '#059669');







  // ── Build tab bar ──
  const tabBar = document.getElementById('ar-tab-bar');
  if(tabBar) {
    if(def.tabs && def.tabs.length > 1){
      tabBar.style.display = 'flex';
      tabBar.innerHTML = def.tabs.map((name,i) =>
        `<button class="ar-tab${i===0?' active':''}" onclick="switchTab(${i},true)">${tTab(name)}</button>`
      ).join('');
    } else {
      tabBar.style.display = 'none';
      tabBar.innerHTML = '';
    }
  }

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



  window.activeTab=i;



  document.querySelectorAll('.ar-tab').forEach((t,ti)=>t.classList.toggle('active',ti===i));



  if(window.activeAR) {



    const def = getARDef(window.activeAR);



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







  // ── Live sensor readings section (if IoT tab exists) ──



  if(def.tabs.includes('IoT')){



    if(!iotData){



      html += `<div class="ar-section-title">${t('liveData')}</div>
        <div class="iot-loading">${t('loading')}</div>`;



    } else {



      const env=iotData.env||{}, irr=iotData.irr||{};



      const fmt = v => v!=null ? Number(v).toFixed(1) : '—';



      // ── Use live dashboard thresholds (from Seuils.jsx) ──
      const tT = getThresh('temperature');
      const hT = getThresh('humidite');
      const pT = getThresh('ph');
      const eT = getThresh('ec');

      const rows=[
        {label:tSensor('temperature'), val:env.temperature, unit:'°C',    min:tT.valeur_min, max:tT.valeur_max, ok:env.temperature!=null && env.temperature>=tT.valeur_min && env.temperature<=tT.valeur_max},
        {label:tSensor('humidite'),    val:env.humidite,    unit:'%',     min:hT.valeur_min, max:hT.valeur_max, ok:env.humidite!=null    && env.humidite   >=hT.valeur_min && env.humidite   <=hT.valeur_max},
        {label:tSensor('ph'),          val:irr.ph,          unit:'pH',    min:pT.valeur_min, max:pT.valeur_max, ok:irr.ph!=null          && irr.ph          >=pT.valeur_min && irr.ph          <=pT.valeur_max},
        {label:tSensor('ec'),          val:irr.ec,          unit:'mS/cm', min:eT.valeur_min, max:eT.valeur_max, ok:irr.ec!=null          && irr.ec          >=eT.valeur_min && irr.ec          <=eT.valeur_max},
      ];



      html += `<div class="ar-section-title">${t('liveData')}</div>`;



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



      html += `<div class="iot-refresh" onclick="fetchIoT().then(()=>renderARTab(0,getARDef(window.activeAR)))">${t('refresh')}</div>`;



    }



  }







  // ── État du système: threshold bars (for state-aware cards) ──



  if(def.thresholds && def.thresholds.length && iotData){



    const env = iotData.env||{};



    html += `<div class="ar-section-title">${t('systemState')}</div>



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



    const _reason = _st === null ? t('awaiting')



      : _st === 'on' ? def.thresholds[0].onWhen : def.thresholds[0].offWhen;



    const _rc = _st === 'on' ? 'on' : _st === null ? 'unknown' : 'off';



    html += `<div class="ar-thresh-reason ${_rc}">



      <span class="ar-thresh-dot" style="background:${_st==='on'?'#22c55e':_st===null?'rgba(0,0,0,.2)':'#f59e0b'}"></span>



      ${_reason}



    </div></div>`;



  }







  // ── Static info sections ──



  html += def.sections.map(sec => {
    const lang = (window.currentLang || 'FR').toLowerCase();
    const labelMap = {
      'FONCTIONS':          {en:'FUNCTIONS',         ar:'الوظائف'},
      'PARAMÈTRES':         {en:'PARAMETERS',        ar:'المعاملات'},
      'IDENTIFICATION':     {en:'IDENTIFICATION',    ar:'التعريف'},
      'CONDITIONS OPTIMALES':{en:'OPTIMAL CONDITIONS',ar:'الظروف المثلى'},
      'CULTURE':            {en:'CULTIVATION',       ar:'الزراعة'},
      'CAPTEURS INSTALLÉS': {en:'INSTALLED SENSORS', ar:'أجهزة الاستشعار'},
      'PROTOCOLE':          {en:'PROTOCOL',          ar:'البروتوكول'},
    };
    const secLabel = lang==='fr' ? sec.label : (labelMap[sec.label]?.[lang] || sec.label);
    let s = `<div class="ar-section-title">${secLabel}</div>`;
    const items   = sec['items_'+lang]   || sec.items;
    const bullets = sec['bullets_'+lang] || sec.bullets;
    if(items)   s += items.map(item=>`
      <div class="ar-info-row">
        <span class="ar-info-label">${item.k}</span>
        ${item.tag
          ? `<span class="ar-badge" style="${tagColors[item.tag]||''}">${item.v}</span>`
          : `<span class="ar-info-value">${item.v}</span>`}
      </div>`).join('');
    if(bullets) s += `<div class="ar-bullets">${bullets.map(b=>
      `<div class="ar-bullet"><div class="ar-bullet-dot"></div><span>${b}</span></div>`).join('')}</div>`;
    return s;
  }).join('');







  // ── Video if present ──



  if(def.video){



    html += `<div class="ar-section-title">${t('resource')}</div>



      <div class="video-wrap">



        <iframe src="https://www.youtube.com/embed/${def.video.id}?rel=0" allowfullscreen></iframe>



      </div>



      <p class="video-desc">${def.video.desc}</p>`;



  }







  el.innerHTML = html;



}

function closeAR(){



  document.getElementById('ar-card').classList.remove('open');



  window.activeAR=null;



}

/* ── Auto-inject lang switcher when DOM ready ── */
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLangSwitcher);
} else {
  injectLangSwitcher();
}
