import { redirect } from "next/navigation";
import { PEMERINTAH_HOME } from "@/lib/routes";

export default function WalikotaPage() {
  redirect(PEMERINTAH_HOME);
}
