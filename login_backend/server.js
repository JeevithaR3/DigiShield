const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./models/user'); // Match casing exactly

const app = express();
const PORT = 5500;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/digiShieldAuth', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Signup route
app.post('/signup', async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('Email already registered.');

    const newUser = new User({ username, email, phone, password });
    await newUser.save();

    res.status(201).send('User registered successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).send('Invalid email or password.');
    }

    res.send('Login successful!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
