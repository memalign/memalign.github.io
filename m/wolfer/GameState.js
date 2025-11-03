
if (typeof module !== 'undefined' && module.exports) {
  MAUtils = require('./Utilities');
}

const MACharacterType = {
  Muncher: 0,
  Reggie: 1,
  Bashful: 2,
  Helper: 3,
  Worker: 4,
  Smarty: 5,
}
Object.freeze(MACharacterType)

class MACharacter {
  // Properties:
  // - type (MACharacterType)
  // - direction (MADirection)
  constructor(charType, direction) {
    this.type = charType
    this.direction = direction ? direction : MADirection.Right
    this.timeAdded = Date.now()
  }

  isTroggle() {
    return this.type != MACharacterType.Muncher
  }
}

const MADirection = {
  None:  0,
  Up:    1,
  Down:  2,
  Left:  3,
  Right: 4,

  directionToXDelta: function(direction) {
    if (direction == MADirection.Left) {
      return -1
    } else if (direction == MADirection.Right) {
      return 1
    }

    return 0
  },

  directionToYDelta: function(direction) {
    if (direction == MADirection.Up) {
      return -1
    } else if (direction == MADirection.Down) {
      return 1
    }

    return 0
  },
}
Object.freeze(MADirection)


class MAGridCell {
  // Properties:
  // - isSafeBox (boolean)
  // - value (usually string, depends on the specific GameGenerator)
  // - occupant (MACharacter: null, muncher, troggle)
  constructor() {
    this.isSafeBox = false
    this.value = null
    this.occupant = null
    this.safeDate = null // For safe squares, stores the Date when it became safe
  }
}

class MAGameGrid {
  // Properties:
  // - width (int)
  // - height (int)
  // - grid (1d array with length=width*height)
  constructor(width, height) {
    this.width = (width !== null) ? width : 6
    this.height = (height !== null) ? height : 5

    let size = this.width * this.height
    this.grid = []
    for (var i = 0; i < size; ++i) {
      this.grid[i] = new MAGridCell()
    }
  }

  cellAt(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null
    }

