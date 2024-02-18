// Properties to test browser support more easily
const FORCE_SHARING_USING_CLIPBOARD = false

// Configure behaviors
const MAX_REPLAY_LEVEL = 4
const DEFAULT_REPLAY_COUNT_TO_SHOW = 10
const SHARE_URL_SIZE_LIMIT = 3999 // iOS Messages app seems to silently drop URLs above this size

const MY_REPLAYS_BEHAVIORS = ["replay", "share", "submit", "delete", "delete all"]
const HIGH_SCORES_BEHAVIORS = ["replay", "sortHighToLow"]

const COLUMN_HEIGHT = 300
const STARTING_WALL_HEIGHT = 20


// Debugging
const DEBUG_OVERRIDE_SCALE_TO_1 = false
const DEBUG_SLOW_MODE = false
const DEBUG_JITTERY_FRAME_INTERVAL = false
let DEBUG_STORE_COLUMNHISTORY = false
const USE_REQUESTANIMATIONFRAME = true


let MAGameColumnUniqueID = 1000
class MAGameColumn {
  // Properties:
  // - caveTop (number) - y-value where the cave opening begins
  // - caveBottom (number) - y-value where the bottom cave wall begins
  // - obstaclePosition (number) - y-value where an obstacle begins. -1 if there is no obstacle in this column
  // - uniqueID (number) - unique value for this column
  constructor(caveTop, caveBottom, obstaclePosition) {
    this.caveTop = caveTop
    this.caveBottom = caveBottom

    this.obstaclePosition = obstaclePosition

    this.uniqueID = MAGameColumnUniqueID
    MAGameColumnUniqueID++
  }

  caveHeight() {
    return this.caveBottom - this.caveTop
  }

  copy() {
    return new MAGameColumn(this.caveTop, this.caveBottom, this.obstaclePosition)
  }
}

class MAPlayerPosition {
  constructor(yPos, timestamp, isCloseToObstacle) {
    this.yPos = yPos
    this.timestamp = timestamp
    this.isCloseToObstacle = isCloseToObstacle
  }
}

class MAPlayerPositionHistory {
  constructor() {
    this.positionHistory = []
  }

  addPosition(yPos, timestamp, isCloseToObstacle) {
    this.positionHistory.push(new MAPlayerPosition(yPos, timestamp, isCloseToObstacle))
  }

  static playerPositionHistoryFromBase64(base64Str) {
    let r = new MAPlayerPositionHistory()
    let arrBuff = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0)).buffer
    let dv = new DataView(arrBuff)
    let sizeInBytes = arrBuff.byteLength

    let posCount = sizeInBytes / 6

    for (let i = 0; i < posCount; ++i) {
      let byteOffset = i * (4+2)
      let normalizedTimestamp = dv.getInt32(byteOffset, false)
      let normalizedPos = dv.getUint16(byteOffset+4, false)

      let yPos = normalizedPos/100.0

      r.addPosition(yPos, normalizedTimestamp)
    }

    return r
  }

  encodeToBase64() {
    let posCount = this.positionHistory.length

    if (posCount <= 0) {
      return null
    }

    /*
    The values are stored in this layout:
    [normalizedTimestamp0, position0*100, normalizedTimestamp1, position1*100, ...]

    normalizedTimestampN is defined as (timestampN - timestamp0)

    normalizedTimestamps are stored as Int32
      - This gives me some resilience to time change bugs

    positions are stored as Uint16

    All numbers are encoded using big-endian (network byte order)

    Assert: array must have even length
    Assert: byte count is equal to 4*numPositions + 2*numPositions = 6*numPositions. Byte count must be divisible by 6.
    */

    let sizeInBytes = 4*posCount + 2*posCount
    let arrBuff = new ArrayBuffer(sizeInBytes)
    let dv = new DataView(arrBuff)

    let t0 = this.positionHistory[0].timestamp
    for (let i = 0; i < posCount; ++i) {
      let pos = this.positionHistory[i]
      let normalizedTimestamp = pos.timestamp - t0
      let normalizedPosition = Math.round(pos.yPos * 100)

      let byteOffset = i * (4+2)
      dv.setInt32(byteOffset, normalizedTimestamp, false)
      dv.setUint16(byteOffset+4, normalizedPosition, false)
    }

    let base64Str = btoa(String.fromCharCode.apply(null, new Uint8Array(arrBuff)))
    return base64Str
  }

  prunePositionHistory() {
    let newPH = []

    // Don't evaluate the last position, that will be added in the next step
    for (let i = 0; i < this.positionHistory.length-1; ++i) {
      let shouldKeep = false

      if (i == 0) {
        shouldKeep = true
      }

      if (i > 0) {
        let prevPos = this.positionHistory[i-1]
        let pos = this.positionHistory[i]
        let nextPos = this.positionHistory[i+1]

        let prevDelta = pos.yPos - prevPos.yPos
        let nextDelta = nextPos.yPos - pos.yPos

        if (Math.sign(prevDelta) != Math.sign(nextDelta)) {
          shouldKeep = true
        }

        if (!prevPos.isCloseToObstacle && pos.isCloseToObstacle) {
          shouldKeep = true
        }
      }

      if (shouldKeep) {
        newPH.push(this.positionHistory[i])
      }
    }

    // Always include the final position so we can accurately draw
    // the place the game ended
    newPH.push(this.positionHistory[this.positionHistory.length-1])

    this.positionHistory = newPH
  }

  playerPositionHistoryByInterpolatingPositions() {
    let newPH = []

    let interpolationFn = function(p, pNext, easeFn) {
      newPH.push(p)

      let pDelta = (pNext.yPos - p.yPos)
      let tDelta = (pNext.timestamp - p.timestamp)

      let increment = 7 // milliseconds

      for (let m = 0; m < tDelta; m += increment) {
        let proportion = m / tDelta

        let newP = p.yPos + easeFn(proportion) * pDelta
        let newT = p.timestamp + m
        newPH.push(new MAPlayerPosition(newP, newT))
      }
    }


    // Don't evaluate the second-to-last, and last positions.
    // We need to special case interpolating for those positions
    // to get the right curve shape.
    for (let i = 0; i < this.positionHistory.length-2; ++i) {
      let p = this.positionHistory[i]
      let pNext = this.positionHistory[i+1]
      interpolationFn(p, pNext, MAUtils.easeInOutQuad)
    }


    // Second-to-last and last position interpolation special case:
    // When the user dies by accelerating too far, or falling down too far,
    // easeInOut doesn't look like what actually happened.
    // Instead, it looks more like easeIn.
    let last = this.positionHistory[this.positionHistory.length-1]
    let secondToLast = this.positionHistory[this.positionHistory.length-2]
    interpolationFn(secondToLast, last, MAUtils.easeInQuad)
    newPH.push(last)

    let result = new MAPlayerPositionHistory()
    result.positionHistory = newPH
    return result
  }
}


class MAColumnHistory {
  constructor() {
    this.columnHistory = []
  }

  static columnHistoryFromBase64(base64Str) {
    let r = new MAColumnHistory()
    let arrBuff = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0)).buffer
    let dv = new DataView(arrBuff)
    let sizeInBytes = arrBuff.byteLength

    // [caveTop0*100, caveTop1*100, caveTop2*100, caveTop3*100, caveTop4*100, caveTop5*100, caveTop6*100, caveTop7*100, caveTop8*100, caveTop9*100, obstacle1*100, ...]

    let columnIndex = 0
    let byteOffset = 0
    let caveHeight = COLUMN_HEIGHT - (2*STARTING_WALL_HEIGHT)

    while (byteOffset < sizeInBytes) {
      let normalizedCaveTop = dv.getUint16(byteOffset, false)

      let caveTop = normalizedCaveTop / 100.0
      byteOffset += 2

      let obstaclePosition = -1
      if (MAGameEngine.shouldAddObstacleToColumnWithIndex(columnIndex)) {
        let normalizedObstaclePosition = dv.getUint16(byteOffset, false)
        obstaclePosition = normalizedObstaclePosition / 100.0
        byteOffset += 2
      }


      if (MAGameEngine.shouldReduceCaveHeightForColumnWithIndex(columnIndex)) {
        caveHeight--
      }

      let caveBottom = caveTop + caveHeight

      let col = new MAGameColumn(caveTop, caveBottom, obstaclePosition)
      r.columnHistory.push(col)

      columnIndex++
    }

    return r
  }

  encodeToBase64() {
    let colCount = this.columnHistory.length

    if (colCount <= 0) {
      return null
    }

    /*
    The values are stored in this layout:

    [caveTop0*100, caveTop1*100, caveTop2*100, caveTop3*100, caveTop4*100, caveTop5*100, caveTop6*100, caveTop7*100, caveTop8*100, caveTop9*100, obstacle1*100, ...]

    (Cave height shrink applies to column indexes 0, 2, 4, etc; Cave height starts at 300-2*20=260 but will shrink for index 0; index0's caveHeight is 259)

    (Obstacle appears in column indexes 9, 19, etc)

    All entries are stored as Uint16.

    All numbers are encoded using big-endian (network byte order)
    */

    let obstacleCount = this.columnHistory.reduce((count, c) => c.obstaclePosition >= 0 ? count + 1 : count, 0)

    let entryCount = colCount + obstacleCount

    let sizeInBytes = 2*entryCount
    let arrBuff = new ArrayBuffer(sizeInBytes)
    let dv = new DataView(arrBuff)

    let entryIndex = 0
    for (let col of this.columnHistory) {
      let normalizedCaveTop = Math.round(col.caveTop * 100)

      let byteOffset = entryIndex * 2

      dv.setUint16(byteOffset, normalizedCaveTop, false)
      entryIndex++

      if (col.obstaclePosition >= 0) {
        let normalizedObstaclePosition = Math.round(col.obstaclePosition * 100)

        byteOffset = entryIndex * 2

        dv.setUint16(byteOffset, normalizedObstaclePosition, false)
        entryIndex++
      }
    }

    let base64Str = btoa(String.fromCharCode.apply(null, new Uint8Array(arrBuff)))
    return base64Str
  }

  addColumn(c) {
    this.columnHistory.push(c.copy())
  }
}

