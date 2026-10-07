"use client";

import { YOU_NAME } from "@/lib/data";
import type { GameId, OpenParty, Player } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";

export type Seat = { kind: "you" } | { kind: "player"; player: Player } | { kind: "empty" };

type PartySnapshot = {
  joinCode: string;
  partyName: string;
  seats: Seat[];
  joinedParty: OpenParty | null;
  ready: boolean;
  gameId: GameId | null;
};

type PartyContextValue = {
  joinCode: string;
  partyName: string;
  seats: Seat[];
  joinedParty: OpenParty | null;
  ready: boolean;
  gameId: GameId | null;
  filledCount: number;
  invitedIds: Set<string>;
  partyFull: boolean;
  setPartyName: (name: string) => void;
  ensurePartyForGame: (gameId: GameId, size: number) => void;
  invite: (player: Player) => void;
  kick: (playerId: string) => void;
  joinParty: (party: OpenParty) => void;
  leaveJoined: () => void;
  setReady: (ready: boolean) => void;
  loadJoinCode: (code: string) => boolean;
  applyOpenParty: (party: OpenParty, autoJoin?: boolean) => void;
  shareUrl: string;
  copyShareLink: () => Promise<void>;
};

const STORAGE_KEY = "teamly-party-v1";
const PartyContext = createContext<PartyContextValue | null>(null);

function makeSeats(size: number, invited: Player[] = []): Seat[] {
  const seats: Seat[] = [{ kind: "you" }];
  invited.forEach((player) => seats.push({ kind: "player", player }));
  while (seats.length < size) seats.push({ kind: "empty" });
  return seats.slice(0, size);
}

function makeJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function defaultSnapshot(): PartySnapshot {
  return {
    joinCode: "DEMO1",
    partyName: `Пати ${YOU_NAME}`,
    seats: makeSeats(5),
    joinedParty: null,
    ready: false,
    gameId: null,
  };
}

function deserialize(raw: string | null): PartySnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PartySnapshot;
  } catch {
    return null;
  }
}

const serverSnapshot = defaultSnapshot();
let clientSnapshot: PartySnapshot | null = null;
const listeners = new Set<() => void>();

function ensureClientSnapshot(): PartySnapshot {
  if (typeof window === "undefined") return serverSnapshot;
  if (clientSnapshot) return clientSnapshot;
  const saved = deserialize(sessionStorage.getItem(STORAGE_KEY));
  clientSnapshot = saved
    ? { ...saved, joinCode: saved.joinCode || makeJoinCode() }
    : { ...defaultSnapshot(), joinCode: makeJoinCode() };
  return clientSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return ensureClientSnapshot();
}

function getServerSnapshot() {
  return serverSnapshot;
}

