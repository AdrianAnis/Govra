import AxeBuilder from "@axe-core/playwright";
import { createHmac } from "node:crypto";
import { expect, type Page } from "@playwright/test";

export type Role = "pelapor" | "dinas" | "admin";

function signedRole(role: Role): string {
  const secret = process.env.SESSION_SECRET ?? process.env.BFF_SHARED_KEY;
  if (!secret) {
    throw new Error("Setel SESSION_SECRET atau BFF_SHARED_KEY (sama dengan server) saat menjalankan uji.");
  }
  return `${role}.${createHmac("sha256", secret).update(role).digest("hex")}`;
}

export async function signIn(page: Page, role: Role) {
  await page.context().addCookies([{ name: "govra_session", value: signedRole(role), domain: "localhost", path: "/" }]);
}

export async function expectNoViolations(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = result.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(" ")).slice(0, 5),
  }));
  expect(summary).toEqual([]);
}
