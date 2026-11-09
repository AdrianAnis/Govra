import "@/lib/zod-config";
import { z } from "zod";
import { CODE_MINUTES } from "@/lib/auth-flow";
import { signProfile, verifyProfile } from "@/lib/session-sign";

export const GOOGLE_PENDING_COOKIE = "govra_google_pending";
export const GOOGLE_PENDING_MAX_AGE_SECONDS = CODE_MINUTES * 60;

const MS_PER_SECOND = 1000;

const pendingSchema = z.object({
  email: z.string().min(1),
  name: z.string(),
  avatar: z.string(),
  lanjut: z.string(),
  exp: z.number(),
});

export type GooglePending = z.infer<typeof pendingSchema>;

export function createGooglePending(input: Omit<GooglePending, "exp">): Promise<string> {
  return signProfile({ ...input, exp: Date.now() + GOOGLE_PENDING_MAX_AGE_SECONDS * MS_PER_SECOND });
}

export async function readGooglePending(signed: string | undefined): Promise<GooglePending | null> {
  const parsed = pendingSchema.safeParse(await verifyProfile(signed));
  return parsed.success && parsed.data.exp > Date.now() ? parsed.data : null;
}
