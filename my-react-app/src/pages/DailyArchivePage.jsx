import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useHistory } from "../contexts/HistoryContext";
import { useDaily } from "../contexts/DailyContext";
import Navbar from "../components/Navbar";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
}

function formatTime(sec) {
  if (sec == null || isNaN(sec)) return "—";
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function DailyArchivePage() {
  const { games, fetchHistory, loading, error } = useHistory();
  const { today, fetchToday } = useDaily();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    Promise.all([fetchHistory(1), fetchToday().catch(() => null)])
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchHistory, fetchToday, loaded]);
  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col font-body-md antialiased">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-[1024px] mx-auto px-margin-lg pt-margin-lg pb-24">
        {/* Header & Filters */}
        <div className="mb-12">
          <h1 className="font-headline-md text-headline-md font-bold uppercase tracking-[0.1em] text-ink-black pb-4 border-b border-ink-black mb-4">
            GAME ARCHIVE
          </h1>
          {/* Filter Row (static — the ledger below lists every game) */}
          <div className="flex items-center font-label-mono text-label-mono text-note-gray uppercase">
            <span className="text-ink-black underline underline-offset-4 decoration-[1px] pr-6">
              All
            </span>
            <div className="w-px h-4 bg-ink-black mx-2"></div>
            <span className="hover:text-ink-black px-6">Multiplayer</span>
            <div className="w-px h-4 bg-ink-black mx-2"></div>
            <span className="hover:text-ink-black pl-6">Solo</span>
          </div>
        </div>

          {/* Today's Daily */}
          {today && (
            <motion.div
              className="mb-8 border-2 border-ink-black p-4 flex items-center justify-between"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div>
                <div className="font-label-mono text-label-mono uppercase tracking-widest text-note-gray mb-1">
                  Today's Daily Puzzle
                </div>
                <div className="font-headline-sm text-headline-sm">
                  {today.date} · {today.difficulty} ·{" "}
                  {today.grid?.filter((v) => v != null).length || "?"} clues
                </div>
              </div>
              <Link
                to="/practice/board"
                state={{ source: "daily", puzzleId: today._id }}
                className="border border-ink-black px-4 py-2 font-label-mono text-label-mono uppercase tracking-wider hover:bg-ink-black hover:text-paper-white transition-colors"
              >
                Play
              </Link>
            </motion.div>
          )}

        {/* Ledger List View */}
        <div className="w-full">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 pb-4 border-b border-ink-black font-label-mono text-[14px] text-note-gray uppercase tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Mode</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-3">Opponent</div>
            <div className="col-span-2">Result</div>
            <div className="col-span-1 text-right">Time</div>
          </div>

          {/* Ledger Rows */}
          {loading && !games.length && (
            <div className="py-8 text-center font-body-md text-body-md text-secondary">
              Loading history…
            </div>
          )}
          {error && (
            <div className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2" role="alert">
              {error}
            </div>
          )}
          {!loading && !games.length && (
            <div className="py-8 text-center font-body-md text-body-md text-secondary">
              No games yet — your archived matches will appear here.
            </div>
          )}
          {games.map((game, i) => (
            <motion.div
              key={game._id || i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.3 }}
            >
            <Link
              to={`/results/${game._id}`}
              whileHover={{ x: 4 }}
              className="group grid grid-cols-12 gap-4 py-6 border-b border-ink-black hover:bg-surface-container-low transition-colors duration-150 cursor-pointer items-center text-body-md"
            >
              <div className="col-span-2 font-label-mono text-label-mono text-ink-black">
                {formatDate(game.createdAt)}
              </div>
              <div className="col-span-2">{game.mode}</div>
              <div className="col-span-2">{game.difficulty}</div>
              <div className="col-span-3 text-note-gray">
                {game.opponentName || "—"}
              </div>
              <div className={`col-span-2 ${game.result === "Loss" || game.result === "Abandoned" ? "text-error-red" : ""}`}>
                {game.result}
              </div>
              <div className="col-span-1 text-right font-label-mono text-label-mono">
                {formatTime(game.timeSec)}
              </div>
            </Link>
            </motion.div>
          ))}

          {/* Empty State — only when there are truly no games */}
          {!loading && !games.length && (
            <div className="mt-24 text-center">
              <p className="font-headline-sm text-headline-sm text-note-gray">
                No games yet — start your first puzzle.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-paper-white border-t border-ink-black mt-auto">
        <div className="w-full py-margin-md px-margin-lg flex flex-col md:flex-row justify-between items-center max-w-[1440px] mx-auto font-label-mono text-label-mono text-ink-black">
          <div className="mb-4 md:mb-0 text-note-gray">
            © 2024 Editorial Sudoku. All Rights Reserved.
          </div>
          <div className="flex space-x-8">
            <Link to="/about" className="text-note-gray hover:text-ink-black transition-colors duration-150">
              Privacy Policy
            </Link>
            <Link to="/about" className="text-note-gray hover:text-ink-black transition-colors duration-150">
              Terms of Service
            </Link>
            <Link to="/how-to-play" className="text-note-gray hover:text-ink-black transition-colors duration-150">
              How to Play
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DailyArchivePage;
