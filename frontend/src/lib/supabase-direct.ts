interface DirectSupabase {
  url: string;
  key: string;
  serviceKey: string;
}

const UNREACHABLE_URL = "http://127.0.0.1:1";

const DISABLED: DirectSupabase = { url: UNREACHABLE_URL, key: "", serviceKey: "" };

export function directSupabase(): DirectSupabase {
  const allowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_DIRECT_SUPABASE === "1";
  if (!allowed) {
    return DISABLED;
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || UNREACHABLE_URL,
    key: serviceKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    serviceKey,
  };
}
