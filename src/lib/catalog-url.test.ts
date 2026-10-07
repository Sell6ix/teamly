import { describe, expect, it } from "vitest";
import { catalogHref, parseCatalogSearchParams } from "./catalog-url";

describe("catalog URL", () => {
  it("defaults to all types and empty query", () => {
    expect(parseCatalogSearchParams(new URLSearchParams())).toEqual({
      type: "all",
      q: "",
    });
  });

  it("reads type and q from query", () => {
    expect(
      parseCatalogSearchParams(new URLSearchParams("type=party&q=бункер")),
    ).toEqual({ type: "party", q: "бункер" });
  });

  it("ignores unknown type", () => {
    expect(parseCatalogSearchParams(new URLSearchParams("type=rpg")).type).toBe(
      "all",
    );
  });

  it("builds shareable href", () => {
    expect(catalogHref({ type: "all", q: "" })).toBe("/");
    expect(catalogHref({ type: "shooter", q: "" })).toBe("/?type=shooter");
    expect(catalogHref({ type: "party", q: "мафия" })).toBe(
      "/?type=party&q=%D0%BC%D0%B0%D1%84%D0%B8%D1%8F",
    );
  });
});
