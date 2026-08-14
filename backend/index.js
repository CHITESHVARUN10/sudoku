const express = require('express');
const http = require('http');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./db');
const { attachSocket } = require('./services/socket');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(
  session({
    secret: process.env.SECRET_KEY || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Secure cookies only over HTTPS; the .env sets NODE_ENV=production for
      // local dev, so don't blindly force secure or local login breaks.
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport init + session (needed for req.user / login persistence)
app.use(passport.initialize());
app.use(passport.session());

// Standard Express Middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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
