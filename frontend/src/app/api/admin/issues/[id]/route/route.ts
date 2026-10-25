import { adminAction } from "@/lib/admin-route";
import { routeSchema } from "@/lib/admin";
import { routeIssue } from "@/lib/data/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return adminAction(request, routeSchema, (input) => routeIssue(id, input));
}
