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
  const [showPreview, setShowPreview] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [useTransparency, setUseTransparency] = useState(true)
  const [processingStatus, setProcessingStatus] = useState('')

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

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
    setShowPreview(false)
    setProcessingStatus('上传中...')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        let originalSrc = event.target.result
        let processedSrc = originalSrc

        // 如果启用透明背景且是 PNG，自动抠图
        if (useTransparency && file.type === 'image/png') {
          setProcessingStatus('✨ 抠图处理中...')
          console.log('开始抠图处理...')
          processedSrc = await removeBackground(originalSrc)
          setProcessingStatus('✅ 抠图完成！')
        } else if (useTransparency && file.type !== 'image/png') {
          setProcessingStatus('📌 仅 PNG 支持自动透明处理')
        } else {
          setProcessingStatus('✓ 上传成功')
        }

        // 延迟一下再显示预览（让用户��到处理状态）
        setTimeout(() => {
          setPreviewImage(processedSrc)
          setShowPreview(true)
          setProcessingStatus('')
        }, 500)

        onPatternUpload({
          src: originalSrc,
          processedSrc: processedSrc,
          name: file.name,
          type: file.type
        })
      } catch (error) {
        console.error('处理图像失败:', error)
        setProcessingStatus('❌ 处理失败')
        alert('处理图像失败: ' + error.message)
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="central-pattern-panel">
      <h3 className="panel-title">中心图案</h3>

      {/* 透明背景开关 */}
      <div className="transparency-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={useTransparency}
            onChange={(e) => setUseTransparency(e.target.checked)}
            className="toggle-input"
          />
          <span className="toggle-text">
            {useTransparency ? '✓ 自动透明背景' : '✗ 保留原背景'}
          </span>
        </label>
        <p className="toggle-hint">PNG 自动抠图变透明</p>
      </div>

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
        {processingStatus && (
          <p className="processing-status">{processingStatus}</p>
        )}
      </div>

      {/* 预览区域 */}
      {showPreview && previewImage && (
        <div className="preview-section">
          <h4 className="preview-title">✨ 抠图预览</h4>
          <img src={previewImage} alt="preview" className="preview-image" />
        </div>
      )}

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