class MAReplay {
  // playerPositionHistory has already been pruned
  constructor(playerPositionHistory, columnHistory, name, score, timestamp, rngSeed, replay) {
    this.name = name ? name : "Anonymous"
    this.timestamp = timestamp
    this.rngSeed = rngSeed
    this.playerPositionHistory = playerPositionHistory
    this.densePlayerPositionHistory = this.playerPositionHistory.playerPositionHistoryByInterpolatingPositions()
    this.columnHistory = columnHistory
    this.score = score
    this.replay = replay
  }

  static replayFromEncodedString(str) {
    str = str.replace(/&i=/g, "%")
    str = str.replace(/&d=/g, "%3D")
    str = str.replace(/&/g, "%2")
    str = str.replace(/=/g, "")

    let decodedStr = decodeURIComponent(str)
    let replayStrs = decodedStr.split("=")

    let currReplayStr = replayStrs.shift()

    let components = currReplayStr.split(",")

    if (components.length < 2 || components.length > 3) {
      console.log("Invalid number of components in replay str: " + currReplayStr)
      return null
    }

    let obfuscatedMetadataStr = components[0]
    let positionHistoryStr = components[1]

    let columnHistoryStr = null
    if (components.length == 3) {
      columnHistoryStr = components[2]
    }


    let metadataStr = MAUtils.obfuscateString(obfuscatedMetadataStr)
    let metadataComponents = metadataStr.split(",")
    if (metadataComponents.length < 3 || metadataComponents.length > 4) {
      console.log("Invalid number of components in metadata str: " + metadataStr)
      return null
    }


    let name = metadataComponents[0]
    let score = parseInt(metadataComponents[1])
    if (score == 0) {
      console.log("Invalid score: " + metadataComponents[1])
      return null
    }

    let timestamp = parseInt(metadataComponents[2])
    if (timestamp == 0) {
      console.log("Invalid timestamp: " + metadataComponents[2])
      return null
    }

    let rngSeed = null
    if (metadataComponents.length >= 4) {
      rngSeed = parseInt(metadataComponents[3])
      if (rngSeed == 0) {
        console.log("Invalid rngSeed: " + metadataComponents[3])
        return null
      }
    }


    let playerPositionHistory = MAPlayerPositionHistory.playerPositionHistoryFromBase64(MAUtils.addBase64Padding(positionHistoryStr))

    if (!playerPositionHistory) {
      console.log("Invalid playerPositionHistory")
      return null
    }

    let columnHistory = null
    if (columnHistoryStr) {
      columnHistory = MAColumnHistory.columnHistoryFromBase64(MAUtils.addBase64Padding(columnHistoryStr))
      if (!columnHistory) {
        console.log("Invalid columnHistory")
        return null
      }
    }

    let replay = null
    if (replayStrs.length > 0) {
      let strForSubReplay = encodeURIComponent(replayStrs.join("="))
      replay = MAReplay.replayFromEncodedString(strForSubReplay)
    }


    let result = new MAReplay(playerPositionHistory, columnHistory, name, score, timestamp, rngSeed, replay)

    return result
  }

  // Safe to put in a URL (it's already had encodeURIComponent applied)
  encodeToString(sizeLimit /* optional */) {
    // Only enforce sizeLimit if one is provided

    let sanitizedName = this.name.replace(/,/g, "")
    let rngSeedStr = this.rngSeed ? "," + this.rngSeed : ""
    let metadata = MAUtils.obfuscateString(sanitizedName + "," + this.score + "," + this.timestamp + rngSeedStr)

    let ppHBase64Str = MAUtils.removeBase64Padding(this.playerPositionHistory.encodeToBase64())

    let cHBase64Str = ""
    if (this.columnHistory && DEBUG_STORE_COLUMNHISTORY) {
      cHBase64Str = "," + MAUtils.removeBase64Padding(this.columnHistory.encodeToBase64())
    }

    let result = encodeURIComponent(metadata + "," + ppHBase64Str + cHBase64Str)

    // Work around iOS Messages app splitting the URL
    result = result.replace(/%2(.)/g, "&$1=")
    result = result.replace(/%3D/g, "&d=")
    result = result.replace(/%/g, "&i=")

    let childReplaySuffix = ""
    if (this.replay) {
      // "&d=" is encodeURIComponent("=") with the iOS Message app splitting workaround applied
      let separator = "&d="
      let childReplaySizeLimit = sizeLimit
      if (childReplaySizeLimit) {
        childReplaySizeLimit -= result.length
        childReplaySizeLimit -= separator.length
      }
      let childReplayEncodedStr = this.replay.encodeToString(childReplaySizeLimit)
      childReplaySuffix = separator + childReplayEncodedStr
    }

    if (!sizeLimit || (result.length + childReplaySuffix.length <= sizeLimit)) {
      result += childReplaySuffix
    }


    return result
  }

  shareURL(baseURL, sizeLimit /* optional */) {
    // Only enforce sizeLimit if one is provided

    if (sizeLimit) {
      sizeLimit -= baseURL.length
    }

    return baseURL + this.encodeToString(sizeLimit)
  }

  nameString() {
    let str = this.name

    let subReplayCount = 0
    let subr = this.replay
    while (subr) {
      subReplayCount++
      subr = subr.replay
    }

    if (subReplayCount > 0) {
      str += ` (& ${subReplayCount} more)`
    }

    return str
  }

  prettyString() {
    let str = this.score + " points by " + this.nameString() + " " + MAUtils.prettyTimeAgoStringForTimestamp(this.timestamp, Date.now()) + " "
    return str
  }

  prettyTimeAgo() {
    let str =  MAUtils.prettyTimeAgoStringForTimestamp(this.timestamp, Date.now())
    return str
  }
}

class MAGameState {
  constructor(currentTimestamp, replay) {
    this.replay = replay // Optional. When set, this game is a redo of a previous game. We want to use all the same wall and obstacle positions.

    let slowModeFactor = DEBUG_SLOW_MODE ? 10 : 1
    this.msToTraverseOneColumn = (2600/22) * slowModeFactor
    this.numColumns = 23
    this.playerCurrentColumn = 8 // the player's active position is always the same column
    this.obstacleHeight = 32

    this.timestamp = Date.now()

    if (this.replay) {
      this.rngSeed = this.replay.rngSeed
    } else {
      this.rngSeed = this.timestamp
    }

    this.columnHistory = new MAColumnHistory()
    this.columnRNG = new MAGameRand(this.rngSeed)

    this.timestampOfLastVelocityUpdate = currentTimestamp
    this.msBetweenVelocityUpdates = 7

    this.timestampOfLastUpdate = currentTimestamp
    this.gameTicks = 0
    this.finalScore = 0

    // As the game clock advances, we want this.columnAt(0) to return the
    // column that represents the left-most part of the game screen.
    // Instead of shifting the order of the array, treat this as a ring buffer
    this.columns = new Array(this.numColumns)
    this.columnZeroIndex = 0

    this.columnHeight = COLUMN_HEIGHT
    let startingWallHeight = STARTING_WALL_HEIGHT
    for (let i = 0; i < this.numColumns; ++i) {
      this.columns[i] = new MAGameColumn(startingWallHeight, this.columnHeight-startingWallHeight, -1)
      // Intentionally leave this first screen of plain columns out of history
      // When using a replay, we will recreate these columns here rather than
      // reading them out of the replay
      //this.columnHistory.addColumn(this.columns[i])
    }

    this.playerPositionHistory = new MAPlayerPositionHistory()
    this.playerYPosition = 100
    this.updatePlayerPosition(currentTimestamp)
    this.velocity = 0

    // Handling game over animation
    this.deathAnimationStep = 0
  }

  score(currentTimestamp) {
    let timeSinceLastUpdate = currentTimestamp - this.timestampOfLastUpdate
    let pointsForTimeElapsedSinceLastTick = 0
    if (timeSinceLastUpdate > this.msToTraverseOneColumn/2) {
      pointsForTimeElapsedSinceLastTick = 1
    }
    return this.gameTicks*2 + pointsForTimeElapsedSinceLastTick
  }

  columnAt(i) {
    let index = Math.floor((i + this.columnZeroIndex) % this.numColumns)
    return this.columns[index]
  }

  lastColumn() {
    return this.columnAt(this.numColumns-1)
  }

  // The change in caveTop position for the most recent two columns
  caveTopDelta() {
    let currentCol = this.lastColumn()
    let prevCol = this.columnAt(this.numColumns-2)
    return currentCol.caveTop - prevCol.caveTop
  }

  // Move forward one tick, shift columns
  advance(timestamp) {
    this.timestampOfLastUpdate = timestamp
    this.gameTicks++
    this.columnZeroIndex++
    if (this.columnZeroIndex >= this.numColumns) {
      this.columnZeroIndex -= this.numColumns
    }
  }

