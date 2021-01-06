const MATestUtils = {
  setupTestHooks: function(gameEngine, gameState) {

    gameEngine.actionStrings = function(gameState) {
      if (!gameState) {
        MALog.log("Missing gameState!")
        assertTrue(false, "Missing gameState")
      }

      let actions = gameEngine.actionsForGameState(gameState)
      let result = []

      for (let action of actions) {
        if (action.targets != null && action.targets()) {

          for (let target of action.targets()) {
            let targetStr = action.verbString(target)
            result.push(targetStr)
          }
        } else {
          let actionStr = action.verbString()
          result.push(actionStr)
        }
      }

      return result
    }

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
        if (foundTarget !== null) {
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

  goFromStartToEnd: function(gameEngine, gameState) {
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Wonder", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Eat cherries", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Eat power pellet", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Eat scared ghost", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look at floating eyes", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go north", gameState)
    // Wait for the floating eyes to get to its home square to be restored as ghost
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Look around", gameState)
    gameEngine.performActionLike("Go west", gameState)
  },
}
Object.freeze(MATestUtils)
