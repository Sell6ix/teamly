import { auth } from "@/auth";
import { gameById } from "@/lib/matching";
import { listLooking, upsertLooking } from "@/lib/party-store";
import { LANGUAGES, REGIONS, VOICE_PLATFORMS } from "@/lib/profile";
import type {
  GameId,
  HourWindow,
  Language,
  PlayStyle,
  Player,
  Region,
  SkillLevel,
  VoicePlatform,
} from "@/lib/types";
import { HOURS, PLAY_STYLES, SKILL_LEVELS } from "@/lib/types";
import { NextResponse } from "next/server";

function isPlayStyle(value: unknown): value is PlayStyle {
  return typeof value === "string" && (PLAY_STYLES as readonly string[]).includes(value);
}

function isHour(value: unknown): value is HourWindow {
  return typeof value === "string" && (HOURS as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const gameId = new URL(request.url).searchParams.get("gameId");
  if (gameId && !gameById(gameId)) {
    return NextResponse.json({ error: "Неизвестная игра." }, { status: 400 });
  }
  return NextResponse.json({
    players: listLooking(gameId ? (gameId as GameId) : undefined),
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать запрос." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const gameId = payload.gameId;
  if (typeof gameId !== "string" || !gameById(gameId)) {
    return NextResponse.json({ error: "Укажите игру." }, { status: 400 });
  }
  if (!isPlayStyle(payload.playStyle)) {
    return NextResponse.json({ error: "Укажите стиль." }, { status: 400 });
  }
  if (typeof payload.partySize !== "number" || payload.partySize < 2 || payload.partySize > 12) {
    return NextResponse.json({ error: "Неверный формат." }, { status: 400 });
  }
  if (typeof payload.skill !== "number" || !(SKILL_LEVELS as readonly number[]).includes(payload.skill)) {
    return NextResponse.json({ error: "Укажите уровень." }, { status: 400 });
  }
  if (!Array.isArray(payload.hours) || !payload.hours.every(isHour) || payload.hours.length === 0) {
    return NextResponse.json({ error: "Укажите часы." }, { status: 400 });
  }

  const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : "Иван";
  const role = typeof payload.role === "string" && payload.role.trim() ? payload.role.trim() : "Хост";
  const bio =
    typeof payload.bio === "string" && payload.bio.trim()
      ? payload.bio.trim()
      : "Ищу пати по текущим фильтрам лобби.";
  const session = await auth();
  const accountId =
    session?.user?.id ||
    (typeof payload.accountId === "string" && payload.accountId.trim()
      ? payload.accountId.trim()
      : "you");

  const player: Player = {
    id: `you-${accountId}-${gameId}`,
    personId: accountId,
    name,
    gameId: gameId as GameId,
    playStyles: [payload.playStyle],
    skill: payload.skill as SkillLevel,
    hours: payload.hours as HourWindow[],
    lookingForSize: payload.partySize,
    role,
    mic: true,
    online: true,
    bio,
    timezone: "МСК",
    region:
      typeof payload.region === "string" && (REGIONS as readonly string[]).includes(payload.region)
        ? (payload.region as Region)
        : undefined,
    voicePlatform:
      typeof payload.voicePlatform === "string" &&
      (VOICE_PLATFORMS as readonly string[]).includes(payload.voicePlatform)
        ? (payload.voicePlatform as VoicePlatform)
        : undefined,
    language:
      typeof payload.language === "string" &&
      (LANGUAGES as readonly string[]).includes(payload.language)
        ? (payload.language as Language)
        : undefined,
    steamProfileUrl: typeof payload.steamProfileUrl === "string" ? payload.steamProfileUrl : null,
    discordUrl: typeof payload.discordUrl === "string" ? payload.discordUrl : null,
    riotTag: typeof payload.riotTag === "string" ? payload.riotTag : null,
    faceitUrl: typeof payload.faceitUrl === "string" ? payload.faceitUrl : null,
  };

  return NextResponse.json({ player: upsertLooking(player) });
}
