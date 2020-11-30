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


class MAGameSegmentSatchel extends MAGameSegment {
  constructor() {
    super("Satchel")
  }

  suppressOtherActionsForGameState(gameState) {
    return this.valueForKey(gameState, "inventoryMode")
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  lookablesForGameState(gameState) {
    let lookablesFilter = function(owner, noun) {
      return (noun.name != "satchel") && !noun.hidden
    }

    let lookables = MAUtils.actionableNounsForContainer(gameState.inventory, lookablesFilter)

    return lookables
  }

  actionsForGameState(gameState) {
    var actions = []

    if (this.valueForKey(gameState, "inventoryMode")) {
      let lookables = this.lookablesForGameState(gameState)

      let actionLook = new MAActionLook(lookables)
      actionLook.collapseTargetsWithSameName = true
      actions.push(actionLook)

      let actionLookUp = new MAAction()
      actionLookUp.verbString = function() {
        return "Look [up from satchel]"
      }
      actionLookUp.description = function() {
        return "(look) up from satchel"
      }
      actions.push(actionLookUp)


      let showHealingActions = gameState.player.maxHealth
      if (showHealingActions) {
        let healingItems = []
        for (let item of gameState.inventory.nouns) {
          let isHealingItem = /(elixir|potion)/.test(item.name)
          if (isHealingItem && healingItems.filter(x => x.name == item.name).length == 0) {
            healingItems.push(item)
          }
        }

        if (healingItems.length > 0) {
          let actionUse = new MAAction()
          actionUse.targets = function() { return healingItems }
          actionUse.performer = this
          actionUse.verbString = function(target) {
            return `Use [${target.name}]`
          }
          actionUse.description = function() {
            return `(use) ${this.chosenTarget.name}`
          }

          actions.push(actionUse)
        }
      }
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(use)")) {
      var shouldConsumeItem = false

      let fox = MAUtils.wornFox(gameState)

      let itemName = action.chosenTarget.name
      var potionHealAmount = 0
      var elixirReviveAmount = 0
      if (itemName == "small potion") {
        potionHealAmount = 3
      } else if (itemName == "potion") {
        potionHealAmount = 5
      } else if (itemName == "large potion") {
        potionHealAmount = 10
      } else if (itemName == "elixir") {
        elixirReviveAmount = 1
      } else if (itemName == "large elixir") {
        elixirReviveAmount = fox.maxHealth
      }

      if (potionHealAmount > 0) {
        let userDamage = gameState.player.maxHealth - gameState.player.currentHealth

        // Potion can't be used on unconscious fox
        let foxDamage = (fox.currentHealth == 0) ? 0 : (fox.maxHealth - fox.currentHealth)

        let canUsePotion = (userDamage > 0) || (foxDamage > 0)
        if (canUsePotion) {
          // Heal the user first, use what's left for the fox

          let userHealAmount = Math.min(userDamage, potionHealAmount)
          potionHealAmount -= userHealAmount

          let foxHealAmount = Math.min(foxDamage, potionHealAmount)

          var consumeStr = ""
          if (userHealAmount > 0 && foxHealAmount > 0) {
            consumeStr = ", drink what you need, and share the rest with the fox"
          } else if (userHealAmount > 0) {
            consumeStr = " and drink its entire contents"
          } else {
            consumeStr = " and pour it all into the fox's mouth"
          }
          let healStr = `You break open the ${itemName}${consumeStr}.`

          gameState.player.currentHealth += userHealAmount
          fox.currentHealth += foxHealAmount

          gameState.log.log(healStr)

          shouldConsumeItem = true
        }

      } else if (elixirReviveAmount > 0) {
        let canUseElixir = (fox.currentHealth == 0)
        if (canUseElixir) {
          fox.currentHealth = elixirReviveAmount
          let foxIsAtFullHealth = fox.currentHealth == fox.maxHealth
          let healStr = foxIsAtFullHealth ? "full health!" : "consciousness."
          gameState.log.log(`You break open the ${itemName} and pour it all into the fox's mouth. After a moment, it is revived back to ${healStr}`)
          shouldConsumeItem = true
        }
      }


      if (shouldConsumeItem) {
        gameState.inventory.nouns = gameState.inventory.nouns.filter(x => x != action.chosenTarget)
      } else {
        gameState.log.log("There's no need to use that item.")
      }
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    if (action instanceof MAActionLook) {

      if (action.chosenTarget.name == "satchel" && !(action.chosenTarget instanceof MAInventory)) {
        if (!action.chosenTarget.inspected) {
            gameState.log.log(action.chosenTarget.appearance())
            action.chosenTarget.inspected = true
        }

        gameState.log.log(gameState.inventory.appearance())

        return false

      } else if (action.chosenTarget instanceof MAInventory) {
        gameState.log.log(gameState.inventory.appearance())

        if (this.lookablesForGameState(gameState).length > 0) {
          gameState.log.log("You can act on items in the satchel.")
          this.setValueForKey(gameState, true, "inventoryMode")
        }

        return false
      }

    } else if (action instanceof MAActionTake) {
      let hasSatchel = gameState.inventory.hasNounNamed("satchel")
      if (!hasSatchel && action.chosenTarget.name != "satchel") {
        gameState.log.log("You need some way to carry items before you can take the " + action.chosenTarget.name + ".")
        return false
      }
    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
    // Leave inventory mode after any action (that isn't the one that put us into inventory mode)
    let actionTriggeredInventoryMode = (action instanceof MAActionLook && action.chosenTarget instanceof MAInventory)
    if (!actionTriggeredInventoryMode && this.valueForKey(gameState, "inventoryMode")) {
      this.setValueForKey(gameState, false, "inventoryMode")
    }
  }
}


class MAGameSegmentLockedDoors extends MAGameSegment {
  constructor() {
    super("LockedDoors")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return ["room 💼🔒", "room 🧪1️⃣", "room 🐲🐉", "room 🔵🗝"].includes(gameState.currentLocation.name)
  }

  actionsForGameState(gameState) {
    return []
  }

  performActionOnGameState(action, gameState) {
  }

  gameEngineWillPerformAction(action, gameState) {
    if (action instanceof MAActionMove) {

      if (gameState.currentLocation.name == "room 💼🔒") {
        if (action.chosenTarget.name == "room 🧑‍🎤1️⃣") {
          if (!gameState.inventory.hasNounNamed("blue key")) {
            gameState.log.log("A locked door blocks your way.")
            return false

          } else if (!gameState.player.hasNounNamed("fox")) {
            let bloodTrailRoom = gameState.currentLocation.directionToLocation[MADirection.East]
            let injuredFoxRoom = bloodTrailRoom.directionToLocation[MADirection.East]

            var msg = "It doesn't feel right to continue exploring without trying to help the injured fox."

            if (!bloodTrailRoom.inspected) {
              msg = "You feel compelled to investigate the paw prints before moving on."
            } else if (!injuredFoxRoom.inspected) {
              msg = "You feel compelled to investigate the blood trail before moving on."
            }

            gameState.log.log(msg)

            return false

          } else {

            if (!this.valueForKey(gameState, "unlockedBlue")) {
              gameState.log.log("You use the blue key to unlock the door to the south.")
              this.setValueForKey(gameState, true, "unlockedBlue")
            }
          }
        }

      } else if (gameState.currentLocation.name == "room 🐲🐉") {
        if (action.chosenTarget.name == "room 🎊🎉") {
          if (!gameState.inventory.hasNounNamed("gold key")) {
            gameState.log.log("A locked door blocks your way.")
            return false
          } else {

            if (!this.valueForKey(gameState, "unlockedGold")) {
              gameState.log.log("You use the gold key to unlock the door to the east.")
              this.setValueForKey(gameState, true, "unlockedGold")
            }
          }
        }
      } else if (gameState.currentLocation.name == "room 🧪1️⃣") {
        if (action.chosenTarget.name == "room 📜🦷") {
          if (!gameState.inventory.hasNounNamed("orange key")) {
            gameState.log.log("A locked door blocks your way.")
            return false
          } else {

            if (!this.valueForKey(gameState, "unlockedOrange")) {
              gameState.log.log("You use the orange key to unlock the door to the north.")
              this.setValueForKey(gameState, true, "unlockedOrange")
            }
          }
        }
      }
    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
    if (action instanceof MAActionLook) {
      if (action.chosenTarget.name == "blue glimmer") {
        let nouns = gameState.currentLocation.nouns
        gameState.currentLocation.nouns = nouns.filter(x => x.name != "blue glimmer")
        let blueKey = new MANoun("blue key", "Shiny, metallic, blue.")
        gameState.currentLocation.nouns.push(blueKey)
      }
    }
  }
}



class MAGameSegmentFox extends MAGameSegment {
  constructor() {
    super("Fox")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return ["room 🩸🦊"].includes(gameState.currentLocation.name)
  }

  actionsForGameState(gameState) {
    let actions = []
    if (gameState.currentLocation.hasNounNamed("injured fox") && gameState.inventory.hasNounNamed("small potion")) {
      let actionHeal = new MAAction()
      actionHeal.performer = this
      actionHeal.verbString = function() {
        return "Heal [injured fox with small potion]"
      }
      actionHeal.description = function() {
        return "(heal) injured fox with small potion"
      }
      actions.push(actionHeal)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.verbString().startsWith("Heal")) {
      gameState.log.log("You kneel next to the fox and gently examine it. You carefully open its mouth -- it whimpers in pain -- and pour the small potion in.\n\nA few tense moments pass before the fox stands up, fully healed!")

      let inventoryNouns = gameState.inventory.nouns
      gameState.inventory.nouns = inventoryNouns.filter(x => x.name != "small potion")

      let nouns = gameState.currentLocation.nouns
      gameState.currentLocation.nouns = nouns.filter(x => x.name != "injured fox")

      let fox = new MAScenery("fox", "Healthy and curiously exploring the room as if nothing had happened.")
      gameState.currentLocation.nouns.push(fox)
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    if ((action instanceof MAActionMove) &&
        (gameState.currentLocation.hasNounNamed("fox"))) {
      gameState.log.log("Before you get too far, the fox quickly leaps up onto your shoulder with a friendly \"yip!\". It looks like you have a new companion.")

      let nouns = gameState.currentLocation.nouns
      gameState.currentLocation.nouns = nouns.filter(x => x.name != "fox")

      let fox = new MANoun("fox", "Cute and tame.")
      fox.inSentenceName = function() {
        return "a fox (on your shoulder)"
      }
      gameState.player.worn.push(fox)
    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}



class MAGameSegmentGear extends MAGameSegment {
  constructor() {
    super("Gear")
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

    let foxItemNames = [
      "small leather armor",
      "metal fangs",
      "super metal fangs",
    ]
    let foxItems = gameState.inventory.nouns.filter(x => foxItemNames.includes(x.name))

    if (gameState.player.hasNounNamed("fox") &&
        foxItems.length > 0) {

      let actionPut = new MAAction()
      actionPut.performer = this
      actionPut.verbString = function(target) {
        return `Put [${target.name}] on fox`
      }
      actionPut.description = function() {
        return `(put on fox) ${this.chosenTarget.name}`
      }

      actionPut.targets = function() { return foxItems }
      actions.push(actionPut)
    }

    if (gameState.inventory.hasNounNamed("bronze helm")) {
      let actionWear = new MAAction()
      actionWear.performer = this
      actionWear.verbString = function() {
        return "Wear [bronze helm]"
      }
      actionWear.description = function() {
        return "(wear) bronze helm"
      }
      actions.push(actionWear)
    }



    let fox = MAUtils.wornFox(gameState)
    let foxHasMetalFangs = fox && fox.worn && fox.worn.filter(x => x.name == "metal fangs").length > 0
    let hasMetalFangs = gameState.inventory.hasNounNamed("metal fangs") || foxHasMetalFangs

    if (hasMetalFangs && gameState.inventory.hasNounNamed("pamphlet")) {
      let actionRead = new MAAction()
      actionRead.performer = this
      actionRead.verbString = function() {
        return "Read [pamphlet]"
      }
      actionRead.description = function() {
        return "(read) pamphlet"
      }
      actions.push(actionRead)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {

    if (action instanceof MAActionLook) {
      let fox = MAUtils.wornFox(gameState)

      var foxAppearance = ""
      if (fox) {
        if (fox.currentHealth === 0) {
          foxAppearance = "\n\nYou balance with care because the fox is still unconscious from battle."
        } else if (!fox.worn || fox.worn.length <= 0) {
          foxAppearance = "\n\nThe fox looks normal."
        } else {
          foxAppearance = "\n\nThe fox is wearing " + MAUtils.naturalLanguageStringForArray(fox.worn, "and") + "."
        }
      }

      let playerHealthStr = (gameState.player.currentHealth <= 3) ? "You look bruised and battle-worn. You need to heal.\n\n" : ""

      gameState.log.log(playerHealthStr + gameState.player.appearance() + foxAppearance)

    } else if (action.description().startsWith("(wear)")) {
      gameState.log.log("You gently push your head into the bronze helm. Not too comfortable but it gives you some protection from swinging clubs and falling rocks.\n\nThe helm wasn't enough to save its previous owner, though...")

      let inventoryNouns = gameState.inventory.nouns
      let bronzeHelm = inventoryNouns.filter(x => x.name == "bronze helm")[0]

      gameState.inventory.nouns = inventoryNouns.filter(x => x.name != "bronze helm")
      gameState.player.worn.push(bronzeHelm)

    } else if (action.description().startsWith("(put on fox)")) {
      let currInv = gameState.inventory.nouns
      gameState.inventory.nouns = currInv.filter(x => x.name != action.chosenTarget.name)

      let fox = MAUtils.wornFox(gameState)
      if (!fox.worn) {
        fox.worn = []
      }
      fox.worn.push(action.chosenTarget)

      gameState.log.log(`You put the ${action.chosenTarget.name} on the fox.`)

    } else if (action.description().startsWith("(read)")) {
      // Replace "metal fangs" with "super metal fangs"
      let superMetalFangs = new MANoun("super metal fangs", "Sharp, shiny, and ready to do some damage. Superbly tuned thanks to a very informative pamphlet.")
      gameState.inventory.nouns = gameState.inventory.nouns.map(x => (x.name == "metal fangs" ? superMetalFangs : x))

      let fox = MAUtils.wornFox(gameState)
      if (fox && fox.worn) {
        fox.worn = fox.worn.map(x => (x.name == "metal fangs" ? superMetalFangs : x))
      }

      gameState.log.log("The pamphlet is super informative and you use its instructions to upgrade the metal fangs into super metal fangs!")
    }

  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}



class MAGameSegmentMagicParchment extends MAGameSegment {
  constructor() {
    super("MagicParchment")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  actionsForGameState(gameState) {
    let actions = []

    let hasTornParchment = gameState.inventory.hasNounNamed("torn parchment")
    let hasTornParchment2 = gameState.inventory.hasNounNamed("torn parchment #2")
    if (hasTornParchment && hasTornParchment2) {
      let actionCombine = new MAAction()

      actionCombine.performer = this
      actionCombine.verbString = function() {
        return "Combine [torn pieces of parchment]"
      }
      actionCombine.description = function() {
        return "(combine) torn pieces of parchment"
      }
      actions.push(actionCombine)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(combine)")) {
      gameState.log.log("You take the two pieces of parchment and line up the torn edges to fit together. You can make out some words written across the top and you read them aloud, \"Skibbity Skobbity Floop!\". That incantation did the trick: with a *puff* and a *sizzle* the parchment is whole.")

      gameState.inventory.nouns = gameState.inventory.nouns.filter(x => !x.name.startsWith("torn parchment"))
      let magicParchment = new MANoun("magic parchment", "Reassembled parchment")
      gameState.inventory.nouns.push(magicParchment)
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    if (action instanceof MAActionLook) {

      if (action.chosenTarget.name == "magic parchment") {
        if (!action.chosenTarget.inspected) {
          action.chosenTarget.inspected = true

          gameState.log.log("This magic parchment appears to show its holder information that will be useful. What a great find!")
        }

        gameState.log.log("The parchment's ink snakes around and shifts shape as it updates.")

        var parchmentText = `Health:\n`
        parchmentText += `😶 ${gameState.player.currentHealth}/${gameState.player.maxHealth}\n`
        let fox = MAUtils.wornFox(gameState)
        parchmentText += `🦊 ${fox.currentHealth}/${fox.maxHealth}\n`


        let hasSmallLeatherArmor = fox.worn && fox.worn.filter(x => x.name == "small leather armor").length > 0
        let hasBronzeHelm = gameState.player.worn.filter(x => x.name == "bronze helm").length > 0

        let hasMetalFangs = fox.worn && fox.worn.filter(x => x.name == "metal fangs").length > 0
        let hasSuperMetalFangs = fox.worn && fox.worn.filter(x => x.name == "super metal fangs").length > 0
        let hasAnyEquipment = hasSmallLeatherArmor || hasBronzeHelm || hasMetalFangs || hasSuperMetalFangs

        if (hasAnyEquipment) {
          parchmentText += `\nEquipment:\n`
          if (hasBronzeHelm) {
            parchmentText += `bronze helm - reduces damage taken by 1\n`
          }
          if (hasSmallLeatherArmor) {
            parchmentText += `small leather armor - reduces damage taken by 1\n`
          }
          if (hasMetalFangs) {
            parchmentText += `metal fangs - enables Metallic Bite attack\n`
          }
          if (hasSuperMetalFangs) {
            parchmentText += `super metal fangs - enables Super Metallic Bite attack\n`
          }
        }


        parchmentText += `\nAttacks:\n`

        parchmentText += `😶\n`
        parchmentText += `Kick - deals 1 damage\n`
        parchmentText += `Punch - deals between 0 and 3 damage. Average: 1.4\n`
        parchmentText += `\n`

        parchmentText += `🦊\n`
        parchmentText += `Scratch - deals 1 damage\n`
        if (hasSuperMetalFangs) {
          parchmentText += `Super Metallic Bite - deals between 0 and 7 damage. Average: 3\n`
        } else if (hasMetalFangs) {
          parchmentText += `Metallic Bite - deals between 0 and 5 damage. Average: 2.6\n`
        } else {
          parchmentText += `Bite - deals between 0 and 5 damage. Average: 2.2\n`
        }



        let hasSmallPotion = gameState.inventory.hasNounNamed("small potion")
        let hasPotion = gameState.inventory.hasNounNamed("potion")
        let hasLargePotion = gameState.inventory.hasNounNamed("large potion")
        let hasElixir = gameState.inventory.hasNounNamed("elixir")
        let hasLargeElixir = gameState.inventory.hasNounNamed("large elixir")

        let hasInventory = hasSmallPotion || hasPotion || hasLargePotion || hasElixir || hasLargeElixir
        if (hasInventory) {
          parchmentText += `\nInventory:\n`
          if (hasSmallPotion) {
            parchmentText += `small potion - restores 3 health\n`
          }
          if (hasPotion) {
            parchmentText += `potion - restores 5 health\n`
          }
          if (hasLargePotion) {
            parchmentText += `large potion - restores 10 health\n`
          }
          if (hasElixir) {
            parchmentText += `elixir - revives unconscious fox and restores 1 health\n`
          }
          if (hasLargeElixir) {
            parchmentText += `large elixir - revives unconscious fox and restores full health\n`
          }
        }

        gameState.log.log(parchmentText)

        return false

      }

    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}



class MAGameSegmentCot extends MAGameSegment {
  constructor() {
    super("Cot")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    let cots = gameState.currentLocation.nouns.filter(x => x.name == "cot")
    if (cots.length > 0) {
      return cots[0].inspected
    }

    return false
  }

  actionsForGameState(gameState) {
    let actions = []

    let actionRest = new MAAction()
    actionRest.performer = this
    actionRest.verbString = function(target) {
      return "Rest on [cot]"
    }
    actionRest.description = function() {
      return "(rest) cot"
    }
    actions.push(actionRest)

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(rest)")) {

      let playerNeededRest = gameState.player.maxHealth && (gameState.player.currentHealth < gameState.player.maxHealth)

      let fox = MAUtils.wornFox(gameState)
      let foxNeededRest = fox && fox.maxHealth && (fox.currentHealth < fox.maxHealth)

      if (playerNeededRest) {
        gameState.player.currentHealth = gameState.player.maxHealth
      }

      if (foxNeededRest) {
        fox.currentHealth = fox.maxHealth
      }

      if (!playerNeededRest && !foxNeededRest) {
        var tauntStr = this.valueForKey(gameState, "hasSleptUnnecessarily") ? "\n\nYou sure like to sleep." : ""

        let foxStr = fox ? "and the fox " : ""
        gameState.log.log("After a short nap, you " + foxStr + "wake up feeling refreshed." + tauntStr)

        this.setValueForKey(gameState, true, "hasSleptUnnecessarily")
      } else {
        let foxStr = fox ? "and the fox " : ""
        gameState.log.log("After a long rest, you " + foxStr + "wake up fully healed.")
      }
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}
