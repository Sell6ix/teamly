import { games, openParties, players } from "./data";
import { hourLabel, playStyleLabel, skillLabel } from "./labels";
import type {
  Game,
  MatchCriteria,
  MatchResult,
  OpenParty,
  PartyMatch,
  Player,
  PlayerMatch,
} from "./types";

function compatibleStyle(playerStyles: Player["playStyles"], wanted: MatchCriteria["playStyle"]) {
  if (playerStyles.includes(wanted)) return "exact";
  if (wanted === "voice" && playerStyles.length > 0) return "soft";
  if (wanted === "casual" && playerStyles.includes("learning")) return "soft";
  if (wanted === "learning" && playerStyles.includes("casual")) return "soft";
  if (wanted === "ranked" && playerStyles.includes("voice")) return "soft";
  return "none";
}

function overlap<T>(a: T[], b: T[]) {
  return a.filter((item) => b.includes(item));
}

export function scorePlayer(player: Player, criteria: MatchCriteria): PlayerMatch | null {
  if (player.gameId !== criteria.gameId) return null;

  const styleFit = compatibleStyle(player.playStyles, criteria.playStyle);
  if (styleFit === "none") return null;

  const hours = overlap(player.hours, criteria.hours);
  if (hours.length === 0) return null;

  const rankGap = Math.abs(player.skill - criteria.skill);
  if (rankGap > 2) return null;

  const reasons: string[] = [];
  let score = 40;

  if (styleFit === "exact") {
    score += 28;
    reasons.push(`Тот же стиль: ${playStyleLabel[criteria.playStyle].toLowerCase()}`);
  } else {
    score += 12;
    reasons.push("Стиль близкий, не идеальный");
  }

  score += Math.max(0, 22 - rankGap * 9);
  if (rankGap === 0) reasons.push(`Уровень совпал: ${skillLabel[player.skill].toLowerCase()}`);
  else reasons.push(`Рядом по уровню (${skillLabel[player.skill]})`);

  score += hours.length * 8;
  reasons.push(`Онлайн: ${hours.map((h) => hourLabel[h].toLowerCase()).join(", ")}`);

  if (player.lookingForSize === criteria.partySize) {
    score += 12;
    reasons.push("Ищет тот же формат пати");
  } else if (Math.abs(player.lookingForSize - criteria.partySize) === 1) {
    score += 4;
  }

  if (criteria.playStyle === "voice" && player.mic) {
    score += 6;
    reasons.push("Микро уже включено");
  }

  if (player.online) {
    score += 8;
    reasons.push("Сейчас в сети");
  }

  return {
    player,
    score: Math.min(99, Math.round(score)),
    reasons,
  };
}

export function scoreParty(party: OpenParty, criteria: MatchCriteria): PartyMatch | null {
  if (party.gameId !== criteria.gameId) return null;
  if (party.partySize !== criteria.partySize) return null;
  if (party.filled >= party.partySize) return null;
  if (party.playStyle !== criteria.playStyle) return null;

  const hours = overlap(party.hours, criteria.hours);
  if (hours.length === 0) return null;

  const rankGap = Math.abs(party.skill - criteria.skill);
  if (rankGap > 2) return null;

  const openSlots = party.partySize - party.filled;
  const reasons: string[] = [
    `Свободно ${openSlots} из ${party.partySize}`,
    `Онлайн: ${hours.map((h) => hourLabel[h].toLowerCase()).join(", ")}`,
  ];

  let score = 50 + Math.max(0, 24 - rankGap * 8) + hours.length * 8;
  if (rankGap === 0) reasons.push("Уровень пати совпадает");
  if (party.micRequired && criteria.playStyle === "voice") {
    score += 6;
    reasons.push("Голосовой сбор");
  }

  return {
    party,
    score: Math.min(99, Math.round(score)),
    reasons,
  };
}

export function matchPeople(criteria: MatchCriteria): MatchResult {
  const playerMatches = players
    .map((player) => scorePlayer(player, criteria))
    .filter((row): row is PlayerMatch => row !== null)
    .sort((a, b) => b.score - a.score || Number(b.player.online) - Number(a.player.online));

  const partyMatches = openParties
    .map((party) => scoreParty(party, criteria))
    .filter((row): row is PartyMatch => row !== null)
    .sort((a, b) => b.score - a.score);

  return { players: playerMatches, parties: partyMatches };
}

export function gameById(id: string): Game | undefined {
  return games.find((game) => game.id === id);
}
