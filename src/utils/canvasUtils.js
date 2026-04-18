export function renderCanvas(canvas, { centralPattern, centralScale, centralRotation, decorativePatterns }) {
  const ctx = canvas.getContext('2d')
  
  // 黑色背景
  ctx.fillStyle = '#0a0e27'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制参考线（网格 + 圆形 + 中心点）
  drawGuideLines(ctx, canvas)

  // 绘制中心图案
  if (centralPattern && centralPattern.processedSrc) {
    drawCentralPattern(ctx, canvas, centralPattern, centralScale, centralRotation)
  }

  // 绘制装饰图案
  decorativePatterns.forEach(pattern => {
    if (pattern.processedSrc) {
      drawDecorativePattern(ctx, canvas, pattern)
    }
  })
}

// 绘制参考线：网格、圆形、中心点
function drawGuideLines(ctx, canvas) {
  ctx.strokeStyle = '#1e2b4a'
  ctx.lineWidth = 1
  
  const gridSize = 50
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2

  // 绘制网格
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }

  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }

  // 绘制中心十字线（更亮的蓝色）
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 1.5
  
  ctx.beginPath()
  ctx.moveTo(centerX, 0)
  ctx.lineTo(centerX, canvas.height)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(canvas.width, centerY)
  ctx.stroke()

  // 绘制圆形参考线（装饰图案轨迹）
  ctx.strokeStyle = '#2563eb'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  for (let radius = 50; radius <= 400; radius += 50) {
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.setLineDash([])

  // 绘制中心点（蓝色圆点）
  ctx.fillStyle = '#3b82f6'
  ctx.beginPath()
  ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#60a5fa'
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawCentralPattern(ctx, canvas, pattern, scale, rotation) {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2

  const img = new Image()
  img.onload = () => {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)

    const scaleFactor = scale / 100
    const displayWidth = img.width * scaleFactor
    const displayHeight = img.height * scaleFactor

    ctx.drawImage(
      img,
      -displayWidth / 2,
      -displayHeight / 2,
      displayWidth,
      displayHeight
    )

    ctx.restore()
  }
  img.onerror = () => {
    console.error('中心图案加载失败')
  }
  img.src = pattern.processedSrc
}

function drawDecorativePattern(ctx, canvas, pattern) {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const angleStep = 360 / pattern.quantity
  const radius = pattern.radius

  const img = new Image()
  img.onload = () => {
    for (let i = 0; i < pattern.quantity; i++) {
      const angle = (angleStep * i + pattern.angle) * (Math.PI / 180)
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      ctx.save()
      ctx.translate(x, y)
      
      // ✅ 关键修改：支持朝向中心选择
      if (pattern.faceCenter) {
        // 朝向中心：旋转角度指向中心
        const angleToCenter = Math.atan2(centerY - y, centerX - x)
        ctx.rotate(angleToCenter + (pattern.rotation * Math.PI) / 180)
      } else {
        // 正常旋转
        ctx.rotate((pattern.rotation * Math.PI) / 180)
      }

      const scaleFactor = pattern.scale / 100
      const displayWidth = img.width * scaleFactor
      const displayHeight = img.height * scaleFactor

      ctx.drawImage(
        img,
        -displayWidth / 2,
        -displayHeight / 2,
        displayWidth,
        displayHeight
      )

      ctx.restore()
    }
  }
  img.onerror = () => {
    console.error('装饰图案加载失败')
  }
  img.src = pattern.processedSrc
}

// ✅ 强化版：移除背景变透明（支持所有格式）
export async function removeBackground(imageDataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      
      img.onload = () => {
        try {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = img.width
          tempCanvas.height = img.height
          const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
          
          // 绘制图片
          ctx.drawImage(img, 0, 0)
          
          // 获取图像数据
          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
          const data = imageData.data
          
          console.log('开始背景移除处理...')
          console.log('图片尺寸:', tempCanvas.width, 'x', tempCanvas.height)
          
          // ✅ 改进：使用多种算法检测背景
          const backgroundColor = smartDetectBackgroundColor(data, tempCanvas.width, tempCanvas.height)
          console.log('检测到的背景颜色:', backgroundColor)
          
          // ✅ 改进：智能透明度处理
          let transparentPixels = 0
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const a = data[i + 3]
            
            // 跳过完全透明的像素
            if (a === 0) {
              continue
            }
            
            // ✅ 使用多种颜色相似度判断
            if (shouldRemovePixel(r, g, b, backgroundColor)) {
              data[i + 3] = 0
              transparentPixels++
            }
          }
          
          console.log(`已设置 ${transparentPixels} 个像素为透明 (总像素: ${data.length / 4})`)
          
          ctx.putImageData(imageData, 0, 0)
          const result = tempCanvas.toDataURL('image/png')
          resolve(result)
        } catch (error) {
          console.error('Canvas 处理失败:', error)
          reject(error)
        }
      }
      
      img.onerror = () => {
        console.error('图片加载失败:', imageDataUrl.substring(0, 50))
        reject(new Error('图片加载失败'))
      }
      
      // 使用 dataURL 直接赋值
      img.src = imageDataUrl
      
    } catch (error) {
      console.error('removeBackground 错误:', error)
      reject(error)
    }
  })
}

