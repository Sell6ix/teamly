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
import { regionLabel, voiceLabel } from "@/lib/profile";
import { gameName, personById, playersOfPerson } from "@/lib/people";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function PersonPage({ personId }: { personId: string }) {
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
          <h1 className="font-display text-3xl text-white">Человек не найден</h1>
          <Link href="/people" className="mt-4 inline-block text-sm text-[var(--brand)]">
            ← К каталогу людей
          </Link>
        </main>
      </SiteChrome>
    );
  }

  function toggleBlock() {
    if (blocked) {
      unblockPerson(personId);
      setBlocked(false);
      toast.success(`${person!.name} снова в ленте`);
      return;
    }
    blockPerson(personId, person!.name);
    setBlocked(true);
    toast.success(`${person!.name} скрыт из лент`);
  }

  return (
    <SiteChrome subtle>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        <Link href="/people" className="text-sm text-white/50 hover:text-white">
          ← Люди
        </Link>
        <header className="mt-4 animate-fade-up">
          <h1 className="font-display text-4xl text-white">{person.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/55">
            {person.online ? (
              <span className="text-emerald-300">онлайн</span>
            ) : (
              <span>офлайн</span>
            )}
            {person.region ? <span>· {regionLabel[person.region]}</span> : null}
            {person.voicePlatform ? (
              <span>· {voiceLabel[person.voicePlatform]}</span>
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
              {blocked ? "Убрать из чёрного списка" : "В чёрный список"}
            </Button>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-wide text-white/40">Игры</h2>
          <ul className="mt-3 space-y-3">
            {rows.map((player) => (
              <li
                key={player.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{gameName(player.gameId)}</p>
                    <p className="mt-1 text-sm text-white/50">
                      {player.role} · ищет {player.lookingForSize}
                    </p>
                    <p className="mt-2 text-sm text-white/60">{player.bio}</p>
                  </div>
                  <Link
                    href={`/g/${player.gameId}`}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:border-[var(--brand)]/40"
                  >
                    В лобби
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
