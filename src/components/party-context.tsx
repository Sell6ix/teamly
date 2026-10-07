"use client";

import { isBlocked } from "@/lib/blacklist";
import { tStored } from "@/lib/i18n/context";
import { YOU_NAME } from "@/lib/data";
import type { JoinSession, StoredSeat } from "@/lib/party-store";
import { languageLabel, loadProfile } from "@/lib/profile";
import { personIdOf, rememberInvite } from "@/lib/recent";
import { shareOrCopy } from "@/lib/share";
import { getSession } from "next-auth/react";
import type {
  GameId,
  HourWindow,
  OpenParty,
  PlayStyle,
  Player,
  SkillLevel,
} from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";

export type Seat = { kind: "you" } | { kind: "player"; player: Player } | { kind: "empty" };

type LobbyMeta = {
  playStyle: PlayStyle;
  skill: SkillLevel;
  hours: HourWindow[];
};

type PartySnapshot = {
  joinCode: string;
  partyName: string;
  seats: Seat[];
  joinedParty: OpenParty | null;
  ready: boolean;
  gameId: GameId | null;
  published: boolean;
  lookingPosted: boolean;
  lobbyMeta: LobbyMeta;
  feedNonce: number;
};

type PartyContextValue = {
  joinCode: string;
  partyName: string;
  seats: Seat[];
  joinedParty: OpenParty | null;
  ready: boolean;
  gameId: GameId | null;
  published: boolean;
  feedNonce: number;
  filledCount: number;
  invitedIds: Set<string>;
  partyFull: boolean;
  setPartyName: (name: string) => void;
  setLobbyMeta: (meta: LobbyMeta) => void;
  ensurePartyForGame: (gameId: GameId, size: number) => void;
  invite: (player: Player) => void;
  kick: (playerId: string) => void;
  joinParty: (party: OpenParty) => void;
  leaveJoined: () => void;
  setReady: (ready: boolean) => void;
  loadJoinCode: (code: string) => Promise<boolean>;
  applyOpenParty: (party: OpenParty, autoJoin?: boolean) => void;
  publishOpenParty: (options?: {
    note?: string;
    startsAt?: string | null;
  }) => Promise<OpenParty | null>;
  shareUrl: string;
  copyShareLink: (prefer?: "auto" | "share" | "copy") => Promise<void>;
  publishLooking: (options?: { bio?: string; role?: string }) => Promise<boolean>;
  lookingPosted: boolean;
  copyReadyBrief: () => Promise<void>;
  bumpFeed: () => void;
};

const STORAGE_KEY = "teamly-party-v2";
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

