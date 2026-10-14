"use client";
import type { Profile } from "./profile";
type RecoveryEntry = { serialized: string; version: number; revision: number };
export type WebsiteRecovery = { profile: Profile; version: number; revision: number };
// This module lives only in the current tab's JavaScript memory. Account drafts
// are never written to browser storage and are scoped after authenticated GET.
const entries = new Map<string, RecoveryEntry>();
const MAX_ENTRIES = 3;
const MAX_ENTRY_CHARACTERS = 2000000;
const MAX_TOTAL_CHARACTERS = 4000000;
let revision = 0;
export function readWebsiteRecovery(scope: string): WebsiteRecovery | undefined {
  const entry = entries.get(scope);
  if (!entry) return;
  entries.delete(scope);
  entries.set(scope, entry);
  return {
    profile: JSON.parse(entry.serialized) as Profile,
    version: entry.version,
    revision: entry.revision,
  };
}
export function rememberWebsiteRecovery(
  scope: string,
  profile: Profile,
  version: number,
  expectedRevision?: number,
): number | undefined {
  if (expectedRevision !== undefined && entries.get(scope)?.revision !== expectedRevision) return;
  const serialized = JSON.stringify(profile);
  entries.delete(scope);
  if (serialized.length > MAX_ENTRY_CHARACTERS) return;
  const next = ++revision;
  entries.set(scope, { serialized, version, revision: next });
  while (
    entries.size > MAX_ENTRIES ||
    [...entries.values()].reduce((size, entry) => size + entry.serialized.length, 0) >
      MAX_TOTAL_CHARACTERS
  ) {
    entries.delete(entries.keys().next().value!);
  }
  return entries.has(scope) ? next : undefined;
}
export function forgetWebsiteRecovery(scope: string, expectedRevision: number): void {
  if (entries.get(scope)?.revision === expectedRevision) entries.delete(scope);
}
// Also used by regression tests so simulated accounts never share module state.
export function clearWebsiteRecoveries(): void {
  entries.clear();
}
