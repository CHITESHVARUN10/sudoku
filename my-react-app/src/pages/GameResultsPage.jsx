import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useHistory } from "../contexts/HistoryContext";
import Navbar from "../components/Navbar";
import { staggerParent, staggerChild } from "../components/motion/presets";

function formatTime(sec) {
  if (sec == null || isNaN(sec)) return "—";
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function GameResultsPage() {
  const { id } = useParams();
  const { fetchHistoryDetail } = useHistory();
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchHistoryDetail(id)
      .then((g) => {
        if (!cancelled) setGame(g);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load game.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, fetchHistoryDetail]);

  const isMultiplayer = game?.mode === "Multiplayer";
  // `game.opponent` is the OTHER player's id for multiplayer rows, and
  // `game.players` is [p1, p2]. The viewer is the player who is NOT the
  // opponent; moves carry the absolute player seat (1 or 2).
  const meSeat = isMultiplayer
    ? (game.players?.findIndex(
        (p) => p && String(p._id) !== String(game.opponent)
      ) ?? -1) + 1
    : 0;
  const oppSeat = meSeat === 1 ? 2 : meSeat === 2 ? 1 : 0;
  const meName = isMultiplayer
    ? game.players?.find((p) => p && String(p._id) !== String(game.opponent))
        ?.name || "You"
    : "You";
  const oppName = isMultiplayer ? game.opponentName || "Opponent" : null;

  const moves = game?.moves || [];

  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col antialiased">
      {/* Shared Navbar */}
      <Navbar />

      <main className="flex-grow flex flex-col px-margin-sm md:px-margin-lg py-margin-lg max-w-screen-2xl mx-auto w-full">
        {loading && (
          <div className="py-16 text-center font-body-md text-body-md text-secondary">
            Loading game…
          </div>
        )}
        {error && (
          <div className="py-16 text-center font-body-md text-body-md text-error-red">
            {error}
            <div className="mt-4">
              <Link to="/archive" className="underline">
                Back to Archive
              </Link>
            </div>
          </div>
        )}

        {game && !error && (
          <>
            {/* Header Section */}
            <motion.header
              className="mb-margin-lg"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <h1 className="font-display-lg text-display-lg text-ink-black mb-grid-unit">
                {game.result === "Win" || game.result === "Solved"
                  ? "Victory"
                  : game.result === "Abandoned"
                  ? "Abandoned"
                  : "Defeat"}{" "}
                · {formatTime(game.timeSec)}
              </h1>
              <p className="font-body-lg text-body-lg text-note-gray">
                {game.difficulty} Difficulty · {game.mode} Session
                {oppName ? ` · vs ${oppName}` : ""}
              </p>
            </motion.header>

            {/* Stats Summary */}
            <motion.section
              className="border-t-hairline border-b-hairline border-ink-black py-margin-md mb-margin-lg flex flex-row items-center justify-between"
              variants={staggerParent}
              initial="hidden"
              animate="visible"
            >
              {[
                { label: "Time", value: formatTime(game.timeSec) },
                { label: "Mistakes", value: game.mistakes ?? 0 },
                { label: "Moves", value: game.movesCount ?? moves.length },
                { label: "Score", value: game.score ?? 0 },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={staggerChild}
                  className={`flex-1 text-center px-margin-sm ${
                    stat.label !== "Score" ? "border-r-hairline border-ink-black" : ""
                  }`}
                >
                  <span className="block font-headline-md text-headline-md text-ink-black">
                    {stat.value}
                  </span>
                  <span className="block font-label-mono text-label-mono text-note-gray mt-grid-unit text-sm uppercase tracking-widest">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </motion.section>

            {/* Move History Ledger */}
            <section className="flex-grow overflow-auto mb-margin-lg">
              <h2 className="sr-only">Move History</h2>

              {isMultiplayer && (
                <div className="grid grid-cols-2 border-b border-ink-black font-label-mono text-label-mono text-[12px] uppercase tracking-wider mb-2">
                  <div className="py-2 border-r border-ink-black text-center font-bold">
                    {meName}
                  </div>
                  <div className="py-2 text-center">{oppName}</div>
                </div>
              )}

              {moves.length ? (
                <motion.div
                  variants={staggerParent}
                  initial="hidden"
                  animate="visible"
                >
                  {moves.slice(0, 30).map((move, i) => {
                  const cellLabel = `R${Math.floor(move.cell / 9) + 1}C${
                    (move.cell % 9) + 1
                  }`;
                  const text = `${cellLabel} → ${move.value}${
                    move.isPowerUp ? " ⚡" : ""
                  }${move.correct === false ? " ✗" : ""}`;
                  return isMultiplayer ? (
                    <motion.div
                      key={i}
                      variants={staggerChild}
                      className="grid grid-cols-2 border-b border-ink-black/20 font-grid-notes text-grid-notes text-ink-black"
                    >
                      <div className="py-3 px-2 border-r border-ink-black/20">
                        {move.player === meSeat ? text : ""}
                      </div>
                      <div className="py-3 px-2">
                        {move.player === oppSeat ? text : ""}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={i}
                      variants={staggerChild}
                      className="border-b-hairline border-ink-black group hover:bg-surface-container-high transition-colors duration-150 font-grid-notes text-grid-notes text-ink-black"
                    >
                      <div className="py-3 px-2">
                        <span className="text-note-gray mr-2">{i + 1}.</span>
                        {text}
                      </div>
                    </motion.div>
                  );
                })}
                </motion.div>
              ) : (
                <div className="py-8 text-center font-body-md text-body-md text-secondary">
                  No moves recorded for this game.
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Action Row (Bottom) */}
      <footer className="mt-auto px-margin-sm md:px-margin-lg max-w-screen-2xl mx-auto w-full pb-margin-lg">
        <nav className="flex flex-col sm:flex-row items-center justify-start border-t-hairline border-b-hairline border-ink-black py-margin-sm">
          <motion.div whileTap={{ scale: 0.98 }} className="contents">
          <Link
            to="/practice"
            className="font-label-mono text-label-mono text-ink-black hover:text-note-gray transition-colors uppercase tracking-widest text-sm px-margin-md border-r-hairline border-ink-black sm:w-auto w-full text-center sm:text-left py-2 sm:py-0"
          >
            Rematch
          </Link>
          </motion.div>
          <motion.div whileTap={{ scale: 0.98 }} className="contents">
          <Link
            to="/practice"
            className="font-label-mono text-label-mono text-ink-black hover:text-note-gray transition-colors uppercase tracking-widest text-sm px-margin-md border-r-hairline border-ink-black sm:w-auto w-full text-center sm:text-left py-2 sm:py-0"
          >
            New Game
          </Link>
          </motion.div>
          <motion.div whileTap={{ scale: 0.98 }} className="contents">
          <Link
            to="/archive"
            className="font-label-mono text-label-mono text-ink-black hover:text-note-gray transition-colors uppercase tracking-widest text-sm px-margin-md sm:w-auto w-full text-center sm:text-left py-2 sm:py-0"
          >
            Back to Archive
          </Link>
          </motion.div>
        </nav>
      </footer>
    </div>
  );
}

export default GameResultsPage;
