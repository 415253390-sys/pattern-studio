export async function exportCanvas(canvas, format, resolution) {
  const resolutionMap = { '1x': 1, '2x': 2, '4x': 4 }
  const scale = resolutionMap[resolution]

  // 创建高分辨率画布（透明背景）
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = canvas.width * scale
  exportCanvas.height = canvas.height * scale

  const ctx = exportCanvas.getContext('2d')
  ctx.scale(scale, scale)

  // 复制原画布内容（保持透明）
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
    // SVG 导出（透明背景）
    const svgData = canvasToSVG(canvas, scale)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    link.href = URL.createObjectURL(blob)
  } else if (format === 'png') {
    // PNG 导出（透明背景）
    link.href = exportCanvas.toDataURL('image/png')
  } else if (format === 'jpg') {
    // JPG 导出（白色背景，因为JPG不支持透明）
    const jpgCanvas = document.createElement('canvas')
    jpgCanvas.width = exportCanvas.width
    jpgCanvas.height = exportCanvas.height
    const jpgCtx = jpgCanvas.getContext('2d')
    
    // 填充白色背景
    jpgCtx.fillStyle = '#ffffff'
    jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height)
    
    // 绘制透明图像到白色背景上
    jpgCtx.drawImage(exportCanvas, 0, 0)
    
    link.href = jpgCanvas.toDataURL('image/jpeg', 0.95)
  }

  link.click()
  URL.revokeObjectURL(link.href)
}

function canvasToSVG(canvas, scale = 1) {
  const imageData = canvas.toDataURL('image/png')
  const width = canvas.width * scale
  const height = canvas.height * scale
  
  return `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${width}" height="${height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <style type="text/css">
          <![CDATA[
            image { image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; }
          ]]>
        </style>
      </defs>
      <image width="${canvas.width}" height="${canvas.height}" href="${imageData}" />
    </svg>`
}
