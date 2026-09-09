export type Mode = "all" | "visible";

export interface ControlsProps {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  magLimit: number;
  onMagLimitChange: (v: number) => void;
  hFov: number;
  onHFovChange: (v: number) => void;
  debug: { heading: number | null; pitch: number | null; lat: number | null; lon: number | null; sunAlt: number | null };
  manualMode: boolean;
  onExitManual: () => void;
  starCount: number;
  nightMode: boolean;
  onNightModeChange: (v: boolean) => void;
  showConstellations: boolean;
  onShowConstellationsChange: (v: boolean) => void;
}

export function Controls({
  mode,
  onModeChange,
  magLimit,
  onMagLimitChange,
  hFov,
  onHFovChange,
  debug,
  manualMode,
  onExitManual,
  starCount,
  nightMode,
  onNightModeChange,
  showConstellations,
  onShowConstellationsChange,
}: ControlsProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "12px 16px calc(16px + env(safe-area-inset-bottom))",
        background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.0))",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onModeChange("all")}
          style={pillStyle(mode === "all")}
        >
          All stars in frame
        </button>
        <button
          onClick={() => onModeChange("visible")}
          style={pillStyle(mode === "visible")}
        >
          Only visible ones
        </button>
        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8, alignSelf: "center" }}>
          {starCount} shown
        </div>
      </div>

      {mode === "visible" && (
        <label style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          Limiting magnitude (brightness cutoff): {magLimit.toFixed(1)}
          <input
            type="range"
            min={-1}
            max={6}
            step={0.1}
            value={magLimit}
            onChange={(e) => onMagLimitChange(parseFloat(e.target.value))}
          />
        </label>
      )}

      <label style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        Camera field of view: {hFov.toFixed(0)}°
        <input
          type="range"
          min={30}
          max={100}
          step={1}
          value={hFov}
          onChange={(e) => onHFovChange(parseFloat(e.target.value))}
        />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onShowConstellationsChange(!showConstellations)} style={pillStyle(showConstellations)}>
          Constellation lines
        </button>
        <button onClick={() => onNightModeChange(!nightMode)} style={pillStyle(nightMode)}>
          Night vision
        </button>
      </div>

      {manualMode && (
        <button onClick={onExitManual} style={pillStyle(false)}>
          Drag mode active — tap to use compass
        </button>
      )}

      <div style={{ fontSize: 11, opacity: 0.7, fontFamily: "monospace" }}>
        heading {fmt(debug.heading)}° · pitch {fmt(debug.pitch)}° · lat {fmt(debug.lat, 3)} · lon{" "}
        {fmt(debug.lon, 3)} · sun alt {fmt(debug.sunAlt)}°
      </div>
    </div>
  );
}

function fmt(v: number | null, digits = 1): string {
  return v === null ? "—" : v.toFixed(digits);
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.3)",
    background: active ? "#fff" : "rgba(255,255,255,0.08)",
    color: active ? "#000" : "#fff",
    fontSize: 13,
    fontWeight: 600,
  };
}