  updatePlayerPosition(timestamp) {
    let col = this.columnAt(this.playerCurrentColumn)

    let isCloseToObstacle = false

    if (col.obstaclePosition > -1) {
      let aboveThreshold = col.obstaclePosition - this.obstacleHeight/2
      let belowThreshold = col.obstaclePosition + this.obstacleHeight + this.obstacleHeight/2
      let yPos = this.playerYPosition
      isCloseToObstacle = yPos > aboveThreshold && yPos < belowThreshold
    }

    this.playerPositionHistory.addPosition(this.playerYPosition, timestamp, isCloseToObstacle)
  }

  isYPositionSafe() {
    let y = this.playerYPosition
    let col = this.columnAt(this.playerCurrentColumn)

    let playerHitTopWall = y < col.caveTop
    let playerHitBottomWall = y > col.caveBottom
    let playerHitObstacle = false
    if (col.obstaclePosition > -1) {
      playerHitObstacle = (y > col.obstaclePosition) && (y < (col.obstaclePosition + this.obstacleHeight))
    }

    return !(playerHitTopWall || playerHitBottomWall || playerHitObstacle)
  }

  createReplay() {
    let columnHistory = this.columnHistory

    let subReplay = null
    if (this.replay) {
      if (this.replay.columnHistory &&
          this.replay.columnHistory.columnHistory.length > this.columnHistory.columnHistory.length) {
        columnHistory = this.replay.columnHistory
      }

      if (!DEBUG_STORE_COLUMNHISTORY) {
        columnHistory = null
      }

      // Deeper replays do not need columnHistory because the top-level replay has it
      // Deeper replays do not need rngSeed because the top-level replay has it
      subReplay = new MAReplay(this.replay.playerPositionHistory, null /* columnHistory */, this.replay.name, this.replay.score, this.replay.timestamp, null /* rngSeed */, this.replay.replay)
    }


    let phOL = this.playerPositionHistory.positionHistory.length
    this.playerPositionHistory.prunePositionHistory()
    let phAL = this.playerPositionHistory.positionHistory.length
    let chL = DEBUG_STORE_COLUMNHISTORY ? columnHistory.columnHistory.length : 0
    // console.log(`Creating replay: phOL ${phOL}  phAL ${phAL}  chL ${chL}`)

    let resultReplay = new MAReplay(this.playerPositionHistory, columnHistory, null, this.finalScore, this.timestamp, this.rngSeed, subReplay) // ReplayLevel 1


    // Drop replays deeper than MAX_REPLAY_LEVEL
    resultReplay = this.replayByLimitingReplayLevelDepth(resultReplay, 1, MAX_REPLAY_LEVEL)

    return resultReplay
  }

  // Avoid mutating MAReplay instances since that would cause us to lose the
  // original replay chain for this MAGameState instance.
  // Instead, make new MAReplay instances. That way `this` is still accurate
  // to inspect even after the game is over.
  replayByLimitingReplayLevelDepth(currentReplay, currentReplayLevel, maxReplayLevel) {
    if (!currentReplay) {
      return currentReplay
    }

    if (currentReplayLevel >= maxReplayLevel) {
      // Drop any deeper replays
      return new MAReplay(currentReplay.playerPositionHistory, currentReplay.columnHistory, currentReplay.name, currentReplay.score, currentReplay.timestamp, currentReplay.rngSeed, null)

    } else { // currentReplayLevel < maxReplayLevel
      let sanitizedReplay = this.replayByLimitingReplayLevelDepth(currentReplay.replay, currentReplayLevel+1, maxReplayLevel)
      return new MAReplay(currentReplay.playerPositionHistory, currentReplay.columnHistory, currentReplay.name, currentReplay.score, currentReplay.timestamp, currentReplay.rngSeed, sanitizedReplay)
    }
  }
}

class MAGameRenderer {
  constructor(canvasEl, gameEngine) {
    this.gameEngine = gameEngine
    this.canvas = canvasEl
    this.columnUniqueIDToPattern = {}
    this.pceImageScale = 1 // recalculated when intro screen is drawn
  }

  setGameState(gameState) {
    this.gameState = gameState
    this.gameHeight = gameState.columnHeight

    // Why we have two "not visible" columns:
    // - 1 of these columns becomes visible as the game scrolls. As the left-most column scrolls off the left edge of the screen, the first "not visible" column scrolls on screen.
    // - As that column becomes visible, we need to know the cave wall height of the next column to follow so we can interpolate half the difference. Search for "Draw half-width step to the next column" to find the relevant code.
    let numVisibleColumns = gameState.numColumns - 2
    this.sliceWidth = Math.ceil((this.canvas.width / this.scale) / numVisibleColumns)

    this.timeSinceAdvancedByOnePixel = 0
    this.numPixelsShiftedSinceGameLastAdvanced = 0

    this.introScreenStartTimestamp = 0
    this.gameOverStartTimestamp = 0
  }

  configureCanvas() {
    let aspectRatio = 500.0 / 640.0
    let maxWidth = window.innerWidth * 0.9
    let maxHeight = window.innerHeight * 0.7

    let width = maxWidth
    let height = width / aspectRatio

    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }

    // console.log("devicePixelRatio: " + window.devicePixelRatio)
    if (DEBUG_OVERRIDE_SCALE_TO_1) {
      this.scale = 1
    } else {
      this.scale = window.devicePixelRatio
    }

    this.canvas.width = width * this.scale
    this.canvas.height = height * this.scale

    let ctx = this.canvas.getContext("2d")
    ctx.scale(this.scale, this.scale)
    ctx.lineCap = 'round'

