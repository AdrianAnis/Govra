import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("akses dan peran", () => {
  test("pengunjung diarahkan ke halaman masuk dengan tujuan", async ({ page }) => {
    await page.goto("/pelapor/profil");
    await expect(page).toHaveURL(/\/masuk\?lanjut=%2Fpelapor%2Fprofil/);
  });

  test("pelapor tidak boleh membuka panel Dinas dan Admin", async ({ page }) => {
    await signIn(page, "pelapor");
    for (const path of ["/dinas", "/admin"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(403);
    }
  });

  test("masuk lewat formulir memakai peran dari email", async ({ page }) => {
    await page.goto("/masuk");
    await page.getByLabel("Alamat Email").fill("dinas@govra.id");
    await page.getByLabel("Kata Sandi").fill("kata-sandi-contoh");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/dinas$/);
    await expect(page.getByRole("heading", { name: "Inbox Isu" })).toBeVisible();
  });
});

test.describe("alur pelapor", () => {
  test("kirim laporan lalu lacak dengan kode", async ({ page }) => {
    await signIn(page, "pelapor");
    await page.goto("/pelapor/lapor");

    await page.getByLabel(/Judul/).fill("Lampu jalan mati di Gang Kenari");
    await page.getByLabel(/Ceritakan|Isi laporan|Cerita/).first().fill(
      "Lampu jalan di Gang Kenari mati sejak dua minggu lalu dan lingkungan menjadi gelap serta rawan.",
    );
    await page.getByRole("button", { name: "Lanjut ke Lokasi" }).click();

    await page.locator("#district").click();
    await page.getByRole("option").first().click();
    await expect(page.getByRole("option")).toHaveCount(0);
    await page.locator("#village").click();
    await page.getByRole("option").first().click();
    await expect(page.getByRole("option")).toHaveCount(0);
    await page.getByRole("application", { name: "Peta untuk menandai lokasi" }).click();
    await expect(page.getByText("Titik sudah ditandai")).toBeVisible();
    await page.getByRole("button", { name: "Lanjut ke Serupa" }).click();

    await page.getByRole("button", { name: "Lanjut ke Kirim" }).click();
    await page.getByText("Publik", { exact: true }).first().click();
    await page.getByRole("button", { name: "Kirim laporan" }).click();
    await page.getByRole("dialog", { name: "Periksa sebelum dikirim" }).getByRole("button", { name: "Kirim sekarang" }).click();

    await expect(page.getByRole("heading", { name: "Laporan terkirim" })).toBeVisible();
    const code = (await page.getByText(/^TLK-\d{4}-[A-Z0-9]{4}$/).first().textContent())?.trim() ?? "";
    expect(code).toMatch(/^TLK-/);

    await page.getByRole("link", { name: "Lacak laporan" }).click();
    await expect(page).toHaveURL(new RegExp(code));
    await expect(page.getByText(code).first()).toBeVisible();
  });

  test("validasi laporan menahan langkah pertama", async ({ page }) => {
    await signIn(page, "pelapor");
    await page.goto("/pelapor/lapor");
    await page.getByRole("button", { name: "Lanjut ke Lokasi" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
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

test.describe("aksi Dinas", () => {
  test("proses lalu selesaikan isu dengan bukti foto", async ({ page }) => {
    await signIn(page, "dinas");
    await page.goto("/dinas?status=DITERUSKAN");
    await page.getByRole("row").filter({ hasText: "Diteruskan" }).first().getByRole("link").click();
    await expect(page).toHaveURL(/\/dinas\/isu\//);

    await page.getByRole("button", { name: "Proses", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Tanggapan").fill("Tim survei akan turun ke lokasi besok pagi.");
    await dialog.getByRole("button", { name: "Tinjau" }).click();
    await expect(dialog.getByText("Konfirmasi perubahan")).toBeVisible();
    await dialog.getByRole("button", { name: "Kirim" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Tim survei akan turun ke lokasi besok pagi.")).toBeVisible();

    await page.getByRole("button", { name: "Tandai selesai" }).click();
    await dialog.getByLabel("Tanggapan").fill("Perbaikan selesai dan lokasi sudah diperiksa.");
    await dialog.getByRole("button", { name: "Tinjau" }).click();
    await expect(dialog.getByText("Unggah minimal satu foto bukti.")).toBeVisible();
    await dialog.locator('input[type="file"]').setInputFiles({ name: "bukti.png", mimeType: "image/png", buffer: PNG });
    await expect(dialog.getByRole("link", { name: "Bukti 1" })).toBeVisible();
    await dialog.getByRole("button", { name: "Tinjau" }).click();
    await dialog.getByRole("button", { name: "Kirim" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Perbaikan selesai dan lokasi sudah diperiksa.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tandai selesai" })).toHaveCount(0);
  });

  test("tolak wajib alasan", async ({ page }) => {
    await signIn(page, "dinas");
    await page.goto("/dinas?status=DITERUSKAN");
    const row = page.getByRole("row").filter({ hasText: "Diteruskan" }).first();
    if ((await row.count()) === 0) {
      test.skip(true, "Tidak ada isu berstatus Diteruskan tersisa.");
    }
    await row.getByRole("link").click();
    await page.getByRole("button", { name: "Tolak", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Penjelasan").fill("Bukan wewenang dinas ini.");
    await dialog.getByRole("button", { name: "Tinjau" }).click();
    await expect(dialog.getByText("Pilih alasan penolakan.")).toBeVisible();
  });
});

test.describe("verifikasi Admin", () => {
  test("teruskan isu dari antrean ke OPD", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/admin/verifikasi?jenis=VERIFIKASI");
    const items = page.getByRole("article");
    const before = await items.count();
    expect(before).toBeGreaterThan(0);

    await items.first().getByRole("button", { name: "Teruskan" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Teruskan" }).click();
    await expect(dialog).toBeHidden();
    await expect(items).toHaveCount(before - 1);
  });

  test("moderasi menyembunyikan laporan dan tercatat di audit", async ({ page }) => {
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
