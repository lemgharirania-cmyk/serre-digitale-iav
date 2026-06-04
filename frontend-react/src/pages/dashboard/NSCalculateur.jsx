// src/pages/dashboard/NSCalculateur.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Usage: <NSCalculateur theme="dark|light" lang="FR|EN" />
// Both props are passed down from the parent DashboardLayout (same pattern
// as your other pages that receive theme/lang from the geoportal header)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  FlaskConical, Leaf, Droplets, Zap,
  ChevronUp, ChevronDown, Calculator, Download,
  RotateCcw, CheckCircle, AlertTriangle, Beaker,
  Layers, ArrowRight, TrendingUp, Info, Search, X,
  Sprout, Flower2, Apple, Grape
} from 'lucide-react'
import RecipeLibrary from "../../components/ns/RecipeLibrary";
import WaterAnalysis from "../../components/ns/WaterAnalysis";
import CalculationSummary from "../../components/ns/CalculationSummary";

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════════════════════════════════════ */
const T = {
  FR:{
    title:'Solution Nutritive',
    subtitle:'NS Calculator v1.2 · Luca Incrocci (Univ. Pise) · adapté IAV Hassan II',
    step1:'Étape 1 — Formule nutritive',
    step1sub:'formules prédéfinies · Tapez pour filtrer',
    step2:'Eau d\'irrigation',step2sub:'mM (macro) · µM (micro)',
    step3:'Formule cible',step3sub:'mM (macro) · µM pour Fe, B, Mn, Cu, Zn, Mo',
    step4:'Paramètres de dilution',
    dilution:'Dilution (×)',dilutionHint:'Ex : 200 → solution mère concentrée 200×',
    tankVol:'Volume de la cuve (L)',
    calcBtn:'Calculer la solution nutritive',resetBtn:'Réinitialiser',
    searchPlaceholder:'Rechercher… (ex : T, TO, Tom, Tomate)',
    noResult:'Aucun résultat pour',custom:'Formule personnalisée',
    expand:'Développer',collapse:'Masquer',
    macros:'Macroéléments',micros:'Microéléments',
    neutrality:'Neutralité électrochimique',neutralOk:'Équilibrée',neutralWarn:'Vérifier',
    results:'Composition — Solution réelle',resultsSub:'Après soustraction des apports de l\'eau',
    dosages:'Dosages recommandés',dosagesSub:'Quantités pour la solution mère',
    exportCSV:'Exporter CSV',
    fertName:'Engrais',fertRole:'Rôle',g100L:'g / 100 L',gm3:'g / m³',
    noteText:'Dosages estimés d\'après NS Calculator (Incrocci, 2011). Ajuster selon EC mesurée et pH cible (5.5–6.5). Ordre : acides → calcium → autres sels.',
    waterPure:'Eau pure — aucun engrais nécessaire',
    ecTarget:'EC Cible',ecNote:'optimal 1.5–3.0',
    neutrLabel:'Neutralité',dilLabel:'Dilution',volLabel:'Volume cuve',
    motherSol:'solution mère',litres:'litres',
    groups:{Solanacées:'Solanacées',Cucurbitacées:'Cucurbitacées',Feuillus:'Feuillus',
      Racines:'Racines','Petits fruits':'Petits fruits',Ornementaux:'Ornementaux',
      Aromates:'Aromates',Légumineuses:'Légumineuses',Scientifiques:'Scientifiques'}
  },
  EN:{
    title:'Nutrient Solution',
    subtitle:'NS Calculator v1.2 · Luca Incrocci (Univ. Pisa) · adapted for IAV Hassan II',
    step1:'Step 1 — Nutrient recipe',step1sub:'preset recipes · Type to filter',
    step2:'Irrigation water',step2sub:'mM (macro) · µM (micro)',
    step3:'Target recipe',step3sub:'mM (macro) · µM for Fe, B, Mn, Cu, Zn, Mo',
    step4:'Dilution parameters',
    dilution:'Dilution (×)',dilutionHint:'E.g. 200 → stock solution concentrated 200×',
    tankVol:'Tank volume (L)',
    calcBtn:'Calculate nutrient solution',resetBtn:'Reset',
    searchPlaceholder:'Search… (e.g. T, TO, Tom, Tomato)',
    noResult:'No result for',custom:'Custom recipe',
    expand:'Expand',collapse:'Collapse',
    macros:'Macronutrients',micros:'Micronutrients',
    neutrality:'Electrochemical neutrality',neutralOk:'Balanced',neutralWarn:'Check',
    results:'Composition — Actual solution',resultsSub:'After subtracting irrigation water',
    dosages:'Recommended dosages',dosagesSub:'Amounts for the stock solution',
    exportCSV:'Export CSV',
    fertName:'Fertilizer',fertRole:'Role',g100L:'g / 100 L',gm3:'g / m³',
    noteText:'Dosages estimated from NS Calculator (Incrocci, 2011). Adjust per measured EC and target pH (5.5–6.5). Order: acids → calcium → other salts.',
    waterPure:'Pure water — no fertilizers needed',
    ecTarget:'Target EC',ecNote:'optimal 1.5–3.0',
    neutrLabel:'Neutrality',dilLabel:'Dilution',volLabel:'Tank vol.',
    motherSol:'stock solution',litres:'litres',
    groups:{Solanacées:'Solanaceae',Cucurbitacées:'Cucurbits',Feuillus:'Leafy greens',
      Racines:'Root crops','Petits fruits':'Berries',Ornementaux:'Ornamentals',
      Aromates:'Herbs',Légumineuses:'Legumes',Scientifiques:'Scientific'}
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECIPE DATABASE  (34 formulas, 9 groups)
═══════════════════════════════════════════════════════════════════════════ */
const R = [
  {g:'Solanacées', n:'Tomate',        e:'Tomato',          I:Sprout,      ec:2.09, no3:14,   nh4:1,   p:1,   k:8,  ca:4,  mg:1.5,na:0,so4:2.5,fe:15,b:20,mn:10,cu:1, zn:5, mo:1},
  {g:'Solanacées', n:'Tomate fruit',  e:'Fruiting tomato', I:Sprout,      ec:2.5,  no3:16,   nh4:1,   p:1.2, k:9,  ca:4.5,mg:1.8,na:0,so4:3,  fe:20,b:25,mn:12,cu:1, zn:5, mo:1},
  {g:'Solanacées', n:'Tomate cerise', e:'Cherry tomato',   I:Sprout,      ec:2.8,  no3:17,   nh4:1.2, p:1.5, k:10, ca:5,  mg:2,  na:0,so4:3.5,fe:20,b:25,mn:12,cu:1, zn:5, mo:1},
  {g:'Solanacées', n:'Poivron',       e:'Pepper',          I:Sprout,      ec:1.995,no3:15,   nh4:1,   p:1.3, k:8,  ca:3.5,mg:1.5,na:0,so4:1.5,fe:15,b:30,mn:10,cu:1, zn:5, mo:1},
  {g:'Solanacées', n:'Aubergine',     e:'Aubergine',       I:Sprout,      ec:1.957,no3:15,   nh4:1,   p:1.3, k:7,  ca:3.5,mg:1.8,na:0,so4:1.5,fe:15,b:30,mn:10,cu:1, zn:5, mo:1},
  {g:'Cucurbitacées',n:'Concombre',   e:'Cucumber',        I:Leaf,        ec:1.995,no3:15,   nh4:1,   p:1.2, k:7,  ca:4,  mg:1.5,na:0,so4:1.6,fe:15,b:30,mn:10,cu:1, zn:5, mo:1},
  {g:'Cucurbitacées',n:'Courgette',   e:'Zucchini',        I:Leaf,        ec:2.166,no3:16,   nh4:1.3, p:1.5, k:7.5,ca:4,  mg:2,  na:0,so4:1.8,fe:10,b:50,mn:10,cu:1, zn:5, mo:1},
  {g:'Cucurbitacées',n:'Melon',       e:'Melon',           I:Leaf,        ec:2.033,no3:16,   nh4:1,   p:1.3, k:7,  ca:4,  mg:1.7,na:0,so4:1.5,fe:10,b:20,mn:10,cu:1, zn:5, mo:1},
  {g:'Cucurbitacées',n:'Pastèque',    e:'Watermelon',      I:Leaf,        ec:1.8,  no3:14,   nh4:1,   p:1.5, k:8,  ca:4,  mg:1.5,na:0,so4:2,  fe:15,b:25,mn:10,cu:1, zn:5, mo:1},
  {g:'Feuillus',   n:'Laitue',        e:'Lettuce',         I:Flower2,     ec:2.375,no3:16,   nh4:2,   p:2,   k:10, ca:4.5,mg:1,  na:0,so4:2.5,fe:40,b:30,mn:5, cu:1, zn:5, mo:1},
  {g:'Feuillus',   n:'Épinard',       e:'Spinach',         I:Flower2,     ec:2.0,  no3:13,   nh4:2,   p:1.5, k:8,  ca:4,  mg:1.5,na:0,so4:2,  fe:30,b:25,mn:5, cu:1, zn:5, mo:1},
  {g:'Feuillus',   n:'Roquette',      e:'Rocket',          I:Flower2,     ec:1.8,  no3:12,   nh4:1.5, p:1.5, k:7,  ca:3.5,mg:1,  na:0,so4:1.5,fe:25,b:20,mn:5, cu:1, zn:5, mo:1},
  {g:'Feuillus',   n:'Basilic',       e:'Basil',           I:Flower2,     ec:1.6,  no3:11,   nh4:1,   p:1.2, k:6,  ca:3,  mg:1,  na:0,so4:1.2,fe:20,b:20,mn:5, cu:1, zn:5, mo:1},
  {g:'Feuillus',   n:'Mâche',         e:"Lamb's lettuce",  I:Flower2,     ec:1.4,  no3:10,   nh4:1,   p:1,   k:5,  ca:3,  mg:0.8,na:0,so4:1.2,fe:20,b:18,mn:5, cu:.5,zn:3, mo:.5},
  {g:'Feuillus',   n:'Persil',        e:'Parsley',         I:Flower2,     ec:1.7,  no3:12,   nh4:1.5, p:1.5, k:7,  ca:3.5,mg:1,  na:0,so4:1.5,fe:25,b:20,mn:5, cu:1, zn:5, mo:1},
  {g:'Racines',    n:'Radis',         e:'Radish',          I:Sprout,      ec:1.5,  no3:11,   nh4:1,   p:1.2, k:6,  ca:3,  mg:1,  na:0,so4:1.5,fe:20,b:20,mn:5, cu:1, zn:4, mo:.5},
  {g:'Racines',    n:'Carotte',       e:'Carrot',          I:Sprout,      ec:1.8,  no3:12,   nh4:1,   p:1,   k:7,  ca:3.5,mg:1.2,na:0,so4:1.5,fe:20,b:25,mn:8, cu:1, zn:4, mo:.5},
  {g:'Racines',    n:'Betterave',     e:'Beetroot',        I:Sprout,      ec:2.0,  no3:13,   nh4:1,   p:1.2, k:7,  ca:3.5,mg:1.2,na:0,so4:1.8,fe:20,b:30,mn:8, cu:1, zn:4, mo:.5},
  {g:'Petits fruits',n:'Fraise',      e:'Strawberry',      I:Apple,       ec:1.7,  no3:9.995,nh4:1,   p:1,   k:5.5,ca:3.5,mg:1.2,na:0,so4:2,  fe:20,b:30,mn:10,cu:1, zn:5, mo:1},
  {g:'Petits fruits',n:'Framboise',   e:'Raspberry',       I:Apple,       ec:1.5,  no3:9,    nh4:.8,  p:.8,  k:5,  ca:3,  mg:1,  na:0,so4:1.5,fe:15,b:25,mn:8, cu:1, zn:4, mo:1},
  {g:'Petits fruits',n:'Myrtille',    e:'Blueberry',       I:Grape,       ec:1.3,  no3:8,    nh4:2,   p:1,   k:4,  ca:2.5,mg:.8, na:0,so4:1.2,fe:15,b:20,mn:5, cu:.5,zn:3, mo:.5},
  {g:'Ornementaux',n:'Rose',          e:'Rose',            I:Flower2,     ec:1.52, no3:11,   nh4:1,   p:1.3, k:5,  ca:3,  mg:1,  na:0,so4:1.3,fe:25,b:25,mn:5, cu:1, zn:5, mo:1},
  {g:'Ornementaux',n:'Gerbera',       e:'Gerbera',         I:Flower2,     ec:1.52, no3:11,   nh4:1,   p:1.3, k:5,  ca:3,  mg:1,  na:0,so4:1.2,fe:35,b:30,mn:5, cu:1, zn:5, mo:1},
  {g:'Ornementaux',n:'Chrysanthème',  e:'Chrysanthemum',   I:Flower2,     ec:1.6,  no3:12,   nh4:1,   p:1.2, k:5.5,ca:3,  mg:1,  na:0,so4:1.2,fe:25,b:25,mn:8, cu:1, zn:5, mo:1},
  {g:'Ornementaux',n:'Carnation',     e:'Carnation',       I:Flower2,     ec:1.748,no3:13,   nh4:1,   p:1.3, k:6,  ca:3.5,mg:1.2,na:0,so4:1.5,fe:25,b:30,mn:10,cu:1, zn:5, mo:1},
  {g:'Aromates',   n:'Menthe',        e:'Mint',            I:Leaf,        ec:1.5,  no3:11,   nh4:1,   p:1,   k:5.5,ca:3,  mg:.8, na:0,so4:1.2,fe:20,b:18,mn:5, cu:.5,zn:3, mo:.5},
  {g:'Aromates',   n:'Coriandre',     e:'Coriander',       I:Leaf,        ec:1.6,  no3:12,   nh4:1,   p:1.2, k:6,  ca:3,  mg:1,  na:0,so4:1.5,fe:20,b:20,mn:5, cu:1, zn:4, mo:1},
  {g:'Aromates',   n:'Thym',          e:'Thyme',           I:Leaf,        ec:1.4,  no3:10,   nh4:.8,  p:1,   k:5,  ca:2.8,mg:.8, na:0,so4:1,  fe:18,b:18,mn:5, cu:.5,zn:3, mo:.5},
  {g:'Légumineuses',n:'Haricot',      e:'Bean',            I:Sprout,      ec:1.7,  no3:12,   nh4:1,   p:1.2, k:5.5,ca:3.5,mg:1.2,na:0,so4:1.2,fe:15,b:50,mn:10,cu:1, zn:5, mo:2},
  {g:'Légumineuses',n:'Pois',         e:'Pea',             I:Sprout,      ec:1.5,  no3:11,   nh4:.8,  p:1,   k:5,  ca:3,  mg:1,  na:0,so4:1,  fe:15,b:40,mn:8, cu:1, zn:4, mo:2},
  {g:'Scientifiques',n:'Hoagland ×1', e:'Hoagland ×1',     I:FlaskConical,ec:1.995,no3:14,   nh4:1,   p:1,   k:6,  ca:4,  mg:2,  na:0,so4:2,  fe:45,b:45,mn:10,cu:1, zn:1, mo:1},
  {g:'Scientifiques',n:'Hoagland ½',  e:'Hoagland ½',      I:FlaskConical,ec:1.2,  no3:7,    nh4:.5,  p:.5,  k:3,  ca:2,  mg:1,  na:0,so4:1,  fe:22,b:22,mn:5, cu:.5,zn:.5,mo:.5},
  {g:'Scientifiques',n:'Knop',        e:'Knop',            I:FlaskConical,ec:1.4,  no3:5,    nh4:0,   p:1,   k:1,  ca:4,  mg:1,  na:0,so4:1,  fe:20,b:10,mn:5, cu:.1,zn:.1,mo:.1},
  {g:'Scientifiques',n:'MS Murashige',e:'MS Murashige',    I:FlaskConical,ec:1.1,  no3:19.7, nh4:20.6,p:1.25,k:20.1,ca:2.99,mg:1.5,na:0,so4:1.5,fe:100,b:100,mn:100,cu:.1,zn:.3,mo:1},
]

const GROUPS     = [...new Set(R.map(r => r.g))]
const GRP_COLOR  = {
  Solanacées:'#22C55E',Cucurbitacées:'#06B6D4',Feuillus:'#84CC16',
  Racines:'#F59E0B','Petits fruits':'#EF4444',Ornementaux:'#EC4899',
  Aromates:'#8B5CF6',Légumineuses:'#F97316',Scientifiques:'#3B82F6'
}

/* ═══════════════════════════════════════════════════════════════════════════
   NUTRIENT METADATA
═══════════════════════════════════════════════════════════════════════════ */
const MACRO = [
  {id:'no3',label:'N-NO₃⁻',unit:'mM',color:'#22C55E',max:20,mw:62},
  {id:'nh4',label:'N-NH₄⁺',unit:'mM',color:'#84CC16',max:5, mw:18},
  {id:'p',  label:'P-PO₄³⁻',unit:'mM',color:'#F59E0B',max:5, mw:30.97},
  {id:'k',  label:'K⁺',     unit:'mM',color:'#8B5CF6',max:15,mw:39.1},
  {id:'ca', label:'Ca²⁺',   unit:'mM',color:'#06B6D4',max:10,mw:40.08},
  {id:'mg', label:'Mg²⁺',   unit:'mM',color:'#3B82F6',max:5, mw:24.3},
  {id:'so4',label:'S-SO₄²⁻',unit:'mM',color:'#F97316',max:8, mw:96},
  {id:'na', label:'Na⁺',    unit:'mM',color:'#64748B',max:3, mw:23},
]
const MICRO = [
  {id:'fe',label:'Fe',unit:'µM',color:'#EF4444',max:60,mw:55.85},
  {id:'b', label:'B', unit:'µM',color:'#EC4899',max:60,mw:10.81},
  {id:'mn',label:'Mn',unit:'µM',color:'#FB923C',max:30,mw:54.94},
  {id:'cu',label:'Cu',unit:'µM',color:'#0EA5E9',max:5, mw:63.55},
  {id:'zn',label:'Zn',unit:'µM',color:'#A78BFA',max:10,mw:65.38},
  {id:'mo',label:'Mo',unit:'µM',color:'#34D399',max:2, mw:95.96},
]
const WATER_F = [
  {id:'wec',  label:'EC',   unit:'dS/m'},{id:'whco3',label:'HCO₃⁻',unit:'mM'},
  {id:'wno3', label:'NO₃⁻', unit:'mM'}, {id:'wnh4', label:'NH₄⁺',  unit:'mM'},
  {id:'wp',   label:'P',    unit:'mM'}, {id:'wk',   label:'K⁺',    unit:'mM'},
  {id:'wca',  label:'Ca²⁺', unit:'mM'}, {id:'wmg',  label:'Mg²⁺',  unit:'mM'},
  {id:'wso4', label:'SO₄²⁻',unit:'mM'}, {id:'wna',  label:'Na⁺',   unit:'mM'},
  {id:'wcl',  label:'Cl⁻',  unit:'mM'}, {id:'wfe',  label:'Fe',    unit:'µM'},
]
const REC_DEF = {ec:2.09,no3:14,nh4:1,p:1,k:8,ca:4,mg:1.5,na:0,so4:2.5,fe:15,b:20,mn:10,cu:1,zn:5,mo:1}

/* ═══════════════════════════════════════════════════════════════════════════
   THEME VARIABLES
═══════════════════════════════════════════════════════════════════════════ */
const DARK = {
  panel:'rgba(16,27,46,0.82)',panelBorder:'rgba(255,255,255,0.07)',
  ink:'#F8FAFC',ink2:'#CBD5E1',ink3:'#94A3B8',ink4:'#64748B',
  inputBg:'rgba(255,255,255,0.05)',inputBorder:'rgba(255,255,255,0.09)',
  inputFocus:'rgba(34,197,94,0.5)',inputShadow:'0 0 0 3px rgba(34,197,94,0.1)',
  rowBg:'rgba(255,255,255,0.025)',rowHover:'rgba(34,197,94,0.06)',
  divider:'rgba(255,255,255,0.05)',dividerTxt:'rgba(100,116,139,0.7)',
  noteBg:'rgba(59,130,246,0.07)',noteBorder:'rgba(59,130,246,0.18)',
  searchBg:'rgba(255,255,255,0.04)',searchBorder:'rgba(255,255,255,0.09)',
  activeRowBg:(c)=>`${c}20`,
}
const LIGHT = {
  panel:'#ffffff',panelBorder:'rgba(16,48,36,0.08)',
  ink:'#0c1f17',ink2:'#33463d',ink3:'#6b7e75',ink4:'#9aa8a0',
  inputBg:'rgba(16,48,36,0.03)',inputBorder:'rgba(16,48,36,0.14)',
  inputFocus:'rgba(47,154,100,0.55)',inputShadow:'0 0 0 3px rgba(47,154,100,0.1)',
  rowBg:'rgba(16,48,36,0.02)',rowHover:'rgba(47,154,100,0.05)',
  divider:'rgba(16,48,36,0.07)',dividerTxt:'#9aa8a0',
  noteBg:'rgba(59,130,246,0.05)',noteBorder:'rgba(59,130,246,0.15)',
  searchBg:'rgba(16,48,36,0.03)',searchBorder:'rgba(16,48,36,0.14)',
  activeRowBg:(c)=>`${c}14`,
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMALL HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const gv = (o,k) => parseFloat(o[k])||0

function calcNeut(w){
  const cat=gv(w,'wnh4')+gv(w,'wk')+2*gv(w,'wca')+2*gv(w,'wmg')+gv(w,'wna')
  const an=gv(w,'wno3')+gv(w,'whco3')+gv(w,'wp')+2*gv(w,'wso4')+gv(w,'wcl')
  return{cat,an,diff:cat-an}
}
function calcActual(water,recipe){
  const a={}
  ;['no3','nh4','p','k','ca','mg','na','so4'].forEach(k=>a[k]=Math.max(0,(recipe[k]||0)-gv(water,'w'+k)))
  a.fe=Math.max(0,(recipe.fe||0)-gv(water,'wfe'))
  ;['b','mn','cu','zn','mo'].forEach(k=>a[k]=recipe[k]||0)
  return a
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════════════════════════════ */
function Panel({children,v,style={}}){
  return(
    <div style={{background:v.panel,border:`1px solid ${v.panelBorder}`,borderRadius:20,padding:24,
      marginBottom:14,position:'relative',overflow:'hidden',transition:'border-color .25s',
      ...style}}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,255,255,.025),transparent 40%)',pointerEvents:'none',borderRadius:20}}/>
      {children}
    </div>
  )
}
function SecIcon({Icon,color,isDark}){
  return(
    <div style={{width:32,height:32,borderRadius:10,flexShrink:0,
      background:isDark?`${color}22`:`${color}18`,border:`1px solid ${color}33`,
      display:'flex',alignItems:'center',justifyContent:'center',color}}>
      <Icon size={15}/>
    </div>
  )
}
function Div({label,v}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:10,margin:'16px 0 10px',
      fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',
      color:v.dividerTxt,fontFamily:'JetBrains Mono,monospace'}}>
      {label}<div style={{flex:1,height:1,background:v.divider}}/>
    </div>
  )
}
function FInput({label,unit,value,onChange,v}){
  const [f,setF]=useState(false)
  return(
    <div>
      <div style={{fontSize:10,letterSpacing:'.09em',textTransform:'uppercase',color:v.ink3,
        marginBottom:5,display:'flex',justifyContent:'space-between'}}>
        <span>{label}</span><span style={{color:v.ink4,fontSize:9}}>{unit}</span>
      </div>
      <input type="number" step=".01" min="0" value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:'100%',height:36,background:v.inputBg,
          border:`1.5px solid ${f?v.inputFocus:v.inputBorder}`,
          borderRadius:10,padding:'0 10px',fontSize:13,
          fontFamily:'JetBrains Mono,monospace',color:v.ink,outline:'none',
          boxShadow:f?v.inputShadow:'none',
          transition:'border-color .2s,box-shadow .2s,background .2s'}}/>
    </div>
  )
}
function NBar({field,value,delay,v}){
  const [m,setM]=useState(false)
  useEffect(()=>{const t=setTimeout(()=>setM(true),delay);return()=>clearTimeout(t)},[delay])
  const pct=Math.min(100,(value/field.max)*100)
  const isMicro=['fe','b','mn','cu','zn','mo'].includes(field.id)
  const ppm=isMicro?null:(value*field.mw).toFixed(1)
  return(
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',
      borderBottom:`1px solid ${v.divider}`,
      opacity:m?1:0,transform:m?'translateX(0)':'translateX(-8px)',
      transition:'opacity .35s ease,transform .35s ease'}}>
      <div style={{width:72,fontSize:12,fontWeight:500,color:v.ink,flexShrink:0}}>{field.label}</div>
      <div style={{flex:1,height:5,background:`${field.color}18`,borderRadius:3,overflow:'hidden'}}>
        <div style={{width:`${m?pct:0}%`,height:'100%',borderRadius:3,
          background:`linear-gradient(90deg,${field.color}88,${field.color})`,
          transition:'width .8s cubic-bezier(.22,1,.36,1)'}}/>
      </div>
      <div style={{width:56,textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:600,color:v.ink}}>{value.toFixed(2)}</div>
      <div style={{width:28,fontSize:10,color:v.ink4,flexShrink:0}}>{field.unit}</div>
      <div style={{width:56,textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:11,color:v.ink4,flexShrink:0}}>{ppm?`${ppm} ppm`:'—'}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECIPE PICKER — vertical, searchable, country-selector style
