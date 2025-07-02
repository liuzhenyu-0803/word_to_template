import React, { useState, useRef } from 'react';
import './FileUploadPanel.css';

interface FileUploadPanelProps {
    isProcessingComplete?: boolean;
    onShowResult?: () => void;
}

function FileUploadPanel({
    isProcessingComplete = false,
    onShowResult
}: FileUploadPanelProps) {
    const [text, setText] = useState<string>('请上传word文档进行处理');
    const fileInputRef = useRef<HTMLInputElement>(null); // 1. 创建 ref

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.docx')) {
            setText('正在上传...');

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('http://localhost:3000/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('上传失败');
                }

                console.log('文件上传成功');
                setText(file.name);
            } catch (error) {
                console.error('上传错误:', error);
                setText('上传失败，请重试');
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="file-upload-panel">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".docx"
                style={{ display: 'none' }}
            />
            <div className="upload-placeholder">
                <img
                    src="/src/assets/file_upload.svg"
                    alt="上传图标"
                    className="upload-icon"
                    onClick={handleClick}
                />
                <p className="upload-text">{text}</p>

                {isProcessingComplete && (
                    <div className="result-actions">
                        <button
                            className="review-result-btn"
                            onClick={onShowResult}
                        >
                            审核处理结果
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadPanel;