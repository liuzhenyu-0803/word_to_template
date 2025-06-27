import WebSocket from 'ws';

const webSockets = new Set<WebSocket>();

export const handleConnection = (ws: WebSocket) => {
    webSockets.add(ws);
    console.log(`WebSocket Client connected (${webSockets.size} total)`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log(`Receive message: ${message.toString()}`);

            if (data.type === 0) {
                (ws as any).name = data.clientName;
                sendMessage(data.clientName, { type: 0, clientName: data.clientName });
            } else if (data.type === 1) {

            } else if (data.type === 2) {
                sendMessage("web_client", { type: 2, progressMessage: data.progressMessage });
            } else {
                
            }
        } catch {
            console.log(`WebSocket Received message: ${message}`);
            ws.send(`Hello, you sent -> ${message}`);
        }
    });

    ws.on('close', () => {
        webSockets.delete(ws);
        console.log(`WebSocket Client disconnected (${webSockets.size} remaining)`);
    });
};

/**
 * 向指定客户端发送消息
 * @param clientName 客户端名称
 * @param message 要发送的消息内容
 * @returns 是否发送成功
 */
export const sendMessage = (clientName: string, message: string | object): boolean => {
    for (const ws of webSockets) {
        if ((ws as any).name === clientName) {
            const msg = typeof message === 'string' ? message : JSON.stringify(message);
            ws.send(msg);
            return true;
        }
    }
    console.warn(`未找到客户端: ${clientName}`);
    return false;
};