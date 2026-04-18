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
      // 导出成功提示
      const tipText = format === 'png' 
        ? '✅ 已导出 PNG（透明背景）'
        : format === 'svg'
        ? '✅ 已导出 SVG（透明背景）'
        : '✅ 已导出 JPG（白色背景）'
      alert(tipText)
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
            {[
              { value: 'png', label: 'PNG', hint: '透明' },
              { value: 'svg', label: 'SVG', hint: '透明' },
              { value: 'jpg', label: 'JPG', hint: '白底' }
            ].map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setFormat(fmt.value)}
                className={`format-btn ${format === fmt.value ? 'active' : ''}`}
                title={`${fmt.label} - ${fmt.hint}背景`}
              >
                <span>{fmt.label}</span>
                <span className="format-hint">{fmt.hint}</span>
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
          <p className="resolution-hint">
            分辨率：{800 * parseInt(resolution)}×{800 * parseInt(resolution)}px
          </p>
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
      
      <div className="export-tips">
        <p className="tip-title">📌 导出提示：</p>
        <ul>
          <li>PNG/SVG 为透明背景</li>
          <li>JPG 为白色背景（JPG 不支持透明）</li>
          <li>分辨率越高，文件越大</li>
        </ul>
      </div>
    </div>
  )
}

export default ExportPanel
