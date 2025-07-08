import React, { useState, useRef, useEffect, useCallback } from 'react';
import FileUploadPanel from './file-upload-panel/FileUploadPanel';
import ProgressPanel from './progress-panel/ProgressPanel';
import './DocProcess.css';

const SPLITTER_CONFIG = {
    MIN_WIDTH: 20,
    MAX_WIDTH: 80,
    DEFAULT_WIDTH: 50,
};

function useSplitter(initialWidth: number = SPLITTER_CONFIG.DEFAULT_WIDTH) {
    const [leftWidth, setLeftWidth] = useState(initialWidth);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;

        try {
            const containerRect = containerRef.current.getBoundingClientRect();
            const containerWidth = containerRect.width;
            
            const mouseX = e.clientX - containerRect.left;
            const newLeftWidth = (mouseX / containerWidth) * 100;

            const clampedWidth = Math.max(
                SPLITTER_CONFIG.MIN_WIDTH,
                Math.min(SPLITTER_CONFIG.MAX_WIDTH, newLeftWidth)
            );

            setLeftWidth(clampedWidth);
        } catch (error) {
            console.error('Error calculating splitter position:', error);
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

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

    return {
        leftWidth,
        isDragging,
        containerRef,
        handleMouseDown,
    };
}

interface DocProcessProps {
    onShowResult?: () => void;
}

export default function DocProcess({ onShowResult }: DocProcessProps) {
    const { leftWidth, isDragging, containerRef, handleMouseDown } = useSplitter();

    return (
        <div 
            className={`doc-process ${isDragging ? 'dragging' : ''}`} 
            ref={containerRef}
        >
            <div
                className="doc-process-left"
                style={{ width: `${leftWidth}%` }}
            >
                <FileUploadPanel
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
                <ProgressPanel />
            </div>
        </div>
    );
}
