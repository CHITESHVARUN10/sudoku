import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

// Local diagram: a 9x9 grid with one row, one column, and one 3x3 box highlighted
function RulesDiagram() {
  const highlightRow = [3, 13, 23, 33, 43, 53, 63, 73, 83]; // row 2 (0-indexed)
  const highlightCol = [72, 73, 74, 75, 76, 77, 78, 79, 80]; // col 8 (0-indexed)
  const highlightBox = [0, 1, 2, 9, 10, 11, 18, 19, 20]; // top-left box

  const cells = Array.from({ length: 81 }, (_, i) => {
    const isRow = highlightRow.includes(i);
    const isCol = highlightCol.includes(i);
    const isBox = highlightBox.includes(i);
    const cls = isRow || isCol || isBox ? "bg-ink-blue/10" : "";
    const stroke = isRow || isCol || isBox ? "#2B3A55" : "#1A1A1A";
    return { cls, stroke, idx: i };
  });

  return (
    <svg
      className="w-full max-w-md border border-ink-black bg-white"
      viewBox="0 0 288 288"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sudoku diagram illustrating a row, a column, and a 3x3 box highlighted on a 9x9 grid."
    >
      {cells.map((c) => {
        const x = (c.idx % 9) * 32;
        const y = Math.floor(c.idx / 9) * 32;
        return (
          <rect
            key={c.idx}
            x={x}
            y={y}
            width="32"
            height="32"
            className={c.cls}
            stroke={c.stroke}
            strokeWidth="0.5"
            fill={c.cls ? "rgba(43,58,85,0.1)" : "#fff"}
          />
        );
      })}
      {/* 3x3 box thick dividers */}
      {[96, 192].map((pos) => (
        <g key={`v-${pos}`} stroke="#1A1A1A" strokeWidth="2">
          <line x1={pos} y1="0" x2={pos} y2="288" />
          <line x1="0" y1={pos} x2="288" y2={pos} />
        </g>
      ))}
    </svg>
  );
}

function HowToPlayPage() {
  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col font-body-md antialiased selection:bg-ink-blue selection:text-paper-white">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow flex justify-center py-margin-lg px-margin-sm md:px-margin-lg">
        <article className="w-full max-w-[600px] flex flex-col gap-12">
          {/* Intro */}
          <section className="flex flex-col gap-6">
            <h1 className="font-display-lg text-display-lg text-ink-black">
              Rules of the Arena
            </h1>
            <p className="font-headline-md text-[24px] leading-relaxed text-ink-black opacity-90">
              Fill the grid so every row, column, and 3x3 box contains the
              numbers 1 through 9 exactly once.
            </p>
          </section>

          {/* Diagram */}
          <figure className="w-full py-8 flex justify-center">
            <RulesDiagram />
          </figure>

          {/* Numbered List */}
          <section className="flex flex-col gap-8">
            <div className="flex gap-6 items-start">
              <div className="font-display-lg text-display-lg text-ink-blue w-12 flex-shrink-0">
                1
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <h3 className="font-headline-sm text-headline-sm text-ink-black font-semibold">
                  Unique Placements
                </h3>
                <p className="font-body-lg text-body-lg text-secondary">
                  Each digit must appear once per row.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="font-display-lg text-display-lg text-ink-blue w-12 flex-shrink-0">
                2
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <h3 className="font-headline-sm text-headline-sm text-ink-black font-semibold">
                  Vertical Integrity
                </h3>
                <p className="font-body-lg text-body-lg text-secondary">
                  Each column must hold a complete set without repeats.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="font-display-lg text-display-lg text-ink-blue w-12 flex-shrink-0">
                3
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <h3 className="font-headline-sm text-headline-sm text-ink-black font-semibold">
                  Box Boundaries
                </h3>
                <p className="font-body-lg text-body-lg text-secondary">
                  Each 3x3 subgrid must also be logically complete.
                </p>
              </div>
            </div>
          </section>

          {/* Secondary Section: Techniques */}
          <section className="pt-8 flex flex-col border-t border-ink-black gap-0">
            <h2 className="font-headline-md text-headline-md text-ink-black mb-4">
              Common Techniques
            </h2>
            <details className="group border-b border-ink-black border-opacity-20">
              <summary className="flex justify-between items-center cursor-pointer py-4 hover:bg-black/5 transition-colors list-none px-2">
                <span className="font-body-lg text-body-lg text-ink-black font-medium">
                  Naked Singles
                </span>
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-ink-black">
                  expand_more
                </span>
              </summary>
              <div className="p-4 pt-0 font-body-md text-body-md text-secondary">
                When only one number is possible in a cell due to constraints
                in its row, column, and box.
              </div>
            </details>
            <details className="group border-b border-ink-black border-opacity-20">
              <summary className="flex justify-between items-center cursor-pointer py-4 hover:bg-black/5 transition-colors list-none px-2">
                <span className="font-body-lg text-body-lg text-ink-black font-medium">
                  Pencil Marks
                </span>
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-ink-black">
                  expand_more
                </span>
              </summary>
              <div className="p-4 pt-0 font-body-md text-body-md text-secondary">
                Noting down potential candidates in a cell to help eliminate
                possibilities logically.
              </div>
            </details>
          </section>

          {/* Bottom Action */}
          <div className="pt-12 pb-8 flex justify-center">
            <Link
              to="/practice"
              className="font-label-mono text-label-mono text-ink-black tracking-widest hover:text-ink-blue transition-colors flex items-center gap-2 border-b border-transparent hover:border-ink-blue pb-1 uppercase"
            >
              Ready? Start a puzzle
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-paper-white border-t border-ink-black w-full py-8 opacity-80 hover:opacity-100 transition-opacity">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-lg w-full max-w-[1440px] mx-auto gap-4">
          <div className="font-headline-sm text-headline-sm text-ink-black">
            © 2024 SUDOKU ARENA
          </div>
          <nav className="flex gap-6 font-label-mono text-label-mono text-body-md">
            <Link
              to="/about"
              className="text-secondary hover:underline hover:text-ink-black transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/about"
              className="text-secondary hover:underline hover:text-ink-black transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/about"
              className="text-secondary hover:underline hover:text-ink-black transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default HowToPlayPage;
