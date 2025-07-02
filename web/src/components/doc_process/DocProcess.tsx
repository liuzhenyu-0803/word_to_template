import React, { useState, useRef, useEffect, useCallback } from 'react';
import FileUploadPanel from './file_upload_panel/FileUploadPanel';
import ProgressPanel from './progress_panel/ProgressPanel';
import './DocProcess.css';

interface DocProcessProps {
    wsMessages?: string[];
    isProcessingComplete?: boolean;
    onShowResult?: () => void;
}

function DocProcess({ wsMessages = [], isProcessingComplete = false, onShowResult }: DocProcessProps) {
    const [leftWidth, setLeftWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 拖拽处理逻辑
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    // 使用 useCallback 缓存事件处理函数
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const mouseX = e.clientX - containerRect.left;
        const newLeftWidth = (mouseX / containerWidth) * 100;

        const minWidth = 20;
        const maxWidth = 80;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));

        setLeftWidth(clampedWidth);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 只在拖拽状态变化时添加/移除事件监听器
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // 处理拖拽时的全局样式
    useEffect(() => {
        document.body.style.cursor = isDragging ? 'col-resize' : '';

        return () => {
            document.body.style.cursor = '';
        };
    }, [isDragging]);

    return (
        <div className="doc-process" ref={containerRef}>
            <div
                className="doc-process-left"
                style={{ width: `${leftWidth}%` }}
            >
                <FileUploadPanel
                    isProcessingComplete={isProcessingComplete}
                    onShowResult={onShowResult}
                />
            </div>

            <div
                className="doc-process-splitter"
                onMouseDown={handleMouseDown}
            >
                <div className="splitter-line" />
            </div>

            <div
                className="doc-process-right"
                style={{ width: `${100 - leftWidth}%` }}
            >
                <ProgressPanel wsMessages={wsMessages} />
            </div>
        </div>
    );
}

export default DocProcess;