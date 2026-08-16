// A single flat 9x9 sudoku board, tilted in space by ONE container-level
// CSS transform. No WebGL, no per-cell transforms — the grid is one flat
// plane, so numbers always render upright and legible.

const SAMPLE_PUZZLE = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9,
];

function HeroSudokuBoard({ className = "" }) {
  return (
    <div className={`hero-sudoku-tilt ${className}`} aria-hidden="true">
      <div className="hero-sudoku-grid">
        {SAMPLE_PUZZLE.map((value, index) => (
          <div key={index} className="hero-sudoku-cell">
            {value !== 0 ? value : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroSudokuBoard;
