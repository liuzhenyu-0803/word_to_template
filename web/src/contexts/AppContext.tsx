import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { WS_MESSAGE_TYPE } from '../constants';

interface AppContextType {
    wsMessages: string[];
    isDocProcessingComplete: boolean;
    isProcessing: boolean;
    setProcessing: (processing: boolean) => void;
    clearMessages: () => void;
    resetProcessingState: () => void;
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

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [wsMessages, setWsMessages] = useState<string[]>([]);
    const [isDocProcessingComplete, setDocProcessingComplete] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const webSocket = new WebSocket('ws://localhost:3000');

        webSocket.onopen = () => {
            console.log('App WebSocket connected');
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
                    setDocProcessingComplete(true);
                    setIsProcessing(false);
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

            console.log('模板下载成功');
        } catch (error) {
            console.error('下载模板失败:', error);
        }
    };

    const clearMessages = () => {
        setWsMessages([]);
    };

    const resetProcessingState = () => {
        setDocProcessingComplete(false);
        setIsProcessing(false);
    };

    const setProcessing = (processing: boolean) => {
        setIsProcessing(processing);
    };

    return (
        <AppContext.Provider value={{
            wsMessages,
            isDocProcessingComplete,
            isProcessing,
            setProcessing,
            clearMessages,
            resetProcessingState
        }}>
            {children}
        </AppContext.Provider>
    );
};