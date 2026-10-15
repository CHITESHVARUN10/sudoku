import { useEffect, useRef } from "react";

/**
 * Global keyboard controls for a Sudoku board.
 *
 * Callbacks (all optional):
 * - onDigit(n)              digits 1-9 placed on the selected cell
 * - onErase()               Backspace / Delete / 0 (may be rejected by rules)
 * - onArrow(dir)            ArrowKeys: 'up' | 'down' | 'left' | 'right'
 * - onEnter()               Enter re-selects the previous cell
 * - onToggleNotes()         N or Space toggles notes mode
 * - onEscape()              Escape deselects
 *
 * enabled=false unbinds the listener entirely (pause, solved, modals...).
 */
export default function useKeyboardSudoku({
  onDigit,
  onErase,
  onArrow,
  onEnter,
  onToggleNotes,
  onEscape,
  enabled = true,
}) {
  const cbs = useRef({});
  cbs.current = { onDigit, onErase, onArrow, onEnter, onToggleNotes, onEscape };

  useEffect(() => {
    if (!enabled) return undefined;
    const handler = (e) => {
      const t = e.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // Space/Enter natively activate a focused button — let the click happen
      // instead of also firing the board shortcut (avoids double actions
      // like toggling notes while pressing a numpad button).
      if (t && t.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) {
        return;
      }

      const fire = (name, arg) => {
        if (cbs.current[name]) {
          e.preventDefault();
          cbs.current[name](arg);
        }
      };

      if (/^[1-9]$/.test(e.key)) return fire("onDigit", Number(e.key));
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0")
        return fire("onErase");
      if (e.key === "ArrowUp") return fire("onArrow", "up");
      if (e.key === "ArrowDown") return fire("onArrow", "down");
      if (e.key === "ArrowLeft") return fire("onArrow", "left");
      if (e.key === "ArrowRight") return fire("onArrow", "right");
      if (e.key === "Enter") return fire("onEnter");
      if (e.key === "n" || e.key === "N" || e.key === " ")
        return fire("onToggleNotes");
      if (e.key === "Escape") return fire("onEscape");
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
