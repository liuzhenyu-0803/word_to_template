"""回调函数模块，提供标准输出回调"""

class CallbackHandler:
    """回调处理类，提供标准输出和连接状态管理"""
    
    def __init__(self):
        """初始化回调处理器"""
        self._ws_client = None
        
    def set_websocket_client(self, ws_client):
        """设置WebSocket客户端实例"""
        self._ws_client = ws_client
        
    def output_callback(self, content: str):
        """
        标准输出回调方法
        :param content: 要输出的内容字符串
        """
        if self._ws_client and self._ws_client.websocket:
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self._ws_client.send({"type": 2, "progressMessage": content}))
                else:
                    print(content)
            except RuntimeError:
                print(content)
            except Exception as e:
                print(content)
        else:
            print(content)

    def end_callback(self, content: str):
        """
        结束回调方法，发送带 isFinished 标记的消息
        :param content: 要输出的内容字符串
        """
        if self._ws_client and self._ws_client.websocket:
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self._ws_client.send({"type": 2, "progressMessage": content, "isFinished": 1}))
                else:
                    print(content)
            except RuntimeError:
                print(content)
            except Exception as e:
                print(content)
        else:
            print(content)

# 创建全局单例实例
callback_handler = CallbackHandler()