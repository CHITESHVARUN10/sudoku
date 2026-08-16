import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Reveal from "../components/motion/Reveal";
import { staggerParent, staggerChild } from "../components/motion/presets";
import useReducedMotion from "../components/three/useReducedMotion";
import { GridLattice } from "../components/three/lazy";

function AboutCreditsPage() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col font-body-md text-body-md selection:bg-ink-blue/10 selection:text-ink-black">
      {/* TopNavBar */}
      <nav className="bg-paper-white w-full border-b border-ink-black">
        <div className="flex justify-between items-center w-full px-margin-lg py-4 max-w-screen-2xl mx-auto">
          <Link
            to="/"
            className="font-headline-md text-headline-md font-bold text-ink-black tracking-tight"
          >
            Sudoku Arena
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/archive"
              className="font-body-md text-body-md text-secondary hover:bg-secondary-container transition-colors duration-75 px-2 py-1"
            >
              Archives
            </Link>
            <Link
              to="/how-to-play"
              className="font-body-md text-body-md text-secondary hover:bg-secondary-container transition-colors duration-75 px-2 py-1"
            >
              Techniques
            </Link>
            <Link
              to="/leaderboard"
              className="font-body-md text-body-md text-secondary hover:bg-secondary-container transition-colors duration-75 px-2 py-1"
            >
              Grand Prix
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              aria-label="account_circle"
              className="hover:bg-secondary-container transition-colors duration-75 p-1 rounded-sm"
            >
              <span className="material-symbols-outlined text-ink-black">account_circle</span>
            </Link>
            <Link
              to="/settings"
              aria-label="settings"
              className="hover:bg-secondary-container transition-colors duration-75 p-1 rounded-sm"
            >
              <span className="material-symbols-outlined text-ink-black">settings</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-screen-2xl mx-auto px-margin-lg py-margin-lg md:py-[120px] relative overflow-hidden">
        {/* Faint lattice behind the article. */}
        <GridLattice
          reducedMotion={reducedMotion}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.12 }}
        />
        <article className="max-w-[600px] ml-0 md:ml-[10%] relative z-10">
          <header className="mb-12">
            <h1 className="font-display-lg text-display-lg text-ink-black mb-6">
              About
            </h1>
            <div className="w-16 h-[1px] bg-ink-black"></div>
          </header>
          <div className="space-y-6 font-body-lg text-body-lg text-ink-black/90 mb-16">
            <Reveal>
              <p>
                Sudoku Arena is built on a simple premise: a puzzle should be a
                quiet conversation between the solver and the logic. In a digital
                landscape cluttered with notifications, arbitrary rewards, and
                visual noise, we sought to create a sanctuary for focus.
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <p>
                Our design philosophy borrows heavily from the tactile world of
                broadsheet newspapers and high-quality printed puzzle books. We
                believe that the interface should recede, leaving only the beauty
                of a well-typeset grid and the elegant constraints of the numbers
                themselves.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p>
                This platform is an ongoing experiment in editorial
                minimalism—where every pixel is intentional, every line serves as
                architecture, and nothing distracts from the pure satisfaction of
                a completed board.
              </p>
            </Reveal>
          </div>
          <section className="mb-16">
            <h2 className="font-label-mono text-label-mono text-secondary mb-4 uppercase tracking-widest text-[14px]">
              Built With
            </h2>
            <motion.div
              className="flex flex-wrap items-center gap-4 font-body-md text-body-md text-ink-black"
              variants={staggerParent}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
            >
              {["React", "Tailwind CSS", "Vite", "TypeScript"].map((tech, i) => (
                <motion.div key={tech} variants={staggerChild} className="flex items-center gap-4">
                  {i > 0 && <span className="h-4 w-[1px] bg-ink-black/30"></span>}
                  <span>{tech}</span>
                </motion.div>
              ))}
            </motion.div>
          </section>
          <footer>
            <a
              className="font-body-md text-body-md text-ink-black hover:bg-ink-blue/10 transition-colors border-b border-ink-black pb-0.5 inline-block"
              href="#"
            >
              View Source on GitHub
            </a>
          </footer>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-paper-white w-full border-t border-ink-black mt-auto">
        <div className="w-full px-margin-lg py-margin-md flex flex-col md:flex-row justify-between items-center gap-4 max-w-screen-2xl mx-auto">
          <div className="font-headline-sm text-headline-sm text-ink-black">
            Sudoku Arena
          </div>
          <div className="font-label-mono text-label-mono text-secondary text-sm">
            © 2024 Sudoku Arena. Printed in Logic.
          </div>
          <nav className="flex gap-6 font-label-mono text-label-mono text-sm">
            <Link to="/" className="text-secondary hover:text-ink-black transition-colors">
              Privacy
            </Link>
            <Link to="/" className="text-secondary hover:text-ink-black transition-colors">
              Terms
            </Link>
            <Link to="/" className="text-secondary hover:text-ink-black transition-colors">
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default AboutCreditsPage;
