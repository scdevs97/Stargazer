import type { RefObject } from "react";

export function CameraView({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
  return (
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        background: "#000",
      }}
    />
  );
}
