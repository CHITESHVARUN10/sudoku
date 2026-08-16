import { lazy, Suspense } from "react";

// Lazy wrappers so the three.js bundle is fetched only when a scene is
// actually rendered — the main route paints without waiting for WebGL code.
const LazySudokuCube = lazy(() => import("./SudokuCube"));
const LazyGridLattice = lazy(() => import("./GridLattice"));

function SudokuCube(props) {
  return (
    <Suspense fallback={null}>
      <LazySudokuCube {...props} />
    </Suspense>
  );
}

function GridLattice(props) {
  return (
    <Suspense fallback={null}>
      <LazyGridLattice {...props} />
    </Suspense>
  );
}

export { SudokuCube, GridLattice };
