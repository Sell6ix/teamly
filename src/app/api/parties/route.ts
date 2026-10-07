import { YOU_NAME } from "@/lib/data";
import { gameById } from "@/lib/matching";
import {
  getJoinSession,
  listPublishedParties,
  normalizeCode,
  publishSession,
  publishedCounts,
  upsertJoinSession,
} from "@/lib/party-store";
import type { GameId, HourWindow, PlayStyle, SkillLevel } from "@/lib/types";
import { HOURS, PLAY_STYLES, SKILL_LEVELS } from "@/lib/types";
import { NextResponse } from "next/server";

function isPlayStyle(value: unknown): value is PlayStyle {
  return typeof value === "string" && (PLAY_STYLES as readonly string[]).includes(value);
}

function isHour(value: unknown): value is HourWindow {
  return typeof value === "string" && (HOURS as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  if (searchParams.get("counts") === "1") {
    return NextResponse.json({ counts: publishedCounts() });
  }
  if (gameId && !gameById(gameId)) {
    return NextResponse.json({ error: "Неизвестная игра." }, { status: 400 });
  }
  const parties = listPublishedParties(gameId ? (gameId as GameId) : undefined);
  return NextResponse.json({ parties });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать запрос." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const code = typeof payload.code === "string" ? normalizeCode(payload.code) : "";
  if (!code) {
    return NextResponse.json({ error: "Нужен код пати." }, { status: 400 });
  }

  let session = getJoinSession(code);
  if (!session) {
    const gameId = payload.gameId;
    if (typeof gameId !== "string" || !gameById(gameId)) {
      return NextResponse.json({ error: "Сначала соберите пати в лобби." }, { status: 400 });
    }
    if (!isPlayStyle(payload.playStyle)) {
      return NextResponse.json({ error: "Укажите стиль." }, { status: 400 });
    }
    if (typeof payload.partySize !== "number") {
      return NextResponse.json({ error: "Укажите формат." }, { status: 400 });
    }
    if (typeof payload.skill !== "number" || !(SKILL_LEVELS as readonly number[]).includes(payload.skill)) {
      return NextResponse.json({ error: "Укажите уровень." }, { status: 400 });
    }
    if (!Array.isArray(payload.hours) || !payload.hours.every(isHour)) {
      return NextResponse.json({ error: "Укажите часы." }, { status: 400 });
    }
    session = upsertJoinSession({
      code,
      partyName: typeof payload.partyName === "string" ? payload.partyName : `Пати ${YOU_NAME}`,
      gameId: gameId as GameId,
      partySize: payload.partySize,
      playStyle: payload.playStyle,
      skill: payload.skill as SkillLevel,
      hours: payload.hours as HourWindow[],
      seats: Array.isArray(payload.seats) ? payload.seats : [],
      filled: typeof payload.filled === "number" ? payload.filled : 1,
      published: false,
      note: typeof payload.note === "string" ? payload.note : "",
      micRequired: true,
      leader: YOU_NAME,
      ready: false,
    });
  }

  const note =
    typeof payload.note === "string" && payload.note.trim()
      ? payload.note.trim()
      : `Открытый сбор · свободно ${Math.max(1, session.partySize - session.filled)}`;

  const party = publishSession(code, note);
  if (!party) {
    return NextResponse.json({ error: "Не удалось открыть сбор." }, { status: 500 });
  }

  return NextResponse.json({ party, session: getJoinSession(code) });
}
