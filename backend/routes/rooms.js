const express = require('express');
const Room = require('../models/Room');
const { generateRoomCode } = require('../services/socket');

const Router = express.Router();

const ROOM_TTL_MS = 5 * 60 * 1000; // room code active for 5 minutes

// POST /rooms — host creates a room. Host is auto-added (no code entry).
// Body: { difficulty, clueCount, powerUps, timerMin }
Router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const { difficulty, clueCount, powerUps, timerMin } = req.body || {};

    // Validate the clue count is within a legal band.
    const clue = Number(clueCount);
    if (!Number.isInteger(clue) || clue < 17 || clue > 40) {
      return res
        .status(400)
        .json({ success: false, message: 'clueCount must be between 17 and 40.' });
    }
    const pu = Math.min(3, Math.max(0, Number(powerUps) || 0));
    const tm = Math.min(15, Math.max(0, Number(timerMin) || 0));

    const code = generateRoomCode();
    const room = await Room.create({
      code,
      host: req.user?._id, // host auto-joins; passport session provides req.user
      guest: null,
      difficulty: difficulty || 'Medium',
      clueCount: clue,
      powerUpsPerPlayer: pu,
      timerMinPerPlayer: tm,
      status: 'waiting',
      expiresAt: new Date(Date.now() + ROOM_TTL_MS),
    });

    return res.status(201).json({ success: true, code, room });
  } catch (err) {
    console.error('POST /rooms error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create room.' });
  }
});

// GET /rooms/:code — room status/players/settings (waiting-room poll).
Router.get('/:code', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code }).populate(
      'host',
      'name elo'
    ).populate('guest', 'name elo');
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found.' });
    }
    if (room.expiresAt && new Date(room.expiresAt) < new Date()) {
      room.status = 'cancelled';
      await room.save();
    }
    return res.json({ success: true, room });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch room.' });
  }
});

// POST /rooms/:code/join — guest joins; sets guest, status -> full.
Router.post('/:code/join', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const room = await Room.findOne({ code: req.params.code });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found.' });
    }
    if (room.status === 'cancelled' || room.status === 'started') {
      return res
        .status(400)
        .json({ success: false, message: 'Room is not joinable.' });
    }
    if (room.expiresAt && new Date(room.expiresAt) < new Date()) {
      room.status = 'cancelled';
      await room.save();
      return res
        .status(400)
        .json({ success: false, message: 'Room expired.' });
    }
    if (room.guest && String(room.guest) !== String(req.user._id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Room is already full.' });
    }
    if (String(room.host) === String(req.user._id)) {
      return res
        .status(400)
        .json({ success: false, message: 'You cannot join your own room.' });
    }

    room.guest = req.user._id;
    room.status = 'full';
    await room.save();

    return res.json({ success: true, room });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to join room.' });
  }
});

// DELETE /rooms/:code — host cancels the room.
Router.delete('/:code', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found.' });
    }
    room.status = 'cancelled';
    await room.save();
    return res.json({ success: true });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to cancel room.' });
  }
});

module.exports = Router;
