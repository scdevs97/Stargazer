// Math for the "find a star" directional guide: given where the camera is
// currently pointed and where a target star actually is, how far off (in
// degrees) and which way should the user pan to bring it into frame.

export interface GuideOffset {
  /** Degrees to rotate a screen-space "up" arrow so it points at the target. */
  arrowAngleDeg: number;
  /** Rough angular distance from the boresight to the target, in degrees. */
  distanceDeg: number;
}

function normalizeSignedDeg(deg: number): number {
  let d = ((deg + 180) % 360 + 360) % 360 - 180;
  if (d === -180) d = 180;
  return d;
}

/**
 * `deltaAz` is wrapped to (-180, 180] so panning is always measured the
 * short way around the compass. `distanceDeg` is a small-angle approximation
 * (good enough to say "about N degrees that way") that scales the azimuth
 * gap by cos(altitude) the way separations shrink near the zenith/nadir.
 */
export function guideOffset(
  cameraHeadingDeg: number,
  cameraPitchDeg: number,
  targetAzDeg: number,
  targetAltDeg: number
): GuideOffset {
  const deltaAz = normalizeSignedDeg(targetAzDeg - cameraHeadingDeg);
  const deltaAlt = targetAltDeg - cameraPitchDeg;

  const d2r = Math.PI / 180;
  const azComponent = deltaAz * Math.cos(cameraPitchDeg * d2r);

  const arrowAngleDeg = Math.atan2(deltaAz, deltaAlt) * (180 / Math.PI);
  const distanceDeg = Math.hypot(azComponent, deltaAlt);

  return { arrowAngleDeg, distanceDeg };
}
