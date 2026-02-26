import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import bcrypt from 'bcrypt';

const app = express();
const PORT = process.env.PORT || 4000;

// DB setup
const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')), { users: [], entries: [] });

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'caltrack_secret', resave: false, saveUninitialized: false }));

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

// Save entry

// Allow anyone to save an entry (no auth)
app.post('/api/entry', async (req, res) => {
  await db.read();
  let entryDate = req.body.date;
  if (!entryDate) entryDate = new Date().toISOString();
  // Assign a unique id
  let maxId = 0;
  db.data.entries.forEach(e => { if (e.id && Number(e.id) > maxId) maxId = Number(e.id); });
  const entry = { ...req.body, date: entryDate, id: maxId + 1 };
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

// Allow anyone to get all entries (no auth)
app.get('/api/entries', async (req, res) => {
  await db.read();
  res.json(db.data.entries);
});

// Daily calorie limit endpoints
app.get('/api/calorie-limit', async (req, res) => {
  await db.read();
  res.json({ calorieLimit: db.data.calorieLimit || 2000 }); // Default 2000 if not set
});

app.post('/api/calorie-limit', async (req, res) => {
  const { calorieLimit } = req.body;
  if (!calorieLimit || isNaN(calorieLimit)) {
    return res.status(400).json({ error: 'Invalid calorie limit' });
  }
  await db.read();
  db.data.calorieLimit = Number(calorieLimit);
  await db.write();
  res.json({ success: true, calorieLimit: db.data.calorieLimit });
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
    // Ensure calorieLimit exists
    if (typeof db.data.calorieLimit === 'undefined') {
      db.data.calorieLimit = 2000;
      await db.write();
    }
  })();
  console.log(`Server running on port ${PORT}`);
});
