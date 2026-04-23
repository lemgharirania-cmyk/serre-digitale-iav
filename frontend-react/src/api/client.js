// src/api/client.js
const API = 'https://serre-digitale-iav-production.up.railway.app'

function getToken() {
  return localStorage.getItem('sdi_token')
}

function authHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  }
}

async function apiFetch(url, options = {}) {
  const res = await fetch(API + url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  })
  if (res.status === 401) {
    localStorage.removeItem('sdi_token')
    window.location.href = '/login'
    return null
  }
  return res
}

// ── IoT (public, pas besoin de token) ──
export const iotAPI = {
  getLive: () => fetch(`${API}/api/iot/live`).then(r => r.json()),
  getStats: () => fetch(`${API}/api/iot/stats`).then(r => r.json()),
  getHistorique: (serreId, capteur, heures) =>
    fetch(`${API}/api/iot/historique/${serreId}?capteur=${capteur}&heures=${heures}`).then(r => r.json()),
}

// ── Auth ──
export const authAPI = {
  login: async (email, password) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      body: form,
      credentials: 'omit'
    })
    return { ok: res.ok, data: await res.json() }
  }
}

// ── Dashboard (protégé) ──
export const dashboardAPI = {
  getAlertes: (nonLues) =>
    apiFetch(`/api/dashboard/alertes${nonLues ? '?non_lues=true' : ''}`).then(r => r?.json()),
  markAlerteLue: (id) =>
    apiFetch(`/api/dashboard/alertes/${id}/lue`, { method: 'PUT' }),
  markAllLues: () =>
    apiFetch('/api/dashboard/alertes/tout-lire', { method: 'PUT' }),
  getThresholds: (serreId) =>
    apiFetch(`/api/dashboard/thresholds/${serreId}`).then(r => r?.json()),
  saveThreshold: (serreId, capteur, body) =>
    apiFetch(`/api/dashboard/thresholds/${serreId}/${capteur}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),
  getComparaison: (capteur) =>
    apiFetch(`/api/dashboard/comparaison?capteur=${capteur}&heures=24`).then(r => r?.json()),
  export: (serreId, format, heures) =>
    apiFetch(`/api/dashboard/export/${serreId}?format=${format}&heures=${heures}`),
}