import { eq } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { joinSessions, lookingPosts } from "@/db/schema";
import { YOU_NAME } from "@/lib/data";
import type {
  GameId,
  HourWindow,
  OpenParty,
  PlayStyle,
  Player,
  Region,
  SkillLevel,
  VoicePlatform,
} from "./types";

ensureDb();

export type StoredSeat = {
  name: string;
  role: string;
  kind: "you" | "player" | "empty";
};

export type JoinSession = {
  code: string;
  partyName: string;
  gameId: GameId;
  partySize: number;
  playStyle: PlayStyle;
  skill: SkillLevel;
  hours: HourWindow[];
  seats: StoredSeat[];
  filled: number;
  published: boolean;
  note: string;
  micRequired: boolean;
  leader: string;
  ready: boolean;
  startsAt?: string | null;
  region?: Region;
  voicePlatform?: VoicePlatform;
  ownerUserId?: string | null;
  updatedAt: number;
};

function rowToSession(row: typeof joinSessions.$inferSelect): JoinSession {
  return {
    code: row.code,
    partyName: row.partyName,
    gameId: row.gameId as GameId,
    partySize: row.partySize,
    playStyle: row.playStyle as PlayStyle,
    skill: row.skill as SkillLevel,
    hours: JSON.parse(row.hoursJson) as HourWindow[],
    seats: JSON.parse(row.seatsJson) as StoredSeat[],
    filled: row.filled,
    published: Boolean(row.published),
    note: row.note,
    micRequired: Boolean(row.micRequired),
    leader: row.leader,
    ready: Boolean(row.ready),
    startsAt: row.startsAt,
    region: (row.region as Region | null) ?? undefined,
    voicePlatform: (row.voicePlatform as VoicePlatform | null) ?? undefined,
    ownerUserId: row.ownerUserId,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Number(row.updatedAt),
  };
}

function seedDemo() {
  const existing = db.select().from(joinSessions).where(eq(joinSessions.code, "DEMO1")).get();
  if (existing) return;
  const demo: JoinSession = {
    code: "DEMO1",
    partyName: "Демо-пати Ивана",
    gameId: "valorant",
    partySize: 5,
    playStyle: "ranked",
    skill: 4,
    hours: ["evening"],
    seats: [
      { kind: "you", name: YOU_NAME, role: "Хост" },
      { kind: "empty", name: "", role: "" },
      { kind: "empty", name: "", role: "" },
      { kind: "empty", name: "", role: "" },
      { kind: "empty", name: "", role: "" },
    ],
    filled: 1,
    published: true,
    note: "Демо-сбор для проверки ссылки между браузерами.",
    micRequired: true,
    leader: YOU_NAME,
    ready: false,
    startsAt: "сегодня 21:00",
    region: "msk",
    voicePlatform: "discord",
    updatedAt: Date.now(),
  };
  upsertJoinSession(demo);
}

seedDemo();

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export function sessionToOpenParty(session: JoinSession): OpenParty {
  return {
    id: session.code.toLowerCase(),
    name: session.partyName,
    gameId: session.gameId,
    playStyle: session.playStyle,
    partySize: session.partySize,
    filled: Math.min(session.filled, session.partySize - 1) || session.filled,
    skill: session.skill,
    hours: session.hours,
    leader: session.leader,
    note: session.note,
    micRequired: session.micRequired,
    startsAt: session.startsAt ?? null,
    region: session.region,
    voicePlatform: session.voicePlatform,
    members: session.seats
      .filter((seat) => seat.kind !== "empty")
      .map((seat) => seat.name)
      .filter(Boolean),
  };
}

