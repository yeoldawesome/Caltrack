import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import bcrypt from 'bcrypt';

const app = express();
const PORT = process.env.PORT || 4000;

// DB setup
const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')), { users: [], entries: [], favorites: [], calorieLimit: {}, });

const allowedOrigins = [
  'http://localhost:3000',
  'https://yeoldawesome.github.io'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  store: new SQLiteStore(),
  secret: 'caltrack_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
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
  await db.read();
  if (db.data.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = { id: db.data.users.length + 1, email, password: hash };
  db.data.users.push(user);
  await db.write();
  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email } });
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  await db.read();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });
  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email } });
});

// Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Get current user
app.get('/auth/user', async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: { id: user.id, email: user.email } });
});

// Save entry (per user)
app.post('/api/entry', ensureAuth, async (req, res) => {
  await db.read();
  let entryDate = req.body.date;
  if (!entryDate) entryDate = new Date().toISOString();
  let maxId = 0;
  db.data.entries.forEach(e => { if (e.id && Number(e.id) > maxId) maxId = Number(e.id); });
  const entry = { ...req.body, date: entryDate, id: maxId + 1, userId: req.session.userId };
  db.data.entries.push(entry);
  await db.write();
  res.json({ success: true, id: entry.id });
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
  await db.read();
  const userEntries = (db.data.entries || []).filter(e => e.userId === req.session.userId);
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
