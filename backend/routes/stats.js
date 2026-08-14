const express = require('express');
const Statistics = require('../models/Statistics');
const GameHistory = require('../models/GameHistory');

const Router = express.Router();

// GET /stats/me — the current user's Statistics doc.
Router.get('/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    let stats = await Statistics.findOne({ user: req.user._id });
    if (!stats) {
      stats = await Statistics.create({ user: req.user._id });
    }
    return res.json({ success: true, stats });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// GET /stats/history?page=1&limit=20 — recent GameHistory entries.
Router.get('/history', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const [games, total] = await Promise.all([
      GameHistory.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      GameHistory.countDocuments({ user: req.user._id }),
    ]);

    return res.json({
      success: true,
      games,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch history.' });
  }
});

module.exports = Router;
