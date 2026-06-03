/* ═══════════════════════════════════════════════════════════
   vr-intro.js — AgroBioTech VR Intro · Cinematic Globe Logic
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════ */
const TARGET_LON = -6.864085, TARGET_LAT = 33.97872;
const AFRAME_VR_URL = 'visitemanuelle-aframe.html';

let currentLang = 'FR';
let globeDone    = false;
let markerActive = false;
let sequenceT    = [];

/* ══════════════════════════════════════════════
   TRANSLATIONS
══════════════════════════════════════════════ */
const COPY = {
  FR: {
    eyebrow:     'DIGITAL TWIN · IAV HASSAN II',
    title:       'Serre Digitale Intelligente',
    sub:         'Explorez le campus AgroBioTech en réalité virtuelle immersive. Visualisez les serres de recherche, les données IoT en direct, et le jumeau numérique.',
    instr1:      'Regardez librement autour de vous',
    instr2:      'Détectez le Maroc sur le globe',
    instr3:      'Appuyez sur ENTRER pour commencer',
    wcBadge:     'AgroBioTech · IAV Hassan II · Rabat',
    wcTitle:     'Bienvenue dans la\nSerre Digitale Intelligente',
    wcSub:       'Vous allez explorer les 5 serres de recherche du campus en réalité virtuelle immersive avec données IoT en direct.',
    ctaLabel:    'Entrer dans l\'expérience',
    markerT:     'Institut Agronomique et Vétérinaire Hassan II',
    markerS:     'Serre Digitale · Rabat, Maroc',
    loadingTxt:  'Préparation du voyage spatial…',
  },
  EN: {
    eyebrow:     'DIGITAL TWIN · IAV HASSAN II',
    title:       'Intelligent Digital Greenhouse',
    sub:         'Explore the AgroBioTech campus in immersive virtual reality. Visualize research greenhouses, live IoT data, and the digital twin.',
    instr1:      'Look freely around you',
    instr2:      'Find Morocco on the globe',
    instr3:      'Press ENTER to begin',
    wcBadge:     'AgroBioTech · IAV Hassan II · Rabat',
    wcTitle:     'Welcome to the\nIntelligent Digital Greenhouse',
    wcSub:       'You will explore the 5 research greenhouses of the campus in immersive VR with live IoT sensor data.',
    ctaLabel:    'Enter the experience',
    markerT:     'Institut Agronomique et Vétérinaire Hassan II',
    markerS:     'Digital Greenhouse · Rabat, Morocco',
    loadingTxt:  'Preparing the spatial journey…',
  },
  AR: {
    eyebrow:     'التوأم الرقمي · IAV حسن الثاني',
    title:       'الدفيئة الرقمية الذكية',
    sub:         'استكشف حرم AgroBioTech في الواقع الافتراضي الغامر. تصور دور الأبحاث وبيانات IoT المباشرة والتوأم الرقمي.',
    instr1:      'انظر بحرية من حولك',
    instr2:      'ابحث عن المغرب على الكرة الأرضية',
    instr3:      'اضغط على ENTER للبدء',
    wcBadge:     'AgroBioTech · IAV حسن الثاني · الرباط',
    wcTitle:     'مرحباً بكم في\nالدفيئة الرقمية الذكية',
    wcSub:       'ستستكشف 5 دفيئات بحثية في الحرم الجامعي في الواقع الافتراضي الغامر مع بيانات المستشعرات المباشرة.',
    ctaLabel:    'الدخول إلى التجربة',
    markerT:     'المعهد الزراعي والبيطري حسن الثاني',
    markerS:     'الدفيئة الرقمية · الرباط، المغرب',
    loadingTxt:  'التحضير للرحلة الفضائية…',
  },
};

function c(key) { return COPY[currentLang]?.[key] ?? COPY.FR[key]; }

/* ══════════════════════════════════════════════
   LOADING BAR
══════════════════════════════════════════════ */
function animLoadBar(from, to) {
  const bar = document.getElementById('loading-bar');
  if (!bar) return;
  let v = from;
  const id = setInterval(() => {
    v = Math.min(v + 1, to);
    bar.style.width = v + '%';
    if (v >= to) clearInterval(id);
  }, 20);
}

