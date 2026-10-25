import { updateCategorySchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { updateCategory } from "@/lib/data/admin";

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  return adminAction(request, updateCategorySchema, (input) => updateCategory(code, input));
}
