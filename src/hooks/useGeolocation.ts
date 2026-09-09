import { useEffect, useState } from "react";

export interface GeoState {
  lat: number | null;
  lon: number | null;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ lat: null, lon: null, error: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not available in this browser." }));
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({ lat: pos.coords.latitude, lon: pos.coords.longitude, error: null });
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message }));
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
