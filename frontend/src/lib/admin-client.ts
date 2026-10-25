import { z } from "zod";
import { jsonInit, request } from "@/lib/http";

export type AdminMethod = "POST" | "PATCH" | "PUT";

export async function adminCall(method: AdminMethod, path: string, body: unknown): Promise<void> {
  await request(`/api/admin${path}`, { ...jsonInit(body), method }, z.unknown());
}
