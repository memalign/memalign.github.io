
const sPCEImageCache = {}

// Pixel-Character Encoded Image
class PCEImage {

  // Properties:
  // imageStrLines - string, full image: color table and pixel data, split by \n into an array
  // charToColor - map from string (ASCII character) to string (hex color code)
  // firstPixelLineIndex - integer, index into imageStrLines for the first line of pixel characters
  // width - integer, width of image in pixels
  // height - integer, height of image in pixels
  constructor(imageStr) {
    this._imageStr = imageStr
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

      if (line.length > 3 && line.charAt(1) == ":") {
        let charStr = line.charAt(0)
        let colorStr = line.substring(2)
        this.charToColor[charStr] = colorStr
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

  get imageStr() {
    return this._imageStr
  }

  static pceImageFromCanvas(canvas, scale) {
    let colorMap = new Map() // hex value -> PCEColor instance

    // Always use these characters for these colors
    let white = new PCEColor(255, 255, 255, 1)
    white.c = "."
    colorMap.set(white.hexStr(), white)

    let transparent = new PCEColor(0, 0, 0, 0)
    transparent.c = "_"
    colorMap.set(transparent.hexStr(), transparent)

    // Sorted by my preference from most to least desirable to use
    let pceChars = "@ABDQG#%XO8&+=~!$^*()-|{}[]\";:CEFHIJKLMNPRSTUVWYZabcdefghijklmnopqrstuvwxyz1234567890'<>"

    let usedColorsHexStrs = new Set()

    const colorSimilarityThreshold = 15

    const ctx = canvas.getContext('2d')

    let height = canvas.height
    let width = canvas.width

    let imageStr = ""

    let rowSeparator = ""
    for (let y = 0; y < height; y += scale) {
      imageStr += rowSeparator
      rowSeparator = "\n"

      for (let x = 0; x < width; x += scale) {
        const pixelData = ctx.getImageData(x, y, 1, 1).data
        let c = new PCEColor(pixelData[0], pixelData[1], pixelData[2], pixelData[3]/255.0)

        let hexStr = c.hexStr()
        let existingC = colorMap.get(hexStr)

        // If we don't already have this specific color cached, see
        // if there's a color that's visually close enough.
        // This is needed because lossy image formats will have slightly
        // different colors for pixels that the image creator intended
        // to be the same.
        if (!existingC) {
          // Search for a similar-enough color
          for (const [key, value] of colorMap) {
            if (value.colorIsSameWithinThreshold(c, colorSimilarityThreshold)) {
              // Cache this similar-enough color for the current pixel's hexStr
              existingC = value
              colorMap.set(hexStr, existingC)

              break
            }
          }
        }


        if (!existingC) {
          // Assign this color a PCE character
          c.c = pceChars.substring(0, 1)
          if (pceChars.length >= 2) {
            // Remove the character we just used
            // If we run out of characters to assign to colors, we
            // aren't able to encode this as a PCEImage accurately.
            // Right now, this code will just keep reusing the last
            // available character which will make the image look corrupt.
            pceChars = pceChars.substring(1)
          }
          colorMap.set(hexStr, c)
          existingC = c
        }

        usedColorsHexStrs.add(existingC.hexStr())
        imageStr += existingC.c
      }
    }

    let colorsStr = Array.from(usedColorsHexStrs).map(hexStr => `${colorMap.get(hexStr).c}:${hexStr}`).sort().join("\n")

    let pceImageStr = colorsStr + "\n\n" + imageStr

    return new PCEImage(pceImageStr)
  }

  imageStrLineAtPixelRow(pixelRow) {
    if (pixelRow >= this.height) {
      return null
    }

    return this.imageStrLines[this.firstPixelLineIndex + pixelRow]
  }

  updateImageStrLineAtPixelRow(pixelRow, newValue) {
    if (pixelRow >= this.height || newValue.length != this.width) {
      return
    }

    this.imageStrLines[this.firstPixelLineIndex + pixelRow] = newValue

    this._imageStr = this.imageStrLines.join("\n")
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

  // colorTransformFn(hexColorStr) => transformedHexColorStr
  drawInCanvas(canvas, scale, xOffset /* default: 0 */, yOffset /* default: 0 */, colorTransformFn /* default: null */) {
    if (!xOffset) {
      xOffset = 0
    }
    if (!yOffset) {
      yOffset = 0
    }

    let ctx = canvas.getContext("2d")

    // Work around visible horizontal lines caused by a yOffset that's
    // not aligned with a whole pixel value
    yOffset = Math.floor(yOffset)

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let pixelDimension = scale
        let pixelXOffset = x*scale
        let pixelYOffset = y*scale

        let character = this.imageStrLines[this.firstPixelLineIndex+y].charAt(x)
        let color = this.charToColor[character]
        if (colorTransformFn) {
          color = colorTransformFn(color)
        }

        ctx.fillStyle = color
        ctx.fillRect(xOffset+pixelXOffset, yOffset+pixelYOffset, pixelDimension, pixelDimension)
      }
    }
  }

  // Returns base64 data URL
  generatePNG(scale) {
    const cacheKey = this._imageStr + "_" + scale
    const cachedImg = sPCEImageCache[cacheKey]

    if (cachedImg) {
      return cachedImg
    }

    let canvas = document.createElement("canvas")
    canvas.width = this.width * scale
    canvas.height = this.height * scale

    let ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    this.drawInCanvas(canvas, scale)

    const result = canvas.toDataURL()
    sPCEImageCache[cacheKey] = result

    return result
  }

  // Returns a new PCEImage instance which combines `this` and `other`
  // by appending `other` to the right of `this`. `separator` is added
  // to every line between the two images.
  // If the images are not the same height, `blankSpaceFiller` will be used
  // to make them the same height.
  // Example:
  //
  // pceImageA:
  //.:#00000000
  //a:#000000
  //
  //aaa
  //aaa
  //aaa
  //aaa
  //aaa
  //
  // pceImageB:
  //.:#00000000
  //b:#FFFFFF
  //
  //bbb
  //bbb
  //bbb
  //bbb
  //
  // pceImageA.newPCEImageByAppendingOnRight(pceImageB, ".", "a"):
  //.:#00000000
  //a:#000000
  //b:#FFFFFF
  //
  //aaa.bbb
  //aaa.bbb
  //aaa.bbb
  //aaa.bbb
  //aaa.aaa
  //
  // Currently unhandled edge cases:
  // - Color tables where a character is mapped to different colors in the two images
  // - blankSpaceFiller that is longer than one character
  // - separator or blankSpaceFiller which are not already in the color table of at least one of this, other
  newPCEImageByAppendingOnRight(other, separator, blankSpaceFiller) {
    // Union the color tables
    let unionedCharToColor = {}

    for (let colorChar of Object.keys(this.charToColor)) {
      let colorStr = this.charToColor[colorChar]
      unionedCharToColor[colorChar] = colorStr
    }

    for (let colorChar of Object.keys(other.charToColor)) {
      let colorStr = other.charToColor[colorChar]
      unionedCharToColor[colorChar] = colorStr
    }

    // Make the new combined string representation, making the images the same height
    let unionedHeight = Math.max(this.height, other.height)

    let unionedImageStrLines = []

    for (let i = 0; i < unionedHeight; ++i) {
      let leftLine = this.imageStrLineAtPixelRow(i)
      let rightLine = other.imageStrLineAtPixelRow(i)

      if (!leftLine) {
        leftLine = blankSpaceFiller.repeat(this.width)
      }

      if (!rightLine) {
        rightLine = blankSpaceFiller.repeat(other.width)
      }

      let combinedLine = leftLine + separator + rightLine

      unionedImageStrLines.push(combinedLine)
    }

    // Add the color table to the beginning of unionedImageStrLines
    let colorTableStr = ""
    for (let colorChar of Object.keys(unionedCharToColor).sort()) {
      let colorStr = unionedCharToColor[colorChar]
      colorTableStr += colorChar + ":" + colorStr + "\n"
    }

    let imageStr = colorTableStr + "\n" + unionedImageStrLines.join("\n")

    // Create the new PCEImage
    return new PCEImage(imageStr)
  }

  // Replace the rectangle with top left corner (x, y)
  // and replacementImg.width, replacementImg.height
  overwritePixelsWithPCEImage(x, y, replacementImg) {
    // Example to work through the math:
    //
    //   0 1 2 3 4
    // 0 . . . . .
    // 1 . . . . .
    // 2 . . . . .
    // 3 . . o o o
    // 4 . . o o o
    //
    // this.width is 5
    // this.height is 5
    // replacementImg.width is 3
    // replacementImg.height is 2
    // x is 2
    // y is 3

    if (x < 0 || (x + replacementImg.width > this.width)) {
      console.log("PCEImage overwitePixelsWithPCEImage failed: replacementImg does not fit within width")
      return
    }

    if (y < 0 || (y + replacementImg.height > this.height)) {
      console.log("PCEImage overwitePixelsWithPCEImage failed: replacementImg does not fit within height")
      return
    }

    for (let j = 0; j < replacementImg.height; ++j) {
      let replacementLine = replacementImg.imageStrLineAtPixelRow(j)

      let oldLine = this.imageStrLineAtPixelRow(y+j)

      let newLine = oldLine.substring(0, x) + replacementLine + oldLine.substring(x + replacementLine.length)

      this.updateImageStrLineAtPixelRow(y+j, newLine)
    }
  }

  // Returns a new PCEImage instance with the image data in the
  // the specified rectangular area
  // Returns null if the rectangle is out of bounds
  newPCEImageByCropping(xOrigin, yOrigin, width, height) {
    if (width < 1 || height < 1) {
      return null
    }

    if (xOrigin < 0 || xOrigin + width > this.width) {
      return null
    }

    if (yOrigin < 0 || yOrigin + height > this.height) {
      return null
    }

    let imageStr = ""
    let comma = ""
    for (let y = 0; y < height; ++y) {
      let line = this.imageStrLineAtPixelRow(yOrigin+y)
      let retLine = line.substring(xOrigin, xOrigin+width)
      imageStr += comma + retLine
      comma = "\n"
    }

    // Faster but sloppy: just keep the same color table as the full image
    // instead of removing any colors that don't appear in the result image
    let colorLines = this.imageStrLines.slice(0, this.firstPixelLineIndex)

    imageStr = colorLines.join("\n") + "\n" + imageStr

    return new PCEImage(imageStr)
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

class PCEColor {
  // Properties:
  // r - int ranging 0-255
  // g - int ranging 0-255
  // b - int ranging 0-255
  // a - float ranging 0-1
  //
  // c - string, PCEImage character
  constructor(r, g, b, a) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
  }

  hexStr() {
    return MAUtils.rgbaToHex(this.r, this.g, this.b, this.a)
  }

  colorIsSameWithinThreshold(other, threshold) {
    let isTransparent = (this.a === 0 && other.a === 0)
    return isTransparent ||
      (this.a === other.a &&
      Math.abs(this.r-other.r) <= threshold &&
      Math.abs(this.g-other.g) <= threshold &&
      Math.abs(this.b-other.b) <= threshold)
  }
}
