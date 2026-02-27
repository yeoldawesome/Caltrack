import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
const SQLiteStore = connectSqlite3(session);
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// MongoDB Atlas connection
const mongoUri = "mongodb+srv://dnlonglett_db_user:45JY8GtL8ujhNY71@caltracker.6y4aqcw.mongodb.net/?appName=CalTracker";
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const UserSchema = new mongoose.Schema({ email: String, password: String });
const EntrySchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, date: String, calories: Number, food: String });
const User = mongoose.model('User', UserSchema);
const Entry = mongoose.model('Entry', EntrySchema);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

// DB setup
const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')), { users: [], entries: [], favorites: [], calorieLimit: {}, });

const allowedOrigins = [
  'http://localhost:3000',
  'https://yeoldawesome.github.io',
  'https://caltrack-8mwo.onrender.com'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: 'caltrack_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  }
}));

// Auth helpers
function ensureAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Caltrack backend running!' });
});

// Signup
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hash });
  await user.save();
  req.session.userId = user._id;
  res.json({ user: { id: user._id, email: user.email } });
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });
  req.session.userId = user._id;
  res.json({ user: { id: user._id, email: user.email } });
});

// Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Get current user
app.get('/auth/user', async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: { id: user._id, email: user.email } });
});

// Save entry (per user)
app.post('/api/entry', ensureAuth, async (req, res) => {
  let entryDate = req.body.date;
  if (!entryDate) entryDate = new Date().toISOString();
  const entry = new Entry({ ...req.body, date: entryDate, userId: req.session.userId });
  await entry.save();
  res.json({ success: true, id: entry._id });
});

// Get entries

// Delete entry by id
// Update entry by id
app.put('/api/entry/:id', async (req, res) => {
  await db.read();
  const id = req.params.id;
  console.log('PUT /api/entry/:id called with id:', id);
  console.log('All entry ids:', db.data.entries.map(e => e.id));
  let found = false;
  db.data.entries = db.data.entries.map(e => {
    if (String(e.id) === String(id)) {
      found = true;
      return { ...e, ...req.body, id: e.id };
    }
    return e;
  });
  await db.write();
  if (found) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Entry not found' });
  }
});
app.delete('/api/entry/:id', async (req, res) => {
  await db.read();
  const id = req.params.id;
  const before = db.data.entries.length;
  db.data.entries = db.data.entries.filter(e => String(e.id) !== String(id));
  const after = db.data.entries.length;
  await db.write();
  if (after < before) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Entry not found' });
  }
});

// Get entries for current user
app.get('/api/entries', ensureAuth, async (req, res) => {
  const userEntries = await Entry.find({ userId: req.session.userId });
  res.json(userEntries);
});

// Get recent entries (last N) for user
app.get('/api/recent', ensureAuth, async (req, res) => {
  await db.read();
  const limit = parseInt(req.query.limit || '10', 10);
  const entries = (db.data.entries || []).filter(e => e.userId === req.session.userId).slice().sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  }).slice(0, limit);
  res.json(entries);
});

// Favorites endpoints (per user)
app.get('/api/favorites', ensureAuth, async (req, res) => {
  await db.read();
  const userFavs = (db.data.favorites || []).filter(f => f.userId === req.session.userId);
  res.json(userFavs);
});

app.post('/api/favorites', ensureAuth, async (req, res) => {
  await db.read();
  if (!db.data.favorites) db.data.favorites = [];
  let maxId = 0;
  db.data.favorites.forEach(f => { if (f.id && Number(f.id) > maxId) maxId = Number(f.id); });
  const fav = { ...req.body, id: maxId + 1, userId: req.session.userId };
  db.data.favorites.push(fav);
  await db.write();
  res.json({ success: true, id: fav.id });
});

app.delete('/api/favorites/:id', ensureAuth, async (req, res) => {
  await db.read();
  const id = req.params.id;
  const before = (db.data.favorites || []).length;
  db.data.favorites = (db.data.favorites || []).filter(f => String(f.id) !== String(id) || f.userId !== req.session.userId);
  const after = db.data.favorites.length;
  await db.write();
  if (after < before) res.json({ success: true });
  else res.status(404).json({ error: 'Favorite not found' });
});

// Daily calorie limit endpoints (per user)
app.get('/api/calorie-limit', ensureAuth, async (req, res) => {
  await db.read();
  const userLimit = db.data.calorieLimit[req.session.userId] || 2000;
  res.json({ calorieLimit: userLimit });
});

app.post('/api/calorie-limit', ensureAuth, async (req, res) => {
  const { calorieLimit } = req.body;
  if (!calorieLimit || isNaN(calorieLimit)) {
    return res.status(400).json({ error: 'Invalid calorie limit' });
  }
  await db.read();
  db.data.calorieLimit[req.session.userId] = Number(calorieLimit);
  await db.write();
  res.json({ success: true, calorieLimit: db.data.calorieLimit[req.session.userId] });
});

app.listen(PORT, () => {
  // Migration: assign IDs to entries without one
  (async () => {
    await db.read();
    let maxId = 0;
    db.data.entries.forEach(e => { if (e.id && Number(e.id) > maxId) maxId = Number(e.id); });
    let changed = false;
    db.data.entries.forEach(e => {
      if (!e.id) {
        maxId++;
        e.id = maxId;
        changed = true;
      }
    });
    if (changed) await db.write();
    // Ensure calorieLimit exists and is an object
    if (typeof db.data.calorieLimit === 'undefined') {
      db.data.calorieLimit = {};
      await db.write();
    }
    if (typeof db.data.calorieLimit === 'number') {
      const oldLimit = db.data.calorieLimit;
      db.data.calorieLimit = {};
      (db.data.users || []).forEach(u => {
        db.data.calorieLimit[u.id] = oldLimit;
      });
      await db.write();
    }
    // Ensure favorites array exists
    if (!db.data.favorites) {
      db.data.favorites = [];
      await db.write();
    }
  })();
  console.log(`Server running on port ${PORT}`);
});
