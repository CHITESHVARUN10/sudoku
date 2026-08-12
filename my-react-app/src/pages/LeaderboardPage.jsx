import { Link } from "react-router-dom";

const RANKED_ROWS = [
  { rank: 1, name: "Ariadne Weaver", winRate: "98.2%", games: "1,402", streak: 42, top3: true },
  { rank: 2, name: "Julian Vance", winRate: "97.5%", games: "1,380", streak: 15, top3: true },
  { rank: 3, name: "Elias Thorne", winRate: "96.8%", games: "1,205", streak: 28, top3: true },
  { rank: 4, name: "Clara Oswald", winRate: "95.1%", games: "980", streak: 7, top3: false },
  { rank: 5, name: "Magnus Reed", winRate: "94.3%", games: "955", streak: 12, top3: false },
];

function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col font-body-md text-body-md bg-paper-white text-ink-black">
      {/* TopNavBar */}
      <nav className="bg-paper-white w-full h-16 border-b border-ink-black flex justify-between items-center px-margin-lg">
        <Link
          to="/"
          className="font-display-lg text-display-lg uppercase tracking-tighter text-ink-black cursor-pointer"
        >
          SUDOKU ARENA
        </Link>
        <div className="hidden md:flex gap-8">
          <Link
            to="/multiplayer"
            className="text-secondary hover:text-primary-container transition-colors font-body-md text-body-md cursor-pointer"
          >
            Play
          </Link>
          <Link
            to="/how-to-play"
            className="text-secondary hover:text-primary-container transition-colors font-body-md text-body-md cursor-pointer"
          >
            Learn
          </Link>
        </div>
        <div className="flex items-center">
          <span className="material-symbols-outlined text-ink-black cursor-pointer text-[24px]">
            account_circle
          </span>
        </div>
      </nav>

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
              <button className="text-ink-black border-b-[2px] border-ink-blue pb-1 font-medium transition-colors">
                All Time
              </button>
              <span className="w-hairline h-4 bg-ink-black opacity-20"></span>
              <button className="text-secondary hover:text-ink-black transition-colors pb-1">
                This Week
              </button>
              <span className="w-hairline h-4 bg-ink-black opacity-20"></span>
              <button className="text-secondary hover:text-ink-black transition-colors pb-1">
                This Month
              </button>
            </div>
          </header>

          {/* Leaderboard Table */}
          <div className="w-full border-t border-ink-black">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 py-4 border-b border-ink-black font-body-md text-body-md uppercase tracking-wider text-secondary">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5">Name</div>
              <div className="col-span-2 text-right">Win Rate</div>
              <div className="col-span-2 text-right">Games Played</div>
              <div className="col-span-2 text-right">Current Streak</div>
            </div>

            {/* Table Body */}
            <div className="flex flex-col">
              {RANKED_ROWS.map((row) => (
                <div
                  key={row.rank}
                  className="grid grid-cols-12 gap-4 py-4 border-b border-ink-black/20 hover:bg-ink-blue/5 transition-colors"
                >
                  <div
                    className={`col-span-1 text-center font-label-mono text-label-mono ${
                      row.top3 ? "text-ink-blue font-bold" : ""
                    }`}
                  >
                    {row.rank}
                  </div>
                  <div
                    className={`col-span-5 flex items-center ${
                      row.top3
                        ? "font-headline-sm text-headline-sm"
                        : "font-body-lg text-body-lg"
                    }`}
                  >
                    {row.name}
                  </div>
                  <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                    {row.winRate}
                  </div>
                  <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                    {row.games}
                  </div>
                  <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                    {row.streak}
                  </div>
                </div>
              ))}

              {/* Current User (Rank 42) */}
              <div className="grid grid-cols-12 gap-4 py-4 border-b border-ink-black/20 border-l-[3px] border-l-ink-blue pl-[13px] -ml-4 hover:bg-ink-blue/5 transition-colors">
                <div className="col-span-1 text-center font-label-mono text-label-mono text-ink-black font-medium">
                  42
                </div>
                <div className="col-span-5 font-body-lg text-body-lg flex items-center font-medium">
                  You
                </div>
                <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                  82.1%
                </div>
                <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                  145
                </div>
                <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                  3
                </div>
              </div>

              {/* Rank 43 */}
              <div className="grid grid-cols-12 gap-4 py-4 border-b border-ink-black/20 hover:bg-ink-blue/5 transition-colors">
                <div className="col-span-1 text-center font-label-mono text-label-mono">43</div>
                <div className="col-span-5 font-body-lg text-body-lg flex items-center">
                  Sarah Jenkins
                </div>
                <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                  81.9%
                </div>
                <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                  210
                </div>
                <div className="col-span-2 text-right font-label-mono text-label-mono flex items-center justify-end">
                  0
                </div>
              </div>
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
