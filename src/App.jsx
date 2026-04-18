import { useState, useEffect } from 'react'
import DigitalClock from './components/DigitalClock'
import './App.css'

function App() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Pattern Studio</h1>
        <button onClick={toggleTheme} className="theme-btn">
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      <main className="main-content">
        <div className="canvas-area">
          <canvas id="pattern-canvas" width="800" height="600"></canvas>
        </div>

        <aside className="sidebar">
          <h2>工具</h2>
          <div className="tools">
            <button className="tool-btn">画笔</button>
            <button className="tool-btn">橡皮擦</button>
            <button className="tool-btn">形状</button>
            <button className="tool-btn">拾色器</button>
          </div>
        </aside>
      </main>

      <section className="clock-section">
        <DigitalClock />
      </section>

      <footer className="footer">
        <p>Pattern Studio v1.0.0</p>
      </footer>
    </div>
  )
}

export default App
