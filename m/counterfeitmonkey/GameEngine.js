
// Classes use an MA prefix as a simple namespace


class MALogger {
  constructor() {
    this.logs = []
  }

  log(str) {
    this.logs.push(str)
  }
}

let MALog = new MALogger()

const MANounWeight = {
  Tiny:       2,
  Normal:    10,
  Huge:     100,
}
Object.freeze(MANounWeight)


// A direction whose value%2==0 must always be followed by its opposite
const MADirection = {
  North:     0,
  South:     1,
  East:      2,
  West:      3,
  SouthEast: 4,
  NorthWest: 5,
  SouthWest: 6,
  NorthEast: 7,
  Up:        8,
  Down:      9,

  Count:    10,

  opposite: function(x) { return ((x % 2 == 0) ? (x+1) : (x-1)) },

  toString: function(x) {
    return x == 0 ? "North" :
           x == 1 ? "South" :
           x == 2 ? "East" :
           x == 3 ? "West" :
           x == 4 ? "Southeast" :
           x == 5 ? "Northwest" :
           x == 6 ? "Southwest" :
           x == 7 ? "Northeast" :
           x == 8 ? "Up" :
           x == 9 ? "Down" :
           "unknown"
  },

  toEmoji: function(x) {
    return x == 0 ? "⬆️" :
           x == 1 ? "⬇️" :
           x == 2 ? "➡️" :
           x == 3 ? "⬅️" :
           x == 4 ? "↘️" :
           x == 5 ? "↖️" :
           x == 6 ? "↙️" :
           x == 7 ? "↗️" :
           x == 8 ? "⏫" :
           x == 9 ? "⏬" :
           "unknown"
  },

  // Returns MADirection value or MADirection.Count if none is found
  // Case insensitive
  parseString: function(str) {
    let lcStr = str.toLowerCase()

    // Search backwards so we don't accidentally return East for "northeast"
    for (var i = MADirection.Count-1; i >= 0; --i) {
      if (lcStr.includes(MADirection.toString(i).toLowerCase())) {
        return i
      }
    }

    return MADirection.Count
  },
}
Object.freeze(MADirection)


class MALocation {
  constructor(name) {
    this.name = name
    this.inspected = false
    this.visited = false
    this.nouns = []
    this.directionToLocation = {}
  }

  appearance() {
    return "nothing special"
  }

  hasNounNamed(name) {
    return this.nouns.filter(x => x.name == name).length > 0
  }

  // Example:
  // Nearby, you can see a small potion.
  // There are no notable items nearby.
  visibleNounsString() {
    if (this.nouns.length == 0) {
      return "There are no notable items nearby."
    }

    let entropy = this.nouns.length + (this.inspected ? 1 : 0) + (this.visited ? 1 : 0)

    let prefixes = ["You can see ", "Nearby, you see ", "Nearby, you notice ", "You notice "]
    let prefix = prefixes[MAUtils.fakeRandomInt(entropy, prefixes.length)]

    var result = prefix
    for (let i = 0; i < this.nouns.length; ++i) {
      let noun = this.nouns[i]

      var comma = ""
      if (i == 1 && this.nouns.length == 2) {
        comma = " and "
      } else if (i > 1 && i == this.nouns.length-1) {
        comma = ", and "
      } else if (i > 0) {
        comma = ", "
      }

      result += comma + noun.inSentenceName()
    }

    return result + "."
  }

  linkedLocations() {
    let ret = []

    if (this.directionToLocation) {
      for (let i = 0; i < MADirection.Count; ++i) {
        let loc = this.directionToLocation[i]
        if (loc) {
          ret.push(loc)
        }
      }
    }

    return ret
  }

  // Example:
  // You can head south to Library Shelves or east to Library Entrance
  linkedLocationsString() {
    if (!this.directionToLocation) {
      return ""
    }

    let dirs = Object.keys(this.directionToLocation).sort()

    var str = ""
    if (dirs.length > 0) {
      str = "You can head "

      var i = 0
      let dirStrs = []

      for (let dir of dirs) {
        let dest = this.directionToLocation[dir]
        var dirStr = MADirection.toString(dir).toLowerCase()
        if (dest.inspected) {
           dirStr += " to " + dest.name
        }
        dirStrs.push(dirStr)
      }

      str += MAUtils.naturalLanguageStringForArray(dirStrs, "or")

      str += "."
    }

    return str
  }

