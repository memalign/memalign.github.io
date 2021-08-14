class MARunloopEvent {
  // Properties:
  // - fnToRun (function)
  // - secondsToWait (float, seconds to wait (can be fractional) before executing fnToRun)
  constructor(fnToRun, secondsToWait) {
    this.fnToRun = fnToRun
    this.secondsToWait = secondsToWait
  }
}

class MARunloop {
  // Properties:
  // - scheduledEvents (array of MARunloopEvent instances)
  constructor() {
    this.scheduledEvents = []
    this.runloopTimerScheduledTimeMillis = null
  }

  runFunctionAfterDelay(fnToRun, delayInSeconds) {
    // The events already in the queue have a delayInSeconds value for time that has already elapsed since the runloop timer was scheduled
    // When the timer fires, we will subtract the number of seconds that elapsed since it was scheduled
    // To wait the full intended delayInSeconds, we need to artificially add the time that already elapsed before this event is being enqueued.
    if (this.runloopTimerScheduledTimeMillis) {
      let now = Date.now()
      let delta = now - this.runloopTimerScheduledTimeMillis
      if (delta > 0) {
        // To have the same time basis as the other events in the queue
        // backdate our delayInSeconds based on the timer that's already scheduled
        delayInSeconds += delta/1000
      }
    }
    let rEvent = new MARunloopEvent(fnToRun, delayInSeconds)
    this.scheduledEvents.push(rEvent)
    this.scheduleRunloopTimerIfNecessary()
  }

  runloopTimerFired() {
    let eventsToRun = []
    if (this.runloopTimerScheduledTimeMillis) {

      let now = Date.now()
      let delta = now - this.runloopTimerScheduledTimeMillis
      if (delta > 0) {
        for (let rEvent of this.scheduledEvents) {
          rEvent.secondsToWait -= delta/1000
        }

        // Sort from smallest to largest seconds to wait (so most negative will be first)
        eventsToRun = this.scheduledEvents.filter(x => x.secondsToWait <= 0).sort((a, b) => a.secondsToWait - b.secondsToWait)

        this.scheduledEvents = this.scheduledEvents.filter(x => x.secondsToWait > 0)
      }

      this.runloopTimerScheduledTimeMillis = null
    }

    this.scheduleRunloopTimerIfNecessary()

    for (let rEvent of eventsToRun) {
      rEvent.fnToRun()
    }
  }

  scheduleRunloopTimerIfNecessary() {
    if (this.scheduledEvents.length <= 0) {
      return
    }
    // Pick the smallest secondsToWait and then schedule a timer
    // Before scheduling a new timer, I could be more clever about checking whether the timer that's already scheduled will fire soon enough for the ripest event but I figure that extra efficiency isn't worth the risk of a subtle bug
    let smallestSecondsToWait = this.scheduledEvents[0].secondsToWait
    for (let rEvent of this.scheduledEvents) {
      if (rEvent.secondsToWait < smallestSecondsToWait) {
        smallestSecondsToWait = rEvent.secondsToWait
      }
    }

    if (this.runloopTimerScheduledTimeMillis) {
      let now = Date.now()
      let deltaMillis = now - this.runloopTimerScheduledTimeMillis
      if (deltaMillis > 0) {
        smallestSecondsToWait = Math.max(0.001, smallestSecondsToWait-deltaMillis)
      }
    }

    // The secondsToWait are based on when the timer was originally scheduled
    // Keep the same time basis if a timer was already scheduled
    if (!this.runloopTimerScheduledTimeMillis) {
      this.runloopTimerScheduledTimeMillis = Date.now()
    }

    let rl = this
    setTimeout(function() {
      rl.runloopTimerFired()
    }, smallestSecondsToWait*1000)
  }
}

// Responsibilities:
// Glues together game logic and game state
// Performs animations to transition between levels
class MAGameEngine {
  // Properties:
  // - gameState (MAGameState instance)
  // - gameGenerator (MAGameGenerator instance)
  // - runloop (MARunloop instance)
  // - acceptUserInput (boolean)
  // - isCyclingThroughLevels (boolean)
  // - alreadyCycledThroughLevels (boolean)
  constructor() {
    this.gameState = new MAGameState()
    this.gameGenerator = new MAGameGenerator()
    this.runloop = new MARunloop()

    this.acceptUserInput = false
    this.isCyclingThroughLevels = false
    this.alreadyCycledThroughLevels = false
  }

