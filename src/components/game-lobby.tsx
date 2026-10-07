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
import { localizeParty } from "@/lib/demo-locale";
import { useLocale, useT } from "@/lib/i18n/context";
import {
  defaultLobbyFilters,
  filtersToCriteria,
  lobbyHref,
  parseLobbySearchParams,
  type LobbyFilters,
} from "@/lib/lobby-url";
import { shareOrCopy } from "@/lib/share";
import {
  LANGUAGES,
  REGIONS,
  VOICE_PLATFORMS,
} from "@/lib/profile";
import { loadAccount } from "@/lib/account";
import { blockPerson, blockedPersonIds } from "@/lib/blacklist";
import { games } from "@/lib/data";
import { otherGamesFor, personIdOf, recentForGame, recentPersonIds } from "@/lib/recent";
import type {
  Game,
  HourWindow,
  Language,
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
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncedRef = useRef<string>("");

  const catalog = useMemo(
    () => catalogGames().find((item) => item.id === game.id),
    [game.id],
  );
  const playStyles = useMemo(() => playStylesFor(game.id), [game.id]);
  const roleFacet = useMemo(() => roleFacetFor(game.id, locale), [game.id, locale]);

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
  const tabTouchedRef = useRef(false);
  const [extraOpen, setExtraOpen] = useState(0);
  const [moreFilters, setMoreFilters] = useState(false);
  const [feed, setFeed] = useState<FeedState>({
    key: "",
    loading: true,
    error: null,
    result: null,
  });

  useEffect(() => {
    tabTouchedRef.current = false;
    setTab("parties");
  }, [game.id]);

  function applyFilters(next: LobbyFilters) {
    router.replace(lobbyHref(game.id, next, game), { scroll: false });
  }

  const defaults = useMemo(() => defaultLobbyFilters(game), [game]);
  const filtersDirty =
    filters.playStyle !== defaults.playStyle ||
    filters.partySize !== defaults.partySize ||
    filters.skill !== defaults.skill ||
    filters.hours.join() !== defaults.hours.join() ||
    filters.roleTag !== defaults.roleTag ||
    filters.region !== defaults.region ||
    filters.voicePlatform !== defaults.voicePlatform ||
    filters.language !== defaults.language;

  function clearFilters() {
    applyFilters({ ...defaults });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!filtersDirty) return;
      event.preventDefault();
      clearFilters();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // clearFilters closes over latest filters via applyFilters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersDirty]);

  const criteria = useMemo(
    () => ({
      ...filtersToCriteria(game.id, filters),
      locale,
      recentPersonIds: recentPersonIds(),
      blockedPersonIds: blockedPersonIds(),
    }),
    [game.id, filters, locale, party.feedNonce],
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
              error: data.error ?? t("lobby.feedErrorFallback"),
              result: null,
            });
            return;
          }
          setFeed({ key, loading: false, error: null, result: data });
          // Don't yank the user off «Игроки» on every match refresh (e.g. after «Я ищу»).
          if (!tabTouchedRef.current) {
            setTab(
              data.parties.length === 0 && data.players.length > 0
                ? "players"
                : "parties",
            );
          }
        } catch {
          if (!cancelled) {
            setFeed({
              key,
              loading: false,
              error: t("lobby.networkError"),
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
  }, [criteria, key, t]);

  async function shareLobby() {
    const url = `${window.location.origin}${lobbyHref(game.id, filters, game)}`;
    try {
      const mode = await shareOrCopy({
        title: `Teamly · ${game.name}`,
        text: t("lobby.shareText", { game: game.name }),
        url,
      });
      if (mode === "copied") toast.success(t("toast.lobbyLinkCopied"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(t("toast.shareFail"));
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
      {/* Lobby is a dark game surface in both themes so white chip text stays readable. */}
      <div className="dark flex min-h-0 flex-1 flex-col bg-[#0b0b0d] text-foreground">
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
            {t("lobby.back")}
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="animate-fade-up">
              <p className="font-display text-4xl tracking-tight text-white sm:text-5xl md:text-6xl">
                {game.name}
              </p>
              <p className="mt-3 text-sm text-white/65 sm:text-base">
                {t("lobby.lookingOpenOnline", {
                  looking: catalog?.looking ?? 0,
                  parties: openCount,
                  online: catalog?.onlineNow ?? 0,
                })}
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
              {t("lobby.share")}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-36 sm:px-6 lg:flex-row lg:items-start lg:pb-10">
        <section className="min-w-0 flex-1 space-y-5">
          <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b border-white/6 bg-[#0b0b0d]/90 px-4 py-3 backdrop-blur-xl sm:-mx-0 sm:rounded-2xl sm:border sm:border-white/8 sm:px-4">
            <ChipRow label={t("lobby.filterStyle")}>
              {playStyles.map((style) => (
                <Chip
                  key={style}
                  active={filters.playStyle === style}
                  onClick={() => applyFilters({ ...filters, playStyle: style })}
                  testId={`style-${style}`}
                >
                  {t(`style.${style}`)}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label={t("lobby.filterSize")}>
              {game.partySizes.map((size) => (
                <Chip
                  key={size}
                  active={filters.partySize === size}
                  onClick={() => applyFilters({ ...filters, partySize: size })}
                  testId={`size-${size}`}
                >
                  {t(`size.${size}`)}
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
                  {t("lobby.anyRole")}
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
              <ChipRow label={t("lobby.filterSkill")}>
                {([1, 2, 3, 4, 5] as SkillLevel[]).map((level) => (
                  <Chip
                    key={level}
                    active={filters.skill === level}
                    onClick={() => applyFilters({ ...filters, skill: level })}
                    testId={`skill-${level}`}
                  >
                    {skillLabelFor(game.id, level, locale)}
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label={t("lobby.filterHours")}>
                {hours.map((hour) => (
                  <Chip
                    key={hour}
                    active={filters.hours.includes(hour)}
                    onClick={() => toggleHour(hour)}
                    testId={`hour-${hour}`}
                  >
                    {t(`hour.${hour}`)}
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label={t("lobby.filterRegion")}>
                <Chip
                  active={filters.region === null}
                  onClick={() => applyFilters({ ...filters, region: null })}
                  testId="region-any"
                >
                  {t("lobby.any")}
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
                    {t(`region.${region}`)}
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label={t("lobby.filterVoice")}>
                <Chip
                  active={filters.voicePlatform === null}
                  onClick={() => applyFilters({ ...filters, voicePlatform: null })}
                  testId="voice-any-filter"
                >
                  {t("lobby.voiceDoesntMatter")}
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
                    {t(`voice.${voice}`)}
                  </Chip>
                ))}
              </ChipRow>
              <ChipRow label={t("lobby.filterLanguage")}>
                <Chip
                  active={filters.language === null}
                  onClick={() => applyFilters({ ...filters, language: null })}
                  testId="lang-any"
                >
                  {t("lobby.any")}
                </Chip>
                {LANGUAGES.map((lang) => (
                  <Chip
                    key={lang}
                    active={filters.language === lang}
                    onClick={() =>
                      applyFilters({ ...filters, language: lang as Language })
                    }
                    testId={`lang-${lang}`}
                  >
                    {t(`lang.${lang}`)}
                  </Chip>
                ))}
              </ChipRow>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="more-filters"
                onClick={() => setMoreFilters((value) => !value)}
                className="text-xs text-white/55 underline-offset-2 hover:text-white/80 hover:underline sm:hidden"
              >
                {moreFilters
                  ? t("lobby.hideFilters")
                  : t("lobby.moreSummary", {
                      summary: [
                        skillLabelFor(game.id, filters.skill, locale),
                        filters.hours.map((h) => t(`hour.${h}`)).join(", "),
                        filters.roleTag
                          ? roleOptionLabel(game.id, filters.roleTag, locale) ?? ""
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" · "),
                    })}
              </button>
              {filtersDirty ? (
                <button
                  type="button"
                  data-testid="clear-filters"
                  title="Esc"
                  onClick={clearFilters}
                  className="text-xs text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
                >
                  {t("lobby.clearFilters")}
                  <kbd className="ml-1.5 hidden rounded border border-white/15 px-1 py-0.5 font-mono text-[10px] text-white/35 sm:inline">
                    Esc
                  </kbd>
                </button>
              ) : null}
            </div>
          </div>

          {loading ? <LoadingState /> : null}

          {error ? (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
              <p className="flex items-center gap-2 font-medium text-red-100">
                <AlertCircle className="size-4" />
                {t("lobby.feedErrorTitle")}
              </p>
              <p className="mt-1 text-sm text-red-100/70">{error}</p>
            </div>
          ) : null}

          {!loading && !error && result ? (
            result.players.length === 0 && result.parties.length === 0 ? (
              <EmptyLobby
                onRelax={clearFilters}
                onPublish={() => void party.publishOpenParty()}
                onLooking={() => void party.publishLooking()}
              />
            ) : (
              <Tabs
                value={tab}
                onValueChange={(value) => {
                  tabTouchedRef.current = true;
                  setTab(String(value));
                }}
              >
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="parties" data-testid="tab-parties">
                    {t("lobby.tabParties")}
                    <Badge variant="secondary">{result.parties.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="players" data-testid="tab-players">
                    {t("lobby.tabPlayers")}
                    <Badge variant="secondary">{result.players.length}</Badge>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="parties" className="mt-4 space-y-3">
                  {result.parties.length === 0 ? (
                    <p className="text-sm text-white/50">
                      {t("lobby.noParties")}
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
                        {t("lobby.recent")}
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
                      {t("lobby.noPlayers")}
                    </p>
                  ) : (
                    result.players.map((row) => (
                      <PlayerCard
                        key={row.player.id}
                        row={row}
                        invited={party.invitedIds.has(row.player.id)}
                        disabled={party.partyFull || Boolean(party.joinedParty)}
                        onInvite={() => party.invite(row.player)}
                        onBlocked={() => party.bumpFeed()}
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
      </div>
    </SiteChrome>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <span className="w-[4.75rem] shrink-0 pt-1.5 text-[10px] font-medium uppercase leading-tight tracking-wide text-white/40 sm:w-24 sm:text-[11px]">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-1.5">{children}</div>
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
  const t = useT();
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <p className="text-sm text-white/50">{t("lobby.loading")}</p>
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
  const t = useT();
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6">
      <p className="font-display text-xl text-white">{t("lobby.emptyTitle")}</p>
      <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">
        {t("lobby.emptyBody")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" data-testid="empty-looking" onClick={onLooking}>
          {t("lobby.emptyLooking")}
        </Button>
        <Button type="button" data-testid="empty-publish" onClick={onPublish}>
          {t("lobby.emptyPublish")}
        </Button>
        <Button type="button" variant="outline" data-testid="empty-relax" onClick={onRelax}>
          {t("lobby.emptyRelax")}
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
  onBlocked,
}: {
  row: MatchResult["players"][number];
  invited: boolean;
  disabled: boolean;
  onInvite: () => void;
  onBlocked?: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const account = loadAccount();
  const { player, reasons } = row;
  const pid = personIdOf(player);
  const isYou = player.id.startsWith("you-") || pid === account.accountId;
  const proof = reasons.slice(0, 2);
  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/16">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-base font-medium text-white">
            <Link
              href={`/people/${pid}`}
              className="hover:text-[var(--brand)]"
              data-testid="player-person-link"
            >
              {player.name}
            </Link>
            {player.online ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-200">
                <Wifi className="size-3" />
                {t("lobby.online")}
              </span>
            ) : (
              <span className="text-[11px] text-white/40">{t("lobby.offline")}</span>
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
            {player.role} · {skillLabelFor(player.gameId, player.skill, locale)}
            {player.region ? ` · ${t(`region.${player.region}`)}` : ""}
            {player.language ? ` · ${t(`lang.${player.language}`)}` : ""}
          </p>
          {otherGamesFor(player).length > 0 ? (
            <p className="mt-1 text-[11px] text-white/40">
              {t("lobby.alsoPlays")}{" "}
              {otherGamesFor(player)
                .map((id) => games.find((item) => item.id === id)?.name ?? id)
                .join(", ")}
            </p>
          ) : null}
        </div>
        {isYou ? (
          <span className="rounded-md bg-[var(--brand)]/15 px-2 py-1 text-xs text-[var(--brand)]">
            {t("lobby.thisIsYou")}
          </span>
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            <Button
              type="button"
              size="lg"
              data-testid="invite-button"
              disabled={disabled || invited}
              onClick={onInvite}
            >
              <UserPlus data-icon="inline-start" />
              {invited ? t("lobby.inParty") : t("lobby.invite")}
            </Button>
            <button
              type="button"
              data-testid="block-player"
              className="text-[11px] text-white/35 transition hover:text-white/70"
              onClick={() => {
                blockPerson(pid, player.name);
                toast.success(t("toast.hidden", { name: player.name }));
                onBlocked?.();
              }}
            >
              {t("lobby.hide")}
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-white/60">{proof[0]}</p>
      {proof[1] ? <p className="mt-1 text-xs text-white/40">{proof[1]}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-white/40">
        <span>{player.hours.map((h) => t(`hour.${h}`)).join(" · ")}</span>
        {player.mic ? (
          <span className="inline-flex items-center gap-1">
            <Mic className="size-3" /> {t("lobby.micOn")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <MicOff className="size-3" /> {t("lobby.micOff")}
          </span>
        )}
        {player.voicePlatform ? (
          <span>{t(`voice.${player.voicePlatform}`)}</span>
        ) : null}
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
  const t = useT();
  const { locale } = useLocale();
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
      if (mode === "copied") toast.success(t("toast.openPartyLinkCopied"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(t("toast.shareFailShort"));
    }
  }

  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/16">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-white">{party.name}</h3>
          <p className="mt-1 text-sm text-white/50">
            {party.leader} · {t(`style.${party.playStyle}`)} ·{" "}
            {skillLabelFor(party.gameId, party.skill, locale)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--game-accent,var(--brand))]/15 px-2 py-1 text-xs text-white/90">
          <Users className="size-3" />
          {t("lobby.freeSlots", { n: open })}
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
        {party.region ? <span>{t(`region.${party.region}`)}</span> : null}
        {party.voicePlatform ? <span>{t(`voice.${party.voicePlatform}`)}</span> : null}
        {party.language ? <span>{t(`lang.${party.language}`)}</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="lg"
          data-testid="join-party"
          disabled={joined || open <= 0}
          onClick={onJoin}
        >
          {joined ? t("lobby.alreadyInside") : open <= 0 ? t("lobby.noSlots") : t("lobby.join")}
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
          {t("lobby.link")}
        </Button>
      </div>
    </article>
  );
}

export function PartyDeepLink({ party }: { party: OpenParty }) {
  const ctx = useParty();
  const t = useT();
  const { locale } = useLocale();
  const localized = useMemo(() => localizeParty(party, locale), [party, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => ctx.applyOpenParty(localized), 0);
    return () => window.clearTimeout(timer);
  }, [ctx, localized]);

  return (
    <SiteChrome>
      <div className="dark flex flex-1 flex-col bg-[#0b0b0d] text-foreground">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <Link href={`/g/${localized.gameId}`} className="text-xs text-white/50 hover:text-white/80">
          {t("deep.backLobby")}
        </Link>
        <div className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">{t("deep.openGathering")}</p>
          <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">{localized.name}</h1>
          <p className="mt-3 text-sm text-white/60">
            {localized.leader} · {t(`style.${localized.playStyle}`)} ·{" "}
            {t("deep.freeOf", {
              free: localized.partySize - localized.filled,
              total: localized.partySize,
            })}
          </p>
          <p className="mt-4 text-sm leading-6 text-white/70">{localized.note}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              size="lg"
              data-testid="deep-join-party"
              disabled={ctx.joinedParty?.id === localized.id}
              onClick={() => ctx.joinParty(localized)}
            >
              {t("deep.join")}
            </Button>
            <Link
              href={`/g/${localized.gameId}`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white transition hover:bg-white/10"
            >
              {t("deep.openLobby")}
            </Link>
          </div>
        </div>
        <PartyTray />
      </main>
      </div>
    </SiteChrome>
  );
}

export function JoinDeepLink({ code }: { code: string }) {
  const ctx = useParty();
  const t = useT();
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
      <div className="dark flex flex-1 flex-col bg-[#0b0b0d] text-foreground">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <Link href="/" className="text-xs text-white/50 hover:text-white/80">
          {t("lobby.catalogShort")}
        </Link>
        <div className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">{t("deep.inviteTitle")}</p>
          <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">
            {t("deep.code", { code: code.toUpperCase() })}
          </h1>
          <p className="mt-3 text-sm text-white/60" data-testid="join-status">
            {status === "loading"
              ? t("deep.loadingCode")
              : status === "missing"
                ? t("deep.missingLong")
                : t("deep.inContext", {
                    name: ctx.partyName,
                    filled: ctx.filledCount,
                    total: ctx.seats.length,
                  })}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={ctx.gameId ? `/g/${ctx.gameId}` : "/g/valorant"}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
            >
              {t("deep.goLobby")}
            </Link>
            <Button
              type="button"
              size="lg"
              variant="outline"
              data-testid="copy-party-link-join"
              onClick={() => void ctx.copyShareLink()}
            >
              {t("deep.copyPartyLink")}
            </Button>
          </div>
        </div>
        <PartyTray />
      </main>
      </div>
    </SiteChrome>
  );
}
