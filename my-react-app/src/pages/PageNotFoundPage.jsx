import { Link } from "react-router-dom";

function PageNotFoundPage() {
  return (
    <div className="bg-paper-white min-h-screen flex flex-col text-ink-black font-body-md selection:bg-ink-blue selection:text-paper-white">
      {/* TopAppBar */}
      <header className="w-full top-0 border-b border-ink-black bg-paper-white flex justify-between items-center px-margin-lg py-4 max-w-full">
        <div className="flex items-center gap-margin-md">
          <span className="font-headline-md text-headline-md font-bold text-ink-black tracking-tight">
            SUDOKU
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-margin-md">
          <Link
            to="/archive"
            className="text-secondary hover:text-primary transition-colors cursor-pointer active:opacity-70 font-body-md text-body-md"
          >
            Archive
          </Link>
          <Link
            to="/how-to-play"
            className="text-secondary hover:text-primary transition-colors cursor-pointer active:opacity-70 font-body-md text-body-md"
          >
            Rules
          </Link>
          <Link
            to="/about"
            className="text-secondary hover:text-primary transition-colors cursor-pointer active:opacity-70 font-body-md text-body-md"
          >
            About
          </Link>
        </nav>
        <div className="flex items-center">
          <Link
            to="/login"
            className="font-body-md text-body-md text-ink-black hover:text-primary transition-colors cursor-pointer active:opacity-70"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Canvas (404 Empty State) */}
      <main className="flex-grow flex flex-col justify-center px-margin-lg py-margin-lg w-full max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="w-16 h-[1px] bg-ink-black mb-margin-md opacity-20"></div>
          <h1 className="font-display-lg text-display-lg text-ink-black mb-margin-sm">
            This page wandered off the grid.
          </h1>
          <p className="font-body-lg text-body-lg text-note-gray mb-margin-lg max-w-2xl">
            The square you're looking for isn't part of this puzzle.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-label-mono text-label-mono text-ink-black group transition-all duration-150"
          >
            <span className="group-hover:underline decoration-[1px] underline-offset-4">
              Back to Sudoku Arena
            </span>
            <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform duration-150 text-xl">
              arrow_forward
            </span>
          </Link>
          <div className="mt-margin-lg opacity-10 flex gap-grid-unit">
            <div className="w-grid-unit h-grid-unit border border-ink-black"></div>
            <div className="w-grid-unit h-grid-unit border border-ink-black bg-ink-black"></div>
            <div className="w-grid-unit h-grid-unit border border-ink-black"></div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bottom-0 border-t border-ink-black bg-paper-white flex flex-col md:flex-row justify-between items-center px-margin-lg py-margin-sm mt-auto">
        <div className="font-label-mono text-label-mono text-note-gray mb-4 md:mb-0">
          © 2024 Editorial Sudoku. All rights reserved.
        </div>
        <nav className="flex items-center gap-margin-md">
          <Link
            to="/about"
            className="font-body-md text-body-md text-note-gray hover:text-ink-black hover:underline transition-all duration-150"
          >
            Privacy
          </Link>
          <Link
            to="/about"
            className="font-body-md text-body-md text-note-gray hover:text-ink-black hover:underline transition-all duration-150"
          >
            Terms
          </Link>
          <Link
            to="/about"
            className="font-body-md text-body-md text-note-gray hover:text-ink-black hover:underline transition-all duration-150"
          >
            Support
          </Link>
        </nav>
      </footer>
    </div>
  );
}

export default PageNotFoundPage;
