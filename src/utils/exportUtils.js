export async function exportCanvas(canvas, format, resolution) {
  const resolutionMap = { '1x': 1, '2x': 2, '4x': 4 }
  const scale = resolutionMap[resolution]

  // 创建高分辨率画布
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = canvas.width * scale
  exportCanvas.height = canvas.height * scale

  const ctx = exportCanvas.getContext('2d')
  ctx.scale(scale, scale)

  // 复制原画布内容
  const imageData = canvas.getContext('2d').getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  )
  ctx.putImageData(imageData, 0, 0)

  // 生成下载链接
  const link = document.createElement('a')
  link.download = `pattern-${Date.now()}.${format}`

  if (format === 'svg') {
    // SVG 导出（简化版）
    const svgData = canvasToSVG(canvas)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    link.href = URL.createObjectURL(blob)
  } else {
    // PNG 和 JPG 导出
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
    link.href = exportCanvas.toDataURL(mimeType, 0.95)
  }

  link.click()
  URL.revokeObjectURL(link.href)
}

function canvasToSVG(canvas) {
  const imageData = canvas.toDataURL('image/png')
  return `
    <svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
      <image width="${canvas.width}" height="${canvas.height}" href="${imageData}" />
    </svg>
  `
}
