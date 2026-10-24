import { z } from "zod";

const errorSchema = z.object({ message: z.string() });

export const FALLBACK_MESSAGE = "Terjadi kendala. Coba lagi sebentar lagi.";

export async function request<T>(url: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url, init);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = errorSchema.safeParse(payload);
    throw new Error(failure.success ? failure.data.message : FALLBACK_MESSAGE);
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(FALLBACK_MESSAGE);
  }
  return parsed.data;
}

export function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
