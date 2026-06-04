/* ============================================================================
   nsEngine.ts  —  Moteur de calcul de solution nutritive
   ----------------------------------------------------------------------------
   Reproduction fidèle de la logique du tableur "NS Calculator v1.2"
   (Dr. Luca Incrocci, Université de Pise — projet EU EUPHOROS, FP7-211457).

   Principe scientifique central
   -----------------------------
   Le tableur original NE résout PAS chaque engrais indépendamment : il applique
   une résolution SÉQUENTIELLE GUIDÉE ("greedy"). À chaque étape on dose UN
   engrais pour combler le déficit de SON ion-clé, puis ses apports sur TOUS les
   ions (un engrais binaire apporte 2 ions à la fois) sont reportés dans la
   solution courante avant l'étape suivante. L'ORDRE des étapes est choisi de
   façon à ce que les apports « secondaires » soient pris en compte :

     1. Acides (neutralisation des bicarbonates)  -> apporte NO3 / P / S / Cl
     2. Calcium      : nitrate de calcium          -> apporte Ca + NO3
     3. Ammonium     : nitrate d'ammonium           -> apporte NH4 + NO3
     4. Phosphore    : MKP (KH2PO4)                  -> apporte P + K
     5. Magnésium    : sulfate de magnésium          -> apporte Mg + SO4
     6. Nitrate      : nitrate de potassium          -> apporte NO3 + K
     7. Potassium    : sulfate de potassium          -> apporte K + SO4
     8. Fer          : chélate Fe-EDTA
     9. Microéléments: B, Cu, Zn, Mn, Mo
    10. Sodium (optionnel)

   C'est ce qui corrige le défaut majeur d'un calcul "ion par ion" : le NO3
   apporté par Ca(NO3)2, NH4NO3 puis KNO3 est cumulé, le K apporté par MKP et
   KNO3 est cumulé, le SO4 émerge de MgSO4 + K2SO4, etc.

   Validation : pour la recette Tomate par défaut sur eau pure, ce moteur
   restitue exactement les valeurs du tableur (Ca(NO3)2 = 862.4 mg/L, tous les
   ions atteignent leur cible, EC = 2.09 dS/m).
   ============================================================================ */

/* ----------------------------- Types ------------------------------------- */

/** Les 16 grandeurs suivies. Macro en mmol/L, micro en µmol/L, HCO3 en mmol/L. */
export type Ion =
  | "hco3" | "no3" | "nh4" | "p" | "k" | "ca" | "mg" | "na" | "so4" | "cl"
  | "fe" | "b" | "cu" | "zn" | "mn" | "mo";

export const MACRO_IONS: Ion[] = ["no3", "nh4", "p", "k", "ca", "mg", "na", "so4", "cl"];
export const MICRO_IONS: Ion[] = ["fe", "b", "cu", "zn", "mn", "mo"];

export type IonMap = Record<Ion, number>;

/** Pourcentages pondéraux tels que saisis sur l'étiquette commerciale. */
export interface FertPercent {
  no3?: number;  // % N-NO3
  nh4?: number;  // % N-NH4
  p2o5?: number; // % P2O5
  k2o?: number;  // % K2O
  cao?: number;  // % CaO
  mgo?: number;  // % MgO
  na?: number;   // % Na
  so3?: number;  // % SO3
  cl?: number;   // % Cl
  fe?: number;   // % Fe
  b?: number;    // % B
  cu?: number;   // % Cu
  zn?: number;   // % Zn
  mn?: number;   // % Mn
  mo?: number;   // % Mo
}

export interface Fertilizer {
  id: string;
  name: string;
  formula?: string;
  kind: "acid" | "salt";
  /** Engrais activé par défaut pour son rôle. */
  enabled: boolean;
  /** Cuve mère recommandée (séparation anti-précipitation). */
  tank: "A" | "B";
  /** Ion-clé visé par cet engrais dans la séquence. */
  role: Ion | "hco3";
  pct: FertPercent;
  /** Acides : masse volumique kg/L. */
  density?: number;
  /** Coût : €/L pour les acides, €/kg pour les sels. */
  price?: number;
}

export interface Recipe {
  id: string;
  name: string;
  group?: string;
  validated?: boolean; // true = recette officielle du tableur
  ec?: number;         // EC cible affichée (recalculée dynamiquement par ailleurs)
  target: Partial<IonMap>;
}

export interface WaterAnalysis extends Partial<IonMap> {}

