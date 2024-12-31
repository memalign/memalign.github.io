
class MALogger {
  constructor() {
    this.logs = []
  }

  log(str) {
    this.logs.push(str)
  }
}

let MALog = new MALogger()

var assertionCount = 0
function assertTrue(condition, str) {
    if (!condition) {
      MALog.log("Failed assertion: " + str)
      throw "Failed assertion: " + str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqual(str1, str2) {
    if (str1 != str2) {
      let str = "Failed assertion: \"" + str1 + "\" does not equal \"" + str2 + "\""
      MALog.log(str)
      throw str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqualArrays(arr1, arr2) {
  // From https://masteringjs.io/tutorials/fundamentals/compare-arrays
  let isEqual = Array.isArray(arr1) &&
    Array.isArray(arr2) &&
    arr1.length === arr2.length &&
    arr1.every((val, index) => val === arr2[index])

    if (!isEqual) {
      let str = "Failed assertion:\n\n\"" + arr1 + "\" does not equal\n\n\"" + arr2 + "\""
      MALog.log(str)
      throw str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertPixelColor(ctx, x, y, color) {
  let data = ctx.getImageData(x, y, 1, 1).data
  let hex = MAUtils.rgbToHex(data[0], data[1], data[2])
  assertEqual(hex, color)
}


class UnitTests {

// PCEImage

  test_PCEImage_basicStringParsing() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEImage(str)
    assertEqual(img.width, 4)
    assertEqual(img.height, 2)
    assertEqual(img.charToColor["."], "#FFFFFF")
    assertEqual(img.charToColor["@"], "#F1F1F1")
  }

  test_PCEImage_drawInCanvas_basic() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEImage(str)

    let canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    img.drawInCanvas(canvas, 1)

    let ctx = canvas.getContext("2d")
    assertPixelColor(ctx, 0, 0, "#FFFFFF")
    assertPixelColor(ctx, 1, 0, "#F1F1F1")
    assertPixelColor(ctx, 2, 0, "#FFFFFF")
    assertPixelColor(ctx, 3, 0, "#FFFFFF")

    assertPixelColor(ctx, 0, 1, "#FFFFFF")
    assertPixelColor(ctx, 1, 1, "#FFFFFF")
    assertPixelColor(ctx, 2, 1, "#F1F1F1")
    assertPixelColor(ctx, 3, 1, "#FFFFFF")
  }

  test_PCEImage_drawInCanvas_scale() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEImage(str)

    let canvas = document.createElement("canvas")
    let scale = 2
    canvas.width = img.width*scale
    canvas.height = img.height*scale
    img.drawInCanvas(canvas, scale)

    let ctx = canvas.getContext("2d")
    assertPixelColor(ctx, 0, 0, "#FFFFFF")
    assertPixelColor(ctx, 1, 0, "#FFFFFF")
    assertPixelColor(ctx, 0, 1, "#FFFFFF")
    assertPixelColor(ctx, 1, 1, "#FFFFFF")

    assertPixelColor(ctx, 2, 0, "#F1F1F1")
    assertPixelColor(ctx, 4, 0, "#FFFFFF")
    assertPixelColor(ctx, 6, 0, "#FFFFFF")

    assertPixelColor(ctx, 0, 2, "#FFFFFF")
    assertPixelColor(ctx, 2, 2, "#FFFFFF")
    assertPixelColor(ctx, 4, 2, "#F1F1F1")

    assertPixelColor(ctx, 6, 2, "#FFFFFF")
    assertPixelColor(ctx, 7, 2, "#FFFFFF")
    assertPixelColor(ctx, 6, 3, "#FFFFFF")
    assertPixelColor(ctx, 7, 3, "#FFFFFF")
  }

  test_PCEImage_drawInCanvas_offset() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEImage(str)

    let canvas = document.createElement("canvas")

    let xOffset = 1
    let yOffset = 2

    canvas.width = img.width+xOffset
    canvas.height = img.height+yOffset

    let ctx = canvas.getContext("2d")
    ctx.fillStyle = "#00FFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    img.drawInCanvas(canvas, 1, xOffset, yOffset)

    // Pixels where we did not draw the image
    assertPixelColor(ctx, 0, 0, "#00FFFF")
    assertPixelColor(ctx, 0, 1, "#00FFFF")
    assertPixelColor(ctx, 0, 2, "#00FFFF")
    assertPixelColor(ctx, 0, 3, "#00FFFF")

    // Pixels where we drew the image
    assertPixelColor(ctx, 0+xOffset, 0+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 1+xOffset, 0+yOffset, "#F1F1F1")
    assertPixelColor(ctx, 2+xOffset, 0+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 3+xOffset, 0+yOffset, "#FFFFFF")

    assertPixelColor(ctx, 0+xOffset, 1+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 1+xOffset, 1+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 2+xOffset, 1+yOffset, "#F1F1F1")
    assertPixelColor(ctx, 3+xOffset, 1+yOffset, "#FFFFFF")
  }

  test_PCEImage_drawInCanvas_scaleAndOffset() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEImage(str)

    let canvas = document.createElement("canvas")
    let scale = 2
    let xOffset = 1
    let yOffset = 2

    canvas.width = img.width*scale+xOffset
    canvas.height = img.height*scale+yOffset

    let ctx = canvas.getContext("2d")
    ctx.fillStyle = "#00FFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    img.drawInCanvas(canvas, scale, xOffset, yOffset)

    // Pixels where we did not draw the image
    assertPixelColor(ctx, 0, 0, "#00FFFF")
    assertPixelColor(ctx, 0, 1, "#00FFFF")
    assertPixelColor(ctx, 0, 2, "#00FFFF")
    assertPixelColor(ctx, 0, 3, "#00FFFF")

    // Pixels where we drew the image
    assertPixelColor(ctx, 0+xOffset, 0+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 1+xOffset, 0+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 0+xOffset, 1+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 1+xOffset, 1+yOffset, "#FFFFFF")

    assertPixelColor(ctx, 2+xOffset, 0+yOffset, "#F1F1F1")
    assertPixelColor(ctx, 4+xOffset, 0+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 6+xOffset, 0+yOffset, "#FFFFFF")

    assertPixelColor(ctx, 0+xOffset, 2+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 2+xOffset, 2+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 4+xOffset, 2+yOffset, "#F1F1F1")

    assertPixelColor(ctx, 6+xOffset, 2+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 7+xOffset, 2+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 6+xOffset, 3+yOffset, "#FFFFFF")
    assertPixelColor(ctx, 7+xOffset, 3+yOffset, "#FFFFFF")
  }

  test_PCEImage_usesTransparency() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEImage(str)
    assertEqual(img.usesTransparency(), false)


    str = `a:#000000
b:#FF0000

babab
ababa
babab`
    img = new PCEImage(str)
    assertEqual(img.usesTransparency(), false)


    str = `a:#000000FF
b:#FF0000

babab
ababa
babab`
    img = new PCEImage(str)
    assertEqual(img.usesTransparency(), false)


    str = `a:#000000FE
b:#FF0000

babab
ababa
babab`
    img = new PCEImage(str)
    assertEqual(img.usesTransparency(), true)


    str = `a:#000000
b:#FF00001F

babab
ababa
babab`
    img = new PCEImage(str)
    assertEqual(img.usesTransparency(), true)


    str = `.:#00000000
o:#FFFFFF
@:#D5D6AE
#:#624073
-:#C28CB0
x:#F0DCA9

xxxxxxxxx`
    img = new PCEImage(str)
    assertEqual(img.usesTransparency(), false)


    str = `.:#00000000
o:#FFFFFF
@:#D5D6AE
#:#624073
-:#C28CB0
x:#F0DCA9

xx.xxxxxx`
    img = new PCEImage(str)
    assertEqual(img.usesTransparency(), true)


    str = `.:#00000000
o:#FFFFFF
@:#D5D6AE
#:#624073
-:#C28CB0
x:#F0DCA9

xxxxxxxxx
ooooooooo`
    img = new PCEImage(str)
    assertEqual(img.usesTransparency(), false)


    str = `.:#00000000
o:#FFFFFF
@:#D5D6AE
#:#624073
-:#C28CB0
x:#F0DCA9

xxxxxxxxx
.oooooooo`
    img = new PCEImage(str)
    assertEqual(img.usesTransparency(), true)
  }

  test_PCEImage_pceImageFromCanvas() {
    // test basic with colors
    let sourceStr = `.:#000000
o:#FFFF00

.o
o.`

    let sourceImg = new PCEImage(sourceStr)

    let scale = 10

    let canvas = document.createElement('canvas')
    canvas.width = sourceImg.width * scale
    canvas.height = sourceImg.height * scale
    sourceImg.drawInCanvas(canvas, scale)

    let resultImg = PCEImage.pceImageFromCanvas(canvas, scale)

    let resultStr = resultImg.imageStrLines.join("\n")

    let expStr= `@:#000000
A:#FFFF00

@A
A@`
    assertEqual(resultStr, expStr)



    // test transparent and white get the right character
    sourceStr = `.:#00000000
x:#FFFFFF
o:#FFFF00

x.o
o.x`

    sourceImg = new PCEImage(sourceStr)

    scale = 10

    canvas.width = sourceImg.width * scale
    canvas.height = sourceImg.height * scale
    sourceImg.drawInCanvas(canvas, scale)

    resultImg = PCEImage.pceImageFromCanvas(canvas, scale)
    resultStr = resultImg.imageStrLines.join("\n")

    expStr= `.:#FFFFFF
@:#FFFF00
_:#00000000

._@
@_.`
    assertEqual(resultStr, expStr)




    // test partial transparency
    sourceStr = `.:#00000088
x:#FFFFFF
o:#FFFF00

x.o
o.x`

    sourceImg = new PCEImage(sourceStr)

    scale = 10

    canvas.width = sourceImg.width * scale
    canvas.height = sourceImg.height * scale
    sourceImg.drawInCanvas(canvas, scale)

    resultImg = PCEImage.pceImageFromCanvas(canvas, scale)
    resultStr = resultImg.imageStrLines.join("\n")

    expStr= `.:#FFFFFF
@:#00000088
A:#FFFF00

.@A
A@.`
    assertEqual(resultStr, expStr)



    // test scale = 1
    sourceStr = `.:#00000088
x:#FFFFFF
o:#FFFF00

x.o
o.x`

    sourceImg = new PCEImage(sourceStr)

    scale = 1

    canvas.width = sourceImg.width * scale
    canvas.height = sourceImg.height * scale
    sourceImg.drawInCanvas(canvas, scale)

    resultImg = PCEImage.pceImageFromCanvas(canvas, scale)
    resultStr = resultImg.imageStrLines.join("\n")

    expStr= `.:#FFFFFF
@:#00000088
A:#FFFF00

.@A
A@.`
    assertEqual(resultStr, expStr)


    // test scale = 5
    sourceStr = `.:#00000088
x:#FFFFFF
o:#FFFF00

x.o
o.x`

    sourceImg = new PCEImage(sourceStr)

    scale = 5

    canvas.width = sourceImg.width * scale
    canvas.height = sourceImg.height * scale
    sourceImg.drawInCanvas(canvas, scale)

    resultImg = PCEImage.pceImageFromCanvas(canvas, scale)
    resultStr = resultImg.imageStrLines.join("\n")

    expStr= `.:#FFFFFF
@:#00000088
A:#FFFF00

.@A
A@.`
    assertEqual(resultStr, expStr)


    // test color similarity threshold
    sourceStr = `.:#00000088
x:#FFFFFF
y:#FFFFFE
z:#FFFFF8
a:#F8F8F8
b:#F8F8EF
o:#FFFF00

x.oyzab
o.xyzab`

    sourceImg = new PCEImage(sourceStr)

    scale = 10

    canvas.width = sourceImg.width * scale
    canvas.height = sourceImg.height * scale
    sourceImg.drawInCanvas(canvas, scale)

    resultImg = PCEImage.pceImageFromCanvas(canvas, scale)
    resultStr = resultImg.imageStrLines.join("\n")

    expStr= `.:#FFFFFF
@:#00000088
A:#FFFF00
B:#F8F8EF

.@A...B
A@....B`
    assertEqual(resultStr, expStr)
  }

  test_PCEImage_newPCEImageByAppendingOnRight() {
    // right image is shorter
    let aStr = `.:#00000000
a:#000000

aaa
aaa
aaa
aaa
aaa`

    let bStr = `.:#00000000
b:#FFFFFF

bbb
bbb
bbb
bbb`

    let a = new PCEImage(aStr)
    let b = new PCEImage(bStr)

    let ret = a.newPCEImageByAppendingOnRight(b, ".", "a")

    let exp = `.:#00000000
a:#000000
b:#FFFFFF

aaa.bbb
aaa.bbb
aaa.bbb
aaa.bbb
aaa.aaa`

    assertEqual(ret.imageStrLines.join("\n"), exp)


    // left image is shorter
    ret = b.newPCEImageByAppendingOnRight(a, ".", "a")
    exp = `.:#00000000
a:#000000
b:#FFFFFF

bbb.aaa
bbb.aaa
bbb.aaa
bbb.aaa
aaa.aaa`

    assertEqual(ret.imageStrLines.join("\n"), exp)


    // test images are same height
    bStr = `.:#00000000
b:#FFFFFF

bbb
bbb
bbb
bbb
bbb`

    b = new PCEImage(bStr)

    ret = b.newPCEImageByAppendingOnRight(a, ".", "a")
    exp = `.:#00000000
a:#000000
b:#FFFFFF

bbb.aaa
bbb.aaa
bbb.aaa
bbb.aaa
bbb.aaa`

    assertEqual(ret.imageStrLines.join("\n"), exp)


    // empty str separator
    ret = b.newPCEImageByAppendingOnRight(a, "", "a")
    exp = `.:#00000000
a:#000000
b:#FFFFFF

bbbaaa
bbbaaa
bbbaaa
bbbaaa
bbbaaa`

    assertEqual(ret.imageStrLines.join("\n"), exp)


    // two char separator
    ret = b.newPCEImageByAppendingOnRight(a, "ab", "a")
    exp = `.:#00000000
a:#000000
b:#FFFFFF

bbbabaaa
bbbabaaa
bbbabaaa
bbbabaaa
bbbabaaa`

    assertEqual(ret.imageStrLines.join("\n"), exp)
  }

  test_PCEImage_newPCEImageByCropping() {
    let imgStr = `.:#00000000
a:#000000
b:#FFFFFF
c:#888888
d:#555555

.bbabaaa
bbbcbaaa
bbbabaaa
bbbabaaa
bbbabaad`

    let a = new PCEImage(imgStr)

    let ret = a.newPCEImageByCropping(-1, 0, 1, 1)
    assertEqual(ret, null)

    ret = a.newPCEImageByCropping(0, -1, 1, 1)
    assertEqual(ret, null)

    ret = a.newPCEImageByCropping(0, 0, 9, 1)
    assertEqual(ret, null)

    ret = a.newPCEImageByCropping(0, 0, 1, 6)
    assertEqual(ret, null)

    ret = a.newPCEImageByCropping(7, 0, 2, 1)
    assertEqual(ret, null)

    ret = a.newPCEImageByCropping(0, 4, 1, 2)
    assertEqual(ret, null)


    ret = a.newPCEImageByCropping(0, 0, 1, 1)
    let exp = `.:#00000000
a:#000000
b:#FFFFFF
c:#888888
d:#555555

.`
    assertEqual(ret.imageStrLines.join("\n"), exp)


    ret = a.newPCEImageByCropping(7, 4, 1, 1)
    exp = `.:#00000000
a:#000000
b:#FFFFFF
c:#888888
d:#555555

d`
    assertEqual(ret.imageStrLines.join("\n"), exp)


    ret = a.newPCEImageByCropping(0, 0, 8, 5)
    exp = `.:#00000000
a:#000000
b:#FFFFFF
c:#888888
d:#555555

.bbabaaa
bbbcbaaa
bbbabaaa
bbbabaaa
bbbabaad`

    assertEqual(ret.imageStrLines.join("\n"), exp)


    ret = a.newPCEImageByCropping(0, 0, 4, 5)
    exp = `.:#00000000
a:#000000
b:#FFFFFF
c:#888888
d:#555555

.bba
bbbc
bbba
bbba
bbba`

    assertEqual(ret.imageStrLines.join("\n"), exp)


    ret = a.newPCEImageByCropping(0, 0, 4, 3)
    exp = `.:#00000000
a:#000000
b:#FFFFFF
c:#888888
d:#555555

.bba
bbbc
bbba`

    assertEqual(ret.imageStrLines.join("\n"), exp)


    ret = a.newPCEImageByCropping(4, 0, 4, 5)
    exp = `.:#00000000
a:#000000
b:#FFFFFF
c:#888888
d:#555555

baaa
baaa
baaa
baaa
baad`

    assertEqual(ret.imageStrLines.join("\n"), exp)


    ret = a.newPCEImageByCropping(4, 2, 4, 3)
    exp = `.:#00000000
a:#000000
b:#FFFFFF
c:#888888
d:#555555

baaa
baaa
baad`

    assertEqual(ret.imageStrLines.join("\n"), exp)

  }

  test_overwritePixelsWithPCEImage() {
    let baseImgStr = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    let baseImg = new PCEImage(baseImgStr)

    let rImg = new PCEImage(`.:#000000
o:#FFFFFF

ooo
ooo`)

    baseImg.overwritePixelsWithPCEImage(2, 3, rImg)

    let exp = `.:#000000
o:#FFFFFF

.....
.....
.....
..ooo
..ooo`

    assertEqual(baseImg.imageStr, exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(0, 0, rImg)
    exp = `.:#000000
o:#FFFFFF

ooo..
ooo..
.....
.....
.....`

    assertEqual(baseImg.imageStr, exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(-1, 0, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr, exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(0, -1, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr, exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(3, 0, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr, exp)



    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(0, 4, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr, exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(3, 4, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr, exp)
  }


// PCEWobbleImage
  test_PCEWobbleImage_basicStringParsing() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEWobbleImage(str)
    assertEqual(img.width, 4)
    assertEqual(img.height, 2)
    assertEqual(img.charToColor["."], "#FFFFFF")
    assertEqual(img.charToColor["@"], "#F1F1F1")
  }

  test_PCEWobbleImage_drawInCanvas_scale() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEWobbleImage(str)

    let canvas = document.createElement("canvas")
    let scale = 10
    canvas.width = img.width*scale
    canvas.height = img.height*scale
    img.drawInCanvas(canvas, scale)

    let ctx = canvas.getContext("2d")

    // Doing some spot checking rather than a rigorous test of
    // the wobble behavior
    assertPixelColor(ctx, 5, 5, "#FFFFFF")
    assertPixelColor(ctx, 15, 5, "#F1F1F1")
    assertPixelColor(ctx, 25, 5, "#FFFFFF")
    assertPixelColor(ctx, 35, 5, "#FFFFFF")

    assertPixelColor(ctx, 5, 15, "#FFFFFF")
    assertPixelColor(ctx, 15, 15, "#FFFFFF")
    assertPixelColor(ctx, 25, 15, "#F1F1F1")
    assertPixelColor(ctx, 35, 15, "#FFFFFF")
  }

  test_PCEWobbleImage_charToCount() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEWobbleImage(str)
    assertEqual(img.charToCount["."], 6)
    assertEqual(img.charToCount["@"], 2)
  }

  test_PCEWobbleImage_clumps() {
    let str = `.:#FFFFFF
@:#F1F1F1

.@..
..@.`
    let img = new PCEWobbleImage(str)
    assertEqual(img.clumps.length, 4)
    assertEqual(img.clumps[0].str(), ".")
    assertEqual(img.clumps[0].size(), 3)
    assertEqual(img.clumps[1].str(), ".")
    assertEqual(img.clumps[1].size(), 3)
    assertEqual(img.clumps[2].str(), "@")
    assertEqual(img.clumps[2].size(), 1)
    assertEqual(img.clumps[3].str(), "@")
    assertEqual(img.clumps[3].size(), 1)
  }


// Unit test harness

  run() {
    let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))

    let passCount = 0
    for (let method of methods) {
      if (method.startsWith("test")) {
        MALog.log("=== Invoking " + method + " ===")
        this[method]();
        passCount++
      }
    }
    MALog.log(passCount + " tests and " + assertionCount + " assertions passed successfully!")
  }
}

// Run with:
//  let ut = new UnitTests()
//  ut.run()
