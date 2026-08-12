import { Link } from "react-router-dom";

function MultiplayerSetupModalPage() {
  return (
    <div className="h-full bg-paper-white bg-grid-pattern font-body-md text-body-md text-ink-black flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* Top Navigation (Context) */}
      <nav className="absolute top-0 w-full border-b border-ink-black bg-paper-white z-10 flex justify-between items-center px-margin-lg h-16 max-w-[1440px] mx-auto border-b-hairline border-surface-variant">
        <div className="font-headline-md text-headline-md font-bold text-ink-black uppercase tracking-tighter">
          SUDOKU
        </div>
        <div className="hidden md:flex space-x-margin-md font-headline-sm text-headline-sm uppercase tracking-wider">
          <Link
            to="/archive"
            className="text-note-gray hover:text-ink-black transition-colors duration-150"
          >
            DAILY
          </Link>
          <Link
            to="/archive"
            className="text-note-gray hover:text-ink-black transition-colors duration-150"
          >
            ARCHIVE
          </Link>
          <Link
            to="/stats"
            className="text-note-gray hover:text-ink-black transition-colors duration-150"
          >
            STATS
          </Link>
        </div>
        <div className="flex items-center space-x-margin-sm">
          <Link
            to="/multiplayer/board"
            className="font-headline-sm text-headline-sm uppercase tracking-wider hover:bg-surface-variant transition-colors duration-150 px-2 py-1 border border-ink-black"
          >
            PLAY NOW
          </Link>
        </div>
      </nav>

      {/* Overlay Background */}
      <div className="absolute inset-0 bg-ink-black/20 backdrop-blur-[2px] z-20 flex items-center justify-center p-4">
        {/* Modal Panel */}
        <div className="bg-paper-white border-[2px] border-ink-black w-full max-w-lg hard-shadow relative animate-[slideIn_0.3s_ease-out]">
          {/* Modal Header */}
          <div className="border-b-[2px] border-ink-black p-margin-sm flex justify-between items-center bg-surface-variant">
            <h2 className="font-headline-md text-headline-md uppercase tracking-tight">
              Multiplayer Setup
            </h2>
            <Link
              to="/"
              className="text-ink-black hover:text-error-red transition-colors flex items-center justify-center w-8 h-8 border border-ink-black bg-paper-white hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </Link>
          </div>

          {/* Modal Body */}
          <div className="p-margin-md space-y-margin-lg">
            {/* Player Inputs */}
            <div className="space-y-margin-sm">
              <div className="group">
                <label
                  className="block font-label-mono text-grid-notes text-note-gray uppercase tracking-widest mb-1 group-focus-within:text-ink-blue transition-colors"
                  htmlFor="player1"
                >
                  Player 1
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b-[2px] border-ink-black p-0 py-2 font-headline-sm text-headline-sm focus:ring-0 focus:border-ink-blue focus:outline-none transition-colors placeholder:text-note-gray"
                  id="player1"
                  name="player1"
                  type="text"
                  defaultValue="Guest_01"
                />
              </div>
              <div className="group">
                <label
                  className="block font-label-mono text-grid-notes text-note-gray uppercase tracking-widest mb-1 group-focus-within:text-ink-blue transition-colors"
                  htmlFor="player2"
                >
                  Player 2
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b-[2px] border-ink-black p-0 py-2 font-headline-sm text-headline-sm focus:ring-0 focus:border-ink-blue focus:outline-none transition-colors placeholder:text-surface-tint"
                  id="player2"
                  name="player2"
                  placeholder="Waiting for opponent..."
                  type="text"
                />
              </div>
            </div>

            {/* Difficulty Selector */}
            <div>
              <label className="block font-label-mono text-grid-notes text-ink-black uppercase tracking-widest mb-3 border-b border-ink-black pb-1">
                Difficulty Protocol
              </label>
              <div className="flex border-[2px] border-ink-black">
                <button className="flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-wider text-ink-black hover:bg-surface-variant border-r-[2px] border-ink-black transition-colors">
                  Easy
                </button>
                <button className="flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-wider bg-ink-black text-paper-white border-r-[2px] border-ink-black transition-colors">
                  Medium
                </button>
                <button className="flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-wider text-ink-black hover:bg-surface-variant border-r-[2px] border-ink-black transition-colors">
                  Hard
                </button>
                <button className="flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-wider text-ink-black hover:bg-surface-variant transition-colors">
                  Expert
                </button>
              </div>
              <p className="font-body-md text-grid-notes text-note-gray mt-2 text-right italic">
                Estimated time: 15-20 mins
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-margin-md border-t-[2px] border-ink-black bg-surface-container">
            <Link
              to="/multiplayer/board"
              className="w-full bg-ink-black text-paper-white py-4 font-headline-sm text-label-mono uppercase tracking-[0.2em] hover:bg-ink-blue transition-colors hard-shadow border border-ink-black group flex items-center justify-center space-x-2"
            >
              <span>Initialize Match</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Sidebar (Context) */}
      <div className="absolute left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-ink-black bg-surface-container hidden lg:flex flex-col py-8 border-r-hairline border-surface-variant">
        <div className="px-4 py-2 bg-ink-black text-paper-white font-bold mb-2">
          <span className="material-symbols-outlined mr-2 align-middle">groups</span>
          Multiplayer
        </div>
        <div className="px-4 py-2 text-ink-black hover:underline cursor-pointer opacity-50 pointer-events-none">
          <span className="material-symbols-outlined mr-2 align-middle">grid_view</span>
          New Game
        </div>
      </div>
    </div>
  );
}

export default MultiplayerSetupModalPage;