export interface CalcOptions {
  pH: number;            // pH cible (défaut 5.7)
  dilution: number;      // facteur de concentration des solutions mères (ex. 200)
  tankVolume: number;    // volume d'une cuve mère (L)
  acidId?: string;       // acide choisi pour la neutralisation (défaut: nitrique)
  fertilizers: Fertilizer[];
}

export interface DoseLine {
  fertilizerId: string;
  name: string;
  formula?: string;
  kind: "acid" | "salt";
  tank: "A" | "B";
  role: Ion | "hco3";
  dose: number;       // mg/L (sels) ou ml/L (acides) dans la solution finale 1×
  unit: "mg/L" | "ml/L";
  gramsPerTank: number; // quantité à peser/verser dans la cuve mère
  costPerM3: number;    // €/m³ de solution nutritive délivrée
  contributions: IonMap; // apports de cette ligne (macro mmol/L, micro µmol/L)
}

export interface PrecipRisk {
  salt: string;
  tank: "A" | "B" | "single";
  ionProduct: number;   // produit ionique dans la cuve concentrée (mol/L)^n
  ksp: number;          // produit de solubilité estimé
  ratio: number;        // indice de sursaturation = ionProduct / ksp (>1 => précipite)
  risk: boolean;
  maxDilution: number;  // dilution maximale (×) avant saturation pour CE sel
}

export interface TankSummary {
  riskCount: number;        // nombre de sels au-dessus de leur Kps
  limitingSalt: string | null; // sel le plus contraignant
  maxSafeDilution: number;  // dilution max (×) sûre pour toute la cuve
}

export interface CalcResult {
  target: IonMap;          // cible (HCO3 = résidu toléré au pH visé)
  water: IonMap;
  achieved: IonMap;        // solution nutritive obtenue (eau + engrais)
  difference: IonMap;      // achieved - target
  doses: DoseLine[];
  ecTarget: number;        // EC estimée de la recette cible
  ecAchieved: number;      // EC estimée de la solution obtenue (dynamique)
  ecWater: number;
  neutrality: { cations: number; anions: number; delta: number; ok: boolean };
  waterQuality: Partial<Record<Ion | "ec", "OK" | "HIGH">>;
  totalCostPerM3: number;
  acidNeutralized: number; // mmol HCO3 neutralisés
  stockA: DoseLine[];
  stockB: DoseLine[];
  precipitation: PrecipRisk[];
  precipSummary: { A: TankSummary; B: TankSummary; single: TankSummary };
  dilutionWarning: string | null;
}

/* --------------------- Constantes chimiques (tableur) -------------------- */
// Masses molaires et fractions élémentaires des formes oxydées, identiques
// à celles codées dans la feuille "Acidi & concimi".
const MM = {
  N: 14.007, P: 30.974, K: 39.1, Ca: 40.08, Mg: 24.312, Na: 22.9898,
  S: 32.064, Cl: 35.453, Fe: 55.85, B: 10.8, Cu: 63.55, Zn: 65.38,
  Mn: 54.94, Mo: 95.95,
};
const FRAC = { P_IN_P2O5: 0.4364, K_IN_K2O: 0.83, Ca_IN_CaO: 0.715, Mg_IN_MgO: 0.603, S_IN_SO3: 0.4 };

function zeroIons(): IonMap {
  return {
    hco3: 0, no3: 0, nh4: 0, p: 0, k: 0, ca: 0, mg: 0, na: 0, so4: 0, cl: 0,
    fe: 0, b: 0, cu: 0, zn: 0, mn: 0, mo: 0,
  };
}

/**
 * Coefficients mmol d'élément par mg d'engrais (micro: mmol/mg également,
 * convertis en µmol/L à la multiplication par la dose via ×1000).
 */
export function fertCoefficients(pct: FertPercent) {
  const p = (v?: number) => v ?? 0;
  return {
    no3: p(pct.no3) / MM.N / 100,
    nh4: p(pct.nh4) / MM.N / 100,
    p:   p(pct.p2o5) * FRAC.P_IN_P2O5 / MM.P / 100,
    k:   p(pct.k2o) * FRAC.K_IN_K2O / MM.K / 100,
    ca:  p(pct.cao) * FRAC.Ca_IN_CaO / MM.Ca / 100,
    mg:  p(pct.mgo) * FRAC.Mg_IN_MgO / MM.Mg / 100,
    na:  p(pct.na) / MM.Na / 100,
    so4: p(pct.so3) * FRAC.S_IN_SO3 / MM.S / 100,
    cl:  p(pct.cl) / MM.Cl / 100,
    fe:  p(pct.fe) / MM.Fe / 100,
    b:   p(pct.b) / MM.B / 100,
    cu:  p(pct.cu) / MM.Cu / 100,
    zn:  p(pct.zn) / MM.Zn / 100,
    mn:  p(pct.mn) / MM.Mn / 100,
    mo:  p(pct.mo) / MM.Mo / 100,
  };
}