function defaultSnapshot(stableCode = true): PartySnapshot {
  return {
    joinCode: stableCode ? "·····" : makeJoinCode(),
    partyName: tStored("party.defaultName", { name: YOU_NAME }),
    seats: makeSeats(5),
    joinedParty: null,
    ready: false,
    gameId: null,
    published: false,
    lookingPosted: false,
    lobbyMeta: { playStyle: "ranked", skill: 4, hours: ["evening"] },
    feedNonce: 0,
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

const serverSnapshot = defaultSnapshot(true);
let clientSnapshot: PartySnapshot | null = null;
let clientReady = false;
const listeners = new Set<() => void>();

function ensureClientSnapshot(): PartySnapshot {
  if (typeof window === "undefined") return serverSnapshot;
  if (clientSnapshot) return clientSnapshot;
  const saved = deserialize(sessionStorage.getItem(STORAGE_KEY));
  clientSnapshot = saved
    ? {
        ...defaultSnapshot(true),
        ...saved,
        joinCode: saved.joinCode || makeJoinCode(),
        lookingPosted: saved.lookingPosted === true,
        lobbyMeta: saved.lobbyMeta ?? defaultSnapshot(true).lobbyMeta,
        feedNonce: 0,
      }
    : defaultSnapshot(false);
  return clientSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  // Keep SSR markup until after mount to avoid join-code hydration mismatch.
  if (!clientReady) return serverSnapshot;
  return ensureClientSnapshot();
}

function getServerSnapshot() {
  return serverSnapshot;
}

function markClientReady() {
  if (clientReady) return;
  clientReady = true;
  ensureClientSnapshot();
  listeners.forEach((listener) => listener());
}

function writeSnapshot(next: PartySnapshot) {
  if (typeof window === "undefined") return;
  clientSnapshot = next;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function seatsToStored(seats: Seat[]): StoredSeat[] {
  return seats.map((seat) => {
    if (seat.kind === "you") return { kind: "you", name: YOU_NAME, role: tStored("party.hostRole") };
    if (seat.kind === "player") {
      return { kind: "player", name: seat.player.name, role: seat.player.role };
    }
    return { kind: "empty", name: "", role: "" };
  });
}

function sessionToSeats(session: JoinSession): Seat[] {
  const invited: Player[] = session.seats
    .filter((seat) => seat.kind === "player")
    .map((seat, index) => ({
      id: `remote-${session.code}-${index}`,
      name: seat.name,
      gameId: session.gameId,
      playStyles: [session.playStyle],
      skill: session.skill,
      hours: session.hours,
      lookingForSize: session.partySize,
      role: seat.role || tStored("party.inPartyRole"),
      mic: session.micRequired,
      online: true,
      bio: session.note,
      timezone: "МСК",
    }));
  return makeSeats(session.partySize, invited);
}

async function syncJoinToServer(snapshot: PartySnapshot) {
  if (!snapshot.gameId) return;
  try {
    await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: snapshot.joinCode,
        partyName: snapshot.partyName,
        gameId: snapshot.gameId,
        partySize: snapshot.seats.length,
        playStyle: snapshot.lobbyMeta.playStyle,
        skill: snapshot.lobbyMeta.skill,
        hours: snapshot.lobbyMeta.hours,
        seats: seatsToStored(snapshot.seats),
        filled: snapshot.seats.filter((seat) => seat.kind !== "empty").length,
        published: snapshot.published,
        note: snapshot.joinedParty?.note ?? "",
        micRequired: true,
        leader: YOU_NAME,
        ready: snapshot.ready,
      }),
    });
  } catch {
    // offline demo: local tray still works
  }
}

