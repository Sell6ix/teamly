"use client";

import { LocaleSwitch } from "@/components/locale-switch";
import { ProfilePanel } from "@/components/profile-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { useT } from "@/lib/i18n/context";
import { mergeServerBlacklist, type BlacklistEntry } from "@/lib/blacklist";
import {
  defaultProfile,
  loadProfile,
  saveProfile,
  type UserProfile,
} from "@/lib/profile";
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
  const t = useT();
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

  const label = session?.user?.name || profile.displayName || t("nav.profile");

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,107,61,0.18),transparent_68%)] blur-2xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(61,184,255,0.12),transparent_70%)] blur-2xl" />
        <div className="noise-overlay absolute inset-0 opacity-[0.035]" />
      </div>

      <header
        className={`relative z-10 border-b ${
          subtle
            ? "border-border/60 bg-background/55"
            : "border-border bg-background/75"
        } backdrop-blur-xl`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <Link href="/" className="group min-w-0 shrink truncate">
            <span className="font-display text-lg tracking-tight text-foreground sm:text-2xl">
              Teamly
            </span>
            <span className="ml-3 hidden text-xs text-muted-foreground md:inline">
              {t("brand.tagline")}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs">
            <LocaleSwitch />
            <ThemeToggle />
            <Link
              href="/people"
              data-testid="nav-people"
              className="rounded-md border border-border bg-secondary/60 px-1.5 py-1 text-foreground/80 transition hover:border-foreground/25 hover:text-foreground sm:px-2"
            >
              {t("nav.people")}
            </Link>
            {status === "authenticated" ? (
              <>
                <button
                  type="button"
                  data-testid="open-profile"
                  onClick={() => setOpen(true)}
                  className="max-w-[7rem] truncate rounded-md border border-border bg-secondary/60 px-1.5 py-1 text-foreground/80 transition hover:border-[var(--brand)]/40 hover:text-foreground sm:max-w-[10rem] sm:px-2"
                >
                  {label}
                </button>
                <button
                  type="button"
                  data-testid="sign-out"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  className="rounded-md border border-border bg-secondary/60 px-1.5 py-1 text-foreground/70 transition hover:text-foreground sm:px-2"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                data-testid="nav-login"
                className="rounded-md border border-[var(--brand)]/40 bg-[var(--brand)]/15 px-1.5 py-1 text-[var(--brand)] transition hover:bg-[var(--brand)]/25 sm:px-2"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>

      <ProfilePanel open={open} onClose={() => setOpen(false)} onSaved={setProfile} />
    </div>
  );
}