  nounsAndLocationsString() {
    return this.visibleNounsString() + "\n\n" + this.linkedLocationsString()
  }

  // this.directionToLocation[MADirection instance] = MALocation instance
  addLinkInDirection(dir, loc) {
    if (!this.directionToLocation[dir]) {
      this.directionToLocation[dir] = loc
      loc.addLinkInDirection(MADirection.opposite(dir), this)
    }
  }
}


class MAGameState {
  // Responsibility:
  // Stores user's state, the game log, the map, etc

  // Properties:
  // - player (MAPlayer)
  // - inventory (MAInventory)
  // - map (MAMap)
  // - memories (MAMemories)
  // - currentLocation (MALocation)
  // - log (MALogger) - the user's game log
  // - gameStorage[SegmentIdentifier] = {}
  // - serializedActions - array of string-serialized actions taken by the user
  constructor() {
    this.player = new MAPlayer()

    this.inventory = new MAInventory()
    this.inventory.name = "inventory"


    // This game exposes actions for nouns in the inventory modally right after the user looks at the satchel
    this.inventory.providesActionsModally = true

    this.map = new MAMap(this)
    this.memories = new MAMemories()
    this.currentLocation = this.map.startLocation
    this.currentLocation.visited = true
    this.log = new MALogger()

    this.gameStorage = {}
    this.serializedActions = []
  }

  fakeRandomInt(maxValue) {
    return MAUtils.fakeRandomInt(this.log.logs.length, maxValue)
  }
}


class MAGameEngine {
  // Responsibility:
  // Loads game segments, identifies possible actions, performs actions on an MAGameState instance

  // Properties:
  // - (void)didPerformActionCallback(gameState)
  //     - Function a client can set to be notified when an action has been performed on gameState
  constructor() {
    this.gameSegments = []

    let gsSatchel = new MAGameSegmentSatchel()
    this.gameSegments.push(gsSatchel)

    let gsLetterRemover = new MAGameSegmentLetterRemover()
    this.gameSegments.push(gsLetterRemover)

    let gsRestorationGel = new MAGameSegmentRestorationGel()
    this.gameSegments.push(gsRestorationGel)

    this.gameSegments.push(new MAGameSegmentInitialWaking())
    this.gameSegments.push(new MAGameSegmentTemporaryBarrier())
    this.gameSegments.push(new MAGameSegmentWheel())
    this.gameSegments.push(new MAGameSegmentWordBalance())
    this.gameSegments.push(new MAGameSegmentHostel())
    this.gameSegments.push(new MAGameSegmentDormitoryRoom())
    this.gameSegments.push(new MAGameSegmentNounActions())
    this.gameSegments.push(new MAGameSegmentGear())
    this.gameSegments.push(new MAGameSegmentMemories())

    gsLetterRemover.gameSegments = this.gameSegments.filter(x => x !== gsLetterRemover)
    gsRestorationGel.gameSegments = this.gameSegments.filter(x => x !== gsRestorationGel)
  }

  setupNewGame(gameState, serializedActions /* optional */) {
    gameState.log.log("🐵 Counterfeit Monkey 💸")

    let letterRemover = new MANoun("letter-remover")
    letterRemover.isEssential = true

    gameState.inventory.nouns.push(letterRemover)

    let actionLook = new MAActionLook([gameState.currentLocation])
    actionLook.performSilently = true
    actionLook.chosenTarget = gameState.currentLocation
    this.performActionOnGameState(actionLook, gameState)

    if (serializedActions) {
      for (let serializedAction of serializedActions) {
        this.performActionLike(serializedAction, gameState)
      }
    }
  }

