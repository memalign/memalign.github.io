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

    gameEngine.performActionLike = function(str, gameState) {
      if (!gameState) {
        MALog.log("Missing gameState!")
        assertTrue(false, "Missing gameState")
      }
      let caseMatters = str.toLowerCase() != str
      let bracketsMatter = str.includes("[") || str.includes("]")

      var foundAction = null
      var foundTarget = null

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
              foundAction = action
              foundTarget = target
              break
            }
          }

          if (foundAction) {
            break
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
            foundAction = action
            break
          }
        }
      }


      if (foundAction) {
        if (foundTarget) {
          foundAction.chosenTarget = foundTarget
        }
        gameEngine.performActionOnGameState(foundAction, gameState)
      } else {
        MALog.log("!! Found no action matching: " + str)
      }
    }

    gameState.hasItemNamed = function(str) {
      return gameState.inventory.hasNounNamed(str)
    }
  },
}
Object.freeze(MATestUtils)
