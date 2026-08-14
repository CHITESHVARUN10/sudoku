const express = require('express');
const Game = require('../models/Game');
const { generatePuzzle } = require('../services/sudokuGenerator');
const { recordGame } = require('../services/stats');

const Router = express.Router();

// POST /practice/start — create a solo Game with a generated puzzle.
// Body: { difficulty, clueCount, powerUps }
Router.post('/start', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const { difficulty, clueCount, powerUps } = req.body || {};
    const clue = Math.min(40, Math.max(17, Number(clueCount) || 33));
    const pu = Math.min(3, Math.max(0, Number(powerUps) || 0));

    const generated = generatePuzzle(clue);

    const game = await Game.create({
      user: req.user._id,
      difficulty: difficulty || 'Medium',
      board: generated.puzzle,
      initialBoard: generated.puzzle,
      solution: generated.solution,
      notes: Array.from({ length: 81 }, () => []),
      status: 'active',
      timeElapsedSec: 0,
      mistakes: 0,
      score: 0,
      powerUpsTotal: pu,
      powerUpsUsed: 0,
      moves: [],
    });

    // Never send the solution to the client directly; the move endpoint validates.
    const { solution, ...safe } = game.toObject();
    return res.status(201).json({ success: true, game: safe });
  } catch (err) {
    console.error('practice start error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to start practice.' });
  }
});

// POST /practice/:id/move — validate a move, update board/score/mistakes, check win.
Router.post('/:id/move', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const { cell, value, timeElapsedSec } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game || String(game.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Game not found.' });
    }
    if (game.status !== 'active') {
      return res
        .status(400)
        .json({ success: false, message: 'Game is not active.' });
    }
    if (cell < 0 || cell > 80 || value < 1 || value > 9) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid move.' });
    }
    if (game.initialBoard[cell] != null) {
      return res
        .status(400)
        .json({ success: false, message: 'Cell is a given — cannot change.' });
    }

    const correct = value === game.solution[cell];
    game.board[cell] = value;
    if (timeElapsedSec != null) game.timeElapsedSec = timeElapsedSec;

    if (correct) {
      game.score += 10;
    } else {
      game.score -= 15;
      game.mistakes += 1;
    }

    game.moves.push({
      cell,
      value,
      isNote: false,
      timestamp: new Date(),
    });

    let solved = false;
    if (game.board.every((v) => v != null)) {
      game.status = 'solved';
      game.completedAt = new Date();
      solved = true;

      await recordGame({
        userId: req.user._id,
        mode: 'Solo',
        difficulty: game.difficulty,
        result: 'Solved',
        timeSec: game.timeElapsedSec,
        movesCount: game.moves.length,
        mistakes: game.mistakes,
        score: game.score,
        eloDelta: 0,
        powerUpsUsed: game.powerUpsUsed,
      });
    }

    await game.save();

    return res.json({
      success: true,
      board: game.board,
      score: game.score,
      mistakes: game.mistakes,
      solved,
      status: game.status,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to record move.' });
  }
});

// POST /practice/:id/hint — reveal the correct value for a cell (consumes a power-up).
Router.post('/:id/hint', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const { cell } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game || String(game.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Game not found.' });
    }
    if (game.status !== 'active') {
      return res
        .status(400)
        .json({ success: false, message: 'Game is not active.' });
    }
    if (game.powerUpsUsed >= game.powerUpsTotal) {
      return res
        .status(400)
        .json({ success: false, message: 'No power-ups left.' });
    }
    if (cell < 0 || cell > 80 || game.board[cell] != null) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid cell for hint.' });
    }

    const value = game.solution[cell];
    game.board[cell] = value;
    game.powerUpsUsed += 1;
    game.moves.push({ cell, value, isNote: false, isPowerUp: true, timestamp: new Date() });

    let solved = false;
    if (game.board.every((v) => v != null)) {
      game.status = 'solved';
      game.completedAt = new Date();
      solved = true;
      await recordGame({
        userId: req.user._id,
        mode: 'Solo',
        difficulty: game.difficulty,
        result: 'Solved',
        timeSec: game.timeElapsedSec,
        movesCount: game.moves.length,
        mistakes: game.mistakes,
        score: game.score,
        eloDelta: 0,
        powerUpsUsed: game.powerUpsUsed,
      });
    }

    await game.save();

    return res.json({
      success: true,
      board: game.board,
      value,
      powerUpsUsed: game.powerUpsUsed,
      solved,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to use hint.' });
  }
});

// GET /practice/:id/resume — re-fetch an in-progress game (reconnect for practice).
Router.get('/:id/resume', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const game = await Game.findById(req.params.id);
    if (!game || String(game.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Game not found.' });
    }
    const { solution, ...safe } = game.toObject();
    return res.json({ success: true, game: safe });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to resume game.' });
  }
});

module.exports = Router;
