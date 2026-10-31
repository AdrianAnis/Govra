import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

const BACKEND = Boolean(process.env.E2E_BACKEND);

test.describe("akses dan peran", () => {
  test("pengunjung diarahkan ke halaman masuk dengan tujuan", async ({ page }) => {
    await page.goto("/pelapor/profil");
    await expect(page).toHaveURL(/\/masuk\?lanjut=%2Fpelapor%2Fprofil/);
  });

  test("pelapor yang membuka panel Dinas atau Admin dikembalikan ke areanya", async ({ page }) => {
    await signIn(page, "pelapor");
    for (const path of ["/dinas", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/pelapor/);
    }
  });

  test("masuk dengan akun salah menampilkan pesan galat", async ({ page }) => {
    await page.goto("/masuk");
    await page.getByLabel("Alamat Email").fill("tidak-ada@kotacontoh.go.id");
    await page.getByLabel("Kata Sandi").fill("kata-sandi-salah");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/masuk\?error=gagal/);
    await expect(page.getByText("Gagal Masuk")).toBeVisible();
  });
});

test.describe("masuk dengan akun sungguhan (butuh backend dan database uji)", () => {
  test.skip(!BACKEND, "Setel E2E_BACKEND=1 dan jalankan backend dengan data seed.");

  const ACCOUNTS = [
    { email: "admin@kotacontoh.go.id", home: /\/pemerintah$/ },
    { email: "dbmsda@kotacontoh.go.id", home: /\/dinas$/ },
    { email: "warga@kotacontoh.go.id", home: /\/pelapor$/ },
  ] as const;

  for (const account of ACCOUNTS) {
    test(`${account.email} masuk ke beranda perannya`, async ({ page }) => {
      await page.goto("/masuk");
      await page.getByLabel("Alamat Email").fill(account.email);
      await page.getByLabel("Kata Sandi").fill("password123");
      await page.getByRole("button", { name: "Masuk", exact: true }).click();
      await expect(page).toHaveURL(account.home);
    });
  }
});

test.describe("alur pelapor", () => {
  test("validasi laporan menahan langkah pertama", async ({ page }) => {
    await signIn(page, "pelapor");
    await page.goto("/pelapor/lapor");
    await page.getByRole("button", { name: "Lanjut ke Lokasi" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("langkah pertama menyediakan rekam suara dan unggah foto", async ({ page }) => {
    await signIn(page, "pelapor");
    await page.goto("/pelapor/lapor");
    await expect(page.getByRole("button", { name: "Mulai Rekam VN" })).toBeVisible();
    await expect(page.getByText("Foto (opsional, maksimal 3)")).toBeVisible();
  });
});

test.describe("chatbot", () => {
  test("pertanyaan mendapat jawaban tanpa galat", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Buka asisten Govra" }).click();
    const dialog = page.getByRole("dialog", { name: "Asisten Govra" });
    await dialog.getByLabel("Tulis pertanyaan").fill("Bagaimana cara melapor?");
    await dialog.getByRole("button", { name: "Kirim" }).click();
    await expect(dialog.getByRole("log")).toContainText("Bagaimana cara melapor?");
    await expect(dialog.getByRole("status")).toBeHidden();
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    await expect
      .poll(async () => ((await dialog.getByRole("log").textContent()) ?? "").length)
      .toBeGreaterThan("Bagaimana cara melapor?".length + 40);
  });
});

test.describe("moderasi Admin", () => {
  test("menyembunyikan laporan dan tercatat di audit", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/admin/moderasi?hidden=false");
    await page.getByRole("button", { name: "Sembunyikan" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Alasan").click();
    await page.getByRole("option", { name: "Spam" }).click();
    await dialog.getByRole("button", { name: "Sembunyikan" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/admin/audit?action=REPORT_HIDE");
    await expect(page.getByRole("cell", { name: "Sembunyikan laporan" }).first()).toBeVisible();
  });
});
