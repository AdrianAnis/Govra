const SAFE_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);
const FORBIDDEN_STATUS = 403;

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export function rejectCrossOrigin(request: Request): Response | null {
  if (SAFE_METHODS.has(request.method) || isSameOrigin(request)) {
    return null;
  }
  return Response.json(
    {
      code: "FORBIDDEN_ORIGIN",
      message: "Permintaan ditolak karena asalnya tidak dikenali.",
      request_id: crypto.randomUUID(),
    },
    { status: FORBIDDEN_STATUS },
  );
}
