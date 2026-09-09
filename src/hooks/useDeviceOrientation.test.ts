import { describe, expect, it } from "vitest";
import { rollDegFromTilt } from "./useDeviceOrientation";

describe("rollDegFromTilt", () => {
  it("is zero when the phone is held upright with no left/right tilt", () => {
    // beta=90 (vertical, viewfinder-style), gamma=0 (not tilted sideways).
    expect(rollDegFromTilt(90, 0)).toBeCloseTo(0, 6);
  });

  it("is antisymmetric in gamma (tilting the other way flips the sign)", () => {
    const left = rollDegFromTilt(80, -20);
    const right = rollDegFromTilt(80, 20);
    expect(left).toBeCloseTo(-right, 6);
    expect(Math.abs(right)).toBeGreaterThan(0.01); // sanity: not trivially zero
  });

  it("does not depend on compass heading (there is no alpha parameter at all)", () => {
    // Structural guarantee: the function's signature takes only tilt, so by
    // construction the result can't vary with compass heading.
    expect(rollDegFromTilt.length).toBe(2);
  });

  it("reports zero roll at beta=90 for any gamma, holding beta artificially fixed", () => {
    // This isn't a blind spot: in this Euler convention, beta=90 is by
    // construction the configuration where the phone's top edge points at
    // the zenith (zero roll), for any alpha/gamma. A real physical roll
    // while pointed at the horizon shows up as beta shifting slightly away
    // from 90 in tandem with gamma -- which this formula does pick up,
    // since it reads whatever beta/gamma the sensor reports at that
    // instant. This test just pins the exact-90 slice's behavior.
    for (const gamma of [-45, -10, 10, 45, 89]) {
      expect(rollDegFromTilt(90, gamma)).toBeCloseTo(0, 6);
    }
  });

  it("stays within [-180, 180] for arbitrary tilts", () => {
    for (let beta = -180; beta <= 180; beta += 17) {
      for (let gamma = -90; gamma <= 90; gamma += 13) {
        const roll = rollDegFromTilt(beta, gamma);
        expect(roll).toBeGreaterThanOrEqual(-180);
        expect(roll).toBeLessThanOrEqual(180);
      }
    }
  });
});
