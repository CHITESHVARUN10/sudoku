const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');

// import apiRoutes from './routes/api.js';
// import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();


const PORT = process.env.PORT || 5000;


app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
// Standard Express Middlewares
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// API Routes
// app.use('/api/v1', apiRoutes);

// Fallback Route for Undefined Enpoints (404)
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

// Centralized Error Handler Middleware
// app.use(errorHandler);


app.get('/', (req, res) => {
  res.send('API is running...');
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
