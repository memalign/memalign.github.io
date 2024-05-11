
// Configuration
const MAX_TOUCH_POINTS = 6
const RESLICE_COOL_OFF = 10
const BODY_MASS = 3.5
const SLICE_COUNT_PER_MIN = 130 // To measure, I sliced many pizzas multiple times, but not as quickly as possible, and got this per-minute average
const SMALL_SCREEN_WIDTH_THRESHOLD = 400
const SMALL_SCREEN_SCALE_FACTOR = 0.8
const DEMO_MODE = false // used to capture og:image
const SHOW_DEBUG_OVERLAY = false

class MARunner {
  constructor() {
    this.isRunning = false
    this.engine = null
  }

  run(engine) {
    this.engine = engine
    this.isRunning = true

    this.lastUpdate = performance.now()

    let r = this

    // Modified version of this code:
    // https://github.com/liabru/matter-js/issues/702#issuecomment-1919762054
    const fixedDelta = 1000 / 60
    const runnerFunc = () => {
      const now = performance.now()

      while (r.lastUpdate < now) {
        Matter.Engine.update(r.engine, fixedDelta)
        r.lastUpdate += fixedDelta
      }

      if (r.isRunning) {
        requestAnimationFrame(runnerFunc)
      }
    }
    requestAnimationFrame(runnerFunc)
  }

  stop() {
    this.isRunning = false
  }
}

class MAVector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  multiply(scalar) {
    this.x *= scalar
    this.y *= scalar
  }

  rotateByRad(radians) {
    let newX = this.x * Math.cos(radians) - this.y * Math.sin(radians)
    let newY = this.x * Math.sin(radians) + this.y * Math.cos(radians)

    this.x = newX
    this.y = newY
  }

  copy() {
    let r = new MAVector(this.x, this.y)
    return r
  }
}

class MACanvasImage {
  constructor(canvas) {
    this.canvas = canvas
    this.imgDataURL = canvas.toDataURL()
    this.width = canvas.width
    this.height = canvas.height
    this.scale = 0.1
  }

  dataURL() {
    return this.imgDataURL
  }

  newImageByCropping(x, y, width, height) {
    let rCanvas = document.createElement("canvas")
    rCanvas.width = width
    rCanvas.height = height

    let rCtx = rCanvas.getContext("2d")

    let oCtx = this.canvas.getContext("2d")

    let imgData = oCtx.getImageData(x, y, width, height)

    rCtx.putImageData(imgData, 0, 0)

    return new MACanvasImage(rCanvas)
  }
}

class MAPCEImage {
  constructor(pceImage) {
    this.pceImage = pceImage
    this.width = this.pceImage.width
    this.height = this.pceImage.height
    this.scale = 0.5
  }

  dataURL() {
    return this.pceImage.generatePNG(4)
  }

  newImageByCropping(x, y, width, height) {
    let newPCEImage = this.pceImage.newPCEImageByCropping(x, y, width, height)
    return new MAPCEImage(newPCEImage)
  }
}

