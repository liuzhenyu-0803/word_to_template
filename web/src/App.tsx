import { useState, useEffect } from 'react'
import './App.css'
import DocProcess from './components/doc-process/DocProcess'
import ResultConfirm from './components/result-confirm/ResultConfirm'
import { WS_MESSAGE_TYPE } from './constants'

type AppView = 'doc-process' | 'result-confirm'

function App() {
    const [currentView, setCurrentView] = useState<AppView>('doc-process')
    const [wsMessages, setWsMessages] = useState<string[]>([])
    const [isProcessingComplete, setProcessingComplete] = useState(false)

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3000')

        ws.onopen = () => {
            console.log('App WebSocket connected')
            ws.send(JSON.stringify({
                type: WS_MESSAGE_TYPE.CLIENT_REGISTER,
                clientName: 'web_client'
            }))
        }

        ws.onmessage = (event) => {
            setWsMessages(prev => [...prev, event.data])

            try {
                const data = JSON.parse(event.data)
                if (data.type === WS_MESSAGE_TYPE.DOC_PROCESS_PROGRESS && data.isFinished === 1) {
                    setProcessingComplete(true)
                } else if (data.type === WS_MESSAGE_TYPE.DOC_SAVE_COMPLETE) {
                    downloadTemplate()
                }
            } catch {

            }
        }

        ws.onerror = (error) => {
            console.error('App WebSocket error:', error)
        }

        ws.onclose = () => {
            console.log('App WebSocket disconnected')
        }

        return () => {
            ws.close()
        }
    }, [])

    const downloadTemplate = async () => {
        try {
            const response = await fetch('http://localhost:3000/template')
            if (!response.ok) {
                throw new Error('下载模板失败')
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'template.docx'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            console.log('模板下载成功')
        } catch (error) {
            console.error('下载模板失败:', error)
        }
    }

    const handleBackToUpload = () => {
        setCurrentView('doc-process')
        setProcessingComplete(false)
    }

    const handleShowResult = () => {
        setCurrentView('result-confirm')
    }

    return (
        <>
            {currentView === 'doc-process' && (
                <DocProcess
                    wsMessages={wsMessages}
                    isProcessingComplete={isProcessingComplete}
                    onShowResult={handleShowResult}
                />
            )}
            {currentView === 'result-confirm' && <ResultConfirm onBack={handleBackToUpload} />}
        </>
    )
}

export default App
