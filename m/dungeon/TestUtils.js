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

  goFromStartToEnd: function(gameEngine, gameState) {
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take small leather armor", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at blue glimmer", gameState)
    gameEngine.performActionLike("Take blue key", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take torn parchment", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal injured fox", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Put small leather armor", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at blue key", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look up from satchel", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take metal fangs", gameState)
    gameEngine.performActionLike("Put metal fangs on fox", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take torn parchment #2", gameState)
    gameEngine.performActionLike("Combine torn pieces of parchment", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take bronze helm", gameState)
    gameEngine.performActionLike("Wear bronze helm", gameState)
    gameEngine.performActionLike("Look at yourself", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Punch wolf pup", gameState)
    gameEngine.performActionLike("Punch wolf pup", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take gold key", gameState)
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Look at room", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Take orange key", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at door", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Take pamphlet", gameState)
    gameEngine.performActionLike("Read pamphlet", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Scratch troll", gameState)
    gameEngine.performActionLike("Take large potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Scratch", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large potion", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    gameEngine.performActionLike("Look at yourself", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large elixir", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at room", gameState)
    gameEngine.performActionLike("Look at gold hoard", gameState)
    gameEngine.performActionLike("Take gold hoard", gameState)
    gameEngine.performActionLike("Go east", gameState)
  },
}
Object.freeze(MATestUtils)
