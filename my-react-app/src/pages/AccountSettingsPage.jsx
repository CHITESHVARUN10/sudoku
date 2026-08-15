import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";

function AccountSettingsPage() {
  const { user } = useAuth();
  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="bg-paper-white text-ink-black font-body-md min-h-screen flex flex-col">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[600px] mx-auto px-margin-sm md:px-0 py-margin-lg flex flex-col gap-12">
        {/* Header */}
        <header className="w-full pb-4 border-b border-ink-black">
          <h1 className="font-headline-md text-headline-md uppercase tracking-widest">
            Account
          </h1>
        </header>

        {/* Identity Section */}
        <section className="flex gap-8 items-start pb-12 border-b border-ink-black">
          <div className="w-24 h-24 bg-ink-black text-paper-white flex items-center justify-center flex-shrink-0">
            <span className="font-headline-md text-headline-md">{initials}</span>
          </div>
          <div className="flex flex-col gap-6 w-full pt-1">
            <div>
              <label className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block mb-1">
                Name
              </label>
              <input
                className="input-underline font-body-lg text-body-lg"
                type="text"
                defaultValue={user?.name || ""}
              />
            </div>
            <div>
              <label className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block mb-1">
                Email
              </label>
              <input
                className="input-underline font-body-lg text-body-lg"
                type="email"
                defaultValue={user?.email || ""}
              />
            </div>
          </div>
        </section>

        {/* Password Section */}
        <section className="flex flex-col gap-6 pb-12 border-b border-ink-black">
          <h2 className="font-label-mono text-label-mono uppercase tracking-widest">
            Security
          </h2>
          <div className="flex flex-col gap-6">
            <div>
              <label className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block mb-1">
                Current Password
              </label>
              <input
                className="input-underline font-body-lg text-body-lg"
                type="password"
                defaultValue="********"
              />
            </div>
            <div>
              <label className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block mb-1">
                New Password
              </label>
              <input
                className="input-underline font-body-lg text-body-lg"
                placeholder="Leave blank to keep current"
                type="password"
              />
            </div>
            <button className="self-start font-label-mono text-grid-notes uppercase tracking-widest border-b border-ink-black hover:border-b-2 transition-all mt-2">
              Update Password
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="flex flex-col gap-8 pb-12 border-b border-ink-black">
          <h2 className="font-label-mono text-label-mono uppercase tracking-widest">
            Preferences
          </h2>
          {/* Default Difficulty */}
          <div className="flex flex-col gap-3">
            <label className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary block">
              Default Difficulty
            </label>
            <div className="flex w-full">
              <button className="segmented-btn flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-widest hover:bg-surface-variant transition-colors">
                Easy
              </button>
              <button className="segmented-btn flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-widest active transition-colors">
                Medium
              </button>
              <button className="segmented-btn flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-widest hover:bg-surface-variant transition-colors">
                Hard
              </button>
              <button className="segmented-btn flex-1 py-2 font-label-mono text-grid-notes uppercase tracking-widest hover:bg-surface-variant transition-colors">
                Expert
              </button>
            </div>
          </div>
          {/* Notes Mode Default */}
          <div className="flex items-center justify-between mt-4">
            <label className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary">
              Notes Mode Default
            </label>
            <div className="flex gap-2 font-grid-number text-grid-number">
              <button className="hover:opacity-70 transition-opacity">[ON]</button>
              <button className="text-secondary opacity-50 hover:opacity-100 transition-opacity">
                [OFF]
              </button>
            </div>
          </div>
          {/* Theme */}
          <div className="flex items-center justify-between mt-4">
            <label className="font-label-mono text-grid-notes uppercase tracking-widest text-secondary">
              Theme
            </label>
            <div className="flex gap-4">
              <button className="w-8 h-8 bg-paper-white border border-ink-black shadow-[0_0_0_2px_#1A1A1A]"></button>
              <button className="w-8 h-8 bg-ink-black border border-ink-black hover:shadow-[0_0_0_1px_#1A1A1A]"></button>
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <section className="flex flex-col gap-6 items-center pt-4">
          <button className="w-full bg-ink-black text-paper-white font-label-mono text-label-mono uppercase tracking-widest py-4 hover:bg-primary-container transition-colors">
            SAVE CHANGES
          </button>
          <button className="font-label-mono text-grid-notes text-secondary hover:text-ink-black transition-colors underline">
            Delete Account
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-paper-white w-full border-t border-ink-black flex flex-col md:flex-row justify-between items-center px-margin-lg py-8 mt-auto">
        <div className="font-headline-sm text-headline-sm text-ink-black">
          © 2024 SUDOKU ARENA. AN EDITORIAL LOGIC PLATFORM.
        </div>
        <div className="flex gap-6 mt-4 md:mt-0 font-label-mono text-grid-notes uppercase tracking-widest">
          <Link to="/about" className="text-secondary hover:text-ink-black underline transition-colors">
            Terms
          </Link>
          <Link to="/about" className="text-secondary hover:text-ink-black underline transition-colors">
            Privacy
          </Link>
          <Link to="/archive" className="text-secondary hover:text-ink-black underline transition-colors">
            Archive
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default AccountSettingsPage;
