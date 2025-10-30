// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_ACCESS_EXP } = require('../middleware/auth');

// Helper: parse duration from client (amount + unit 'h'/'d')
function parseDuration({ amount, unit }) {
  const n = parseInt(amount, 10);
  if (isNaN(n) || n <= 0) return null;
  if (unit === 'h') {
    if (n < 1 || n > (99 * 24)) return null;
    return n * 60 * 60 * 1000;
  } else if (unit === 'd') {
    if (n < 1 || n > 99) return null;
    return n * 24 * 60 * 60 * 1000;
  }
  return null;
}

// Register (require deviceId to bind)
router.post('/register', async (req, res) => {
  try {
    const { email, password, durationAmount, durationUnit, deviceId } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    if (!deviceId) return res.status(400).json({ error: 'deviceId required (bind account to device)' });

    const ms = parseDuration({ amount: durationAmount, unit: durationUnit });
    if (!ms) return res.status(400).json({ error: 'Invalid duration. Provide amount and unit (h or d).' });

    const exist = await User.findOne({ email });
    if (exist) return res.status(409).json({ error: 'email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const expireAt = new Date(now.getTime() + ms);

    const user = await User.create({
      email,
      passwordHash,
      createdAt: now,
      expireAt,
      media: [],
      deviceId // bind device here
    });

    const token = jwt.sign({ sub: user._id.toString(), deviceId: deviceId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXP });

    res.json({ ok: true, token, user: { id: user._id, email: user.email, expireAt: user.expireAt, deviceId: user.deviceId } });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Login (require deviceId and enforce single-device binding)
router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Reject expired accounts
    if (user.expireAt && user.expireAt <= new Date()) {
      return res.status(403).json({ error: 'Account expired' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Binding logic: if user has no deviceId, bind; otherwise enforce equality
    if (!user.deviceId) {
      user.deviceId = deviceId;
      await user.save();
    } else if (user.deviceId !== deviceId) {
      return res.status(403).json({ error: 'Account is bound to another device' });
    }

    const token = jwt.sign({ sub: user._id.toString(), deviceId: deviceId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXP });
    res.json({ ok: true, token, user: { id: user._id, email: user.email, expireAt: user.expireAt, deviceId: user.deviceId } });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Rebind endpoint (allow moving to new device by verifying password)
// NOTE: This endpoint does NOT use OTP. For production consider adding extra verification (email confirm).
router.post('/rebind', async (req, res) => {
  try {
    const { email, password, newDeviceId } = req.body;
    if (!email || !password || !newDeviceId) return res.status(400).json({ error: 'email, password and newDeviceId required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // OPTIONAL: add rate limiting or admin approval to avoid abuse
    user.deviceId = newDeviceId;
    await user.save();

    const token = jwt.sign({ sub: user._id.toString(), deviceId: newDeviceId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXP });
    res.json({ ok: true, token, user: { id: user._id, email: user.email, deviceId: user.deviceId } });
  } catch (err) {
    console.error('rebind error', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;