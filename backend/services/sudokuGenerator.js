const DIFFICULTY_CLUES = {
  Easy: 38,
  Medium: 33,
  Hard: 29,
  Expert: 24,
};

const EMPTY = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Check placing `num` at (row, col) violates no row/column/box rule
function isValidMove(board, row, col, num) {
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

// Recursive backtracking fill; true when the grid is fully solved
function fillGrid(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== EMPTY) continue;
      const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const num of candidates) {
        if (!isValidMove(board, row, col, num)) continue;
        board[row][col] = num;
        if (fillGrid(board)) return true;
        board[row][col] = EMPTY;
      }
      return false;
    }
  }
  return true;
}

// Random complete valid 9x9 grid (backtracking + shuffled candidates)
function generateSolvedGrid() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(EMPTY));
  fillGrid(board);
  return board;
}

// Count solutions of a 9x9 board, stopping early at `limit`
function countSolutions(board, limit = 2) {
  let count = 0;

  function solve(grid) {
    if (count >= limit) return;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] !== EMPTY) continue;
        for (let num = 1; num <= 9; num++) {
          if (!isValidMove(grid, row, col, num)) continue;
          grid[row][col] = num;
          solve(grid);
          grid[row][col] = EMPTY;
        }
        return;
      }
    }
    count++;
  }

  solve(board);
  return count;
}

// Carve holes from a solved grid until `targetClues` remain, keeping uniqueness
// Accepts a difficulty level OR a raw clue count.
function digHoles(solution, difficultyOrClues = 'Medium') {
  const targetClues =
    typeof difficultyOrClues === 'number'
      ? Math.min(40, Math.max(17, difficultyOrClues))
      : DIFFICULTY_CLUES[difficultyOrClues] ?? DIFFICULTY_CLUES.Medium;
  const puzzle = solution.map((row) => [...row]);
  const positions = shuffle([...Array(81).keys()]);

  let clues = 81;
  for (const pos of positions) {
    if (clues <= targetClues) break;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const backup = puzzle[row][col];
    puzzle[row][col] = EMPTY;
    if (countSolutions(puzzle.map((r) => [...r]), 2) !== 1) {
      puzzle[row][col] = backup;
    } else {
      clues--;
    }
  }
  return puzzle;
}

function flatten(board) {
  return board.flat().map((v) => (v === EMPTY ? null : v));
}

// Public entry: difficulty (or explicit clue count) -> { puzzle, solution } as flat 81-cell arrays (null = empty)
// Accepts a difficulty level ("Easy".."Expert") OR a raw clue count (17-40).
function generatePuzzle(difficultyOrClues = 'Medium') {
  const solution = generateSolvedGrid();
  const isLevel = typeof difficultyOrClues === 'string';
  const target = isLevel
    ? DIFFICULTY_CLUES[difficultyOrClues] ?? DIFFICULTY_CLUES.Medium
    : Math.min(40, Math.max(17, difficultyOrClues));
  const puzzle = digHoles(solution, target);
  const flatPuzzle = flatten(puzzle);
  return {
    puzzle: flatPuzzle,
    solution: flatten(solution),
    difficulty: isLevel ? difficultyOrClues : 'Custom',
    clues: flatPuzzle.filter((v) => v !== null).length,
  };
}

module.exports = {
  isValidMove,
  generateSolvedGrid,
  countSolutions,
  digHoles,
  generatePuzzle,
  DIFFICULTY_CLUES,
};
