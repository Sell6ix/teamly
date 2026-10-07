"use client";

import { PartyTray } from "@/components/party-tray";
import { useJoinCodeBootstrap, useParty } from "@/components/party-context";
import { SiteChrome } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { catalogGames } from "@/lib/catalog";
import {
  formatHours,
  hourLabel,
  partySizeLabel,
  playStyleLabel,
  skillLabel,
} from "@/lib/labels";
import type {
  Game,
  HourWindow,
  MatchCriteria,
  MatchResult,
  OpenParty,
  PlayStyle,
  SkillLevel,
} from "@/lib/types";
import {
  AlertCircle,
  Link2,
  Mic,
  MicOff,
  Share2,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const playStyles: PlayStyle[] = ["casual", "ranked", "learning", "voice", "speedrun"];
const hours: HourWindow[] = ["morning", "day", "evening", "night"];

type FeedState = {
  key: string;
  loading: boolean;
  error: string | null;
  result: MatchResult | null;
};

function criteriaKey(criteria: MatchCriteria) {
  return JSON.stringify(criteria);
}

export function GameLobby({ game }: { game: Game }) {
  const party = useParty();
  const syncedRef = useRef<string>("");
  const catalog = useMemo(
    () => catalogGames().find((item) => item.id === game.id),
    [game.id],
  );

  const [playStyle, setPlayStyle] = useState<PlayStyle>("ranked");
  const [partySize, setPartySize] = useState(game.partySizes.includes(5) ? 5 : game.partySizes[0]);
  const [skill, setSkill] = useState<SkillLevel>(4);
  const [selectedHours, setSelectedHours] = useState<HourWindow[]>(["evening"]);
  const [tab, setTab] = useState("parties");
  const [feed, setFeed] = useState<FeedState>({
    key: "",
    loading: true,
    error: null,
    result: null,
  });

  const criteria: MatchCriteria = useMemo(
    () => ({
      gameId: game.id,
      playStyle,
      partySize,
      skill,
      hours: selectedHours.length ? selectedHours : ["evening"],
    }),
    [game.id, playStyle, partySize, skill, selectedHours],
  );
  const key = criteriaKey(criteria);
  const loading = feed.loading || feed.key !== key;

  useEffect(() => {
    const syncKey = `${game.id}:${partySize}`;
    if (syncedRef.current === syncKey) return;
    const timer = window.setTimeout(() => {
      party.ensurePartyForGame(game.id, partySize);
      syncedRef.current = syncKey;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [game.id, partySize, party]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(criteria),
          });
          const data = (await response.json()) as MatchResult & { error?: string };
          if (cancelled) return;
          if (!response.ok) {
            setFeed({
              key,
              loading: false,
              error: data.error ?? "Не получилось обновить ленту.",
              result: null,
            });
            return;
          }
          setFeed({ key, loading: false, error: null, result: data });
          if (data.parties.length === 0 && data.players.length > 0) setTab("players");
          else setTab("parties");
        } catch {
          if (!cancelled) {
            setFeed({
              key,
              loading: false,
              error: "Сеть недоступна. Проверьте соединение.",
              result: null,
            });
          }
        }
      })();
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [criteria, key]);

  async function shareLobby() {
    const url = `${window.location.origin}/g/${game.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка на лобби скопирована");
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  }

  function toggleHour(hour: HourWindow) {
    setSelectedHours((current) => {
      if (current.includes(hour)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== hour);
      }
      return [...current, hour];
    });
  }

  const result = feed.key === key ? feed.result : null;
  const error = feed.key === key ? feed.error : null;

  return (
    <SiteChrome subtle>
      <div
        className="relative isolate overflow-hidden border-b border-white/8"
        style={{ ["--game-accent" as string]: game.accent }}
      >
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/covers/${game.id}.svg`}
            alt=""
            className="h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0d] via-[#0b0b0d]/85 to-[#0b0b0d]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-[#0b0b0d]/30" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 sm:py-14">
          <Link href="/" className="text-xs text-white/50 transition hover:text-white/80">
            ← Каталог игр
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="animate-fade-up">
              <p className="font-display text-4xl tracking-tight text-white sm:text-5xl md:text-6xl">
                {game.name}
              </p>
              <p className="mt-3 text-sm text-white/65 sm:text-base">
                {catalog?.looking ?? 0} ищут · {catalog?.openParties ?? 0} открытых сборов ·{" "}
                {catalog?.onlineNow ?? 0} онлайн
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => void shareLobby()}
              className="border-white/15 bg-black/30 backdrop-blur"
              data-testid="share-lobby"
            >
              <Share2 data-icon="inline-start" />
              Поделиться
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:flex-row lg:items-start lg:pb-10">
        <section className="min-w-0 flex-1 space-y-5">
          <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b border-white/6 bg-[#0b0b0d]/90 px-4 py-3 backdrop-blur-xl sm:-mx-0 sm:rounded-2xl sm:border sm:border-white/8 sm:px-4">
            <ChipRow label="Стиль">
              {playStyles.map((style) => (
                <Chip
                  key={style}
                  active={playStyle === style}
                  onClick={() => setPlayStyle(style)}
                  testId={`style-${style}`}
                >
                  {playStyleLabel[style]}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="Формат">
              {game.partySizes.map((size) => (
                <Chip
                  key={size}
                  active={partySize === size}
                  onClick={() => setPartySize(size)}
                  testId={`size-${size}`}
                >
                  {partySizeLabel[size] ?? `${size}`}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="Уровень">
              {([1, 2, 3, 4, 5] as SkillLevel[]).map((level) => (
                <Chip
                  key={level}
                  active={skill === level}
                  onClick={() => setSkill(level)}
                  testId={`skill-${level}`}
                >
                  {skillLabel[level]}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="Когда">
              {hours.map((hour) => (
                <Chip
                  key={hour}
                  active={selectedHours.includes(hour)}
                  onClick={() => toggleHour(hour)}
                  testId={`hour-${hour}`}
                >
                  {hourLabel[hour]}
                </Chip>
              ))}
            </ChipRow>
          </div>

          {loading ? <LoadingState /> : null}

          {error ? (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
              <p className="flex items-center gap-2 font-medium text-red-100">
                <AlertCircle className="size-4" />
                Лента недоступна
              </p>
              <p className="mt-1 text-sm text-red-100/70">{error}</p>
            </div>
          ) : null}

          {!loading && !error && result ? (
            result.players.length === 0 && result.parties.length === 0 ? (
              <EmptyLobby
                onRelax={() => {
                  setPlayStyle("casual");
                  setSelectedHours(["evening", "night"]);
                }}
              />
            ) : (
              <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="parties" data-testid="tab-parties">
                    Сборы
                    <Badge variant="secondary">{result.parties.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="players" data-testid="tab-players">
                    Игроки
                    <Badge variant="secondary">{result.players.length}</Badge>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="parties" className="mt-4 space-y-3">
                  {result.parties.length === 0 ? (
                    <p className="text-sm text-white/50">
                      Открытых сборов нет. Соберите пати из игроков или создайте свой.
                    </p>
                  ) : (
                    result.parties.map((row) => (
                      <PartyCard
                        key={row.party.id}
                        row={row}
                        joined={party.joinedParty?.id === row.party.id}
                        onJoin={() => party.joinParty(row.party)}
                      />
                    ))
                  )}
                </TabsContent>
                <TabsContent value="players" className="mt-4 space-y-3">
                  {result.players.length === 0 ? (
                    <p className="text-sm text-white/50">
                      Соло-игроков нет — посмотрите вкладку сборов.
                    </p>
                  ) : (
                    result.players.map((row) => (
                      <PlayerCard
                        key={row.player.id}
                        row={row}
                        invited={party.invitedIds.has(row.player.id)}
                        disabled={party.partyFull || Boolean(party.joinedParty)}
                        onInvite={() => party.invite(row.player)}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )
          ) : null}
        </section>

        <PartyTray />
      </main>
    </SiteChrome>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-16 shrink-0 text-[11px] uppercase tracking-wider text-white/35">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs transition ${
        active
          ? "bg-[var(--game-accent,var(--brand))] text-[#140a08] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <p className="text-sm text-white/50">Обновляем ленту по фильтрам…</p>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-56" />
        </div>
      ))}
    </div>
  );
}

function EmptyLobby({ onRelax }: { onRelax: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6">
      <p className="font-display text-xl text-white">Сейчас тихо</p>
      <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">
        Под эти чипы никто не ищет. Создайте свой сбор и киньте ссылку друзьям — или ослабьте фильтры.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={onRelax}>
          Ослабить фильтры
        </Button>
      </div>
    </div>
  );
}

function PlayerCard({
  row,
  invited,
  disabled,
  onInvite,
}: {
  row: MatchResult["players"][number];
  invited: boolean;
  disabled: boolean;
  onInvite: () => void;
}) {
  const { player, score, reasons } = row;
  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/16">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-base font-medium text-white">
            {player.name}
            {player.online ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-200">
                <Wifi className="size-3" />
                Онлайн
              </span>
            ) : (
              <span className="text-[11px] text-white/40">Офлайн</span>
            )}
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-white/45">
              {score}%
            </span>
          </h3>
          <p className="mt-1 text-sm text-white/50">
            {player.role} · {skillLabel[player.skill]}
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          data-testid="invite-button"
          disabled={disabled || invited}
          onClick={onInvite}
        >
          <UserPlus data-icon="inline-start" />
          {invited ? "В пати" : "Пригласить"}
        </Button>
      </div>
      <p className="mt-3 text-sm text-white/60">{reasons[0]}</p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-white/40">
        <span>{formatHours(player.hours)}</span>
        {player.mic ? (
          <span className="inline-flex items-center gap-1">
            <Mic className="size-3" /> микро
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <MicOff className="size-3" /> без микро
          </span>
        )}
      </div>
    </article>
  );
}

function PartyCard({
  row,
  joined,
  onJoin,
}: {
  row: MatchResult["parties"][number];
  joined: boolean;
  onJoin: () => void;
}) {
  const { party, score, reasons } = row;
  const open = party.partySize - party.filled;

  async function copyPartyLink() {
    const url = `${window.location.origin}/party/${party.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка на сбор скопирована");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/16">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-white">{party.name}</h3>
          <p className="mt-1 text-sm text-white/50">
            {party.leader} · {playStyleLabel[party.playStyle]} · {skillLabel[party.skill]}
          </p>
        </div>
        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-white/45">
          {score}%
        </span>
      </div>
      <p className="mt-3 text-sm text-white/65">{party.note}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--game-accent,var(--brand))]/15 px-2 py-1 text-xs text-white/85">
          <Users className="size-3" />
          {party.filled}/{party.partySize}, свободно {open}
        </span>
        <span className="text-xs text-white/40">{reasons[0]}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="lg" data-testid="join-party" disabled={joined} onClick={onJoin}>
          {joined ? "Вы уже внутри" : "Вступить"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => void copyPartyLink()}
          className="border-white/12"
          data-testid="copy-open-party-link"
        >
          <Link2 data-icon="inline-start" />
          Ссылка
        </Button>
      </div>
    </article>
  );
}

export function PartyDeepLink({ party }: { party: OpenParty }) {
  const ctx = useParty();

  useEffect(() => {
    const timer = window.setTimeout(() => ctx.applyOpenParty(party), 0);
    return () => window.clearTimeout(timer);
  }, [ctx, party]);

  return (
    <SiteChrome>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <Link href={`/g/${party.gameId}`} className="text-xs text-white/50 hover:text-white/80">
          ← К лобби
        </Link>
        <div className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Открытый сбор</p>
          <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">{party.name}</h1>
          <p className="mt-3 text-sm text-white/60">
            {party.leader} · {playStyleLabel[party.playStyle]} · свободно{" "}
            {party.partySize - party.filled} из {party.partySize}
          </p>
          <p className="mt-4 text-sm leading-6 text-white/70">{party.note}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              size="lg"
              data-testid="deep-join-party"
              disabled={ctx.joinedParty?.id === party.id}
              onClick={() => ctx.joinParty(party)}
            >
              Залетать в сбор
            </Button>
            <Link
              href={`/g/${party.gameId}`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white transition hover:bg-white/10"
            >
              Открыть лобби
            </Link>
          </div>
        </div>
        <PartyTray />
      </main>
    </SiteChrome>
  );
}

export function JoinDeepLink({ code }: { code: string }) {
  const ctx = useJoinCodeBootstrap(code);

  return (
    <SiteChrome>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <Link href="/" className="text-xs text-white/50 hover:text-white/80">
          ← Каталог
        </Link>
        <div className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Приглашение в пати</p>
          <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">
            Код {code.toUpperCase()}
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Вы в контексте пати «{ctx.partyName}». Слоты: {ctx.filledCount}/{ctx.seats.length}.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={ctx.gameId ? `/g/${ctx.gameId}` : "/g/valorant"}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
            >
              Перейти в лобби
            </Link>
            <Button
              type="button"
              size="lg"
              variant="outline"
              data-testid="copy-party-link-join"
              onClick={() => void ctx.copyShareLink()}
            >
              Скопировать ссылку на пати
            </Button>
          </div>
        </div>
        <PartyTray />
      </main>
    </SiteChrome>
  );
}
