import { redirect } from "next/navigation";
import { REPORTER_HOME } from "@/lib/routes";

export default function LaporanIndexPage() {
  redirect(REPORTER_HOME);
}
