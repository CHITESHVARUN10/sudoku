// Power-up logic: reveal the correct number for a cell on the ACTOR's own
// board (race mode). Ownership vs clues is enforced by the socket handler;
// this helper only checks availability, validates bounds, and decrements.

function canUsePowerUp(match, player) {
  const key = player === 1 ? 'p1' : 'p2';
  if (!match || match.status !== 'active') return false;
  if (match.powerUpsLeft?.[key] <= 0) return false;
  return true; // no turn restriction — multiplayer is simultaneous
}

// Return { ok, value } or { ok:false, reason }. The caller writes the value
// to the actor's board via setBoardForSeat — this helper does NOT mutate.
function usePowerUp(match, player, cell) {
  const key = player === 1 ? 'p1' : 'p2';

  if (!canUsePowerUp(match, player)) {
    return { ok: false, reason: 'Cannot use power-up now.' };
  }
  if (cell < 0 || cell > 80) {
    return { ok: false, reason: 'Invalid cell.' };
  }

  // Final clue check lives in the socket handler; keep a guard here too.
  if (match.initialBoard[cell] != null) {
    return { ok: false, reason: 'Cell is a clue.' };
  }

  const value = match.solution[cell];
  match.powerUpsLeft[key] -= 1;

  return { ok: true, value };
}

module.exports = { canUsePowerUp, usePowerUp };
