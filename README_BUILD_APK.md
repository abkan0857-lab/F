```markdown
# Build APK/AAB via EAS — Langkah Lengkap (Indonesia)

Dokumen ini menjelaskan langkah-langkah membuat APK/AAB menggunakan EAS (Expo Application Services), mengelola keystore, dan men-deploy backend serta menempatkan file web (index.html, script.js, style.css) ke server.

Prasyarat
- Node.js & npm
- Git
- Akun Expo (https://expo.dev/)
- eas-cli: `npm install -g eas-cli`
- Backend sudah dapat diakses via internet (domain + HTTPS) untuk production
- Jika pakai Docker: docker & docker-compose di server

Langkah A — Siapkan project Expo
1. Pastikan `app.json` telah diisi (`android.package` unik).
2. Pastikan `eas.json` disimpan di root (saya sertakan contoh).
3. Login ke Expo:
   ```
   eas login
   ```

Langkah B — Keystore: dua opsi

Opsi 1 (Saran - mudah): Biarkan EAS mengelola keystore
- Saat `eas build` pertama kali, pilih opsi EAS manage credentials.
- EAS menyimpan keystore di akun Anda.

Opsi 2 (Kontrol penuh): Buat keystore sendiri dan upload ke EAS
1. Generate keystore:
   ```
   keytool -genkeypair -v -keystore my-release-key.jks -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Simpan: my-release-key.jks, alias, keystore password, key password.
2. Saat `eas build`, pilih "I want to provide my own keystore" dan upload file, alias, password.

Langkah C — Build via EAS
1. Konfigurasi (jika belum):
   ```
   eas build:configure
   ```
2. Build APK untuk testing:
   ```
   eas build --platform android --profile preview
   ```
   atau Build AAB untuk Play Store:
   ```
   eas build --platform android --profile production
   ```
3. Setelah selesai, download artifact dari link EAS.

Langkah D — Install APK di device
- Via adb:
  ```
  adb install -r /path/to/app.apk
  ```
- Atau unduh di HP dan install manual (sideload).

Langkah E — Submit ke Play Store (AAB)
1. Buat app di Google Play Console.
2. Upload AAB dari EAS build.
3. Lengkapi listing, privacy policy, screenshot, policy compliance.
4. Publikasikan.

Langkah F — Backend: menaruh file web & men-deploy server
1. Buat folder `public` di project backend:
   ```
   mkdir -p /var/www/totohax/public
   ```
2. Copy file web (index.html, script.js, style.css, assets) ke `public/`.
3. Pastikan server express melayani static:
   - Di server.js, tambahkan:
     ```js
     app.use(express.static(path.join(__dirname, 'public')));
     ```
4. Set .env (copy dari .env.example)
5. Jalankan server:
   - Untuk Docker: `docker-compose up -d --build`
   - Tanpa Docker:
     ```
     npm ci
     pm2 startOrReload ecosystem.config.js
     ```
6. Setup Nginx reverse proxy dan SSL (certbot) — contoh config disertakan.

Langkah G — Testing end-to-end
1. Pastikan backend reachable from device (https).
2. Set `API_URL` di `config.js` client ke `https://api.yourdomain.com`
3. Di device: register -> login -> upload -> play video
4. Test account expiry: set expireAt ke waktu dekat dan tunggu cleanup job (cron runs every 5 min) untuk verifikasi penghapusan.

Catatan keamanan & tips
- Simpan keystore `.jks` di tempat aman (backup offline).
- Jangan commit secrets (.env) ke repo publik.
- Gunakan HTTPS untuk API.
- Jika Anda ingin media privat, gunakan S3 + presigned URLs, bukan public serve.

FAQ singkat
Q: Apakah saya harus membuat keystore sendiri?
A: Tidak wajib — EAS dapat mengelola. Jika ingin kontrol penuh atau reuse keystore untuk update yang konsisten, buat sendiri.

Q: Bagaimana menempatkan index.html & script.js?
A: Tempatkan di `server/public/` dan server akan men-serve static assets. Anda bisa menampilkan landing page pada root domain atau di `/public/`.

```