import { createOpdSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { createOpd } from "@/lib/data/admin";

const CREATED_STATUS = 201;

export async function POST(request: Request) {
  return adminAction(request, createOpdSchema, createOpd, CREATED_STATUS);
}
