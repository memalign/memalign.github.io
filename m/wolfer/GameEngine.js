const MAUserActionType = {
  Left: 0,
  Right: 1,
  Up: 2,
  Down: 3,
  Eat: 4,

  toDirection: function(userAction) {
    if (userAction === this.Left) {
      return MADirection.Left
    } else if (userAction === this.Right) {
      return MADirection.Right
    } else if (userAction === this.Up) {
      return MADirection.Up
    } else if (userAction === this.Down) {
      return MADirection.Down
    } else {
      return MADirection.None
    }
  },
}
Object.freeze(MAUserActionType)


// Support unit testing with NodeJS
if (typeof module !== 'undefined' && module.exports) {
  ({ MAEventType, MAEvent, MAMoveEvent } = require('./Events'));
  ({ MAGameState } = require('./GameState'));
  ({ MAGameGenerator } = require('./GameGenerator'));
  ({ MARunloop } = require('./Runloop'));
  ({ MATroggleController } = require('./TroggleController'));
}



// Responsibilities:
// Translate user input into actions performed on the game
class MAMuncherMoveController {
  constructor() {
  }

  pointsForValue(gameState) {
    if (gameState.level < 4) {
      return 5
    }
    return (gameState.level-2)*5
  }

  handleUserActionOnCell(gameEngine, x, y) {
    let gameState = gameEngine.gameState

    let muncherXY = gameState.grid.muncherXY()
    if (muncherXY) {
      let muncherX = muncherXY[0]
      let muncherY = muncherXY[1]

      if (muncherX == x && muncherY == y) {
        let val = gameState.grid.removeValueAt(x, y)
        if (val !== null) {
          let isGoodEat = gameState.currentLevelMatchingValues.includes(val)

          if (isGoodEat) {
            let points = this.pointsForValue(gameState)
            let oldScore = gameState.currentScore
            gameState.currentScore += points

            gameEngine.didPerformActionCallback(new MAEvent(MAEventType.Munch, x, y));

            // Check for extra life
            let oldThreshold = Math.floor(oldScore / 1000)
            let newThreshold = Math.floor(gameState.currentScore / 1000)

            if (newThreshold > oldThreshold && gameState.strikes > 0) {
              gameState.strikes--
              gameEngine.didPerformActionCallback(new MAEvent(MAEventType.ExtraLife, x, y));
            }

            // Check if the level is cleared
            if (gameState.grid.allMatchingValuesCleared(gameState.currentLevelMatchingValues)) {
              gameEngine.didPerformActionCallback(new MAEvent(MAEventType.LevelCleared, x, y));
            }
          } else {
            const level = gameEngine.gameState.level;
            const reason = gameEngine.gameGenerator.failureStringForValue(level, val);

            gameEngine.handleMunchedBadEat();

            gameEngine.didPerformActionCallback(new MAEvent(MAEventType.MunchedBadEat, x, y, reason));
          }

        }

      } else {

        // Determine the direction to move
        var direction = MADirection.None
        let dx = x - muncherX
        let dy = y - muncherY

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            direction = MADirection.Right
          } else {
            direction = MADirection.Left
          }
        } else {
          if (dy > 0) {
            direction = MADirection.Down
          } else {
            direction = MADirection.Up
          }
        }

        let occupantInDestination = gameState.grid.occupantInDirection(muncherX, muncherY, direction)
        if (occupantInDestination == null) {
          // Update muncher's direction (only for left/right, as we only have art for these directions)
          let muncher = gameState.grid.cellAt(muncherX, muncherY).occupant
          if (direction === MADirection.Left || direction === MADirection.Right) {
            muncher.direction = direction
          }
          gameState.grid.moveMuncherInDirection(direction)

          // Create a movement event
          let newXY = gameState.grid.xyInDirection(muncherX, muncherY, direction);

          gameEngine.didPerformActionCallback(new MAMoveEvent(MAEventType.MuncherMove, muncherX, muncherY, newXY[0], newXY[1], muncher.direction));

        } else if (occupantInDestination.isTroggle()) {
          let muncher = gameState.grid.cellAt(muncherX, muncherY).occupant
          let newXY = gameState.grid.xyInDirection(muncherX, muncherY, direction)

          // The muncher moves, and then the troggle munches the muncher
          let moveEvent = new MAMoveEvent(MAEventType.MuncherMove, muncherX, muncherY, newXY[0], newXY[1], muncher.direction);
          let eatsEvent = new MAEvent(MAEventType.TroggleEatsMuncher, newXY[0], newXY[1], gameEngine.troggleController._deathStringForTroggle(occupantInDestination));

          gameEngine.didPerformActionCallback(moveEvent);

          gameEngine.handleTroggleEatsMuncher();

          gameEngine.didPerformActionCallback(eatsEvent);
        }
      }
    }
  }
}

