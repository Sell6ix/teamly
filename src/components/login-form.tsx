"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm({ discordEnabled }: { discordEnabled: boolean }) {
  const [name, setName] = useState("Иван");
  const [pending, setPending] = useState(false);

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
          Войти через Discord
        </Button>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
          Discord OAuth выключен. Задайте{" "}
          <code className="text-white/70">AUTH_SECRET</code>,{" "}
          <code className="text-white/70">AUTH_DISCORD_ID</code>,{" "}
          <code className="text-white/70">AUTH_DISCORD_SECRET</code>.
        </p>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="block text-xs text-white/45">
          Демо-имя (SQLite)
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand)]/50"
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
          Войти локально
        </Button>
      </div>
    </div>
  );
}
