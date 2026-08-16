import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { fadeUp, staggerParent, staggerChild } from "../components/motion/presets";
import useReducedMotion from "../components/three/useReducedMotion";
import { SudokuCube, GridLattice } from "../components/three/lazy";

function RegisterPage() {
  const { user, register } = useAuth();
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Go home instead of showing the register form.
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col font-body-md grid-bg-64 selection:bg-ink-blue selection:text-paper-white">
      {/* Main Content Area */}
      <main className="flex-grow flex relative z-0">
        <div className="flex w-full min-h-screen">
          {/* Left Panel */}
          <motion.div
            className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-ink-black p-margin-lg text-surface relative overflow-hidden"
            variants={staggerParent}
            initial="hidden"
            animate="visible"
          >
            <SudokuCube
              reducedMotion={reducedMotion}
              className="absolute inset-0 w-full h-full opacity-60"
            />
            <motion.div className="max-w-md relative z-10" variants={staggerChild}>
              <h1 className="font-display-lg text-display-lg tracking-[0.2em] uppercase mb-4">
                Sudoku Arena
              </h1>
              <p className="font-body-lg text-body-lg opacity-80">
                Join the Arena. Enter the grid.
              </p>
            </motion.div>
          </motion.div>
          {/* Right Panel */}
          <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-surface p-margin-md md:p-margin-lg relative overflow-hidden">
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
              <h2 className="font-display-lg text-headline-md uppercase tracking-widest mb-margin-md">
                Create Account
              </h2>
              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Name Field */}
                <div className="group">
                  <label
                    className="block font-label-mono text-grid-notes uppercase tracking-widest text-ink-black mb-2"
                    htmlFor="name"
                  >
                    Name
                  </label>
                  <input
                    className="block w-full bg-transparent border-0 border-b border-ink-black focus:ring-0 focus:border-ink-blue px-0 py-2 font-body-md text-body-md text-ink-black placeholder:text-note-gray transition-colors"
                    id="name"
                    name="name"
                    placeholder="Your full name"
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {/* Email Field */}
                <div className="group">
                  <label
                    className="block font-label-mono text-grid-notes uppercase tracking-widest text-ink-black mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    className="block w-full bg-transparent border-0 border-b border-ink-black focus:ring-0 focus:border-ink-blue px-0 py-2 font-body-md text-body-md text-ink-black placeholder:text-note-gray transition-colors"
                    id="email"
                    name="email"
                    placeholder="name@domain.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {/* Password Field */}
                <div className="group">
                  <label
                    className="block font-label-mono text-grid-notes uppercase tracking-widest text-ink-black mb-2"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="block w-full bg-transparent border-0 border-b border-ink-black focus:ring-0 focus:border-ink-blue px-0 py-2 font-body-md text-body-md text-ink-black placeholder:text-note-gray transition-colors"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-note-gray hover:text-ink-black transition-colors focus:outline-none"
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                  <p className="mt-2 font-body-md text-[12px] text-note-gray">
                    Minimum 8 characters
                  </p>
                </div>
                {/* API Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2"
                      role="alert"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                {/* Submit Button */}
                <div className="pt-4">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-ink-black text-surface font-label-mono text-label-mono uppercase tracking-[0.2em] py-4 px-6 hover:bg-opacity-90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink-black disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "CREATING…" : "Create Account"}
                  </motion.button>
                </div>
              </form>
              <div className="mt-margin-md">
                <Link
                  className="font-body-md text-body-md text-on-surface-variant hover:text-ink-black border-b border-transparent hover:border-ink-black transition-all inline-flex items-center"
                  to="/login"
                >
                  Already have an account? Log in.
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
