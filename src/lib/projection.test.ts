import { describe, expect, it } from "vitest";
import { project, type Camera } from "./projection";

function baseCamera(overrides: Partial<Camera> = {}): Camera {
  return {
    headingDeg: 0,
    pitchDeg: 0,
    hFovDeg: 90,
    vFovDeg: 90,
    screenWidth: 1000,
    screenHeight: 1000,
    ...overrides,
  };
}

describe("project", () => {
  it("puts a target exactly at the boresight in the center of the screen", () => {
    const camera = baseCamera({ headingDeg: 123, pitchDeg: 17 });
    const p = project(17, 123, camera);
    expect(p.inView).toBe(true);
    expect(p.x).toBeCloseTo(500, 5);
    expect(p.y).toBeCloseTo(500, 5);
  });

  it("puts a target at the edge of a 90deg FOV at the screen edge", () => {
    // Looking due north at the horizon; a target 45deg east along the
    // horizon is exactly at the edge of a 90deg-wide field of view.
    const camera = baseCamera({ headingDeg: 0, pitchDeg: 0, hFovDeg: 90, vFovDeg: 90 });
    const p = project(0, 45, camera);
    expect(p.x).toBeCloseTo(1000, 3);
    expect(p.y).toBeCloseTo(500, 3);
  });

  it("marks a target behind the camera as not in view", () => {
    const camera = baseCamera({ headingDeg: 0, pitchDeg: 0 });
    const p = project(0, 180, camera); // directly opposite the boresight
    expect(p.inView).toBe(false);
  });

  it("marks a target outside the field of view (but in front) as not in view", () => {
    const camera = baseCamera({ headingDeg: 0, pitchDeg: 0, hFovDeg: 60, vFovDeg: 60 });
    const p = project(0, 50, camera); // well past the 30deg half-width
    expect(p.inView).toBe(false);
  });

  it("is stable across a full loop of headings (no NaN/discontinuity blowups for in-view targets)", () => {
    for (let heading = 0; heading < 360; heading += 15) {
      const camera = baseCamera({ headingDeg: heading, pitchDeg: 10 });
      const p = project(10, heading, camera); // target = boresight
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(p.inView).toBe(true);
    }
  });

  describe("rollDeg (tilt compensation)", () => {
    it("leaves the projection unchanged when roll is 0 or omitted", () => {
      const withZero = project(5, 10, baseCamera({ rollDeg: 0 }));
      const omitted = project(5, 10, baseCamera());
      expect(withZero.x).toBeCloseTo(omitted.x, 9);
      expect(withZero.y).toBeCloseTo(omitted.y, 9);
    });

    it("keeps the boresight target pinned to screen center regardless of roll", () => {
      // Rolling the camera spins the image around its own center, so
      // whatever is dead-center stays dead-center.
      const camera = baseCamera({ headingDeg: 40, pitchDeg: 20, rollDeg: 73 });
      const p = project(20, 40, camera);
      expect(p.x).toBeCloseTo(500, 5);
      expect(p.y).toBeCloseTo(500, 5);
    });

    it("a 90deg roll swaps a purely-vertical offset into a purely-horizontal one", () => {
      // A target directly "above" the boresight (same heading, +5deg pitch)
      // appears above center with no roll...
      const noRoll = project(15, 0, baseCamera({ headingDeg: 0, pitchDeg: 10, rollDeg: 0 }));
      expect(noRoll.x).toBeCloseTo(500, 3);
      expect(noRoll.y).toBeLessThan(500); // above center = smaller y

      // ...and directly to one side of center, by the same magnitude, once
      // the camera is rolled 90deg.
      const rolled = project(15, 0, baseCamera({ headingDeg: 0, pitchDeg: 10, rollDeg: 90 }));
      expect(rolled.y).toBeCloseTo(500, 3);
      expect(Math.abs(rolled.x - 500)).toBeCloseTo(Math.abs(noRoll.y - 500), 3);
      expect(Math.abs(rolled.x - 500)).toBeGreaterThan(1); // sanity: not a no-op
    });

    it("360deg of roll is the identity", () => {
      const a = project(12, 33, baseCamera({ headingDeg: 5, pitchDeg: -8, rollDeg: 0 }));
      const b = project(12, 33, baseCamera({ headingDeg: 5, pitchDeg: -8, rollDeg: 360 }));
      expect(b.x).toBeCloseTo(a.x, 6);
      expect(b.y).toBeCloseTo(a.y, 6);
    });
  });
});
