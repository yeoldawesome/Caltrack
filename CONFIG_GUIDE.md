# Configuration Guide

This file explains all configuration points for running Caltrack (web + mobile).

## 🔧 Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` folder:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/caltrack

# Server Port
PORT=4000

# JWT Secret (for mobile authentication)
JWT_SECRET=your-super-secret-key-change-this-in-production

# CORS Origins (optional, for deployment)
FRONTEND_ORIGIN=https://yourdomain.com
MOBILE_ORIGIN=https://yourapp.com
```

### Frontend (.env.local)

Create a `.env.local` file in the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:4000
```

## 📱 Mobile App Configuration

The mobile app requires **manual configuration** because it can't use `localhost` (your iPhone can't access your computer's localhost).

### Find Your Computer's IP

**Windows (PowerShell):**
```powershell
ipconfig
# Look for: IPv4 Address: 192.168.1.XXX
```

**Mac (Terminal):**
```bash
ifconfig | grep inet
# Look for: inet 192.168.1.XXX
```

**Linux (Terminal):**
```bash
hostname -I
```

### Update These 4 Files

Replace `http://localhost:4000` with `http://YOUR_IP:4000`:

**1. `mobile/screens/AuthScreen.js` (line ~12)**
```javascript
const API_BASE = 'http://192.168.1.100:4000';  // ← Change this
```

**2. `mobile/screens/HomeScreen.js` (line ~10)**
```javascript
const API_BASE = 'http://192.168.1.100:4000';  // ← Change this
```

**3. `mobile/screens/HistoryScreen.js` (line ~9)**
```javascript
const API_BASE = 'http://192.168.1.100:4000';  // ← Change this
```

**4. `mobile/screens/ProfileScreen.js` (line ~8)**
```javascript
const API_BASE = 'http://192.168.1.100:4000';  // ← Change this
```

## 🌐 API Endpoints

All API requests use this base URL (set in code):

### Web
- Base URL: `http://localhost:4000`
- Authentication: Session cookies

### Mobile  
- Base URL: `http://YOUR_IP:4000` (must match your computer)
- Authentication: JWT Bearer tokens

### Available Endpoints

```
Authentication:
  POST   /auth/login
  POST   /auth/signup
  POST   /auth/logout
  GET    /auth/user

Entries:
  GET    /api/entries
  GET    /api/entries/:date
  GET    /api/entries/month/:year/:month
  POST   /api/entries
  PUT    /api/entry/:id
  DELETE /api/entry/:id

Profile:
  PUT    /api/profile/username
  PUT    /api/profile/password
  PUT    /api/profile/picture

Settings:
  GET    /api/calorie-limit
  POST   /api/calorie-limit

Favorites:
  GET    /api/favorites
  POST   /api/favorites
  DELETE /api/favorites/:id
```

## 🗄️ Database Setup

### MongoDB Atlas (Cloud - Recommended)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free
3. Create a cluster
4. Create a database user
5. Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)
6. Save as `MONGO_URI` in `.env`

### MongoDB Local (Optional)

Install MongoDB locally and use:
```env
MONGO_URI=mongodb://localhost:27017/caltrack
```

## 📱 iOS Simulator Setup (Mac Only)

### Install Xcode

```bash
xcode-select --install
# or download from App Store
```

### Run iOS Simulator

```bash
cd mobile
npm run ios
```

The simulator will open automatically.

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a random, long string
- [ ] Set `MONGO_URI` to production database
- [ ] Enable HTTPS on backend
- [ ] Add `FRONTEND_ORIGIN` and `MOBILE_ORIGIN` for production
- [ ] Never commit `.env` file to git
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB IP whitelist
- [ ] Test authentication thoroughly

## 🚀 Deployment

### Backend Deployment

Supported platforms:
- Heroku
- Railway
- Render  
- AWS Lambda
- DigitalOcean

Set environment variables on the platform, don't commit `.env`.

### Frontend Deployment

```bash
cd frontend
npm run build
# Deploy the 'build' folder to Vercel, Netlify, or GitHub Pages
```

Update `.env`:
```env
REACT_APP_API_URL=https://api.yourdomain.com
```

### Mobile Deployment

```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform ios
# Follow prompts to submit to App Store
```

Or see [MOBILE_SETUP.md](./MOBILE_SETUP.md#building-for-production).

## 🧪 Testing Configuration

For local development, use these settings:

```env
# Backend (.env)
MONGO_URI=mongodb+srv://test:test@cluster.mongodb.net/caltrack-dev
PORT=4000
JWT_SECRET=test-secret-key

# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:4000

# Mobile (in code)
const API_BASE = 'http://192.168.1.100:4000';
```

## 📊 Troubleshooting

### Backend won't start
```
Error: Cannot connect to MongoDB
→ Check MONGO_URI is correct
→ Check MongoDB cluster is running
→ Check IP whitelist in MongoDB Atlas
```

### Web app can't reach backend
```
CORS Error / Connection refused
→ Check backend is running on port 4000
→ Refresh page
→ Check firewall settings
```

### Mobile app can't reach backend
```
Cannot connect to 192.168.1.X:4000
→ Update API_BASE to correct IP
→ Check both devices on same WiFi
→ Firewall may block connections
→ Try mobile hotspot from PC (not WiFi router)
```

### Port 4000 already in use
```bash
# Find what's using port 4000
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Kill the process or use different port
PORT=5000 npm start
```

## 🔄 Switching Between Development & Production

### For Development
```bash
# Keep these at localhost
REACT_APP_API_URL=http://localhost:4000
const API_BASE = 'http://192.168.x.x:4000';  # Local IP
```

### For Production
```bash
# Update to production server
REACT_APP_API_URL=https://api.caltrack.com
const API_BASE = 'https://api.caltrack.com';  # Remove protocol/port
```

---

Need help? See [MOBILE_SETUP.md](./MOBILE_SETUP.md) or [README.md](./README.md)!