function writeSnapshot(next: PartySnapshot) {
  if (typeof window === "undefined") return;
  clientSnapshot = next;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function PartyProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((patch: Partial<PartySnapshot>) => {
    writeSnapshot({ ...ensureClientSnapshot(), ...patch });
  }, []);

  const invitedIds = useMemo(
    () =>
      new Set(
        snapshot.seats
          .filter((seat): seat is { kind: "player"; player: Player } => seat.kind === "player")
          .map((seat) => seat.player.id),
      ),
    [snapshot.seats],
  );

  const filledCount = snapshot.seats.filter((seat) => seat.kind !== "empty").length;
  const partyFull = filledCount >= snapshot.seats.length;

  const ensurePartyForGame = useCallback((nextGameId: GameId, size: number) => {
    const current = ensureClientSnapshot();
    if (current.gameId !== nextGameId) {
      writeSnapshot({
        joinCode: makeJoinCode(),
        partyName: `Пати ${YOU_NAME}`,
        seats: makeSeats(size),
        joinedParty: null,
        ready: false,
        gameId: nextGameId,
      });
      return;
    }
    if (current.seats.length !== size && !current.joinedParty) {
      writeSnapshot({ ...current, seats: makeSeats(size) });
    }
  }, []);

  const invite = useCallback((player: Player) => {
    const current = ensureClientSnapshot();
    if (current.joinedParty) {
      toast.error("Вы уже в чужом сборе. Выйдите, чтобы собрать свою пати.");
      return;
    }
    if (current.seats.some((seat) => seat.kind === "player" && seat.player.id === player.id)) {
      return;
    }
    const emptyIndex = current.seats.findIndex((seat) => seat.kind === "empty");
    if (emptyIndex === -1) {
      toast.error("Пати уже полная.");
      return;
    }
    const seats = [...current.seats];
    seats[emptyIndex] = { kind: "player", player };
    writeSnapshot({ ...current, seats });
    toast.success(`${player.name} в пати`, { duration: 1800 });
  }, []);

  const kick = useCallback((playerId: string) => {
    const current = ensureClientSnapshot();
    writeSnapshot({
      ...current,
      ready: false,
      seats: current.seats.map((seat) =>
        seat.kind === "player" && seat.player.id === playerId ? { kind: "empty" } : seat,
      ),
    });
  }, []);

  const joinParty = useCallback((party: OpenParty) => {
    if (party.filled >= party.partySize) return;
    const placeholders: Player[] = Array.from({ length: party.filled }, (_, index) => ({
      id: `slot-${party.id}-${index}`,
      name: index === 0 ? party.leader : `Игрок ${index + 1}`,
      gameId: party.gameId,
      playStyles: [party.playStyle],
      skill: party.skill,
      hours: party.hours,
      lookingForSize: party.partySize,
      role: index === 0 ? "Лидер сбора" : "Уже в пати",
      mic: party.micRequired,
      online: true,
      bio: party.note,
      timezone: "МСК",
    }));
    writeSnapshot({
      joinCode: party.id.toUpperCase(),
      partyName: party.name,
      seats: makeSeats(party.partySize, placeholders),
      joinedParty: party,
      ready: false,
      gameId: party.gameId,
    });
    toast.success(`Вы в сборе «${party.name}»`);
  }, []);

  const leaveJoined = useCallback(() => {
    const current = ensureClientSnapshot();
    writeSnapshot({
      joinCode: makeJoinCode(),
      partyName: `Пати ${YOU_NAME}`,
      seats: makeSeats(current.seats.length),
      joinedParty: null,
      ready: false,
      gameId: current.gameId,
    });
    toast("Вы вышли из сбора");
  }, []);

  const loadJoinCode = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;
    const current = ensureClientSnapshot();
    if (normalized === current.joinCode.toUpperCase()) return true;
    const saved = deserialize(sessionStorage.getItem(STORAGE_KEY));
    if (saved && saved.joinCode.toUpperCase() === normalized) {
      writeSnapshot(saved);
      return true;
    }
    writeSnapshot({
      joinCode: normalized,
      partyName: `Пати ${normalized}`,
      seats: makeSeats(5),
      joinedParty: null,
      ready: false,
      gameId: "valorant",
    });
    toast.success(`Открыта пати по коду ${normalized}`);
    return true;
  }, []);

  const applyOpenParty = useCallback((party: OpenParty) => {
    const current = ensureClientSnapshot();
    if (current.gameId !== party.gameId) {
      writeSnapshot({ ...current, gameId: party.gameId });
    }
  }, []);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${snapshot.joinCode}`
      : `/join/${snapshot.joinCode}`;

  const copyShareLink = useCallback(async () => {
    const current = ensureClientSnapshot();
    const url = `${window.location.origin}/join/${current.joinCode}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка на пати скопирована");
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  }, []);

  const value: PartyContextValue = {
    joinCode: snapshot.joinCode,
    partyName: snapshot.partyName,
    seats: snapshot.seats,
    joinedParty: snapshot.joinedParty,
    ready: snapshot.ready,
    gameId: snapshot.gameId,
    filledCount,
    invitedIds,
    partyFull,
    setPartyName: (name) => update({ partyName: name }),
    ensurePartyForGame,
    invite,
    kick,
    joinParty,
    leaveJoined,
    setReady: (ready) => update({ ready }),
    loadJoinCode,
    applyOpenParty,
    shareUrl,
    copyShareLink,
  };

  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error("useParty must be used within PartyProvider");
  return ctx;
}

/** Apply a join deep-link after mount (async, avoids sync setState-in-effect). */
export function useJoinCodeBootstrap(code: string) {
  const party = useParty();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      party.loadJoinCode(code);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code, party]);
  return party;
}
