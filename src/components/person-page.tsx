"use client";

import { ProfileLinks } from "@/components/profile-links";
import { SiteChrome } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  blockPerson,
  isBlocked,
  loadBlacklist,
  unblockPerson,
} from "@/lib/blacklist";
import { useT } from "@/lib/i18n/context";
import { gameName, personById, playersOfPerson } from "@/lib/people";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function PersonPage({ personId }: { personId: string }) {
  const t = useT();
  const person = useMemo(() => personById(personId), [personId]);
  const rows = useMemo(() => playersOfPerson(personId), [personId]);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setBlocked(isBlocked(personId, loadBlacklist()));
  }, [personId]);

  if (!person) {
    return (
      <SiteChrome subtle>
        <main className="mx-auto max-w-lg flex-1 px-4 py-16 text-center">
          <h1 className="font-display text-3xl text-foreground">{t("people.notFound")}</h1>
          <Link href="/people" className="mt-4 inline-block text-sm text-[var(--brand)]">
            {t("people.backToPeople")}
          </Link>
        </main>
      </SiteChrome>
    );
  }

  function toggleBlock() {
    if (blocked) {
      unblockPerson(personId);
      setBlocked(false);
      toast.success(t("toast.restored", { name: person!.name }));
      return;
    }
    blockPerson(personId, person!.name);
    setBlocked(true);
    toast.success(t("toast.hidden", { name: person!.name }));
  }

  return (
    <SiteChrome subtle>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        <Link href="/people" className="text-sm text-muted-foreground hover:text-foreground">
          {t("people.back")}
        </Link>
        <header className="mt-4 animate-fade-up">
          <h1 className="font-display text-4xl text-foreground">{person.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {person.online ? (
              <span className="text-emerald-600 dark:text-emerald-300">{t("people.online")}</span>
            ) : (
              <span>{t("people.offline")}</span>
            )}
            {person.region ? <span>· {t(`region.${person.region}`)}</span> : null}
            {person.voicePlatform ? (
              <span>· {t(`voice.${person.voicePlatform}`)}</span>
            ) : null}
            <ProfileLinks
              steamProfileUrl={person.steamProfileUrl}
              discordUrl={person.discordUrl}
              riotTag={person.riotTag}
              faceitUrl={person.faceitUrl}
            />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={blocked ? "outline" : "secondary"}
              data-testid="person-block"
              onClick={toggleBlock}
            >
              {blocked ? t("people.unblock") : t("people.block")}
            </Button>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("people.games")}
          </h2>
          <ul className="mt-3 space-y-3">
            {rows.map((player) => (
              <li
                key={player.id}
                className="rounded-2xl border border-border bg-card/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{gameName(player.gameId)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {player.role} · {t("people.lookingFor", { n: player.lookingForSize })}
                    </p>
                    <p className="mt-2 text-sm text-foreground/80">{player.bio}</p>
                  </div>
                  <Link
                    href={`/g/${player.gameId}`}
                    className="shrink-0 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-foreground/80 transition hover:border-[var(--brand)]/40"
                  >
                    {t("people.toLobby")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteChrome>
  );
}
