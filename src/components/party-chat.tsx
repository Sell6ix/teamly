"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/context";
import type { PartyChatMessage } from "@/lib/party-chat";
import { loadProfile } from "@/lib/profile";
import { MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function PartyChat({
  partyCode,
  enabled = true,
}: {
  partyCode: string;
  enabled?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<PartyChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const code = partyCode.trim().toUpperCase();

  useEffect(() => {
    if (!open || !enabled || !code || code.includes("·")) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/party-chat/${encodeURIComponent(code)}`);
        const data = (await res.json()) as {
          messages?: PartyChatMessage[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          return;
        }
        setMessages(data.messages ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void fetch(`/api/party-chat/${encodeURIComponent(code)}`)
        .then((res) => res.json())
        .then((data: { messages?: PartyChatMessage[] }) => {
          if (!cancelled && data.messages) setMessages(data.messages);
        })
        .catch(() => undefined);
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [open, enabled, code]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const profile = loadProfile();
      const res = await fetch(`/api/party-chat/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          authorName: profile.displayName || undefined,
        }),
      });
      const data = (await res.json()) as {
        message?: PartyChatMessage;
        error?: string;
      };
      if (!res.ok || !data.message) {
        toast.error(t("chat.sendFail"));
        return;
      }
      setDraft("");
      setMessages((prev) =>
        prev.some((m) => m.id === data.message!.id)
          ? prev
          : [...prev, data.message!],
      );
    } catch {
      toast.error(t("chat.sendFail"));
    } finally {
      setSending(false);
    }
  }

  if (!enabled || !code || code.includes("·")) return null;

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02]" data-testid="party-chat">
      <button
        type="button"
        data-testid="party-chat-toggle"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-white/70 transition hover:text-white"
      >
        <span className="inline-flex items-center gap-1.5 font-medium">
          <MessageCircle className="size-3.5 text-[var(--brand)]" />
          {open ? t("chat.hide") : t("chat.open")}
          {!open && messages.length > 0 ? (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/55">
              {t("chat.count", { n: messages.length })}
            </span>
          ) : null}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-white/35">
          {t("chat.title")}
        </span>
      </button>

      {open ? (
        <div className="border-t border-white/8 px-3 pb-3 pt-2">
          <div
            ref={listRef}
            data-testid="party-chat-list"
            className="max-h-40 space-y-2 overflow-y-auto pr-1"
          >
            {loading && messages.length === 0 ? (
              <p className="py-3 text-center text-xs text-white/45">{t("chat.loading")}</p>
            ) : null}
            {error && messages.length === 0 ? (
              <p className="py-3 text-center text-xs text-red-300/80">{t("chat.error")}</p>
            ) : null}
            {!loading && !error && messages.length === 0 ? (
              <p className="py-3 text-center text-xs text-white/45">{t("chat.empty")}</p>
            ) : null}
            {messages.map((message) => (
              <div key={message.id} className="text-xs leading-snug">
                <span className="font-medium text-[var(--brand)]">{message.authorName}</span>
                <span className="ml-1.5 text-white/35">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-white/80">
                  {message.body}
                </p>
              </div>
            ))}
          </div>
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("chat.placeholder")}
              maxLength={500}
              data-testid="party-chat-input"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/35 focus:border-[var(--brand)]/50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={sending || !draft.trim()}
              data-testid="party-chat-send"
              className="shrink-0 px-2"
            >
              <Send className="size-3.5" />
              <span className="sr-only">{t("chat.send")}</span>
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
