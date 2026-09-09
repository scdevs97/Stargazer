# Changelog

Notable changes to the Stargazer prototype, newest first.

## Unreleased

### Added
- **Roll (tilt) compensation** in the projection math: the overlay now
  stays aligned with the live camera image even when the phone is twisted
  around its own optical axis, not just panned or tilted up/down. Derived
  from the raw device-orientation tilt sensors, independent of compass
  heading (`rollDegFromTilt` in `src/hooks/useDeviceOrientation.ts`,
  applied in `src/lib/projection.ts`). Best-effort pending real-device
  validation — see README limitations.
- **Find a star**: a search bar to look up any catalog star by name. If
  it's already in frame, it's highlighted with a glowing ring; if not, a
  banner with a rotating arrow and an estimated "how far to pan" distance
  points the way (`src/lib/guide.ts`, `SearchBar`/`GuideOverlay`
  components).
- **Constellation line art**: dashed lines connecting the stars of five
  well-known figures (Orion, the Big Dipper, the Southern Cross,
  Cassiopeia, Leo), toggleable from the controls
  (`src/lib/constellations.ts`, `ConstellationLines` component). Added 5
  new catalog stars (Merak, Imai, Navi, Ruchbah, Segin) needed to complete
  these shapes.
- **Night vision mode**: a toggle that tints the whole screen deep red,
  the standard astronomer's trick for reading a screen without losing
  dark-adapted eyes.
- **Unit tests** (`npm test`, via Vitest) for all the pure math: horizon
  geometry sanity checks (pole altitude = declination, Polaris staying
  circumpolar), sun-altitude seasonal sanity checks, the perspective
  projection (center/edge/behind-camera/roll cases), the roll-from-tilt
  formula's structural properties, the find-a-star guide math, and a
  catalog-consistency check that every constellation line references a
  real star (caught one typo already).

## Initial prototype

- Camera feed (`getUserMedia`) + GPS (`Geolocation`) + compass/tilt
  (`DeviceOrientationEvent`) drive a live AR overlay labeling every
  catalog star geometrically within the camera's field of view, computed
  from real RA/Dec → Alt/Az astronomy (`src/lib/astro.ts`) and a
  perspective projection into screen pixels (`src/lib/projection.ts`).
- **All stars in frame** vs. **Only visible ones** toggle: the former
  shows (dimmed) every star in view regardless of brightness or daylight,
  the latter filters to what would realistically be visible given a
  magnitude cutoff slider and the sun's altitude.
- Field-of-view slider, and a drag-to-look fallback for when sensors
  aren't available (desktop testing, or a browser withholding events).
- Curated catalog of ~90 of the brightest naked-eye stars.
- README with setup/run instructions and known limitations; demo
  screenshots captured via a headless browser with a synthetic camera
  feed and mocked geolocation.
