import {
  roleFacetLabelEn,
  roleLabelEn,
  skillLabelEn,
} from "@/lib/i18n/game-fields-en";
import type { Locale } from "@/lib/i18n/messages";
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
      1: "Rookie–Bronze",
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
  lethalcompany: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первый контракт",
      2: "Знаю двери",
      3: "Квоты без паники",
      4: "Опытный",
      5: "Моод-раннер",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "scout", label: "Разведка", keywords: ["развед", "scout", "фонарик"] },
        { id: "loot", label: "Лут", keywords: ["лут", "scrap", "квота"] },
        { id: "driver", label: "Пилот", keywords: ["пилот", "ship", "корабл"] },
        { id: "newbie", label: "Новичок", keywords: ["новичок", "первый"] },
      ],
    },
  },
  phasmophobia: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Amateur",
      2: "Intermediate",
      3: "Professional",
      4: "Nightmare",
      5: "Insanity",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "evidence", label: "Улики", keywords: ["улик", "evidence", "emf", "термо"] },
        { id: "hunt", label: "Охота", keywords: ["охот", "hunt", "crucifix"] },
        { id: "tech", label: "Техника", keywords: ["камера", "датчик", "tech"] },
        { id: "newbie", label: "Новичок", keywords: ["новичок", "первый"] },
      ],
    },
  },
  l4d2: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: {
      1: "Easy",
      2: "Normal",
      3: "Advanced",
      4: "Expert",
      5: "Realism / Versus",
    },
    roleFacet: {
      label: "Фокус",
      options: [
        { id: "survivor", label: "Выживший", keywords: ["выживш", "survivor", "campaign"] },
        { id: "infected", label: "Заражённый", keywords: ["зараж", "infected", "versus", "tank"] },
        { id: "support", label: "Медик", keywords: ["медик", "хил", "аптеч"] },
      ],
    },
  },
  remnant2: {
    playStyles: ["casual", "ranked", "learning", "voice"],
    skillLabels: {
      1: "Survivor",
      2: "Veteran",
      3: "Nightmare",
      4: "Apocalypse",
      5: "Hardcore",
    },
    roleFacet: {
      label: "Архетип",
      options: [
        { id: "tank", label: "Танк", keywords: ["танк", "handler", "challenger"] },
        { id: "dps", label: "ДПС", keywords: ["дпс", "gunslinger", "hunter", "damage"] },
        { id: "support", label: "Саппорт", keywords: ["саппорт", "medic", "хил"] },
        { id: "explorer", label: "Исследователь", keywords: ["исследова", "секрет", "explorer"] },
      ],
    },
  },
  bunker: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первая партия",
      2: "Знаю правила",
      3: "Уверенный стол",
      4: "Жёсткие дебаты",
      5: "Ведущий / опытный",
    },
    roleFacet: {
      label: "Фокус",
      options: [
        { id: "debate", label: "Спорщик", keywords: ["спор", "харизм", "дебат", "капитан"] },
        { id: "medic", label: "Медик", keywords: ["медик"] },
        { id: "engineer", label: "Инженер", keywords: ["инженер"] },
        { id: "newbie", label: "Новичок", keywords: ["новичок", "первая", "учусь"] },
      ],
    },
  },
  mafia: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первый стол",
      2: "Знаю роли",
      3: "Уверенный",
      4: "Читаю стол",
      5: "Ведущий",
    },
    roleFacet: {
      label: "Сторона",
      options: [
        { id: "town", label: "Мирный", keywords: ["мирн", "шериф", "доктор"] },
        { id: "mafia", label: "Мафия", keywords: ["мафия", "дон", "чёрн"] },
        { id: "host", label: "Ведущий", keywords: ["ведущ"] },
        { id: "newbie", label: "Новичок", keywords: ["новичок", "учусь"] },
      ],
    },
  },
  amongus: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первый раз",
      2: "Знаю задачи",
      3: "Уверенный",
      4: "Читаю голосования",
      5: "Хост кастомок",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "crew", label: "Crewmate", keywords: ["crew", "экипаж", "задач"] },
        { id: "impostor", label: "Impostor", keywords: ["impost", "предател", "сус"] },
        { id: "host", label: "Хост", keywords: ["хост", "host"] },
      ],
    },
  },
  gartic: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Каляки",
      2: "Понятно",
      3: "Норм рисую",
      4: "Мем-мастер",
      5: "Художник",
    },
    roleFacet: {
      label: "Фокус",
      options: [
        { id: "draw", label: "Художник", keywords: ["художник", "рису"] },
        { id: "guess", label: "Угадывает", keywords: ["угадыв", "чат"] },
        { id: "host", label: "Хост", keywords: ["хост"] },
      ],
    },
  },
  jackbox: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первый пак",
      2: "Знаю Quiplash",
      3: "Свой стол",
      4: "Хост вечеринок",
      5: "Все паки",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "host", label: "Хост", keywords: ["хост", "пачк", "pack"] },
        { id: "player", label: "Игрок", keywords: ["игрок", "телефон", "fibbage", "quiplash"] },
      ],
    },
  },
  codenames: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первая партия",
      2: "Знаю правила",
      3: "Уверенный",
      4: "Сильные ассоциации",
      5: "Капитан-про",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "captain", label: "Капитан", keywords: ["капитан", "подсказ"] },
        { id: "operative", label: "Оперативник", keywords: ["оператив", "угадыв"] },
      ],
    },
  },
  alias: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первый раз",
      2: "Знаю правила",
      3: "Быстрый темп",
      4: "Сильные ассоциации",
      5: "Ведущий стола",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "explain", label: "Объясняет", keywords: ["объясн", "словоед"] },
        { id: "guess", label: "Угадывает", keywords: ["угадыв"] },
      ],
    },
  },
  uno: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первая партия",
      2: "Знаю карты",
      3: "House rules",
      4: "Быстрый стол",
      5: "Турнирный вайб",
    },
    roleFacet: {
      label: "Стиль",
      options: [
        { id: "stack", label: "Стекер", keywords: ["стек", "draw", "+2", "+4"] },
        { id: "chill", label: "Казуал", keywords: ["казуал", "телефон"] },
      ],
    },
  },
  ggd: {
    playStyles: ["casual", "learning", "voice"],
    skillLabels: {
      1: "Первый раз",
      2: "Знаю задачи",
      3: "Уверенный",
      4: "Читаю голосования",
      5: "Хост кастомок",
    },
    roleFacet: {
      label: "Роль",
      options: [
        { id: "goose", label: "Гусь", keywords: ["гусь", "goose"] },
        { id: "duck", label: "Утка", keywords: ["утк", "duck"] },
        { id: "host", label: "Хост", keywords: ["хост", "host"] },
      ],
    },
  },
};

