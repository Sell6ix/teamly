import { eq } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { partyVoiceChannels } from "@/db/schema";
import { discordVoiceConfigured } from "@/lib/env";
import { normalizeCode } from "@/lib/party-store";

ensureDb();

const DISCORD_API = "https://discord.com/api/v10";
const CHANNEL_TYPE_VOICE = 2;

export type PartyVoiceInvite = {
  partyCode: string;
  channelId: string;
  inviteCode: string;
  inviteUrl: string;
  created: boolean;
};

function botHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN!}`,
    "Content-Type": "application/json",
  };
}

async function discordJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const response = await fetch(`${DISCORD_API}${path}`, {
      ...init,
      headers: {
        ...botHeaders(),
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        status: response.status,
        error: `discord_${response.status}:${body.slice(0, 160)}`,
      };
    }
    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, status: 0, error: "discord_unreachable" };
  }
}

async function channelExists(channelId: string): Promise<boolean> {
  const result = await discordJson<{ id: string }>(`/channels/${channelId}`);
  return result.ok;
}

async function createVoiceChannel(partyCode: string): Promise<
  | { ok: true; channelId: string }
  | { ok: false; error: string }
> {
  const guildId = process.env.DISCORD_GUILD_ID!;
  const categoryId = process.env.DISCORD_VOICE_CATEGORY_ID?.trim();
  const body: Record<string, unknown> = {
    name: `teamly-${partyCode.toLowerCase()}`.slice(0, 100),
    type: CHANNEL_TYPE_VOICE,
    // Soft cap so abandoned party channels don’t stick forever.
    user_limit: 12,
  };
  if (categoryId && /^\d{17,20}$/.test(categoryId)) {
    body.parent_id = categoryId;
  }
  const result = await discordJson<{ id: string }>(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, channelId: result.data.id };
}

async function createInvite(channelId: string): Promise<
  | { ok: true; code: string; url: string }
  | { ok: false; error: string }
> {
  const result = await discordJson<{ code: string }>(`/channels/${channelId}/invites`, {
    method: "POST",
    body: JSON.stringify({
      max_age: 0,
      max_uses: 0,
      unique: false,
    }),
  });
  if (!result.ok) return { ok: false, error: result.error };
  const code = result.data.code;
  return { ok: true, code, url: `https://discord.gg/${code}` };
}

function rowToInvite(
  row: typeof partyVoiceChannels.$inferSelect,
  created: boolean,
): PartyVoiceInvite {
  return {
    partyCode: row.partyCode,
    channelId: row.channelId,
    inviteCode: row.inviteCode,
    inviteUrl: row.inviteUrl,
    created,
  };
}

/** Create or reuse one Discord voice channel invite for a party join code. */
export async function getOrCreatePartyVoiceInvite(
  rawCode: string,
): Promise<PartyVoiceInvite | { error: string }> {
  if (!discordVoiceConfigured()) {
    return { error: "discord_voice_not_configured" };
  }
  const partyCode = normalizeCode(rawCode);
  if (!partyCode || partyCode.length < 3 || partyCode.includes("·")) {
    return { error: "bad_code" };
  }

  const existing = db
    .select()
    .from(partyVoiceChannels)
    .where(eq(partyVoiceChannels.partyCode, partyCode))
    .get();

  if (existing) {
    const alive = await channelExists(existing.channelId);
    if (alive) {
      // Refresh invite URL if Discord still has the channel (invite may have been revoked).
      const invite = await createInvite(existing.channelId);
      if (invite.ok) {
        const updatedAt = new Date();
        db.update(partyVoiceChannels)
          .set({
            inviteCode: invite.code,
            inviteUrl: invite.url,
            updatedAt,
          })
          .where(eq(partyVoiceChannels.partyCode, partyCode))
          .run();
        return {
          partyCode,
          channelId: existing.channelId,
          inviteCode: invite.code,
          inviteUrl: invite.url,
          created: false,
        };
      }
      // Fall back to stored invite if create-invite failed transiently.
      return rowToInvite(existing, false);
    }
    db.delete(partyVoiceChannels)
      .where(eq(partyVoiceChannels.partyCode, partyCode))
      .run();
  }

  const channel = await createVoiceChannel(partyCode);
  if (!channel.ok) return { error: channel.error };

  const invite = await createInvite(channel.channelId);
  if (!invite.ok) {
    // Best-effort cleanup of an empty channel we just created.
    void discordJson(`/channels/${channel.channelId}`, { method: "DELETE" });
    return { error: invite.error };
  }

  const now = new Date();
  db.insert(partyVoiceChannels)
    .values({
      partyCode,
      channelId: channel.channelId,
      inviteCode: invite.code,
      inviteUrl: invite.url,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: partyVoiceChannels.partyCode,
      set: {
        channelId: channel.channelId,
        inviteCode: invite.code,
        inviteUrl: invite.url,
        updatedAt: now,
      },
    })
    .run();

  return {
    partyCode,
    channelId: channel.channelId,
    inviteCode: invite.code,
    inviteUrl: invite.url,
    created: true,
  };
}
