const mongoose = require('mongoose');

const { Schema } = mongoose;

const cellSchema = {
  type: Number,
  min: 1,
  max: 9,
  default: null,
};

const moveSchema = new Schema(
  {
    player: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
    cell: {
      type: Number,
      required: true,
      min: 0,
      max: 80,
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 9,
    },
    isNote: {
      type: Boolean,
      default: false,
    },
    isPowerUp: {
      type: Boolean,
      default: false,
    },
    correct: {
      type: Boolean,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const noteSetSchema = {
  type: [Number],
  default: [],
};

const matchSchema = new Schema(
  {
    player1: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    player2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Medium',
    },
    // The clue count chosen at room creation (the difficulty band value).
    clueCount: {
      type: Number,
      min: 17,
      max: 40,
      default: 33,
    },
    // Chess clock minutes per player; 0 = no timer.
    timerMinPerPlayer: {
      type: Number,
      min: 0,
      max: 15,
      default: 0,
    },
    boards: {
      p1: {
        type: [cellSchema],
        validate: {
          validator: (arr) => !arr || arr.length === 81,
          message: 'Board must contain exactly 81 cells',
        },
      },
      p2: {
        type: [cellSchema],
        validate: {
          validator: (arr) => !arr || arr.length === 81,
          message: 'Board must contain exactly 81 cells',
        },
      },
    },
    // Legacy single board kept for migration of old docs — new matches use `boards`.
    board: {
      type: [cellSchema],
      validate: {
        validator: (arr) => !arr || arr.length === 81,
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
    // The full solved grid, used to validate moves / reveal power-ups.
    solution: {
      type: [cellSchema],
      validate: {
        validator: (arr) => arr.length === 81,
        message: 'Solution must contain exactly 81 cells',
      },
    },
    // Whose turn it is: 1 = player1, 2 = player2
    turn: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    turnNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    moveHistory: {
      type: [moveSchema],
      default: [],
    },
    scores: {
      // Negative allowed (wrong moves deduct).
      p1: { type: Number, default: 0 },
      p2: { type: Number, default: 0 },
    },
    // Wrong-move counts per player (for stats/history).
    mistakes: {
      p1: { type: Number, default: 0, min: 0 },
      p2: { type: Number, default: 0, min: 0 },
    },
    // Per-player pencil marks (81-cell arrays of note sets).
    notes: {
      p1: { type: [noteSetSchema], default: [] },
      p2: { type: [noteSetSchema], default: [] },
    },
    // Remaining power-ups per player.
    powerUpsLeft: {
      p1: { type: Number, default: 0, min: 0 },
      p2: { type: Number, default: 0, min: 0 },
    },
    // Max power-ups per player (set at room creation, 0-3).
    powerUpsMax: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    // Remaining clock seconds per player (set from timerMinPerPlayer at start).
    clocks: {
      p1: { type: Number, default: 0, min: 0 },
      p2: { type: Number, default: 0, min: 0 },
    },
    // When the last move happened (for accurate clock decrement).
    lastMoveAt: {
      type: Date,
      default: null,
    },
    // Set when a player disconnects mid-match (clock pauses for them).
    disconnectedAt: {
      p1: { type: Date, default: null },
      p2: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'abandoned'],
      default: 'waiting',
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Elo change applied on completion (positive for the winner).
    eloDelta: {
      type: Number,
      default: 0,
    },
    // Elo change applied to loser when leave penalty is asymmetric (gap-scaled).
    eloDeltaLoser: {
      type: Number,
      default: 0,
    },
    resignRequestedBy: {
      type: Number,
      enum: [1, 2, null],
      default: null,
    },
    resignRequestedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
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

matchSchema.index({ player1: 1, status: 1 });
matchSchema.index({ player2: 1, status: 1 });
matchSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Match', matchSchema);
