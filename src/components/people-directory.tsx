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
import { useLocale, useT } from "@/lib/i18n/context";
import {
  allPeople,
  filterPeople,
  gameName,
  type PersonSummary,
} from "@/lib/people";
import type { GameId } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function PeopleDirectory({
  initialQuery = "",
  initialGame = "all",
}: {
  initialQuery?: string;
  initialGame?: GameId | "all";
}) {
  const t = useT();
  const { locale } = useLocale();
  const people = useMemo(() => allPeople(locale), [locale]);
  const [query, setQuery] = useState(initialQuery);
  const [gameId, setGameId] = useState<GameId | "all">(initialGame);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);

  useEffect(() => {
    setBlacklist(loadBlacklist());
  }, []);

  const filtered = filterPeople(people, query, gameId, locale);

  function toggleBlock(person: PersonSummary) {
    if (isBlocked(person.personId, blacklist)) {
      const next = unblockPerson(person.personId, blacklist);
      setBlacklist(next);
      toast.success(t("toast.restored", { name: person.name }));
      return;
    }
    const next = blockPerson(person.personId, person.name, blacklist);
    setBlacklist(next);
    toast.success(t("toast.blacklistedShort", { name: person.name }));
  }

  return (
    <SiteChrome>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        <section className="mb-8 animate-fade-up">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("people.eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">
            {t("people.title")}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("people.lead")}
          </p>
        </section>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("people.search")}
            data-testid="people-search"
            className="w-full flex-1 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--brand)]/50"
          />
          <select
            value={gameId}
            onChange={(event) => setGameId(event.target.value as GameId | "all")}
            data-testid="people-game-filter"
            className="rounded-xl border border-border bg-secondary/40 px-3 py-3 text-sm text-foreground outline-none focus:border-[var(--brand)]/50 sm:w-48"
          >
            <option value="all">{t("people.allGames")}</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {gameName(game.id, locale)}
              </option>
            ))}
          </select>
        </div>

        {blacklist.length > 0 ? (
          <div
            className="mb-6 rounded-xl border border-border bg-card/80 p-3"
            data-testid="blacklist-panel"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("people.blacklist")}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {blacklist.map((entry) => (
                <li key={entry.personId}>
                  <button
                    type="button"
                    data-testid={`unblock-${entry.personId}`}
                    onClick={() => {
                      const next = unblockPerson(entry.personId, blacklist);
                      setBlacklist(next);
                      toast.success(t("toast.restored", { name: entry.name }));
                    }}
                    className="rounded-lg border border-border bg-secondary/60 px-2 py-1 text-xs text-foreground/80 transition hover:border-foreground/25 hover:text-foreground"
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
                    ? "border-border/60 bg-secondary/20 opacity-60"
                    : "border-border bg-card/70 hover:border-foreground/20"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/people/${person.personId}`}
                        className="text-base font-medium text-foreground hover:text-[var(--brand)]"
                      >
                        {person.name}
                      </Link>
                      {person.online ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-300">
                          {t("people.online")}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {t("people.offline")}
                        </span>
                      )}
                      <ProfileLinks
                        steamProfileUrl={person.steamProfileUrl}
                        discordUrl={person.discordUrl}
                        riotTag={person.riotTag}
                        faceitUrl={person.faceitUrl}
                        compact
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {person.gameIds.map((id) => gameName(id, locale)).join(" · ")}
                      {person.region ? ` · ${t(`region.${person.region}`)}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      {person.roles.slice(0, 3).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/people/${person.personId}`}
                      className="inline-flex h-7 items-center rounded-lg border border-border bg-secondary/50 px-2.5 text-[0.8rem] text-foreground/80 transition hover:border-foreground/30"
                    >
                      {t("people.card")}
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant={blocked ? "outline" : "secondary"}
                      data-testid={`block-${person.personId}`}
                      onClick={() => toggleBlock(person)}
                    >
                      {blocked ? t("people.restore") : t("people.hide")}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("people.empty")}</p>
        ) : null}
      </main>
    </SiteChrome>
  );
}
