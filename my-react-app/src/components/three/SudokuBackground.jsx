import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { GridLattice as LazyGridLattice } from "./lazy";

// Full-page lattice backdrop behind all non-game pages. Very low opacity,
// pointer-events none, respects prefers-reduced-motion.
function SudokuBackground() {
  const location = useLocation();
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Game boards stay crisp and readable — no backdrop there.
  const isGameRoute =
    location.pathname.startsWith("/practice/board") ||
    location.pathname.startsWith("/multiplayer/board");

  if (isGameRoute) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.15 }}
      aria-hidden="true"
    >
      <LazyGridLattice
        reducedMotion={reducedMotion}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default SudokuBackground;
