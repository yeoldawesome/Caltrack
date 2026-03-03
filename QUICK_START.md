# 🎯 Caltrack Mobile - Quick Start

**Got 5 minutes? Start here!**

## What You Need
- A Mac, Windows, or Linux computer with Node.js installed
- An iPhone (physical or simulator)
- Expo Go app (free, from App Store)

## Step 1: Start Backend (1 min)

Open a terminal in the `backend` folder:

```bash
npm install
npm start
```

You should see: `Server running on port 4000` ✅

## Step 2: Find Your Computer's IP (1 min)

Open PowerShell (Windows) or Terminal (Mac):

**Windows:**
```powershell
ipconfig
```
Look for `IPv4 Address:` (like 192.168.1.100)

**Mac:**
```bash
ifconfig | grep inet
```

**Write down your IP:** `192.168.1.___`

## Step 3: Update Mobile App (2 min)

In the `mobile` folder, open these files and change `http://localhost:4000` to `http://YOUR_IP:4000`:

- `mobile/screens/AuthScreen.js` (line 12)
- `mobile/screens/HomeScreen.js` (line 10)
- `mobile/screens/HistoryScreen.js` (line 9)
- `mobile/screens/ProfileScreen.js` (line 8)

Example: Change to `http://192.168.1.100:4000`

## Step 4: Start the App (1 min)

Open a terminal in the `mobile` folder:

```bash
npm install
npm start
```

You'll see a **QR code** in the terminal.

## Step 5: Run on iPhone (0.5 min)

1. On your iPhone: Open **Expo Go** (free app)
2. Tap **Scan** or **Scan QR Code**
3. Point camera at the QR code in your terminal
4. Wait ~20 seconds for the app to load

🎉 **Done!** Your app is running!

## 🐛 Why doesn't it work?

### "Cannot connect to server"
- Did you update the IP in the files? (Must be done!)
- Is your iPhone on the same WiFi as the computer?
- Is the backend running?

### "Blank white screen"
- Close Expo Go completely
- Scan the QR code again
- Or try: `npm start -- --clear`

### "No camera in simulator"
- Use a physical iPhone instead
- Or try Android emulator

### "Module errors"
```bash
cd mobile
npm install
npm start -- --clear
```

## ⚡ Pro Tips

- **Update code?** Save file → App auto-reloads
- **Want simulator?** (Mac only) → `npm run ios`
- **Turn on dark mode?** Already dark! 🌙

## 📖 Full Guides

Want more details? See:
- [Full Mobile Setup](./MOBILE_SETUP.md)
- [Main README](./README.md)

## 🚀 What's Next?

1. Create an account
2. Log some calories
3. Try the barcode scanner
4. Check your history

---

**Questions?** Check `MOBILE_SETUP.md` for detailed troubleshooting!
