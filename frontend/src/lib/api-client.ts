import "server-only";
import createClient from "openapi-fetch";
import { env } from "@/lib/env";
import type { paths } from "@/types/api";

const API_TIMEOUT_MS = 10_000;

function buildHeaders(accessToken: string | undefined): Record<string, string> {
  return {
    "X-BFF-Key": env.BFF_SHARED_KEY,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(env.API_MOCK_EXAMPLE ? { Prefer: `example=${env.API_MOCK_EXAMPLE}` } : {}),
  };
}

function fetchWithTimeout(request: Request): Promise<Response> {
  return fetch(request, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
}

export function createApiClient(accessToken?: string) {
  return createClient<paths>({
    baseUrl: env.API_BASE_URL,
    headers: buildHeaders(accessToken),
    fetch: fetchWithTimeout,
  });
}
