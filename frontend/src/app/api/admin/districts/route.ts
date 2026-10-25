import { areaSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { createDistrict } from "@/lib/data/admin";

const CREATED_STATUS = 201;

export async function POST(request: Request) {
  return adminAction(request, areaSchema, (input) => createDistrict(input.name), CREATED_STATUS);
}
