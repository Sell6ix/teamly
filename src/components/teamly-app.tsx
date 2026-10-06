"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YOU_NAME, games } from "@/lib/data";
import {
  formatHours,
  hourLabel,
  hourRange,
  partySizeLabel,
  playStyleHint,
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
  Player,
  SkillLevel,
} from "@/lib/types";
import {
  AlertCircle,
  Check,
  Clock,
  Gamepad2,
  Mic,
  MicOff,
  PartyPopper,
  Search,
  Sparkles,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Step = "criteria" | "results";
type Seat = { kind: "you" } | { kind: "player"; player: Player } | { kind: "empty" };

const playStyles: PlayStyle[] = ["casual", "ranked", "learning", "voice", "speedrun"];
const hours: HourWindow[] = ["morning", "day", "evening", "night"];

export function TeamlyApp() {
  const [gameId, setGameId] = useState<Game["id"]>("valorant");
  const [playStyle, setPlayStyle] = useState<PlayStyle>("ranked");
  const [partySize, setPartySize] = useState(5);
  const [skill, setSkill] = useState<SkillLevel>(4);
  const [selectedHours, setSelectedHours] = useState<HourWindow[]>(["evening"]);
  const [forceError, setForceError] = useState(false);

  const [step, setStep] = useState<Step>("criteria");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [lastCriteria, setLastCriteria] = useState<MatchCriteria | null>(null);

  const [partyName, setPartyName] = useState("Пати Ивана");
  const [seats, setSeats] = useState<Seat[]>(makeSeats(5, []));
  const [joinedParty, setJoinedParty] = useState<OpenParty | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("players");

  const game = games.find((item) => item.id === gameId)!;
  const sizes = game.partySizes;

  const invitedIds = useMemo(
    () =>
      new Set(
        seats
          .filter((seat): seat is { kind: "player"; player: Player } => seat.kind === "player")
          .map((seat) => seat.player.id),
      ),
    [seats],
  );

  const filledCount = seats.filter((seat) => seat.kind !== "empty").length;
  const partyFull = filledCount >= seats.length;

  function resetParty(size: number, invited: Player[] = []) {
    setSeats(makeSeats(size, invited));
    setJoinedParty(null);
    setReady(false);
    setPartyName("Пати Ивана");
  }

  async function search(criteria: MatchCriteria, simulateError = forceError) {
    setStep("results");
    setLoading(true);
    setError(null);
    setResult(null);
    setLastCriteria(criteria);
    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...criteria, forceError: simulateError }),
      });
      const data = (await response.json()) as MatchResult & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не получилось найти игроков.");
        return;
      }
      setResult(data);
      if (data.parties.length && !data.players.length) setTab("parties");
      else setTab("players");
    } catch {
      setError("Сеть недоступна. Проверьте соединение и повторите поиск.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedHours.length) {
      toast.error("Отметьте, когда вы обычно онлайн.");
      return;
    }
    const size = sizes.includes(partySize) ? partySize : sizes[0];
    setPartySize(size);
    resetParty(size);
    void search({
      gameId,
      playStyle,
      partySize: size,
      skill,
      hours: selectedHours,
    });
  }

  function invite(player: Player) {
    if (joinedParty) {
      toast.error("Вы уже в чужом сборе. Выйдите, чтобы собрать свою пати.");
      return;
    }
    if (invitedIds.has(player.id)) return;
    const emptyIndex = seats.findIndex((seat) => seat.kind === "empty");
    if (emptyIndex === -1) {
      toast.error("Пати уже полная.");
      return;
    }
    const next = [...seats];
    next[emptyIndex] = { kind: "player", player };
    setSeats(next);
    toast.success(`${player.name} в пати`);
  }

  function kick(playerId: string) {
    setSeats((current) =>
      current.map((seat) =>
        seat.kind === "player" && seat.player.id === playerId ? { kind: "empty" } : seat,
      ),
    );
    setReady(false);
  }

  function joinParty(party: OpenParty) {
    const remaining = party.partySize - party.filled;
    if (remaining <= 0) return;
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
    setSeats(makeSeats(party.partySize, placeholders));
    setJoinedParty(party);
    setPartyName(party.name);
    setReady(false);
    toast.success(`Вы в сборе «${party.name}»`);
  }

  function leaveJoined() {
    resetParty(lastCriteria?.partySize ?? partySize);
    toast("Вы вышли из сбора");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-white/8 bg-[#0c0a14]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_24px_rgba(168,85,247,0.45)]">
              <Gamepad2 className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Teamly</p>
              <p className="text-[11px] text-muted-foreground">Пати за минуту, без бесконечного поиска</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="outline" className="border-violet-400/30 bg-violet-500/10 text-violet-200">
              {YOU_NAME}
            </Badge>
            <Badge variant="secondary">МСК</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start">
        <section className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StepPill active={step === "criteria"} done={step === "results"} index={1} label="Критерии" />
            <span className="text-white/20">→</span>
            <StepPill active={step === "results"} done={false} index={2} label="Совпадения" />
            <span className="text-white/20">→</span>
            <StepPill active={filledCount > 1} done={partyFull} index={3} label="Сбор пати" />
          </div>

          {step === "criteria" ? (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Соберите пати под ваш ритм
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Выберите игру, стиль и формат — Teamly подберёт людей с похожим уровнем и окнами
                  онлайна. Дальше останется пригласить в пати или вступить в готовый сбор.
                </p>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Игра</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {games.map((item) => {
                    const selected = item.id === gameId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setGameId(item.id);
                          if (!item.partySizes.includes(partySize)) {
                            setPartySize(item.partySizes[0]);
                          }
                        }}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-violet-400/60 bg-violet-500/15 shadow-[0_0_0_1px_rgba(167,139,250,0.25)]"
                            : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: item.accent }}
                          />
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">{item.genre}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Стиль игры</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {playStyles.map((style) => {
                    const selected = playStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setPlayStyle(style)}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-fuchsia-400/50 bg-fuchsia-500/12"
                            : "border-white/8 bg-white/3 hover:border-white/20"
                        }`}
                      >
                        <span className="font-medium">{playStyleLabel[style]}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {playStyleHint[style]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Формат пати</legend>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <Button
                        key={size}
                        type="button"
                        size="lg"
                        variant={partySize === size ? "default" : "outline"}
                        onClick={() => setPartySize(size)}
                      >
                        {partySizeLabel[size]} · {size}
                      </Button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Ваш уровень</legend>
                  <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>{skillLabel[skill]}</span>
                      <span className="text-muted-foreground">{skill}/5</span>
                    </div>
                    <input
                      aria-label="Уровень"
                      type="range"
                      min={1}
                      max={5}
                      value={skill}
                      onChange={(event) => setSkill(Number(event.target.value) as SkillLevel)}
                      className="w-full accent-violet-500"
                    />
                  </div>
                </fieldset>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Когда вы онлайн</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {hours.map((hour) => {
                    const checked = selectedHours.includes(hour);
                    return (
                      <label
                        key={hour}
                        className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-3 ${
                          checked ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/8 bg-white/3"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const on = value === true;
                            setSelectedHours((current) =>
                              on ? [...current, hour] : current.filter((item) => item !== hour),
                            );
                          }}
                        />
                        <span>
                          <span className="block text-sm font-medium">{hourLabel[hour]}</span>
                          <span className="text-[11px] text-muted-foreground">{hourRange[hour]}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={forceError}
                  onCheckedChange={(value) => setForceError(value === true)}
                />
                Показать состояние ошибки поиска
              </label>

              <div className="sticky bottom-3 z-10 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="submit" size="lg" className="h-11 w-full sm:w-auto">
                  <Search data-icon="inline-start" />
                  Найти игроков
                </Button>
                <p className="text-xs text-muted-foreground">
                  Подбор идёт по игре, стилю, уровню (±2) и пересечению часов.
                </p>
              </div>
            </form>
          ) : (
            <ResultsView
              loading={loading}
              error={error}
              result={result}
              criteria={lastCriteria}
              tab={tab}
              onTabChange={setTab}
              invitedIds={invitedIds}
              partyFull={partyFull}
              joinedParty={joinedParty}
              onInvite={invite}
              onJoin={joinParty}
              onRetry={() => lastCriteria && search(lastCriteria, forceError)}
              onBack={() => {
                setStep("criteria");
                setError(null);
              }}
            />
          )}
        </section>

        <PartyDock
          seats={seats}
          partyName={partyName}
          joinedParty={joinedParty}
          ready={ready}
          onReady={() => setReady(true)}
          onKick={kick}
          onLeave={leaveJoined}
          onRename={setPartyName}
        />
      </main>
    </div>
  );
}

function makeSeats(size: number, invited: Player[]): Seat[] {
  const seats: Seat[] = [{ kind: "you" }];
  invited.forEach((player) => seats.push({ kind: "player", player }));
  while (seats.length < size) seats.push({ kind: "empty" });
  return seats.slice(0, size);
}

function StepPill({
  active,
  done,
  index,
  label,
}: {
  active: boolean;
  done: boolean;
  index: number;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        active || done ? "bg-violet-500/20 text-violet-100" : "bg-white/5"
      }`}
    >
      <span className="flex size-4 items-center justify-center rounded-full bg-white/10 text-[10px]">
        {done ? <Check className="size-3" /> : index}
      </span>
      {label}
    </span>
  );
}

