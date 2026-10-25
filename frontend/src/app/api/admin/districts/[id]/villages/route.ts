import { areaSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { createVillage } from "@/lib/data/admin";

const CREATED_STATUS = 201;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return adminAction(request, areaSchema, (input) => createVillage(id, input.name), CREATED_STATUS);
}
