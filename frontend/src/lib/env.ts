import "server-only";
import { z } from "zod";

const BFF_KEY_MIN_LENGTH = 32;
const MOCK_EXAMPLES = ["publik", "pelapor", "dinas", "admin"] as const;

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  API_BASE_URL: z.url(),
  BFF_SHARED_KEY: z.string().min(BFF_KEY_MIN_LENGTH),
  API_MOCK_EXAMPLE: z.enum(MOCK_EXAMPLES).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const invalidKeys = new Set(result.error.issues.map((issue) => issue.path.join(".")));
  throw new Error(`Environment tidak valid: ${[...invalidKeys].join(", ")}`);
}

export const env = parseEnv(process.env);
