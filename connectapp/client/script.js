const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const postBtn = document.getElementById('postBtn');
const postContentInput = document.getElementById('postContent');
const messages = document.getElementById('messages');
const userProfileDiv = document.getElementById('userProfile');

const registerUser = async () => {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      
You're absolutely right! There's a missing closing single quote in the `app.get('/api/users/:userId/posts', ...)` route. 

Here's the corrected `server.js`:

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB 
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String },
  // ... other fields as needed
});

const User = mongoose.model('User', userSchema);

// Post Schema
const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
});

const Post = mongoose.model('Post', postSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Secret key for JWT
const secret = process.env.JWT_SECRET || 'your_strong_jwt_secret';

// Middleware to verify JWT 
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user; // Attach user information to the request object
    next();
  });
}

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate user input (optional)
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // Generate JWT
    const token = jwt.sign({ userId: newUser._id }, secret, { expiresIn: '365d' });

    res.status(201).json({ message: 'User registered successfully', token }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate user input (optional)
    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare hashed passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '365d' });

    res.status(200).json({ message: 'Login successful', token }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get user profile
app.get('/api/users/me', authenticateToken, async (req, res) => { 
  try {
    const user = await User.findById(req.user._id); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Create a post
app.post('/api/posts', authenticateToken, async (req, res) => { 
  try {
    const { content } = req.body;
    const newPost = new Post({ user: req.user._id, content }); 
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Get user's posts
app.get('/api/users/:userId/posts', async (req, res) => { 
  try {
    const posts = await Post.find({ user: req.params.userId }).populate('user'); 
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});