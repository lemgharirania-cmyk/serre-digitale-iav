import { Search, Leaf, CheckCircle, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

export default function RecipeLibrary({
  recipes = [],
  selectedRecipe,
  onSelect
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return recipes.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [recipes, search]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <h3 className="font-semibold text-lg mb-4">
        Bibliothèque de recettes
      </h3>

      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-3 text-gray-400"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => onSelect(recipe)}
            className={`w-full text-left p-3 rounded-xl border transition
            ${
              selectedRecipe?.id === recipe.id
                ? "border-green-500 bg-green-50"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Leaf size={16} />

                <span>{recipe.name}</span>
              </div>

              {recipe.validated ? (
                <span className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle size={14} />
                  Officielle
                </span>
              ) : (
                <span className="flex items-center gap-1 text-orange-500 text-xs">
                  <AlertTriangle size={14} />
                  Community
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              EC cible : {recipe.ec}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
