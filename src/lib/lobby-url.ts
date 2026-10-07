import type { Game, HourWindow, MatchCriteria, PlayStyle, SkillLevel } from "./types";
import { HOURS, PLAY_STYLES, SKILL_LEVELS } from "./types";

export type LobbyFilters = {
  playStyle: PlayStyle;
  partySize: number;
  skill: SkillLevel;
  hours: HourWindow[];
};

export function defaultLobbyFilters(game: Game): LobbyFilters {
  return {
    playStyle: "ranked",
    partySize: game.partySizes.includes(5) ? 5 : game.partySizes[0],
    skill: 4,
    hours: ["evening"],
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
  const styleRaw = pathStyle && isPlayStyle(pathStyle) ? pathStyle : params.get("style");
  const playStyle =
    styleRaw && isPlayStyle(styleRaw) ? styleRaw : defaults.playStyle;

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

  return { playStyle, partySize, skill, hours };
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
  };
}
