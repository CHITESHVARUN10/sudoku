import { useState } from "react";
import { Link } from "react-router-dom";

// 81 cells matching the HTML: value or null; fixed marks given numbers
const INITIAL_GRID = [
  "5", "3", null, "7", null, null, null, null, null,
  "6", null, null, null, "1", "9", "5", null, null,
  null, "9", "8", null, null, null, null, "6", null,
  "8", null, null, "6", null, null, null, null, "3",
  "4", null, "8", null, "3", null, "1", null, "6",
  "7", null, null, null, null, "2", null, null, "6",
  null, "6", null, null, null, null, "2", "8", null,
  null, null, "4", "1", "9", null, null, null, "5",
  null, null, null, null, null, "8", null, "7", "9",
];

function SinglePlayerGameBoardPage() {
  const [selected, setSelected] = useState(44); // matching HTML: cell 45 (0-indexed 44) is selected

  return (
    <>
      {/* Top App Bar */}
      <header className="flex justify-between items-center w-full px-margin-lg h-16 bg-paper-white border-b border-ink-black sticky top-0 z-40 hidden md:flex">
        <div className="font-headline-md text-headline-md font-bold tracking-tighter text-ink-black">
          SUDOKU
        </div>
        <nav className="flex space-x-margin-md">
          <Link
            to="/practice"
            className="font-label-mono text-label-mono text-ink-blue font-bold border-b-2 border-ink-blue hover:bg-surface-container transition-colors py-1"
          >
            New Game
          </Link>
          <Link
            to="/practice"
            className="font-label-mono text-label-mono text-secondary hover:bg-surface-container transition-colors py-1"
          >
            Challenges
          </Link>
          <Link
            to="/archive"
            className="font-label-mono text-label-mono text-secondary hover:bg-surface-container transition-colors py-1"
          >
            Archive
          </Link>
        </nav>
        <div className="flex space-x-4">
          <button className="hover:bg-surface-container p-2 transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="hover:bg-surface-container p-2 transition-colors">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation (Desktop) */}
        <aside className="hidden md:flex flex-col h-full w-64 bg-paper-white border-r border-ink-black p-margin-sm space-y-grid-unit">
          <div className="mb-margin-md px-4 pt-4">
            <h2 className="font-headline-sm text-headline-sm font-bold text-ink-black">
              Logic Master
            </h2>
            <p className="font-body-md text-body-md text-secondary">
              Expert Level
            </p>
          </div>
          <nav className="flex flex-col space-y-1">
            <Link
              to="/practice"
              className="flex items-center space-x-4 px-4 py-3 bg-ink-blue text-paper-white font-bold transition-all duration-150 ease-in-out"
            >
              <span className="material-symbols-outlined">add_box</span>
              <span className="font-label-mono text-label-mono">New Game</span>
            </Link>
            <Link
              to="/practice/board"
              className="flex items-center space-x-4 px-4 py-3 text-ink-black hover:bg-surface-container-high transition-all duration-150 ease-in-out"
            >
              <span className="material-symbols-outlined">calendar_today</span>
              <span className="font-label-mono text-label-mono">Daily</span>
            </Link>
            <Link
              to="/archive"
              className="flex items-center space-x-4 px-4 py-3 text-ink-black hover:bg-surface-container-high transition-all duration-150 ease-in-out"
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span className="font-label-mono text-label-mono">Archive</span>
            </Link>
            <Link
              to="/stats"
              className="flex items-center space-x-4 px-4 py-3 text-ink-black hover:bg-surface-container-high transition-all duration-150 ease-in-out"
            >
              <span className="material-symbols-outlined">leaderboard</span>
              <span className="font-label-mono text-label-mono">Statistics</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-margin-lg flex justify-center items-start">
          <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-margin-lg">
            {/* Game Board Column */}
            <div className="flex-1 flex flex-col max-w-xl mx-auto lg:mx-0 w-full">
              {/* Game Info Header */}
              <div className="flex justify-between items-end mb-4 border-b border-ink-black pb-2">
                <div className="font-headline-sm text-headline-sm tracking-wider uppercase">
                  EXPERT
                </div>
                <div className="font-grid-number text-grid-number">12:45</div>
                <div className="font-body-lg text-body-lg">0/3</div>
              </div>

              {/* Sudoku Grid */}
              <div className="sudoku-grid aspect-square w-full font-grid-number text-grid-number mb-margin-md">
                {INITIAL_GRID.map((value, index) => (
                  <div
                    key={index}
                    className={`sudoku-cell ${value ? "fixed" : ""} ${
                      selected === index ? "selected" : ""
                    }`}
                    onClick={() => setSelected(index)}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls Column */}
            <div className="flex flex-col w-full lg:w-64 space-y-margin-md pt-10">
              {/* Action Links */}
              <div className="flex flex-row lg:flex-col justify-around lg:justify-start gap-4">
                <button className="font-body-lg text-body-lg text-ink-black hover:border-b hover:border-ink-black pb-0.5 self-start transition-all">
                  Undo
                </button>
                <button className="font-body-lg text-body-lg text-ink-black hover:border-b hover:border-ink-black pb-0.5 self-start transition-all">
                  Hint
                </button>
              </div>
              {/* Notes Toggle */}
              <div className="flex items-center justify-between border-y border-ink-black py-4">
                <span className="font-headline-sm text-headline-sm">Notes</span>
                <button className="font-label-mono text-label-mono hover:text-ink-blue transition-colors">
                  [OFF]
                </button>
              </div>
              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-px bg-ink-black border border-ink-black">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    className="bg-paper-white h-16 flex items-center justify-center font-grid-number text-grid-number hover:bg-ink-black hover:text-paper-white transition-colors"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 bg-paper-white border-t border-ink-black z-50">
        <Link
          to="/practice/board"
          className="flex flex-col items-center justify-center text-ink-blue font-bold active:bg-surface-container-high scale-95 duration-75 p-2"
        >
          <span className="material-symbols-outlined">grid_on</span>
          <span className="font-grid-notes text-grid-notes mt-1">Play</span>
        </Link>
        <Link
          to="/practice/board"
          className="flex flex-col items-center justify-center text-secondary active:bg-surface-container-high scale-95 duration-75 p-2"
        >
          <span className="material-symbols-outlined">event</span>
          <span className="font-grid-notes text-grid-notes mt-1">Daily</span>
        </Link>
        <Link
          to="/stats"
          className="flex flex-col items-center justify-center text-secondary active:bg-surface-container-high scale-95 duration-75 p-2"
        >
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="font-grid-notes text-grid-notes mt-1">Stats</span>
        </Link>
        <Link
          to="/settings"
          className="flex flex-col items-center justify-center text-secondary active:bg-surface-container-high scale-95 duration-75 p-2"
        >
          <span className="material-symbols-outlined">account_circle</span>
          <span className="font-grid-notes text-grid-notes mt-1">Profile</span>
        </Link>
      </nav>
    </>
  );
}

export default SinglePlayerGameBoardPage;
