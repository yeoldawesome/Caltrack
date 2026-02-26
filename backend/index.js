const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 4000;

// DB setup
const db = new Low(new JSONFile(path.join(__dirname, 'db.json')), { users: [], entries: [] });

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
  const entry = { ...req.body, date: new Date().toISOString() };
  db.data.entries.push(entry);
  await db.write();
  res.json({ success: true });
});

// Get entries

// Allow anyone to get all entries (no auth)
app.get('/api/entries', async (req, res) => {
  await db.read();
  res.json(db.data.entries);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
