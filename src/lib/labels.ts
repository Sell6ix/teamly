import type { HourWindow, PlayStyle, SkillLevel } from "./types";

export const playStyleLabel: Record<PlayStyle, string> = {
  casual: "Казуал",
  ranked: "Рейтинг",
  learning: "Обучение",
  voice: "С микро",
  speedrun: "Спидран",
};

export const playStyleHint: Record<PlayStyle, string> = {
  casual: "Без давления, можно шутить и вайпать",
  ranked: "Играем на победу и закрываем ранг",
  learning: "Разбираем ошибки, учим роли и связки",
  voice: "Голос в дискорде обязателен",
  speedrun: "Чёткие тайминги, минимум оффтопа",
};

export const hourLabel: Record<HourWindow, string> = {
  morning: "Утро",
  day: "День",
  evening: "Вечер",
  night: "Ночь",
};

export const hourRange: Record<HourWindow, string> = {
  morning: "07:00–12:00 МСК",
  day: "12:00–18:00 МСК",
  evening: "18:00–23:00 МСК",
  night: "23:00–04:00 МСК",
};

export const skillLabel: Record<SkillLevel, string> = {
  1: "Новичок",
  2: "Средний",
  3: "Уверенный",
  4: "Высокий",
  5: "Про",
};

export const partySizeLabel: Record<number, string> = {
  2: "Дуо",
  3: "Трио",
  4: "Сквад",
  5: "Пятёрка",
  6: "6 игроков",
  8: "8 игроков",
  10: "10 игроков",
  12: "12 игроков",
};

export function formatHours(hours: HourWindow[]): string {
  return hours.map((h) => hourLabel[h]).join(" · ");
}
