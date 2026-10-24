import { exportMyData } from "@/lib/data/profile";
import { mockOnly } from "@/lib/mock-guard";

export async function GET() {
  const blocked = mockOnly();
  if (blocked) {
    return blocked;
  }
  return new Response(JSON.stringify(await exportMyData(), null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="data-saya.json"',
    },
  });
}
