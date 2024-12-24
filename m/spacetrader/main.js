
class SpaceTraderGame {
  constructor(gameDiv, loadGame = true) {
    this.gameDiv = gameDiv
    this.loadGame = loadGame
  }

  main() {
    console.log("SpaceTraderGame main")

    this.viewController = new SSSTViewController(this.gameDiv, this.loadGame)
    this.viewController.presentView()

    if (debugMode) {
      MAUtils.installCheats(document.getElementById('cheats'), this)
    }
  }
}
