import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
      <div className="bg-ink-black text-surface w-full md:w-1/2 min-h-[40vh] md:min-h-screen p-margin-md md:p-margin-lg flex flex-col justify-between">
        <div>
          <h1 className="font-display-lg text-[48px] uppercase tracking-widest text-surface">
            SUDOKU ARENA
          </h1>
        </div>
        <div className="mt-auto">
          <p className="font-headline-md text-[32px] italic text-surface">
            New key,
            <br />
            same arena.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <main className="bg-surface w-full md:w-1/2 flex items-center justify-center p-margin-md md:p-margin-lg relative z-10">
        <div className="w-full max-w-[360px]">
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
                <p
                  className="font-body-md text-body-md text-error-red border border-error-red bg-error-red/10 px-3 py-2"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="pt-margin-sm">
                <button
                  className="w-full bg-ink-black text-surface font-label-mono text-label-mono uppercase tracking-[0.1em] py-4 rounded-none border border-ink-black hover:bg-surface hover:text-ink-black transition-colors flex justify-center items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "UPDATING…" : "SET NEW PASSWORD"}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
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
        </div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;
