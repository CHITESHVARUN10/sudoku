import { useState } from "react";
import { Link } from "react-router-dom";

// 81 cells matching the HTML; user-input marks cells in ink-blue
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

const MOVE_HISTORY = [
  { num: 1, p1: "R1C3 → 8", p2: "R2C2 → 4" },
  { num: 2, p1: "R3C1 → 2", p2: "R5C2 → 7" },
  { num: 3, p1: "R8C2 → 3", p2: "R9C1 → 1" },
  { num: 4, p1: "R4C2 → 5", p2: null },
];

function MultiplayerGameBoardPage() {
  const [selected, setSelected] = useState(32); // matching HTML: cell 33 (0-indexed 32) is selected

  return (
    <>
      {/* Top Navigation Shell */}
      <header className="flex justify-between items-center w-full px-margin-lg h-cell-size bg-paper-white border-b border-ink-black sticky top-0 z-40 hidden md:flex">
        <div className="flex items-center gap-margin-md">
          <span className="font-headline-md text-headline-md font-bold uppercase tracking-tighter text-ink-black">
            SUDOKU EDITORIAL
          </span>
        </div>
        <nav className="flex gap-margin-md h-full">
          <Link
            to="/multiplayer"
            className="h-full flex items-center px-4 font-label-mono text-label-mono text-secondary hover:bg-ink-blue hover:text-paper-white transition-colors duration-150"
          >
            Lobby
          </Link>
          <Link
            to="/multiplayer"
            className="h-full flex items-center px-4 font-label-mono text-label-mono text-ink-blue border-b-2 border-ink-blue opacity-80 scale-95 transition-colors duration-150"
          >
            Multiplayer
          </Link>
          <Link
            to="/archive"
            className="h-full flex items-center px-4 font-label-mono text-label-mono text-secondary hover:bg-ink-blue hover:text-paper-white transition-colors duration-150"
          >
            Archive
          </Link>
        </nav>
        <div className="flex gap-4">
          <button className="w-10 h-10 flex items-center justify-center border border-transparent hover:border-ink-black rounded-none transition-colors">
            <span className="material-symbols-outlined text-ink-black">settings</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center border border-transparent hover:border-ink-black rounded-none transition-colors">
            <span className="material-symbols-outlined text-ink-black">account_circle</span>
          </button>
        </div>
      </header>

      {/* Side Navigation Shell (Desktop) */}
      <div className="hidden md:flex flex-col h-full w-64 fixed left-0 top-cell-size border-r border-ink-black pt-margin-lg bg-paper-white z-30">
        <div className="px-6 mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border border-ink-black overflow-hidden mb-4">
            <div className="w-full h-full flex items-center justify-center bg-surface-container font-headline-sm text-headline-sm text-ink-black">
              GM
            </div>
          </div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-ink-black">
            Grandmaster
          </h3>
          <p className="font-label-mono text-[14px] text-secondary mt-1">
            Elo: 2450
          </p>
        </div>
        <nav className="flex-1 flex flex-col w-full">
          <Link
            to="/practice/board"
            className="w-full px-6 py-4 flex items-center gap-4 text-ink-black hover:bg-surface-container-highest transition-all duration-200 ease-in-out font-label-mono text-[16px]"
          >
            <span className="material-symbols-outlined">today</span>
            Daily Puzzle
          </Link>
          <Link
            to="/multiplayer"
            className="w-full px-6 py-4 flex items-center gap-4 bg-ink-blue text-paper-white font-bold font-label-mono text-[16px] transition-all duration-200 ease-in-out"
          >
            <span className="material-symbols-outlined">group</span>
            Multiplayer
          </Link>
          <Link
            to="/stats"
            className="w-full px-6 py-4 flex items-center gap-4 text-ink-black hover:bg-surface-container-highest transition-all duration-200 ease-in-out font-label-mono text-[16px]"
          >
            <span className="material-symbols-outlined">analytics</span>
            Stats
          </Link>
          <Link
            to="/archive"
            className="w-full px-6 py-4 flex items-center gap-4 text-ink-black hover:bg-surface-container-highest transition-all duration-200 ease-in-out font-label-mono text-[16px]"
          >
            <span className="material-symbols-outlined">history</span>
            History
          </Link>
        </nav>
        <div className="p-6 border-t border-ink-black mt-auto">
          <Link
            to="/multiplayer"
            className="w-full py-3 border border-ink-black bg-paper-white text-ink-black hover:bg-ink-black hover:text-paper-white font-label-mono text-[14px] uppercase tracking-wider transition-colors duration-150 flex items-center justify-center"
          >
            New Match
          </Link>
        </div>
      </div>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 w-full max-w-7xl mx-auto px-4 md:px-margin-lg py-8 md:py-12 flex flex-col">
        {/* Match Header */}
        <div className="w-full border-b border-ink-black pb-4 mb-8 flex justify-between items-end">
          <div className="flex items-center gap-3">
            <span className="font-headline-sm text-headline-sm font-bold bg-ink-black text-paper-white px-3 py-1">
              Player 1
            </span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="font-label-mono text-[12px] uppercase tracking-widest text-secondary mb-1">
              Difficulty
            </span>
            <span className="font-headline-md text-[24px] font-bold">HARD</span>
            <div className="h-4 w-px bg-ink-black my-2"></div>
            <span className="font-label-mono text-[14px] uppercase tracking-widest text-ink-blue font-bold">
              TURN 14
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-headline-sm text-headline-sm font-bold text-ink-black px-3 py-1 border-b border-transparent">
              Player 2
            </span>
          </div>
        </div>

        {/* Game Area Layout */}
        <div className="flex flex-col lg:flex-row gap-margin-lg items-start justify-center">
          {/* The Board */}
          <div className="mp-sudoku-grid mx-auto lg:mx-0">
            {INITIAL_GRID.map((value, index) => (
              <div
                key={index}
                className={`mp-sudoku-cell ${
                  selected === index ? "selected" : ""
                }`}
                onClick={() => setSelected(index)}
              >
                {value}
              </div>
            ))}
          </div>

          {/* Controls & Log Sidebar */}
          <div className="flex flex-col gap-margin-md w-full max-w-sm mx-auto lg:mx-0">
            {/* Numpad */}
            <div className="grid grid-cols-3 gap-0 w-fit border border-ink-black">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num, i) => (
                <button
                  key={num}
                  className={`numpad-btn ${i < 6 ? "border-b" : ""} ${
                    i % 3 !== 2 ? "border-r" : "border-transparent"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Tool Actions */}
            <div className="flex gap-4 border-b border-ink-black pb-4">
              <button className="flex items-center gap-2 text-ink-black hover:text-ink-blue font-label-mono text-[14px]">
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Notes
              </button>
              <button className="flex items-center gap-2 text-ink-black hover:text-ink-blue font-label-mono text-[14px]">
                <span className="material-symbols-outlined text-[20px]">undo</span>
                Undo
              </button>
              <button className="flex items-center gap-2 text-ink-black hover:text-ink-blue font-label-mono text-[14px]">
                <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                Hint
              </button>
            </div>

            {/* Move History Log */}
            <div className="flex flex-col border border-ink-black h-64 bg-paper-white">
              <div className="grid grid-cols-2 border-b border-ink-black font-label-mono text-[12px] uppercase tracking-wider bg-surface-container-highest">
                <div className="p-2 border-r border-ink-black text-center font-bold">
                  Player 1
                </div>
                <div className="p-2 text-center">Player 2</div>
              </div>
              <div className="move-history flex-1 overflow-y-auto p-0 m-0 font-label-mono text-[14px]">
                {MOVE_HISTORY.map((entry) => (
                  <div
                    key={entry.num}
                    className="grid grid-cols-[30px_1fr_1fr] border-b border-ink-black/20 hover:bg-surface-container-low"
                  >
                    <div className="p-2 text-secondary text-right text-[12px]">
                      {entry.num}.
                    </div>
                    <div className="p-2 border-r border-ink-black/20 text-center">
                      {entry.p1}
                    </div>
                    <div
                      className={`p-2 text-center ${
                        entry.p2 === "..." ? "text-ink-blue" : ""
                      }`}
                    >
                      {entry.p2}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Shell (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-stretch h-16 bg-paper-white border-t-2 border-ink-black z-50 md:hidden">
        <Link
          to="/multiplayer"
          className="flex flex-col items-center justify-center py-2 h-full w-full text-ink-black hover:bg-ink-blue/20 transition-colors"
        >
          <span className="material-symbols-outlined">grid_on</span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest mt-1">
            Play
          </span>
        </Link>
        <Link
          to="/multiplayer"
          className="flex flex-col items-center justify-center py-2 h-full w-full bg-ink-black text-paper-white transition-colors"
        >
          <span className="material-symbols-outlined">forum</span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest mt-1">
            Social
          </span>
        </Link>
        <Link
          to="/archive"
          className="flex flex-col items-center justify-center py-2 h-full w-full text-ink-black hover:bg-ink-blue/20 transition-colors"
        >
          <span className="material-symbols-outlined">list_alt</span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest mt-1">
            Log
          </span>
        </Link>
        <Link
          to="/settings"
          className="flex flex-col items-center justify-center py-2 h-full w-full text-ink-black hover:bg-ink-blue/20 transition-colors"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-mono text-[10px] uppercase tracking-widest mt-1">
            Me
          </span>
        </Link>
      </nav>
    </>
  );
}

export default MultiplayerGameBoardPage;
