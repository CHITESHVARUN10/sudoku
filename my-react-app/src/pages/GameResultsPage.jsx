import { Link } from "react-router-dom";

const MOVES = [
  { num: 1, cell: "[R1, C4]", value: "7" },
  { num: 2, cell: "[R3, C9]", value: "2" },
  { num: 3, cell: "[R2, C2]", value: "5" },
  { num: 4, cell: "[R5, C5]", value: "9" },
  { num: 5, cell: "[R8, C1]", value: "1" },
  { num: 6, cell: "[R9, C7]", value: "4" },
  { num: 7, cell: "[R4, C3]", value: "8" },
  { num: 8, cell: "[R7, C8]", value: "3" },
];

function GameResultsPage() {
  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col antialiased">
      <main className="flex-grow flex flex-col px-margin-sm md:px-margin-lg py-margin-lg max-w-screen-2xl mx-auto w-full">
        {/* Header Section */}
        <header className="mb-margin-lg">
          <h1 className="font-display-lg text-display-lg text-ink-black mb-grid-unit">
            Solved in 14:22
          </h1>
          <p className="font-body-lg text-body-lg text-note-gray">
            Expert Difficulty • Oct 26, 2024 • Solo Session
          </p>
        </header>

        {/* Stats Summary */}
        <section className="border-t-hairline border-b-hairline border-ink-black py-margin-md mb-margin-lg flex flex-row items-center justify-between">
          <div className="flex-1 text-center border-r-hairline border-ink-black px-margin-sm">
            <span className="block font-headline-md text-headline-md text-ink-black">
              14:22
            </span>
            <span className="block font-label-mono text-label-mono text-note-gray mt-grid-unit text-sm uppercase tracking-widest">
              Time
            </span>
          </div>
          <div className="flex-1 text-center border-r-hairline border-ink-black px-margin-sm">
            <span className="block font-headline-md text-headline-md text-ink-black">
              0/3
            </span>
            <span className="block font-label-mono text-label-mono text-note-gray mt-grid-unit text-sm uppercase tracking-widest">
              Mistakes
            </span>
          </div>
          <div className="flex-1 text-center px-margin-sm">
            <span className="block font-headline-md text-headline-md text-ink-black">
              42
            </span>
            <span className="block font-label-mono text-label-mono text-note-gray mt-grid-unit text-sm uppercase tracking-widest">
              Moves
            </span>
          </div>
        </section>

        {/* Move History Ledger */}
        <section className="flex-grow overflow-auto mb-margin-lg">
          <h2 className="sr-only">Move History</h2>
          <table className="w-full text-left border-collapse">
            <thead className="sr-only">
              <tr>
                <th>Move Number</th>
                <th>Cell</th>
                <th>Action</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody className="font-grid-notes text-grid-notes text-ink-black">
              {MOVES.map((move) => (
                <tr
                  key={move.num}
                  className="border-b-hairline border-ink-black group hover:bg-surface-container-high transition-colors duration-150"
                >
                  <td className="py-3 px-2 w-16 text-note-gray">{move.num}.</td>
                  <td className="py-3 px-2 w-24">{move.cell}</td>
                  <td className="py-3 px-2 w-12 text-note-gray">-&gt;</td>
                  <td className="py-3 px-2 font-grid-number text-grid-number">
                    {move.value}
                  </td>
                </tr>
              ))}
              <tr className="border-b-hairline border-ink-black group hover:bg-surface-container-high transition-colors duration-150">
                <td className="py-3 px-2 text-note-gray">...</td>
                <td className="py-3 px-2">...</td>
                <td className="py-3 px-2 text-note-gray">...</td>
                <td className="py-3 px-2">...</td>
              </tr>
              <tr className="border-b-hairline border-ink-black group hover:bg-surface-container-high transition-colors duration-150">
                <td className="py-3 px-2 text-note-gray">42.</td>
                <td className="py-3 px-2">[R6, C6]</td>
                <td className="py-3 px-2 text-note-gray">-&gt;</td>
                <td className="py-3 px-2 font-grid-number text-grid-number">6</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      {/* Action Row (Bottom) */}
      <footer className="mt-auto px-margin-sm md:px-margin-lg max-w-screen-2xl mx-auto w-full pb-margin-lg">
        <nav className="flex flex-col sm:flex-row items-center justify-start border-t-hairline border-b-hairline border-ink-black py-margin-sm">
          <Link
            to="/practice"
            className="font-label-mono text-label-mono text-ink-black hover:text-note-gray transition-colors uppercase tracking-widest text-sm px-margin-md border-r-hairline border-ink-black sm:w-auto w-full text-center sm:text-left py-2 sm:py-0"
          >
            Rematch
          </Link>
          <Link
            to="/practice"
            className="font-label-mono text-label-mono text-ink-black hover:text-note-gray transition-colors uppercase tracking-widest text-sm px-margin-md border-r-hairline border-ink-black sm:w-auto w-full text-center sm:text-left py-2 sm:py-0"
          >
            New Game
          </Link>
          <Link
            to="/archive"
            className="font-label-mono text-label-mono text-ink-black hover:text-note-gray transition-colors uppercase tracking-widest text-sm px-margin-md sm:w-auto w-full text-center sm:text-left py-2 sm:py-0"
          >
            Back to Archive
          </Link>
        </nav>
      </footer>
    </div>
  );
}

export default GameResultsPage;
