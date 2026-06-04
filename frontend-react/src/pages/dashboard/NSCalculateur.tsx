// src/pages/dashboard/NSCalculateur.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Calculateur de Solution Nutritive — Géoportail AgroBioTech (IAV Hassan II)
//  Interface refondue : outil d'aide à la fertigation, layout 2 colonnes.
//  La logique scientifique reste 100 % dans ./nsEngine (inchangée).
//
//  Usage :  <NSCalculateur theme="light|dark" lang="FR|EN" greenhouse="S04" />
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import {
  FlaskConical, Leaf, Droplets, Beaker, Calculator, Download, FileText,
  Search, Plus, Trash2, Save, CheckCircle, AlertTriangle, Zap, Layers,
  ShieldCheck, Users, Gauge,
} from "lucide-react";
import {
  computeNutrientSolution, estimateEC, DEFAULT_FERTILIZERS, DEFAULT_RECIPES,
  MACRO_IONS, MICRO_IONS,
  type Ion, type IonMap, type Recipe, type Fertilizer, type CalcResult,
} from "./nsEngine";
import { listRecipes, createRecipe, deleteRecipe as apiDeleteRecipe } from "../../api/nsRecipesApi";

/* ════════════════════════════ i18n ════════════════════════════ */
const T = {
  FR: {
    title: "Solution Nutritive",
    subtitle: "Créer une solution mère adaptée à votre eau d'irrigation",
    library: "Bibliothèque de recettes", search: "Rechercher une culture…",
    newRecipe: "Nouvelle recette", official: "Officielle", community: "Community", expert: "Vérifiée Expert",
    culture: "Culture sélectionnée", group: "Famille", ecTargetLbl: "EC cible",
    ratioNK: "Rapport N:K", ratioNH4: "NH₄ : NO₃", ratioKCaMg: "K:Ca:Mg (méq)",
    params: "Paramètres de calcul", pH: "pH cible", dilution: "Dilution", tankVol: "Volume cuve (L)", acid: "Acide HCO₃",
    target: "Formule cible", targetSub: "Concentrations visées dans la solution finale",
    macros: "Macronutriments", micros: "Micronutriments",
    water: "Eau d'irrigation", waterSub: "Analyse de votre eau — laisser à 0 pour eau pure",
    ecTarget: "EC cible",
    results: "Composition obtenue", precision: "Précision de la formule",
    ion: "Ion", colTarget: "Cible", colGot: "Obtenu", colDiff: "Écart",
    dosages: "Dosages recommandés", dosagesSub: "Quantités à dissoudre dans les cuves mères",
    purewater: "Eau pure — aucun engrais nécessaire.",
    stocks: "Cuves mères", tankA: "Stock A", tankB: "Stock B", maxDil: "max",
    kpiEc: "EC obtenue", kpiNeutral: "Neutralité", kpiCost: "Coût estimé",
    balanced: "Équilibrée", check: "À vérifier",
    exportZone: "Export", exportPdf: "Rapport PDF", exportCsv: "Export CSV",
    recipeName: "Nom de la recette", save: "Enregistrer", cancel: "Annuler",
    deleteConfirm: "Supprimer cette recette ?",
    hco3Neutr: "HCO₃ neutralisé", precip: "Test de précipitation", noRisk: "aucun risque",
    note: "Estimation par la méthode séquentielle guidée du NS Calculator (Incrocci, 2011). " +
      "Ajuster selon l'EC et le pH mesurés. Ordre : acide → Ca → NH₄ → P → Mg → NO₃ → K → micro.",
    L: { hco3: "HCO₃", no3: "N-NO₃", nh4: "N-NH₄", p: "P", k: "K", ca: "Ca", mg: "Mg",
      na: "Na", so4: "S-SO₄", cl: "Cl", fe: "Fe", b: "B", cu: "Cu", zn: "Zn", mn: "Mn", mo: "Mo" },
  },
  EN: {
    title: "Nutrient Solution",
    subtitle: "Build a stock solution tailored to your irrigation water",
    library: "Recipe library", search: "Search a crop…",
    newRecipe: "New recipe", official: "Official", community: "Community", expert: "Expert-verified",
    culture: "Selected crop", group: "Family", ecTargetLbl: "Target EC",
    ratioNK: "N:K ratio", ratioNH4: "NH₄ : NO₃", ratioKCaMg: "K:Ca:Mg (meq)",
    params: "Calculation parameters", pH: "Target pH", dilution: "Dilution", tankVol: "Tank volume (L)", acid: "HCO₃ acid",
    target: "Target recipe", targetSub: "Concentrations aimed in the final solution",
    macros: "Macronutrients", micros: "Micronutrients",
    water: "Irrigation water", waterSub: "Your water analysis — leave 0 for pure water",
    ecTarget: "Target EC",
    results: "Resulting composition", precision: "Formula accuracy",
    ion: "Ion", colTarget: "Target", colGot: "Achieved", colDiff: "Δ",
    dosages: "Recommended dosages", dosagesSub: "Amounts to dissolve in the stock tanks",
    purewater: "Pure water — no fertilizers needed.",
    stocks: "Stock tanks", tankA: "Stock A", tankB: "Stock B", maxDil: "max",
    kpiEc: "Achieved EC", kpiNeutral: "Neutrality", kpiCost: "Estimated cost",
    balanced: "Balanced", check: "Check",
    exportZone: "Export", exportPdf: "PDF report", exportCsv: "CSV export",
    recipeName: "Recipe name", save: "Save", cancel: "Cancel",
    deleteConfirm: "Delete this recipe?",
    hco3Neutr: "HCO₃ neutralized", precip: "Precipitation test", noRisk: "no risk",
    note: "Estimated with the guided sequential method of the NS Calculator (Incrocci, 2011). " +
      "Adjust to measured EC and pH. Order: acid → Ca → NH₄ → P → Mg → NO₃ → K → micro.",
    L: { hco3: "HCO₃", no3: "N-NO₃", nh4: "N-NH₄", p: "P", k: "K", ca: "Ca", mg: "Mg",
      na: "Na", so4: "S-SO₄", cl: "Cl", fe: "Fe", b: "B", cu: "Cu", zn: "Zn", mn: "Mn", mo: "Mo" },
  },
};

