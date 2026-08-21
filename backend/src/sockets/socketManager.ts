import { Server as SocketIOServer, Socket } from 'socket.io';
import { auctionEngine } from '../services/auctionEngine';
import { tournamentEngine } from '../services/tournamentEngine';

export function initializeSockets(io: SocketIOServer) {
  auctionEngine.setSocketServer(io);
  tournamentEngine.setSocketServer(io);

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Send initial auction stage state on connect
    socket.emit('auction:state_update', auctionEngine.getStageState());

    // Join room channels for targeted event streaming
    socket.on('join:auction', () => {
      socket.join('auction_room');
    });

    socket.on('join:tournament', () => {
      socket.join('tournament_room');
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
