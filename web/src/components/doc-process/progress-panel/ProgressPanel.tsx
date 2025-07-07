import { useState, useEffect } from 'react';
import './ProgressPanel.css';
import { useAppContext } from '../../../contexts/AppContext';

function ProgressPanel() {
  const [messages, setMessages] = useState<string[]>([]);
  const { wsMessages } = useAppContext();

  useEffect(() => {
    if (wsMessages.length > messages.length) {
      const newMessages = wsMessages.slice(messages.length);
      newMessages.forEach(msgData => {
        try {
          const data = JSON.parse(msgData);
          if (data.type === 2) {
            setMessages(prev => [...prev, 
              `进度: ${data.progressMessage} ${data.isFinished ? '(完成)' : ''}`
            ]);
          } else {
            setMessages(prev => [...prev, msgData]);
          }
        } catch {
          setMessages(prev => [...prev, msgData]);
        }
      });
    }
  }, [wsMessages, messages.length]);

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