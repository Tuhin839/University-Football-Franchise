import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import configRoutes from './routes/configRoutes';
import playerRoutes from './routes/playerRoutes';
import teamRoutes from './routes/teamRoutes';
import auctionRoutes from './routes/auctionRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import nukeRoutes from './routes/nukeRoutes';
import { initializeSockets } from './sockets/socketManager';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sockets initialization
initializeSockets(io);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/tournament', tournamentRoutes);
app.use('/api/nuke', nukeRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚽ Football League Server running on port ${PORT}`);
  console.log(`📡 WebSocket server initialized (No-Polling Event Streaming)`);
  console.log(`====================================================`);
});
