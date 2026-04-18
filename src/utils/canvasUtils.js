export function renderCanvas(canvas, { centralPattern, centralScale, centralRotation, decorativePatterns }) {
  const ctx = canvas.getContext('2d')
  
  // 清空画布
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

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
  img.src = pattern.src
}
