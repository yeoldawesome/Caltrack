
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcrypt';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_ORIGIN // for deployment, set this env var
].filter(Boolean);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});
app.use(bodyParser.json({ limit: '10mb' }));
app.use(session({
  secret: 'caltrack_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    sameSite: 'lax'
  }
}));

// MongoDB Atlas connection
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  password: String,
  profilePic: { type: String, default: '' } // URL or base64
});
const EntrySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: String,
  calories: Number,
  food: String,
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 }
});
const CalorieLimitSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, calorieLimit: { type: Number, default: 2000 } });
const FavoriteSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, food: String, details: mongoose.Schema.Types.Mixed });

const User = mongoose.model('User', UserSchema);
const Entry = mongoose.model('Entry', EntrySchema);
const CalorieLimit = mongoose.model('CalorieLimit', CalorieLimitSchema);
const Favorite = mongoose.model('Favorite', FavoriteSchema);

// Auth helpers
function ensureAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Caltrack backend running!' });
});

// Signup (username or email required)
app.post('/auth/signup', async (req, res) => {
  const { email, username, password, profilePic } = req.body;
  if ((!email && !username) || !password) return res.status(400).json({ error: 'Username or email and password required' });
  if (email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ error: 'Email already registered' });
  }
  if (username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ email, username, password: hash, profilePic });
  await user.save();
  req.session.userId = user._id;
  res.json({ user: { id: user._id, email: user.email, username: user.username, profilePic: user.profilePic } });
});

// Login (by email or username)
app.post('/auth/login', async (req, res) => {
  const { email, username, password } = req.body;
  if ((!email && !username) || !password) return res.status(400).json({ error: 'Username/email and password required' });
  const user = email
    ? await User.findOne({ email })
    : await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });
  req.session.userId = user._id;
  res.json({ user: { id: user._id, email: user.email, username: user.username, profilePic: user.profilePic } });
});

// Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Get current user
app.get('/auth/user', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ user: null });
  }
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.json({ user: null });
    res.json({ user: { id: user._id, email: user.email, username: user.username, profilePic: user.profilePic } });
  } catch (err) {
    res.json({ user: null });
  }
});
// Update username
app.post('/auth/update-username', ensureAuth, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const existing = await User.findOne({ username });
  if (existing && String(existing._id) !== String(req.session.userId)) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  const user = await User.findByIdAndUpdate(req.session.userId, { username }, { new: true });
  res.json({ success: true, username: user.username });
});

// Update password
app.post('/auth/update-password', ensureAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Both old and new password required' });
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return res.status(400).json({ error: 'Old password incorrect' });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true });
});

// Update profile picture
app.post('/auth/update-profile-pic', ensureAuth, async (req, res) => {
  const { profilePic } = req.body;
  if (!profilePic) return res.status(400).json({ error: 'Profile picture required' });
  const user = await User.findByIdAndUpdate(req.session.userId, { profilePic }, { new: true });
  res.json({ success: true, profilePic: user.profilePic });
});
// MIGRATION: Add username/profilePic to existing users if missing
async function migrateUsers() {
  const users = await User.find({});
  for (const user of users) {
    let changed = false;
    if (!user.username) {
      user.username = user.email ? user.email.split('@')[0] : `user${user._id}`;
      changed = true;
    }
    if (user.profilePic === undefined) {
      user.profilePic = '';
      changed = true;
    }
    if (changed) await user.save();
  }
}
migrateUsers();

// Calorie limit endpoints
app.get('/api/calorie-limit', ensureAuth, async (req, res) => {
  let limit = await CalorieLimit.findOne({ userId: req.session.userId });
  if (!limit) {
    limit = new CalorieLimit({ userId: req.session.userId, calorieLimit: 2000 });
    await limit.save();
  }
  res.json({ calorieLimit: limit.calorieLimit });
});
app.post('/api/calorie-limit', ensureAuth, async (req, res) => {
  const { calorieLimit } = req.body;
  if (!calorieLimit || isNaN(calorieLimit)) {
    return res.status(400).json({ error: 'Invalid calorie limit' });
  }
  let limit = await CalorieLimit.findOneAndUpdate(
    { userId: req.session.userId },
    { calorieLimit: Number(calorieLimit) },
    { new: true, upsert: true }
  );
  res.json({ success: true, calorieLimit: limit.calorieLimit });
});

// Entries endpoints (CRUD)
app.get('/api/entries', ensureAuth, async (req, res) => {
  const userEntries = await Entry.find({ userId: req.session.userId });
  // Map backend fields to include name, protein, carbs, fat for frontend compatibility
  const mappedEntries = userEntries.map(e => ({
    ...e.toObject(),
    name: e.food || '',
    protein: e.protein ?? '',
    carbs: e.carbs ?? '',
    fat: e.fat ?? ''
  }));
  res.json(mappedEntries);
});
app.post('/api/entry', ensureAuth, async (req, res) => {
  let { date, calories, food, protein, carbs, fat } = req.body;
  if (!calories || !food) return res.status(400).json({ error: 'Missing fields' });
  if (!date) date = new Date().toISOString();
  const entry = new Entry({
    userId: req.session.userId,
    date,
    calories,
    food,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0
  });
  await entry.save();
  res.status(201).json(entry);
});
app.put('/api/entry/:id', ensureAuth, async (req, res) => {
  const { id } = req.params;
  const entry = await Entry.findOneAndUpdate(
    { _id: id, userId: req.session.userId },
    req.body,
    { new: true }
  );
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
});
app.delete('/api/entry/:id', ensureAuth, async (req, res) => {
  const { id } = req.params;
  const result = await Entry.deleteOne({ _id: id, userId: req.session.userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json({ success: true });
});

// Favorites endpoints (CRUD)
app.get('/api/favorites', ensureAuth, async (req, res) => {
  const favs = await Favorite.find({ userId: req.session.userId });
  res.json(favs);
});
app.post('/api/favorites', ensureAuth, async (req, res) => {
  const { food, details } = req.body;
  if (!food) return res.status(400).json({ error: 'Missing food' });
  const fav = new Favorite({ userId: req.session.userId, food, details });
  await fav.save();
  res.status(201).json(fav);
});
app.delete('/api/favorites/:id', ensureAuth, async (req, res) => {
  const { id } = req.params;
  const result = await Favorite.deleteOne({ _id: id, userId: req.session.userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Favorite not found' });
  res.json({ success: true });
});
//A

// Get recent entries for the logged-in user
app.get('/api/recent', ensureAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const recentEntries = await Entry.find({ userId: req.session.userId })
      .sort({ date: -1, _id: -1 })
      .limit(limit);
    // Map backend fields to include name, protein, carbs, fat for frontend compatibility
    const mappedEntries = recentEntries.map(e => ({
      ...e.toObject(),
      name: e.food || '',
      protein: e.protein ?? '',
      carbs: e.carbs ?? '',
      fat: e.fat ?? ''
    }));
    res.json(mappedEntries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent entries' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
