import { describe, expect, it } from "vitest";
import { guideOffset } from "./guide";

describe("guideOffset", () => {
  it("is zero distance when the target is exactly at the boresight", () => {
    const { distanceDeg } = guideOffset(90, 20, 90, 20);
    expect(distanceDeg).toBeCloseTo(0, 6);
  });

  it("points straight up (0deg) when the target is directly above the boresight", () => {
    const { arrowAngleDeg, distanceDeg } = guideOffset(0, 0, 0, 10);
    expect(arrowAngleDeg).toBeCloseTo(0, 6);
    expect(distanceDeg).toBeCloseTo(10, 6);
  });

  it("points right (90deg) when the target is due east of the boresight", () => {
    const { arrowAngleDeg } = guideOffset(0, 0, 20, 0);
    expect(arrowAngleDeg).toBeCloseTo(90, 6);
  });

  it("points left (-90deg) when the target is due west of the boresight", () => {
    const { arrowAngleDeg } = guideOffset(0, 0, -20, 0);
    expect(arrowAngleDeg).toBeCloseTo(-90, 6);
  });

  it("wraps azimuth the short way around (350 -> 10 is a 20deg gap, not 340)", () => {
    const { distanceDeg } = guideOffset(350, 0, 10, 0);
    expect(distanceDeg).toBeCloseTo(20, 6);
  });

  it("shrinks the azimuth contribution near the zenith (compass direction matters less overhead)", () => {
    const nearHorizon = guideOffset(0, 0, 30, 0).distanceDeg;
    const nearZenith = guideOffset(0, 80, 30, 80).distanceDeg;
    expect(nearZenith).toBeLessThan(nearHorizon);
  });
});
