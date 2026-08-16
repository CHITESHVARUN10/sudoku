import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useHistory } from "../contexts/HistoryContext";
import Navbar from "../components/Navbar";

function formatTime(sec) {
  if (sec == null || isNaN(sec)) return "—";
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
}

// Counts up from 0 to `value` once the element is in view.
function CountUp({ value, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [text, setText] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => setText(Math.round(latest).toString()),
    });
    return () => controls.stop();
  }, [inView, value, mv]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

function StatisticsPage() {
  const { stats, games, fetchStats, fetchHistory, loading, error } = useHistory();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    Promise.all([fetchStats(), fetchHistory(1)])
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchStats, fetchHistory, loaded]);

  const difficultyBars = stats?.difficultyBreakdown
    ? ["easy", "medium", "hard", "expert"].map((key) => {
        const count = stats.difficultyBreakdown[key] || 0;
        const total = Object.values(stats.difficultyBreakdown || {}).reduce((a, b) => a + (b || 0), 0) || 1;
        return {
          label: key[0].toUpperCase() + key.slice(1),
          games: `${count} Games`,
          width: `${Math.max(3, Math.round((count / total) * 100))}%`,
        };
      })
    : [];

  // Build the solve-time trend chart from real data (last 7 points).
  const trendPoints = (stats?.solveTimeTrend || [])
    .slice(-7)
    .map((p) => ({ date: new Date(p.date), avgTimeSec: p.avgTimeSec || 0 }));
  const trendMax = Math.max(60, ...trendPoints.map((p) => p.avgTimeSec));
  const chartPoints = trendPoints.map((p, i) => {
    const x = trendPoints.length === 1 ? 0 : (i / (trendPoints.length - 1)) * 100;
    const y = 100 - (p.avgTimeSec / trendMax) * 90 - 5; // keep 5% headroom
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const dayLabel = (d) =>
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  const trendLabels = trendPoints.map((p) => dayLabel(p.date));

  return (
    <div className="antialiased min-h-screen flex flex-col">
      {/* Shared Navbar */}
      <Navbar />

      <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
        {/* Main Content */}
        <main className="flex-1 w-full p-margin-md md:p-margin-lg flex flex-col gap-margin-lg">
          <header>
            <h1 className="font-headline-md text-headline-md uppercase tracking-wider text-ink-black mb-4">
              YOUR STATS
            </h1>
            <hr className="border-t-hairline border-ink-black w-full" />
          </header>

          {loading && !stats && (
            <div className="font-body-md text-body-md text-secondary py-8">
              Loading stats…
            </div>
          )}
          {error && (
            <div className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2" role="alert">
              {error}
            </div>
          )}

          {/* Scoreboard */}
          <section className="grid grid-cols-2 md:grid-cols-4 border-b-hairline border-ink-black pb-margin-sm gap-y-8">
            <div className="flex flex-col border-r-hairline border-ink-black px-4 first:pl-0">
              <span className="font-body-md text-body-md text-note-gray uppercase tracking-widest mb-2">
                Games Played
              </span>
              <CountUp
                value={stats?.gamesPlayed ?? 0}
                className="font-grid-number text-grid-number text-ink-black"
              />
            </div>
            <div className="flex flex-col md:border-r-hairline border-ink-black px-4">
              <span className="font-body-md text-body-md text-note-gray uppercase tracking-widest mb-2">
                Win Rate
              </span>
              <CountUp
                value={stats?.winRate ?? 0}
                className="font-grid-number text-grid-number text-ink-black"
              />
            </div>
            <div className="flex flex-col border-r-hairline border-ink-black px-4 pl-0 md:pl-4">
              <span className="font-body-md text-body-md text-note-gray uppercase tracking-widest mb-2">
                Avg. Time
              </span>
              <span className="font-grid-number text-grid-number text-ink-black">
                {formatTime(stats?.avgTimeSec)}
              </span>
            </div>
            <div className="flex flex-col px-4">
              <span className="font-body-md text-body-md text-note-gray uppercase tracking-widest mb-2">
                Current Streak
              </span>
              <CountUp
                value={stats?.currentStreak ?? 0}
                className="font-grid-number text-grid-number text-ink-black"
              />
            </div>
          </section>

          {/* Charts & Breakdown */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-margin-lg">
            {/* Solve Time Chart */}
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm text-ink-black mb-6 uppercase border-b-hairline border-ink-black pb-2">
                Solve Time Trend
              </h2>
              <div className="relative w-full h-[300px] border-l-hairline border-b-hairline border-ink-black mt-4">
                {/* Faint Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  <div className="w-full h-hairline bg-note-gray opacity-20"></div>
                  <div className="w-full h-hairline bg-note-gray opacity-20"></div>
                  <div className="w-full h-hairline bg-note-gray opacity-20"></div>
                  <div className="w-full h-hairline bg-note-gray opacity-20"></div>
                  <div className="w-full h-hairline bg-note-gray opacity-20"></div>
                </div>
                {chartPoints.length > 1 ? (
                  <svg
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                  >
                    <motion.polyline
                      fill="none"
                      points={chartPoints.join(" ")}
                      stroke="#1A1A1A"
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    {trendPoints.map((p, i) => (
                      <motion.circle
                        key={i}
                        cx={Number(chartPoints[i].split(",")[0])}
                        cy={Number(chartPoints[i].split(",")[1])}
                        r="1.5"
                        fill="#2B3A55"
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + i * 0.08, duration: 0.3 }}
                      />
                    ))}
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-label-mono text-label-mono text-note-gray">
                    No solve data yet — finish a few games to see your trend.
                  </div>
                )}
                {/* Axis Labels */}
                <div className="absolute -left-10 top-0 font-label-mono text-label-mono text-[10px] text-note-gray">
                  {formatTime(Math.round(trendMax))}
                </div>
                <div className="absolute -left-10 bottom-0 font-label-mono text-label-mono text-[10px] text-note-gray">
                  0m
                </div>
                <div className="absolute left-0 -bottom-6 font-label-mono text-label-mono text-[10px] text-note-gray">
                  {trendLabels[0] || "—"}
                </div>
                <div className="absolute right-0 -bottom-6 font-label-mono text-label-mono text-[10px] text-note-gray">
                  {trendLabels[trendLabels.length - 1] || "—"}
                </div>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm text-ink-black mb-6 uppercase border-b-hairline border-ink-black pb-2">
                Difficulty Breakdown
              </h2>
              <div className="flex flex-col gap-6 mt-4">
                {difficultyBars.length ? (
                  difficultyBars.map((bar) => (
                    <div key={bar.label} className="flex flex-col gap-2">
                      <div className="flex justify-between font-label-mono text-label-mono text-[14px]">
                        <span>{bar.label}</span>
                        <span>{bar.games}</span>
                      </div>
                      <div className="w-full h-4 bg-surface-variant border-hairline border-ink-black relative">
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-ink-black"
                          initial={{ width: 0 }}
                          whileInView={{ width: bar.width }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        ></motion.div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="font-label-mono text-label-mono text-note-gray">
                    No games yet — play a round to see your breakdown.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Recent Games Table */}
          <section className="mt-8">
            <h2 className="font-headline-sm text-headline-sm text-ink-black mb-6 uppercase border-b-hairline border-ink-black pb-2">
              Recent Games
            </h2>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-label-mono text-label-mono text-[14px] border-collapse">
                <thead>
                  <tr className="border-b-hairline border-ink-black text-note-gray">
                    <th className="py-4 px-2 font-normal">Date</th>
                    <th className="py-4 px-2 font-normal">Mode</th>
                    <th className="py-4 px-2 font-normal">Difficulty</th>
                    <th className="py-4 px-2 font-normal">Opponent/Solo</th>
                    <th className="py-4 px-2 font-normal">Result</th>
                    <th className="py-4 px-2 font-normal text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {games.length ? (
                    games.map((game, i) => (
                      <motion.tr
                        key={game._id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.3 }}
                        className="border-b-hairline border-ink-black hover:bg-surface-variant transition-colors duration-150"
                      >
                        <td className="py-4 px-2">
                          <Link
                            to={`/results/${game._id}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {formatDate(game.createdAt)}
                          </Link>
                        </td>
                        <td className="py-4 px-2">{game.mode}</td>
                        <td className="py-4 px-2">{game.difficulty}</td>
                        <td className="py-4 px-2">{game.opponentName || "—"}</td>
                        <td className="py-4 px-2">{game.result}</td>
                        <td className="py-4 px-2 text-right">{formatTime(game.timeSec)}</td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 px-2 text-secondary">
                        No games yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-paper-white w-full border-t border-ink-black mt-auto">
        <div className="w-full py-margin-md px-margin-lg border-t border-ink-black flex justify-between items-center max-w-[1440px] mx-auto">
          <span className="font-label-mono text-label-mono text-note-gray">
            © 2024 Editorial Sudoku. All Rights Reserved.
          </span>
          <div className="flex gap-6 font-label-mono text-label-mono text-[14px]">
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

export default StatisticsPage;
