const mongoose = require('mongoose');

const { Schema } = mongoose;

const leaderboardEntrySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    period: {
      type: String,
      enum: ['all-time', 'week', 'month'],
      default: 'all-time',
    },
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
    winRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Current elo snapshot (leaderboard ranks by this).
    elo: {
      type: Number,
      default: 1200,
      min: 0,
    },
    gamesPlayed: {
      type: Number,
      min: 0,
      default: 0,
    },
    currentStreak: {
      type: Number,
      min: 0,
      default: 0,
    },
    bestStreak: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One entry per user per leaderboard period
leaderboardEntrySchema.index({ user: 1, period: 1 }, { unique: true });
leaderboardEntrySchema.index({ period: 1, rank: 1 });

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);
