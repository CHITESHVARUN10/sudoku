// Shared Express session + passport middleware, usable by both the HTTP app
// and Socket.IO (io.engine.use) so socket handlers can read req.session.
const session = require('express-session');
const connectMongo = require('connect-mongo');
const passport = require('passport');

const MongoStore = connectMongo.MongoStore || connectMongo.default;

const isProduction = process.env.NODE_ENV === 'production';

// Secure cookies require HTTPS. Default: on in production, off locally.
// COOKIE_SECURE=false keeps sessions working on plain-HTTP deployments
// (e.g. demo servers without a TLS certificate).
const secureCookie =
  process.env.COOKIE_SECURE != null
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction;

// Cross-site frontends (different domain/port) need SameSite=None, but
// browsers reject that combination unless the cookie is also Secure — so
// fall back to Lax whenever the cookie cannot be secure.
let sameSite = process.env.COOKIE_SAMESITE || (secureCookie ? 'none' : 'lax');
if (!secureCookie && sameSite === 'none') sameSite = 'lax';

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
    secure: secureCookie,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

module.exports = { sessionMiddleware, passport };
