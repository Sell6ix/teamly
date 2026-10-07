import { youName } from "./demo-locale";
import { UI_LOCALE_KEY, type Locale } from "./i18n/messages";
import type { Language, Region, VoicePlatform } from "./types";
import { LANGUAGES } from "./types";

function storedUiLocale(): Locale {
  if (typeof window === "undefined") return "ru";
  const raw = window.localStorage.getItem(UI_LOCALE_KEY);
  return raw === "en" ? "en" : "ru";
}

export type { Language, Region, VoicePlatform };
export { LANGUAGES };

export const REGIONS: Region[] = ["msk", "eu", "kz", "other"];
export const VOICE_PLATFORMS: VoicePlatform[] = ["discord", "ingame", "any"];

export type UserProfile = {
  /** Stable local demo account id (not a real login). */
  accountId: string;
  displayName: string;
  steamProfileUrl: string;
  discordUrl: string;
  riotTag: string;
  faceitUrl: string;
  region: Region;
  voicePlatform: VoicePlatform;
  language: Language;
  /** Optional Discord incoming webhook — confirm posts the party brief there. */
  discordWebhookUrl: string;
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

export const languageLabel: Record<Language, string> = {
  ru: "Русский",
  en: "English",
  ua: "Українська",
  kz: "Қазақша",
  mixed: "Микс",
};

export const PROFILE_STORAGE_KEY = "teamly-profile-v1";

export function defaultProfile(): UserProfile {
  return {
    accountId: "",
    displayName: youName(storedUiLocale()),
    steamProfileUrl: "",
    discordUrl: "",
    riotTag: "",
    faceitUrl: "",
    region: "msk",
    voicePlatform: "discord",
    language: "ru",
    discordWebhookUrl: "",
  };
}

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    const merged = { ...defaultProfile(), ...parsed };
    if (!merged.accountId) {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `acc-${crypto.randomUUID().slice(0, 8)}`
          : `acc-${Math.random().toString(36).slice(2, 10)}`;
      merged.accountId = id;
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
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

const lfpRu: Record<string, LfpTemplate[]> = {
  common: [
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
  ],
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
  "it-takes-two": [
    {
      id: "duo",
      label: "Ищу пару",
      note: "Ищу пару на вечер. Без спидрана, можно подсказывать.",
    },
  ],
};

const lfpEn: Record<string, LfpTemplate[]> = {
  common: [
    {
      id: "need-one",
      label: "Need one more",
      note: "Need one more person. Voice welcome.",
    },
    {
      id: "chill",
      label: "Chill vibe",
      note: "Chill lobby, no toxicity. Memes OK.",
    },
    {
      id: "tonight",
      label: "Tonight",
      note: "Gathering tonight. Ping in Discord.",
    },
  ],
  bunker: [
    {
      id: "medic",
      label: "Need medic",
      note: "Need a medic for classic. No card meta spoilers.",
    },
    {
      id: "debate",
      label: "Hard debates",
      note: "Looking for debaters. Voice required.",
    },
  ],
  mafia: [
    {
      id: "host",
      label: "Host ready",
      note: "Host is ready — filling the table.",
    },
    {
      id: "town",
      label: "Town learning",
      note: "Soft pace for town. Review after deaths.",
    },
  ],
  dota2: [
    {
      id: "sup5",
      label: "Need pos 5",
      note: "Need a pos 5 support. Post-loss review OK.",
    },
    {
      id: "carry",
      label: "Need carry",
      note: "Carry open. Voice comms.",
    },
  ],
  valorant: [
    {
      id: "smoke",
      label: "Need smoke",
      note: "Need smoke / control. No tilt.",
    },
    {
      id: "init",
      label: "Need initiator",
      note: "Looking for an initiator with lineups.",
    },
  ],
  cs2: [
    {
      id: "rifler",
      label: "Need rifler",
      note: "One seat: rifler with mic.",
    },
  ],
  lol: [
    {
      id: "jungle",
      label: "Need jungle",
      note: "Need jungle and top. Dragons on timer.",
    },
  ],
  lethalcompany: [
    {
      id: "quota",
      label: "Quota, no panic",
      note: "We’ll hit quota without hero plays. Need scout and pilot.",
    },
  ],
  amongus: [
    {
      id: "fair",
      label: "Fair votes",
      note: "No friends-only. Fair votes.",
    },
  ],
  jackbox: [
    {
      id: "host-pack",
      label: "Host has pack",
      note: "Host has Party Pack. Join from your phone.",
    },
  ],
  gartic: [
    {
      id: "memes",
      label: "Meme telephone",
      note: "English dictionary. Draw anything.",
    },
  ],
  alias: [
    {
      id: "words",
      label: "Fast words",
      note: "Classic Alias. No foreign-language hints.",
    },
  ],
  uno: [
    {
      id: "stack",
      label: "Stack +2/+4",
      note: "House rules: stacking allowed. No tilt on draw 4.",
    },
  ],
  ggd: [
    {
      id: "ducks",
      label: "Ducks, no toxicity",
      note: "Goose Goose Duck. Calm votes.",
    },
  ],
  "it-takes-two": [
    {
      id: "duo",
      label: "Looking for duo",
      note: "Looking for a partner tonight. No speedrun; hints OK.",
    },
  ],
};

export function lfpTemplatesFor(
  gameId: string,
  locale: Locale = "ru",
): LfpTemplate[] {
  const pack = locale === "en" ? lfpEn : lfpRu;
  return [...(pack[gameId] ?? []), ...(pack.common ?? [])];
}

export const START_SLOTS = [
  { id: "", label: "Без слота" },
  { id: "сегодня 19:00", label: "Сегодня 19:00" },
  { id: "сегодня 21:00", label: "Сегодня 21:00" },
  { id: "сегодня 23:00", label: "Сегодня 23:00" },
  { id: "завтра вечером", label: "Завтра вечером" },
] as const;
