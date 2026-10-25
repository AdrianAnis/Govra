import "@/lib/zod-config";
import { z } from "zod";

const errorSchema = z.object({ code: z.string().optional(), message: z.string() });

export const FALLBACK_MESSAGE = "Terjadi kendala. Coba lagi sebentar lagi.";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code: string | undefined) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function request<T>(url: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url, init);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = errorSchema.safeParse(payload);
    throw failure.success
      ? new ApiError(failure.data.message, response.status, failure.data.code)
      : new ApiError(FALLBACK_MESSAGE, response.status, undefined);
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(FALLBACK_MESSAGE, response.status, undefined);
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
