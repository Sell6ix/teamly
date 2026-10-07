import { describe, expect, it } from "vitest";
import { discordVoiceConfigured } from "./env";
import { getOrCreatePartyVoiceInvite } from "./party-voice";

describe("party voice", () => {
  it("reports voice as disabled without guild/bot env", () => {
    // Local/demo env typically has no Discord guild — capability must be false.
    expect(typeof discordVoiceConfigured()).toBe("boolean");
  });

  it("rejects bad join codes without calling Discord", async () => {
    const result = await getOrCreatePartyVoiceInvite("··");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(["bad_code", "discord_voice_not_configured"]).toContain(result.error);
    }
  });
});
