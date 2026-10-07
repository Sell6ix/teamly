import { auth } from "@/auth";
import { listPartyMessages, postPartyMessage } from "@/lib/party-chat";
import { normalizeCode } from "@/lib/party-store";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ code: string }> };

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
    const status = result.error === "empty" ? 400 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ message: result });
}