  startNewGame(loadedLevel, loadedCompletedLevels) {
    this.gameState.level = 0

    if (loadedLevel !== null && loadedCompletedLevels !== null) {
      this.gameState.level = loadedLevel
      this.gameState.completedLevels = loadedCompletedLevels
    }

    this.acceptUserInput = false

    let ge = this
    this.performStartupLightFlourishWithCompletion(function() {
      ge.populateGridForCurrentLevel()
      ge.acceptUserInput = true

      ge.didPerformChangeCallback()
    })
  }

  goToPreviousLevel() {
    if (this.gameState.level <= 0) {
      return
    }

    this.gameState.level--
    this.acceptUserInput = false

    this.gameState.grid.turnOffAllCells()
    this.didPerformChangeCallback()

    let ge = this
    this.performPrevLightFlourishWithCompletion(function() {
      ge.populateGridForCurrentLevel()
      ge.acceptUserInput = true

      ge.didPerformChangeCallback()
    })
  }

  goToNextLevel() {
    if (this.gameState.level >= this.levelCount()-1) {
      return
    }

    this.gameState.level++
    this.acceptUserInput = false

    this.gameState.grid.turnOffAllCells()
    this.didPerformChangeCallback()

    let ge = this
    this.performNextLightFlourishWithCompletion(function() {
      ge.populateGridForCurrentLevel()
      ge.acceptUserInput = true

      ge.didPerformChangeCallback()
    })
  }

  resetLevel() {
    this.acceptUserInput = false

    this.gameState.grid.turnOffAllCells()
    let emittedEvent = null
    this.didPerformChangeCallback()

    let ge = this
    this.performResetLightFlourishWithCompletion(function() {
      ge.populateGridForCurrentLevel()
      ge.acceptUserInput = true

      ge.didPerformChangeCallback()
    })
  }

  currentLevelPreviouslyCompleted() {
    return this.gameState.completedLevels.includes(this.gameState.level)
  }

  levelCount() {
    return this.gameGenerator.levels.length
  }

  levelsCompleted() {
    return this.gameState.completedLevels.length
  }

  performLightSequenceWithCompletion(sequence, delayBetweenItemsInSeconds, completion) {
    let lightDelay = 0
    for (let index of sequence) {
      let ge = this

      this.runloop.runFunctionAfterDelay(function() {
        ge.gameState.grid.toggleCellAtIndex(index)
        ge.didPerformChangeCallback()
      }, lightDelay)
      lightDelay += delayBetweenItemsInSeconds

      this.runloop.runFunctionAfterDelay(function() {
        ge.gameState.grid.toggleCellAtIndex(index)
        ge.didPerformChangeCallback()
      }, lightDelay)
    }

    lightDelay += delayBetweenItemsInSeconds

    if (completion) {
      this.runloop.runFunctionAfterDelay(function() {
        completion()
      }, lightDelay)
    }
  }

  performWinFlourishWithCompletion(completion) {
    let spiralSequence = [0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 10, 5, 6, 7, 8, 13, 18, 17, 16, 11, 12]
    this.performLightSequenceWithCompletion(spiralSequence, 0.03, completion)
  }

