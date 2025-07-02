import React, { useState, useRef, useEffect } from 'react';
import './ResultConfirm.css';
import ElementsPanel from './elements_panel/ElementsPanel';
import DocumentPanel from './document_panel/DocumentPanel';
import { SyncManager } from './syncManager';

interface ResultConfirmProps {
  onBack: () => void;
}

function ResultConfirm({ onBack }: ResultConfirmProps) {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isLeftIframeLoaded, setIsLeftIframeLoaded] = useState(false);
  const [isRightIframeLoaded, setIsRightIframeLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftIframeRef = useRef<HTMLIFrameElement>(null);
  const rightIframeRef = useRef<HTMLIFrameElement>(null);
  const syncManagerRef = useRef<SyncManager | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    const newLeftWidth = (mouseX / containerWidth) * 100;
    
    const minWidth = 20;
    const maxWidth = 60;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));
    
    setLeftWidth(clampedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        isDragging ? document.body.style.cursor = 'col-resize' : document.body.style.cursor = '';

        if (leftIframeRef.current) {
            leftIframeRef.current.style.pointerEvents = isDragging ? 'none' : 'auto';
        }
        if (rightIframeRef.current) {
            rightIframeRef.current.style.pointerEvents = isDragging ? 'none' : 'auto';
        }
    }, [isDragging]);

  // 初始化同步管理器
  useEffect(() => {
    syncManagerRef.current = new SyncManager();
    
    return () => {
      if (syncManagerRef.current) {
        syncManagerRef.current.destroy();
      }
    };
  }, []);

  // 设置iframe引用 - 需要监听iframe引用的变化
  // 只依赖iframe onLoad事件进行同步
  useEffect(() => {
    if (leftIframeRef.current && rightIframeRef.current &&
        syncManagerRef.current && isLeftIframeLoaded && isRightIframeLoaded) {
      syncManagerRef.current.setIframes(leftIframeRef.current, rightIframeRef.current);
    }
  }, [isLeftIframeLoaded, isRightIframeLoaded, syncManagerRef.current]);

  return (
    <div className={`result-confirm ${isDragging ? 'dragging' : ''}`} ref={containerRef}>
      <div className="result-confirm-header">
        <h2>处理完成</h2>
        <button className="back-button" onClick={onBack}>
          返回上传
        </button>
      </div>
      
      <div className="result-confirm-split-container">
        <div
          className="result-confirm-left"
          style={{ width: `${leftWidth}%` }}
        >
          <ElementsPanel
            iframeRef={leftIframeRef}
            onLoad={() => setIsLeftIframeLoaded(true)}
          />
        </div>
        
        <div
          className="result-confirm-splitter"
          onMouseDown={handleMouseDown}
        >
          <div className="splitter-line" />
        </div>
        
        <div
          className="result-confirm-right"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <DocumentPanel
            iframeRef={rightIframeRef}
            onLoad={() => setIsRightIframeLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default ResultConfirm;