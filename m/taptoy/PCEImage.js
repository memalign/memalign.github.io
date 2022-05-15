// Pixel-Character Encoded Image
class PCEImage {

  // Properties:
  // imageStrLines - string, full image: color table and pixel data, split by \n into an array
  // charToColor - map from string (ASCII character) to string (hex color code)
  // firstPixelLineIndex - integer, index into imageStrLines for the first line of pixel characters
  // width - integer, width of image in pixels
  // height - integer, height of image in pixels
  constructor(imageStr) {
    this.imageStrLines = imageStr.split("\n")

    // Parse the color table
    this.charToColor = {}

    let colorTableLineCount = 0
    for (let line of this.imageStrLines) {
      colorTableLineCount++

      if (line == "") {
        break
      }

      if (line.startsWith("//")) {
        continue
      }

      let charAndColor = line.split(":")
      if (charAndColor.length == 2) {
        this.charToColor[charAndColor[0]] = charAndColor[1]
      }
    }

    this.firstPixelLineIndex = colorTableLineCount

    if (this.imageStrLines.length > this.firstPixelLineIndex) {
      this.width = this.imageStrLines[this.firstPixelLineIndex].length
      this.height = this.imageStrLines.length - this.firstPixelLineIndex
    } else {
      this.width = 0
      this.height = 0
    }
  }

  usesTransparency() {
    let ret = false

    let imageStr = this.imageStrLines.slice(this.firstPixelLineIndex).join("")

    for (let colorChar of Object.keys(this.charToColor)) {
      let colorStr = this.charToColor[colorChar]

      // Don't check this color if the image contains no pixels that use it
      if (!imageStr.includes(colorChar)) {
        continue
      }

      let match = colorStr.match(/^\#[0-9a-fA-F]{6}([0-9a-fA-F]{2})/)
      if (match) {
        let hasTransparency = (match[1].toUpperCase() !== "FF")
        ret = hasTransparency
      }

      if (ret) {
        break
      }
    }

    return ret
  }

  drawInCanvas(canvas, scale, xOffset /* default: 0 */, yOffset /* default: 0 */) {
    if (!xOffset) {
      xOffset = 0
    }
    if (!yOffset) {
      yOffset = 0
    }

    let ctx = canvas.getContext("2d")

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let pixelDimension = scale
        let pixelXOffset = x*scale
        let pixelYOffset = y*scale

        let character = this.imageStrLines[this.firstPixelLineIndex+y].charAt(x)
        let color = this.charToColor[character]

        ctx.fillStyle = color
        ctx.fillRect(xOffset+pixelXOffset, yOffset+pixelYOffset, pixelDimension, pixelDimension)
      }
    }
  }

  // Returns base64 data URL
  generatePNG(scale) {
    let canvas = document.createElement("canvas")
    canvas.width = this.width * scale
    canvas.height = this.height * scale

    let ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    this.drawInCanvas(canvas, scale)

    return canvas.toDataURL()
  }
}

class PCEPixel {
  constructor(str, x, y) {
    this.str = str
    this.x = x
    this.y = y
  }

  canClumpWith(pixel) {
    let sameColor = this.str == pixel.str
    let adjacent = (Math.abs(this.x-pixel.x) + Math.abs(this.y-pixel.y)) <= 1
    return sameColor && adjacent
  }
}

class PCEClump {
  constructor() {
    this.pixels = []
  }

  canClumpWith(pixel) {
    if (this.pixels.length == 0) {
      return true
    }

    for (let cPixel of this.pixels) {
      if (cPixel.canClumpWith(pixel)) {
        return true
      }
    }

    return false
  }

  addPixel(pixel) {
    this.pixels.push(pixel)
  }

  size() {
    return this.pixels.length
  }

  str() {
    return this.pixels[0].str
  }
}

class PCEWobbleImage extends PCEImage {
  // Properties:
  // tickCount - integer, count of animation time increments that have occurred
  // maxTicks - animation loop duration in ticks
  // clumps - array of PCEPixel
  // charToCount - map of string (pixel character) to number of pixels with that char
  constructor(imageStr) {
    super(imageStr)

    this.maxTicks = 4
    this.tickCount = 0

    this.charToCount = {}
    this.clumps = []
    this.computeClumps()
  }

