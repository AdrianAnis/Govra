import { updateUserSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { updateUser } from "@/lib/data/admin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return adminAction(request, updateUserSchema, (input) => updateUser(id, input));
}
