"use client";

import { ProfilePanel } from "@/components/profile-panel";
import { mergeServerBlacklist, type BlacklistEntry } from "@/lib/blacklist";
import { defaultProfile, loadProfile, regionLabel, saveProfile, type UserProfile } from "@/lib/profile";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function SiteChrome({
  children,
  subtle = false,
}: {
  children: React.ReactNode;
  subtle?: boolean;
}) {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetch("/api/me")
      .then((res) => res.json())
      .then(
        (data: { profile?: UserProfile; blacklist?: BlacklistEntry[] }) => {
          if (data.profile) {
            saveProfile(data.profile);
            setProfile(data.profile);
          }
          if (data.blacklist) mergeServerBlacklist(data.blacklist);
        },
      )
      .catch(() => undefined);
  }, [status]);

  const label = session?.user?.name || profile.displayName || "Профиль";

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,107,61,0.18),transparent_68%)] blur-2xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(61,184,255,0.12),transparent_70%)] blur-2xl" />
        <div className="noise-overlay absolute inset-0 opacity-[0.035]" />
      </div>

      <header
        className={`relative z-10 border-b ${
          subtle ? "border-white/6 bg-[#0b0b0d]/55" : "border-white/8 bg-[#0b0b0d]/75"
        } backdrop-blur-xl`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="font-display text-xl tracking-tight text-white sm:text-2xl">
              Teamly
            </span>
            <span className="hidden text-xs text-white/45 sm:inline">Собери пати за минуту</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/55">
            <Link
              href="/people"
              data-testid="nav-people"
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/80 transition hover:border-white/25 hover:text-white"
            >
              Люди
            </Link>
            {status === "authenticated" ? (
              <>
                <button
                  type="button"
                  data-testid="open-profile"
                  onClick={() => setOpen(true)}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/80 transition hover:border-[var(--brand)]/40 hover:text-white"
                >
                  {label}
                </button>
                <button
                  type="button"
                  data-testid="sign-out"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/70 transition hover:text-white"
                >
                  Выйти
                </button>
              </>
            ) : (
              <Link
                href="/login"
                data-testid="nav-login"
                className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/15 px-2 py-1 text-[var(--brand)] transition hover:bg-[var(--brand)]/25"
              >
                Войти
              </Link>
            )}
            <span className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-1 sm:inline">
              {regionLabel[profile.region]}
            </span>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>

      <ProfilePanel open={open} onClose={() => setOpen(false)} onSaved={setProfile} />
    </div>
  );
}