function taptoy() {
  const RESTITUTION = 0.9

  let WIDTH, HEIGHT

  let SCREEN_SCALE_FACTOR = function() { return WIDTH < SMALL_SCREEN_WIDTH_THRESHOLD ? SMALL_SCREEN_SCALE_FACTOR : 1 }

  let boundaries, engine, render, runner, platform, sliceMe, pizzaGrid
  let gameStarted = false

  let lastEvaluatedUnlockSliceCount = 0
  let lastEvaluatedPizzaGridSliceUnlocked = 0
  let sliceCount = 0
  let pizzaGridSliceUnlocked = 0
  loadSliceCountUnlockStateFromStorage()

  let shouldHidePizzaGrid = false
  let nextPCEImageToLaunch = null

  let soundEffectsEnabled = false
  loadSoundEffectsEnabledFromStorage()

  function onResize () {
    WIDTH = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    HEIGHT = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    //console.log(`onResize: WIDTH ${WIDTH}  HEIGHT ${HEIGHT} = max(${document.documentElement.clientHeight}, ${window.innerHeight})`)

    if (!engine) {
      let [e, r] = createEngineRender()
      engine = e
      render = r
    }

    // https://github.com/liabru/matter-js/issues/955
    if (render && render.canvas) {
      console.log("setting new size: " + WIDTH + "x" + HEIGHT)
      render.bounds.max.x = WIDTH
      render.bounds.max.y = HEIGHT
      render.options.width = WIDTH
      render.options.height = HEIGHT
      render.canvas.width = WIDTH
      render.canvas.height = HEIGHT
      let pixelRatio = window.devicePixelRatio || 1
      Matter.Render.setPixelRatio(render, pixelRatio)
    }


    // Remove old boundaries
    if (boundaries) {
      Matter.World.remove(engine.world, boundaries)
    }

    boundaries = generateBoundaries()
    platform = boundaries[0]
    Matter.World.add(engine.world, boundaries)


    // Add the pizzaGrid object
    // Remove and recreate it so it's positioned correctly when the window
    // resizes
    if (gameStarted) {
      recreatePizzaGrid()
    }


    // Add the intro "Slice me" object
    // Remove and recreate it so it's positioned correctly when the window
    // resizes
    if (!gameStarted) {
      if (sliceMe) {
        Matter.World.remove(engine.world, [ sliceMe ])
        sliceMe = null
      }

      let pceImage = new PCEImage(PCEImageLibrary.sliceMe.imageStr)
      let maImage = new MAPCEImage(pceImage)
      let imgDataURL = maImage.dataURL()
      let radius = 100 * SCREEN_SCALE_FACTOR()
      sliceMe = Matter.Bodies.circle(WIDTH / 2, HEIGHT / 3, radius, {
        isStatic: true,
        restitution: RESTITUTION,
        friction: 0.001,
        mass: BODY_MASS,
        render: {
          sprite: {
            texture: imgDataURL,
            xScale: maImage.scale * SCREEN_SCALE_FACTOR(),
            yScale: maImage.scale * SCREEN_SCALE_FACTOR(),
          }
        },
      })
      sliceMe.tt_image = maImage
      sliceMe.tt_radius = radius
      Matter.World.add(engine.world, [ sliceMe ])
    }
  }

  onResize()
  window.addEventListener('resize', onResize)

  function createEngineRender () {
    let engine = Matter.Engine.create()

    engine.enableSleeping = true

    let pixelRatio = window.devicePixelRatio || 1
    console.log("Using pixel ratio: " + pixelRatio)

    if (SHOW_DEBUG_OVERLAY) {
      let notificationEl = document.getElementById("notificationSpan")
      notificationEl.textContent = "debug string"
      notificationEl.style.transition = ''
      notificationEl.style.opacity = '1'
    }

    let render = Matter.Render.create({
      element: document.querySelector('.content'),
      engine: engine,
      canvas: document.getElementById('sliceCanvas'),
      options: {
        width: WIDTH,
        height: HEIGHT,
        pixelRatio: pixelRatio,
        background: '#00000000',
        showSleeping: false, // prevent objects from becoming transparent when they stop moving
        wireframes: false, // show textures
      }
    })

    // if (debug.enabled) {
    //   engine.render.options.showCollisions = true
    //   engine.render.options.showVelocity = true
    //   engine.render.options.showAngleIndicator = true
    // }

    return [engine, render]
  }

  function recreatePizzaGrid() {
    if (shouldHidePizzaGrid) {
      return
    }

    if (pizzaGrid) {
      Matter.World.remove(engine.world, [ pizzaGrid ])
      pizzaGrid = null
    }

    let maImage = createPizzaGridImage()
    let imgDataURL = maImage.dataURL()


    let radius = 100 * SCREEN_SCALE_FACTOR()

    let bottomPadding = 15
    let rightPadding = 10
    let centerX = WIDTH - (maImage.width*maImage.scale*SCREEN_SCALE_FACTOR()/2) - rightPadding
    let centerY = HEIGHT - (maImage.height*maImage.scale*SCREEN_SCALE_FACTOR()/2) - bottomPadding

    pizzaGrid = Matter.Bodies.circle(centerX, centerY, radius, {
      isStatic: true,
      restitution: RESTITUTION,
      friction: 0.001,
      mass: BODY_MASS,
      render: {
        sprite: {
          texture: imgDataURL,
          xScale: maImage.scale * SCREEN_SCALE_FACTOR(),
          yScale: maImage.scale * SCREEN_SCALE_FACTOR(),
        }
      },
    })

    // Disable physical interactions
    pizzaGrid.collisionFilter = {
      'group': -2,
    }

    pizzaGrid.tt_image = maImage
    pizzaGrid.tt_radius = radius
    Matter.World.add(engine.world, [ pizzaGrid ])
  }

  function generateBoundaries() {
    let offset = 1
    return [
      // platform to catch objects that fall offscreen
      Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + 400, 100*WIDTH, offset, {
        isStatic: true,
        friction: 1, // objects should stop sliding with sleeping=true
        render: {
          visible: false
        }
      })
    ]
  }

  // Start rendering and physics engine
  runner = new MARunner()
  runner.run(engine)
  Matter.Render.run(render)

  let launchedObjects = []

  function launchObject(x, y, pceImage, radius) {
    let body

    let maImage = new MAPCEImage(pceImage)
    let imgDataURL = maImage.dataURL()

    body = Matter.Bodies.circle(x, y, radius, {
      restitution: RESTITUTION,
      friction: 0.001,
      mass: BODY_MASS,
      render: {
        sprite: {
          texture: imgDataURL,
          xScale: maImage.scale * SCREEN_SCALE_FACTOR(),
          yScale: maImage.scale * SCREEN_SCALE_FACTOR(),
        }
      }
    })

    body.tt_image = maImage
    body.tt_radius = radius

    let fVector = {
      x: (Math.floor((Date.now() / 200) % 10) / 200) - 0.025,
      y: -1 * Math.sqrt( (HEIGHT / 3200) * 0.35 )
    }

    Matter.Body.applyForce(body, body.position, fVector)

    let maxSpin = 0.02
    let spin = (Math.random() * 2*maxSpin) - maxSpin
    Matter.Body.setAngularVelocity(body, spin)

    Matter.World.add(engine.world, [ body ])

    launchedObjects.push(body)
  }

  Matter.Events.on(engine, 'collisionStart', onCollision)

  function onCollision (e) {
    e.pairs.forEach(function (pair) {
      let bodyA = pair.bodyA
      let bodyB = pair.bodyB
      let AisPlatform = bodyA === platform
      let BisPlatform = bodyB === platform

      let bodyToRemove = null
      if (AisPlatform) {
        bodyToRemove = bodyB
      } else if (BisPlatform) {
        bodyToRemove = bodyA
      }

      if (bodyToRemove) {
        let indexToRemove = launchedObjects.indexOf(bodyToRemove)
        if (indexToRemove !== -1) {
          launchedObjects.splice(indexToRemove, 1)
        }
        Matter.World.remove(engine.world, [ bodyToRemove ])
        //console.log("LaunchedObjs: " + launchedObjects.length)
      }
    })
  }

  function updateHelpControls() {
    // Disable pull to refresh, pinch to zoom, etc
    document.body.style.touchAction = 'none'

    let home = document.querySelector('.home')
    home.innerHTML = ""

    let toggleLink = document.createElement("a")
    toggleLink.textContent = "sound is " + (soundEffectsEnabled ? "on" : "off")
    toggleLink.href = "#"
    toggleLink.onclick = function() {
      soundEffectsEnabled = !soundEffectsEnabled
      saveSoundEffectsEnabledToStorage()

      updateHelpControls()

      soundEffects.stop()

      return false
    }

    home.append(toggleLink)

    let about = document.querySelector('.about')
    about.innerHTML = ""
    let startOverLink = document.createElement("a")
    startOverLink.textContent = "start over"
    startOverLink.href = "#"
    startOverLink.onclick = function() {

      let confirmation = window.confirm("Reset pizzas and score to zero?")
      if (confirmation) {
        sliceCount = 0
        pizzaGridSliceUnlocked = 0
        saveSliceCountUnlockStateToStorage()
        location.reload()
      }

      return false
    }

    about.append(startOverLink)
  }

  function createPizzaGridImage() {
    let imgLibPizzas = pizzaImagesDrawOrder()

    let pizza15TinyStr = imgLibPizzas[14].imageStrTiny
    let pceImages = imgLibPizzas.map(i => new PCEImage(i.imageStr))

    let numPizzasWide = 5
    let numPizzasTall = Math.ceil(pceImages.length / numPizzasWide)

    // Calculate canvas size needed
    let maxPizzaWidth = Math.max(...pceImages.map(obj => obj.width))
    let maxPizzaHeight = Math.max(...pceImages.map(obj => obj.height))
    let padding = 5

    let width = maxPizzaWidth * numPizzasWide + (padding * (numPizzasWide-1))
    let height = maxPizzaHeight * numPizzasTall + (padding * (numPizzasTall-1))


    // Create canvas
    let canvasScale = 4
    let canvas = document.createElement("canvas")
    canvas.width = width * canvasScale
    canvas.height = height * canvasScale

    let ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)


    // Draw pizzas
    let scale = 4
    for (let i = 0; i < pceImages.length; ++i) {
      let pceImage = pceImages[i]

      let xIndex = i % numPizzasWide
      let yIndex = Math.floor(i / numPizzasWide)

      let x = (maxPizzaWidth + padding) * xIndex * scale
      let y = (maxPizzaHeight + padding) * yIndex * scale

      // Center the pizza horizontally and vertically in its cell
      x += Math.ceil((maxPizzaWidth - pceImage.width)/2) * scale
      y += Math.ceil((maxPizzaHeight - pceImage.height)/2) * scale

      let maskFn = isPizzaIndexUnlocked(imgLibPizzas[i].index, sliceCount, pizzaGridSliceUnlocked) ? null : MAUtils.colorTransform_maskColorPixels
      pceImage.drawInCanvas(canvas, scale, x, y, maskFn)
    }

    let maImage = new MACanvasImage(canvas)
    return maImage
  }

  function pizzaImagesDrawOrder() {
    return [
      PCEImageLibrary.pizza1,
      PCEImageLibrary.pizza2,
      PCEImageLibrary.pizza3,
      PCEImageLibrary.pizza4,
      PCEImageLibrary.pizza5,
      PCEImageLibrary.pizza6,
      PCEImageLibrary.pizza7,
      PCEImageLibrary.pizza15, // smile
      PCEImageLibrary.pizza8,
      PCEImageLibrary.pizza9,
      PCEImageLibrary.pizza10,
      PCEImageLibrary.pizza11,
      PCEImageLibrary.pizza12,
      PCEImageLibrary.pizza13,
      PCEImageLibrary.pizza14,
    ]
  }

  function pizzaImagesUnlocked() {
    return pizzaImagesDrawOrder().filter(x => isPizzaIndexUnlocked(x.index, sliceCount, pizzaGridSliceUnlocked))
  }

  function launchDemoBunch() {
    let radius = 50 * SCREEN_SCALE_FACTOR()

    let numToLaunch = 40

    for (let i = 0; i < numToLaunch; ++i) {
      let pceImage = new PCEImage(MAUtils.randomElement(pizzaImagesDrawOrder()).imageStr)

      let edgeWidth = WIDTH * 0.1
      let x = MAUtils.randomInt(WIDTH - 2*edgeWidth) + edgeWidth

      launchObject(x, HEIGHT - 30, pceImage, radius)
    }
  }

  function launchBunch() {
    if (DEMO_MODE) {
      launchDemoBunch()
      return
    }

    let numToLaunch = nextPCEImageToLaunch ? 5 : (MAUtils.randomInt(5) + 1)

    let pceImage = nextPCEImageToLaunch ? nextPCEImageToLaunch : new PCEImage(MAUtils.randomElement(pizzaImagesUnlocked()).imageStr)
    nextPCEImageToLaunch = null

    let radius = 50 * SCREEN_SCALE_FACTOR()

    for (let i = 0; i < numToLaunch; ++i) {
      let edgeWidth = WIDTH * 0.1
      let x = MAUtils.randomInt(WIDTH - 2*edgeWidth) + edgeWidth

      launchObject(x, HEIGHT - 30, pceImage, radius)
    }

    if (soundEffectsEnabled) {
      soundEffects.playSound("whoosh")
    }
  }


  let autoLaunchInterval = 0
  function startTouchMouseLoopIfNecessary() {
    if (soundEffectsEnabled) {
      soundEffects.requestSong()
    }

    if (!gameStarted) {
      return
    }

    if (!autoLaunchInterval) {
      autoLaunchInterval = setInterval(function () {
        if (soundEffectsEnabled) {
          soundEffects.requestSong()
        }

        launchBunch()
      }, 2000)
    }
  }

  document.body.addEventListener('touchstart', function (e) {
    if (e.target.tagName !== "A") {
      e.preventDefault()
    }

    let activeTouches = e.touches

    let x = activeTouches[0].clientX
    let y = activeTouches[0].clientY
    addTouchPoint(x, y)

    startTouchMouseLoopIfNecessary()

    if (soundEffectsEnabled) {
      soundEffects.requestSong(true)
    }
  })

  document.body.addEventListener('touchend', function (e) {
    if (e.target.tagName !== "A") {
      e.preventDefault()
    }

    clearTouchPoints()
  })

  document.body.addEventListener('touchcancel', function (e) {
    if (e.target.tagName !== "A") {
      e.preventDefault()
    }

    clearTouchPoints()
  })

  // Disable iOS rubber banding on scroll
  document.body.addEventListener('touchmove', function (e) {
    e.preventDefault()

    let activeTouches = e.touches
    let x = activeTouches[0].clientX
    let y = activeTouches[0].clientY
    addTouchPoint(x, y)
  })

  let mouseEvent = null
  document.body.addEventListener('mousedown', function (e) {
    mouseEvent = e

    let x = mouseEvent.clientX
    let y = mouseEvent.clientY
    addTouchPoint(x, y)

    startTouchMouseLoopIfNecessary()

    if (soundEffectsEnabled) {
      soundEffects.requestSong(true)
    }
  })

  document.body.addEventListener('mousemove', function (e) {
    if (mouseEvent) {
      mouseEvent = e

      let x = mouseEvent.clientX
      let y = mouseEvent.clientY
      addTouchPoint(x, y)
    }
  })

  document.body.addEventListener('mouseup', function (e) {
    mouseEvent = null
    clearTouchPoints()
  })


  let sliceGeneration = 0
  let touchPointsAdded = []
  let constraintsAdded = []
  let touchPointsToAdd = []

  function addTouchPoint(x, y) {
    let bodyA = Matter.Bodies.circle(x, y, 0, { isStatic: true })
    // Disable physical interactions
    bodyA.collisionFilter = {
      'group': -1,
      'category': 2,
      'mask': 0,
    }

    touchPointsToAdd.push(bodyA)

    updateEngineWithTouchPoints()

    handleSliceCollision()
  }

  function handleSliceCollision() {
    if (touchPointsAdded.length < 2) {
      return
    }

    let madeSlice = false

    let lastPoint = touchPointsAdded[touchPointsAdded.length - 1]
    let secondToLastPoint = touchPointsAdded[touchPointsAdded.length - 2]

    let p1 = secondToLastPoint.position
    let p2 = lastPoint.position
    let userAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

    let collisions = Matter.Query.point(launchedObjects, lastPoint.position)

    if (sliceMe && Matter.Query.point([ sliceMe ], lastPoint.position).length) {
      collisions.push(sliceMe)
      sliceMe = null
      gameStarted = true
      sliceCount++
      madeSlice = true
      startTouchMouseLoopIfNecessary()
      updateHelpControls()
    }

    if (!pizzaGridSliceUnlocked && pizzaGrid && Matter.Query.point([ pizzaGrid ], lastPoint.position).length) {
      collisions.push(pizzaGrid)
      pizzaGrid = null
      pizzaGridSliceUnlocked = 1
      sliceCount++
      madeSlice = true
      shouldHidePizzaGrid = true

      setTimeout(function() {
        shouldHidePizzaGrid = false
        recreatePizzaGrid()
      }, 1000)
    }

    if (collisions.length) {
      //console.log("Collisions.length = " + collisions.length)

      if (soundEffectsEnabled) {
        soundEffects.playSound("slice")
      }

      for (let body of collisions) {
        // Don't re-slice a body that was created by the active slice
        if (body.tt_sliceGeneration !== undefined && body.tt_sliceGeneration + RESLICE_COOL_OFF > sliceGeneration) {
          continue
        }

        // Calculate the angle of the user's input (userAngle)
        // Then choose which dimension to cut in half based on that angle and the current angle of the object being cut

        let bodyAngle = body.angle

        let maImage = body.tt_image

        // At what angle does the user's line hit the object?
        // "Unrotate" by bodyAngle
        let collisionAngle = userAngle - bodyAngle
        //console.log("userAngle: " + userAngle + " bodyAngle: " + bodyAngle)

        //             -90deg
        //               |
        //               |
        //               |
        //  -45deg       v          -135deg
        //    \     |==========|     /
        //     \    |          |    /
        //      \   |          |   /
        //       v  |          |  v
        //  0 --->  |          |  <--- 180deg
        //       ^  |          |  ^
        //      /   |          |   \
        //     /    |          |    \
        //    /     |==========|     \
        //   45deg       ^           135deg
        //               |
        //               |
        //               |
        //              90deg

        // If the angle is between -45deg to 45deg, it's a horizontal slice
        // If the angle is between -45deg to -135deg, it's a vertical slice
        // If the angle is between 45deg to 135deg, it's a vertical slice
        // Else, it's a horizontal slice

        // Construct two half PCEImages by cutting tt_pceImage
        // Then rotate them so the dividing line matches the angle of the user's input; setAngle uses radians
        //
        //
        // collisionAngle|slice | halves angle   | translate half by
        //         0      h       0                 (0.25*height,0) rotated by 90 deg (top half); bottom half rotated by -90
        //        44      h       44                (0.25*height,0) rotated by 44+90deg (top half); bottom half rotated 44-90deg
        //       -44      h       -44               (0.25*height,0) rotated by -44+90deg (top half); bottom half rotated -44-90deg
        //
        //        -70     v       20                (0.25*width,0) rotated by 20deg (right half); left half rotated 20+180deg
        //        -90     v       0                 (0.25*width,0) rotated by 0deg (right half); left half rotated 180deg
        //        -100    v       -10               (0.25*width,0) rotated by -10deg (right half); left half rotated -10+180deg
        //        -134    v       -44               (0.25*width,0) rotated by -44deg (right half); left half rotated -44+180deg
        //
        //        -140    h       40                (0.25*height,0) rotated by 40+90deg (top half); bottom half rotated by 40-90deg
        //        181     h       1                 (0.25*height,0) rotated by 1+90deg (top half); bottom half rotated by 1-90deg
        //        180     h       0                 (0.25*height,0) rotated by 0+90deg (top half); bottom half rotated by 0-90deg
        //        175     h       -5                (0.25*height,0) rotated by -5+90deg (top half); bottom half rotated by -5-90deg
        //        136     h       -44               (0.25*height,0) rotated by -44+90deg (top half); bottom half rotated by -44-90deg
        //
        //        70      v       -20               (0.25*width,0) rotated by -20deg (right half); left half rotated by -20+180deg
        //        90      v       0                 (0.25*width,0) rotated by 0 deg (right half); left half rotated by 0+180deg
        //        100     v       10                (0.25*width,0) rotated by 10 deg (right half); left half rotated by 10+180deg
        //        134     v       44                (0.25*width,0) rotated by 44 deg (right half); left half rotated by 44+180deg

        //console.log("CollisionAngle: " + MAUtils.rad2deg(collisionAngle) + "deg")

        while (collisionAngle < MAUtils.deg2rad(-135)) {
          collisionAngle += MAUtils.deg2rad(360)
        }

        while (collisionAngle > MAUtils.deg2rad(180+45)) {
          collisionAngle -= MAUtils.deg2rad(360)
        }

        if (collisionAngle < MAUtils.deg2rad(-135) ||
            collisionAngle > MAUtils.deg2rad(180+45)) {
          console.log("OUT OF BOUNDS: " + MAUtils.rad2deg(collisionAngle) + "deg")
        }


        if (collisionAngle >= MAUtils.deg2rad(-45) &&
            collisionAngle < MAUtils.deg2rad(45)) {
          // Horizontal slice

          if (maImage.height < 2) {
            console.log("Object is too small to cut")
            continue
          }

          let topHalfImg = maImage.newImageByCropping(0, 0, maImage.width, Math.floor(maImage.height/2))

          let bottomHalfImg = maImage.newImageByCropping(0, topHalfImg.height, maImage.width, maImage.height - topHalfImg.height)

          // collisionAngle|slice | halves angle   | translate half by
          //        44      h       44                (0.25*height,0) rotated by 44+90deg (top half); bottom half rotated 44-90deg

          let additionalRotation = collisionAngle

          let offsetUnitVector = new MAVector(1, 0)
          offsetUnitVector.rotateByRad(-MAUtils.deg2rad(90)+additionalRotation+bodyAngle)
          addSliceHalfWithImg(topHalfImg, body, additionalRotation, offsetUnitVector)

          offsetUnitVector = new MAVector(1, 0)
          offsetUnitVector.rotateByRad(MAUtils.deg2rad(90)+additionalRotation+bodyAngle)
          addSliceHalfWithImg(bottomHalfImg, body, additionalRotation, offsetUnitVector)

        } else if (collisionAngle >= MAUtils.deg2rad(-135) &&
                   collisionAngle < MAUtils.deg2rad(-45)) {
          // Vertical slice

          if (maImage.width < 2) {
            console.log("Object is too small to cut")
            continue
          }

          let leftHalfImg = maImage.newImageByCropping(0, 0, Math.floor(maImage.width/2), maImage.height)

          let rightHalfImg = maImage.newImageByCropping(leftHalfImg.width, 0, maImage.width - leftHalfImg.width, maImage.height)

          // collisionAngle|slice | halves angle   | translate half by
          //        -70     v       20                (0.25*width,0) rotated by 20deg (right half); left half rotated 20+180deg
          //        -90     v       0                 (0.25*width,0) rotated by 0deg (right half); left half rotated 180deg
          //        -100    v       -10               (0.25*width,0) rotated by -10deg (right half); left half rotated -10+180deg
          //        -134    v       -44               (0.25*width,0) rotated by -44deg (right half); left half rotated -44+180deg

          let additionalRotation = collisionAngle + MAUtils.deg2rad(90)

          let offsetUnitVector = new MAVector(1, 0)
          offsetUnitVector.rotateByRad(MAUtils.deg2rad(180)+additionalRotation+bodyAngle)
          addSliceHalfWithImg(leftHalfImg, body, additionalRotation, offsetUnitVector)

          offsetUnitVector = new MAVector(1, 0)
          offsetUnitVector.rotateByRad(additionalRotation+bodyAngle)
          addSliceHalfWithImg(rightHalfImg, body, additionalRotation, offsetUnitVector)

        } else if (collisionAngle >= MAUtils.deg2rad(45) &&
                   collisionAngle < MAUtils.deg2rad(135)) {
          // Vertical slice

          if (maImage.width < 2) {
            console.log("Object is too small to cut")
            continue
          }

          let leftHalfImg = maImage.newImageByCropping(0, 0, Math.floor(maImage.width/2), maImage.height)

          let rightHalfImg = maImage.newImageByCropping(leftHalfImg.width, 0, maImage.width - leftHalfImg.width, maImage.height)

          // collisionAngle|slice | halves angle   | translate half by
          //        70      v       -20               (0.25*width,0) rotated by -20deg (right half); left half rotated by -20+180deg
          //        90      v       0                 (0.25*width,0) rotated by 0 deg (right half); left half rotated by 0+180deg
          //        100     v       10                (0.25*width,0) rotated by 10 deg (right half); left half rotated by 10+180deg
          //        134     v       44                (0.25*width,0) rotated by 44 deg (right half); left half rotated by 44+180deg

          let additionalRotation = collisionAngle - MAUtils.deg2rad(90)

          let offsetUnitVector = new MAVector(1, 0)
          offsetUnitVector.rotateByRad(MAUtils.deg2rad(180)+additionalRotation+bodyAngle)
          addSliceHalfWithImg(leftHalfImg, body, additionalRotation, offsetUnitVector)

          offsetUnitVector = new MAVector(1, 0)
          offsetUnitVector.rotateByRad(additionalRotation+bodyAngle)
          addSliceHalfWithImg(rightHalfImg, body, additionalRotation, offsetUnitVector)

        } else {
          // Horizontal slice
          if (maImage.height < 2) {
            console.log("Object is too small to cut")
            continue
          }

          let topHalfImg = maImage.newImageByCropping(0, 0, maImage.width, Math.floor(maImage.height/2))

          let bottomHalfImg = maImage.newImageByCropping(0, topHalfImg.height, maImage.width, maImage.height - topHalfImg.height)

          // collisionAngle|slice | halves angle   | translate half by
          //        -140    h       40                (0.25*height,0) rotated by 40+90deg (top half); bottom half rotated by 40-90deg
          //        181     h       1                 (0.25*height,0) rotated by 1+90deg (top half); bottom half rotated by 1-90deg
          //        180     h       0                 (0.25*height,0) rotated by 0+90deg (top half); bottom half rotated by 0-90deg
          //        175     h       -5                (0.25*height,0) rotated by -5+90deg (top half); bottom half rotated by -5-90deg
          //        136     h       -44               (0.25*height,0) rotated by -44+90deg (top half); bottom half rotated by -44-90deg

          let additionalRotation = collisionAngle - MAUtils.deg2rad(180)

          let offsetUnitVector = new MAVector(1, 0)
          offsetUnitVector.rotateByRad(-MAUtils.deg2rad(90)+additionalRotation+bodyAngle)
          addSliceHalfWithImg(topHalfImg, body, additionalRotation, offsetUnitVector)

          offsetUnitVector = new MAVector(1, 0)
          offsetUnitVector.rotateByRad(MAUtils.deg2rad(90)+additionalRotation+bodyAngle)
          addSliceHalfWithImg(bottomHalfImg, body, additionalRotation, offsetUnitVector)
        }


        let indexToRemove = launchedObjects.indexOf(body)
        if (indexToRemove !== -1) {
          launchedObjects.splice(indexToRemove, 1)
          sliceCount++
          madeSlice = true
          console.log("sliceCount: " + sliceCount)
        }

        Matter.World.remove(engine.world, [ body ])
      }
    }

    if (madeSlice) {
      handleSliceCountChange()
    }
  }

  function loadSoundEffectsEnabledFromStorage() {
    soundEffectsEnabled = false
    let soundEffectsEnabledStr = window.localStorage.getItem('soundEffectsEnabled')
    if (soundEffectsEnabledStr) {
      soundEffectsEnabled = parseInt(soundEffectsEnabledStr) === 1
    }
  }

  function saveSoundEffectsEnabledToStorage() {
    window.localStorage.setItem('soundEffectsEnabled', (soundEffectsEnabled ? "1" : "0"))
  }

  function loadSliceCountUnlockStateFromStorage() {
    lastEvaluatedUnlockSliceCount = 0
    sliceCount = 0
    pizzaGridSliceUnlocked = 0
    lastEvaluatedPizzaGridSliceUnlocked = 0

    let sliceCountStr = window.localStorage.getItem('sliceCount')
    if (sliceCountStr) {
      sliceCount = parseInt(sliceCountStr)
      lastEvaluatedUnlockSliceCount = sliceCount
    }

    let pizzaGridSliceUnlockedStr = window.localStorage.getItem('pizzaGridSliceUnlocked')
    if (pizzaGridSliceUnlockedStr) {
      pizzaGridSliceUnlocked = parseInt(pizzaGridSliceUnlockedStr)
      lastEvaluatedPizzaGridSliceUnlocked = pizzaGridSliceUnlocked
    }
  }

  function saveSliceCountUnlockStateToStorage() {
    window.localStorage.setItem('sliceCount', sliceCount)
    window.localStorage.setItem('pizzaGridSliceUnlocked', pizzaGridSliceUnlocked)
  }

  function isPizzaIndexUnlocked(pizzaIndex, evalSliceCount, isPGSliceUnlocked) {
    let unlockMinutes = [
      0,
      1,
      1,
      2,
      2,
      2,  // 8 mins of total play time
      3,
      3,
      3,
      3,  // 20 mins of total play time
      4,
      6,  // 30 mins of total play time
      8,  // 38 mins of total play time
      12, // 50 mins of total play time
    ]

    // Index 14 is unlocked by isPGSliceUnlocked
    if (pizzaIndex >= unlockMinutes.length) {
      return isPGSliceUnlocked
    }

    let numMinutes = 0
    for (let i = 0; i <= pizzaIndex; ++i) {
      numMinutes += unlockMinutes[i]
    }

    return evalSliceCount >= (numMinutes * SLICE_COUNT_PER_MIN)
  }

  function handleSliceCountChange() {
    saveSliceCountUnlockStateToStorage()

    updateSliceCountView()

    if (!pizzaGrid) {
      recreatePizzaGrid()
    }

    // Unlock pizzas
    if (lastEvaluatedUnlockSliceCount < sliceCount) {
      let nowUnlocked = pizzaImagesDrawOrder().filter(function(item) {
        let wasUnlocked = isPizzaIndexUnlocked(item.index, lastEvaluatedUnlockSliceCount, lastEvaluatedPizzaGridSliceUnlocked)
        let isUnlocked = isPizzaIndexUnlocked(item.index, sliceCount, pizzaGridSliceUnlocked)

        return !wasUnlocked && isUnlocked
      })

      if (nowUnlocked.length > 0) {
        if (soundEffectsEnabled) {
          soundEffects.playSound("tada")
        }

        let notificationEl = document.getElementById("notificationSpan")

        let pizzaUnlockStr = nowUnlocked.map(x => `${x.name} unlocked`).join("\n\n")

        notificationEl.textContent = pizzaUnlockStr

        notificationEl.style.transition = ''
        notificationEl.style.opacity = '1'

        setTimeout(() => {
          notificationEl.style.transition = 'opacity 1s ease-out'
          notificationEl.style.opacity = '0'
        }, 1000)

        nextPCEImageToLaunch = new PCEImage(nowUnlocked[0].imageStr)

        recreatePizzaGrid()
      }

      lastEvaluatedUnlockSliceCount = sliceCount
      lastEvaluatedPizzaGridSliceUnlocked = pizzaGridSliceUnlocked
    }
  }

  function updateSliceCountView() {
    let sliceCountImg = PCEImageLibrary.imageForString("" + sliceCount)

    let imgDataURL = sliceCountImg.generatePNG(3)

    let imgDiv = document.getElementById("sliceImageDiv")
    if (!imgDiv) {
      imgDiv = document.createElement("img")
      imgDiv.id = "sliceImageDiv"

      let sliceCountDiv = document.getElementById("sliceCountDiv")
      sliceCountDiv.appendChild(imgDiv)
    }

    imgDiv.src = imgDataURL
  }

  function addSliceHalfWithImg(halfImg, body, additionalRotation, offsetUnitVector) {
    let radius = body.tt_radius * 0.9
    let imgDataURL = halfImg.dataURL()

    let offsetVector = offsetUnitVector.copy()
    offsetVector.multiply(radius)

    let halfA = Matter.Bodies.circle(body.position.x+offsetVector.x, body.position.y+offsetVector.y, radius, {
      restitution: RESTITUTION,
      friction: 0.001,
      mass: body.mass/4, // Not physically accurate, but feels better for shards to impede full pizzas less
      render: {
        sprite: {
          texture: imgDataURL,
          xScale: halfImg.scale * SCREEN_SCALE_FACTOR(),
          yScale: halfImg.scale * SCREEN_SCALE_FACTOR(),
        }
      }
    })

    Matter.Body.setVelocity(halfA, body.velocity)
    Matter.Body.setAngularVelocity(halfA, body.angularVelocity)
    Matter.Body.setAngle(halfA, body.angle + additionalRotation)

    halfA.tt_image = halfImg
    halfA.tt_radius = radius
    halfA.tt_sliceGeneration = sliceGeneration

    let forceVector = offsetUnitVector.copy()
    forceVector.multiply(0.01 * body.mass/BODY_MASS)
    Matter.Body.applyForce(halfA, halfA.position, forceVector)

    Matter.World.add(engine.world, [ halfA ])

    launchedObjects.push(halfA)
  }

  function clearTouchPoints() {
    sliceGeneration += RESLICE_COOL_OFF
    Matter.World.remove(engine.world, constraintsAdded)
    Matter.World.remove(engine.world, touchPointsAdded)
    touchPointsAdded = []
    constraintsAdded = []
    touchPointsToAdd = []
  }

  function pruneTouchPoints() {
    let toRemove = []
    while (touchPointsAdded.length > MAX_TOUCH_POINTS) {
      toRemove.push(touchPointsAdded.shift())
      toRemove.push(constraintsAdded.shift())
    }

    if (toRemove.length) {
      Matter.World.remove(engine.world, toRemove)
    }
  }

  function updateEngineWithTouchPoints() {
    // Nothing new to add
    if (touchPointsToAdd.length <= 0) {
      return
    }

    // Not enough points
    if (touchPointsAdded.length + touchPointsToAdd.length < 2) {
      return
    }

    let firstPoint = null
    let i = 0
    if (touchPointsAdded.length) {
      firstPoint = touchPointsAdded[touchPointsAdded.length-1]
      i = 0
    } else {
      firstPoint = touchPointsToAdd[0]
      i = 1
    }

    let bodyA = firstPoint
    let constraintsToAdd = []
    for (; i < touchPointsToAdd.length; i++) {
      let bodyB = touchPointsToAdd[i]

      let constraint = Matter.Constraint.create({
        bodyA: bodyA,
        bodyB: bodyB,
      })

      constraint.render.lineWidth = 4
      constraint.render.strokeStyle = "white"
      constraint.render.anchors = false
      constraintsToAdd.push(constraint)

      bodyA = bodyB
    }

    Matter.World.add(engine.world, touchPointsToAdd)
    Matter.World.add(engine.world, constraintsToAdd)
    Array.prototype.push.apply(touchPointsAdded, touchPointsToAdd)
    touchPointsToAdd = []

    Array.prototype.push.apply(constraintsAdded, constraintsToAdd)

    sliceGeneration++

    pruneTouchPoints()
  }
}
