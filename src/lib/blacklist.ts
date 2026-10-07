export const BLACKLIST_STORAGE_KEY = "teamly-blacklist-v1";

export type BlacklistEntry = {
  personId: string;
  name: string;
  at: number;
};

export function parseBlacklist(raw: string | null): BlacklistEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BlacklistEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.personId === "string" &&
        typeof item.name === "string" &&
        typeof item.at === "number",
    );
  } catch {
    return [];
  }
}

export function loadBlacklist(): BlacklistEntry[] {
  if (typeof window === "undefined") return [];
  return parseBlacklist(window.localStorage.getItem(BLACKLIST_STORAGE_KEY));
}

export function saveBlacklist(entries: BlacklistEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(entries));
}

export function blockedPersonIds(entries: BlacklistEntry[] = loadBlacklist()): string[] {
  return entries.map((item) => item.personId);
}

export function isBlocked(
  personId: string,
  entries: BlacklistEntry[] = loadBlacklist(),
): boolean {
  return entries.some((item) => item.personId === personId);
}

export function blockPerson(
  personId: string,
  name: string,
  entries: BlacklistEntry[] = loadBlacklist(),
): BlacklistEntry[] {
  const next = [
    { personId, name, at: Date.now() },
    ...entries.filter((item) => item.personId !== personId),
  ];
  saveBlacklist(next);
  return next;
}

export function unblockPerson(
  personId: string,
  entries: BlacklistEntry[] = loadBlacklist(),
): BlacklistEntry[] {
  const next = entries.filter((item) => item.personId !== personId);
  saveBlacklist(next);
  return next;
}
