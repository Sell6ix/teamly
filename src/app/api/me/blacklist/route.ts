import { auth } from "@/auth";
import { db, ensureDb } from "@/db";
import { blacklist } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

ensureDb();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Нужен вход." }, { status: 401 });
  }
  const rows = db
    .select()
    .from(blacklist)
    .where(eq(blacklist.userId, session.user.id))
    .all()
    .map((item) => ({
      personId: item.personId,
      name: item.name,
      at: item.at instanceof Date ? item.at.getTime() : Number(item.at),
    }));
  return NextResponse.json({ blacklist: rows });
}

export async function POST(request: Request) {
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
  const payload = body as Record<string, unknown>;
  const personId = typeof payload.personId === "string" ? payload.personId.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : personId;
  if (!personId) {
    return NextResponse.json({ error: "Нужен personId." }, { status: 400 });
  }
  const at = new Date();
  db.insert(blacklist)
    .values({ userId: session.user.id, personId, name: name || personId, at })
    .onConflictDoUpdate({
      target: [blacklist.userId, blacklist.personId],
      set: { name: name || personId, at },
    })
    .run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Нужен вход." }, { status: 401 });
  }
  const personId = new URL(request.url).searchParams.get("personId")?.trim();
  if (!personId) {
    return NextResponse.json({ error: "Нужен personId." }, { status: 400 });
  }
  db.delete(blacklist)
    .where(and(eq(blacklist.userId, session.user.id), eq(blacklist.personId, personId)))
    .run();
  return NextResponse.json({ ok: true });
}
