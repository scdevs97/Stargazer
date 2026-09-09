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

/** Rotate vector v by angle (radians) around unit axis k, via Rodrigues' formula. */
function rotateAroundAxis(v: Vec3, k: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const kxv = cross(k, v);
  const kdotv = dot(k, v);
  return {
    x: v.x * c + kxv.x * s + k.x * kdotv * (1 - c),
    y: v.y * c + kxv.y * s + k.y * kdotv * (1 - c),
    z: v.z * c + kxv.z * s + k.z * kdotv * (1 - c),
  };
}

export interface Camera {
  headingDeg: number; // compass heading the camera points at, 0=N, 90=E
  pitchDeg: number; // elevation above horizon, 90=straight up, -90=straight down
  hFovDeg: number; // horizontal field of view
  vFovDeg: number; // vertical field of view
  screenWidth: number;
  screenHeight: number;
  /**
   * How far the phone is twisted around the camera's own optical axis
   * (e.g. held tilted like a head-tilt, or rotated into landscape),
   * in degrees. 0 = no roll, screen "up" points toward the zenith's
   * projection the way earlier prototype versions always assumed.
   * Optional — omit (or pass 0) to keep that original behavior.
   */
  rollDeg?: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  inView: boolean;
}

/**
 * Project a target Alt/Az into screen pixel coordinates for the given camera.
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
  let up = normalize(cross(right, forward));

  // The basis above always treats "screen up" as pointing toward the
  // zenith's projection (zero roll). If the phone is twisted around the
  // camera axis, spin the (right, up) pair by that same amount so the
  // overlay stays aligned with what the tilted camera image actually shows.
  if (camera.rollDeg) {
    const rollRad = camera.rollDeg * DEG2RAD;
    right = rotateAroundAxis(right, forward, rollRad);
    up = rotateAroundAxis(up, forward, rollRad);
  }

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