  relevantSegments(gameState) {
    return this.gameSegments.filter(x => x.segmentIsRelevantForGameState(gameState))
  }

  // Returns array of MAAction instances
  actionsForGameState(gameState) {
    var actions = []

    var suppressOtherActions = false

    for (let segment of this.relevantSegments(gameState)) {
      let segSuppressesOthers = segment.suppressOtherActionsForGameState(gameState)

      if (segSuppressesOthers) {
        actions = []
      }

      let segActions = segment.actionsForGameState(gameState)
      if (segActions) {
        Array.prototype.push.apply(actions, segActions)
      }

      if (segSuppressesOthers) {
        suppressOtherActions = true
        break
      }
    }

    if (!suppressOtherActions) {
      // ActionLook
      let lookableFilter = function(owner, noun) {
        if (noun == gameState.inventory && gameState.inventory.nouns.length == 0) {
          return false
        } else if (noun.hasAttribute("lookOnce") && noun.inspected) {
          // These nouns are not important enough to keep in the Look list after they are inspected
          return false
        }
        return true
      }
      let lookables = MAUtils.actionableNounsForContainer(gameState.currentLocation, lookableFilter)
      if (lookableFilter(null, gameState.inventory)) {
        lookables.unshift(gameState.inventory)
      }
      lookables.unshift(gameState.currentLocation)

      let actionLook = new MAActionLook(lookables)
      actions.push(actionLook)


      // ActionTake
      let takeableFilter = function(owner, noun) {
        if (!owner) {
          return false // Filter out unowned game objects like Inventory and Player
        } else if (noun.isFixedInPlace) {
          return false
        } else if (owner == gameState.inventory) {
          return false // We already have this item
        }

        return true
      }

      let takeables = MAUtils.actionableNounsForContainer(gameState.currentLocation, takeableFilter)
      if (takeables.length > 0) {
        let actionTake = new MAActionTake(takeables)
        actions.push(actionTake)
      }


      // ActionMove
      let actionMove = new MAActionMove(gameState.currentLocation)
      actions.push(actionMove)
    }


    return actions
  }

  // =================
  // Action performing
  // =================

  performActionOnGameState(action, gameState) {
    if (!action.performSilently) {
      gameState.log.log(action.description())

      gameState.serializedActions.push(action.serializedString())
    }

    var blockedBySegment = false

    for (let segment of this.relevantSegments(gameState)) {
      if (segment.gameEngineWillPerformAction) {
        let segmentAllowsAction = segment.gameEngineWillPerformAction(action, gameState)

        if (!segmentAllowsAction) {
          blockedBySegment = true
          break
        }
      }
    }

    if (!blockedBySegment) {
      if (action.performer) {
        action.performer.performActionOnGameState(action, gameState)
      } else if (action instanceof MAActionLook) {
        this.performActionLook(action, gameState)
      } else if (action instanceof MAActionMove) {
        this.performActionMove(action, gameState)
      } else if (action instanceof MAActionTake) {
        this.performActionTake(action, gameState)
      }
    }

    // Make these callbacks even if the action was blocked by a segment
    // Segments usually block an action to perform it in a custom way
    for (let segment of this.relevantSegments(gameState)) {
      if (segment.gameEngineDidPerformAction) {
        segment.gameEngineDidPerformAction(action, gameState)
      }
    }

    if (this.didPerformActionCallback) {
      this.didPerformActionCallback(gameState)
    }
  }

