import { areaSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { renameDistrict } from "@/lib/data/admin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return adminAction(request, areaSchema, (input) => renameDistrict(id, input.name));
}
