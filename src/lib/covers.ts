import type { GameId } from "./types";

const JPG: GameId[] = [
  "valorant",
  "dota2",
  "cs2",
  "apex",
  "helldivers2",
  "drg",
  "lol",
  "dbd",
  "it-takes-two",
  "lethalcompany",
  "phasmophobia",
  "l4d2",
  "remnant2",
];

export function coverSrc(gameId: GameId): string {
  if (JPG.includes(gameId)) return `/covers/${gameId}.jpg`;
  return `/covers/${gameId}.svg`;
}

export function coverFallbackSrc(gameId: GameId): string {
  return `/covers/${gameId}.svg`;
}
