// Scoring rules for both solo and multiplayer modes.
// Correct cell +10, completing a row/column/box with CORRECT values +50,
// wrong cell -15.

const POINTS_CONFIG = {
  correctCell: 10,
  completion: 50,
  wrongCell: -15,
};

// The row, column and box containing `cell`, each with an id and its 9 cell
// indices. Line ids let callers track which completions were already paid.
function candidateLines(cell) {
  const row = Math.floor(cell / 9);
  const col = cell % 9;
  const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const boxCells = [];
  for (let r = Math.floor(row / 3) * 3; r < Math.floor(row / 3) * 3 + 3; r++) {
    for (let c = Math.floor(col / 3) * 3; c < Math.floor(col / 3) * 3 + 3; c++) {
      boxCells.push(r * 9 + c);
    }
  }
  return {
    row: {
      id: `row-${row}`,
      cells: Array.from({ length: 9 }, (_, c) => row * 9 + c),
    },
    col: {
      id: `col-${col}`,
      cells: Array.from({ length: 9 }, (_, r) => r * 9 + col),
    },
    box: { id: `box-${boxIndex}`, cells: boxCells },
  };
}

// Line completions count as fully CORRECT lines only (every cell equals the
// solution) — a line with a filled wrong value never counts. With permanent
// placement each line can reach that state exactly once, so tracking awarded
// lines is unnecessary; the solution check alone prevents double awards.
function completeCorrectLinesIds(next, cell, solution) {
  const { row, col, box } = candidateLines(cell);
  const ids = [];
  for (const line of [row, col, box]) {
    if (line.cells.every((i) => next[i] != null && next[i] === solution[i])) {
      ids.push(line.id);
    }
  }
  return ids;
}

// Given a board (81 flat cells, null = empty), the cell index and value just
// placed, and whether the value is correct, return { delta, completedLines, completedLineIds }.
function scoreMove({ board, cell, value, correct, solution }) {
  if (value == null) {
    // Erasing a cell: no score change.
    return { delta: 0, completedLines: 0, completedLineIds: [] };
  }

  // Simulate placing the value to check line completion.
  const next = [...board];
  next[cell] = value;

  if (!correct) {
    return { delta: POINTS_CONFIG.wrongCell, completedLines: 0, completedLineIds: [] };
  }

  const completedLineIds = solution
    ? completeCorrectLinesIds(next, cell, solution)
    : [];
  const delta =
    POINTS_CONFIG.correctCell + completedLineIds.length * POINTS_CONFIG.completion;
  return { delta, completedLines: completedLineIds.length, completedLineIds };
}

// Full pipeline: apply a move to a board copy and return { board, delta, ... }.
// NOTE: scoreMove internally clones again (next), so pass the ORIGINAL board here —
// it handles the cell placement itself. Double-applying would mis-count completions.
function applyMove({ board, cell, value, correct, solution }) {
  if (value == null) {
    const next = [...board];
    next[cell] = value;
    return { board: next, delta: 0, completedLines: 0, completedLineIds: [] };
  }

  const res = scoreMove({ board, cell, value, correct, solution });
  const next = [...board];
  next[cell] = value;
  return { board: next, ...res };
}

module.exports = { POINTS_CONFIG, scoreMove, applyMove, candidateLines, completeCorrectLinesIds };
