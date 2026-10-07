import { describe, expect, it } from "vitest";
import {
  getJoinSession,
  normalizeCode,
  publishSession,
  upsertJoinSession,
} from "./party-store";

describe("party store", () => {
  it("normalizes join codes", () => {
    expect(normalizeCode(" ab12 ")).toBe("AB12");
  });

  it("publishes an open party with start slot", () => {
    upsertJoinSession({
      code: "TEST9",
      partyName: "Тест",
      gameId: "cs2",
      partySize: 5,
      playStyle: "ranked",
      skill: 4,
      hours: ["evening"],
      seats: [{ kind: "you", name: "Иван", role: "Хост" }],
      filled: 1,
      published: false,
      note: "",
      micRequired: true,
      leader: "Иван",
      ready: false,
    });
    const party = publishSession("test9", "Нужен рифлер", {
      startsAt: "сегодня 21:00",
      region: "msk",
      voicePlatform: "discord",
    });
    expect(party?.name).toBe("Тест");
    expect(party?.note).toBe("Нужен рифлер");
    expect(party?.startsAt).toBe("сегодня 21:00");
    expect(getJoinSession("TEST9")?.published).toBe(true);
  });
});
