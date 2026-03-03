# Caltrack iOS App - Installation & Setup Guide

## Overview

Your Caltrack app has been successfully converted to React Native! This guide will help you run it on an iPhone.

## What's New

The app now has two versions:
- **Web**: React (existing) - runs in browser at `localhost:3000`
- **iOS**: React Native + Expo (new) - runs natively on iPhone in the `mobile/` folder

Both share the same backend, so you only need to run the backend once.

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Expo CLI** - Install globally:
   ```bash
   npm install -g expo-cli
   ```
3. **iPhone** - Physical device or iOS simulator (comes with Xcode on Mac)

## Quick Start (5 minutes)

### Step 1: Start the Backend

The backend serves both the web and mobile apps.

```bash
cd backend
npm install  # if not already done
npm start
```

You should see: `Server running on port 4000`

### Step 2: Get Your Machine's IP Address

The mobile app needs to connect to your backend. Find your local IP:

**Windows (PowerShell):**
```powershell
ipconfig
# Look for "IPv4 Address:" (usually starts with 192.168.x.x)
```

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

Example result: `192.168.1.100`

### Step 3: Update API Base URL

Edit the files in the `mobile/` folder and update `API_BASE`:

**Files to update:**
- `mobile/screens/AuthScreen.js`
- `mobile/screens/HomeScreen.js`
- `mobile/screens/HistoryScreen.js`
- `mobile/screens/ProfileScreen.js`

Change:
```javascript
const API_BASE = 'http://localhost:4000';  // ❌ Won't work on iPhone
```

To (using your IP from Step 2):
```javascript
const API_BASE = 'http://192.168.1.100:4000';  // ✅ Use your actual IP
```

### Step 4: Install Mobile App Dependencies

```bash
cd mobile
npm install
```

This downloads React Native, Expo, and all required libraries.

### Step 5: Start the App

**Option A: iOS Simulator (Mac only)**
```bash
npm run ios
```

This automatically opens the iOS simulator.

**Option B: Physical iPhone (Recommended)**
```bash
npm start
```

You'll see a QR code. On your iPhone:
1. Install **Expo Go** from the App Store
2. Open Expo Go
3. Scan the QR code
4. Wait for the app to load

**Option C: Using Yarn**
```bash
cd mobile
yarn start
ios
```

## Troubleshooting

### "Cannot connect to backend"
- ❌ Check: Are you using `localhost`? 
- ✅ Fix: Use your machine's IP address (e.g., `192.168.1.100`)
- ✅ Check: Is the backend running on port 4000?

### "Camera not working"
- ✅ Grant camera permissions when prompted
- ✅ For simulator: Camera may not work, try physical device

### "Blank white screen"
- Run: `npm start -- --clear`
- Restart the app
- Clear Expo Go cache: Settings > Apps > Expo Go > Clear Cache

### "Module not found"
- Run: `cd mobile && npm install`

### "Cannot find Xcode" (Mac)
- Install Xcode: `xcode-select --install`
- Or download from App Store

## Building for Production

When ready to submit to the App Store:

### Option 1: EAS Build (Recommended)
```bash
npm install -g eas-cli
cd mobile
eas login  # Create free EAS account
eas build:configure
eas build --platform ios
```

### Option 2: Local Build
```bash
cd mobile
npm run build:local
# Then open in Xcode and build
```

## File Structure

```
mobile/
├── App.js                 # Main navigation
├── screens/
│   ├── AuthScreen.js      # Login/Signup
│   ├── HomeScreen.js      # Daily logging
│   ├── HistoryScreen.js   # History view
│   └── ProfileScreen.js   # Profile & settings
├── app.json               # Expo config
├── package.json
└── README.md
```

## Backend Configuration

The backend in `backend/index.js` has been updated to support:
- ✅ JWT tokens (for mobile auth)
- ✅ CORS for mobile origins
- ✅ New mobile-friendly API endpoints

### Environment Variables

Create a `.env` file in the `backend/` folder:

```env
MONGO_URI=your_mongodb_connection_string
PORT=4000
JWT_SECRET=your_secret_key_here
```

## Features Working on iOS

- ✅ User authentication
- ✅ Log calorie entries with macros
- ✅ Barcode scanning (physical device)
- ✅ Weekly/monthly history
- ✅ Profile management
- ✅ Dark mode UI
- ✅ Daily calorie limits
- ✅ Profile pictures

## Next Steps

1. **Customize icons** - Replace images in `mobile/assets/`
2. **Customize colors** - Edit color values in screen files
3. **Add food database** - Integrate a barcode/nutrition API
4. **Deploy backend** - Use Heroku, AWS, or similar
5. **Submit to App Store** - Follow Apple's app submission process

## Useful Commands

```bash
# Start development
npm start

# iOS simulator
npm run ios

# Build for App Store
npm run build

# Clear cache
npm start -- --clear

# Show logs
npm start -- --verbose
```

## Support Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Go](https://expo.dev/client)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## Backend Requirements

Your REST API must support:

```
POST /auth/login           # Returns: { user, token }
POST /auth/signup          # Returns: { user, token }
POST /auth/logout          # Clear session
GET  /api/entries/:date    # Get entries for a date
GET  /api/entries/month/:year/:month  # Get month entries
POST /api/entries          # Create entry
PUT  /api/profile/username # Update username
PUT  /api/profile/password # Update password
PUT  /api/profile/picture  # Update profile pic
GET  /api/calorie-limit    # Get daily limit
POST /api/calorie-limit    # Set daily limit
```

All requests require `Authorization: Bearer {token}` header.

---

**Need help?** Check the README files in each folder for more details!
