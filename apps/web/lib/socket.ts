import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getTrackingSocket(token: string): Socket {
  if (socket) return socket;

  socket = io(`${process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000'}/ws`, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
}

export function disconnectTrackingSocket() {
  socket?.disconnect();
  socket = null;
}
