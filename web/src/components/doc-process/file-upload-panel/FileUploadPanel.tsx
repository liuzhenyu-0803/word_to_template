import React, { useState, useRef } from 'react';
import './FileUploadPanel.css';
import fileUploadIcon from '../../../assets/file_upload.svg';
import { useAppContext } from '../../../contexts/AppContext';

interface FileUploadPanelProps {
    onShowResult?: () => void;
}

function FileUploadPanel({
    onShowResult
}: FileUploadPanelProps) {
    const [text, setText] = useState<string>('请上传word文档进行处理');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isDocProcessingComplete, isProcessing, setProcessing, clearMessages, resetProcessingState } = useAppContext();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.docx')) {
            setText('正在上传...');
            clearMessages();
            resetProcessingState();
            setProcessing(true);

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('http://localhost:3000/document', {
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
                setProcessing(false);
            }
        }
    };

    const handleClick = () => {
        if (!isProcessing) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="file-upload-panel">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".docx"
                style={{ display: 'none' }}
                disabled={isProcessing}
            />
            <div className="upload-placeholder">
                <img
                    src={fileUploadIcon}
                    alt="上传图标"
                    className={`upload-icon ${isProcessing ? 'disabled' : ''}`}
                    onClick={handleClick}
                />
                <p className="upload-text">{text}</p>

                {isDocProcessingComplete && (
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
