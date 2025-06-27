import React, { useState, useEffect } from 'react';
import './RightPanel.css';

const RightPanel: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 0,
        clientName: "web_client"
      }));
    };

    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <h3>实时消息</h3>
      </div>
      <div className="right-panel-content">
        {messages.map((msg, index) => (
          <div key={index} className="message-item">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightPanel;