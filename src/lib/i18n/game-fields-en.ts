import type { GameId, SkillLevel } from "@/lib/types";

const generic: Record<SkillLevel, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Solid",
  4: "High",
  5: "Pro",
};

/** English skill chip labels per game (fallback: generic). */
export const skillLabelsEn: Partial<Record<GameId, Record<SkillLevel, string>>> = {
  valorant: {
    1: "Iron–Bronze",
    2: "Silver–Gold",
    3: "Platinum",
    4: "Diamond–Immo",
    5: "Radiant",
  },
  dota2: {
    1: "<2k MMR",
    2: "2–4k MMR",
    3: "4–6k MMR",
    4: "6–8k MMR",
    5: "8k+ MMR",
  },
  cs2: {
    1: "Silver",
    2: "Gold Nova",
    3: "MG–DMG",
    4: "LE–Supreme",
    5: "Global / Faceit",
  },
  bunker: {
    1: "First game",
    2: "Know the rules",
    3: "Confident table",
    4: "Hard debates",
    5: "Host / veteran",
  },
  mafia: {
    1: "First table",
    2: "Know roles",
    3: "Confident",
    4: "Reads the table",
    5: "Host",
  },
  gartic: {
    1: "Scribbles",
    2: "Readable",
    3: "Decent art",
    4: "Fast guesser",
    5: "Artist",
  },
};

export const roleLabelEn: Record<string, string> = {
  duelist: "Duelist",
  initiator: "Initiator",
  controller: "Controller",
  sentinel: "Sentinel",
  carry: "Carry",
  mid: "Mid",
  offlane: "Offlane",
  soft: "Soft support",
  hard: "Hard support",
  awper: "AWPer",
  rifler: "Rifler",
  support: "Support",
  igl: "IGL",
  assault: "Assault",
  recon: "Recon",
  tank: "Tank",
  orbital: "Orbital",
  newbie: "Newbie",
  driller: "Driller",
  engineer: "Engineer",
  gunner: "Gunner",
  scout: "Scout",
  top: "Top",
  jungle: "Jungle",
  adc: "ADC",
  survivor: "Survivor",
  killer: "Killer",
  loot: "Loot",
  driver: "Pilot",
  evidence: "Evidence",
  ghost: "Ghost",
  debate: "Debater",
  medic: "Medic",
  town: "Town",
  mafia: "Mafia",
  host: "Host",
  crew: "Crewmate",
  impostor: "Impostor",
  drawer: "Drawer",
  guesser: "Guesser",
  stack: "Stacker",
  chill: "Chill",
  goose: "Goose",
  duck: "Duck",
  dps: "DPS",
  explorer: "Explorer",
};

export const roleFacetLabelEn: Record<string, string> = {
  Роль: "Role",
  Позиция: "Position",
  Фокус: "Focus",
  Класс: "Class",
  Линия: "Lane",
  Сторона: "Side",
  Архетип: "Archetype",
  Стиль: "Style",
};

export function skillLabelEn(gameId: GameId, skill: SkillLevel): string {
  return skillLabelsEn[gameId]?.[skill] ?? generic[skill];
}
