import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { scaleIn, staggerParent, staggerChild } from "../components/motion/presets";

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
  const [openAcc, setOpenAcc] = useState(null);

  const TECHNIQUES = [
    {
      key: "naked-singles",
      title: "Naked Singles",
      body: "When only one number is possible in a cell due to constraints in its row, column, and box.",
    },
    {
      key: "pencil-marks",
      title: "Pencil Marks",
      body: "Noting down potential candidates in a cell to help eliminate possibilities logically.",
    },
  ];

  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col font-body-md antialiased selection:bg-ink-blue selection:text-paper-white">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow flex justify-center py-margin-lg px-margin-sm md:px-margin-lg">
        <article className="w-full max-w-[600px] flex flex-col gap-12">
          {/* Intro */}
          <motion.section
            className="flex flex-col gap-6"
            variants={staggerParent}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={staggerChild}
              className="font-display-lg text-display-lg text-ink-black"
            >
              Rules of the Arena
            </motion.h1>
            <motion.p
              variants={staggerChild}
              className="font-headline-md text-[24px] leading-relaxed text-ink-black opacity-90"
            >
              Fill the grid so every row, column, and 3x3 box contains the
              numbers 1 through 9 exactly once.
            </motion.p>
          </motion.section>

          {/* Diagram */}
          <motion.figure
            className="w-full py-8 flex justify-center"
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <RulesDiagram />
          </motion.figure>

          {/* Numbered List */}
          <motion.section
            className="flex flex-col gap-8"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              {
                num: "1",
                title: "Unique Placements",
                body: "Each digit must appear once per row.",
              },
              {
                num: "2",
                title: "Vertical Integrity",
                body: "Each column must hold a complete set without repeats.",
              },
              {
                num: "3",
                title: "Box Boundaries",
                body: "Each 3x3 subgrid must also be logically complete.",
              },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={staggerChild}
                className="flex gap-6 items-start"
              >
                <div className="font-display-lg text-display-lg text-ink-blue w-12 flex-shrink-0">
                  {step.num}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <h3 className="font-headline-sm text-headline-sm text-ink-black font-semibold">
                    {step.title}
                  </h3>
                  <p className="font-body-lg text-body-lg text-secondary">
                    {step.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.section>

          {/* Secondary Section: Techniques */}
          <section className="pt-8 flex flex-col border-t border-ink-black gap-0">
            <h2 className="font-headline-md text-headline-md text-ink-black mb-4">
              Common Techniques
            </h2>
            {TECHNIQUES.map((t) => {
              const isOpen = openAcc === t.key;
              return (
                <div
                  key={t.key}
                  className="border-b border-ink-black border-opacity-20"
                >
                  <button
                    onClick={() => setOpenAcc(isOpen ? null : t.key)}
                    className="flex justify-between items-center cursor-pointer py-4 hover:bg-black/5 transition-colors list-none px-2 w-full text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-body-lg text-body-lg text-ink-black font-medium">
                      {t.title}
                    </span>
                    <motion.span
                      className="material-symbols-outlined text-ink-black"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      expand_more
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 font-body-md text-body-md text-secondary">
                          {t.body}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </section>

          {/* Bottom Action */}
          <motion.div
            className="pt-12 pb-8 flex justify-center"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Link
              to="/practice"
              className="font-label-mono text-label-mono text-ink-black tracking-widest hover:text-ink-blue transition-colors flex items-center gap-2 border-b border-transparent hover:border-ink-blue pb-1 uppercase"
            >
              Ready? Start a puzzle
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </motion.div>
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
