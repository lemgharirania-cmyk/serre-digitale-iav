// src/services/nsRecipesApi.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Client TypeScript des recettes (backend FastAPI + Supabase).
//  Base URL : VITE_API_URL (ex. https://ton-backend.onrender.com), sinon "".
//  Repli hors-ligne : si l'API échoue, on lit/écrit dans localStorage afin de
//  ne jamais bloquer l'utilisateur (utile aussi en dev sans backend lancé).
// ─────────────────────────────────────────────────────────────────────────────
import type { Recipe, IonMap } from "../pages/dashboard/nsEngine";

const BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, "") ?? "";
const ENDPOINT = `${BASE}/api/ns/recipes`;
const LS_KEY = "ns_custom_recipes_v1"; // cache local / repli

/* ---- type renvoyé par le backend ---- */
interface ApiRecipe {
  id: string;
  name: string;
  group_name: string;
  target: Partial<IonMap>;
  validated: boolean;
  ec_target?: number | null;
  greenhouse?: string | null;
  created_at?: string;
}

const fromApi = (r: ApiRecipe): Recipe => ({
  id: r.id,
  name: r.name,
  group: r.group_name,
  validated: r.validated,
  ec: r.ec_target ?? undefined,
  target: r.target,
});

/* ---- repli localStorage ---- */
function lsRead(): Recipe[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function lsWrite(list: Recipe[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/* ───────────────────────── API publique ───────────────────────── */

/** Liste les recettes personnalisées (filtrage serre optionnel). */
export async function listRecipes(greenhouse?: string): Promise<Recipe[]> {
  try {
    const url = new URL(ENDPOINT, window.location.origin);
    if (greenhouse) url.searchParams.set("greenhouse", greenhouse);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ApiRecipe[] = await res.json();
    const recipes = data.map(fromApi);
    lsWrite(recipes); // garde un cache local
    return recipes;
  } catch {
    return lsRead(); // hors-ligne : cache local
  }
}

/** Crée une recette. Renvoie la recette persistée (avec son id serveur). */
export async function createRecipe(input: {
  name: string;
  target: Partial<IonMap>;
  ec_target?: number;
  greenhouse?: string;
  created_by?: string;
}): Promise<Recipe> {
  const body = {
    name: input.name,
    target: input.target,
    group_name: "Personnalisée",
    validated: false,
    ec_target: input.ec_target ?? null,
    greenhouse: input.greenhouse ?? null,
    created_by: input.created_by ?? null,
  };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const r = fromApi(await res.json());
    lsWrite([r, ...lsRead().filter((x) => x.id !== r.id)]);
    return r;
  } catch {
    // repli local
    const r: Recipe = {
      id: "local_" + Date.now(),
      name: input.name, group: "Personnalisée (local)", validated: false,
      ec: input.ec_target, target: input.target,
    };
    lsWrite([r, ...lsRead()]);
    return r;
  }
}

/** Supprime une recette par id. */
export async function deleteRecipe(id: string): Promise<void> {
  try {
    if (!id.startsWith("local_")) {
      const res = await fetch(`${ENDPOINT}/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    /* on supprime quand même du cache local */
  }
  lsWrite(lsRead().filter((r) => r.id !== id));
}
