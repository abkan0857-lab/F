// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_ACCESS_EXP = process.env.JWT_ACCESS_EXP || '1h';

async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
    const token = auth.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Defensive checks: expired, soft-deleted
    if ((user.expireAt && user.expireAt <= new Date()) || user.deletedAt) {
      return res.status(403).json({ error: 'Account expired or deleted' });
    }

    // Ensure token deviceId matches bound device
    if (!payload.deviceId) {
      return res.status(401).json({ error: 'Token missing deviceId' });
    }
    if (!user.deviceId || user.deviceId !== payload.deviceId) {
      return res.status(403).json({ error: 'Device mismatch. Account bound to another device' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('authMiddleware error', err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { authMiddleware, JWT_SECRET, JWT_ACCESS_EXP };