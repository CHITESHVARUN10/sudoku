import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `font-label-mono text-label-mono pb-1 transition-colors duration-200 ${
      isActive
        ? "text-ink-blue border-b-2 border-ink-blue"
        : "text-secondary hover:text-ink-blue"
    }`;

  const closeMenu = () => setMenuOpen(false);

  const links = (
    <>
      <NavLink to="/multiplayer" className={linkClass} onClick={closeMenu}>
        Play
      </NavLink>
      <NavLink to="/practice" className={linkClass} onClick={closeMenu}>
        Practice
      </NavLink>
      <NavLink to="/archive" className={linkClass} onClick={closeMenu}>
        History
      </NavLink>
      <NavLink to="/stats" className={linkClass} onClick={closeMenu}>
        Stats
      </NavLink>
      <NavLink to="/leaderboard" className={linkClass} onClick={closeMenu}>
        Leaderboard
      </NavLink>
      <NavLink to="/how-to-play" className={linkClass} onClick={closeMenu}>
        Learn
      </NavLink>
    </>
  );

  const authLinks = user ? (
    <>
      <NavLink to="/settings" className={linkClass} onClick={closeMenu}>
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
      <NavLink to="/login" className={linkClass} onClick={closeMenu}>
        Login
      </NavLink>
      <NavLink to="/register" className={linkClass} onClick={closeMenu}>
        Register
      </NavLink>
    </>
  );

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
          {links}
          {authLinks}
        </div>
        <button
          className="md:hidden p-2 text-ink-black"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="material-symbols-outlined">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink-black bg-paper-white px-margin-lg py-4 flex flex-col gap-4">
          {links}
          {authLinks}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
