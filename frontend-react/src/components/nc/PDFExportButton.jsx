import { Download } from "lucide-react";

export default function PDFExportButton({
  onExport
}) {
  return (
    <button
      onClick={onExport}
      className="
        flex
        items-center
        gap-2
        px-4
        py-2
        rounded-xl
        bg-green-600
        text-white
        hover:bg-green-700
        transition
      "
    >
      <Download size={16} />

      Export PDF
    </button>
  );
}
