import React, { useState, useRef, useEffect } from 'react';
import FileUploadPanel from './file_upload_panel/FileUploadPanel';
import ProgressPanel from './progress_panel/ProgressPanel';
import './DocProcess.css';

interface DocProcessProps {
    wsMessages?: string[];
    isProcessingComplete?: boolean;
    onShowResult?: () => void;
}

function DocProcess({ wsMessages = [], isProcessingComplete = false, onShowResult }: DocProcessProps) {
    const [leftWidth, setLeftWidth] = useState(50); // 左侧面板宽度百分比
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        // 返回元素相对于视口(viewport)的位置和尺寸
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const mouseX = e.clientX - containerRect.left;

        // 计算新的左侧宽度百分比
        const newLeftWidth = (mouseX / containerWidth) * 100;

        // 限制最小和最大宽度
        const minWidth = 20;
        const maxWidth = 80;
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
};

export default DocProcess;