// Scoring rules for both solo and multiplayer modes.
// Correct cell +10, completing a row/column/box +50, wrong cell -15.

const POINTS_CONFIG = {
  correctCell: 10,
  completion: 50,
  wrongCell: -15,
};

// Given a board (81 flat cells, null = empty), the cell index and value just
// placed, and whether the value is correct, return { delta, completedLines }.
function scoreMove({ board, cell, value, correct }) {
  if (value == null) {
    // Erasing a cell: no score change.
    return { delta: 0, completedLines: 0 };
  }

  // Simulate placing the value to check line completion.
  const next = [...board];
  next[cell] = value;

  const row = Math.floor(cell / 9);
  const col = cell % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  let completedLines = 0;

  // Row complete?
  if (next.slice(row * 9, row * 9 + 9).every((v) => v != null)) completedLines++;

  // Column complete?
  let colComplete = true;
  for (let r = 0; r < 9; r++) {
    if (next[r * 9 + col] == null) {
      colComplete = false;
      break;
    }
  }
  if (colComplete) completedLines++;

  // Box complete?
  let boxComplete = true;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (next[r * 9 + c] == null) {
        boxComplete = false;
        break;
      }
    }
    if (!boxComplete) break;
  }
  if (boxComplete) completedLines++;

  if (!correct) {
    return { delta: POINTS_CONFIG.wrongCell, completedLines: 0 };
  }

  const delta = POINTS_CONFIG.correctCell + completedLines * POINTS_CONFIG.completion;
  return { delta, completedLines };
}

// Full pipeline: apply a move to a board copy and return { board, delta, completedLines }.
function applyMove({ board, cell, value, correct }) {
  const next = [...board];
  next[cell] = value;

  if (value == null) {
    return { board: next, delta: 0, completedLines: 0 };
  }

  const res = scoreMove({ board: next, cell, value, correct });
  return { board: next, ...res };
}

module.exports = { POINTS_CONFIG, scoreMove, applyMove };
