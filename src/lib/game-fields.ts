import type { GameId, PlayStyle, Player, SkillLevel } from "./types";

export type RoleOption = {
  id: string;
  label: string;
  /** Case-insensitive fragments matched against role + bio */
  keywords: string[];
};

export type GameFields = {
  playStyles: PlayStyle[];
  skillLabels: Record<SkillLevel, string>;
  roleFacet?: {
    label: string;
    options: RoleOption[];
  };
};

const genericSkill: Record<SkillLevel, string> = {
  1: "Новичок",
  2: "Средний",
  3: "Уверенный",
  4: "Высокий",
  5: "Про",
};

export const gameFields: Record<GameId, GameFields> = {
  valorant: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: {
      1: "Железо–Бронза",
      2: "Сильвер–Золото",
      3: "Платина",
      4: "Алмаз–Иммо",
      5: "Радиант",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "duelist", label: "Дуэлист", keywords: ["дуэлист", "jett", "reyna", "raze", "phoenix", "neon", "iso"] },
        { id: "initiator", label: "Инициатор", keywords: ["инициатор", "инит", "sova", "fade", "skye", "breach", "kayo", "tejo"] },
        { id: "controller", label: "Смоук", keywords: ["контроль", "смоук", "omen", "brim", "viper", "astra", "clove", "harbor"] },
        { id: "sentinel", label: "Страж", keywords: ["страж", "killjoy", "cypher", "sage", "chamber", "deadlock", "vyse"] },
      ],
    },
  },
  dota2: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: {
      1: "<2k MMR",
      2: "2–4k",
      3: "4–6k",
      4: "6–8k",
      5: "8k+",
    },
    roleFacet: {
      label: "Позиция",
      options: [
        { id: "carry", label: "Керри", keywords: ["керри", "carry", "pos 1", "1 позиция"] },
        { id: "mid", label: "Мид", keywords: ["мид", "mid"] },
        { id: "offlane", label: "Оффлейн", keywords: ["офф", "offlane", "pos 3"] },
        { id: "soft", label: "Сап 4", keywords: ["саппорт 4", "soft", "pos 4", "4 позиция"] },
        { id: "hard", label: "Сап 5", keywords: ["саппорт 5", "hard", "pos 5", "5 позиция", "вард"] },
      ],
    },
  },
  cs2: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: {
      1: "Калибровка",
      2: "Premier ~10k",
      3: "Premier ~15k",
      4: "Premier ~18k",
      5: "Premier 20k+",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "awper", label: "Снайпер", keywords: ["снайпер", "awp"] },
        { id: "rifler", label: "Рифлер", keywords: ["рифлер", "раш", "entry"] },
        { id: "support", label: "Саппорт", keywords: ["саппорт", "support"] },
        { id: "igl", label: "IGL", keywords: ["igl", "капитан", "страт"] },
      ],
    },
  },
  apex: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: {
      1: "Рookie–Bronze",
      2: "Silver–Gold",
      3: "Platinum",
      4: "Diamond",
      5: "Master+",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "assault", label: "Штурм", keywords: ["штурм", "скаут", "wraith", "octane", "horizon"] },
        { id: "support", label: "Саппорт", keywords: ["саппорт", "lifeline", "gibraltar", "loba"] },
        { id: "recon", label: "Разведка", keywords: ["развед", "bloodhound", "seer", "crypto"] },
        { id: "tank", label: "Танк", keywords: ["танк", "gibby", "newcastle", "caustic"] },
      ],
    },
  },
  helldivers2: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: {
      1: "Сложность 1–3",
      2: "Сложность 4–5",
      3: "Сложность 6–7",
      4: "Сложность 8–9",
      5: "Хелдайв 10",
    },
    roleFacet: {
      label: "Фокус",
      options: [
        { id: "assault", label: "Штурм", keywords: ["штурм"] },
        { id: "orbital", label: "Орбиталь", keywords: ["орбиталь", "стратаг"] },
        { id: "newbie", label: "Новичок", keywords: ["новичок"] },
      ],
    },
  },
  drg: {
    playStyles: ["casual", "learning", "voice", "speedrun"],
    skillLabels: {
      1: "Hazard 1–2",
      2: "Hazard 3",
      3: "Hazard 4",
      4: "Hazard 5",
      5: "EDD / deep dive",
    },
    roleFacet: {
      label: "Класс",
      options: [
        { id: "driller", label: "Бурильщик", keywords: ["бурильщик", "driller"] },
        { id: "engineer", label: "Инженер", keywords: ["инженер", "engineer", "платформ"] },
        { id: "gunner", label: "Пулемётчик", keywords: ["пулемёт", "gunner"] },
        { id: "scout", label: "Скаут", keywords: ["скаут", "scout"] },
      ],
    },
  },
  lol: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: {
      1: "Железо–Бронза",
      2: "Сильвер–Золото",
      3: "Платина",
      4: "Изумруд–Алмаз",
      5: "Мастер+",
    },
    roleFacet: {
      label: "Линия",
      options: [
        { id: "top", label: "Топ", keywords: ["топ", "top"] },
        { id: "jungle", label: "Лес", keywords: ["лес", "jungle", "jung"] },
        { id: "mid", label: "Мид", keywords: ["мид", "mid", "ари"] },
        { id: "adc", label: "АДК", keywords: ["адк", "adc", "bot", "керри"] },
        { id: "support", label: "Саппорт", keywords: ["саппорт", "support", "лютик"] },
      ],
    },
  },
  dbd: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: genericSkill,
    roleFacet: {
      label: "Сторона",
      options: [
        { id: "survivor", label: "Выживший", keywords: ["выживш", "survivor", "ген", "мег", "dwight"] },
        { id: "killer", label: "Маньяк", keywords: ["маньяк", "killer", "huntress", "убийц"] },
      ],
    },
  },
  "it-takes-two": {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первый раз",
      2: "Знакомы с игрой",
      3: "Проходили",
      4: "Ищем всё",
      5: "Спидран-вайб",
    },
  },
};

export function skillLabelFor(gameId: GameId, skill: SkillLevel): string {
  return gameFields[gameId].skillLabels[skill];
}

export function playStylesFor(gameId: GameId): PlayStyle[] {
  return gameFields[gameId].playStyles;
}

export function roleFacetFor(gameId: GameId) {
  return gameFields[gameId].roleFacet;
}

export function roleOptionLabel(gameId: GameId, tagId: string | null | undefined): string | null {
  if (!tagId) return null;
  return roleFacetFor(gameId)?.options.find((opt) => opt.id === tagId)?.label ?? null;
}

export function playerHasRoleTag(player: Player, tagId: string): boolean {
  const facet = roleFacetFor(player.gameId);
  const option = facet?.options.find((opt) => opt.id === tagId);
  if (!option) return false;
  const hay = `${player.role} ${player.bio}`.toLowerCase();
  return option.keywords.some((keyword) => hay.includes(keyword.toLowerCase()));
}
