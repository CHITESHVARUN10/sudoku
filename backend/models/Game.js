const mongoose = require('mongoose');

const { Schema } = mongoose;

const cellSchema = {
  type: Number,
  min: 1,
  max: 9,
  default: null,
};

const noteSetSchema = {
  type: [Number],
  default: [],
};

const moveSchema = new Schema(
  {
    cell: {
      type: Number,
      required: true,
      min: 0,
      max: 80,
    },
    value: {
      type: Number,
      min: 1,
      max: 9,
      default: null, // null = erase
    },
    prevValue: {
      type: Number,
      min: 1,
      max: 9,
      default: null,
    },
    isNote: {
      type: Boolean,
      default: false,
    },
    correct: {
      type: Boolean,
      default: null,
    },
    delta: {
      type: Number,
      default: 0,
    },
    isPowerUp: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const gameSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Medium',
    },
    // 81-cell flat arrays (row-major, index 0..80)
    board: {
      type: [cellSchema],
      validate: {
        validator: (arr) => arr.length === 81,
        message: 'Board must contain exactly 81 cells',
      },
    },
    initialBoard: {
      type: [cellSchema],
      validate: {
        validator: (arr) => arr.length === 81,
        message: 'Initial board must contain exactly 81 cells',
      },
    },
    // The full solved grid, used to validate moves / reveal hints.
    solution: {
      type: [cellSchema],
      validate: {
        validator: (arr) => arr.length === 81,
        message: 'Solution must contain exactly 81 cells',
      },
    },
    // Parallel 81-cell array; each entry is the set of pencil marks for that cell
    notes: {
      type: [noteSetSchema],
      validate: {
        validator: (arr) => arr.length === 81,
        message: 'Notes must contain exactly 81 cell entries',
      },
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'solved', 'abandoned'],
      default: 'active',
    },
    timeElapsedSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    mistakes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Solo scoring (same rules as multiplayer: correct +10, wrong -15, completion +50).
    // Negative scores are possible (wrong moves deduct), so no min floor.
    score: {
      type: Number,
      default: 0,
    },
    powerUpsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    powerUpsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    moves: {
      type: [moveSchema],
      default: [],
    },
    seed: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

gameSchema.index({ user: 1, status: 1 });
gameSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('Game', gameSchema);
