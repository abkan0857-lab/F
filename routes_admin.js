// routes/admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TopUpRequest = require('../models/TopUpRequest');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// GET all topup requests (filter optional)
router.get('/topups', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const list = await TopUpRequest.find(filter).sort({ createdAt: -1 }).populate('userId', 'email');
    res.json({ ok: true, items: list });
  } catch (err) {
    console.error('admin list topups', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Approve a topup (atomic)
router.post('/topups/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req.params.id;
    const topup = await TopUpRequest.findById(id).session(session);
    if (!topup) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Topup request not found' });
    }
    if (topup.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Topup already processed' });
    }

    // update user balance
    const user = await User.findById(topup.userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'User not found' });
    }

    user.balance = (user.balance || 0) + topup.amount;
    await user.save({ session });

    topup.status = 'approved';
    topup.approvedAt = new Date();
    topup.approvedBy = req.user._id;
    await topup.save({ session });

    await session.commitTransaction();
    session.endSession();

    // notify user via socket
    const io = req.app.locals.io;
    if (io) {
      const room = `user:${user._id.toString()}`;
      io.to(room).emit('topup:approved', { requestId: topup._id, amount: topup.amount, newBalance: user.balance });
    }

    res.json({ ok: true, request: topup, newBalance: user.balance });
  } catch (err) {
    await session.abortTransaction().catch(()=>{});
    session.endSession();
    console.error('approve error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Reject a topup
router.post('/topups/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    const topup = await TopUpRequest.findById(id);
    if (!topup) return res.status(404).json({ error: 'Not found' });
    if (topup.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    topup.status = 'rejected';
    topup.rejectedAt = new Date();
    topup.rejectedBy = req.user._id;
    topup.rejectionReason = reason || '';
    await topup.save();

    // notify user
    const io = req.app.locals.io;
    if (io) {
      const room = `user:${topup.userId.toString()}`;
      io.to(room).emit('topup:rejected', { requestId: topup._id, reason: topup.rejectionReason });
    }

    res.json({ ok: true, request: topup });
  } catch (err) {
    console.error('reject error', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;