export function PartyProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const syncTimer = useRef<number | null>(null);

  useEffect(() => {
    markClientReady();
  }, []);

  const scheduleSync = useCallback((next: PartySnapshot) => {
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      void syncJoinToServer(next);
    }, 200);
  }, []);

  const commit = useCallback(
    (next: PartySnapshot) => {
      writeSnapshot(next);
      scheduleSync(next);
    },
    [scheduleSync],
  );

  const update = useCallback(
    (patch: Partial<PartySnapshot>) => {
      commit({ ...ensureClientSnapshot(), ...patch });
    },
    [commit],
  );

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

  const ensurePartyForGame = useCallback(
    (nextGameId: GameId, size: number) => {
      const current = ensureClientSnapshot();
      if (current.gameId !== nextGameId) {
        commit({
          ...current,
          joinCode: makeJoinCode(),
          partyName: tStored("party.defaultName", { name: YOU_NAME }),
          seats: makeSeats(size),
          joinedParty: null,
          ready: false,
          gameId: nextGameId,
          published: false,
          lookingPosted: false,
        });
        return;
      }
      if (current.seats.length !== size && !current.joinedParty) {
        commit({ ...current, seats: makeSeats(size), published: false });
      }
    },
    [commit],
  );

  const invite = useCallback(
    (player: Player) => {
      const current = ensureClientSnapshot();
      if (current.joinedParty) {
        toast.error(tStored("toast.alreadyInOther"));
        return;
      }
      if (isBlocked(personIdOf(player))) {
        toast.error(tStored("toast.blacklisted"));
        return;
      }
      if (current.seats.some((seat) => seat.kind === "player" && seat.player.id === player.id)) {
        return;
      }
      const emptyIndex = current.seats.findIndex((seat) => seat.kind === "empty");
      if (emptyIndex === -1) {
        toast.error(tStored("toast.partyFull"));
        return;
      }
      const seats = [...current.seats];
      seats[emptyIndex] = { kind: "player", player };
      rememberInvite(player);
      commit({ ...current, seats, feedNonce: current.feedNonce + 1 });
      toast.success(tStored("toast.invited", { name: player.name }), { duration: 1800 });
    },
    [commit],
  );

  const kick = useCallback(
    (playerId: string) => {
      const current = ensureClientSnapshot();
      commit({
        ...current,
        ready: false,
        seats: current.seats.map((seat) =>
          seat.kind === "player" && seat.player.id === playerId ? { kind: "empty" } : seat,
        ),
      });
    },
    [commit],
  );

  const joinParty = useCallback(
    (party: OpenParty) => {
      if (party.filled >= party.partySize) {
        toast.error(tStored("toast.full"));
        return;
      }
      const names =
        party.members && party.members.length > 0
          ? party.members.slice(0, Math.max(1, party.filled))
          : [
              party.leader,
              ...Array.from({ length: Math.max(0, party.filled - 1) }, (_, index) => tStored("party.memberN", { n: index + 2 })),
            ];
      const placeholders: Player[] = names.map((name, index) => ({
        id: `slot-${party.id}-${index}`,
        name,
        gameId: party.gameId,
        playStyles: [party.playStyle],
        skill: party.skill,
        hours: party.hours,
        lookingForSize: party.partySize,
        role: index === 0 ? tStored("party.leaderRole") : tStored("party.inPartyRole"),
        mic: party.micRequired,
        online: true,
        bio: party.note,
        timezone: "МСК",
        region: party.region,
        voicePlatform: party.voicePlatform,
      }));
      const current = ensureClientSnapshot();
      // Leave one empty seat for «you» — makeSeats always prepends the host seat.
      const others = placeholders.slice(0, Math.max(0, party.partySize - 1));
      commit({
        ...current,
        joinCode: party.id.toUpperCase(),
        partyName: party.name,
        seats: makeSeats(party.partySize, others),
        joinedParty: party,
        ready: false,
        gameId: party.gameId,
        published: false,
        lookingPosted: false,
        feedNonce: current.feedNonce + 1,
        lobbyMeta: {
          playStyle: party.playStyle,
          skill: party.skill,
          hours: party.hours,
        },
      });
      toast.success(tStored("toast.joined", { name: party.name }));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("teamly:open-tray"));
      }
    },
    [commit],
  );

  const leaveJoined = useCallback(() => {
    const current = ensureClientSnapshot();
    commit({
      ...current,
      joinCode: makeJoinCode(),
      partyName: tStored("party.defaultName", { name: YOU_NAME }),
      seats: makeSeats(current.seats.length),
      joinedParty: null,
      ready: false,
      published: false,
    });
    toast(tStored("toast.left"));
  }, [commit]);

  const loadJoinCode = useCallback(
    async (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return false;

      try {
        const response = await fetch(`/api/join/${normalized}`);
        if (response.ok) {
          const data = (await response.json()) as { session: JoinSession };
          const session = data.session;
          commit({
            ...ensureClientSnapshot(),
            joinCode: session.code,
            partyName: session.partyName,
            seats: sessionToSeats(session),
            joinedParty: null,
            ready: session.ready,
            gameId: session.gameId,
            published: session.published,
            lobbyMeta: {
              playStyle: session.playStyle,
              skill: session.skill,
              hours: session.hours,
            },
          });
          toast.success(tStored("toast.openedByCode", { code: session.code }));
          return true;
        }
        if (response.status === 404) {
          toast.error(tStored("toast.codeMissing"));
          return false;
        }
      } catch {
        toast.error(tStored("toast.codeLoadFail"));
        return false;
      }
      return false;
    },
    [commit],
  );

  const applyOpenParty = useCallback(
    (party: OpenParty) => {
      const current = ensureClientSnapshot();
      if (current.gameId !== party.gameId) {
        commit({ ...current, gameId: party.gameId });
      }
    },
    [commit],
  );

  const publishOpenParty = useCallback(async (options?: {
    note?: string;
    startsAt?: string | null;
  }) => {
    const current = ensureClientSnapshot();
    if (!current.gameId) {
      toast.error(tStored("toast.needLobby"));
      return null;
    }
    if (current.joinedParty) {
      toast.error(tStored("toast.inOtherLeave"));
      return null;
    }

    await syncJoinToServer(current);
    const profile = loadProfile();

    try {
      const response = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: current.joinCode,
          partyName: current.partyName,
          gameId: current.gameId,
          partySize: current.seats.length,
          playStyle: current.lobbyMeta.playStyle,
          skill: current.lobbyMeta.skill,
          hours: current.lobbyMeta.hours,
          seats: seatsToStored(current.seats),
          filled: current.seats.filter((seat) => seat.kind !== "empty").length,
          note: options?.note?.trim() || tStored("party.seekingNote", { name: current.partyName }),
          startsAt: options?.startsAt ?? null,
          region: profile.region,
          voicePlatform: profile.voicePlatform,
          language: profile.language,
        }),
      });
      const data = (await response.json()) as {
        party?: OpenParty;
        error?: string;
      };
      if (!response.ok || !data.party) {
        toast.error(data.error ?? tStored("toast.publishFail"));
        return null;
      }
      const after = ensureClientSnapshot();
      commit({
        ...after,
        published: true,
        feedNonce: after.feedNonce + 1,
      });
      toast.success(tStored("toast.publishOk"));
      return data.party;
    } catch {
      toast.error(tStored("toast.publishNetwork"));
      return null;
    }
  }, [commit]);

  const publishLooking = useCallback(
    async (options?: { bio?: string; role?: string }) => {
      const current = ensureClientSnapshot();
      if (!current.gameId) {
        toast.error(tStored("toast.needLobby"));
        return false;
      }
      const profile = loadProfile();
      const session = await getSession();
      try {
        const response = await fetch("/api/looking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: current.gameId,
            playStyle: current.lobbyMeta.playStyle,
            partySize: current.seats.length,
            skill: current.lobbyMeta.skill,
            hours: current.lobbyMeta.hours,
            accountId: session?.user?.id || profile.accountId || "you",
            name: profile.displayName || session?.user?.name || YOU_NAME,
            role: options?.role || tStored("party.lookingRole"),
            bio: options?.bio || tStored("party.lookingBio"),
            region: profile.region,
            voicePlatform: profile.voicePlatform,
            language: profile.language,
            steamProfileUrl: profile.steamProfileUrl || null,
            discordUrl: profile.discordUrl || null,
            riotTag: profile.riotTag || null,
            faceitUrl: profile.faceitUrl || null,
          }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          toast.error(data.error ?? tStored("toast.lookingFail"));
          return false;
        }
        const after = ensureClientSnapshot();
        commit({
          ...after,
          lookingPosted: true,
          feedNonce: after.feedNonce + 1,
        });
        toast.success(tStored("toast.lookingOk"));
        return true;
      } catch {
        toast.error(tStored("toast.lookingNetwork"));
        return false;
      }
    },
    [commit],
  );

  const copyReadyBrief = useCallback(async () => {
    const current = ensureClientSnapshot();
    await syncJoinToServer(current);
    const profile = loadProfile();
    const names = current.seats
      .map((seat) => {
        if (seat.kind === "you") return profile.displayName || YOU_NAME;
        if (seat.kind === "player") return seat.player.name;
        return null;
      })
      .filter((name): name is string => Boolean(name));
    const url = `${window.location.origin}/join/${current.joinCode}`;
    const lines = [
      tStored("brief.ready", { name: current.partyName }),
      names.join(", "),
      current.joinedParty?.startsAt
        ? tStored("brief.start", { when: current.joinedParty.startsAt })
        : null,
      profile.language
        ? tStored("brief.lang", { lang: languageLabel[profile.language] })
        : null,
      tStored("brief.link", { url }),
      profile.discordUrl ? `Discord: ${profile.discordUrl}` : null,
      profile.steamProfileUrl ? `Steam: ${profile.steamProfileUrl}` : null,
    ].filter(Boolean);
    const text = lines.join("\n");
    try {
      const mode = await shareOrCopy({
        title: current.partyName,
        text,
        url,
      });
      await navigator.clipboard.writeText(text).catch(() => undefined);
      try {
        const notify = await fetch("/api/discord-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            webhookUrl: profile.discordWebhookUrl.trim() || undefined,
            content: text,
          }),
        });
        if (notify.ok) {
          const data = (await notify.json()) as { via?: string };
          toast.success(
            data.via === "bot"
              ? tStored("toast.briefBot")
              : tStored("toast.briefDiscord"),
          );
        } else if (mode === "copied") {
          toast.success(tStored("toast.briefNoDiscord"));
        } else {
          toast.success(tStored("toast.briefCopied"));
        }
      } catch {
        if (mode === "copied") toast.success(tStored("toast.briefCopiedChat"));
        else toast.success(tStored("toast.briefReadyShare"));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(tStored("toast.briefFail"));
    }
  }, []);

  const copyShareLink = useCallback(async (prefer: "auto" | "share" | "copy" = "auto") => {
    const current = ensureClientSnapshot();
    await syncJoinToServer(current);
    const url = `${window.location.origin}/join/${current.joinCode}`;
    try {
      const mode = await shareOrCopy(
        {
          title: `Teamly · ${current.partyName}`,
          text: tStored("party.shareInvite"),
          url,
        },
        prefer,
      );
      if (mode === "copied") toast.success(tStored("toast.partyLinkCopied"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(tStored("toast.shareFail"));
    }
  }, []);

  const bumpFeed = useCallback(() => {
    const current = ensureClientSnapshot();
    writeSnapshot({ ...current, feedNonce: current.feedNonce + 1 });
  }, []);

  const value: PartyContextValue = {
    joinCode: snapshot.joinCode,
    partyName: snapshot.partyName,
    seats: snapshot.seats,
    joinedParty: snapshot.joinedParty,
    ready: snapshot.ready,
    gameId: snapshot.gameId,
    published: snapshot.published,
    feedNonce: snapshot.feedNonce,
    filledCount,
    invitedIds,
    partyFull,
    setPartyName: (name) => update({ partyName: name }),
    setLobbyMeta: (meta) => {
      const current = ensureClientSnapshot();
      const same =
        current.lobbyMeta.playStyle === meta.playStyle &&
        current.lobbyMeta.skill === meta.skill &&
        current.lobbyMeta.hours.join(",") === meta.hours.join(",");
      if (same) return;
      update({ lobbyMeta: meta });
    },
    ensurePartyForGame,
    invite,
    kick,
    joinParty,
    leaveJoined,
    setReady: (ready) => update({ ready }),
    loadJoinCode,
    applyOpenParty,
    publishOpenParty,
    publishLooking,
    lookingPosted: snapshot.lookingPosted === true,
    copyReadyBrief,
    shareUrl:
      typeof window !== "undefined"
        ? `${window.location.origin}/join/${snapshot.joinCode}`
        : `/join/${snapshot.joinCode}`,
    copyShareLink,
    bumpFeed,
  };

  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error("useParty must be used within PartyProvider");
  return ctx;
}

export function useJoinCodeBootstrap(code: string) {
  const party = useParty();
  const asked = useRef<string | null>(null);
  useEffect(() => {
    if (asked.current === code.toUpperCase()) return;
    asked.current = code.toUpperCase();
    const timer = window.setTimeout(() => {
      void party.loadJoinCode(code);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code, party]);
  return party;
}
