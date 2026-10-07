import { discordVoiceConfigured } from "@/lib/env";
import { getOrCreatePartyVoiceInvite } from "@/lib/party-voice";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  if (!discordVoiceConfigured()) {
    return NextResponse.json(
      { error: "discord_voice_not_configured" },
      { status: 503 },
    );
  }

  const { code } = await ctx.params;
  const result = await getOrCreatePartyVoiceInvite(code);
  if ("error" in result) {
    const status =
      result.error === "bad_code"
        ? 400
        : result.error === "discord_voice_not_configured"
          ? 503
          : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    inviteUrl: result.inviteUrl,
    channelId: result.channelId,
    partyCode: result.partyCode,
    created: result.created,
  });
}
