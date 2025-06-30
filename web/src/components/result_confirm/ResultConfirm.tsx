import React, { useState, useRef, useEffect } from 'react';
import './ResultConfirm.css';
import ElementsPanel from './elements_panel/ElementsPanel';
import DocumentPanel from './document_panel/DocumentPanel';
import { SyncManager } from './syncManager';

interface ResultConfirmProps {
  onBack: () => void;
}

const ResultConfirm: React.FC<ResultConfirmProps> = ({ onBack }) => {
  const [leftWidth, setLeftWidth] = useState(40); // 左侧面板宽度百分比
  const [isDragging, setIsDragging] = useState(false);
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
    
    // 计算新的左侧宽度百分比
    const newLeftWidth = (mouseX / containerWidth) * 100;
    
    // 限制最小和最大宽度
    const minWidth = 20;
    const maxWidth = 60;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));
    
    setLeftWidth(clampedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
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
  useEffect(() => {
    const checkAndSetIframes = () => {
      if (leftIframeRef.current && rightIframeRef.current && syncManagerRef.current) {
        syncManagerRef.current.setIframes(leftIframeRef.current, rightIframeRef.current);
      }
    };

    // 立即检查
    checkAndSetIframes();

    // 使用定时器延迟检查，确保iframe已经渲染
    const timer = setTimeout(checkAndSetIframes, 100);

    return () => clearTimeout(timer);
  }, [leftIframeRef.current, rightIframeRef.current]);

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
          <ElementsPanel iframeRef={leftIframeRef} />
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
          <DocumentPanel iframeRef={rightIframeRef} />
        </div>
      </div>
    </div>
  );
};

export default ResultConfirm;