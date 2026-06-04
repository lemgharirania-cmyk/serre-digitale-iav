import {
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function CommunityRecipeBadge({
  validated
}) {
  if (validated) {
    return (
      <div className="
        inline-flex
        items-center
        gap-1
        px-2
        py-1
        rounded-full
        bg-green-100
        text-green-700
        text-xs
      ">
        <CheckCircle size={12} />
        Officielle
      </div>
    );
  }

  return (
    <div className="
      inline-flex
      items-center
      gap-1
      px-2
      py-1
      rounded-full
      bg-orange-100
      text-orange-700
      text-xs
    ">
      <AlertTriangle size={12} />
      Community
    </div>
  );
}