  performActionLike(str, gameState) {
    if (!gameState) {
      MALog.log("Missing gameState!")
      assertTrue(false, "Missing gameState")
    }
    let caseMatters = str.toLowerCase() != str
    let bracketsMatter = str.includes("[") || str.includes("]")

    var foundAction = null
    var foundTarget = null

    let actions = this.actionsForGameState(gameState)

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
      this.performActionOnGameState(foundAction, gameState)
    } else {
      MALog.log("!! Found no action matching: " + str)
    }
  }

  performActionLook(action, gameState) {
    gameState.log.log(action.chosenTarget.appearance())
    action.chosenTarget.inspected = true
  }

  performActionMove(action, gameState) {
    gameState.currentLocation = action.chosenTarget

    if (!gameState.currentLocation.inspected) {
      gameState.log.log("We enter " + gameState.currentLocation.name + ".")
    }

    gameState.log.log(gameState.currentLocation.appearance())

    gameState.currentLocation.inspected = true
    gameState.currentLocation.visited = true
  }

  performActionTake(action, gameState) {
    let target = action.chosenTarget

    // Remove target from its original owner
    var foundOwner = null
    let findOwnerFilter = function(owner, noun) {
      if (noun == target) {
        foundOwner = owner
      }
      return false
    }
    MAUtils.actionableNounsForGameState(gameState, findOwnerFilter)

    foundOwner.nouns = foundOwner.nouns.filter(x => x != target)


    // A behavior we might want to add in the future:
    // If target is a noun container, we might want to add its
    // contents directly to inventory.nouns and remove them
    // from the container itself. This could be done recursively.
    gameState.inventory.nouns.push(target)


    let verbs = ["take", "take", "take", "take", "take", "take", "get", "get", "get", "pick up", "pick up", "acquire"]
    let verb = verbs[gameState.fakeRandomInt(verbs.length)]

    var desc = ""
    if (!target.inspected && target.appearance()) {
      desc = ` ${target.appearance()}`
    }

    target.inspected = true

    gameState.log.log(`You ${verb} the ${action.chosenTarget.name}.${desc}`)
  }
}


// =======
// Actions
// =======

// Action interface
// - optional targets() method which returns an array of
//   values that can be set as chosenTarget
// - chosenTarget - direct object of the action being performed
// - performer - if set, object which will receive the performActionOnGameState method call for this action
class MAAction {
  constructor() {
  }

  verbString() {
    return "Generic Action"
  }

  description() {
    return "(act)"
  }

  serializedString() {
    if (this.targets != null && this.targets()) {
      return this.verbString(this.chosenTarget)
    } else {
      return this.verbString()
    }
  }
}


// Lookable interface:
// - name (string)
// - inspected (boolean)
// - appearance (method returning string)

class MAActionLook extends MAAction {
  // Properties:
  // - targets (method returning array of Lookable objects)
  // - chosenTarget (Lookable object)
  // - collapseTargetsWithSameName (boolean, whether to deduplicate and indicate item count based on a target's name)

  constructor(targets) {
    super()

    this.rawTargets = targets
  }

  targets() {
    if (this.collapseTargetsWithSameName) {
      return this.collapsedTargets()
    }
    return this.rawTargets
  }

  collapsedTargets() {
    let rawTargets = this.rawTargets
    let result = []
    for (let target of rawTargets) {
      if (result.filter(x => x.name == target.name).length == 0) {
        result.push(target)
      }
    }
    return result
  }

  verbString(target) {
    if (this.collapseTargetsWithSameName) {
      let count = this.rawTargets.filter(x => x.name == target.name).length
      let countStr = count <= 1 ? "" : ` x${count}`
      return `Look at [${target.name}]${countStr}`
    } else {
      return `Look at [${target.name}]`
    }
  }

  description() {
    return `(look) ${this.chosenTarget.name}`
  }
}

class MAActionTake extends MAAction {
  constructor(targets) {
    super()

    this.targets = function () { return targets }
  }

  verbString(target) {
    return `Take [${target.name}]`
  }

  description() {
    return `(take) ${this.chosenTarget.name}`
  }
}

class MAActionRemember extends MAAction {
  constructor(targets) {
    super()

    this.targets = function () { return targets }
  }

  verbString(target) {
    return `Remember [${target.name}]`
  }

  description() {
    return `(remember) ${this.chosenTarget.name}`
  }
}

class MAActionMove extends MAAction {
  // Properties:
  // - currentLocation (MALocation instance)
  // - chosenTarget (MALocation instance)

  constructor(currentLocation) {
    super()

    this.currentLocation = currentLocation
  }

  targets() {
    return this.currentLocation.linkedLocations()
  }

  dirForLoc(location) {
    var dir = MADirection.Count
    for (let i = 0; i < MADirection.Count; ++i) {
      if (this.currentLocation.directionToLocation[i] == location) {
        dir = i
        break
      }
    }

    return dir
  }

  dirStr(dir) {
    return MADirection.toString(dir).toLowerCase()
  }

  verbString(target) {
    let dir = this.dirForLoc(target)
    let dirStr = this.dirStr(dir)
    let dirEmoji = MADirection.toEmoji(dir)

    if (target.visited) {
      return `Go [${dirStr} ${dirEmoji}] to ${target.name}`
    } else {
      return `Go [${dirStr} ${dirEmoji}]`
    }
  }

  description() {
    let dirStr = this.dirStr(this.dirForLoc(this.chosenTarget))
    let inspected = this.chosenTarget.inspected
    if (inspected) {
      return `(go ${dirStr} to) ${this.chosenTarget.name}`
    } else {
      return `(go ${dirStr})`
    }
  }
}


// =====
// Nouns
// =====

class MANoun {
  // Properties:
  // - isFixedInPlace (boolean)
  // - name (string)
  // - desc (string)
  // - inspected (boolean)
  // - weight (MANounWeight)
  // - attributes (array of strings)
  constructor(name, desc=null) {
    this.name = name
    this.desc = desc
    this.inspected = false
    this.isFixedInPlace = false
    this.weight = MANounWeight.Normal
  }

  appearance() {
    return this.desc
  }

  isPlural() {
    return this.name.endsWith("s")
  }

  startsWithVowelSound() {
    let pattern = /^[aeiou]/i
    let matches = pattern.test(this.name)
    return matches
  }

  indefiniteArticle() {
    if (this.isPlural()) {
      return "some"
    } else if (this.startsWithVowelSound()) {
      return "an"
    } else {
      return "a"
    }
  }

  isAre() {
    return this.isPlural() ? "are" : "is"
  }

  itsTheir() {
    return this.isPlural() ? "their" : "its"
  }

  itThem() {
    return this.isPlural() ? "them" : "it"
  }

  itThey() {
    return this.isPlural() ? "they" : "it"
  }

  thatThose() {
    return this.isPlural() ? "those" : "that"
  }

  inSentenceName() {
    return this.indefiniteArticle() + " " + this.name
  }

  addAttribute(str) {
    if (!this.attributes) {
      this.attributes = [ str ]
    } else {
      this.attributes.push(str)
    }
  }

  hasAttribute(str) {
    return this.attributes && this.attributes.includes(str)
  }
}

// Scenery is a noun that can't be taken which can contain other nouns
class MAScenery extends MANoun {
  constructor(name, desc=null) {
    super(name, desc)

    this.isFixedInPlace = true
    this.nouns = []
  }

  hasNounNamed(name) {
    return this.nouns.filter(x => x.name == name).length > 0
  }
}


class MAInventory {
  // Properties:
  // - nouns (array of MANouns)
  // - name (string)
  // - providesActionsModally (boolean) - don't include nouns in the default set of game actions
  // - hidden (boolean) - don't show up as an actionable noun
  constructor() {
    this.name = "inventory"
    this.nouns = []
  }

  appearance() {
    let displayedNouns = this.nouns.filter(x => !x.hidden)

    return `The ${this.name} contains ${displayedNouns.length} item${displayedNouns.length == 1 ? "" : "s"}.`
  }

  hasNounNamed(name) {
    return this.nouns.filter(x => x.name == name).length > 0
  }

  hasAttribute(str) {
    return false
  }
}


class MAPlayer {
  // Properties:
  // - name (string)
  // - worn (array of MANouns)
  constructor() {
    this.name = "yourself"
    this.worn = []
  }

  appearance() {
    if (this.worn.length > 0) {
      return "You are wearing " + MAUtils.naturalLanguageStringForArray(this.worn, "and") + "."
    }
    return "You look normal."
  }

  hasNounNamed(name) {
    return this.worn.filter(x => x.name == name).length > 0
  }
}


