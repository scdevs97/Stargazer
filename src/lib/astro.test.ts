import { describe, expect, it } from "vitest";
import { raDecToAltAz, sunAltitude } from "./astro";

describe("raDecToAltAz", () => {
  it("at the North Pole, altitude always equals declination regardless of time or RA", () => {
    // At the pole the horizon is the celestial equator, so a star's altitude
    // is just its declination -- true at any instant, for any hour angle.
    const times = [
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-06-21T13:37:00Z"),
      new Date("2030-09-09T05:00:00Z"),
    ];
    for (const date of times) {
      for (const raHours of [0, 6, 12, 18.5]) {
        const { altDeg } = raDecToAltAz(raHours, 30, 90, 0, date);
        expect(altDeg).toBeCloseTo(30, 5);
      }
    }
  });

  it("at the South Pole, altitude always equals minus declination", () => {
    const { altDeg } = raDecToAltAz(9, 20, -90, 0, new Date("2026-03-15T00:00:00Z"));
    expect(altDeg).toBeCloseTo(-20, 5);
  });

  it("keeps Polaris circumpolar and near-north from mid-northern latitudes", () => {
    // Polaris sits ~0.74deg from the north celestial pole, so from latitude
    // 40N its altitude must stay within 40 +/- 0.74 deg at every hour, and
    // (being this close to the pole) its azimuth stays near due north.
    const polaris = { raHours: 2.5303, decDeg: 89.2641 };
    const lat = 40;
    for (let h = 0; h < 24; h += 1) {
      const date = new Date(Date.UTC(2026, 5, 1, h, 0, 0));
      const { altDeg, azDeg } = raDecToAltAz(polaris.raHours, polaris.decDeg, lat, -74, date);
      expect(altDeg).toBeGreaterThan(lat - 1);
      expect(altDeg).toBeLessThan(lat + 1);
      const azFromNorth = Math.min(azDeg, 360 - azDeg);
      expect(azFromNorth).toBeLessThan(3);
    }
  });

  it("never returns an altitude outside [-90, 90] or an azimuth outside [0, 360)", () => {
    for (let raHours = 0; raHours < 24; raHours += 3.7) {
      for (const decDeg of [-80, -20, 0, 45, 89]) {
        const { altDeg, azDeg } = raDecToAltAz(
          raHours,
          decDeg,
          52.5,
          13.4,
          new Date("2026-11-11T11:11:00Z")
        );
        expect(altDeg).toBeGreaterThanOrEqual(-90);
        expect(altDeg).toBeLessThanOrEqual(90);
        expect(azDeg).toBeGreaterThanOrEqual(0);
        expect(azDeg).toBeLessThan(360);
      }
    }
  });
});

describe("sunAltitude", () => {
  it("stays within [-90, 90]", () => {
    const alt = sunAltitude(51.5, 0, new Date());
    expect(alt).toBeGreaterThanOrEqual(-90);
    expect(alt).toBeLessThanOrEqual(90);
  });

  it("is higher around the northern-hemisphere summer solstice than the winter one, at local noon", () => {
    // Longitude 0 => local solar noon is approximately 12:00 UTC.
    const june = sunAltitude(51.5, 0, new Date("2026-06-21T12:00:00Z"));
    const december = sunAltitude(51.5, 0, new Date("2026-12-21T12:00:00Z"));
    expect(june).toBeGreaterThan(december);
    expect(june).toBeGreaterThan(40); // London-ish latitude, summer noon sun is high
    expect(december).toBeLessThan(20); // winter noon sun stays low
  });
});
