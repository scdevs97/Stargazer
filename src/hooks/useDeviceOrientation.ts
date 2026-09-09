import { useCallback, useEffect, useRef, useState } from "react";

// iOS exposes a nonstandard permission gate and a ready-made true-heading
// field; neither is in the standard TS DOM lib.
interface IOSDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}
type DeviceOrientationEventIOS = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export type OrientationPermission = "unknown" | "unnecessary" | "granted" | "denied";

export interface OrientationState {
  headingDeg: number | null; // compass heading of the back camera, 0=N, clockwise
  pitchDeg: number | null; // elevation above horizon
  rollDeg: number | null; // twist around the camera's own optical axis
  absolute: boolean;
  permission: OrientationPermission;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/**
 * How far the phone is twisted around the camera's optical axis, derived
 * purely from the tilt angles (beta, gamma) -- deliberately independent of
 * compass heading (alpha), because rotating around a vertical axis doesn't
 * change how tilted the horizon looks in the viewfinder.
 *
 * Geometrically this is the direction of the world's zenith as seen in the
 * device's own (right, top) plane: the third row of the standard W3C
 * device-orientation rotation matrix, which has no alpha term.
 *
 * NOTE: implemented from first principles and covered by unit tests for
 * its structural properties (zero at beta=90/gamma=0, antisymmetric in
 * gamma), but the sign convention has not been validated against a real
 * device -- treat as best-effort pending field testing. A real roll motion
 * while pointed at the horizon shifts the sensor's beta reading away from
 * 90 in tandem with gamma; this formula uses both, so it tracks that
 * correctly even though holding beta artificially fixed at exactly 90
 * always reports zero roll (see the unit tests).
 */
export function rollDegFromTilt(betaDeg: number, gammaDeg: number): number {
  const b = betaDeg * D2R;
  const g = gammaDeg * D2R;
  const zenithInDeviceX = -Math.cos(b) * Math.sin(g);
  const zenithInDeviceY = Math.sin(b);
  return Math.atan2(zenithInDeviceX, zenithInDeviceY) * R2D;
}

/**
 * Compass heading from raw alpha/beta/gamma, compensating for device tilt.
 * Standard formula (Zorn / W3C DeviceOrientation examples). Assumes `alpha`
 * is referenced to true/magnetic north, which only holds for "absolute"
 * events — otherwise this is a self-consistent heading, not a true one.
 */
function headingFromEuler(alpha: number, beta: number, gamma: number): number {
  const d2r = Math.PI / 180;
  const a = alpha * d2r;
  const b = beta * d2r;
  const g = gamma * d2r;

  const cA = Math.cos(a), sA = Math.sin(a);
  const sB = Math.sin(b);
  const cG = Math.cos(g), sG = Math.sin(g);

  const rA = -cA * sG - sA * sB * cG;
  const rB = -sA * sG + cA * sB * cG;

  let heading = Math.atan2(rA, rB);
  if (heading < 0) heading += 2 * Math.PI;
  return heading * (180 / Math.PI);
}

export function useDeviceOrientation() {
  const [state, setState] = useState<OrientationState>({
    headingDeg: null,
    pitchDeg: null,
    rollDeg: null,
    absolute: false,
    permission: "unknown",
  });
  const listenerAttached = useRef(false);

  const attachListener = useCallback(() => {
    if (listenerAttached.current) return;
    listenerAttached.current = true;

    const handle = (event: Event) => {
      const e = event as IOSDeviceOrientationEvent;
      if (e.beta === null || e.gamma === null) return;
      const alpha = e.alpha ?? 0;
      const beta = e.beta;
      const gamma = e.gamma;

      let heading: number;
      if (typeof e.webkitCompassHeading === "number") {
        heading = e.webkitCompassHeading;
      } else {
        heading = headingFromEuler(alpha, beta, gamma);
      }

      // Elevation of the back camera above the horizon, assuming the phone
      // is held upright (portrait) like a viewfinder, with minimal roll.
      const pitch = Math.max(-90, Math.min(90, beta - 90));
      const roll = rollDegFromTilt(beta, gamma);

      setState((s) => ({
        ...s,
        headingDeg: heading,
        pitchDeg: pitch,
        rollDeg: roll,
        absolute: e.absolute === true || typeof e.webkitCompassHeading === "number",
      }));
    };

    const hasAbsolute = "ondeviceorientationabsolute" in window;
    const eventName = hasAbsolute ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(eventName, handle as EventListener, true);
  }, []);

  const requestPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as DeviceOrientationEventIOS;
    if (typeof DOE.requestPermission === "function") {
      try {
        const result = await DOE.requestPermission();
        setState((s) => ({ ...s, permission: result }));
        if (result === "granted") attachListener();
        return result;
      } catch {
        setState((s) => ({ ...s, permission: "denied" }));
        return "denied";
      }
    }
    // Non-iOS browsers don't gate this behind a permission prompt.
    setState((s) => ({ ...s, permission: "unnecessary" }));
    attachListener();
    return "unnecessary";
  }, [attachListener]);

  useEffect(() => {
    const DOE = DeviceOrientationEvent as DeviceOrientationEventIOS | undefined;
    if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") return;
    if (typeof DOE?.requestPermission !== "function") {
      // Safe to attach immediately; no permission gate on this platform.
      setState((s) => ({ ...s, permission: "unnecessary" }));
      attachListener();
    }
  }, [attachListener]);

  return { ...state, requestPermission };
}