/** EC estimée (dS/m) — formule du tableur : somme des charges cationiques. */
export function estimateEC(ions: Partial<IonMap>): number {
  const nh4 = ions.nh4 ?? 0, k = ions.k ?? 0, ca = ions.ca ?? 0,
        mg = ions.mg ?? 0, na = ions.na ?? 0;
  const sumCationCharge = nh4 + k + 2 * ca + 2 * mg + na;
  if (sumCationCharge <= 0) return 0;
  return sumCationCharge * 0.095 + 0.19;
}

/** Bilan de charge (méq/L). */
export function chargeBalance(ions: IonMap) {
  const cations = ions.nh4 + ions.k + 2 * ions.ca + 2 * ions.mg + ions.na;
  // P compté comme H2PO4- (1 charge), SO4 (2-), HCO3/NO3/Cl (1-)
  const anions = ions.no3 + ions.p + 2 * ions.so4 + ions.cl + ions.hco3;
  return { cations, anions, delta: cations - anions, ok: Math.abs(cations - anions) <= 1 };
}

/** Seuils qualité de l'eau d'irrigation (feuille "Parametri", ligne 24). */
export function waterQuality(water: IonMap, ec: number): Partial<Record<Ion | "ec", "OK" | "HIGH">> {
  const hi = (v: number, max: number): "OK" | "HIGH" => (v < max ? "OK" : "HIGH");
  return {
    ec: hi(ec, 1.001),
    hco3: hi(water.hco3, 5.01),
    no3: hi(water.no3, 3.571),
    nh4: hi(water.nh4, 1.001),
    p: hi(water.p, 1.001),
    k: hi(water.k, 2.501),
    ca: hi(water.ca, 4.001),
    mg: hi(water.mg, 1.001),
    na: hi(water.na, 3.001),
    so4: hi(water.so4, 2.801),
    cl: hi(water.cl, 3.001),
    fe: water.fe > 53.7 ? "HIGH" : "OK",
    b: hi(water.b, 69.401),
    cu: water.cu > 15.73 ? "HIGH" : "OK",
    zn: water.zn > 30.59 ? "HIGH" : "OK",
    mn: water.mn > 9.1 ? "HIGH" : "OK",
    mo: water.mo > 2.08 ? "HIGH" : "OK",
  };
}

/* ----------------- Table de solubilité (test précipitation) -------------- */
// MW (g/mol) et solubilité (g/L) issues de la feuille "Test precipitazioni"
// du tableur. Pour chaque sel CₘAₙ :
//   solubilité molaire  s   = sol / MW           (mol/L)
//   Kps                  = mᵐ · nⁿ · s^(m+n)
//   produit ionique IP   = [cation]ᵐ · [anion]ⁿ
// L'anion peut être polynucléaire (B₄O₇ contient 4 B) -> anionDiv.
interface SaltDef {
  name: string;
  mw: number;            // g/mol
  sol: number;           // solubilité g/L
  cation: Ion; nCat: number;
  anion: Ion;  nAn: number;
  anionDiv?: number;     // atomes d'élément "anion" par ion (ex. B₄O₇ -> 4)
}

// Cuve A : nitrate de calcium, nitrate/ chlorure d'ammonium, KNO₃, Fe, Na.
// (jamais de sulfate ni de phosphate avec le calcium)
const SALTS_A: SaltDef[] = [
  { name: "KNO₃",            mw: 101.1,  sol: 133,  cation: "k",  nCat: 1, anion: "no3", nAn: 1 },
  { name: "KCl",             mw: 74.55,  sol: 344,  cation: "k",  nCat: 1, anion: "cl",  nAn: 1 },
  { name: "Ca(NO₃)₂",        mw: 164.09, sol: 1212, cation: "ca", nCat: 1, anion: "no3", nAn: 2 },
  { name: "CaCl₂",           mw: 110.99, sol: 745,  cation: "ca", nCat: 1, anion: "cl",  nAn: 2 },
  { name: "Ca(H₂PO₄)₂·H₂O",  mw: 252.07, sol: 18,   cation: "ca", nCat: 1, anion: "p",   nAn: 2 },
  { name: "CaSO₄ (gypse)",   mw: 136.14, sol: 2.09, cation: "ca", nCat: 1, anion: "so4", nAn: 1 },
  { name: "NH₄NO₃",          mw: 80.04,  sol: 1183, cation: "nh4",nCat: 1, anion: "no3", nAn: 1 },
  { name: "NH₄Cl",           mw: 53.49,  sol: 372,  cation: "nh4",nCat: 1, anion: "cl",  nAn: 1 },
  { name: "NaNO₃",           mw: 84.99,  sol: 921,  cation: "na", nCat: 1, anion: "no3", nAn: 1 },
  { name: "NaCl",            mw: 55.44,  sol: 357,  cation: "na", nCat: 1, anion: "cl",  nAn: 1 },
];