    // Set up ivars calculated from both canvas configuration and gameState
    if (this.gameState) {
      this.setGameState(this.gameState)
    }
  }

  // Convert game y position to pixel y position
  py(y) {
    return Math.floor(y * (this.canvas.height / this.scale) / this.gameHeight)
  }

  patternForColumn(col) {
    let pat = this.columnUniqueIDToPattern[col.uniqueID]
    if (pat) {
      return pat
    }

    let c = document.createElement('canvas')
    let widthPoints = 8
    let heightPoints = 8
    c.width = widthPoints
    c.height = heightPoints
    c.style.width = c.width + "px"
    c.style.height = c.height + "px"
    let ctx = c.getContext("2d")

    // Using this scale looks right to me across iPad/Mac (where devicePixelRatio is 2) and iPhone/Android phone (where devicePixelRatio is 3)
    let scale = 2 // window.devicePixelRatio
    c.width = c.width * scale
    c.height = c.height * scale
    ctx.scale(scale, scale)

    ctx.fillStyle = "black"

    ctx.fillRect(0, 0, c.width, c.height)

    ctx.fillStyle = "white"

    for (let i = 0; i < 18; i++) {
      let randX = MAUtils.randomInt(widthPoints-1)
      let randY = MAUtils.randomInt(heightPoints-1)
      ctx.fillRect(randX*scale, randY*scale, scale, scale)
    }

    pat = ctx.createPattern(c, "repeat")
    this.columnUniqueIDToPattern[col.uniqueID] = pat

    return pat
  }

  fillPatternInRect(pat, ctx, xPatternOffset, x, y, w, h, noStroke) {
    ctx.lineWidth = noStroke ? 0 : 1
    ctx.strokeStyle = "rgba(0,0,0,1)"
    if (noStroke) {
      // Use an obvious color to notice bugs in noStroke logic
      ctx.strokeStyle = "red"
    }
    ctx.fillStyle = pat
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    let yPatternOffset = 0
    // Repeating patterns are stable as if tiled from the top left corner.
    // To have the pattern follow the screen as it scrolls, transform the canvas
    //  setTransform(a, b, c, d, e, f) applied to (x, y) results in (a*x + c*y + e, b*x + d*y + f)
    ctx.setTransform(1*this.scale, 0, 0, 1*this.scale, xPatternOffset*this.scale, yPatternOffset*this.scale)
    ctx.closePath()
    ctx.fill()
    if (!noStroke) {
      ctx.stroke()
    }

    // Reset transform back to identity (with scale applied)
    ctx.setTransform(1*this.scale, 0, 0, 1*this.scale, 0, 0)
  }

  drawCaveOpenSpace(xOffset) {
    let ctx = this.canvas.getContext("2d")
    ctx.fillStyle = "white"

    for (let i = 0; i < this.gameState.numColumns; ++i) {
      let column = this.gameState.columnAt(i)

      let xOriginPerfect = i*this.sliceWidth+xOffset
      let xOrigin = Math.floor(xOriginPerfect)

      let extraPadding = xOriginPerfect-xOrigin

      ctx.fillRect(xOrigin,this.py(column.caveTop),this.sliceWidth+extraPadding,this.py(column.caveHeight()))
    }
  }

  drawColumn(i, xOffset) {
    let ctx = this.canvas.getContext("2d")

    let column = this.gameState.columnAt(i)

    let xOriginPerfect = i*this.sliceWidth+xOffset

    let pat = this.patternForColumn(column)

    // Top wall
    let caveTop = this.py(column.caveTop)
    this.fillPatternInRect(pat, ctx, xOriginPerfect, xOriginPerfect, 0, this.sliceWidth, caveTop)

    let interpolateHalfWidthColumns = true

    // Draw half-width step to the next column
    if (interpolateHalfWidthColumns && i < this.gameState.numColumns-1) {
      let nextColumn = this.gameState.columnAt(i+1)

      let nextCaveTop = this.py(nextColumn.caveTop)

      if (nextCaveTop < caveTop) {
        // Draw a white rectangle in the current column
        let halfwayY = Math.floor((caveTop+nextCaveTop)/2)
        ctx.fillStyle = "white"
        ctx.lineWidth = 2
        ctx.strokeStyle = "white"
        ctx.fillRect(xOriginPerfect+Math.floor(this.sliceWidth/2), halfwayY, Math.floor(this.sliceWidth/2), caveTop-halfwayY)
        ctx.strokeRect(xOriginPerfect+Math.floor(this.sliceWidth/2), halfwayY, Math.floor(this.sliceWidth/2), caveTop-halfwayY)

      } else if (nextCaveTop > caveTop) {
        // Draw a filled rectangle in the current column
        let halfwayY = Math.floor((caveTop+nextCaveTop)/2)

        this.fillPatternInRect(pat, ctx, xOriginPerfect, xOriginPerfect+Math.floor(this.sliceWidth/2), caveTop-5, Math.floor(this.sliceWidth/2), halfwayY-caveTop+5, true)
      }
    }

    // Bottom wall
    let bottomCaveTop = this.py(column.caveTop+column.caveHeight())
    this.fillPatternInRect(pat, ctx, xOriginPerfect, xOriginPerfect, bottomCaveTop, this.sliceWidth, this.canvas.height-this.py(column.caveHeight()))

    // Draw half-width step to the next column
    if (interpolateHalfWidthColumns && i < this.gameState.numColumns-1) {
      let nextColumn = this.gameState.columnAt(i+1)

      let nextCaveTop = this.py(nextColumn.caveTop+nextColumn.caveHeight())

      if (nextCaveTop > bottomCaveTop) {
        // Draw a white rectangle in the current column
        let halfwayHeight = Math.floor((nextCaveTop-bottomCaveTop)/2)
        ctx.fillStyle = "white"
        ctx.lineWidth = 2
        ctx.strokeStyle = "white"
        ctx.fillRect(xOriginPerfect+Math.floor(this.sliceWidth/2), bottomCaveTop, Math.floor(this.sliceWidth/2), halfwayHeight)
        ctx.strokeRect(xOriginPerfect+Math.floor(this.sliceWidth/2), bottomCaveTop, Math.floor(this.sliceWidth/2), halfwayHeight)

      } else if (nextCaveTop < bottomCaveTop) {
        // Draw a filled rectangle in the current column
        let halfwayHeight = Math.floor((bottomCaveTop-nextCaveTop)/2)

        this.fillPatternInRect(pat, ctx, xOriginPerfect, xOriginPerfect+Math.floor(this.sliceWidth/2), bottomCaveTop-halfwayHeight, Math.floor(this.sliceWidth/2), halfwayHeight+5, true)
      }
    }

    // Draw the obstacle
    if (column.obstaclePosition > -1) {
      this.fillPatternInRect(pat, ctx, xOriginPerfect, xOriginPerfect, this.py(column.obstaclePosition), this.sliceWidth, this.py(this.gameState.obstacleHeight))
    }
  }

  drawInterpolatedPlayerPositions(pos, nextPos, posStrokeEndX, nextStrokeEndX, i, strokeStyle) {
    // Interpolate between the y pixel positions of these two player positions so there will be no vertical gaps.

    // Ribbon falling down:
    //  ------------      <-- minY
    //    ~~~~~~~~~~~~
    //      ------------  <-- maxY
    //                 ^posStrokeEndX
    //             ^nextStrokeEndX

    // Ribbon rising:
    //      ------------  <-- minY
    //    ~~~~~~~~~~~~
    //  ------------      <-- maxY
    //                 ^posStrokeEndX
    //             ^nextStrokeEndX

    let maxY = this.py(Math.max(pos.yPos, nextPos.yPos))
    let minY = this.py(Math.min(pos.yPos, nextPos.yPos))

    let ctx = this.canvas.getContext("2d")
    let playerStrokeWidth = this.sliceWidth

    let horizontalDistance = posStrokeEndX - nextStrokeEndX
    let totalVerticalDistance = maxY-minY

    for (let y = minY; y <= maxY; y++) {
      let proportionOfDistance = 0
      if (totalVerticalDistance > 0) {
        proportionOfDistance = (y-minY) / totalVerticalDistance
      }

      if (this.py(nextPos.yPos) - this.py(pos.yPos) < 0) {
        proportionOfDistance = 1 - proportionOfDistance
      }

      ctx.lineWidth = 2
      ctx.lineCap = "square"
      ctx.strokeStyle = strokeStyle

      let drawAtX = posStrokeEndX - (proportionOfDistance * horizontalDistance)

      ctx.beginPath()
      ctx.moveTo(drawAtX-playerStrokeWidth, y)
      ctx.lineTo(drawAtX, y)
      ctx.stroke()
    }
  }

  drawPlayerPositionHistory(positionHistory, replayLevel, timestamp) {
    let ctx = this.canvas.getContext("2d")

    let sliceWidthInPoints = this.sliceWidth

    if (replayLevel > MAX_REPLAY_LEVEL) {
      return
    }

    let color = Math.floor(255 - (255 / Math.pow(2, replayLevel)))
    ctx.strokeStyle = `rgb(${color},${color},${color})`

    // Shorten the loop so we can access this index and the index before it
    let len = positionHistory.positionHistory.length
    for (let i = 0; i < len-1; i++) {
      let pos = null
      let index = len - i - 1
      pos = positionHistory.positionHistory[index]

      let strokeEndXForCurrentTimestamp = this.gameState.playerCurrentColumn * this.sliceWidth
      let msElapsedSincePosWasStored = timestamp - pos.timestamp

      if (msElapsedSincePosWasStored < 0) {
        // In replays, our current game duration has not reached this position yet
        continue
      }

      let distanceTravelled = sliceWidthInPoints * msElapsedSincePosWasStored / this.gameState.msToTraverseOneColumn
      let strokeEndX = strokeEndXForCurrentTimestamp - distanceTravelled


      // Fill in vertical gaps between this and the earlier player position so the trail is a continuous ribbon
      let nextPos = positionHistory.positionHistory[index-1]
      let next_msElapsedSincePosWasStored = timestamp - nextPos.timestamp
      let next_distanceTravelled = sliceWidthInPoints * next_msElapsedSincePosWasStored / this.gameState.msToTraverseOneColumn
      let next_strokeEndX = strokeEndXForCurrentTimestamp - next_distanceTravelled

      this.drawInterpolatedPlayerPositions(pos, nextPos, strokeEndX, next_strokeEndX, i, ctx.strokeStyle)

      // Stop looping when we are off-canvas; all of the older positions scrolled off the end
      if (strokeEndX < 0) {
        break
      }
    }
  }

  drawBlankScreen() {
    let ctx = this.canvas.getContext("2d")
    let cw = this.canvas.width
    let ch = this.canvas.height
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, cw, ch)
  }

  drawFrame(timestamp) {
    let drawFrameStart = performance.now()

    let timeElapsedSinceGameAdvancedToCurrentColumn = timestamp - this.gameState.timestampOfLastUpdate

    let sliceWidthInPoints = this.sliceWidth
    let xOffset = -timeElapsedSinceGameAdvancedToCurrentColumn * sliceWidthInPoints / this.gameState.msToTraverseOneColumn

    let ctx = this.canvas.getContext("2d")
    let cw = this.canvas.width
    let ch = this.canvas.height

    this.drawBlankScreen()

    // Draw every column
    for (let i = 0; i < this.gameState.numColumns; ++i) {
      this.drawColumn(i, xOffset)
    }

    // Draw the player
    if (this.gameState.playerPositionHistory.positionHistory.length > 0) {
      let firstPos = this.gameState.playerPositionHistory.positionHistory[0]
      let currentGameDuration = timestamp - firstPos.timestamp

      let replays = []
      let r = this.gameState.replay
      while (r) {
        replays.push(r)
        r = r.replay
      }

      // Draw the deepest replays first since they are drawn with the
      // lightest color and should be behind newer replays
      for (let i = replays.length-1; i >= 0; --i) {
        let replayLevel = i+1
        let replay = replays[i]

        // Translate timestamp:
        let replayFirstPos = replay.densePlayerPositionHistory.positionHistory[0]
        let adjustedTimestamp = replayFirstPos.timestamp + currentGameDuration

        this.drawPlayerPositionHistory(replay.densePlayerPositionHistory, replayLevel, adjustedTimestamp)
      }
    }

    this.drawPlayerPositionHistory(this.gameState.playerPositionHistory, 0, timestamp)


    // Draw the score view
    let scoreImg = PCEImageLibrary.imageForString("" + this.gameState.score(timestamp))

    let scorePadding = Math.ceil(scoreImg.height * this.pceImageScale / 4)

    let scoreXPos = Math.floor(1.5 * scorePadding)
    let chPoints = ch / this.scale
    let scoreYPos = Math.floor(chPoints - scoreImg.height*this.pceImageScale - 1.5*scorePadding)
    let invertColorsFn = function(colorStr) {
      if (colorStr == "#00000000") {
        return "#000000"
      } else if (colorStr == "#000000") {
        return "#FFFFFF"
      }
      return colorStr
    }
    ctx.fillStyle = "#000000"
    ctx.fillRect(scoreXPos-scorePadding, scoreYPos-scorePadding, scoreImg.width*this.pceImageScale + 2*scorePadding, scoreImg.height*this.pceImageScale + 2*scorePadding)

    scoreImg.drawInCanvas(this.canvas, this.pceImageScale, scoreXPos, scoreYPos, invertColorsFn)


    let drawFrameEnd = performance.now()
    // console.log("Drawing took: " + (drawFrameEnd - drawFrameStart) + "ms")
  }

  // Draws on top of the current screen
  updateDeathScreen() {
    // Draw a batch of black lines that radiate out from the point of impact
    let playerX = this.gameState.playerCurrentColumn * this.sliceWidth
    let playerY = this.py(this.gameState.playerYPosition)
    let batchNumber = this.gameState.deathAnimationStep

    let ctx = this.canvas.getContext("2d")
    ctx.lineWidth = 2
    ctx.lineCap = "square"
    ctx.strokeStyle = "black"

    for (let i = 0; i < 5; ++i) {
      let len = (batchNumber * 10) + Math.random() * 60 * this.scale
      let angle = Math.random() * 2 * Math.PI
      let xRelPos = len * Math.cos(angle)
      let yRelPos = len * Math.sin(angle)

      ctx.strokeStyle = Math.random() > 0.3 ? "black" : "white"

      ctx.beginPath()
      ctx.moveTo(playerX, playerY)
      ctx.lineTo(playerX+xRelPos, playerY+yRelPos)
      ctx.stroke()
    }
  }

	drawGameOverScoreScreen(score, isNewHighScore, timestamp) {
		// Don't blank the screen; we're drawing on top of the last game frame

    let elapsedTime = timestamp - this.gameOverStartTimestamp
    let animationDurationMS = 300
    let proportionElapsed = elapsedTime / animationDurationMS
    let fadeAlpha = MAUtils.easeInOutCubic(proportionElapsed)

		let gameOverSign = new PCEImage(PCEImageLibrary.GameOverSign.imageStr)

    let cw = this.canvas.width / this.scale
    let ch = this.canvas.height / this.scale

		let xPos = Math.floor((cw - gameOverSign.width*this.pceImageScale)/2)
		let yPos = Math.floor((ch - gameOverSign.height*this.pceImageScale)/2)

		gameOverSign.drawInCanvas(this.canvas, this.pceImageScale, xPos, yPos, colorStr => MAUtils.hexColorWithMaxAlpha(colorStr, fadeAlpha))

		let blankSpaceOffset = 10 * this.pceImageScale // Blank space technically starts after line 17, but this looks better to me
		let blankSpaceHeight = gameOverSign.height*this.pceImageScale - blankSpaceOffset

		let scoreImg = PCEImageLibrary.imageForString("Score: " + score)
		let scoreRelX = Math.floor(((gameOverSign.width-1)*this.pceImageScale - scoreImg.width*this.pceImageScale)/2)
		let scoreRelY = Math.floor((blankSpaceHeight - scoreImg.height*this.pceImageScale)/2)
		scoreImg.drawInCanvas(this.canvas, this.pceImageScale, xPos+scoreRelX, yPos+blankSpaceOffset+scoreRelY, colorStr => MAUtils.hexColorWithMaxAlpha(colorStr, fadeAlpha))

		if (isNewHighScore) {
      let highScoreImg = PCEImageLibrary.imageForString("High score!!")

      let hsRelX = Math.floor(((gameOverSign.width-1)*this.pceImageScale - highScoreImg.width*this.pceImageScale)/2)
      let hsRelY = (gameOverSign.height-4)*this.pceImageScale - highScoreImg.height*this.pceImageScale

      highScoreImg.drawInCanvas(this.canvas, this.pceImageScale, xPos+hsRelX, yPos+hsRelY, colorStr => MAUtils.hexColorWithMaxAlpha(colorStr, fadeAlpha))
		}
	}

  drawIntroScreen(timestamp) {
    let elapsedTime = timestamp - this.introScreenStartTimestamp

    this.drawBlankScreen()

    let caveRibbonSign = new PCEImage(PCEImageLibrary.CaveRibbonSign.imageStr)

    let cw = this.canvas.width / this.scale
    let ch = this.canvas.height / this.scale

    // Debug placement:
    // let ctx = this.canvas.getContext("2d")
    // ctx.fillStyle = "gray";
    // ctx.fillRect(0,0,cw,ch);

    let ribbonSignPadding = 0.2 * cw // at least 10% padding on either side
    let caveRibbonScaleThatFits = Math.max(1, Math.floor((cw-ribbonSignPadding) / caveRibbonSign.width))
    this.pceImageScale = caveRibbonScaleThatFits

    let leftPadding = Math.floor((cw - caveRibbonSign.width*caveRibbonScaleThatFits)/2)

    let totalDistanceToAnimate = cw - leftPadding

    let animationDurationMS = 1000

    let proportionElapsed = elapsedTime / animationDurationMS

    let currentXOffset = leftPadding // final position
    if (proportionElapsed < 1) {
      currentXOffset = cw-(MAUtils.easeInOutCubic(proportionElapsed) * totalDistanceToAnimate)
    }

    let topPadding = 0.10 * ch
    caveRibbonSign.drawInCanvas(this.canvas, caveRibbonScaleThatFits, currentXOffset, topPadding)
    let bottomOfCaveRibbonSign = caveRibbonSign.height*caveRibbonScaleThatFits + topPadding


    let fadeInDurationMS = 300
    let fadeInStart = animationDurationMS - fadeInDurationMS + 50
    if (elapsedTime >= fadeInStart) {
      let fadeProportionElapsed = (elapsedTime - fadeInStart) / fadeInDurationMS
      let fadeAlpha = MAUtils.easeInOutCubic(fadeProportionElapsed)


      // Draw ttsImg at the bottom
      let ttsStr = "Tap to start" + (this.gameEngine.currentReplay ? " replay" : "")
      let ttsImg = PCEImageLibrary.imageForString(ttsStr)
      let bottomPadding = topPadding
      let ttsYPos = ch - bottomPadding - (ttsImg.height * caveRibbonScaleThatFits)
      let ttsXPos = Math.floor((cw - ttsImg.width*caveRibbonScaleThatFits)/2)
      ttsImg.drawInCanvas(this.canvas, caveRibbonScaleThatFits, ttsXPos, ttsYPos, colorStr => MAUtils.hexColorWithMaxAlpha(colorStr, fadeAlpha))


      // Draw score(s) in the middle vertically
      if (this.gameEngine.highScore > 0) {
        // We want the ":" and scores to line up between high and last scores
        // Fortunately, "Last Score" and "High Score" have the same width so we just need to center both strings horizontally.

        let highScoreImg = PCEImageLibrary.imageForString("High Score: " + this.gameEngine.highScore)
        let hsYPos = Math.floor((bottomOfCaveRibbonSign + ttsYPos - highScoreImg.height*caveRibbonScaleThatFits)/2)
        let hsXPos = Math.floor((cw - highScoreImg.width*caveRibbonScaleThatFits)/2)

        if (this.gameEngine.lastScore > 0) {
          hsYPos -= Math.ceil(highScoreImg.height*caveRibbonScaleThatFits*0.75)
          let highScoreStr = "" + this.gameEngine.highScore
          let lastScoreStr = ("" + this.gameEngine.lastScore).padStart(highScoreStr.length, '\u2007')

          let lastScoreImg = PCEImageLibrary.imageForString("Last Score: " + lastScoreStr)
          let lsYPos = hsYPos + highScoreImg.height*caveRibbonScaleThatFits*1.25
          lastScoreImg.drawInCanvas(this.canvas, caveRibbonScaleThatFits, hsXPos, lsYPos, colorStr => MAUtils.hexColorWithMaxAlpha(colorStr, fadeAlpha))

        }

        highScoreImg.drawInCanvas(this.canvas, caveRibbonScaleThatFits, hsXPos, hsYPos, colorStr => MAUtils.hexColorWithMaxAlpha(colorStr, fadeAlpha))
      }
    }
  }
}


