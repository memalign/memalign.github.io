'use strict';

setShowWatermark(false)

// Sound effects
//const sound_pop =    new Sound([ 1,.7,50,.005,,.01,4,,,,,,,,10,,,.5]);
const sound_pop_loud = new Sound([10,.7,50,.005,,.01,4,,,,,,,,10,,,.5]);
//const sound_levelup =    new Sound([ 1,0]);
const sound_levelup_loud = new Sound([10,0]);

let score = 0
let leftWall, rightWall, topWall, bottomWall;
let wallUpdateCanvasSize;
let spritesInGameOrder;

class MASprite {
  constructor(basePCEImageName, frameCount, scale) {
    this.basePCEImageName = basePCEImageName
    this.facesLeft = basePCEImageName.endsWith("left")
    this.frameCount = frameCount
    this.scale = scale

    this.firstPCEImage = PCEImageLibrary.pceImageForName(this.basePCEImageName + "0")

    this.baseTileIndex = 0
    this.tileCache = null
  }

  get width() {
    return this.firstPCEImage.width * this.scale
  }

  get height() {
    return this.firstPCEImage.height * this.scale
  }

  get size() {
    return vec2(this.width, this.height)
  }

  animationFrameDataURLs() {
    let result = []

    for (let i = 0; i < this.frameCount; ++i) {
      const pceImage = PCEImageLibrary.pceImageForName(this.basePCEImageName + i)

      if (pceImage.width !== this.firstPCEImage.width || pceImage.height !== this.firstPCEImage.height) {
        console.log(`Warning: sprite frame ${i} has inconsistent size. Expected ${this.firstPCEImage.width}x${this.firstPCEImage.height}, got ${pceImage.width}x${pceImage.height}`)
      }

      result.push(pceImage.generatePNG(this.scale))
    }
    return result
  }

  animationFrame(index) {
    if (!this.tileCache) {
      this.tileCache = []
      for (let i = 0; i < this.frameCount; ++i) {
        this.tileCache[i] = tile(vec2(0, 0), this.size, this.baseTileIndex + i, 0)
      }
    }

    index = index % this.frameCount
    return this.tileCache[index]
  }
}


let speechEnabled = true
let soundEffectsEnabled = true
let lifetimeScore = 0

loadSettingsFromLocalStorage()

let soundEffects = new MASounds()
soundEffects.loadSounds()

function loadSettingsFromLocalStorage() {
  const readSpeechEnabled = localStorage.getItem("speechEnabled")
  if (readSpeechEnabled === "false") {
    speechEnabled = false
  }

  const readSoundEffectsEnabled = localStorage.getItem("soundEffectsEnabled")
  if (readSoundEffectsEnabled === "false") {
    soundEffectsEnabled = false
  }

  const readLifetimeScore = localStorage.getItem('lifetimeScore');
  if (readLifetimeScore !== null) {
    lifetimeScore = parseInt(readLifetimeScore, 10)
  }

  updateLabels()
}

function saveSettingsToLocalStorage() {
  localStorage.setItem("speechEnabled", speechEnabled)
  localStorage.setItem("soundEffectsEnabled", soundEffectsEnabled)
}

function toggleSpeech() {
  speechEnabled = !speechEnabled
  console.log(`Speech is now ${speechEnabled ? "enabled" : "disabled"}`)
  saveSettingsToLocalStorage()
  updateLabels()
}

function toggleSoundEffects() {
  soundEffectsEnabled = !soundEffectsEnabled
  console.log(`Sound effects are now ${soundEffectsEnabled ? "enabled" : "disabled"}`)
  saveSettingsToLocalStorage()
  updateLabels()

  if (!soundEffectsEnabled) {
    soundEffects.fadeOut()
  } else {
    soundEffects.requestSong()
  }
}

