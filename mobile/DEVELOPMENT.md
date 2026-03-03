# Caltrack Mobile App

React Native + Expo iOS application for calorie tracking.

## Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Build for App Store
npm run build

# Build locally
npm run build:local
```

## Project Structure

```
.
├── App.js                    # Main app with navigation
├── screens/                  # Application screens
│   ├── AuthScreen.js        # Login/Signup
│   ├── HomeScreen.js        # Daily logging
│   ├── HistoryScreen.js     # Weekly/monthly view
│   └── ProfileScreen.js     # User profile & settings
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── .babelrc                 # Babel config
└── expo.config.js           # Advanced Expo config
```

## Configuration

**IMPORTANT:** Update the backend API URL in all screen files before running:

Change from:
```javascript
const API_BASE = 'http://localhost:4000';
```

To (using your computer's IP):
```javascript
const API_BASE = 'http://192.168.1.100:4000';
```

Files to update:
- `screens/AuthScreen.js`
- `screens/HomeScreen.js`
- `screens/HistoryScreen.js`
- `screens/ProfileScreen.js`

## Features

- ✅ User authentication (sign up/login)
- ✅ Log daily calories and macros
- ✅ View weekly and monthly history
- ✅ Barcode scanning
- ✅ Profile management
- ✅ Dark mode UI
- ✅ Native iOS experience

## Development

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS simulator or physical iPhone
- Backend running on port 4000

### Start Developing

```bash
# Terminal 1: Backend
cd ../backend
npm start

# Terminal 2: Mobile App
npm start
# Scan QR code with Expo Go on iPhone
```

### Debug Mode

```bash
# Enable debugging
npm start -- --verbose

# View logs in real-time
npm start -- --verbose 2>&1 | grep "ERROR\|WARN"
```

## Testing

### Simulator
```bash
npm run ios
```

### Physical Device
```bash
npm start
# Scan QR with Expo Go app
```

### Android
```bash
npm run android
```

## Building for Production

### Prerequisite: EAS Account
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build for App Store
```bash
npm run build
# or
eas build --platform ios
```

### TestFlight Distribution
```bash
eas build --platform ios --auto-submit
```

## Environment Variables

Set in `.env` or `app.json`:

```json
{
  "extra": {
    "API_BASE": "http://192.168.1.100:4000"
  }
}
```

## Colors & Styling

Dark theme colors (customizable in screen files):

```javascript
const colors = {
  darkBg: '#181c20',
  cardBg: '#23272b',
  accent: '#4fd1c5',
  textColor: '#f5f6fa',
  border: '#2d3237',
  inputBg: '#23272b',
  inputBorder: '#353b41',
  placeholder: '#7b848b',
  error: '#ef4444'
};
```

## Permissions Required

Configured in `app.json`:

- **Camera**: For barcode scanning
- **Photo Library**: For profile pictures
- **Calendar**: (Available for future features)
- **Contacts**: (Available for future features)

## API Integration

All requests use JWT tokens:

```javascript
const token = await AsyncStorage.getItem('authToken');
axios.post(API_BASE + '/api/entries', data, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Common Issues

### Can't Connect to Backend
- Update API_BASE to your computer's IP
- Check firewall allows port 4000
- Verify both on same WiFi

### Camera Not Working
- Use physical device (not simulator)
- Grant camera permission
- Check iOS privacy settings

### Blank Screen
```bash
npm start -- --clear
# Restart app
```

### Module Errors
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

## Folder Structure Best Practices

If expanding the app, consider:

```
screens/          # Each tab's full screen
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── utils/        # Helper functions
└── api/          # API request functions
```

## Performance Tips

- Use `React.memo()` for expensive components
- Lazy load screens with `React.lazy()`
- Cache API responses where possible
- Use `FlatList` for long lists
- Optimize images before adding

## Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

## Troubleshooting

### Port 19000/19001 Already in Use
```bash
lsof -i :19000  # Find process
kill -9 <PID>   # Kill it
```

### Clear Everything
```bash
npm start -- --clear
rm -rf .expo node_modules
npm install
npm start
```

### Debug in Chrome
```bash
npm start
# Press 'd' in terminal
# Chrome DevTools will open
```

## Next Steps

1. ✅ Configure `API_BASE` in all screen files
2. ✅ Run `npm install`
3. ✅ Start backend and mobile app
4. ✅ Test on physical iPhone
5. 🚀 Deploy to App Store

## Questions?

See parent directory:
- [QUICK_START.md](../QUICK_START.md)
- [MOBILE_SETUP.md](../MOBILE_SETUP.md)
- [CONFIG_GUIDE.md](../CONFIG_GUIDE.md)
- [README.md](../README.md)

---

**Happy developing!** 🎉
