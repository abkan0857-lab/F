// server.js (snippet - ensure you have http server & socket.io)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const topupRoutes = require('./routes/topup'); // new
const adminRoutes = require('./routes/admin'); // new
const cleanupJob = require('./jobs/cleanup');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/topup', topupRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expire-demo';

// connect db then start http + socket.io
async function start() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('MongoDB connected');

  const server = require('http').createServer(app);

  // socket.io
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: { origin: '*' } // adjust origin in production
  });

  // simple socket auth/rooms: clients should emit 'join' with their userId after connecting
  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('join', (payload) => {
      // payload: { userId }
      if (payload && payload.userId) {
        const room = `user:${payload.userId}`;
        socket.join(room);
        console.log(`socket ${socket.id} joined ${room}`);
      }
    });

    socket.on('disconnect', () => {
      // logging
    });
  });

  // Make io available to routes via app.locals
  app.locals.io = io;

  // start cleanup cron optionally
  if (process.env.ENABLE_CRON === 'true') {
    cleanupJob.start();
    console.log('cleanup cron started');
  }

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});