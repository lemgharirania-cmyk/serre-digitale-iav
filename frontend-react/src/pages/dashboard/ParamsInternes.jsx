// src/pages/dashboard/ParamsInternes.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  Panneau d'édition des intervalles de pilotage des équipements.
//  VISUALISATION UNIQUEMENT — ne contrôle pas l'équipement réel.
//
//  À intégrer dans Seuils.jsx, après le tableau des seuils agronomiques,
//  ou en section autonome. Nécessite :
//    - dashboardAPI.getParams / saveParamsBatch dans client.js
//    - useAccess hook existant
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Save, RefreshCw, Info, Lock } from 'lucide-react'
import { dashboardAPI } from '../../api/client'
import { useAccess } from '../../hooks/useAccess'

// ── Définition des actions et leur présentation ───────────────────────────────
const ACTIONS_CONFIG = [
  {
    group: 'ventilation',
    labelFR: 'Ventilation', labelEN: 'Ventilation',
    color: '#06B6D4', emoji: '💨',
    unit: '°C',
    rows: [
      { action: 'ventilation_jour',  labelFR: 'Seuil jour',  labelEN: 'Day threshold',  hint: 'Démarre si T° >' },
      { action: 'ventilation_nuit',  labelFR: 'Seuil nuit',  labelEN: 'Night threshold', hint: 'Démarre si T° >' },
    ],
  },
  {
    group: 'chauffage',
    labelFR: 'Chauffage', labelEN: 'Heating',
    color: '#F59E0B', emoji: '🔥',
    unit: '°C',
    rows: [
      { action: 'chauffage_jour', labelFR: 'Seuil jour', labelEN: 'Day threshold',  hint: 'Démarre si T° <' },
      { action: 'chauffage_nuit', labelFR: 'Seuil nuit', labelEN: 'Night threshold', hint: 'Démarre si T° <' },
    ],
  },
  {
    group: 'humidification',
    labelFR: 'Brumisateur', labelEN: 'Humidifier',
    color: '#8B5CF6', emoji: '💧',
    unit: '%',
    rows: [
      { action: 'humidification_jour', labelFR: 'Seuil jour', labelEN: 'Day threshold',  hint: 'Démarre si HR <' },
      { action: 'humidification_nuit', labelFR: 'Seuil nuit', labelEN: 'Night threshold', hint: 'Démarre si HR <' },
    ],
  },
  {
    group: 'deshumidification',
    labelFR: 'Déshumidification', labelEN: 'Dehumidification',
    color: '#3B82F6', emoji: '🌬',
    unit: '%',
    rows: [
      { action: 'deshumidification_jour', labelFR: 'Seuil jour', labelEN: 'Day threshold',  hint: 'Démarre si HR >' },
      { action: 'deshumidification_nuit', labelFR: 'Seuil nuit', labelEN: 'Night threshold', hint: 'Démarre si HR >' },
    ],
  },
  {
    group: 'co2',
    labelFR: 'CO₂', labelEN: 'CO₂',
    color: '#22C55E', emoji: '🌿',
    unit: 'ppm',
    rows: [
      { action: 'co2_injection', labelFR: 'Injection (jour)', labelEN: 'Injection (day)',  hint: 'Injecte si CO₂ <' },
      { action: 'co2_purge',     labelFR: 'Purge (nuit)',     labelEN: 'Purge (night)',    hint: 'Purge si CO₂ >'   },
    ],
  },
]

const T = {
  FR: {
    title:   'Intervalles de pilotage',
    sub:     'Paramètres de visualisation des équipements de contrôle climatique',
    warning: 'Ces valeurs sont utilisées uniquement pour la visualisation dans le tableau de bord. Elles ne contrôlent pas l\'équipement réel — les seuils effectifs sont gérés dans l\'application locale du complexe.',
    seuil:   'Seuil', deadband: 'Deadband', unit: 'Unité',
    save:    'Enregistrer', saving: 'Enregistrement...', saved: 'Enregistré ✓',
    reset:   'Réinitialiser',
    locked:  'Accès restreint — vous pouvez consulter mais pas modifier les intervalles d\'une autre serre.',
    canEdit: 'Vous pouvez modifier les intervalles de votre serre.',
    lastUpdate: 'Dernière mise à jour',
    source:  { defaults: 'Valeurs par défaut', database: 'Personnalisé' },
  },
  EN: {
    title:   'Control intervals',
    sub:     'Visualization parameters for climate control equipment',
    warning: 'These values are used only for visualization in the dashboard. They do not control actual equipment — effective thresholds are managed in the complex\'s local application.',
    seuil:   'Threshold', deadband: 'Deadband', unit: 'Unit',
    save:    'Save', saving: 'Saving...', saved: 'Saved ✓',
    reset:   'Reset',
    locked:  'Restricted access — you can view but not edit intervals for another greenhouse.',
    canEdit: 'You can edit the intervals for your greenhouse.',
    lastUpdate: 'Last updated',
    source:  { defaults: 'Default values', database: 'Custom' },
  },
}

