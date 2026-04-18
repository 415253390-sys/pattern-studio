import { useState } from 'react'
import { exportCanvas } from '../utils/exportUtils'
import './ExportPanel.css'

function ExportPanel({
  centralPattern,
  centralScale,
  centralRotation,
  decorativePatterns,
  canvasRef
}) {
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState('png')
  const [resolution, setResolution] = useState('1x')

  const handleExport = async () => {
    if (!canvasRef.current) return

    setIsExporting(true)
    try {
      await exportCanvas(canvasRef.current, format, resolution)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="export-panel">
      <h3 className="panel-title">导出设置</h3>

      <div className="export-options">
        {/* 格式选择 */}
        <div className="option-group">
          <label className="option-label">格式</label>
          <div className="format-buttons">
            {['png', 'jpg', 'svg'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`format-btn ${format === fmt ? 'active' : ''}`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 分辨率选择 */}
        <div className="option-group">
          <label className="option-label">分辨率</label>
          <div className="resolution-buttons">
            {['1x', '2x', '4x'].map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`resolution-btn ${resolution === res ? 'active' : ''}`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting || !centralPattern}
        className="export-btn"
      >
        {isExporting ? '导出中...' : '💾 导出图案'}
      </button>

      {!centralPattern && (
        <p className="export-hint">请先上传中心图案</p>
      )}
    </div>
  )
}

export default ExportPanel
