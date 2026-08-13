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
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

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
