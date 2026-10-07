import { roleFacetFor } from "@/lib/game-fields";
import { translate, type Locale } from "@/lib/i18n/messages";
import { gameById, matchPeople } from "@/lib/matching";
import { listLooking, listPublishedParties } from "@/lib/party-store";
import { LANGUAGES, REGIONS, VOICE_PLATFORMS } from "@/lib/profile";
import type {
  GameId,
  HourWindow,
  Language,
  MatchCriteria,
  PlayStyle,
  Region,
  SkillLevel,
  VoicePlatform,
} from "@/lib/types";
import { NextResponse } from "next/server";

const PLAY_STYLES: PlayStyle[] = ["casual", "ranked", "learning", "voice", "speedrun"];
const HOURS: HourWindow[] = ["morning", "day", "evening", "night"];

function isPlayStyle(value: unknown): value is PlayStyle {
  return typeof value === "string" && PLAY_STYLES.includes(value as PlayStyle);
}

function isHour(value: unknown): value is HourWindow {
  return typeof value === "string" && HOURS.includes(value as HourWindow);
}

function isRoleTag(gameId: GameId, value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  return Boolean(roleFacetFor(gameId)?.options.some((opt) => opt.id === value));
}

function localeOf(value: unknown): Locale {
  return value === "en" ? "en" : "ru";
}

function err(locale: Locale, key: string, status: number) {
  return NextResponse.json({ error: translate(locale, key) }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("ru", "api.badJson", 400);
  }

  const payload = body as Record<string, unknown>;
  const locale = localeOf(payload.locale);

  if (payload.forceError === true) {
    return err(locale, "api.matchUnavailable", 503);
  }

  const gameId = payload.gameId;
  const playStyle = payload.playStyle;
  const partySize = payload.partySize;
  const skill = payload.skill;
  const hours = payload.hours;

  if (typeof gameId !== "string" || !gameById(gameId)) {
    return err(locale, "api.pickGame", 400);
  }
  if (!isPlayStyle(playStyle)) {
    return err(locale, "api.pickStyle", 400);
  }
  if (typeof partySize !== "number" || partySize < 2 || partySize > 12) {
    return err(locale, "api.pickSize", 400);
  }
  if (typeof skill !== "number" || skill < 1 || skill > 5) {
    return err(locale, "api.pickSkill", 400);
  }
  if (!Array.isArray(hours) || hours.length === 0 || !hours.every(isHour)) {
    return err(locale, "api.pickHours", 400);
  }

  const typedGameId = gameId as GameId;
  const roleTag = isRoleTag(typedGameId, payload.roleTag) ? payload.roleTag : null;
  const region =
    typeof payload.region === "string" &&
    (REGIONS as readonly string[]).includes(payload.region)
      ? (payload.region as Region)
      : null;
  const voicePlatform =
    typeof payload.voicePlatform === "string" &&
    (VOICE_PLATFORMS as readonly string[]).includes(payload.voicePlatform)
      ? (payload.voicePlatform as VoicePlatform)
      : null;
  const language =
    typeof payload.language === "string" &&
    (LANGUAGES as readonly string[]).includes(payload.language)
      ? (payload.language as Language)
      : null;

  const recentPersonIds = Array.isArray(payload.recentPersonIds)
    ? payload.recentPersonIds.filter((item): item is string => typeof item === "string")
    : [];
  const blockedPersonIds = Array.isArray(payload.blockedPersonIds)
    ? payload.blockedPersonIds.filter((item): item is string => typeof item === "string")
    : [];

  const criteria: MatchCriteria = {
    gameId: typedGameId,
    playStyle,
    partySize,
    skill: skill as SkillLevel,
    hours,
    roleTag,
    region,
    voicePlatform,
    language,
    locale,
    recentPersonIds,
    blockedPersonIds,
  };

  const published = listPublishedParties(typedGameId);
  const looking = listLooking(typedGameId);
  return NextResponse.json(matchPeople(criteria, published, looking));
}
