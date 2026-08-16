import { motion } from "framer-motion";

// Wraps each routed page: quick fade/slide on enter and exit.
// Used inside AnimatePresence mode="wait" in App.jsx.
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
