import { useEffect, useMemo, useRef, useState } from "react";
import { useCamera } from "./hooks/useCamera";
import { useGeolocation } from "./hooks/useGeolocation";
import { useDeviceOrientation } from "./hooks/useDeviceOrientation";
import { CameraView } from "./components/CameraView";
import { SkyOverlay, type ProjectedStar } from "./components/SkyOverlay";
import { Controls, type Mode } from "./components/Controls";
import { PermissionGate } from "./components/PermissionGate";
import { SearchBar } from "./components/SearchBar";
import { GuideOverlay, type GuideTarget } from "./components/GuideOverlay";
import { ConstellationLines, type Segment } from "./components/ConstellationLines";
import { STARS } from "./lib/stars";
import { CONSTELLATION_FIGURES } from "./lib/constellations";
import { raDecToAltAz, sunAltitude } from "./lib/astro";
import { project, type Camera } from "./lib/projection";
import { guideOffset } from "./lib/guide";

const MANUAL_FALLBACK_MS = 2500;

const STAR_BY_NAME = new Map(STARS.map((s) => [s.name, s]));

export default function App() {
  const [started, setStarted] = useState(false);
  const [manualActive, setManualActive] = useState(false);
  const [manualHeading, setManualHeading] = useState(0);
  const [manualPitch, setManualPitch] = useState(0);
  const [mode, setMode] = useState<Mode>("visible");
  const [magLimit, setMagLimit] = useState(4.5);
  const [hFov, setHFov] = useState(60);
  const [now, setNow] = useState(() => new Date());
  const [nightMode, setNightMode] = useState(false);
  const [showConstellations, setShowConstellations] = useState(true);
  const [targetStarName, setTargetStarName] = useState<string | null>(null);

  const geo = useGeolocation();
  const orientation = useDeviceOrientation();
  const camera = useCamera(started);

  const dragState = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // If real sensor data never arrives after starting, fall back to
  // drag-to-look so the app is still usable (e.g. desktop testing, or a
  // browser that silently withholds orientation events).
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => {
      if (orientation.headingDeg === null) setManualActive(true);
    }, MANUAL_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [started, orientation.headingDeg]);

  async function handleStart() {
    await orientation.requestPermission();
    setStarted(true);
  }

  function onPointerDown(e: React.PointerEvent) {
    dragState.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.x;
    const dy = e.clientY - dragState.current.y;
    dragState.current = { x: e.clientX, y: e.clientY };
    const degPerPxX = hFov / viewport.w;
    const degPerPxY = (hFov * (viewport.h / viewport.w)) / viewport.h;
    setManualActive(true);
    setManualHeading((h) => (h - dx * degPerPxX + 360) % 360);
    setManualPitch((p) => Math.max(-90, Math.min(90, p + dy * degPerPxY)));
  }
  function onPointerUp() {
    dragState.current = null;
  }

  const heading = manualActive ? manualHeading : orientation.headingDeg;
  const pitch = manualActive ? manualPitch : orientation.pitchDeg;
  const rollDeg = manualActive ? 0 : orientation.rollDeg ?? 0;

  const vFov = hFov * (viewport.h / viewport.w);

  const sunAlt = useMemo(() => {
    if (geo.lat === null || geo.lon === null) return null;
    return sunAltitude(geo.lat, geo.lon, now);
  }, [geo.lat, geo.lon, now]);

  const cam: Camera | null = useMemo(() => {
    if (heading === null || pitch === null) return null;
    return {
      headingDeg: heading,
      pitchDeg: pitch,
      hFovDeg: hFov,
      vFovDeg: vFov,
      screenWidth: viewport.w,
      screenHeight: viewport.h,
      rollDeg,
    };
  }, [heading, pitch, hFov, vFov, viewport, rollDeg]);

  const projectedStars: ProjectedStar[] = useMemo(() => {
    if (geo.lat === null || geo.lon === null || !cam) return [];

    const isDarkEnough = sunAlt !== null && sunAlt < -6;

    const result: ProjectedStar[] = [];
    for (const star of STARS) {
      const altAz = raDecToAltAz(star.raHours, star.decDeg, geo.lat, geo.lon, now);
      if (altAz.altDeg < 0) continue; // below the horizon, geometrically not "there"

      const isCameraVisible = isDarkEnough && star.mag <= magLimit;
      if (mode === "visible" && !isCameraVisible) continue;

      const p = project(altAz.altDeg, altAz.azDeg, cam);
      if (!p.inView) continue;

      result.push({
        name: star.name,
        constellation: star.constellation,
        mag: star.mag,
        x: p.x,
        y: p.y,
        isCameraVisible,
      });
    }
    return result;
  }, [geo.lat, geo.lon, cam, now, mode, magLimit, sunAlt]);

  const constellationSegments: Segment[] = useMemo(() => {
    if (geo.lat === null || geo.lon === null || !cam || !showConstellations) return [];
    const lat = geo.lat;
    const lon = geo.lon;
    const activeCam = cam;

    const positions = new Map<string, { x: number; y: number }>();
    function positionOf(name: string) {
      if (positions.has(name)) return positions.get(name)!;
      const star = STAR_BY_NAME.get(name);
      if (!star) return null;
      const altAz = raDecToAltAz(star.raHours, star.decDeg, lat, lon, now);
      if (altAz.altDeg < 0) return null;
      const p = project(altAz.altDeg, altAz.azDeg, activeCam);
      if (Number.isNaN(p.x)) return null; // behind the camera
      positions.set(name, { x: p.x, y: p.y });
      return { x: p.x, y: p.y };
    }

    const segments: Segment[] = [];
    for (const figure of CONSTELLATION_FIGURES) {
      for (const [a, b] of figure.segments) {
        const pa = positionOf(a);
        const pb = positionOf(b);
        if (pa && pb) segments.push({ x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y });
      }
    }
    return segments;
  }, [geo.lat, geo.lon, cam, now, showConstellations]);

  const guideTarget: GuideTarget | null = useMemo(() => {
    if (!targetStarName || geo.lat === null || geo.lon === null || !cam) return null;
    const star = STAR_BY_NAME.get(targetStarName);
    if (!star) return null;
    const altAz = raDecToAltAz(star.raHours, star.decDeg, geo.lat, geo.lon, now);
    const { arrowAngleDeg, distanceDeg } = guideOffset(cam.headingDeg, cam.pitchDeg, altAz.azDeg, altAz.altDeg);
    const p = project(altAz.altDeg, altAz.azDeg, cam);
    return {
      name: targetStarName,
      x: p.x,
      y: p.y,
      inView: p.inView,
      arrowAngleDeg,
      distanceDeg,
    };
  }, [targetStarName, geo.lat, geo.lon, cam, now]);

  const errors = [geo.error, camera.error].filter((e): e is string => !!e);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        touchAction: "none",
        filter: nightMode ? "sepia(1) saturate(6) hue-rotate(-50deg) brightness(0.6)" : "none",
      }}
    >
      <CameraView videoRef={camera.videoRef} />
      {started && (
        <ConstellationLines segments={constellationSegments} width={viewport.w} height={viewport.h} />
      )}
      {started && <SkyOverlay stars={projectedStars} />}
      {started && <GuideOverlay target={guideTarget} onClear={() => setTargetStarName(null)} />}
      {started && <SearchBar onSelect={setTargetStarName} />}
      {started && (
        <Controls
          mode={mode}
          onModeChange={setMode}
          magLimit={magLimit}
          onMagLimitChange={setMagLimit}
          hFov={hFov}
          onHFovChange={setHFov}
          debug={{ heading, pitch, lat: geo.lat, lon: geo.lon, sunAlt }}
          manualMode={manualActive}
          onExitManual={() => setManualActive(false)}
          starCount={projectedStars.length}
          nightMode={nightMode}
          onNightModeChange={setNightMode}
          showConstellations={showConstellations}
          onShowConstellationsChange={setShowConstellations}
        />
      )}
      {!started && <PermissionGate onStart={handleStart} errors={errors} />}
    </div>
  );
}
