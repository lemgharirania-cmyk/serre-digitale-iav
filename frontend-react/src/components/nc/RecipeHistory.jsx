import { Clock3 } from "lucide-react";

export default function RecipeHistory({
  history = []
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock3 size={18} />

        <h3 className="font-semibold">
          Historique
        </h3>
      </div>

      {history.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Aucun calcul enregistré.
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((item, index) => (
            <div
              key={index}
              className="
                border
                rounded-lg
                px-3
                py-2
                flex
                justify-between
              "
            >
              <span>
                {item.recipe}
              </span>

              <span className="text-gray-500 text-sm">
                {item.date}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
