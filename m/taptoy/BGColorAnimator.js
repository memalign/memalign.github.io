class MAColor {
  constructor(rOrHex, g, b) {
    if ((typeof rOrHex === 'string') && rOrHex.startsWith("#")) {
      let rgba = this.hexaToRGBA(rOrHex)
      this.r = rgba.r
      this.g = rgba.g
      this.b = rgba.b
    } else {
      this.r = rOrHex
      this.g = g
      this.b = b
    }
  }

  colorBetween(targetColor, proportion) {
    let betR = Math.floor((this.r * (1-proportion)) + (targetColor.r * proportion))
    let betG = Math.floor((this.g * (1-proportion)) + (targetColor.g * proportion))
    let betB = Math.floor((this.b * (1-proportion)) + (targetColor.b * proportion))

    return new MAColor(betR, betG, betB)
  }

  toRGBAStr() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, 1)`
  }

  hexaToRGBA(h) {
    if (h.length == 7) h += 'ff'
    else if (h.length == 4) h += h.substring(1, 4) + 'ff'

    let r = 0,
      g = 0,
      b = 0,
      a = 1;

    if (h.length == 5) {
      r = '0x' + h[1] + h[1]
      g = '0x' + h[2] + h[2]
      b = '0x' + h[3] + h[3]
      a = '0x' + h[4] + h[4]
    } else if (h.length == 9) {
      r = '0x' + h[1] + h[2]
      g = '0x' + h[3] + h[4]
      b = '0x' + h[5] + h[6]
      a = '0x' + h[7] + h[8]
    }

    r = parseInt(r, 16)
    g = parseInt(g, 16)
    b = parseInt(b, 16)
    a = +(a / 255).toFixed(3)


    return {
      r: r,
      g: g,
      b: b,
      a: a
    }
  }
}

class BGColorAnimator {
  constructor(element) {
    this.isRunning = false
    this.element = element

    this.animationDurationMillis = 1000
    this.animationStart = 0

    this.currentColor = null
    this.targetColorIndex = 0
    this.colors = []
    this.colors.push(new MAColor('#1D2B53'))
    this.colors.push(new MAColor('#7E2553'))
    this.colors.push(new MAColor('#008751'))
    this.colors.push(new MAColor('#AB5236'))
    this.colors.push(new MAColor('#5F574F'))
    this.colors.push(new MAColor('#C2C3C7'))
    this.colors.push(new MAColor('#83769C'))
  }

  run() {
    if (this.isRunning) { return }

    this.isRunning = true

    this.requestAnimationFrame()
  }

  requestColorChange() {
    if (!this.currentColor) {
      // Set the color immediately
      this.currentColor = this.colors[this.targetColorIndex]
      this.element.style.backgroundColor = this.currentColor.toRGBAStr()

    } else {

      // Ignore a request to change if we're still in the middle of one
      if (!this.isRunning) {
        // Animate to the target color
        this.targetColorIndex = Math.floor((this.targetColorIndex + 1) % this.colors.length)
        this.run()
      }
    }

  }


  // Internal utility methods
  // ========================

  requestAnimationFrame() {
    let obj = this
    requestAnimationFrame(function(timestampMillis) { obj.step(timestampMillis) })
  }

  step(timestampMillis) {
    if (!this.isRunning) { return }

    if (!this.animationStart) {
      this.animationStart = timestampMillis
    }

    let deltaMillis = Math.abs(timestampMillis - this.animationStart)
    deltaMillis = Math.min(deltaMillis, this.animationDurationMillis)

    let proportion = deltaMillis / this.animationDurationMillis

    let targetColor = this.colors[this.targetColorIndex]
    if (proportion >= 1) {
      this.currentColor = targetColor
      this.element.style.backgroundColor = targetColor.toRGBAStr()
      this.isRunning = false
      this.animationStart = 0

    } else {
      let prevColorIndex = Math.floor((this.targetColorIndex + this.colors.length - 1) % this.colors.length)
      let prevColor = this.colors[prevColorIndex]
      let nextColor = prevColor.colorBetween(targetColor, proportion)
      this.currentColor = nextColor
      this.element.style.backgroundColor = nextColor.toRGBAStr()
    }


    if (this.isRunning) {
      this.requestAnimationFrame()
    }
  }
}
