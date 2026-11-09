const COUNTRY_PREFIX = "62";
const MOBILE_PREFIX = "628";
const MIN_DIGITS = 11;
const MAX_DIGITS = 15;

export const PHONE_ERROR = "Nomor telepon tidak valid. Gunakan nomor WhatsApp aktif, contoh 081234567890.";

function withCountryCode(digits: string): string | null {
  if (digits.startsWith(COUNTRY_PREFIX)) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return COUNTRY_PREFIX + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return COUNTRY_PREFIX + digits;
  }
  return null;
}

export function normalizePhone(raw: string): string | null {
  const digits = withCountryCode(raw.replace(/\D/g, ""));
  if (!digits) {
    return null;
  }
  const valid = digits.startsWith(MOBILE_PREFIX) && digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS;
  return valid ? digits : null;
}
