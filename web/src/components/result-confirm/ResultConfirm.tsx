import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ResultConfirm.css';
import ElementsPanel from './elements-panel/ElementsPanel';
import DocumentPanel from './document-panel/DocumentPanel';
import { SyncManager } from './sync-manager';

interface ResultConfirmProps {
    onBack: () => void;
}

function ResultConfirm({ onBack }: ResultConfirmProps) {
    const [leftWidth, setLeftWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const syncManagerRef = useRef<SyncManager>(null);
    
    // 存储 iframe 引用的 ref
    const leftIframeRef = useRef<HTMLIFrameElement>(null);
    const rightIframeRef = useRef<HTMLIFrameElement>(null);

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
        const maxWidth = 60;
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

    // 处理 iframe 拖拽时的样式
    useEffect(() => {
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

    // 尝试设置同步管理器的函数
    const trySetSyncManager = useCallback(() => {
        if (leftIframeRef.current && rightIframeRef.current && syncManagerRef.current) {
            syncManagerRef.current.setIframes(leftIframeRef.current, rightIframeRef.current);
        }
    }, []);

    // 左侧 iframe 的 callback ref - 管理引用并尝试设置同步管理器
    const handleLeftIframeRef = useCallback((element: HTMLIFrameElement | null) => {
        leftIframeRef.current = element;
        if (element) {
            trySetSyncManager();
        }
    }, [trySetSyncManager]);

    // 右侧 iframe 的 callback ref - 管理引用并尝试设置同步管理器
    const handleRightIframeRef = useCallback((element: HTMLIFrameElement | null) => {
        rightIframeRef.current = element;
        if (element) {
            trySetSyncManager();
        }
    }, [trySetSyncManager]);

    // 保存功能
    const handleSave = useCallback(async () => {
        if (!rightIframeRef.current) {
            console.error('右侧iframe未找到');
            return;
        }

        try {
            setIsSaving(true);
            
            // 获取右侧iframe的HTML内容
            const rightDoc = rightIframeRef.current.contentDocument;
            if (!rightDoc) {
                throw new Error('无法获取右侧iframe内容');
            }
            
            const htmlContent = rightDoc.documentElement.outerHTML;
            
            // 发送到后端
            const response = await fetch('http://localhost:3000/document_html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/html',
                },
                body: htmlContent
            });

            if (!response.ok) {
                throw new Error(`保存失败: ${response.status}`);
            }

            console.log('保存成功');
            // 这里可以添加成功提示
            
        } catch (error) {
            console.error('保存失败:', error);
            // 这里可以添加错误提示
        } finally {
            setIsSaving(false);
        }
    }, []);

    return (
        <div className={`result-confirm ${isDragging ? 'dragging' : ''}`} ref={containerRef}>
            <div className="result-confirm-header">
                <h2>处理完成</h2>
                <div className="header-buttons">
                    <button className="back-button" onClick={onBack}>
                        返回上传
                    </button>
                    <button
                        className="save-button"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>

            <div className="result-confirm-split-container">
                <div
                    className="result-confirm-left"
                    style={{ width: `${leftWidth}%` }}
                >
                    <ElementsPanel iframeRef={handleLeftIframeRef} />
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
                    <DocumentPanel iframeRef={handleRightIframeRef} />
                </div>
            </div>
        </div>
    );
}

export default ResultConfirm;