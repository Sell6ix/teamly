import { players } from "./data";
import type { GameId, Player } from "./types";

export const RECENT_STORAGE_KEY = "teamly-recent-v1";
const MAX_RECENT = 12;

export type RecentInvite = {
  personId: string;
  playerId: string;
  name: string;
  gameId: GameId;
  at: number;
};

export function personIdOf(player: Player): string {
  return player.personId ?? player.id;
}

export function playersForPerson(personId: string): Player[] {
  return players.filter((player) => personIdOf(player) === personId);
}

export function counterpartInGame(personId: string, gameId: GameId): Player | undefined {
  return players.find(
    (player) => personIdOf(player) === personId && player.gameId === gameId,
  );
}

export function otherGamesFor(player: Player): GameId[] {
  return playersForPerson(personIdOf(player))
    .filter((row) => row.gameId !== player.gameId)
    .map((row) => row.gameId);
}

export function parseRecent(raw: string | null): RecentInvite[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RecentInvite[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.personId === "string" &&
        typeof item.playerId === "string" &&
        typeof item.name === "string" &&
        typeof item.gameId === "string",
    );
  } catch {
    return [];
  }
}

export function rememberInvite(
  player: Player,
  existing: RecentInvite[] = loadRecent(),
): RecentInvite[] {
  const personId = personIdOf(player);
  const next: RecentInvite[] = [
    {
      personId,
      playerId: player.id,
      name: player.name,
      gameId: player.gameId,
      at: Date.now(),
    },
    ...existing.filter((item) => item.personId !== personId),
  ].slice(0, MAX_RECENT);
  saveRecent(next);
  return next;
}

export function loadRecent(): RecentInvite[] {
  if (typeof window === "undefined") return [];
  return parseRecent(window.localStorage.getItem(RECENT_STORAGE_KEY));
}

export function saveRecent(items: RecentInvite[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(items));
}

export function recentForGame(gameId: GameId, items: RecentInvite[] = loadRecent()): Player[] {
  const seen = new Set<string>();
  const result: Player[] = [];
  for (const item of items) {
    if (seen.has(item.personId)) continue;
    const player = counterpartInGame(item.personId, gameId);
    if (!player) continue;
    seen.add(item.personId);
    result.push(player);
  }
  return result;
}

export function recentPersonIds(items: RecentInvite[] = loadRecent()): string[] {
  return [...new Set(items.map((item) => item.personId))];
}
