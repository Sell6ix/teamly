import { describe, expect, it } from "vitest";
import { listPartyMessages, postPartyMessage } from "./party-chat";

describe("party chat", () => {
  it("stores and lists messages by join code", () => {
    const code = `T${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const posted = postPartyMessage({
      code,
      authorName: "Ivan",
      body: "ready in 2",
    });
    expect("error" in posted).toBe(false);
    if ("error" in posted) return;
    const listed = listPartyMessages(code);
    expect(listed.some((m) => m.id === posted.id && m.body === "ready in 2")).toBe(
      true,
    );
  });

  it("rejects empty bodies", () => {
    const result = postPartyMessage({
      code: "TEST1",
      authorName: "Ivan",
      body: "   ",
    });
    expect(result).toEqual({ error: "empty" });
  });
});
