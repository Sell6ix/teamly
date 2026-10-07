"use client";

import { Button } from "@/components/ui/button";
import {
  defaultProfile,
  loadProfile,
  regionLabel,
  REGIONS,
  saveProfile,
  voiceLabel,
  VOICE_PLATFORMS,
  type UserProfile,
} from "@/lib/profile";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const fieldClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand)]/50";

export function ProfilePanel({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: (profile: UserProfile) => void;
}) {
  const [draft, setDraft] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    if (open) setDraft(loadProfile());
  }, [open]);

  if (!open) return null;

  function save() {
    saveProfile(draft);
    onSaved?.(draft);
    toast.success("Профиль сохранён");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="profile-title"
        data-testid="profile-panel"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/12 bg-[#141416] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <h2 id="profile-title" className="font-display text-xl text-white">
          Мой профиль
        </h2>
        <p className="mt-1 text-xs text-white/45">
          Демо: сохраняется в этом браузере. Ссылки увидят в пати и при публикации.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-xs text-white/45">
            Имя
            <input
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              className={fieldClass}
              data-testid="profile-name"
            />
          </label>
          <label className="block text-xs text-white/45">
            Steam URL
            <input
              value={draft.steamProfileUrl}
              onChange={(e) => setDraft({ ...draft, steamProfileUrl: e.target.value })}
              placeholder="https://steamcommunity.com/id/…"
              className={fieldClass}
              data-testid="profile-steam"
            />
          </label>
          <label className="block text-xs text-white/45">
            Discord invite / профиль
            <input
              value={draft.discordUrl}
              onChange={(e) => setDraft({ ...draft, discordUrl: e.target.value })}
              placeholder="https://discord.gg/… или discord.com/users/…"
              className={fieldClass}
              data-testid="profile-discord"
            />
          </label>
          <label className="block text-xs text-white/45">
            Riot ID
            <input
              value={draft.riotTag}
              onChange={(e) => setDraft({ ...draft, riotTag: e.target.value })}
              placeholder="Name#TAG"
              className={fieldClass}
              data-testid="profile-riot"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-white/45">
              Регион
              <select
                value={draft.region}
                onChange={(e) =>
                  setDraft({ ...draft, region: e.target.value as UserProfile["region"] })
                }
                className={fieldClass}
                data-testid="profile-region"
              >
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {regionLabel[region]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/45">
              Голос
              <select
                value={draft.voicePlatform}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    voicePlatform: e.target.value as UserProfile["voicePlatform"],
                  })
                }
                className={fieldClass}
                data-testid="profile-voice"
              >
                {VOICE_PLATFORMS.map((voice) => (
                  <option key={voice} value={voice}>
                    {voiceLabel[voice]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" className="flex-1" data-testid="profile-save" onClick={save}>
            Сохранить
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}
