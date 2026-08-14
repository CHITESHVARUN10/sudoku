const GameHistory = require('../models/GameHistory');
const Statistics = require('../models/Statistics');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const { newRatings } = require('./elo');

// Compute + update the user's Statistics doc after a game.
async function recordGame({ userId, mode, difficulty, opponentId, opponentName, result, timeSec, movesCount, mistakes, score, eloDelta, powerUpsUsed }) {
  // 1. GameHistory ledger entry
  await GameHistory.create({
    user: userId,
    mode,
    difficulty,
    opponent: opponentId || null,
    opponentName: opponentName || null,
    result,
    timeSec,
    movesCount,
    mistakes,
    score,
    eloDelta,
    powerUpsUsed,
  });

  // 2. Statistics aggregates
  let stats = await Statistics.findOne({ user: userId });
  if (!stats) {
    stats = await Statistics.create({ user: userId });
  }

  const won = result === 'Win' || result === 'Solved';
  stats.gamesPlayed += 1;
  if (won) stats.wins += 1;
  stats.winRate = stats.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  stats.avgTimeSec = stats.gamesPlayed
    ? Math.round(
        (stats.avgTimeSec * (stats.gamesPlayed - 1) + (timeSec || 0)) / stats.gamesPlayed
      )
    : timeSec || 0;

  // Streaks
  if (won) {
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  // Difficulty breakdown
  const key = difficulty ? difficulty.toLowerCase() : 'medium';
  stats.difficultyBreakdown[key] = (stats.difficultyBreakdown[key] || 0) + 1;

  // Solve-time trend (per-day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trend = stats.solveTimeTrend.find(
    (p) => new Date(p.date).getTime() === today.getTime()
  );
  if (trend) {
    trend.avgTimeSec = Math.round((trend.avgTimeSec + (timeSec || 0)) / 2);
  } else {
    stats.solveTimeTrend.push({ date: today, avgTimeSec: timeSec || 0 });
  }

  // Elo history snapshot
  const user = await require('../models/User').findById(userId);
  if (user) {
    const lastElo = stats.eloHistory[stats.eloHistory.length - 1];
    if (!lastElo || lastElo.elo !== user.elo) {
      stats.eloHistory.push({ date: new Date(), elo: user.elo });
    }
  }

  await stats.save();

  // 3. Leaderboard entry (all-time; keep winRate/games/streaks/elo fresh)
  let entry = await LeaderboardEntry.findOne({ user: userId, period: 'all-time' });
  if (!entry) {
    entry = await LeaderboardEntry.create({
      user: userId,
      period: 'all-time',
      rank: 9999, // recomputed below
    });
  }
  entry.winRate = stats.winRate;
  entry.gamesPlayed = stats.gamesPlayed;
  entry.currentStreak = stats.currentStreak;
  entry.bestStreak = stats.bestStreak;
  if (user) entry.elo = user.elo;
  await entry.save();

  // Recompute all-time ranks (by elo desc, then winRate).
  const all = await LeaderboardEntry.find({ period: 'all-time' }).sort({ elo: -1, winRate: -1 });
  await Promise.all(
    all.map((e, i) => {
      if (e.rank !== i + 1) {
        e.rank = i + 1;
        return e.save();
      }
      return null;
    })
  );

  return stats;
}

// Record a completed multiplayer match (call from match:end).
async function recordMatchResult(match, { winnerUserId, loserUserId, winnerElo, loserElo, eloDelta, timeSec, movesCount, difficulty }) {
  const results = [];

  // Winner
  results.push(
    await recordGame({
      userId: winnerUserId,
      mode: 'Multiplayer',
      difficulty,
      opponentId: loserUserId,
      opponentName: null,
      result: 'Win',
      timeSec,
      movesCount,
      mistakes: 0,
      score: match.scores?.p1 || 0,
      eloDelta,
      powerUpsUsed: 0,
    })
  );

  // Loser
  results.push(
    await recordGame({
      userId: loserUserId,
      mode: 'Multiplayer',
      difficulty,
      opponentId: winnerUserId,
      opponentName: null,
      result: 'Loss',
      timeSec,
      movesCount,
      mistakes: 0,
      score: match.scores?.p2 || 0,
      eloDelta: -eloDelta,
      powerUpsUsed: 0,
    })
  );

  return results;
}

module.exports = { recordGame, recordMatchResult };
