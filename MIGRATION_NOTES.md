# What's Different: Web vs Mobile

This document explains the changes made to convert Caltrack from a web app to a native iOS app.

## 📊 Comparison

| Feature | Web (React) | Mobile (React Native) |
|---------|-----------|----------------------|
| **Runtime** | Browser | Native iOS |
| **UI Components** | HTML/CSS | iOS Native Views |
| **Authentication** | Session Cookies | JWT Tokens |
| **Camera** | WebRTC/zxing library | Expo Camera (native) |
| **Performance** | Good | Excellent (native) |
| **Offline** | No | Can add with AsyncStorage |
| **App Store** | N/A | ✅ Can publish |
| **Port** | 3000 | Expo (19000+) |

## 🔄 What Changed in Backend

The backend (`backend/index.js`) was enhanced to support mobile:

### Authentication
- **Web**: Uses `req.session.userId` 
- **Mobile**: Uses JWT tokens via `Authorization: Bearer` header
- **Both**: Now supported with `getUserId()` helper function

### New JWT Support
```javascript
// Added JWT token generation
import jwt from 'jsonwebtoken';

// Login/Signup now return tokens
res.json({ 
  user: {...},
  token: jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
});
```

### CORS Configuration
Added mobile origins to allow iOS app requests:
```javascript
const allowedOrigins = [
  'http://localhost:3000',      // Web
  'http://127.0.0.1:4000',      // Local backend
  process.env.MOBILE_ORIGIN     // iOS app
];
```

### New Mobile API Endpoints
```javascript
// Get entries for specific date
GET /api/entries/:date

// Get entries for a month
GET /api/entries/month/:year/:month

// Profile update endpoints (renamed for consistency)
PUT /api/profile/username
PUT /api/profile/password
PUT /api/profile/picture
```

### Authentication Middleware
```javascript
// Now checks both session AND JWT
function ensureAuth(req, res, next) {
  // Check session (web)
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Check JWT token (mobile)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  res.status(401).json({ error: 'Not authenticated' });
}
```

## 📱 What Changed in Frontend

### New Files Created
```
mobile/
├── App.js                      # Main navigation using React Navigation
├── screens/
│   ├── AuthScreen.js          # Login/Signup (no modal)
│   ├── HomeScreen.js          # Daily logging with date picker
│   ├── HistoryScreen.js       # Weekly/monthly view
│   └── ProfileScreen.js       # Profile & settings
├── package.json               # React Native + Expo dependencies
└── app.json                   # Expo configuration
```

### UI Changes

**Web (React):**
- HTML elements: `<div>`, `<button>`, `<input>`
- CSS for styling
- Modals with `position: fixed`
- Web APIs (FileReader, fetch)

**Mobile (React Native):**
- Native components: `<View>`, `<TouchableOpacity>`, `<TextInput>`
- StyleSheet for styling
- Modal component
- Native APIs (AsyncStorage, Camera, ImagePicker)

### Navigation Changes

**Web:**
- Single page with modals
- Modal overlays for auth, settings, profile updates

**Mobile:**
- Tab-based navigation (Home, History, Profile)
- React Navigation for stack management
- Full-screen Auth vs App navigation

### Storage Changes

**Web:**
- LocalStorage for theme/settings
- Session storage for auth

**Mobile:**
- AsyncStorage for tokens and user data
- No localStorage equivalent
```javascript
// Async storage is required in React Native
const token = await AsyncStorage.getItem('authToken');
await AsyncStorage.setItem('userData', JSON.stringify(user));
```

### Styling

**Web:**
```javascript
const darkBg = '#181c20';
const cardBg = '#23272b';
// Used in inline styles and CSS files
style={{ backgroundColor: cardBg }}
```

**Mobile:**
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkBg,
    padding: 16
  }
});
// Used in components
<View style={styles.container}>
```

### Camera Implementation

**Web:**
```javascript
// Uses zxing-js library
import { BrowserMultiFormatReader } from '@zxing/browser';

codeReader.current.decodeFromVideoDevice(
  null,
  videoRef.current,
  (result, err) => {
    if (result) onDetected(result.getText());
  }
);
```

**Mobile:**
```javascript
// Uses native Expo Camera
import { CameraView } from 'expo-camera';

<CameraView
  style={styles.container}
  onBarcodeScanned={({ data }) => handleBarcode(data)}
