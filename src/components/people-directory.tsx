"use client";

import { ProfileLinks } from "@/components/profile-links";
import { SiteChrome } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  blockPerson,
  isBlocked,
  loadBlacklist,
  unblockPerson,
  type BlacklistEntry,
} from "@/lib/blacklist";
import { games } from "@/lib/data";
import { regionLabel } from "@/lib/profile";
import {
  allPeople,
  filterPeople,
  gameName,
  type PersonSummary,
} from "@/lib/people";
import type { GameId } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function PeopleDirectory({
  initialQuery = "",
  initialGame = "all",
}: {
  initialQuery?: string;
  initialGame?: GameId | "all";
}) {
  const people = useMemo(() => allPeople(), []);
  const [query, setQuery] = useState(initialQuery);
  const [gameId, setGameId] = useState<GameId | "all">(initialGame);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>(() =>
    typeof window === "undefined" ? [] : loadBlacklist(),
  );

  const filtered = filterPeople(people, query, gameId);

  function toggleBlock(person: PersonSummary) {
    if (isBlocked(person.personId, blacklist)) {
      const next = unblockPerson(person.personId, blacklist);
      setBlacklist(next);
      toast.success(`${person.name} снова в ленте`);
      return;
    }
    const next = blockPerson(person.personId, person.name, blacklist);
    setBlacklist(next);
    toast.success(`${person.name} в чёрном списке`);
  }

  return (
    <SiteChrome>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        <section className="mb-8 animate-fade-up">
          <p className="text-xs uppercase tracking-wide text-white/40">Каталог людей</p>
          <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">Люди</h1>
          <p className="mt-3 max-w-xl text-sm text-white/60 sm:text-base">
            Поиск по демо-игрокам. Можно открыть карточку или спрятать человека из ленты
            лобби.
          </p>
        </section>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Имя, игра, роль…"
            data-testid="people-search"
            className="w-full flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-[var(--brand)]/50"
          />
          <select
            value={gameId}
            onChange={(event) => setGameId(event.target.value as GameId | "all")}
            data-testid="people-game-filter"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-[var(--brand)]/50 sm:w-48"
          >
            <option value="all">Все игры</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>

        {blacklist.length > 0 ? (
          <div
            className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            data-testid="blacklist-panel"
          >
            <p className="text-xs uppercase tracking-wide text-white/40">Чёрный список</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {blacklist.map((entry) => (
                <li key={entry.personId}>
                  <button
                    type="button"
                    data-testid={`unblock-${entry.personId}`}
                    onClick={() => {
                      const next = unblockPerson(entry.personId, blacklist);
                      setBlacklist(next);
                      toast.success(`${entry.name} снова в ленте`);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 transition hover:border-white/25 hover:text-white"
                  >
                    {entry.name} ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ul className="space-y-3" data-testid="people-list">
          {filtered.map((person) => {
            const blocked = isBlocked(person.personId, blacklist);
            return (
              <li
                key={person.personId}
                data-testid={`person-${person.personId}`}
                className={`rounded-2xl border p-4 transition ${
                  blocked
                    ? "border-white/6 bg-white/[0.02] opacity-60"
                    : "border-white/8 bg-white/[0.03] hover:border-white/16"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/people/${person.personId}`}
                        className="text-base font-medium text-white hover:text-[var(--brand)]"
                      >
                        {person.name}
                      </Link>
                      {person.online ? (
                        <span className="text-[11px] text-emerald-300">онлайн</span>
                      ) : (
                        <span className="text-[11px] text-white/35">офлайн</span>
                      )}
                      <ProfileLinks
                        steamProfileUrl={person.steamProfileUrl}
                        discordUrl={person.discordUrl}
                        riotTag={person.riotTag}
                        faceitUrl={person.faceitUrl}
                        compact
                      />
                    </div>
                    <p className="mt-1 text-sm text-white/50">
                      {person.gameIds.map(gameName).join(" · ")}
                      {person.region ? ` · ${regionLabel[person.region]}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-white/40">{person.roles.slice(0, 3).join(" · ")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/people/${person.personId}`}
                      className="inline-flex h-7 items-center rounded-lg border border-white/15 bg-white/5 px-2.5 text-[0.8rem] text-white/80 transition hover:border-white/30"
                    >
                      Карточка
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant={blocked ? "outline" : "secondary"}
                      data-testid={`block-${person.personId}`}
                      onClick={() => toggleBlock(person)}
                    >
                      {blocked ? "Вернуть" : "Скрыть"}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-white/50">Никого не нашлось. Ослабьте фильтр.</p>
        ) : null}
      </main>
    </SiteChrome>
  );
}
