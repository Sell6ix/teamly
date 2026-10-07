import { discordBotConfigured } from "@/lib/env";

const WEBHOOK_HOSTS = new Set(["discord.com", "discordapp.com"]);

/** Strict Discord Incoming Webhook URL check (blocks open-proxy / SSRF tricks). */
export function isDiscordWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (!WEBHOOK_HOSTS.has(url.hostname)) return false;
    if (url.username || url.password) return false;
    if (url.port) return false;
    // /api/webhooks/{snowflake}/{token}
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 4) return false;
    if (parts[0] !== "api" || parts[1] !== "webhooks") return false;
    if (!/^\d{17,20}$/.test(parts[2]!)) return false;
    if (!/^[\w-]{20,200}$/.test(parts[3]!)) return false;
    return true;
  } catch {
    return false;
  }
}

export function normalizeDiscordWebhookUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!isDiscordWebhookUrl(trimmed)) return "";
  const url = new URL(trimmed);
  return `${url.origin}${url.pathname}`;
}

export async function postDiscordMessage(content: string): Promise<
  | { ok: true; via: "webhook" | "bot" }
  | { ok: false; error: string }
> {
  const text = content.trim().slice(0, 1900);
  if (!text) return { ok: false, error: "empty" };

  if (discordBotConfigured()) {
    const channelId = process.env.DISCORD_LFG_CHANNEL_ID!;
    const token = process.env.DISCORD_BOT_TOKEN!;
    try {
      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: text }),
        },
      );
      if (!response.ok) {
        const body = await response.text();
        return {
          ok: false,
          error: `Discord bot API ${response.status}: ${body.slice(0, 180)}`,
        };
      }
      return { ok: true, via: "bot" };
    } catch {
      return { ok: false, error: "discord_unreachable" };
    }
  }

  return { ok: false, error: "discord_not_configured" };
}

export async function postDiscordWebhook(
  webhookUrl: string,
  content: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = normalizeDiscordWebhookUrl(webhookUrl);
  const text = content.trim().slice(0, 1900);
  if (!url) return { ok: false, error: "invalid_webhook" };
  if (!text) return { ok: false, error: "empty" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!response.ok) {
      return { ok: false, error: "webhook_rejected" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "discord_unreachable" };
  }
}
