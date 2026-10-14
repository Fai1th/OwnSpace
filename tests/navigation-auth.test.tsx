// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
const state = vi.hoisted(() => ({ configured: true, loaded: true, signedIn: false }));
vi.mock("../lib/config", () => ({
  siteConfig: {
    get authEnabled() {
      return state.configured;
    },
  },
}));
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: state.loaded, isSignedIn: state.signedIn }),
  UserButton: () => null,
}));
import { Navigation } from "../components/navigation";
beforeEach(() => {
  state.configured = true;
  state.loaded = true;
  state.signedIn = false;
});
afterEach(cleanup);
it("lets a signed-in user open their dashboard without offering sign-in again", () => {
  state.signedIn = true;
  render(<Navigation />);
  expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe("/dashboard");
  expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
});
it("offers account creation to signed-out users when Clerk is connected", () => {
  render(<Navigation />);
  expect(screen.getByRole("link", { name: "Create your space" }).getAttribute("href")).toBe(
    "/sign-up",
  );
  expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/sign-in");
});
it("offers returning mobile visitors sign-in from the open navigation menu", () => {
  render(<Navigation />);
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(
    within(screen.getByRole("navigation", { name: "Main navigation" }))
      .getByRole("link", { name: "Sign in" })
      .getAttribute("href"),
  ).toBe("/sign-in");
});
it("keeps the local editor available when Clerk is not configured", () => {
  state.configured = false;
  render(<Navigation />);
  expect(screen.getByRole("link", { name: "Build your website" }).getAttribute("href")).toBe(
    "/editor",
  );
});
