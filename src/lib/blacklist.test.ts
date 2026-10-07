import { describe, expect, it } from "vitest";
import {
  blockPerson,
  isBlocked,
  parseBlacklist,
  unblockPerson,
} from "./blacklist";

describe("blacklist", () => {
  it("parses and blocks by personId", () => {
    expect(parseBlacklist(null)).toEqual([]);
    const next = blockPerson("person-kira", "Кира", []);
    expect(isBlocked("person-kira", next)).toBe(true);
    expect(unblockPerson("person-kira", next)).toEqual([]);
  });
});
