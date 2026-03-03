# Caltrack - Calorie Tracking App

A modern calorie tracking application available on **web** and **iOS**.

## 🎯 Features

- ✅ **User Authentication** - Secure login/signup
- ✅ **Daily Logging** - Log calories and macros (protein, carbs, fat)
- ✅ **Barcode Scanning** - Scan food barcodes for quick entry
- ✅ **History Tracking** - Weekly and monthly views
- ✅ **Profile Management** - Update username, password, profile picture
- ✅ **Daily Limits** - Set and track daily calorie goals
- ✅ **Dark Mode UI** - Eye-friendly interface
- ✅ **Cross-platform** - Web and native iOS support

## 📱 Versions

### Web App (React)
Modern web interface built with React, runs in any browser.
- Located in: `frontend/`
- Runs at: `http://localhost:3000`
- [Setup Guide →](./frontend/README.md)

### iOS App (React Native + Expo)
Native iOS app with camera, barcode scanning, and offline support.
- Located in: `mobile/`
- Runs on iPhone/iOS simulator
- [Setup Guide →](./MOBILE_SETUP.md)

### Backend (Express + MongoDB)
Shared REST API for both web and mobile apps.
- Located in: `backend/`
- Runs at: `http://localhost:4000`
- [Setup Guide →](./backend/README.md)

## 🚀 Quick Start

### Option 1: Run Everything (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Web (optional):**
```bash
cd frontend
npm install
npm start
```

**Terminal 3 - Mobile:**
```bash
cd mobile
npm install
npm start
```

### Option 2: iOS Only

Just want the mobile app? Follow the [iOS Setup Guide](./MOBILE_SETUP.md).

## 📋 Requirements

- **Node.js 18+**
- **npm** or **yarn**
- **MongoDB** (cloud instance on MongoDB Atlas)
- **Expo CLI** (for mobile): `npm install -g expo-cli`
- **Xcode** (for iOS simulator, Mac only) - or use physical iPhone with Expo Go

## 🛠️ Project Structure

```
Caltrack/
├── backend/                # Express + MongoDB REST API
│   ├── index.js           # Main server with auth & API routes
│   ├── package.json
│   └── README.md
├── frontend/              # React web app
│   ├── src/
│   │   ├── App.js         # Main component
│   │   ├── Calendar.js
│   │   ├── BarcodeScanner.js
│   │   ├── Settings.js
│   │   └── ...
│   ├── package.json
│   └── README.md
├── mobile/                # React Native + Expo iOS app
│   ├── screens/
│   │   ├── AuthScreen.js
│   │   ├── HomeScreen.js
│   │   ├── HistoryScreen.js
│   │   └── ProfileScreen.js
│   ├── App.js             # Navigation
│   ├── app.json           # Expo config
│   ├── package.json
│   └── README.md
├── MOBILE_SETUP.md        # iOS setup instructions
└── README.md              # This file
```

## 🔐 Authentication

The app uses:
- **Web**: Session-based authentication
- **Mobile**: JWT token-based authentication
- **Both**: MongoDB for user storage, bcrypt for password hashing

Login with any email/password or create an account.

## 📡 API Endpoints

All endpoints require authentication:

```
Authentication:
  POST   /auth/signup           # Create account
  POST   /auth/login            # Sign in
  POST   /auth/logout           # Sign out

Entries:
  GET    /api/entries           # All entries
  GET    /api/entries/:date     # Entries for date
  GET    /api/entries/month/:year/:month  # Monthly entries
  POST   /api/entries           # Create entry
  PUT    /api/entry/:id         # Update entry
  DELETE /api/entry/:id         # Delete entry

Profile:
  PUT    /api/profile/username  # Change username
  PUT    /api/profile/password  # Change password
  PUT    /api/profile/picture   # Update photo

Settings:
  GET    /api/calorie-limit     # Get daily limit
  POST   /api/calorie-limit     # Set daily limit
```

## 🌐 Environment Setup

### Backend (.env file)
```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/caltrack
PORT=4000
JWT_SECRET=your_secret_key
```

### Frontend (.env file)
```env
REACT_APP_API_URL=http://localhost:4000
```

### Mobile (Update in screens)
```javascript
const API_BASE = 'http://192.168.1.XXX:4000';  // Your machine IP
```

## 📚 Documentation

- [Backend Setup](./backend/README.md) - Express server & MongoDB
- [Web Frontend Setup](./frontend/README.md) - React app
- [Mobile iOS Setup](./MOBILE_SETUP.md) - React Native & Expo
- [API Documentation](./backend/README.md) - REST endpoints

## 🔧 Development

### Running in Development Mode

**Backend with auto-reload:**
```bash
cd backend
npm run dev
```

**Web with hot reload:**
```bash
cd frontend
npm start
```

**Mobile with Expo:**
```bash
cd mobile
npm start
```

## 🧪 Testing

### Mobile Testing
```bash
cd mobile
npm run ios        # iOS simulator
npm start          # Scan QR with Expo Go
```

### Web Testing
```bash
cd frontend
npm start          # Runs on http://localhost:3000
```

### API Testing
```bash
# Using curl
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🚢 Deployment

### Backend
- Deploy to: Heroku, AWS, Railway, Render
- Update MONGO_URI in production
- Set JWT_SECRET securely

### Web Frontend
- Deploy to: Vercel, Netlify, GitHub Pages
- Update REACT_APP_API_URL to production backend

### Mobile iOS
- Build with EAS: `eas build --platform ios`
- Submit to App Store
- See [MOBILE_SETUP.md](./MOBILE_SETUP.md) for details

## 🐛 Troubleshooting

**Backend won't connect to MongoDB:**
- Check MONGO_URI in .env
- Verify MongoDB cluster is active
- Check IP whitelist in MongoDB Atlas

**Web app can't reach backend:**
- Ensure backend is running on port 4000
- Check REACT_APP_API_URL
- Check CORS configuration

**Mobile app won't connect:**
- Use machine IP address instead of localhost
- Check firewall allows port 4000
- See [MOBILE_SETUP.md](./MOBILE_SETUP.md#troubleshooting)

**Barcode scanner not working:**
- Grant camera permissions
- Use physical device (simulator may not have camera)
- Check iOS privacy settings

## 📞 Support

- [React Documentation](https://react.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 📄 License

MIT - Feel free to use and modify!

## 🎉 Get Started

1. **Clone/Download** this folder
2. **Install Node.js** if not already done
3. **Choose your path:**
   - For iOS: Follow [MOBILE_SETUP.md](./MOBILE_SETUP.md)
   - For Web: [frontend/README.md](./frontend/README.md)
   - For Backend: [backend/README.md](./backend/README.md)
4. **Start building!**

---

**Happy tracking!** 📊