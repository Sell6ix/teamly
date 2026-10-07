export const PLAY_STYLES = [
  "casual",
  "ranked",
  "learning",
  "voice",
  "speedrun",
] as const;

export type PlayStyle = (typeof PLAY_STYLES)[number];

export const HOURS = ["morning", "day", "evening", "night"] as const;
export type HourWindow = (typeof HOURS)[number];

export const SKILL_LEVELS = [1, 2, 3, 4, 5] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export type GameId =
  | "valorant"
  | "dota2"
  | "cs2"
  | "apex"
  | "helldivers2"
  | "drg"
  | "lol"
  | "dbd"
  | "it-takes-two"
  | "lethalcompany"
  | "phasmophobia"
  | "l4d2"
  | "remnant2"
  | "bunker"
  | "mafia"
  | "amongus"
  | "gartic"
  | "jackbox"
  | "codenames"
  | "alias"
  | "uno"
  | "ggd";

/** High-level catalog filter (Бункер → пати и т.п.) */
export type GameType =
  | "party"
  | "shooter"
  | "moba"
  | "coop"
  | "horror"
  | "adventure";

export type Region = "msk" | "eu" | "kz" | "other";
export type VoicePlatform = "discord" | "ingame" | "any";

export type Game = {
  id: GameId;
  name: string;
  genre: string;
  type: GameType;
  accent: string;
  partySizes: number[];
};

export type Player = {
  id: string;
  name: string;
  gameId: GameId;
  playStyles: PlayStyle[];
  skill: SkillLevel;
  hours: HourWindow[];
  lookingForSize: number;
  role: string;
  mic: boolean;
  online: boolean;
  bio: string;
  timezone: string;
  region?: Region;
  voicePlatform?: VoicePlatform;
  /** Public Steam profile URL when the player shared one */
  steamProfileUrl?: string | null;
  discordUrl?: string | null;
  riotTag?: string | null;
};

export type OpenParty = {
  id: string;
  name: string;
  gameId: GameId;
  playStyle: PlayStyle;
  partySize: number;
  filled: number;
  skill: SkillLevel;
  hours: HourWindow[];
  leader: string;
  note: string;
  micRequired: boolean;
  /** Human slot like «сегодня 21:00» */
  startsAt?: string | null;
  region?: Region;
  voicePlatform?: VoicePlatform;
};

export type MatchCriteria = {
  gameId: GameId;
  playStyle: PlayStyle;
  partySize: number;
  skill: SkillLevel;
  hours: HourWindow[];
  /** Game-specific role/line/class tag from lobby chips */
  roleTag?: string | null;
  region?: Region | null;
  voicePlatform?: VoicePlatform | null;
};

export type PlayerMatch = {
  player: Player;
  score: number;
  reasons: string[];
};

export type PartyMatch = {
  party: OpenParty;
  score: number;
  reasons: string[];
};

export type MatchResult = {
  players: PlayerMatch[];
  parties: PartyMatch[];
};
