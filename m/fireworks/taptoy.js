
let soundEnabled = true

// Translate keyboard into x coordinates
let KEYS = [
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

let WIDTH, HEIGHT, KEYS_X

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

  let canvas = document.getElementById('canvas')
  if (canvas) {
    canvas.width = WIDTH
    canvas.height = HEIGHT

    let scale = window.devicePixelRatio
    //console.log("Scale: " + scale)

    canvas.style.width = WIDTH + "px"
    canvas.style.height = HEIGHT + "px"

    canvas.width = WIDTH * scale
    canvas.height = HEIGHT * scale

    let ctx = canvas.getContext("2d")
    ctx.scale(scale, scale)
  }
}

function launchObject(x, y) {
  hideHelp()

  let cw = WIDTH
  let ch = HEIGHT

  let fireworkSizeTier = MAUtils.randomInt(3)

  // When there are many fireworks pending, limit the size of new ones
  // to avoid dropping frames.
  // It would be more future proof to detect the threshold where a device
  // starts dropping frames.
  if (fireworks.length > 3) {
    fireworkSizeTier = 0
  }

  fireworks.push(new Firework(cw / 2, ch, x, y, fireworkSizeTier))
}

let helpHidden = false
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

let touchMouseLaunchInterval = 0
let mouseEvent = null
let activeTouches = null

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

function startTouchMouseLoopIfNecessary() {
  if (!touchMouseLaunchInterval) {
    if (soundEnabled) {
      soundEffects.requestSong()
    }

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

function startListeningToUserInput() {
  document.body.addEventListener('touchstart', function (e) {
    if (e.target.tagName !== "A") {
      e.preventDefault()
    }

    activeTouches = e.touches

    launchTouchMouseObject()
    startTouchMouseLoopIfNecessary()
  })

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

  document.body.addEventListener('keydown', function (e) {
    var key = vkey[e.keyCode]
    if (key == null) return

    // Remove '<' and '>' from numpad keys. Example: '<num-1>'  ->  'num-1'
    key = key.replace('<', '').replace('>', '')

    if (key in KEYS_X) {
      launchObject(KEYS_X[key], MAUtils.randomFloat(20, HEIGHT/2))
    }
  })
}

function startFireworksLoop() {
  // setInterval gives more consistent callbacks than requestAnimationFrame in Safari on iPad Pro
  // See this sample project for more details: https://jsfiddle.net/zt5yo6mj/
  let desiredFPS = 60
  setInterval(fireworksLoop, 1000/desiredFPS)
}

let fireworks = []
let particles = []

let autoLaunchDelayMS = 900
let autoLaunchRandomFudgeMS = 0
let lastAutoLaunch = -10000

let nextClusterTime = 0

function fireworksLoop() {
  if (autoMode && fireworks.length < 3) {
    let now = performance.now()
    let timeSinceLastAutoLaunch = now - lastAutoLaunch

    if (nextClusterTime == 0) {
      nextClusterTime = now + MAUtils.randomFloat(3000, 7000)
    }

    if (timeSinceLastAutoLaunch > (autoLaunchDelayMS+autoLaunchRandomFudgeMS)) {

      let numberToLaunch = 1
      if (nextClusterTime < now) {
        numberToLaunch = 7 + MAUtils.randomInt(10)
        let performAnotherCluster = MAUtils.randomInt(2)
        if (performAnotherCluster == 1) {
          nextClusterTime = now + 100
        } else {
          nextClusterTime = now + MAUtils.randomFloat(5000, 10000)
        }
      }

      lastAutoLaunch = now
      autoLaunchRandomFudgeMS = MAUtils.randomFloat(-500, 500) // space launches out so they don't feel robotically uniform

      while (numberToLaunch--) {
        setTimeout(() => {
          launchObject(MAUtils.randomFloat(10, WIDTH-10), MAUtils.randomFloat(20, HEIGHT/2))
        }, MAUtils.randomFloat(0, 200))
      }
    }
  }


  let canvas = document.getElementById('canvas')
  let ctx = canvas.getContext('2d')
  let cw = canvas.width
  let ch = canvas.height

  // normally, clearRect() would be used to clear the canvas
  // we want to create a trailing effect though
  // setting the composite operation to destination-out will allow us to clear the canvas at a specific opacity, rather than wiping it entirely
  ctx.globalCompositeOperation = 'destination-out'
  // decrease the alpha property to create more prominent trails
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, cw, ch)
  // change the composite operation back to our main mode
  // lighter creates bright highlight points as the fireworks and particles overlap each other
  ctx.globalCompositeOperation = 'lighter'

  let i = fireworks.length
  while (i--) {
    fireworks[i].draw()
    fireworks[i].update(i)
  }

  i = particles.length
  while (i--) {
    particles[i].draw()
    particles[i].update(i)
  }
}

function startTaptoy() {
  onResize()
  window.addEventListener('resize', onResize)

  startListeningToUserInput()

  startFireworksLoop()
}

