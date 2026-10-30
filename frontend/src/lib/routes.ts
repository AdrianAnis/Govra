export const REPORTER_HOME = "/pelapor";
export const REPORT_NEW = "/pelapor/lapor";
export const REPORT_DETAIL_PREFIX = "/pelapor/laporan";
export const PROFILE = "/pelapor/profil";
export const AGENCY_HOME = "/dinas";
export const ADMIN_HOME = "/admin";
export const PEMERINTAH_HOME = "/pemerintah";

export function reportHref(code: string): string {
  return `/pelapor/laporan/${code}`;
}

export function agencyIssueHref(id: string): string {
  return `/dinas/isu/${id}`;
}
