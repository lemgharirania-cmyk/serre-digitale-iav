import {
  Activity,
  Droplets,
  Scale
} from "lucide-react";

export default function CalculationSummary({
  result
}) {
  if (!result) return null;

  const cards = [
    {
      label: "EC estimée",
      value: result.ec,
      icon: Activity
    },
    {
      label: "Neutralité",
      value: result.neutrality,
      icon: Scale
    },
    {
      label: "Volume",
      value: result.volume,
      icon: Droplets
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 border shadow-sm"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {card.label}
              </span>

              <Icon size={18} />
            </div>

            <div className="text-3xl font-bold mt-3">
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}