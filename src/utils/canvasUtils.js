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
      ctx.rotate((pattern.rotation * Math.PI) / 180)

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

// 🔧 改进版：移除背景变透明
export async function removeBackground(imageDataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      
      img.onload = () => {
        try {
          // 创建 canvas 进行处理
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = img.width
          tempCanvas.height = img.height
          const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
          
          // 绘制图片
          ctx.drawImage(img, 0, 0)
          
          // 获取图像数据
          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
          const data = imageData.data
          
          // ✅ 改进：动态检测背景颜色（四个角的平均值）
          const backgroundColor = detectBackgroundColorFromCorners(data, tempCanvas.width, tempCanvas.height)
          
          console.log('检测到的背景颜色:', backgroundColor)
          
          // 设置背景透明
          let transparentPixels = 0
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            
            // ✅ 改进：更智能的颜色相似度判断
            if (isColorSimilar(r, g, b, backgroundColor, 50)) {
              data[i + 3] = 0 // 设置透明
              transparentPixels++
            }
          }
          
          console.log(`已设置 ${transparentPixels} 个像素为透明`)
          
          ctx.putImageData(imageData, 0, 0)
          const result = tempCanvas.toDataURL('image/png')
          resolve(result)
        } catch (error) {
          console.error('Canvas 处理失败:', error)
          reject(error)
        }
      }
      
      img.onerror = () => {
        console.error('图片加载失败')
        reject(new Error('图片加载失败'))
      }
      
      // ✅ 关键：使用 dataURL 直接赋值（避免跨域问题）
      img.src = imageDataUrl
      
    } catch (error) {
      console.error('removeBackground 错误:', error)
      reject(error)
    }
  })
}

// ✅ 改进：从四个角检测背景颜色
function detectBackgroundColorFromCorners(data, width, height) {
  const pixelSize = 4
  
  // 获取四个角的颜色样本
  const corners = [
    { x: 5, y: 5 },           // 左上
    { x: width - 5, y: 5 },   // 右上
    { x: 5, y: height - 5 },  // 左下
    { x: width - 5, y: height - 5 } // 右下
  ]
  
  let rSum = 0, gSum = 0, bSum = 0
  
  corners.forEach(corner => {
    const index = (corner.y * width + corner.x) * pixelSize
    rSum += data[index]
    gSum += data[index + 1]
    bSum += data[index + 2]
  })
  
  return {
    r: Math.round(rSum / corners.length),
    g: Math.round(gSum / corners.length),
    b: Math.round(bSum / corners.length)
  }
}

// ✅ 改进：颜色相似度判断
function isColorSimilar(r, g, b, targetColor, threshold = 50) {
  const dr = Math.abs(r - targetColor.r)
  const dg = Math.abs(g - targetColor.g)
  const db = Math.abs(b - targetColor.b)
  
  // 返��总差值是否小于阈值
  const totalDiff = dr + dg + db
  return totalDiff < threshold * 3
}
