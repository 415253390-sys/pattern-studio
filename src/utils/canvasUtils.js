export function renderCanvas(canvas, { centralPattern, centralScale, centralRotation, decorativePatterns }) {
  const ctx = canvas.getContext('2d')
  
  // 清空画布为透明
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制中心图案
  if (centralPattern) {
    drawCentralPattern(ctx, canvas, centralPattern, centralScale, centralRotation)
  }

  // 绘制装饰图案
  decorativePatterns.forEach(pattern => {
    drawDecorativePattern(ctx, canvas, pattern)
  })
}

function drawCentralPattern(ctx, canvas, pattern, scale, rotation) {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2

  const img = new Image()
  img.crossOrigin = 'anonymous'
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
  img.src = pattern.src
}

function drawDecorativePattern(ctx, canvas, pattern) {
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const angleStep = 360 / pattern.quantity
  const radius = pattern.radius

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    for (let i = 0; i < pattern.quantity; i++) {
      // 计算圆形阵列位置，轴向中心点
      const angle = (angleStep * i + pattern.angle) * (Math.PI / 180)
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      ctx.save()
      
      // 移动到该图案的中心点
      ctx.translate(x, y)
      // 旋转该图案
      ctx.rotate((pattern.rotation * Math.PI) / 180)

      const scaleFactor = pattern.scale / 100
      const displayWidth = img.width * scaleFactor
      const displayHeight = img.height * scaleFactor

      // 从中心点绘制（关键：轴向中心）
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
  img.src = pattern.src
}

// 获取图片并移除背景（白色或单色背景变透明）
export async function removeBackground(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // 创建临时 canvas 进行处理
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = img.width
      tempCanvas.height = img.height
      const ctx = tempCanvas.getContext('2d')
      
      // 绘制原图
      ctx.drawImage(img, 0, 0)
      
      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imageData.data
      
      // 检测主要背景颜色（通常是白色或透明）
      const backgroundColor = detectBackgroundColor(data)
      
      // 设置背景透明
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        
        // 如果颜色接近背景色，设置为透明
        if (isColorSimilar(r, g, b, backgroundColor, 30)) {
          data[i + 3] = 0 // 完全透明
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      resolve(tempCanvas.toDataURL('image/png'))
    }
    img.src = imageDataUrl
  })
}

// 检测背景颜色（通常是四个角的颜色平均值）
function detectBackgroundColor(data) {
  // 简化：假设背景是白色或浅色
  // 这里返回白色 RGB(255, 255, 255)
  return { r: 255, g: 255, b: 255 }
}

// 判断颜色是否相似
function isColorSimilar(r, g, b, targetColor, threshold = 30) {
  const dr = Math.abs(r - targetColor.r)
  const dg = Math.abs(g - targetColor.g)
  const db = Math.abs(b - targetColor.b)
  
  return dr < threshold && dg < threshold && db < threshold
}
