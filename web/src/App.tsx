import { useState } from 'react'
import './App.css'
import DocProcess from './components/doc-process/DocProcess'
import ResultConfirm from './components/result-confirm/ResultConfirm'
import { AppProvider } from './contexts/AppContext'

type AppView = 'doc-process' | 'result-confirm'

function App() {
    const [currentView, setCurrentView] = useState<AppView>('doc-process')

    const handleBackToUpload = () => {
        setCurrentView('doc-process')
    }

    const handleShowResult = () => {
        setCurrentView('result-confirm')
    }

    return (
        <AppProvider>
            {currentView === 'doc-process' && (
                <DocProcess onShowResult={handleShowResult} />
            )}
            {currentView === 'result-confirm' && <ResultConfirm onBack={handleBackToUpload} />}
        </AppProvider>
    )
}

export default App
