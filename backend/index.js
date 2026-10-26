// Load environment variables BEFORE any other module reads process.env —
// session.js/socket.js read NODE_ENV, SECRET_KEY and MONGODB_URI at require
// time, so dotenv must run first.
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');

// Enable trust proxy for cloud platforms (Render, Railway, Heroku)
app.set('trust proxy', 1);
const { sessionMiddleware, passport } = require('./middleware/session');
const connectDB = require('./db');
const { attachSocket } = require('./services/socket');

const PORT = process.env.PORT || 5000;

app.use(sessionMiddleware);

// Passport init + session (needed for req.user / login persistence)
app.use(passport.initialize());
app.use(passport.session());

// Standard Express Middlewares
// CORS: reflect ANY origin by default so the API works from dynamic IPs
// (EC2 instances that stop/start) and plain-HTTP frontends. Set CORS_ORIGIN
// to a comma-separated allowlist if a deployment ever needs locking down.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// API Routes
app.use('/auth/user', require('./routes/auth/user'));
app.use('/rooms', require('./routes/rooms'));
app.use('/stats', require('./routes/stats'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/daily', require('./routes/daily'));
app.use('/practice', require('./routes/practice'));
app.use('/matches', require('./routes/matches'));

// Fallback Route for Undefined Enpoints (404)
// app.use((req, res, next) => {
//   res.status(404);
//   const error = new Error(`Not Found - ${req.originalUrl}`);
//   next(error);
// });

// Centralized Error Handler Middleware
// app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start the server (HTTP + WebSocket on the same port)
const server = http.createServer(app);
attachSocket(server);

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