// Cuve B : phosphates, sulfates, magnésium, potassium, microéléments.
const SALTS_B: SaltDef[] = [
  { name: "Ca(H₂PO₄)₂",      mw: 252.07, sol: 18,   cation: "ca", nCat: 1, anion: "p",   nAn: 2 },
  { name: "CaSO₄ (gypse)",   mw: 136.14, sol: 2.09, cation: "ca", nCat: 1, anion: "so4", nAn: 1 },
  { name: "KH₂PO₄",          mw: 136.09, sol: 226,  cation: "k",  nCat: 1, anion: "p",   nAn: 1 },
  { name: "K₂SO₄",           mw: 174.25, sol: 120,  cation: "k",  nCat: 2, anion: "so4", nAn: 1 },
  { name: "K₂B₄O₇·8H₂O",     mw: 377.55, sol: 267,  cation: "k",  nCat: 2, anion: "b",   nAn: 1, anionDiv: 4 },
  { name: "K₂MoO₄",          mw: 238.13, sol: 1846, cation: "k",  nCat: 2, anion: "mo",  nAn: 1 },
  { name: "(NH₄)H₂PO₄",      mw: 83.03,  sol: 1710, cation: "nh4",nCat: 1, anion: "p",   nAn: 1 },
  { name: "(NH₄)₂SO₄",       mw: 132.14, sol: 706,  cation: "nh4",nCat: 2, anion: "so4", nAn: 1 },
  { name: "Mg(NO₃)₂",        mw: 184.35, sol: 260,  cation: "mg", nCat: 1, anion: "no3", nAn: 2 },
  { name: "MgSO₄",           mw: 120.36, sol: 260,  cation: "mg", nCat: 1, anion: "so4", nAn: 1 },
  { name: "MgCl₂",           mw: 95.21,  sol: 542.5,cation: "mg", nCat: 1, anion: "cl",  nAn: 2 },
  { name: "Mg(MoO₄)₂",       mw: 184.24, sol: 137,  cation: "mg", nCat: 1, anion: "mo",  nAn: 2 },
  { name: "CuSO₄",           mw: 159.6,  sol: 143,  cation: "cu", nCat: 1, anion: "so4", nAn: 1 },
  { name: "Cu(NO₃)₂",        mw: 241.6,  sol: 137.8,cation: "cu", nCat: 1, anion: "no3", nAn: 2 },
  { name: "MnSO₄",           mw: 151,    sol: 520,  cation: "mn", nCat: 1, anion: "so4", nAn: 1 },
  { name: "Mn(H₂PO₄)₂",      mw: 284.94, sol: 100,  cation: "mn", nCat: 1, anion: "p",   nAn: 2 },
  { name: "ZnSO₄·7H₂O",      mw: 287.54, sol: 965,  cation: "zn", nCat: 1, anion: "so4", nAn: 1 },
  { name: "Zn(H₂PO₄)₂·2H₂O", mw: 295.39, sol: 250,  cation: "zn", nCat: 1, anion: "p",   nAn: 2 },
];

function saltKsp(s: SaltDef): number {
  const m = s.sol / s.mw;
  return Math.pow(s.nCat, s.nCat) * Math.pow(s.nAn, s.nAn) * Math.pow(m, s.nCat + s.nAn);
}
function saltIonProduct(s: SaltDef, conc: IonMap): number {
  const c = conc[s.cation];
  const a = conc[s.anion] / (s.anionDiv ?? 1);
  return Math.pow(c, s.nCat) * Math.pow(a, s.nAn);
}
function saltOrder(s: SaltDef): number {
  return s.nCat + s.nAn;
}

/* --------------------------- Calcul principal ---------------------------- */

