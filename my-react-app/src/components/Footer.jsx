import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn } from "./motion/presets";

function Footer() {
  return (
    <motion.footer
      className="w-full bg-background border-t border-ink-black mt-auto"
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
    >
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
    </motion.footer>
  );
}

export default Footer;
