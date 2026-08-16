import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SudokuGridArt from "./SudokuGridArt";
import { fadeUp, scaleIn } from "./motion/presets";

function Hero() {
  return (
    <section className="py-16 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div className="flex flex-col items-start gap-8">
        <motion.h1
          className="font-display-lg text-display-lg text-ink-black"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          The Art of the Logical Grid
        </motion.h1>
        <motion.p
          className="font-body-lg text-body-lg text-ink-black max-w-lg"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.08 }}
        >
          Master the ancient art of number placement in a beautifully typeset
          digital arena.
        </motion.p>
        <motion.div
          className="flex flex-row gap-4 w-full sm:w-auto"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.16 }}
        >
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
        </motion.div>
      </div>
      <motion.div
        className="relative w-full aspect-square flex justify-center items-center p-8 bg-paper-white border border-ink-black"
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full flex items-center justify-center"
        >
          <SudokuGridArt className="w-full h-full object-contain mix-blend-multiply" />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;
