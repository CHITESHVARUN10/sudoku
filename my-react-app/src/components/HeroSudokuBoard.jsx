// A single flat 9x9 sudoku board, tilted in space by ONE container-level
// CSS transform. No WebGL, no per-cell transforms — the grid is one flat
// plane, so numbers always render upright and legible.
// Depth comes from CSS: emphasized 3x3 separators, a hard editorial offset
// shadow, and blue "recently placed" accent cells (.hero-sudoku-cell.accent
// in index.css).

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

// Cells highlighted as "just played" (ink-blue tiles) and one empty cell
// ringed as "your move" — deterministic so the art is stable frame to frame.
const ACCENT_CELLS = new Set([4, 54, 67]);
const NEXT_CELL = 2;

function HeroSudokuBoard({ className = "" }) {
  return (
    <div className={`hero-sudoku-tilt ${className}`} aria-hidden="true">
      <div className="hero-sudoku-grid">
        {SAMPLE_PUZZLE.map((value, index) => (
          <div
            key={index}
            className={`hero-sudoku-cell ${
              ACCENT_CELLS.has(index)
                ? "accent"
                : index === NEXT_CELL
                ? "next"
                : ""
            }`}
          >
            {value !== 0 ? value : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroSudokuBoard;
