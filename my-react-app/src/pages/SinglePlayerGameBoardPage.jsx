import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DIFFICULTY_BANDS } from "../config/difficulty";

// ---- Local sudoku generator (port of backend/services/sudokuGenerator.js) ----
// Generates a complete valid grid via backtracking, then digs holes while
// keeping exactly one solution.

const EMPTY = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValidMove(board, row, col, num) {
  for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++)
    for (let c = boxCol; c < boxCol + 3; c++)
      if (board[r][c] === num) return false;
  return true;
}

function fillGrid(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== EMPTY) continue;
      for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
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

function generateSolvedGrid() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(EMPTY));
  fillGrid(board);
  return board;
}

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

function digHoles(solution, targetClues) {
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
  return puzzle.flat().map((v) => (v === EMPTY ? null : v));
}

function generatePuzzle(clueTarget) {
  const solution2d = generateSolvedGrid();
  const puzzle = digHoles(solution2d, clueTarget);
  return { puzzle, solution: solution2d.flat() };
}
// ---- end local generator ----

const POINTS = { correctCell: 10, completion: 50, wrongCell: -15 };

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function SinglePlayerGameBoardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const cfg = location.state || {};
  const difficulty = cfg.difficulty || "Medium";
  const clueCount = cfg.clueCount || DIFFICULTY_BANDS[difficulty].base;
  const powerUpsMax = cfg.powerUps || 3;

  const [puzzle, setPuzzle] = useState(null);
  const [solution, setSolution] = useState(null);
  const [board, setBoard] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState(() => Array.from({ length: 81 }, () => []));
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [powerUpsLeft, setPowerUpsLeft] = useState(powerUpsMax);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const historyRef = useRef([]);

  // Generate the puzzle once on mount.
  useEffect(() => {
    const { puzzle: p, solution: s } = generatePuzzle(clueCount);
    setPuzzle(p);
    setSolution(s);
    setBoard([...p]);
  }, [clueCount]);

  // Elapsed timer while playing.
  useEffect(() => {
    if (solved || !board) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [solved, board]);

  if (!board || !solution) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body-md text-body-md text-ink-black">
        Generating puzzle…
      </div>
    );
  }

  const isFixed = (idx) => puzzle[idx] != null;

  const checkCompletion = (nextBoard) => {
    if (nextBoard.every((v) => v != null)) {
      setSolved(true);
      return true;
    }
    return false;
  };

  const applyValue = (idx, value) => {
    if (isFixed(idx)) return;
    const prev = board[idx];
    setBoard((cur) => {
      const next = [...cur];
      next[idx] = value;
      historyRef.current.push({ idx, prev });
      if (value === solution[idx]) {
        setScore((s) => s + POINTS.correctCell);
        checkCompletion(next);
      } else {
        setScore((s) => s + POINTS.wrongCell);
        setMistakes((m) => m + 1);
      }
      return next;
    });
  };

  const handleCellClick = (idx) => {
    if (solved) return;
    if (isFixed(idx)) return;
    setSelected(idx);
  };

  const handleNumpad = (value) => {
    if (solved || selected == null) return;
    if (notesMode) {
      setNotes((cur) => {
        const next = [...cur];
        const set = new Set(next[selected]);
        if (set.has(value)) set.delete(value);
        else set.add(value);
        next[selected] = [...set].sort();
        return next;
      });
    } else {
      applyValue(selected, value);
      setSelected(null);
    }
  };

  const handleHint = () => {
    if (solved || selected == null || powerUpsLeft <= 0) return;
    setBoard((cur) => {
      const next = [...cur];
      next[selected] = solution[selected];
      historyRef.current.push({ idx: selected, prev: cur[selected] });
      setScore((s) => s + POINTS.correctCell);
      setPowerUpsLeft((p) => p - 1);
      checkCompletion(next);
      return next;
    });
    setSelected(null);
  };

  const handleUndo = () => {
    const last = historyRef.current.pop();
    if (!last) return;
    setBoard((cur) => {
      const next = [...cur];
      next[last.idx] = last.prev;
      return next;
    });
  };

  const handleErase = () => {
    if (selected == null || isFixed(selected)) return;
    applyValue(selected, null);
  };

  return (
    <>
      {/* Top App Bar */}
      <header className="flex justify-between items-center w-full px-margin-lg h-16 bg-paper-white border-b border-ink-black sticky top-0 z-40 hidden md:flex">
        <div className="font-headline-md text-headline-md font-bold tracking-tighter text-ink-black">
          SUDOKU
        </div>
        <nav className="flex space-x-margin-md">
          <Link
            to="/practice"
            className="font-label-mono text-label-mono text-ink-blue font-bold border-b-2 border-ink-blue hover:bg-surface-container transition-colors py-1"
          >
            New Game
          </Link>
          <Link
            to="/practice"
            className="font-label-mono text-label-mono text-secondary hover:bg-surface-container transition-colors py-1"
          >
            Challenges
          </Link>
          <Link
            to="/archive"
            className="font-label-mono text-label-mono text-secondary hover:bg-surface-container transition-colors py-1"
          >
            Archive
          </Link>
        </nav>
        <div className="flex space-x-4">
          <button className="hover:bg-surface-container p-2 transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="hover:bg-surface-container p-2 transition-colors">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation (Desktop) */}
        <aside className="hidden md:flex flex-col h-full w-64 bg-paper-white border-r border-ink-black p-margin-sm space-y-grid-unit">
          <div className="mb-margin-md px-4 pt-4">
            <h2 className="font-headline-sm text-headline-sm font-bold text-ink-black">
              Logic Master
            </h2>
            <p className="font-body-md text-body-md text-secondary">
              {difficulty} Level
            </p>
          </div>
          <nav className="flex flex-col space-y-1">
            <Link
              to="/practice"
              className="flex items-center space-x-4 px-4 py-3 bg-ink-blue text-paper-white font-bold transition-all duration-150 ease-in-out"
            >
              <span className="material-symbols-outlined">add_box</span>
              <span className="font-label-mono text-label-mono">New Game</span>
            </Link>
            <Link
              to="/practice/board"
              className="flex items-center space-x-4 px-4 py-3 text-ink-black hover:bg-surface-container-high transition-all duration-150 ease-in-out"
            >
              <span className="material-symbols-outlined">calendar_today</span>
              <span className="font-label-mono text-label-mono">Daily</span>
            </Link>
            <Link
              to="/archive"
              className="flex items-center space-x-4 px-4 py-3 text-ink-black hover:bg-surface-container-high transition-all duration-150 ease-in-out"
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span className="font-label-mono text-label-mono">Archive</span>
            </Link>
            <Link
              to="/stats"
              className="flex items-center space-x-4 px-4 py-3 text-ink-black hover:bg-surface-container-high transition-all duration-150 ease-in-out"
            >
              <span className="material-symbols-outlined">leaderboard</span>
              <span className="font-label-mono text-label-mono">Statistics</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-margin-lg flex justify-center items-start">
          <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-margin-lg">
            {/* Game Board Column */}
            <div className="flex-1 flex flex-col max-w-xl mx-auto lg:mx-0 w-full">
              {/* Game Info Header */}
              <div className="flex justify-between items-end mb-4 border-b border-ink-black pb-2">
                <div className="font-headline-sm text-headline-sm tracking-wider uppercase">
                  {difficulty} · {clueCount} clues
                </div>
                <div className="font-grid-number text-grid-number">
                  {formatTime(elapsed)}
                </div>
                <div className="font-body-lg text-body-lg">
                  {powerUpsLeft}/{powerUpsMax}
                </div>
              </div>

              {solved && (
                <div className="mb-4 border-2 border-ink-black bg-ink-black text-paper-white p-4 font-label-mono text-label-mono uppercase tracking-widest">
                  Solved! Score {score} · {formatTime(elapsed)} · {mistakes}{" "}
                  mistakes
                  <button
                    onClick={() => navigate("/practice")}
                    className="ml-4 underline hover:text-ink-blue"
                  >
                    New Game
                  </button>
                </div>
              )}

              {/* Sudoku Grid */}
              <div className="sudoku-grid aspect-square w-full font-grid-number text-grid-number mb-margin-md">
                {board.map((value, index) => {
                  const notesSet = notes[index] || [];
                  const isSel = selected === index;
                  const isFixedCell = isFixed(index);
                  const cls = `sudoku-cell ${
                    isFixedCell ? "fixed" : ""
                  } ${isSel ? "selected" : ""} ${
                    notesMode && notesSet.length ? "notes" : ""
                  }`;
                  return (
                    <div
                      key={index}
                      className={cls}
                      onClick={() => handleCellClick(index)}
                    >
                      {value != null
                        ? value
                        : notesMode && notesSet.length
                        ? notesSet.join("")
                        : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls Column */}
            <div className="flex flex-col w-full lg:w-64 space-y-margin-md pt-10">
              {/* Action Links */}
              <div className="flex flex-row lg:flex-col justify-around lg:justify-start gap-4">
                <button
                  className="font-body-lg text-body-lg text-ink-black hover:border-b hover:border-ink-black pb-0.5 self-start transition-all"
                  onClick={handleUndo}
                >
                  Undo
                </button>
                <button
                  className="font-body-lg text-body-lg text-ink-black hover:border-b hover:border-ink-black pb-0.5 self-start transition-all"
                  onClick={handleHint}
                  disabled={solved || powerUpsLeft <= 0}
                >
                  Hint ({powerUpsLeft})
                </button>
                <button
                  className="font-body-lg text-body-lg text-ink-black hover:border-b hover:border-ink-black pb-0.5 self-start transition-all"
                  onClick={handleErase}
                >
                  Erase
                </button>
              </div>
              {/* Notes Toggle */}
              <div className="flex items-center justify-between border-y border-ink-black py-4">
                <span className="font-headline-sm text-headline-sm">Notes</span>
                <button
                  className="font-label-mono text-label-mono hover:text-ink-blue transition-colors"
                  onClick={() => setNotesMode(!notesMode)}
                >
                  [{notesMode ? "ON" : "OFF"}]
                </button>
              </div>
              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-px bg-ink-black border border-ink-black">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumpad(Number(num))}
                    className="bg-paper-white h-16 flex items-center justify-center font-grid-number text-grid-number hover:bg-ink-black hover:text-paper-white transition-colors"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-paper-white border-t border-ink-black z-50">
        <Link
          to="/practice/board"
          className="flex flex-col items-center justify-center text-ink-blue font-bold active:bg-surface-container-high scale-95 duration-75 p-2"
        >
          <span className="material-symbols-outlined">grid_on</span>
          <span className="font-grid-notes text-grid-notes mt-1">Play</span>
        </Link>
        <Link
          to="/practice/board"
          className="flex flex-col items-center justify-center text-secondary active:bg-surface-container-high scale-95 duration-75 p-2"
        >
          <span className="material-symbols-outlined">event</span>
          <span className="font-grid-notes text-grid-notes mt-1">Daily</span>
        </Link>
        <Link
          to="/stats"
          className="flex flex-col items-center justify-center text-secondary active:bg-surface-container-high scale-95 duration-75 p-2"
        >
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="font-grid-notes text-grid-notes mt-1">Stats</span>
        </Link>
        <Link
          to="/settings"
          className="flex flex-col items-center justify-center text-secondary active:bg-surface-container-high scale-95 duration-75 p-2"
        >
          <span className="material-symbols-outlined">account_circle</span>
          <span className="font-grid-notes text-grid-notes mt-1">Profile</span>
        </Link>
      </nav>
    </>
  );
}

export default SinglePlayerGameBoardPage;
