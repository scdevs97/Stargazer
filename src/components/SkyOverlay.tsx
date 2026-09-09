export interface ProjectedStar {
  name: string;
  constellation: string;
  mag: number;
  x: number;
  y: number;
  isCameraVisible: boolean;
}

export function SkyOverlay({ stars }: { stars: ProjectedStar[] }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s) => {
        // Brighter (lower magnitude) stars get a bigger, more opaque marker.
        const size = Math.max(3, 11 - s.mag * 2.2);
        const dimmed = !s.isCameraVisible;
        return (
          <div
            key={s.name}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <div
              style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: dimmed ? "rgba(255,255,255,0.35)" : "#fff",
                boxShadow: dimmed ? "none" : "0 0 6px 2px rgba(255,255,255,0.7)",
                border: dimmed ? "1px solid rgba(255,255,255,0.6)" : "none",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: dimmed ? "rgba(255,255,255,0.55)" : "#fff",
                textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                whiteSpace: "nowrap",
              }}
            >
              {s.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