export function upsertJoinSession(
  input: Omit<JoinSession, "updatedAt"> & { updatedAt?: number },
): JoinSession {
  const code = normalizeCode(input.code);
  const next: JoinSession = {
    ...input,
    code,
    updatedAt: Date.now(),
  };
  const values = {
    code,
    partyName: next.partyName,
    gameId: next.gameId,
    partySize: next.partySize,
    playStyle: next.playStyle,
    skill: next.skill,
    hoursJson: JSON.stringify(next.hours),
    seatsJson: JSON.stringify(next.seats),
    filled: next.filled,
    published: next.published,
    note: next.note,
    micRequired: next.micRequired,
    leader: next.leader,
    ready: next.ready,
    startsAt: next.startsAt ?? null,
    region: next.region ?? null,
    voicePlatform: next.voicePlatform ?? null,
    ownerUserId: next.ownerUserId ?? null,
    updatedAt: new Date(next.updatedAt),
  };
  db.insert(joinSessions)
    .values(values)
    .onConflictDoUpdate({
      target: joinSessions.code,
      set: values,
    })
    .run();
  return next;
}

export function getJoinSession(code: string): JoinSession | undefined {
  const row = db
    .select()
    .from(joinSessions)
    .where(eq(joinSessions.code, normalizeCode(code)))
    .get();
  return row ? rowToSession(row) : undefined;
}

export function publishSession(
  code: string,
  note?: string,
  extras?: {
    startsAt?: string | null;
    region?: Region;
    voicePlatform?: VoicePlatform;
  },
): OpenParty | null {
  const session = getJoinSession(code);
  if (!session) return null;
  const next = upsertJoinSession({
    ...session,
    published: true,
    note: note?.trim() || session.note || `Ищем ещё в ${session.partyName}`,
    startsAt: extras?.startsAt ?? session.startsAt ?? null,
    region: extras?.region ?? session.region,
    voicePlatform: extras?.voicePlatform ?? session.voicePlatform,
  });
  const party = sessionToOpenParty(next);
  if (party.filled >= party.partySize) {
    party.filled = Math.max(1, party.partySize - 1);
  }
  return party;
}

export function unpublishSession(code: string) {
  const session = getJoinSession(code);
  if (!session) return;
  upsertJoinSession({ ...session, published: false });
}

export function listPublishedParties(gameId?: GameId): OpenParty[] {
  const rows = db.select().from(joinSessions).all().map(rowToSession);
  return rows
    .filter((session) => session.published)
    .filter((session) => !gameId || session.gameId === gameId)
    .map((session) => {
      const party = sessionToOpenParty(session);
      if (party.filled >= party.partySize) {
        party.filled = Math.max(1, party.partySize - 1);
      }
      return party;
    });
}

export function getPublishedParty(id: string): OpenParty | undefined {
  const code = normalizeCode(id);
  const session =
    getJoinSession(code) ??
    db
      .select()
      .from(joinSessions)
      .all()
      .map(rowToSession)
      .find((row) => row.code.toLowerCase() === id.toLowerCase());
  if (!session?.published) return undefined;
  return sessionToOpenParty(session);
}

export function publishedCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const party of listPublishedParties()) {
    if (party.filled >= party.partySize) continue;
    counts[party.gameId] = (counts[party.gameId] ?? 0) + 1;
  }
  return counts;
}

export function upsertLooking(player: Player): Player {
  const values = {
    id: player.id,
    personId: player.personId ?? player.id,
    userId: player.personId?.startsWith("acc-") ? null : player.personId ?? null,
    name: player.name,
    gameId: player.gameId,
    payloadJson: JSON.stringify(player),
    updatedAt: new Date(),
  };
  db.insert(lookingPosts)
    .values(values)
    .onConflictDoUpdate({
      target: lookingPosts.id,
      set: values,
    })
    .run();
  return player;
}

export function listLooking(gameId?: GameId): Player[] {
  const rows = db.select().from(lookingPosts).all();
  return rows
    .map((row) => JSON.parse(row.payloadJson) as Player)
    .filter((player) => !gameId || player.gameId === gameId);
}

export function lookingCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const player of listLooking()) {
    counts[player.gameId] = (counts[player.gameId] ?? 0) + 1;
  }
  return counts;
}
