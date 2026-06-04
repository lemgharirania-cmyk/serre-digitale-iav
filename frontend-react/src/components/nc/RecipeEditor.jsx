import { useState } from "react";
import { PlusCircle } from "lucide-react";

export default function RecipeEditor({ onSave }) {
  const [recipe, setRecipe] = useState({
    name: "",
    ec: "",
    no3: "",
    nh4: "",
    p: "",
    k: "",
    ca: "",
    mg: ""
  });

  function handleSubmit(e) {
    e.preventDefault();

    if (!recipe.name) return;

    onSave?.({
      ...recipe,
      validated: false
    });

    setRecipe({
      name: "",
      ec: "",
      no3: "",
      nh4: "",
      p: "",
      k: "",
      ca: "",
      mg: ""
    });
  }

  return (
    <div className="bg-white rounded-2xl p-5 border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle size={18} />
        <h3 className="font-semibold">
          Nouvelle recette
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-4 gap-3">

          <input
            placeholder="Nom"
            value={recipe.name}
            onChange={(e) =>
              setRecipe({
                ...recipe,
                name: e.target.value
              })
            }
            className="border rounded-lg px-3 py-2"
          />

          <input
            placeholder="EC"
            type="number"
            value={recipe.ec}
            onChange={(e) =>
              setRecipe({
                ...recipe,
                ec: e.target.value
              })
            }
            className="border rounded-lg px-3 py-2"
          />

          <input
            placeholder="NO3"
            type="number"
            value={recipe.no3}
            onChange={(e) =>
              setRecipe({
                ...recipe,
                no3: e.target.value
              })
            }
            className="border rounded-lg px-3 py-2"
          />

          <input
            placeholder="K"
            type="number"
            value={recipe.k}
            onChange={(e) =>
              setRecipe({
                ...recipe,
                k: e.target.value
              })
            }
            className="border rounded-lg px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
