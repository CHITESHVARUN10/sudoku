// Standard chess ELO rating formula.
// Returns how many points the player's rating should change by.

const K = 32;

function expectedScore(playerElo, opponentElo) {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

// delta for `player` when they win against `opponent`.
// Returns the signed change (positive for a win).
function eloDelta(winnerElo, loserElo, k = K) {
  const expected = expectedScore(winnerElo, loserElo);
  return Math.round(k * (1 - expected));
}

// Convenience: compute both players' new ratings after a match.
function newRatings(winnerElo, loserElo, k = K) {
  const delta = eloDelta(winnerElo, loserElo, k);
  return {
    winner: winnerElo + delta,
    loser: loserElo - delta,
    delta,
  };
}

function leavePenalty(winnerScore, loserScore) {
  const gap = Math.max(0, winnerScore - loserScore);
  const raw = 10 + Math.floor(gap / 10);
  return Math.min(30, raw);
}

module.exports = { eloDelta, newRatings, expectedScore, leavePenalty };
