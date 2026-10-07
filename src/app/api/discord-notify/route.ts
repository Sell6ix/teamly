import { auth } from "@/auth";
import { postDiscordMessage, postDiscordWebhook } from "@/lib/discord";
import { NextResponse } from "next/server";

/** Posts a party brief via user webhook and/or bot channel. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать запрос." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const content = typeof payload.content === "string" ? payload.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Пустой бриф." }, { status: 400 });
  }

  const webhookUrl =
    typeof payload.webhookUrl === "string" ? payload.webhookUrl.trim() : "";

  if (webhookUrl) {
    const viaHook = await postDiscordWebhook(webhookUrl, content);
    if (!viaHook.ok) {
      return NextResponse.json({ error: viaHook.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, via: "webhook" });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Войдите или укажите webhook в профиле." },
      { status: 401 },
    );
  }

  const viaBot = await postDiscordMessage(content);
  if (!viaBot.ok) {
    return NextResponse.json({ error: viaBot.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, via: viaBot.via });
}
