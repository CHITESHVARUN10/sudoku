import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { useRoom } from "../contexts/RoomContext";
import { useSocket } from "../contexts/SocketContext";
import { useMatch } from "../contexts/MatchContext";
import { useHistory } from "../contexts/HistoryContext";
import Navbar from "../components/Navbar";
import { staggerParent, staggerChild } from "../components/motion/presets";
import {
  DIFFICULTY_BANDS,
  clueColor,
  TIMER_OPTIONS,
} from "../config/difficulty";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MultiplayerSetupModalPage() {
  const { user } = useAuth();
  const { createRoom, joinRoom } = useRoom();
  const { joinRoom: joinSocketRoom } = useSocket();
  const { activeMatch, fetchActiveMatch } = useMatch();
  const { games, fetchHistory } = useHistory();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("Medium");
  const [clueCount, setClueCount] = useState(DIFFICULTY_BANDS.Medium.base);
  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
  const [powerUps, setPowerUps] = useState(3); // 1-3 max per player
  const [timerMin, setTimerMin] = useState(0); // 0 = off
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const band = DIFFICULTY_BANDS[difficulty];
  const playerName = user?.name || "Guest";

  // Load resume + history info on mount.
  useEffect(() => {
    fetchActiveMatch().catch(() => {});
    fetchHistory(1).catch(() => {});
  }, [fetchActiveMatch, fetchHistory]);

  const pastMatches = (games || [])
    .filter((g) => g.mode === "Multiplayer")
    .slice(0, 5);

  const selectDifficulty = (level) => {
    setDifficulty(level);
    setClueCount(DIFFICULTY_BANDS[level].base);
    setError("");
  };

  const adjustClueCount = (delta) => {
    setClueCount((prev) =>
      Math.min(band.max, Math.max(band.min, prev + delta))
    );
  };

  const handleInitialize = async () => {
    setError("");
    setCreating(true);
    try {
      const room = await createRoom({
        difficulty,
        clueCount,
        powerUps: powerUpsEnabled ? powerUps : 0,
        timerMin,
      });
      navigate("/multiplayer/waiting", {
        state: { roomCode: room.code, settings: room },
      });
    } catch (err) {
      setError(err.message || "Failed to create room. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError("Enter a room code to join.");
      return;
    }
    setError("");
    setJoining(true);
    try {
      const room = await joinRoom(joinCode.trim().toUpperCase());
      // Guest joins the socket room -> backend sees status full -> match starts.
      if (user?._id) joinSocketRoom(room.code, user._id);
      navigate("/multiplayer/board", {
        state: { roomCode: room.code, settings: room },
      });
    } catch (err) {
      setError(err.message || "Failed to join room.");
    } finally {
      setJoining(false);
    }
  };

  const resumeMatch = () => {
    if (!activeMatch?._id) return;
    navigate("/multiplayer/board", {
      state: { matchId: activeMatch._id },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper-white text-ink-black font-body-md text-body-md antialiased">
      {/* Shared Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-margin-md md:px-margin-lg py-margin-lg">
        <header className="mb-margin-lg">
          <h1 className="font-headline-md text-headline-md uppercase tracking-tight">
            Multiplayer
          </h1>
          <p className="font-body-md text-body-md text-secondary mt-2">
            Simultaneous battle on one shared grid — fastest, most accurate
            solver wins.
          </p>
        </header>

        {/* Active match resume banner */}
        <AnimatePresence>
          {activeMatch && (
            <motion.div
              className="mb-margin-md border-2 border-ink-black bg-surface-variant p-4 flex items-center justify-between gap-4 flex-wrap"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="font-body-md text-body-md">
                Active match — {activeMatch.difficulty} ·{" "}
                {activeMatch.clueCount} clues · your score{" "}
                <b>
                  {String(activeMatch.player1) === String(user?._id)
                    ? activeMatch.scores?.p1 ?? 0
                    : activeMatch.scores?.p2 ?? 0}
                </b>
              </div>
              <button
                onClick={resumeMatch}
                className="bg-ink-black text-paper-white px-4 py-2 font-label-mono text-label-mono uppercase tracking-wider hover:bg-ink-blue transition-colors"
              >
                Rejoin Match
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-margin-lg"
          variants={staggerParent}
          initial="hidden"
          animate="visible"
        >
          {/* Left: Create Match */}
          <motion.section className="border-2 border-ink-black p-margin-md" variants={staggerChild}>
            <h2 className="font-headline-sm text-headline-sm uppercase tracking-widest border-b border-ink-black pb-2 mb-margin-md">
              Create Match
            </h2>

            {/* Player Inputs */}
            <div className="space-y-margin-sm mb-margin-md">
              <div className="group">
                <label
                  className="block font-label-mono text-grid-notes text-note-gray uppercase tracking-widest mb-1 group-focus-within:text-ink-blue transition-colors"
                  htmlFor="player1"
                >
                  Player 1 (You)
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b-[2px] border-ink-black p-0 py-2 font-headline-sm text-headline-sm focus:ring-0 focus:border-ink-blue focus:outline-none transition-colors placeholder:text-note-gray"
                  id="player1"
                  name="player1"
                  type="text"
                  value={playerName}
                  readOnly
                />
              </div>
              <div className="group">
                <label
                  className="block font-label-mono text-grid-notes text-note-gray uppercase tracking-widest mb-1 group-focus-within:text-ink-blue transition-colors"
                  htmlFor="player2"
                >
                  Player 2
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b-[2px] border-ink-black p-0 py-2 font-headline-sm text-headline-sm focus:ring-0 focus:border-ink-blue focus:outline-none transition-colors placeholder:text-surface-tint"
                  id="player2"
                  name="player2"
                  placeholder="Waiting for opponent..."
                  type="text"
                  readOnly
                />
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="mb-margin-md">
              <label className="block font-label-mono text-grid-notes text-ink-black uppercase tracking-widest mb-3 border-b border-ink-black pb-1">
                Difficulty Protocol
              </label>
              <div className="flex border-[2px] border-ink-black">
                {Object.keys(DIFFICULTY_BANDS).map((level, i) => (
                  <button
                    key={level}
                    onClick={() => selectDifficulty(level)}
                    className={`flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-wider transition-colors ${
                      i < 3 ? "border-r-[2px] border-ink-black" : ""
                    } ${
                      difficulty === level
                        ? "bg-ink-black text-paper-white"
                        : "text-ink-black hover:bg-surface-variant"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Clue-count stepper with live color feedback */}
              <div className="mt-3 flex items-center gap-3 border-[2px] border-ink-black p-3">
                <span className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary">
                  Clues
                </span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  aria-label="Fewer clues (harder)"
                  onClick={() => adjustClueCount(-1)}
                  disabled={clueCount <= band.min}
                  className="w-10 h-10 border-2 border-ink-black font-headline-sm text-headline-sm hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </motion.button>
                <div className="flex-1 flex flex-col items-center">
                  <motion.span
                    key={clueCount}
                    initial={{ scale: 0.85, opacity: 0.4 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="font-headline-md text-headline-md font-bold px-4 py-1 border-2 border-ink-black transition-colors duration-200"
                    style={{ backgroundColor: clueColor(clueCount, band) }}
                  >
                    {clueCount}
                  </motion.span>
                  <span className="font-label-mono text-[11px] uppercase tracking-widest text-secondary mt-1">
                    {band.min} – {band.max} · base {band.base}
                  </span>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  aria-label="More clues (easier)"
                  onClick={() => adjustClueCount(1)}
                  disabled={clueCount >= band.max}
                  className="w-10 h-10 border-2 border-ink-black font-headline-sm text-headline-sm hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </motion.button>
              </div>
              <p className="font-body-md text-grid-notes text-note-gray mt-2 text-right italic">
                {clueCount >= band.base
                  ? `Estimated time: 10-15 mins (${clueCount} clues, on the easier side)`
                  : `Estimated time: 15-30 mins (${clueCount} clues, getting tougher)`}
              </p>
            </div>

            {/* Power-ups */}
            <div className="mb-margin-md">
              <label className="block font-label-mono text-grid-notes text-ink-black uppercase tracking-widest mb-3 border-b border-ink-black pb-1">
                Power-ups
              </label>
              <div className="flex items-center justify-between border-[2px] border-ink-black p-3">
                <div className="flex items-center gap-3">
                  <span className="font-body-md text-body-md">Enabled</span>
                  <button
                    type="button"
                    onClick={() => setPowerUpsEnabled(!powerUpsEnabled)}
                    className={`w-11 h-6 border-2 border-ink-black relative transition-colors ${
                      powerUpsEnabled ? "bg-ink-blue" : "bg-surface-variant"
                    }`}
                    aria-pressed={powerUpsEnabled}
                  >
                    <span
                      className={`absolute top-0 h-full w-4 bg-paper-white border-r-2 border-ink-black transition-all ${
                        powerUpsEnabled ? "left-6" : "left-0"
                      }`}
                    />
                  </button>
                </div>
                {powerUpsEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary">
                      Max / player
                    </span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      aria-label="Fewer power-ups"
                      onClick={() => setPowerUps((p) => Math.max(1, p - 1))}
                      disabled={powerUps <= 1}
                      className="w-8 h-8 border-2 border-ink-black font-headline-sm hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      −
                    </motion.button>
                    <span className="font-headline-md text-headline-md font-bold w-8 text-center">
                      {powerUps}
                    </span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      aria-label="More power-ups"
                      onClick={() => setPowerUps((p) => Math.min(3, p + 1))}
                      disabled={powerUps >= 3}
                      className="w-8 h-8 border-2 border-ink-black font-headline-sm hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </motion.button>
                  </div>
                )}
              </div>
              <p className="font-body-md text-grid-notes text-note-gray mt-2 text-right italic">
                {powerUpsEnabled
                  ? `Each player gets up to ${powerUps} exact-cell reveals per match.`
                  : "No power-ups — pure logic."}
              </p>
            </div>

            {/* Timer (chess clock) */}
            <div className="mb-margin-md">
              <label className="block font-label-mono text-grid-notes text-ink-black uppercase tracking-widest mb-3 border-b border-ink-black pb-1">
                Timer (Chess Clock)
              </label>
              <div className="flex border-[2px] border-ink-black flex-wrap">
                {TIMER_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTimerMin(opt)}
                    className={`flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-wider transition-colors ${
                      timerMin === opt
                        ? "bg-ink-black text-paper-white"
                        : "text-ink-black hover:bg-surface-variant"
                    }`}
                  >
                    {opt === 0 ? "Off" : `${opt}m`}
                  </motion.button>
                ))}
              </div>
              <p className="font-body-md text-grid-notes text-note-gray mt-2 text-right italic">
                {timerMin === 0
                  ? "No clock — play at your own pace."
                  : `Each player gets ${timerMin} min; clock runs only on your turn.`}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2 mb-margin-md"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleInitialize}
              disabled={creating}
              className="w-full bg-ink-black text-paper-white py-4 font-headline-sm text-label-mono uppercase tracking-[0.2em] hover:bg-ink-blue transition-colors hard-shadow border border-ink-black group flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{creating ? "Creating Room…" : "Initialize Match"}</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </motion.button>
          </motion.section>

          {/* Right: Join + Past matches */}
          <motion.section className="flex flex-col gap-margin-lg" variants={staggerChild}>
            {/* Join with code */}
            <div className="border-2 border-ink-black p-margin-md">
              <h2 className="font-headline-sm text-headline-sm uppercase tracking-widest border-b border-ink-black pb-2 mb-margin-md">
                Join Match
              </h2>
              <label className="block font-label-mono text-grid-notes text-note-gray uppercase tracking-widest mb-1">
                Have a code? Join a room
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-transparent border-0 border-b-[2px] border-ink-black p-0 py-1 font-headline-sm text-headline-sm focus:ring-0 focus:border-ink-blue focus:outline-none transition-colors placeholder:text-note-gray uppercase"
                  placeholder="SD-000-00"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="bg-ink-black text-paper-white px-4 py-1 font-label-mono text-label-mono uppercase tracking-wider hover:bg-ink-blue transition-colors disabled:opacity-50"
                >
                  {joining ? "Joining…" : "Join"}
                </button>
              </div>
            </div>

            {/* Past matches */}
            <div className="border-2 border-ink-black p-margin-md">
              <h2 className="font-headline-sm text-headline-sm uppercase tracking-widest border-b border-ink-black pb-2 mb-margin-md">
                Recent Matches
              </h2>
              {pastMatches.length ? (
                <motion.ul
                  className="divide-y divide-ink-black/20"
                  variants={staggerParent}
                  initial="hidden"
                  animate="visible"
                >
                  {pastMatches.map((g, i) => (
                    <motion.li
                      key={g._id || i}
                      variants={staggerChild}
                      className="py-2 flex items-center justify-between gap-4"
                    >
                      <div className="flex flex-col">
                        <span className="font-body-md text-body-md">
                          {g.result === "Win" ? "Won" : "Lost"} · {g.difficulty}
                        </span>
                        <span className="font-grid-notes text-grid-notes text-secondary">
                          {formatDate(g.createdAt)} · {g.movesCount} moves
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-headline-sm text-headline-sm ${
                            g.eloDelta > 0 ? "text-ink-blue" : "text-error-red"
                          }`}
                        >
                          {g.eloDelta > 0 ? `+${g.eloDelta}` : g.eloDelta} ELO
                        </span>
                        <div className="font-grid-notes text-grid-notes text-secondary">
                          Score {g.score}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <p className="font-body-md text-body-md text-secondary">
                  No multiplayer matches yet — create one and your results will
                  appear here.
                </p>
              )}
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}

export default MultiplayerSetupModalPage;
