// Class responsibilities:
// Produce HTML that represents the game grid

class MAGridViewProducer {
  constructor() {

  }

  _pceImageLibrary() {
    return PCEImageLibrary;
  }

  divIDForOccupant(occupant) {
    if (occupant === null) {
      return "cellNone"
    } else if (occupant.type == MACharacterType.Muncher) {
      return "cellMuncher"
    } else if (occupant.type == MACharacterType.Reggie) {
      return "cellReggie"
    } else if (occupant.type == MACharacterType.Bashful) {
      return "cellBashful"
    } else if (occupant.type == MACharacterType.Helper) {
      return "cellHelper"
    } else if (occupant.type == MACharacterType.Worker) {
      return "cellWorker"
    } else if (occupant.type == MACharacterType.Smarty) {
      return "cellSmarty"
    } else {
      return "cellNone" // Fallback
    }
  }

  htmlStringForLivesRemaining(gameEngine, muncherImageName) {
    let htmlStr = '';
    let numLivesToShow = gameEngine.maxStrikes - gameEngine.gameState.strikes - 1;
    for (let i = 0; i < numLivesToShow; i++) {
      let muncherImage = this._pceImageLibrary().pceImageForName(muncherImageName);
      let muncherImageDataURL = muncherImage.generatePNG(1);
      htmlStr += `<img src='${muncherImageDataURL}' class='muncher-image'>`;
    }
    return htmlStr;
  }

  htmlStringForGameEngine(gameEngine) {
    let gameState = gameEngine.gameState

    let grid = gameState.grid

    let htmlStr = ""

    // Header
    htmlStr += `<div id='levelHeaderLine'>`
    htmlStr += `<div class='alignLeft verticalBottom'>Level ${gameState.level + 1}</div>`
    htmlStr += `<div class='alignCenter' id='levelTitle'>${gameEngine.gameGenerator.titleForLevel(gameState.level)}</div>`
    let troggleFlair = ""
    if (gameEngine.troggleController.pendingTroggle) {
      troggleFlair = "WOEBOT!"

      if (typeof classicMode !== "undefined" && classicMode) {
        troggleFlair = "TROGGLE!"
      }
    }
    htmlStr += `<div class='alignRight verticalBottom'>${troggleFlair}</div>`
    htmlStr += "</div>"

    htmlStr += `<div id="muncherGrid" class='unselectable'>`
    htmlStr += "<table class='unselectable'>"

    for (var y = 0; y < grid.height; ++y) {
      htmlStr += "<tr>"
      for (var x = 0; x < grid.width; ++x) {
        let cell = grid.cellAt(x, y)

        htmlStr += `<td class="cell_${x}_${y}">`
        let cellDivClass = cell.isSafeBox ? "safe-square" : ""
        const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
        if (cell.value !== null && emojiRegex.test(cell.value)) {
          cellDivClass += " emoji-font-size";
        }
        let cellDivStyle = ""
        if (cell.occupant) {
          let imageName = "";
          if (cell.occupant.type == MACharacterType.Muncher) {
            imageName = (cell.occupant.direction === MADirection.Left) ? "muncher_left" : "muncher";

          } else if (cell.occupant.isTroggle()) {
            let troggleType = cell.occupant.type;
            let troggleDirection = cell.occupant.direction;
            let baseImageName = "";

            switch (troggleType) {
              case MACharacterType.Reggie:
                baseImageName = "reggie";
                break;
              case MACharacterType.Bashful:
                baseImageName = "bashful";
                break;
              case MACharacterType.Helper:
                baseImageName = "helper";
                break;
              case MACharacterType.Worker:
                baseImageName = "worker";
                break;
              case MACharacterType.Smarty:
                baseImageName = "smarty";
                break;
              default:
                baseImageName = "troggle"; // Fallback
                break;
            }

            if (troggleType === MACharacterType.Smarty) {
              // Smarty only has left/right
              imageName = (troggleDirection === MADirection.Left) ? `${baseImageName}_left` : baseImageName;
            } else {
              // Other troggles have left/back/right (default)
              if (troggleDirection === MADirection.Left) {
                imageName = `${baseImageName}_left`;
              } else if (troggleDirection === MADirection.Up) {
                imageName = `${baseImageName}_back`;
              } else if (troggleDirection === MADirection.Right) {
                imageName = `${baseImageName}_right`;
              } else {
                imageName = baseImageName; // Down
              }
            }
          } else {
            imageName = "troggle"; // Generic troggle (should not be reached if all troggle types are handled above)
          }

          let characterImage = this._pceImageLibrary().pceImageForName(imageName)
          let characterImageDataURL = characterImage.generatePNG(1)
          cellDivStyle = `background-image:url('${characterImageDataURL}'); background-position:center; background-size: contain; background-repeat: no-repeat;`
        }

        htmlStr += `<div id="${this.divIDForOccupant(cell.occupant)}" class="cell-div cell_${x}_${y} ${cellDivClass}" style="${cellDivStyle}">`

        if (cell.value !== null) {
          htmlStr += cell.value
        } else {
          htmlStr += "&nbsp;"
        }
        htmlStr += "</div></td>"
      }
      htmlStr += "</tr>"
    }

    htmlStr += "</table>"
    htmlStr += `
    <div id="gameOverlay" class="unselectable">
      <p id="gameOverlayTitle"></p>
      <p id="gameOverlayMessage"></p>
      <p>Tap or press any key to continue</p>
    </div>
    `
    htmlStr += "</div>"

    // Footer
    htmlStr += `<div id='scoreLine'>`
    // Show score
    let highScore = gameState.highScore
    let highScoreFlair = ""
    if (gameState.currentScore > highScore) {
      highScore = gameState.currentScore
      highScoreFlair = "*"
    }
    htmlStr += `<div id='scoreText' class='alignLeft'>score: ${gameState.currentScore} (high: ${highScore}${highScoreFlair})</div>`

    // Show lives remaining
    htmlStr += `<div id='livesRemaining' class='alignRight'>`
    htmlStr += this.htmlStringForLivesRemaining(gameEngine, "muncher");
    htmlStr += `</div>` // livesRemaining

    htmlStr += `</div>` // scoreLine

    return htmlStr
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MAGridViewProducer };
}
