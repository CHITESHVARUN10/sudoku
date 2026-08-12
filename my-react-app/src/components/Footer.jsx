import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="w-full bg-background border-t border-ink-black mt-auto">
      <div className="w-full px-margin-lg py-margin-md max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <Link
          to="/"
          className="font-headline-sm text-headline-sm text-ink-black"
        >
          SUDOKU ARENA
        </Link>
        <div className="flex gap-6 font-label-mono text-label-mono">
          <Link
            to="/about"
            className="text-secondary hover:text-ink-black underline underline-offset-4 transition-colors"
          >
            Terms
          </Link>
          <Link
            to="/about"
            className="text-secondary hover:text-ink-black underline underline-offset-4 transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/about"
            className="text-secondary hover:text-ink-black underline underline-offset-4 transition-colors"
          >
            Contact
          </Link>
        </div>
        <div className="font-body-md text-body-md text-secondary">
          &copy; 2024 SUDOKU ARENA. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