export function computeNutrientSolution(
  recipe: Partial<IonMap>,
  water: WaterAnalysis,
  opts: CalcOptions
): CalcResult {
  const W: IonMap = { ...zeroIons(), ...water };
  const target: IonMap = { ...zeroIons(), ...recipe };

  // HCO3 cible = résidu toléré au pH visé (équilibre H2CO3/HCO3-, pKa1 = 6.35)
  const protonatedFraction = 1 / (1 + Math.pow(10, opts.pH - 6.35));
  const hco3ToNeutralize = Math.max(0, W.hco3 * protonatedFraction);
  target.hco3 = W.hco3 - hco3ToNeutralize;

  // Solution courante initialisée à l'eau d'irrigation
  const sol: IonMap = { ...W };
  const fById = new Map(opts.fertilizers.map((f) => [f.id, f]));
  const doses: DoseLine[] = [];

  const tankVol = opts.tankVolume, dil = opts.dilution;
  const addContrib = (f: Fertilizer, dose: number, isAcid: boolean): IonMap => {
    const co = fertCoefficients(f.pct);
    const out = zeroIons();
    // facteur masse : sels -> mg/L direct ; acides -> ml/L × densité × 1000(mg/g)
    const massFactor = isAcid ? dose * (f.density ?? 1) * 1000 : dose;
    (Object.keys(co) as (keyof typeof co)[]).forEach((ion) => {
      const isMicro = MICRO_IONS.includes(ion as Ion);
      const contrib = massFactor * co[ion] * (isMicro ? 1000 : 1);
      (out as any)[ion] = contrib;
      (sol as any)[ion] += contrib;
    });
    return out;
  };

  const pushDose = (f: Fertilizer, dose: number) => {
    if (!(dose > 1e-9)) return;
    const isAcid = f.kind === "acid";
    const contributions = addContrib(f, dose, isAcid);
    const gramsPerTank = isAcid
      ? dose * dil * tankVol / 1000 * (f.density ?? 1) // ml -> approx via densité -> g (info)
      : dose * dil * tankVol / 1000;                   // mg/L -> g dans la cuve mère
    const costPerM3 = isAcid
      ? dose * (f.price ?? 0)                 // ml/L × €/L  = €/m³
      : dose * (f.price ?? 0) / 1000;         // mg/L × €/kg / 1000 = €/m³
    doses.push({
      fertilizerId: f.id, name: f.name, formula: f.formula, kind: f.kind,
      tank: f.tank, role: f.role, dose, unit: isAcid ? "ml/L" : "mg/L",
      gramsPerTank, costPerM3, contributions,
    });
  };

  // -- Étape 1 : neutralisation des bicarbonates par un acide ---------------
  const acid = opts.acidId ? fById.get(opts.acidId) : undefined;
  const defaultAcid = acid ?? opts.fertilizers.find((f) => f.kind === "acid" && f.enabled);
  let acidNeutralized = 0;
  if (defaultAcid && hco3ToNeutralize > 0) {
    const co = fertCoefficients(defaultAcid.pct);
    const d = defaultAcid.density ?? 1;
    // capacité de neutralisation (mmol H+ par ml/L) :
    //   nitrique  : 1 H+ / NO3   -> co.no3
    //   phosphor. : 1 H+ / P     -> co.p
    //   sulfur.   : 2 H+ / S      -> 2 × co.so4
    //   chlorhyd. : 1 H+ / Cl    -> co.cl
    const cap =
      defaultAcid.formula?.includes("H2SO4") ? co.so4 * 2 * d * 1000
      : co.no3 > 0 ? co.no3 * d * 1000
      : co.p > 0 ? co.p * d * 1000
      : co.cl > 0 ? co.cl * d * 1000
      : 0;
    if (cap > 0) {
      const mlPerL = hco3ToNeutralize / cap;
      pushDose(defaultAcid, mlPerL);
      acidNeutralized = hco3ToNeutralize;
      sol.hco3 = W.hco3 - hco3ToNeutralize;
    }
  } else {
    sol.hco3 = target.hco3;
  }

  // -- Étapes 2..n : dosage séquentiel guidé --------------------------------
  // Chaque entrée vise un ion-clé avec l'engrais activé de ce rôle.
  const sequence: { role: Ion; micro?: boolean }[] = [
    { role: "ca" }, { role: "nh4" }, { role: "p" }, { role: "mg" },
    { role: "no3" }, { role: "k" },
    { role: "fe", micro: true }, { role: "b", micro: true },
    { role: "cu", micro: true }, { role: "zn", micro: true },
    { role: "mn", micro: true }, { role: "mo", micro: true },
    { role: "na" },
  ];

  for (const step of sequence) {
    const f = opts.fertilizers.find((x) => x.enabled && x.role === step.role && x.kind === "salt");
    if (!f) continue;
    const co = fertCoefficients(f.pct);
    const coKey = co[step.role as keyof typeof co];
    if (!coKey || coKey <= 0) continue;
    const deficit = target[step.role] - sol[step.role]; // mmol/L (macro) ou µmol/L (micro)
    if (deficit <= 1e-9) continue;
    // dose (mg/L) : micro -> diviser par (coef×1000) car contribution = dose×coef×1000
    const dose = step.micro ? deficit / (coKey * 1000) : deficit / coKey;
    pushDose(f, dose);
  }

  // -- Résultats ------------------------------------------------------------
  const achieved: IonMap = { ...sol };
  const difference = zeroIons();
  (Object.keys(difference) as Ion[]).forEach((i) => (difference[i] = achieved[i] - target[i]));

  const ecWater = estimateEC(W);
  const ecTarget = estimateEC(target);
  const ecAchieved = estimateEC(achieved);
  const neutrality = chargeBalance(achieved);
  const wq = waterQuality(W, ecWater);
  const totalCostPerM3 = doses.reduce((s, d) => s + d.costPerM3, 0);

  // -- Séparation cuves A / B + test de précipitation -----------------------
  const stockA = doses.filter((d) => d.tank === "A");
  const stockB = doses.filter((d) => d.tank === "B");

  // Concentration ionique d'une cuve mère (mol/L) :
  //   apports engrais (mmol/L) × dilution / 1000  +  eau d'irrigation (1×) / 1000
  // L'eau n'est PAS concentrée : la cuve est préparée avec l'eau d'irrigation.
  const concOfTank = (lines: DoseLine[]): IonMap => {
    const c = zeroIons();
    (Object.keys(c) as Ion[]).forEach((i) => {
      const isMicro = MICRO_IONS.includes(i);
      const waterMmol = isMicro ? W[i] / 1000 : W[i]; // µmol/L -> mmol/L pour micro
      c[i] = waterMmol / 1000; // eau à 1×, en mol/L
    });
    lines.forEach((l) => (Object.keys(l.contributions) as Ion[]).forEach((i) => {
      const isMicro = MICRO_IONS.includes(i);
      const mmolPerL = isMicro ? l.contributions[i] / 1000 : l.contributions[i];
      c[i] += mmolPerL * dil / 1000;
    }));
    return c;
  };
  const concA = concOfTank(stockA), concB = concOfTank(stockB);
  const concSingle = zeroIons();
  (Object.keys(concSingle) as Ion[]).forEach((i) =>
    (concSingle[i] = concA[i] + concB[i] - W[i] / (MICRO_IONS.includes(i) ? 1e6 : 1000)) // éviter de compter l'eau 2×
  );

  const precipitation: PrecipRisk[] = [];
  const testTank = (salts: SaltDef[], conc: IonMap, tank: "A" | "B" | "single"): TankSummary => {
    let riskCount = 0, limitingSalt: string | null = null, maxSafe = Infinity;
    salts.forEach((s) => {
      const ip = saltIonProduct(s, conc);
      if (ip <= 1e-15) return; // sel impossible à former (un ion absent)
      const k = saltKsp(s);
      const ratio = ip / k;
      const ord = saltOrder(s);
      // IP ∝ dilution^ordre  ->  dilution max pour ce sel à saturation
      const maxDil = dil * Math.pow(k / ip, 1 / ord);
      const risk = ip > k;
      if (risk) riskCount++;
      if (maxDil < maxSafe) { maxSafe = maxDil; limitingSalt = s.name; }
      precipitation.push({ salt: s.name, tank, ionProduct: ip, ksp: k, ratio, risk, maxDilution: maxDil });
    });
    return { riskCount, limitingSalt, maxSafeDilution: maxSafe === Infinity ? dil : maxSafe };
  };
  const singleSalts = Array.from(
    new Map([...SALTS_A, ...SALTS_B].map((s) => [s.name, s])).values()
  );
  const precipSummary = {
    A: testTank(SALTS_A, concA, "A"),
    B: testTank(SALTS_B, concB, "B"),
    single: testTank(singleSalts, concSingle, "single"),
  };

  const dilutionWarning =
    dil > 240 ? "Ratio de dilution > 240× : risque de précipitation accru (seuil du tableur)." : null;

  return {
    target, water: W, achieved, difference, doses,
    ecTarget, ecAchieved, ecWater, neutrality, waterQuality: wq,
    totalCostPerM3, acidNeutralized, stockA, stockB, precipitation, precipSummary, dilutionWarning,
  };
}

