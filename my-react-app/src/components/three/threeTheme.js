// Shared light/dark palette for the three.js decor scenes, derived from the
// CSS tokens so the WebGL layers always match the page theme.
function readToken(name, fallback) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function currentPalette() {
  const dark = document.documentElement.classList.contains("dark");
  return {
    dark,
    surface: readToken("--color-paper-white", dark ? "#171714" : "#f7f5f0"),
    line: readToken("--color-ink-blue", dark ? "#9db4d8" : "#2b3a55"),
    ink: readToken("--color-ink-black", dark ? "#f0eee6" : "#1a1a1a"),
    wrong: readToken("--color-wrong-red", dark ? "#d06464" : "#c43f3f"),
  };
}

// Re-run `apply(palette)` only when the html.dark class flips.
export function watchTheme(apply) {
  let lastDark = document.documentElement.classList.contains("dark");
  const observer = new MutationObserver(() => {
    const dark = document.documentElement.classList.contains("dark");
    if (dark !== lastDark) {
      lastDark = dark;
      apply(currentPalette());
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  apply(currentPalette());
  return () => observer.disconnect();
}
