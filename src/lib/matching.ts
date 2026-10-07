import { games, openParties, players } from "./data";
import {
  localizeParty,
  localizePlayer,
  localizeStartsAt,
} from "./demo-locale";
import {
  playerHasRoleTag,
  roleFacetFor,
  roleOptionLabel,
  skillLabelFor,
} from "./game-fields";
import { translate, type Locale } from "./i18n/messages";
import { personIdOf } from "./recent";
import type {
  Game,
  Language,
  MatchCriteria,
  MatchResult,
  OpenParty,
  PartyMatch,
  Player,
  PlayerMatch,
} from "./types";

function localeOf(criteria: MatchCriteria): Locale {
  return criteria.locale === "en" ? "en" : "ru";
}

function t(
  criteria: MatchCriteria,
  key: string,
  vars?: Record<string, string | number>,
) {
  return translate(localeOf(criteria), key, vars);
}

function styleLabel(criteria: MatchCriteria, style: MatchCriteria["playStyle"]) {
  return t(criteria, `style.${style}`).toLowerCase();
}

function hourLabels(criteria: MatchCriteria, hours: MatchCriteria["hours"]) {
  return hours.map((h) => t(criteria, `hour.${h}`).toLowerCase()).join(", ");
}

function effectiveLanguage(
  region?: Player["region"] | OpenParty["region"],
  language?: Language,
): Language {
  if (language) return language;
  if (region === "eu") return "en";
  if (region === "kz") return "kz";
  if (region === "other") return "mixed";
  return "ru";
}

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
  const locale = localeOf(criteria);

  if (styleFit === "exact") {
    score += 28;
    reasons.push(
      t(criteria, "reason.styleExact", { style: styleLabel(criteria, criteria.playStyle) }),
    );
  } else {
    score += 12;
    reasons.push(t(criteria, "reason.styleSoft"));
  }

  const skillName = skillLabelFor(criteria.gameId, player.skill, locale);
  score += Math.max(0, 22 - rankGap * 9);
  if (rankGap === 0) reasons.push(t(criteria, "reason.skillExact", { skill: skillName }));
  else reasons.push(t(criteria, "reason.skillNear", { skill: skillName }));

  score += hours.length * 8;
  reasons.push(t(criteria, "reason.hours", { hours: hourLabels(criteria, hours) }));

  if (player.lookingForSize === criteria.partySize) {
    score += 12;
    reasons.push(t(criteria, "reason.sameSize"));
  } else if (Math.abs(player.lookingForSize - criteria.partySize) === 1) {
    score += 4;
  }

  if (criteria.playStyle === "voice" && player.mic) {
    score += 6;
    reasons.push(t(criteria, "reason.micOn"));
  }

  if (player.online) {
    score += 8;
    reasons.push(t(criteria, "reason.onlineNow"));
  }

  if (criteria.roleTag) {
    if (playerHasRoleTag(player, criteria.roleTag)) {
      score += 28;
      const label = roleOptionLabel(criteria.gameId, criteria.roleTag, locale);
      reasons.unshift(
        label ? t(criteria, "reason.role", { role: label }) : t(criteria, "reason.roleNeeded"),
      );
    } else {
      // Soft miss: keep in list but push well below role hits
      score -= 32;
    }
  }

  if (criteria.region && player.region) {
    if (player.region === criteria.region) {
      score += 10;
      reasons.push(
        t(criteria, "reason.region", { region: t(criteria, `region.${player.region}`) }),
      );
    } else {
      score -= 8;
    }
  }

  if (criteria.voicePlatform && criteria.voicePlatform !== "any" && player.voicePlatform) {
    if (
      player.voicePlatform === criteria.voicePlatform ||
      player.voicePlatform === "any"
    ) {
      score += 8;
      reasons.push(
        t(criteria, "reason.voice", {
          voice: t(criteria, `voice.${player.voicePlatform}`),
        }),
      );
    } else {
      score -= 6;
    }
  }

  if (criteria.language) {
    const lang = effectiveLanguage(player.region, player.language);
    if (lang === criteria.language || lang === "mixed" || criteria.language === "mixed") {
      score += 12;
      reasons.unshift(
        t(criteria, "reason.language", { lang: t(criteria, `lang.${lang}`) }),
      );
    } else {
      score -= 14;
    }
  }

  if (criteria.recentPersonIds?.includes(personIdOf(player))) {
    score += 14;
    reasons.unshift(t(criteria, "reason.recent"));
  }

  return {
    player: localizePlayer(player, localeOf(criteria)),
    score: Math.min(99, Math.max(1, Math.round(score))),
    reasons,
  };
}

