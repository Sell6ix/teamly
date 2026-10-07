import { NextResponse } from "next/server";

/** Posts a party brief to a Discord incoming webhook (demo stand-in for a bot). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать запрос." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const webhookUrl = typeof payload.webhookUrl === "string" ? payload.webhookUrl.trim() : "";
  const content = typeof payload.content === "string" ? payload.content.trim() : "";

  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    return NextResponse.json(
      { error: "Нужен Discord Incoming Webhook (discord.com/api/webhooks/…)." },
      { status: 400 },
    );
  }
  if (!content || content.length > 1900) {
    return NextResponse.json({ error: "Текст брифa пустой или слишком длинный." }, { status: 400 });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Discord webhook отклонил сообщение. Проверьте ссылку." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось достучаться до Discord." }, { status: 502 });
  }
}
