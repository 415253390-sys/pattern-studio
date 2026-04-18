import { useState } from 'react'
import { removeBackground } from '../utils/canvasUtils'
import './CentralPatternPanel.css'

function CentralPatternPanel({
  onPatternUpload,
  scale,
  onScaleChange,
  rotation,
  onRotationChange
}) {
  const [fileName, setFileName] = useState('未选择文件')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型和大小
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      alert('仅支持 JPG、PNG、SVG 格式')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过 5MB')
      return
    }

    setFileName(file.name)
    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        // 如果是 PNG，自动抠图移除背景
        let processedSrc = event.target.result
        
        if (file.type === 'image/png') {
          processedSrc = await removeBackground(event.target.result)
        }

        onPatternUpload({
          src: processedSrc,
          name: file.name,
          type: file.type
        })
      } catch (error) {
        console.error('处理图像失败:', error)
        alert('处理图像失败，请重试')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="central-pattern-panel">
      <h3 className="panel-title">中心图案</h3>

      {/* 文件上传 */}
      <div className="upload-section">
        <label className="file-input-label">
          <input
            type="file"
            accept="image/jpeg,image/png,image/svg+xml"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="file-input"
          />
          <span className="upload-btn" style={{ opacity: isProcessing ? 0.5 : 1 }}>
            {isProcessing ? '⏳ 处理中...' : '📁 上传图案'}
          </span>
        </label>
        <p className="file-name">{fileName}</p>
        <p className="file-hint">JPG/PNG/SVG, 最大 5MB</p>
        <p className="file-hint" style={{ color: '#10b981', marginTop: '4px' }}>
          💡 PNG 图案会自动抠图变透明
        </p>
      </div>

      {/* 缩放控制 */}
      <div className="control-group">
        <label className="control-label">
          缩放比例
          <span className="control-value">{scale}%</span>
        </label>
        <input
          type="range"
          min="10"
          max="200"
          value={scale}
          onChange={(e) => onScaleChange(Number(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>10%</span>
          <span>200%</span>
        </div>
      </div>

      {/* 旋转控制 */}
      <div className="control-group">
        <label className="control-label">
          旋转角度
          <span className="control-value">{rotation}°</span>
        </label>
        <input
          type="range"
          min="0"
          max="360"
          value={rotation}
          onChange={(e) => onRotationChange(Number(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>0°</span>
          <span>360°</span>
        </div>
      </div>
    </div>
  )
}

export default CentralPatternPanel
