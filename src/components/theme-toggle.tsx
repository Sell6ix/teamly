"use client";

import { useT } from "@/lib/i18n/context";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useT();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  const dark = (resolvedTheme ?? theme) !== "light";

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      disabled={!ready}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="rounded-md border border-border bg-secondary/60 px-2 py-1 text-foreground/80 transition hover:border-foreground/25 hover:text-foreground"
      title={dark ? t("nav.themeLight") : t("nav.themeDark")}
      aria-label={dark ? t("nav.themeLight") : t("nav.themeDark")}
    >
      {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  );
}
