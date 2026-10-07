import { gameById, matchPeople } from "@/lib/matching";
import { listPublishedParties } from "@/lib/party-store";
import type { GameId, HourWindow, MatchCriteria, PlayStyle, SkillLevel } from "@/lib/types";
import { NextResponse } from "next/server";

const PLAY_STYLES: PlayStyle[] = ["casual", "ranked", "learning", "voice", "speedrun"];
const HOURS: HourWindow[] = ["morning", "day", "evening", "night"];

function isPlayStyle(value: unknown): value is PlayStyle {
  return typeof value === "string" && PLAY_STYLES.includes(value as PlayStyle);
}

function isHour(value: unknown): value is HourWindow {
  return typeof value === "string" && HOURS.includes(value as HourWindow);
}

export async function POST(request: Request) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Не удалось прочитать запрос. Проверьте соединение и повторите." },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  if (payload.forceError === true) {
    return NextResponse.json(
      { error: "Поиск временно недоступен. Попробуйте ещё раз через несколько секунд." },
      { status: 503 },
    );
  }

  const gameId = payload.gameId;
  const playStyle = payload.playStyle;
  const partySize = payload.partySize;
  const skill = payload.skill;
  const hours = payload.hours;

  if (typeof gameId !== "string" || !gameById(gameId)) {
    return NextResponse.json({ error: "Выберите игру из списка." }, { status: 400 });
  }
  if (!isPlayStyle(playStyle)) {
    return NextResponse.json({ error: "Укажите стиль игры." }, { status: 400 });
  }
  if (typeof partySize !== "number" || partySize < 2 || partySize > 5) {
    return NextResponse.json({ error: "Формат пати должен быть от 2 до 5 человек." }, { status: 400 });
  }
  if (typeof skill !== "number" || skill < 1 || skill > 5) {
    return NextResponse.json({ error: "Укажите свой уровень." }, { status: 400 });
  }
  if (!Array.isArray(hours) || hours.length === 0 || !hours.every(isHour)) {
    return NextResponse.json(
      { error: "Отметьте хотя бы одно окно, когда вы обычно онлайн." },
      { status: 400 },
    );
  }

  const criteria: MatchCriteria = {
    gameId: gameId as MatchCriteria["gameId"],
    playStyle,
    partySize,
    skill: skill as SkillLevel,
    hours,
  };

  const published = listPublishedParties(criteria.gameId as GameId);
  return NextResponse.json(matchPeople(criteria, published));
}
