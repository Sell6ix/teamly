import { getJoinSession, normalizeCode } from "@/lib/party-store";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const session = getJoinSession(normalizeCode(code));
  if (!session) {
    return NextResponse.json(
      { error: "Пати с таким кодом не найдена. Попросите хоста открыть сбор или обновить ссылку." },
      { status: 404 },
    );
  }
  return NextResponse.json({ session });
}
