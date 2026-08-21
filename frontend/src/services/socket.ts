import { io, Socket } from 'socket.io-client';

let rawSocketUrl = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:5000';

rawSocketUrl = rawSocketUrl.trim().replace(/[\[\]]/g, '');
if (rawSocketUrl.startsWith('https:/') && !rawSocketUrl.startsWith('https://')) {
  rawSocketUrl = rawSocketUrl.replace('https:/', 'https://');
} else if (rawSocketUrl.startsWith('http:/') && !rawSocketUrl.startsWith('http://')) {
  rawSocketUrl = rawSocketUrl.replace('http:/', 'http://');
} else if (!rawSocketUrl.startsWith('http://') && !rawSocketUrl.startsWith('https://')) {
  rawSocketUrl = `https://${rawSocketUrl}`;
}
rawSocketUrl = rawSocketUrl.replace(/\/+$/, '');

export const socket: Socket = io(rawSocketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
