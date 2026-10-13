import { it, expect } from "vitest";
import { makeConsent, readSavedConsent, CONSENT_KEY } from "../lib/consent";
const now = 1800000000000;
const cookie = (c: ReturnType<typeof makeConsent>) =>
  "unrelated=value; " + CONSENT_KEY + "=" + encodeURIComponent(JSON.stringify(c));
it("uses the first-party choice when localStorage is blocked", () => {
  const c = makeConsent(false, false, now);
  const storage = {
    getItem() {
      throw Error("blocked");
    },
  };
  expect(readSavedConsent(storage, cookie(c), now)).toEqual(c);
});
it("honors a newer cookie rejection when localStorage still holds an older acceptance", () => {
  const old = makeConsent(true, true, now - 1000),
    latest = makeConsent(false, false, now);
  expect(readSavedConsent({ getItem: () => JSON.stringify(old) }, cookie(latest), now)).toEqual(
    latest,
  );
});
it("takes the more restrictive choice when the stores have the same timestamp", () => {
  const accepted = makeConsent(true, true, now),
    rejected = makeConsent(false, false, now);
  expect(
    readSavedConsent({ getItem: () => JSON.stringify(accepted) }, cookie(rejected), now)?.marketing,
  ).toBe(false);
});
it("can retain a valid local choice when cookies are missing or malformed", () => {
  const c = makeConsent(true, false, now);
  expect(
    readSavedConsent({ getItem: () => JSON.stringify(c) }, CONSENT_KEY + "=%broken", now),
  ).toEqual(c);
});
it("does not treat an expired cookie as a current choice", () => {
  expect(readSavedConsent(null, cookie(makeConsent(true, true, 0)), now)).toBeNull();
});