let gameEngine = null

function caveRibbonMain() {
  gameEngine = new MAGameEngine()
  gameEngine.configureCanvas()
  gameEngine.startGameLoop()
  gameEngine.configureInputHandlers()
}


const MAState = {
  IntroScreen:    0,
  GamePlay:       1,
  GameOverScreen: 2,
}
Object.freeze(MAState)


class MAGameEngine {
  constructor() {
    try {
      this.userIsPressing = false

      this.soundEffectsEnabled = false
      this.loadSoundSettingFromStorage()
      this.soundEffects = new MASounds()
      this.soundEffects.loadSounds()

      this.state = MAState.IntroScreen
      this.inFullscreenMode = false
      this.gameRenderer = null
      this.gameState = null

      this.highScores = []
      this.loadHighScores()

      this.loadHighScoreFromStorage()

      this.loadNameFromStorage()

      this.replays = []
      this.loadReplaysFromStorage()

      this.replayCountToShow = DEFAULT_REPLAY_COUNT_TO_SHOW

      this.setupColorSchemeHandling()

      let ge = this
      window.onhashchange = function() {
        ge.loadReplayFromFragment()
      }

      this.loadReplayFromFragment()

      this.updateMusicDiv()
      this.updateReplayDivs()

      this.scheduleTimestampUpdateLoop()
    } catch(e) {
      document.body.append("Hit error: " + e)
    }
  }

  static shouldReduceCaveHeightForColumnWithIndex(columnIndex) {
    return (columnIndex % 2 == 0)
  }

  static shouldAddObstacleToColumnWithIndex(columnIndex) {
    return ((columnIndex+1) % 10 == 0)
  }


 handleColorSchemeChange(e) {
   let gameCanvasEl = document.getElementById("c")

   if (e.matches) {
     console.log("In dark mode")
     gameCanvasEl.classList.add("invertedCanvas")
   } else {
     console.log("In light mode")
     gameCanvasEl.classList.remove("invertedCanvas")
   }
 }

