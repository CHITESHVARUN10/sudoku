const mongoose = require('mongoose');

const { Schema } = mongoose;

const gameHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    game: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      default: null,
    },
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    mode: {
      type: String,
      enum: ['Solo', 'Multiplayer', 'Daily', 'Archive'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      required: true,
    },
    opponent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    opponentName: {
      type: String,
      trim: true,
      default: null,
    },
    result: {
      type: String,
      enum: ['Win', 'Loss', 'Solved', 'Abandoned'],
      required: true,
    },
    // Duration in seconds; frontend displays as MM:SS
    timeSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    movesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    mistakes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Points earned in the game (solo or multiplayer scoring).
    score: {
      type: Number,
      default: 0,
    },
    // Elo change applied (multiplayer only).
    eloDelta: {
      type: Number,
      default: 0,
    },
    powerUpsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

gameHistorySchema.index({ user: 1, createdAt: -1 });
gameHistorySchema.index({ user: 1, mode: 1, createdAt: -1 });

module.exports = mongoose.model('GameHistory', gameHistorySchema);
