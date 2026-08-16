import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useRoom } from "../contexts/RoomContext";
import { useMatch } from "../contexts/MatchContext";
import Navbar from "../components/Navbar";

function formatClock(sec) {
  if (sec == null || sec <= 0) return "--:--";
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function MultiplayerGameBoardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { getRoom } = useRoom();
  const { fetchActiveMatch } = useMatch();
  const settings = location.state?.settings || null;
  const matchIdFromState = location.state?.matchId || null;
  const roomCodeFromState = location.state?.roomCode || null;
  const {
    match,
    connected,
    socketConnected,
    oppDisconnected,
    result,
    lastError,
    joinRoom,
    rejoinMatch,
    sendMove,
    sendPowerUp,
    sendNotes,
    resign,
  } = useSocket();

  const [selected, setSelected] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [powerUpArmed, setPowerUpArmed] = useState(false);
  const [notes, setNotes] = useState(() => Array.from({ length: 81 }, () => []));
  const [syncError, setSyncError] = useState("");
  const [noMatch, setNoMatch] = useState(false);

  // Figure out which seat we are (handles host and guest, and rejoins).
  const myIndex =
    match?.players && user?._id
      ? String(match.players[0]?._id) === String(user._id)
        ? 0
        : String(match.players[1]?._id) === String(user._id)
        ? 1
        : 0
      : 0;
  const me = match?.players?.[myIndex]?.name || user?.name || "You";
  const opponentName =
    match?.players?.[1 - myIndex]?.name || "Opponent";
  // Absolute seat number for this viewer: 1 (host/p1) or 2 (guest/p2).
  // Move history entries carry the absolute player number, so columns must be
  // mapped by seat — NOT by display position — or the opponent's moves get
  // credited to us.
  const mySeat = myIndex === 0 ? 1 : 2;
  const oppSeat = mySeat === 1 ? 2 : 1;

  // Load this player's persisted notes once when the match first arrives
  // (start/rejoin). Don't overwrite local edits on every server echo.
  const loadedNotesForMatch = useRef(null);
  useEffect(() => {
    if (!match?.notes || !match?.matchId) return;
    if (loadedNotesForMatch.current === match.matchId) return;
    const seatNotes =
      myIndex === 0 ? match.notes.p1 : match.notes.p2;
    if (Array.isArray(seatNotes) && seatNotes.length === 81) {
      loadedNotesForMatch.current = match.matchId;
      setNotes(seatNotes.map((set) => [...(set || [])]));
    }
  }, [match?.matchId, myIndex, match?.notes]);

  // Push local note changes to the server (debounced).
  const notesRef = useRef(notes);
  notesRef.current = notes;
  useEffect(() => {
    if (!match?.matchId) return;
    const t = setTimeout(() => {
      sendNotes(notesRef.current);
    }, 400);
    return () => clearTimeout(t);
  }, [notes, match?.matchId, sendNotes]);

  // Join / rejoin / resync when the page mounts.
  useEffect(() => {
    if (!user?._id) {
      setSyncError("Sign in to play multiplayer.");
      return;
    }

    // Rejoin an explicit match (Rejoin Match button, or a fresh reload that
    // already knows the match id).
    if (matchIdFromState) {
      rejoinMatch(matchIdFromState, user._id);
      return;
    }

    if (roomCodeFromState) {
      // Fresh page load with a room code: try to find a live match first.
      let cancelled = false;
      fetchActiveMatch()
        .then((m) => {
          if (cancelled) return;
          if (m?._id) {
            rejoinMatch(m._id, user._id);
            return;
          }
          // No match yet — join the room (host waiting / guest just joined).
          joinRoom(roomCodeFromState, user._id);
          let attempts = 0;
          const poll = async () => {
            if (cancelled) return;
            attempts++;
            try {
              const room = await getRoom(roomCodeFromState);
              if (cancelled) return;
              if (room?.match) {
                rejoinMatch(room.match, user._id);
                return;
              }
              if (attempts < 15) setTimeout(poll, 2000);
              else if (!cancelled) {
                setSyncError("The match has not started yet. Try again.");
              }
            } catch {
              if (!cancelled && attempts < 15) setTimeout(poll, 2000);
              else if (!cancelled) setSyncError("Could not reach the room.");
            }
          };
          poll();
        })
        .catch(() => {
          if (cancelled) return;
          joinRoom(roomCodeFromState, user._id);
        });
      return () => {
        cancelled = true;
      };
    }

    // Direct URL — look for an active match.
    let cancelled = false;
    fetchActiveMatch()
      .then((m) => {
        if (cancelled) return;
        if (m?._id) rejoinMatch(m._id, user._id);
        else setNoMatch(true);
      })
      .catch(() => {
        if (!cancelled) setNoMatch(true);
      });
    return () => {
      cancelled = true;
    };
  }, [
    user?._id,
    matchIdFromState,
    roomCodeFromState,
    rejoinMatch,
    joinRoom,
    getRoom,
    fetchActiveMatch,
  ]);

  // Live clocks: server-authoritative values re-synced on every match state,
  // with a smooth 1s local ticker in between (race-style, no turns).
  const [clocks, setClocks] = useState({ p1: null, p2: null });

  useEffect(() => {
    if (!match?.clocks) return;
    setClocks({
      p1: match.clocks.p1 > 0 ? match.clocks.p1 : 0,
      p2: match.clocks.p2 > 0 ? match.clocks.p2 : 0,
    });
  }, [match?.clocks]);

  const matchStatus = match?.status;
  const matchIdNow = match?.matchId;
  useEffect(() => {
    if (matchStatus !== "active") return;
    const interval = setInterval(() => {
      setClocks((prev) => ({
        p1: prev.p1 != null ? Math.max(0, prev.p1 - 1) : null,
        p2: prev.p2 != null ? Math.max(0, prev.p2 - 1) : null,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [matchStatus, matchIdNow]);

  // Simultaneous play: both players can act at any time while the match is active.
  const canAct = connected && match?.status === "active";

  // Cell ownership: the LAST real mark (fill/power-up) in moveHistory owns a
  // cell. You can override the opponent's mark but never your own.
  const isOwnMarked = (idx) => {
    const h = match?.moveHistory || [];
    for (let i = h.length - 1; i >= 0; i--) {
      const m = h[i];
      if (m.cell === idx && !m.isNote) return m.player === mySeat;
    }
    return false;
  };

  const handleCellClick = (index) => {
    if (!canAct) return;
    if (match?.cellStatus?.[index] === "given") return;
    if (isOwnMarked(index)) return;
    // If a power-up is armed, clicking a cell applies it directly.
    if (powerUpArmed) {
      sendPowerUp(index);
      setPowerUpArmed(false);
      setSelected(null);
      return;
    }
    setSelected(index);
  };

  const handleNumpad = (value) => {
    if (!canAct || selected == null) return;
    if (match?.cellStatus?.[selected] === "given") return;
    if (isOwnMarked(selected)) return;
    if (notesMode && match?.cellStatus?.[selected] !== "wrong") {
      setNotes((cur) => {
        const next = [...cur];
        const set = new Set(next[selected]);
        if (set.has(value)) set.delete(value);
        else set.add(value);
        next[selected] = [...set].sort();
        return next;
      });
      // One note placed -> exit notes mode so the next press writes a real
      // value (no accidental pencil marks).
      setNotesMode(false);
      return;
    }
    if (powerUpArmed) {
      sendPowerUp(selected);
      setPowerUpArmed(false);
      setSelected(null);
    } else {
      sendMove(selected, value);
      setSelected(null);
    }
  };

  const handleErase = () => {
    if (!canAct || selected == null) return;
    setNotes((cur) => {
      const next = [...cur];
      next[selected] = [];
      return next;
    });
    setSelected(null);
  };

  const handleResign = () => {
    resign();
  };

  const grid = match?.board || [];
  const cellStatus = match?.cellStatus || [];

  return (
    <div className="min-h-screen flex flex-col bg-paper-white text-ink-black font-body-md text-body-md antialiased">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-margin-lg py-8 md:py-12 flex flex-col">
        {/* Match Header */}
        <div className="w-full border-b border-ink-black pb-4 mb-8 flex justify-between items-end">
          <div className="flex items-center gap-3">
            <span className="font-headline-sm text-headline-sm font-bold px-3 py-1 border-2 border-ink-black text-ink-black">
              {me}
            </span>
            <span className="font-label-mono text-label-mono text-secondary">
              {formatClock(clocks[myIndex === 0 ? "p1" : "p2"])}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="font-label-mono text-[12px] uppercase tracking-widest text-secondary mb-1">
              Difficulty
            </span>
            <span className="font-headline-md text-[24px] font-bold">
              {match?.difficulty || settings?.difficulty || "HARD"}
            </span>
            {match?.clueCount && (
              <span className="font-label-mono text-[12px] text-secondary">
                {match.clueCount} clues
              </span>
            )}
            <div className="h-4 w-px bg-ink-black my-2"></div>
            <span className="font-label-mono text-[14px] uppercase tracking-widest text-ink-blue font-bold">
              {match?.moveHistory?.length || 0} MOVES
            </span>
            <div className="flex gap-6 mt-2 font-label-mono text-[14px]">
              <span className="text-ink-black">
                You:{" "}
                <motion.b
                  key={match?.scores?.[myIndex === 0 ? "p1" : "p2"] ?? 0}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  {match?.scores?.[myIndex === 0 ? "p1" : "p2"] ?? 0}
                </motion.b>
              </span>
              <span className="text-secondary">
                Opp:{" "}
                <b>{match?.scores?.[myIndex === 0 ? "p2" : "p1"] ?? 0}</b>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-mono text-label-mono text-secondary">
              {formatClock(clocks[myIndex === 0 ? "p2" : "p1"])}
            </span>
            <span className="font-headline-sm text-headline-sm font-bold px-3 py-1 border-2 border-ink-black text-ink-black">
              {opponentName}
            </span>
          </div>
        </div>

        {/* Connection banners */}
        {noMatch && (
          <div
            className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-ink-black"
            role="status"
          >
            No active match —{" "}
            <Link to="/multiplayer" className="underline">
              join or create one
            </Link>
            .
          </div>
        )}
        {!socketConnected && !noMatch && (
          <div
            className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-ink-black"
            role="status"
          >
            Disconnected — reconnecting…
          </div>
        )}
        {socketConnected && !match?.board && !noMatch && (
          <div
            className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-ink-black"
            role="status"
          >
            Waiting for opponent…
          </div>
        )}
        {(syncError || lastError) && (
          <div
            className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-error-red"
            role="alert"
          >
            {syncError || lastError}
          </div>
        )}
        {oppDisconnected && match?.status === "active" && (
          <div
            className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-secondary"
            role="status"
          >
            Opponent disconnected — their clock is paused.
          </div>
        )}
        {result && (
          <div
            className="mb-4 border-2 border-ink-black bg-ink-black text-paper-white p-4 font-label-mono text-label-mono uppercase tracking-widest"
            role="status"
          >
            {result.winner === myIndex + 1 ? "You win" : "You lose"} —{" "}
            {result.reason}
            {result.eloDelta
              ? ` · Elo ${
                  result.winner === myIndex + 1 ? "+" : "−"
                }${result.eloDelta}`
              : ""}
            <Link
              to="/multiplayer"
              className="ml-4 underline hover:text-ink-blue"
            >
              New Match
            </Link>
          </div>
        )}

        {/* Game Area Layout */}
        <div className="flex flex-col lg:flex-row gap-margin-lg items-start justify-center">
          {/* The Board */}
          <div
            className="mp-sudoku-grid mx-auto lg:mx-0"
            role="grid"
            aria-label="Sudoku board"
          >
            {Array.from({ length: 81 }, (_, index) => {
              const value = grid[index];
              const status = cellStatus[index];
              const notesSet = notes[index] || [];
              const isSelected = selected === index;
              const cls = `mp-sudoku-cell ${status || ""} ${
                isSelected ? "selected" : ""
              }`;
              const ownKey = status === "wrong" || status === "locked";
              return (
                <div
                  key={index}
                  className={cls}
                  onClick={() => handleCellClick(index)}
                >
                  {value != null ? (
                    <motion.span
                      key={`${index}-${value}`}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className={ownKey ? "mp-cell-mark-pop" : undefined}
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

          {/* Controls & Log Sidebar */}
          <div className="flex flex-col gap-margin-md w-full max-w-sm mx-auto lg:mx-0">
            {/* Numpad */}
            <div className="grid grid-cols-3 gap-0 w-fit border border-ink-black">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num, i) => (
                <button
                  key={num}
                  onClick={() => handleNumpad(Number(num))}
                  className={`numpad-btn ${i < 6 ? "border-b" : ""} ${
                    i % 3 !== 2 ? "border-r" : "border-transparent"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Tool Actions */}
            <div className="flex gap-4 border-b border-ink-black pb-4">
              <button
                className={`flex items-center gap-2 font-label-mono text-[14px] transition-colors px-2 py-1 ${
                  notesMode
                    ? "bg-ink-blue text-paper-white border border-ink-blue"
                    : "text-ink-black hover:text-ink-blue border border-transparent"
                }`}
                onClick={() => setNotesMode(!notesMode)}
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Notes
              </button>
              <button
                className={`flex items-center gap-2 font-label-mono text-[14px] transition-colors px-2 py-1 ${
                  powerUpArmed
                    ? "bg-tertiary text-on-tertiary border border-tertiary"
                    : "text-ink-black hover:text-ink-blue border border-transparent"
                }`}
                onClick={() => setPowerUpArmed(!powerUpArmed)}
                disabled={
                  !canAct ||
                  !match ||
                  (match.powerUpsLeft?.[myIndex === 0 ? "p1" : "p2"] ?? 0) <=
                    0
                }
              >
                <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                Power-up
                {match?.powerUpsLeft ? (
                  <span className="text-secondary">
                    (
                    {match.powerUpsLeft[myIndex === 0 ? "p1" : "p2"] ?? 0}/
                    {match.powerUpsMax ?? 3})
                  </span>
                ) : null}
              </button>
              <button
                className="flex items-center gap-2 text-ink-black hover:text-ink-blue font-label-mono text-[14px]"
                onClick={handleErase}
                disabled={!canAct}
              >
                <span className="material-symbols-outlined text-[20px]">backspace</span>
                Erase
              </button>
              <button
                className="flex items-center gap-2 text-error-red hover:text-ink-black font-label-mono text-[14px]"
                onClick={handleResign}
                disabled={!match || match.status !== "active"}
              >
                <span className="material-symbols-outlined text-[20px]">flag</span>
                Resign
              </button>
            </div>

            {/* Mode indicator: always tell the player what the next press does */}
            <div className="flex items-center gap-2 font-label-mono text-[12px] uppercase tracking-widest">
              <AnimatePresence mode="wait" initial={false}>
                {notesMode ? (
                  <motion.span
                    key="notes"
                    className="flex items-center gap-2 bg-ink-blue text-paper-white px-2 py-1"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Notes mode ON — pencil marks only
                  </motion.span>
                ) : powerUpArmed ? (
                  <motion.span
                    key="powerup"
                    className="flex items-center gap-2 bg-tertiary text-on-tertiary px-2 py-1"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                    Power-up armed — click a cell to reveal
                  </motion.span>
                ) : (
                  <motion.span
                    key="write"
                    className="flex items-center gap-2 text-secondary"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="material-symbols-outlined text-[16px]">keyboard</span>
                    Writing numbers
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Move History Log */}
            <div className="flex flex-col border border-ink-black h-64 bg-paper-white">
              <div className="grid grid-cols-2 border-b border-ink-black font-label-mono text-[12px] uppercase tracking-wider bg-surface-container-highest">
                <div className="p-2 border-r border-ink-black text-center font-bold">
                  {me}
                </div>
                <div className="p-2 text-center">{opponentName}</div>
              </div>
              <div className="move-history flex-1 overflow-y-auto p-0 m-0 font-label-mono text-[14px]">
                <AnimatePresence initial={false}>
                  {(match?.moveHistory || []).map((entry, i) => {
                    const cellLabel = `R${Math.floor(entry.cell / 9) + 1}C${
                      (entry.cell % 9) + 1
                    }`;
                    const isMine = entry.player === mySeat;
                    // Only show the opponent WHICH cell they marked — never the
                    // value or whether it was right/wrong (that leaks info).
                    const text = isMine
                      ? `${cellLabel} → ${entry.value}${
                          entry.isPowerUp ? " ⚡" : ""
                        }${entry.correct === false ? " ✗" : ""}`
                      : cellLabel;
                    return (
                      <motion.div
                        key={`${entry.player}-${entry.cell}-${i}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="grid grid-cols-2 border-b border-ink-black/20 hover:bg-surface-container-low"
                      >
                        <div className="p-2 border-r border-ink-black/20 text-center">
                          {entry.player === mySeat ? text : ""}
                        </div>
                        <div className="p-2 text-center">
                          {entry.player === oppSeat ? text : ""}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {!match?.moveHistory?.length && (
                  <div className="p-4 text-center text-secondary text-[12px]">
                    No moves yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MultiplayerGameBoardPage;
