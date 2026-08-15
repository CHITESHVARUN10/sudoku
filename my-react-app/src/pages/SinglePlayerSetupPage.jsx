import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DIFFICULTY_BANDS,
  clueColor,
} from "../config/difficulty";
import { usePractice } from "../contexts/PracticeContext";
import Navbar from "../components/Navbar";

function SinglePlayerSetupPage() {
  const navigate = useNavigate();
  const { startGame, fetchActiveGame, activeGame } = usePractice();
  const [difficulty, setDifficulty] = useState("Medium");
  const [clueCount, setClueCount] = useState(DIFFICULTY_BANDS.Medium.base);
  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);
  const [powerUps, setPowerUps] = useState(3);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // Check for an in-progress session to offer a resume.
  useEffect(() => {
    fetchActiveGame().catch(() => {});
  }, [fetchActiveGame]);

  const band = DIFFICULTY_BANDS[difficulty];

  const selectDifficulty = (level) => {
    setDifficulty(level);
    setClueCount(DIFFICULTY_BANDS[level].base);
  };

  const adjustClueCount = (delta) => {
    setClueCount((prev) =>
      Math.min(band.max, Math.max(band.min, prev + delta))
    );
  };

  const beginPractice = async () => {
    setStarting(true);
    setError("");
    try {
      const game = await startGame({
        difficulty,
        clueCount,
        powerUps: powerUpsEnabled ? powerUps : 0,
      });
      navigate("/practice/board", {
        state: {
          gameId: game._id,
          difficulty,
          clueCount,
          powerUps: powerUpsEnabled ? powerUps : 0,
        },
      });
    } catch (err) {
      setError(err.message || "Failed to start practice.");
    } finally {
      setStarting(false);
    }
  };

  const resumeActive = () => {
    if (!activeGame) return;
    navigate("/practice/board", {
      state: {
        gameId: activeGame._id,
        difficulty: activeGame.difficulty,
        clueCount: activeGame.clueCount,
        powerUps: activeGame.powerUpsTotal,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-body-md text-body-md text-ink-black antialiased selection:bg-ink-blue selection:text-paper-white relative">
      {/* Shared Navbar */}
      <Navbar />
      {/* Grid Background Decoration */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-[-1]"></div>
      <main className="flex-grow flex items-center justify-center p-margin-md">
        {/* Setup Panel */}
        <div className="bg-paper-white border border-ink-black shadow-hard max-w-md w-full p-margin-lg">
          {/* Resume Banner */}
          {activeGame && (
            <div className="mb-margin-md border-2 border-ink-black bg-surface-variant p-3 flex items-center justify-between gap-3">
              <div className="font-body-md text-body-md text-ink-black">
                In-progress {activeGame.difficulty} session — score{" "}
                <b>{activeGame.score}</b>
              </div>
              <button
                onClick={resumeActive}
                className="bg-ink-black text-paper-white px-3 py-2 font-label-mono text-label-mono uppercase tracking-wider hover:bg-ink-blue transition-colors"
              >
                Resume
              </button>
            </div>
          )}
          <header className="mb-margin-md text-center">
            <h1 className="font-display-lg text-display-lg text-ink-black tracking-tight mb-2">
              Practice Session
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Select your logic parameters.
            </p>
          </header>
          <div className="space-y-margin-md">
            {/* Difficulty Control */}
            <div>
              <label className="block font-label-mono text-label-mono text-ink-black mb-margin-sm uppercase tracking-widest text-sm text-center">
                Difficulty Level
              </label>
              <div className="flex border border-ink-black divide-x divide-ink-black">
                {Object.keys(DIFFICULTY_BANDS).map((level) => (
                  <button
                    key={level}
                    onClick={() => selectDifficulty(level)}
                    className={`flex-1 py-3 font-label-mono text-label-mono text-sm transition-colors focus:outline-none ${
                      difficulty === level
                        ? "bg-ink-blue text-paper-white"
                        : "text-ink-black bg-paper-white hover:bg-surface-container focus:bg-surface-container"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Clue-count stepper with live color feedback */}
            <div className="flex items-center gap-3 border border-ink-black p-3">
              <span className="font-label-mono text-label-mono text-sm uppercase tracking-widest text-secondary">
                Clues
              </span>
              <button
                type="button"
                aria-label="Fewer clues (harder)"
                onClick={() => adjustClueCount(-1)}
                disabled={clueCount <= band.min}
                className="w-9 h-9 border-2 border-ink-black font-headline-sm text-headline-sm hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                −
              </button>
              <div className="flex-1 flex flex-col items-center">
                <span
                  className="font-headline-sm text-headline-sm font-bold px-3 py-1 border-2 border-ink-black transition-colors duration-200"
                  style={{ backgroundColor: clueColor(clueCount, band) }}
                >
                  {clueCount}
                </span>
                <span className="font-label-mono text-[10px] uppercase tracking-widest text-secondary mt-1">
                  {band.min} – {band.max} · base {band.base}
                </span>
              </div>
              <button
                type="button"
                aria-label="More clues (easier)"
                onClick={() => adjustClueCount(1)}
                disabled={clueCount >= band.max}
                className="w-9 h-9 border-2 border-ink-black font-headline-sm text-headline-sm hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            {/* Power-ups */}
            <div className="flex items-center justify-between border border-ink-black p-3">
              <div className="flex items-center gap-3">
                <span className="font-body-md text-body-md">Power-ups</span>
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
                  <span className="font-label-mono text-label-mono text-xs uppercase tracking-widest text-secondary">
                    Max
                  </span>
                  <button
                    type="button"
                    aria-label="Fewer power-ups"
                    onClick={() => setPowerUps((p) => Math.max(1, p - 1))}
                    disabled={powerUps <= 1}
                    className="w-8 h-8 border-2 border-ink-black font-headline-sm hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="font-headline-sm text-headline-sm font-bold w-8 text-center">
                    {powerUps}
                  </span>
                  <button
                    type="button"
                    aria-label="More power-ups"
                    onClick={() => setPowerUps((p) => Math.min(3, p + 1))}
                    disabled={powerUps >= 3}
                    className="w-8 h-8 border-2 border-ink-black font-headline-sm hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Action */}
            {error && (
              <p
                className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="pt-margin-sm">
              <button
                onClick={beginPractice}
                disabled={starting}
                className="w-full border-2 border-ink-black bg-paper-white text-ink-black py-4 font-label-mono text-label-mono uppercase tracking-widest hover:bg-ink-black hover:text-paper-white transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? "STARTING…" : "BEGIN PRACTICE"}
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
          {/* Optional Editorial Note */}
          <div className="mt-margin-md pt-margin-md border-t border-ink-black/20 text-center">
            <p className="font-grid-notes text-grid-notes text-note-gray uppercase tracking-widest">
              {difficulty} · {clueCount} clues ·{" "}
              {powerUpsEnabled ? `${powerUps} power-ups` : "no power-ups"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SinglePlayerSetupPage;
