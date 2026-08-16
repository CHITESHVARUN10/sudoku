import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { fadeUp, staggerParent, staggerChild } from "../components/motion/presets";

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-ink-black min-h-screen antialiased flex flex-col md:flex-row">
      {/* Left Panel */}
      <motion.div
        className="bg-ink-black text-surface w-full md:w-1/2 min-h-[40vh] md:min-h-screen p-margin-md md:p-margin-lg flex flex-col justify-between"
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerChild}>
          <h1 className="font-display-lg text-[48px] uppercase tracking-widest text-surface">
            SUDOKU ARENA
          </h1>
        </motion.div>
        <motion.div className="mt-auto" variants={staggerChild}>
          <p className="font-headline-md text-[32px] italic text-surface">
            Lost your key?
            <br />
            We'll open the gate.
          </p>
        </motion.div>
      </motion.div>

      {/* Right Panel */}
      <main className="bg-surface w-full md:w-1/2 flex items-center justify-center p-margin-md md:p-margin-lg relative z-10">
        <motion.div
          className="w-full max-w-[360px]"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-margin-lg text-left">
            <h2 className="font-display-lg text-[36px] uppercase tracking-widest text-ink-black">
              RESET PASSWORD
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="border border-ink-black bg-paper-white p-margin-md">
              <p className="font-body-md text-body-md text-ink-black">
                If an account exists for{" "}
                <span className="font-bold">{email}</span>, a reset link is on
                its way. Check your inbox (and spam folder).
              </p>
              <Link
                to="/login"
                className="inline-block mt-margin-md font-label-mono text-label-mono uppercase tracking-widest border-b border-ink-black hover:border-b-2 transition-all"
              >
                Back to Log In
              </Link>
            </div>
          ) : (
            <form className="space-y-margin-md" onSubmit={handleSubmit}>
              <div className="flex flex-col">
                <label
                  className="font-grid-notes text-grid-notes text-note-gray uppercase tracking-widest mb-1"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  className="editorial-input font-body-md text-body-md text-ink-black py-2 w-full"
                  id="email"
                  name="email"
                  placeholder="player@sudokuarena.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <motion.p
                  className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {error}
                </motion.p>
              )}

              <div className="pt-margin-sm">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-ink-black text-surface font-label-mono text-label-mono uppercase tracking-[0.1em] py-4 rounded-none border border-ink-black hover:bg-surface hover:text-ink-black transition-colors flex justify-center items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "SENDING…" : "SEND RESET LINK"}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </motion.button>
              </div>
            </form>
          )}

          <div className="mt-margin-md text-left">
            <Link
              className="font-body-md text-body-md text-ink-black hover:underline transition-colors"
              to="/login"
            >
              Remembered it? Log in
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
