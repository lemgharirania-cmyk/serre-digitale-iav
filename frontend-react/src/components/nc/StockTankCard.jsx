import { Droplets } from "lucide-react";

export default function StockTankCard({
  title,
  fertilizers = []
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Droplets size={18} />

        <h3 className="font-semibold">
          {title}
        </h3>
      </div>

      {fertilizers.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Aucun engrais.
        </p>
      ) : (
        <div className="space-y-2">
          {fertilizers.map((fertilizer) => (
            <div
              key={fertilizer.name}
              className="flex justify-between items-center border rounded-lg px-3 py-2"
            >
              <span>
                {fertilizer.name}
              </span>

              <span className="font-mono">
                {fertilizer.quantity?.toFixed(1)} g
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
