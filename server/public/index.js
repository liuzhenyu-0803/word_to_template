document.addEventListener('DOMContentLoaded', () => {
    const wsBtn = document.getElementById('wsBtn');
    const wsMessages = document.getElementById('wsMessages');
    
    // 创建WebSocket连接
    const ws = new WebSocket(`ws://${window.location.host}`);
    
    wsBtn.addEventListener('click', () => {
        const message = `客户端消息 ${new Date().toLocaleTimeString()}`;
        ws.send(message);
        addMessage(`发送: ${message}`);
    });
    
    ws.onmessage = (event) => {
        addMessage(`收到: ${event.data}`);
    };
    
    ws.onopen = () => {
        addMessage('WebSocket连接已建立');
    };
    
    ws.onclose = () => {
        addMessage('WebSocket连接已关闭');
    };
    
    function addMessage(text) {
        const p = document.createElement('p');
        p.textContent = text;
        wsMessages.appendChild(p);
    }
});