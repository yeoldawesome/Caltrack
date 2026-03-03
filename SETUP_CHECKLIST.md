# 📋 Setup Checklist

Use this checklist to ensure everything is configured correctly.

## ✅ System Requirements

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (optional but recommended)
- [ ] Terminal/PowerShell available
- [ ] 2GB+ free disk space
- [ ] Stable internet connection

## ✅ Database Setup

- [ ] MongoDB Atlas account created
- [ ] Database cluster created
- [ ] Database user created (username & password)
- [ ] Connection string copied (looks like: `mongodb+srv://user:pass@...`)
- [ ] IP whitelist configured (allow all for testing, restrict in production)
- [ ] Database named "caltrack" (or preferred name)

## ✅ Project Setup

### Backend
- [ ] `cd backend/` from project root
- [ ] `npm install` completed without errors
- [ ] `.env` file created with:
  - [ ] `MONGO_URI=mongodb+srv://...`
  - [ ] `PORT=4000`
  - [ ] `JWT_SECRET=your-secret-key`
- [ ] `npm start` runs successfully (shows "Server running on port 4000")

### Frontend (Optional, for web app)
- [ ] `cd frontend/` from project root
- [ ] `npm install` completed without errors
- [ ] `.env.local` file created with:
  - [ ] `REACT_APP_API_URL=http://localhost:4000`
