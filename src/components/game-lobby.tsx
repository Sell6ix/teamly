"use client";

import { CoverImage } from "@/components/cover-image";
import { PartyTray } from "@/components/party-tray";
import { useParty } from "@/components/party-context";
import { ProfileLinks } from "@/components/profile-links";
import { SiteChrome } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { catalogGames } from "@/lib/catalog";
import {
  playStylesFor,
  roleFacetFor,
  roleOptionLabel,
  skillLabelFor,
} from "@/lib/game-fields";
import {
  filtersToCriteria,
  lobbyHref,
  parseLobbySearchParams,
  type LobbyFilters,
} from "@/lib/lobby-url";
import { shareOrCopy } from "@/lib/share";
import {
  formatHours,
  hourLabel,
  partySizeLabel,
  playStyleLabel,
} from "@/lib/labels";
import {
  regionLabel,
  REGIONS,
  voiceLabel,
  VOICE_PLATFORMS,
} from "@/lib/profile";
import { otherGamesFor, recentForGame, recentPersonIds } from "@/lib/recent";
import { games } from "@/lib/data";
import type {
  Game,
  HourWindow,
  MatchResult,
  OpenParty,
  Region,
  SkillLevel,
  VoicePlatform,
} from "@/lib/types";
import {
  AlertCircle,
  Clock,
  Link2,
  Mic,
  MicOff,
  Share2,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const hours: HourWindow[] = ["morning", "day", "evening", "night"];

type FeedState = {
  key: string;
  loading: boolean;
  error: string | null;
  result: MatchResult | null;
};

function criteriaKey(filters: LobbyFilters, gameId: string, feedNonce: number) {
  return JSON.stringify({ filters, gameId, feedNonce });
}

export function GameLobby({
  game,
  pathStyle = null,
}: {
  game: Game;
  pathStyle?: string | null;
}) {
  const party = useParty();
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncedRef = useRef<string>("");

  const catalog = useMemo(
    () => catalogGames().find((item) => item.id === game.id),
    [game.id],
  );
  const playStyles = useMemo(() => playStylesFor(game.id), [game.id]);
  const roleFacet = useMemo(() => roleFacetFor(game.id), [game.id]);

  const filters = useMemo(
    () =>
      parseLobbySearchParams(
        game,
        new URLSearchParams(searchParams.toString()),
        pathStyle,
      ),
    [game, searchParams, pathStyle],
  );
  const [tab, setTab] = useState("parties");
  const [extraOpen, setExtraOpen] = useState(0);
  const [moreFilters, setMoreFilters] = useState(false);
  const [feed, setFeed] = useState<FeedState>({
    key: "",
    loading: true,
    error: null,
    result: null,
  });

  function applyFilters(next: LobbyFilters) {
    router.replace(lobbyHref(game.id, next, game), { scroll: false });
  }

  const criteria = useMemo(
    () => ({
      ...filtersToCriteria(game.id, filters),
      recentPersonIds: recentPersonIds(),
    }),
    [game.id, filters, party.feedNonce],
  );
  const recentPlayers = useMemo(
    () => recentForGame(game.id),
    [game.id, party.feedNonce],
  );
  const key = criteriaKey(filters, game.id, party.feedNonce);
  const loading = feed.loading || feed.key !== key;

  const setLobbyMeta = party.setLobbyMeta;
  useEffect(() => {
    setLobbyMeta({
      playStyle: filters.playStyle,
      skill: filters.skill,
      hours: filters.hours,
    });
  }, [filters.playStyle, filters.skill, filters.hours, setLobbyMeta]);

  useEffect(() => {
    const syncKey = `${game.id}:${filters.partySize}`;
    if (syncedRef.current === syncKey) return;
    const timer = window.setTimeout(() => {
      party.ensurePartyForGame(game.id, filters.partySize);
      syncedRef.current = syncKey;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [game.id, filters.partySize, party]);

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
    const url = `${window.location.origin}${lobbyHref(game.id, filters, game)}`;
    try {
      const mode = await shareOrCopy({
        title: `Teamly · ${game.name}`,
        text: `Кто сейчас ищет в ${game.name}`,
        url,
      });
      if (mode === "copied") toast.success("Ссылка на лобби скопирована");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Не удалось поделиться ссылкой");
    }
  }

  function toggleHour(hour: HourWindow) {
    const current = filters.hours;
    let nextHours: HourWindow[];
    if (current.includes(hour)) {
      if (current.length === 1) return;
      nextHours = current.filter((item) => item !== hour);
    } else {
      nextHours = [...current, hour];
    }
    applyFilters({ ...filters, hours: nextHours });
  }

  const result = feed.key === key ? feed.result : null;
  const error = feed.key === key ? feed.error : null;
  const openCount = (catalog?.openParties ?? 0) + extraOpen;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/parties?counts=1")
      .then((res) => res.json())
      .then((data: { counts?: Record<string, number> }) => {
        if (cancelled) return;
        setExtraOpen(data.counts?.[game.id] ?? 0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [game.id, party.feedNonce]);

  return (
    <SiteChrome subtle>
      <div
        className="relative isolate overflow-hidden border-b border-white/8"
        style={{ ["--game-accent" as string]: game.accent }}
      >
        <div className="absolute inset-0">
          <CoverImage
            gameId={game.id}
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
                {catalog?.looking ?? 0} ищут · {openCount} открытых сборов ·{" "}
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
                  active={filters.playStyle === style}
                  onClick={() => applyFilters({ ...filters, playStyle: style })}
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
                  active={filters.partySize === size}
                  onClick={() => applyFilters({ ...filters, partySize: size })}
                  testId={`size-${size}`}
                >
                  {partySizeLabel[size] ?? `${size}`}
                </Chip>
              ))}
            </ChipRow>

            {roleFacet ? (
              <ChipRow label={roleFacet.label}>
                <Chip
                  active={filters.roleTag === null}
                  onClick={() => applyFilters({ ...filters, roleTag: null })}
                  testId="role-any"
                >
                  Любая
                </Chip>
                {roleFacet.options.map((option) => (
                  <Chip
                    key={option.id}
                    active={filters.roleTag === option.id}
                    onClick={() => applyFilters({ ...filters, roleTag: option.id })}
                    testId={`role-${option.id}`}
                  >
                    {option.label}
                  </Chip>
                ))}
              </ChipRow>
            ) : null}

            <div className={moreFilters ? "space-y-3" : "hidden sm:block sm:space-y-3"}>
              <ChipRow label="Уровень">
                {([1, 2, 3, 4, 5] as SkillLevel[]).map((level) => (
                  <Chip
                    key={level}
                    active={filters.skill === level}
                    onClick={() => applyFilters({ ...filters, skill: level })}
                    testId={`skill-${level}`}
                  >
                    {skillLabelFor(game.id, level)}
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label="Когда">
                {hours.map((hour) => (
                  <Chip
                    key={hour}
                    active={filters.hours.includes(hour)}
                    onClick={() => toggleHour(hour)}
                    testId={`hour-${hour}`}
                  >
                    {hourLabel[hour]}
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label="Регион">
                <Chip
                  active={filters.region === null}
                  onClick={() => applyFilters({ ...filters, region: null })}
                  testId="region-any"
                >
                  Любой
                </Chip>
                {REGIONS.map((region) => (
                  <Chip
                    key={region}
                    active={filters.region === region}
                    onClick={() =>
                      applyFilters({ ...filters, region: region as Region })
                    }
                    testId={`region-${region}`}
                  >
                    {regionLabel[region]}
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label="Голос">
                <Chip
                  active={filters.voicePlatform === null}
                  onClick={() => applyFilters({ ...filters, voicePlatform: null })}
                  testId="voice-any-filter"
                >
                  Не важно
                </Chip>
                {VOICE_PLATFORMS.map((voice) => (
                  <Chip
                    key={voice}
                    active={filters.voicePlatform === voice}
                    onClick={() =>
                      applyFilters({
                        ...filters,
                        voicePlatform: voice as VoicePlatform,
                      })
                    }
                    testId={`voice-${voice}`}
                  >
                    {voiceLabel[voice]}
                  </Chip>
                ))}
              </ChipRow>
            </div>

            <button
              type="button"
              data-testid="more-filters"
              onClick={() => setMoreFilters((value) => !value)}
              className="text-xs text-white/55 underline-offset-2 hover:text-white/80 hover:underline sm:hidden"
            >
              {moreFilters
                ? "Скрыть фильтры"
                : `Ещё · ${skillLabelFor(game.id, filters.skill)} · ${filters.hours.map((h) => hourLabel[h]).join(", ")}${
                    filters.roleTag
                      ? ` · ${roleOptionLabel(game.id, filters.roleTag) ?? ""}`
                      : ""
                  }`}
            </button>
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
                onRelax={() =>
                  applyFilters({
                    ...filters,
                    playStyle: playStyles.includes("casual") ? "casual" : playStyles[0],
                    hours: ["evening", "night"],
                    roleTag: null,
                    region: null,
                    voicePlatform: null,
                  })
                }
                onPublish={() => void party.publishOpenParty()}
                onLooking={() => void party.publishLooking()}
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
                      Открытых сборов нет. Нажмите «Открыть сбор» в трее пати.
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
                  {recentPlayers.length > 0 ? (
                    <div
                      className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand)]/8 p-3"
                      data-testid="recent-played"
                    >
                      <p className="mb-2 text-[11px] uppercase tracking-wide text-[var(--brand)]">
                        Недавно играли
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recentPlayers.map((player) => (
                          <button
                            key={player.id}
                            type="button"
                            disabled={
                              party.partyFull ||
                              Boolean(party.joinedParty) ||
                              party.invitedIds.has(player.id)
                            }
                            onClick={() => party.invite(player)}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-left text-sm text-white/85 hover:border-white/25 disabled:opacity-50"
                          >
                            <span className="font-medium">{player.name}</span>
                            <span className="ml-2 text-[11px] text-white/40">
                              {player.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
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

function EmptyLobby({
  onRelax,
  onPublish,
  onLooking,
}: {
  onRelax: () => void;
  onPublish: () => void;
  onLooking: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6">
      <p className="font-display text-xl text-white">Сейчас тихо</p>
      <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">
        Под эти чипы пока пусто. Выставьте себя в ленту, откройте сбор или ослабьте фильтры.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" data-testid="empty-looking" onClick={onLooking}>
          Я ищу
        </Button>
        <Button type="button" data-testid="empty-publish" onClick={onPublish}>
          Открыть сбор
        </Button>
        <Button type="button" variant="outline" onClick={onRelax}>
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
  const isYou = row.player.id.startsWith("you-");
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
            <ProfileLinks
              steamProfileUrl={player.steamProfileUrl}
              discordUrl={player.discordUrl}
              riotTag={player.riotTag}
              faceitUrl={player.faceitUrl}
              compact
            />
          </h3>
          <p className="mt-1 text-sm text-white/50">
            {player.role} · {skillLabelFor(player.gameId, player.skill)}
            {player.region ? ` · ${regionLabel[player.region]}` : ""}
          </p>
          {otherGamesFor(player).length > 0 ? (
            <p className="mt-1 text-[11px] text-white/40">
              Ещё играет:{" "}
              {otherGamesFor(player)
                .map((id) => games.find((item) => item.id === id)?.name ?? id)
                .join(", ")}
            </p>
          ) : null}
        </div>
        {isYou ? (
          <span className="rounded-md bg-[var(--brand)]/15 px-2 py-1 text-xs text-[var(--brand)]">
            это вы
          </span>
        ) : (
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
        )}
      </div>
      <p className="mt-3 text-sm text-white/60">{reasons[0]}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-white/40">
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
        {player.voicePlatform ? (
          <span>{voiceLabel[player.voicePlatform]}</span>
        ) : null}
        <span className="ml-auto text-white/30" title="Сортировка по совпадению">
          {score}%
        </span>
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
  const { party, reasons } = row;
  const open = party.partySize - party.filled;

  async function copyPartyLink() {
    const url = `${window.location.origin}/party/${party.id}`;
    try {
      const mode = await shareOrCopy({
        title: `Teamly · ${party.name}`,
        text: party.note,
        url,
      });
      if (mode === "copied") toast.success("Ссылка на сбор скопирована");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Не удалось поделиться");
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/16">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-white">{party.name}</h3>
          <p className="mt-1 text-sm text-white/50">
            {party.leader} · {playStyleLabel[party.playStyle]} ·{" "}
            {skillLabelFor(party.gameId, party.skill)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--game-accent,var(--brand))]/15 px-2 py-1 text-xs text-white/90">
          <Users className="size-3" />
          свободно {open}
        </span>
      </div>
      {party.startsAt ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--brand)]">
          <Clock className="size-3.5" />
          {party.startsAt}
        </p>
      ) : null}
      <p className="mt-3 text-sm text-white/65">{party.note}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/40">
        <span>
          {party.filled}/{party.partySize}
        </span>
        <span>{reasons[0]}</span>
        {party.region ? <span>{regionLabel[party.region]}</span> : null}
        {party.voicePlatform ? <span>{voiceLabel[party.voicePlatform]}</span> : null}
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
  const ctx = useParty();
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void ctx.loadJoinCode(code).then((ok) => {
        if (!cancelled) setStatus(ok ? "ok" : "missing");
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // intentionally once per code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

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
          <p className="mt-3 text-sm text-white/60" data-testid="join-status">
            {status === "loading"
              ? "Загружаем пати по коду…"
              : status === "missing"
                ? "Пати с таким кодом не найдена. Попросите хоста открыть сбор или обновить ссылку."
                : `Вы в контексте пати «${ctx.partyName}». Слоты: ${ctx.filledCount}/${ctx.seats.length}.`}
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