═══════════════════════════════════════════════════════════════════════════ */
function RecipePicker({active,onSelect,lang,v,isDark}){
  const [q,setQ]=useState('')
  const listRef=useRef(null)
  const t=T[lang]

  const filtered=useMemo(()=>{
    const s=q.trim().toLowerCase()
    if(!s)return R
    return R.filter(r=>{
      const name=(lang==='EN'?r.e:r.n).toLowerCase()
      const grp=(t.groups[r.g]||r.g).toLowerCase()
      return name.startsWith(s)||name.includes(s)||grp.startsWith(s)
    })
  },[q,lang,t])

  const grouped=useMemo(()=>{
    const m={}
    filtered.forEach(r=>{if(!m[r.g])m[r.g]=[];m[r.g].push(r)})
    return m
  },[filtered])

  return(
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {/* Search bar */}
      <div style={{position:'relative'}}>
        <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:v.ink4,pointerEvents:'none'}}/>
        <input type="text" placeholder={t.searchPlaceholder} value={q}
          onChange={e=>setQ(e.target.value)}
          style={{width:'100%',height:42,background:v.searchBg,
            border:`1.5px solid ${v.searchBorder}`,borderRadius:12,
            padding:'0 36px',fontSize:13,fontFamily:'Inter,sans-serif',
            color:v.ink,outline:'none',transition:'border-color .2s,box-shadow .2s'}}
          onFocus={e=>{e.target.style.borderColor=v.inputFocus;e.target.style.boxShadow=v.inputShadow}}
          onBlur={e=>{e.target.style.borderColor=v.searchBorder;e.target.style.boxShadow='none'}}/>
        {q&&(
          <button onClick={()=>setQ('')} style={{position:'absolute',right:10,top:'50%',
            transform:'translateY(-50%)',background:'none',border:'none',color:v.ink4,
            cursor:'pointer',display:'flex',alignItems:'center',padding:2}}>
            <X size={14}/>
          </button>
        )}
      </div>

      {/* Scroll area */}
      <div style={{position:'relative'}}>
        {/* Up arrow */}
        <button onClick={()=>listRef.current?.scrollBy({top:-110,behavior:'smooth'})}
          style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
            zIndex:2,width:32,height:22,border:'none',cursor:'pointer',
            background:`linear-gradient(to bottom,${v.panel},transparent)`,
            display:'flex',alignItems:'center',justifyContent:'center',
            color:v.ink4,borderRadius:4,transition:'color .15s'}}>
          <ChevronUp size={14}/>
        </button>

        {/* Scrollable list */}
        <div ref={listRef} className="ns-scroll"
          style={{height:310,overflowY:'auto',scrollBehavior:'smooth',
            padding:'22px 0 22px',
            maskImage:'linear-gradient(to bottom,transparent 0%,black 9%,black 91%,transparent 100%)',
            WebkitMaskImage:'linear-gradient(to bottom,transparent 0%,black 9%,black 91%,transparent 100%)'}}>

          {Object.keys(grouped).length===0?(
            <div style={{textAlign:'center',padding:'40px 16px',color:v.ink4,fontSize:13}}>
              <Search size={22} style={{margin:'0 auto 10px',display:'block',opacity:.3}}/>
              {t.noResult} «{q}»
            </div>
          ):Object.entries(grouped).map(([grp,recipes])=>(
            <div key={grp}>
              {/* Group header */}
              <div style={{display:'flex',alignItems:'center',gap:7,
                padding:'5px 14px 3px',fontSize:9,letterSpacing:'.14em',
                textTransform:'uppercase',fontFamily:'JetBrains Mono,monospace',
                fontWeight:600,color:GRP_COLOR[grp]||v.ink4}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:GRP_COLOR[grp]||v.ink4,flexShrink:0}}/>
                {t.groups[grp]||grp}
              </div>

              {/* Rows */}
              {recipes.map(r=>{
                const isActive=active===r.n
                const Icon=r.I||Leaf
                const name=lang==='EN'?r.e:r.n
                const c=GRP_COLOR[r.g]||'#22C55E'
                return(
                  <button key={r.n} onClick={()=>onSelect(r)}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:12,
                      padding:'9px 14px',
                      background:isActive?v.activeRowBg(c):'transparent',
                      border:'none',
                      borderLeft:`2.5px solid ${isActive?c:'transparent'}`,
                      cursor:'pointer',transition:'all .18s ease',textAlign:'left'}}
                    onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background=v.rowHover}}
                    onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background='transparent'}}>

                    {/* Icon badge */}
                    <div style={{width:30,height:30,borderRadius:9,flexShrink:0,
                      background:isDark?`${c}22`:`${c}15`,border:`1px solid ${c}33`,
                      display:'flex',alignItems:'center',justifyContent:'center',color:c,
                      transition:'transform .18s ease'}}>
                      <Icon size={13}/>
                    </div>

                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:isActive?600:400,
                        color:isActive?c:v.ink2,transition:'color .15s',
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {name}
                      </div>
                      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:v.ink4,marginTop:1}}>
                        EC {r.ec} dS/m · NO₃ {r.no3} mM
                      </div>
                    </div>

                    {isActive&&<CheckCircle size={14} style={{color:c,flexShrink:0}}/>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Down arrow */}
        <button onClick={()=>listRef.current?.scrollBy({top:110,behavior:'smooth'})}
          style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',
            zIndex:2,width:32,height:22,border:'none',cursor:'pointer',
            background:`linear-gradient(to top,${v.panel},transparent)`,
            display:'flex',alignItems:'center',justifyContent:'center',
            color:v.ink4,borderRadius:4,transition:'color .15s'}}>
          <ChevronDown size={14}/>
        </button>

        {/* Count */}
        <div style={{textAlign:'center',fontSize:10,fontFamily:'JetBrains Mono,monospace',
          color:v.ink4,marginTop:6}}>
          {filtered.length} / {R.length} {lang==='EN'?'recipes':'formules'}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function NSCalculateur({theme='light',lang='FR'}){
  const isDark=theme==='dark'
  const v=isDark?DARK:LIGHT
  const t=T[lang]

  const [active,setActive]=useState(null)
  const [water,setWater]=useState(()=>Object.fromEntries(WATER_F.map(f=>[f.id,0])))
  const [recipe,setRecipe]=useState({...REC_DEF})
  const [dilution,setDilution]=useState(200)
  const [tankVol,setTankVol]=useState(100)
  const [results,setResults]=useState(null)
  const [showWater,setShowWater]=useState(false)

  function loadRecipe(r){
    setActive(r.n)
    setRecipe({ec:r.ec,no3:r.no3,nh4:r.nh4,p:r.p,k:r.k,ca:r.ca,mg:r.mg,
      na:r.na,so4:r.so4,fe:r.fe,b:r.b,mn:r.mn,cu:r.cu??1,zn:r.zn??5,mo:r.mo??1})
    setResults(null)
  }
  function reset(){setActive(null);setRecipe({...REC_DEF});setWater(Object.fromEntries(WATER_F.map(f=>[f.id,0])));setDilution(200);setTankVol(100);setResults(null)}

  function calculate(){
    const act=calcActual(water,recipe)
    const rCat=(act.nh4||0)+(act.k||0)+2*(act.ca||0)+2*(act.mg||0)+(act.na||0)
    const rAn=(act.no3||0)+(act.p||0)+2*(act.so4||0)
    const ferts=[
      {n:'Calcium nitrate',     role:'Ca²⁺ + NO₃⁻', qty:(act.ca||0)*164.09*dilution*tankVol/1e6},
      {n:'Potassium nitrate',   role:'K⁺ + NO₃⁻',   qty:(act.k||0)*101.1*dilution*tankVol/2e6},
      {n:'Mono-KH₂PO₄',        role:'K⁺ + H₂PO₄⁻', qty:(act.p||0)*136.1*dilution*tankVol/1e6},
      {n:'Magnesium sulphate',  role:'Mg²⁺ + SO₄²⁻',qty:(act.mg||0)*246.48*dilution*tankVol/1e6},
      {n:'Boric acid',          role:'Boron (B)',     qty:(act.b||0)*61.83*dilution*tankVol/1e9},
      {n:'Iron EDDHA (6%)',     role:'Fe chélaté',    qty:(act.fe||0)*55.85*dilution*tankVol/1e9},
      {n:'Nitric acid 65%',     role:'Neutr. HCO₃⁻', qty:gv(water,'whco3')*63.01*dilution*tankVol/1e6/0.65},
    ].filter(d=>d.qty>0.001)
    setResults({act,rCat,rAn,rdiff:rCat-rAn,ferts})
  }

  function exportCSV(){
    if(!results)return
    const rows=['Nutriment,mM/µM,ppm']
    ;[...MACRO,...MICRO].forEach(f=>{const val=results.act[f.id]||0;rows.push(`${f.label},${val.toFixed(3)},${(val*f.mw).toFixed(2)}`)})
    const a=document.createElement('a')
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(rows.join('\n'))
    a.download=`NS_IAV_${active||'custom'}.csv`;a.click()
  }

  const neut=calcNeut(water)
  const neutOk=Math.abs(neut.diff)<0.5
  const activeColor=active?GRP_COLOR[R.find(r=>r.n===active)?.g]||'#22C55E':'#22C55E'
  const activeName=active?(lang==='EN'?R.find(r=>r.n===active)?.e:active):null

  const inp={width:'100%',height:36,background:v.inputBg,border:`1.5px solid ${v.inputBorder}`,
    borderRadius:10,padding:'0 10px',fontSize:13,fontFamily:'JetBrains Mono,monospace',
    color:v.ink,outline:'none',transition:'all .2s'}

  return(
    <div style={{animation:'nsFadeUp .4s ease'}}>
      <style>{`
        @keyframes nsFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes nsPulse{0%,100%{opacity:.7}50%{opacity:1}}
        .ns-scroll::-webkit-scrollbar{width:4px}
        .ns-scroll::-webkit-scrollbar-track{background:transparent}
        .ns-scroll::-webkit-scrollbar-thumb{background:rgba(100,116,139,.3);border-radius:2px}
      `}</style>

      {/* ─── TOP BAR ─── */}
      <div className="admin-top">
        <div>
          <h1 style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{width:38,height:38,borderRadius:11,flexShrink:0,
              background:isDark?'linear-gradient(135deg,rgba(34,197,94,.2),rgba(6,182,212,.15))':'linear-gradient(135deg,rgba(47,154,100,.15),rgba(55,115,189,.12))',
              border:`1px solid ${isDark?'rgba(34,197,94,.25)':'rgba(47,154,100,.2)'}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              animation:'nsPulse 3s infinite'}}>
              <FlaskConical size={18} color={isDark?'#22C55E':'#2f9a64'}/>
            </span>
            {t.title}
          </h1>
          <div className="admin-sub">{t.subtitle}</div>
        </div>
        <div className="admin-top-r">
          <span style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',
            borderRadius:999,fontSize:11,fontFamily:'JetBrains Mono,monospace',
            background:isDark?`${activeColor}18`:`${activeColor}12`,
            border:`1px solid ${activeColor}30`,color:activeColor}}>
            <Leaf size={11}/>{activeName||t.custom}
          </span>
          <button onClick={reset}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
              borderRadius:999,fontSize:12,background:v.inputBg,
              border:`1px solid ${v.inputBorder}`,color:v.ink3,cursor:'pointer',transition:'all .2s'}}>
            <RotateCcw size={13}/>{t.resetBtn}
          </button>
        </div>
      </div>

      {/* ─── MAIN GRID: picker + params ─── */}
      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:14,marginBottom:14}}>

        {/* LEFT: VERTICAL PICKER */}
        <Panel v={v}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <SecIcon Icon={Leaf} color={isDark?'#22C55E':'#2f9a64'} isDark={isDark}/>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:v.ink}}>{t.step1}</div>
              <div style={{fontSize:10,color:v.ink4,marginTop:1}}>{R.length} {t.step1sub}</div>
            </div>
          </div>
          <RecipePicker active={active} onSelect={loadRecipe} lang={lang} v={v} isDark={isDark}/>
        </Panel>

        {/* RIGHT: WATER + RECIPE */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Water */}
          <Panel v={v} style={{flex:'0 0 auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <SecIcon Icon={Droplets} color={isDark?'#06B6D4':'#3773bd'} isDark={isDark}/>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:v.ink}}>{t.step2}</div>
                  <div style={{fontSize:10,color:v.ink4,marginTop:1}}>{t.step2sub}</div>
                </div>
              </div>
              <button onClick={()=>setShowWater(!showWater)}
                style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',
                  borderRadius:8,fontSize:11,background:v.inputBg,border:`1px solid ${v.inputBorder}`,
                  color:v.ink3,cursor:'pointer',transition:'all .18s'}}>
                {showWater?t.collapse:t.expand}
                <ArrowRight size={11} style={{transform:showWater?'rotate(90deg)':'none',transition:'transform .2s'}}/>
              </button>
            </div>
            {showWater&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px 10px',animation:'nsFadeUp .3s ease'}}>
                {WATER_F.map(f=>(
                  <FInput key={f.id} label={f.label} unit={f.unit} value={water[f.id]}
                    onChange={val=>setWater(p=>({...p,[f.id]:val}))} v={v}/>
                ))}
              </div>
            )}
            {/* Neutrality */}
            <div style={{marginTop:10,padding:'9px 12px',
              background:isDark?`rgba(${neutOk?'34,197,94':'245,158,11'},.07)`:`rgba(${neutOk?'47,154,100':'214,147,42'},.06)`,
              border:`1px solid rgba(${neutOk?'34,197,94':'245,158,11'},.2)`,borderRadius:10}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:v.ink3}}>
                  {neutOk?<CheckCircle size={12} color={isDark?'#22C55E':'#2f9a64'}/>:<AlertTriangle size={12} color="#F59E0B"/>}
                  {t.neutrality}
                </div>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,
                  color:neutOk?(isDark?'#4ADE80':'#2f9a64'):'#F59E0B'}}>
                  Δ={neut.diff.toFixed(2)} · {neutOk?t.neutralOk:t.neutralWarn}
                </span>
              </div>
            </div>
          </Panel>

          {/* Recipe */}
          <Panel v={v} style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <SecIcon Icon={Beaker} color={isDark?'#F59E0B':'#d6932a'} isDark={isDark}/>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:v.ink}}>{t.step3}</div>
                <div style={{fontSize:10,color:v.ink4,marginTop:1}}>{t.step3sub}</div>
              </div>
            </div>
            <Div label={t.macros} v={v}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px 10px',marginBottom:10}}>
              {[{id:'ec',label:'EC cible',unit:'dS/m'},{id:'no3',label:'NO₃⁻',unit:'mM'},
                {id:'nh4',label:'NH₄⁺',unit:'mM'},{id:'p',label:'P',unit:'mM'},
                {id:'k',label:'K⁺',unit:'mM'},{id:'ca',label:'Ca²⁺',unit:'mM'},
                {id:'mg',label:'Mg²⁺',unit:'mM'},{id:'so4',label:'SO₄²⁻',unit:'mM'},
              ].map(f=>(
                <FInput key={f.id} label={f.label} unit={f.unit} value={recipe[f.id]??0}
                  onChange={val=>{setRecipe(p=>({...p,[f.id]:val}));setResults(null)}} v={v}/>
              ))}
            </div>
            <Div label={t.micros} v={v}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'8px 10px'}}>
              {['fe','b','mn','cu','zn','mo'].map(id=>(
                <FInput key={id} label={id.toUpperCase()} unit="µM" value={recipe[id]??0}
                  onChange={val=>{setRecipe(p=>({...p,[id]:val}));setResults(null)}} v={v}/>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* ─── DILUTION + CALC BUTTON ─── */}
      <Panel v={v}>
        <div style={{display:'flex',gap:16,alignItems:'flex-end'}}>
          {[{label:t.dilution,val:dilution,set:setDilution,hint:t.dilutionHint,Icon:Layers,color:isDark?'#8B5CF6':'#7c5ccf'},
            {label:t.tankVol, val:tankVol, set:setTankVol, hint:'',         Icon:Droplets,color:isDark?'#06B6D4':'#3773bd'}
          ].map(({label,val,set,hint,Icon,color})=>(
            <div key={label} style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <SecIcon Icon={Icon} color={color} isDark={isDark}/>
                <span style={{fontSize:12,color:v.ink3,fontWeight:500}}>{label}</span>
              </div>
              <input type="number" value={val} min={1} onChange={e=>set(Number(e.target.value))} style={inp}/>
              {hint&&<div style={{fontSize:10,color:v.ink4,marginTop:4}}>{hint}</div>}
            </div>
          ))}
          <div style={{flex:2.5}}>
            <button onClick={calculate}
              style={{width:'100%',height:50,background:'linear-gradient(135deg,#22C55E,#06B6D4)',
                border:'none',borderRadius:14,color:'white',fontFamily:'Inter,sans-serif',
                fontSize:15,fontWeight:700,letterSpacing:'-.3px',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                boxShadow:'0 8px 24px rgba(34,197,94,.3)',transition:'transform .2s,box-shadow .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 14px 32px rgba(34,197,94,.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 8px 24px rgba(34,197,94,.3)'}}>
              <Calculator size={19}/>{t.calcBtn}<ArrowRight size={16}/>
            </button>
          </div>
        </div>
      </Panel>

      {/* ─── RESULTS ─── */}
      {results&&(
        <div style={{animation:'nsFadeUp .4s ease'}}>

          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
            {[
              {label:t.ecTarget,val:recipe.ec.toFixed(2),unit:'dS/m',Icon:Zap,color:'#22C55E',note:t.ecNote},
              {label:t.neutrLabel,val:results.rdiff.toFixed(2),unit:'Δ',Icon:CheckCircle,
                color:Math.abs(results.rdiff)<.5?'#22C55E':'#F59E0B',
                note:Math.abs(results.rdiff)<.5?t.neutralOk:t.neutralWarn},
              {label:t.dilLabel,val:`${dilution}×`,unit:'',Icon:Layers,color:'#8B5CF6',note:t.motherSol},
              {label:t.volLabel,val:tankVol,unit:'L',Icon:Droplets,color:'#06B6D4',note:t.litres},
            ].map((k,i)=>(
              <div key={i}
                style={{background:isDark?'rgba(22,35,56,.9)':'white',
                  border:`1px solid ${v.panelBorder}`,borderRadius:18,padding:'18px 20px',
                  transition:'transform .25s,box-shadow .25s,border-color .25s',animationDelay:`${i*60}ms`,cursor:'default'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor=`${k.color}44`;e.currentTarget.style.boxShadow=isDark?'0 12px 32px rgba(0,0,0,.3)':'0 8px 24px rgba(12,31,23,.1)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor=v.panelBorder;e.currentTarget.style.boxShadow='none'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <span style={{fontSize:10,letterSpacing:'.08em',textTransform:'uppercase',color:v.ink3,fontFamily:'JetBrains Mono,monospace'}}>{k.label}</span>
                  <k.Icon size={15} color={k.color}/>
                </div>
                <div style={{fontSize:32,fontWeight:700,letterSpacing:'-2px',fontFamily:'JetBrains Mono,monospace',color:v.ink,lineHeight:1}}>{k.val}</div>
                <div style={{fontSize:11,color:k.color,marginTop:8}}>{k.unit}{k.unit?' · ':''}{k.note}</div>
              </div>
            ))}
          </div>

          {/* Nutrient bars */}
          <Panel v={v}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <SecIcon Icon={TrendingUp} color={isDark?'#22C55E':'#2f9a64'} isDark={isDark}/>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:v.ink}}>{t.results}</div>
                  <div style={{fontSize:11,color:v.ink4,marginTop:1}}>{t.resultsSub}</div>
                </div>
              </div>
              <button onClick={exportCSV}
                style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
                  borderRadius:10,fontSize:12,fontFamily:'Inter,sans-serif',
                  background:v.inputBg,border:`1px solid ${v.inputBorder}`,
                  color:v.ink3,cursor:'pointer',transition:'all .18s'}}
                onMouseEnter={e=>{e.currentTarget.style.color=isDark?'#4ADE80':'#2f9a64';e.currentTarget.style.borderColor=isDark?'rgba(34,197,94,.3)':'rgba(47,154,100,.3)'}}
                onMouseLeave={e=>{e.currentTarget.style.color=v.ink3;e.currentTarget.style.borderColor=v.inputBorder}}>
                <Download size={13}/>{t.exportCSV}
              </button>
            </div>
            <Div label={t.macros} v={v}/>
            {MACRO.map((f,i)=><NBar key={f.id} field={f} value={results.act[f.id]||0} delay={i*45} v={v}/>)}
            <Div label={t.micros} v={v}/>
            {MICRO.map((f,i)=><NBar key={f.id} field={f} value={results.act[f.id]||0} delay={i*45} v={v}/>)}
          </Panel>

          {/* Fertilizer table */}
          <Panel v={v}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <SecIcon Icon={Beaker} color={isDark?'#F59E0B':'#d6932a'} isDark={isDark}/>
              <div>
                <div style={{fontSize:15,fontWeight:600,color:v.ink}}>{t.dosages}</div>
                <div style={{fontSize:11,color:v.ink4,marginTop:1}}>{t.dosagesSub} ({tankVol} L × {dilution})</div>
              </div>
            </div>
            {results.ferts.length===0?(
              <div style={{textAlign:'center',padding:'28px',color:v.ink4,fontSize:13}}>
                <CheckCircle size={22} style={{margin:'0 auto 10px',display:'block',color:isDark?'#22C55E':'#2f9a64'}}/>
                {t.waterPure}
              </div>
            ):(
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 6px',fontSize:12}}>
                  <thead>
                    <tr>{[t.fertName,t.fertRole,t.g100L,t.gm3].map(h=>(
                      <th key={h} style={{textAlign:h===t.g100L||h===t.gm3?'right':'left',
                        padding:'4px 12px',fontSize:9,letterSpacing:'.1em',textTransform:'uppercase',
                        color:v.ink4,fontFamily:'JetBrains Mono,monospace',fontWeight:500}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {results.ferts.map((f,i)=>(
                      <tr key={i}
                        onMouseEnter={e=>Array.from(e.currentTarget.cells).forEach(c=>c.style.background=v.rowHover)}
                        onMouseLeave={e=>Array.from(e.currentTarget.cells).forEach(c=>c.style.background=v.rowBg)}>
                        {[f.n,f.role,(f.qty*1000).toFixed(1),(f.qty*1000/tankVol*1000).toFixed(1)].map((cell,ci)=>(
                          <td key={ci} style={{padding:'10px 12px',background:v.rowBg,
                            color:ci===0?v.ink:ci===3?(isDark?'#22C55E':'#2f9a64'):v.ink2,
                            fontWeight:ci===0?500:400,
                            fontFamily:ci>=2?'JetBrains Mono,monospace':'inherit',
                            textAlign:ci>=2?'right':'left',
                            borderRadius:ci===0?'10px 0 0 10px':ci===3?'0 10px 10px 0':'0',
                            transition:'background .15s'}}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{marginTop:14,padding:'10px 14px',background:v.noteBg,
              border:`1px solid ${v.noteBorder}`,borderRadius:10,
              display:'flex',gap:8,alignItems:'flex-start',fontSize:11,color:v.ink3}}>
              <Info size={13} style={{color:isDark?'#3B82F6':'#3773bd',flexShrink:0,marginTop:1}}/>
              {t.noteText}
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
