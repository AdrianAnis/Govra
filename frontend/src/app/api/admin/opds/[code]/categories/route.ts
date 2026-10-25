import { createCategorySchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { createCategory } from "@/lib/data/admin";

const CREATED_STATUS = 201;

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  return adminAction(request, createCategorySchema, (input) => createCategory(code, input), CREATED_STATUS);
}
