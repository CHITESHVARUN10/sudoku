const express = require('express');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const User = require('../models/User');

const Router = express.Router();

// GET /leaderboard?period=week|month|all-time&page=1&limit=25
// Returns top entries sorted by elo (then winRate), populated with user names.
Router.get('/', async (req, res) => {
  try {
    const period = ['week', 'month', 'all-time'].includes(req.query.period)
      ? req.query.period
      : 'all-time';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 25));

    const [entries, total] = await Promise.all([
      LeaderboardEntry.find({ period })
        .sort({ elo: -1, winRate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name avatarInitials'),
      LeaderboardEntry.countDocuments({ period }),
    ]);

    return res.json({
      success: true,
      period,
      entries,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch leaderboard.' });
  }
});

module.exports = Router;
