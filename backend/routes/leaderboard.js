const express = require('express');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const User = require('../models/User');

const Router = express.Router();

// GET /leaderboard?period=week|month|all-time
// Returns top entries sorted by elo (then winRate), populated with user names.
Router.get('/', async (req, res) => {
  try {
    const period = ['week', 'month', 'all-time'].includes(req.query.period)
      ? req.query.period
      : 'all-time';

    const entries = await LeaderboardEntry.find({ period })
      .sort({ elo: -1, winRate: -1 })
      .limit(100)
      .populate('user', 'name avatarInitials');

    return res.json({ success: true, period, entries });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch leaderboard.' });
  }
});

module.exports = Router;
