import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLeaderboard } from "../contexts/LeaderboardContext";
import Navbar from "../components/Navbar";

const PERIODS = [
  { key: "all-time", label: "All Time" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

function LeaderboardPage() {
  const { entries, fetchLeaderboard, loading, error } = useLeaderboard();
  const [activePeriod, setActivePeriod] = useState("all-time");

  useEffect(() => {
    fetchLeaderboard(activePeriod).catch(() => {});
  }, [activePeriod, fetchLeaderboard]);

  const handlePeriod = (key) => setActivePeriod(key);
  return (
    <div className="min-h-screen flex flex-col font-body-md text-body-md bg-paper-white text-ink-black">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center pt-16 px-margin-sm md:px-margin-lg pb-32">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <header className="w-full mb-8">
            <h1 className="font-headline-md text-headline-md uppercase tracking-widest text-ink-black mb-4">
              Leaderboard
            </h1>
            <div className="w-full h-hairline bg-ink-black"></div>
            {/* Filter Row */}
            <div className="flex items-center gap-6 mt-4 font-body-md text-body-md">
              {PERIODS.map((p, i) => (
                <span key={p.key} className="flex items-center gap-6">
                  {i > 0 && <span className="w-hairline h-4 bg-ink-black opacity-20"></span>}
                  <button
                    onClick={() => handlePeriod(p.key)}
                    className={
                      activePeriod === p.key
                        ? "text-ink-black border-b-[2px] border-ink-blue pb-1 font-medium transition-colors"
                        : "text-secondary hover:text-ink-black transition-colors pb-1"
                    }
                  >
                    {p.label}
                  </button>
                </span>
              ))}
            </div>
          </header>

          {loading && (
            <div className="font-body-md text-body-md text-secondary py-8">
              Loading leaderboard…
            </div>
          )}
          {error && (
            <div className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2" role="alert">
              {error}
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="w-full border-t border-ink-black">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 py-4 border-b border-ink-black font-body-md text-body-md uppercase tracking-wider text-secondary">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5">Name</div>
              <div className="col-span-2 text-right">Win Rate</div>
              <div className="col-span-2 text-right">Games Played</div>
              <div className="col-span-2 text-right">Elo</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col">
              {entries.length ? (
                entries.map((row, i) => (
                  <div
                    key={row._id || i}
                    className="grid grid-cols-12 gap-4 py-4 border-b border-ink-black/20 hover:bg-ink-blue/5 transition-colors"
                  >
                    <div
                      className={`col-span-1 text-center font-label-mono text-label-mono ${
                        i < 3 ? "text-ink-blue font-bold" : ""
                      }`}
                    >
                      {row.rank}
                    </div>
                    <div
                      className={`col-span-5 flex items-center ${
                        i < 3
                          ? "font-headline-sm text-headline-sm"
                          : "font-body-lg text-body-lg"
                      }`}
                    >
                      {row.user?.name || "Unknown"}
                    </div>
                    <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                      {row.winRate}%
                    </div>
                    <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                      {row.gamesPlayed}
                    </div>
                    <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                      {row.elo}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center font-body-md text-body-md text-secondary">
                  No rankings yet — play a few games to climb the board.
                </div>
              )}
            </div>
          </div>

          {/* Pagination/More (Editorial Style) */}
          <div className="mt-8 flex justify-center">
            <button className="font-body-md text-body-md text-ink-black border-b border-ink-black pb-1 hover:text-ink-blue hover:border-ink-blue transition-colors uppercase tracking-widest text-sm">
              Load More Entries
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-paper-white w-full border-t border-ink-black flex flex-col md:flex-row justify-between items-center px-margin-lg py-8">
        <div className="text-note-gray font-label-mono text-label-mono">
          © 2024 SUDOKU ARENA
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link to="/about" className="text-note-gray font-label-mono text-label-mono hover:text-ink-black transition-opacity duration-150 cursor-pointer">
            Terms
          </Link>
          <Link to="/about" className="text-note-gray font-label-mono text-label-mono hover:text-ink-black transition-opacity duration-150 cursor-pointer">
            Privacy
          </Link>
          <Link to="/about" className="text-note-gray font-label-mono text-label-mono hover:text-ink-black transition-opacity duration-150 cursor-pointer">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default LeaderboardPage;
