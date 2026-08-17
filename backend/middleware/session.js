// Shared Express session + passport middleware, usable by both the HTTP app
// and Socket.IO (io.engine.use) so socket handlers can read req.session.
const session = require('express-session');
const connectMongo = require('connect-mongo');
const passport = require('passport');

const MongoStore = connectMongo.MongoStore || connectMongo.default;

const sessionMiddleware = session({
  secret: process.env.SECRET_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl:
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/sudoku-app',
    touchAfter: 24 * 3600, // reduce writes (seconds)
  }),
  cookie: {
    // Secure cookies only over HTTPS; the .env sets NODE_ENV=production for
    // local dev, so don't blindly force secure or local login breaks.
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

module.exports = { sessionMiddleware, passport };
