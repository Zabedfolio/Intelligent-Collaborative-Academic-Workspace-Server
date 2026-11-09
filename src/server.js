require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { toNodeHandler } = require('better-auth/node');
const { auth } = require('./lib/auth');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Connect to MongoDB Atlas
connectDB();

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

// Mount V1 API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
