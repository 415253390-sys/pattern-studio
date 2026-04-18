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

  ctx.strokeStyle = '#2563eb'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  for (let radius = 50; radius <= 400; radius += 50) {
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.setLineDash([])

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
      
      if (pattern.faceCenter) {
        const angleToCenter = Math.atan2(centerY - y, centerX - x)
        ctx.rotate(angleToCenter + (pattern.rotation * Math.PI) / 180)
      } else {
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

// ✅ 新增：色彩通道提取（用于吸管工具）
export function extractImageColors(imageDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        resolve(imageData)
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = imageDataUrl
  })
}

// ✅ 核心：多目标颜色拾取 + 深度全局消除 + 羽化平滑
export async function removeBackgroundAdvanced(imageDataUrl, options = {}) {
  const {
    targetColors = [],           // 选中的目标颜色数组
    tolerance = 30,              // 容差值
    useGlobalRemoval = true,     // 全局深度消除
    featheringStrength = 1.0     // 羽化强度
  } = options

  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      
      img.onload = () => {
        try {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = img.width
          tempCanvas.height = img.height
          const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
          
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
          const data = imageData.data
          
          console.log('=== 开始高级抠图处理 ===')
          console.log('目标颜色数量:', targetColors.length)
          console.log('容差值:', tolerance)
          console.log('全局消除:', useGlobalRemoval)
          
          // 第一步：创建初始 Alpha 遮罩
          const alphaMask = new Uint8Array(data.length / 4)
          let transparentPixels = 0
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const pixelIndex = i / 4
            
            // 检查是否匹配任何目标颜色
            let shouldRemove = false
            
            if (targetColors.length > 0) {
              // 多目标颜色模式：匹配任何一个目标颜色
              for (const targetColor of targetColors) {
                if (colorDistance(r, g, b, targetColor, tolerance)) {
                  shouldRemove = true
                  break
                }
              }
            } else {
              // 自动检测模式：检测背景色
              const bgColor = detectBackgroundColorSimple(data, tempCanvas.width, tempCanvas.height)
              shouldRemove = colorDistance(r, g, b, bgColor, tolerance)
            }
            
            alphaMask[pixelIndex] = shouldRemove ? 0 : 255
            if (shouldRemove) transparentPixels++
          }
          
          console.log(`初始透明像素: ${transparentPixels}`)
          
          // 第二步：全局深度消除 - 穿透内部孤岛
          if (useGlobalRemoval) {
            console.log('执行全局深度消除...')
            globalDepthRemoval(alphaMask, tempCanvas.width, tempCanvas.height, tolerance, data)
          }
          
          // 第三步：羽化平滑 - 解决白边
          console.log('执行羽化平滑算法...')
          featheringSmoothing(alphaMask, tempCanvas.width, tempCanvas.height, featheringStrength, data)
          
          // 第四步：应用最终 Alpha 值
          for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4
            data[i + 3] = alphaMask[pixelIndex]
          }
          
          ctx.putImageData(imageData, 0, 0)
          const result = tempCanvas.toDataURL('image/png')
          console.log('=== 抠图完成 ===')
          resolve(result)
          
        } catch (error) {
          console.error('Canvas 处理失败:', error)
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = imageDataUrl
      
    } catch (error) {
      console.error('removeBackgroundAdvanced 错误:', error)
      reject(error)
    }
  })
}

// ✅ 颜色距离计算（支持容差）
function colorDistance(r, g, b, targetColor, tolerance) {
  const dr = Math.abs(r - targetColor.r)
  const dg = Math.abs(g - targetColor.g)
  const db = Math.abs(b - targetColor.b)
  
  // 使用欧几里得距离
  const distance = Math.sqrt(dr * dr + dg * dg + db * db)
  return distance < tolerance * 3
}

