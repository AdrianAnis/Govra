export const REPORTER_HOME = "/pelapor";
export const REPORT_NEW = "/pelapor/lapor";
export const REPORT_DETAIL_PREFIX = "/pelapor/laporan";
export const PROFILE = "/pelapor/profil";

export function reportHref(code: string): string {
  return `/pelapor/laporan/${code}`;
}
