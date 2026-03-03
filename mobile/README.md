# Caltrack Mobile (React Native + Expo)

A native iOS app built with React Native and Expo. Tracks daily calorie intake with barcode scanning, history, and profile management.

## Features
- ✅ Native iOS app
- ✅ User authentication
- ✅ Log calorie entries with macros
- ✅ Barcode scanner
- ✅ Weekly/monthly history
- ✅ Profile management
- ✅ Daily calorie limits
- ✅ Dark mode UI

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Xcode (for iOS simulator)
- iOS simulator or physical iPhone

## Installation & Running

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start the App

**Option A: Using Expo Go (Fastest)**
```bash
npm start
# Scan the QR code with your iPhone using the Expo Go app
```

**Option B: iOS Simulator**
```bash
npm run ios
```

**Option C: Build for Physical Device**
```bash
npm run build:local
# or for release builds with EAS
npm run build
```

## API Configuration

Update the `API_BASE` in the screen files to point to your backend:

```javascript
const API_BASE = 'http://your-backend-url.com';
```

For local development, you'll need your machine's local IP:
```javascript
const API_BASE = 'http://192.168.1.X:4000';
```

## Backend Requirements

The iOS app uses the same backend as the web version. Ensure your backend supports:
- ✅ CORS for mobile origin
- ✅ Authentication endpoints (login, signup, logout)
- ✅ Entry management APIs
- ✅ Profile update endpoints

## Building for App Store

1. Create EAS account: `eas login`
2. Configure: `eas build:configure`
3. Build: `npm run build`
4. Submit to App Store

## Troubleshooting

**Camera not working:**
- Grant camera permissions in app settings
- Check iOS privacy settings

**Can't connect to backend:**
- Make sure backend is running on correct port
- Use device IP address instead of localhost
- Check CORS configuration in backend

**Blank screen on launch:**
- Clear cache: `npm start -- --clear`
- Restart simulator/device

## Project Structure

```
mobile/
├── App.js                 # Main app navigation
├── screens/
│   ├── AuthScreen.js      # Login/Signup
│   ├── HomeScreen.js      # Daily entry logging
│   ├── HistoryScreen.js   # Monthly history view
│   └── ProfileScreen.js   # User profile & settings
├── app.json               # Expo config
├── package.json
└── assets/                # Icons, images
```

## Next Steps

1. **Replace API_BASE** with your actual backend URL
2. **Generate app icons** (1024x1024 png) and place in assets/
3. **Test on device** using Expo Go
4. **Submit to App Store** using EAS Build
