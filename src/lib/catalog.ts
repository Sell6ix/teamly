import { games, openParties, players } from "./data";
import type { Game, GameId } from "./types";

export type GameCatalogItem = Game & {
  looking: number;
  openParties: number;
  onlineNow: number;
};

export function catalogGames(): GameCatalogItem[] {
  return games.map((game) => {
    const gamePlayers = players.filter((p) => p.gameId === game.id);
    const looking = gamePlayers.length;
    const onlineNow = gamePlayers.filter((p) => p.online).length;
    const open = openParties.filter(
      (party) => party.gameId === game.id && party.filled < party.partySize,
    ).length;
    return { ...game, looking, openParties: open, onlineNow };
  });
}

export function coverGradient(gameId: GameId): string {
  const accents: Record<GameId, [string, string]> = {
    valorant: ["#3a0a12", "#ff4655"],
    dota2: ["#2a0f0c", "#c23c2a"],
    cs2: ["#1c1408", "#de9b35"],
    apex: ["#2a0909", "#da2929"],
    helldivers2: ["#1a1608", "#f4d35e"],
    drg: ["#1a1205", "#f0a202"],
    lol: ["#1a150c", "#c8aa6e"],
    dbd: ["#1a0505", "#e10600"],
    "it-takes-two": ["#0f1a22", "#3d8bfd"],
    lethalcompany: ["#0a120a", "#6b8f3c"],
    phasmophobia: ["#050810", "#1e4d6b"],
    l4d2: ["#140805", "#8b2e0e"],
    remnant2: ["#0c1018", "#3d6b8a"],
  };
  const [from, to] = accents[gameId];
  return `linear-gradient(155deg, ${from} 0%, ${to} 100%)`;
}

export function genreChipLabel(genre: string): string {
  return genre;
}
