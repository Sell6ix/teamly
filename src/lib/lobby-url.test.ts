import { describe, expect, it } from "vitest";
import { games } from "./data";
import { defaultLobbyFilters, parseLobbySearchParams } from "./lobby-url";

describe("lobby URL", () => {
  it("defaults bunker to 8 and casual skill 3", () => {
    const bunker = games.find((g) => g.id === "bunker")!;
    const defaults = defaultLobbyFilters(bunker);
    expect(defaults.partySize).toBe(8);
    expect(defaults.playStyle).toBe("casual");
    expect(defaults.skill).toBe(3);
  });

  it("reads role, region and voice from query", () => {
    const valorant = games.find((g) => g.id === "valorant")!;
    const filters = parseLobbySearchParams(
      valorant,
      new URLSearchParams("size=5&role=duelist&region=msk&voice=discord"),
      "ranked",
    );
    expect(filters.playStyle).toBe("ranked");
    expect(filters.roleTag).toBe("duelist");
    expect(filters.region).toBe("msk");
    expect(filters.voicePlatform).toBe("discord");
  });
});
