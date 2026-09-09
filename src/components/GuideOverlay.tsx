export interface GuideTarget {
  name: string;
  x: number;
  y: number;
  inView: boolean;
  arrowAngleDeg: number;
  distanceDeg: number;
}

export function GuideOverlay({
  target,
  onClear,
}: {
  target: GuideTarget | null;
  onClear: () => void;
}) {
  if (!target) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {target.inView && (
        <div
          style={{
            position: "absolute",
            left: target.x,
            top: target.y,
            transform: "translate(-50%, -50%)",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid #5ad8ff",
            boxShadow: "0 0 14px 4px rgba(90,216,255,0.65)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: "calc(64px + env(safe-area-inset-top))",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(0,0,0,0.65)",
            color: "#fff",
            borderRadius: 999,
            padding: "8px 14px",
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
          }}
        >
          {!target.inView && (
            <span
              style={{
                display: "inline-block",
                transform: `rotate(${target.arrowAngleDeg}deg)`,
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ↑
            </span>
          )}
          <span>
            {target.inView
              ? `${target.name} is in frame`
              : `${target.name} — about ${target.distanceDeg.toFixed(0)}° that way`}
          </span>
          <button
            onClick={onClear}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              opacity: 0.7,
              fontSize: 14,
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Stop locating"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