    let index = y*this.width + x
    return this.grid[index]
  }

  cellPlusNeighborsAt(x, y) {
    let result = []

    for (var xD = -1; xD <= 1; ++xD) {
      for (var yD = -1; yD <= 1; ++yD) {
        let neighborX = x+xD
        let neighborY = y+yD
        let cell = this.cellAt(neighborX, neighborY)
        if (cell) {
          result.push(cell)
        }
      }
    }

    return result
  }

  populate(matchingValues, nonMatchingValues) {
    let length = this.grid.length
    for (var i = 0; i < length; ++i) {
      let list = MAUtils.randomInt(2) == 0 ? matchingValues : nonMatchingValues
      let val = MAUtils.randomElement(list)
      this.grid[i].value = val
    }
  }

  replaceValueAt(x, y, newValue) {
    let cell = this.cellAt(x, y)
    let val = cell.value
    cell.value = newValue
    return val
  }

  removeValueAt(x, y) {
    return this.replaceValueAt(x, y, null)
  }

  muncherXY() {
    for (var x = 0; x < this.width; ++x) {
      for (var y = 0; y < this.height; ++y) {
        let cell = this.cellAt(x, y)
        if (cell.occupant && cell.occupant.type == MACharacterType.Muncher) {
          return [x, y]
        }
      }
    }

    return null
  }

  removeMuncher() {
    for (var cell of this.grid) {
      if (cell.occupant && cell.occupant.type == MACharacterType.Muncher) {
        cell.occupant = null
      }
    }
  }

  placeMuncher() {
    this.removeMuncher()

    // Pick the most central location with the fewest nearby troggles

    let middleX = Math.floor(this.width/2)
    let middleY = Math.floor(this.height/2)

    // Initial values are impossibly bad so all options will be an improvement
    var bestNumNearbyTroggles = this.grid.length
    var safeX = this.grid.length
    var safeY = this.grid.length
    var safeXDistanceFromCenter = this.grid.length
    var safeYDistanceFromCenter = this.grid.length

    for (var x = 0; x < this.width; ++x) {
      for (var y = 0; y < this.height; ++y) {
        let cell = this.cellAt(x, y)

        if (cell.occupant) {
          continue
        }

        let numNearbyTroggles = this.cellPlusNeighborsAt(x, y).filter(cell => cell.occupant && cell.occupant.isTroggle()).length

        let xDistanceFromCenter = Math.abs(middleX-x)
        let yDistanceFromCenter = Math.abs(middleY-y)

        let isMoreCentral = (yDistanceFromCenter <= safeYDistanceFromCenter) && (xDistanceFromCenter <= safeXDistanceFromCenter) && (yDistanceFromCenter != safeYDistanceFromCenter || xDistanceFromCenter != safeXDistanceFromCenter)

        if ((numNearbyTroggles < bestNumNearbyTroggles) ||
            (numNearbyTroggles == bestNumNearbyTroggles && isMoreCentral)) {
          safeX = x
          safeY = y
          safeXDistanceFromCenter = xDistanceFromCenter
          safeYDistanceFromCenter = yDistanceFromCenter
          bestNumNearbyTroggles = numNearbyTroggles
        }
      }
    }

    let cell = this.cellAt(safeX, safeY)
    cell.occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right)
  }

  moveMuncherInDirection(direction) {
    let currLoc = this.muncherXY()
    let x = currLoc[0]
    let y = currLoc[1]

    this.moveOccupantInDirection(x, y, direction)
  }

  xyInDirection(x, y, direction) {
    let xDelta = MADirection.directionToXDelta(direction)
    let yDelta = MADirection.directionToYDelta(direction)

    let newX = x + xDelta
    let newY = y + yDelta

    return [newX, newY]
  }

  moveOccupantInDirection(x, y, direction) {
    let newXY = this.xyInDirection(x, y, direction)
    let newX = newXY[0]
    let newY = newXY[1]

    let newCell = this.cellAt(newX, newY)

    // newCell will be null if (newX, newY) is out of bounds
    if (newCell) {
      let origCell = this.cellAt(x, y)
      let occupant = origCell.occupant

      origCell.occupant = null

      newCell.occupant = occupant
    }
  }

  // Returns the occupant (or null) of the cell next to (x, y) in direction
  occupantInDirection(x, y, direction) {
    let newXY = this.xyInDirection(x, y, direction)
    let newX = newXY[0]
    let newY = newXY[1]

    // newCell will be null if (newX, newY) is out of bounds
    let newCell = this.cellAt(newX, newY)

    return newCell ? newCell.occupant : null
  }

  muncherDirection() {
    let muncherXY = this.muncherXY()
    if (muncherXY) {
      let muncherCell = this.cellAt(muncherXY[0], muncherXY[1])
      if (muncherCell && muncherCell.occupant) {
        return muncherCell.occupant.direction
      }
    }
    return MADirection.Right // Default direction if muncher not found or no direction set
  }

  clearSafeSquares() {
    for (let cell of this.grid) {
      cell.isSafeBox = false
      cell.safeDate = null
    }
  }

  clearTroggles() {
    for (let cell of this.grid) {
      if (cell.occupant && cell.occupant.isTroggle()) {
        cell.occupant = null
      }
    }
  }

  allMatchingValuesCleared(matchingValues) {
    for (let cell of this.grid) {
      if (cell.value !== null && matchingValues.includes(cell.value)) {
        return false
      }
    }
    return true
  }
}


class MAGameState {
  // Properties:
  // - grid (MAGameGrid instance)
  // - level (int)
  // - currentScore (int)
  // - highScore (int)
  // - strikes (int)
  constructor() {
    this.level = 0
    this.currentScore = 0
    this.highScore = 0
    this.strikes = 0
    this.gameIsOver = false
    this.grid = new MAGameGrid(6, 5)

    this.currentLevelMatchingValues = null
    this.currentLevelNonMatchingValues = null
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MACharacterType,
    MACharacter,
    MADirection,
    MAGridCell,
    MAGameGrid,
    MAGameState
  };
}
