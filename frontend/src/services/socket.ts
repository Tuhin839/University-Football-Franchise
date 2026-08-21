import { io, Socket } from 'socket.io-client';

let rawSocketUrl = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:5000';

const match = rawSocketUrl.match(/https?:\/\/[^\s\)\"\'\]]+/);
if (match) {
  rawSocketUrl = match[0];
} else {
  rawSocketUrl = rawSocketUrl.split('(')[0].trim().replace(/[\[\]]/g, '');
  if (!rawSocketUrl.startsWith('http://') && !rawSocketUrl.startsWith('https://')) {
    rawSocketUrl = `https://${rawSocketUrl}`;
  }
}
rawSocketUrl = rawSocketUrl.replace(/\/+$/, '');

export const socket: Socket = io(rawSocketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
