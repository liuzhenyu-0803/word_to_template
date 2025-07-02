import { useState, useEffect } from 'react'
import './App.css'
import DocProcess from './components/doc_process/DocProcess'
import ResultConfirm from './components/result_confirm/ResultConfirm'

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
        type: 0,
        clientName: "web_client"
      }))
    }

    ws.onmessage = (event) => {
      // 函数式更新状态，确保获取到最新的状态
      setWsMessages(prev => [...prev, event.data])
      
      // 不加try-catch会导致非JSON消息抛出错误，只会中断当前函数，但不影响后续继续接收消息
      // 但推荐加上try-catch，不会抛出错误，更具有健壮性
      try {
        const data = JSON.parse(event.data)
        if (data.type === 2 && data.isFinished === 1) {
          setProcessingComplete(true)
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

    // 清理函数
    return () => {
      ws.close()
    }
  }, [])

  const handleBackToUpload = () => {
    setCurrentView('doc-process')
    setProcessingComplete(false)
  }

  const handleShowResult = () => {
    setCurrentView('result-confirm')
  }

  // 圆括号：包裹多行，作为单一表达式，单行可省略，但加上可读性更高
  // 花括号：嵌入js表达式
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
