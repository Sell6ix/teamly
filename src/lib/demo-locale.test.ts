import { describe, expect, it } from "vitest";
import { players } from "./data";
import {
  localizeParty,
  localizePlayer,
  playerEn,
  partyEn,
  youName,
} from "./demo-locale";
import { openParties } from "./data";
import { lfpTemplatesFor } from "./profile";

const cyrillic = /[А-Яа-яЁё]/;

describe("demo locale overlays", () => {
  it("covers every seeded player and party", () => {
    for (const player of players) {
      if (player.id.startsWith("you-")) continue;
      expect(playerEn[player.id], `missing EN for ${player.id}`).toBeTruthy();
    }
    for (const party of openParties) {
      expect(partyEn[party.id], `missing EN for ${party.id}`).toBeTruthy();
    }
  });

  it("returns Ivan for EN youName", () => {
    expect(youName("ru")).toBe("Иван");
    expect(youName("en")).toBe("Ivan");
  });

  it("strips Cyrillic from localized players and parties", () => {
    const player = localizePlayer(players.find((p) => p.id === "p1")!, "en");
    expect(player.name).toBe("Kira_Neon");
    expect(player.bio).not.toMatch(cyrillic);

    const party = localizeParty(openParties.find((p) => p.id === "g1")!, "en");
    expect(party.name).toBe("Immo no tilt");
    expect(party.note).not.toMatch(cyrillic);
    expect(party.leader).not.toMatch(cyrillic);
  });

  it("localizes LFP templates", () => {
    const ru = lfpTemplatesFor("valorant", "ru");
    const en = lfpTemplatesFor("valorant", "en");
    expect(ru.some((t) => cyrillic.test(t.label))).toBe(true);
    expect(en.every((t) => !cyrillic.test(t.label))).toBe(true);
    expect(en.every((t) => !cyrillic.test(t.note))).toBe(true);
    expect(en.find((t) => t.id === "smoke")?.label).toBe("Need smoke");
  });
});
