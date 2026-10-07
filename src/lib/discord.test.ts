import { describe, expect, it } from "vitest";
import { isDiscordWebhookUrl, normalizeDiscordWebhookUrl } from "./discord";

describe("discord webhook URL", () => {
  it("accepts a normal Discord webhook", () => {
    const url =
      "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN";
    expect(isDiscordWebhookUrl(url)).toBe(true);
    expect(normalizeDiscordWebhookUrl(`${url}?wait=true`)).toBe(url);
  });

  it("rejects open redirects and non-Discord hosts", () => {
    expect(
      isDiscordWebhookUrl(
        "https://evil.com/https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN",
      ),
    ).toBe(false);
    expect(
      isDiscordWebhookUrl(
        "https://discord.com.evil.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN",
      ),
    ).toBe(false);
    expect(isDiscordWebhookUrl("http://discord.com/api/webhooks/1/token")).toBe(false);
  });
});
