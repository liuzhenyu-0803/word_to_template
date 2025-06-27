import asyncio
import websockets
import json

class WebSocketClient:
    def __init__(self, uri, client_name, on_message=None):
        self.uri = uri
        self.client_name = client_name
        self.on_message = on_message
        self.websocket = None

    async def connect(self):
        async with websockets.connect(self.uri) as ws:
            self.websocket = ws
            # 设置callback_handler的WebSocket客户端引用
            from callback.callback import callback_handler
            callback_handler.set_websocket_client(self)
            # 首次发送身份消息
            await self.send({
                "type": 0,
                "clientName": self.client_name
            })
            # 启动接收消息任务
            recv_task = asyncio.create_task(self._receive_loop())
            # 保持事件循环直到连接关闭
            await ws.wait_closed()
            await recv_task

    async def send(self, data):
        if self.websocket:
            await self.websocket.send(json.dumps(data))

    async def _receive_loop(self):
        async for message in self.websocket:
            if self.on_message:
                await self.on_message(message)

# 用法示例
async def on_message(msg):
    from callback.callback import callback_handler
    from task.task import startTask
    import json
    
    print(f"收到消息: {msg}")
    
    try:
        # 检查消息是否是有效的JSON
        if not msg or not msg.strip().startswith('{'):
            raise ValueError("无效的JSON消息格式")
            
        data = json.loads(msg)
        if isinstance(data, dict) and data.get("type") == 1 and data.get("docPath"):
            doc_path = data["docPath"]
            callback_handler.output_callback(f"开始处理文档: {doc_path}")
            startTask(doc_path)
        else:
            callback_handler.output_callback("消息格式不符合要求")
    except json.JSONDecodeError:
        callback_handler.output_callback("消息不是有效的JSON格式")
    except Exception as e:
        callback_handler.output_callback(f"处理消息时出错: {str(e)}")

# 单例 WebSocketClient 实例，可被其它模块直接引用
ws_client = WebSocketClient("ws://localhost:3000", "tool_client", on_message)

async def main():
    await ws_client.connect()
    # 事件循环由 connect 内部保持，无需额外死循环

if __name__ == "__main__":
    asyncio.run(main())