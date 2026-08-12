import { Link } from "react-router-dom";

const DIFFICULTY_BARS = [
  { label: "Easy", games: "450 Games", width: "35%" },
  { label: "Medium", games: "520 Games", width: "42%" },
  { label: "Hard", games: "210 Games", width: "18%" },
  { label: "Expert", games: "68 Games", width: "5%" },
];

const RECENT_GAMES = [
  { date: "2024-10-24", mode: "Daily", difficulty: "Medium", opponent: "Solo", result: "Win", time: "03:45" },
  { date: "2024-10-23", mode: "Multiplayer", difficulty: "Hard", opponent: "LogicMaster99", result: "Loss", time: "08:12" },
  { date: "2024-10-23", mode: "Archive", difficulty: "Expert", opponent: "Solo", result: "Win", time: "14:30" },
  { date: "2024-10-22", mode: "Daily", difficulty: "Easy", opponent: "Solo", result: "Win", time: "01:55" },
];

function StatisticsPage() {
  return (
    <div className="antialiased min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-paper-white w-full border-b border-ink-black z-50">
        <div className="flex justify-between items-center w-full px-margin-lg h-16 max-w-[1440px] mx-auto">
          <Link
            to="/"
            className="font-headline-md text-headline-md font-bold text-ink-black uppercase tracking-tighter cursor-pointer"
          >
            SUDOKU
          </Link>
          <div className="hidden md:flex items-center gap-8 font-headline-sm text-headline-sm uppercase tracking-wider">
            <Link
              to="/archive"
              className="text-note-gray hover:text-ink-black hover:bg-surface-variant transition-colors duration-150 py-2 px-3"
            >
              DAILY
            </Link>
            <Link
              to="/archive"
              className="text-note-gray hover:text-ink-black hover:bg-surface-variant transition-colors duration-150 py-2 px-3"
            >
              ARCHIVE
            </Link>
            <span className="text-ink-black border-b-2 border-ink-black pb-1 px-3 opacity-80">
              STATS
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/multiplayer"
              className="font-label-mono text-label-mono border border-ink-black text-ink-black bg-paper-white hover:bg-ink-black hover:text-paper-white px-4 py-2 uppercase transition-colors duration-150"
            >
              PLAY NOW
            </Link>
            <div className="flex gap-4">
              <span className="material-symbols-outlined cursor-pointer hover:text-ink-blue transition-colors duration-150">
                settings
              </span>
              <span className="material-symbols-outlined cursor-pointer hover:text-ink-blue transition-colors duration-150">
                help
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
        {/* Main Content */}
        <main className="flex-1 w-full p-margin-md md:p-margin-lg flex flex-col gap-margin-lg">
          <header>
            <h1 className="font-headline-md text-headline-md uppercase tracking-wider text-ink-black mb-4">
              YOUR STATS
            </h1>
            <hr className="border-t-hairline border-ink-black w-full" />
          </header>

          {/* Scoreboard */}
          <section className="grid grid-cols-2 md:grid-cols-4 border-b-hairline border-ink-black pb-margin-sm gap-y-8">
            <div className="flex flex-col border-r-hairline border-ink-black px-4 first:pl-0">
              <span className="font-body-md text-body-md text-note-gray uppercase tracking-widest mb-2">
                Games Played
              </span>
              <span className="font-grid-number text-grid-number text-ink-black">
                1,248
              </span>
            </div>
            <div className="flex flex-col md:border-r-hairline border-ink-black px-4">
              <span className="font-body-md text-body-md text-note-gray uppercase tracking-widest mb-2">
                Win Rate
              </span>
              <span className="font-grid-number text-grid-number text-ink-black">
                94.2%
              </span>
            </div>
            <div className="flex flex-col border-r-hairline border-ink-black px-4 pl-0 md:pl-4">
              <span className="font-body-md text-body-md text-note-gray uppercase tracking-widest mb-2">
                Avg. Time
              </span>
              <span className="font-grid-number text-grid-number text-ink-black">
                04:12
              </span>
            </div>
            <div className="flex flex-col px-4">
              <span className="font-body-md text-body-md text-note-gray uppercase tracking-widest mb-2">
                Current Streak
              </span>
              <span className="font-grid-number text-grid-number text-ink-black">
                14 Days
              </span>
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
                {/* Mock Line Chart SVG */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <polyline
                    fill="none"
                    points="0,80 20,60 40,70 60,30 80,45 100,20"
                    stroke="#1A1A1A"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                {/* Axis Labels */}
                <div className="absolute -left-10 top-0 font-label-mono text-label-mono text-[10px] text-note-gray">
                  10m
                </div>
                <div className="absolute -left-10 bottom-0 font-label-mono text-label-mono text-[10px] text-note-gray">
                  0m
                </div>
                <div className="absolute left-0 -bottom-6 font-label-mono text-label-mono text-[10px] text-note-gray">
                  Mon
                </div>
                <div className="absolute right-0 -bottom-6 font-label-mono text-label-mono text-[10px] text-note-gray">
                  Sun
                </div>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm text-ink-black mb-6 uppercase border-b-hairline border-ink-black pb-2">
                Difficulty Breakdown
              </h2>
              <div className="flex flex-col gap-6 mt-4">
                {DIFFICULTY_BARS.map((bar) => (
                  <div key={bar.label} className="flex flex-col gap-2">
                    <div className="flex justify-between font-label-mono text-label-mono text-[14px]">
                      <span>{bar.label}</span>
                      <span>{bar.games}</span>
                    </div>
                    <div className="w-full h-4 bg-surface-variant border-hairline border-ink-black relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-ink-black"
                        style={{ width: bar.width }}
                      ></div>
                    </div>
                  </div>
                ))}
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
                  {RECENT_GAMES.map((game) => (
                    <tr
                      key={game.date + game.opponent}
                      className="border-b-hairline border-ink-black hover:bg-surface-variant transition-colors duration-150"
                    >
                      <td className="py-4 px-2">{game.date}</td>
                      <td className="py-4 px-2">{game.mode}</td>
                      <td className="py-4 px-2">{game.difficulty}</td>
                      <td className="py-4 px-2">{game.opponent}</td>
                      <td className="py-4 px-2">{game.result}</td>
                      <td className="py-4 px-2 text-right">{game.time}</td>
                    </tr>
                  ))}
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
            <Link to="/about" className="text-note-gray hover:text-ink-black transition-colors duration-150">
              Accessibility
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default StatisticsPage;
