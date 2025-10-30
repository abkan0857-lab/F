// middleware/admin.js
const { authMiddleware } = require('./auth');

// Wrap authMiddleware then check isAdmin
async function adminMiddleware(req, res, next) {
  // authMiddleware already attaches req.user
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin privileges required' });
    next();
  } catch (err) {
    console.error('adminMiddleware error', err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = adminMiddleware;