  setupColorSchemeHandling() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.handleColorSchemeChange)

    const initialColorSchemeEvent = window.matchMedia('(prefers-color-scheme: dark)')
    this.handleColorSchemeChange(initialColorSchemeEvent)
  }

  scheduleTimestampUpdateLoop() {
    setInterval(() => {
      // Update the replay table without calling updateReplayDivs which would
      // recreate the name entry field and disrupt the user typing their name
      this.updateReplayTable(this.replays, "myReplayTable", MY_REPLAYS_BEHAVIORS)

      this.updateCurrentReplayDiv()
    }, 60*1000) // once per minute
  }

  loadHighScoreFromStorage() {
    this.highScore = 0

    let highScoreStr = window.localStorage.getItem('highScore')
    if (highScoreStr) {
      this.highScore = parseInt(highScoreStr)
    }
  }

  saveHighScoreToStorage() {
    window.localStorage.setItem('highScore', this.highScore)
  }

  loadSoundSettingFromStorage() {
    let settingStr = window.localStorage.getItem('soundEffectsEnabled')
    if (settingStr === "true") {
      this.soundEffectsEnabled = true
    } else {
      this.soundEffectsEnabled = false
    }
  }

  saveSoundSettingToStorage() {
    window.localStorage.setItem('soundEffectsEnabled', this.soundEffectsEnabled ? "true" : "false")
  }

  loadNameFromStorage() {
    let nameStr = window.localStorage.getItem('name')
    if (nameStr) {
      this.name = nameStr
    }
  }

  saveNameToStorage() {
    if (this.name) {
      window.localStorage.setItem('name', this.name)
    } else {
      window.localStorage.removeItem('name')
    }
  }

  loadHighScores() {
    if (MAHighScores) {
      try {
        this.highScores = MAHighScores.map(x => MAReplay.replayFromEncodedString(x)).filter(x => x)
      } catch(e) {
        this.highScores = []
      }
    }
  }

  loadReplaysFromStorage() {
    let savedReplaysRaw = window.localStorage.getItem('serializedReplays')
    if (savedReplaysRaw) {
      try {
        let parsedValue = JSON.parse(savedReplaysRaw)
        if (Array.isArray(parsedValue)) {
          this.replays = parsedValue.map(x => MAReplay.replayFromEncodedString(x)).filter(x => x)
        } else {
          this.replays = []
        }
      } catch(e) {
        this.replays = []
      }
    }
  }

  saveReplaysToStorage() {
    let replaysJSON = this.replays.map(x => x.encodeToString())

    window.localStorage.setItem('serializedReplays', JSON.stringify(replaysJSON))
  }

  configureCanvas() {
    let canvasEl = document.getElementById("c")
    this.gameRenderer = new MAGameRenderer(canvasEl, this)
    this.gameRenderer.configureCanvas()
  }

  updateMusicDiv() {
    let el = document.getElementById("musicDiv")
    el.innerHTML = ""
    el.append("Sound effects are ")

    let ge = this
    let toggleLink = document.createElement("a")
    toggleLink.textContent = this.soundEffectsEnabled ? "on" : "off"
    toggleLink.href = "#"
    toggleLink.onclick = function() {
      ge.soundEffectsEnabled = !ge.soundEffectsEnabled
      ge.saveSoundSettingToStorage()

      if (!ge.soundEffectsEnabled) {
        ge.soundEffects.stop()
      }

      ge.updateMusicDiv()
      return false
    }

    el.append(toggleLink)
    el.append(".")

    if (this.soundEffectsEnabled) {
      el.appendChild(document.createElement("br"))
      el.append("Don't hear them? Check device volume & mute settings.")
    }
  }

  handleGameInputStarted(e) {
    this.userIsPressing = true

    // Handle user input immediately except in GamePlay mode.
    // In GamePlay mode, we poll the userIsPressing state to add
    // acceleration in line with the game loop timer.
    // I tried calling advanceGameLoop every time there was user input
    // and it caused the game to scroll by with more jitter.
    if (this.state != MAState.GamePlay) {
      this.advanceGameLoop()
    }

    let isPlaying = this.state == MAState.GamePlay

    if (isPlaying && this.soundEffectsEnabled) {
      this.soundEffects.requestSong()
      this.soundEffects.playSound("bloop")
    }

    if (isPlaying &&
        !this.inFullscreenMode &&
        e.target.tagName == "CANVAS") {

      this.inFullscreenMode = true

      let fullscreenBG = document.getElementById("fullscreenBackground")
      fullscreenBG.style.transition = 'opacity 1s ease-out'
      fullscreenBG.style.opacity = '1'
      fullscreenBG.style.zIndex = '1'
    }
  }

  handleGameInputEnded() {
    this.userIsPressing = false
  }

  configureInputHandlers() {
    let ge = this

    document.body.addEventListener('keydown', function (e) {
      if (MAUtils.eventIsForRegularUserInput(e)) {
        return
      }

      // Prevent spacebar from scrolling the page
      if (e.key === " ") {
        e.preventDefault()
      }

      ge.handleGameInputStarted(e)
    })

    document.body.addEventListener('keyup', function (e) {
      if (MAUtils.eventIsForRegularUserInput(e)) {
        return
      }

      ge.handleGameInputEnded()
    })


    let activeTouches = null
    document.body.addEventListener('touchstart', function (e) {
      if (MAUtils.eventIsForRegularUserInput(e)) {
        return
      }

      if (e.target.tagName == "CANVAS") {
        e.preventDefault()
      }

      ge.handleGameInputStarted(e)
    })

    document.body.addEventListener('touchend', function (e) {
      if (MAUtils.eventIsForRegularUserInput(e)) {
        return
      }

      if (e.target.tagName == "CANVAS") {
        e.preventDefault()
      }

      ge.handleGameInputEnded()
    })

    document.body.addEventListener('touchcancel', function (e) {
      if (MAUtils.eventIsForRegularUserInput(e)) {
        return
      }

      if (e.target.tagName == "CANVAS") {
        e.preventDefault()
      }

      ge.handleGameInputEnded()
    })

    // Disable iOS rubber banding on scroll
    document.body.addEventListener('touchmove', function (e) {
      if (e.target.tagName == "CANVAS") {
        e.preventDefault()
      }
    })

    document.body.addEventListener('mousedown', function (e) {
      if (MAUtils.eventIsForRegularUserInput(e)) {
        return
      }

      ge.handleGameInputStarted(e)
    })

    document.body.addEventListener('mousemove', function (e) {
    })

    document.body.addEventListener('mouseup', function (e) {
      if (MAUtils.eventIsForRegularUserInput(e)) {
        return
      }

      ge.handleGameInputEnded()
    })
  }

  loadReplayFromFragment() {
    let fragment = window.location.hash

    this.currentReplay = null

    // console.log("Fragment: " + fragment)
    let prefix = "#r="
    if (fragment.startsWith(prefix)) {
      let encodedReplay = fragment.substring(prefix.length)
      let decodedReplay = MAReplay.replayFromEncodedString(encodedReplay)
      if (decodedReplay) {
        this.currentReplay = decodedReplay
      }
    }

    this.updateReplayDivs()
  }

  clearAll() {
    this.highScore = 0
    this.saveHighScoreToStorage()

    this.replays = []
    this.saveReplaysToStorage()

    location.reload()
  }

  deleteReplay(replay) {
    this.replays = this.replays.filter(x => x !== replay)
    this.saveReplaysToStorage()
    this.updateReplayDivs()
  }

  addReplay(r) {
    if (r) {
      let timestamp = performance.now()
      if (!this.lastShowMoreInteractionTimestamp || (timestamp - this.lastShowMoreInteractionTimestamp > 30*1000)) {
        this.replayCountToShow = DEFAULT_REPLAY_COUNT_TO_SHOW
      }

      if (this.name) {
        r.name = this.name
      } else {
        r.name = "Anonymous"
      }
      this.replays.push(r)
      this.saveReplaysToStorage()
      this.updateReplayDivs()
    }
  }

  async handleShareLinkForReplay(replay, copiedSpanID) {
    let baseURL = window.location.origin + window.location.pathname + "#r="

    if (MAUtils.isScoreEligibleForObfuscation(replay.score)) {
      let filename = MAUtils.obfuscateScore(replay.score)
      baseURL = baseURL.replace("index.html", `r/${filename}.html`)
    }

    let shareURL = replay.shareURL(baseURL, SHARE_URL_SIZE_LIMIT)
    if (!FORCE_SHARING_USING_CLIPBOARD && navigator.share) {
      try {
        await navigator.share({
          title: 'CaveRibbon Replay',
          url: shareURL
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      console.log('Web Share API not supported')

      try {
        await navigator.clipboard.writeText(shareURL)
        console.log('Link copied to clipboard:', shareURL)
        let copiedEl = document.getElementById(copiedSpanID)

        copiedEl.style.transition = ''
        copiedEl.style.opacity = '1'

        setTimeout(() => {
          copiedEl.style.transition = 'opacity 1s ease-out'
          copiedEl.style.opacity = '0'
        }, 100)

      } catch (error) {
        console.log('Failed to copy link:', error)
      }
    }
  }

  handleNameChanged() {
    this.saveNameToStorage()
    this.replays.forEach(r => {
      if (this.name) {
        r.name = this.name
      } else {
        r.name = "Anonymous"
      }
    })

    this.saveReplaysToStorage()

    // Update the replay table without calling updateReplayDivs which would
    // recreate the name entry field and disrupt the user typing their name
    this.updateReplayTable(this.replays, "myReplayTable", MY_REPLAYS_BEHAVIORS)

    // Keep the currentReplay timestamp in sync with the timestamp shown in the replay table
    this.updateCurrentReplayDiv()
  }

  updateCurrentReplayDiv() {
    let currentReplayDiv = document.getElementById("currentReplayDiv")
    currentReplayDiv.innerHTML = ""
    if (this.currentReplay) {
      currentReplayDiv.append("Currently replaying: " + this.currentReplay.prettyString() + " ")
      let clearLink = document.createElement("a")
      clearLink.textContent = "clear"
      clearLink.href = "#"

      currentReplayDiv.append(clearLink)
    }
  }

  updateReplayDivs() {
    this.updateCurrentReplayDiv()

    let replayDiv = document.getElementById("replayDiv")
    replayDiv.innerHTML = ""

    let hasReplays = this.replays.length > 0

    if (!hasReplays) {
      return
    }


    // ==== Elements that only show when there are replays ====

    let nameInputDiv = document.createElement("div")
    replayDiv.append(nameInputDiv)
    nameInputDiv.classList.add('nameInputDiv')
    nameInputDiv.append("Name (for submissions): ")
    let nameInputField = document.createElement("input")
    nameInputField.type = "text"
    nameInputField.placeholder = "Anonymous"
    nameInputField.id = "name_input"
    if (this.name) {
      nameInputField.value = this.name
    }
    nameInputField.addEventListener('input', () => {
      let nif = document.getElementById("name_input")
      let nameStr = nif.value
      if (!nameStr || nameStr.length <= 0) {
        this.name = null
      } else {
        this.name = nameStr
      }

      this.handleNameChanged()
    })
    nameInputDiv.append(nameInputField)


    let tableTitleDiv = document.createElement("div")
    replayDiv.append(tableTitleDiv)
    tableTitleDiv.classList.add('replayTableTitle')

    let tableTitleH2 = document.createElement("h4")
    tableTitleDiv.append(tableTitleH2)
    tableTitleH2.textContent = "your replays"

    let replayTable = this.createReplayTable(this.replays, "myReplayTable", MY_REPLAYS_BEHAVIORS)
    replayDiv.append(replayTable)


    // High scores
    let highScoresDiv = document.getElementById("highScoresDiv")
    highScoresDiv.innerHTML = ""

    tableTitleDiv = document.createElement("div")
    highScoresDiv.append(tableTitleDiv)
    tableTitleDiv.classList.add('replayTableTitle')

    tableTitleH2 = document.createElement("h4")
    tableTitleDiv.append(tableTitleH2)
    tableTitleH2.textContent = "hall of fame"

    let highScoresTable = this.createReplayTable(this.highScores, "myHighScoresTable", HIGH_SCORES_BEHAVIORS)
    highScoresDiv.append(highScoresTable)
  }

  updateReplayTable(replays, elementId, behaviors) {
    let elToRemove = document.getElementById(elementId)

    if (elToRemove) {
      let parentEl = elToRemove.parentNode

      elToRemove.remove()

      if (parentEl) {
        let newTable = this.createReplayTable(replays, elementId, behaviors)
        parentEl.append(newTable)
      }
    }
  }

  createReplayTable(replays, elementId, behaviors) {
    let replayTable = document.createElement("table")
    replayTable.id = elementId
    replayTable.classList.add("replayTable")

    let replayTableHeading = document.createElement("thead")
    const headerRow = document.createElement('tr')

    // Table headers
    const headers = ['score', '', '']
    headers.forEach(headerText => {
      const th = document.createElement('th')
      th.textContent = headerText

      if (headerText.length) {
        th.classList.add(headerText + "Column")
      }

      if (headerText == 'score') {
        th.colSpan = 2
      }

      headerRow.appendChild(th)
    })

    replayTableHeading.appendChild(headerRow)
    replayTable.appendChild(replayTableHeading)

    const tbody = document.createElement('tbody')
    replayTable.appendChild(tbody)

    let highScore = this.highScore
    if (behaviors.includes("sortHighToLow")) {
      replays.sort((a, b) => {
        // Sort by score
        // After that, sort oldest to youngest

        if (a.score != b.score) {
          return b.score - a.score
        }

        return a.timestamp - b.timestamp
      })
    } else {
      replays.sort((a, b) => {
        // Any replay with the current high score should be first
        // After that, sort youngest to oldest

        if (a.score != b.score) {
          if (a.score == highScore || b.score == highScore) {
            return b.score - a.score
          }
        }

        return b.timestamp - a.timestamp
      })
    }


    for (let i = 0; i < replays.length && i < this.replayCountToShow; ++i) {
      let replay = replays[i]

      const row = document.createElement('tr')
      tbody.appendChild(row)

      let divUUID = MAUtils.uuidv4()

      let trophyCell = document.createElement("td")
      trophyCell.classList.add('trophyColumn')
      row.appendChild(trophyCell)

      let showTrophy = replay.score == this.highScore
      if (behaviors.includes("sortHighToLow")) {
        showTrophy = i == 0
      }

      if (showTrophy) {
        trophyCell.append("🏆")
      }


      let scoreCell = document.createElement("td")
      scoreCell.classList.add('scoreColumn')
      row.appendChild(scoreCell)

      scoreCell.append(replay.score)

      let timeCell = document.createElement("td")
      timeCell.classList.add('timeColumn')
      row.appendChild(timeCell)
      timeCell.append(replay.prettyTimeAgo())

      let nameCell = document.createElement("td")
      nameCell.classList.add('nameColumn')
      row.appendChild(nameCell)

      let nameSpan = document.createElement("span")
      nameCell.append(nameSpan)
      nameSpan.classList.add('nameSpan')
      nameSpan.append(replay.nameString())

      let replayLink = document.createElement("a")
      replayLink.textContent = "replay"
      let hashValue = "r=" + replay.encodeToString()
      replayLink.href = "#" + hashValue


      let ge = this

      let copiedSpanID = "copied-"+divUUID
      let shareLink = document.createElement("a")
      shareLink.textContent = "share"
      shareLink.href = "#"
      shareLink.onclick = function() {
        ge.handleShareLinkForReplay(replay, copiedSpanID)
        return false
      }


      let submitLink = document.createElement("a")
      submitLink.textContent = "submit"
      let baseURL = window.location.origin + window.location.pathname + "#r="
      submitLink.href = "https://docs.google.com/forms/d/e/1FAIpQLSeU14sAD1Qnn3-dMOfhpZvDtI4zsEZ7xF1S4kSQVJMZGPaDZg/viewform?usp=pp_url&entry.1913390770=" + encodeURIComponent(replay.shareURL(baseURL)) // No limit on shareURL size so we get the full replay history
      submitLink.target = "_blank"


      let deleteLink = document.createElement("a")
      deleteLink.textContent = "delete"
      deleteLink.href = "#"

      deleteLink.onclick = function() {
        let confirmation = window.confirm("Delete replay with score " + replay.score + "?")
        if (confirmation) {
          ge.deleteReplay(replay)
        }
        return false
      }

      let actionSpanContainer = document.createElement("span")
      nameCell.append(actionSpanContainer)
      actionSpanContainer.classList.add('actionSpanContainer')

      let actionSpan = document.createElement("span")
      actionSpanContainer.append(actionSpan)
      actionSpan.classList.add('actionSpan')

      const actionLinks = [replayLink, shareLink, submitLink, deleteLink]
      let comma = ""
      actionLinks.forEach(link => {
        if (!behaviors.includes(link.textContent)) {
          link.href = 'javascript:'
          link.onclick = null
          link.classList.add('disabledLink')
        }

        actionSpan.append(comma)
        actionSpan.append(link)
        comma = " "

        if (link == shareLink) {
          let copiedSpan = document.createElement("span")
          copiedSpan.id = copiedSpanID
          copiedSpan.textContent = "Copied!"
          copiedSpan.classList.add('copied-message')
          copiedSpan.style.opacity = '0'
          actionSpan.append(copiedSpan)
        }
      })
    }

    const bottomRow = document.createElement('tr')
    let shouldShowBottomRow = behaviors.includes("delete all")
    if (shouldShowBottomRow) {
      tbody.appendChild(bottomRow)
    }

    let bottomWideCell = document.createElement("td")
    bottomWideCell.classList.add('replayTableBottomWideCell')
    bottomWideCell.colSpan = replayTable.rows[replayTable.rows.length-2].cells.length
    bottomRow.appendChild(bottomWideCell)

    let bottomWideCellDiv = document.createElement("div")
    bottomWideCell.append(bottomWideCellDiv)
    bottomWideCellDiv.classList.add('bottomWideCellDiv')

    if (replays.length > this.replayCountToShow) {
      let showMoreDiv = document.createElement("div")
      bottomWideCellDiv.appendChild(showMoreDiv)
      showMoreDiv.classList.add('showMoreDiv')

      let showMoreLink = document.createElement("a")
      showMoreDiv.append(showMoreLink)
      showMoreLink.textContent = "show more"
      showMoreLink.href = "#"
      showMoreLink.onclick = function() {
        ge.lastShowMoreInteractionTimestamp = performance.now()
        ge.replayCountToShow += DEFAULT_REPLAY_COUNT_TO_SHOW
        ge.updateReplayDivs()
        return false
      }
    }

    let deleteAllDiv = document.createElement("div")
    bottomWideCellDiv.appendChild(deleteAllDiv)
    deleteAllDiv.classList.add('deleteAllDiv')

    let deleteAllLink = document.createElement("a")
    deleteAllDiv.append(deleteAllLink)
    deleteAllLink.textContent = "delete all"
    deleteAllLink.href = "#"
    let ge = this
    deleteAllLink.onclick = function() {
      let confirmation = window.confirm("Delete all replays and reset high score?")
      if (confirmation) {
        ge.clearAll()
      }
      return false
    }

    return replayTable
  }

  requestAnimationFrameLoop() {
    if (DEBUG_JITTERY_FRAME_INTERVAL) {
      if (Math.random()*100 < 90) {
        setTimeout(function() {
          gameEngine.advanceGameLoop()
          requestAnimationFrame(function () {
            gameEngine.requestAnimationFrameLoop()
          })
        }, 10)
        return
      }
    }

    gameEngine.advanceGameLoop()
    requestAnimationFrame(function () {
      gameEngine.requestAnimationFrameLoop()
    })
  }

  startGameLoop() {
    // setInterval gives more consistent callbacks than requestAnimationFrame in Safari on iPad Pro
    // See this sample project for more details: https://jsfiddle.net/zt5yo6mj/
    // But requestAnimationFrame seems to work better in Chrome
    this.prevGameLoopTimestamp = 0
    if (USE_REQUESTANIMATIONFRAME) {
      gameEngine.requestAnimationFrameLoop()
    } else {
      if (DEBUG_SLOW_MODE) {
        setInterval(() => { gameEngine.advanceGameLoop() }, 1000/12)
      } else {
        // This performs best on iPad Pro but not on other devices:
        //setInterval(() => { gameEngine.advanceGameLoop() }, 1000/120) // Looks smoothest to redraw at 120fps even though WebKit would only give us 60fps
        setInterval(() => { gameEngine.advanceGameLoop() }, 1000/60)
      }
    }
  }

  advanceGameLoop() {
    let timestamp = performance.now()
    let advanceGameLoopStart = performance.now()

    // Log when a frame is dropped due to insufficient callback frequency
    if (this.prevGameLoopTimestamp <= 0) {
      this.prevGameLoopTimestamp = timestamp
    }

    let timeDeltaMs = timestamp - this.prevGameLoopTimestamp
    if (timeDeltaMs > 17) {
      //console.log("timeDeltaMs: " + timeDeltaMs)
    }


    switch (this.state) {
      case MAState.IntroScreen: {
        if (!this.gameState || this.gameState.gameTicks > 0) { // first frame
          console.log("making new gameState")
          this.gameState = new MAGameState(timestamp, null)
          this.gameRenderer.setGameState(this.gameState)
          this.gameState.playerYPosition = 180
          let canvasEl = document.getElementById("c")
          let ctx = canvasEl.getContext("2d")
          let cw = canvasEl.width

          this.gameRenderer.introScreenStartTimestamp = timestamp
        }

        this.gameRenderer.drawIntroScreen(timestamp)

        if (this.userIsPressing) {
          console.log("Starting game")
          this.state = MAState.GamePlay
          this.gameState = null
        }

        break
      }



      case MAState.GamePlay: {
        if (!this.gameState) { // first frame
          this.gameState = new MAGameState(timestamp, this.currentReplay)
          this.gameRenderer.setGameState(this.gameState)
          this.gameState.velocity = -0.5
        }

        let timeSinceLastVelocityUpdate = timestamp - this.gameState.timestampOfLastVelocityUpdate

        if (timeSinceLastVelocityUpdate >= this.gameState.msBetweenVelocityUpdates) {

          this.gameState.timestampOfLastVelocityUpdate = timestamp

          let updateScale = timeSinceLastVelocityUpdate / this.gameState.msBetweenVelocityUpdates

          if (this.userIsPressing) {
            let upwardAcceleration = updateScale * 0.14/7
            this.gameState.velocity = this.gameState.velocity - upwardAcceleration
          } else {
            let downwardAcceleration = updateScale * 0.14/7
            this.gameState.velocity = this.gameState.velocity + downwardAcceleration
          }

          this.gameState.playerYPosition += updateScale * this.gameState.velocity
          this.gameState.updatePlayerPosition(timestamp)
        }


        let shouldAdvance = (timestamp - this.gameState.timestampOfLastUpdate) >= this.gameState.msToTraverseOneColumn

        if (shouldAdvance) {
          let now = timestamp
          let timeSinceGameShouldHaveUpdated = (now - this.gameState.timestampOfLastUpdate) % this.gameState.msToTraverseOneColumn

          let adjustedTimestamp = now - timeSinceGameShouldHaveUpdated

          let replayCol = null
          if (this.gameState.replay && DEBUG_STORE_COLUMNHISTORY) {
            replayCol = this.gameState.replay.columnHistory.columnHistory[this.gameState.gameTicks]
          }

          let nextCaveTop = 0
          let nextCaveBottom = 0
          let nextObstaclePosition = -1


          // Generate new cave & obstacle positions for the next column
          let currentCaveHeight = this.gameState.lastColumn().caveHeight()

          let nextCaveHeight = currentCaveHeight

          if (MAGameEngine.shouldReduceCaveHeightForColumnWithIndex(this.gameState.gameTicks)) {
            nextCaveHeight--
          }

          // 30% of the time, pick a new nextCaveDelta value that ranges from -5 to 5.
          let nextCaveDelta = this.gameState.caveTopDelta()
          if (this.gameState.columnRNG.randomInt(0, 9) < 3) {

            nextCaveDelta = this.gameState.columnRNG.randomInt(-5, 5)
          }

          nextCaveTop = this.gameState.lastColumn().caveTop + nextCaveDelta

          if (nextCaveTop < 10) {
            nextCaveTop = 10
          }

          if (nextCaveTop > 290-nextCaveHeight) {
            nextCaveTop = 290-nextCaveHeight
          }

          nextCaveBottom = nextCaveTop + nextCaveHeight

          if (MAGameEngine.shouldAddObstacleToColumnWithIndex(this.gameState.gameTicks) && nextCaveHeight > 1.5*this.gameState.obstacleHeight) {

            let overlapWithWall = 5
            let l = this.gameState.columnRNG.randomInt(-1*overlapWithWall, nextCaveHeight - this.gameState.obstacleHeight + overlapWithWall) + nextCaveTop

            nextObstaclePosition = l
          } else {
            nextObstaclePosition = -1
          }


          // Consistency check between columnHistory and determinstic RNG
          if (replayCol) {
            let ctMatch = nextCaveTop - replayCol.caveTop
            let cbMatch = nextCaveBottom - replayCol.caveBottom
            let oMatch = nextObstaclePosition - replayCol.obstaclePosition
            if (ctMatch + cbMatch + oMatch > 0) {
              console.log(`Comparing to replayCol: ${ctMatch} ${cbMatch} ${oMatch}`)
            }
          }


          this.gameState.advance(adjustedTimestamp)

          this.gameState.lastColumn().caveTop = nextCaveTop
          this.gameState.lastColumn().caveBottom = nextCaveBottom
          this.gameState.lastColumn().obstaclePosition = nextObstaclePosition

          if (DEBUG_STORE_COLUMNHISTORY) {
            this.gameState.columnHistory.addColumn(this.gameState.lastColumn())
          }
        }


        let gameDidAdvance = shouldAdvance
        this.gameRenderer.drawFrame(timestamp)


        if (!this.gameState.isYPositionSafe()) {
          this.lastScore = this.gameState.score(timestamp)
          this.gameState.finalScore = this.lastScore
          this.gameState.isHighScore = this.lastScore > this.highScore

          if (this.gameState.isHighScore) {
            this.highScore = this.lastScore
            this.saveHighScoreToStorage()
          }

          this.addReplay(this.gameState.createReplay())

          this.soundEffects.fadeOut()

          if (this.soundEffectsEnabled) {
            this.soundEffects.playSound("shatter")
          }

          console.log("Game over. Score: " + this.lastScore)
          this.userIsPressing = false
          this.state = MAState.GameOverScreen
        }

        break
      }



      case MAState.GameOverScreen: {
        let animationIsOver = this.gameState.deathAnimationStep >= 40

        let timeSinceLastUpdate = timestamp - this.gameState.timestampOfLastUpdate
        let readyForNextUpdate = this.gameState.deathAnimationStep == 0 || timeSinceLastUpdate > 20

        if (!animationIsOver && readyForNextUpdate) {
          this.gameRenderer.updateDeathScreen()
          this.gameState.deathAnimationStep++
          this.gameState.timestampOfLastUpdate = timestamp
        }

        if (animationIsOver) {
          if (this.gameRenderer.gameOverStartTimestamp == 0) {
            this.gameRenderer.gameOverStartTimestamp = timestamp

            let fullscreenBG = document.getElementById("fullscreenBackground")
            fullscreenBG.style.transition = 'opacity 1s ease-out'
            fullscreenBG.style.opacity = '0'
            setTimeout(() => {
              fullscreenBG.style.zIndex = '-2'
              this.inFullscreenMode = false
            }, 1000)
          }

          // Avoid unnecessary drawing by stopping after any animation is complete
          if (this.gameRenderer.gameOverStartTimestamp + 1000 > timestamp) {
            this.gameRenderer.drawGameOverScoreScreen(this.lastScore, this.gameState.isHighScore, timestamp)
          }
        }

        if (animationIsOver && this.userIsPressing) {
          this.userIsPressing = false
          this.soundEffects.stop()
          this.state = MAState.IntroScreen
        }
      }
        break

      default:
    }

    let advanceGameLoopEnd = performance.now()
    // console.log("advanceGameLoopDelta: " + (advanceGameLoopEnd-advanceGameLoopStart) + "ms")

    this.prevGameLoopTimestamp = timestamp
  }
}

