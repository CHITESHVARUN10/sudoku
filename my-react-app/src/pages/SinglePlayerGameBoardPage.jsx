import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DIFFICULTY_BANDS } from "../config/difficulty";
import { usePractice } from "../contexts/PracticeContext";
import { useDaily } from "../contexts/DailyContext";
import Navbar from "../components/Navbar";
import useKeyboardSudoku from "../hooks/useKeyboardSudoku";

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function SinglePlayerGameBoardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumeGame, makeMove, requestHint, fetchActiveGame, abandonGame, saveNotes } =
    usePractice();
  const { startDailyGame } = useDaily();
  const cfg = location.state || {};
  const isDaily = cfg.source === "daily";
  const dailyPuzzleId = cfg.puzzleId || null;
  const [gameId, setGameId] = useState(cfg.gameId || null);
  const [difficulty, setDifficulty] = useState(cfg.difficulty || "Medium");
  const [clueCount, setClueCount] = useState(
    cfg.clueCount || DIFFICULTY_BANDS[cfg.difficulty || "Medium"].base
  );
  const [powerUpsMax, setPowerUpsMax] = useState(cfg.powerUps || 3);

  const [puzzle, setPuzzle] = useState(null); // initial (given) cells
  const [board, setBoard] = useState(null);
  const [feedback, setFeedback] = useState({}); // idx -> 'correct' | 'wrong'
  const [selected, setSelected] = useState(null);
  const [lastCell, setLastCell] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState(() => Array.from({ length: 81 }, () => []));
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [lastDelta, setLastDelta] = useState(null); // { value, correct }
  const [hintMsg, setHintMsg] = useState("");
  const [powerUpsLeft, setPowerUpsLeft] = useState(powerUpsMax);
  const [solved, setSolved] = useState(false);
  const [finalStatus, setFinalStatus] = useState(null); // 'solved' | 'completed'
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [moveError, setMoveError] = useState("");

  // No gameId from route state? Fall back to the user's active game (persistence).
  useEffect(() => {
    if (gameId) return;
    let cancelled = false;

    // Daily mode: begin/resume the daily game from the backend.
    if (isDaily && dailyPuzzleId) {
      startDailyGame(dailyPuzzleId)
        .then((g) => {
          if (cancelled) return;
          setGameId(g._id);
          setDifficulty(g.difficulty || "Medium");
          setClueCount(
            g.clueCount || DIFFICULTY_BANDS[g.difficulty || "Medium"].base
          );
          setPowerUpsMax(g.powerUpsTotal || 0);
        })
        .catch(() => {
          if (!cancelled) {
            setError("Could not start the daily puzzle.");
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    fetchActiveGame()
      .then((g) => {
        if (cancelled) return;
        if (!g) {
          setError("No game in progress — start a new practice session.");
          setLoading(false);
          return;
        }
        setGameId(g._id);
        setDifficulty(g.difficulty || "Medium");
        setClueCount(
          g.clueCount || DIFFICULTY_BANDS[g.difficulty || "Medium"].base
        );
        setPowerUpsMax(g.powerUpsTotal || 0);
      })
      .catch(() => {
        if (!cancelled) {
          setError("No game in progress — start a new practice session.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, isDaily, dailyPuzzleId, startDailyGame, fetchActiveGame]);

  // Load the game from the backend when gameId becomes known.
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    resumeGame(gameId)
      .then((g) => {
        if (cancelled) return;
        setPuzzle(g.initialBoard);
        setBoard(g.board);
        setScore(g.score || 0);
        setMistakes(g.mistakes || 0);
        setPowerUpsLeft(
          Math.max(0, (g.powerUpsTotal || 0) - (g.powerUpsUsed || 0))
        );
        setElapsed(g.timeElapsedSec || 0);
        setSolved(g.status === "solved" || g.status === "completed");
        if (g.status === "completed") setFinalStatus("completed");
        // Restore correct/wrong tints from persisted moves.
        const fb = {};
        for (const m of g.moves || []) {
          if (m.correct != null) fb[m.cell] = m.correct ? "correct" : "wrong";
        }
        setFeedback(fb);
        // Restore persisted pencil marks.
        if (Array.isArray(g.notes) && g.notes.length === 81) {
          setNotes(g.notes.map((set) => [...(set || [])]));
        }
      })
      .catch((err) => setError(err.message || "Failed to load game."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, resumeGame]);

  // Elapsed timer while playing. Depend on a stable boolean, not the board
  // array itself — setBoard() creates a fresh array every move, which used to
  // tear down and recreate the interval (losing up to ~1s of tick per move).
  const boardLoaded = board != null;
  useEffect(() => {
    if (solved || !boardLoaded) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [solved, boardLoaded]);

  // Debounced persistence of pencil marks.
  const notesRef = useRef(notes);
  notesRef.current = notes;
  useEffect(() => {
    if (!gameId) return;
    const t = setTimeout(() => {
      saveNotes(gameId, notesRef.current).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [notes, gameId, saveNotes]);

  const isFixed = (idx) => puzzle[idx] != null;

  const applyValue = async (idx, value) => {
    if (isFixed(idx)) return;
    setMoveError("");
    try {
      const res = await makeMove(gameId, {
        cell: idx,
        value,
        timeElapsedSec: elapsed,
      });
      setBoard(res.board);
      setScore(res.score);
      setMistakes(res.mistakes);
      setFeedback((fb) => {
        const next = { ...fb };
        if (value == null) delete next[idx];
        else next[idx] = res.correct ? "correct" : "wrong";
        return next;
      });
      if (value != null) {
        // Selection intentionally cleared only after a confirmed placement,
        // so a rejected move (e.g. a locked cell) keeps the cell selected.
        setSelected(null);
        setLastDelta({ value: res.delta ?? 0, correct: res.correct });
        setTimeout(() => setLastDelta(null), 1200);
      }
      if (res.solved) {
        setSolved(true);
        setFinalStatus("solved");
      } else if (res.status === "completed") {
        setSolved(true);
        setFinalStatus("completed");
      }
    } catch (err) {
      setMoveError(err.message || "Failed to record move.");
    }
  };

  const handleCellClick = (idx) => {
    if (solved) return;
    // Given cells are selectable so rows/columns can be visually scanned;
    // input into them is still blocked in applyValue/handleNumpad.
    setSelected(idx);
    setLastCell(idx);
    setHintMsg("");
  };

  const handleNumpad = (value) => {
    if (solved || selected == null || isFixed(selected)) return;
    // Permanent placement: a filled cell (correct or wrong) rejects new
    // input without a backend round-trip. The server enforces this too.
    if (board[selected] != null) {
      setMoveError("Answers are permanent — placed numbers cannot be changed.");
      return;
    }
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
    }
  };

  const handleHint = async () => {
    if (solved || powerUpsLeft <= 0) return;
    if (selected == null) {
      setHintMsg("Select a cell first to use a hint.");
      return;
    }
    setHintMsg("");
    try {
      const res = await requestHint(gameId, { cell: selected });
      setBoard(res.board);
      setFeedback((fb) => ({ ...fb, [selected]: "correct" }));
      setPowerUpsLeft((p) => Math.max(0, p - 1));
      if (res.solved) {
        setSolved(true);
        setFinalStatus("solved");
      }
    } catch (err) {
      setMoveError(err.message || "Failed to use hint.");
    }
    setSelected(null);
  };

  const handleErase = () => {
    if (selected == null || isFixed(selected)) return;
    if (solved) return;
    if (board[selected] != null) {
      setMoveError("Answers are permanent — placed numbers cannot be erased.");
      return;
    }
    if (!notes[selected] || notes[selected].length === 0) return;
    setNotes((cur) => {
      const next = [...cur];
      next[selected] = [];
      return next;
    });
  };

  const handleEndPractice = async () => {
    if (solved) {
      navigate("/practice");
      return;
    }
    if (!window.confirm("End this practice session? Your progress will be saved as abandoned.")) {
      return;
    }
    try {
      await abandonGame(gameId);
      navigate("/practice");
    } catch (err) {
      setMoveError(err.message || "Failed to end game.");
    }
  };

  // Keyboard controls: digits 1-9 place, Backspace/Delete/0 = erase attempt,
  // arrows move the selection (givens included), Enter re-selects the previous
  // cell, N/Space toggles notes, Escape deselects.
  const handleKeyboardDigit = (value) => {
    if (loading || error || !board) return;
    handleNumpad(value);
  };

  const handleKeyboardErase = () => {
    if (loading || error || !board) return;
    handleErase();
  };

  const moveSelection = (dir) => {
    if (solved || selected == null) return;
    const row = Math.floor(selected / 9);
    const col = selected % 9;
    let next = null;
    if (dir === "up" && row > 0) next = selected - 9;
    else if (dir === "down" && row < 8) next = selected + 9;
    else if (dir === "left" && col > 0) next = selected - 1;
    else if (dir === "right" && col < 8) next = selected + 1;
    if (next != null) {
      setSelected(next);
      setLastCell(next);
      setHintMsg("");
    }
  };

  const handleKeyboardEnter = () => {
    if (solved || loading || error) return;
    if (selected == null && lastCell != null) {
      setSelected(lastCell);
      setHintMsg("");
    }
  };

  useKeyboardSudoku({
    onDigit: handleKeyboardDigit,
    onErase: handleKeyboardErase,
    onArrow: moveSelection,
    onEnter: handleKeyboardEnter,
    onToggleNotes: () => setNotesMode((m) => !m),
    onEscape: () => setSelected(null),
    enabled: board != null && !solved && !loading && !error,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body-md text-body-md text-ink-black">
        Loading game…
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-body-md text-body-md text-ink-black gap-4">
        <p className="text-error-red">{error || "Game not found."}</p>
        <Link
          to="/practice"
          className="border-2 border-ink-black px-4 py-2 hover:bg-ink-black hover:text-paper-white transition-colors"
        >
          Back to Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-body-md text-body-md text-ink-black antialiased">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-margin-lg flex justify-center items-start">
        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-margin-lg">
          {/* Game Board Column */}
          <div className="flex-1 flex flex-col max-w-xl mx-auto lg:mx-0 w-full">
            {/* Game Info Header */}
            <div className="flex justify-between items-end mb-4 border-b border-ink-black pb-2 flex-wrap gap-2">
              <div className="font-headline-sm text-headline-sm tracking-wider uppercase">
                {isDaily ? "Daily" : difficulty} · {clueCount} clues
              </div>
              <div className="font-body-lg text-body-lg relative">
                Score <b>{score}</b>
                {lastDelta && (
                  <span
                    className={`absolute -top-1 left-full ml-2 font-label-mono text-label-mono ${
                      lastDelta.correct ? "text-ink-blue" : "text-error-red"
                    }`}
                  >
                    {lastDelta.value > 0
                      ? `+${lastDelta.value}`
                      : lastDelta.value}
                  </span>
                )}
              </div>
              <div className="font-body-md text-body-md text-secondary">
                Mistakes {mistakes}
              </div>
              <div className="font-grid-number text-grid-number">
                {formatTime(elapsed)}
              </div>
              <div className="font-body-lg text-body-lg">
                {powerUpsLeft}/{powerUpsMax} hints
              </div>
            </div>

            {solved && (
              <div
                className="mb-4 border-2 border-ink-black bg-ink-black text-paper-white p-4 font-label-mono text-label-mono uppercase tracking-widest"
                role="status"
              >
                {finalStatus === "completed"
                  ? "All cells filled!"
                  : "Solved!"}{" "}
                Score {score} · {formatTime(elapsed)} · {mistakes}{" "}
                mistakes
                <button
                  onClick={() => navigate("/practice")}
                  className="ml-4 underline hover:text-ink-blue"
                >
                  New Game
                </button>
              </div>
            )}

            {moveError && (
              <div
                className="mb-4 border border-error-red bg-error-red/10 px-3 py-2 font-body-md text-body-md text-error-red"
                role="alert"
              >
                {moveError}
              </div>
            )}

            {/* Sudoku Grid */}
            <div
              className="sudoku-grid aspect-square w-full font-grid-number text-grid-number mb-margin-md"
              role="grid"
              aria-label="Sudoku board"
            >
              {board.map((value, index) => {
                const notesSet = notes[index] || [];
                const isSel = selected === index;
                const isFixedCell = isFixed(index);
                const fb = feedback[index];
                const cls = `sudoku-cell ${isFixedCell ? "fixed" : ""} ${isSel ? "selected" : ""} ${
                  !isFixedCell && fb ? fb : ""
                } ${!isFixedCell && !fb && value != null ? "user-input" : ""}`;
                return (
                  <div
                    key={index}
                    className={cls}
                    onClick={() => handleCellClick(index)}
                    role="gridcell"
                    aria-label={`Row ${Math.floor(index / 9) + 1} column ${
                      (index % 9) + 1
                    }${value != null ? `, ${value}` : ", empty"}`}
                  >
                    {value != null ? (
                      <motion.span
                        key={`${index}-${value}`}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        {value}
                      </motion.span>
                    ) : notesSet.length ? (
                      <span className="notes-grid">{notesSet.join("")}</span>
                    ) : (
                      ""
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Column */}
          <div className="flex flex-col w-full lg:w-64 space-y-margin-md pt-2">
            {/* Action Links */}
            <div className="flex flex-row lg:flex-col justify-around lg:justify-start gap-4">
              <button
                className="font-body-lg text-body-lg text-ink-black hover:border-b hover:border-ink-black pb-0.5 self-start transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-transparent"
                onClick={handleHint}
                disabled={solved || powerUpsLeft <= 0}
              >
                Hint ({powerUpsLeft})
              </button>
              <button
                className="font-body-lg text-body-lg text-ink-black hover:border-b hover:border-ink-black pb-0.5 self-start transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-transparent"
                onClick={handleErase}
                disabled={
                  solved ||
                  selected == null ||
                  isFixed(selected) ||
                  board[selected] != null
                }
              >
                Erase
              </button>
              <button
                className="font-body-lg text-body-lg text-error-red hover:border-b hover:border-error-red pb-0.5 self-start transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-transparent"
                onClick={handleEndPractice}
                disabled={solved}
              >
                End
              </button>
            </div>
            {hintMsg && (
              <p
                className="font-body-md text-body-md text-error-red"
                role="status"
              >
                {hintMsg}
              </p>
            )}
            {/* Notes Toggle */}
            <div className="flex items-center justify-between border-y border-ink-black py-4">
              <span className="font-headline-sm text-headline-sm">Notes</span>
              <button
                className="font-label-mono text-label-mono hover:text-ink-blue transition-colors"
                onClick={() => setNotesMode(!notesMode)}
                aria-pressed={notesMode}
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
  );
}

export default SinglePlayerGameBoardPage;
