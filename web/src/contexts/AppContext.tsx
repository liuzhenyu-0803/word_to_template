import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { WS_MESSAGE_TYPE } from '../constants';

export type ProcessingStatus = 
  | 'idle'           // 空闲状态：可以上传文件
  | 'uploading'      // 上传中：UI阻塞，显示"正在上传..."
  | 'processing'     // 处理中：UI阻塞，显示"处理中..."
  | 'ready'          // 完成：UI解锁，显示文件名，可以审核
  | 'error';         // 错误：UI解锁，显示错误信息

interface AppContextType {
    wsMessages: string[];
    processingStatus: ProcessingStatus;
    setProcessingStatus: (status: ProcessingStatus) => void;
    clearMessages: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [wsMessages, setWsMessages] = useState<string[]>([]);
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');

    useEffect(() => {
        const webSocket = new WebSocket('ws://localhost:3000');

        webSocket.onopen = () => {
            webSocket.send(JSON.stringify({
                type: WS_MESSAGE_TYPE.CLIENT_NAME,
                clientName: 'web_client'
            }));
        };

        webSocket.onmessage = (event) => {
            setWsMessages(prev => [...prev, event.data]);

            try {
                const data = JSON.parse(event.data);
                if (data.type === WS_MESSAGE_TYPE.DOC_PROCESS_PROGRESS && data.isFinished === 1) {
                    setProcessingStatus('ready');
                } else if (data.type === WS_MESSAGE_TYPE.DOC_SAVE_COMPLETE) {
                    downloadTemplate();
                }
            } catch (error) {
                console.error('WebSocket message parsing error:', error, event.data);
            }
        };

        webSocket.onerror = (error) => {
            console.error('App WebSocket error:', error);
        };

        webSocket.onclose = () => {
            console.log('App WebSocket disconnected');
        };

        return () => {
            webSocket.close();
        };
    }, []);

    const downloadTemplate = async () => {
        try {
            const response = await fetch('http://localhost:3000/template');
            if (!response.ok) {
                throw new Error('下载模板失败');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'template.docx';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('下载模板失败:', error);
        }
    };

    const clearMessages = () => {
        setWsMessages([]);
    };

    return (
        <AppContext.Provider value={{
            wsMessages,
            processingStatus,
            setProcessingStatus,
            clearMessages
        }}>
            {children}
        </AppContext.Provider>
    );
}