import { useState } from 'react'
import { removeBackgroundAdvanced } from '../utils/canvasUtils'
import './DecorativePatternPanel.css'

function DecorativePatternPanel({ patterns, onPatternsChange }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [processingStatus, setProcessingStatus] = useState({})
  const [useTransparency, setUseTransparency] = useState(true)
  const [expandedPreview, setExpandedPreview] = useState(null)

  const handleAddPattern = () => {
    if (patterns.length >= 8) {
      alert('最多只能添加 8 个装饰图案')
      return
    }
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/svg+xml,image/gif,image/webp'
    input.onchange = async (e) => {
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

      const newId = Date.now()
      setProcessingId(newId)
      setProcessingStatus(prev => ({...prev, [newId]: '上传中...'}))

      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          let originalSrc = event.target.result
          let processedSrc = originalSrc

          if (useTransparency) {
            setProcessingStatus(prev => ({...prev, [newId]: '✨ 抠图处理中...'}))
            console.log(`装饰图案开始抠图处理 (${file.type})`)
            processedSrc = await removeBackgroundAdvanced(originalSrc, {
              targetColors: [],
              tolerance: 30,
              useGlobalRemoval: true,
              featheringStrength: 1.0
            })
            setProcessingStatus(prev => ({...prev, [newId]: '✅ 抠图完成！'}))
            console.log('装饰图案抠图完成')
          } else {
            setProcessingStatus(prev => ({...prev, [newId]: '✓ 上传成功'}))
          }

          // ✅ 核心修改：faceCenter 默认为 false，但需要点开后上传时底部朝向中心
          const newPattern = {
            id: newId,
            src: originalSrc,
            processedSrc: processedSrc,
            name: file.name,
            quantity: 4,
            radius: 150,
            angle: 0,
            scale: 100,
            rotation: 0,
            faceCenter: false,
            faceDirection: 'none'  // ✅ 新增：朝向方向（none/center/bottom/top/left/right）
          }
          onPatternsChange([...patterns, newPattern])
          setExpandedPreview(newId)

          setTimeout(() => {
            setProcessingStatus(prev => {
              const newStatus = {...prev}
              delete newStatus[newId]
              return newStatus
            })
          }, 1500)

        } catch (error) {
          console.error('处理装饰图案失败:', error)
          setProcessingStatus(prev => ({...prev, [newId]: '❌ 处理失败'}))
          alert('处理图像失败: ' + error.message)
          
          setTimeout(() => {
            setProcessingStatus(prev => {
              const newStatus = {...prev}
              delete newStatus[newId]
              return newStatus
            })
          }, 2000)
        } finally {
          setProcessingId(null)
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleRemovePattern = (id) => {
    onPatternsChange(patterns.filter(p => p.id !== id))
  }

  const handleUpdatePattern = (id, updates) => {
    onPatternsChange(
      patterns.map(p => p.id === id ? { ...p, ...updates } : p)
    )
  }

  return (
    <div className="decorative-pattern-panel">
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="panel-title">装饰图案</h3>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="panel-body">
          {/* 全局透明背景开关 */}
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
            <p className="toggle-hint">自动抠图去除背景</p>
          </div>

          {patterns.length === 0 ? (
            <p className="empty-text">暂无装饰图案</p>
          ) : (
            <div className="patterns-list">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="pattern-item">
                  <div className="pattern-header">
                    <div className="pattern-info">
                      <span className="pattern-name">{pattern.name}</span>
                      {processingStatus[pattern.id] && (
                        <span className="pattern-status">{processingStatus[pattern.id]}</span>
                      )}
                    </div>
                    <div className="pattern-actions">
                      <button
                        onClick={() => setExpandedPreview(
                          expandedPreview === pattern.id ? null : pattern.id
                        )}
                        className="preview-btn"
                        title="查看抠图预览"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleRemovePattern(pattern.id)}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* 预览展开 */}
                  {expandedPreview === pattern.id && pattern.processedSrc && (
                    <div className="preview-expanded">
                      <h5 className="preview-label">✨ 抠图预览</h5>
                      <img src={pattern.processedSrc} alt="preview" className="preview-img" />
                    </div>
                  )}

                  {/* ✅ 朝向方向选择 - 新增：底部朝向中心 */}
                  <div className="face-direction-selector">
                    <label className="direction-label">朝向中心：</label>
                    <div className="direction-buttons">
                      <button
                        onClick={() => handleUpdatePattern(pattern.id, { faceDirection: 'none' })}
                        className={`direction-btn ${pattern.faceDirection === 'none' ? 'active' : ''}`}
                        title="不朝向"
                      >
                        🔄 自由
                      </button>
                      <button
                        onClick={() => handleUpdatePattern(pattern.id, { faceDirection: 'center' })}
                        className={`direction-btn ${pattern.faceDirection === 'center' ? 'active' : ''}`}
                        title="图案底部指向中心"
                      >
                        👇 底部
                      </button>
                      <button
                        onClick={() => handleUpdatePattern(pattern.id, { faceDirection: 'top' })}
                        className={`direction-btn ${pattern.faceDirection === 'top' ? 'active' : ''}`}
                        title="图案顶部指向中心"
                      >
                        👆 顶部
                      </button>
                    </div>
                  </div>

                  {/* 数量 */}
                  <div className="control-group">
                    <label className="control-label">
                      数量：<span className="value">{pattern.quantity}</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={pattern.quantity}
                      onChange={(e) =>
                        handleUpdatePattern(pattern.id, {
                          quantity: Number(e.target.value)
                        })
                      }
                      className="slider"
                    />
                  </div>

                  {/* 环绕半径 */}
                  <div className="control-group">
                    <label className="control-label">
                      半径：<span className="value">{pattern.radius}px</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      value={pattern.radius}
                      onChange={(e) =>
                        handleUpdatePattern(pattern.id, {
                          radius: Number(e.target.value)
                        })
                      }
                      className="slider"
                    />
                  </div>

                  {/* 分布角度 */}
                  <div className="control-group">
                    <label className="control-label">
                      角度偏移：<span className="value">{pattern.angle}°</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={pattern.angle}
                      onChange={(e) =>
                        handleUpdatePattern(pattern.id, {
                          angle: Number(e.target.value)
                        })
                      }
                      className="slider"
                    />
                  </div>

                  {/* 缩放 */}
                  <div className="control-group">
                    <label className="control-label">
                      缩放：<span className="value">{pattern.scale}%</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={pattern.scale}
                      onChange={(e) =>
                        handleUpdatePattern(pattern.id, {
                          scale: Number(e.target.value)
                        })
                      }
                      className="slider"
                    />
                  </div>

                  {/* 旋转 */}
                  <div className="control-group">
                    <label className="control-label">
                      旋转：<span className="value">{pattern.rotation}°</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={pattern.rotation}
                      onChange={(e) =>
                        handleUpdatePattern(pattern.id, {
                          rotation: Number(e.target.value)
                        })
                      }
                      className="slider"
                    />
                    <p className="slider-hint">
                      {pattern.faceDirection !== 'none' ? `🎯 ${pattern.faceDirection === 'center' ? '底部' : '顶部'}朝向中心` : '🔄 绕自身中心点旋转'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddPattern}
            className="add-pattern-btn"
            disabled={patterns.length >= 8 || processingId !== null}
            style={{ opacity: processingId !== null ? 0.5 : 1 }}
          >
            {processingId !== null 
              ? '⏳ 处理中...' 
              : `+ 添加装饰图案 (${patterns.length}/8)`}
          </button>
        </div>
      )}
    </div>
  )
}

export default DecorativePatternPanel
