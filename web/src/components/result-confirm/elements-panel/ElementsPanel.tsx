import { useState, useEffect, useMemo } from 'react';
import './ElementsPanel.css';
import { generateTableHTML } from './tableTemplate';

interface Element {
    type: string;
    content: string;
}

interface ElementsPanelProps {
    iframeRef: (node: HTMLIFrameElement | null) => void;
}

function ElementsPanel({ iframeRef }: ElementsPanelProps) {
    const [elements, setElements] = useState<Element[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const response = await fetch('http://localhost:3000/elements_htmls');
                if (!response.ok) {
                    throw new Error('获取元素失败');
                }
                const data = await response.json();
                setElements(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : '未知错误');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : elements.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < elements.length - 1 ? prev + 1 : 0));
    };

    const currentElement = elements[currentIndex];

    const htmlContent = useMemo(() => {
        if (!currentElement) return '';
        return generateTableHTML(currentElement.content);
    }, [currentElement?.content]);

    const blobUrl = useMemo(() => {
        if (!htmlContent) return '';
        const blob = new Blob([htmlContent], { type: 'text/html' });
        return URL.createObjectURL(blob);
    }, [htmlContent]);

    useEffect(() => {
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [blobUrl]);

    return (
        <div className="elements-panel">
            <div className="elements-panel-header">
                <h3>元素列表</h3>
                {elements.length > 0 && (
                    <span className="element-counter">
                        {currentIndex + 1} / {elements.length}
                    </span>
                )}
            </div>
            <div className="elements-panel-content">
                {loading ? (
                    <div className="loading-message">加载中...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : elements.length === 0 ? (
                    <div className="empty-message">暂无元素</div>
                ) : (
                    <div className="element-viewer">
                        <button
                            className="nav-button nav-button-left"
                            onClick={handlePrevious}
                            disabled={elements.length <= 1}
                        >
                            &#8249;
                        </button>

                        <div className="element-content">
                            <div className="element-type">{currentElement.type}</div>
                            <div className="element-iframe-container">
                                <iframe
                                    ref={iframeRef}
                                    src={blobUrl}
                                    title={`${currentElement.type} 预览`}
                                    className="element-iframe"
                                />
                            </div>
                        </div>

                        <button
                            className="nav-button nav-button-right"
                            onClick={handleNext}
                            disabled={elements.length <= 1}
                        >
                            &#8250;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ElementsPanel;