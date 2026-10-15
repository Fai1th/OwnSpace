// @vitest-environment jsdom
import React, { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@phosphor-icons/react", () => ({ ArrowUpRightIcon: () => null }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));
import { Gallery } from "../components/gallery";
afterEach(() => vi.unstubAllGlobals());
it("hydrates website example cards without nested branding links changing browser markup", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const element = <Gallery />;
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);
  const errors: unknown[] = [];
  let root!: ReturnType<typeof hydrateRoot>;
  try {
    await act(async () => {
      root = hydrateRoot(container, element, { onRecoverableError: (error) => errors.push(error) });
    });
    expect(errors).toEqual([]);
    expect(container.querySelectorAll("a.gallery-card")).toHaveLength(4);
    expect(container.querySelectorAll(".site-brand a")).toHaveLength(0);
    expect(container.querySelectorAll(".site-brand")).toHaveLength(4);
  } finally {
    await act(async () => root?.unmount());
    container.remove();
  }
});
