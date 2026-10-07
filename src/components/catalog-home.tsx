"use client";

import { CoverImage } from "@/components/cover-image";
import { SiteChrome } from "@/components/site-chrome";
import { catalogGames } from "@/lib/catalog";
import { catalogHref, parseCatalogSearchParams } from "@/lib/catalog-url";
import { GAME_TYPES } from "@/lib/game-types";
import { useT } from "@/lib/i18n/context";
import type { GameType } from "@/lib/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function CatalogHome() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseCatalogSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const baseGames = useMemo(() => catalogGames(), []);
  const [extraCounts, setExtraCounts] = useState<Record<string, number>>({});
  const [extraLooking, setExtraLooking] = useState<Record<string, number>>({});
  const [queryDraft, setQueryDraft] = useState(filters.q);

  useEffect(() => {
    setQueryDraft(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const trimmed = queryDraft.trim();
    if (trimmed === filters.q) return;
    const timer = window.setTimeout(() => {
      router.replace(catalogHref({ type: filters.type, q: queryDraft }), {
        scroll: false,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [queryDraft, filters.q, filters.type, router]);

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

  function setTypeFilter(type: GameType | "all") {
    router.replace(catalogHref({ type, q: filters.q }), { scroll: false });
  }

  const games = baseGames.map((game) => ({
    ...game,
    looking: game.looking + (extraLooking[game.id] ?? 0),
    openParties: game.openParties + (extraCounts[game.id] ?? 0),
  }));

  const availableTypes = GAME_TYPES.filter((type) =>
    games.some((game) => game.type === type),
  );

  const filtered = games.filter((game) => {
    const q = queryDraft.trim().toLowerCase();
    const typeLabel = t(`type.${game.type}`).toLowerCase();
    const matchesQuery =
      !q ||
      game.name.toLowerCase().includes(q) ||
      game.genre.toLowerCase().includes(q) ||
      typeLabel.includes(q);
    const matchesType = filters.type === "all" || game.type === filters.type;
    return matchesQuery && matchesType;
  });

  return (
    <SiteChrome>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        <section className="relative mb-10 max-w-3xl animate-fade-up">
          <p className="font-display text-5xl tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Teamly
          </p>
          <h1 className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("catalog.headline")}
          </h1>
        </section>

        <div className="mb-4 flex flex-wrap gap-2" data-testid="catalog-type-chips">
          <button
            type="button"
            data-testid="catalog-type-all"
            onClick={() => setTypeFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              filters.type === "all"
                ? "bg-[var(--brand)] text-primary-foreground"
                : "border border-border bg-secondary/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            }`}
          >
            {t("catalog.all")}
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              data-testid={`catalog-type-${type}`}
              onClick={() => setTypeFilter(type)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                filters.type === type
                  ? "bg-[var(--brand)] text-primary-foreground"
                  : "border border-border bg-secondary/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              {t(`type.${type}`)}
            </button>
          ))}
        </div>

        <div className="mb-6 max-w-md">
          <label className="relative block w-full">
            <span className="sr-only">{t("catalog.searchLabel")}</span>
            <input
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
              placeholder={t("catalog.search")}
              data-testid="catalog-search"
              className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[var(--brand)]/50"
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
              className="group relative animate-fade-up overflow-hidden rounded-xl outline-none ring-offset-2 ring-offset-background transition duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-card">
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
                    {t(`type.${game.type}`)}
                  </p>
                  <p className="mt-1 text-[11px] text-white/70 sm:text-xs">
                    {t("catalog.lookingParties", {
                      looking: game.looking,
                      parties: game.openParties,
                    })}
                  </p>
                </div>
                {game.onlineNow > 0 ? (
                  <span className="absolute left-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] text-emerald-300 backdrop-blur">
                    {t("catalog.online", { n: game.onlineNow })}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("catalog.empty")}</p>
        ) : null}
      </main>
    </SiteChrome>
  );
}
