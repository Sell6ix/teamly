"use client";

import { CoverImage } from "@/components/cover-image";
import { SiteChrome } from "@/components/site-chrome";
import { catalogGames } from "@/lib/catalog";
import { GAME_TYPES, gameTypeLabel } from "@/lib/game-types";
import type { GameType } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export function CatalogHome() {
  const baseGames = useMemo(() => catalogGames(), []);
  const [extraCounts, setExtraCounts] = useState<Record<string, number>>({});
  const [extraLooking, setExtraLooking] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<GameType | "all">("all");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/parties?counts=1")
      .then((res) => res.json())
      .then((data: { counts?: Record<string, number>; looking?: Record<string, number> }) => {
        if (!cancelled) {
          setExtraCounts(data.counts ?? {});
          setExtraLooking(data.looking ?? {});
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const games = baseGames.map((game) => ({
    ...game,
    looking: game.looking + (extraLooking[game.id] ?? 0),
    openParties: game.openParties + (extraCounts[game.id] ?? 0),
  }));

  const availableTypes = GAME_TYPES.filter((type) =>
    games.some((game) => game.type === type),
  );

  const filtered = games.filter((game) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      game.name.toLowerCase().includes(q) ||
      game.genre.toLowerCase().includes(q) ||
      gameTypeLabel[game.type].toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || game.type === typeFilter;
    return matchesQuery && matchesType;
  });

  return (
    <SiteChrome>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        <section className="relative mb-10 max-w-3xl animate-fade-up">
          <p className="font-display text-5xl tracking-tight text-white sm:text-6xl md:text-7xl">
            Teamly
          </p>
          <h1 className="mt-4 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Собери пати за минуту — как каталог игр, только для живых сборов.
          </h1>
        </section>

        <div className="mb-4 flex flex-wrap gap-2" data-testid="catalog-type-chips">
          <button
            type="button"
            data-testid="catalog-type-all"
            onClick={() => setTypeFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              typeFilter === "all"
                ? "bg-[var(--brand)] text-black"
                : "border border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white"
            }`}
          >
            Все
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              data-testid={`catalog-type-${type}`}
              onClick={() => setTypeFilter(type)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                typeFilter === type
                  ? "bg-[var(--brand)] text-black"
                  : "border border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              {gameTypeLabel[type]}
            </button>
          ))}
        </div>

        <div className="mb-6 max-w-md">
          <label className="relative block w-full">
            <span className="sr-only">Поиск игры</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти игру или тип…"
              data-testid="catalog-search"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--brand)]/50"
            />
          </label>
        </div>

        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          data-testid="catalog-grid"
        >
          {filtered.map((game, index) => (
            <Link
              key={game.id}
              href={`/g/${game.id}`}
              data-testid={`catalog-game-${game.id}`}
              className="group relative animate-fade-up overflow-hidden rounded-xl outline-none ring-offset-2 ring-offset-[#0b0b0d] transition duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-[#161618]">
                <CoverImage
                  gameId={game.id}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-display text-base leading-tight text-white sm:text-lg">
                    {game.name}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/45">
                    {gameTypeLabel[game.type]}
                  </p>
                  <p className="mt-1 text-[11px] text-white/70 sm:text-xs">
                    {game.looking} ищут · {game.openParties} сборов
                  </p>
                </div>
                {game.onlineNow > 0 ? (
                  <span className="absolute left-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] text-emerald-300 backdrop-blur">
                    {game.onlineNow} онлайн
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-white/50">
            Ничего не нашлось. Сбросьте тип или поиск.
          </p>
        ) : null}
      </main>
    </SiteChrome>
  );
}