/* ══════════════════════════════════════════════
   PHASE TEXT ENGINE
══════════════════════════════════════════════ */
function showPhaseText(opts = {}) {
  const { eyebrow = '', title = '', sub = '', delay = 0, duration = 0, onDone } = opts;

  const run = () => {
    const elEye   = document.getElementById('phase-eyebrow');
    const elTitle = document.getElementById('phase-title');
    const elSub   = document.getElementById('phase-sub');
    const elEyeW  = elEye?.closest('.phase-text');
    const elTitleW = elTitle?.closest('.phase-text');
    const elSubW   = elSub?.closest('.phase-text');

    if (elEye)   elEye.textContent   = eyebrow;
    if (elTitle) elTitle.textContent = title;
    if (elSub)   elSub.textContent   = sub;

    // Show
    [elEyeW, elTitleW, elSubW].forEach((el, i) => {
      if (!el) return;
      el.classList.remove('hide');
      setTimeout(() => el.classList.add('show'), i * 120);
    });

    if (duration > 0) {
      sequenceT.push(setTimeout(() => hidePhaseText(onDone), duration));
    } else if (onDone) {
      onDone();
    }
  };

  if (delay > 0) {
    sequenceT.push(setTimeout(run, delay));
  } else {
    run();
  }
}

function hidePhaseText(cb) {
  const all = document.querySelectorAll('.phase-text');
  all.forEach(el => { el.classList.add('hide'); el.classList.remove('show'); });
  if (cb) setTimeout(cb, 600);
}

function showInstructions(delay = 0) {
  sequenceT.push(setTimeout(() => {
    const lines = document.querySelectorAll('.instr-line');
    lines.forEach((el, i) => {
      setTimeout(() => el.classList.add('show'), i * 320);
    });
  }, delay));
}

function hideInstructions() {
  document.querySelectorAll('.instr-line').forEach(el => el.classList.remove('show'));
}

/* ══════════════════════════════════════════════
   MOROCCO MARKER (DOM overlay on globe)
══════════════════════════════════════════════ */
let markerUpdateId = null;

function startMoroccoMarker() {
  markerActive = true;
  const marker = document.getElementById('morocco-marker');
  if (!marker) return;
  marker.classList.add('show');

  const card = marker.querySelector('.mrc-card-t');
  const cardS = marker.querySelector('.mrc-card-s');
  if (card)  card.textContent  = c('markerT');
  if (cardS) cardS.textContent = c('markerS');

  // Update position using Cesium SceneTransforms if available
  if (markerUpdateId) cancelAnimationFrame(markerUpdateId);
  function tick() {
    if (!markerActive) return;
    const viewer = window._cesiumViewer;
    if (viewer) {
      const cart = Cesium.Cartesian3.fromDegrees(TARGET_LON, TARGET_LAT, 2);
      const sc = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, cart);
      if (sc) {
        marker.style.left = sc.x + 'px';
        marker.style.top  = sc.y + 'px';
      }
    }
    markerUpdateId = requestAnimationFrame(tick);
  }
  tick();
}

function stopMoroccoMarker() {
  markerActive = false;
  const marker = document.getElementById('morocco-marker');
  if (marker) marker.classList.remove('show');
  if (markerUpdateId) { cancelAnimationFrame(markerUpdateId); markerUpdateId = null; }
}

/* ══════════════════════════════════════════════
   WELCOME PANEL
══════════════════════════════════════════════ */
function showWelcomePanel() {
  updateWelcomeText();
  document.getElementById('welcome-panel').classList.add('show');
  // Stop scroll hint
  document.getElementById('scroll-hint')?.classList.remove('show');
}

function updateWelcomeText() {
  const el = id => document.getElementById(id);
  const badge = document.querySelector('.wc-badge-text');
  const title = document.querySelector('.wc-title');
  const sub   = document.querySelector('.wc-sub');
  const btn   = document.querySelector('#enter-btn .btn-label');

  if (badge) badge.textContent = c('wcBadge');
  if (title) title.innerHTML   = c('wcTitle').replace('\n', '<br>');
  if (sub)   sub.textContent   = c('wcSub');
  if (btn)   btn.textContent   = c('ctaLabel');

  // RTL for Arabic
  const card = document.getElementById('welcome-card');
  if (card) card.setAttribute('dir', currentLang === 'AR' ? 'rtl' : 'ltr');
}