const TARGET_MACROS: Ion[] = ["no3", "nh4", "p", "k", "ca", "mg", "so4"];
const TARGET_MICROS: Ion[] = ["fe", "b", "cu", "zn", "mn", "mo"];
const WATER_IONS: Ion[] = ["hco3", "no3", "nh4", "p", "k", "ca", "mg", "so4", "na", "cl"];
const RESULT_IONS: Ion[] = ["no3", "nh4", "p", "k", "ca", "mg", "so4", "na", "cl", ...MICRO_IONS];

const fmt = (n: number, d = 1) => (Math.abs(n) < 1e-9 ? "0" : n.toFixed(d));
const mass = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(g >= 10000 ? 0 : 1)} kg` : `${Math.round(g)} g`);

/* ════════════════════════════ Composant ════════════════════════════ */
export default function NSCalculateur({
  theme = "light", lang = "FR", greenhouse,
}: { theme?: "light" | "dark"; lang?: "FR" | "EN"; greenhouse?: string }) {
  const t = T[lang];
  const dark = theme === "dark";

  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const recipes = useMemo(() => [...DEFAULT_RECIPES, ...customRecipes], [customRecipes]);
  const [selectedId, setSelectedId] = useState("tomato");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Partial<IonMap>>(DEFAULT_RECIPES.find((r) => r.id === "tomato")!.target);
  const [water, setWater] = useState<Partial<IonMap>>({});
  const [pH, setPH] = useState(5.7);
  const [dilution, setDilution] = useState(200);
  const [tankVolume, setTankVolume] = useState(100);
  const [acidId, setAcidId] = useState("hno3");
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const fertilizers: Fertilizer[] = DEFAULT_FERTILIZERS;

  useEffect(() => {
    listRecipes(greenhouse).then(setCustomRecipes).catch(() => setCustomRecipes([]));
  }, [greenhouse]);

  const result: CalcResult = useMemo(
    () => computeNutrientSolution(target, water, { pH, dilution, tankVolume, acidId, fertilizers }),
    [target, water, pH, dilution, tankVolume, acidId, fertilizers]
  );

  // Précision : 1 - erreur relative moyenne sur les ions ciblés
  const precision = useMemo(() => {
    const ions = [...MACRO_IONS, ...MICRO_IONS].filter((i) => (result.target[i] || 0) > 0);
    if (!ions.length) return 100;
    const err = ions.reduce((s, i) => s + Math.min(1, Math.abs(result.difference[i]) / result.target[i]), 0) / ions.length;
    return Math.max(0, Math.round((1 - err) * 100));
  }, [result]);

  const ecLive = useMemo(() => estimateEC(target), [target]);
  const filtered = useMemo(
    () => recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [recipes, search]
  );
  const selected = recipes.find((r) => r.id === selectedId);

  const selectRecipe = (r: Recipe) => { setSelectedId(r.id); setTarget({ ...r.target }); };

  const saveCurrent = async () => {
    if (!newName.trim()) return;
    const r = await createRecipe({ name: newName.trim(), target: { ...target }, ec_target: estimateEC(target), greenhouse });
    setCustomRecipes((l) => [r, ...l.filter((x) => x.id !== r.id)]);
    setSelectedId(r.id); setSaving(false); setNewName("");
  };
  const deleteRecipe = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await apiDeleteRecipe(id);
    setCustomRecipes((l) => l.filter((r) => r.id !== id));
  };

  const exportCSV = () => {
    const rows = [
      [t.dosages, t.colGot, "unit", "g/cuve", "€/m³", "stock"],
      ...result.doses.map((d) => [d.name, fmt(d.dose, 2), d.unit, fmt(d.gramsPerTank, 0), fmt(d.costPerM3, 3), d.tank]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `solution_${selectedId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const exportPDF = () => buildPrintableReport(selected?.name ?? "—", result, t, pH, dilution, tankVolume);

  /* ratios agronomiques (culture info) */
  const k = target.k || 0, ca = target.ca || 0, mg = target.mg || 0;
  const meqSum = k + 2 * ca + 2 * mg;
  const ratioKCaMg = meqSum
    ? `${Math.round((k / meqSum) * 100)} : ${Math.round((2 * ca / meqSum) * 100)} : ${Math.round((2 * mg / meqSum) * 100)}`
    : "—";
  const ratioNK = target.k ? (((target.no3 || 0) + (target.nh4 || 0)) / target.k).toFixed(2) : "—";
  const ratioNH4 = target.no3 ? ((target.nh4 || 0) / target.no3).toFixed(2) : "—";

  const badgeOf = (r: Recipe): "official" | "community" | "expert" =>
    !r.validated ? "community" : r.group === "Scientifiques" ? "expert" : "official";
  const badgeIcon = { official: <CheckCircle size={11} />, community: <Users size={11} />, expert: <ShieldCheck size={11} /> };
  const badgeText = { official: t.official, community: t.community, expert: t.expert };

  const field = (ion: Ion, state: Partial<IonMap>, set: (u: (s: Partial<IonMap>) => Partial<IonMap>) => void, micro: boolean) => (
    <Field key={ion} label={t.L[ion]} unit={micro ? "µM" : "mM"} step={micro ? 1 : 0.1}
      value={state[ion] ?? 0} onChange={(v) => set((s) => ({ ...s, [ion]: v }))} />
  );

  return (
    <div className={`ns-root${dark ? " dark" : ""}`}>
      <style>{CSS}</style>

      {/* ───────── HEADER ───────── */}
      <header className="ns-header">
        <div className="ns-h-left">
          <div className="ns-logo"><FlaskConical size={24} /></div>
          <div>
            <h1 className="ns-h-title">{t.title}</h1>
            <p className="ns-h-sub">{t.subtitle}</p>
          </div>
        </div>
        <div className="ns-h-actions">
          <button className="ns-btn" onClick={exportCSV}><FileText size={16} /> {t.exportCsv}</button>
          <button className="ns-btn ns-btn-primary" onClick={exportPDF}><Download size={16} /> {t.exportPdf}</button>
        </div>
      </header>

      <div className="ns-grid">
        {/* ═══════ COLONNE GAUCHE ═══════ */}
        <aside className="ns-col">
          {/* Bibliothèque */}
          <div className="ns-card">
            <h2 className="ns-card-title">
              <span className="ic"><Leaf size={18} /></span> {t.library}
              <button className="ns-addbtn" onClick={() => setSaving(true)} title={t.newRecipe}><Plus size={16} /></button>
            </h2>
            <div className="ns-search">
              <Search size={15} className="ic" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
            </div>
            <div className="ns-recipes">
              {filtered.map((r) => {
                const b = badgeOf(r);
                return (
                  <div key={r.id} className={`ns-recipe${selectedId === r.id ? " sel" : ""}`} onClick={() => selectRecipe(r)}>
                    <div>
                      <div className="ns-recipe-name">{r.name}</div>
                      <div className="ns-recipe-meta">EC {fmt(estimateEC(r.target), 2)} dS/m</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`ns-badge ${b}`}>{badgeIcon[b]} {badgeText[b]}</span>
                      {!r.validated && (
                        <button className="ns-recipe-del" onClick={(e) => { e.stopPropagation(); deleteRecipe(r.id); }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {saving && (
              <div className="ns-saveform">
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.recipeName} />
                <div className="ns-row" style={{ marginTop: 8 }}>
                  <button className="ns-btn ns-btn-primary" style={{ flex: 1 }} onClick={saveCurrent}><Save size={14} /> {t.save}</button>
                  <button className="ns-btn" onClick={() => { setSaving(false); setNewName(""); }}>{t.cancel}</button>
                </div>
              </div>
            )}
          </div>

          {/* Culture sélectionnée */}
          {selected && (
            <div className="ns-card">
              <h2 className="ns-card-title"><span className="ic"><Beaker size={18} /></span> {t.culture}</h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{selected.name}</span>
                <span className={`ns-badge ${badgeOf(selected)}`}>{badgeIcon[badgeOf(selected)]} {badgeText[badgeOf(selected)]}</span>
              </div>
              <div className="ns-info-row"><span className="ns-info-k">{t.group}</span><span className="ns-info-v">{selected.group ?? "—"}</span></div>
              <div className="ns-info-row"><span className="ns-info-k">{t.ecTargetLbl}</span><span className="ns-info-v">{fmt(ecLive, 2)} dS/m</span></div>
              <div className="ns-info-row"><span className="ns-info-k">{t.ratioNK}</span><span className="ns-info-v">{ratioNK}</span></div>
              <div className="ns-info-row"><span className="ns-info-k">{t.ratioNH4}</span><span className="ns-info-v">{ratioNH4}</span></div>
              <div className="ns-info-row"><span className="ns-info-k">{t.ratioKCaMg}</span><span className="ns-info-v">{ratioKCaMg}</span></div>
            </div>
          )}
        </aside>

        {/* ═══════ COLONNE DROITE ═══════ */}
        <main className="ns-col">
          {/* KPIs */}
          <div className="ns-kpis">
            <div className="ns-kpi ok">
              <div className="ns-kpi-label"><Zap size={14} /> {t.kpiEc}</div>
              <div className="ns-kpi-val">{fmt(result.ecAchieved, 2)}</div>
              <div className="ns-kpi-unit">dS/m</div>
            </div>
            <div className={`ns-kpi ${result.neutrality.ok ? "ok" : "warn"}`}>
              <div className="ns-kpi-label">{result.neutrality.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />} {t.kpiNeutral}</div>
              <div className="ns-kpi-val" style={{ fontSize: 22 }}>{result.neutrality.ok ? t.balanced : t.check}</div>
              <div className="ns-kpi-unit">Δ {fmt(result.neutrality.delta, 2)} méq/L</div>
            </div>
            <div className="ns-kpi">
              <div className="ns-kpi-label"><Gauge size={14} /> {t.kpiCost}</div>
              <div className="ns-kpi-val">{fmt(result.totalCostPerM3, 2)}</div>
              <div className="ns-kpi-unit">€/m³</div>
            </div>
          </div>

          {/* Paramètres */}
          <div className="ns-card">
            <h2 className="ns-card-title"><span className="ic"><Calculator size={18} /></span> {t.params}</h2>
            <div className="ns-params">
              <Field label={t.pH} unit="" step={0.1} value={pH} onChange={setPH} />
              <Field label={t.dilution} unit="×" step={10} value={dilution} onChange={(v) => setDilution(v || 1)} />
              <Field label={t.tankVol} unit="L" step={10} value={tankVolume} onChange={(v) => setTankVolume(v || 1)} />
              <label className="ns-field">
                <span className="ns-field-label">{t.acid}</span>
                <span className="ns-field-row">
                  <select className="ns-field-input" value={acidId} onChange={(e) => setAcidId(e.target.value)}>
                    {fertilizers.filter((f) => f.kind === "acid").map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </span>
              </label>
            </div>
            {result.acidNeutralized > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
                {t.hco3Neutr} : <b style={{ color: "var(--text)" }}>{fmt(result.acidNeutralized, 2)} mmol/L</b>
              </div>
            )}
          </div>

          {/* Formule cible */}
          <div className="ns-card">
            <h2 className="ns-card-title"><span className="ic"><Beaker size={18} /></span> {t.target}</h2>
            <p className="ns-card-sub">{t.targetSub}</p>
            <div className="ns-pill"><Zap size={14} /> {t.ecTarget} : {fmt(ecLive, 2)} dS/m</div>
            <div className="ns-subhead">{t.macros}</div>
            <div className="ns-fields" style={{ marginBottom: 16 }}>{TARGET_MACROS.map((i) => field(i, target, setTarget, false))}</div>
            <div className="ns-subhead">{t.micros}</div>
            <div className="ns-fields">{TARGET_MICROS.map((i) => field(i, target, setTarget, true))}</div>
          </div>

          {/* Eau d'irrigation */}
          <div className="ns-card">
            <h2 className="ns-card-title"><span className="ic"><Droplets size={18} /></span> {t.water}</h2>
            <p className="ns-card-sub">{t.waterSub}</p>
            <div className="ns-fields">{WATER_IONS.map((i) => field(i, water, setWater, MICRO_IONS.includes(i)))}</div>
          </div>

          {/* Composition obtenue */}
          <div className="ns-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <h2 className="ns-card-title" style={{ margin: 0 }}><span className="ic"><Layers size={18} /></span> {t.results}</h2>
              <div className="ns-precision">
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{t.precision}</span>
                <span className="ns-bar"><span style={{ width: `${precision}%` }} /></span>
                <span className="ns-precision-val">{precision}%</span>
              </div>
            </div>
            <table className="ns-table" style={{ marginTop: 14 }}>
              <thead><tr><th>{t.ion}</th><th>{t.colTarget}</th><th>{t.colGot}</th><th>{t.colDiff}</th></tr></thead>
              <tbody>
                {RESULT_IONS.map((i) => {
                  const d = result.difference[i];
                  const tol = MICRO_IONS.includes(i) ? 2 : 0.25;
                  const cls = Math.abs(d) <= tol ? "ns-ok" : Math.abs(d) <= tol * 3 ? "ns-warn" : "ns-bad";
                  return (
                    <tr key={i}>
                      <td className="name">{t.L[i]}</td>
                      <td>{fmt(result.target[i], 2)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(result.achieved[i], 2)}</td>
                      <td className={cls}>{d >= 0 ? "+" : ""}{fmt(d, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Dosages */}
          <div className="ns-card">
            <h2 className="ns-card-title"><span className="ic"><Layers size={18} /></span> {t.dosages}</h2>
            <p className="ns-card-sub">{t.dosagesSub}</p>
            {result.doses.length === 0 ? (
              <p style={{ fontSize: 14, color: "var(--muted)" }}>{t.purewater}</p>
            ) : (
              <div className="ns-doses">
                {result.doses.map((d) => (
                  <div className="ns-dose" key={d.fertilizerId}>
                    <div className="ns-dose-top">
                      <span className="ns-dose-name">{d.name}</span>
                      <span className={`ns-tank ${d.tank}`}>{d.tank}</span>
                    </div>
                    <div className="ns-dose-formula">{d.formula ?? ""}</div>
                    <div className="ns-dose-qty">{mass(d.gramsPerTank)}</div>
                    <div className="ns-dose-sub">{fmt(d.dose, 2)} {d.unit} · {fmt(d.costPerM3, 3)} €/m³</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cuves A/B */}
          <div>
            <h2 className="ns-card-title" style={{ marginBottom: 12 }}><span className="ic"><FlaskConical size={18} /></span> {t.stocks}</h2>
            <div className="ns-stocks">
              <StockCard tank="A" title={t.tankA} lines={result.stockA} summary={result.precipSummary.A} t={t} />
              <StockCard tank="B" title={t.tankB} lines={result.stockB} summary={result.precipSummary.B} t={t} />
            </div>
          </div>

          {/* Précipitation (résumé) */}
          <div className="ns-card">
            <h2 className="ns-card-title"><span className="ic"><AlertTriangle size={18} /></span> {t.precip}</h2>
            {result.dilutionWarning && <div className="ns-warn-box">{result.dilutionWarning}</div>}
            <PrecipSummary result={result} t={t} dilution={dilution} />
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, lineHeight: 1.6 }}>{t.note}</p>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ════════════════════════ sous-composants ════════════════════════ */
function Field({ label, value, unit, step, onChange }: {
  label: string; value: number; unit: string; step: number; onChange: (v: number) => void;
}) {
  return (
    <label className="ns-field">
      <span className="ns-field-label">{label}</span>
      <span className="ns-field-row">
        <input className="ns-field-input" type="number" step={step} min={0} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
        {unit && <span className="ns-field-unit">{unit}</span>}
      </span>
    </label>
  );
}

function StockCard({ tank, title, lines, summary, t }: {
  tank: "A" | "B"; title: string; lines: CalcResult["stockA"];
  summary: CalcResult["precipSummary"]["A"]; t: typeof T["FR"];
}) {
  return (
    <div className="ns-stock">
      <div className="ns-stock-head">
        <span className={`ns-tank ${tank}`}>{tank}</span>
        <span className="ns-stock-title">{title}</span>
        <span className="ns-stock-dil" style={{ color: summary.riskCount ? "var(--red)" : "var(--g)" }}>
          {t.maxDil} {summary.maxSafeDilution > 9999 ? "∞" : Math.round(summary.maxSafeDilution)}×
        </span>
      </div>
      {lines.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>—</p>
      ) : (
        <ul className="ns-stock-list">
          {lines.map((l) => (
            <li className="ns-stock-item" key={l.fertilizerId}>
              <span>{l.name}</span><b>{mass(l.gramsPerTank)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PrecipSummary({ result, t, dilution }: { result: CalcResult; t: typeof T["FR"]; dilution: number }) {
  const risks = result.precipitation.filter((p) => p.risk && p.tank !== "single");
  if (risks.length === 0)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--g)", fontSize: 13, fontWeight: 600 }}>
        <CheckCircle size={16} /> {t.noRisk} ({t.maxDil} {Math.round(Math.min(result.precipSummary.A.maxSafeDilution, result.precipSummary.B.maxSafeDilution))}× · {dilution}× {t.dilution})
      </div>
    );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {risks.map((r, i) => (
        <span key={i} className="ns-badge community" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
          {r.salt} ({r.tank}) ×{r.ratio.toFixed(1)}
        </span>
      ))}
    </div>
  );
}

/* Rapport imprimable — export PDF via la fonction d'impression du navigateur. */
function buildPrintableReport(name: string, r: CalcResult, t: typeof T["FR"], pH: number, dil: number, vol: number) {
  const w = window.open("", "_blank");
  if (!w) { alert("Autorise les fenêtres pop-up pour générer le PDF."); return; }
  const rows = r.doses.map((d) =>
    `<tr><td>${d.name}${d.formula ? " <i>(" + d.formula + ")</i>" : ""}</td><td>${fmt(d.dose, 2)} ${d.unit}</td>` +
    `<td>${mass(d.gramsPerTank)}</td><td>${d.tank}</td><td>${fmt(d.costPerM3, 3)}</td></tr>`).join("");
  const comp = RESULT_IONS.map((i) =>
    `<tr><td>${t.L[i]}</td><td>${fmt(r.target[i], 2)}</td><td>${fmt(r.achieved[i], 2)}</td><td>${fmt(r.difference[i], 2)}</td></tr>`).join("");
  const pl = (label: string, s: CalcResult["precipSummary"]["A"], risks: string[]) =>
    `<li><b>${label}</b> — ${t.maxDil} ${Math.round(s.maxSafeDilution)}× ` +
    (risks.length ? `<span style="color:#b91c1c">(${risks.join(", ")})</span>` : `— ${t.noRisk}`) + `</li>`;
  const rA = r.precipitation.filter((p) => p.tank === "A" && p.risk).map((p) => p.salt);
  const rB = r.precipitation.filter((p) => p.tank === "B" && p.risk).map((p) => p.salt);
  w.document.write(`<html lang="fr"><head><meta charset="utf-8"><title>${t.title} — ${name}</title><style>
    *{box-sizing:border-box}body{font-family:system-ui,Segoe UI,sans-serif;padding:28px;color:#1E293B;max-width:820px;margin:auto}
    h1{font-size:20px;margin:0 0 2px}.sub{color:#64748B;font-size:12px;margin:0 0 14px}
    .meta{background:#F1F5F9;border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:16px}
    h2{font-size:14px;margin:18px 0 6px;color:#1F6F46}table{width:100%;border-collapse:collapse;margin:4px 0}
    th,td{border:1px solid #CBD5E1;padding:5px 8px;text-align:left;font-size:12px}th{background:#2F9A64;color:#fff}
    tbody tr:nth-child(even){background:#F8FAFC}ul{font-size:13px;margin:4px 0;padding-left:18px}.note{font-size:11px;color:#64748B;margin-top:16px}
    @media print{body{padding:0}}</style></head><body>
    <h1>${t.title} — ${name}</h1><p class="sub">NS Calculator v1.2 · L. Incrocci · IAV Hassan II</p>
    <div class="meta">${t.kpiEc}: <b>${fmt(r.ecAchieved, 2)} dS/m</b> &nbsp;|&nbsp; pH ${pH} &nbsp;|&nbsp; ${t.dilution} ${dil}× &nbsp;|&nbsp; ${t.tankVol} ${vol} L &nbsp;|&nbsp; ${t.kpiCost}: <b>${fmt(r.totalCostPerM3, 2)} €/m³</b></div>
    <h2>${t.dosages}</h2><table><thead><tr><th>${t.dosages}</th><th>${t.colGot}</th><th>g/cuve</th><th>A/B</th><th>€/m³</th></tr></thead><tbody>${rows || `<tr><td colspan="5">${t.purewater}</td></tr>`}</tbody></table>
    <h2>${t.results}</h2><table><thead><tr><th>${t.ion}</th><th>${t.colTarget}</th><th>${t.colGot}</th><th>${t.colDiff}</th></tr></thead><tbody>${comp}</tbody></table>
    <h2>${t.precip}</h2><ul>${pl(t.tankA, r.precipSummary.A, rA)}${pl(t.tankB, r.precipSummary.B, rB)}</ul>
    <p class="note">${t.note}</p><script>window.onload=function(){window.print();}<\/script></body></html>`);
  w.document.close(); w.focus();
}

/* ════════════════════════ styles (scoped .ns-) ════════════════════════ */
const CSS = `
.ns-root{--g:#2F9A64;--gd:#1F6F46;--gsoft:#EAF6F0;--bg:#F7F8FA;--card:#FFFFFF;--text:#1E293B;--muted:#64748B;
  --border:#E7EAF0;--amber:#C2740E;--amber-soft:#FBF1E3;--blue:#2563EB;--blue-soft:#E8EEFD;--red:#DC2626;--red-soft:#FCECEC;
  --shadow:0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.06);--radius:16px;
  background:var(--bg);color:var(--text);min-height:100%;width:100%;box-sizing:border-box;padding:24px;
  font-family:'Outfit',system-ui,-apple-system,'Segoe UI',sans-serif;}
.ns-root.dark{--gsoft:rgba(47,154,100,.14);--bg:#0B1220;--card:#111B2E;--text:#F1F5F9;--muted:#94A3B8;--border:rgba(255,255,255,.09);
  --amber-soft:rgba(194,116,14,.18);--blue-soft:rgba(37,99,235,.18);--red-soft:rgba(220,38,38,.16);--shadow:0 1px 3px rgba(0,0,0,.45);}
.ns-root *{box-sizing:border-box}
.ns-root input,.ns-root select,.ns-root button{font-family:inherit}
.ns-root input[type=number]::-webkit-outer-spin-button,.ns-root input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}

.ns-header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.ns-h-left{display:flex;align-items:center;gap:14px}
.ns-logo{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#2F9A64,#1F6F46);box-shadow:0 8px 18px rgba(47,154,100,.32)}
.ns-h-title{font-size:25px;font-weight:800;letter-spacing:-.025em;margin:0}
.ns-h-sub{font-size:13.5px;color:var(--muted);margin:3px 0 0}
.ns-h-actions{display:flex;gap:10px}

.ns-btn{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;padding:10px 16px;border-radius:11px;cursor:pointer;border:1px solid var(--border);background:var(--card);color:var(--text);transition:all .15s}
.ns-btn:hover{border-color:var(--g);color:var(--g)}
.ns-btn-primary{background:var(--g);border-color:var(--g);color:#fff}
.ns-btn-primary:hover{background:var(--gd);border-color:var(--gd);color:#fff}

.ns-grid{display:grid;grid-template-columns:minmax(0,.4fr) minmax(0,1fr);gap:20px;align-items:start}
@media(max-width:1024px){.ns-grid{grid-template-columns:1fr}}
.ns-col{display:flex;flex-direction:column;gap:20px}

.ns-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px;box-shadow:var(--shadow)}
.ns-card-title{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:700;margin:0 0 14px}
.ns-card-title .ic{color:var(--g);display:flex}
.ns-card-sub{font-size:12.5px;color:var(--muted);margin:-8px 0 14px}

.ns-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:640px){.ns-kpis{grid-template-columns:1fr}}
.ns-kpi{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;box-shadow:var(--shadow)}
.ns-kpi-label{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);font-weight:600;margin-bottom:9px}
.ns-kpi-val{font-size:29px;font-weight:800;line-height:1;letter-spacing:-.02em}
.ns-kpi-unit{font-size:11.5px;color:var(--muted);margin-top:5px}
.ns-kpi.ok .ns-kpi-val{color:var(--g)}.ns-kpi.warn .ns-kpi-val{color:var(--amber)}

.ns-params{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:640px){.ns-params{grid-template-columns:1fr 1fr}}
.ns-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(94px,1fr));gap:10px}
.ns-field{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:9px 11px;transition:border-color .15s,background .15s;cursor:text}
.ns-field:focus-within{border-color:var(--g);background:var(--card)}
.ns-field-label{font-size:11px;font-weight:700;color:var(--muted)}
.ns-field-row{display:flex;align-items:baseline;gap:4px;margin-top:3px}
.ns-field-input{width:100%;border:none;background:transparent;font-size:17px;font-weight:700;color:var(--text);outline:none;padding:0}
.ns-field-input select,.ns-field select{font-size:14px}
select.ns-field-input{font-size:14px;font-weight:600;cursor:pointer}
.ns-field-unit{font-size:11px;color:var(--muted);font-weight:600;white-space:nowrap}
.ns-subhead{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:0 0 9px}
.ns-pill{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--gd);background:var(--gsoft);padding:6px 12px;border-radius:9px;margin-bottom:16px}
.ns-root.dark .ns-pill{color:var(--g)}

.ns-search{position:relative;margin:0 0 12px}
.ns-search input{width:100%;border:1px solid var(--border);border-radius:11px;padding:10px 12px 10px 34px;background:var(--bg);color:var(--text);font-size:13px;outline:none}
.ns-search input:focus{border-color:var(--g);background:var(--card)}
.ns-search .ic{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted)}

.ns-recipes{display:flex;flex-direction:column;gap:8px;max-height:380px;overflow:auto;padding-right:2px}
.ns-recipe{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--border);border-radius:12px;padding:11px 13px;cursor:pointer;transition:all .15s;background:var(--card)}
.ns-recipe:hover{border-color:var(--g)}
.ns-recipe.sel{border-color:var(--g);background:var(--gsoft);box-shadow:0 2px 10px rgba(47,154,100,.16)}
.ns-recipe-name{font-size:14px;font-weight:600}
.ns-recipe-meta{font-size:12px;color:var(--muted);margin-top:2px}
.ns-recipe-del{opacity:0;color:var(--red);background:none;border:none;cursor:pointer;display:flex;transition:opacity .15s}
.ns-recipe:hover .ns-recipe-del{opacity:1}
.ns-addbtn{margin-left:auto;width:30px;height:30px;border-radius:9px;background:var(--g);color:#fff;border:none;cursor:pointer;display:grid;place-items:center;transition:background .15s}
.ns-addbtn:hover{background:var(--gd)}
.ns-saveform{margin-top:12px;border:1px dashed var(--border);border-radius:12px;padding:12px;background:var(--bg)}
.ns-saveform input{width:100%;border:1px solid var(--border);border-radius:9px;padding:8px 10px;background:var(--card);color:var(--text);font-size:13px;outline:none}
.ns-saveform input:focus{border-color:var(--g)}
.ns-row{display:flex;gap:8px}

.ns-badge{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:7px;white-space:nowrap}
.ns-badge.official{background:var(--gsoft);color:var(--gd)}
.ns-badge.community{background:var(--amber-soft);color:var(--amber)}
.ns-badge.expert{background:var(--blue-soft);color:var(--blue)}
.ns-root.dark .ns-badge.official{color:var(--g)}

.ns-info-row{display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-top:1px solid var(--border)}
.ns-info-k{color:var(--muted)}.ns-info-v{font-weight:600}

.ns-precision{display:flex;align-items:center;gap:9px}
.ns-precision-val{font-size:15px;font-weight:800;color:var(--g)}
.ns-bar{width:110px;height:6px;border-radius:99px;background:var(--border);overflow:hidden}
.ns-bar>span{display:block;height:100%;background:var(--g);border-radius:99px;transition:width .3s}

.ns-table{width:100%;border-collapse:collapse;font-size:13px}
.ns-table th{text-align:left;font-size:11px;text-transform:uppercase;color:var(--muted);font-weight:700;padding:0 8px 8px;letter-spacing:.04em}
.ns-table th:not(:first-child),.ns-table td:not(:first-child){text-align:right}
.ns-table td{padding:7px 8px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums}
.ns-table td.name{font-weight:600}
.ns-ok{color:var(--g)}.ns-warn{color:var(--amber)}.ns-bad{color:var(--red)}

.ns-doses{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:12px}
.ns-dose{border:1px solid var(--border);border-radius:13px;padding:13px;background:var(--card);transition:border-color .15s}
.ns-dose:hover{border-color:var(--g)}
.ns-dose-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.ns-dose-name{font-size:13.5px;font-weight:700;line-height:1.25}
.ns-dose-formula{font-size:11px;color:var(--muted);margin-top:3px;min-height:14px}
.ns-dose-qty{font-size:23px;font-weight:800;margin-top:9px;letter-spacing:-.02em}
.ns-dose-sub{font-size:11px;color:var(--muted);margin-top:3px}

.ns-tank{display:inline-grid;place-items:center;min-width:22px;height:22px;border-radius:7px;font-size:12px;font-weight:800;padding:0 6px}
.ns-tank.A{background:#E4F2FB;color:#0B7DC4}.ns-tank.B{background:var(--amber-soft);color:var(--amber)}
.ns-root.dark .ns-tank.A{background:rgba(11,125,196,.2);color:#63B6EC}

.ns-stocks{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:640px){.ns-stocks{grid-template-columns:1fr}}
.ns-stock{border:1px solid var(--border);border-radius:var(--radius);padding:16px;background:var(--card);box-shadow:var(--shadow)}
.ns-stock-head{display:flex;align-items:center;gap:9px;margin-bottom:12px}
.ns-stock-title{font-size:14px;font-weight:700}
.ns-stock-dil{margin-left:auto;font-size:11.5px;font-weight:700}
.ns-stock-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ns-stock-item{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:9px 11px;border-radius:9px;background:var(--bg)}
.ns-stock-item b{font-weight:700}
.ns-warn-box{background:var(--red-soft);color:var(--red);border-radius:10px;padding:9px 12px;font-size:12px;margin-bottom:12px}
`;
