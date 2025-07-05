import { Server } from 'http';
import WebSocket from 'ws';
import { handleConnection } from '../controllers/websocket-controller';

// 初始化WebSocket服务器，绑定到已有的HTTP服务器
export const initWebSocketServer = (httpServer: Server) => {
    const wss = new WebSocket.Server({ server: httpServer });
    // 监听客户端连接事件
    wss.on('connection', handleConnection);
    // 输出WebSocket服务启动信息，包含端口
    const address = httpServer.address();
    let port = '';
    if (typeof address === 'object' && address && 'port' in address) {
        port = String(address.port);
    }
    console.log(`WebSocket Server running: ws://0.0.0.0:${port}`);
};