function updateLabels() {
  const speechLabel = document.getElementById('speechLabel')
  const speechButton = document.getElementById('speechButton')
  const soundEffectsLabel = document.getElementById('soundEffectsLabel')
  const soundEffectsButton = document.getElementById('soundEffectsButton')

  speechLabel.textContent = `Count will${speechEnabled ? "" : " not"} be announced.`
  speechButton.textContent = speechEnabled ? "Mute" : "Unmute"

  soundEffectsLabel.textContent = `Sound effects will${soundEffectsEnabled ? "" : " not"} play.`
  soundEffectsButton.textContent = soundEffectsEnabled ? "Mute" : "Unmute"


  const lifetimeScoreLabel = document.getElementById('lifetimeScoreLabel')
  lifetimeScoreLabel.textContent = `Lifetime score: ${lifetimeScore}.`

  const lifetimeScoreContainer = document.getElementById('lifetimeScoreContainer')
  // Start hidden if we have no lifetimeScore
  if (lifetimeScore > 0) {
    lifetimeScoreContainer.classList.remove("hidden")
  }
}

function resetLifetimeScore() {
  if (lifetimeScore === 0) {
    return
  }

  let confirmation = window.confirm("Reset lifetime score to zero?")
  if (confirmation) {
    lifetimeScore = 0
    saveLifetimeScore()
    updateLabels()
  }
}

function saveLifetimeScore() {
  localStorage.setItem('lifetimeScore', lifetimeScore)
}


const fishPerLevel = 31