function ResultsView({
  loading,
  error,
  result,
  criteria,
  tab,
  onTabChange,
  invitedIds,
  partyFull,
  joinedParty,
  onInvite,
  onJoin,
  onRetry,
  onBack,
}: {
  loading: boolean;
  error: string | null;
  result: MatchResult | null;
  criteria: MatchCriteria | null;
  tab: string;
  onTabChange: (value: string) => void;
  invitedIds: Set<string>;
  partyFull: boolean;
  joinedParty: OpenParty | null;
  onInvite: (player: Player) => void;
  onJoin: (party: OpenParty) => void;
  onRetry: () => void;
  onBack: () => void;
}) {
  const game = criteria ? games.find((item) => item.id === criteria.gameId) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Кого подобрали</h1>
          {criteria && game ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {game.name} · {playStyleLabel[criteria.playStyle]} · {partySizeLabel[criteria.partySize]}{" "}
              · {skillLabel[criteria.skill]} · {formatHours(criteria.hours)}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Изменить критерии
        </Button>
      </div>

      {loading ? <LoadingState /> : null}

      {error ? (
        <Card className="border-destructive/30 bg-destructive/8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-4" />
              Поиск не удался
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="gap-2">
            <Button type="button" onClick={onRetry}>
              Повторить
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Вернуться к фильтрам
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {!loading && !error && result ? (
        result.players.length === 0 && result.parties.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Пока пусто</CardTitle>
              <CardDescription>
                Для этой связки критериев никто не нашёлся: либо часы не пересекаются, либо стиль слишком
                узкий. Смягчите уровень, добавьте вечер или выберите казуал — и поиск даст живых людей.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button type="button" onClick={onBack}>
                Ослабить фильтры
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs value={tab} onValueChange={(value) => onTabChange(String(value))}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="players">
                Игроки
                <Badge variant="secondary">{result.players.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="parties">
                Сборы
                <Badge variant="secondary">{result.parties.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="players" className="mt-4 space-y-3">
              {result.players.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Соло-игроков нет, но ниже могут быть готовые сборы.
                </p>
              ) : (
                result.players.map((row) => (
                  <PlayerCard
                    key={row.player.id}
                    row={row}
                    invited={invitedIds.has(row.player.id)}
                    disabled={partyFull || Boolean(joinedParty)}
                    onInvite={() => onInvite(row.player)}
                  />
                ))
              )}
            </TabsContent>
            <TabsContent value="parties" className="mt-4 space-y-3">
              {result.parties.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Открытых сборов нет. Соберите пати из игроков слева.
                </p>
              ) : (
                result.parties.map((row) => (
                  <PartyCard
                    key={row.party.id}
                    row={row}
                    joined={joinedParty?.id === row.party.id}
                    onJoin={() => onJoin(row.party)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <p className="text-sm text-muted-foreground">Сверяем стиль, ранг и часы онлайна…</p>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
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
    <Card>
      <CardHeader className="border-b border-white/6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {player.name}
              {player.online ? (
                <Badge className="bg-emerald-500/15 text-emerald-200">
                  <Wifi data-icon="inline-start" />
                  Онлайн
                </Badge>
              ) : (
                <Badge variant="outline">Офлайн</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {player.role} · {skillLabel[player.skill]} · {formatHours(player.hours)}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-violet-200">{score}%</p>
            <p className="text-[11px] text-muted-foreground">совпадение</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6">{player.bio}</p>
        <ul className="flex flex-wrap gap-1.5">
          {reasons.map((reason) => (
            <li key={reason}>
              <Badge variant="secondary">{reason}</Badge>
            </li>
          ))}
          {player.mic ? (
            <li>
              <Badge variant="outline">
                <Mic data-icon="inline-start" />
                Микро
              </Badge>
            </li>
          ) : (
            <li>
              <Badge variant="outline">
                <MicOff data-icon="inline-start" />
                Без микро
              </Badge>
            </li>
          )}
        </ul>
      </CardContent>
      <CardFooter>
        <Button type="button" size="lg" disabled={disabled || invited} onClick={onInvite}>
          <UserPlus data-icon="inline-start" />
          {invited ? "Уже в пати" : "Пригласить"}
        </Button>
      </CardFooter>
    </Card>
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
  return (
    <Card>
      <CardHeader className="border-b border-white/6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{party.name}</CardTitle>
            <CardDescription>
              Лидер {party.leader} · {playStyleLabel[party.playStyle]} · {skillLabel[party.skill]}
            </CardDescription>
          </div>
          <p className="text-lg font-semibold text-cyan-200">{score}%</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6">{party.note}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">
            <Users data-icon="inline-start" />
            {party.filled}/{party.partySize}, свободно {open}
          </Badge>
          {reasons.map((reason) => (
            <Badge key={reason} variant="outline">
              {reason}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button type="button" size="lg" disabled={joined} onClick={onJoin}>
          <Sparkles data-icon="inline-start" />
          {joined ? "Вы уже внутри" : "Вступить"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function PartyDock({
  seats,
  partyName,
  joinedParty,
  ready,
  onReady,
  onKick,
  onLeave,
  onRename,
}: {
  seats: Seat[];
  partyName: string;
  joinedParty: OpenParty | null;
  ready: boolean;
  onReady: () => void;
  onKick: (id: string) => void;
  onLeave: () => void;
  onRename: (name: string) => void;
}) {
  const filled = seats.filter((seat) => seat.kind !== "empty").length;
  const full = filled === seats.length;

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-80">
      <Card className="border-violet-400/20 bg-[#141022]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            {joinedParty ? "Вы в сборе" : "Ваша пати"}
          </CardTitle>
          <CardDescription>
            {filled} из {seats.length} мест
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {joinedParty ? (
            <p className="text-sm font-medium">{partyName}</p>
          ) : (
            <label className="block text-xs text-muted-foreground">
              Название
              <input
                value={partyName}
                onChange={(event) => onRename(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-violet-400/50"
              />
            </label>
          )}
          <ol className="space-y-2">
            {seats.map((seat, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/4 px-3 py-2"
              >
                {seat.kind === "you" ? (
                  <span className="text-sm">
                    <span className="font-medium">{YOU_NAME}</span>
                    <span className="ml-2 text-xs text-muted-foreground">это вы</span>
                  </span>
                ) : null}
                {seat.kind === "player" ? (
                  <>
                    <span className="text-sm">
                      <span className="font-medium">{seat.player.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{seat.player.role}</span>
                    </span>
                    {!joinedParty ? (
                      <Button type="button" size="xs" variant="ghost" onClick={() => onKick(seat.player.id)}>
                        Убрать
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {seat.kind === "empty" ? (
                  <span className="text-sm text-muted-foreground">Свободное место</span>
                ) : null}
              </li>
            ))}
          </ol>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          {joinedParty ? (
            <Button type="button" variant="outline" onClick={onLeave}>
              Выйти из сбора
            </Button>
          ) : null}
          <Button type="button" size="lg" disabled={!full || ready} onClick={onReady}>
            {ready ? (
              <>
                <PartyPopper data-icon="inline-start" />
                Пати готова — можно заходить
              </>
            ) : full ? (
              "Подтвердить состав"
            ) : (
              `Нужно ещё ${seats.length - filled}`
            )}
          </Button>
          {ready ? (
            <p className="flex items-center gap-1 text-xs text-emerald-300">
              <Clock className="size-3" />
              Состав зафиксирован. Зовите людей в клиент игры.
            </p>
          ) : null}
        </CardFooter>
      </Card>
    </aside>
  );
}