// ✅ 智能背景色检测：多种方法
function smartDetectBackgroundColor(data, width, height) {
  // 方法1：从四个角检测
  const corners = getCornerColors(data, width, height)
  
  // 方法2：从边缘检测
  const edges = getEdgeColors(data, width, height)
  
  // 方法3：从直方图检测
  const histogram = getHistogramPeak(data)
  
  // 综合判断：哪个颜色最接近背景
  const allCandidates = [...corners, ...edges, histogram]
  
  // 返回出现最多的颜色
  const mostCommonColor = findMostCommonColor(allCandidates)
  console.log('检测方法 - 角: ', corners[0], '边缘: ', edges[0], '直方图: ', histogram, '最终:', mostCommonColor)
  
  return mostCommonColor
}

// 从四个角获取颜色
function getCornerColors(data, width, height) {
  const pixelSize = 4
  const corners = [
    { x: 5, y: 5 },
    { x: width - 5, y: 5 },
    { x: 5, y: height - 5 },
    { x: width - 5, y: height - 5 }
  ]
  
  const colors = []
  corners.forEach(corner => {
    const index = (corner.y * width + corner.x) * pixelSize
    colors.push({
      r: data[index],
      g: data[index + 1],
      b: data[index + 2]
    })
  })
  
  return colors
}

// 从边缘获取颜色
function getEdgeColors(data, width, height) {
  const pixelSize = 4
  const colors = []
  
  // 上边缘
  for (let x = 10; x < width - 10; x += 20) {
    const index = (5 * width + x) * pixelSize
    colors.push({
      r: data[index],
      g: data[index + 1],
      b: data[index + 2]
    })
  }
  
  // 下边缘
  for (let x = 10; x < width - 10; x += 20) {
    const index = ((height - 5) * width + x) * pixelSize
    colors.push({
      r: data[index],
      g: data[index + 1],
      b: data[index + 2]
    })
  }
  
  return colors.length > 0 ? colors : [{ r: 255, g: 255, b: 255 }]
}

// 从直方图获取颜色峰值
function getHistogramPeak(data) {
  const histogram = {}
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = `${r},${g},${b}`
    histogram[key] = (histogram[key] || 0) + 1
  }
  
  // 找出最常见的颜色（背景色通常是最常见的）
  let maxCount = 0
  let peakColor = { r: 255, g: 255, b: 255 }
  
  for (const [key, count] of Object.entries(histogram)) {
    if (count > maxCount) {
      maxCount = count
      const [r, g, b] = key.split(',').map(Number)
      peakColor = { r, g, b }
    }
  }
  
  return peakColor
}

// 找出最常见的颜色
function findMostCommonColor(colors) {
  if (colors.length === 0) return { r: 255, g: 255, b: 255 }
  
  const rSum = colors.reduce((sum, c) => sum + c.r, 0)
  const gSum = colors.reduce((sum, c) => sum + c.g, 0)
  const bSum = colors.reduce((sum, c) => sum + c.b, 0)
  
  return {
    r: Math.round(rSum / colors.length),
    g: Math.round(gSum / colors.length),
    b: Math.round(bSum / colors.length)
  }
}

// ✅ 智能像素移除判断
function shouldRemovePixel(r, g, b, backgroundColor) {
  // 方法1：颜色距离
  const colorDistance = Math.sqrt(
    Math.pow(r - backgroundColor.r, 2) +
    Math.pow(g - backgroundColor.g, 2) +
    Math.pow(b - backgroundColor.b, 2)
  )
  
  // 如果颜色距离小于阈值，认为是背景
  if (colorDistance < 50) {
    return true
  }
  
  // 方法2：灰度值相似性（适用于灰色背景）
  const rGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10
  const bgGray = Math.abs(backgroundColor.r - backgroundColor.g) < 10 && 
                 Math.abs(backgroundColor.g - backgroundColor.b) < 10
  
  if (rGray && bgGray && colorDistance < 60) {
    return true
  }
  
  // 方法3：亮度相似性（白色或黑色背景）
  const brightness = (r + g + b) / 3
  const bgBrightness = (backgroundColor.r + backgroundColor.g + backgroundColor.b) / 3
  
  if (Math.abs(brightness - bgBrightness) < 20 && bgBrightness > 200) {
    return true // 白色背景
  }
  
  if (Math.abs(brightness - bgBrightness) < 20 && bgBrightness < 50) {
    return true // 黑色背景
  }
  
  return false
}
