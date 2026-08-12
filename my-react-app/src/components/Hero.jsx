import { Link } from "react-router-dom";
import SudokuGridArt from "./SudokuGridArt";

function Hero() {
  return (
    <section className="py-16 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div className="flex flex-col items-start gap-8">
        <h1 className="font-display-lg text-display-lg text-ink-black">
          The Art of the Logical Grid
        </h1>
        <p className="font-body-lg text-body-lg text-ink-black max-w-lg">
          Master the ancient art of number placement in a beautifully typeset
          digital arena.
        </p>
        <div className="flex flex-row gap-4 w-full sm:w-auto">
          <Link
            to="/multiplayer"
            className="bg-ink-blue text-on-primary font-label-mono text-label-mono px-8 py-4 rounded-[2px] hover:bg-ink-black transition-colors w-full sm:w-auto text-center border border-ink-blue hover:border-ink-black"
          >
            Play Multiplayer
          </Link>
          <Link
            to="/practice"
            className="bg-transparent text-ink-black font-label-mono text-label-mono px-8 py-4 rounded-[2px] border border-ink-black hover:bg-ink-black hover:text-paper-white transition-colors w-full sm:w-auto text-center"
          >
            Practice Solo
          </Link>
        </div>
      </div>
      <div className="relative w-full aspect-square flex justify-center items-center p-8 bg-paper-white border border-ink-black">
        <SudokuGridArt className="w-full h-full object-contain mix-blend-multiply" />
      </div>
    </section>
  );
}

export default Hero;
