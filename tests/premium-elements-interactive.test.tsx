// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { premiumCatalog } from "../lib/premium-elements";
import type { PremiumElementType } from "../lib/premium-elements";
import { PremiumElementView } from "../components/premium-elements";
function element(type: PremiumElementType) {
  const entry = premiumCatalog.find((entry) => entry.type === type)!;
  return { type, props: { ...structuredClone(entry.defaults), id: "interactive-" + type } };
}
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => 1000);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => 500);
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains("premium-carousel-slide") && this.parentElement
      ? Array.from(this.parentElement.children).indexOf(this) * 1000
      : 0;
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("opens and closes real Radix accordion content", async () => {
  render(<PremiumElementView element={element("Accordion")} />);
  const trigger = screen.getByRole("button", { name: "What do you offer?" });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("Replace this example with your own answer.")).toBeTruthy();
  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});
it("switches real Radix tab panels", async () => {
  render(<PremiumElementView element={element("Tabs")} />);
  expect(screen.getByRole("tabpanel").textContent).toContain("Introduce your idea.");
  const process = screen.getByRole("tab", { name: "Process" });
  fireEvent.mouseDown(process, { button: 0, ctrlKey: false });
  fireEvent.click(process);
  await waitFor(() =>
    expect(screen.getByRole("tabpanel").textContent).toContain("Describe how you work."),
  );
  expect(process.getAttribute("aria-selected")).toBe("true");
});
it("advances the real Embla carousel through its next control", async () => {
  render(<PremiumElementView element={element("Carousel")} />);
  expect(screen.getByLabelText("Previous slide").hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByLabelText("Next slide"));
  await waitFor(() => expect(screen.getByText("2 / 3")).toBeTruthy());
  expect(screen.getByLabelText("Previous slide").hasAttribute("disabled")).toBe(false);
});
it("updates the image comparison slider and exposes the real progress semantics", () => {
  const { unmount } = render(<PremiumElementView element={element("ImageCompare")} />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "75" } });
  expect(screen.getByText("Comparison position: 75%")).toBeTruthy();
  unmount();
  render(<PremiumElementView element={element("Progress")} />);
  expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50");
});
it("starts and stops the mobile navigation menu", () => {
  render(<PremiumElementView element={element("SiteNav")} />);
  const menu = screen.getByRole("button", { name: "Menu" });
  expect(menu.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(menu);
  expect(screen.getByRole("button", { name: "Close" }).getAttribute("aria-expanded")).toBe("true");
});
