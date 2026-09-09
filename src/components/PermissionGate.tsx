export function PermissionGate({
  onStart,
  errors,
}: {
  onStart: () => void;
  errors: string[];
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#05070d",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, margin: 0 }}>Stargazer</h1>
      <p style={{ maxWidth: 320, opacity: 0.8, fontSize: 14, lineHeight: 1.5 }}>
        Point your phone at the sky and it will label every star that should
        be there — visible or not. Needs camera, location, and compass
        access.
      </p>
      <button
        onClick={onStart}
        style={{
          padding: "12px 28px",
          borderRadius: 999,
          border: "none",
          background: "#fff",
          color: "#000",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        Start
      </button>
      {errors.length > 0 && (
        <div style={{ fontSize: 12, color: "#ff8080", maxWidth: 320 }}>
          {errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}
      <p style={{ maxWidth: 320, opacity: 0.5, fontSize: 11 }}>
        No sensors? You can drag on screen to look around instead.
      </p>
    </div>
  );
}
