const mongoose = require('mongoose');

const { Schema } = mongoose;

const cellSchema = {
  type: Number,
  min: 1,
  max: 9,
  default: null,
};

const dailyPuzzleSchema = new Schema(
  {
    // The calendar date this puzzle is published for (YYYY-MM-DD)
    date: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    grid: {
      type: [cellSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length === 81,
        message: 'Grid must contain exactly 81 cells',
      },
    },
    solution: {
      type: [cellSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length === 81,
        message: 'Solution must contain exactly 81 cells',
      },
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Medium',
    },
    seed: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

dailyPuzzleSchema.index({ date: 1 });
dailyPuzzleSchema.index({ difficulty: 1, date: -1 });

module.exports = mongoose.model('DailyPuzzle', dailyPuzzleSchema);