/* ══════════════════════════════════════════════
   LANG SWITCHER
══════════════════════════════════════════════ */
window.setLang = function(lang) {
  currentLang = lang;
  document.querySelectorAll('.wc-lang-pill').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
  updateWelcomeText();
  // Update phase text if visible
  const titleEl = document.getElementById('phase-title');
  if (titleEl?.textContent) {
    titleEl.textContent = c('title');
    document.getElementById('phase-sub').textContent = c('sub');
    document.getElementById('phase-eyebrow').textContent = c('eyebrow');
  }
  // Update instructions
  const lines = document.querySelectorAll('.instr-line span:last-child');
  const keys = ['instr1','instr2','instr3'];
  lines.forEach((el, i) => { if (keys[i]) el.textContent = c(keys[i]); });
};

/* ══════════════════════════════════════════════
   ENTER EXPERIENCE — fade → redirect
══════════════════════════════════════════════ */
window.enterExperience = function() {
  const fade = document.getElementById('fade-out');
  if (!fade) return;
  fade.classList.add('show');

  // Cinematic: camera zoom if Cesium is still visible
  const viewer = window._cesiumViewer;
  if (viewer && !globeDone) {
    try {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(TARGET_LON, TARGET_LAT, 800),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-88), roll: 0 },
        duration: 1.1, easingFunction: Cesium.EasingFunction.QUADRATIC_IN,
      });
    } catch(e) {}
  }

  setTimeout(() => {
    window.location.href = AFRAME_VR_URL;
  }, 1250);
};

/* ══════════════════════════════════════════════
   CESIUM GLOBE INIT
══════════════════════════════════════════════ */
function initGlobe() {
  if (typeof Cesium === 'undefined') {
    console.warn('[VR-Intro] Cesium not loaded — skipping globe');
    skipToWelcome();
    return;
  }

  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjYzNlMDg2Ni1lMjZhLTQ2ZmQtODFjZS00NmZkN2FjNTkwOGEiLCJpZCI6NDMzMTQ3LCJpc3MiOiJodHRwczovL2lvbi5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3NzkxMjA3MTV9.gN5CgfHMJ1yDjyrFQIVZylS-rRYBZWFXWVf2Ylf5Ovw';

  const viewer = new Cesium.Viewer('cesium-globe', {
    animation: false, timeline: false, geocoder: false, homeButton: false,
    sceneModePicker: false, navigationHelpButton: false, baseLayerPicker: false,
    fullscreenButton: false, infoBox: false, selectionIndicator: false,
    terrain: Cesium.Terrain.fromWorldTerrain(),
  });
  window._cesiumViewer = viewer;

  viewer.scene.backgroundColor          = Cesium.Color.BLACK;
  viewer.scene.skyAtmosphere.show        = true;
  viewer.scene.globe.enableLighting      = false;
  viewer.scene.globe.showGroundAtmosphere = true;
  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
  viewer.scene.fxaa = true;
  viewer.scene.globe.maximumScreenSpaceError = 1.8; // Quest 2 perf

  // Start far away
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-0.859, 20.15, 43000000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-83.4), roll: 0 },
  });

  // Track marker position
  viewer.scene.postRender.addEventListener(() => {
    if (!markerActive) return;
    const cart = Cesium.Cartesian3.fromDegrees(TARGET_LON, TARGET_LAT, 2);
    const sc = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, cart);
    const marker = document.getElementById('morocco-marker');
    if (sc && marker) {
      marker.style.left = sc.x + 'px';
      marker.style.top  = sc.y + 'px';
    }
  });

  startCinematicSequence(viewer);
}

