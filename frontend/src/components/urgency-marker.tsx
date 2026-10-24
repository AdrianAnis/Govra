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

export { UrgencyMarker };
