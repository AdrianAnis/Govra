import { hideSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { hideReport } from "@/lib/data/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return adminAction(request, hideSchema, (input) => hideReport(id, input));
}
