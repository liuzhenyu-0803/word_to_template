import React, { useState, useRef } from 'react';
import './FileUploadPanel.css';
import fileUploadIcon from '../../../assets/file_upload.svg';
import { useAppContext } from '../../../contexts/AppContext';

interface FileUploadPanelProps {
    onShowResult?: () => void;
}

export default function FileUploadPanel({ onShowResult }: FileUploadPanelProps) {
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { processingStatus, setProcessingStatus, clearMessages } = useAppContext();

    const isUIBlocked = processingStatus === 'uploading' || processingStatus === 'processing';
    const isReadyForReview = processingStatus === 'ready';
    
    const getDisplayText = () => {
        switch (processingStatus) {
            case 'idle':
                return '请上传word文档进行处理';
            case 'uploading':
                return '正在上传...';
            case 'processing':
                return '处理中...';
            case 'ready':
                return uploadedFileName || '处理完成';
            case 'error':
                return '上传失败，请重试';
            default:
                return '请上传word文档进行处理';
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.docx')) {
            setProcessingStatus('uploading');
            setUploadedFileName('');
            clearMessages();

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
                
                setUploadedFileName(file.name);
                setProcessingStatus('processing');
            } catch (error) {
                console.error('上传错误:', error);
                setProcessingStatus('error');
                setUploadedFileName('');
            }
        }
    };

    const handleClick = () => {
        if (!isUIBlocked) {
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
                disabled={isUIBlocked}
            />
            <div className="upload-placeholder">
                <img
                    src={fileUploadIcon}
                    alt="上传图标"
                    className={`upload-icon ${isUIBlocked ? 'disabled' : ''}`}
                    onClick={handleClick}
                />
                <p className="upload-text">{getDisplayText()}</p>

                {isReadyForReview && (
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
}
