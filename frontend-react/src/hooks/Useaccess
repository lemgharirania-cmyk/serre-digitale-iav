// src/hooks/useAccess.js
// ─────────────────────────────────────────────────────────────
// Logique d'accès basée sur le champ `unit` de la table utilisateurs
//
// Table utilisateurs (Supabase) :
//   unit = 'ALL'             → supradmin, accès total
//   unit = 'S01' … 'S05'    → admin limité à cette serre
//
// Le backend doit renvoyer `unit` dans la réponse /api/auth/login
// et le frontend le stocke dans localStorage sous sdi_user.unit
// ─────────────────────────────────────────────────────────────

export function useAccess(userRole) {
  // Lire depuis le prop userRole OU directement depuis localStorage
  const sdiUser = (() => {
    try { return JSON.parse(localStorage.getItem('sdi_user') || '{}') }
    catch { return {} }
  })()

  // Priorité : prop userRole > sdi_user.unit > sdi_user.role > 'ALL'
  const unit = userRole || sdiUser.unit || sdiUser.role || 'ALL'

  const isSuperAdmin   = unit === 'ALL' || unit === 'SUPERADMIN'
  const allowedCode    = isSuperAdmin ? null : unit          // null = tout, 'S01'…'S05' = restreint
  const allowedSerreId = allowedCode
    ? parseInt(allowedCode.replace('S0', '').replace('S', ''), 10) || null
    : null  // 1…5 ou null

  function canAccessSerre(serreCodeOrId) {
    if (isSuperAdmin) return true
    if (typeof serreCodeOrId === 'number') return serreCodeOrId === allowedSerreId
    return serreCodeOrId === allowedCode
  }

  return { isSuperAdmin, allowedCode, allowedSerreId, canAccessSerre, unit }
}
