import { Link } from "react-router-dom";

function DailyArchivePage() {
  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col font-body-md antialiased">
      {/* TopNavBar */}
      <header className="w-full border-b border-ink-black bg-paper-white">
        <div className="flex justify-between items-center w-full px-margin-lg h-16 max-w-[1440px] mx-auto">
          {/* Brand */}
          <Link
            to="/"
            className="font-headline-md text-headline-md font-bold text-ink-black uppercase tracking-tighter"
          >
            SUDOKU
          </Link>
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 font-headline-sm text-headline-sm uppercase tracking-wider h-full">
            <Link
              to="/archive"
              className="text-note-gray hover:text-ink-black transition-colors duration-150 h-full flex items-center"
            >
              DAILY
            </Link>
            <span className="text-ink-black border-b-2 border-ink-black h-full flex items-center pt-0.5">
              ARCHIVE
            </span>
            <Link
              to="/stats"
              className="text-note-gray hover:text-ink-black transition-colors duration-150 h-full flex items-center"
            >
              STATS
            </Link>
          </nav>
          {/* Trailing Actions */}
          <div className="flex items-center space-x-6">
            <Link
              to="/multiplayer"
              className="font-headline-sm text-headline-sm uppercase tracking-wider border border-ink-black px-4 py-1 hover:bg-surface-variant transition-colors duration-150"
            >
              PLAY NOW
            </Link>
            <div className="flex space-x-4 text-ink-black">
              <span className="material-symbols-outlined cursor-pointer hover:bg-surface-variant transition-colors duration-150 rounded-full p-1">
                settings
              </span>
              <span className="material-symbols-outlined cursor-pointer hover:bg-surface-variant transition-colors duration-150 rounded-full p-1">
                help
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-[1024px] mx-auto px-margin-lg pt-margin-lg pb-24">
        {/* Header & Filters */}
        <div className="mb-12">
          <h1 className="font-headline-md text-headline-md font-bold uppercase tracking-[0.1em] text-ink-black pb-4 border-b border-ink-black mb-4">
            GAME ARCHIVE
          </h1>
          {/* Filter Row */}
          <div className="flex items-center font-label-mono text-label-mono text-note-gray uppercase">
            <button className="text-ink-black underline underline-offset-4 decoration-[1px] hover:text-ink-black pr-6">
              All
            </button>
            <div className="w-px h-4 bg-ink-black mx-2"></div>
            <button className="hover:text-ink-black px-6">Multiplayer</button>
            <div className="w-px h-4 bg-ink-black mx-2"></div>
            <button className="hover:text-ink-black pl-6">Solo</button>
          </div>
        </div>

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

          {/* Ledger Row: Collapsed */}
          <div className="group grid grid-cols-12 gap-4 py-6 border-b border-ink-black hover:bg-surface-container-low transition-colors duration-150 cursor-pointer items-center text-body-md">
            <div className="col-span-2 font-label-mono text-label-mono text-ink-black">24.10.26</div>
            <div className="col-span-2">Solo</div>
            <div className="col-span-2">Expert</div>
            <div className="col-span-3 text-note-gray">—</div>
            <div className="col-span-2">Solved</div>
            <div className="col-span-1 text-right font-label-mono text-label-mono">14:22</div>
          </div>

          {/* Ledger Row: Expanded (Inline detail) */}
          <div className="border-b border-ink-black bg-surface-container-low">
            {/* Row Header (Active state) */}
            <div className="grid grid-cols-12 gap-4 py-6 px-4 cursor-pointer items-center text-body-md border-b border-ink-black/20">
              <div className="col-span-2 font-label-mono text-label-mono text-ink-black">24.10.25</div>
              <div className="col-span-2">Multiplayer</div>
              <div className="col-span-2">Hard</div>
              <div className="col-span-3">@logic_master</div>
              <div className="col-span-2 text-error-red">Lost</div>
              <div className="col-span-1 text-right font-label-mono text-label-mono">08:15</div>
            </div>
            {/* Expanded Detail Area (Mini Grid) */}
            <div className="p-8 flex items-start gap-12">
              {/* Miniature Board Representation */}
              <div className="w-[180px] h-[180px] border border-ink-black grid grid-cols-3 grid-rows-3 bg-paper-white shrink-0">
                {/* Subgrid 1 */}
                <div className="border-r border-b border-ink-black grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-ink-black/30 flex items-center justify-center font-grid-number text-[14px]">5</div>
                  <div className="border-r border-b border-ink-black/30 flex items-center justify-center font-grid-number text-[14px]">3</div>
                  <div className="border-b border-ink-black/30 flex items-center justify-center bg-ink-blue/10"></div>
                  <div className="border-r border-b border-ink-black/30 flex items-center justify-center font-grid-number text-[14px]">6</div>
                  <div className="border-r border-b border-ink-black/30 flex items-center justify-center bg-ink-blue/10"></div>
                  <div className="border-b border-ink-black/30 flex items-center justify-center font-grid-number text-[14px]">9</div>
                  <div className="border-r border-ink-black/30 flex items-center justify-center bg-ink-blue/10"></div>
                  <div className="border-r border-ink-black/30 flex items-center justify-center font-grid-number text-[14px]">9</div>
                  <div className="flex items-center justify-center font-grid-number text-[14px]">8</div>
                </div>
                {/* Empty visual representation blocks for the rest */}
                <div className="border-r border-b border-ink-black bg-surface-variant/30"></div>
                <div className="border-b border-ink-black bg-surface-variant/30"></div>
                <div className="border-r border-b border-ink-black bg-surface-variant/30"></div>
                <div className="border-r border-b border-ink-black bg-surface-variant/30"></div>
                <div className="border-b border-ink-black bg-surface-variant/30"></div>
                <div className="border-r border-ink-black bg-surface-variant/30"></div>
                <div className="border-r border-ink-black bg-surface-variant/30"></div>
                <div className="bg-surface-variant/30"></div>
              </div>
              {/* Match Details */}
              <div className="flex flex-col space-y-4 max-w-sm">
                <div className="font-headline-sm text-headline-sm">Match Analysis</div>
                <p className="font-body-md text-note-gray leading-relaxed">
                  Opponent completed the grid 45 seconds faster. Key stalling
                  point: Box 3 row column interaction.
                </p>
                <button className="self-start mt-2 border border-ink-black px-4 py-2 font-label-mono text-[14px] uppercase hover:bg-ink-black hover:text-paper-white transition-colors">
                  Review Board
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Row: Collapsed */}
          <div className="group grid grid-cols-12 gap-4 py-6 border-b border-ink-black hover:bg-surface-container-low transition-colors duration-150 cursor-pointer items-center text-body-md">
            <div className="col-span-2 font-label-mono text-label-mono text-ink-black">24.10.24</div>
            <div className="col-span-2">Solo</div>
            <div className="col-span-2">Medium</div>
            <div className="col-span-3 text-note-gray">—</div>
            <div className="col-span-2">Solved</div>
            <div className="col-span-1 text-right font-label-mono text-label-mono">06:40</div>
          </div>

          {/* Ledger Row: Collapsed */}
          <div className="group grid grid-cols-12 gap-4 py-6 border-b border-ink-black hover:bg-surface-container-low transition-colors duration-150 cursor-pointer items-center text-body-md">
            <div className="col-span-2 font-label-mono text-label-mono text-ink-black">24.10.23</div>
            <div className="col-span-2">Daily</div>
            <div className="col-span-2">Hard</div>
            <div className="col-span-3 text-note-gray">—</div>
            <div className="col-span-2">Abandoned</div>
            <div className="col-span-1 text-right font-label-mono text-label-mono">22:00</div>
          </div>

          {/* Empty State Demonstration */}
          <div className="mt-24 text-center">
            <p className="font-headline-sm text-headline-sm text-note-gray">
              No games yet — start your first puzzle.
            </p>
          </div>
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
            <Link to="/about" className="text-note-gray hover:text-ink-black transition-colors duration-150">
              Accessibility
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DailyArchivePage;
