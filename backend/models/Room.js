const mongoose = require('mongoose');

const { Schema } = mongoose;

const roomSchema = new Schema(
  {
    // Shareable invite code, e.g. "SD-882-QX"
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]{6,16}$/, 'Room code must be 6-16 uppercase alphanumeric characters, optionally hyphenated'],
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Medium',
    },
    // The clue count chosen by the host (the difficulty band value).
    clueCount: {
      type: Number,
      min: 17,
      max: 40,
      default: 33,
    },
    // Max power-ups per player; 0 = disabled.
    powerUpsPerPlayer: {
      type: Number,
      min: 0,
      max: 3,
      default: 3,
    },
    // Chess clock minutes per player; 0 = no timer.
    timerMinPerPlayer: {
      type: Number,
      min: 0,
      max: 15,
      default: 0,
    },
    status: {
      type: String,
      enum: ['waiting', 'full', 'started', 'cancelled'],
      default: 'waiting',
    },
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ status: 1, createdAt: -1 });
roomSchema.index({ host: 1, status: 1 });
// Auto-remove rooms once they expire (5 minutes after creation).
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Room', roomSchema);
