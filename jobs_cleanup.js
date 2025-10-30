// jobs/cleanup.js
// Runs a scheduled cleanup (node-cron) to find expired users and delete associated local files or S3 objects.
// If you prefer to run as standalone script, call cleanup() directly (see bottom).
const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expire-demo';
const S3_BUCKET = process.env.S3_BUCKET;
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local'; // 'local' or 's3'

// configure AWS if needed
let s3;
if (STORAGE_PROVIDER === 's3' && process.env.AWS_ACCESS_KEY_ID) {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
}

async function cleanup() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const now = new Date();
  const expired = await User.find({ expireAt: { $lte: now } });

  for (const u of expired) {
    try {
      // delete media
      if (Array.isArray(u.media)) {
        for (const m of u.media) {
          if (!m) continue;
          if (STORAGE_PROVIDER === 's3' && m.key && s3) {
            try {
              await s3.deleteObject({ Bucket: S3_BUCKET, Key: m.key }).promise();
              console.log('Deleted s3 object', m.key);
            } catch (err) {
              console.warn('s3 delete failed', m.key, err.message || err);
            }
          } else {
            // local file: resolve path and unlink if exists
            if (m.key) {
              const localPath = path.join(__dirname, '..', 'uploads', 'users', path.basename(m.key));
              if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
                console.log('Deleted local file', localPath);
              }
            }
          }
        }
      }

      // delete user document
      await User.deleteOne({ _id: u._id });
      console.log('Deleted expired user', u.email);
    } catch (err) {
      console.error('Failed cleanup user', u.email, err);
    }
  }

  await mongoose.disconnect();
}

// Expose start() to schedule cron job inside server
function start() {
  // run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('Running cleanup job', new Date().toISOString());
    cleanup().catch(err => console.error('cleanup failed', err));
  }, {
    timezone: process.env.CRON_TZ || 'UTC'
  });
}

// If run directly, execute once and exit
if (require.main === module) {
  cleanup().then(() => {
    console.log('Cleanup completed');
    process.exit(0);
  }).catch(err => {
    console.error('Cleanup error', err);
    process.exit(1);
  });
}

module.exports = { start, cleanup };