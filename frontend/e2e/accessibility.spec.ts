import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("keyboard", () => {
  test("tautan lewati konten memindahkan fokus ke konten utama", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /Lewati/ });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeVisible();
    const focusedInMain = await page.evaluate(() => {
      const active = document.activeElement;
      const main = document.querySelector("main");
      return Boolean(active && main && (active === main || main.contains(active)));
    });
    expect(focusedInMain).toBe(true);
  });

  test("formulir masuk bisa diisi dan dikirim hanya dengan keyboard", async ({ page }) => {
    await page.goto("/masuk");
    await page.getByLabel("Alamat Email").focus();
    await page.keyboard.type("dinas@govra.id");
    await page.keyboard.press("Tab");
    await page.keyboard.type("kata-sandi-contoh");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/dinas$/);
  });

  test("fokus terlihat pada elemen interaktif", async ({ page }) => {
    await page.goto("/masuk");
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press("Tab");
      const outline = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) {
          return null;
        }
        const style = getComputedStyle(active);
        return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle, shadow: style.boxShadow };
      });
      if (outline) {
        expect(outline.style !== "none" || outline.shadow !== "none" || outline.width > 0).toBe(true);
      }
    }
  });

  test("dialog aksi Dinas ditutup dengan Escape dan fokus kembali ke tombol", async ({ page }) => {
    await signIn(page, "dinas");
    await page.goto("/dinas");
    await page.getByRole("row").filter({ hasText: /Diteruskan|Diproses|Dibuka Ulang/ }).first().getByRole("link").click();
    const trigger = page.getByRole("button", { name: /^(Proses|Tandai selesai)$/ }).first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("dialog menahan fokus selama terbuka", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/admin/pengguna");
    await page.getByRole("button", { name: "Tambah akun" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
      expect(inside).toBe(true);
    }
  });
});

test.describe("prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("beranda tidak menjalankan animasi CSS berulang dan konten langsung terlihat", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    const running = await page.evaluate(
      () => document.getAnimations().filter((animation) => animation.playState === "running" && animation instanceof CSSAnimation).length,
    );
    expect(running).toBe(0);
    const hidden = await page.evaluate(
      () => Array.from(document.querySelectorAll("main *")).filter((node) => getComputedStyle(node).opacity === "0" && node.getBoundingClientRect().height > 0).length,
    );
    expect(hidden).toBe(0);
  });
});
