
function taptoy(require) {
  var Matter = require('matter-js/src/module/main')
  var vkey = require('vkey')

  // To preload images, uncomment this line:
  // var preload = require('preload-img')
  // And then invoke:
  // preload(imageURL)


  var RESTITUTION = 0.9
  var OFFSET = 1

  var KEYS = [
    // Normal keys
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', null],
    [null, 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    [null, 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', null],
    [null, null, 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', null, null],

    // Numpad keys
    [null, null, null, null, null, null, null, null, null, null, null, 'num-/', 'num-*', 'num--'],
    [null, null, null, null, null, null, null, null, null, null, 'num-7', 'num-8', 'num-9', 'num-+'],
    [null, null, null, null, null, null, null, null, null, null, 'num-4', 'num-5', 'num-6', null],
    [null, null, null, null, null, null, null, null, null, null, 'num-1', 'num-2', 'num-3', null],
    [null, null, null, null, null, null, null, null, null, null, null, 'num-0', null, 'num-.', null]
  ]

  var WIDTH, HEIGHT, KEYS_X
  var boundaries, engine, platform
  var lastKeys = ''

  function onResize () {
    WIDTH = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    HEIGHT = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

    KEYS_X = {}
    KEYS.forEach(function (row) {
      row.forEach(function (letter, i) {
        if (!letter) return // ignore meta keys
        KEYS_X[letter] = ((i / row.length) + (0.5 / row.length)) * WIDTH
      })
    })

    var $canvas = document.querySelector('canvas')
    if ($canvas) {
      $canvas.width = WIDTH
      $canvas.height = HEIGHT
    }

    if (!engine) {
      engine = createEngine()
    }

    // Remove old boundaries
    if (boundaries) {
      Matter.World.remove(engine.world, boundaries)
    }

    // Add static walls surrounding the world
    boundaries = generateBoundaries()
    platform = boundaries[2]
    Matter.World.add(engine.world, boundaries)
  }

  onResize()
  window.addEventListener('resize', onResize)

  function createEngine () {
    var engine = Matter.Engine.create(document.querySelector('.content'), {
      render: {
        options: {
          width: WIDTH,
          height: HEIGHT,
          background: '#00000000',
        }
      }
    })

    // Show textures
    engine.render.options.wireframes = false

    engine.enableSleeping = true

    // if (debug.enabled) {
    //   engine.render.options.showCollisions = true
    //   engine.render.options.showVelocity = true
    //   engine.render.options.showAngleIndicator = true
    // }
    return engine
  }

  function generateBoundaries () {
    return [
      // bottom (left)
      Matter.Bodies.rectangle(WIDTH / 4, HEIGHT + 30, WIDTH / 2, OFFSET, {
        angle: -0.1,
        isStatic: true,
        friction: 0.001,
        render: {
          visible: false
        }
      }),
      // bottom (right)
      Matter.Bodies.rectangle((WIDTH / 4) * 3, HEIGHT + 30, WIDTH / 2, OFFSET, {
        angle: 0.1,
        isStatic: true,
        friction: 0.001,
        render: {
          visible: false
        }
      }),
      // platform to catch objects that fall offscreen
      Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + 400, WIDTH * 4, OFFSET, {
        isStatic: true,
        friction: 1, // objects should stop sliding with sleeping=true
        render: {
          visible: false
        }
      })
    ]
  }

  // run the engine
  Matter.Engine.run(engine)

  document.body.addEventListener('keydown', function (e) {
    var key = vkey[e.keyCode]
    if (key == null) return

    // Remove '<' and '>' from numpad keys. Example: '<num-1>'  ->  'num-1'
    key = key.replace('<', '').replace('>', '')

    if (key in KEYS_X) {
      launchObject(KEYS_X[key], HEIGHT - 30)
    }
  })

  var imageCache = null
  function randomImageWithRadius() {
    if (!imageCache) {
      imageCache = []

      let dataURL = new PCEImage(PCEImageLibrary.koffing.imageStr).generatePNG(10)
      let radius = 50
      imageCache.push({"dataURL":dataURL, "radius":radius})

      dataURL = new PCEImage(PCEImageLibrary.pikachu.imageStr).generatePNG(5)
      radius = 40
      imageCache.push({"dataURL":dataURL, "radius":radius})
    }

    return MAUtils.randomElement(imageCache)
  }

  function launchObject(x, y) {
    soundEffects.playSound("drip")

    hideHelp()

    var body

    let randImage = randomImageWithRadius()
    body = Matter.Bodies.circle(x, y, randImage.radius, {
      restitution: RESTITUTION,
      friction: 0.001,
      mass: 3.5,
      render: {
        sprite: {
          texture: randImage.dataURL
        }
      }
    })

    var vector = {
      x: (Math.floor((Date.now() / 200) % 10) / 200) - 0.025,
      y: -1 * (HEIGHT / 3200)
    }

    // Example: how to have the shape rain down from the top of the screen
    // vector = {x: 0, y: 0}
    // Matter.Body.setPosition(body, {x: body.position.x, y: -30})

    Matter.Body.applyForce(body, body.position, vector)

    // Example: how to give the shape some spin
    // Matter.Body.setAngularVelocity(body, (Math.random() / 2) * (Math.random() < 0.5 ? -1 : 1))

    Matter.World.add(engine.world, [ body ])
  }

  Matter.Events.on(engine, 'collisionStart', onCollision)

  function onCollision (e) {
    e.pairs.forEach(function (pair) {
      var bodyA = pair.bodyA
      var bodyB = pair.bodyB
      var AisPlatform = bodyA === platform
      var BisPlatform = bodyB === platform
      if (AisPlatform) Matter.World.remove(engine.world, [ bodyB ])
      if (BisPlatform) Matter.World.remove(engine.world, [ bodyA ])
    })
  }

  var helpHidden = false

  function hideHelp () {
    if (helpHidden) return

    helpHidden = true

    // Disable pull to refresh, pinch to zoom, etc
    document.body.style.touchAction = 'none'

    let help = document.querySelector('.help')
    help.style.display = 'none'

    let home = document.querySelector('.home')
    home.style.opacity = 0

    let about = document.querySelector('.about')
    about.style.opacity = 0

    // Delay hiding these links
    // If we immediately hide them then tapping the URLs isn't possible
    setTimeout(() => {
      about.style.display = 'none'
      home.style.display = 'none'
    }, 1000)

  }

  var touchMouseLaunchInterval = 0
  function startTouchMouseLoopIfNecessary() {
    if (!touchMouseLaunchInterval) {
      bgAnimator.requestColorChange()
      soundEffects.requestSong()

      touchMouseLaunchInterval = setInterval(function () {
        if ((activeTouches && activeTouches.length > 0) || mouseEvent) {
          launchTouchMouseObject()
        } else {
          clearInterval(touchMouseLaunchInterval)
          touchMouseLaunchInterval = 0
        }
      }, 300)
    }
  }

  var activeTouches = null
  document.body.addEventListener('touchstart', function (e) {
    if (e.target.tagName !== "A") {
      e.preventDefault()
    }

    activeTouches = e.touches

    launchTouchMouseObject()
    startTouchMouseLoopIfNecessary()
  })

  function launchTouchMouseObject() {
    let atL = activeTouches ? activeTouches.length : 0
    for (let i = 0; i < atL; ++i) {
      let x = activeTouches[i].screenX
      let y = activeTouches[i].screenY
      launchObject(x, y)
    }

    if (mouseEvent) {
      let x = mouseEvent.screenX
      let y = mouseEvent.screenY
      launchObject(x, y)
    }
  }

  document.body.addEventListener('touchend', function (e) {
    if (e.target.tagName !== "A") {
      e.preventDefault()
    }

    activeTouches = e.touches
  })

  document.body.addEventListener('touchcancel', function (e) {
    if (e.target.tagName !== "A") {
      e.preventDefault()
    }

    activeTouches = e.touches
  })

  // Disable iOS rubber banding on scroll
  document.body.addEventListener('touchmove', function (e) {
    e.preventDefault()

    activeTouches = e.touches
  })

  var mouseEvent = null
  document.body.addEventListener('mousedown', function (e) {
    mouseEvent = e
    launchTouchMouseObject()
    startTouchMouseLoopIfNecessary()
  })

  document.body.addEventListener('mousemove', function (e) {
    if (mouseEvent) {
      mouseEvent = e
    }
  })

  document.body.addEventListener('mouseup', function (e) {
    mouseEvent = null
  })
}