function updateScore(newScore) {
  const delta = newScore - score
  score = newScore

  lifetimeScore += delta
  saveLifetimeScore()

  const scoreToDisplay = score % fishPerLevel
  let scoreStr = "" + scoreToDisplay

  const level = Math.floor(score / fishPerLevel)
  let newLevel = false

  if (scoreToDisplay === 0) {
    if (level === 0) {
      scoreStr = "Tap to count"

    } else {
      scoreStr = `Level ${level+1}`
      newLevel = true

      spawnFish()
    }
  }

  const scoreOverlay = document.getElementById("scoreOverlay")
  if (scoreOverlay) {
    scoreOverlay.innerText = scoreStr
    const isOnlyDigits = /^[0-9]+$/.test(scoreStr)

    const toRemove = !isOnlyDigits ? "scoreOverlayNumbers" : "scoreOverlayText"
    const toAdd = !isOnlyDigits ? "scoreOverlayText" : "scoreOverlayNumbers"

    scoreOverlay.classList.remove(toRemove)
    scoreOverlay.classList.add(toAdd)


    const soundControlOverlay = document.getElementById("soundControlOverlay")
    if (isOnlyDigits) {
      soundControlOverlay.classList.add('hidden')
    } else {
      updateLabels()
      soundControlOverlay.classList.remove('hidden')
    }
  }

  if (score === 1) {
    document.getElementById("home").classList.add('hidden')
    document.getElementById("about").classList.add('hidden')
  }

  if (level > 0 || score > 0) {
    if (soundEffectsEnabled) {
      let soundToPlay = sound_pop_loud
      if (newLevel) {
        soundToPlay = sound_levelup_loud
      }

      soundToPlay.play()
      soundEffects.requestSong()
    }

    if (speechEnabled) {
      maSpeak(scoreStr)
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  updateScore(0)

  spritesInGameOrder = MAUtils.shuffleArrayInPlace([...sprites])

  spawnFish()

  wallUpdateCanvasSize = mainCanvasSize.copy()
  updateWalls()
}

function spawnFish() {
  const level = Math.floor(score/fishPerLevel)

  const numTypesOfFishPerLevel = function(lev) { return Math.min(lev+3, spritesInGameOrder.length) }
  let spriteIndex = 0
  for (let i = 0; i < level; ++i) {
    spriteIndex += numTypesOfFishPerLevel(i)
  }

  const numTypesOfFish = numTypesOfFishPerLevel(level)
  const amtPerSprite = Math.ceil(fishPerLevel / numTypesOfFish) // rounding up here. We need to enforce the total limit separately.

  const pos = vec2();
  let spawnedFish = 0
  for (let i = 0; i < numTypesOfFish; ++i) {
    const sprite = spritesInGameOrder[(spriteIndex + i) % spritesInGameOrder.length]

    for (let j = 0; j < amtPerSprite && spawnedFish < fishPerLevel; ++j) {
      new Fish(sprite)
      spawnedFish++
    }
  }
}

function updateWalls() {
  cameraPos = mainCanvasSize.scale(0.5)
  cameraScale = 1

  const worldSize = wallUpdateCanvasSize

  const midX = worldSize.x / 2
  const midY = worldSize.y / 2


  const leftO = vec2(0, midY)
  const leftS = vec2(10, worldSize.y)
  if (!leftWall) {
    leftWall = new Wall(leftO, leftS)
  } else {
    leftWall.pos = leftO
    leftWall.size = leftS
  }

  const rightO = vec2(worldSize.x, midY)
  const rightS = vec2(10, worldSize.y)
  if (!rightWall) {
    rightWall = new Wall(rightO, rightS)
  } else {
    rightWall.pos = rightO
    rightWall.size = rightS
  }

  console.log("world size: " + worldSize)

  const topO = vec2(midX, worldSize.y)
  const topS = vec2(worldSize.x, 10)
  if (!topWall) {
    topWall = new Wall(topO, topS)
  } else {
    topWall.pos = topO
    topWall.size = topS
  }

  const bottomO = vec2(midX, 0)
  const bottomS = vec2(worldSize.x, 10)
  if (!bottomWall) {
    bottomWall = new Wall(bottomO, bottomS)
  } else {
    bottomWall.pos = bottomO
    bottomWall.size = bottomS
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  const dist = wallUpdateCanvasSize.distanceSquared(mainCanvasSize)
  if (dist > 0) {
    console.log(`Canvas size updated from ${wallUpdateCanvasSize.x} ${wallUpdateCanvasSize.y} to ${mainCanvasSize.x} ${mainCanvasSize.y}`)

    wallUpdateCanvasSize = mainCanvasSize.copy()

    updateWalls()
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {

}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // Rather than drawing background here, leave the canvas transparent to get the background from body
}

function gameRenderPost() {
}


///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
//
//
//

const sprites = [
  new MASprite("angler", 4, 3),
  new MASprite("axolotl", 2, 3),
  new MASprite("bigbluegreen", 3, 3),
  new MASprite("blackyellowfishleft", 3, 3),
  new MASprite("bluefish", 3, 3),
  new MASprite("blueyellow", 3, 3),
  new MASprite("clownfish", 3, 3),
  new MASprite("dolphinbaby", 4, 5),
  new MASprite("fishbronzestripedgruntleft", 3, 3),
  new MASprite("fishbutterleft", 3, 3),
  new MASprite("jellyfish", 3, 3),
  new MASprite("littlered", 3, 3),
  new MASprite("littlewhite", 3, 3),
  new MASprite("octopusdumbo", 4, 3),
  new MASprite("orange", 3, 3),
  new MASprite("penguingalapagos", 4, 3),
  new MASprite("porpoisevaquita", 3, 3),
  new MASprite("puffer", 3, 3),
  new MASprite("seahorsekuda", 2, 3),
  new MASprite("sealmonk", 5, 3),
  new MASprite("seaturtleleft", 4, 3),
  new MASprite("sharkgoblin", 4, 3),
  new MASprite("sharkthresher", 4, 3),
  new MASprite("squidvampire", 3, 3),
  new MASprite("swordfishleft", 3, 3),
  new MASprite("tuna", 2, 3),
  new MASprite("whale", 4, 5),
  new MASprite("yellowfishleft", 3, 3),
]

let imgURLs = []

for (let sprite of sprites) {
  const baseTileIndex = imgURLs.length
  sprite.baseTileIndex = baseTileIndex

  imgURLs.push(...sprite.animationFrameDataURLs())
}

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, imgURLs);
