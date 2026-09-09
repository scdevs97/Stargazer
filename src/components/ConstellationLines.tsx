export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function ConstellationLines({
  segments,
  width,
  height,
}: {
  segments: Segment[];
  width: number;
  height: number;
}) {
  if (segments.length === 0) return null;
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="rgba(150,200,255,0.55)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      ))}
    </svg>
  );
}
