import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/data/session";
import { listRoleNotifications } from "@/lib/data/notifications";

export async function GET() {
  const user = await getSessionUser();
  const role = user?.role ?? "pelapor";
  const opdId = user?.opdId ? user.opdId : undefined;
  const email = user?.email ? user.email : undefined;
  const userId = user?.id ? user.id : undefined;

  const data = await listRoleNotifications(role, opdId, email, userId);
  return NextResponse.json(data);
}
