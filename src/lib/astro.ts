// Minimal positional-astronomy math: no external dependency.
// Formulas follow the standard treatment in Meeus, "Astronomical Algorithms"
// and Duffett-Smith, "Practical Astronomy with your Calculator".

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function toJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** Greenwich Mean Sidereal Time, in degrees. */
function gmstDeg(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return normalizeDeg(gmst);
}

export interface AltAz {
  altDeg: number;
  azDeg: number; // measured from North, clockwise through East
}

/**
 * Convert equatorial coordinates (RA/Dec, J2000) to horizontal coordinates
 * (Alt/Az) for an observer at (latDeg, lonDeg) at the given instant.
 * lonDeg is east-positive.
 */
export function raDecToAltAz(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date
): AltAz {
  const jd = toJulianDate(date);
  const lstDeg = normalizeDeg(gmstDeg(jd) + lonDeg);
  const raDeg = raHours * 15;
  const hourAngleDeg = normalizeDeg(lstDeg - raDeg);

  const H = hourAngleDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;
  const lat = latDeg * DEG2RAD;

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H);
  const alt = Math.asin(Math.min(1, Math.max(-1, sinAlt)));

  const cosAz =
    (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
  const azTemp = Math.acos(Math.min(1, Math.max(-1, cosAz)));
  const azDeg = Math.sin(H) > 0 ? 360 - azTemp * RAD2DEG : azTemp * RAD2DEG;

  return { altDeg: alt * RAD2DEG, azDeg: normalizeDeg(azDeg) };
}

/**
 * Low-precision solar position (good to ~0.01 deg, from Meeus ch. 25),
 * used only to estimate sky brightness (is it day, twilight, or night).
 */
export function sunAltitude(latDeg: number, lonDeg: number, date: Date): number {
  const jd = toJulianDate(date);
  const T = (jd - 2451545.0) / 36525;

  const L0 = normalizeDeg(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = normalizeDeg(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrad = M * DEG2RAD;

  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const apparentLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG2RAD);

  const eps0 = 23.439291 - 0.0130042 * T;
  const eps = eps0 + 0.00256 * Math.cos(omega * DEG2RAD);

  const lambda = apparentLong * DEG2RAD;
  const epsRad = eps * DEG2RAD;

  const raRad = Math.atan2(Math.cos(epsRad) * Math.sin(lambda), Math.cos(lambda));
  const decRad = Math.asin(Math.sin(epsRad) * Math.sin(lambda));

  const raHours = normalizeDeg(raRad * RAD2DEG) / 15;
  const decDeg = decRad * RAD2DEG;

  return raDecToAltAz(raHours, decDeg, latDeg, lonDeg, date).altDeg;
}
