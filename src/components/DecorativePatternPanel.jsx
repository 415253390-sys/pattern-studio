import { useState } from 'react'
import './DecorativePatternPanel.css'

function DecorativePatternPanel({ patterns, onPatternsChange }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleAddPattern = () => {
    if (patterns.length >= 8) {
      alert('最多只能添加 8 个装饰图案')
      return
    }
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/svg+xml'
    input.onchange = (e) => {
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

      const reader = new FileReader()
      reader.onload = (event) => {
        const newPattern = {
          id: Date.now(),
          src: event.target.result,
          name: file.name,
          quantity: 4,
          radius: 150,
          angle: 0,
          scale: 100,
          rotation: 0
        }
        onPatternsChange([...patterns, newPattern])
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
          {patterns.length === 0 ? (
            <p className="empty-text">暂无装饰图案</p>
          ) : (
            <div className="patterns-list">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="pattern-item">
                  <div className="pattern-header">
                    <span className="pattern-name">{pattern.name}</span>
                    <button
                      onClick={() => handleRemovePattern(pattern.id)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
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
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddPattern}
            className="add-pattern-btn"
            disabled={patterns.length >= 8}
          >
            + 添加装饰图案 ({patterns.length}/8)
          </button>
        </div>
      )}
    </div>
  )
}

export default DecorativePatternPanel
