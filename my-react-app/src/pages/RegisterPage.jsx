import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    register({ name, email });
    navigate("/");
  };

  return (
    <div className="bg-paper-white text-ink-black min-h-screen flex flex-col font-body-md grid-bg-64 selection:bg-ink-blue selection:text-paper-white">
      {/* Main Content Area */}
      <main className="flex-grow flex relative z-0">
        <div className="flex w-full min-h-screen">
          {/* Left Panel */}
          <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-ink-black p-margin-lg text-surface">
            <div className="max-w-md">
              <h1 className="font-display-lg text-display-lg tracking-[0.2em] uppercase mb-4">
                Sudoku Arena
              </h1>
              <p className="font-body-lg text-body-lg opacity-80">
                Join the Arena. Enter the grid.
              </p>
            </div>
          </div>
          {/* Right Panel */}
          <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-surface p-margin-md md:p-margin-lg">
            <div className="w-full max-w-[360px]">
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
                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    className="w-full bg-ink-black text-surface font-label-mono text-label-mono uppercase tracking-[0.2em] py-4 px-6 hover:bg-opacity-90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink-black"
                    type="submit"
                  >
                    Create Account
                  </button>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
