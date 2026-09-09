import { useState } from "react";
import { STARS } from "../lib/stars";

export function SearchBar({ onSelect }: { onSelect: (name: string) => void }) {
  const [query, setQuery] = useState("");

  const matches =
    query.trim().length === 0
      ? []
      : STARS.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6);

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(12px + env(safe-area-inset-top))",
        left: 12,
        right: 12,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find a star (e.g. Sirius)…"
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 14,
          outline: "none",
        }}
      />
      {matches.length > 0 && (
        <div
          style={{
            marginTop: 6,
            background: "rgba(0,0,0,0.75)",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {matches.map((s) => (
            <button
              key={s.name}
              onClick={() => {
                onSelect(s.name);
                setQuery("");
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                background: "none",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {s.name} <span style={{ opacity: 0.6, fontSize: 12 }}>· {s.constellation}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
