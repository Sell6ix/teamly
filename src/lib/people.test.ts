import { describe, expect, it } from "vitest";
import { allPeople, filterPeople, personById } from "./people";

const cyrillic = /[А-Яа-яЁё]/;

describe("people directory", () => {
  it("aggregates cross-game identities", () => {
    const people = allPeople();
    expect(people.length).toBeGreaterThan(5);
    const withMany = people.find((person) => person.gameIds.length > 1);
    expect(withMany).toBeTruthy();
  });

  it("filters by query and game", () => {
    const people = allPeople();
    const party = filterPeople(people, "", "bunker");
    expect(party.every((person) => person.gameIds.includes("bunker"))).toBe(true);
    const named = filterPeople(people, party[0]!.name.slice(0, 3));
    expect(named.some((person) => person.personId === party[0]!.personId)).toBe(true);
  });

  it("looks up by personId", () => {
    const first = allPeople()[0]!;
    expect(personById(first.personId)?.name).toBe(first.name);
  });

  it("localizes demo nicks and bios for EN", () => {
    const people = allPeople("en");
    expect(people.length).toBeGreaterThan(5);
    for (const person of people) {
      expect(person.name).not.toMatch(cyrillic);
      for (const role of person.roles) expect(role).not.toMatch(cyrillic);
      for (const bio of person.bios) expect(bio).not.toMatch(cyrillic);
    }
    const kira = people.find((p) => p.name === "Kira_Neon");
    expect(kira).toBeTruthy();
  });
});
