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
  updatedAt: number;
};

type Store = {
  joins: Map<string, JoinSession>;
  published: Map<string, OpenParty>;
  looking: Map<string, Player>;
};

const globalForStore = globalThis as typeof globalThis & {
  __teamlyPartyStore?: Store;
};

function store(): Store {
  if (!globalForStore.__teamlyPartyStore) {
    globalForStore.__teamlyPartyStore = {
      joins: new Map(),
      published: new Map(),
      looking: new Map(),
    };
    seedDemo(globalForStore.__teamlyPartyStore);
  }
  if (!globalForStore.__teamlyPartyStore.looking) {
    globalForStore.__teamlyPartyStore.looking = new Map();
  }
  return globalForStore.__teamlyPartyStore;
}

function seedDemo(target: Store) {
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
  target.joins.set(demo.code, demo);
  target.published.set(demo.code.toLowerCase(), sessionToOpenParty(demo));
}

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
  store().joins.set(code, next);
  if (next.published) {
    const party = sessionToOpenParty(next);
    if (party.filled >= party.partySize) {
      party.filled = Math.max(1, party.partySize - 1);
    }
    store().published.set(party.id, party);
  }
  return next;
}

export function getJoinSession(code: string): JoinSession | undefined {
  return store().joins.get(normalizeCode(code));
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
  const next = {
    ...session,
    published: true,
    note: note?.trim() || session.note || `Ищем ещё в ${session.partyName}`,
    startsAt: extras?.startsAt ?? session.startsAt ?? null,
    region: extras?.region ?? session.region,
    voicePlatform: extras?.voicePlatform ?? session.voicePlatform,
    updatedAt: Date.now(),
  };
  store().joins.set(next.code, next);
  const party = sessionToOpenParty(next);
  if (party.filled >= party.partySize) {
    party.filled = Math.max(1, party.partySize - 1);
  }
  store().published.set(party.id, party);
  return party;
}

export function unpublishSession(code: string) {
  const session = getJoinSession(code);
  if (!session) return;
  const next = { ...session, published: false, updatedAt: Date.now() };
  store().joins.set(next.code, next);
  store().published.delete(next.code.toLowerCase());
}

export function listPublishedParties(gameId?: GameId): OpenParty[] {
  const all = [...store().published.values()];
  return gameId ? all.filter((party) => party.gameId === gameId) : all;
}

export function getPublishedParty(id: string): OpenParty | undefined {
  return (
    store().published.get(id.toLowerCase()) ??
    store().published.get(normalizeCode(id).toLowerCase())
  );
}

export function publishedCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const party of store().published.values()) {
    if (party.filled >= party.partySize) continue;
    counts[party.gameId] = (counts[party.gameId] ?? 0) + 1;
  }
  return counts;
}

export function upsertLooking(player: Player): Player {
  store().looking.set(player.id, player);
  return player;
}

export function listLooking(gameId?: GameId): Player[] {
  const all = [...store().looking.values()];
  return gameId ? all.filter((player) => player.gameId === gameId) : all;
}

export function lookingCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const player of store().looking.values()) {
    counts[player.gameId] = (counts[player.gameId] ?? 0) + 1;
  }
  return counts;
}