// Responsibilities:
// Places and removes a safe tile on the grid
class MASafeSquareController {
  constructor() {
    this.minSafeTime = 8; // seconds
    this.maxSafeTime = 15; // seconds
  }

  handleGameLoopIteration(gameEngine) {
    const gameState = gameEngine.gameState;
    let safeX = gameState.grid.width;
    let safeY = gameState.grid.height;

    let didAddSafeSquare = false;
    let didRemoveSafeSquare = false;

    // Find existing safe square
    for (let x = 0; x < gameState.grid.width; x++) {
      for (let y = 0; y < gameState.grid.height; y++) {
        const cell = gameState.grid.cellAt(x, y);
        if (cell.isSafeBox && cell.safeDate) {
          safeX = x;
          safeY = y;
          break;
        }
      }
      if (safeX < gameState.grid.width) break;
    }

    if (safeX < gameState.grid.width && safeY < gameState.grid.height) {
      // Existing safe square, check if it should be removed
      const cell = gameState.grid.cellAt(safeX, safeY);
      const safeTime = (Date.now() - cell.safeDate.getTime()) / 1000; // seconds

      if (safeTime > this.minSafeTime) {
        const removeProb = (this._randomInt(2) === 0);
        if (removeProb || safeTime > this.maxSafeTime) {
          cell.isSafeBox = false;
          cell.safeDate = null;
          didRemoveSafeSquare = true;
        }
      }
    } else {
      // No safe square, try to add one
      const addProb = (this._randomInt(2) === 0);
      if (addProb) {
        safeX = this._randomInt(gameState.grid.width);
        safeY = this._randomInt(gameState.grid.height);
        const cell = gameState.grid.cellAt(safeX, safeY);
        cell.isSafeBox = true;
        cell.safeDate = new Date();
        didAddSafeSquare = true;
      }
    }

    if (safeX < gameState.grid.width && safeY < gameState.grid.height) {
      const cell = gameState.grid.cellAt(safeX, safeY);
      if (cell.occupant && cell.occupant.isTroggle() && cell.isSafeBox) {
        // Troggle dies in safe square
        gameEngine.didPerformActionCallback(new MAEvent(MAEventType.TroggleDiesInSafeSquare, safeX, safeY, null, cell.occupant.type));
        cell.occupant = null;
        cell.isSafeBox = false;
        cell.safeDate = null;
      } else {
        // If the safe square changed, update the view
        if (didAddSafeSquare) {
          gameEngine.didPerformActionCallback(new MAEvent(MAEventType.SafeSquareAdded, safeX, safeY));
        } else if (didRemoveSafeSquare) {
          gameEngine.didPerformActionCallback(new MAEvent(MAEventType.SafeSquareRemoved, safeX, safeY));
        }
      }
    }
  }

  _randomInt(upperBound) {
    return MAUtils.randomInt(upperBound);
  }
}

// Responsibilities:
// Glues together game logic and game state
class MAGameEngine {
  // Properties:
  // - gameState (MAGameState instance)
  // - gameGenerator (MAGameGenerator instance)
  // - muncherMoveController (MAMuncherMoveController instance)
  // - safeSquareController (MASafeSquareController instance)
  // - troggleController (MATroggleController instance)
  // - runloop (MARunloop instance)
  // - animationController (AnimationController instance)
  constructor(gameGenerator) {
    this.gameState = new MAGameState()
    this.gameGenerator = gameGenerator ? gameGenerator : new MAGameGenerator()
    this.muncherMoveController = new MAMuncherMoveController()

    this.safeSquareController = new MASafeSquareController()

    this.runloop = new MARunloop()
    this.animationController = null; // set later by GameController

    this.troggleController = new MATroggleController(this);

    this.maxStrikes = 3 // number of strikes allowed before game over
    this.isPaused = false
  }

