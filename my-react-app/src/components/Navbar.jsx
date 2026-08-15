import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `font-label-mono text-label-mono pb-1 transition-colors duration-200 ${
      isActive
        ? "text-ink-blue border-b-2 border-ink-blue"
        : "text-secondary hover:text-ink-blue"
    }`;

  return (
    <nav className="w-full bg-background border-b border-ink-black">
      <div className="flex justify-between items-center w-full px-margin-lg py-4 max-w-7xl mx-auto">
        <NavLink
          to="/"
          className="font-headline-sm text-headline-sm uppercase tracking-wider text-ink-black"
        >
          SUDOKU ARENA
        </NavLink>
        <div className="hidden md:flex gap-8 items-center">
          <NavLink to="/multiplayer" className={linkClass}>
            Play
          </NavLink>
          <NavLink to="/practice" className={linkClass}>
            Practice
          </NavLink>
          <NavLink to="/archive" className={linkClass}>
            History
          </NavLink>
          <NavLink to="/stats" className={linkClass}>
            Stats
          </NavLink>
          <NavLink to="/how-to-play" className={linkClass}>
            Learn
          </NavLink>
          {user ? (
            <>
              <NavLink to="/settings" className={linkClass}>
                Profile
              </NavLink>
              <button
                onClick={handleLogout}
                className="font-label-mono text-label-mono text-secondary hover:text-ink-blue transition-colors duration-200 pb-1 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
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
