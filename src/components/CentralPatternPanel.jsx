import { useState } from 'react'
import './CentralPatternPanel.css'

function CentralPatternPanel({
  onPatternUpload,
  scale,
  onScaleChange,
  rotation,
  onRotationChange
}) {
  const [fileName, setFileName] = useState('未选择文件')

  const handleFileUpload = (e) => {
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
    const reader = new FileReader()
    reader.onload = (event) => {
      onPatternUpload({
        src: event.target.result,
        name: file.name,
        type: file.type
      })
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
            className="file-input"
          />
          <span className="upload-btn">📁 上传图案</span>
        </label>
        <p className="file-name">{fileName}</p>
        <p className="file-hint">JPG/PNG/SVG, 最大 5MB</p>
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
