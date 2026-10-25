import { test } from "@playwright/test";
import { expectNoViolations, signIn, type Role } from "./helpers";

const PAGES: ReadonlyArray<{ role: Role | null; paths: readonly string[] }> = [
  {
    role: null,
    paths: ["/", "/proker", "/isu", "/rapor", "/metodologi", "/privasi", "/opd", "/masuk", "/daftar", "/lupa-sandi"],
  },
  { role: "pelapor", paths: ["/pelapor", "/pelapor/lapor", "/pelapor/profil"] },
  { role: "dinas", paths: ["/dinas", "/dinas/statistik"] },
  {
    role: "admin",
    paths: ["/admin", "/admin/verifikasi", "/admin/pengguna", "/admin/master", "/admin/pengaturan", "/admin/moderasi", "/admin/audit"],
  },
];

test.use({ reducedMotion: "reduce" });

for (const group of PAGES) {
  for (const path of group.paths) {
    test(`aksesibilitas ${group.role ?? "publik"} ${path}`, async ({ page }) => {
      if (group.role) {
        await signIn(page, group.role);
      }
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoViolations(page);
    });
  }
}
