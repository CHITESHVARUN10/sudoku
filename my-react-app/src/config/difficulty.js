// Shared difficulty config for the clue-count stepper (used by multiplayer
// setup, practice setup, and anywhere else that needs the same bands).
export const DIFFICULTY_BANDS = {
  Easy: { base: 38, min: 30, max: 40 },
  Medium: { base: 33, min: 26, max: 34 },
  Hard: { base: 29, min: 22, max: 30 },
  Expert: { base: 24, min: 17, max: 25 },
};

// Map a clue count within its band to a green -> yellow -> red color.
// Fewer clues = harder = more red; more clues = easier = greener.
export function clueColor(clueCount, band) {
  const span = band.max - band.min;
  const t = (clueCount - band.min) / (span || 1); // 0 = fewest clues (red), 1 = most (green)
  const green = Math.round(210 * t + 40);
  const red = Math.round(250 - 190 * t);
  return `rgb(${red}, ${green}, 40)`;
}

export const TIMER_OPTIONS = [0, 3, 5, 10, 15]; // minutes per player; 0 = off
