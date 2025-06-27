import { Server } from 'http';
import WebSocket from 'ws';
import { handleConnection } from '../controllers/ws-controller';

export const initWebSocketServer = (httpServer: Server) => {
  const wss = new WebSocket.Server({ server: httpServer });
  wss.on('connection', handleConnection);
  console.log(`WebSocket Server initialized`);
};