// ── Composant principal ───────────────────────────────────────
export default function ParamsInternes({ theme, lang, userRole, serreId }) {
  const isDark = theme === 'dark'
  const t      = T[lang] || T.FR
  const { isSuperAdmin, canAccessSerre } = useAccess(userRole)
  const canEdit = canAccessSerre(serreId)

  // ── Couleurs ──────────────────────────────────────────────
  const cardBg  = isDark ? 'rgba(16,27,46,0.85)' : '#FFFFFF'
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const ink     = isDark ? '#F1F5F9' : '#0F172A'
  const ink2    = isDark ? '#CBD5E1' : '#334155'
  const ink3    = isDark ? '#94A3B8' : '#64748B'
  const ink4    = isDark ? '#475569' : '#94A3B8'
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'
  const inputBdr = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'

  // ── State ──────────────────────────────────────────────────
  const [params,   setParams]   = useState({})  // { action: { seuil, deadband } }
  const [form,     setForm]     = useState({})  // form values (strings)
  const [source,   setSource]   = useState('defaults')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [dirty,    setDirty]    = useState(false)

  // ── Chargement ────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!serreId) return
    setLoading(true)
    try {
      const data = await dashboardAPI.getParams(serreId)
      if (data?.params) {
        setParams(data.params)
        setSource(data.source || 'defaults')
        // Initialiser le formulaire
        const init = {}
        Object.entries(data.params).forEach(([action, val]) => {
          init[action + '_seuil']    = String(val.seuil)
          init[action + '_deadband'] = String(val.deadband)
        })
        setForm(init)
      }
    } catch (e) {
      console.error('getParams error:', e)
    } finally {
      setLoading(false)
    }
  }, [serreId])

  useEffect(() => { load() }, [load])

  // ── Modification d'un champ ────────────────────────────────
  function handleChange(action, field, value) {
    setForm(f => ({ ...f, [action + '_' + field]: value }))
    setDirty(true)
  }

  // ── Réinitialiser les defaults ─────────────────────────────
  const DEFAULTS = {
    ventilation_jour:       { seuil: 25,   deadband: 2 },
    ventilation_nuit:       { seuil: 20,   deadband: 2 },
    chauffage_jour:         { seuil: 20,   deadband: 2 },
    chauffage_nuit:         { seuil: 15,   deadband: 2 },
    humidification_jour:    { seuil: 60,   deadband: 5 },
    humidification_nuit:    { seuil: 60,   deadband: 5 },
    deshumidification_jour: { seuil: 80,   deadband: 5 },
    deshumidification_nuit: { seuil: 80,   deadband: 5 },
    co2_injection:          { seuil: 1000, deadband: 50 },
    co2_purge:              { seuil: 500,  deadband: 50 },
  }

  function handleReset() {
    const init = {}
    Object.entries(DEFAULTS).forEach(([action, val]) => {
      init[action + '_seuil']    = String(val.seuil)
      init[action + '_deadband'] = String(val.deadband)
    })
    setForm(init)
    setDirty(true)
  }

  // ── Sauvegarde batch ──────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const payload = {}
      Object.keys(DEFAULTS).forEach(action => {
        const seuil    = parseFloat(form[action + '_seuil'])
        const deadband = parseFloat(form[action + '_deadband'])
        if (!isNaN(seuil) && !isNaN(deadband)) {
          payload[action] = { seuil, deadband }
        }
      })
      await dashboardAPI.saveParamsBatch(serreId, payload)
      setDirty(false)
      setSource('database')
      setToast(t.saved)
      setTimeout(() => setToast(''), 2500)
      await load()
    } catch (e) {
      console.error('saveParams error:', e)
      setToast('Erreur lors de l\'enregistrement.')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: canEdit ? inputBg : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
    border: '1px solid ' + (canEdit ? inputBdr : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)')),
    borderRadius: 8,
    padding: '5px 9px',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    color: canEdit ? ink : ink3,
    outline: 'none',
    width: 80,
    textAlign: 'right',
    cursor: canEdit ? 'text' : 'not-allowed',
    transition: 'border-color 0.15s',
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: ink3, fontSize: 13 }}>
        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
        Chargement des paramètres...
      </div>
    )
  }

  return (
    <div style={{
      background: cardBg, border: '1px solid ' + border,
      borderRadius: 18, padding: '20px 24px', marginTop: 16,
    }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(249,115,22,0.12)', color: '#F97316', flexShrink: 0,
          }}>⚙</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: ink, letterSpacing: '-0.01em' }}>
              {t.title}
            </div>
            <div style={{ fontSize: 11, color: ink3, marginTop: 1 }}>{t.sub}</div>
          </div>
        </div>

        {/* Badge source + boutons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
            background: source === 'database'
              ? (isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)')
              : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
            color: source === 'database' ? '#22C55E' : ink4,
            border: '1px solid ' + (source === 'database' ? 'rgba(34,197,94,0.25)' : border),
          }}>
            {t.source[source] || t.source.defaults}
          </span>

          {canEdit && (
            <>
              <button onClick={handleReset} title={t.reset} style={{
                height: 30, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: '1px solid ' + border, cursor: 'pointer',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                color: ink3, display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <RefreshCw size={12} /> {t.reset}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                style={{
                  height: 30, padding: '0 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  border: 'none', cursor: (saving || !dirty) ? 'not-allowed' : 'pointer',
                  background: (saving || !dirty)
                    ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                    : 'linear-gradient(135deg,#22C55E,#16A34A)',
                  color: (saving || !dirty) ? ink4 : '#fff',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.2s',
                }}>
                <Save size={12} />
                {saving ? t.saving : toast || t.save}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Bandeau avertissement visualisation ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)',
        border: '1px solid ' + (isDark ? 'rgba(249,115,22,0.25)' : 'rgba(249,115,22,0.2)'),
        borderRadius: 10, padding: '10px 14px', marginBottom: 16,
      }}>
        <AlertTriangle size={14} color="#F97316" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: isDark ? '#FED7AA' : '#92400E', lineHeight: 1.6, margin: 0 }}>
          {t.warning}
        </p>
      </div>

      {/* ── Bandeau accès restreint ── */}
      {!canEdit && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: '1px solid ' + border, borderRadius: 10,
          padding: '8px 14px', marginBottom: 16,
          fontSize: 11, color: ink3,
        }}>
          <Lock size={12} style={{ flexShrink: 0 }} />
          {t.locked}
        </div>
      )}

      {/* ── Grille des équipements ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {ACTIONS_CONFIG.map(group => (
          <div key={group.group} style={{
            borderRadius: 12, padding: '14px 16px',
            border: '1px solid ' + border,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          }}>
            {/* Titre groupe */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>{group.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: group.color }}>{lang === 'EN' ? group.labelEN : group.labelFR}</span>
              <span style={{
                marginLeft: 'auto', fontSize: 9, fontWeight: 600,
                padding: '1px 6px', borderRadius: 99,
                background: group.color + '18', color: group.color,
                border: '1px solid ' + group.color + '30',
              }}>{group.unit}</span>
            </div>

            {/* Lignes seuil + deadband */}
            {group.rows.map(row => {
              const seuilVal    = form[row.action + '_seuil']    ?? ''
              const deadbandVal = form[row.action + '_deadband'] ?? ''

              return (
                <div key={row.action} style={{
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: '1px solid ' + (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'),
                }}>
                  <div style={{ fontSize: 10, color: ink3, marginBottom: 6, fontWeight: 600 }}>
                    {lang === 'EN' ? row.labelEN : row.labelFR}
                    <span style={{ color: ink4, fontWeight: 400, marginLeft: 6 }}>— {row.hint}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Seuil */}
                    <div>
                      <div style={{ fontSize: 9, color: ink4, marginBottom: 2 }}>{t.seuil}</div>
                      <input
                        type="number"
                        value={seuilVal}
                        onChange={e => handleChange(row.action, 'seuil', e.target.value)}
                        disabled={!canEdit}
                        style={{
                          ...inputStyle,
                          borderColor: canEdit && dirty ? group.color + '60' : undefined,
                          boxShadow: canEdit && dirty ? '0 0 0 2px ' + group.color + '15' : 'none',
                        }}
                      />
                    </div>

                    {/* Deadband */}
                    <div>
                      <div style={{ fontSize: 9, color: ink4, marginBottom: 2 }}>±{t.deadband}</div>
                      <input
                        type="number"
                        value={deadbandVal}
                        onChange={e => handleChange(row.action, 'deadband', e.target.value)}
                        disabled={!canEdit}
                        style={{ ...inputStyle, width: 60 }}
                      />
                    </div>

                    {/* Affichage plage résultante */}
                    {seuilVal && deadbandVal && (
                      <div style={{ fontSize: 9, color: ink4, lineHeight: 1.5 }}>
                        <span style={{ color: group.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
                          {parseFloat(seuilVal) - parseFloat(deadbandVal)} – {parseFloat(seuilVal)}
                        </span>
                        <br />{group.unit}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Note bas de panneau ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 5,
        fontSize: 10, color: ink4, marginTop: 14, lineHeight: 1.6,
        borderTop: '1px solid ' + border, paddingTop: 10,
      }}>
        <Info size={10} style={{ flexShrink: 0, marginTop: 1 }} />
        {canEdit
          ? t.canEdit + ' ' + (lang === 'FR' ? 'Mettez à jour ces valeurs dès que l\'application locale est modifiée.' : 'Update these values whenever the local application is changed.')
          : t.locked
        }
      </div>
    </div>
  )
}
