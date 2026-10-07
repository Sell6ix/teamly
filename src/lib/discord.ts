import { discordBotConfigured } from "@/lib/env";

export async function postDiscordMessage(content: string): Promise<
  | { ok: true; via: "webhook" | "bot" }
  | { ok: false; error: string }
> {
  const text = content.trim().slice(0, 1900);
  if (!text) return { ok: false, error: "Пустой текст." };

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
      return { ok: false, error: "Не удалось достучаться до Discord API." };
    }
  }

  return {
    ok: false,
    error: "Задайте DISCORD_BOT_TOKEN и DISCORD_LFG_CHANNEL_ID (или webhook в профиле).",
  };
}

export async function postDiscordWebhook(
  webhookUrl: string,
  content: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = webhookUrl.trim();
  const text = content.trim().slice(0, 1900);
  if (!url.startsWith("https://discord.com/api/webhooks/")) {
    return { ok: false, error: "Нужен Discord Incoming Webhook." };
  }
  if (!text) return { ok: false, error: "Пустой текст." };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!response.ok) {
      return { ok: false, error: "Discord webhook отклонил сообщение." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось достучаться до Discord." };
  }
}
