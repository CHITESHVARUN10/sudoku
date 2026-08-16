// Power-up logic: reveal the correct number for a cell.
// Each player has a max (set at room creation, 0-3); using one consumes it.
// Ownership (can't power-up your own marked cell / clues) is enforced by the
// socket handler via cellOwner — the board may hold the opponent's masked
// fills, so a plain "cell is filled" check would wrongly block power-ups.

function canUsePowerUp(match, player) {
  const key = player === 1 ? 'p1' : 'p2';
  if (!match || match.status !== 'active') return false;
  if (match.powerUpsLeft?.[key] <= 0) return false;
  return true; // no turn restriction — multiplayer is simultaneous
}

// Reveal the solution value at `cell`. Returns { ok, value, powerUpsLeft } or
// { ok: false, reason }.
function usePowerUp(match, player, cell) {
  const key = player === 1 ? 'p1' : 'p2';

  if (!canUsePowerUp(match, player)) {
    return { ok: false, reason: 'Cannot use power-up now.' };
  }
  if (cell < 0 || cell > 80) {
    return { ok: false, reason: 'Invalid cell.' };
  }

  const value = match.solution[cell];
  match.board[cell] = value;
  match.powerUpsLeft[key] -= 1;

  return { ok: true, value };
}

module.exports = { canUsePowerUp, usePowerUp };
