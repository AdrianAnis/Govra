import { NextResponse, type NextRequest } from "next/server";
import {
  buildContentSecurityPolicy,
  createNonce,
  SECURITY_HEADERS,
} from "@/lib/security-headers";

const CSP_HEADER = "Content-Security-Policy";

export function proxy(request: NextRequest) {
  const policy = buildContentSecurityPolicy(
    createNonce(),
    process.env.NODE_ENV === "development",
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_HEADER, policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER, policy);
  for (const [name, value] of SECURITY_HEADERS) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
