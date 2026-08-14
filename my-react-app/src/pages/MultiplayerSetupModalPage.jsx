import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiClient } from "../api/client";
import {
  DIFFICULTY_BANDS,
  clueColor,
  TIMER_OPTIONS,
} from "../config/difficulty";

function MultiplayerSetupModalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("Medium");
  const [clueCount, setClueCount] = useState(DIFFICULTY_BANDS.Medium.base);
  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
  const [powerUps, setPowerUps] = useState(3); // 1-3 max per player
  const [timerMin, setTimerMin] = useState(0); // 0 = off
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const band = DIFFICULTY_BANDS[difficulty];
  const playerName = user?.name || "Guest";

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
      const res = await apiClient.post("/rooms", {
        difficulty,
        clueCount,
        powerUps: powerUpsEnabled ? powerUps : 0,
        timerMin,
      });
      navigate("/multiplayer/waiting", {
        state: { roomCode: res.code, settings: res.room },
      });
    } catch (err) {
      setError(err.message || "Failed to create room. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full bg-paper-white bg-grid-pattern font-body-md text-body-md text-ink-black flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* Top Navigation (Context) */}
      <nav className="absolute top-0 w-full border-b border-ink-black bg-paper-white z-10 flex justify-between items-center px-margin-lg h-16 max-w-[1440px] mx-auto border-b-hairline border-surface-variant">
        <div className="font-headline-md text-headline-md font-bold text-ink-black uppercase tracking-tighter">
          SUDOKU
        </div>
        <div className="hidden md:flex space-x-margin-md font-headline-sm text-headline-sm uppercase tracking-wider">
          <Link
            to="/archive"
            className="text-note-gray hover:text-ink-black transition-colors duration-150"
          >
            DAILY
          </Link>
          <Link
            to="/archive"
            className="text-note-gray hover:text-ink-black transition-colors duration-150"
          >
            ARCHIVE
          </Link>
          <Link
            to="/stats"
            className="text-note-gray hover:text-ink-black transition-colors duration-150"
          >
            STATS
          </Link>
        </div>
        <div className="flex items-center space-x-margin-sm">
          <Link
            to="/multiplayer/board"
            className="font-headline-sm text-headline-sm uppercase tracking-wider hover:bg-surface-variant transition-colors duration-150 px-2 py-1 border border-ink-black"
          >
            PLAY NOW
          </Link>
        </div>
      </nav>

      {/* Overlay Background */}
      <div className="absolute inset-0 bg-ink-black/20 backdrop-blur-[2px] z-20 flex items-center justify-center p-4">
        {/* Modal Panel */}
        <div className="bg-paper-white border-[2px] border-ink-black w-full max-w-lg hard-shadow relative animate-[slideIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="border-b-[2px] border-ink-black p-margin-sm flex justify-between items-center bg-surface-variant">
            <h2 className="font-headline-md text-headline-md uppercase tracking-tight">
              Multiplayer Setup
            </h2>
            <Link
              to="/"
              className="text-ink-black hover:text-error-red transition-colors flex items-center justify-center w-8 h-8 border border-ink-black bg-paper-white hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </Link>
          </div>

          {/* Modal Body */}
          <div className="p-margin-md space-y-margin-lg">
            {/* Player Inputs */}
            <div className="space-y-margin-sm">
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
            <div>
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
                <button
                  type="button"
                  aria-label="Fewer clues (harder)"
                  onClick={() => adjustClueCount(-1)}
                  disabled={clueCount <= band.min}
                  className="w-10 h-10 border-2 border-ink-black font-headline-sm text-headline-sm hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <div className="flex-1 flex flex-col items-center">
                  <span
                    className="font-headline-md text-headline-md font-bold px-4 py-1 border-2 border-ink-black transition-colors duration-200"
                    style={{ backgroundColor: clueColor(clueCount, band) }}
                  >
                    {clueCount}
                  </span>
                  <span className="font-label-mono text-[11px] uppercase tracking-widest text-secondary mt-1">
                    {band.min} – {band.max} · base {band.base}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="More clues (easier)"
                  onClick={() => adjustClueCount(1)}
                  disabled={clueCount >= band.max}
                  className="w-10 h-10 border-2 border-ink-black font-headline-sm text-headline-sm hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <p className="font-body-md text-grid-notes text-note-gray mt-2 text-right italic">
                {clueCount >= band.base
                  ? `Estimated time: 10-15 mins (${clueCount} clues, on the easier side)`
                  : `Estimated time: 15-30 mins (${clueCount} clues, getting tougher)`}
              </p>
            </div>

            {/* Power-ups */}
            <div>
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
                    <button
                      type="button"
                      aria-label="Fewer power-ups"
                      onClick={() => setPowerUps((p) => Math.max(1, p - 1))}
                      disabled={powerUps <= 1}
                      className="w-8 h-8 border-2 border-ink-black font-headline-sm hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="font-headline-md text-headline-md font-bold w-8 text-center">
                      {powerUps}
                    </span>
                    <button
                      type="button"
                      aria-label="More power-ups"
                      onClick={() => setPowerUps((p) => Math.min(3, p + 1))}
                      disabled={powerUps >= 3}
                      className="w-8 h-8 border-2 border-ink-black font-headline-sm hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
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
            <div>
              <label className="block font-label-mono text-grid-notes text-ink-black uppercase tracking-widest mb-3 border-b border-ink-black pb-1">
                Timer (Chess Clock)
              </label>
              <div className="flex border-[2px] border-ink-black flex-wrap">
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setTimerMin(opt)}
                    className={`flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-wider transition-colors ${
                      timerMin === opt
                        ? "bg-ink-black text-paper-white"
                        : "text-ink-black hover:bg-surface-variant"
                    }`}
                  >
                    {opt === 0 ? "Off" : `${opt}m`}
                  </button>
                ))}
              </div>
              <p className="font-body-md text-grid-notes text-note-gray mt-2 text-right italic">
                {timerMin === 0
                  ? "No clock — play at your own pace."
                  : `Each player gets ${timerMin} min; clock runs only on your turn.`}
              </p>
            </div>

            {error && (
              <p
                className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-margin-md border-t-[2px] border-ink-black bg-surface-container">
            <button
              onClick={handleInitialize}
              disabled={creating}
              className="w-full bg-ink-black text-paper-white py-4 font-headline-sm text-label-mono uppercase tracking-[0.2em] hover:bg-ink-blue transition-colors hard-shadow border border-ink-black group flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{creating ? "Creating Room…" : "Initialize Match"}</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Sidebar (Context) */}
      <div className="absolute left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-ink-black bg-surface-container hidden lg:flex flex-col py-8 border-r-hairline border-surface-variant">
        <div className="px-4 py-2 bg-ink-black text-paper-white font-bold mb-2">
          <span className="material-symbols-outlined mr-2 align-middle">groups</span>
          Multiplayer
        </div>
        <div className="px-4 py-2 text-ink-black hover:underline cursor-pointer opacity-50 pointer-events-none">
          <span className="material-symbols-outlined mr-2 align-middle">grid_view</span>
          New Game
        </div>
      </div>
    </div>
  );
}

export default MultiplayerSetupModalPage;
