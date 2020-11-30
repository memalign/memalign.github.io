const MATestUtils = {
  setupTestHooks: function(gameEngine, gameState) {

    gameEngine.hasActionLike = function(str, gameState) {
      if (!gameState) {
        MALog.log("Missing gameState!")
        assertTrue(false, "Missing gameState")
      }

      let caseMatters = str.toLowerCase() != str
      let bracketsMatter = str.includes("[") || str.includes("]")

      let actions = gameEngine.actionsForGameState(gameState)

      for (let action of actions) {
        if (action.targets != null && action.targets()) {

          for (let target of action.targets()) {
            var targetStr = action.verbString(target)
            if (!caseMatters) {
              targetStr = targetStr.toLowerCase()
            }

            if (!bracketsMatter) {
              targetStr = targetStr.replace(/[\[\]]/g, "")
            }

            if (targetStr.includes(str)) {
              return true
            }
          }
        } else {
          var actionStr = action.verbString()

          if (!caseMatters) {
            actionStr = actionStr.toLowerCase()
          }

          if (!bracketsMatter) {
            actionStr = actionStr.replace(/[\[\]]/g, "")
          }

          if (actionStr.includes(str)) {
            return true
          }
        }
      }

      return false
    }


    gameState.hasItemNamed = function(str) {
      return gameState.inventory.hasNounNamed(str)
    }
  },

  goFromStartToBlueDoorUnlock: function(gameEngine, gameState) {
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Look at blue glimmer", gameState)
    gameEngine.performActionLike("Look at room", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take blue key", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
  },
}
Object.freeze(MATestUtils)
