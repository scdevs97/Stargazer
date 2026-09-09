import { describe, expect, it } from "vitest";
import { CONSTELLATION_FIGURES } from "./constellations";
import { STARS } from "./stars";

describe("CONSTELLATION_FIGURES", () => {
  const starNames = new Set(STARS.map((s) => s.name));

  it("only references star names that exist in the catalog", () => {
    for (const figure of CONSTELLATION_FIGURES) {
      for (const [a, b] of figure.segments) {
        expect(starNames.has(a), `"${a}" in ${figure.name} is not in STARS`).toBe(true);
        expect(starNames.has(b), `"${b}" in ${figure.name} is not in STARS`).toBe(true);
      }
    }
  });

  it("has no zero-length segments (a star linked to itself)", () => {
    for (const figure of CONSTELLATION_FIGURES) {
      for (const [a, b] of figure.segments) {
        expect(a).not.toBe(b);
      }
    }
  });
});
