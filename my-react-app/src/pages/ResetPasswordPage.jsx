import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { fadeUp, staggerParent, staggerChild } from "../components/motion/presets";
import useReducedMotion from "../components/three/useReducedMotion";
import { SudokuCube, GridLattice } from "../components/three/lazy";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const reducedMotion = useReducedMotion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-ink-black min-h-screen antialiased flex flex-col md:flex-row">
      {/* Left Panel */}
      <motion.div
        className="bg-ink-black text-surface w-full md:w-1/2 min-h-[40vh] md:min-h-screen p-margin-md md:p-margin-lg flex flex-col justify-between relative overflow-hidden"
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <SudokuCube
          reducedMotion={reducedMotion}
          className="absolute inset-0 w-full h-full opacity-60"
        />
        <motion.div variants={staggerChild} className="relative z-10">
          <h1 className="font-display-lg text-[48px] uppercase tracking-widest text-surface">
            SUDOKU ARENA
          </h1>
        </motion.div>
        <motion.div className="mt-auto relative z-10" variants={staggerChild}>
          <p className="font-headline-md text-[32px] italic text-surface">
            New key,
            <br />
            same arena.
          </p>
        </motion.div>
      </motion.div>

      {/* Right Panel */}
      <main className="bg-surface w-full md:w-1/2 flex items-center justify-center p-margin-md md:p-margin-lg relative z-10 overflow-hidden">
        <GridLattice
          reducedMotion={reducedMotion}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.15 }}
        />
        <motion.div
          className="w-full max-w-[360px] relative z-10"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-margin-lg text-left">
            <h2 className="font-display-lg text-[36px] uppercase tracking-widest text-ink-black">
              NEW PASSWORD
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2">
              Choose a new password for your account.
            </p>
          </div>

          {done ? (
            <div className="border border-ink-black bg-paper-white p-margin-md">
              <p className="font-body-md text-body-md text-ink-black">
                Password updated. Redirecting to log in…
              </p>
            </div>
          ) : (
            <form className="space-y-margin-md" onSubmit={handleSubmit}>
              <div className="flex flex-col">
                <label
                  className="font-grid-notes text-grid-notes text-note-gray uppercase tracking-widest mb-1"
                  htmlFor="password"
                >
                  New Password
                </label>
                <input
                  className="editorial-input font-body-md text-body-md text-ink-black py-2 w-full"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label
                  className="font-grid-notes text-grid-notes text-note-gray uppercase tracking-widest mb-1"
                  htmlFor="confirm"
                >
                  Confirm Password
                </label>
                <input
                  className="editorial-input font-body-md text-body-md text-ink-black py-2 w-full"
                  id="confirm"
                  name="confirm"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="font-label-mono text-label-mono uppercase tracking-widest text-secondary hover:text-ink-black transition-colors self-start"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"} passwords
              </button>

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
                  {submitting ? "UPDATING…" : "SET NEW PASSWORD"}
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
              Back to Log In
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;
