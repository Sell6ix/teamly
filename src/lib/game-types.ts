import type { GameType } from "./types";

export const GAME_TYPES: GameType[] = [
  "party",
  "shooter",
  "coop",
  "horror",
  "moba",
  "adventure",
];

export const gameTypeLabel: Record<GameType, string> = {
  party: "Пати",
  shooter: "Шутеры",
  coop: "Кооп",
  horror: "Хоррор",
  moba: "MOBA",
  adventure: "Приключения",
};
