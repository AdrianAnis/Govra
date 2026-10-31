const ENCODER = new TextEncoder();
const HEX_RADIX = 16;
const HEX_WIDTH = 2;

function secret(): string {
  return process.env.SESSION_SECRET || process.env.BFF_SHARED_KEY || "";
}

async function hmac(value: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey("raw", ENCODER.encode(key), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, ENCODER.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(HEX_RADIX).padStart(HEX_WIDTH, "0")).join("");
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

function toBase64Url(text: string): string {
  let binary = "";
  for (const byte of ENCODER.encode(text)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string | null {
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
    return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  } catch {
    return null;
  }
}

export async function signValue(value: string): Promise<string> {
  const key = secret();
  if (!key) {
    throw new Error("SESSION_SECRET atau BFF_SHARED_KEY wajib diisi.");
  }
  return `${value}.${await hmac(value, key)}`;
}

export async function verifyValue(signed: string | undefined): Promise<string | null> {
  const key = secret();
  if (!signed || !key) {
    return null;
  }
  const split = signed.lastIndexOf(".");
  if (split <= 0) {
    return null;
  }
  const value = signed.slice(0, split);
  return sameText(signed.slice(split + 1), await hmac(value, key)) ? value : null;
}

export function signProfile(profile: unknown): Promise<string> {
  return signValue(toBase64Url(JSON.stringify(profile)));
}

export async function verifyProfile(signed: string | undefined): Promise<unknown> {
  const encoded = await verifyValue(signed);
  const text = encoded ? fromBase64Url(encoded) : null;
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
