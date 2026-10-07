import type { Region, VoicePlatform } from "./types";

export type { Region, VoicePlatform };

export const REGIONS: Region[] = ["msk", "eu", "kz", "other"];
export const VOICE_PLATFORMS: VoicePlatform[] = ["discord", "ingame", "any"];

export type UserProfile = {
  displayName: string;
  steamProfileUrl: string;
  discordUrl: string;
  riotTag: string;
  faceitUrl: string;
  region: Region;
  voicePlatform: VoicePlatform;
};

export const regionLabel: Record<Region, string> = {
  msk: "МСК",
  eu: "EU",
  kz: "Казахстан",
  other: "Другой",
};

export const voiceLabel: Record<VoicePlatform, string> = {
  discord: "Discord",
  ingame: "В игре",
  any: "Любой голос",
};

export const PROFILE_STORAGE_KEY = "teamly-profile-v1";

export function defaultProfile(): UserProfile {
  return {
    displayName: "Иван",
    steamProfileUrl: "",
    discordUrl: "",
    riotTag: "",
    faceitUrl: "",
    region: "msk",
    voicePlatform: "discord",
  };
}

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return { ...defaultProfile(), ...parsed };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export type LfpTemplate = {
  id: string;
  label: string;
  note: string;
};

export function lfpTemplatesFor(gameId: string): LfpTemplate[] {
  const common: LfpTemplate[] = [
    {
      id: "need-one",
      label: "Нужен ещё 1",
      note: "Нужен ещё один человек. Голос приветствуется.",
    },
    {
      id: "chill",
      label: "Спокойный вайб",
      note: "Спокойный сбор без токсика. Можно с мемами.",
    },
    {
      id: "tonight",
      label: "Сегодня вечером",
      note: "Собираемся сегодня вечером. Пишите в Discord.",
    },
  ];

  const byGame: Record<string, LfpTemplate[]> = {
    bunker: [
      {
        id: "medic",
        label: "Нужен медик",
        note: "Нужен медик на классику. Без меты про карты.",
      },
      {
        id: "debate",
        label: "Жёсткие дебаты",
        note: "Ищем спорщиков. Голос обязателен.",
      },
    ],
    mafia: [
      {
        id: "host",
        label: "Есть ведущий",
        note: "Ведущий уже есть — набираем стол.",
      },
      {
        id: "town",
        label: "Мирные учатся",
        note: "Мягкий темп для мирных. Разбор после вылета.",
      },
    ],
    dota2: [
      {
        id: "sup5",
        label: "Нужен сап 5",
        note: "Нужен саппорт 5. Разбор после луза ок.",
      },
      {
        id: "carry",
        label: "Нужен керри",
        note: "Свободен керри. Коммуникация в войсе.",
      },
    ],
    valorant: [
      {
        id: "smoke",
        label: "Нужен смоук",
        note: "Нужен смоук / контроль. Без тильта.",
      },
      {
        id: "init",
        label: "Нужен инит",
        note: "Ищем инициатора с лайнапами.",
      },
    ],
    cs2: [
      {
        id: "rifler",
        label: "Нужен рифлер",
        note: "Одно место: рифлер с микро.",
      },
    ],
    lol: [
      {
        id: "jungle",
        label: "Нужен лес",
        note: "Нужны лес и топ. Драконы по таймеру.",
      },
    ],
    lethalcompany: [
      {
        id: "quota",
        label: "Квота без паники",
        note: "Квоту закроем без геройства. Нужны разведка и пилот.",
      },
    ],
    amongus: [
      {
        id: "fair",
        label: "Честные голосования",
        note: "Без друзей-only. Честные голосования.",
      },
    ],
    jackbox: [
      {
        id: "host-pack",
        label: "Хост с пачкой",
        note: "Хост с Party Pack. Заходите с телефона.",
      },
    ],
    gartic: [
      {
        id: "memes",
        label: "Мемный телефон",
        note: "Русский словарь. Рисуем что угодно.",
      },
    ],
    alias: [
      {
        id: "words",
        label: "Быстрые слова",
        note: "Классический Alias. Без иностранных подсказок.",
      },
    ],
    uno: [
      {
        id: "stack",
        label: "Стек +2/+4",
        note: "House rules: стек разрешён. Без тильта на draw 4.",
      },
    ],
    ggd: [
      {
        id: "ducks",
        label: "Утки без токсика",
        note: "Goose Goose Duck. Спокойные голосования.",
      },
    ],
  };

  return [...(byGame[gameId] ?? []), ...common];
}

export const START_SLOTS = [
  { id: "", label: "Без слота" },
  { id: "сегодня 19:00", label: "Сегодня 19:00" },
  { id: "сегодня 21:00", label: "Сегодня 21:00" },
  { id: "сегодня 23:00", label: "Сегодня 23:00" },
  { id: "завтра вечером", label: "Завтра вечером" },
] as const;
