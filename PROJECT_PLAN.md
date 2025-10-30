```markdown
# Project Plan — Aplikasi "TOTOHAX V5" (Starter: Node + Mongoose + JWT + Device Bind)

Dokumen ini berisi ringkasan tema, tujuan, perencanaan fitur, arsitektur, model data, API contract, alur autentikasi (1 akun — 1 device), handling expired account, deploy & operasi, serta roadmap. Simpan file ini sebagai referensi pengembangan dan operasional ke depan.

---

## 1. Tema & Tujuan
- Nama sementara: TOTOHAX V5 (ganti sesuai produk final).
- Tema: Aplikasi simulasi/utility yang menyediakan akses akun terikat perangkat (single-device), demo fitur top-up, upload media (foto/video kecil), dan proses berjangka waktu (akun kedaluwarsa otomatis).
- Tujuan:
  - MVP: memungkinkan user register/login, upload media, melihat dashboard, dan menjalankan proses simulasi (progress + hasil).
  - Enforce 1 akun = 1 device (device binding).
  - Akun punya durasi (1 jam — 99 hari). Setelah kadaluarsa, akun dan media dihapus.
  - Mudah deploy di VPS/Pterodactyl untuk prototipe; bisa skala nanti ke S3/Cloud.

---

## 2. Target Pengguna
- Pengguna awal: internal/dev, teman, atau komunitas kecil (<=100 pengguna aktif).
- Kebutuhan: pengalaman cepat, ringan, tidak perlu autentikasi sosial, aman cukup untuk demo.
- Batasan: untuk prototipe, media kecil (<~50 MB per file), jumlah file terbatas (<30 foto + 1 promo video).

---

## 3. Ruang Lingkup Fitur (MVP)
- User:
  - Register (email + password + deviceId) dengan durasi akun pilihan.
  - Login (email + password + deviceId).
  - Rebind device dengan verifikasi password (no OTP in MVP).
- Dashboard:
  - Tampilkan saldo (simulasi), daftar media, tombol upload (foto/video).
  - Tombol "Initiate" untuk memulai proses simulasi (mengurangi saldo).
- Upload:
  - Upload media (mulai lokal uploads/ atau presigned S3 opsional).
  - Save URL ke user.media.
- Expiration:
  - expireAt di user document.
  - Cleanup job cron (setiap 5 menit) untuk hapus user expired dan file terkait.
- Security:
  - JWT access token, middleware memverifikasi token + deviceId.
  - Password hashed (bcrypt).
  - Rate limiting (opsional) / brute force prevention (future).
- Deployment:
  - Deploy backend ke Pterodactyl/VPS.
  - Frontend mobile: Expo React Native (build APK).

---

## 4. User Stories (singkat)
- Sebagai pengguna, saya ingin mendaftar dengan durasi sehingga akun saya aktif hanya selama durasi itu.
- Sebagai pengguna, saya ingin akun terkait hanya ke perangkat saya sehingga orang lain tidak bisa pakai akun saya.
- Sebagai pengguna, saya ingin meng-upload foto/video dan melihatnya di dashboard.
- Sebagai admin/dev, saya ingin akun kadaluarsa otomatis dihapus untuk menghemat resource.
- Sebagai pengguna, saya ingin memperpanjang durasi akun (melalui extend endpoint).

---

## 5. Arsitektur Tingkat Tinggi
- Client: React Native (Expo) — APK.
- API: Node.js + Express.
- Database: MongoDB (Mongoose).
- Storage: Local uploads/ (prototype) atau S3 + CDN (production).
- Realtime (opsional): Socket.IO (untuk push update saldo) atau polling / Firestore (jika pindah).
- Scheduler: node-cron (cron job di server) untuk cleanup.
- Deployment: Pterodactyl (VPS) atau server biasa; reverse proxy TLS (Nginx) di host.

Diagram (conceptual):
Client (APK) ↔ HTTPS ↔ API (Express) ↔ MongoDB
                             ↳ S3/Local storage
                             ↳ Cron cleanup job
(Optional) API ↔ Socket.IO ↔ Client

---

## 6. Model Data (Mongoose - ringkasan)
User:
```text
User {
  _id: ObjectId,
  email: String (unique, lowercase),
  passwordHash: String,
  createdAt: Date,
  expireAt: Date,
  deletedAt: Date | null,
  deviceId: String | null,    // bind to single device
  media: [{ url: String, key: String }],
}
```

Indexes:
- Unique index on email.
- TTL index: { expireAt: 1 } with expireAfterSeconds: 0 (opsional). TTL hanya menghapus doc, tidak membersihkan S3/local files — masih gunakan cron cleanup.

Media record:
- url: public-accessible URL (local server path or S3 URL).
- key: S3 object key or local filename (for cleanup).

---

## 7. API Contract (minimal & penting)
Base URL: https://api.example.com (sesuaikan)

Auth:
- POST /api/auth/register
  - Body: { email, password, durationAmount, durationUnit('h'|'d'), deviceId }
  - Response: { ok, token, user: { id, email, expireAt, deviceId } }

- POST /api/auth/login
  - Body: { email, password, deviceId }
  - Response: { ok, token, user }

- POST /api/auth/rebind
  - Body: { email, password, newDeviceId }
  - Response: { ok, token, user }

Protected endpoints require header: Authorization: Bearer <token>

User:
- GET /api/users/me
  - returns { id, email, expireAt, media }

- POST /api/users/me/media
  - multipart/form-data file=...
  - Response: { ok, url }

- PUT /api/users/:id/extend
  - Protected: body { durationAmount, durationUnit }
  - Response: { ok, expireAt }

Admin / Maintenance:
- GET /health
- Optionally: POST /admin/reset-device (admin only) — to clear deviceId.

Notes:
- All writes validate expireAt range: min 1 hour, max 99 days.
- All auth tokens include payload { sub: userId, deviceId }.

---

## 8. Auth Flow (1 akun = 1 device)
1. Client generates deviceId (UUID) on first run, saves in SecureStore.
2. Register:
   - Client sends email/password/duration/deviceId.
   - Server creates user with deviceId stored.
   - Server returns JWT signed with deviceId in payload.
3. Login:
   - Client sends email/password/deviceId.
   - Server checks credentials; if user.deviceId null → bind to deviceId; else if mismatch → 403 reject.
   - Server returns JWT { sub, deviceId }.
4. Middleware:
   - Verify JWT signature; load user from DB by payload.sub.
   - If user.deviceId !== payload.deviceId → reject.
   - Also check expireAt and deletedAt.
5. Rebind:
   - Client calls /rebind with email/password/newDeviceId.
   - Server verifies password; sets user.deviceId = newDeviceId (no OTP in MVP).
   - Return new token.

Edge cases:
- If user deletes app (deviceId lost), they must use rebind (password) or support admin reset.
- Add rate-limiting on /rebind to prevent abuse.

---

## 9. Expiration & Cleanup
- expireAt field set on registration or extend.
- Cleanup strategy (recommended):
  - Use cron job (node-cron) scheduled every 5 minutes:
    - Query users with expireAt <= now.
    - For each user:
      - Delete user.media files from storage (S3 or local file).
      - Delete user doc.
  - Optionally implement soft-delete: set deletedAt then purge after grace period.
- TTL Index caveat:
  - TTL index will remove docs automatically, but it won't call cleanup hooks to remove external files. Do not rely solely on TTL if using external storage.

---

## 10. Media Upload Flow
Option A: Local uploads (development/prototype)
- Endpoint POST /api/users/me/media (multipart/form-data)
- Server stores file in /uploads/users/{userId}-{timestamp}.ext
- Save { url, key } in user.media

Option B: S3 presigned (recommended for production)
- Endpoint POST /api/presign (protected)
  - Body { filename, contentType }
  - Server returns { uploadUrl, fileUrl, key }
- Client PUT to uploadUrl with raw binary.
- Client informs server to attach fileUrl to user record via POST /api/users/me/media (body { fileUrl, key }).

Limits:
- Enforce max file size (e.g., 50 MB).
- Validate content-type (image/*, video/*).
- Consider generating thumbnails server-side or on client for images.

---

## 11. Client (React Native / Expo) Implementation Notes
- Generate deviceId:
  - Use expo-secure-store to persist UUID.
  - Use uuid library for unique id.
- Auth:
  - Save JWT securely (SecureStore).
  - Include Authorization header on requests.
- Upload:
  - Use fetch + blob for PUT to presigned URL; or FormData to server.
  - Show upload progress (optional with XMLHttpRequest).
- Play video:
  - Use `expo-av` or `react-native-video`.
  - For promo video, use compressed mp4 or host on YouTube for zero egress cost (public/unlisted).
- Offline:
  - Cache last known saldo and media URLs in AsyncStorage for offline view.
- UI:
  - Loading screen with one promo video (but have timeout fallback 3–5s).
  - Simple dashboard: saldo, media gallery, initiate process flow, top-up modal.

---

## 12. Deployment (Pterodactyl / VPS) — Steps
1. Prepare VPS host with Docker or Node runtime + MongoDB (managed or external).
2. Create Pterodactyl server (Node Egg). Allocate port.
3. Upload project files (via SFTP or Git pull).
4. Setup environment variables in panel (.env).
5. Startup command: `npm install && npm run start` or `node server.js`.
6. Configure reverse proxy on host (Nginx) to provide HTTPS and route to Pterodactyl allocated port.
7. If using local storage, ensure persistent disk and backup strategy.
8. For cron cleanup: enable ENABLE_CRON=true in env (cron runs inside app) or run `npm run cleanup` periodically from host crontab.

Example .env:
```
PORT=3000
MONGO_URI=...
JWT_SECRET=supersecret
JWT_ACCESS_EXP=1h
ENABLE_CRON=true
STORAGE_PROVIDER=local
```

---

## 13. Security Checklist
- Use HTTPS/TLS for API & file transfer.
- Use strong JWT_SECRET and rotate periodically.
- Store tokens in SecureStore on client, not AsyncStorage (if possible).
- Hash passwords with bcrypt (salted).
- Validate input length/format; prevent injection attacks.
- Rate-limit sensitive endpoints (login, rebind, register).
- Limit file upload types and size.
- Monitor logs for suspicious logins.
- Backups & DB snapshots for recovery.

---

## 14. Testing Plan
- Unit tests for helper functions (parseDuration, device binding).
- Integration tests:
  - Register → Login → Upload media → Get me → Extend expire → Check expire behavior.
- E2E (manual or automated with Detox/Appium):
  - Install APK, register, upload, simulate expiry (fast-forward DB), confirm cleanup.
- Security tests:
  - Attempt login with different deviceId, expired account, invalid JWT.
- Load tests (optional): simulate concurrent users to see bandwidth.

---

## 15. Monitoring & Logging
- Log format: timestamp, level, route, userId (if available), error stack.
- Use PM2 or process manager on VPS for auto-restart.
- Consider external logs: Papertrail / LogDNA / ELK for production.
- Healthcheck endpoint: /health for uptime and basic metrics.
- Alerts: disk usage, CPU, memory, backup failures.

---

## 16. Backup & Recovery
- MongoDB backups: daily snapshots or managed backups (Atlas).
- If using local file storage: schedule rsync or copy to object storage (S3) daily.
- Store .env secrets in secure vault (not in repo).
- Document recovery steps in `RECOVERY.md`.

---

## 17. Cost & Sizing (estimation for your scenario)
- Small prototype (<100 users, few media):
  - MongoDB local or small managed instance — free/cheap.
  - Storage: few hundred MB — negligible cost if using free tier.
  - Bandwidth: likely <10–20 GB/month → may be free for small VPS or low cost via CDN.
- Production scaling:
  - Use S3 + CloudFront to reduce origin bandwidth.
  - Expect cost mainly from egress/transfer & storage.

---

## 18. Roadmap & Milestones (suggested)
MVP weekend (1–3 days)
- Environment scaffold, models, auth, device binding.
- Register/login/rebind endpoints.
- Upload local media + attach to user.
- Cleanup cron job.
- Basic React Native (Expo) client: register/login/upload/play.

Phase 2 (1–2 weeks)
- Presigned S3 upload & CDN.
- Rebind security improvement (email confirmation).
- Admin panel: list users, reset device binding.
- Add Socket.IO for realtime saldo updates.

Phase 3 (production)
- Move to managed DB (Atlas), S3, CloudFront.
- Monitoring, alerting, backups & CI/CD.
- Payment integration for top-up and automatic extend.

---

## 19. Development Checklist (Tasks)
- [ ] Create repo & branch naming convention.
- [ ] Implement models (User).
- [ ] Implement auth routes (register/login/rebind).
- [ ] Implement middleware auth (token + device check).
- [ ] Implement upload route (local).
- [ ] Implement cleanup job.
- [ ] Write documentation (this file + README).
- [ ] Implement Expo client basic flows.
- [ ] Deploy to Pterodactyl and test end-to-end.
- [ ] Add tests & CI (optional).

---

## 20. README Template (to paste into repo)
````markdown
# TOTOHAX V5 — Backend

Quickstart:
1. cp .env.example .env and fill values
2. npm install
3. npm run dev
4. API: http://localhost:3000

Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/rebind
- GET /api/users/me
- POST /api/users/me/media

Notes:
- Use deviceId binding: client must provide deviceId for register/login.
- Enable cron: set ENABLE_CRON=true