"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/context";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export function LoginForm({ discordEnabled }: { discordEnabled: boolean }) {
  const t = useT();
  const [name, setName] = useState("Ivan");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setName(t("login.defaultName"));
  }, [t]);

  async function demoLogin() {
    setPending(true);
    try {
      await signIn("demo", { name, callbackUrl: "/" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {discordEnabled ? (
        <Button
          type="button"
          size="lg"
          className="w-full"
          data-testid="login-discord"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void signIn("discord", { callbackUrl: "/" });
          }}
        >
          {t("login.discord")}
        </Button>
      ) : (
        <p className="rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          {t("login.discordOff")}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
        <label className="block text-xs text-muted-foreground">
          {t("login.demoName")}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--brand)]/50"
            data-testid="login-demo-name"
          />
        </label>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="mt-3 w-full"
          data-testid="login-demo"
          disabled={pending}
          onClick={() => void demoLogin()}
        >
          {t("login.demo")}
        </Button>
      </div>
    </div>
  );
}
