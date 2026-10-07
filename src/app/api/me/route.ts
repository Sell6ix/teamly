import { auth } from "@/auth";
import { db, ensureDb } from "@/db";
import { blacklist, profiles } from "@/db/schema";
import { REGIONS, VOICE_PLATFORMS, type UserProfile } from "@/lib/profile";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

ensureDb();

function profileFromRow(row: typeof profiles.$inferSelect | undefined, fallbackName: string) {
  if (!row) {
    return {
      accountId: "",
      displayName: fallbackName,
      steamProfileUrl: "",
      discordUrl: "",
      riotTag: "",
      faceitUrl: "",
      region: "msk" as const,
      voicePlatform: "discord" as const,
      discordWebhookUrl: "",
    } satisfies UserProfile;
  }
  return {
    accountId: row.userId,
    displayName: row.displayName || fallbackName,
    steamProfileUrl: row.steamProfileUrl,
    discordUrl: row.discordUrl,
    riotTag: row.riotTag,
    faceitUrl: row.faceitUrl,
    region: (REGIONS as readonly string[]).includes(row.region)
      ? (row.region as UserProfile["region"])
      : "msk",
    voicePlatform: (VOICE_PLATFORMS as readonly string[]).includes(row.voicePlatform)
      ? (row.voicePlatform as UserProfile["voicePlatform"])
      : "discord",
    discordWebhookUrl: row.discordWebhookUrl,
  } satisfies UserProfile;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ user: null });
  }
  const row = db.select().from(profiles).where(eq(profiles.userId, session.user.id)).get();
  const blocks = db
    .select()
    .from(blacklist)
    .where(eq(blacklist.userId, session.user.id))
    .all()
    .map((item) => ({
      personId: item.personId,
      name: item.name,
      at: item.at instanceof Date ? item.at.getTime() : Number(item.at),
    }));

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
    profile: profileFromRow(row, session.user.name || "Игрок"),
    blacklist: blocks,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Нужен вход." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать запрос." }, { status: 400 });
  }

  const payload = body as Partial<UserProfile>;
  const displayName =
    typeof payload.displayName === "string" && payload.displayName.trim()
      ? payload.displayName.trim().slice(0, 40)
      : session.user.name || "Игрок";

  const values = {
    userId: session.user.id,
    displayName,
    steamProfileUrl: String(payload.steamProfileUrl ?? "").slice(0, 300),
    discordUrl: String(payload.discordUrl ?? "").slice(0, 300),
    riotTag: String(payload.riotTag ?? "").slice(0, 80),
    faceitUrl: String(payload.faceitUrl ?? "").slice(0, 300),
    region:
      typeof payload.region === "string" && (REGIONS as readonly string[]).includes(payload.region)
        ? payload.region
        : "msk",
    voicePlatform:
      typeof payload.voicePlatform === "string" &&
      (VOICE_PLATFORMS as readonly string[]).includes(payload.voicePlatform)
        ? payload.voicePlatform
        : "discord",
    discordWebhookUrl: String(payload.discordWebhookUrl ?? "").slice(0, 400),
    updatedAt: new Date(),
  };

  db.insert(profiles)
    .values(values)
    .onConflictDoUpdate({
      target: profiles.userId,
      set: values,
    })
    .run();

  const row = db.select().from(profiles).where(eq(profiles.userId, session.user.id)).get();
  return NextResponse.json({ profile: profileFromRow(row, displayName) });
}
