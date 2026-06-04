const fields = [
  "hco3",
  "no3",
  "nh4",
  "p",
  "k",
  "ca",
  "mg",
  "so4",
  "na",
  "cl"
];

export default function WaterAnalysis({
  water,
  setWater
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <h3 className="font-semibold text-lg mb-4">
        Analyse d'eau
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {fields.map((field) => (
          <div key={field}>
            <label className="text-xs uppercase text-gray-500">
              {field}
            </label>

            <input
              type="number"
              value={water[field] || ""}
              onChange={(e) =>
                setWater((prev) => ({
                  ...prev,
                  [field]: Number(e.target.value)
                }))
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
