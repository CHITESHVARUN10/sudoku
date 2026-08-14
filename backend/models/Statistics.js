const mongoose = require('mongoose');

const { Schema } = mongoose;

const difficultyCountSchema = new Schema(
  {
    easy: { type: Number, default: 0, min: 0 },
    medium: { type: Number, default: 0, min: 0 },
    hard: { type: Number, default: 0, min: 0 },
    expert: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const trendPointSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    avgTimeSec: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const statisticsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },
    wins: {
      type: Number,
      default: 0,
      min: 0,
    },
    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    avgTimeSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    difficultyBreakdown: {
      type: difficultyCountSchema,
      default: () => ({}),
    },
    // Per-day average solve times for the Solve Time Trend chart
    solveTimeTrend: {
      type: [trendPointSchema],
      default: [],
    },
    // Elo snapshots over time (for the elo history chart).
    eloHistory: {
      type: [
        new Schema(
          {
            date: { type: Date, required: true },
            elo: { type: Number, required: true, min: 0 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Statistics', statisticsSchema);
