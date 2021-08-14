// Class responsibilities:
// Produce HTML that represents the game grid

class MAGridViewProducer {
  constructor() {

  }

  divIDForIsLit(isLit) {
    return isLit ? "cellLit" : "cellNone"
  }

  htmlStringForGameState(gameState) {
    let grid = gameState.grid

    let htmlStr = `<div id="gameGrid">`

    htmlStr += "<table class='unselectable'>"

    for (var y = 0; y < grid.height; ++y) {
      htmlStr += "<tr>"
      for (var x = 0; x < grid.width; ++x) {
        let cell = grid.cellAt(x, y)

        htmlStr += `<td class="cell_${x}_${y}"><div id="${this.divIDForIsLit(cell.isLit)}" class="cell_${x}_${y}">`
        htmlStr += "</div></td>"
      }
      htmlStr += "</tr>"
    }

    htmlStr += "</table>"
    htmlStr += "</div>"

    return htmlStr
  }
}

