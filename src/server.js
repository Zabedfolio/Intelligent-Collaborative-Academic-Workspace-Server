const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { toNodeHandler } = require('better-auth/node');
const { auth } = require('./lib/auth');
const { requireAuth } = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Enable CORS for Next.js frontend with cookie credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

// Mount Better Auth handler on Express
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());

// Public Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API & Better Auth operational',
    timestamp: new Date().toISOString()
  });
});

// Protected Session Route
app.get('/api/v1/auth/me', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    user: req.user,
    session: req.session
  });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
