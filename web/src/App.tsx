import { useState, useEffect } from 'react'
import './App.css'
import DocProcess from './components/doc_process/DocProcess'
import ResultConfirm from './components/result_confirm/ResultConfirm'

type AppView = 'doc-process' | 'result-confirm'

function App() {
  const [currentView, setCurrentView] = useState<AppView>('doc-process')
  const [wsMessages, setWsMessages] = useState<string[]>([])
  const [isProcessingComplete, setIsProcessingComplete] = useState(false)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000')
    
    ws.onopen = () => {
      console.log('App WebSocket connected')
      ws.send(JSON.stringify({
        type: 0,
        clientName: "web_client"
      }))
    }

    ws.onmessage = (event) => {
      // 收集所有消息供RightPanel显示
      setWsMessages(prev => [...prev, event.data])
      
      try {
        const data = JSON.parse(event.data)
        if (data.type === 2 && data.isFinished === 1) {
          // 处理完成，设置完成状态而不是自动跳转
          setIsProcessingComplete(true)
        }
      } catch {
        // 忽略非JSON消息
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

  const handleBackToUpload = () => {
    setCurrentView('doc-process')
    setIsProcessingComplete(false)
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
    // <>
    //     <ResultConfirm onBack={handleBackToUpload} />
    // </>
  )
}

export default App
