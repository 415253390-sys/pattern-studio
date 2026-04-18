import { useState } from 'react'
import PatternDesigner from './components/PatternDesigner'
import './App.css'

function App() {
  const [theme] = useState('dark')

  return (
    <div className={`app app-${theme}`}>
      <header className="app-header">
        <h1>🎨 Pattern Design Tool</h1>
        <span className="subtitle">专业图案设计工具</span>
      </header>
      <PatternDesigner />
    </div>
  )
}

export default App
