import { playStylesFor, roleFacetFor } from "./game-fields";
import { LANGUAGES, REGIONS, VOICE_PLATFORMS } from "./profile";
import type {
  Game,
  HourWindow,
  Language,
  MatchCriteria,
  PlayStyle,
  Region,
  SkillLevel,
  VoicePlatform,
} from "./types";
import { HOURS, PLAY_STYLES, SKILL_LEVELS } from "./types";

export type LobbyFilters = {
  playStyle: PlayStyle;
  partySize: number;
  skill: SkillLevel;
  hours: HourWindow[];
  roleTag: string | null;
  region: Region | null;
  voicePlatform: VoicePlatform | null;
  language: Language | null;
};

export function defaultLobbyFilters(game: Game): LobbyFilters {
  const styles = playStylesFor(game.id);
  const preferredSize =
    game.partySizes.find((size) => size === 8) ??
    game.partySizes.find((size) => size === 5) ??
    game.partySizes[Math.floor((game.partySizes.length - 1) / 2)] ??
    game.partySizes[0];
  return {
    playStyle: styles.includes("ranked") ? "ranked" : styles[0],
    partySize: preferredSize,
    skill: game.type === "party" ? 3 : 4,
    hours: ["evening"],
    roleTag: null,
    region: null,
    voicePlatform: null,
    language: null,
  };
}

export function isPlayStyle(value: string): value is PlayStyle {
  return (PLAY_STYLES as readonly string[]).includes(value);
}

export function parseLobbySearchParams(
  game: Game,
  params: URLSearchParams,
  pathStyle?: string | null,
): LobbyFilters {
  const defaults = defaultLobbyFilters(game);
  const allowedStyles = playStylesFor(game.id);
  const styleRaw = pathStyle && isPlayStyle(pathStyle) ? pathStyle : params.get("style");
  const playStyle =
    styleRaw && isPlayStyle(styleRaw) && allowedStyles.includes(styleRaw)
      ? styleRaw
      : defaults.playStyle;

  const sizeRaw = Number(params.get("size"));
  const partySize = game.partySizes.includes(sizeRaw) ? sizeRaw : defaults.partySize;

  const skillRaw = Number(params.get("skill"));
  const skill = (SKILL_LEVELS as readonly number[]).includes(skillRaw)
    ? (skillRaw as SkillLevel)
    : defaults.skill;

  const hoursRaw = params.get("hours");
  let hours = defaults.hours;
  if (hoursRaw) {
    const parsed = hoursRaw
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is HourWindow => (HOURS as readonly string[]).includes(item));
    if (parsed.length) hours = parsed;
  }

  const roleRaw = params.get("role");
  const facet = roleFacetFor(game.id);
  const roleTag =
    roleRaw && facet?.options.some((opt) => opt.id === roleRaw) ? roleRaw : null;

  const regionRaw = params.get("region");
  const region =
    regionRaw && (REGIONS as readonly string[]).includes(regionRaw)
      ? (regionRaw as Region)
      : null;

  const voiceRaw = params.get("voice");
  const voicePlatform =
    voiceRaw && (VOICE_PLATFORMS as readonly string[]).includes(voiceRaw)
      ? (voiceRaw as VoicePlatform)
      : null;

  const langRaw = params.get("lang");
  const language =
    langRaw && (LANGUAGES as readonly string[]).includes(langRaw)
      ? (langRaw as Language)
      : null;

  return {
    playStyle,
    partySize,
    skill,
    hours,
    roleTag,
    region,
    voicePlatform,
    language,
  };
}

/** Query params only (style lives in `/g/{game}/{style}` when using the alias). */
export function lobbyFiltersToParams(
  filters: LobbyFilters,
  game: Game,
  options?: { includeStyle?: boolean },
): URLSearchParams {
  const defaults = defaultLobbyFilters(game);
  const params = new URLSearchParams();
  if (options?.includeStyle && filters.playStyle !== defaults.playStyle) {
    params.set("style", filters.playStyle);
  }
  if (filters.partySize !== defaults.partySize) params.set("size", String(filters.partySize));
  if (filters.skill !== defaults.skill) params.set("skill", String(filters.skill));
  const hoursKey = filters.hours.slice().sort().join(",");
  const defaultHoursKey = defaults.hours.slice().sort().join(",");
  if (hoursKey !== defaultHoursKey) params.set("hours", filters.hours.join(","));
  if (filters.roleTag) params.set("role", filters.roleTag);
  if (filters.region) params.set("region", filters.region);
  if (filters.voicePlatform) params.set("voice", filters.voicePlatform);
  if (filters.language) params.set("lang", filters.language);
  return params;
}

export function lobbyHref(gameId: string, filters: LobbyFilters, game: Game): string {
  const params = lobbyFiltersToParams(filters, game, { includeStyle: false });
  const qs = params.toString();
  const path = `/g/${gameId}/${filters.playStyle}`;
  return qs ? `${path}?${qs}` : path;
}

export function filtersToCriteria(gameId: Game["id"], filters: LobbyFilters): MatchCriteria {
  return {
    gameId,
    playStyle: filters.playStyle,
    partySize: filters.partySize,
    skill: filters.skill,
    hours: filters.hours.length ? filters.hours : ["evening"],
    roleTag: filters.roleTag,
    region: filters.region,
    voicePlatform: filters.voicePlatform,
    language: filters.language,
  };
}