export function skillLabelFor(
  gameId: GameId,
  skill: SkillLevel,
  locale: Locale = "ru",
): string {
  if (locale === "en") return skillLabelEn(gameId, skill);
  return gameFields[gameId].skillLabels[skill];
}

export function playStylesFor(gameId: GameId): PlayStyle[] {
  return gameFields[gameId].playStyles;
}

export function roleFacetFor(gameId: GameId, locale: Locale = "ru") {
  const facet = gameFields[gameId].roleFacet;
  if (!facet || locale !== "en") return facet;
  return {
    label: roleFacetLabelEn[facet.label] ?? facet.label,
    options: facet.options.map((opt) => ({
      ...opt,
      label: roleLabelEn[opt.id] ?? opt.label,
    })),
  };
}

export function roleOptionLabel(
  gameId: GameId,
  tagId: string | null | undefined,
  locale: Locale = "ru",
): string | null {
  if (!tagId) return null;
  return roleFacetFor(gameId, locale)?.options.find((opt) => opt.id === tagId)?.label ?? null;
}

export function playerHasRoleTag(player: Player, tagId: string): boolean {
  const facet = roleFacetFor(player.gameId);
  const option = facet?.options.find((opt) => opt.id === tagId);
  if (!option) return false;
  const hay = `${player.role} ${player.bio}`.toLowerCase();
  return option.keywords.some((keyword) => hay.includes(keyword.toLowerCase()));
}
