
class MAGridCell {
  // Properties:
  // - isLit (boolean)
  constructor() {
    this.isLit = false
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

  toString() {
    let str = ""
    for (let i = 0; i < this.width*this.height; i++) {
      if (i > 0 && i % this.width == 0) {
        str += "|"
      }
      str += this.grid[i].isLit ? "x" : "-"
    }
    return str
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

    let cell = this.cellAt(x, y)
    if (cell) { result.push(cell) }

    cell = this.cellAt(x, y-1)
    if (cell) { result.push(cell) }
    cell = this.cellAt(x, y+1)
    if (cell) { result.push(cell) }

    cell = this.cellAt(x-1, y)
    if (cell) { result.push(cell) }
    cell = this.cellAt(x+1, y)
    if (cell) { result.push(cell) }

    return result
  }

  toggleCellAndNeighbors(x, y) {
    let cells = this.cellPlusNeighborsAt(x, y)
    for (let cell of cells) {
      cell.isLit = !cell.isLit
    }
  }

  toggleCell(x, y) {
    let cell = this.cellAt(x, y)
    if (cell) {
      cell.isLit = !cell.isLit
    }
  }

  toggleCellAtIndex(index) {
    if (index >= 0 && index < this.grid.length) {
      let cell = this.grid[index]
      if (cell) {
        cell.isLit = !cell.isLit
      }
    }
  }

  turnOffAllCells() {
    for (let cell of this.grid) {
      cell.isLit = false
    }
  }

  populate(puzzleStr) {
		// puzzleStr format looks like "-x---|xxx--|-x-x-|--xxx|---x-"
    // Strip out | characters
		puzzleStr = puzzleStr.replace(/\|/g, '')
    let length = Math.min(this.grid.length, puzzleStr.length)
    for (var i = 0; i < length; ++i) {
      let gridChar = puzzleStr.charAt(i)
      this.grid[i].isLit = gridChar == "x"
    }
  }

  isGridClear() {
    for (var x = 0; x < this.width; ++x) {
      for (var y = 0; y < this.height; ++y) {
        let cell = this.cellAt(x, y)
        if (cell.isLit) {
          return false
        }
      }
    }

    return true
  }
}


class MAGameState {
  // Properties:
  // - grid (MAGameGrid instance)
  // - level (int)
  // - completedLevels (array of ints)
  constructor() {
    this.level = 0
    this.grid = new MAGameGrid(5, 5)

    this.completedLevels = []
  }

  noteLevelCompleted(level) {
    if (!this.completedLevels.includes(level)) {
      this.completedLevels.push(level)
    }
  }
}

