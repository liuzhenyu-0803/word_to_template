import WebSocket from 'ws';
import { WS_MESSAGE_TYPE, CLIENT_NAME } from '../config/constants';


const webSockets = new Set<WebSocket>();


export const handleConnection = (webSocket: WebSocket) => {
    webSockets.add(webSocket);
    console.log(`[WebSocket] 客户端连接，当前连接数: ${webSockets.size}`);

    webSocket.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            console.log(`[WebSocket] 收到消息: ${message.toString()}`);

            if (data.type === WS_MESSAGE_TYPE.CLIENT_REGISTER) {
                (webSocket as any).name = data.clientName;
            }
            else if (data.type === WS_MESSAGE_TYPE.DOC_PROCESS_PROGRESS) {
                sendMessage(CLIENT_NAME.WEB_CLIENT, data);
            } else {
                
            }
        } catch {
            console.warn(`[WebSocket] 非JSON消息: ${message}`);
        }
    });

    webSocket.on('close', () => {
        webSockets.delete(webSocket);
        console.log(`[WebSocket] 客户端断开，剩余连接数: ${webSockets.size}`);
    });
};


export const sendMessage = (clientName: string, message: object): void => {
    for (const ws of webSockets) {
        if ((ws as any).name === clientName) {
            const msg = JSON.stringify(message);
            console.log(`[WebSocket] 向客户端 ${clientName} 发送消息: ${msg}`);
            ws.send(msg);
        }
    }
};