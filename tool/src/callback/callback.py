"""回调函数模块，提供标准输出回调"""

class CallbackHandler:
    """回调处理类，提供标准输出和连接状态管理"""
    
    def __init__(self):
        """初始化回调处理器"""
        self._ws_client = None
        self._message_type = 1  # 默认消息类型
        
    def set_websocket_client(self, ws_client):
        """设置WebSocket客户端实例"""
        self._ws_client = ws_client
        
    def set_websocket_message_type(self, message_type):
        """设置WebSocket消息类型"""
        self._message_type = message_type
        
    async def output_callback(self, content: str):
        """
        标准输出回调方法
        :param content: 要输出的内容字符串
        """
        if self._ws_client and self._ws_client.websocket:
            await self._ws_client.send({"type": self._message_type, "progressMessage": content})
        else:
            print(content)

    async def end_callback(self, content: str):
        """
        结束回调方法，发送带 isFinished 标记的消息
        :param content: 要输出的内容字符串
        """
        if self._ws_client and self._ws_client.websocket:
            await self._ws_client.send({"type": self._message_type, "progressMessage": content, "isFinished": 1})
        else:
            print(content)

# 创建全局单例实例
callback_handler = CallbackHandler()