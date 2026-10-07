import { describe, expect, it } from "vitest";
import { matchPeople, scorePlayer } from "./matching";
import { players } from "./data";
import { counterpartInGame, personIdOf } from "./recent";

const bunkerCasual = {
  gameId: "bunker" as const,
  playStyle: "casual" as const,
  partySize: 8,
  skill: 3 as const,
  hours: ["evening" as const],
};

describe("scorePlayer", () => {
  it("rejects another game", () => {
    const kira = players.find((p) => p.id === "p1");
    expect(kira).toBeTruthy();
    expect(scorePlayer(kira!, bunkerCasual)).toBeNull();
  });

  it("puts role hits above misses when roleTag is set", () => {
    const result = matchPeople({
      gameId: "valorant",
      playStyle: "ranked",
      partySize: 5,
      skill: 4,
      hours: ["evening"],
      roleTag: "duelist",
    });
    expect(result.players[0]?.player.role.toLowerCase()).toContain("дуэлист");
    const firstDuelist = result.players.findIndex((row) =>
      row.player.role.toLowerCase().includes("дуэлист"),
    );
    const firstOther = result.players.findIndex(
      (row) => !row.player.role.toLowerCase().includes("дуэлист"),
    );
    expect(firstDuelist).toBeGreaterThanOrEqual(0);
    if (firstOther >= 0) expect(firstDuelist).toBeLessThan(firstOther);
  });

  it("boosts recently played people to the top", () => {
    const without = matchPeople({
      gameId: "cs2",
      playStyle: "casual",
      partySize: 2,
      skill: 2,
      hours: ["evening"],
    });
    const withRecent = matchPeople({
      gameId: "cs2",
      playStyle: "casual",
      partySize: 2,
      skill: 2,
      hours: ["evening"],
      recentPersonIds: ["vanya"],
    });
    expect(withRecent.players[0]?.player.personId).toBe("vanya");
    expect(
      withRecent.players[0]?.reasons.some(
        (r) => r.includes("Недавно") || r.includes("recently"),
      ),
    ).toBe(true);
    expect(without.players.some((row) => row.player.personId === "vanya")).toBe(true);
  });

  it("keeps bunker tables of 8", () => {
    const result = matchPeople(bunkerCasual);
    expect(result.players.length).toBeGreaterThan(0);
    expect(result.parties.some((row) => row.party.partySize === 8)).toBe(true);
  });

  it("still shows a nearby bunker table when size is 10", () => {
    const result = matchPeople({ ...bunkerCasual, partySize: 10 });
    expect(result.parties.some((row) => row.party.partySize === 8)).toBe(true);
  });

  it("includes extra looking players", () => {
    const extra = {
      ...players[0]!,
      id: "you-valorant",
      gameId: "valorant" as const,
      playStyles: ["ranked" as const],
      skill: 4 as const,
      hours: ["evening" as const],
      lookingForSize: 5,
    };
    const result = matchPeople(
      {
        gameId: "valorant",
        playStyle: "ranked",
        partySize: 5,
        skill: 4,
        hours: ["evening"],
      },
      [],
      [extra],
    );
    expect(result.players.some((row) => row.player.id === "you-valorant")).toBe(true);
  });

  it("boosts matching language in the feed", () => {
    const result = matchPeople({
      gameId: "valorant",
      playStyle: "ranked",
      partySize: 5,
      skill: 4,
      hours: ["evening"],
      language: "en",
    });
    expect(result.players.length).toBeGreaterThan(0);
    expect(
      result.players.some((row) =>
        row.reasons.some(
          (reason) => reason.includes("Язык") || reason.includes("Language"),
        ),
      ),
    ).toBe(true);
  });

  it("localizes match reasons for EN UI", () => {
    const result = matchPeople({
      gameId: "valorant",
      playStyle: "ranked",
      partySize: 5,
      skill: 4,
      hours: ["evening"],
      language: "en",
      locale: "en",
    });
    const reasons = result.players.flatMap((row) => row.reasons).join(" | ");
    expect(reasons).toMatch(/Language|Same style|Skill match|Online:/);
    expect(reasons).not.toMatch(/Язык|Тот же стиль/);
  });

  it("hides blacklisted people from the feed", () => {
    const open = matchPeople({
      gameId: "cs2",
      playStyle: "casual",
      partySize: 2,
      skill: 2,
      hours: ["evening"],
    });
    expect(open.players.some((row) => row.player.personId === "vanya")).toBe(true);
    const blocked = matchPeople({
      gameId: "cs2",
      playStyle: "casual",
      partySize: 2,
      skill: 2,
      hours: ["evening"],
      blockedPersonIds: ["vanya"],
    });
    expect(blocked.players.some((row) => row.player.personId === "vanya")).toBe(false);
  });
});

describe("cross-game person", () => {
  it("links Lisa from CS2 to L4D2", () => {
    const cs = players.find((p) => p.id === "p8");
    expect(cs?.personId).toBe("lisa");
    const l4d = counterpartInGame(personIdOf(cs!), "l4d2");
    expect(l4d?.id).toBe("p60");
    expect(l4d?.steamProfileUrl).toBe(cs?.steamProfileUrl);
  });
});
