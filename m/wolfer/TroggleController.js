if (typeof module !== 'undefined' && module.exports) {
  ({ MACharacterType, MADirection, MACharacter } = require('./GameState'));
  ({ MAEventType, MAEvent } = require('./Events'));
  MAUtils = require('./Utilities');
}

const DEBUG_FORCE_SMARTY = false;
const DEBUG_MANY_TROGGLES = false;


class MATroggleController {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.troggleMoveDelay = 1; // seconds
    this.pendingTroggle = false;
    this.runTroggles = false;
    this.startId = 0;
  }

  _randomElement(arr) {
    return MAUtils.randomElement(arr);
  }

  startTroggleLoop() {
    if (!this.runTroggles) {
      this.startId++;
      this.runTroggles = true;
      this._scheduleCheckTroggleSituation(this.startId);
      this._scheduleTroggleMovement(this.startId);
    }
  }

  stopTroggleLoop() {
    this.runTroggles = false;
    this.pendingTroggle = false;
  }

  _scheduleCheckTroggleSituation(currentStartId) {
    if (this.runTroggles && currentStartId === this.startId) {
      this.gameEngine.runFunctionAfterDelay(() => {
        if (this.runTroggles && currentStartId === this.startId) {
          if (this.pendingTroggle || this._shouldAddTroggle()) {
            this.pendingTroggle = true;
            this.gameEngine.didPerformActionCallback(new MAEvent(MAEventType.TrogglePending));

            this.gameEngine.runFunctionAfterDelay(() => {
              if (this.runTroggles && this.pendingTroggle) {
                this.pendingTroggle = false;

                this._addTroggle();
              }
            }, 3); // 3 seconds delay for troggle to appear
          }
          this._scheduleCheckTroggleSituation(currentStartId);
        }
      }, 10); // Check every 10 seconds
    }
  }

  _shouldAddTroggle() {
    const desiredNumTroggles = DEBUG_MANY_TROGGLES ? 3 : Math.floor(this.gameEngine.gameState.level / 4) + 1;
    let numTroggles = this.pendingTroggle ? 1 : 0;

    const gameState = this.gameEngine.gameState
    for (let x = 0; x < gameState.grid.width; x++) {
      for (let y = 0; y < gameState.grid.height; y++) {
        const cell = gameState.grid.cellAt(x, y);
        if (cell.occupant && cell.occupant.isTroggle()) {
          numTroggles++;
          if (numTroggles >= desiredNumTroggles) {
            return false;
          }
        }
      }
    }
    return numTroggles < desiredNumTroggles;
  }

  _addTroggle() {
    const troggleTypes = [MACharacterType.Reggie, MACharacterType.Bashful, MACharacterType.Helper, MACharacterType.Worker];

    const level = this.gameEngine.gameState.level;
    const gG = this.gameEngine.gameGenerator;
    const canHaveSmarty = gG.isHunterBotAvailableOnLevel(level);
    if (canHaveSmarty) {
      troggleTypes.push(MACharacterType.Smarty);
    }

    const randomTroggleType = DEBUG_FORCE_SMARTY ? MACharacterType.Smarty : this._randomElement(troggleTypes);

    let spotX = 0;
    let spotY = 0;
    let count = 0;

    const gameState = this.gameEngine.gameState
    // Reservoir sampling to choose a random boundary spot
    for (let x = 0; x < gameState.grid.width; x++) {
      for (let y = 0; y < gameState.grid.height; y++) {
        const isBoundary = (x === 0) || (y === 0) || (x === gameState.grid.width - 1) || (y === gameState.grid.height - 1);
        if (!isBoundary) continue;

        count++;
        if (MAUtils.randomInt(count) === 0) {
          spotX = x;
          spotY = y;
        }
      }
    }

    let orientation = MADirection.Right; // Default
    if (spotY === 0) {
      orientation = MADirection.Down;
    } else if (spotY === gameState.grid.height - 1) {
      orientation = MADirection.Up;
    } else if (spotX === 0) {
      orientation = MADirection.Right;
    } else {
      orientation = MADirection.Left;
    }

    const troggle = new MACharacter(randomTroggleType, orientation);
    this._moveTroggle(troggle, spotX, spotY, spotX, spotY);
  }

  _scheduleTroggleMovement(currentStartId) {
    if (this.runTroggles && currentStartId === this.startId) {
      this.gameEngine.runFunctionAfterDelay(() => {
        if (this.runTroggles && currentStartId === this.startId) {
          this._moveAllTroggles();
          this._scheduleTroggleMovement(currentStartId);
        }
      }, this.troggleMoveDelay);
    }
  }

  _moveAllTroggles() {
    const gameState = this.gameEngine.gameState
    const trogglesToMove = [];
    for (let x = 0; x < gameState.grid.width; x++) {
      for (let y = 0; y < gameState.grid.height; y++) {
        const cell = gameState.grid.cellAt(x, y);
        if (cell.occupant && cell.occupant.isTroggle()) {
          trogglesToMove.push({ x, y, troggle: cell.occupant });
        }
      }
    }

    for (const { x, y, troggle } of trogglesToMove) {
      // Ensure the troggle hasn't been removed or moved by another troggle in the same loop
      const currentCell = gameState.grid.cellAt(x, y);
      if (currentCell && currentCell.occupant === troggle) {
        const timeSinceAdded = Date.now() - troggle.timeAdded;
        if (timeSinceAdded >= this.troggleMoveDelay * 1000) {
          this._processTroggleMove(x, y, troggle);
        }
      }
    }
  }

  _processTroggleMove(x, y, troggle) {
    let currentX = x;
    let currentY = y;
    let newDirection = troggle.direction;

    switch (troggle.type) {
      case MACharacterType.Reggie:
        newDirection = troggle.direction; // Continues in the same direction
        break;
      case MACharacterType.Bashful:
        newDirection = this._getBashfulDirection(currentX, currentY);
        break;
      case MACharacterType.Helper:
      case MACharacterType.Worker:
        newDirection = this._randomElement([MADirection.Up, MADirection.Down, MADirection.Left, MADirection.Right]);
        break;
      case MACharacterType.Smarty:
        newDirection = this._getSmartyDirection(currentX, currentY);
        break;
      default:
        break;
    }

    const { newX: updatedX, newY: updatedY, movedOffscreen } = this._updateXYWithOrientation(currentX, currentY, newDirection);

    this.gameEngine.gameState.grid.cellAt(x, y).occupant = null; // Clear old position

    troggle.direction = newDirection; // Update troggle's direction
    if (!movedOffscreen) {
      this._moveTroggle(troggle, x, y, updatedX, updatedY);
    } else {
      this.gameEngine.didPerformActionCallback(new MAMoveEvent(MAEventType.TroggleMovedOffscreen, x, y, updatedX, updatedY, newDirection, null, troggle.type));
    }
  }

  _updateXYWithOrientation(x, y, orientation) {
    let newX = x;
    let newY = y;

    switch (orientation) {
      case MADirection.Up:
        newY--;
        break;
      case MADirection.Down:
        newY++;
        break;
      case MADirection.Left:
        newX--;
        break;
      case MADirection.Right:
        newX++;
        break;
    }

    // Check if new position is off-screen
    const movedOffscreen = (newX < 0 || newX >= this.gameEngine.gameState.grid.width || newY < 0 || newY >= this.gameEngine.gameState.grid.height);

    return { newX, newY, movedOffscreen };
  }

  _getBashfulDirection(troggleX, troggleY) {
    const muncherXY = this.gameEngine.gameState.grid.muncherXY();
    if (!muncherXY) return this._randomElement([MADirection.Up, MADirection.Down, MADirection.Left, MADirection.Right]);

    const muncherX = muncherXY[0];
    const muncherY = muncherXY[1];

    const xDist = Math.abs(troggleX - muncherX);
    const yDist = Math.abs(troggleY - muncherY);

    if (xDist === 1 && yDist === 0) {
      return troggleX > muncherX ? MADirection.Right : MADirection.Left;
    } else if (yDist === 1 && xDist === 0) {
      return troggleY > muncherY ? MADirection.Down : MADirection.Up;
    }

    return this._randomElement([MADirection.Up, MADirection.Down, MADirection.Left, MADirection.Right]);
  }

  _getSmartyDirection(troggleX, troggleY) {
    const muncherXY = this.gameEngine.gameState.grid.muncherXY();
    if (!muncherXY) return this._randomElement([MADirection.Up, MADirection.Down, MADirection.Left, MADirection.Right]);

    const muncherX = muncherXY[0];
    const muncherY = muncherXY[1];

    if (muncherX > troggleX) {
      return MADirection.Right;
    } else if (muncherX < troggleX) {
      return MADirection.Left;
    } else if (muncherY > troggleY) {
      return MADirection.Down;
    } else {
      return MADirection.Up;
    }
  }

  _moveTroggle(troggle, startX, startY, endX, endY) {
    const cell = this.gameEngine.gameState.grid.cellAt(endX, endY);
    let isOver = false;

    if (cell.isSafeBox) {
      // Troggle dies in safe box. It was already removed from the grid at its previous location.
      this.gameEngine.didPerformActionCallback(new MAEvent(MAEventType.TroggleDiesInSafeSquare, endX, endY, null, troggle.type));
    } else {
      if (cell.occupant && cell.occupant.type === MACharacterType.Muncher) {
        cell.occupant = troggle;
        // Troggle eats muncher
        this.gameEngine.didPerformActionCallback(new MAMoveEvent(MAEventType.TroggleMove, startX, startY, endX, endY, troggle.direction, null, troggle.type));
        this.gameEngine.didPerformActionCallback(new MAEvent(MAEventType.TroggleEatsMuncher, endX, endY, this._deathStringForTroggle(troggle)));
        this.gameEngine.handleTroggleEatsMuncher();

      } else if (cell.occupant && cell.occupant.isTroggle()) {
        // Troggle eats another troggle
        cell.occupant = troggle;
        this.gameEngine.didPerformActionCallback(new MAMoveEvent(MAEventType.TroggleMove, startX, startY, endX, endY, troggle.direction, null, troggle.type));
        this.gameEngine.didPerformActionCallback(new MAEvent(MAEventType.TroggleMunch, endX, endY, troggle.direction));

      } else {
        cell.occupant = troggle;
        this.gameEngine.didPerformActionCallback(new MAMoveEvent(MAEventType.TroggleMove, startX, startY, endX, endY, troggle.direction, null, troggle.type));
      }

      // Troggle eats value based on its type
      isOver = this._troggleRemoveValueWithReplace(troggle.type, endX, endY);
    }
    return isOver;
  }

  _troggleRemoveValueWithReplace(troggleType, x, y) {
    const gameState = this.gameEngine.gameState
    const cell = gameState.grid.cellAt(x, y);
    let isOver = false;

    let replace = false;
    let add = false;

    switch (troggleType) {
      case MACharacterType.Reggie:
      case MACharacterType.Bashful:
      case MACharacterType.Smarty:
        replace = true;
        break;
      case MACharacterType.Helper:
        replace = false;
        break;
      case MACharacterType.Worker:
        replace = true;
        add = true;
        break;
    }

    if (cell.value !== null || add) {
      gameState.grid.removeValueAt(x, y); // Remove existing value

      if (replace || add) {
        const withAttr = (MAUtils.randomInt(2) === 0);
        const newValue = withAttr ?
          this._randomElement(gameState.currentLevelMatchingValues) :
          this._randomElement(gameState.currentLevelNonMatchingValues);
        cell.value = newValue;
      }
      isOver = gameState.grid.allMatchingValuesCleared(gameState.currentLevelMatchingValues);
      if (isOver) {
        this.gameEngine.didPerformActionCallback(new MAEvent(MAEventType.LevelCleared, x, y));
      }
    }
    return isOver;
  }

  _deathStringForTroggle(troggle) {
    const eaten = ["eaten", "devoured", "munched", "chomped", "gobbled up", "feasted upon"];
    const randomEat = this._randomElement(eaten);
    const troggleName = MAUtils.characterTypeToString(troggle.type);
    return `You were ${randomEat} by
${troggleName}`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MATroggleController };
}
