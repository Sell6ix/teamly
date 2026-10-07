import { defaultProfile, loadProfile, saveProfile, type UserProfile } from "./profile";

export function newAccountId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `acc-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `acc-${Math.random().toString(36).slice(2, 10)}`;
}

/** Ensures the local demo account has a stable id (browser localStorage). */
export function ensureAccount(profile: UserProfile = loadProfile()): UserProfile {
  if (profile.accountId) return profile;
  const next = { ...profile, accountId: newAccountId() };
  saveProfile(next);
  return next;
}

export function loadAccount(): UserProfile {
  if (typeof window === "undefined") {
    return { ...defaultProfile(), accountId: "acc-server" };
  }
  return ensureAccount(loadProfile());
}

export function isSignedInLocally(profile: UserProfile = loadProfile()): boolean {
  return Boolean(profile.accountId && profile.displayName.trim());
}
