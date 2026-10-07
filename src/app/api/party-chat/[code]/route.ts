import { auth } from "@/auth";
import { db, ensureDb } from "@/db";
import { profiles } from "@/db/schema";
import {
  normalizeDiscordWebhookUrl,
  postDiscordMessage,
  postDiscordWebhook,
} from "@/lib/discord";
import { discordBotConfigured } from "@/lib/env";
import { listPartyMessages, postPartyMessage } from "@/lib/party-chat";
import { normalizeCode } from "@/lib/party-store";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

ensureDb();

type Ctx = { params: Promise<{ code: string }> };

/** Best-effort mirror to Discord bot channel and/or the author's saved webhook. */
async function bridgePartyChatToDiscord(input: {
  code: string;
  authorName: string;
  body: string;
  userId: string | null;
}) {
  const line = `💬 **${input.code}** · ${input.authorName}: ${input.body}`.slice(
    0,
    1900,
  );
  try {
    if (discordBotConfigured()) {
      await postDiscordMessage(line);
    }
  } catch {
    /* no-op */
  }
  if (!input.userId) return;
  try {
    const row = db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, input.userId))
      .get();
    const webhook = normalizeDiscordWebhookUrl(row?.discordWebhookUrl ?? "");
    if (webhook) await postDiscordWebhook(webhook, line);
  } catch {
    /* no-op */
  }
}

export async function GET(_request: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = normalizeCode(raw);
  if (!code) {
    return NextResponse.json({ error: "bad_code" }, { status: 400 });
  }
  return NextResponse.json({ messages: listPartyMessages(code) });
}

export async function POST(request: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = normalizeCode(raw);
  if (!code) {
    return NextResponse.json({ error: "bad_code" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const text = typeof payload.body === "string" ? payload.body : "";
  const session = await auth();

  // Prefer signed-in name; fall back to client-provided display name from local profile.
  const clientName =
    typeof payload.authorName === "string" ? payload.authorName.trim().slice(0, 40) : "";
  const authorName =
    session?.user?.name?.trim() ||
    clientName ||
    "Player";
  const authorId = session?.user?.id || null;

  const result = postPartyMessage({
    code,
    authorName,
    authorId,
    body: text,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  void bridgePartyChatToDiscord({
    code,
    authorName,
    body: result.body,
    userId: authorId,
  });

  return NextResponse.json({
    message: result,
    discord:
      discordBotConfigured() || Boolean(authorId)
        ? "attempted"
        : "skipped",
  });
}
