
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


class UnitTests {

// MAGameGenerator

  test_MAGameGenerator_allPuzzlesAreUniqueAndValid() {
    let gg = new MAGameGenerator()
    assertEqual(gg.levels.length, 240)

    let uniqueLevels = gg.levels.filter((val, index, arr) => arr.indexOf(val) === index)
    assertEqual(uniqueLevels.length, gg.levels.length)

    let levelsWithValidFormat = gg.levels.filter(lvl => /[x\-]{5}\|[x\-]{5}\|[x\-]{5}\|[x\-]{5}\|[x\-]{5}/.test(lvl))
    assertEqual(levelsWithValidFormat.length, gg.levels.length)
  }

// MAGameEngine

  test_MAGameEngine_resumeLoadedGame() {
    let changeCount = 0
    let ge = new MAGameEngine()
    ge.didPerformChangeCallback = function () {
      changeCount++
    }

    ge.startNewGame(2, [0, 1])

    let cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.level, 2)
    assertEqual(ge.gameState.grid.toString(), "--x--|--x--|xx-xx|--x--|--x--")

    assertEqualArrays(ge.gameState.completedLevels, [0, 1])
    assertEqual(ge.levelsCompleted(), 2)
    assertEqual(ge.currentLevelPreviouslyCompleted(), false)
  }

  test_MAGameEngine_resumeLoadedGame_alreadyBeatLevel() {
    let changeCount = 0
    let ge = new MAGameEngine()
    ge.didPerformChangeCallback = function () {
      changeCount++
    }

    ge.startNewGame(2, [0, 2])

    let cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.level, 2)
    assertEqual(ge.gameState.grid.toString(), "--x--|--x--|xx-xx|--x--|--x--")

    assertEqualArrays(ge.gameState.completedLevels, [0, 2])
    assertEqual(ge.levelsCompleted(), 2)
    assertEqual(ge.currentLevelPreviouslyCompleted(), true)
  }

  test_MAGameEngine_resumeLoadedGame_emptyLevel() {
    let changeCount = 0
    let ge = new MAGameEngine()
    ge.didPerformChangeCallback = function () {
      changeCount++
    }

    // Invalid combination
    ge.startNewGame(null, [0])

    let cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.level, 0)
    assertEqual(ge.gameState.grid.toString(), "-x---|xxx--|-x-x-|--xxx|---x-")
  }

  test_MAGameEngine_resumeLoadedGame_emptyCompletedLevels() {
    let changeCount = 0
    let ge = new MAGameEngine()
    ge.didPerformChangeCallback = function () {
      changeCount++
    }

    // Invalid combination
    ge.startNewGame(1, null)

    let cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.level, 0)
    assertEqual(ge.gameState.grid.toString(), "-x---|xxx--|-x-x-|--xxx|---x-")
  }

  test_MAGameEngine_resetLevel() {
    let changeCount = 0
    let ge = new MAGameEngine()
    ge.didPerformChangeCallback = function () {
      changeCount++
    }

    ge.startNewGame(null, null)

    let cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.level, 0)
    assertEqual(ge.gameState.grid.toString(), "-x---|xxx--|-x-x-|--xxx|---x-")

    ge.handleUserActionOnCell(0, 0)
    assertEqual(ge.gameState.grid.toString(), "x----|-xx--|-x-x-|--xxx|---x-")

    ge.resetLevel()

    cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.level, 0)
    assertEqual(ge.gameState.grid.toString(), "-x---|xxx--|-x-x-|--xxx|---x-")
  }

  test_MAGameEngine_nextLevel_previousLevel() {
    let changeCount = 0
    let ge = new MAGameEngine()
    ge.didPerformChangeCallback = function () {
      changeCount++
    }

    ge.startNewGame(null, null)


    let cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.grid.toString(), "-x---|xxx--|-x-x-|--xxx|---x-")


    assertEqual(ge.gameState.level, 0)
    ge.goToNextLevel()


    cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)


    assertEqual(ge.gameState.level, 1)
    assertEqual(ge.gameState.grid.toString(), "xx-xx|x---x|-----|x---x|xx-xx")

    assertEqualArrays(ge.gameState.completedLevels, [])


    ge.goToPreviousLevel()


    cc = changeCount

    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)

    assertEqual(ge.acceptUserInput, true)


    assertEqual(ge.gameState.level, 0)
    assertEqual(ge.gameState.grid.toString(), "-x---|xxx--|-x-x-|--xxx|---x-")

    assertEqualArrays(ge.gameState.completedLevels, [])
  }

  test_MAGameEngine_everyLevelIsBeatable_endGameCelebrationOccurs() {
    let changeCount = 0
    let ge = new MAGameEngine()
    ge.didPerformChangeCallback = function () {
      changeCount++
    }

    ge.startNewGame(null, null)

    while (ge.levelsCompleted() < ge.levelCount()) {
      //console.log(`Attempting to beat level ${ge.gameState.level}`)

      let cc = changeCount

      assertEqual(ge.acceptUserInput, false)
      // animation is queued up
      assertEqual(ge.runloop.scheduledEvents.length > 25, true)

      ge.runloop.runloopTimerScheduledTimeMillis -= 10000
      ge.runloop.runloopTimerFired()
      assertEqual(ge.runloop.scheduledEvents.length, 0)


      assertEqual(changeCount-cc > 25, true)

      assertEqual(ge.acceptUserInput, true)

      assertEqual(ge.gameState.grid.toString(), ge.gameGenerator.levels[ge.gameState.level])

      for (let i = 0; i < 2; i++) {
        let levelIsBeaten = false
        // Solve the level using the "chase the lights" algorithm
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 5; c++) {
            if (ge.gameState.grid.cellAt(c, r).isLit) {
              ge.handleUserActionOnCell(c, r+1)

              // if this beats the level, break out
              levelIsBeaten = ge.gameState.grid.isGridClear()
              if (levelIsBeaten) {
                break
              }
            }
          }

          if (levelIsBeaten) {
            break
          }
        }

        levelIsBeaten = ge.gameState.grid.isGridClear()

        if (!levelIsBeaten) {
          // Check bottom row against patterns
          let g = ge.gameState.grid
          let bottomRowStr = `${g.cellAt(0, 4).isLit ? "1" : "0"}` + `${g.cellAt(1, 4).isLit ? "1" : "0"}` + `${g.cellAt(2, 4).isLit ? "1" : "0"}` + `${g.cellAt(3, 4).isLit ? "1" : "0"}` + `${g.cellAt(4, 4).isLit ? "1" : "0"}`

          // Patterns from: https://www.westga.edu/~cleach/publications/lightchasingMM.pdf
          if (bottomRowStr == "00111") {
            ge.handleUserActionOnCell(3, 0)
          } else if (bottomRowStr == "01010") {
            ge.handleUserActionOnCell(0, 0)
            ge.handleUserActionOnCell(3, 0)
          } else if (bottomRowStr == "01101") {
            ge.handleUserActionOnCell(0, 0)
          } else if (bottomRowStr == "10110") {
            ge.handleUserActionOnCell(4, 0)
          } else if (bottomRowStr == "10001") {
            ge.handleUserActionOnCell(0, 0)
            ge.handleUserActionOnCell(1, 0)
          } else if (bottomRowStr == "11011") {
            ge.handleUserActionOnCell(2, 0)
          } else if (bottomRowStr == "11100") {
            ge.handleUserActionOnCell(1, 0)
          } else {
            assertTrue(false, `Level index ${ge.gameState.level} is unbeatable with bottom row ${bottomRowStr}`)
          }
        }
      }

    }

    // Check that the final level celebration is happening
    assertEqual(ge.isCyclingThroughLevels, true)
    assertEqual(ge.alreadyCycledThroughLevels, true)
    assertEqual(ge.acceptUserInput, true)


    // Starting the cycle through levels is enqueued
    assertEqual(ge.runloop.scheduledEvents.length, 1)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 1) // next cycle is enqueued

    assertEqual(ge.gameState.level, 0)
    assertEqual(ge.isCyclingThroughLevels, true)
    assertEqual(ge.alreadyCycledThroughLevels, true)
    assertEqual(ge.acceptUserInput, true)

    // Next cycle
    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 1) // next cycle is enqueued

    assertEqual(ge.gameState.level, 1)
    assertEqual(ge.isCyclingThroughLevels, true)
    assertEqual(ge.alreadyCycledThroughLevels, true)
    assertEqual(ge.acceptUserInput, true)


    // Interrupt it with user input
    ge.handleUserActionOnCell(0, 0)
    assertEqual(ge.runloop.scheduledEvents.length, 1)
    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)


    assertEqual(ge.gameState.level, 1)
    assertEqual(ge.isCyclingThroughLevels, false)
    assertEqual(ge.alreadyCycledThroughLevels, true)
    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.grid.toString(), "xx-xx|x---x|-----|x---x|xx-xx")

    // Beat the level
    ge.handleUserActionOnCell(0, 0)
    ge.handleUserActionOnCell(4, 0)
    ge.handleUserActionOnCell(0, 4)
    ge.handleUserActionOnCell(4, 4)

    // Confirm that we transition to the next level and do not continue cycling
    let cc = changeCount
    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)
    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)
    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.level, 2)


    assertEqual(ge.levelsCompleted(), ge.levelCount())
  }

  test_MAGameEngine_completeGameNotOnLastLevel() {
    let changeCount = 0
    let ge = new MAGameEngine()
    ge.didPerformChangeCallback = function () {
      changeCount++
    }

    // Skipped level 0
    ge.startNewGame(1, [])

    while (ge.levelsCompleted() < ge.levelCount()-1) {
      //console.log(`Attempting to beat level ${ge.gameState.level}`)

      let cc = changeCount

      assertEqual(ge.acceptUserInput, false)
      // animation is queued up
      assertEqual(ge.runloop.scheduledEvents.length > 25, true)

      ge.runloop.runloopTimerScheduledTimeMillis -= 10000
      ge.runloop.runloopTimerFired()
      assertEqual(ge.runloop.scheduledEvents.length, 0)


      assertEqual(changeCount-cc > 25, true)

      assertEqual(ge.acceptUserInput, true)

      assertEqual(ge.gameState.grid.toString(), ge.gameGenerator.levels[ge.gameState.level])

      for (let i = 0; i < 2; i++) {
        let levelIsBeaten = false
        // Solve the level using the "chase the lights" algorithm
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 5; c++) {
            if (ge.gameState.grid.cellAt(c, r).isLit) {
              ge.handleUserActionOnCell(c, r+1)

              // if this beats the level, break out
              levelIsBeaten = ge.gameState.grid.isGridClear()
              if (levelIsBeaten) {
                break
              }
            }
          }

          if (levelIsBeaten) {
            break
          }
        }

        levelIsBeaten = ge.gameState.grid.isGridClear()

        if (!levelIsBeaten) {
          // Check bottom row against patterns
          let g = ge.gameState.grid
          let bottomRowStr = `${g.cellAt(0, 4).isLit ? "1" : "0"}` + `${g.cellAt(1, 4).isLit ? "1" : "0"}` + `${g.cellAt(2, 4).isLit ? "1" : "0"}` + `${g.cellAt(3, 4).isLit ? "1" : "0"}` + `${g.cellAt(4, 4).isLit ? "1" : "0"}`

          // Patterns from: https://www.westga.edu/~cleach/publications/lightchasingMM.pdf
          if (bottomRowStr == "00111") {
            ge.handleUserActionOnCell(3, 0)
          } else if (bottomRowStr == "01010") {
            ge.handleUserActionOnCell(0, 0)
            ge.handleUserActionOnCell(3, 0)
          } else if (bottomRowStr == "01101") {
            ge.handleUserActionOnCell(0, 0)
          } else if (bottomRowStr == "10110") {
            ge.handleUserActionOnCell(4, 0)
          } else if (bottomRowStr == "10001") {
            ge.handleUserActionOnCell(0, 0)
            ge.handleUserActionOnCell(1, 0)
          } else if (bottomRowStr == "11011") {
            ge.handleUserActionOnCell(2, 0)
          } else if (bottomRowStr == "11100") {
            ge.handleUserActionOnCell(1, 0)
          } else {
            assertTrue(false, `Level index ${ge.gameState.level} is unbeatable with bottom row ${bottomRowStr}`)
          }
        }
      }

    }


    let cc = changeCount
    assertEqual(ge.acceptUserInput, false)
    // animation is queued up for beating the level
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)
    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)
    assertEqual(changeCount-cc > 25, true)
    assertEqual(ge.acceptUserInput, true)

    // Check that final celebration is NOT happening
    assertEqual(ge.isCyclingThroughLevels, false)
    assertEqual(ge.alreadyCycledThroughLevels, false)
    assertEqual(ge.gameState.level, ge.levelCount()-1) // couldn't advance beyond last level
    assertEqual(ge.currentLevelPreviouslyCompleted(), true)

    // Skip to the 0th level to complete it
    while (ge.gameState.level != 0) {
      ge.goToPreviousLevel()

      let cc = changeCount
      assertEqual(ge.acceptUserInput, false)
      // animation is queued up for skipping level
      assertEqual(ge.runloop.scheduledEvents.length > 25, true)
      ge.runloop.runloopTimerScheduledTimeMillis -= 10000
      ge.runloop.runloopTimerFired()
      assertEqual(ge.runloop.scheduledEvents.length, 0)
      assertEqual(changeCount-cc > 25, true)
      assertEqual(ge.acceptUserInput, true)
    }

    assertEqual(ge.gameState.level, 0)
    assertEqual(ge.gameState.grid.toString(), "-x---|xxx--|-x-x-|--xxx|---x-")
    assertEqual(ge.currentLevelPreviouslyCompleted(), false)

    // Beat the level
    ge.handleUserActionOnCell(1, 1)
    ge.handleUserActionOnCell(3, 3)


    // Check that the final level celebration is happening
    assertEqual(ge.isCyclingThroughLevels, true)
    assertEqual(ge.alreadyCycledThroughLevels, true)
    assertEqual(ge.acceptUserInput, true)


    // Starting the cycle through levels is enqueued
    assertEqual(ge.runloop.scheduledEvents.length, 1)

    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 1) // next cycle is enqueued

    assertEqual(ge.gameState.level, 1)
    assertEqual(ge.isCyclingThroughLevels, true)
    assertEqual(ge.alreadyCycledThroughLevels, true)
    assertEqual(ge.acceptUserInput, true)

    // Next cycle
    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 1) // next cycle is enqueued

    assertEqual(ge.gameState.level, 2)
    assertEqual(ge.isCyclingThroughLevels, true)
    assertEqual(ge.alreadyCycledThroughLevels, true)
    assertEqual(ge.acceptUserInput, true)


    // Interrupt it with user input
    ge.handleUserActionOnCell(0, 0)
    assertEqual(ge.runloop.scheduledEvents.length, 1)
    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)


    assertEqual(ge.gameState.level, 2)
    assertEqual(ge.isCyclingThroughLevels, false)
    assertEqual(ge.alreadyCycledThroughLevels, true)
    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.grid.toString(), "--x--|--x--|xx-xx|--x--|--x--")

    // Beat the level
    ge.handleUserActionOnCell(2, 1)
    ge.handleUserActionOnCell(1, 2)
    ge.handleUserActionOnCell(3, 2)
    ge.handleUserActionOnCell(2, 3)

    // Confirm that we transition to the next level and do not continue cycling
    cc = changeCount
    assertEqual(ge.acceptUserInput, false)
    // animation is queued up
    assertEqual(ge.runloop.scheduledEvents.length > 25, true)
    ge.runloop.runloopTimerScheduledTimeMillis -= 10000
    ge.runloop.runloopTimerFired()
    assertEqual(ge.runloop.scheduledEvents.length, 0)

    assertEqual(changeCount-cc > 25, true)
    assertEqual(ge.acceptUserInput, true)

    assertEqual(ge.gameState.level, 3)


    assertEqual(ge.levelsCompleted(), ge.levelCount())
  }

  disabled_test_generateLevels() {
    let grid = new MAGameGrid(5, 5)

    for (let numTaps = 3; numTaps <= 8; numTaps++) {
      MALog.log(`Puzzles that take ${numTaps} taps:`)
      for (let i = 0; i < 20; i++) {
        grid.turnOffAllCells()

        for (let tapI = 0; tapI < numTaps; tapI++) {
          let randX = Math.floor(Math.random() * (4-0+1)) + 0
          let randY = Math.floor(Math.random() * (4-0+1)) + 0
          grid.toggleCellAndNeighbors(randX, randY)
        }

        MALog.log(`"${grid.toString()}",`)
      }
    }
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
