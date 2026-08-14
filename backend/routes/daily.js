const express = require('express');
const DailyPuzzle = require('../models/DailyPuzzle');
const { generatePuzzle } = require('../services/sudokuGenerator');
const { recordGame } = require('../services/stats');

const Router = express.Router();

// Difficulty ramps up through the week: Mon Easy -> Sun Expert.
const DAY_DIFFICULTY = [
  'Easy', // Sun
  'Easy', // Mon
  'Medium', // Tue
  'Medium', // Wed
  'Hard', // Thu
  'Hard', // Fri
  'Expert', // Sat
];

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// GET /daily/today — find or create today's puzzle.
Router.get('/today', async (req, res) => {
  try {
    const date = todayStr();
    let puzzle = await DailyPuzzle.findOne({ date });

    if (!puzzle) {
      const difficulty = DAY_DIFFICULTY[new Date().getDay()];
      const generated = generatePuzzle(difficulty);
      puzzle = await DailyPuzzle.create({
        date,
        grid: generated.puzzle,
        solution: generated.solution,
        difficulty,
        seed: `${date}-${generated.clues}`,
      });
    }

    // Never expose the solution to the client.
    const { solution, ...safe } = puzzle.toObject();
    return res.json({ success: true, puzzle: safe });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch daily puzzle.' });
  }
});

// POST /daily/:id/solve — validate a completed board, record result + stats.
Router.post('/:id/solve', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const { board, timeSec } = req.body;
    const puzzle = await DailyPuzzle.findById(req.params.id);
    if (!puzzle) {
      return res.status(404).json({ success: false, message: 'Puzzle not found.' });
    }

    const correct =
      Array.isArray(board) &&
      board.length === 81 &&
      board.every((v, i) => v === puzzle.solution[i]);

    if (!correct) {
      return res
        .status(400)
        .json({ success: false, message: 'Board does not match the solution.' });
    }

    await recordGame({
      userId: req.user._id,
      mode: 'Daily',
      difficulty: puzzle.difficulty,
      result: 'Solved',
      timeSec: timeSec || 0,
      movesCount: 0,
      mistakes: 0,
      score: 0,
      eloDelta: 0,
      powerUpsUsed: 0,
    });

    return res.json({ success: true, message: 'Daily puzzle solved!' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to record daily solve.' });
  }
});

// GET /daily/archive?date=YYYY-MM-DD — a past puzzle (without solution).
Router.get('/archive', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ success: false, message: 'Date must be YYYY-MM-DD.' });
    }
    const puzzle = await DailyPuzzle.findOne({ date });
    if (!puzzle) {
      return res
        .status(404)
        .json({ success: false, message: 'No puzzle for that date.' });
    }
    const { solution, ...safe } = puzzle.toObject();
    return res.json({ success: true, puzzle: safe });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch archive puzzle.' });
  }
});

module.exports = Router;
