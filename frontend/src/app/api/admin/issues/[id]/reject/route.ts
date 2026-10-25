import { rejectSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { rejectIssue } from "@/lib/data/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return adminAction(request, rejectSchema, (input) => rejectIssue(id, input));
}
