import { createUserSchema } from "@/lib/admin";
import { adminAction } from "@/lib/admin-route";
import { createUser } from "@/lib/data/admin";

const CREATED_STATUS = 201;

export async function POST(request: Request) {
  return adminAction(request, createUserSchema, createUser, CREATED_STATUS);
}