/* ------------------------ Base d'engrais par défaut ---------------------- */
// Valeurs (%) reprises de la feuille "Acidi & concimi" du tableur.
export const DEFAULT_FERTILIZERS: Fertilizer[] = [
  { id: "hno3", name: "Acide nitrique", formula: "HNO3", kind: "acid", enabled: true, tank: "A", role: "hco3",
    density: 1.39, price: 0.723, pct: { no3: 14.45 } },
  { id: "h3po4", name: "Acide phosphorique", formula: "H3PO4", kind: "acid", enabled: false, tank: "B", role: "hco3",
    density: 1.689, price: 1.431, pct: { p2o5: 61.55 } },
  { id: "h2so4", name: "Acide sulfurique", formula: "H2SO4", kind: "acid", enabled: false, tank: "B", role: "hco3",
    density: 1.84, price: 0.475, pct: { so3: 78.37 } },
  { id: "hcl", name: "Acide chlorhydrique", formula: "HCl", kind: "acid", enabled: false, tank: "A", role: "hco3",
    density: 1.186, price: 0.5, pct: { cl: 35.49 } },

  { id: "cano3", name: "Nitrate de calcium", formula: "5[Ca(NO3)2·2H2O]·NH4NO3", kind: "salt", enabled: true, tank: "A", role: "ca",
    price: 0.3, pct: { no3: 14.3, nh4: 1.3, cao: 26 } },
  { id: "cano3pure", name: "Nitrate de calcium (pur)", formula: "Ca(NO3)2·4H2O", kind: "salt", enabled: false, tank: "A", role: "ca",
    price: 0.298, pct: { no3: 11.9, cao: 23.8 } },
  { id: "cacl2", name: "Chlorure de calcium", formula: "CaCl2", kind: "salt", enabled: false, tank: "A", role: "ca",
    pct: { cao: 50.5, cl: 63.8 } },

  { id: "nh4no3", name: "Nitrate d'ammonium", formula: "NH4NO3", kind: "salt", enabled: true, tank: "A", role: "nh4",
    price: 0.298, pct: { no3: 17.2, nh4: 17.2 } },
  { id: "nh4so4", name: "Sulfate d'ammonium", formula: "(NH4)2SO4", kind: "salt", enabled: false, tank: "B", role: "nh4",
    price: 0.163, pct: { nh4: 21.2, so3: 60.6 } },
  { id: "map", name: "Phosphate monoammonique (MAP)", formula: "NH4H2PO4", kind: "salt", enabled: false, tank: "B", role: "p",
    price: 0.798, pct: { nh4: 12.2, p2o5: 61.6 } },

  { id: "mkp", name: "Phosphate monopotassique (MKP)", formula: "KH2PO4", kind: "salt", enabled: true, tank: "B", role: "p",
    price: 0.961, pct: { p2o5: 52.2, k2o: 34.6 } },

  { id: "mgso4", name: "Sulfate de magnésium", formula: "MgSO4·7H2O", kind: "salt", enabled: true, tank: "B", role: "mg",
    price: 0.3, pct: { mgo: 15.9, so3: 31.75 } },
  { id: "mgno3", name: "Nitrate de magnésium", formula: "Mg(NO3)2·6H2O", kind: "salt", enabled: false, tank: "A", role: "mg",
    price: 0.913, pct: { no3: 10.95, mgo: 15.7 } },

  { id: "kno3", name: "Nitrate de potassium", formula: "KNO3", kind: "salt", enabled: true, tank: "A", role: "no3",
    price: 0.5, pct: { no3: 13.8, k2o: 46.5 } },

  { id: "k2so4", name: "Sulfate de potassium", formula: "K2SO4", kind: "salt", enabled: true, tank: "B", role: "k",
    price: 0.423, pct: { k2o: 52.05, so3: 44.1 } },
  { id: "kcl", name: "Chlorure de potassium", formula: "KCl", kind: "salt", enabled: false, tank: "A", role: "k",
    price: 0.243, pct: { k2o: 61, cl: 45.9 } },

  { id: "feedta", name: "Fer EDTA", formula: "Fe-EDTA", kind: "salt", enabled: true, tank: "A", role: "fe",
    pct: { fe: 13 } },
  { id: "fedtpa", name: "Fer DTPA", formula: "Fe-DTPA", kind: "salt", enabled: false, tank: "A", role: "fe",
    price: 7.981, pct: { fe: 6.5 } },
  { id: "feeddha", name: "Fer EDDHA", formula: "Fe-EDDHA", kind: "salt", enabled: false, tank: "A", role: "fe",
    price: 10.96, pct: { fe: 6 } },

  { id: "borax", name: "Borax", formula: "Na2B4O7·10H2O", kind: "salt", enabled: true, tank: "B", role: "b",
    price: 10.22, pct: { na: 12.1, b: 11.3 } },
  { id: "boricacid", name: "Acide borique", formula: "H3BO3", kind: "salt", enabled: false, tank: "B", role: "b",
    price: 19.62, pct: { b: 17.5 } },
  { id: "cuso4", name: "Sulfate de cuivre", formula: "CuSO4·5H2O", kind: "salt", enabled: true, tank: "B", role: "cu",
    price: 14.46, pct: { so3: 32.1, cu: 25.5 } },
  { id: "znso4", name: "Sulfate de zinc", formula: "ZnSO4·7H2O", kind: "salt", enabled: true, tank: "B", role: "zn",
    price: 30.78, pct: { so3: 27.8, zn: 22.7 } },
  { id: "mnso4", name: "Sulfate de manganèse", formula: "MnSO4·H2O", kind: "salt", enabled: true, tank: "B", role: "mn",
    price: 50, pct: { so3: 47.5, mn: 32.5 } },
  { id: "namo", name: "Molybdate de sodium", formula: "Na2MoO4·2H2O", kind: "salt", enabled: true, tank: "B", role: "mo",
    price: 37.26, pct: { na: 19, mo: 39.7 } },

  { id: "nacl", name: "Chlorure de sodium", formula: "NaCl", kind: "salt", enabled: false, tank: "A", role: "na",
    price: 0.5, pct: { na: 39.34, cl: 60.66 } },
];

