import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export type Role = "pelapor" | "dinas" | "admin";

export async function signIn(page: Page, role: Role) {
  await page.context().addCookies([{ name: "govra_session", value: role, domain: "localhost", path: "/" }]);
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
