```markdown
# Node + Mongoose Starter — JWT + Account Expiration

Repo starter includes:
- Express + Mongoose user model with `expireAt`
- JWT-based auth endpoints (register, login)
- Middleware that verifies JWT and checks account expiry
- Upload endpoint (local storage) to attach media to user
- Cleanup job to remove expired users and their media (supports local or S3)
- Optional cron to run cleanup periodically

Quickstart
1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   ```
   npm install
   ```
3. Start MongoDB (local or remote).
4. Run server:
   ```
   npm run dev
   ```
   or
   ```
   npm start
   ```

Register example (POST /api/auth/register)
```json
{
  "email": "alice@example.com",
  "password": "secret123",
  "durationAmount": 7,
  "durationUnit": "d"
}
```
- `durationUnit` supports 'h' (hours) or 'd' (days).
- Server validates min/max (min 1 hour, max 99 days).

Login example (POST /api/auth/login)
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```
Returns JWT token. Attach `Authorization: Bearer <token>` to protected requests.

Upload media (POST /api/users/me/media)
- Form-data field `file`
- When using local storage, uploaded files served from `/uploads/users/<filename>`

Cleanup
- You can run one-off cleanup:
  ```
  npm run cleanup
  ```
- Or enable `ENABLE_CRON=true` to start scheduled cleanup inside the server (every 5 minutes).

Notes & Recommendations
- TTL index is configured on `expireAt` but TTL alone does not delete external S3 objects. Use the cron cleanup if you store media externally.
- For production, use HTTPS, strong JWT_SECRET, and secure storage (S3 + CDN) for media.
- When deleting users, consider soft-delete first (set `deletedAt`) and purge after a grace period.
- Add email notifications (reminder before deletion) and payment/webhook flows if you tie expiration to payments.
```