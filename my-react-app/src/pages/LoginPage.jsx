import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email });
    navigate("/");
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
            Track every game.
            <br />
            Master every grid.
          </p>
        </div>
      </div>
      {/* Right Panel (Main Content Canvas) */}
      <main className="bg-surface w-full md:w-1/2 flex items-center justify-center p-margin-md md:p-margin-lg relative z-10">
        <div className="w-full max-w-[360px]">
          {/* Headline */}
          <div className="mb-margin-lg text-left">
            <h2 className="font-display-lg text-[36px] uppercase tracking-widest text-ink-black">
              LOG IN
            </h2>
          </div>
          {/* Login Form */}
          <form className="space-y-margin-md" onSubmit={handleSubmit}>
            {/* Email Field */}
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
            {/* Password Field */}
            <div className="flex flex-col">
              <div className="flex justify-between items-end mb-1">
                <label
                  className="font-grid-notes text-grid-notes text-note-gray uppercase tracking-widest"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="font-grid-notes text-grid-notes text-ink-blue hover:text-ink-black hover:underline transition-colors"
                  href="#"
                >
                  Forgot Password?
                </a>
              </div>
              <input
                className="editorial-input font-body-md text-body-md text-ink-black py-2 w-full"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {/* Submit Button */}
            <div className="pt-margin-sm">
              <button
                className="w-full bg-ink-black text-surface font-label-mono text-label-mono uppercase tracking-[0.1em] py-4 rounded-none border border-ink-black hover:bg-surface hover:text-ink-black transition-colors flex justify-center items-center gap-2 group"
                type="submit"
              >
                LOG IN
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
          {/* Registration Link */}
          <div className="mt-margin-md text-left">
            <Link
              className="font-body-md text-body-md text-ink-black hover:underline transition-colors"
              to="/register"
            >
              New here? Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