  performStartupLightFlourishWithCompletion(completion) {
    let lightDelay = 0

    let height = this.gameState.grid.height
    let width = this.gameState.grid.width

    // Columns light up
    for (let c = 0; c < height; c++) {
      for (let r = 0; r < width; r++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }

    // Columns go dark
    for (let c = 0; c < height; c++) {
      for (let r = 0; r < width; r++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }

    // Rows light up
    for (let r = 0; r < width; r++) {
      for (let c = 0; c < height; c++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }

    // Rows go dark
    for (let r = 0; r < width; r++) {
      for (let c = 0; c < height; c++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }

    // Light one by one
    let previousDelay = lightDelay
    for (let r = 0; r < width; r++) {
      for (let c = 0; c < height; c++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }
    lightDelay = previousDelay + 0.05
    for (let r = 0; r < width; r++) {
      for (let c = 0; c < height; c++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }

    if (completion) {
      this.runloop.runFunctionAfterDelay(function() {
        completion()
      }, lightDelay)
    }
  }

  // Flash one by one from top to bottom
  performResetLightFlourishWithCompletion(completion) {
    let lightDelay = 0

    let height = this.gameState.grid.height
    let width = this.gameState.grid.width

    // Light one by one
    let previousDelay = lightDelay
    for (let c = 0; c < height; c++) {
      for (let r = 0; r < width; r++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }
    lightDelay = previousDelay + 0.05
    for (let c = 0; c < height; c++) {
      for (let r = 0; r < width; r++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }

    if (completion) {
      this.runloop.runFunctionAfterDelay(function() {
        completion()
      }, lightDelay)
    }
  }

  // Flash one by one from right to left
  performPrevLightFlourishWithCompletion(completion) {
    let lightDelay = 0

    let height = this.gameState.grid.height
    let width = this.gameState.grid.width

    // Light one by one
    let previousDelay = lightDelay
    for (let r = 0; r < width; r++) {
      for (let c = height-1; c >= 0; c--) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }
    lightDelay = previousDelay + 0.05
    for (let r = 0; r < width; r++) {
      for (let c = height-1; c >= 0; c--) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }

    if (completion) {
      this.runloop.runFunctionAfterDelay(function() {
        completion()
      }, lightDelay)
    }
  }

  // Flash one by one from left to right
  performNextLightFlourishWithCompletion(completion) {
    let lightDelay = 0

    let height = this.gameState.grid.height
    let width = this.gameState.grid.width

    // Light one by one
    let previousDelay = lightDelay
    for (let r = 0; r < width; r++) {
      for (let c = 0; c < height; c++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }
    lightDelay = previousDelay + 0.05
    for (let r = 0; r < width; r++) {
      for (let c = 0; c < height; c++) {
        let ge = this
        let grid = this.gameState.grid
        this.runloop.runFunctionAfterDelay(function() {
          grid.toggleCell(c, r)
          ge.didPerformChangeCallback()
        }, lightDelay)
        lightDelay += 0.05
      }
    }

    if (completion) {
      this.runloop.runFunctionAfterDelay(function() {
        completion()
      }, lightDelay)
    }
  }

  populateGridForCurrentLevel() {
		let puzzleStr = this.gameGenerator.puzzleStringForLevel(this.gameState.level)
    this.gameState.grid.populate(puzzleStr)
  }

  runLevelCycle() {
    if (!this.isCyclingThroughLevels) {
      return
    }

    this.gameState.level = (this.gameState.level + 1) % this.levelCount()
    this.populateGridForCurrentLevel()
    this.didPerformChangeCallback()

    let ge = this
    this.runloop.runFunctionAfterDelay(function() {
      ge.runLevelCycle()
    }, 0.4)
  }

  handleUserActionOnCell(x, y) {
    if (!this.acceptUserInput) {
      console.log("Not accepting user input")
      return
    }

    if (this.isCyclingThroughLevels) {
      this.isCyclingThroughLevels = false
      this.didPerformChangeCallback()
      return
    }

    this.gameState.grid.toggleCellAndNeighbors(x, y)

    if (this.gameState.grid.isGridClear()) {
      this.gameState.noteLevelCompleted(this.gameState.level)


      let gameIsFullyComplete = this.levelsCompleted() == this.levelCount()

      if (gameIsFullyComplete && !this.alreadyCycledThroughLevels) {
        // Cycle through all the levels, letting the user interrupt
        this.isCyclingThroughLevels = true
        this.alreadyCycledThroughLevels = true
        let ge = this
        this.runloop.runFunctionAfterDelay(function() {
          ge.runLevelCycle()
        }, 0.01)

      } else {

        // Go to next level

        this.acceptUserInput = false
        let ge = this
        this.performWinFlourishWithCompletion(function() {
          ge.gameState.level = Math.min(ge.gameState.level+1, ge.levelCount()-1)
          ge.populateGridForCurrentLevel()

          ge.acceptUserInput = true

          ge.didPerformChangeCallback()
        })
      }
    }

    this.didPerformChangeCallback()
  }
}


