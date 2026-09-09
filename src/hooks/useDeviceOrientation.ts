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
  absolute: boolean;
  permission: OrientationPermission;
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

      setState((s) => ({
        ...s,
        headingDeg: heading,
        pitchDeg: pitch,
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
