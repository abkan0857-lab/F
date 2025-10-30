```markdown
# TOTOHAX Client (Expo)

Minimal Expo React Native client for the JWT + Device-bound backend.

Features:
- Generate deviceId and store in SecureStore
- Register (email/password + duration + deviceId)
- Login (email/password + deviceId)
- Upload media (photo/video) to `/api/users/me/media`
- Show uploaded media and play videos

Setup
1. Install dependencies
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

2. Edit `config.js` and set `API_URL` to your backend (e.g. http://10.0.2.2:3000 for Android emulator, or your VPS domain).

3. Start dev server
   ```
   npm start
   ```

Running on device
- Use Expo Go app (scan QR) for quick testing.
- For Android emulator, if backend is local, use `http://10.0.2.2:3000` as `API_URL`.

Build APK (recommended: EAS)
- Install and configure EAS: https://docs.expo.dev/build/setup/
- Run:
  ```
  eas build -p android --profile production
  ```

Notes
- SecureStore is used to persist token and deviceId.
- This client expects the backend endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/users/me
  - POST /api/users/me/media (multipart/form-data)
  - PUT /api/users/:id/extend
- For production, tighten error handling, validate file sizes and mime types on client, and show upload progress UI.
```