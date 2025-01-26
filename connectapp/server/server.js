const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Create an HTTP server and an instance of Socket.IO (unchanged)
const httpServer = require('http').createServer(app);
const io = new Server(httpServer);

// Connect to MongoDB (unchanged)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// User Schema (unchanged)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String },
  interests: [{ type: String }]
});

const User = mongoose.model('User', userSchema);

// Post Schema (unchanged)
const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Middleware (unchanged)
app.use(cors());
app.use(bodyParser.json());

// Secret key for JWT (unchanged)
const secret = process.env.JWT_SECRET || 'your_strong_jwt_secret';

// Middleware to verify JWT (unchanged)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
}

// User Registration (unchanged)
app.post('/api/register', async (req, res) => {
  // ... (unchanged registration logic)
});

// User Login (modified)
app.post('/api/login', async (req, res) => {
  try {
    // ... (existing login logic to check credentials and generate JWT)
    res.status(200).json({ message: 'Login successful', token, redirectTo: '/activity-selection' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get user profile (unchanged)
app.get('/api/users/me', authenticateToken, async (req, res) => {
  // ... (unchanged logic to fetch user profile)
});

// Create a post (unchanged)
app.post('/api/posts', authenticateToken, async (req, res) => {
  // ... (unchanged logic to create a post)
});

// Get user's posts (unchanged)
app.get('/api/users/:userId/posts', async (req, res) => {
  // ... (unchanged logic to fetch user's posts)
});

// Handle Socket.IO connections (unchanged)
io.on('connection', (socket) => {
  // ... (unchanged logic for Socket.IO connections)
});

// Activity selection route (new)
app.get('/activity-selection', (req, res) => {
  // Replace with your logic to fetch or generate activity options
  const activityOptions = [
    { name: 'Go for a hike' },
    { name: 'Have a picnic in the park' },
    { name: 'Visit a museum' },
    { name: 'Go stargazing' },
    { name: 'Have a game night' },
  ];
  res.render('activity-selection', { activityOptions }); // Assuming you have an
