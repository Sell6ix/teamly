"use client";

import { LocaleSwitch } from "@/components/locale-switch";
import { Button } from "@/components/ui/button";
import { normalizeDiscordWebhookUrl } from "@/lib/discord";
import { useT } from "@/lib/i18n/context";
import {
  defaultProfile,
  LANGUAGES,
  loadProfile,
  REGIONS,
  saveProfile,
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
  const t = useT();
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
      const rawWebhook = draft.discordWebhookUrl.trim();
      const webhook = rawWebhook ? normalizeDiscordWebhookUrl(rawWebhook) : "";
      if (rawWebhook && !webhook) {
        toast.error(t("profile.webhookInvalid"));
        return;
      }
      const next = { ...draft, discordWebhookUrl: webhook };
      setDraft(next);
      saveProfile(next);
      if (status === "authenticated") {
        const response = await fetch("/api/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!response.ok) {
          toast.error(t("profile.saveFail"));
          return;
        }
        const data = (await response.json()) as { profile?: UserProfile };
        if (data.profile) {
          saveProfile(data.profile);
          onSaved?.(data.profile);
        } else onSaved?.(next);
      } else {
        onSaved?.(next);
      }
      toast.success(t("profile.saved"));
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
        aria-label={t("profile.close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="profile-title"
        data-testid="profile-panel"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/12 bg-[#141416] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <h2 id="profile-title" className="font-display text-xl text-white">
          {t("profile.title")}
        </h2>
        <p className="mt-1 text-xs text-white/45">
          {status === "authenticated" ? t("profile.serverHint") : t("profile.localHint")}
        </p>
        {draft.accountId ? (
          <p className="mt-2 font-mono text-[11px] text-white/35" data-testid="profile-account-id">
            id · {draft.accountId}
          </p>
        ) : null}

        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2">
            <span className="text-xs text-white/45">{t("profile.uiLanguage")}</span>
            <LocaleSwitch />
          </div>
          <label className="block text-xs text-white/45">
            {t("profile.name")}
            <input
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              className={fieldClass}
              data-testid="profile-name"
            />
          </label>
          <label className="block text-xs text-white/45">
            {t("profile.steam")}
            <input
              value={draft.steamProfileUrl}
              onChange={(e) => setDraft({ ...draft, steamProfileUrl: e.target.value })}
              placeholder="https://steamcommunity.com/id/…"
              className={fieldClass}
              data-testid="profile-steam"
            />
          </label>
          <label className="block text-xs text-white/45">
            {t("profile.discord")}
            <input
              value={draft.discordUrl}
              onChange={(e) => setDraft({ ...draft, discordUrl: e.target.value })}
              placeholder="https://discord.gg/… / discord.com/users/…"
              className={fieldClass}
              data-testid="profile-discord"
            />
          </label>
          <label className="block text-xs text-white/45">
            {t("profile.webhook")}
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
              {t("profile.webhookHint")}
            </span>
          </label>
          <label className="block text-xs text-white/45">
            {t("profile.riot")}
            <input
              value={draft.riotTag}
              onChange={(e) => setDraft({ ...draft, riotTag: e.target.value })}
              placeholder="Name#TAG"
              className={fieldClass}
              data-testid="profile-riot"
            />
          </label>
          <label className="block text-xs text-white/45">
            {t("profile.faceit")}
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
              {t("profile.region")}
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
                    {t(`region.${region}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/45">
              {t("profile.voice")}
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
                    {t(`voice.${voice}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs text-white/45">
            {t("profile.partyLanguage")}
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
                  {t(`lang.${lang}`)}
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
            {t("profile.save")}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("profile.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
