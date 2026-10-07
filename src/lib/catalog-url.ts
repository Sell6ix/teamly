import { GAME_TYPES } from "./game-types";
import type { GameType } from "./types";

export type CatalogFilters = {
  type: GameType | "all";
  q: string;
};

export function isGameType(value: string): value is GameType {
  return (GAME_TYPES as readonly string[]).includes(value);
}

export function parseCatalogSearchParams(params: URLSearchParams): CatalogFilters {
  const typeRaw = params.get("type");
  const type = typeRaw && isGameType(typeRaw) ? typeRaw : "all";
  const q = (params.get("q") ?? "").trim();
  return { type, q };
}

export function catalogHref(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  if (filters.type !== "all") params.set("type", filters.type);
  const q = filters.q.trim();
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
