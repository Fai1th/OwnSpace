"use client";
export function CookieSettingsButton() {
  return (
    <button
      className="button secondary small"
      onClick={() => window.dispatchEvent(new Event("ownspace-cookie-settings"))}
    >
      Change cookie choices
    </button>
  );
}
