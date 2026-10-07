import { auth } from "@/auth";
import { db, ensureDb } from "@/db";
import { profiles } from "@/db/schema";
import {
  isDiscordWebhookUrl,
  normalizeDiscordWebhookUrl,
  postDiscordMessage,
  postDiscordWebhook,
} from "@/lib/discord";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

ensureDb();

/** Simple in-memory throttle so guest webhook posts can't spam freely. */
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  row.count += 1;
  return row.count > limit;
}

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

/** Posts a party brief via user webhook and/or bot channel. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const content = typeof payload.content === "string" ? payload.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  if (content.length > 1900) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  if (rateLimited(`notify:${clientKey(request)}`, 12, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const session = await auth();
  let webhookUrl = "";

  if (session?.user?.id) {
    // Signed-in: only the webhook saved on the server profile (never trust body URL).
    const row = db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .get();
    webhookUrl = normalizeDiscordWebhookUrl(row?.discordWebhookUrl ?? "");
  } else {
    // Guests: accept a validated webhook from the local profile, never arbitrary hosts.
    const bodyHook =
      typeof payload.webhookUrl === "string" ? payload.webhookUrl.trim() : "";
    if (bodyHook) {
      if (!isDiscordWebhookUrl(bodyHook)) {
        return NextResponse.json({ error: "invalid_webhook" }, { status: 400 });
      }
      webhookUrl = normalizeDiscordWebhookUrl(bodyHook);
    }
  }

  if (webhookUrl) {
    const viaHook = await postDiscordWebhook(webhookUrl, content);
    if (!viaHook.ok) {
      return NextResponse.json({ error: viaHook.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, via: "webhook" });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "auth_or_webhook" }, { status: 401 });
  }

  const viaBot = await postDiscordMessage(content);
  if (!viaBot.ok) {
    return NextResponse.json({ error: viaBot.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, via: viaBot.via });
}
