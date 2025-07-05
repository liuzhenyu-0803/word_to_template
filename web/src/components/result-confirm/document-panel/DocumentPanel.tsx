import { useState, useEffect } from 'react';
import './DocumentPanel.css';

interface DocumentPanelProps {
    iframeRef: (node: HTMLIFrameElement | null) => void;
}

function DocumentPanel({ iframeRef }: DocumentPanelProps) {
    const [docUrl, setDocUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await fetch('http://localhost:3000/document_html');
                if (!response.ok) {
                    throw new Error('获取文档失败');
                }
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setDocUrl(url);
            } catch (err) {
                setError(err instanceof Error ? err.message : '未知错误');
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();

        return () => {
            if (docUrl) {
                URL.revokeObjectURL(docUrl);
            }
        };
    }, []);

    return (
        <div className="document-panel">
            <div className="document-panel-header">
                <h3>文档预览</h3>
            </div>
            <div className="document-panel-content">
                {loading ? (
                    <div className="loading-message">加载中...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <iframe
                        ref={iframeRef}
                        src={docUrl}
                        title="文档预览"
                        className="document-iframe"
                    />
                )}
            </div>
        </div>
    );
};

export default DocumentPanel;