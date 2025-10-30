// models/User.js
const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  url: String,
  key: String // s3 key or local path
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date, required: true },
  deletedAt: { type: Date, default: null },
  media: { type: [MediaSchema], default: [] },

  // BINDING: each account may be bound to one deviceId
  deviceId: { type: String, default: null },

  // NEW: account balance and admin flag
  balance: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false }
});

// TTL index (optional) - Mongo will remove document when expireAt passed (monitor delay applies)
UserSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('User', UserSchema);