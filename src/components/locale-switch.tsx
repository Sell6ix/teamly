"use client";

import { useLocale } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/messages";

const OPTIONS: { id: Locale; label: string }[] = [
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
];

export function LocaleSwitch() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/60 p-0.5"
      data-testid="locale-switch"
      title={t("nav.uiLanguage")}
      aria-label={t("nav.uiLanguage")}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          data-testid={`locale-${option.id}`}
          onClick={() => setLocale(option.id)}
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition ${
            locale === option.id
              ? "bg-[var(--brand)] text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
