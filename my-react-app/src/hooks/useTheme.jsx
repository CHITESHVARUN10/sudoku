import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "theme";

function initialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Light/dark theme control. State lives on `document.documentElement`
 * (`html.dark` class drives the CSS token inversion), mirrored in
 * localStorage. index.html applies the class before first paint, so this
 * hook only keeps React state in sync with the document.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme, isDark: theme === "dark" };
}
