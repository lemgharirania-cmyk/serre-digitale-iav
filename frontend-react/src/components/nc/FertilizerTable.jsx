import { Beaker } from "lucide-react";

export default function FertilizerTable({
  fertilizers = []
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <Beaker size={18} />
        <h3 className="font-semibold text-lg">
          Engrais recommandés
        </h3>
      </div>

      {fertilizers.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Aucun calcul effectué.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">
                  Engrais
                </th>

                <th className="text-right py-2">
                  Quantité (g)
                </th>

                <th className="text-right py-2">
                  g / 100 L
                </th>
              </tr>
            </thead>

            <tbody>
              {fertilizers.map((fertilizer) => (
                <tr
                  key={fertilizer.name}
                  className="border-b last:border-none"
                >
                  <td className="py-3">
                    {fertilizer.name}
                  </td>

                  <td className="text-right py-3 font-mono">
                    {fertilizer.quantity?.toFixed(2)}
                  </td>

                  <td className="text-right py-3 font-mono">
                    {fertilizer.per100L?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
