import { useMemo, useRef, useEffect } from 'react';
import './ProgressPanel.css';
import { useAppContext } from '../../../contexts/AppContext';
import { WS_MESSAGE_TYPE } from '../../../constants';

export default function ProgressPanel() {
  const { wsMessages } = useAppContext();
  const contentRef = useRef<HTMLDivElement>(null);

  const processedMessages = useMemo(() => {
    return wsMessages.map(msgData => {
      try {
        const data = JSON.parse(msgData);
        if (data.type === WS_MESSAGE_TYPE.DOC_PROCESS_PROGRESS) {
          return `进度: ${data.progressMessage} ${data.isFinished ? '(完成)' : ''}`;
        }
        return msgData;
      } catch {
        return msgData;
      }
    });
  }, [wsMessages]);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [wsMessages]);

  return (
    <div className="progress-panel">
      <div className="progress-panel-header">
        <h3>实时消息</h3>
      </div>
      <div className="progress-panel-content" ref={contentRef}>
        {processedMessages.map((msg, index) => (
          <div key={index} className="message-item">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
