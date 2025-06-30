import React, { useState } from 'react';
import './FileUploadPanel.css';

interface FileUploadPanelProps {
  isProcessingComplete?: boolean;
  onShowResult?: () => void;
}

const FileUploadPanel: React.FC<FileUploadPanelProps> = ({ 
  isProcessingComplete = false,
  onShowResult 
}) => {
  const [fileName, setFileName] = useState<string>('请上传word文档进行处理');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      setFileName('正在上传...');
      
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
        setFileName(file.name);
      } catch (error) {
        console.error('上传错误:', error);
        setFileName('上传失败，请重试');
      }
    }
  };

  const handleClick = () => {
    console.log('图标被点击了');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx';
    input.onchange = (e) => {
      const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    };
    input.click();
  };

  return (
    <div className="file-upload-panel">
      <div className="upload-placeholder">
        <img
          src="/src/assets/file_upload.svg"
          alt="上传图标"
          className="upload-icon"
          width="80"
          height="80"
          onClick={handleClick}
        />
        <p className="upload-text">{fileName}</p>
        
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