// ✅ 全局深度消除：穿透内部孤岛
function globalDepthRemoval(alphaMask, width, height, tolerance, imageData) {
  const visited = new Uint8Array(alphaMask.length)
  const queue = []
  
  // 从边缘开始找所有透明区域
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x
      
      // 只检查边缘像素
      if ((x === 0 || x === width - 1 || y === 0 || y === height - 1) && 
          alphaMask[index] === 0 && !visited[index]) {
        queue.push({ x, y })
        visited[index] = 1
      }
    }
  }
  
  // BFS 扩散：找到所有连通的透明区域
  while (queue.length > 0) {
    const { x, y } = queue.shift()
    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0],  // 4连通
      [1, 1], [1, -1], [-1, 1], [-1, -1] // 8连通
    ]
    
    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const index = ny * width + nx
        
        if (!visited[index]) {
          visited[index] = 1
          
          // 如果是目标颜色，也将其标记为透明
          if (alphaMask[index] === 0) {
            queue.push({ x: nx, y: ny })
          }
        }
      }
    }
  }
  
  // 更新 alphaMask：所有孤立的背景色也变透明
  for (let i = 0; i < alphaMask.length; i++) {
    if (visited[i] && alphaMask[i] === 0) {
      alphaMask[i] = 0  // 确保透明
    }
  }
  
  console.log('全局深度消除完成')
}

// ✅ 羽化平滑算法：解决白边
function featheringSmoothing(alphaMask, width, height, featheringStrength, imageData) {
  const tempAlpha = new Uint8Array(alphaMask)
  const pixelSize = 4
  
  // 第一遍：检测边缘
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x
      const currentAlpha = alphaMask[index]
      
      // 只处理接近边界的像素（当前不透明，相邻有透明）
      if (currentAlpha > 0 && currentAlpha < 255) {
        const neighbors = [
          alphaMask[index - 1],
          alphaMask[index + 1],
          alphaMask[index - width],
          alphaMask[index + width],
          alphaMask[index - width - 1],
          alphaMask[index - width + 1],
          alphaMask[index + width - 1],
          alphaMask[index + width + 1]
        ]
        
        // 计算邻域平均
        const avgAlpha = neighbors.reduce((a, b) => a + b, 0) / neighbors.length
        
        // 羽化：使用二次曲线平滑过渡
        if (Math.abs(currentAlpha - avgAlpha) > 10) {
          const blended = Math.round(currentAlpha * 0.7 + avgAlpha * 0.3)
          tempAlpha[index] = blended
        }
      } else if (currentAlpha === 255) {
        // 不透明像素的边缘处理
        const neighbors = [
          alphaMask[index - 1],
          alphaMask[index + 1],
          alphaMask[index - width],
          alphaMask[index + width]
        ]
        
        // 如果有透明邻域，进行羽化
        if (neighbors.some(a => a === 0)) {
          const avgAlpha = neighbors.reduce((a, b) => a + b, 0) / neighbors.length
          
          // 容差 + 30 的二次曲线 Alpha 羽化
          const tolerance = 30
          const featherDistance = Math.max(0, 255 - avgAlpha)
          const featherFactor = Math.pow(featherDistance / 255, 2) // 二次曲线
          
          const finalAlpha = Math.round(255 * (1 - featherFactor * featheringStrength * 0.5))
          tempAlpha[index] = Math.max(200, finalAlpha) // 保留最少 200 的不透明度
        }
      }
    }
  }
  
  // 复制回 alphaMask
  for (let i = 0; i < alphaMask.length; i++) {
    alphaMask[i] = tempAlpha[i]
  }
  
  console.log('羽化平滑完成')
}

// 简单背景检测
function detectBackgroundColorSimple(data, width, height) {
  const corners = [
    { x: 5, y: 5 },
    { x: width - 5, y: 5 },
    { x: 5, y: height - 5 },
    { x: width - 5, y: height - 5 }
  ]
  
  let rSum = 0, gSum = 0, bSum = 0
  const pixelSize = 4
  
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
