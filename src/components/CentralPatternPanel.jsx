import { useState } from 'react'
import { removeBackgroundAdvanced, extractImageColors } from '../utils/canvasUtils'
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
  
  // ✅ 新增：颜色拾取器状态
  const [originalImageData, setOriginalImageData] = useState(null)
  const [thumbnailImage, setThumbnailImage] = useState(null)
  const [selectedColors, setSelectedColors] = useState([])
  const [tolerance, setTolerance] = useState(30)
  const [useGlobalRemoval, setUseGlobalRemoval] = useState(true)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [featheringStrength, setFeatheringStrength] = useState(1.0)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('仅支持 JPG、PNG、SVG、GIF、WebP 格式')
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
    setSelectedColors([])

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const originalSrc = event.target.result
        setThumbnailImage(originalSrc)
        setOriginalImageData(originalSrc)

        let processedSrc = originalSrc

        if (useTransparency) {
          setProcessingStatus('✨ 自动抠图中...')
          console.log(`开始自动抠图处理 (${file.type})`)
          
          processedSrc = await removeBackgroundAdvanced(originalSrc, {
            targetColors: [],
            tolerance: tolerance,
            useGlobalRemoval: useGlobalRemoval,
            featheringStrength: featheringStrength
          })
          
          setProcessingStatus('✅ 抠图完成！')
          setShowColorPicker(true)
        } else {
          setProcessingStatus('✓ 上传成功')
        }

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

  // ✅ 吸管工具：点击缩略图获取颜色
  const handleColorPick = async (e) => {
    if (!thumbnailImage) return
    
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    try {
      const imageData = await extractImageColors(thumbnailImage)
      const data = imageData.data
      const pixelIndex = (Math.floor(y) * imageData.width + Math.floor(x)) * 4
      
      const pickedColor = {
        r: data[pixelIndex],
        g: data[pixelIndex + 1],
        b: data[pixelIndex + 2]
      }
      
      console.log('拾取颜色:', pickedColor)
      
      // 添加到选中颜色列表
      const newColors = [...selectedColors, pickedColor]
      if (newColors.length > 2) {
        newColors.shift() // 最多保留2种颜色
      }
      setSelectedColors(newColors)
      
      // 重新处理
      await reprocessWithNewColors(newColors)
      
    } catch (error) {
      console.error('拾取颜色失败:', error)
    }
  }

  // 重新处理图像
  const reprocessWithNewColors = async (colors) => {
    if (!originalImageData) return
    
    setProcessingStatus('🔄 重新处理中...')
    
    try {
      const processedSrc = await removeBackgroundAdvanced(originalImageData, {
        targetColors: colors,
        tolerance: tolerance,
        useGlobalRemoval: useGlobalRemoval,
        featheringStrength: featheringStrength
      })
      
      setPreviewImage(processedSrc)
      setProcessingStatus('✅ 处理完成！')
      
      setTimeout(() => setProcessingStatus(''), 1500)
      
      // 更新上传的图案
      onPatternUpload({
        src: originalImageData,
        processedSrc: processedSrc,
        name: fileName,
        type: 'image/png'
      })
    } catch (error) {
      console.error('重新处理失败:', error)
      setProcessingStatus('❌ 处理失败')
    }
  }

  // 清除选中颜色
  const clearSelectedColors = () => {
    setSelectedColors([])
    setProcessingStatus('')
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
        <p className="toggle-hint">点击缩略图吸取背景色</p>
      </div>

      {/* 文件上传 */}
      <div className="upload-section">
        <label className="file-input-label">
          <input
            type="file"
            accept="image/jpeg,image/png,image/svg+xml,image/gif,image/webp"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="file-input"
          />
          <span className="upload-btn" style={{ opacity: isProcessing ? 0.5 : 1 }}>
            {isProcessing ? '⏳ 处理中...' : '📁 上传图案'}
          </span>
        </label>
        <p className="file-name">{fileName}</p>
        <p className="file-hint">JPG/PNG/SVG/GIF/WebP, 最大 5MB</p>
        {processingStatus && (
          <p className="processing-status">{processingStatus}</p>
        )}
      </div>

      {/* ✅ 颜色拾取器 */}
      {showColorPicker && thumbnailImage && useTransparency && (
        <div className="color-picker-section">
          <h4 className="color-picker-title">🎨 多目标颜色拾取</h4>
          <p className="color-picker-hint">点击缩略图吸取背景颜色（最多2种）</p>
          
          <canvas
            className="thumbnail-canvas"
            onClick={handleColorPick}
            style={{
              backgroundImage: `url(${thumbnailImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
            width={100}
            height={100}
          />
          
          {/* 已选颜色显示 */}
          {selectedColors.length > 0 && (
            <div className="selected-colors">
              <p className="colors-label">已选颜色：</p>
              <div className="colors-display">
                {selectedColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="color-chip"
                    style={{
                      backgroundColor: `rgb(${color.r},${color.g},${color.b})`
                    }}
                    title={`RGB(${color.r},${color.g},${color.b})`}
                  >
                    <span className="color-index">{idx + 1}</span>
                  </div>
                ))}
              </div>
              <button onClick={clearSelectedColors} className="clear-colors-btn">
                🔄 清除
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ 抠图参数调整 */}
      {useTransparency && (
        <div className="advanced-settings">
          <h4 className="settings-title">⚙️ 高级设置</h4>
          
          {/* 容差滑块 */}
          <div className="control-group">
            <label className="control-label">
              容差值
              <span className="control-value">{tolerance}</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={tolerance}
              onChange={(e) => {
                setTolerance(Number(e.target.value))
                if (selectedColors.length > 0 || originalImageData) {
                  reprocessWithNewColors(selectedColors)
                }
              }}
              className="slider"
            />
            <div className="slider-labels">
              <span>严格</span>
              <span>宽松</span>
            </div>
          </div>

          {/* 全局消除开关 */}
          <div className="setting-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={useGlobalRemoval}
                onChange={(e) => {
                  setUseGlobalRemoval(e.target.checked)
                  if (selectedColors.length > 0 || originalImageData) {
                    reprocessWithNewColors(selectedColors)
                  }
                }}
                className="toggle-input"
              />
              <span className="toggle-text">全局深度消除</span>
            </label>
            <p className="toggle-hint">穿透图像内部，清理孤岛</p>
          </div>

          {/* 羽化强度 */}
          <div className="control-group">
            <label className="control-label">
              羽化强度
              <span className="control-value">{(featheringStrength * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.2"
              max="2"
              step="0.1"
              value={featheringStrength}
              onChange={(e) => {
                setFeatheringStrength(Number(e.target.value))
                if (selectedColors.length > 0 || originalImageData) {
                  reprocessWithNewColors(selectedColors)
                }
              }}
              className="slider"
            />
            <div className="slider-labels">
              <span>轻柔</span>
              <span>强烈</span>
            </div>
          </div>
        </div>
      )}

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
