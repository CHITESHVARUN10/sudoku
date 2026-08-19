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

function leavePenaltyPreview(winnerScore, loserScore) {
  const gap = Math.max(0, winnerScore - loserScore);
  return Math.min(30, 10 + Math.floor(gap / 10));
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
    resignState,
    joinRoom,
    rejoinMatch,
    sendMove,
    sendPowerUp,
    sendNotes,
    requestResign,
    acceptResign,
    declineResign,
    leaveMatch,
  } = useSocket();

  const [selected, setSelected] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [powerUpArmed, setPowerUpArmed] = useState(false);
  const [notes, setNotes] = useState(() => Array.from({ length: 81 }, () => []));
  const [syncError, setSyncError] = useState("");
  const [noMatch, setNoMatch] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveCountdown, setLeaveCountdown] = useState(0);

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
  const mySeat = myIndex === 0 ? 1 : 2;
  const oppSeat = mySeat === 1 ? 2 : 1;

  const pendingBySeat = resignState?.by ?? match?.resignRequestedBy ?? null;
  const isIncomingResign = pendingBySeat != null && pendingBySeat !== mySeat && !!pendingBySeat;
  const isOutgoingResign = pendingBySeat === mySeat;
  const hasPendingResign = pendingBySeat != null;

  const myScore = match?.scores?.[mySeat === 1 ? "p1" : "p2"] ?? 0;
  const oppScore = match?.scores?.[mySeat === 1 ? "p2" : "p1"] ?? 0;
  const predictedLeavePenalty = leavePenaltyPreview(oppScore, myScore);

  useEffect(() => {
    if (!match?.startedAt || match?.status !== "active") {
      setLeaveCountdown(0);
      return;
    }
    const tick = () => {
      const elapsed = (Date.now() - new Date(match.startedAt).getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil(30 - elapsed));
      setLeaveCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [match?.startedAt, match?.status]);

  const canLeave = leaveCountdown === 0;

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

  const notesRef = useRef(notes);
  notesRef.current = notes;
  useEffect(() => {
    if (!match?.matchId) return;
    const t = setTimeout(() => {
      sendNotes(notesRef.current);
    }, 400);
    return () => clearTimeout(t);
  }, [notes, match?.matchId, sendNotes]);

  useEffect(() => {
    if (!user?._id) {
      setSyncError("Sign in to play multiplayer.");
      return;
    }
    if (matchIdFromState) {
      rejoinMatch(matchIdFromState, user._id);
      return;
    }
    if (roomCodeFromState) {
      let cancelled = false;
      fetchActiveMatch()
        .then((m) => {
          if (cancelled) return;
          if (m?._id) {
            rejoinMatch(m._id, user._id);
            return;
          }
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

  const canAct = connected && match?.status === "active";

  const isLockedForMe = (idx) => {
    const s = match?.cellStatus?.[idx];
    return s === "given" || s === "locked";
  };

  const handleCellClick = (index) => {
    if (!canAct) return;
    if (isLockedForMe(index)) return;
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
    if (isLockedForMe(selected)) return;
    if (notesMode && match?.cellStatus?.[selected] == null) {
      setNotes((cur) => {
        const next = [...cur];
        const set = new Set(next[selected]);
        if (set.has(value)) set.delete(value);
        else set.add(value);
        next[selected] = [...set].sort();
        return next;
      });
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
    requestResign();
  };

  const handleLeaveConfirm = () => {
    setShowLeaveConfirm(false);
    leaveMatch();
  };

  const grid = match?.board || [];
  const cellStatus = match?.cellStatus || [];
  const ghost = match?.ghost || [];

  return (
    <div className="min-h-screen flex flex-col bg-paper-white text-ink-black font-body-md text-body-md antialiased">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-margin-lg py-8 md:py-12 flex flex-col">
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
        {isOutgoingResign && match?.status === "active" && (
          <div
            className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-ink-black flex items-center justify-between"
            role="status"
          >
            <span>Resign request sent — waiting for opponent to accept…</span>
            <button
              onClick={() => declineResign()}
              className="ml-4 underline hover:text-error-red"
            >
              Cancel
            </button>
          </div>
        )}
        {result && (
          <div
            className="mb-4 border-2 border-ink-black bg-ink-black text-paper-white p-4 font-label-mono text-label-mono uppercase tracking-widest"
            role="status"
          >
            {result.winner == null
              ? "Draw"
              : result.winner === myIndex + 1
              ? "You win"
              : "You lose"}{" "}
            — {result.reason}
            {result.eloDelta || result.eloDeltaLoser ? (
              <>
                {" · Elo "}
                {result.winner == null
                  ? "—"
                  : result.winner === myIndex + 1
                  ? `+${result.eloDelta}`
                  : `−${result.eloDeltaLoser || result.eloDelta}`}
              </>
            ) : null}
            <Link
              to="/multiplayer"
              className="ml-4 underline hover:text-ink-blue"
            >
              New Match
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-margin-lg items-start justify-center">
          <div
            className="mp-sudoku-grid mx-auto lg:mx-0"
            role="grid"
            aria-label="Sudoku board"
          >
            {Array.from({ length: 81 }, (_, index) => {
              const value = grid[index];
              const status = cellStatus[index];
              const isGhost = ghost[index] === true;
              const notesSet = notes[index] || [];
              const isSelected = selected === index;
              const cls = `mp-sudoku-cell ${status || ""} ${
                isGhost && value == null ? "ghost" : ""
              } ${isSelected ? "selected" : ""}`;
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
                      className="mp-cell-mark-pop"
                    >
                      {value}
                    </motion.span>
                  ) : isGhost ? (
                    <span className="mp-ghost">?</span>
                  ) : notesSet.length ? (
                    <span className="notes-grid">{notesSet.join("")}</span>
                  ) : (
                    ""
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-margin-md w-full max-w-sm mx-auto lg:mx-0">
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

            <div className="flex gap-4 border-b border-ink-black pb-4 flex-wrap">
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
                    ({match.powerUpsLeft?.[myIndex === 0 ? "p1" : "p2"] ?? 0}/
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
                className="flex items-center gap-2 text-ink-black hover:text-ink-blue font-label-mono text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleResign}
                disabled={!match || match.status !== "active" || hasPendingResign}
                title={hasPendingResign ? "Resign already pending" : "Request mutual resign — higher score wins"}
              >
                <span className="material-symbols-outlined text-[20px]">flag</span>
                Resign
              </button>
              <button
                className="flex items-center gap-2 text-error-red hover:text-ink-black font-label-mono text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setShowLeaveConfirm(true)}
                disabled={!match || match.status !== "active"}
                title={!canLeave ? `Leave available in ${leaveCountdown}s` : `Leave now: −${predictedLeavePenalty} Elo (opponent +standard)`}
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                {canLeave ? "Leave" : `Leave (${leaveCountdown}s)`}
              </button>
            </div>

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

      <AnimatePresence>
        {isIncomingResign && match?.status === "active" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md bg-paper-white border-2 border-ink-black p-6"
            >
              <h2 className="font-headline-sm text-headline-sm font-bold mb-2">
                Opponent wants to resign
              </h2>
              <p className="font-label-mono text-[13px] leading-relaxed text-secondary mb-4">
                {opponentName} requested a mutual resign. If you accept, the
                player with the higher score wins.
                <br />
                <span className="text-ink-black">
                  Current: You {myScore} — Opp {oppScore}
                </span>
                <br />
                <span className="text-[11px]">Expires in 60s · Tie-break: fewer mistakes → more clock</span>
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => declineResign()}
                  className="px-4 py-2 border-2 border-ink-black font-label-mono text-[13px] uppercase tracking-widest hover:bg-surface-variant"
                >
                  Decline
                </button>
                <button
                  onClick={() => acceptResign()}
                  className="px-4 py-2 bg-ink-black text-paper-white font-label-mono text-[13px] uppercase tracking-widest hover:bg-ink-blue"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md bg-paper-white border-2 border-ink-black p-6"
            >
              <h2 className="font-headline-sm text-headline-sm font-bold mb-2">
                Leave match?
              </h2>
              <p className="font-label-mono text-[13px] leading-relaxed text-secondary mb-4">
                Leaving ends the match immediately. Your opponent wins.
                <br />
                <span className="text-error-red">
                  Penalty: −{predictedLeavePenalty} Elo
                </span>{" "}
                <span className="text-secondary">(10 + 1 per 10pt deficit, capped at 30).</span>
                <br />
                <span className="text-ink-black">
                  You {myScore} — Opp {oppScore}
                </span>
                {!canLeave && (
                  <span className="block mt-2 text-ink-black">
                    You can leave in {leaveCountdown}s.
                  </span>
                )}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="px-4 py-2 border-2 border-ink-black font-label-mono text-[13px] uppercase tracking-widest hover:bg-surface-variant"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveConfirm}
                  disabled={!canLeave}
                  className="px-4 py-2 bg-error-red text-paper-white font-label-mono text-[13px] uppercase tracking-widest hover:bg-ink-black disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MultiplayerGameBoardPage;
