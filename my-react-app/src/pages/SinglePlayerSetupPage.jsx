import { Link } from "react-router-dom";

function SinglePlayerSetupPage() {
  return (
    <body className="min-h-screen flex flex-col font-body-md text-body-md text-ink-black antialiased selection:bg-ink-blue selection:text-paper-white relative">
      {/* Grid Background Decoration */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-[-1]"></div>
      <main className="flex-grow flex items-center justify-center p-margin-md">
        {/* Setup Panel */}
        <div className="bg-paper-white border border-ink-black shadow-hard max-w-md w-full p-margin-lg">
          <header className="mb-margin-md text-center">
            <h1 className="font-display-lg text-display-lg text-ink-black tracking-tight mb-2">
              Practice Session
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Select your logic parameters.
            </p>
          </header>
          <div className="space-y-margin-md">
            {/* Difficulty Control */}
            <div>
              <label className="block font-label-mono text-label-mono text-ink-black mb-margin-sm uppercase tracking-widest text-sm text-center">
                Difficulty Level
              </label>
              <div className="flex border border-ink-black divide-x divide-ink-black">
                {/* Easy */}
                <button className="flex-1 py-3 font-label-mono text-label-mono text-sm text-ink-black bg-paper-white hover:bg-surface-container transition-colors focus:outline-none focus:bg-surface-container">
                  EASY
                </button>
                {/* Medium (Active) */}
                <button className="flex-1 py-3 font-label-mono text-label-mono text-sm bg-ink-blue text-paper-white focus:outline-none">
                  MEDIUM
                </button>
                {/* Hard */}
                <button className="flex-1 py-3 font-label-mono text-label-mono text-sm text-ink-black bg-paper-white hover:bg-surface-container transition-colors focus:outline-none focus:bg-surface-container">
                  HARD
                </button>
                {/* Expert */}
                <button className="flex-1 py-3 font-label-mono text-label-mono text-sm text-ink-black bg-paper-white hover:bg-surface-container transition-colors focus:outline-none focus:bg-surface-container">
                  EXPERT
                </button>
              </div>
            </div>
            {/* Action */}
            <div className="pt-margin-sm">
              <Link
                to="/practice/board"
                className="w-full border-2 border-ink-black bg-paper-white text-ink-black py-4 font-label-mono text-label-mono uppercase tracking-widest hover:bg-ink-black hover:text-paper-white transition-colors flex items-center justify-center gap-2 group"
              >
                BEGIN PRACTICE
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
          {/* Optional Editorial Note */}
          <div className="mt-margin-md pt-margin-md border-t border-ink-black/20 text-center">
            <p className="font-grid-notes text-grid-notes text-note-gray uppercase tracking-widest">
              Generated Seed: 8492A-M
            </p>
          </div>
        </div>
      </main>
    </body>
  );
}

export default SinglePlayerSetupPage;