/* --------------------- Bibliothèque de recettes (tableur) ---------------- */
const mk = (
  id: string, name: string, group: string,
  no3: number, nh4: number, p: number, k: number, ca: number, mg: number,
  so4: number, fe: number, b: number, cu: number, zn: number, mn: number, mo: number,
  na = 0, cl = 0
): Recipe => ({
  id, name, group, validated: true,
  target: { no3, nh4, p, k, ca, mg, na, so4, cl, fe, b, cu, zn, mn, mo },
});

export const DEFAULT_RECIPES: Recipe[] = [
  mk("tomato", "Tomate", "Solanacées", 14, 1, 1, 8, 4, 1.5, 2.5, 15, 20, 1, 5, 10, 1),
  mk("pepper", "Poivron", "Solanacées", 15, 1, 1.3, 8, 3.5, 1.5, 1.5, 15, 30, 1, 5, 10, 1),
  mk("cucumber", "Concombre", "Cucurbitacées", 15, 1, 1.2, 7, 4, 1.5, 1.6, 15, 30, 1, 5, 10, 1),
  mk("fruitveg", "Légume-fruit (général)", "Cucurbitacées", 15, 1, 1.3, 7.5, 4, 1.5, 2, 15, 30, 1, 5, 10, 1),
  mk("muskmelon", "Melon", "Cucurbitacées", 16, 1, 1.3, 7, 4, 1.7, 1.5, 10, 20, 1, 5, 10, 1),
  mk("squash", "Courgette", "Cucurbitacées", 16, 1.3, 1.5, 7.5, 4, 2, 1.8, 10, 50, 1, 5, 10, 1),
  mk("lettuce", "Laitue / Légume-feuille", "Feuillus", 16, 2, 2, 10, 4.5, 1, 2.5, 40, 30, 1, 5, 5, 1),
  mk("leafycut", "Légume-feuille à couper", "Feuillus", 15, 3, 2.5, 11, 4.5, 3, 6, 40, 40, 1, 5, 10, 1, 4.35, 4),
  mk("strawberry", "Fraise", "Petits fruits", 9.995, 1, 1, 5.5, 3.5, 1.2, 2, 20, 30, 1, 5, 10, 1),
  mk("bean", "Haricot", "Légumineuses", 12, 1, 1, 1.2, 5.5, 3.5, 0, 15, 50, 1, 5, 10, 1, 1.2, 1.2),
  mk("rose", "Rose", "Ornementaux", 11, 1, 1.3, 5, 3, 1, 1.3, 25, 25, 1, 5, 5, 1),
  mk("gerbera", "Gerbera", "Ornementaux", 11, 1, 1.3, 5, 3, 1, 1.2, 35, 30, 1, 5, 5, 1),
  mk("carnation", "Œillet", "Ornementaux", 13, 1, 1.3, 6, 3.5, 1.2, 1.5, 25, 30, 1, 5, 10, 1),
  mk("ornamental", "Plante ornementale d'extérieur", "Ornementaux", 8.5, 0.5, 1, 4.5, 2.5, 1.2, 1.5, 20, 20, 1, 5, 10, 1),
  mk("hoagland", "Hoagland & Arnon (1938)", "Scientifiques", 14, 1, 1, 6, 4, 2, 2, 45, 45, 1, 1, 10, 1),
];
