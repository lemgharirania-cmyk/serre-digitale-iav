// src/pages/dashboard/NSCalculateur.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Calculateur de Solution Nutritive — Géoportail AgroBioTech (IAV Hassan II)
//  Reproduction du tableur "NS Calculator v1.2" (L. Incrocci, EU EUPHOROS).
//
//  Usage :  <NSCalculateur theme="dark|light" lang="FR|EN" />
//  (theme / lang transmis par le DashboardLayout, comme les autres pages)
//
//  Toute la logique scientifique est isolée dans ./nsEngine (testable à part).
//  Dépendances : react, lucide-react, tailwind.  PDF : jspdf + jspdf-autotable
//  (import dynamique ; repli sur window.print() si absent).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import {
  FlaskConical, Leaf, Droplets, Beaker, Calculator, Download, RotateCcw,
  CheckCircle, AlertTriangle, Search, Plus, Trash2, Save, ChevronDown,
  ChevronUp, Layers, Zap, Info, FileText,
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
    subtitle: "NS Calculator v1.2 · L. Incrocci (Univ. Pise / EU EUPHOROS) · adapté IAV Hassan II",
    library: "Bibliothèque de recettes", search: "Rechercher une culture…",
    official: "Officielle", custom: "Personnalisée", newRecipe: "Nouvelle recette",
    water: "Eau d'irrigation", waterSub: "mM (macro) · µM (micro) — laisser à 0 pour eau pure",
    target: "Formule cible", targetSub: "mM (macro) · µM (Fe, B, Cu, Zn, Mn, Mo)",
    params: "Paramètres", pH: "pH cible", dilution: "Dilution (×)",
    tankVol: "Volume cuve mère (L)", acid: "Acide (neutralisation HCO₃)",
    macros: "Macroéléments", micros: "Microéléments",
    results: "Composition obtenue", target2: "Cible", achieved: "Obtenu", diff: "Écart",
    dosages: "Dosages recommandés", fert: "Engrais", dose: "Dose", perTank: "g / cuve",
    cost: "Coût", ecTarget: "EC cible", ecReal: "EC obtenue", neutrality: "Neutralité",
    balanced: "Équilibrée", check: "À vérifier", totalCost: "Coût total",
    tanks: "Cuves mères (A / B)", tankA: "Cuve A", tankB: "Cuve B",
    precip: "Test de précipitation", precipOk: "Aucun risque détecté",
    precipSingle: "Si cuve unique (sans séparation A/B) :",
    maxDil: "Dilution max sûre", limiting: "sel limitant", satIndex: "indice de sursaturation",
    precipExplain: "Produit ionique comparé au produit de solubilité (Kₚₛ) dans la cuve concentrée. " +
      "Un indice > 1 indique un risque de précipitation. La séparation A/B évite le contact Ca²⁺ ↔ SO₄²⁻/PO₄³⁻.",
    noRiskTank: "aucun risque",
    waterQuality: "Qualité de l'eau", exportPdf: "Rapport PDF", exportCsv: "CSV",
    reset: "Réinitialiser", recipeName: "Nom de la recette", saveRecipe: "Enregistrer",
    cancel: "Annuler", deleteConfirm: "Supprimer cette recette ?",
    purewater: "Eau pure — apports uniquement par les engrais.",
    note: "Estimation d'après la méthode séquentielle guidée du tableur NS Calculator (Incrocci, 2011). " +
      "Ajuster selon l'EC et le pH mesurés (cible 5.5–6.5). Ordre : acide → Ca → NH₄ → P → Mg → NO₃ → K → micro.",
    hco3Neutr: "HCO₃ neutralisé", residual: "résidu cible",
    ion: { hco3: "HCO₃", no3: "N-NO₃", nh4: "N-NH₄", p: "P", k: "K", ca: "Ca", mg: "Mg",
      na: "Na", so4: "S-SO₄", cl: "Cl", fe: "Fe", b: "B", cu: "Cu", zn: "Zn", mn: "Mn", mo: "Mo" },
  },
  EN: {
    title: "Nutrient Solution",
    subtitle: "NS Calculator v1.2 · L. Incrocci (Univ. Pisa / EU EUPHOROS) · adapted for IAV Hassan II",
    library: "Recipe library", search: "Search a crop…",
    official: "Official", custom: "Custom", newRecipe: "New recipe",
    water: "Irrigation water", waterSub: "mM (macro) · µM (micro) — leave 0 for pure water",
    target: "Target recipe", targetSub: "mM (macro) · µM (Fe, B, Cu, Zn, Mn, Mo)",
    params: "Parameters", pH: "Target pH", dilution: "Dilution (×)",
    tankVol: "Stock tank volume (L)", acid: "Acid (HCO₃ neutralization)",
    macros: "Macronutrients", micros: "Micronutrients",
    results: "Resulting composition", target2: "Target", achieved: "Achieved", diff: "Δ",
    dosages: "Recommended dosages", fert: "Fertilizer", dose: "Dose", perTank: "g / tank",
    cost: "Cost", ecTarget: "Target EC", ecReal: "Achieved EC", neutrality: "Neutrality",
    balanced: "Balanced", check: "Check", totalCost: "Total cost",
    tanks: "Stock tanks (A / B)", tankA: "Tank A", tankB: "Tank B",
    precip: "Precipitation test", precipOk: "No risk detected",
    precipSingle: "If single tank (no A/B split):",
    maxDil: "Max safe dilution", limiting: "limiting salt", satIndex: "supersaturation index",
    precipExplain: "Ion product vs solubility product (Kₛₚ) in the concentrated tank. " +
      "An index > 1 indicates a precipitation risk. The A/B split prevents Ca²⁺ ↔ SO₄²⁻/PO₄³⁻ contact.",
    noRiskTank: "no risk",
    waterQuality: "Water quality", exportPdf: "PDF report", exportCsv: "CSV",
    reset: "Reset", recipeName: "Recipe name", saveRecipe: "Save",
    cancel: "Cancel", deleteConfirm: "Delete this recipe?",
    purewater: "Pure water — all inputs from fertilizers.",
    note: "Estimated with the guided sequential method of the NS Calculator spreadsheet (Incrocci, 2011). " +
      "Adjust to measured EC and pH (target 5.5–6.5). Order: acid → Ca → NH₄ → P → Mg → NO₃ → K → micro.",
    hco3Neutr: "HCO₃ neutralized", residual: "target residual",
    ion: { hco3: "HCO₃", no3: "N-NO₃", nh4: "N-NH₄", p: "P", k: "K", ca: "Ca", mg: "Mg",
      na: "Na", so4: "S-SO₄", cl: "Cl", fe: "Fe", b: "B", cu: "Cu", zn: "Zn", mn: "Mn", mo: "Mo" },
  },
};

