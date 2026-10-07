"use client";

import { ProfileLinks } from "@/components/profile-links";
import { Button } from "@/components/ui/button";
import { useParty } from "@/components/party-context";
import { YOU_NAME } from "@/lib/data";
import {
  lfpTemplatesFor,
  loadProfile,
  START_SLOTS,
} from "@/lib/profile";
import { Check, Copy, Link2, PartyPopper, Radio, Share2, Users } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => undefined;
}

function getCanShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function PartyTray() {
  const {
    seats,
    partyName,
    setPartyName,
    joinedParty,
    ready,
    setReady,
    kick,
    leaveJoined,
    filledCount,
    joinCode,
    copyShareLink,
    published,
    publishOpenParty,
    publishLooking,
    lookingPosted,
    copyReadyBrief,
    gameId,
  } = useParty();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (joinedParty) setMobileOpen(true);
  }, [joinedParty?.id]);
  const [looking, setLooking] = useState(false);
  const [note, setNote] = useState("");
  const [startsAt, setStartsAt] = useState("сегодня 21:00");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [showLfp, setShowLfp] = useState(false);
  const [showAllSeats, setShowAllSeats] = useState(false);
  const canNativeShare = useSyncExternalStore(subscribeNoop, getCanShare, () => false);
  const full = filledCount === seats.length;
  const canConfirm = filledCount >= 2;
  const templates = useMemo(
    () => (gameId ? lfpTemplatesFor(gameId) : lfpTemplatesFor("valorant")),
    [gameId],
  );
  const youProfile = useMemo(() => loadProfile(), [mobileOpen, published]);

  async function handlePublish() {
    setPublishing(true);
    try {
      await publishOpenParty({
        note: note.trim() || undefined,
        startsAt: startsAt || null,
      });
    } finally {
      setPublishing(false);
    }
  }

  async function handleLooking() {
    setLooking(true);
    try {
      await publishLooking({ bio: note.trim() || undefined });
    } finally {
      setLooking(false);
    }
  }

  function applyTemplate(id: string) {
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setTemplateId(id);
    setNote(template.note);
  }

  const body = (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-display text-lg text-white">
            <Users className="size-4 text-[var(--brand)]" />
            {joinedParty ? "Вы в сборе" : "Ваша пати"}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {filledCount} из {seats.length} · код {joinCode}
            {published ? " · в ленте" : ""}
          </p>
        </div>
        <button
          type="button"
          className="lg:hidden text-xs text-white/50"
          onClick={() => setMobileOpen(false)}
        >
          Свернуть
        </button>
      </div>

      {joinedParty ? (
        <p className="mb-3 text-sm font-medium text-white/90">{partyName}</p>
      ) : (
        <label className="mb-3 block text-xs text-white/45">
          Название
          <input
            value={partyName}
            onChange={(event) => setPartyName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand)]/50"
          />
        </label>
      )}

      <ol className="max-h-52 space-y-2 overflow-y-auto pr-1">
        {(showAllSeats || seats.length <= 5
          ? seats
          : [
              ...seats.filter((seat) => seat.kind !== "empty"),
              ...seats.filter((seat) => seat.kind === "empty").slice(0, 1),
            ]
        ).map((seat, index) => (
          <li
            key={index}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2"
          >
            {seat.kind === "you" ? (
              <span className="min-w-0 text-sm">
                <span className="font-medium text-white">
                  {youProfile.displayName || YOU_NAME}
                </span>{" "}
                <span className="text-xs text-white/40">это вы</span>
                <div className="mt-1">
                  <ProfileLinks
                    steamProfileUrl={youProfile.steamProfileUrl}
                    discordUrl={youProfile.discordUrl}
                    riotTag={youProfile.riotTag}
                    faceitUrl={youProfile.faceitUrl}
                    compact
                  />
                </div>
              </span>
            ) : null}
            {seat.kind === "player" ? (
              <>
                <span className="min-w-0 text-sm">
                  <span className="font-medium text-white">{seat.player.name}</span>
                  <span className="ml-2 text-xs text-white/40">{seat.player.role}</span>
                  <div className="mt-1">
                    <ProfileLinks
                      steamProfileUrl={seat.player.steamProfileUrl}
                      discordUrl={seat.player.discordUrl}
                      riotTag={seat.player.riotTag}
                      faceitUrl={seat.player.faceitUrl}
                      compact
                    />
                  </div>
                </span>
                {!joinedParty ? (
                  <Button type="button" size="xs" variant="ghost" onClick={() => kick(seat.player.id)}>
                    Убрать
                  </Button>
                ) : null}
              </>
            ) : null}
            {seat.kind === "empty" ? (
              <span className="text-sm text-white/35">Свободное место</span>
            ) : null}
          </li>
        ))}
      </ol>
      {!showAllSeats && seats.length > 5 ? (
        <button
          type="button"
          className="mt-2 text-[11px] text-white/45 hover:text-white/70"
          onClick={() => setShowAllSeats(true)}
        >
          Показать все {seats.length} слотов
        </button>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {!joinedParty && !published ? (
          <div className="space-y-2 rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <button
              type="button"
              className="text-[11px] uppercase tracking-wide text-white/40"
              onClick={() => setShowLfp((value) => !value)}
            >
              {showLfp ? "Скрыть текст сбора" : "Текст сбора и слот"}
            </button>
            <div className={showLfp ? "space-y-2" : "hidden lg:block lg:space-y-2"}>
            <p className="text-[11px] uppercase tracking-wide text-white/40">Шаблон LFP</p>
            <div className="flex flex-wrap gap-1.5">
              {templates.slice(0, 4).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  data-testid={`lfp-${template.id}`}
                  onClick={() => applyTemplate(template.id)}
                  className={`rounded-md px-2 py-1 text-[11px] transition ${
                    templateId === template.id
                      ? "bg-[var(--brand)] text-black"
                      : "border border-white/10 text-white/65 hover:border-white/20"
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>
            <label className="block text-xs text-white/45">
              Текст сбора
              <textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setTemplateId(null);
                }}
                rows={2}
                placeholder="Коротко: кого ищете…"
                data-testid="lfp-note"
                className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand)]/50"
              />
            </label>
            <label className="block text-xs text-white/45">
              Слот
              <select
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                data-testid="lfp-starts"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand)]/50"
              >
                {START_SLOTS.map((slot) => (
                  <option key={slot.id || "none"} value={slot.id}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </label>
            </div>
          </div>
        ) : null}

        {!joinedParty ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="lg"
              data-testid="publish-looking"
              disabled={looking || lookingPosted}
              onClick={() => void handleLooking()}
              variant="outline"
              className="border-white/15 bg-white/5"
            >
              {lookingPosted ? "Уже в ленте" : "Я ищу"}
            </Button>
            <Button
              type="button"
              size="lg"
              data-testid="publish-party"
              disabled={publishing || published}
              onClick={() => void handlePublish()}
            >
              <Radio data-icon="inline-start" />
              {published ? "В сборах" : "Открыть сбор"}
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {canNativeShare ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              data-testid="share-party-link"
              onClick={() => void copyShareLink("share")}
              className="border-white/15 bg-white/5"
            >
              <Share2 data-icon="inline-start" />
              Поделиться
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            variant="outline"
            data-testid="copy-party-link"
            onClick={() => void copyShareLink("copy")}
            className={`border-white/15 bg-white/5 ${canNativeShare ? "" : "sm:col-span-2"}`}
          >
            <Copy data-icon="inline-start" />
            Скопировать ссылку
          </Button>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-white/40">
          <Link2 className="size-3" />
          /join/{joinCode}
        </p>

        {joinedParty ? (
          <Button type="button" variant="outline" onClick={leaveJoined}>
            Выйти из сбора
          </Button>
        ) : null}

        {!ready && canConfirm ? (
          <p className="rounded-lg border border-[var(--brand)]/25 bg-[var(--brand)]/10 px-3 py-2 text-[11px] leading-4 text-[var(--brand)]">
            {full
              ? "Состав полный — подтвердите, и можно заходить в игру."
              : `Уже ${filledCount} из ${seats.length}. Можно подтвердить сейчас или добрать слоты.`}
          </p>
        ) : null}

        <Button
          type="button"
          size="lg"
          data-testid="confirm-party"
          disabled={!canConfirm || ready}
          onClick={() => {
            setReady(true);
            void copyReadyBrief();
          }}
        >
          {ready ? (
            <>
              <PartyPopper data-icon="inline-start" />
              Пати готова — бриф скопирован
            </>
          ) : full ? (
            "Подтвердить и скопировать бриф"
          ) : canConfirm ? (
            `Собраться ${filledCount} из ${seats.length}`
          ) : (
            `Нужно ещё ${Math.max(0, 2 - filledCount)}`
          )}
        </Button>
        {ready ? (
          <p className="flex items-center gap-1 text-xs text-emerald-300">
            <Check className="size-3" />
            В буфере: состав, ссылка /join и Discord/Steam. Кидайте в чат и заходите в игру.
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-full shrink-0 lg:sticky lg:top-4 lg:block lg:w-80">
        <div className="rounded-2xl border border-white/10 bg-[#121214]/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {body}
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        {!mobileOpen ? (
          <button
            type="button"
            data-testid="party-sheet-toggle"
            onClick={() => setMobileOpen(true)}
            className="mx-3 mb-3 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-2xl border border-white/12 bg-[#121214]/95 px-4 py-3 text-left shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <span>
              <span className="block font-display text-base text-white">
                Пати · {filledCount}/{seats.length}
              </span>
              <span className="text-xs text-white/45">Открыть трей и ссылку</span>
            </span>
            <span className="rounded-md bg-[var(--brand)]/20 px-2 py-1 text-xs text-[var(--brand)]">
              Открыть
            </span>
          </button>
        ) : (
          <div className="max-h-[75vh] overflow-y-auto rounded-t-3xl border border-white/12 bg-[#121214] p-4 shadow-[0_-16px_50px_rgba(0,0,0,0.55)]">
            {body}
          </div>
        )}
      </div>
    </>
  );
}
