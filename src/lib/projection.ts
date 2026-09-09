// Projects sky (Alt/Az) coordinates into screen-space pixels for a virtual
// camera pointed at a given heading/pitch, using a perspective (gnomonic)
// projection — the same model a real camera lens uses. This keeps stars near
// the edge of a wide field of view from distorting incorrectly the way a
// naive linear (equirectangular) mapping would.

const DEG2RAD = Math.PI / 180;

export interface Vec3 {
  x: number; // East
  y: number; // North
  z: number; // Up
}

export function altAzToVector(altDeg: number, azDeg: number): Vec3 {
  const alt = altDeg * DEG2RAD;
  const az = azDeg * DEG2RAD;
  return {
    x: Math.cos(alt) * Math.sin(az),
    y: Math.cos(alt) * Math.cos(az),
    z: Math.sin(alt),
  };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(dot(v, v)) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export interface Camera {
  headingDeg: number; // compass heading the camera points at, 0=N, 90=E
  pitchDeg: number; // elevation above horizon, 90=straight up, -90=straight down
  hFovDeg: number; // horizontal field of view
  vFovDeg: number; // vertical field of view
  screenWidth: number;
  screenHeight: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  inView: boolean;
}

/**
 * Project a target Alt/Az into screen pixel coordinates for the given camera.
 * Assumes the phone is held with no roll (upright portrait/landscape), which
 * is a reasonable simplification for a v1 prototype.
 */
export function project(altDeg: number, azDeg: number, camera: Camera): ProjectedPoint {
  const forward = altAzToVector(camera.pitchDeg, camera.headingDeg);
  const worldUp: Vec3 = { x: 0, y: 0, z: 1 };

  // Right-handed camera basis: right = forward x worldUp (falls back to a
  // fixed axis when looking straight up/down, where that cross product
  // degenerates).
  let right = cross(forward, worldUp);
  if (Math.hypot(right.x, right.y, right.z) < 1e-6) {
    right = { x: 1, y: 0, z: 0 };
  }
  right = normalize(right);
  const up = normalize(cross(right, forward));

  const target = altAzToVector(altDeg, azDeg);
  const sx = dot(target, right);
  const sy = dot(target, up);
  const sz = dot(target, forward);

  if (sz <= 0.01) {
    return { x: NaN, y: NaN, inView: false };
  }

  const focalX = camera.screenWidth / 2 / Math.tan((camera.hFovDeg * DEG2RAD) / 2);
  const focalY = camera.screenHeight / 2 / Math.tan((camera.vFovDeg * DEG2RAD) / 2);

  const px = camera.screenWidth / 2 + (sx / sz) * focalX;
  const py = camera.screenHeight / 2 - (sy / sz) * focalY;

  const inView = px >= 0 && px <= camera.screenWidth && py >= 0 && py <= camera.screenHeight;
  return { x: px, y: py, inView };
}