export function scoreParty(party: OpenParty, criteria: MatchCriteria): PartyMatch | null {
  if (party.gameId !== criteria.gameId) return null;
  if (party.filled >= party.partySize) return null;

  const sizeGap = Math.abs(party.partySize - criteria.partySize);
  if (sizeGap > 2) return null;

  const styleFit = compatibleStyle([party.playStyle], criteria.playStyle);
  if (styleFit === "none") return null;

  const hours = overlap(party.hours, criteria.hours);
  if (hours.length === 0) return null;

  const rankGap = Math.abs(party.skill - criteria.skill);
  if (rankGap > 2) return null;

  const openSlots = party.partySize - party.filled;
  const locale = localeOf(criteria);
  const reasons: string[] = [
    t(criteria, "reason.openSlots", { open: openSlots, total: party.partySize }),
    t(criteria, "reason.hours", { hours: hourLabels(criteria, hours) }),
  ];

  let score = 50 + Math.max(0, 24 - rankGap * 8) + hours.length * 8;
  if (styleFit === "exact") score += 10;
  else {
    score += 4;
    reasons.push(t(criteria, "reason.styleSoftShort"));
  }
  if (sizeGap === 0) score += 12;
  else {
    score -= sizeGap * 8;
    reasons.push(
      t(criteria, "reason.sizeGap", {
        party: party.partySize,
        wanted: criteria.partySize,
      }),
    );
  }
  if (rankGap === 0) reasons.push(t(criteria, "reason.partySkill"));
  if (party.micRequired && criteria.playStyle === "voice") {
    score += 6;
    reasons.push(t(criteria, "reason.voiceParty"));
  }

  if (criteria.roleTag) {
    const option = roleFacetFor(criteria.gameId, locale)?.options.find(
      (item) => item.id === criteria.roleTag,
    );
    const hay = `${party.name} ${party.note}`.toLowerCase();
    const mentions = option?.keywords.some((keyword) => hay.includes(keyword.toLowerCase()));
    if (mentions && option) {
      score += 10;
      reasons.push(t(criteria, "reason.lookingRole", { role: option.label }));
    }
  }

  if (party.startsAt) {
    score += 4;
    reasons.unshift(
      t(criteria, "reason.starts", {
        when: localizeStartsAt(party.startsAt, locale) ?? party.startsAt,
      }),
    );
  }

  if (criteria.region && party.region) {
    if (party.region === criteria.region) score += 8;
    else score -= 6;
  }

  if (
    criteria.voicePlatform &&
    criteria.voicePlatform !== "any" &&
    party.voicePlatform
  ) {
    if (party.voicePlatform === criteria.voicePlatform || party.voicePlatform === "any") {
      score += 6;
    } else {
      score -= 4;
    }
  }

  if (criteria.language) {
    const lang = effectiveLanguage(party.region, party.language);
    if (lang === criteria.language || lang === "mixed" || criteria.language === "mixed") {
      score += 10;
      reasons.push(
        t(criteria, "reason.language", { lang: t(criteria, `lang.${lang}`) }),
      );
    } else {
      score -= 12;
    }
  }

  return {
    party: localizeParty(party, localeOf(criteria)),
    score: Math.min(99, Math.round(score)),
    reasons,
  };
}

export function matchPeople(
  criteria: MatchCriteria,
  extraParties: OpenParty[] = [],
  extraPlayers: Player[] = [],
): MatchResult {
  const roleTag = criteria.roleTag ?? null;
  const recent = new Set(criteria.recentPersonIds ?? []);
  const blocked = new Set(criteria.blockedPersonIds ?? []);
  const seenPlayers = new Set<string>();
  const playerMatches = [...extraPlayers, ...players]
    .filter((player) => {
      if (seenPlayers.has(player.id)) return false;
      seenPlayers.add(player.id);
      if (blocked.has(personIdOf(player))) return false;
      return true;
    })
    .map((player) => scorePlayer(player, criteria))
    .filter((row): row is PlayerMatch => row !== null)
    .sort((a, b) => {
      if (roleTag) {
        const aRole = playerHasRoleTag(a.player, roleTag) ? 1 : 0;
        const bRole = playerHasRoleTag(b.player, roleTag) ? 1 : 0;
        if (aRole !== bRole) return bRole - aRole;
      }
      const aRecent = recent.has(personIdOf(a.player)) ? 1 : 0;
      const bRecent = recent.has(personIdOf(b.player)) ? 1 : 0;
      if (aRecent !== bRecent) return bRecent - aRecent;
      return b.score - a.score || Number(b.player.online) - Number(a.player.online);
    });

  const byId = new Map<string, OpenParty>();
  for (const party of [...openParties, ...extraParties]) {
    byId.set(party.id, party);
  }

  const partyMatches = [...byId.values()]
    .map((party) => scoreParty(party, criteria))
    .filter((row): row is PartyMatch => row !== null)
    .sort((a, b) => b.score - a.score);

  return { players: playerMatches, parties: partyMatches };
}

export function gameById(id: string): Game | undefined {
  return games.find((game) => game.id === id);
}
