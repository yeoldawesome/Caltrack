
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'caltrack_jwt_secret';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.26.52.151:3000',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  process.env.FRONTEND_ORIGIN, // for deployment, set this env var
  process.env.MOBILE_ORIGIN // for iOS app origin (wildcard or specific domain)
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
  // Check session (web auth)
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Check JWT token (mobile auth)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
  
  res.status(401).json({ error: 'Not authenticated' });
}

// Helper to get user ID from session or JWT
function getUserId(req) {
  if (req.session && req.session.userId) {
    return req.session.userId;
  }
  return req.userId;
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
  
  // Generate JWT token for mobile apps
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({ 
    user: { id: user._id, email: user.email, username: user.username, profilePic: user.profilePic },
    token // For mobile apps
  });
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
  
  // Generate JWT token for mobile apps
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({ 
    user: { id: user._id, email: user.email, username: user.username, profilePic: user.profilePic },
    token // For mobile apps
  });
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
  const userId = getUserId(req);
  const existing = await User.findOne({ username });
  if (existing && String(existing._id) !== String(userId)) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  const user = await User.findByIdAndUpdate(userId, { username }, { new: true });
  res.json({ success: true, username: user.username });
});

// Update username (mobile API endpoint)
app.put('/api/profile/username', ensureAuth, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const userId = getUserId(req);
  const existing = await User.findOne({ username });
  if (existing && String(existing._id) !== String(userId)) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  const user = await User.findByIdAndUpdate(userId, { username }, { new: true });
  res.json({ success: true, username: user.username });
});

// Update password
app.post('/auth/update-password', ensureAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Both old and new password required' });
  const userId = getUserId(req);
  const user = await User.findById(userId);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return res.status(400).json({ error: 'Old password incorrect' });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true });
});

// Update password (mobile API endpoint - uses currentPassword instead of oldPassword)
app.put('/api/profile/password', ensureAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new password required' });
  const userId = getUserId(req);
  const user = await User.findById(userId);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(400).json({ error: 'Current password incorrect' });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true });
});

// Update profile picture
app.post('/auth/update-profile-pic', ensureAuth, async (req, res) => {
  const { profilePic } = req.body;
  if (!profilePic) return res.status(400).json({ error: 'Profile picture required' });
  const userId = getUserId(req);
  const user = await User.findByIdAndUpdate(userId, { profilePic }, { new: true });
  res.json({ success: true, profilePic: user.profilePic });
});

// Update profile picture (mobile API endpoint)
app.put('/api/profile/picture', ensureAuth, async (req, res) => {
  const { profilePic } = req.body;
  if (!profilePic) return res.status(400).json({ error: 'Profile picture required' });
  const userId = getUserId(req);
  const user = await User.findByIdAndUpdate(userId, { profilePic }, { new: true });
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
  const userId = getUserId(req);
  let limit = await CalorieLimit.findOne({ userId });
  if (!limit) {
    limit = new CalorieLimit({ userId, calorieLimit: 2000 });
    await limit.save();
  }
  res.json({ calorieLimit: limit.calorieLimit });
});
app.post('/api/calorie-limit', ensureAuth, async (req, res) => {
  const { calorieLimit } = req.body;
  if (!calorieLimit || isNaN(calorieLimit)) {
    return res.status(400).json({ error: 'Invalid calorie limit' });
  }
  const userId = getUserId(req);
  let limit = await CalorieLimit.findOneAndUpdate(
    { userId },
    { calorieLimit: Number(calorieLimit) },
    { new: true, upsert: true }
  );
  res.json({ success: true, calorieLimit: limit.calorieLimit });
});

// Entries endpoints (CRUD)
app.get('/api/entries', ensureAuth, async (req, res) => {
  const userId = getUserId(req);
  const userEntries = await Entry.find({ userId });
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

// Get entries for a specific date (mobile app endpoint)
app.get('/api/entries/:date', ensureAuth, async (req, res) => {
  const userId = getUserId(req);
  const { date } = req.params;
  const entries = await Entry.find({ userId, date });
  res.json(entries);
});

// Get entries for a specific month (mobile app endpoint)
app.get('/api/entries/month/:year/:month', ensureAuth, async (req, res) => {
  const userId = getUserId(req);
  const { year, month } = req.params;
  
  // Parse year and month
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  
  // Create date range for the month
  const startDate = new Date(y, m - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(y, m, 0).toISOString().split('T')[0];
  
  // Get entries within the month range
  const entries = await Entry.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
  
  res.json(entries);
});

app.post('/api/entries', ensureAuth, async (req, res) => {
  let { date, calories, food, protein, carbs, fat } = req.body;
  if (!calories) return res.status(400).json({ error: 'Calories required' });
  if (!date) date = new Date().toISOString().split('T')[0];
  
  const userId = getUserId(req);
  const entry = new Entry({
    userId,
    date,
    calories,
    food: food || 'Food entry',
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0
  });
  await entry.save();
  res.status(201).json(entry);
});

app.post('/api/entry', ensureAuth, async (req, res) => {
  let { date, calories, food, protein, carbs, fat } = req.body;
  if (!calories || !food) return res.status(400).json({ error: 'Missing fields' });
  if (!date) date = new Date().toISOString();
  
  const userId = getUserId(req);
  const entry = new Entry({
    userId,
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
  const userId = getUserId(req);
  const entry = await Entry.findOneAndUpdate(
    { _id: id, userId },
    req.body,
    { new: true }
  );
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
});

app.delete('/api/entry/:id', ensureAuth, async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  const result = await Entry.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json({ success: true });
});

// Favorites endpoints (CRUD)
app.get('/api/favorites', ensureAuth, async (req, res) => {
  const userId = getUserId(req);
  const favs = await Favorite.find({ userId });
  res.json(favs);
});
app.post('/api/favorites', ensureAuth, async (req, res) => {
  const { food, details } = req.body;
  if (!food) return res.status(400).json({ error: 'Missing food' });
  const userId = getUserId(req);
  const fav = new Favorite({ userId, food, details });
  await fav.save();
  res.status(201).json(fav);
});
app.delete('/api/favorites/:id', ensureAuth, async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  const result = await Favorite.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Favorite not found' });
  res.json({ success: true });
});

// Get recent entries for the logged-in user
app.get('/api/recent', ensureAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const limit = parseInt(req.query.limit, 10) || 10;
    const recentEntries = await Entry.find({ userId })
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
