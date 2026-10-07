import { games, players } from "./data";
import { gameNameEn, localizePlayer } from "./demo-locale";
import type { Locale } from "./i18n/messages";
import { personIdOf } from "./recent";
import type { GameId, Player, Region, VoicePlatform } from "./types";

export type PersonSummary = {
  personId: string;
  name: string;
  gameIds: GameId[];
  online: boolean;
  region?: Region;
  voicePlatform?: VoicePlatform;
  steamProfileUrl?: string | null;
  discordUrl?: string | null;
  riotTag?: string | null;
  faceitUrl?: string | null;
  roles: string[];
  bios: string[];
};

export function allPeople(locale: Locale = "ru"): PersonSummary[] {
  const map = new Map<string, PersonSummary>();
  for (const raw of players) {
    const player = localizePlayer(raw, locale);
    const personId = personIdOf(player);
    const existing = map.get(personId);
    if (!existing) {
      map.set(personId, {
        personId,
        name: player.name,
        gameIds: [player.gameId],
        online: player.online,
        region: player.region,
        voicePlatform: player.voicePlatform,
        steamProfileUrl: player.steamProfileUrl,
        discordUrl: player.discordUrl,
        riotTag: player.riotTag,
        faceitUrl: player.faceitUrl,
        roles: [player.role],
        bios: player.bio ? [player.bio] : [],
      });
      continue;
    }
    if (!existing.gameIds.includes(player.gameId)) existing.gameIds.push(player.gameId);
    existing.online = existing.online || player.online;
    if (!existing.region && player.region) existing.region = player.region;
    if (!existing.voicePlatform && player.voicePlatform) {
      existing.voicePlatform = player.voicePlatform;
    }
    if (!existing.steamProfileUrl && player.steamProfileUrl) {
      existing.steamProfileUrl = player.steamProfileUrl;
    }
    if (!existing.discordUrl && player.discordUrl) existing.discordUrl = player.discordUrl;
    if (!existing.riotTag && player.riotTag) existing.riotTag = player.riotTag;
    if (!existing.faceitUrl && player.faceitUrl) existing.faceitUrl = player.faceitUrl;
    if (!existing.roles.includes(player.role)) existing.roles.push(player.role);
    if (player.bio && !existing.bios.includes(player.bio)) existing.bios.push(player.bio);
  }
  return [...map.values()].sort((a, b) => {
    if (a.online !== b.online) return Number(b.online) - Number(a.online);
    return a.name.localeCompare(b.name, locale === "en" ? "en" : "ru");
  });
}

export function personById(
  personId: string,
  locale: Locale = "ru",
): PersonSummary | undefined {
  return allPeople(locale).find((person) => person.personId === personId);
}

export function playersOfPerson(
  personId: string,
  locale: Locale = "ru",
): Player[] {
  return players
    .filter((player) => personIdOf(player) === personId)
    .map((player) => localizePlayer(player, locale));
}

export function gameName(gameId: GameId, locale: Locale = "ru"): string {
  if (locale === "en" && gameNameEn[gameId]) return gameNameEn[gameId]!;
  return games.find((game) => game.id === gameId)?.name ?? gameId;
}

export function filterPeople(
  people: PersonSummary[],
  query: string,
  gameId?: GameId | "all",
  locale: Locale = "ru",
): PersonSummary[] {
  const q = query.trim().toLowerCase();
  return people.filter((person) => {
    const matchesGame =
      !gameId || gameId === "all" || person.gameIds.includes(gameId);
    if (!matchesGame) return false;
    if (!q) return true;
    const hay = [
      person.name,
      ...person.gameIds.map((id) => gameName(id, locale)),
      ...person.roles,
      person.region ?? "",
      person.riotTag ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