/>
```

### Permissions

**Web:**
- Browser prompts for camera
- No persistent storage needed

**Mobile:**
```javascript
// Must request permissions
const [permission, requestPermission] = useCameraPermissions();

// Configure in app.json
{
  "plugins": [
    ["expo-camera", {
      "cameraPermission": "We need camera access..."
    }]
  ]
}
```

## 🔑 API Usage Differences

### Web App (Browser)
```javascript
// Uses session cookies automatically
fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  credentials: 'include',  // Send cookies
  body: JSON.stringify({...})
})
```

### Mobile App (React Native)
```javascript
// Must include JWT token
const token = await AsyncStorage.getItem('authToken');

axios.post(`${API_BASE}/api/entries`, data, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Must use your computer's IP (not localhost)
const API_BASE = 'http://192.168.1.100:4000';
```

## 🎨 UI/UX Differences

### Layout
- **Web**: More spacious, desktop-friendly
- **Mobile**: Touch-optimized, compact, vertical scrolling

### Navigation
- **Web**: Header with buttons, modals for auth
- **Mobile**: Bottom tabs (Home, History, Profile)

### Inputs
- **Web**: Text inputs with labels above
- **Mobile**: Text inputs optimized for touch

### Date Selection
- **Web**: Calendar component
- **Mobile**: Horizontal date scroll (week view)

## 📦 Dependencies

### Backend
```json
{
  "jsonwebtoken": "^9.0.0"  // NEW - for JWT
}
```

### Frontend (Web)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "tesseract.js": "^7.0.0"
}
```

### Mobile (New)
```json
{
  "expo": "~51.0.0",
  "react-native": "0.74.0",
  "@react-navigation/native": "^6.1.0",
  "expo-camera": "~15.0.0",
  "expo-async-storage": "~1.2.0"
}
```

## ⚠️ Known Limitations

### Mobile vs Web
1. **File uploads**: Limited to camera/image picker
2. **Barcode scanning**: Needs physical device or simulator
3. **Offline mode**: Not implemented (could add with AsyncStorage)
4. **Browser tabs**: N/A in native app
5. **DevTools**: Mobile doesn't have browser DevTools

### Differences from Web
- No localStorage (use AsyncStorage instead)
- No DOM manipulation (use state instead)
- No CSS files (use StyleSheet)
- Different layout system (Flexbox in React Native works differently)

## 🔄 Sharing Code Between Web & Mobile

Currently, the projects are separate. To share code in the future:

### Possible Solutions
1. **React Native Web** - Run React Native code in browser
2. **Monorepo** - Share business logic with Lerna/Yarn Workspaces
3. **Shared utilities** - Common functions in separate package

### What Could Be Shared
- API request logic
- Authentication logic
- Data validation
- Business logic

### What Can't Be Shared
- UI components (platform-specific)
- Navigation (different paradigms)
- Styling (different systems)
- Platform-specific features (camera, storage)

## 🚀 Performance Differences

### Web
- First load: ~3-5 seconds
- Reloads required for updates
- Depends on internet connection

### Mobile
- First load: ~2-3 seconds (on device)
- Hot reload for development
- Can work offline (with AsyncStorage)
- Native performance for animations

## 📚 Migration Guide Summary

**If you want to:**

### Update both web and mobile simultaneously
1. Update backend (`backend/index.js`)
2. Update web (`frontend/src/*.js`)
3. Update mobile (`mobile/screens/*.js`)
4. Test both versions

### Deploy mobile to App Store
1. Update `app.json` with version and metadata
2. Generate app icons (1024x1024 PNG)
3. Run `eas build --platform ios`
4. Submit via Apple Developer

### Share code between apps
1. Create `shared/` folder at root
2. Move common logic there
3. Import in both web and mobile
4. Example: API client, validation functions

## 🔐 Security Implications

### Web
- Session stored in browser cookies
- CSRF protection needed
- X-Frame-Options headers

### Mobile
- JWT stored in AsyncStorage
- Token cannot be HttpOnly
- Slightly less secure, but acceptable
- Consider encrypted storage for production

### Both
- Use HTTPS in production
- Never store passwords
- Validate all inputs
- Rate limit auth endpoints

---

**Questions?** See the specific README files or generate migration docs!
