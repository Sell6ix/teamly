import { discordVoiceConfigured } from "@/lib/env";
import { NextResponse } from "next/server";

/** Public capability flag — no secrets. */
export async function GET() {
  return NextResponse.json({
    enabled: discordVoiceConfigured(),
  });
}