  computeClumps() {
    let maxClumpSize = 20

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let character = this.imageStrLines[this.firstPixelLineIndex+y].charAt(x)

        if (!this.charToCount[character]) {
          this.charToCount[character] = 0
        }
        this.charToCount[character]++

        let pixel = new PCEPixel(character, x, y)

        let addedPixel = false
        for (let clump of this.clumps) {
          if (clump.size() < maxClumpSize && clump.canClumpWith(pixel)) {
            clump.addPixel(pixel)
            addedPixel = true
            break
          }
        }

        if (!addedPixel) {
          let clump = new PCEClump()
          clump.addPixel(pixel)
          this.clumps.push(clump)
        }
      }
    }

    // Sort by most common color (and largest clump size) to least common color (and smaller clump size)
    // This order will let us draw the "background" before finer details which makes the wobble image look less messy/glitchy
    let charToCount = this.charToCount
    this.clumps.sort(function(a, b) {
      let charA = a.str()
      let charB = b.str()

      let colorCountA = charToCount[charA]
      let colorCountB = charToCount[charB]

      if (colorCountA > colorCountB) {
        return -1 // sort a before b
      } else if (colorCountB > colorCountA) {
        return 1
      } else {
        return b.size() - a.size() // return negative when a is bigger
      }
    })
  }

  tick() {
    this.tickCount = (this.tickCount+1) % this.maxTicks
  }

  drawInCanvas(canvas, scale, xOffset /* default: 0 */, yOffset /* default: 0 */) {
    if (!xOffset) {
      xOffset = 0
    }
    if (!yOffset) {
      yOffset = 0
    }

    let ctx = canvas.getContext("2d")

    for (let clump of this.clumps) {
      let pixelDimension = scale

      // Wobble
      let xWobble = 0
      let yWobble = 0
      let offsets = [-1, 0, 1]
      let wobbleMagnitude = Math.ceil(scale / 10)
      // My original intent is to use tickCount to deterministically wobble
      // I haven't implemented that yet -- for now, wobble is random
      let offset = Math.round(offsets[Math.floor(Math.random()*offsets.length)] * wobbleMagnitude)

      if (offset != 0) {
        if (Math.floor(Math.random()*2) == 0) {
          xWobble = offset
        } else {
          yWobble = offset
        }
      }

      for (let pixel of clump.pixels) {
        let color = this.charToColor[pixel.str]

        ctx.fillStyle = color

        let pixelXOffset = pixel.x*scale
        let pixelYOffset = pixel.y*scale

        pixelXOffset += xWobble
        pixelYOffset += yWobble

        // Draw every pixel slightly larger so there are no gaps between pixels caused by wobble
        // Square pixels
        //ctx.fillRect(pixelXOffset-wobbleMagnitude, pixelYOffset-wobbleMagnitude, pixelDimension+2*wobbleMagnitude, pixelDimension+2*wobbleMagnitude)
        // Roundrect pixels
        MAUtils.roundRect(ctx, xOffset+pixelXOffset-wobbleMagnitude, yOffset+pixelYOffset-wobbleMagnitude, pixelDimension+2*wobbleMagnitude, pixelDimension+2*wobbleMagnitude, 2, true, false)
      }
    }
  }

  // Generates GIF synchronously - this can be slow!
  // Returns base64 data URL
  generateGIF(scale) {
    let canvas = document.createElement("canvas")
    canvas.width = this.width * scale
    canvas.height = this.height * scale

    if (canvas.width === 0 || canvas.height === 0) {
      console.log("Skipping GIFGeneration because dimension is 0")
      return
    }

    let ctx = canvas.getContext("2d")

    let encoder = new GIFEncoder()
    encoder.setRepeat(0)
    encoder.setDelay(150)
    encoder.start()
    let usesTransparency = this.usesTransparency()
    if (usesTransparency) {
      encoder.setTransparent(0xFFFFF1)
    }

    for (let i = 0; i < this.maxTicks; i++) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#FFFFF1"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      this.drawInCanvas(canvas, scale)
      this.tick()

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      encoder.addFrame(imageData, true)
    }

    encoder.finish()

    let gifData = encoder.stream().getData()

    let base64GIFStr = 'data:image/gif;base64,' + encode64(gifData)
    return base64GIFStr
  }
}

