import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="w-full bg-background border-b border-ink-black">
      <div className="flex justify-between items-center w-full px-margin-lg py-4 max-w-7xl mx-auto">
        <Link
          to="/"
          className="font-headline-sm text-headline-sm uppercase tracking-wider text-ink-black"
        >
          SUDOKU ARENA
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <Link
            to="/multiplayer"
            className="font-label-mono text-label-mono text-ink-blue border-b-2 border-ink-blue pb-1 transition-colors duration-200"
          >
            Play
          </Link>
          <Link
            to="/how-to-play"
            className="font-label-mono text-label-mono text-secondary hover:text-ink-blue transition-colors duration-200 pb-1"
          >
            Learn
          </Link>
          {user ? (
            <>
              <Link
                to="/settings"
                className="font-label-mono text-label-mono text-secondary hover:text-ink-blue transition-colors duration-200 pb-1"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="font-label-mono text-label-mono text-secondary hover:text-ink-blue transition-colors duration-200 pb-1 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-label-mono text-label-mono text-secondary hover:text-ink-blue transition-colors duration-200 pb-1"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="font-label-mono text-label-mono text-ink-blue border-b-2 border-ink-blue pb-1 transition-colors duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
        <button className="md:hidden p-2 text-ink-black" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
