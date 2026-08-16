import { useMemo } from "react";

// True when the user prefers reduced motion — scenes should render static.
function useReducedMotion() {
  return useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );
}

export default useReducedMotion;
