import { describe, expect, it } from "vitest";
import { players } from "./data";
import {
  counterpartInGame,
  parseRecent,
  rememberInvite,
  recentForGame,
  recentPersonIds,
} from "./recent";

describe("recent invites", () => {
  it("parses empty or invalid storage", () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent("{")).toEqual([]);
  });

  it("dedupes by person and exposes counterpart in another game", () => {
    const lisa = players.find((p) => p.id === "p8")!;
    const vanya = players.find((p) => p.id === "p9")!;
    const first = rememberInvite(lisa, []);
    const second = rememberInvite(vanya, first);
    const again = rememberInvite(lisa, second);
    expect(recentPersonIds(again)[0]).toBe("lisa");
    expect(again.filter((item) => item.personId === "lisa")).toHaveLength(1);

    const inL4d = recentForGame("l4d2", again);
    expect(inL4d.map((p) => p.id)).toContain("p60");
    expect(counterpartInGame("vanya", "l4d2")?.id).toBe("p61");
  });
});
