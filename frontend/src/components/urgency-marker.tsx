import { Siren, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Urgency } from "@/lib/status";

function UrgencyMarker({ urgency }: { urgency: Urgency }) {
  if (urgency === "URGENT") {
    return (
      <Badge weight="serius">
        <Siren aria-hidden />
        Urgent
      </Badge>
    );
  }
  if (urgency === "TINGGI") {
    return (
      <Badge weight="perhatian">
        <TriangleAlert aria-hidden />
        Tinggi
      </Badge>
    );
  }
  return null;
}

function UrgencyEdge({ urgency }: { urgency: Urgency }) {
  if (urgency !== "URGENT") return null;
  return (
    <span
      aria-hidden
      className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-secondary"
    />
  );
}

export { UrgencyEdge, UrgencyMarker };
