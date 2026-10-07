"use client";

import { useT } from "@/lib/i18n/context";

export function LoginCopy() {
  const t = useT();
  return (
    <>
      <h1 className="font-display text-4xl text-foreground">{t("login.title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("login.lead")}</p>
    </>
  );
}
