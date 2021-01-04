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

    let memDesc = memory.description()
    memory.rememberCount++
    let suffix = (memory.completed() && memory.descriptions.length > 1) ? "" : "\n\nThen we're back in the present."
    gameState.log.log(memDesc + suffix)
  }

  gameEngineDidPerformAction(action, gameState) {
    if (action instanceof MAActionLook) {
      let memories = gameState.memories.memories.filter(x => !x.triggered && x.lookTriggers.includes(action.chosenTarget.name))

      for (let memory of memories) {
        memory.triggered = true

        let memoryPrompts = [
          "Something makes you think of",
          "You have a fleeting thought of",
          "You are reminded of",
        ]
        let memoryPrompt = memoryPrompts[gameState.fakeRandomInt(memoryPrompts.length)]

        gameState.log.log(`${memoryPrompt} ${memory.name}.`)
      }
    }
  }
}


class MAGameSegmentLetterRemover extends MAGameSegment {
  constructor() {
    super("LetterRemover")
  }

  suppressOtherActionsForGameState(gameState) {
    let mode = this.valueForKey(gameState, "mode")
    let inChooseNounMode = (mode == "chooseNounMode")
    let inChooseLetterMode = (mode == "chooseLetterMode")
    return inChooseNounMode || inChooseLetterMode
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  setupNounRepositoryIfNeeded(gameState) {
    if (gameState.nounRepository) {
      return
    }

    gameState.nounRepository = new MANounRepository()
  }

  actionsForGameState(gameState) {
    this.setupNounRepositoryIfNeeded(gameState)

    let actions = []

    let letterRemover = MAUtils.elementNamed(gameState.inventory.nouns, "letter-remover")

    let mode = this.valueForKey(gameState, "mode")
    let inChooseNounMode = (mode == "chooseNounMode")
    let inChooseLetterMode = (mode == "chooseLetterMode")

    if (letterRemover && letterRemover.inspected) {

      if (inChooseNounMode) {
        // The user wants to use the letter-remover and needs to pick the target noun

        let removeLetterFilter = function(owner, noun) {
          if (noun == gameState.inventory || noun.name == "letter-remover") {
            return false
          }
          return true
        }
        let targets = MAUtils.actionableNounsForGameState(gameState, removeLetterFilter)

        let actionUseLR = new MAAction()
        actionUseLR.performer = this
        actionUseLR.targets = function() { return targets }
        actionUseLR.verbString = function(target) {
          return `Use letter-remover on [${target.name}]`
        }
        actionUseLR.description = function() {
          return `(use letter-remover) ${this.chosenTarget.name}`
        }
        actions.push(actionUseLR)


        let actionNevermind = new MAAction()
        actionNevermind.performer = this
        actionNevermind.verbString = function() {
          return "[Nevermind]"
        }
        actionNevermind.description = function() {
          return "(nevermind)"
        }
        actions.push(actionNevermind)

      } else if (inChooseLetterMode) {
        // The user already chose a noun and needs to choose what letter to remove
        let targetNoun = this.valueForKey(gameState, "chosenNoun")
        let targets = Array.from(new Set(targetNoun.name.toLowerCase())).sort().filter(x => x != " " && x != "-")

        let actionUseLR = new MAAction()
        actionUseLR.performer = this
        actionUseLR.targets = function() { return targets }
        actionUseLR.verbString = function(target) {
          return `Remove [${target} from ${targetNoun.name}]`
        }
        actionUseLR.description = function() {
          return `(remove ${this.chosenTarget}) ${targetNoun.name}`
        }
        actions.push(actionUseLR)


        let actionNevermind = new MAAction()
        actionNevermind.performer = this
        actionNevermind.verbString = function() {
          return "[Nevermind]"
        }
        actionNevermind.description = function() {
          return "(nevermind)"
        }
        actions.push(actionNevermind)

      } else {
        // Not in a Letter-remover mode yet

        let actionUseLR = new MAAction()
        actionUseLR.performer = this
        actionUseLR.verbString = function() {
          return `Use [letter-remover]`
        }
        actionUseLR.description = function() {
          return `(use) letter-remover`
        }
        actions.push(actionUseLR)
      }
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(use) letter-remover")) {
      this.setValueForKey(gameState, "chooseNounMode", "mode")
      gameState.log.log("What should we use the letter-remover on?")

    } else if (action.description().startsWith("(use letter-remover)")) {
      this.setValueForKey(gameState, "chooseLetterMode", "mode")
      this.setValueForKey(gameState, action.chosenTarget, "chosenNoun")
      gameState.log.log("What letter should we remove?")

    } else if (action.description().startsWith("(remove ")) {
      let targetNoun = this.valueForKey(gameState, "chosenNoun")
      let targetLetter = action.chosenTarget

      this.performActionLetterRemove(gameState, targetNoun, targetLetter)

      this.setValueForKey(gameState, null, "mode")
      this.setValueForKey(gameState, null, "chosenNoun")

    } else if (action.description().startsWith("(nevermind)")) {
      this.setValueForKey(gameState, null, "mode")
      this.setValueForKey(gameState, null, "chosenNoun")
    }
  }

  performActionLetterRemove(gameState, targetNoun, targetLetter) {
    let lastRemovedLetter = this.valueForKey(gameState, "lastRemovedLetter")

    let removerName = `${targetLetter}-remover`

    if (lastRemovedLetter != targetLetter) {
      let removerArticle = "aefhilmnorsx".includes(targetLetter) ? "an" : "a"
      let aAnRemoverName = `${removerArticle} ${removerName}`

      let letterChangeStrs = [
        `We smoothly, and almost without thinking about it, reset your device to be ${aAnRemoverName}.`,
        `We run our thumb over the dial, setting the device to be ${aAnRemoverName}.`,
        `We reset the device to ${aAnRemoverName}.`,
        `We flick our thumb over the small knob: we now have ${aAnRemoverName}.`,
      ]

      let letterChangeStr = MAUtils.fakeRandomElement(letterChangeStrs, gameState)
      gameState.log.log(letterChangeStr)

      this.setValueForKey(gameState, targetLetter, "lastRemovedLetter")
    }


    if (targetNoun.durabilityMessage) {
      gameState.log.log(targetNoun.durabilityMessage)
    } else {

      let letterRemovedName = targetNoun.name.toLowerCase().split(targetLetter).join("")

      let foundNoun = gameState.nounRepository.nounForString(letterRemovedName)

      let isCrude = foundNoun && foundNoun.hasAttribute("crude")
      let isAlive = foundNoun && (foundNoun.hasAttribute("person") || foundNoun.hasAttribute("creature"))
      let isAbstract = foundNoun && foundNoun.hasAttribute("abstract")

      let canMakeAliveThings = this.valueForKey(gameState, "hasAnimatesUpgrade")
      let canMakeAbstractThings = this.valueForKey(gameState, "hasAbstractsUpgrade")


      if (foundNoun && foundNoun.errorMessage) {
        gameState.log.log(foundNoun.errorMessage)

      } else if (isCrude) {
        gameState.log.log("A safety override mechanism kicks into play before the operation is complete; the device plays a short snickering noise. Evidently its one joy in life is detecting and foiling practical jokes.")

      } else if (isAlive && !canMakeAliveThings) {
        gameState.log.log(`The ${targetNoun.name} flickers and there is a brief image of ${foundNoun.inSentenceName()} in ${targetNoun.itsTheir()} place, but a legal override kicks in: a letter-remover is hardware-limited to prevent generating any living creature.`)

      } else if (isAbstract && !canMakeAbstractThings) {
        let randomCommentaryStrs = [
          " I guess this device just isn't tuned to reify abstracts.",
          "",
        ]

        let randomCommentaryStr = MAUtils.fakeRandomElement(randomCommentaryStrs, gameState)

        gameState.log.log(`The ${targetNoun.name} flickers and there is a brief image of ${foundNoun.inSentenceName()} in ${targetNoun.itsTheir()} place — the concept strangely embodied in a physical form — before the power gives out.${randomCommentaryStr}`)

      } else if (!foundNoun) {

        var errorText = null

        if (letterRemovedName.includes(" ")) {
          let targetNounLastWord = targetNoun.name.split(" ").pop()
          let randStrs = [ "", " This is a serious problem in my field of study, incidentally." ]
          let randStr = MAUtils.fakeRandomElement(randStrs, gameState)

          let weightStr = targetNoun.weight == MANounWeight.Huge ? ` Or perhaps it just doesn't have sufficient power to handle the ${targetNoun.name}.` : ""

          errorText = `The device buzzes, puzzled. It has tried to create a "${letterRemovedName}": evidently "${targetNounLastWord}" ${targetNoun.isAre()} too tightly bound to ${targetNoun.itsTheir()} modifiers and can't be manipulated separately.${randStr}${weightStr}`

        } else if (letterRemovedName.length == 0) {
          errorText = "The device emits a distinctive triple tone, which means that the requested action would have entirely destroyed the target object. There are safety overrides to prevent it doing such a thing."

        } else {

          let fixedInPlaceStr = targetNoun.isFixedInPlace ? `, or perhaps it just doesn't have sufficient power to handle the ${targetNoun.name}.` : "."
          errorText = `The device buzzes, puzzled. It is unable to create anything recognizable called "${letterRemovedName}"${fixedInPlaceStr}`

        }


        if (errorText) {
          gameState.log.log(errorText)
        }


      } else { // We found a valid noun to transform to

        let allowNounConstruction = this.allowConstructionOfNouns([ foundNoun ], [ targetNoun ], gameState)

        if (allowNounConstruction) {
          foundNoun.backingNouns = targetNoun.backingNouns ? targetNoun.backingNouns : [ targetNoun ]
          foundNoun.looksAuthentic = false
          foundNoun.isEssential = targetNoun.isEssential


          let hasScentDescription = foundNoun.scentDescription != null
          let isFreaky = foundNoun.hasAttribute("freaky")

          let generationDescriptionStr = foundNoun.generationDescription ? foundNoun.generationDescription(foundNoun, targetNoun) : null

          if (foundNoun.inspected) {
            gameState.log.log(`The ${targetNoun.name} give${targetNoun.isPlural() ? "" : "s"} way to the now-familiar ${foundNoun.name}.`)

          } else if (generationDescriptionStr) {
            gameState.log.log(generationDescriptionStr)

          } else if (isFreaky) {

            let prankStrs = [
              ".",

              ` (because after all it would be beyond the parameters of the change to generate the person whose body part it is). ${foundNoun.isPlural() ? "They are" : "It is"} only moderately gory, and most locals get used to seeing this kind of thing as a prank from six-year-olds every halloween. Still, ${foundNoun.itThey()} might startle a tourist.`,
            ]

            let prankStr = MAUtils.fakeRandomElement(prankStrs, gameState)

            gameState.log.log(`You wave the ${removerName} at the ${targetNoun.name} and produce ${foundNoun.indefiniteArticle()} ${foundNoun.name}, severed${prankStr}`)

          } else {
            if (hasScentDescription) {
              gameState.log.log(`With a distinct whiff of ${foundNoun.scentDescription}, the ${targetNoun.name} turn${targetNoun.isPlural() ? "" : "s"} into ${foundNoun.indefiniteArticle()} ${foundNoun.name}. ${foundNoun.appearance()}`)

            } else {
              let descStrs = [
                "a flash of psychedelic colors",
                "a mad-scientist cackle",
                `a ${MAUtils.pastelColor(gameState)} cloud`,
                `a flash of ${MAUtils.primaryColor(gameState)} light`,
                "a smell of anise",
                "a distinct spearmint flavor",
              ]
              let descStr = MAUtils.fakeRandomElement(descStrs, gameState)

              gameState.log.log(`There is ${descStr} and the ${targetNoun.name} turn${targetNoun.isPlural() ? "" : "s"} into ${foundNoun.indefiniteArticle()} ${foundNoun.name}. ${foundNoun.appearance()}`)
            }

            foundNoun.inspected = true
            gameState.nounRepository.inspectNoun(foundNoun)
          }


          MAUtils.replaceNounWithNounsForGameState(targetNoun, [foundNoun], gameState)

          let relevantGameSegments = this.gameSegments.filter(x => x.segmentIsRelevantForGameState(gameState))

          for (let gS of relevantGameSegments) {
            if (gS.gameConstructedNounsFromNouns) {
              gS.gameConstructedNounsFromNouns([foundNoun], [targetNoun], gameState)
            }
          }

        } // if (allowNounConstruction)

      } // Found a valid noun
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    if (action instanceof MAActionLook) {

      if (action.chosenTarget.name == "letter-remover") {
        var introStr = ""
        if (!action.chosenTarget.inspected) {
          action.chosenTarget.inspected = true

          introStr = "\n\nThese are, if not exactly cheap, hardly unknown in Atlantis."
        }

        var upgradeStr = ""
        let canMakeAliveThings = this.valueForKey(gameState, "hasAnimatesUpgrade")
        let canMakeAbstractThings = this.valueForKey(gameState, "hasAbstractsUpgrade")
        if (canMakeAliveThings && canMakeAbstractThings) {
          upgradeStr = "\n(upgraded to handle animates and abstracts)"
        } else if (canMakeAliveThings) {
          upgradeStr = "\n(upgraded to handle animates)"
        } else if (canMakeAbstractThings) {
          upgradeStr = "\n(upgraded to handle abstracts)"
        }

        gameState.log.log(`It is a blunt-nosed plastic device, about the size of a laser pointer, that can be waved at things to remove excess letters. It is not very powerful, and often fails against large items. On the other hand, it has a wide range of action: it can be set to any letter we choose.${upgradeStr}${introStr}`)

        return false
      }
    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }

  allowConstructionOfNouns(constructedNouns, fromNouns, gameState) {
    var allowNounConstruction = true

    let relevantGameSegments = this.gameSegments.filter(x => x.segmentIsRelevantForGameState(gameState))

    for (let gS of relevantGameSegments) {
      if (gS.gameWantsToConstructNouns) {
        allowNounConstruction = gS.gameWantsToConstructNouns(constructedNouns, fromNouns, gameState)

        if (!allowNounConstruction) {
          break
        }
      }
    }

    return allowNounConstruction
  }
}


class MAGameSegmentRestorationGel extends MAGameSegment {
  constructor() {
    super("RestorationGel")
  }

  suppressOtherActionsForGameState(gameState) {
    let mode = this.valueForKey(gameState, "mode")
    let inChooseNounMode = (mode == "chooseNounMode")
    return inChooseNounMode
  }

  segmentIsRelevantForGameState(gameState) {
    return true
  }

  actionsForGameState(gameState) {
    let actions = []

    let tub = MAUtils.elementNamed(gameState.inventory.nouns, "tub")
    let tube = MAUtils.elementNamed(gameState.inventory.nouns, "tube")

    let mode = this.valueForKey(gameState, "mode")
    let inChooseNounMode = (mode == "chooseNounMode")

    if ((tube && tube.inspected) || (tub && tub.inspected)) {

      if (inChooseNounMode) {
        // The user wants to use the gel and needs to pick the target noun

        let removeTub = function(owner, noun) {
          if (noun == gameState.inventory || noun.name == "tub") {
            return false
          }
          return true
        }
        let targets = MAUtils.actionableNounsForGameState(gameState, removeTub)

        let actionRubGel = new MAAction()
        actionRubGel.performer = this
        actionRubGel.targets = function() { return targets }
        actionRubGel.verbString = function(target) {
          return `Rub gel on [${target.name}]`
        }
        actionRubGel.description = function() {
          return `(rub gel) ${this.chosenTarget.name}`
        }
        actions.push(actionRubGel)


        let actionNevermind = new MAAction()
        actionNevermind.performer = this
        actionNevermind.verbString = function() {
          return "[Nevermind]"
        }
        actionNevermind.description = function() {
          return "(nevermind)"
        }
        actions.push(actionNevermind)

      } else {
        // Not in a rub gel mode yet

        let actionRubGel = new MAAction()
        actionRubGel.performer = this
        actionRubGel.verbString = function() {
          return `Use [restoration gel]`
        }
        actionRubGel.description = function() {
          return `(use) restoration gel`
        }
        actions.push(actionRubGel)
      }
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(use) restoration gel")) {

      let tube = MAUtils.elementNamed(gameState.inventory.nouns, "tube")
      if (tube) {
        gameState.log.log("Unfortunately, there's hardly any gel remaining in the tube.")
      } else {
        this.setValueForKey(gameState, "chooseNounMode", "mode")
        gameState.log.log("What should we rub the restoration gel on?")
      }

    } else if (action.description().startsWith("(rub gel)")) {
      let targetNoun = action.chosenTarget

      this.performActionRubGel(gameState, targetNoun)

      this.setValueForKey(gameState, null, "mode")

    } else if (action.description().startsWith("(nevermind)")) {
      this.setValueForKey(gameState, null, "mode")
    }
  }

  performActionRubGel(gameState, nounToGel) {

    if (nounToGel.hasAttribute("person")) {
      let isTiny = nounToGel.weight == MANounWeight.Tiny
      var personInSentenceName = ""
      if (nounToGel.isProper) {
        personInSentenceName = nounToGel.name
      } else {
        personInSentenceName = "the " + nounToGel.name
      }

      let personLogs = [
        `We dip out a ${isTiny ? "fingertip-coating" : "pea-sized"} quantity of gel and approach ${personInSentenceName} with it. "Hey!" says ${personInSentenceName}. "That was really cold! What do you think you're doing?"\n\nBut no exciting conversions occur.`,
        `We get some gel and try to be subtle about touching it to our target, but ${personInSentenceName} shies away, startled. Well, it likely wouldn't have had an effect anyway.`,
      ]
      let personLog = MAUtils.fakeRandomElement(personLogs, gameState)
      gameState.log.log(personLog)

    } else {
      let allowNounConstruction = this.allowConstructionOfNouns([ nounToGel.backingNouns ], [ nounToGel ], gameState)

      if (allowNounConstruction) {
        let isTiny = (nounToGel.weight == MANounWeight.Tiny)
        let isLiquid = nounToGel.hasAttribute("liquid")
        let isNaughtySounding = nounToGel.hasAttribute("naughtySounding")

        var rubGelStr = ""
        if (isNaughtySounding) {
          rubGelStr =  "We squeeze out a pea-sized quantity of gel and rub it gently onto —\n\nNo, let me rephrase. We clinically and distantly apply some of the restoration gel to an innocent portion of the object in question."
        } else if (isLiquid) {
          rubGelStr = `We just touch a coated fingertip of gel to the ${nounToGel.name}.`
        } else {
          rubGelStr = `We dip out a ${isTiny ? "fingertip-coating" : "pea-sized"} quantity of gel and rub it gently onto the ${nounToGel.name}.`
        }

        var gelReactionStr = "";
        if (nounToGel.backingNouns && nounToGel.backingNouns.length) {

          // Construct the reaction string

          let locationContainsNounToGel = gameState.currentLocation.nouns.filter(x => x === nounToGel).length > 0
          let inventoryContainsNounToGel = gameState.inventory.nouns.filter(x => x === nounToGel).length > 0

          if (nounToGel.backingNouns.length == 1) {
            let backingNoun = nounToGel.backingNouns[0]

            var fallToGroundStr = "";
            var shouldFallToGround = !locationContainsNounToGel && !inventoryContainsNounToGel // the noun we're gelling is part of another noun (probably in the location)
            shouldFallToGround = shouldFallToGround || backingNoun.isFixedInPlace // includes SSCMScenery

            if (shouldFallToGround) {
              fallToGroundStr = " and falls to the ground"
            }

            if (backingNoun.hasAttribute("liquid")) {
              shouldFallToGround = true
              fallToGroundStr = " and, true to its nature, leaks onto the ground"
            }

            // Finally, allow an override for falling behavior
            if (backingNoun.hasAttribute("shouldNotFall")) {
              shouldFallToGround = false
              fallToGroundStr = ""
            }

            let appearanceStr = backingNoun.inspected ? "" : backingNoun.appearance()

            gelReactionStr = `With an audible SPLORT, the ${nounToGel.name} become${nounToGel.isPlural() ? "" : "s"} ${backingNoun.indefiniteArticle()} ${backingNoun.name}${fallToGroundStr}.${appearanceStr.length ? " " : ""}${appearanceStr}`


          } else { // multiple backingNouns

            // For this demo of CounterfeitMonkey, I'm choosing not to fully implement fallToTheGroundStr logic for multiple backing nouns

            let backingNounsList = MAUtils.naturalLanguageStringForArray(nounToGel.backingNouns, "and")
            gelReactionStr = `With an audible SPLORT, the ${nounToGel.name} becomes ${backingNounsList}.`
          }


          if (!this.valueForKey(gameState, "hasGelled")) {
            this.setValueForKey(gameState, true, "hasGelled")

            gelReactionStr += "\n\nI'm starting to understand how you got into all the places you got into. Not that I judge you or your line of work, of course."
          }



          // Handle the replacement of nounToGel with backingNouns

          let nounsThatShouldFall = []
          let nounsThatShouldNotFall = []

          for (let backingNoun of nounToGel.backingNouns) {

            var shouldFallToGround = !locationContainsNounToGel && !inventoryContainsNounToGel // the noun we're gelling is part of another noun (probably in the location)
            shouldFallToGround = shouldFallToGround || backingNoun.isFixedInPlace // includes SSCMScenery

            if (backingNoun.hasAttribute("liquid")) {
              shouldFallToGround = true
            }

            // Finally, allow an override for falling behavior
            if (backingNoun.hasAttribute("shouldNotFall")) {
              shouldFallToGround = false
            }

            if (shouldFallToGround) {
              nounsThatShouldFall.push(backingNoun)
            } else {
              nounsThatShouldNotFall.push(backingNoun)
            }


            if (!backingNoun.inspected) {
              backingNoun.inspected = true
              gameState.nounRepository.inspectNoun(backingNoun)
            }
          }


          if (nounsThatShouldNotFall.length > 0) {
            MAUtils.replaceNounWithNounsForGameState(nounToGel, nounsThatShouldNotFall, gameState)
          }

          if (nounsThatShouldFall.length > 0) {
            MAUtils.replaceNounWithNounsForGameState(nounToGel, null, gameState)
            Array.prototype.push.apply(gameState.currentLocation.nouns, nounsThatShouldFall)
          }


          gameState.log.log(rubGelStr + (rubGelStr.length > 0 ? " " : "") + gelReactionStr)

          let relevantGameSegments = this.gameSegments.filter(x => x.segmentIsRelevantForGameState(gameState))

          for (let gS of relevantGameSegments) {
            if (gS.gameConstructedNounsFromNouns) {
              gS.gameConstructedNounsFromNouns(nounToGel.backingNouns, [nounToGel], gameState)
            }
          }

        } else {
          gelReactionStr = "Alas, nothing happens."
          gameState.log.log(rubGelStr + (rubGelStr.length > 0 ? " " : "") + gelReactionStr)
        }
      }
    }
  }


  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }

  allowConstructionOfNouns(constructedNouns, fromNouns, gameState) {
    var allowNounConstruction = true

    let relevantGameSegments = this.gameSegments.filter(x => x.segmentIsRelevantForGameState(gameState))

    for (let gS of relevantGameSegments) {
      if (gS.gameWantsToConstructNouns) {
        allowNounConstruction = gS.gameWantsToConstructNouns(constructedNouns, fromNouns, gameState)

        if (!allowNounConstruction) {
          break
        }
      }
    }

    return allowNounConstruction
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
      return (noun.name != "inventory") && !noun.hidden
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
        return "Look [up from inventory]"
      }
      actionLookUp.description = function() {
        return "(look) up from inventory"
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

      if (action.chosenTarget.name == "inventory" && !(action.chosenTarget instanceof MAInventory)) {
        if (!action.chosenTarget.inspected) {
            gameState.log.log(action.chosenTarget.appearance())
            action.chosenTarget.inspected = true
        }

        gameState.log.log(gameState.inventory.appearance())

        return false

      } else if (action.chosenTarget instanceof MAInventory) {

        let hasCheckedInventory = this.valueForKey(gameState, "hasCheckedInventory")
        if (!hasCheckedInventory) {
          gameState.log.log("You insisted that we bring almost nothing into the synthesis room, so the criminal who was performing the synthesis couldn't rob us. I had hoped there was more honor among thieves, but you said no, there isn't.")
          this.setValueForKey(gameState, true, "hasCheckedInventory")
        }

        gameState.log.log(gameState.inventory.appearance())

        if (this.lookablesForGameState(gameState).length > 0) {
          gameState.log.log("You can act on items in the inventory.")
          this.setValueForKey(gameState, true, "inventoryMode")
        }

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


class MAGameSegmentInitialWaking extends MAGameSegment {
  constructor() {
    super("InitialWaking")
  }

  suppressOtherActionsForGameState(gameState) {
    return true
  }

  segmentIsRelevantForGameState(gameState) {
    let segmentState = this.valueForKey(gameState, "state")
    return segmentState != "done"
  }

  actionsForGameState(gameState) {
    let actions = []

    let segmentState = this.valueForKey(gameState, "state")

    var utterances = null

    if (!segmentState) {
      utterances = ["Yes", "No", "urggggh"]
    } else if (segmentState == "rememberName") {
      utterances = ["Yes", "No", "Huh?"]
    } else if (["pickIt", "pickIt2"].includes(segmentState)) {
      utterances = ["Alexandra", "Alex", "Andra", "..."]
    } else if (segmentState == "lookAround") {
      utterances = ["Ok"]
    }


    if (utterances) {
      let actionSay = new MAAction()
      actionSay.performer = this
      actionSay.verbString = function(target) {
        return `Say ["${target}"]`
      }
      actionSay.description = function() {
        return `(say) ${this.chosenTarget}`
      }

      actionSay.targets = function() { return utterances }
      actions.push(actionSay)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(say)")) {
      let segmentState = this.valueForKey(gameState, "state")
      let said = action.chosenTarget

      if (!segmentState) {
        if (said == "Yes") {
          gameState.log.log("Good, you're conscious. We're conscious.")
        } else if (said == "No") {
          gameState.log.log("Ah, smartaleck. But we're conscious.")
        } else {
          gameState.log.log("Huh... well at least we're conscious.")
        }

        gameState.log.log("I've heard urban legends about synthesis going wrong, one half person getting lost.\nDo you remember our name?")

        this.setValueForKey(gameState, "rememberName", "state")

      } else if (segmentState == "rememberName") {
        if (said == "Yes") {
          gameState.log.log("Right, we're Alexandra now. Before the synthesis, I was Alex. You were...")
        } else {
          gameState.log.log("To review, we're Alexandra now. I was Alex, before the synthesis. You were...")
        }

        this.setValueForKey(gameState, "pickIt", "state")

      } else if (["pickIt", "pickIt2"].includes(segmentState)) {

        if (said == "Alexandra") {
          gameState.log.log("That's our joint name now, yes. I was Alex before the synthesis. You were...")
          this.setValueForKey(gameState, "pickIt2", "state")

        } else if (said == "Alex") {
          gameState.log.log("No, I'm Alex. Together we're Alexandra; before our synthesis, you were...")
          this.setValueForKey(gameState, "pickIt2", "state")

        } else if (said == "Andra") {
          gameState.log.log("Exactly right. I'm Alex and you're Andra, making us jointly Alexandra. As far as I can tell, the operation was a success. We're meant to be one person now, unrecognizable to anyone who knew us before.\n\nLet's try to get a look around. I haven't been able to run our body without your help, but maybe now you're awake, it'll work better.")
          this.setValueForKey(gameState, "lookAround", "state")

        } else {
          gameState.log.log("...oh boy. Okay. Okay. I need you on form here. This is going to be hard if you don't remember being yourself. Not panicking. Let's try again...")
          this.setValueForKey(gameState, "pickIt2", "state")
        }

      } else if (segmentState == "lookAround") {
        gameState.log.log(gameState.currentLocation.appearance())
        gameState.currentLocation.inspected = true

        this.setValueForKey(gameState, "done", "state")
      }
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    if (action.description().startsWith("(look")) {
      gameState.log.log("Can you hear me?")
      return false
    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}


class MAGameSegmentWheel extends MAGameSegment {
  constructor() {
    super("Wheel")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return gameState.currentLocation.name.includes("Fair") && gameState.currentLocation.hasNounNamed("wheel") && MAUtils.elementNamed(gameState.currentLocation.nouns, "wheel").inspected
  }

  actionsForGameState(gameState) {
    let actions = []

    let actionSpin = new MAAction()
    actionSpin.performer = this
    actionSpin.verbString = function() {
      return "Spin [wheel]"
    }
    actionSpin.description = function() {
      return "(spin) wheel"
    }
    actions.push(actionSpin)

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(spin)")) {

      let hasSpun = this.valueForKey(gameState, "hasSpun")
      var hotAirCount = this.valueForKey(gameState, "hotAirCount")
      hotAirCount = hotAirCount ? hotAirCount : 0

      var hotAirStr = "HOT AIR, which appears to be the most common reward"
      if (hotAirCount == 1) {
        hotAirStr = "HOT AIR again"
      } else if (hotAirCount > 1) {
        hotAirStr = "HOT AIR yet again"
      }

      let wheelEntries = [
        hotAirStr,
        hotAirStr,
        hotAirStr,
        hotAirStr,
        hotAirStr,
        hotAirStr,
        hotAirStr,
        hotAirStr,
        "FREE POSTCARD",
        "FREE POSTCARD",
        "FREE POSTCARD",
        "BLUE RASPBERRY LOLLIPOP",
        "BLUE RASPBERRY LOLLIPOP",
        "STUFFED DONKEY",
        "STUFFED OCTOPUS",
        "SET OF PAINT",
        "LIFETIME CHARD SUPPLY",
      ]

      let wheelSelection = wheelEntries[gameState.fakeRandomInt(wheelEntries.length)]

      let spinAdjs = ["hard", "strong", "forceful"]
      let spinAdj = MAUtils.fakeRandomElement(spinAdjs, gameState)
      let spinStr = `We give the wheel ${hasSpun ? "another" : "a"} ${spinAdj} spin. While it's spinning, the flipper makes a satisfying *thup thup thup* noise as it flips from one slot to the next. The pointer lands on ${wheelSelection}. `

      let suffixes = [
        "Sadly, no one is around to award this prize (which is probably why we were allowed to spin it without having some sort of ticket first).",
        "Too bad no one is around to award the prize. Of course, if someone were, they'd be charging to spin.",
      ]

      let suffix = MAUtils.fakeRandomElement(suffixes, gameState)

      gameState.log.log(spinStr + suffix)

      if (wheelSelection == hotAirStr) {
        this.setValueForKey(gameState, hotAirCount+1, "hotAirCount")
      }

      this.setValueForKey(gameState, true, "hasSpun")
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}


class MAGameSegmentTemporaryBarrier extends MAGameSegment {
  constructor() {
    super("TemporaryBarrier")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return gameState.currentLocation.name.includes("Ampersand Bend")
  }

  actionsForGameState(gameState) {
    let actions = []

    let hasUnlocked = this.valueForKey(gameState, "hasUnlocked")
    let temporaryBarrier = MAUtils.elementNamed(gameState.currentLocation.nouns, "temporary barrier")
    let codeLock = MAUtils.elementNamed(temporaryBarrier.nouns, "code-lock")

    if (!hasUnlocked && codeLock.inspected) {
      let museum = MAUtils.elementNamed(gameState.currentLocation.nouns, "museum")
      let codeNoun = MAUtils.elementNamed(museum.nouns, "code")

      var code = 305
      if (!codeNoun || !codeNoun.inspected) {
        // Use a bogus code because we don't know the real one yet
        let randCodes = [123, 555, 408, 317, 614, 999, 712, 838, 901, 790]
        code = MAUtils.fakeRandomElement(randCodes, gameState)
      }

      let actionUseCode = new MAAction()
      actionUseCode.performer = this
      actionUseCode.code = code
      actionUseCode.verbString = function() {
        return `Use code [${code}]`
      }
      actionUseCode.description = function() {
        return `(use code) ${code}`
      }
      actions.push(actionUseCode)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(use code) 305")) {
      this.setValueForKey(gameState, true, "hasUnlocked")

      let temporaryBarrier = MAUtils.elementNamed(gameState.currentLocation.nouns, "temporary barrier")
      temporaryBarrier.unlocked = true

      gameState.log.log("We set the wheels of the code-lock to 305.\n\nClick! The barrier door unlocks and we can now go north.")
    } else {
      gameState.log.log(`We set the wheels of the code-lock to ${action.code} but the temporary barrier is still locked. If only the right code were written down somewhere nearby...`)
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    if (action instanceof MAActionMove) {
      if (action.chosenTarget.name.includes("Fair") && !action.chosenTarget.visited) {
        if (!this.valueForKey(gameState, "hasUnlocked")) {
          gameState.log.log("The temporary barrier is locked. We need to set the code-lock to the right number first.")

          return false

        } else {
          let goalsStr = "Here's what we think we need to do next:\n\n- Retrieve your remaining possessions from locker at the hostel\n- Get my backpack from the cinema\n- Meet your colleague Slango at the Counterfeit Monkey"

          gameState.log.log("We open the temporary barrier.\n\nI'm glad to see you're feeling ready to face the wider world.\n\n" + goalsStr)
        }
      }
    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}


class MAGameSegmentWordBalance extends MAGameSegment {
  constructor() {
    super("WordBalance")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return gameState.currentLocation.name.includes("Midway") && gameState.currentLocation.hasNounNamed("barker")
  }

  actionsForGameState(gameState) {
    let actions = []

    let usedTargets = this.valueForKey(gameState, "usedTargets")
    if (!usedTargets) {
      usedTargets = []
    }

    let actionPut = new MAAction()
    actionPut.performer = this
    actionPut.verbString = function(target) {
      return `Put something next to the [${target}]`
    }
    actionPut.description = function() {
      return `(put something next to) ${this.chosenTarget}`
    }

    let putTargets = ["apple", "pear"].filter(x => !usedTargets.includes(x))
    if (putTargets.length) {
      actionPut.targets = function() { return putTargets }
      actions.push(actionPut)
    }


    let actionAsk = new MAAction()
    actionAsk.performer = this
    actionAsk.verbString = function(target) {
      return `Ask [${target}]`
    }
    actionAsk.description = function() {
      return `(ask) ${this.chosenTarget}`
    }

    var questions = [
      "whether the game is rigged",
      "if anyone ever wins",
    ]
    if (MAUtils.elementNamed(gameState.currentLocation.nouns, "barker").inspected) {
      questions.push("about the barker's suit")
      questions.push("if the gel is valuable")
    }
    questions = questions.filter(x => !usedTargets.includes(x))
    if (questions.length) {
      actionAsk.targets = function() { return questions }
      actions.push(actionAsk)
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.description().startsWith("(ask) whether the game is rigged")) {
      gameState.log.log(`"I know this kind of game," we say, in our most jaded voice. "The scale is probably nailed in place so that it *can't* tip." One or two of the crowd standing nearby seem impressed by this line of argument. A small boy whispers to his sister to ask whether that could be true.\n\n"Nonsense," says the barker angrily. To demonstrate the point, he pushes down on the left pan, and the scales tip and sway. He soon restores them to balance, though.\n\n"And don't think that will count for you," he adds. "You have to put them out of balance yourself. No surrogates, substitutes, or alternatives allowed."`)
    } else if (action.description().startsWith("(ask) if anyone ever wins")) {
      gameState.log.log(`"Does anyone ever win?" we ask the barker.\n\n"No one has won today," he says, which is not an answer.`)
    } else if (action.description().startsWith("(ask) about the barker's suit")) {
      gameState.log.log(`"I really admire your suit," we say. "Where did you get it?" I feel like a fool with that nonsense coming out of my mouth, but I guess you know what you're doing, because the barker smiles.\n\n"Why, thank you, little lady, it's tailor-made!" he says, apparently warming to us.`)
    } else if (action.description().startsWith("(ask) if the gel is valuable")) {
      gameState.log.log(`"Is the gel very valuable?" we ask the barker. "Is it new, and in good condition? Is the entire tube present?"\n\n"Yes, of course, and absolutely," he says, making a gesture as though to show us the gel, but actually not letting us catch more than the label.`)
    } else {
      this.logBarkerRefusal(gameState)
    }


    let randomEnvNoiseStrs = [
      "The crowd mills around, jostling us.",
      "The sun gleams off the shiny balance pans.",
      "Somewhere in the vicinity a balloon pops loudly.",
      "The bell of the hammering contest clangs."
    ]
    let randomEnvNoiseStr = MAUtils.fakeRandomElement(randomEnvNoiseStrs, gameState)
    gameState.log.log(randomEnvNoiseStr)


    let usedTargets = this.valueForKey(gameState, "usedTargets")
    if (!usedTargets) {
      usedTargets = []
      this.setValueForKey(gameState, usedTargets, "usedTargets")
    }
    usedTargets.push(action.chosenTarget)
  }

  logBarkerRefusal(gameState) {
    let gotFirstWarning = this.valueForKey(gameState, "gotFirstWarning")

    if (gotFirstWarning) {
      let refusalStrs = [
        "The barker gives us a warning look. In case you forgot, we may not increase or decrease the contents of the pan by hand or lean on the beam.",
        "It is against the rules of the contest to remove something from the pans; and whatever we do, we've got to do it without touching."
      ]
      let refusalStr = MAUtils.fakeRandomElement(refusalStrs, gameState)
      gameState.log.log(refusalStr)

    } else {
      gameState.log.log(`"None of that!" says the barker. "You must make one side go down and the other come up, but you may not add or subtract anything from the load, you may not apply pressure to the beam itself, and you may not lean on, push, pull, or support the individual pans!"\n\nA little boy in the crowd snickers rudely. "Got ya!"`)
      this.setValueForKey(gameState, true, "gotFirstWarning")
    }
  }


  gameEngineWillPerformAction(action, gameState) {
    var allowAction = true

    if (action instanceof MAActionTake) {
      if (["apple", "pear"].includes(action.chosenTarget.name)) {
        this.logBarkerRefusal(gameState)
        allowAction = false
      } else if (action.chosenTarget.name == "tube") {
        gameState.log.log("I don't dare invade the personal space of the barker.")
        allowAction = false
      }

    } else if (action instanceof MAActionLook) {

      if (action.chosenTarget.name == "tube") {
        gameState.log.log("We can't get a good look at the tube from this position, but it definitely appears to be authentic restoration gel — valuable stuff, I recall you saying. (Or were you just trying to impress me?)")
        allowAction = false
      }

    } else if (action.description().startsWith("(use letter-remover)")) {
      if (action.chosenTarget.name == "tube") {
        gameState.log.log("The barker spots us gesticulating and smoothly, almost without thinking about it, swaps the tube into the other hand so that we miss.")
        allowAction = false
      }
    }

    return allowAction
  }

  completePuzzleIfPossible(gameState) {
    let wordBalance = MAUtils.elementNamed(gameState.currentLocation.nouns, "word-balance")
    if (!wordBalance.hasNounNamed("apple") || !wordBalance.hasNounNamed("pear")) {
      let barker = MAUtils.elementNamed(gameState.currentLocation.nouns, "barker")
      let tube = MAUtils.elementNamed(barker.nouns, "tube")

      gameState.inventory.nouns.push(tube)

      gameState.currentLocation.nouns = gameState.currentLocation.nouns.filter(x => x.name != "barker")

      let objectDesc = wordBalance.hasNounNamed("ear") ? "disgusted gasp" : "cheer"

      gameState.log.log(`There is a ${objectDesc} from the spectators. The word-balance tilts slowly but inexorably.\n\nThe barker looks astonished and displeased, except for a fraction of a second when he just noticeably winks. With exaggerated bad grace, he hands us some restoration gel. "There's your prize. And now this contest is over."\n\nHe stalks away.`)
    }
  }

  logBarkerInvitationIfNecessary(gameState, action) {
    // We need to make sure the barker is still present since he may have been removed by the user just solving the puzzle.

    let barker = MAUtils.elementNamed(gameState.currentLocation.nouns, "barker")
    if (barker) {
      let invitationStrs = [
        `"Step up and try your hand at the fabulous word-balance!" calls the barker appealingly.`,
        `"Put the beam out of alignment and win a fabulous prize!" says the barker, holding up a tube.`,
        `"One tube of restoration gel goes to the first person who can unbalance the word-balance!" cries the barker, glance sweeping the crowd.`,
      ]
      let invitationStr = MAUtils.fakeRandomElement(invitationStrs, gameState)

      gameState.log.log(invitationStr)
    }
  }

  gameEngineDidPerformAction(action, gameState) {
    this.completePuzzleIfPossible(gameState)
    this.logBarkerInvitationIfNecessary(gameState, action)
  }
}


const MAHostelState = {
  Initial:                             0, // General conversation

  UnlockThreadStart:                   1,
  UnlockThreadAskedHowToUnlockLockers: 1, // Start

  UnlockThreadAskedWhatHappensIfGuestDoesntRemember: 2,
  UnlockThreadAskedWhatAllPurposeIs:   3,
  UnlockThreadAskedHowAllPurposeMakesBlocks: 4,
  UnlockThreadAskedWhetherGelLooksLikeOurs:  5,
  UnlockThreadAskedWhyNotUseLocksmith: 6,

  UnlockThreadAskedWhatToDoAboutLock:  7,
  UnlockThreadEnd:                     7, // intentionally set to the same as the last state


  InternetThreadStart:                          8,
  InternetThreadAskedWhetherInternetIsNearby:   9,
  InternetThreadAskedWhoWouldDoThis:           10,
  InternetThreadAskedWhatTheOtherGroupWasLike: 11,

  InternetThreadAskedAboutTheGirl:             12,
  InternetThreadEnd:                           12, // intentional
}
Object.freeze(MAHostelState)

class MAGameSegmentHostel extends MAGameSegment {
  constructor() {
    super("Hostel")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return gameState.currentLocation.name.includes("Hostel")
  }

  actionsForGameState(gameState) {
    let actions = []

    var state = this.valueForKey(gameState, "state")
    state = state ? state : 0
    let askedQuestions = this.valueForKey(gameState, "askedQuestions")
    if (!askedQuestions) {
      askedQuestions = []
    }


    let deskAttendant = MAUtils.elementNamed(gameState.currentLocation.nouns, "desk attendant")
    if (deskAttendant && deskAttendant.inspected) {

      let dormRoomLoc = gameState.currentLocation.linkedLocations().filter(x => x.name.includes("Dormitory Room"))[0]
      let locker = MAUtils.elementNamed(dormRoomLoc.nouns, "locker")
      let lock = MAUtils.elementNamed(locker.nouns, "lock")
      let enableUnlockQuestions = lock && lock.inspected

      var openQuestions = []

      if (state == MAHostelState.Initial) {
        if (enableUnlockQuestions) {
          openQuestions.push("how to unlock the lockers")
        }

        openQuestions.push("whether there is an internet connection nearby")
      }


      if (state >= MAHostelState.UnlockThreadStart &&
          state <= MAHostelState.UnlockThreadEnd) {

        if (state == MAHostelState.UnlockThreadAskedHowToUnlockLockers) {
          openQuestions.push("what if a guest doesn't remember their combination")
        } else if (state == MAHostelState.UnlockThreadAskedWhatHappensIfGuestDoesntRemember) {
          openQuestions.push("what the All-Purpose is")
        } else if (state == MAHostelState.UnlockThreadAskedWhatAllPurposeIs) {
          openQuestions.push("how the All-Purpose makes blocks")
        } else if (state == MAHostelState.UnlockThreadAskedHowAllPurposeMakesBlocks) {
          openQuestions.push("whether the gel resembles ours")
        } else if (state == MAHostelState.UnlockThreadAskedWhetherGelLooksLikeOurs) {
          openQuestions.push("why they do not use a locksmith")
        } else if (state == MAHostelState.UnlockThreadAskedWhyNotUseLocksmith) {
          openQuestions.push("what we should do about the lock")
        }
      } else if (state >= MAHostelState.InternetThreadStart &&
                 state <= MAHostelState.InternetThreadEnd) {

        if (state == MAHostelState.InternetThreadAskedWhetherInternetIsNearby) {
          openQuestions.push("who would do this")
        } else if (state == MAHostelState.InternetThreadAskedWhoWouldDoThis) {
          openQuestions.push("what the other group was like")
        } else if (state == MAHostelState.InternetThreadAskedWhatTheOtherGroupWasLike) {
          openQuestions.push("about the young woman")
        }
      }

      openQuestions.push("whether public transport exists")
      //openQuestions.push("whether we can keep the guidebook")
      openQuestions.push("whether there are beds available")
      openQuestions.push("what the fair is for")
      openQuestions.push("what she recommends seeing in the city")
      openQuestions.push("whether she enjoys her job")

      openQuestions = openQuestions.filter(x => !askedQuestions.includes(x))

      if (openQuestions.length) {
        let actionAsk = new MAAction()
        actionAsk.performer = this
        actionAsk.verbString = function(target) {
          return `Ask [${target}]`
        }
        actionAsk.description = function() {
          return `(ask) ${this.chosenTarget}`
        }

        actionAsk.targets = function() { return openQuestions }
        actions.push(actionAsk)
      }

      if (!askedQuestions.includes("ComplimentNoseRing")) {
        let actionComp = new MAAction()
        actionComp.performer = this
        actionComp.verbString = function() {
          return `Compliment [the nose ring]`
        }
        actionComp.description = function() {
          return `(compliment) the nose ring`
        }
        actions.push(actionComp)
      }
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    let askedQuestions = this.valueForKey(gameState, "askedQuestions")
    if (!askedQuestions) {
      askedQuestions = []
      this.setValueForKey(gameState, askedQuestions, "askedQuestions")
    }


    if (action.description().startsWith("(compliment)")) {
      gameState.log.log(`"I like your nose ring," we say. It looks kind of piratical.\n\n"Thanks." She gives it a little pat. "I'm thinking of getting a sternum piercing next."`)
      askedQuestions.push("ComplimentNoseRing")

    } else if (action.description().startsWith("(ask)")) {
      let chosenQuestion = action.chosenTarget
      askedQuestions.push(chosenQuestion)

      if (chosenQuestion == "how to unlock the lockers") {
        askedQuestions.push("HowToUnlock")
        this.setValueForKey(gameState, MAHostelState.UnlockThreadAskedHowToUnlockLockers, "state")
        gameState.log.log(`"Hey, so, like," we begin, twirling our hair in one finger. "What if I, like, accidentally locked something in the locker upstairs and I don't know the number to get it open? It is, like, *so* important that I get my stuff back."\n\nHer expression of dreamy good will hardens into one of cool contempt. "Lockers are the responsibility of the guests," she says. "You brought the lock, so you must know the combination."`)

      } else if (chosenQuestion == "what if a guest doesn't remember their combination") {
        this.setValueForKey(gameState, MAHostelState.UnlockThreadAskedWhatHappensIfGuestDoesntRemember, "state")
        gameState.log.log(`"What happens when, like, someone forgets the combination? Does that ever happen? 'Cause it seems like you might need to get the locker open for the next guest, right? So, like, what do you do?"\n\n"Yes, it happens," she says. Her spiky magenta hair is quivering. It was wrong to take the hippy-ish blouse as a sign of an easy-going temper. "It happens *all the time*. We have to get the All-Purpose in to fix them. It's expensive. I keep telling management we should have a different kind of lock-up system, but they won't hear it."`)

      } else if (chosenQuestion == "what the All-Purpose is") {
        this.setValueForKey(gameState, MAHostelState.UnlockThreadAskedWhatAllPurposeIs, "state")
        gameState.log.log(`"All-Purpose? What's that?" we ask. But surely you do know? The All-Purpose is a kind of blue-suited handy-man, a mechanic with a huge toolbox of letter tools. He can do just about anything. I would have thought— but she's answering.\n\n"You know, from the Bureau." She reaches under the desk and pulls out a box, which she displays briefly to our gaze. Inside is an assortment of children's blocks in different colors. "He does this with them," she says matter-of-factly, as though B-insertion weren't a pretty serious challenge. Then she puts the box away again.`)

      } else if (chosenQuestion == "how the All-Purpose makes blocks") {
        gameState.log.log(`"He puts on Bs? On the locks? How does that, like, work?" we ask, twirling our hair some more. (This is ridiculous! Have you no shame? Doesn't it embarrass you, playing up to stereotypes like this? No, I see your point. You're more of a pragmatist. I should have guessed.)\n\n"He has a machine he brings in, on wheels," she says. "It's the size of a dessert cart. At one end, there's a hose with a nozzle. The B comes out of there." In spite of her mood, she obviously finds this an interesting topic. "I asked him what happened if the B flew out and hit something it wasn't supposed to, and he showed me this restoration gel he had, to put things back to what they were originally."`)

        // Skip asking about the gel if we don't have it yet
        if (gameState.inventory.hasNounNamed("tub")) {
          this.setValueForKey(gameState, MAHostelState.UnlockThreadAskedHowAllPurposeMakesBlocks, "state")
        } else {
          this.setValueForKey(gameState, MAHostelState.UnlockThreadAskedWhetherGelLooksLikeOurs, "state")
        }

      } else if (chosenQuestion == "whether the gel resembles ours") {
        this.setValueForKey(gameState, MAHostelState.UnlockThreadAskedWhetherGelLooksLikeOurs, "state")
        gameState.log.log(`"Does the All-Purpose's gel look something like this?"\n\nShe glances at the tub of restoration gel. "Yeah," she says. "A lot like that. Hey, how did you get that, anyway?"\n\nWe just smile and shrug pleasantly.`)

      } else if (chosenQuestion == "why they do not use a locksmith") {
        this.setValueForKey(gameState, MAHostelState.UnlockThreadAskedWhyNotUseLocksmith, "state")
        gameState.log.log(`"It seems as though a locksmith would be cheaper and less trouble than getting an All-Purpose Officer," we point out.\n\n"You might think."`)

      } else if (chosenQuestion == "what we should do about the lock") {
        this.setValueForKey(gameState, MAHostelState.Initial, "state")
        gameState.log.log(`"So, uh, like. What do you think I should do about this locker I can't unlock?"\n\n"Remember the combination," she says tartly. Right, then.`)

      } else if (chosenQuestion == "whether there is an internet connection nearby") {
        this.setValueForKey(gameState, MAHostelState.InternetThreadAskedWhetherInternetIsNearby, "state")
        gameState.log.log(`"Hey, so, do you have internet here?"\n\n"Sorry," she says. "Our connection is suspended by the Bureau. Someone tried to use the hostel account for unauthorized contact with a universal translator."\n\nDid they indeed? I wonder who that could have been, hm?`)

      } else if (chosenQuestion == "who would do this") {
        this.setValueForKey(gameState, MAHostelState.InternetThreadAskedWhoWouldDoThis, "state")
        gameState.log.log(`"Really?" we ask brightly. I'm enjoying being a dumb girl more than I expected. "Who would do something like that?"\n\nShe looks cross. "We don't know," she says. "There was a young woman who used the computer at about the right time period, but she didn't seem like the criminal type, to me. I'm pretty sure it must have been this other group, three guys that were staying here, but I can't figure out how."\n\nHear that? You don't seem like the criminal type.`)

      } else if (chosenQuestion == "what the other group was like") {
        this.setValueForKey(gameState, MAHostelState.InternetThreadAskedWhatTheOtherGroupWasLike, "state")
        gameState.log.log(`"Was there anything interesting about the other group? The three guys?" I'm starting to see how much you enjoy playing off your own cleverness. I just hope it doesn't get us caught.\n\nShe shrugs. That sounds like a no, then.`)

      } else if (chosenQuestion == "about the young woman") {
        this.setValueForKey(gameState, MAHostelState.Initial, "state")
        gameState.log.log(`"So, like, what was she like?" I venture a little giggle. I don't think it's quite a success.\n\n"What, the young woman?" The attendant shrugs. "Kind of uptight."`)

      } else if (chosenQuestion == "whether public transport exists") {
        gameState.log.log(`"Can you tell me anything about public transportation in this town?" we ask hopefully. I can tell you: there isn't any. But it will be interesting to see what she says, I suppose.\n\nShe smiles briefly. "I'm sorry," she says. "There aren't any buses or subways here. The island is too small for that."`)
      } else if (chosenQuestion == "whether we can keep the guidebook") {
        gameState.log.log(`"Hey, does this guidebook belong to the hostel, or can I keep it?"\n\n"Sure, whatever," she says. "People take and leave stuff all the time. It's no big deal."`)
      } else if (chosenQuestion == "whether there are beds available") {
        gameState.log.log(`"Are there free beds for the evening?"\n\n"Sure," she says. "You can go up and claim whichever free one you like. The hostel won't really fill up until this evening."`)
      } else if (chosenQuestion == "what the fair is for") {
        gameState.log.log(`"So what's up with, like, the big party outside?" we ask. "It looks like something is going on out there."\n\n"Serial Comma Day," she says, in a bored voice. "It's totally a made-up holiday, like Sweetest Day or World Secretary Day or whatever. But they sell greeting cards. I'd have gone with semicolon day," she muses. "It's way better than a comma. You get an extra dot on top. It's like two punctuation marks for the price of one. But it's not all prissy and fussy like a colon."\n\nShe's missing the point entirely, of course: Serial Comma Day celebrates the adoption of a whole series of standards changes intended to reduce ambiguity in written language and increase the precision of linguistic change methods. It marked a significant shift in policy—\n\nOh, all right, I'll stop. But you should hear Professor Waterstone on this topic.`)
      } else if (chosenQuestion == "what she recommends seeing in the city") {
        gameState.log.log(`"So, is there stuff I really should see around here? The best of the city, or something?"\n\n"I'm not, like, a concierge," she says. "If you came to town you must have had a reason, right? Plus you can maybe pick up a map somewhere around here."`)
      } else if (chosenQuestion == "whether she enjoys her job") {
        gameState.log.log(`"Do you like this job?"\n\nShe looks taken aback. "It's a living," she says. "I mean, sort of. And the management doesn't really listen to what I tell them. And sometimes people are really loud. Or jerky. But my parents really really realllly wanted me to stay in school so I kind of stopped wanting to, if that makes sense. I don't know, maybe I'll go back later."\n\nYou apparently have a strong urge to sympathize on the topic of parents. I don't.\n\n"Parents can be that way," you say, with sudden vehemence. "They work on you like you're a project, like they're raising a show dog or something. It took me a long time to figure out that while I was with my parents I wasn't ever going to even know what *I* wanted, who I wanted to be. So you got away from that, good for you."\n\nAnd good for her skipping her education when it would have been paid for, and going into an unfulfilling job that doesn't earn enough to live on, right? Seems a little askew to me, but hey.\n\n"I don't think my parents were *that* bad," she says, with a stilted little laugh.`)
      }
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  appendAttendantMannerismIfNecessary(gameState, action) {
    if (action instanceof MAActionLook) {
      if (action.chosenTarget.name == "desk attendant") {
        let mannerismStrs = [
          "She toys unattractively with her nose ring.",
          "She scratches a bug bite on her elbow.",
          "She purses her lips thoughtfully.",
          "She scratches her nose.",
        ]
        let mannerismStr = MAUtils.fakeRandomElement(mannerismStrs, gameState)
        gameState.log.log(mannerismStr)
      }
    }
  }

  appendDemonstrationOfSolvedLockIfNecessary(gameState, action) {
    if (action instanceof MAActionMove) {

      if (gameState.currentLocation.hasNounNamed("desk attendant")) {
        let dormRoomLoc = gameState.currentLocation.linkedLocations().filter(x => x.name.includes("Dormitory Room"))[0]
        let locker = MAUtils.elementNamed(dormRoomLoc.nouns, "locker")
        let lock = MAUtils.elementNamed(locker.nouns, "lock")


        let askedQuestions = this.valueForKey(gameState, "askedQuestions")
        if (!askedQuestions) {
          askedQuestions = []
          this.setValueForKey(gameState, askedQuestions, "askedQuestions")
        }

        if (!lock &&
            askedQuestions.includes("HowToUnlock") &&
            !askedQuestions.includes("SolvedLock")) {
          askedQuestions.push("SolvedLock")

          // End this conversation
          var state = this.valueForKey(gameState, "state")
          state = state ? state : 0
          if (state >= MAHostelState.UnlockThreadStart &&
              state <= MAHostelState.UnlockThreadEnd) {
            this.setValueForKey(gameState, MAHostelState.Initial, "state")
          }

          gameState.log.log(`"I, like, remembered the combination of my lock," we say.\n\n"I'm overjoyed." Deadpan.`)
        }
      }
    }
  }

  gameEngineDidPerformAction(action, gameState) {
    this.appendAttendantMannerismIfNecessary(gameState, action)
    this.appendDemonstrationOfSolvedLockIfNecessary(gameState, action)
  }
}



const MADormState = {
  Initial:                             0, // mentioned serial killers
  SaidWishIHadntRemembered:            1,
  SaidSoJetLagged:                     2,
  AskedWhereFrom:                      3,
  RespondedToWhereFrom:                4,
  AskedWhenGotHere:                    5,
  RespondedToWhenGotHere:              6,
  AskedLikeThisPlace:                  7,
  RespondedToLikeThisPlace:            8,
  ComplainedAboutShowers:              9,
  RespondedToComplainedAboutShowers:  10,
  ComplainedAboutDeskGirl:            11,
  RespondedToComplainedAboutDeskGirl: 12,
  MentionedSouvenir:                  13,
  RespondedToMentionedSouvenir:       14,
  SuggestedGiftShop:                  15,
}
Object.freeze(MADormState)

class MAGameSegmentDormitoryRoom extends MAGameSegment {
  constructor() {
    super("DormitoryRoom")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  segmentIsRelevantForGameState(gameState) {
    return gameState.currentLocation.name.includes("Dormitory Room")
  }

  actionsForGameState(gameState) {
    let actions = []

    var state = this.valueForKey(gameState, "state")
    state = state ? state : 0
    let mentionedTopics = this.valueForKey(gameState, "mentionedTopics")
    if (!mentionedTopics) {
      mentionedTopics = []
    }


    if (gameState.currentLocation.hasNounNamed("backpacking girl")) {
      let openQuestions = []

      openQuestions.push("for privacy")

      if (MAUtils.elementNamed(gameState.currentLocation.nouns, "heavy pack").inspected &&
          !mentionedTopics.includes("AskedCanada")) {
        openQuestions.push("whether she is from Canada")
      }

      if (mentionedTopics.includes("AskedCanada") || (state > MADormState.SaidSoJetLagged)) {
        if (!mentionedTopics.includes("Customs")) {
          openQuestions.push("whether she had trouble with customs")
        }
      }

      if (openQuestions.length) {
        let actionAsk = new MAAction()
        actionAsk.performer = this
        actionAsk.verbString = function(target) {
          return `Ask [${target}]`
        }
        actionAsk.description = function() {
          return `(ask) ${this.chosenTarget}`
        }

        actionAsk.targets = function() { return openQuestions }
        actions.push(actionAsk)
      }


      let tellOptions = []

      if (state == MADormState.SaidSoJetLagged) {
        tellOptions.push("we know how jetlag can be")
      } else if (state == MADormState.AskedWhereFrom) {
        tellOptions.push("a lie")
        tellOptions.push("the truth")
      } else if (state == MADormState.AskedWhenGotHere) {
        tellOptions.push("a lie about getting here")
      } else if (state == MADormState.AskedLikeThisPlace) {
        tellOptions.push("we do")
        tellOptions.push("we don't")
        tellOptions.push("we're neutral")
      } else if (state == MADormState.ComplainedAboutShowers) {
        tellOptions.push("we agree")
        tellOptions.push("we disagree")
      } else if (state == MADormState.ComplainedAboutDeskGirl) {
        tellOptions.push("she's right")
        tellOptions.push("she's wrong")

        let hostelLoc = gameState.currentLocation.linkedLocations().filter(x => x.name.includes("Hostel"))[0]
        if (!hostelLoc.hasNounNamed("desk attendant")) {
          tellOptions.push("about the louse incident")
        }
      } else if (state == MADormState.MentionedSouvenir) {
        tellOptions.push("something friendly")
        tellOptions.push("something mean-spirited")
      } else if (state == MADormState.RespondedToMentionedSouvenir) {
        tellOptions.push("about the cathedral gift shop")
      }


      if (tellOptions.length) {
        let actionTell = new MAAction()
        actionTell.performer = this
        actionTell.verbString = function(target) {
          return `Tell her [${target}]`
        }
        actionTell.description = function() {
          return `(tell her) ${this.chosenTarget}`
        }

        actionTell.targets = function() { return tellOptions }
        actions.push(actionTell)
      }


      if (mentionedTopics.includes("FreakHerOut")) {
        let freakyInventory = gameState.inventory.nouns.filter(x => x.hasAttribute("freaky"))

        if (freakyInventory.length) {
          let actionShow = new MAAction()
          actionShow.performer = this
          actionShow.verbString = function(target) {
            return `Show her the [${target.name}]`
          }
          actionShow.description = function() {
            return `(show her) ${this.chosenTarget.name}`
          }

          actionShow.targets = function() { return freakyInventory }
          actions.push(actionShow)
        }
      }


    } else { // Girl is not in the room

      let locker = MAUtils.elementNamed(gameState.currentLocation.nouns, "locker")
      let isLocked = locker.hasNounNamed("lock")
      let isOpen = mentionedTopics.includes("OpenedLocker")

      if (!isLocked && !isOpen) {
        let actionOpen = new MAAction()
        actionOpen.performer = this
        actionOpen.verbString = function() {
          return "Open [locker]"
        }
        actionOpen.description = function() {
          return "(open) locker"
        }
        actions.push(actionOpen)
      }
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    let mentionedTopics = this.valueForKey(gameState, "mentionedTopics")
    if (!mentionedTopics) {
      mentionedTopics = []
      this.setValueForKey(gameState, mentionedTopics, "mentionedTopics")
    }



    if (action.description().startsWith("(open)")) {
      mentionedTopics.push("OpenedLocker")

      let locker = MAUtils.elementNamed(gameState.currentLocation.nouns, "locker")
      locker.addAttribute("lookOnce")

      let rollOfBills = new MANoun("roll of bills")
      rollOfBills.appearance = function() {
        let uninspectedStr = "Now that is more like it: you've got us a tidy little stash of euros here."

        let billDescs = [
          "We thumb quickly through the bills — smaller currency on the outside, larger denominations on the inside. I wouldn't have thought I could add that quickly and accurately, but you, evidently, have more practice. It works out to just over fifteen thousand euros.",
          "Some day you will have to tell me a little bit about the tricks of the trade — how you fenced stuff, you know? Or perhaps you won't tell me. Maybe it would be better not. At any rate, this money is useful, so I won't ask too many questions.",
          "It's our cash reserve — well, your cash reserve, really, but for now it is serving both of us.",
        ]
        let billDesc = MAUtils.fakeRandomElement(billDescs, gameState)
        return this.inspected ? uninspectedStr : billDesc
      }
      rollOfBills.isPlural = function() { return false }
      rollOfBills.isEssential = true
      rollOfBills.addAttribute("lookOnce")
      locker.nouns.push(rollOfBills)


      let letter = new MANoun("letter", "It's a letter from your brother, printed off anonymously from an untraceable email account that you accessed in town. Nothing that could be followed back to Slango and the yacht.\n\nSis,\n\nI'm keeping your wire transfer funds. I want to try for Stanford.\n\nI'd say thank you except that, one, you didn't get it legally (I saw this documentary about teen prostitutes — if that's where it came from then EW) and, two, honestly? You owe me for what you put us through after you ran away. Mom and Dad were humiliated that you turned into the prodigal daughter. Your face got on milk cartons. Pastor Hughes GAVE A SERMON ABOUT IT.\n\nMom spent all that time coaching you through spelling practice, you know she doesn't enjoy getting up at 4 AM, right? You totally threw that in their faces.\n\nIf you want to come home sometime, fine, but don't come to just see me. If you want to see me you have to see Mom and Dad too.\n\nNate.")
      letter.addAttribute("lookOnce")
      locker.nouns.push(letter)

      let plans = new MANoun("plans", `The plans are rolled up and stuck shut with a label that reads "PROPERTY OF DENTAL CONSONANTS LIMITED — UNAUTHORIZED USE ILLEGAL". They're just a set of prints from the main computer design, of course, but still extremely informative: to the right engineer, they might reveal the secret of T-insertion for replication by other companies. These are what you and Brock were originally contracted to lift from the island, at a fee in the multiple millions.`)
      plans.addAttribute("illegal")
      plans.addAttribute("long")
      plans.addAttribute("floppy")
      plans.isEssential = true
      plans.addAttribute("lookOnce")
      locker.nouns.push(plans)


      let noteStr =
`

Hello!

My apologies for breaking the 4th wall.

Thanks for playing this demo of Counterfeit Monkey! You have now solved all of the puzzles included in this demo. Well done! 🎉🎉🎉

If you'd like to, you can continue playing around with the letter-remover and restoration gel in this small world.

If you want to really have some fun, please check out the full original game, created by Emily Short. It's a piece of traditional interactive fiction but don't be afraid. If you got this far, you'll be able to figure it out! It's a truly wonderful game with a great story, fun puzzles, and a rich world :)

Alex and Andra could really use your help!

<a href="https://memalign.github.io">Play in a web browser</a>

<a href="/p/counterfeit-monkey.html">Learn more about this demo</a>

- memalign`

      let noteFromDeveloper = new MANoun("note from developer", noteStr)
      locker.nouns.push(noteFromDeveloper)


      gameState.log.log("Now that the lock has been removed, the locker swings open easily, revealing " + MAUtils.naturalLanguageStringForArray(locker.nouns, "and") + ".\n\nWe've accomplished our goal of retrieving your remaining possessions from your locker at the hostel.")


    } else if (action.description().startsWith("(show her)")) {

      gameState.log.log(`"Check this out," we say, holding out the ${action.chosenTarget.name} for inspection.\n\nThe backpacking girl gags. After a moment to regain her composure, she flees the vicinity.`)

      gameState.currentLocation.nouns = gameState.currentLocation.nouns.filter(x => x.name != "backpacking girl")


    } else if (action.description().startsWith("(tell her)")) {
      let chosenAnswer = action.chosenTarget

      if (chosenAnswer == "we know how jetlag can be") {
        this.setValueForKey(gameState, MADormState.AskedWhereFrom, "state")

        gameState.log.log(`"I know how that is," you say. Which is interesting: apparently you do know. I don't, never having left this island.\n\nShe frowns curiously at us. "I don't get your accent, actually. Where are you from?"`)
      } else if (chosenAnswer == "a lie") {
        this.setValueForKey(gameState, MADormState.RespondedToWhereFrom, "state")
        gameState.log.log(`"I grew up in California," you say. "In... sort of a suburb of Los Angeles, though pretty far out. Fontana, if you've heard of that."\n\n"Nah," she says, without interest. "But that's cool."`)
      } else if (chosenAnswer == "the truth") {
        this.setValueForKey(gameState, MADormState.RespondedToWhereFrom, "state")
        gameState.log.log(`I spent some of my life around here and some of it traveling around the Mediterranean, living on a yacht and conducting acts of international espionage. That's when I wasn't working on a university degree in language studies."\n\n"...Right," she says. "I'm guessing world-traveling professor-spies don't stay in youth hostels."`)
      } else if (chosenAnswer == "a lie about getting here") {
        this.setValueForKey(gameState, MADormState.RespondedToWhenGotHere, "state")
        gameState.log.log(`"Just a few days. I wanted a little time to see the place, before it got all crazy for Serial Comma Day," you lie smoothly.\n\n"Oh, yeah, that was smart," she says. "I am really not ready for this at all."`)
      } else if (chosenAnswer == "we do") {
        this.setValueForKey(gameState, MADormState.RespondedToLikeThisPlace, "state")
        gameState.log.log(`We respond with a friendly smile. "Sure," you say. "It's pretty, it's clean, there's lots of interesting stuff around." I can see why your career isn't with a tourist board.\n\n"I guess."`)
      } else if (chosenAnswer == "we don't") {
        this.setValueForKey(gameState, MADormState.RespondedToLikeThisPlace, "state")
        gameState.log.log(`"There are a lot of things to say about the government," we reply cautiously.\n\n"Like what?"\n\n"It's better not to say them out loud."\n\n"If you can't say something nice, it's better not to say anything at all," the girl responds. "I hate gossip especially when people won't give hard details. That's how this girl Stacy at my school got totally ostracized for supposedly doing something slutty only no one knew what it was."`)
      } else if (chosenAnswer == "we're neutral") {
        this.setValueForKey(gameState, MADormState.RespondedToLikeThisPlace, "state")
        gameState.log.log(`We shrug. "I've seen better and I've seen worse." Which is a lie, at least on my part: I've seen nothing but Atlantis my whole life.\n\n"Makes sense."`)
      } else if (chosenAnswer == "we agree") {
        this.setValueForKey(gameState, MADormState.RespondedToComplainedAboutShowers, "state")
        gameState.log.log(`"I'm more used to having my own bathroom," we agree. Which I guess is true for me; your memories appear to be a little more diverse.\n\n"I know, right?"`)
      } else if (chosenAnswer == "we disagree") {
        this.setValueForKey(gameState, MADormState.RespondedToComplainedAboutShowers, "state")
        gameState.log.log(`"Practically third-world," you say sarcastically.\n\n"I know, right?"`)
      } else if (chosenAnswer == "she's right") {
        this.setValueForKey(gameState, MADormState.RespondedToComplainedAboutDeskGirl, "state")
        gameState.log.log(`"I've seen more impressive customer service," you say.\n\n"You'd think they'd be a little nicer if they want repeat customers," she grumps. I decide not to point out that the hostel is by far the cheapest lodging place on the island, is probably run on subsidies to make it possible for foreign students to visit at all, and never suffers from any lack of customers.`)
      } else if (chosenAnswer == "she's wrong") {
        this.setValueForKey(gameState, MADormState.RespondedToComplainedAboutDeskGirl, "state")
        gameState.log.log(`We frown. "She's probably paid about five dollars an hour to greet visitors and scrub toilets while everyone else has a holiday," we say. "This place is heavily subsidized to run at all. Having to work here is a form of punitive community service."\n\n"Well, okay. But she must have done something to get assigned community service, then."\n\n"Exceeded her allowance of accidental misspellings, I imagine," I say.\n\nThe girl starts to laugh, then trails off when she realizes this is not a joke.`)
      } else if (chosenAnswer == "about the louse incident") {
        this.setValueForKey(gameState, MADormState.RespondedToComplainedAboutDeskGirl, "state")
        gameState.log.log(`"I'm afraid I made the attendant go away," we confess. "I turned her blouse into something else."\n\nShe blinks, startled, and you have the impression that you've frightened her a little. "Oh... right. My mother warned me to be careful."`)
      } else if (chosenAnswer == "something friendly") {
        this.setValueForKey(gameState, MADormState.RespondedToMentionedSouvenir, "state")
        gameState.log.log(`We go for a friendly, non-fake smile. "I'm sure your snowglobe will be a big hit with your friends back home."\n\n"Yeah," she says. "Though I have to keep my souvenir buying light because there isn't that much room in my pack."`)
      } else if (chosenAnswer == "something mean-spirited") {
        this.setValueForKey(gameState, MADormState.RespondedToMentionedSouvenir, "state")
        gameState.log.log(`We snicker. "Your snowglobe must be a collector's item," we say. "It only snows at the Vatican once every couple of decades."\n\n"Oh yeah! Cool."\n\n"Not like those Norwegian snowglobes," you add. "Those are a dime a dozen." Pushing your luck a little, perhaps. She gives us a faintly puzzled look but doesn't say anything.`)
      } else if (chosenAnswer == "about the cathedral gift shop") {
        this.setValueForKey(gameState, MADormState.SuggestedGiftShop, "state")
        gameState.log.log(`"If you do want to do some shopping, there's the New Church across the square. It's got a bunch of gifts like your snowglobe."\n\n"Sweet! I'll check it out when I'm more rested. Thanks!"\n\nOh well. It was worth a try.`)
      }

    } else if (action.description().startsWith("(ask)")) {
      let chosenQuestion = action.chosenTarget

      if (chosenQuestion == "for privacy") {
        let asks = [
          `"Would you mind giving me a minute?" we say. "Sorry, I could just use a little privacy."`,
          `"I'd really like to be alone for a couple of minutes now," we say.`,
          `"This will just take a moment, but you would you mind giving me the room to myself?" we say.`,
        ]

        let responses = [
          `She waves a hand generously. "Don't worry about it, do whatever you've got to do, I don't care," she says. "I'm so tired I couldn't move a muscle, but I've seen everything. I have three brothers and two sisters and I'm in women's rugby so I'm pretty hard to shock."`,
          //`She just grunts and waves to indicate we may strip naked at our leisure.`,
          //`"Dude," she says, exasperated. "If you wanted a private room you should've not stayed at a freaking hostel."`,
          //"She groans.",
        ]

        let ask = MAUtils.fakeRandomElement(asks, gameState)
        let response = MAUtils.fakeRandomElement(responses, gameState)

        gameState.log.log(ask + "\n\n" + response)

      } else if (chosenQuestion == "whether she is from Canada") {
        mentionedTopics.push("AskedCanada")

        gameState.log.log(`"So," we say, nodding at the pack. "Are you really Canadian?"\n\n"Uh, no. I come from Ohio. But don't tell anyone that. My mom thought this would be safer in case of terrorists. She's also worried about serial killers but there's not much I can do about that."`)

      } else if (chosenQuestion == "whether she had trouble with customs") {
        mentionedTopics.push("Customs")

        gameState.log.log(`"How was coming through Customs?" we ask. "Any trouble there?"\n\n"Not really. There were a few people in line, and they made me take all my stuff out of my backpack... and this one guy I saw them take away into a back room, and I don't think he ever came out again. But, uh, they were nice enough to me I guess. I was expecting worse."`)
      }

    }

  }

  appendBackpackingGirlMannerismIfNecessary(gameState, action) {
    if (action instanceof MAActionLook) {
      if (action.chosenTarget.name == "backpacking girl") {
        let mannerismStrs = [
          "She eyes the beds thoughtfully and then climbs into the one she's selected.",
          "She tosses restlessly.",
          "She turns over.",
          "She bangs her head against the space where a pillow ought to be.",
          "She scrubs at her eyes with one hand.",
          "She rolls out of bed and roams the room, reconsidering her bed choice.",
          "She watches us with interest.",
        ]
        let mannerismStr = MAUtils.fakeRandomElement(mannerismStrs, gameState)
        gameState.log.log(mannerismStr)
      }
    }
  }

  appendBackpackNoteOrAddPackItemsIfNecessary(gameState, action) {
    if (action instanceof MAActionLook) {
      if (action.chosenTarget.name == "heavy pack") {
        if (gameState.currentLocation.hasNounNamed("backpacking girl")) {
          gameState.log.log("Overtly searching her possessions while she is here seems like a ticket to trouble.")
        } else {
          gameState.log.log("With the girl gone, we can freely inspect its contents.")

          let heavyPack = action.chosenTarget
          if (heavyPack.nouns.length == 0) {
            let bikini = new MAScenery("bikini bottoms", "The tops are not in evidence, at least as far as casual inspection reveals.")
            bikini.addAttribute("lookOnce")
            heavyPack.nouns.push(bikini)


            let tshirts = new MAScenery("various t-shirts", "There's not a one without a logo of some kind.")
            tshirts.addAttribute("lookOnce")
            heavyPack.nouns.push(tshirts)

            let shorts = new MAScenery("very short shorts", "It's a good thing the weather here is really as warm as popularly imagined.")
            shorts.addAttribute("lookOnce")
            heavyPack.nouns.push(shorts)

            let anorak = new MAScenery("anorak", "It might be meant to counter the effect of all the shorts.")
            anorak.addAttribute("lookOnce")
            heavyPack.nouns.push(anorak)

            let skirt = new MAScenery("broomstick skirt", "It is the sort of skirt made of thin fabric that twists up into a tight tube, and is supposed to be interestingly crinkly when worn.")
            skirt.addAttribute("lookOnce")
            heavyPack.nouns.push(skirt)

            let flipFlops = new MAScenery("flip-flops", "The sole of each flip-flop is decorated with the image of Snoopy.")
            flipFlops.addAttribute("lookOnce")
            heavyPack.nouns.push(flipFlops)

            let tampons = new MAScenery("box of tampons", "Let's not. This is awkward enough already.")
            tampons.addAttribute("lookOnce")
            tampons.isPlural = () => false
            heavyPack.nouns.push(tampons)

            let guidebook = new MAScenery("fat guidebook to Europe", "The spine is cracked at many points and the pages folded over for future reference.")
            guidebook.addAttribute("lookOnce")
            heavyPack.nouns.push(guidebook)

            let camera = new MAScenery("cheap camera", "It is a flimsy device in rose-pink, with a very small lens.")
            camera.addAttribute("lookOnce")
            heavyPack.nouns.push(camera)
          }
        }
      }
    }
  }

  logAboutFreakingGirlOut(gameState) {
    let lockHints = [
      "Maybe if we freaked her out somehow she would go away.",
      "I think our best bet is to show her something that really weirds her out.",
    ]
    gameState.log.log(`The backpacking girl is watching our every move with unconcealed curiosity, which makes me a little hesitant to do anything with the locker. ` + MAUtils.fakeRandomElement(lockHints, gameState))

    let mentionedTopics = this.valueForKey(gameState, "mentionedTopics")
    if (!mentionedTopics) {
      mentionedTopics = []
      this.setValueForKey(gameState, mentionedTopics, "mentionedTopics")
    }
    mentionedTopics.push("FreakHerOut")
  }

  appendLockHintsIfNecessary(gameState, action) {
    if (action instanceof MAActionLook) {
      if (action.chosenTarget.name == "lock") {
        if (gameState.currentLocation.hasNounNamed("backpacking girl")) {
          this.logAboutFreakingGirlOut(gameState)
        }
      }
    }
  }

  appendNPCUtteranceIfNecessary(gameState, action) {
    if (!gameState.currentLocation.hasNounNamed("backpacking girl")) {
      return
    }

    if (action instanceof MAActionMove) {
      return
    }

    if (action.description().startsWith("(ask)")) {
      return
    }

    if (action.description().startsWith("(tell her)")) {
      return
    }

    if (action.description().startsWith("(remember)")) {
      return
    }


    var state = this.valueForKey(gameState, "state")
    state = state ? state : 0

    if (state == MADormState.Initial) {
      this.setValueForKey(gameState, MADormState.SaidWishIHadntRemembered, "state")
      gameState.log.log(`"Wish I hadn't remembered that serial killer thing," the girl remarks, half to herself. "Now it's going to keep me up later. Picturing someone with a saw hacking me up."`)
    } else if (state == MADormState.SaidWishIHadntRemembered) {
      this.setValueForKey(gameState, MADormState.SaidSoJetLagged, "state")
      gameState.log.log(`"Oh my gosh, I am SO jetlagged. I feel like I'm just going to fall over, you know?"`)
    } else if (state == MADormState.RespondedToWhereFrom) {
      this.setValueForKey(gameState, MADormState.AskedWhenGotHere, "state")
      gameState.log.log(`"So when did you get to Anglophone Atlantis, anyway? How long have you been here?"`)
    } else if (state == MADormState.RespondedToWhenGotHere) {
      this.setValueForKey(gameState, MADormState.AskedLikeThisPlace, "state")
      gameState.log.log(`"Do you like this place so far?"`)
    } else if (state == MADormState.RespondedToLikeThisPlace) {
      this.setValueForKey(gameState, MADormState.ComplainedAboutShowers, "state")
      gameState.log.log(`"I can't believe this room doesn't have its own bathroom and showers. I mean, gross."`)
    } else if (state == MADormState.RespondedToComplainedAboutShowers) {
      this.setValueForKey(gameState, MADormState.ComplainedAboutDeskGirl, "state")
      gameState.log.log(`"Have you tried talking to the desk girl downstairs? I mean for more than two seconds? She is a total witch that starts with B, know what I mean? Like, she looked at me like I was completely an idiot, right, and, like, what does she expect? Of course I don't know my way around, I just got here."`)
    } else if (state == MADormState.RespondedToComplainedAboutDeskGirl) {
      this.setValueForKey(gameState, MADormState.MentionedSouvenir, "state")
      gameState.log.log(`"I hope this place has good souvenirs. I got this great snowglobe at the Vatican, right, that has the Pope inside saying, like, a blessing."`)
    }


    let mentionedTopics = this.valueForKey(gameState, "mentionedTopics")
    if (!mentionedTopics) {
      mentionedTopics = []
      this.setValueForKey(gameState, mentionedTopics, "mentionedTopics")
    }

    let hostelLoc = gameState.currentLocation.linkedLocations().filter(x => x.name.includes("Hostel"))[0]
    if (hostelLoc.hasNounNamed("desk attendant") &&
        state >= MADormState.MentionedSouvenir &&
        !mentionedTopics.includes("NoLoitering")) {

      mentionedTopics.push("NoLoitering")

      gameState.log.log(`There's a heavy tread in the hallway, and the desk attendant puts her head in. "Just so you two know, you're not actually supposed to be hanging out a lot up here during the day. It's for night use really. I'm not going to do anything today, but it's kind of against the rules, for future reference."\n\nShe turns around and goes back down. The backpacking girl sticks her tongue out at her departing back.`)
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    if (gameState.currentLocation.hasNounNamed("backpacking girl")) {
      if (action.description().startsWith("(rub gel)")) {
        if (action.chosenTarget.name == "lock") {
          this.logAboutFreakingGirlOut(gameState)
          return false
        }
      }
    }

    return true
  }

  gameEngineDidPerformAction(action, gameState) {
    this.appendBackpackingGirlMannerismIfNecessary(gameState, action)
    this.appendBackpackNoteOrAddPackItemsIfNecessary(gameState, action)
    this.appendLockHintsIfNecessary(gameState, action)
    this.appendNPCUtteranceIfNecessary(gameState, action)
  }
}


class MAGameSegmentNounActions extends MAGameSegment {
  constructor() {
    super("NounActions")
  }

  suppressOtherActionsForGameState(gameState) {
    return false
  }

  nounsWithActions(gameState) {
    return gameState.currentLocation.nouns.filter(x => x.action && x.inspected)
  }

  segmentIsRelevantForGameState(gameState) {
    return this.nounsWithActions(gameState).length > 0
  }

  actionsForGameState(gameState) {
    let actions = this.nounsWithActions(gameState).map(x => x.action)
    for (let action of actions) {
      action.performer = this
    }

    return actions
  }

  performActionOnGameState(action, gameState) {
    if (action.performHandler) {
      action.performHandler(gameState)
    }
  }

  gameEngineWillPerformAction(action, gameState) {
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
    let hasLookedAtSelf = this.valueForKey(gameState, "lookedAtSelf")
    return !hasLookedAtSelf
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
      let appearanceStrs = [
        "This body is more you than me — well, it would be, since we came out a girl. Still, I feel a bit odd inspecting us too closely. It feels like invading your privacy.\n\nI don't think anything about us looks out of place. We are female, though a little taller and leaner than average, and with slightly boyish facial features. It's nothing that would attract attention, though.",
        //"This body is more you than me — well, it would be, since we came out a girl. Still, I feel a bit odd inspecting us too closely. It feels like invading your privacy.",
        //"I don't think anything about us looks out of place. We are female, though a little taller and leaner than average, and with slightly boyish facial features. It's nothing that would attract attention, though.",
      ]
      let appearanceStr = MAUtils.fakeRandomElement(appearanceStrs, gameState)

      gameState.log.log(appearanceStr)

      this.setValueForKey(gameState, true, "lookedAtSelf")
    }
  }

  gameEngineWillPerformAction(action, gameState) {
    return true
  }

  gameEngineDidPerformAction(action, gameState) {
  }
}

