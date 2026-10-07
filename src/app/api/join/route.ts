import {
  normalizeCode,
  upsertJoinSession,
  type JoinSession,
  type StoredSeat,
} from "@/lib/party-store";
import type { GameId, HourWindow, PlayStyle, SkillLevel } from "@/lib/types";
import { HOURS, PLAY_STYLES, SKILL_LEVELS } from "@/lib/types";
import { gameById } from "@/lib/matching";
import { NextResponse } from "next/server";

function isPlayStyle(value: unknown): value is PlayStyle {
  return typeof value === "string" && (PLAY_STYLES as readonly string[]).includes(value);
}

function isHour(value: unknown): value is HourWindow {
  return typeof value === "string" && (HOURS as readonly string[]).includes(value);
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
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Нужен код пати." }, { status: 400 });
  }

  const gameId = payload.gameId;
  if (typeof gameId !== "string" || !gameById(gameId)) {
    return NextResponse.json({ error: "Укажите игру." }, { status: 400 });
  }
  if (!isPlayStyle(payload.playStyle)) {
    return NextResponse.json({ error: "Укажите стиль." }, { status: 400 });
  }
  if (typeof payload.partySize !== "number" || payload.partySize < 2 || payload.partySize > 5) {
    return NextResponse.json({ error: "Неверный формат пати." }, { status: 400 });
  }
  if (typeof payload.skill !== "number" || !(SKILL_LEVELS as readonly number[]).includes(payload.skill)) {
    return NextResponse.json({ error: "Неверный уровень." }, { status: 400 });
  }
  if (!Array.isArray(payload.hours) || !payload.hours.every(isHour) || payload.hours.length === 0) {
    return NextResponse.json({ error: "Укажите часы онлайна." }, { status: 400 });
  }

  const seats = Array.isArray(payload.seats)
    ? (payload.seats as StoredSeat[])
    : [{ kind: "you" as const, name: "Хост", role: "Хост" }];

  const filled =
    typeof payload.filled === "number"
      ? payload.filled
      : seats.filter((seat) => seat.kind !== "empty").length;

  const session: JoinSession = upsertJoinSession({
    code,
    partyName: typeof payload.partyName === "string" ? payload.partyName : `Пати ${code}`,
    gameId: gameId as GameId,
    partySize: payload.partySize,
    playStyle: payload.playStyle,
    skill: payload.skill as SkillLevel,
    hours: payload.hours as HourWindow[],
    seats,
    filled,
    published: payload.published === true,
    note: typeof payload.note === "string" ? payload.note : "",
    micRequired: payload.micRequired !== false,
    leader: typeof payload.leader === "string" ? payload.leader : "Хост",
    ready: payload.ready === true,
  });

  return NextResponse.json({ session });
}