- [ ] `npm start` runs (opens http://localhost:3000)

### Mobile
- [ ] Expo CLI installed globally (`npm install -g expo-cli`)
- [ ] `cd mobile/` from project root
- [ ] `npm install` completed without errors
- [ ] Computer's local IP address noted (e.g., 192.168.1.100)
- [ ] All 4 screen files updated with correct IP:
  - [ ] `mobile/screens/AuthScreen.js` line 12
  - [ ] `mobile/screens/HomeScreen.js` line 10
  - [ ] `mobile/screens/HistoryScreen.js` line 9
  - [ ] `mobile/screens/ProfileScreen.js` line 8
- [ ] `const API_BASE = 'http://YOUR_IP:4000';` format verified

## ✅ Device/Simulator Setup

### Using iPhone (Recommended)
- [ ] iPhone on same WiFi as computer
- [ ] Expo Go app installed from App Store
- [ ] WiFi signal strong (-30dB or better)
- [ ] Firewall not blocking port 4000

### Using iOS Simulator (Mac Only)
- [ ] Xcode installed
- [ ] Xcode command line tools installed (`xcode-select --install`)
- [ ] Sufficient disk space (~50GB required)
- [ ] iOS 14+ simulator available

### Using Android Emulator
- [ ] Android Studio installed
- [ ] Emulator created and configured
- [ ] Sufficient RAM (at least 4GB)

## ✅ Running the App

### Terminal 1 - Backend
- [ ] Navigate to `backend/` folder
- [ ] Run `npm start`
- [ ] Output shows: `MongoDB connected` ✅
- [ ] Output shows: `Server running on port 4000` ✅
- [ ] Keep this terminal open throughout testing

### Terminal 2 - Mobile
- [ ] Navigate to `mobile/` folder
- [ ] Run `npm start`
- [ ] Output shows QR code ✅
- [ ] Output shows: `Expo Go: ...ready`
- [ ] Keep this terminal open throughout testing

### On iPhone
- [ ] Opened Expo Go app
- [ ] Tapped "Scan" button
- [ ] Pointed camera at QR code in terminal
- [ ] App loading animation appeared ✅
- [ ] App loaded successfully (shows login screen) ✅

## ✅ Testing the App

### Authentication
- [ ] Tapped "Sign Up"
- [ ] Entered email, password, confirmed password
- [ ] Successfully created account
- [ ] Logged out
- [ ] Logged back in with same credentials

### Logging Calories
- [ ] On Home tab
- [ ] Entered calorie value (e.g., 500)
- [ ] Entered food name (e.g., "Chicken")
- [ ] Tapped "Log Entry"
- [ ] Entry appeared in "Today's Intake"

### Camera
- [ ] Tapped "Scan Barcode" button
- [ ] Granted camera permission
- [ ] Camera view opened
- [ ] Could see iPhone camera feed

### History
- [ ] Switched to History tab
- [ ] Saw entries logged today
- [ ] Changed month with arrow buttons
- [ ] Entries from other months appeared

### Profile
- [ ] Switched to Profile tab
- [ ] Saw username and email
- [ ] Tapped "Change Picture"
- [ ] Selected image from photo library

## ✅ Troubleshooting

If something doesn't work, check:

### Can't Connect to Backend
- [ ] Backend is running (`npm start` in backend folder) ✅
- [ ] IP address in code is correct (not localhost) ✅
- [ ] iPhone on same WiFi as computer ✅
- [ ] Firewall allows port 4000 ✅
- [ ] Both devices can ping each other ✅

### Blank White Screen
- [ ] Backend is running ✅
- [ ] API_BASE is correct ✅
- [ ] MongoDB is accessible ✅
- [ ] Try: `npm start -- --clear` in mobile folder
- [ ] Restart Expo Go app completely

### Camera Not Working
- [ ] Granted camera permission to app
- [ ] Using physical iPhone (simulator may not have camera)
- [ ] Tested with another camera app first
- [ ] iOS privacy settings allow camera access

### Module Not Found Errors
- [ ] Ran `npm install` in mobile folder ✅
- [ ] No typos in import statements
- [ ] Package is listed in `mobile/package.json`
- [ ] Try: `npm install` again
- [ ] Try: `rm -rf node_modules && npm install` (clean install)

### Port 4000 Already in Use
- [ ] Change to different port: `PORT=5000 npm start`
- [ ] Update API_BASE to new port in mobile files
- [ ] Or kill process using port 4000

## ✅ Performance Checklist

- [ ] App starts in under 5 seconds
- [ ] Scrolling is smooth (60 FPS)
- [ ] Buttons respond instantly
- [ ] No console errors shown
- [ ] Network requests complete quickly

## ✅ Deployment Prep

When ready to ship to App Store:

### Code Quality
- [ ] No console warnings
- [ ] All screens tested
- [ ] No hardcoded IPs (use env variables)
- [ ] Error handling in place
- [ ] Loading states shown

### Configuration
- [ ] `app.json` updated with:
  - [ ] Correct app name
  - [ ] Correct bundle identifier
  - [ ] Correct version number
  - [ ] Permissions configured
- [ ] API_BASE set to production server (not localhost)
- [ ] Environment variables secured

### Testing
- [ ] Tested authentication (signup, login, logout)
- [ ] Tested all navigation (all tabs accessible)
- [ ] Tested entry logging
- [ ] Tested history viewing
- [ ] Tested profile updates
- [ ] Tested on multiple iPhones
- [ ] Tested on WiFi and cellular
- [ ] Tested with poor connection

### Build & Release
- [ ] App icons created (1024x1024 PNG)
- [ ] Splash screen created
- [ ] Installed EAS CLI (`npm install -g eas-cli`)
- [ ] Logged into EAS account (`eas login`)
- [ ] Built for iOS (`eas build --platform ios`)
- [ ] TestFlight build uploaded
- [ ] Tested on TestFlight
- [ ] Submitted to App Store Review

## 📞 Getting Help

If stuck, check in order:

1. [ ] [QUICK_START.md](./QUICK_START.md) - For 5-minute start
2. [ ] [MOBILE_SETUP.md](./MOBILE_SETUP.md) - For detailed setup
3. [ ] [CONFIG_GUIDE.md](./CONFIG_GUIDE.md) - For configuration
4. [ ] [MIGRATION_NOTES.md](./MIGRATION_NOTES.md) - For technical details
5. [ ] [README.md](./README.md) - For project overview

## 🎉 All Set!

Once everything is checked off:

1. ✅ Your backend is running
2. ✅ Your mobile app is running on iPhone
3. ✅ You can log calories
4. ✅ You can view history
5. ✅ You can manage your profile

**Congratulations! You have a working iOS app!** 🎊

Next steps:
- Customize the app (colors, app name, icons)
- Add more features
- Deploy backend to production
- Submit to App Store

---

Questions? See the documentation files or check the code comments!
