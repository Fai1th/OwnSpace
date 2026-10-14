// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
const config = vi.hoisted(() => ({
  operator: "",
  address: "",
  jurisdiction: "",
  contact: "",
  hosting: "",
  database: "",
  region: "",
  url: "https://preview.ownspace.invalid",
}));
vi.mock("../lib/config", () => ({ siteConfig: config }));
vi.mock("../components/navigation", () => ({ Navigation: () => null }));
vi.mock("../components/footer", () => ({ Footer: () => null }));
import { LegalShell } from "../components/legal-shell";
import { LegalContact } from "../components/legal-contact";
import { legalSupportEmail } from "../lib/legal-content";
beforeEach(() => {
  Object.assign(config, {
    operator: "",
    address: "",
    jurisdiction: "",
    contact: "",
    hosting: "",
    database: "",
    region: "",
    url: "https://preview.ownspace.invalid",
  });
});
afterEach(cleanup);
it("keeps hosted previews visibly draft when operator information is missing", () => {
  render(
    <LegalShell title="Policy" intro="Our policy.">
      <p>Content</p>
    </LegalShell>,
  );
  const notice = screen.getByLabelText("Draft policy notice");
  expect(notice.textContent).toContain("operator’s legal identity");
  expect(notice.textContent).toContain("support email");
  expect(notice.textContent).not.toContain("local preview");
  expect(screen.queryByRole("link", { name: /@/ })).toBeNull();
  expect(screen.getByText(/Support email is not configured/)).toBeTruthy();
});
it("uses only the configured email and explains that opening a mail app is not delivery", () => {
  config.contact = "support@ownspace.invalid";
  render(<LegalContact subject="Privacy rights request" />);
  expect(screen.getByRole("link", { name: config.contact }).getAttribute("href")).toBe(
    "mailto:support@ownspace.invalid?subject=Privacy%20rights%20request",
  );
  expect(screen.getByText(/clicking the link does not submit a request/)).toBeTruthy();
  expect(document.querySelector("form")).toBeNull();
});
it("does not turn malformed or URL-shaped support configuration into a contact action", () => {
  for (const value of [
    "javascript:alert(1)",
    "https://example.com",
    "support@example.com\nBcc:other@example.com",
  ]) {
    config.contact = value;
    expect(legalSupportEmail()).toBe("");
  }
});
