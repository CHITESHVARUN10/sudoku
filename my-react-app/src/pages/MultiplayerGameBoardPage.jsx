import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useRoom } from "../contexts/RoomContext";
import { useMatch } from "../contexts/MatchContext";

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
    resign,
  } = useSocket();

  const [selected, setSelected] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [powerUpArmed, setPowerUpArmed] = useState(false);
  const [notes, setNotes] = useState(() => Array.from({ length: 81 }, () => []));
  const [syncError, setSyncError] = useState("");
  const [noMatch, setNoMatch] = useState(false);

  // Join / rejoin / resync when the page mounts.
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
      joinRoom(roomCodeFromState, user._id);
      // Poll the room until the match starts (guest joins via HTTP first,
      // host waits on the waiting page, both land here).
      let cancelled = false;
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

  // Live clocks: both players' clocks tick simultaneously (race-style, no turns).
  const [clocks, setClocks] = useState({ p1: null, p2: null });
  const clocksInitRef = useRef(false);
  const matchIdRef = useRef(null);

  useEffect(() => {
    if (!match?.matchId) return;
    if (matchIdRef.current !== match.matchId) {
      matchIdRef.current = match.matchId;
      clocksInitRef.current = false;
    }
    if (!clocksInitRef.current && match?.clocks) {
      clocksInitRef.current = true;
      setClocks({
        p1: match.clocks.p1 > 0 ? match.clocks.p1 : null,
        p2: match.clocks.p2 > 0 ? match.clocks.p2 : null,
      });
    }
  }, [match?.matchId, match?.clocks]);

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
  // Simultaneous play: both players can act at any time while the match is active.
  const canAct = connected && match?.status === "active";

  const handleCellClick = (index) => {
    if (!canAct) return;
    const status = match.cellStatus?.[index];
    if (status === "given" || status === "locked") return;
    setSelected(index);
  };

  const handleNumpad = (value) => {
    if (!canAct || selected == null) return;
    const status = match.cellStatus?.[selected];
    if (status === "given" || status === "locked") return;
    if (notesMode && status !== "wrong") {
      setNotes((cur) => {
        const next = [...cur];
        const set = new Set(next[selected]);
        if (set.has(value)) set.delete(value);
        else set.add(value);
        next[selected] = [...set].sort();
        return next;
      });
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
    <>
      {/* Top Navigation Shell */}
      <header className="flex justify-between items-center w-full px-margin-lg h-cell-size bg-paper-white border-b border-ink-black sticky top-0 z-40 hidden md:flex">
        <div className="flex items-center gap-margin-md">
          <span className="font-headline-md text-headline-md font-bold uppercase tracking-tighter text-ink-black">
            SUDOKU EDITORIAL
          </span>
        </div>
        <nav className="flex gap-margin-md h-full">
          <Link
            to="/multiplayer"
            className="h-full flex items-center px-4 font-label-mono text-label-mono text-secondary hover:bg-ink-blue hover:text-paper-white transition-colors duration-150"
          >
            Lobby
          </Link>
          <Link
            to="/multiplayer"
            className="h-full flex items-center px-4 font-label-mono text-label-mono text-ink-blue border-b-2 border-ink-blue opacity-80 scale-95 transition-colors duration-150"
          >
            Multiplayer
          </Link>
          <Link
            to="/archive"
            className="h-full flex items-center px-4 font-label-mono text-label-mono text-secondary hover:bg-ink-blue hover:text-paper-white transition-colors duration-150"
          >
            Archive
          </Link>
        </nav>
        <div className="flex gap-4">
          <button className="w-10 h-10 flex items-center justify-center border border-transparent hover:border-ink-black rounded-none transition-colors">
            <span className="material-symbols-outlined text-ink-black">settings</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center border border-transparent hover:border-ink-black rounded-none transition-colors">
            <span className="material-symbols-outlined text-ink-black">account_circle</span>
          </button>
        </div>
      </header>

      {/* Side Navigation Shell (Desktop) */}
      <div className="hidden md:flex flex-col h-full w-64 fixed left-0 top-cell-size border-r border-ink-black pt-margin-lg bg-paper-white z-30">
        <div className="px-6 mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border border-ink-black overflow-hidden mb-4">
            <div className="w-full h-full flex items-center justify-center bg-surface-container font-headline-sm text-headline-sm text-ink-black">
              {me.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-ink-black">
            {me}
          </h3>
          <p className="font-label-mono text-[14px] text-secondary mt-1">
            Elo: {user?.elo || 1200}
          </p>
        </div>
        <nav className="flex-1 flex flex-col w-full">
          <Link
            to="/practice/board"
            className="w-full px-6 py-4 flex items-center gap-4 text-ink-black hover:bg-surface-container-highest transition-all duration-200 ease-in-out font-label-mono text-[16px]"
          >
            <span className="material-symbols-outlined">today</span>
            Daily Puzzle
          </Link>
          <Link
            to="/multiplayer"
            className="w-full px-6 py-4 flex items-center gap-4 bg-ink-blue text-paper-white font-bold font-label-mono text-[16px] transition-all duration-200 ease-in-out"
          >
            <span className="material-symbols-outlined">group</span>
            Multiplayer
          </Link>
          <Link
            to="/stats"
            className="w-full px-6 py-4 flex items-center gap-4 text-ink-black hover:bg-surface-container-highest transition-all duration-200 ease-in-out font-label-mono text-[16px]"
          >
            <span className="material-symbols-outlined">analytics</span>
            Stats
          </Link>
          <Link
            to="/archive"
            className="w-full px-6 py-4 flex items-center gap-4 text-ink-black hover:bg-surface-container-highest transition-all duration-200 ease-in-out font-label-mono text-[16px]"
          >
            <span className="material-symbols-outlined">history</span>
            History
          </Link>
        </nav>
        <div className="p-6 border-t border-ink-black mt-auto">
          <Link
            to="/multiplayer"
            className="w-full py-3 border border-ink-black bg-paper-white text-ink-black hover:bg-ink-black hover:text-paper-white font-label-mono text-[14px] uppercase tracking-wider transition-colors duration-150 flex items-center justify-center"
          >
            New Match
          </Link>
        </div>
      </div>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 w-full max-w-7xl mx-auto px-4 md:px-margin-lg py-8 md:py-12 flex flex-col">
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
                <b>{match?.scores?.[myIndex === 0 ? "p1" : "p2"] ?? 0}</b>
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
          <div className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-ink-black">
            No active match —{" "}
            <Link to="/multiplayer" className="underline">
              join or create one
            </Link>
            .
          </div>
        )}
        {!socketConnected && !noMatch && (
          <div className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-ink-black">
            Disconnected — reconnecting…
          </div>
        )}
        {socketConnected && !match?.board && !noMatch && (
          <div className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-ink-black">
            Waiting for opponent…
          </div>
        )}
        {(syncError || lastError) && (
          <div className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-error-red">
            {syncError || lastError}
          </div>
        )}
        {oppDisconnected && match?.status === "active" && (
          <div className="mb-4 border-2 border-ink-black bg-surface-variant p-3 font-label-mono text-label-mono uppercase tracking-widest text-secondary">
            Opponent disconnected — their clock is paused.
          </div>
        )}
        {result && (
          <div className="mb-4 border-2 border-ink-black bg-ink-black text-paper-white p-4 font-label-mono text-label-mono uppercase tracking-widest">
            {result.winner === myIndex + 1 ? "You win" : "You lose"} —{" "}
            {result.reason}
            {result.eloDelta ? ` · Elo ±${result.eloDelta}` : ""}
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
          <div className="mp-sudoku-grid mx-auto lg:mx-0">
            {Array.from({ length: 81 }, (_, index) => {
              const value = grid[index];
              const status = cellStatus[index];
              const notesSet = notes[index] || [];
              const isSelected = selected === index;
              const cls = `mp-sudoku-cell ${status || ""} ${
                isSelected ? "selected" : ""
              }`;
              return (
                <div
                  key={index}
                  className={cls}
                  onClick={() => handleCellClick(index)}
                >
                  {value != null ? (
                    value
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
                className={`flex items-center gap-2 font-label-mono text-[14px] transition-colors ${
                  notesMode
                    ? "text-ink-blue"
                    : "text-ink-black hover:text-ink-blue"
                }`}
                onClick={() => setNotesMode(!notesMode)}
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Notes
              </button>
              <button
                className={`flex items-center gap-2 font-label-mono text-[14px] transition-colors ${
                  powerUpArmed
                    ? "text-ink-blue"
                    : "text-ink-black hover:text-ink-blue"
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

            {/* Move History Log */}
            <div className="flex flex-col border border-ink-black h-64 bg-paper-white">
              <div className="grid grid-cols-2 border-b border-ink-black font-label-mono text-[12px] uppercase tracking-wider bg-surface-container-highest">
                <div className="p-2 border-r border-ink-black text-center font-bold">
                  {me}
                </div>
                <div className="p-2 text-center">{opponentName}</div>
              </div>
              <div className="move-history flex-1 overflow-y-auto p-0 m-0 font-label-mono text-[14px]">
                {(match?.moveHistory || []).map((entry, i) => {
                  const cellLabel = `R${Math.floor(entry.cell / 9) + 1}C${
                    (entry.cell % 9) + 1
                  }`;
                  const text = `${cellLabel} → ${entry.value}${
                    entry.isPowerUp ? " ⚡" : ""
                  }${entry.correct === false ? " ✗" : ""}`;
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-2 border-b border-ink-black/20 hover:bg-surface-container-low"
                    >
                      <div className="p-2 border-r border-ink-black/20 text-center">
                        {entry.player === 1 ? text : ""}
                      </div>
                      <div className="p-2 text-center">
                        {entry.player === 2 ? text : ""}
                      </div>
                    </div>
                  );
                })}
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

      {/* Bottom Navigation Shell (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-stretch h-16 bg-paper-white border-t-2 border-ink-black z-50 md:hidden">
        <Link
          to="/multiplayer"
          className="flex flex-col items-center justify-center py-2 h-full w-full text-ink-black hover:bg-ink-blue/20 transition-colors"
        >
          <span className="material-symbols-outlined">grid_on</span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest mt-1">
            Play
          </span>
        </Link>
        <Link
          to="/multiplayer"
          className="flex flex-col items-center justify-center py-2 h-full w-full bg-ink-black text-paper-white transition-colors"
        >
          <span className="material-symbols-outlined">forum</span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest mt-1">
            Social
          </span>
        </Link>
        <Link
          to="/archive"
          className="flex flex-col items-center justify-center py-2 h-full w-full text-ink-black hover:bg-ink-blue/20 transition-colors"
        >
          <span className="material-symbols-outlined">list_alt</span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest mt-1">
            Log
          </span>
        </Link>
        <Link
          to="/settings"
          className="flex flex-col items-center justify-center py-2 h-full w-full text-ink-black hover:bg-ink-blue/20 transition-colors"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest mt-1">
            Me
          </span>
        </Link>
      </nav>
    </>
  );
}

export default MultiplayerGameBoardPage;
