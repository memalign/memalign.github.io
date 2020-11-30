// ====
// This file contains GameSegmentBattle and related model classes
// ====

class MAEnemy extends MANoun {
  // Properties:
  // - maxHealth (int)
  // - currentHealth (int)
  // - battleAttempts (int)

  constructor(name, desc, maxHealth) {
    super(name, desc)
    this.isFixedInPlace = true

    this.maxHealth = maxHealth

    this.currentHealth = this.maxHealth
    this.battleAttempts = 0
  }

  // Returns array of strings
  taunts() {
    return []
  }

  // Returns array of MAAttack instances
  attacks() {
    return []
  }
}


class MAAttack {
  // Properties:
  // - name (string)
  // - hasNoTarget - boolean; true for attacks that do not target an enemy (e.g. "Snooze")
  // - possibleDamageDealt (array of ints) - a damage amount is chosen randomly from this array when the attack is performed. E.g. [0, 1, 2, 2] means (25% chance of dealing 0 damage, 25% chance of dealing 1 damage, 50% chance of dealing 2 damage)

  constructor(name, possibleDamageDealt) {
    this.name = name
    this.possibleDamageDealt = possibleDamageDealt
    this.hasNoTarget = false
  }

  // Returns string describing the sound of the attack for a given amount of damage being dealt
  // E.g. "THWAK!", "Whoosh!", etc
  soundDescriptionForDamageAmount(damageAmount) {
    return ""
  }

  randomDamageAmount(gameState) {
    return this.possibleDamageDealt[gameState.fakeRandomInt(this.possibleDamageDealt.length)]
  }
}


class MAActionAttack extends MAAction {
  // Properties:
  // - attack (MAAttack)
  // - enemy (MAEnemy

  constructor(attack, enemy) {
    super()

    this.attack = attack
    this.enemy = enemy
  }

  verbString() {
    return `${this.attack.name} [${this.enemy.name}]`
  }

  description() {
    return `(${this.attack.name.toLowerCase()}) ${this.enemy.name}`
  }
}

class MAActionFoxAttack extends MAActionAttack {
  verbString() {
    return `Tell fox to ${this.attack.name} [${this.enemy.name}]`
  }

  description() {
    return `(fox ${this.attack.name.toLowerCase()}) ${this.enemy.name}`
  }
}

class MAGameSegmentBattle extends MAGameSegment {
  constructor() {
    super("Battle")
  }

  foxAttackActions(gameState) {
    let enemy = MAUtils.enemyInCurrentLocation(gameState)
    let fox = MAUtils.wornFox(gameState)

    let actions = []

    let scratchAttack = new MAAttack("Scratch", [1])
    scratchAttack.soundDescriptionForDamageAmount = function(damageAmount) {
      let sounds = ["Rip!", "Slash!", "Shhhkt!", "Slice!"]
      return sounds[gameState.fakeRandomInt(sounds.length)]
    }
    let scratchAction = new MAActionFoxAttack(scratchAttack, enemy)
    scratchAction.performer = this
    actions.push(scratchAction)


    let foxHasMetalFangs = fox.worn && fox.worn.filter(x => x.name == "metal fangs").length > 0
    let foxHasSuperMetalFangs = fox.worn && fox.worn.filter(x => x.name == "super metal fangs").length > 0

    if (foxHasMetalFangs || foxHasSuperMetalFangs) {

      let metalBiteAttack = foxHasSuperMetalFangs ? new MAAttack("Super Metallic Bite", [0, 0, 4, 4, 7]) : new MAAttack("Metallic Bite", [0, 0, 4, 4, 5])

      metalBiteAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        var sounds = ["Metal clashes against metal where flesh was mere moments earlier!", "The fox misses and metal closes on metal. Clang!", "Too slow!"]
        if (damageAmount == 4) {
          sounds = ["Chomp!", "Munch!"]
        } else if (damageAmount == 7 || damageAmount == 5) {
          sounds = ["CHOMP! Critical hit!"]
        }

        return sounds[gameState.fakeRandomInt(sounds.length)]
      }

      let metalBiteAction = new MAActionFoxAttack(metalBiteAttack, enemy)
      metalBiteAction.performer = this
      actions.push(metalBiteAction)

    } else {

      let biteAttack = new MAAttack("Bite", [0, 0, 3, 3, 5])
      biteAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        var sounds = ["Teeth clash against teeth where flesh was mere moments earlier!", "Too slow!"]
        if (damageAmount == 3) {
          sounds = ["Chomp!", "Munch!"]
        } else if (damageAmount == 5) {
          sounds = ["CHOMP! Critical hit!"]
      }

        return sounds[gameState.fakeRandomInt(sounds.length)]
      }
      let biteAction = new MAActionFoxAttack(biteAttack, enemy)
      biteAction.performer = this
      actions.push(biteAction)
    }


    return actions
  }

  userAttackActions(gameState) {
    let enemy = MAUtils.enemyInCurrentLocation(gameState)

    let actions = []

    let kickAttack = new MAAttack("Kick", [1])
    kickAttack.soundDescriptionForDamageAmount = function(damageAmount) {
      let sounds = ["Thunk!", "Thump!", "Thwap!", "Oof!"]
      return sounds[gameState.fakeRandomInt(sounds.length)]
    }
    let kickAction = new MAActionAttack(kickAttack, enemy)
    kickAction.performer = this
    actions.push(kickAction)

    let punchAttack = new MAAttack("Punch", [0, 0, 2, 2, 3])
    punchAttack.soundDescriptionForDamageAmount = function(damageAmount) {
      var sounds = ["Whoosh!", "Whif!"]
      if (damageAmount == 2) {
        sounds = ["Pow!", "Bam!"]
      } else if (damageAmount == 3) {
        sounds = ["BAM! Critical hit!", "BOP! Critical hit!", "POW! Critical hit!"]
      }

      return sounds[gameState.fakeRandomInt(sounds.length)]
    }
    let punchAction = new MAActionAttack(punchAttack, enemy)
    punchAction.performer = this
    actions.push(punchAction)


    let hasDebugToken = gameState.inventory.hasNounNamed("debug token")
    if (hasDebugToken) {
      // Action to always miss the enemy
      let missAttack = new MAAttack("Miss", [0])
      missAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return "Whoosh!"
      }
      let missAction = new MAActionAttack(missAttack, enemy)
      missAction.performer = this
      actions.push(missAction)

      // Action that will kill any enemy with one hit
      let killAttack = new MAAttack("Kill", [1000])
      killAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return "BOOM!"
      }
      let killAction = new MAActionAttack(killAttack, enemy)
      killAction.performer = this
      actions.push(killAction)
    }

    return actions
  }

  userBattleActions(gameState) {
    let actions = []

    let fox = MAUtils.wornFox(gameState)

    if (fox.currentHealth > 0) {
      let foxAttackActions = this.foxAttackActions(gameState)
      Array.prototype.push.apply(actions, foxAttackActions)
    }

    let userAttackActions = this.userAttackActions(gameState)
    Array.prototype.push.apply(actions, userAttackActions)

    return actions
  }

  setupUserHealthIfNecessary(gameState) {
    if (!gameState.player.maxHealth) {
      gameState.player.maxHealth = 10
      gameState.player.currentHealth = gameState.player.maxHealth

      let fox = MAUtils.wornFox(gameState)
      fox.maxHealth = 5
      fox.currentHealth = fox.maxHealth
    }
  }

  suppressOtherActionsForGameState(gameState) {
    return this.battleIsActive(gameState)
  }

  // This segment is relevant even when !battleIsActive so it can track location changes. It needs to track location changes to correctly handle the user losing a battle and automatically retreating to the previous location.
  segmentIsRelevantForGameState(gameState) {
    return true
  }

  battleIsActive(gameState) {
    return (MAUtils.enemyInCurrentLocation(gameState) != null)
  }

  actionsForGameState(gameState) {
    if (!this.battleIsActive(gameState)) {
      return
    }


    this.setupUserHealthIfNecessary(gameState)

    let actions = []

    let satchelActions = this.gameSegmentSatchel.actionsForGameState(gameState)
    actions.concat(satchelActions)

    let satchelSuppressesActions = this.gameSegmentSatchel.suppressOtherActionsForGameState(gameState)

    if (!satchelSuppressesActions) {

      let actionLookInventory = new MAActionLook([gameState.inventory])
      actions.push(actionLookInventory)


      let enemy = MAUtils.enemyInCurrentLocation(gameState)

      let actionLook = new MAActionLook([enemy])
      actions.push(actionLook)

      actions = actions.concat(this.userBattleActions(gameState))

      let actionRunAway = new MAAction()
      actionRunAway.performer = this
      actionRunAway.verbString = function() {
        return "Run [away]"
      }
      actionRunAway.description = function() {
        return "(run) away"
      }
      actions.push(actionRunAway)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action instanceof MAActionAttack) {

      let enemy = action.enemy

      var damageAmount = action.attack.randomDamageAmount(gameState)
      let damageSound = action.attack.soundDescriptionForDamageAmount(damageAmount)

      damageAmount = Math.min(damageAmount, enemy.currentHealth)


      let hitStrs = ["Success!", "Nice!", "Wow!", "Woo!"]
      let missStrs = ["Miss!", "Oh no!", "Aw!", "Oops!"]
      let relevantStrs = (damageAmount > 0) ? hitStrs : missStrs
      let hitMissStr = relevantStrs[gameState.fakeRandomInt(relevantStrs.length)]

      gameState.log.log(`${damageSound}`)

      enemy.currentHealth -= damageAmount

      let healthRemainingStr = (enemy.currentHealth > 0) ? ` The ${enemy.name} has ${enemy.currentHealth} health remaining.` : ""

      gameState.log.log(`Your attack dealt ${damageAmount} damage. ${hitMissStr}${healthRemainingStr}`)

      if (enemy.currentHealth == 0) {
        gameState.log.log(`The ${enemy.name} has been dispatched from this realm!`)

        let currNouns = gameState.currentLocation.nouns
        gameState.currentLocation.nouns = currNouns.filter(x => x.name != enemy.name)

        if (enemy.defeatHandler) {
          enemy.defeatHandler(gameState)
        }

      } else {
        this.performEnemyAttack(enemy, gameState)
      }

    } else if (action.description().startsWith("(run)")) {
      gameState.log.log("You run away, escaping with your life to fight another day.")

      this.handleFleeBattle(gameState)
    }
  }

  performEnemyAttack(enemy, gameState) {
    let taunts = enemy.taunts()
    let taunt = taunts[gameState.fakeRandomInt(taunts.length)]
    gameState.log.log(taunt)


    let attacks = enemy.attacks()
    let attack = attacks[gameState.fakeRandomInt(attacks.length)]

    // Choose randomly between player and fox (if fox is conscious)
    let fox = MAUtils.wornFox(gameState)
    var attackTarget = gameState.player
    if (fox.currentHealth > 0) {
      if (gameState.fakeRandomInt(2) == 1) {
        attackTarget = fox
      }
    }


    var damageAmount = attack.randomDamageAmount(gameState)
    let damageSound = attack.soundDescriptionForDamageAmount(damageAmount)

    // Reduce damage if armor is involved
    // Gear is mentioned in MAGameSegmentGear
    // If we expand the amount of gear, it might be beneficial to do some general armor modeling instead of these harcoded strings/values
    var armorStr = ""
    if (attackTarget == fox) {
      let hasSmallLeatherArmor = fox.worn && fox.worn.filter(x => x.name == "small leather armor").length > 0
      if (hasSmallLeatherArmor && damageAmount > 0) {
        damageAmount--
        armorStr = "The fox's small leather armor protected it from 1 damage. "
      }
    } else {
      let hasBronzeHelm = gameState.player.worn.filter(x => x.name == "bronze helm").length > 0
      if (hasBronzeHelm && damageAmount > 0) {
        damageAmount--
        armorStr = "Your bronze helm protected you from 1 damage. "
      }
    }


    damageAmount = Math.min(damageAmount, attackTarget.currentHealth)

    let hitStrs = ["A direct hit!", "Ouch!", "Oh no!", "Misfortune!"]
    let missStrs = ["Whew!", "How fortunate!", "Safe!", "Unharmed!"]
    let relevantStrs = (damageAmount > 0) ? hitStrs : missStrs
    let hitMissStr = relevantStrs[gameState.fakeRandomInt(relevantStrs.length)]

    let targetStr = attackTarget == fox ? "the fox" : "you"
    var attackStrs = [
    `The ${enemy.name} takes aim at ${targetStr} with its ${attack.name} attack.`,
    `The ${enemy.name} aims at ${targetStr} and uses ${attack.name}.`,
    `The ${enemy.name} targets ${targetStr} with this next attack: ${attack.name}.`,
    `The ${enemy.name} uses ${attack.name}, taking aim at ${targetStr}.`,
    ]
    if (attack.hasNoTarget) {
      attackStrs = [
        `The ${enemy.name} uses ${attack.name}.`,
      ]
    }
    let attackStr = attackStrs[gameState.fakeRandomInt(attackStrs.length)]

    gameState.log.log(attackStr)
    gameState.log.log(`${damageSound}`)

    attackTarget.currentHealth -= damageAmount

    let healthTargetStr = attackTarget == fox ? "The fox has" : "You have"
    let healthRemainingStr = (attackTarget.currentHealth > 0) ? ` ${healthTargetStr} ${attackTarget.currentHealth} health remaining.` : ""

    gameState.log.log(`${armorStr}The ${enemy.name} dealt ${damageAmount} damage. ${hitMissStr}${healthRemainingStr}`)

    if (attackTarget == fox && fox.currentHealth == 0) {
      let knockoutStrs = [
      "Your furry companion is knocked unconscious. Hold on little guy!",
      "The fox has taken too much damage and collapses. It's up to you now.",
      "This assault was too strong for the fox. Its small body goes limp.",
      "The fox yelps in pain and collapses. Your companion is unconcious.",
      ]
      gameState.log.log(knockoutStrs[gameState.fakeRandomInt(knockoutStrs.length)])
    } else if (gameState.player.currentHealth == 0) {

      // Handle the user losing the battle
      // They will need to heal with potions or by finding a healing room before pushing deeper into the dungeon

      gameState.log.log("Feeling faint, you manage to stagger out of the room back the way you came. You have escaped with your life... this time.")
      gameState.log.log("With difficulty and a great deal of pain, you manage to treat your wounds just enough to resume navigating this dungeon. You need to heal significantly before you can face another enemy.")

      gameState.player.currentHealth = 1

      this.handleFleeBattle(gameState)
    }
  }

  handleFleeBattle(gameState) {
    let enemy = MAUtils.enemyInCurrentLocation(gameState)
    enemy.currentHealth = enemy.maxHealth
    enemy.battleAttempts++

    let prevLocName = this.valueForKey(gameState, "prevLocName")
    gameState.currentLocation = gameState.map.nameToLocation[prevLocName]

    gameState.log.log("You are in " + gameState.currentLocation.name + ".")
  }

  gameEngineWillPerformAction(action, gameState) {
    if (action instanceof MAActionMove) {
      this.setValueForKey(gameState, gameState.currentLocation.name, "prevLocNameBeforeMove")
    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
    if (action instanceof MAActionMove) {
      // We needed to capture the previous currentLocation name before the move was executed in gameEngineWillPerformAction
      // Remember this value now that we know the Move action didn't get blocked by any GameSegment
      this.setValueForKey(gameState, this.valueForKey(gameState, "prevLocNameBeforeMove"), "prevLocName")


      let enemy = MAUtils.enemyInCurrentLocation(gameState)
      if (enemy != null && enemy.battleAttempts > 0) {
        gameState.log.log(`The battle with the ${enemy.name} resumes! Unfortunately for you, enough time has passed for significant healing.`)
      }
    }
  }
}
