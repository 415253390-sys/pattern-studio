import { useState, useRef, useEffect } from 'react'
import CentralPatternPanel from './CentralPatternPanel'
import DecorativePatternPanel from './DecorativePatternPanel'
import ExportPanel from './ExportPanel'
import { renderCanvas } from '../utils/canvasUtils'
import './PatternDesigner.css'

function PatternDesigner() {
  const canvasRef = useRef(null)
  const [centralPattern, setCentralPattern] = useState(null)
  const [centralScale, setCentralScale] = useState(100)
  const [centralRotation, setCentralRotation] = useState(0)
  const [decorativePatterns, setDecorativePatterns] = useState([])

  // 实时渲染画布
  useEffect(() => {
    if (canvasRef.current) {
      renderCanvas(canvasRef.current, {
        centralPattern,
        centralScale,
        centralRotation,
        decorativePatterns
      })
    }
  }, [centralPattern, centralScale, centralRotation, decorativePatterns])

  return (
    <div className="pattern-designer">
      {/* 左侧控制面板 */}
      <div className="control-panel">
        <div className="panel-content">
          <CentralPatternPanel
            onPatternUpload={setCentralPattern}
            scale={centralScale}
            onScaleChange={setCentralScale}
            rotation={centralRotation}
            onRotationChange={setCentralRotation}
          />
          
          <div className="panel-divider"></div>
          
          <DecorativePatternPanel
            patterns={decorativePatterns}
            onPatternsChange={setDecorativePatterns}
          />
        </div>

        <div className="panel-footer">
          <ExportPanel
            centralPattern={centralPattern}
            centralScale={centralScale}
            centralRotation={centralRotation}
            decorativePatterns={decorativePatterns}
            canvasRef={canvasRef}
          />
        </div>
      </div>

      {/* 右侧画布区域 */}
      <div className="canvas-area">
        <div className="canvas-size-label">
          🔵 800×800px
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="design-canvas"
        ></canvas>
      </div>
    </div>
  )
}

export default PatternDesigner
