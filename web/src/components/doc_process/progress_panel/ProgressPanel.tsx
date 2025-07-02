import { useState, useEffect } from 'react';
import './ProgressPanel.css';

interface ProgressPanelProps {
  wsMessages?: string[];
}

// { wsMessages = [] }：props对象解构+默认值
function ProgressPanel({ wsMessages = [] }: ProgressPanelProps) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // 处理新增的WebSocket消息
    if (wsMessages.length > messages.length) {
      const newMessages = wsMessages.slice(messages.length);
      newMessages.forEach(msgData => {
        try {
          const data = JSON.parse(msgData);
          if (data.type === 2) {
            // 处理进度消息
            setMessages(prev => [...prev, 
              `进度: ${data.progressMessage} ${data.isFinished ? '(完成)' : ''}`
            ]);
          } else {
            // 其他消息原样显示
            setMessages(prev => [...prev, msgData]);
          }
        } catch {
          // 非JSON消息原样显示
          setMessages(prev => [...prev, msgData]);
        }
      });
    }
  }, [wsMessages]);

  return (
    <div className="progress-panel">
      <div className="progress-panel-header">
        <h3>实时消息</h3>
      </div>
      <div className="progress-panel-content">
        {messages.map((msg, index) => (
          <div key={index} className="message-item">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressPanel;