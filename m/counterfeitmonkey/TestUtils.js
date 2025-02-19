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

  goFromStartToEnd: function(gameEngine, gameState) {
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Andra\"", gameState)
    gameEngine.performActionLike("Say \"Ok\"", gameState)
    gameEngine.performActionLike("back alley", gameState)
    gameEngine.performActionLike("Look at beige buildings", gameState)
    gameEngine.performActionLike("Remember how we got here", gameState)
    gameEngine.performActionLike("Look at dull house", gameState)
    gameEngine.performActionLike("Look at yellow buildings", gameState)
    gameEngine.performActionLike("Look at yellow paint", gameState)
    gameEngine.performActionLike("Look at yourself", gameState)
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at letter-remover", gameState)
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look up from inventory", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on yellow paint", gameState)
    gameEngine.performActionLike("Remove a from yellow paint", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on yellow buildings", gameState)
    gameEngine.performActionLike("Nevermind", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on yellow buildings", gameState)
    gameEngine.performActionLike("Remove s from yellow buildings", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on beige buildings", gameState)
    gameEngine.performActionLike("Remove s from beige buildings", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Look at reflective window", gameState)
    gameEngine.performActionLike("Look at reflective window", gameState)
    gameEngine.performActionLike("Look at elderly apartments", gameState)
    gameEngine.performActionLike("Look at narrow alley", gameState)
    gameEngine.performActionLike("Look at tourist boutiques", gameState)
    gameEngine.performActionLike("Look at ethnic bodices", gameState)
    gameEngine.performActionLike("Look at colorful skirts", gameState)
    gameEngine.performActionLike("Look at font t-shirts", gameState)
    gameEngine.performActionLike("Look at mourning dress", gameState)
    gameEngine.performActionLike("Look at Typographer's office", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on mourning dress", gameState)
    gameEngine.performActionLike("Remove u from mourning dress", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on font t-shirts", gameState)
    gameEngine.performActionLike("Remove r from font t-shirts", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Nevermind", gameState)
    gameEngine.performActionLike("Look at museum", gameState)
    gameEngine.performActionLike("Look at codex", gameState)
    gameEngine.performActionLike("Look at real estate office", gameState)
    gameEngine.performActionLike("Look at temporary barrier", gameState)
    gameEngine.performActionLike("Look at code-lock", gameState)
    gameEngine.performActionLike("Use code 614", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on codex", gameState)
    gameEngine.performActionLike("Remove c from codex", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on codex", gameState)
    gameEngine.performActionLike("Remove x from codex", gameState)
    gameEngine.performActionLike("Use code 305", gameState)
    gameEngine.performActionLike("Look at museum", gameState)
    gameEngine.performActionLike("Look at 🏛🏢 Ampersand Bend", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Look at crowds", gameState)
    gameEngine.performActionLike("Look at kiosks", gameState)
    gameEngine.performActionLike("Look at random foodstuffs", gameState)
    gameEngine.performActionLike("Look at wheel", gameState)
    gameEngine.performActionLike("Spin wheel", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on wheel", gameState)
    gameEngine.performActionLike("Remove w from wheel", gameState)
    gameEngine.performActionLike("Take heel", gameState)
    gameEngine.performActionLike("Look at 🍬🌭 Fair", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at apple", gameState)
    gameEngine.performActionLike("Look at balloons", gameState)
    gameEngine.performActionLike("Attack balloons", gameState)
    gameEngine.performActionLike("Look at barker", gameState)
    gameEngine.performActionLike("Look at blank church wall", gameState)
    gameEngine.performActionLike("Look at blue suit", gameState)
    gameEngine.performActionLike("Look at pear", gameState)
    gameEngine.performActionLike("Look at pharmacy", gameState)
    gameEngine.performActionLike("Look at strong-man hammering contest", gameState)
    gameEngine.performActionLike("Look at styrofoam dart-plane", gameState)
    gameEngine.performActionLike("Look at tube", gameState)
    gameEngine.performActionLike("Look at word-balance", gameState)
    gameEngine.performActionLike("Ask about the barker's suit", gameState)
    gameEngine.performActionLike("Ask if anyone ever wins", gameState)
    gameEngine.performActionLike("Ask if the gel is valuable", gameState)
    gameEngine.performActionLike("Ask whether the game is rigged", gameState)
    gameEngine.performActionLike("Put something next to the apple", gameState)
    gameEngine.performActionLike("Take apple", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on apple", gameState)
    gameEngine.performActionLike("Remove p from apple", gameState)
    gameEngine.performActionLike("Take ale", gameState)
    gameEngine.performActionLike("Take pear", gameState)
    gameEngine.performActionLike("Look at word-balance", gameState)
    gameEngine.performActionLike("Look at 🍎🍐 Midway", gameState)
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at tube", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on tube", gameState)
    gameEngine.performActionLike("Remove e from tube", gameState)
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on pear", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pearl", gameState)
    gameEngine.performActionLike("Remove l from pearl", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pear", gameState)
    gameEngine.performActionLike("Remove r from pear", gameState)
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on pea", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pearl", gameState)
    gameEngine.performActionLike("Remove p from pearl", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pearl", gameState)
    gameEngine.performActionLike("Remove l from pearl", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pear", gameState)
    gameEngine.performActionLike("Remove p from pear", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on small children", gameState)
    gameEngine.performActionLike("Remove s from small children", gameState)
    gameEngine.performActionLike("Look at grass", gameState)
    gameEngine.performActionLike("Look at marble fountain", gameState)
    gameEngine.performActionLike("Look at horses", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on horses", gameState)
    gameEngine.performActionLike("Remove r from horses", gameState)
    gameEngine.performActionLike("Look at marble fountain", gameState)
    gameEngine.performActionLike("Look at 👩‍👧‍👧🌱 Park Center", gameState)
    gameEngine.performActionLike("Look at small children", gameState)
    gameEngine.performActionLike("Remember your austere childhood", gameState)
    gameEngine.performActionLike("Remember your austere childhood", gameState)
    gameEngine.performActionLike("Remember your austere childhood", gameState)
    gameEngine.performActionLike("Remember your austere childhood", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on hoses", gameState)
    gameEngine.performActionLike("Remove s from hoses", gameState)
    gameEngine.performActionLike("Take hoe", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at diorama", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on army", gameState)
    gameEngine.performActionLike("Remove y from army", gameState)
    gameEngine.performActionLike("Take arm", gameState)
    gameEngine.performActionLike("Take members", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on shelter", gameState)
    gameEngine.performActionLike("Remove s from shelter", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at attendant's desk", gameState)
    gameEngine.performActionLike("Look at desk attendant", gameState)
    gameEngine.performActionLike("Ask what she recommends", gameState)
    gameEngine.performActionLike("Ask what the fair is for", gameState)
    gameEngine.performActionLike("Ask whether public transport exists", gameState)
    gameEngine.performActionLike("Ask whether she enjoys her job", gameState)
    gameEngine.performActionLike("Ask whether there are beds available", gameState)
    gameEngine.performActionLike("Ask whether there is an internet connection nearby", gameState)
    gameEngine.performActionLike("Ask who would do this", gameState)
    gameEngine.performActionLike("Ask what the other group was like", gameState)
    gameEngine.performActionLike("Ask about the young woman", gameState)
    gameEngine.performActionLike("Compliment the nose ring", gameState)
    gameEngine.performActionLike("Look at blouse", gameState)
    gameEngine.performActionLike("Look at ceiling", gameState)
    gameEngine.performActionLike("Look at Guidebook", gameState)
    gameEngine.performActionLike("Look at narrow hallway", gameState)
    gameEngine.performActionLike("Look at nose ring", gameState)
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on desk attendant", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Look at backpacking girl", gameState)
    gameEngine.performActionLike("Ask for privacy", gameState)
    gameEngine.performActionLike("Look at backpacking girl", gameState)
    gameEngine.performActionLike("Tell her we know how jetlag can be", gameState)
    gameEngine.performActionLike("Tell her a lie", gameState)
    gameEngine.performActionLike("Look at locker", gameState)
    gameEngine.performActionLike("Tell her a lie", gameState)
    gameEngine.performActionLike("Ask whether she had trouble with customs", gameState)
    gameEngine.performActionLike("Look at [lock]", gameState)
    gameEngine.performActionLike("Remember making your lock", gameState)
    gameEngine.performActionLike("Tell her we do", gameState)
    gameEngine.performActionLike("Look at heavy pack", gameState)
    gameEngine.performActionLike("Ask whether she is from Canada", gameState)
    gameEngine.performActionLike("Tell her we agree", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Ask how to unlock the lockers", gameState)
    gameEngine.performActionLike("Ask what if a guest", gameState)
    gameEngine.performActionLike("Ask what the All-Purpose is", gameState)
    gameEngine.performActionLike("Ask how the All-Purpose makes blocks", gameState)
    gameEngine.performActionLike("Ask whether the gel resembles ours", gameState)
    gameEngine.performActionLike("Ask why they do not use a locksmith", gameState)
    gameEngine.performActionLike("Ask what we should do about the lock", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Show her the arm", gameState)
    gameEngine.performActionLike("Look at [lock]", gameState)
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on [lock]", gameState)
    gameEngine.performActionLike("Take clock", gameState)
    gameEngine.performActionLike("Open locker", gameState)
    gameEngine.performActionLike("Look at dorm beds", gameState)
    gameEngine.performActionLike("Look at hard wood floors", gameState)
    gameEngine.performActionLike("Look at letter", gameState)
    gameEngine.performActionLike("Look at plans", gameState)
    gameEngine.performActionLike("Look at roll of bills", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Look at note from developer", gameState)
  },
}
Object.freeze(MATestUtils)
