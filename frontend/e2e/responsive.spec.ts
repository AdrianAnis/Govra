import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn, type Role } from "./helpers";

const WIDTHS = [360, 768, 1440] as const;

const PAGES: ReadonlyArray<{ role: Role | null; paths: readonly string[] }> = [
  { role: null, paths: ["/", "/proker", "/isu", "/rapor", "/opd", "/masuk", "/daftar"] },
  { role: "pelapor", paths: ["/pelapor", "/pelapor/lapor", "/pelapor/profil"] },
  { role: "dinas", paths: ["/dinas", "/dinas/statistik"] },
  { role: "admin", paths: ["/admin", "/admin/verifikasi", "/admin/pengguna", "/admin/master", "/admin/pengaturan", "/admin/moderasi", "/admin/audit"] },
];

test.use({ reducedMotion: "reduce" });

for (const width of WIDTHS) {
  test.describe(`lebar ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const group of PAGES) {
      for (const path of group.paths) {
        test(`${group.role ?? "publik"} ${path} tanpa gulir mendatar`, async ({ page }) => {
          if (group.role) {
            await signIn(page, group.role);
          }
          await page.goto(path);
          await page.waitForLoadState("networkidle");
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          expect(overflow).toBeLessThanOrEqual(0);
          if (width === 360) {
            const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
            expect(result.violations.map((violation) => violation.id)).toEqual([]);
          }
        });
      }
    }
  });
}
