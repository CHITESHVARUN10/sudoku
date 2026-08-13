const mongoose = require('mongoose');

// Replace with your MongoDB URI or use process.env.MONGODB_URI
const MONGODB_URI = 'mongodb://127.0.0.1:27017/sudoku-app'; // Example URI for local MongoDB

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

connectDB();
