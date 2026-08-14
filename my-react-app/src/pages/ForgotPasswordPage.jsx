import { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiClient.post("/auth/user/forgot-password", { email });
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
      <div className="bg-ink-black text-surface w-full md:w-1/2 min-h-[40vh] md:min-h-screen p-margin-md md:p-margin-lg flex flex-col justify-between">
        <div>
          <h1 className="font-display-lg text-[48px] uppercase tracking-widest text-surface">
            SUDOKU ARENA
          </h1>
        </div>
        <div className="mt-auto">
          <p className="font-headline-md text-[32px] italic text-surface">
            Lost your key?
            <br />
            We'll open the gate.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <main className="bg-surface w-full md:w-1/2 flex items-center justify-center p-margin-md md:p-margin-lg relative z-10">
        <div className="w-full max-w-[360px]">
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
                  {submitting ? "SENDING…" : "SEND RESET LINK"}
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
              Remembered it? Log in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
