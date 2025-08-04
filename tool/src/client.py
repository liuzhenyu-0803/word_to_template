import asyncio
import websockets
import json
import requests
import os
from global_define.constants import (
    WS_MESSAGE_TYPE, WS_SERVER_URL, CLIENT_NAME, HTTP_SERVER_URL,
    TEMPLATE_UPLOAD_FILENAME, TEMPLATE_MIME_TYPE
)

class WebSocketClient:
    def __init__(self, url, client_name, on_message=None):
        self.url = url
        self.client_name = client_name
        self.on_message = on_message
        self.websocket = None

    async def connect(self):
        async with websockets.connect(self.url) as ws:
            self.websocket = ws
            
            from callback.callback import callback_handler
            callback_handler.set_websocket_client(self)

            await self.send({
                "type": WS_MESSAGE_TYPE['CLIENT_REGISTER'],
                "clientName": self.client_name
            })

            asyncio.create_task(self._receive_loop())

            await ws.wait_closed()

    async def send(self, data):
        if self.websocket:
            await self.websocket.send(json.dumps(data))
            await asyncio.sleep(0)

    async def _receive_loop(self):
        async for message in self.websocket:
            if self.on_message:
                await self.on_message(message)

# 用法示例
async def on_message(msg):
    from callback.callback import callback_handler
    from task.task import startProcessTask, startSaveTask
    import json
    
    print(f"收到消息: {msg}")
    
    try:
        # 检查消息是否是有效的JSON
        if not msg or not msg.strip().startswith('{'):
            raise ValueError("无效的JSON消息格式")
            
        data = json.loads(msg)
        if isinstance(data, dict) and data.get("type") == WS_MESSAGE_TYPE['DOC_PROCESS_START'] and data.get("docPath"):
            doc_path = data["docPath"]
            await startProcessTask(doc_path)
        elif isinstance(data, dict) and data.get("type") == WS_MESSAGE_TYPE['DOC_SAVE_START'] and data.get("htmlPath"):
            html_path = data["htmlPath"]
            await startSaveTask(html_path)
        
    except json.JSONDecodeError:
        await callback_handler.output_callback("消息不是有效的JSON格式")
    except Exception as e:
        callback_handler.output_callback(f"处理消息时出错: {str(e)}")

# 单例 WebSocketClient 实例，可被其它模块直接引用
ws_client = WebSocketClient(WS_SERVER_URL, CLIENT_NAME, on_message)


async def upload_template(template_path: str, server_url: str = HTTP_SERVER_URL):
    """
    上传模板文件到服务器
    :param template_path: 模板文件路径
    :param server_url: 服务器地址
    :return: 上传结果
    """
    try:
        if not os.path.exists(template_path):
            raise FileNotFoundError(f"模板文件不存在: {template_path}")
        
        url = f"{server_url}/template"
        
        with open(template_path, 'rb') as file:
            files = {'file': (TEMPLATE_UPLOAD_FILENAME, file, TEMPLATE_MIME_TYPE)}
            response = requests.post(url, files=files)
        
        if response.status_code == 200:
            print(f"模板上传成功: {response.json()}")
            return True
        else:
            print(f"模板上传失败: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"上传模板时发生错误: {e}")
        return False
    

async def main():
    await ws_client.connect()

if __name__ == "__main__":
    # 启动异步事件循环并运行main()协程
    # 注意：asyncio.run()会创建新事件循环，运行main()直到完成
    # 在main()中通过ws.wait_closed()保持连接，直到WebSocket关闭
    asyncio.run(main())