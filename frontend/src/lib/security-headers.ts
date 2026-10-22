const SUPABASE_HOSTS = "https://*.supabase.co";
const TURNSTILE_HOST = "https://challenges.cloudflare.com";
const MAP_TILES_HOST = "https://tiles.openfreemap.org";
const HSTS_MAX_AGE_SECONDS = 63072000;

export const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  [
    "Strict-Transport-Security",
    `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains; preload`,
  ],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  [
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=()",
  ],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Cross-Origin-Resource-Policy", "same-site"],
];

export function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const nonceSource = `'nonce-${nonce}'`;
  const directives: string[][] = [
    ["default-src", "'self'"],
    [
      "script-src",
      "'self'",
      nonceSource,
      "'strict-dynamic'",
      TURNSTILE_HOST,
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    ["style-src", "'self'", isDev ? "'unsafe-inline'" : nonceSource],
    ["img-src", "'self'", "blob:", "data:", SUPABASE_HOSTS, MAP_TILES_HOST],
    ["connect-src", "'self'", MAP_TILES_HOST],
    ["frame-src", TURNSTILE_HOST],
    ["worker-src", "'self'", "blob:"],
    ["font-src", "'self'"],
    ["object-src", "'none'"],
    ["base-uri", "'none'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    ...(isDev ? [] : [["upgrade-insecure-requests"]]),
  ];
  return directives.map((parts) => parts.join(" ")).join("; ");
}
