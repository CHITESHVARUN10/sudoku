const express = require('express');
const Match = require('../models/Match');

const Router = express.Router();

// GET /matches/active — the user's active (non-completed) match(es).
// Powers the frontend "Rejoin match?" banner.
Router.get('/active', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const match = await Match.findOne({
      $or: [{ player1: req.user._id }, { player2: req.user._id }],
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .limit(1);

    return res.json({ success: true, match: match || null });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch active match.' });
  }
});

module.exports = Router;
