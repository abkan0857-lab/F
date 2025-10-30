// routes/topup.js
const express = require('express');
const router = express.Router();
const TopUpRequest = require('../models/TopUpRequest');
const { authMiddleware } = require('../middleware/auth');

// create topup request (user)
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { amount, method, note } = req.body;
    // validate
    const min = Number(process.env.MIN_TOPUP_AMOUNT || 1000);
    const max = Number(process.env.MAX_TOPUP_AMOUNT || 100000000); // arbitrary
    const amt = Number(amount);
    if (isNaN(amt) || amt < min || amt > max) return res.status(400).json({ error: `Invalid amount. Range ${min} - ${max}` });

    const reqDoc = await TopUpRequest.create({
      userId: req.user._id,
      amount: amt,
      method: method || 'manual',
      note: note || ''
    });

    res.json({ ok: true, request: reqDoc });
  } catch (err) {
    console.error('create topup error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// list own topup requests
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const docs = await TopUpRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ ok: true, requests: docs });
  } catch (err) {
    console.error('list my topups', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;