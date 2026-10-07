"use client";

import { Button } from "@/components/ui/button";
import {
  defaultProfile,
  languageLabel,
  LANGUAGES,
  loadProfile,
  regionLabel,
  REGIONS,
  saveProfile,
  voiceLabel,
  VOICE_PLATFORMS,
  type UserProfile,
} from "@/lib/profile";
import { useSession } from "next-auth/react";
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
  const { status } = useSession();
  const [draft, setDraft] = useState<UserProfile>(defaultProfile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (status === "authenticated") {
      void fetch("/api/me")
        .then((res) => res.json())
        .then((data: { profile?: UserProfile }) => {
          if (data.profile) {
            setDraft(data.profile);
            saveProfile(data.profile);
          } else setDraft(loadProfile());
        })
        .catch(() => setDraft(loadProfile()));
      return;
    }
    setDraft(loadProfile());
  }, [open, status]);

  if (!open) return null;

  async function save() {
    setSaving(true);
    try {
      saveProfile(draft);
      if (status === "authenticated") {
        const response = await fetch("/api/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        if (!response.ok) {
          toast.error("Не удалось сохранить в БД");
          return;
        }
        const data = (await response.json()) as { profile?: UserProfile };
        if (data.profile) {
          saveProfile(data.profile);
          onSaved?.(data.profile);
        } else onSaved?.(draft);
      } else {
        onSaved?.(draft);
      }
      toast.success("Профиль сохранён");
      onClose();
    } finally {
      setSaving(false);
    }
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
          {status === "authenticated"
            ? "Сохраняется в SQLite на сервере."
            : "Локально в браузере. Войдите — профиль уедет в БД."}
        </p>
        {draft.accountId ? (
          <p className="mt-2 font-mono text-[11px] text-white/35" data-testid="profile-account-id">
            id · {draft.accountId}
          </p>
        ) : null}

        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
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
            Discord webhook (опционально)
            <input
              value={draft.discordWebhookUrl}
              onChange={(e) =>
                setDraft({ ...draft, discordWebhookUrl: e.target.value })
              }
              placeholder="https://discord.com/api/webhooks/…"
              className={fieldClass}
              data-testid="profile-discord-webhook"
            />
            <span className="mt-1 block text-[11px] text-white/35">
              Либо webhook здесь, либо бот через DISCORD_BOT_TOKEN + канал в env.
            </span>
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
          <label className="block text-xs text-white/45">
            Faceit URL
            <input
              value={draft.faceitUrl}
              onChange={(e) => setDraft({ ...draft, faceitUrl: e.target.value })}
              placeholder="https://www.faceit.com/en/players/…"
              className={fieldClass}
              data-testid="profile-faceit"
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
          <label className="block text-xs text-white/45">
            Язык в пати
            <select
              value={draft.language}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  language: e.target.value as UserProfile["language"],
                })
              }
              className={fieldClass}
              data-testid="profile-language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {languageLabel[lang]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            className="flex-1"
            data-testid="profile-save"
            disabled={saving}
            onClick={() => void save()}
          >
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