  startNewGame() {
    const highScore = this.gameState ? this.gameState.highScore : 0
    this.gameState = new MAGameState()
    this.gameState.highScore = highScore

    this.startCurrentRound()
  }

  startCurrentRound() {
    this.isPaused = false
    this.gameState.grid.clearSafeSquares()
    this.gameState.grid.clearTroggles()
    this.populateGridForCurrentLevel()

    this.troggleController.startTroggleLoop();
    this.runGameLoop()
  }

  pauseGame() {
    this.isPaused = true
    this.troggleController.stopTroggleLoop();
  }

  unpauseGame() {
    this.gameState.grid.placeMuncher();
    this.isPaused = false
    this.troggleController.startTroggleLoop();
    this.runGameLoop()
  }

  runGameLoop() {
    if (this.isPaused) { return; }

    let ge = this
    this.runloop.runFunctionAfterDelay(function() {
      if (this.isPaused) { return; }

      ge.safeSquareController.handleGameLoopIteration(ge)

      ge.runGameLoop()
    }, 1)
  }

  // Helper function for other controllers to use which checks whether
  // game is paused. Important to check this so game state and UI are
  // not modified while the game is paused.
  runFunctionAfterDelay(func, delay) {
    let ge = this;
    this.runloop.runFunctionAfterDelay(function() {
      ge.animationController.enqueueFunction(function() {
        if (ge.isPaused) { return; }
        func();
      })
    }, delay);
  }

  advanceToNextLevel() {
    this.gameState.level++
    this.startCurrentRound()
  }

  populateGridForCurrentLevel() {
    let matchingValues = this.gameGenerator.generateMatchingValuesForLevel(this.gameState.level)
    let nonMatchingValues = this.gameGenerator.generateNonMatchingValuesForLevel(this.gameState.level)

    this.gameState.currentLevelMatchingValues = matchingValues
    this.gameState.currentLevelNonMatchingValues = nonMatchingValues
    this.gameState.grid.populate(matchingValues, nonMatchingValues)
    this.gameState.grid.placeMuncher()
  }

  // Internal, performs action synchronously
  _handleUserActionOnCell(x, y) {
    if (this.isPaused) { return; }

    this.muncherMoveController.handleUserActionOnCell(this, x, y)
  }

  handleUserActionOnCell(x, y) {
    this.animationController.enqueueFunction(() => {
      this._handleUserActionOnCell(x, y)
    })
  }

  _handleStrike() {
    this.gameState.strikes++
    if (this.gameState.strikes >= this.maxStrikes) {
      this.gameState.gameIsOver = true;
    }
    this.pauseGame()
  }

  handleMunchedBadEat() {
    this._handleStrike()
  }

  handleTroggleEatsMuncher() {
    this.gameState.grid.removeMuncher();
    this._handleStrike()
  }

  handleUserAction(action /* MAUserActionType */) {
    this.animationController.enqueueFunction(() => {
      if (this.isPaused) { return; }

      // Convert action into an action on a specific cell

      let muncherXY = this.gameState.grid.muncherXY()
      if (muncherXY) {
        let muncherX = muncherXY[0]
        let muncherY = muncherXY[1]

        let xy = this.gameState.grid.xyInDirection(muncherX, muncherY, MAUserActionType.toDirection(action))

        let cell = this.gameState.grid.cellAt(xy[0], xy[1])
        if (cell) {
          // Need to use the synchronous version of this method to avoid
          // any other code moving muncher before we can process this action.
          // If muncher location is updated separately before this is handled, then we could end up accidentally interpreting this as action on the cell muncher was already in (which would perform a munch the user never intended).
          this._handleUserActionOnCell(xy[0], xy[1])
        }
      }
    })
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MAUserActionType,
    MAEventType,
    MAEvent,
    MAMuncherMoveController,
    MASafeSquareController,
    MAGameEngine
  };
}