const fmt = (n: number, d = 1) => (Math.abs(n) < 1e-9 ? "0" : n.toFixed(d));

/* ════════════════════════════ Composant ════════════════════════════ */
export default function NSCalculateur({
  theme = "dark",
  lang = "FR",
  greenhouse,
}: { theme?: "dark" | "light"; lang?: "FR" | "EN"; greenhouse?: string }) {
  const t = T[lang];
  const dark = theme === "dark";

  /* ---- état ---- */
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const recipes = useMemo(() => [...DEFAULT_RECIPES, ...customRecipes], [customRecipes]);
  const [selectedId, setSelectedId] = useState("tomato");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Partial<IonMap>>(
    DEFAULT_RECIPES.find((r) => r.id === "tomato")!.target
  );
  const [water, setWater] = useState<Partial<IonMap>>({});
  const [pH, setPH] = useState(5.7);
  const [dilution, setDilution] = useState(200);
  const [tankVolume, setTankVolume] = useState(100);
  const [acidId, setAcidId] = useState("hno3");
  const [showWater, setShowWater] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const fertilizers: Fertilizer[] = DEFAULT_FERTILIZERS;

  /* ---- chargement des recettes (FastAPI + Supabase, repli local) ---- */
  useEffect(() => {
    listRecipes(greenhouse).then(setCustomRecipes).catch(() => setCustomRecipes([]));
  }, [greenhouse]);

  /* ---- sélection recette ---- */
  const selectRecipe = (r: Recipe) => {
    setSelectedId(r.id);
    setTarget({ ...r.target });
  };

  /* ---- calcul (mémoïsé) ---- */
  const result: CalcResult = useMemo(
    () => computeNutrientSolution(target, water, { pH, dilution, tankVolume, acidId, fertilizers }),
    [target, water, pH, dilution, tankVolume, acidId, fertilizers]
  );

  const ecLive = useMemo(() => estimateEC(target), [target]);

  /* ---- recettes filtrées + groupées ---- */
  const filtered = useMemo(
    () => recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [recipes, search]
  );

  /* ---- enregistrer / supprimer (Supabase via FastAPI) ---- */
  const saveCurrent = async () => {
    if (!newName.trim()) return;
    const r = await createRecipe({
      name: newName.trim(),
      target: { ...target },
      ec_target: estimateEC(target),
      greenhouse,
    });
    setCustomRecipes((list) => [r, ...list.filter((x) => x.id !== r.id)]);
    setSelectedId(r.id);
    setSaving(false); setNewName("");
  };
  const deleteRecipe = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await apiDeleteRecipe(id);
    setCustomRecipes((list) => list.filter((r) => r.id !== id));
  };

  /* ---- exports ---- */
  const exportCSV = () => {
    const rows = [
      [t.fert, t.dose, "unit", t.perTank, t.cost + " €/m³", "tank"],
      ...result.doses.map((d) => [
        d.name, fmt(d.dose, 2), d.unit, fmt(d.gramsPerTank, 0), fmt(d.costPerM3, 3), d.tank,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `solution_nutritive_${selectedId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const recipeName = recipes.find((r) => r.id === selectedId)?.name ?? t.custom;
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text(t.title + " — " + recipeName, 14, 18);
      doc.setFontSize(9); doc.setTextColor(110);
      doc.text(t.subtitle, 14, 25);
      doc.setTextColor(40); doc.setFontSize(10);
      doc.text(
        `${t.ecReal}: ${fmt(result.ecAchieved, 2)} dS/m   |   pH ${pH}   |   ${t.dilution} ${dilution}×   |   ` +
        `${t.tankVol} ${tankVolume} L   |   ${t.totalCost}: ${fmt(result.totalCostPerM3, 2)} €/m³`,
        14, 33
      );
      autoTable(doc, {
        startY: 40,
        head: [[t.fert, t.dose, t.perTank, "Cuve", t.cost + " €/m³"]],
        body: result.doses.map((d) => [
          `${d.name}${d.formula ? " (" + d.formula + ")" : ""}`,
          `${fmt(d.dose, 2)} ${d.unit}`, fmt(d.gramsPerTank, 0), d.tank, fmt(d.costPerM3, 3),
        ]),
        styles: { fontSize: 8 }, headStyles: { fillColor: [22, 101, 52] },
      });
      const y = (doc as any).lastAutoTable.finalY + 8;
      autoTable(doc, {
        startY: y,
        head: [["Ion", t.target2, t.achieved, t.diff]],
        body: [...MACRO_IONS, ...MICRO_IONS].map((i) => [
          (t.ion as any)[i],
          fmt(result.target[i], 2), fmt(result.achieved[i], 2), fmt(result.difference[i], 2),
        ]),
        styles: { fontSize: 8 }, headStyles: { fillColor: [30, 64, 175] },
      });
      const fy = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11); doc.setTextColor(40);
      doc.text(t.precip, 14, fy);
      doc.setFontSize(9);
      const sA = result.precipSummary.A, sB = result.precipSummary.B;
      const risksA = result.precipitation.filter((p) => p.tank === "A" && p.risk).map((r) => r.salt);
      const risksB = result.precipitation.filter((p) => p.tank === "B" && p.risk).map((r) => r.salt);
      doc.text(
        `${t.tankA} — ${t.maxDil}: ${Math.round(sA.maxSafeDilution)}×` +
        (risksA.length ? ` (${risksA.join(", ")})` : ` — ${t.noRiskTank}`),
        14, fy + 6
      );
      doc.text(
        `${t.tankB} — ${t.maxDil}: ${Math.round(sB.maxSafeDilution)}×` +
        (risksB.length ? ` (${risksB.join(", ")})` : ` — ${t.noRiskTank}`),
        14, fy + 11
      );
      doc.setFontSize(7); doc.setTextColor(120);
      doc.text(doc.splitTextToSize(t.note, 180), 14, fy + 18);
      doc.save(`solution_nutritive_${selectedId}.pdf`);
    } catch {
      // Repli : fenêtre imprimable (l'utilisateur enregistre en PDF)
      printableFallback(recipeName, result, t, pH, dilution, tankVolume);
    }
  };

  /* ════════════════════════ styles ════════════════════════ */
  const card = dark
    ? "bg-white/[0.04] border border-white/10 backdrop-blur-xl"
    : "bg-white border border-slate-200 shadow-sm";
  const txt = dark ? "text-slate-100" : "text-slate-800";
  const sub = dark ? "text-slate-400" : "text-slate-500";
  const inputCls = dark
    ? "bg-white/5 border-white/10 text-slate-100 focus:border-emerald-400/60"
    : "bg-white border-slate-300 text-slate-800 focus:border-emerald-500";

  const IonInput = ({ ion, state, set, micro }: {
    ion: Ion; state: Partial<IonMap>; set: (s: Partial<IonMap>) => void; micro?: boolean;
  }) => (
    <label className="flex flex-col gap-1">
      <span className={`text-[11px] font-medium ${sub}`}>{(t.ion as any)[ion]}</span>
      <input
        type="number" step={micro ? 1 : 0.1} min={0}
        value={state[ion] ?? 0}
        onChange={(e) => set({ ...state, [ion]: parseFloat(e.target.value) || 0 })}
        className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none transition ${inputCls}`}
      />
    </label>
  );

  /* ════════════════════════ rendu ════════════════════════ */
  return (
    <div className={`min-h-screen w-full p-4 sm:p-6 ${dark ? "bg-slate-950" : "bg-slate-50"} ${txt}`}>
      {/* En-tête */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg">
            <FlaskConical size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
            <p className={`text-xs ${sub}`}>{t.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80 ${card}`}>
            <FileText size={16} /> {t.exportCsv}
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500">
            <Download size={16} /> {t.exportPdf}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        {/* ───────── COLONNE 1 : Bibliothèque ───────── */}
        <aside className={`col-span-12 lg:col-span-3 rounded-2xl p-4 ${card}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Leaf size={18} className="text-emerald-400" /> {t.library}</h2>
            <button onClick={() => setSaving(true)} title={t.newRecipe}
              className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">
              <Plus size={16} />
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={15} className={`absolute left-2.5 top-2.5 ${sub}`} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search}
              className={`w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none ${inputCls}`} />
          </div>
          <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
            {filtered.map((r) => (
              <div key={r.id}
                className={`group flex items-center justify-between rounded-xl border px-3 py-2 transition cursor-pointer
                ${selectedId === r.id
                    ? "border-emerald-500 " + (dark ? "bg-emerald-500/10" : "bg-emerald-50")
                    : dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"}`}
                onClick={() => selectRecipe(r)}>
                <div>
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className={`flex items-center gap-1 text-[11px] ${sub}`}>
                    {r.validated
                      ? <><CheckCircle size={11} className="text-emerald-500" /> {t.official}</>
                      : <><AlertTriangle size={11} className="text-amber-500" /> {t.custom}</>}
                    <span>· EC {fmt(estimateEC(r.target), 2)}</span>
                  </div>
                </div>
                {!r.validated && (
                  <button onClick={(e) => { e.stopPropagation(); deleteRecipe(r.id); }}
                    className="opacity-0 transition group-hover:opacity-100">
                    <Trash2 size={15} className="text-rose-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {saving && (
            <div className={`mt-3 rounded-xl border p-3 ${dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.recipeName}
                className={`mb-2 w-full rounded-lg border px-2 py-1.5 text-sm outline-none ${inputCls}`} />
              <div className="flex gap-2">
                <button onClick={saveCurrent}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-sm text-white hover:bg-emerald-500">
                  <Save size={14} /> {t.saveRecipe}
                </button>
                <button onClick={() => { setSaving(false); setNewName(""); }}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${inputCls}`}>{t.cancel}</button>
              </div>
            </div>
          )}
        </aside>

        {/* ───────── COLONNE 2 : Entrées ───────── */}
        <section className="col-span-12 space-y-4 lg:col-span-4">
          {/* Eau */}
          <div className={`rounded-2xl p-4 ${card}`}>
            <button onClick={() => setShowWater((s) => !s)} className="flex w-full items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><Droplets size={18} className="text-sky-400" /> {t.water}</h2>
              {showWater ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <p className={`mt-0.5 text-xs ${sub}`}>{t.waterSub}</p>
            {showWater && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(["hco3", ...MACRO_IONS] as Ion[]).map((i) => <IonInput key={i} ion={i} state={water} set={setWater} />)}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MICRO_IONS.map((i) => <IonInput key={i} ion={i} state={water} set={setWater} micro />)}
                </div>
              </div>
            )}
          </div>

          {/* Cible */}
          <div className={`rounded-2xl p-4 ${card}`}>
            <h2 className="flex items-center gap-2 font-semibold"><Beaker size={18} className="text-emerald-400" /> {t.target}</h2>
            <p className={`mt-0.5 text-xs ${sub}`}>{t.targetSub}</p>
            <div className={`mt-2 mb-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold
              ${dark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
              <Zap size={14} /> {t.ecTarget}: {fmt(ecLive, 2)} dS/m
            </div>
            <div className={`mb-2 text-xs font-semibold ${sub}`}>{t.macros}</div>
            <div className="grid grid-cols-4 gap-2">
              {MACRO_IONS.map((i) => <IonInput key={i} ion={i} state={target} set={setTarget} />)}
            </div>
            <div className={`mb-2 mt-3 text-xs font-semibold ${sub}`}>{t.micros}</div>
            <div className="grid grid-cols-3 gap-2">
              {MICRO_IONS.map((i) => <IonInput key={i} ion={i} state={target} set={setTarget} micro />)}
            </div>
          </div>

          {/* Paramètres */}
          <div className={`rounded-2xl p-4 ${card}`}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Calculator size={18} className="text-violet-400" /> {t.params}</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className={`text-[11px] ${sub}`}>{t.pH}</span>
                <input type="number" step={0.1} value={pH} onChange={(e) => setPH(parseFloat(e.target.value) || 5.7)}
                  className={`rounded-lg border px-2 py-1.5 text-sm outline-none ${inputCls}`} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={`text-[11px] ${sub}`}>{t.dilution}</span>
                <input type="number" step={10} value={dilution} onChange={(e) => setDilution(parseFloat(e.target.value) || 1)}
                  className={`rounded-lg border px-2 py-1.5 text-sm outline-none ${inputCls}`} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={`text-[11px] ${sub}`}>{t.tankVol}</span>
                <input type="number" step={10} value={tankVolume} onChange={(e) => setTankVolume(parseFloat(e.target.value) || 1)}
                  className={`rounded-lg border px-2 py-1.5 text-sm outline-none ${inputCls}`} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={`text-[11px] ${sub}`}>{t.acid}</span>
                <select value={acidId} onChange={(e) => setAcidId(e.target.value)}
                  className={`rounded-lg border px-2 py-1.5 text-sm outline-none ${inputCls}`}>
                  {fertilizers.filter((f) => f.kind === "acid").map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <button onClick={() => { setWater({}); }}
              className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-sm transition hover:opacity-80 ${inputCls}`}>
              <RotateCcw size={14} /> {t.reset} {t.water}
            </button>
          </div>
        </section>

        {/* ───────── COLONNE 3 : Résultats ───────── */}
        <section className="col-span-12 space-y-4 lg:col-span-5">
          {/* KPI */}
          <div className="grid grid-cols-3 gap-3">
            <KPI dark={dark} label={t.ecReal} value={fmt(result.ecAchieved, 2)} unit="dS/m" icon={<Zap size={16} />} />
            <KPI dark={dark} label={t.neutrality}
              value={result.neutrality.ok ? t.balanced : t.check}
              unit={`Δ ${fmt(result.neutrality.delta, 2)}`}
              tone={result.neutrality.ok ? "ok" : "warn"}
              icon={result.neutrality.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} />
            <KPI dark={dark} label={t.totalCost} value={fmt(result.totalCostPerM3, 2)} unit="€/m³" icon={<Info size={16} />} />
          </div>

          {result.acidNeutralized > 0 && (
            <div className={`rounded-xl px-3 py-2 text-xs ${dark ? "bg-sky-500/10 text-sky-300" : "bg-sky-50 text-sky-700"}`}>
              {t.hco3Neutr}: {fmt(result.acidNeutralized, 2)} mmol/L · {t.residual} {fmt(result.target.hco3, 2)} mmol/L
            </div>
          )}

          {/* Composition obtenue */}
          <div className={`rounded-2xl p-4 ${card}`}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Beaker size={18} className="text-emerald-400" /> {t.results}</h2>
            <CompositionTable result={result} t={t} dark={dark} />
          </div>

          {/* Dosages */}
          <div className={`rounded-2xl p-4 ${card}`}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Layers size={18} className="text-amber-400" /> {t.dosages}</h2>
            {result.doses.length === 0 ? (
              <p className={`text-sm ${sub}`}>{t.purewater}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left text-[11px] uppercase ${sub}`}>
                      <th className="pb-2">{t.fert}</th>
                      <th className="pb-2 text-right">{t.dose}</th>
                      <th className="pb-2 text-right">{t.perTank}</th>
                      <th className="pb-2 text-center">A/B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.doses.map((d) => (
                      <tr key={d.fertilizerId} className={dark ? "border-t border-white/5" : "border-t border-slate-100"}>
                        <td className="py-1.5">
                          <div className="font-medium">{d.name}</div>
                          {d.formula && <div className={`text-[11px] ${sub}`}>{d.formula}</div>}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">{fmt(d.dose, 2)} {d.unit}</td>
                        <td className="py-1.5 text-right tabular-nums">{fmt(d.gramsPerTank, 0)} g</td>
                        <td className="py-1.5 text-center">
                          <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold
                            ${d.tank === "A" ? "bg-sky-500/20 text-sky-400" : "bg-amber-500/20 text-amber-400"}`}>{d.tank}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cuves + précipitation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TankCard title={t.tankA} tone="A" lines={result.stockA} dark={dark} sub={sub} />
            <TankCard title={t.tankB} tone="B" lines={result.stockB} dark={dark} sub={sub} />
          </div>

          <div className={`rounded-2xl p-4 ${card}`}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} className="text-rose-400" /> {t.precip}</h2>
            </div>
            {result.dilutionWarning && (
              <div className={`mb-3 rounded-lg px-3 py-2 text-xs ${dark ? "bg-rose-500/10 text-rose-300" : "bg-rose-50 text-rose-700"}`}>
                {result.dilutionWarning}
              </div>
            )}
            <PrecipPanel result={result} t={t} dark={dark} sub={sub} dilution={dilution} />
          </div>

          {/* Qualité de l'eau */}
          {Object.values(result.waterQuality).some((v) => v === "HIGH") && (
            <div className={`rounded-2xl p-4 ${card}`}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><Droplets size={18} className="text-sky-400" /> {t.waterQuality}</h2>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(result.waterQuality).filter(([, v]) => v === "HIGH").map(([k]) => (
                  <span key={k} className={`rounded-lg px-2 py-1 text-xs font-medium ${dark ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-700"}`}>
                    {k === "ec" ? "EC" : (t.ion as any)[k]} — HIGH
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className={`text-[11px] leading-relaxed ${sub}`}>{t.note}</p>
        </section>
      </div>
    </div>
  );
}

/* ════════════════════════ sous-composants ════════════════════════ */
function KPI({ label, value, unit, icon, tone, dark }: {
  label: string; value: string; unit?: string; icon: React.ReactNode;
  tone?: "ok" | "warn"; dark: boolean;
}) {
  const base = dark ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200";
  const toneCls = tone === "ok" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-slate-300";
  return (
    <div className={`rounded-2xl border p-3 ${base}`}>
      <div className={`mb-1 flex items-center gap-1.5 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{icon}{label}</div>
      <div className={`text-xl font-bold ${tone ? toneCls : dark ? "text-slate-100" : "text-slate-800"}`}>{value}</div>
      {unit && <div className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{unit}</div>}
    </div>
  );
}

function CompositionTable({ result, t, dark }: { result: CalcResult; t: typeof T["FR"]; dark: boolean }) {
  const sub = dark ? "text-slate-400" : "text-slate-500";
  const row = (i: Ion) => {
    const d = result.difference[i];
    const off = Math.abs(d) > (MICRO_IONS.includes(i) ? 2 : 0.25);
    return (
      <tr key={i} className={dark ? "border-t border-white/5" : "border-t border-slate-100"}>
        <td className="py-1 font-medium">{(t.ion as any)[i]}</td>
        <td className="py-1 text-right tabular-nums">{fmt(result.target[i], 2)}</td>
        <td className="py-1 text-right tabular-nums font-semibold">{fmt(result.achieved[i], 2)}</td>
        <td className={`py-1 text-right tabular-nums ${off ? "text-amber-400" : "text-emerald-400"}`}>{d >= 0 ? "+" : ""}{fmt(d, 2)}</td>
      </tr>
    );
  };
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={`text-[11px] uppercase ${sub}`}>
          <th className="text-left pb-1">Ion</th>
          <th className="text-right pb-1">{t.target2}</th>
          <th className="text-right pb-1">{t.achieved}</th>
          <th className="text-right pb-1">{t.diff}</th>
        </tr>
      </thead>
      <tbody>{[...MACRO_IONS, ...MICRO_IONS].map(row)}</tbody>
    </table>
  );
}

function TankCard({ title, tone, lines, dark, sub }: {
  title: string; tone: "A" | "B"; lines: CalcResult["stockA"]; dark: boolean; sub: string;
}) {
  // Classes statiques (Tailwind JIT ne compile pas les noms construits dynamiquement)
  const badge = tone === "A" ? "bg-sky-500/20 text-sky-400" : "bg-amber-500/20 text-amber-400";
  const card = dark ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200 shadow-sm";
  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <span className={`grid h-6 w-6 place-items-center rounded-lg text-xs font-bold ${badge}`}>{tone}</span>
        {title}
      </h3>
      {lines.length === 0 ? <p className={`text-sm ${sub}`}>—</p> : (
        <ul className="space-y-1 text-sm">
          {lines.map((l) => (
            <li key={l.fertilizerId} className="flex justify-between">
              <span>{l.name}</span>
              <span className="tabular-nums font-medium">{fmt(l.gramsPerTank, 0)} g</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PrecipPanel({ result, t, dark, sub, dilution }: {
  result: CalcResult; t: typeof T["FR"]; dark: boolean; sub: string; dilution: number;
}) {
  const tankRow = (tank: "A" | "B") => {
    const s = result.precipSummary[tank];
    const risks = result.precipitation.filter((p) => p.tank === tank && p.risk);
    const safe = s.maxSafeDilution >= dilution;
    const badge = tank === "A" ? "bg-sky-500/20 text-sky-400" : "bg-amber-500/20 text-amber-400";
    return (
      <div key={tank} className={`rounded-xl border p-3 ${dark ? "border-white/10" : "border-slate-200"}`}>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className={`grid h-5 w-5 place-items-center rounded text-[11px] font-bold ${badge}`}>{tank}</span>
            {tank === "A" ? t.tankA : t.tankB}
          </span>
          <span className={`flex items-center gap-1 text-xs font-medium ${safe ? "text-emerald-400" : "text-rose-400"}`}>
            {safe ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
            {t.maxDil}: {s.maxSafeDilution > 9999 ? "∞" : Math.round(s.maxSafeDilution)}×
          </span>
        </div>
        {risks.length === 0 ? (
          <p className={`text-xs ${sub}`}>{t.noRiskTank} ({t.limiting}: {s.limitingSalt ?? "—"})</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {risks.map((r, i) => (
              <span key={i} className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${dark ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-700"}`}
                title={`${t.satIndex} ${r.ratio.toFixed(1)}×`}>
                {r.salt} <b>×{r.ratio.toFixed(1)}</b>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const singleRisks = result.precipitation
    .filter((p) => p.tank === "single" && p.risk)
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <div className="space-y-2">
      {tankRow("A")}
      {tankRow("B")}
      {singleRisks.length > 0 && (
        <div className={`rounded-xl border border-dashed px-3 py-2 ${dark ? "border-white/15" : "border-slate-300"}`}>
          <div className={`mb-1 text-xs font-medium ${sub}`}>{t.precipSingle}</div>
          <div className="flex flex-wrap gap-1.5">
            {singleRisks.map((r, i) => (
              <span key={i} className={`rounded-lg px-2 py-0.5 text-[11px] ${dark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                {r.salt} ×{r.ratio.toFixed(1)}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className={`text-[11px] leading-relaxed ${sub}`}>{t.precipExplain}</p>
    </div>
  );
}

/* Repli impression si jsPDF absent */
function printableFallback(name: string, r: CalcResult, t: typeof T["FR"], pH: number, dil: number, vol: number) {
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = r.doses.map((d) =>
    `<tr><td>${d.name}</td><td>${fmt(d.dose, 2)} ${d.unit}</td><td>${fmt(d.gramsPerTank, 0)} g</td><td>${d.tank}</td></tr>`).join("");
  const comp = [...MACRO_IONS, ...MICRO_IONS].map((i) =>
    `<tr><td>${(t.ion as any)[i]}</td><td>${fmt(r.target[i], 2)}</td><td>${fmt(r.achieved[i], 2)}</td><td>${fmt(r.difference[i], 2)}</td></tr>`).join("");
  w.document.write(`<html><head><title>${t.title} — ${name}</title>
    <style>body{font-family:system-ui;padding:24px;color:#1e293b}table{width:100%;border-collapse:collapse;margin:12px 0}
    th,td{border:1px solid #cbd5e1;padding:6px;text-align:left;font-size:13px}th{background:#166534;color:#fff}</style></head>
    <body><h2>${t.title} — ${name}</h2><p>${t.subtitle}</p>
    <p>${t.ecReal}: ${fmt(r.ecAchieved, 2)} dS/m | pH ${pH} | ${t.dilution} ${dil}× | ${t.tankVol} ${vol} L | ${t.totalCost}: ${fmt(r.totalCostPerM3, 2)} €/m³</p>
    <table><thead><tr><th>${t.fert}</th><th>${t.dose}</th><th>${t.perTank}</th><th>A/B</th></tr></thead><tbody>${rows}</tbody></table>
    <table><thead><tr><th>Ion</th><th>${t.target2}</th><th>${t.achieved}</th><th>${t.diff}</th></tr></thead><tbody>${comp}</tbody></table>
    <p style="font-size:11px;color:#64748b">${t.note}</p></body></html>`);
  w.document.close(); w.focus(); w.print();
}
