const express = require('express');
const Router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  'user-local-login',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // select:false on the password field — must explicitly include it.
        const user = await User.findOne({ email }).select('+password');
        if (!user) return done(null, false, { message: 'Invalid email or password.' });
        const ok = await user.comparePassword(password);
        if (!ok) return done(null, false, { message: 'Invalid email or password.' });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

Router.post('/login', (req, res, next) => {
  passport.authenticate('user-local-login', (err, user) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: 'An error occurred during login.' });
    }
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email or password.' });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res
          .status(500)
          .json({ success: false, message: 'Login failed.' });
      }
      return res.json({
        success: true,
        message: 'Login successful.',
        user: { _id: user._id, name: user.name, email: user.email, elo: user.elo, avatarInitials: user.avatarInitials },
      });
    });
  })(req, res, next);
});

Router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, email and password are required.' });
    }
    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 8 characters.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists.' });
    }
    // NOTE: no manual bcrypt.hash here — the model's pre-save hook hashes it.
    const newUser = await User.create({ name, email, password });
    // Establish the session immediately so subsequent authed routes work.
    req.logIn(newUser, (loginErr) => {
      if (loginErr) {
        return res
          .status(500)
          .json({ success: false, message: 'Registered but login failed.' });
      }
      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        user: { _id: newUser._id, name: newUser.name, email: newUser.email, elo: newUser.elo },
      });
    });
  } catch (err) {
    console.error('Error during registration:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Error has occurred during registration.' });
  }
});

Router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  return res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      elo: req.user.elo,
      avatarInitials: req.user.avatarInitials,
      role: req.user.role,
    },
  });
});

Router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// Authed: change password (verify old, set new).
Router.post('/change-password', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: 'New password must be at least 8 characters.' });
    }
    const user = await User.findById(req.user._id).select('+password');
    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      return res
        .status(400)
        .json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword; // pre-save hook re-hashes
    await user.save();
    return res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to change password.' });
  }
});

// Authed: update profile (name / avatar initials).
Router.put('/profile', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const { name, avatarInitials } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (avatarInitials) user.avatarInitials = avatarInitials;
    await user.save();
    return res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, elo: user.elo, avatarInitials: user.avatarInitials },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update profile.' });
  }
});

// Forgot password: generate a reset token, store hashed, log the link (dev).
Router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond success to avoid account enumeration.
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();
      // Dev-only: log the reset link (swap for real email/nodemailer in prod).
      console.log(`[dev] Password reset link: http://localhost:5173/reset-password/${token}`);
    }
    return res.json({ success: true, message: 'If an account exists, a reset link was sent.' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to send reset link.' });
  }
});

// Reset password with a valid, unexpired token.
Router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid token or password (min 8 chars).' });
    }
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Reset link is invalid or has expired.' });
    }
    user.password = password; // pre-save hook re-hashes
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to reset password.' });
  }
});

module.exports = Router;
