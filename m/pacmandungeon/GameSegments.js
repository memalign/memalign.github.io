// ============
// GameSegments
// ============

// This is an abstract base class
class MAGameSegment {
  // Properties:
  // - segmentIdentifier (string)
  constructor(segmentIdentifier) {
    this.segmentIdentifier = segmentIdentifier
  }

  valueForKey(gameState, key) {
    let segmentStorage = gameState.gameStorage[this.segmentIdentifier]
    return segmentStorage ? segmentStorage[key] : null
  }

  setValueForKey(gameState, value, key) {
    var segmentStorage = gameState.gameStorage[this.segmentIdentifier]
    if (!segmentStorage) {
      segmentStorage = {}
      gameState.gameStorage[this.segmentIdentifier] = segmentStorage
    }

    segmentStorage[key] = value
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return false
  }

  actionsForGameState(gameState) {
    return []
  }

  performActionOnGameState(action, gameState) {
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}


class MAGameSegmentMemories extends MAGameSegment {
  constructor() {
    super("Memories")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  actionsForGameState(gameState) {
    let memories = gameState.memories.memories.filter(x => x.triggered && !x.completed())

    if (memories.length > 0) {
      let action = new MAActionRemember(memories)
      action.performer = this
      return [ action ]
    }
    return []
  }

  performActionOnGameState(action, gameState) {
    let memory = action.chosenTarget
    gameState.log.log(memory.description() + "\n\nThen you're back in the present.")
    memory.rememberCount++
  }

  gameEngineDidPerformAction(action, gameState) {
    if (action instanceof MAActionLook) {
      let memories = gameState.memories.memories.filter(x => !x.triggered && x.lookTriggers.includes(action.chosenTarget.name))

      for (let memory of memories) {
        memory.triggered = true

        let memoryPrompts = [
          "Something makes you think of",
          "You have a fleeting throught of",
          "You are reminded of",
        ]
        let memoryPrompt = memoryPrompts[gameState.fakeRandomInt(memoryPrompts.length)]

        gameState.log.log(`${memoryPrompt} ${memory.name}.`)
      }
    }
  }
}


class MAGameSegmentDots extends MAGameSegment {
  constructor() {
    super("Dots")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  actionsForGameState(gameState) {
    let actions = []
    return actions
  }

  performActionOnGameState(action, gameState) {
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
    // Respond to real MAActionMove actions and the fake portal "Go" action
    if (action.description().startsWith("(go ")) {

      // Don't log anything if the user was just killed as a result of moving
      if (this.gameSegmentGhost.userIsDead(gameState)) {
        return
      }

      let experiencingPowerPellet = this.gameSegmentGhost.experiencingPowerPellet(gameState)

      let hasEdibleNonDot = gameState.currentLocation.hasNounNamed("power pellet") || gameState.currentLocation.hasNounNamed("scared ghost") || gameState.currentLocation.hasNounNamed("cherries")

      if (gameState.currentLocation.hasNounNamed("dot")) {
        var eatStrings = [
          "You immediately spot another edible sphere. You are overwhelmed by instinct, causing you to lunge forward and inhale this foodstuff.",
          "This room contains a morsel of food, but not for long. Your ravenous hunger drives you to it. MONCH!",
          "A speck of food! Your primal consumptive urge kicks in. GULP!",
          "The mild scent of a pale glob draws you in. You feel your free will fade to the background as your mouth impulsively takes it in and swallows.",
          "You notice a ball of food and spontaneously scoop it up with your fleshy pink tongue. SLURP!",
          "An edible mass in the corner draws your attention. You lean down and inhale. You chew lightly and swallow.",
          "You spy, with your little eye, a snack. So you eats it. GOLLUM!",
          "You see scraps of food, reshaped into a ball, and left on the floor. Your normal self would be repulsed but your tortured and trapped soul is driven to devour it.",
          "Your obsessive starvation drove you here. You are rewarded with another flavorless ball of sustenance. Your teeth gnash together as the food is pulverized and mixed with saliva. You swallow the grey slurry with a GULP.",
          "A ball of mush can be seen. Despite recently eating, you are overcome with a deep feeling of emptiness. You voraciously slurp up the mush with your lips and tongue.",
        ]

        if (experiencingPowerPellet) {
          eatStrings = [
            "Your rampage of mastication continues as you still feel the effects of the power pellet. You chomp the dot in this room with confidence.",
            "You hoover the ball of food in this room with power and grace. A grace only a power pellet could give you.",
            "The power pellet's energy continues to flow through your veins as you swiftly slurp up the morsel in this room.",
            "Fear of starvation no longer weighs on you thanks to the power pellet (for the time being). Nonetheless, you immediately chomp the sphere of sustenance in this room.",
          ]
        }

        let randEatStr = eatStrings[gameState.fakeRandomInt(eatStrings.length)]
        gameState.log.log(randEatStr)

        gameState.currentLocation.nouns = gameState.currentLocation.nouns.filter(x => x.name != "dot")

        gameState.score += 1

      } else if (!hasEdibleNonDot) {

        var noDotStrs = [
          "Your heart sinks with disappointment at the sight of a room with no food.",
          "Hunger pangs punctuate your observation that this room is empty.",
          "The scent of nutrients lingers in the air. But your gluttony already emptied this room.",
          "Your stomach growls at the sight of a food-less room.",
          "You curse the sight of an empty room. You are hardly your usual self.",
          "Oh this cruel and loathesome dungeon! This room is familiar and empty.",
          "You reflexively gnash your teeth in frustration at the sight of this empty room.",
          "Your eyes desperately scan the room for anything edible. Not even a crumb.",
          "Will you perish here?! No food in sight.",
          "*Grumble* Your stomach protests the lack of sufficient nourishment.",
        ]

        if (experiencingPowerPellet) {
          noDotStrs = [
            "Though there's nothing to eat here, the power pellet gives you the confidence to go on.",
            "Your stomach still feels the satiating effects of the power pellet.",
            "You still feel the warmth of the power pellet inside your belly.",
          ]
        }

        let randNoDotStr = noDotStrs[gameState.fakeRandomInt(noDotStrs.length)]
        gameState.log.log(randNoDotStr)
      }
    }
  }
}



class MAGameSegmentYourself extends MAGameSegment {
  constructor() {
    super("Yourself")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  actionsForGameState(gameState) {
    let actions = []

    let fakeYourself = new MANoun("yourself")
    let actionLook = new MAActionLook([fakeYourself])
    actionLook.performer = this
    actions.push(actionLook)

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action instanceof MAActionLook) {
      gameState.log.log("You look grotesque: a limbless round yellow body, a flapping mouth dripping with drool betraying your insatiable hunger.")
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}



class MAGameSegmentGhost extends MAGameSegment {
  constructor() {
    super("Ghost")
  }

  suppressOtherActionsForGameState(gameState) {
    return this.userIsDead(gameState)
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  ghostInLocation(loc) {
    let ghosts = loc.nouns.filter(x => (["ghost", "scared ghost", "floating eyes"].includes(x.name)))
    return ghosts.length > 0 ? ghosts[0] : null
  }

  locationOfGhost(gameState) {
    let locations = gameState.map.locations()

    for (let loc of locations) {
      let ghost = this.ghostInLocation(loc)
      if (ghost) {
        return loc
      }
    }

    return null
  }

  experiencingPowerPellet(gameState) {
    return this.valueForKey(gameState, "powerPelletTimeRemaining") > 0
  }

  userIsDead(gameState) {
    return this.valueForKey(gameState, "userIsDead")
  }

  resetState(gameState) {
    this.setValueForKey(gameState, 0, "powerPelletTimeRemaining")
    this.setValueForKey(gameState, false, "userIsDead")
  }

  actionsForGameState(gameState) {
    let actions = []

    let suppressOtherActions = this.userIsDead(gameState)
    if (this.userIsDead(gameState)) {
      let actionWonder = new MAAction()
      actionWonder.performer = this
      actionWonder.verbString = function(target) {
        return "Wonder about [what comes next]"
      }
      actionWonder.description = function() {
        return "(wonder) what comes next"
      }
      actions.push(actionWonder)
    }


    if (!suppressOtherActions && gameState.currentLocation.hasNounNamed("power pellet")) {
      let actionEat = new MAAction()
      actionEat.performer = this
      actionEat.verbString = function(target) {
        return "Eat [power pellet]"
      }
      actionEat.description = function() {
        return "(eat) power pellet"
      }
      actions.push(actionEat)
    }

    if (!suppressOtherActions && this.experiencingPowerPellet(gameState) && gameState.currentLocation.hasNounNamed("scared ghost")) {
      let actionEat = new MAAction()
      actionEat.performer = this
      actionEat.verbString = function(target) {
        return "Eat [scared ghost]"
      }
      actionEat.description = function() {
        return "(eat) scared ghost"
      }
      actions.push(actionEat)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(wonder)")) {

      // Reset states, ghost, and user to starting states
      // Don't restore any game dots, though
      this.resetState(gameState)

      gameState.currentLocation = gameState.map.startLocation

      // Move ghost back to start location
      let loc = this.locationOfGhost(gameState)
      let ghost = this.ghostInLocation(loc)
      loc.nouns = loc.nouns.filter(x => x.name != ghost.name)
      gameState.map.ghostStartLocation.nouns.push(ghost)

      gameState.log.log("You reawaken as a giant yellow sphere with a gaping wedge-shaped mouth. Is there no escape from this hellish realm?")

    } else if (action.description().startsWith("(eat) power pellet")) {

      gameState.score += 5

      gameState.currentLocation.nouns = gameState.currentLocation.nouns.filter(x => x.name != "power pellet")

      this.setValueForKey(gameState, 6, "powerPelletTimeRemaining")

      gameState.log.log("You devour the power pellet in one bite. You didn't even chew. You are filled with warmth and, for a moment, your hunger fades.")

      // Turn ghost into scared ghost
      let loc = this.locationOfGhost(gameState)
      let ghost = this.ghostInLocation(loc)
      if (ghost.name == "ghost") {
        loc.nouns = loc.nouns.filter(x => x.name != ghost.name)
        let scaredGhost = new MAScenery("scared ghost", "Floating and scared.")
        scaredGhost.invisible = true
        loc.nouns.push(scaredGhost)
      }

    } else if (action.description().startsWith("(eat) scared ghost")) {

      gameState.score += 20

      gameState.log.log("Teeth crash against teeth as you chomp down on the shadowy ghost. You swallow its essence. Chilly and unsatisfying. You feel part of its soul slip away and you feel robbed of what's rightfully yours.")

      gameState.currentLocation.nouns = gameState.currentLocation.nouns.filter(x => x.name != "scared ghost")
      let floatingEyes = new MAScenery("floating eyes", "A wandering soul.")
      floatingEyes.invisible = true
      gameState.currentLocation.nouns.push(floatingEyes)
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
    // Don't move the ghost for automatic actions or when the user is resurrecting (which resets the ghost location)
    let randomlyMoveGhost = !action.performSilently && !action.description().startsWith("(wonder)")

    if (!action.description().startsWith("(eat)")) {
      let currTimeRemaining = this.valueForKey(gameState, "powerPelletTimeRemaining")
      if (currTimeRemaining > 0) {
        this.setValueForKey(gameState, currTimeRemaining-1, "powerPelletTimeRemaining")

        // Turn "scared ghost" into "ghost" if needed
        if (currTimeRemaining == 1) {
          let loc = this.locationOfGhost(gameState)
          let ghost = this.ghostInLocation(loc)
          if (ghost.name == "scared ghost") {
            loc.nouns = loc.nouns.filter(x => x.name != ghost.name)
            let regularGhost = new MAScenery("ghost", "Floating and spooky.")
            regularGhost.invisible = true
            loc.nouns.push(regularGhost)
          }
        }
      }
    }


    if (randomlyMoveGhost) {
      // Move the ghost randomly
      let loc = this.locationOfGhost(gameState)
      var ghost = this.ghostInLocation(loc)

      let dirs = Object.keys(loc.directionToLocation).sort()
      let randDir = dirs[gameState.fakeRandomInt(dirs.length)]
      let dest = loc.directionToLocation[randDir]

      loc.nouns = loc.nouns.filter(x => x.name != ghost.name)

      // If the ghost is floating eyes and it's returned home, restore it
      if (ghost.name == "floating eyes" && dest.name == "(2,1)") {
        ghost = new MAScenery("ghost", "Floating and spooky.")
        ghost.invisible = true
      }

      dest.nouns.push(ghost)

      // Handle the user being killed by the ghost
      if (ghost.name == "ghost" && gameState.currentLocation == dest) {
        this.setValueForKey(gameState, true, "userIsDead")

        gameState.log.log("You hear a ghoulish moan. You feel cold. Then you hear screaming. You feel excruciating pain and you realize the screams are your own. You feel your soul being ripped from its grotesque shell. Your body blinks out of existence. *OooOooOooOooOooBokBok* Are you finally free? Will everything go back to normal?")
      } else if(ghost.name == "scared ghost" && gameState.currentLocation == dest) {
        gameState.log.log("Nearby, you hear the chattering of a scared ghost.")
      }
    }
  }
}


class MAGameSegmentFruit extends MAGameSegment {
  constructor() {
    super("Fruit")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  actionsForGameState(gameState) {
    let actions = []

    if (gameState.currentLocation.hasNounNamed("cherries")) {
      let actionEat = new MAAction()
      actionEat.performer = this
      actionEat.verbString = function(target) {
        return "Eat [cherries]"
      }
      actionEat.description = function() {
        return "(eat) cherries"
      }
      actions.push(actionEat)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(eat) cherries")) {

      gameState.score += 10

      gameState.currentLocation.nouns = gameState.currentLocation.nouns.filter(x => x.name != "cherries")

      gameState.log.log("You savor the delicious, juicy cherries. This is the first moment of bliss you've found since this nightmare began.")
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
    let alreadyAdded = this.valueForKey(gameState, "addedCherries")
    if (!alreadyAdded && gameState.score > 3) {
      let cherries = new MAScenery("cherries", "Round, shiny, and ripe. Mouthwatering.")

      let locations = gameState.map.locations().filter(x => x != gameState.currentLocation)
      let loc = locations[gameState.fakeRandomInt(locations.length)]
      loc.nouns.push(cherries)

      this.setValueForKey(gameState, true, "addedCherries")
    }
  }
}


class MAGameSegmentPortal extends MAGameSegment {
  constructor() {
    super("Portal")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  actionsForGameState(gameState) {
    let actions = []

    let portals = []
    if (gameState.currentLocation.eastPortal) {
      portals.push(MADirection.East)
    }
    if (gameState.currentLocation.westPortal) {
      portals.push(MADirection.West)
    }

    for (let portal of portals) {
      let dirStr = MADirection.toString(portal).toLowerCase()
      let actionGo = new MAAction()
      actionGo.performer = this
      actionGo.verbString = function(target) {
        let dirEmoji = MADirection.toEmoji(portal)
        return `Go [${dirStr} ${dirEmoji}]`
      }
      actionGo.description = function() {
        return `(go ${dirStr})`
      }
      actions.push(actionGo)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(go ")) {
      gameState.log.log("As you approach the void, it sucks you in. Your grip on conciousness slips and you fade out.\n\nYou emerge on the other side, seemingly unscathed.")

      let dest = action.description().includes("east") ? gameState.currentLocation.eastPortal : gameState.currentLocation.westPortal
      gameState.currentLocation = dest

      gameState.log.log(gameState.currentLocation.appearance())

      gameState.currentLocation.inspected = true
      gameState.currentLocation.visited = true
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}



class MAGameSegmentEnd extends MAGameSegment {
  constructor() {
    super("End")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  actionsForGameState(gameState) {
    let actions = []

    return actions
  }

  performActionOnGameState(action, gameState) {
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
    let remainingDots = gameState.map.locations().filter(x => x.hasNounNamed("dot") || x.hasNounNamed("power pellet")).length

    let levelComplete = (remainingDots == 0)

    if (levelComplete) {
      gameState.log.log(`◽️▪️◽️▪️ ◽️\n\nAs you swallow this last morsel, the walls blink: bright, dark, bright, dark.\n\nA glowing message appears in front of you: \"Score: ${gameState.score}\"\n\n Have you pleased whatever cruel captor trapped you here?\n\nNo.\n\nYou reawaken back at the start. Trapped for eternity.`)

      // Reset power pellet and user dead state
      this.gameSegmentGhost.resetState(gameState)

      gameState.map = new MAMap(gameState)
      gameState.currentLocation = gameState.map.startLocation
      gameState.currentLocation.visited = true
      gameState.currentLocation.inspected = true
    }
  }
}

