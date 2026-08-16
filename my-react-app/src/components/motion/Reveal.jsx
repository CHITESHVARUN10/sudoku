import { motion } from "framer-motion";
import { fadeUp } from "./presets";

// Scroll-reveal wrapper: fades/slides content up once when it enters view.
function Reveal({ children, className = "", delay = 0, ...rest }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