/* ══════════════════════════════════════════════
   CINEMATIC GLOBE SEQUENCE
══════════════════════════════════════════════ */
const PHASES = [
  { lon: -4.027,   lat: 23.57,    alt: 7800000, pitch: -83.3, dur: 4.0 },
  { lon: -7.899,   lat: 31.857,   alt: 1900000, pitch: -83.3, dur: 3.8 },
  { lon: -6.868,   lat: 33.913,   alt: 46000,   pitch: -83.3, dur: 3.8 },
  { lon: TARGET_LON, lat: TARGET_LAT, alt: 1200, pitch: -87,  dur: 4.5 },
];

async function startCinematicSequence(viewer) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Phase 0: intro text
  showPhaseText({
    eyebrow: c('eyebrow'), title: c('title'), sub: c('sub'),
    delay: 600, duration: 6000,
  });

  // Fly phases
  for (let i = 0; i < PHASES.length; i++) {
    const p = PHASES[i];
    if (i === 2) {
      startMoroccoMarker();
      showInstructions(800);
    }
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(p.pitch), roll: 0 },
      duration: p.dur,
      maximumHeight: p.alt * 1.06,
      easingFunction: i < 2
        ? Cesium.EasingFunction.QUINTIC_IN_OUT
        : Cesium.EasingFunction.CUBIC_IN_OUT,
    });
    await sleep(p.dur * 1000 + 180);
  }

  // End of globe sequence
  globeDone = true;
  hidePhaseText();
  hideInstructions();
  stopMoroccoMarker();

  // Short pause → show welcome panel
  await sleep(700);
  showWelcomePanel();
}

/* ══════════════════════════════════════════════
   SKIP TO WELCOME (fallback if Cesium unavailable)
══════════════════════════════════════════════ */
function skipToWelcome() {
  // Hide globe container
  const g = document.getElementById('cesium-globe');
  if (g) g.style.display = 'none';
  // Show welcome immediately
  setTimeout(showWelcomePanel, 800);
}

/* ══════════════════════════════════════════════
   A-FRAME SCENE SETUP (stars + particles)
══════════════════════════════════════════════ */
function initAFrameScene() {
  // Stars are built in HTML via a-entity star-system
  // This is the fallback if globe doesn't load
}

/* ══════════════════════════════════════════════
   QUEST DETECTION
══════════════════════════════════════════════ */
function detectQuest() {
  const isQuest  = /Oculus|Quest/i.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || isQuest;
  const btn      = document.getElementById('vr-enter-btn');

  if (isQuest && btn) {
    btn.classList.add('quest-glow');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z"/>
        <circle cx="8.5" cy="12" r="1.5"/><circle cx="15.5" cy="12" r="1.5"/>
        <path d="M10 12h4"/>
      </svg>
      VR Expérience · Quest`;
  }

  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(ok => {
      if (ok && btn && !isQuest) btn.classList.add('quest-glow');
    }).catch(() => {});
  }

  return { isQuest, isMobile };
}

/* ══════════════════════════════════════════════
   SCROLL HINT
══════════════════════════════════════════════ */
function showScrollHint(delay = 4000) {
  sequenceT.push(setTimeout(() => {
    document.getElementById('scroll-hint')?.classList.add('show');
  }, delay));
}

/* ══════════════════════════════════════════════
   CLEANUP
══════════════════════════════════════════════ */
function cleanup() {
  sequenceT.forEach(t => clearTimeout(t));
  sequenceT = [];
  stopMoroccoMarker();
}

/* ══════════════════════════════════════════════
   MAIN INIT
══════════════════════════════════════════════ */
window.addEventListener('load', async () => {
  detectQuest();

  const loadText = document.getElementById('loading-text');
  if (loadText) loadText.textContent = c('loadingTxt');

  animLoadBar(0, 40);

  // Init A-Frame scene (handles stars/particles declared in HTML)
  initAFrameScene();
  animLoadBar(40, 75);

  // Short delay then hide loading, show globe
  setTimeout(() => {
    animLoadBar(75, 100);
    setTimeout(() => {
      const ls = document.getElementById('loading-screen');
      if (ls) ls.classList.add('fade');
      setTimeout(() => { if (ls) ls.remove(); }, 900);
      initGlobe();
      showScrollHint(8000);
    }, 400);
  }, 1200);
});

window.addEventListener('beforeunload', cleanup);
