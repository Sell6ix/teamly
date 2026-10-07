"use client";

import { SiteChrome } from "@/components/site-chrome";
import { catalogGames } from "@/lib/catalog";
import { useMemo, useState } from "react";
import Link from "next/link";

const genreFilters = ["Все", "Шутер", "MOBA", "Кооп", "Хоррор"] as const;

function matchesGenre(genre: string, filter: string) {
  if (filter === "Все") return true;
  if (filter === "Шутер") return /шутер|battle royale|тактический/i.test(genre);
  if (filter === "MOBA") return /moba/i.test(genre);
  if (filter === "Кооп") return /кооп|pve/i.test(genre);
  if (filter === "Хоррор") return /хоррор/i.test(genre);
  return true;
}

export function CatalogHome() {
  const games = useMemo(() => catalogGames(), []);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<(typeof genreFilters)[number]>("Все");

  const filtered = games.filter((game) => {
    const q = query.trim().toLowerCase();
    const nameOk = !q || game.name.toLowerCase().includes(q);
    return nameOk && matchesGenre(game.genre, genre);
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

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Поиск игры</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти игру…"
              data-testid="catalog-search"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--brand)]/50"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {genreFilters.map((item) => {
              const active = genre === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGenre(item)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    active
                      ? "bg-[var(--brand)] text-[#1a0f0a]"
                      : "border border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
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
              <div className="relative aspect-[3/4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/covers/${game.id}.svg`}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-display text-base leading-tight text-white sm:text-lg">
                    {game.name}
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
          <p className="mt-10 text-sm text-white/50">Ничего не нашлось. Сбросьте фильтр или поиск.</p>
        ) : null}
      </main>
    </SiteChrome>
  );
}
