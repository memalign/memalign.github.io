
class MALogger {
  constructor() {
    this.logs = []
  }

  log(str) {
    this.logs.push(str)
  }

  clear() {
    this.logs = []
  }
}

let MALog = new MALogger()

var assertionCount = 0
function assertTrue(condition, str) {
    if (!condition) {
      MALog.log("Failed assertion: " + str)
      throw "Failed assertion: " + str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqual(str1, str2) {
    if (str1 !== str2) {
      let str = "Failed assertion: \"" + str1 + "\" does not equal \"" + str2 + "\"" + "\n" + (new Error()).stack
      MALog.log(str)
      throw str
    }
    assertionCount++
}

function assertEqualDeep(obj1, obj2) {
    let ineqStr = ""
    const ineqHandler = (s) => {
      ineqStr = " ; " + s
    }

    if (!MAUtils.isEqualDeep(obj1, obj2, ineqHandler)) {
      let str = "Failed assertion: \"" + obj1 + "\" does not deep equal \"" + obj2 + "\"" + ineqStr
      MALog.log(str)
      throw str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqualGames(game1, game2) {
    // Deserialized games don't have a saveBlock. Ignore this property for the purpose of asserting equal.
    const game1SaveBlock = game1._saveBlock
    game1._saveBlock = null

    const game2SaveBlock = game2._saveBlock
    game2._saveBlock = null

    // Cheat-related properties won't be serialized
    const game1ShowSpecialSystems = game1.showSpecialSystems
    delete game1.showSpecialSystems
    const game2ShowSpecialSystems = game2.showSpecialSystems
    delete game2.showSpecialSystems

    const game1ForceRareEvent = game1.forceRareEvent
    delete game1.forceRareEvent
    const game2ForceRareEvent = game2.forceRareEvent
    delete game2.forceRareEvent


    assertEqualDeep(game1, game2)


    game1._saveBlock = game1SaveBlock
    game2._saveBlock = game2SaveBlock

    if (game1ShowSpecialSystems !== undefined) {
      game1.showSpecialSystems = game1ShowSpecialSystems
    }
    if (game2ShowSpecialSystems !== undefined) {
      game2.showSpecialSystems = game2ShowSpecialSystems
    }

    if (game1ForceRareEvent !== undefined) {
      game1.forceRareEvent = game1ForceRareEvent
    }
    if (game2ForceRareEvent !== undefined) {
      game2.forceRareEvent = game2ForceRareEvent
    }
}

function assertEqualFloats(f1, f2, tolerance) {
  if (!tolerance) {
    tolerance = 0
  }

    if (Math.abs(f1-f2) > tolerance) {
      let str = "Failed assertion: \"" + f1 + "\" does not equal \"" + f2 + "\""
      MALog.log(str)
      throw str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqualArrays(arr1, arr2) {
  // From https://masteringjs.io/tutorials/fundamentals/compare-arrays
  let isEqual = Array.isArray(arr1) &&
    Array.isArray(arr2) &&
    arr1.length === arr2.length &&
    arr1.every((val, index) => val === arr2[index])

    if (!isEqual) {
      let str = "Failed assertion:\n\n\"" + arr1 + "\" does not equal\n\n\"" + arr2 + "\""
      MALog.log(str)
      throw str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertPixelColor(ctx, x, y, color) {
  let data = ctx.getImageData(x, y, 1, 1).data
  let hex = MAUtils.rgbToHex(data[0], data[1], data[2])
  assertEqual(hex, color)
}


class UnitTests {

// MAGameRand
  test_randomInt() {
    let r = new MAGameRand(1)
    //              0  1  2  3  4  5  6  7  8  9 10 11
    let observed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    let expected = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
    for (let i = 0; i < 100; ++i) {
      let v = r.randomInt(0, 10)
      observed[v] = 1
    }

    assertEqualArrays(observed, expected)
  }

// MAUtils
  test_addToOrderedSet() {
    let arr = [SSSTShipModelType.Flea, SSSTShipModelType.Firefly];
    MAUtils.addToOrderedSet(arr, SSSTShipModelType.Flea)
    MAUtils.addToOrderedSet(arr, SSSTShipModelType.Gnat)
    MAUtils.addToOrderedSet(arr, SSSTShipModelType.Firefly)
    MAUtils.addToOrderedSet(arr, SSSTShipModelType.Beetle)
    assertEqualArrays(arr, [SSSTShipModelType.Flea, SSSTShipModelType.Firefly, SSSTShipModelType.Gnat, SSSTShipModelType.Beetle])
  }

// Rare Events
  test_BottleGood_Ignore() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Good_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Tantalos you encounter a floating bottle.<br><br>It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!")

    replay.replayEvent("ecButton_Ignore", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 18 clicks from Tantalos you encounter a police Gnat.<br><br>It ignores you.")

    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 5)
    assertEqual(game.commander.engineer, 5)
    assertEqual(game.commander.fighter, 5)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 5)
    assertEqual(game2.commander.engineer, 5)
    assertEqual(game2.commander.fighter, 5)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_BottleGood_Pass() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Good_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Tantalos you encounter a floating bottle.<br><br>It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!")

    replay.replayEvent("ecButton_Drink", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. In the old days, this stuff went for thousands of credits a bottle since people reported significant gains in their abilities after quaffing a bottle. Would you like to drink it?")

    replay.replayEvent("alertButton_I_ll_pass", "click")


    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 18 clicks from Tantalos you encounter a police Gnat.<br><br>It ignores you.")

    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 5)
    assertEqual(game.commander.engineer, 5)
    assertEqual(game.commander.fighter, 5)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 5)
    assertEqual(game2.commander.engineer, 5)
    assertEqual(game2.commander.fighter, 5)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_BottleGood_Drink() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Good_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Tantalos you encounter a floating bottle.<br><br>It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!")

    assertEqual(document.getElementById(`battle-hpContainer-self-Gnat`).style.visibility, "visible")
    assertEqual(document.getElementById(`battle-hpContainer-enemy-Bottle`).style.visibility, "hidden")

    replay.replayEvent("ecButton_Drink", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. In the old days, this stuff went for thousands of credits a bottle since people reported significant gains in their abilities after quaffing a bottle. Would you like to drink it?")

    replay.replayEvent("alertButton_Yes__drink_it", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Mmmmm. Captain Marmoset's Amazing Skill Tonic not only fills you with energy, but tastes like a fine single-malt. You feel a slight tingling in your fingertips.")

    replay.replayEvent("alertButton_Dismiss", "click")


    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 19 clicks from Tantalos you encounter a police Gnat.<br><br>It ignores you.")

    assertEqual(document.getElementById(`battle-hpContainer-self-Gnat`).style.visibility, "visible")
    assertEqual(document.getElementById(`battle-hpContainer-enemy-Gnat`).style.visibility, "visible")

    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 5)
    assertEqual(game.commander.engineer, 6)
    assertEqual(game.commander.fighter, 6)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 5)
    assertEqual(game2.commander.engineer, 6)
    assertEqual(game2.commander.fighter, 6)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_BottleOld_Ignore() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Old_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Tantalos you encounter a floating bottle.<br><br>It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!")

    replay.replayEvent("ecButton_Ignore", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 18 clicks from Tantalos you encounter a police Gnat.<br><br>It ignores you.")

    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 5)
    assertEqual(game.commander.engineer, 5)
    assertEqual(game.commander.fighter, 5)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 5)
    assertEqual(game2.commander.engineer, 5)
    assertEqual(game2.commander.fighter, 5)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_BottleOld_Pass() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Old_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Tantalos you encounter a floating bottle.<br><br>It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!")

    replay.replayEvent("ecButton_Drink", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. The \"best used by\" date stamped on the bottle has become illegible. The tonic might still be good. Then again, it's not clear what happens when the Tonic breaks down...")

    replay.replayEvent("alertButton_I_ll_pass", "click")


    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 18 clicks from Tantalos you encounter a police Gnat.<br><br>It ignores you.")

    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 5)
    assertEqual(game.commander.engineer, 5)
    assertEqual(game.commander.fighter, 5)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 5)
    assertEqual(game2.commander.engineer, 5)
    assertEqual(game2.commander.fighter, 5)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_BottleOld_Drink() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Old_Bottle","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733543535142}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Tantalos you encounter a floating bottle.<br><br>It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!")

    assertEqual(document.getElementById(`battle-hpContainer-self-Gnat`).style.visibility, "visible")
    assertEqual(document.getElementById(`battle-hpContainer-enemy-Bottle`).style.visibility, "hidden")

    replay.replayEvent("ecButton_Drink", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. The \"best used by\" date stamped on the bottle has become illegible. The tonic might still be good. Then again, it's not clear what happens when the Tonic breaks down...")

    replay.replayEvent("alertButton_Yes__drink_it", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "While you don't know what it was supposed to taste like, you get the feeling that this dose of tonic was a bit off. This bottle tasted very strange, like slightly salty red wine. You feel a bit dizzy and your teeth itch for a while.")

    replay.replayEvent("alertButton_Dismiss", "click")


    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 19 clicks from Tantalos you encounter a police Gnat.<br><br>It ignores you.")

    assertEqual(document.getElementById(`battle-hpContainer-self-Gnat`).style.visibility, "visible")
    assertEqual(document.getElementById(`battle-hpContainer-enemy-Gnat`).style.visibility, "visible")

    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 5)
    assertEqual(game.commander.engineer, 6)
    assertEqual(game.commander.fighter, 4)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 5)
    assertEqual(game2.commander.engineer, 6)
    assertEqual(game2.commander.fighter, 4)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_Ahab_notEligible() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Captain_Ahab","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733197780168}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 15 clicks from Japori you encounter a police Firefly.<br><br>It ignores you.")

    assertEqualArrays(game._remainingRareEvents, [SSSTRareEvent.CaptainAhab])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [SSSTRareEvent.CaptainAhab])
  }

  test_Ahab_accept() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Ahab","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Ahab.<br><br>The captain requests a brief meeting with you.")

    replay.replayEvent("ecButton_Meet", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Captain Ahab, one of the greatest pilots of all time, is in need of a shield for an upcoming mission. To save the time it would take to land and find a vendor, Ahab is offering to trade you some piloting lessons in exchange for one reflective shield.")

    const pilotBefore = game.commander.pilot
    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)

    replay.replayEvent("alertButton_Yes__trade_", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "After a few hours of training with a top expert, you feel your abilities have improved significantly.")

    replay.replayEvent("alertButton_Dismiss", "click")

    const pilotAfter = game.commander.pilot
    assertEqual(pilotAfter, pilotBefore+2)

    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), false)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), false)
    const pilotAfter2 = game2.commander.pilot
    assertEqual(pilotAfter2, pilotBefore+2)
  }

  test_Ahab_noThanks() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Ahab","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Ahab.<br><br>The captain requests a brief meeting with you.")

    replay.replayEvent("ecButton_Meet", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Captain Ahab, one of the greatest pilots of all time, is in need of a shield for an upcoming mission. To save the time it would take to land and find a vendor, Ahab is offering to trade you some piloting lessons in exchange for one reflective shield.")

    const pilotBefore = game.commander.pilot
    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)

    replay.replayEvent("alertButton_No_thanks_", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 13 clicks from Yew you encounter a trader Gnat.<br><br>It ignores you.")

    const pilotAfter = game.commander.pilot
    assertEqual(pilotAfter, pilotBefore)

    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)
    const pilotAfter2 = game2.commander.pilot
    assertEqual(pilotAfter2, pilotBefore)
  }

  test_Ahab_ignore() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Ahab","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Ahab.<br><br>The captain requests a brief meeting with you.")

    const pilotBefore = game.commander.pilot
    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)

    replay.replayEvent("ecButton_Ignore", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 13 clicks from Yew you encounter a trader Gnat.<br><br>It ignores you.")

    const pilotAfter = game.commander.pilot
    assertEqual(pilotAfter, pilotBefore)

    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)
    const pilotAfter2 = game2.commander.pilot
    assertEqual(pilotAfter2, pilotBefore)
  }

  test_Ahab_attack() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Ahab","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Ahab.<br><br>The captain requests a brief meeting with you.")

    const pilotBefore = game.commander.pilot
    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)

    const policeRecordScoreBefore = game.commander.policeRecordScore
    replay.replayEvent("ecButton_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Famous captains get famous by, among other things, destroying everyone who attacks them. Do you really want to attack?")


    replay.replayEvent("alertButton_Attack", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Ignore", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Ignore", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("alertButton_Dismiss", "click") // arrived

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Yew")

    assertEqualArrays(game._breakingNews, [ "Thug Assaults Captain Ahab!" ])

    replay.replayEvent("News", "click")
    replay.replayEvent("purchaseNews", "click")


    const newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The Command</h4><br>Thug Assaults Captain Ahab!<br><br>Notorious Criminal Jean-Luc Sighted in Yew!<br><br>Insurrection Crushed: Rebels Executed!")

    assertEqual(game._breakingNews, null)

    assertEqual(game.commander.policeRecordScore, SSSTPoliceRecordScore.Villain + ATTACK_TRADER_SCORE)

    const pilotAfter = game.commander.pilot
    assertEqual(pilotAfter, pilotBefore)

    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldReflective), true)
    const pilotAfter2 = game2.commander.pilot
    assertEqual(pilotAfter2, pilotBefore)
    assertEqual(game2.commander.policeRecordScore, SSSTPoliceRecordScore.Villain + ATTACK_TRADER_SCORE)
  }

  test_Conrad_notEligible() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Captain_Conrad","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733197780168}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 15 clicks from Japori you encounter a police Firefly.<br><br>It ignores you.")

    assertEqualArrays(game._remainingRareEvents, [SSSTRareEvent.CaptainConrad])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [SSSTRareEvent.CaptainConrad])
  }

  test_Conrad_accept() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Conrad","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Conrad.<br><br>The captain requests a brief meeting with you.")

    replay.replayEvent("ecButton_Meet", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Captain Conrad, fleet historian and inventor of the modern warp drive, is in need of a laser to test her new shield design. Unfortunately, she's used up her R&D budget for the year. Instead of cash, she'll trade you some engineering lessons in exchange for one military laser.")

    const engBefore = game.commander.engineer

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    replay.replayEvent("alertButton_Yes__trade_", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "After a few hours of training with a top expert, you feel your abilities have improved significantly.")

    replay.replayEvent("alertButton_Dismiss", "click")

    const engAfter = game.commander.engineer
    assertEqual(engAfter, engBefore+2)

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), false)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), false)
    const engAfter2 = game2.commander.engineer
    assertEqual(engAfter2, engBefore+2)
  }

  test_Conrad_noThanks() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Conrad","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Conrad.<br><br>The captain requests a brief meeting with you.")

    replay.replayEvent("ecButton_Meet", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Captain Conrad, fleet historian and inventor of the modern warp drive, is in need of a laser to test her new shield design. Unfortunately, she's used up her R&D budget for the year. Instead of cash, she'll trade you some engineering lessons in exchange for one military laser.")

    const engBefore = game.commander.engineer
    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    replay.replayEvent("alertButton_No_thanks_", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 13 clicks from Yew you encounter a trader Gnat.<br><br>It ignores you.")

    const engAfter = game.commander.engineer
    assertEqual(engAfter, engBefore)

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)
    const engAfter2 = game2.commander.engineer
    assertEqual(engAfter2, engBefore)
  }

  test_Conrad_ignore() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Conrad","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Conrad.<br><br>The captain requests a brief meeting with you.")

    const engBefore = game.commander.engineer
    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    replay.replayEvent("ecButton_Ignore", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 13 clicks from Yew you encounter a trader Gnat.<br><br>It ignores you.")

    const engAfter = game.commander.engineer
    assertEqual(engAfter, engBefore)

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)
    const engAfter2 = game2.commander.engineer
    assertEqual(engAfter2, engBefore)
  }

  test_Conrad_attack() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Conrad","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Conrad.<br><br>The captain requests a brief meeting with you.")

    const engBefore = game.commander.engineer
    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    const policeRecordScoreBefore = game.commander.policeRecordScore
    replay.replayEvent("ecButton_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Famous captains get famous by, among other things, destroying everyone who attacks them. Do you really want to attack?")


    replay.replayEvent("alertButton_Attack", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Ignore", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Ignore", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("alertButton_Dismiss", "click") // arrived

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Yew")

    assertEqualArrays(game._breakingNews, [ "Captain Conrad Comes Under Attack By Criminal!" ])

    replay.replayEvent("News", "click")
    replay.replayEvent("purchaseNews", "click")


    const newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The Command</h4><br>Captain Conrad Comes Under Attack By Criminal!<br><br>Notorious Criminal Jean-Luc Sighted in Yew!<br><br>Insurrection Crushed: Rebels Executed!")

    assertEqual(game._breakingNews, null)

    assertEqual(game.commander.policeRecordScore, SSSTPoliceRecordScore.Villain + ATTACK_TRADER_SCORE)

    const engAfter = game.commander.engineer
    assertEqual(engAfter, engBefore)

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)
    const engAfter2 = game2.commander.engineer
    assertEqual(engAfter2, engBefore)
    assertEqual(game2.commander.policeRecordScore, SSSTPoliceRecordScore.Villain + ATTACK_TRADER_SCORE)
  }

  test_Huie_notEligible() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Captain_Huie","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1733197780168}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 15 clicks from Japori you encounter a police Firefly.<br><br>It ignores you.")

    assertEqualArrays(game._remainingRareEvents, [SSSTRareEvent.CaptainHuie])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [SSSTRareEvent.CaptainHuie])
  }

  test_Huie_accept() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Huie","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Huie.<br><br>The captain requests a brief meeting with you.")

    replay.replayEvent("ecButton_Meet", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Captain Huie, former Trade Commissioner of the Galactic Council, is in need of a laser for an upcoming mission. Huie is known for driving a hard bargain and is offering some secrets of doing business in exchange for one military laser.")

    const tradBefore = game.commander.trader

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    replay.replayEvent("alertButton_Yes__trade_", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "After a few hours of training with a top expert, you feel your abilities have improved significantly.")

    replay.replayEvent("alertButton_Dismiss", "click")

    const tradAfter = game.commander.trader
    assertEqual(tradAfter, tradBefore+2)

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), false)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), false)
    const tradAfter2 = game2.commander.trader
    assertEqual(tradAfter2, tradBefore+2)
  }

  test_Huie_noThanks() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Huie","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Huie.<br><br>The captain requests a brief meeting with you.")

    replay.replayEvent("ecButton_Meet", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Captain Huie, former Trade Commissioner of the Galactic Council, is in need of a laser for an upcoming mission. Huie is known for driving a hard bargain and is offering some secrets of doing business in exchange for one military laser.")

    const tradBefore = game.commander.trader
    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    replay.replayEvent("alertButton_No_thanks_", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 13 clicks from Yew you encounter a trader Gnat.<br><br>It ignores you.")

    const tradAfter = game.commander.trader
    assertEqual(tradAfter, tradBefore)

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)
    const tradAfter2 = game2.commander.trader
    assertEqual(tradAfter2, tradBefore)
  }

  test_Huie_ignore() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Huie","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Huie.<br><br>The captain requests a brief meeting with you.")

    const tradBefore = game.commander.trader
    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    replay.replayEvent("ecButton_Ignore", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 13 clicks from Yew you encounter a trader Gnat.<br><br>It ignores you.")

    const tradAfter = game.commander.trader
    assertEqual(tradAfter, tradBefore)

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)
    const tradAfter2 = game2.commander.trader
    assertEqual(tradAfter2, tradBefore)
  }

  test_Huie_attack() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","Warp","cheat_Encounter_Captain_Huie","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Yew you encounter the famous Captain Huie.<br><br>The captain requests a brief meeting with you.")

    const tradBefore = game.commander.trader
    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    const policeRecordScoreBefore = game.commander.policeRecordScore
    replay.replayEvent("ecButton_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Famous captains get famous by, among other things, destroying everyone who attacks them. Do you really want to attack?")


    replay.replayEvent("alertButton_Attack", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Ignore", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Ignore", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("alertButton_Dismiss", "click") // arrived

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Yew")

    assertEqualArrays(game._breakingNews, [ "Famed Captain Huie Attacked by Brigand!" ] )

    replay.replayEvent("News", "click")
    replay.replayEvent("purchaseNews", "click")


    const newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The Command</h4><br>Famed Captain Huie Attacked by Brigand!<br><br>Notorious Criminal Jean-Luc Sighted in Yew!<br><br>Insurrection Crushed: Rebels Executed!")

    assertEqual(game._breakingNews, null)

    assertEqual(game.commander.policeRecordScore, SSSTPoliceRecordScore.Villain + ATTACK_TRADER_SCORE)

    const tradAfter = game.commander.trader
    assertEqual(tradAfter, tradBefore)

    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser), true)
    const tradAfter2 = game2.commander.trader
    assertEqual(tradAfter2, tradBefore)
    assertEqual(game2.commander.policeRecordScore, SSSTPoliceRecordScore.Villain + ATTACK_TRADER_SCORE)
  }

  test_MarieCeleste_ignore() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    for (let i = 0; i < 5; ++i) {
      assertEqual(document.getElementById("ecButton_Yield"), null) // Not encountering Customs Police
      replay.replayEvent("ecButton_Ignore", "click")
    }

    replay.replayEvent("alertButton_Dismiss", "click")

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Jason")

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_MarieCeleste_boardLeave() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("ecButton_Board", "click")
    replay.replayEvent("alertButton_Leave_it", "click")


    for (let i = 0; i < 4; ++i) {
      assertEqual(document.getElementById("ecButton_Yield"), null) // Not encountering Customs Police
      replay.replayEvent("ecButton_Ignore", "click")
    }

    replay.replayEvent("alertButton_Dismiss", "click")

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Jason")

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_MarieCeleste_boardDontTake() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("ecButton_Board", "click")
    replay.replayEvent("alertButton_Yes__take_cargo", "click")
    replay.replayEvent("alertButton__Take_plunderDump_some_cargo", "click")
    replay.replayEvent("alertButton__Take_dumpResume_plundering", "click")
    replay.replayEvent("alertButton__Take_plunderDone", "click")

    for (let i = 0; i < 4; ++i) {
      assertEqual(document.getElementById("ecButton_Yield"), null) // Not encountering Customs Police
      replay.replayEvent("ecButton_Ignore", "click")
    }

    replay.replayEvent("alertButton_Dismiss", "click")

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Jason")

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_MarieCeleste_boardTakeDumpYield() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("ecButton_Board", "click")
    replay.replayEvent("alertButton_Yes__take_cargo", "click")
    replay.replayEvent("cargo_NarcoticsTake_1", "click")
    replay.replayEvent("alertButton__Take_plunderDump_some_cargo", "click")
    replay.replayEvent("cargo_NarcoticsDump_1", "click")
    replay.replayEvent("alertButton_Yes__I_still_want_to", "click")
    replay.replayEvent("alertButton__Take_dumpResume_plundering", "click")
    replay.replayEvent("alertButton__Take_plunderDone", "click")
    replay.replayEvent("ecButton_Submit", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    const policeRecordBefore = game.commander.policeRecordScore
    const reputationBefore = game.commander.reputationScore


    for (let i = 0; i < 5; ++i) {
      assertEqual(document.getElementById("ecButton_Yield"), null) // Not encountering Customs Police
      replay.replayEvent("ecButton_Ignore", "click")
    }

    replay.replayEvent("ecButton_Yield", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The Customs Police find nothing illegal in your cargo holds and apologize for the inconvenience.")

    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("alertButton_Dismiss", "click")

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Jason")

    assertEqual(game.commander.policeRecordScore, policeRecordBefore)
    assertEqual(game.commander.reputationScore, reputationBefore)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_MarieCeleste_boardTakeYield() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("ecButton_Board", "click")
    replay.replayEvent("alertButton_Yes__take_cargo", "click")
    replay.replayEvent("cargo_NarcoticsTake_1", "click")
    replay.replayEvent("alertButton__Take_plunderDone", "click")

    const policeRecordBefore = game.commander.policeRecordScore
    const reputationBefore = game.commander.reputationScore


    for (let i = 0; i < 4; ++i) {
      assertEqual(document.getElementById("ecButton_Yield"), null) // Not encountering Customs Police
      replay.replayEvent("ecButton_Ignore", "click")
    }

    replay.replayEvent("ecButton_Yield", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The Customs Police confiscated all of your illegal cargo. For being cooperative, you avoided stronger fines or penalties.")

    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics), 0)

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Jason")

    assertEqual(game.commander.policeRecordScore, SSSTPoliceRecordScore.Dubious)
    assertEqual(game.commander.reputationScore, reputationBefore)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_MarieCeleste_boardTakeBribe() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("ecButton_Board", "click")
    replay.replayEvent("alertButton_Yes__take_cargo", "click")
    replay.replayEvent("cargo_NarcoticsTake_1", "click")
    replay.replayEvent("alertButton__Take_plunderDone", "click")

    for (let i = 0; i < 4; ++i) {
      assertEqual(document.getElementById("ecButton_Yield"), null) // Not encountering Customs Police
      replay.replayEvent("ecButton_Ignore", "click")
    }

    replay.replayEvent("ecButton_Bribe", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "We'd love to take your money, but Space Command already knows you've got illegal goods onboard.")
    assertTrue(document.getElementById("ecButton_Yield") != null, "yield option available")

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_MarieCeleste_boardTakeFlee() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("ecButton_Board", "click")
    replay.replayEvent("alertButton_Yes__take_cargo", "click")
    replay.replayEvent("cargo_NarcoticsTake_1", "click")
    replay.replayEvent("alertButton__Take_plunderDone", "click")

    const policeRecordBefore = game.commander.policeRecordScore
    const reputationBefore = game.commander.reputationScore

    for (let i = 0; i < 4; ++i) {
      assertEqual(document.getElementById("ecButton_Yield"), null) // Not encountering Customs Police
      replay.replayEvent("ecButton_Ignore", "click")
    }

    replay.replayEvent("ecButton_Auto_Flee", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Are you sure you want to flee? The Customs Police know you have engaged in criminal activity and your police record will reflect this fact.")

    replay.replayEvent("alertButton_Flee", "click")

    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics), 1)

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Jason")

    assertEqual(game.commander.policeRecordScore, SSSTPoliceRecordScore.Criminal)
    assertEqual(game.commander.reputationScore, reputationBefore)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
  }

  test_MarieCeleste_boardTakeAttack() {
    const replayLog = `{"idLog":["createCommander","cheat_Encounter_Marie_Celeste","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732854026979}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("ecButton_Board", "click")
    replay.replayEvent("alertButton_Yes__take_cargo", "click")
    replay.replayEvent("cargo_NarcoticsTake_1", "click")
    replay.replayEvent("alertButton__Take_plunderDone", "click")

    const policeRecordBefore = game.commander.policeRecordScore
    const reputationBefore = game.commander.reputationScore

    for (let i = 0; i < 4; ++i) {
      assertEqual(document.getElementById("ecButton_Yield"), null) // Not encountering Customs Police
      replay.replayEvent("ecButton_Ignore", "click")
    }

    replay.replayEvent("ecButton_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Are you sure you wish to attack the police? This will turn you into a criminal!")

    replay.replayEvent("alertButton_Attack", "click")

    replay.replayEvent("ecButton_Flee", "click")

    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics), 1)

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Jason")

    assertEqual(game.commander.policeRecordScore, SSSTPoliceRecordScore.Criminal + ATTACK_POLICE_SCORE)
    assertEqual(game.commander.reputationScore, reputationBefore)

    assertEqualArrays(game._remainingRareEvents, [])
    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqualArrays(game2._remainingRareEvents, [])
  }


// Quests
  test_questCount() {
    const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1732766875181}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(game.solarSystems.filter(x => x.specialEvent !== SSSTSpecialEvent.None).length, 42)
  }

  test_scarab() {
    const replayLog = `{"idLog":["trader","trader","trader","trader","engineer","engineer","engineer","engineer","pilot","pilot","pilot","pilot","fighter","fighter","fighter","fighter","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","namedEvent","namedEvent","namedEvent","galacticChart_useSingularity_121_Adahn","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buyship_Wasp","alertButton_Yes","Equipment","buy_Pulse_laser","alertButton_Yes","buy_Pulse_laser","alertButton_Yes","buy_Pulse_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","cheat_freeSingularity","Chart"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|6","slider|input|7","slider|input|8","slider|input|9","click","click","click","click","click","selectPlanet|Regulas","selectPlanet|Tanuga","selectPlanet|Leda","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734408890090}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    // reputationScore is too low for Special to show up
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.Scarab)
    let specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    replay.replayEvent("cheat_averageReputation", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Adahn")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    // Shows up now
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.Scarab)
    specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Captain Renwick developed a new organic hull material for his ship which cannot be damaged except by Pulse lasers. While he was celebrating this success, pirates boarded and stole the craft, which they have named the Scarab. Rumors suggest it's being hidden at the exit to a wormhole. Destroy the ship for a reward!")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game.questListDescription(), "Find and destroy the Scarab (which is hiding near a wormhole).")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game2.questListDescription(), "Find and destroy the Scarab (which is hiding near a wormhole).")

    replay.replayEvent("Chart", "click")

    replay.replayEvent("galacticChart_useSingularity_121_Davlos", "click")
    replay.replayEvent("alertButton_Warp_", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Khefka you encounter a stolen Scarab.<br><br>Your opponent attacks.")

    replay.replayEvent("cheat_fighter15", "click") // need more skill to win
    replay.replayEvent("ecButton_Auto_Attack", "click")

    assertEqual(game.scarabStatus, SSSTScarabQuestStatus.ScarabDestroyed)

    this._replaySkipEncounters(replay)

    replay.replayEvent("News", "click")
    replay.replayEvent("purchaseNews", "click")

    const newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The Daily Worker</h4><br>Wormhole Traffic Delayed as Stolen Craft Destroyed.<br><br>Plague Spreads! Outlook Grim.<br><br>Party: Bold New Future Predicted!")

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Space Corps is indebted to you for destroying the Scarab and the pirates who stole it. As a reward, we can have Captain Renwick upgrade the hull of your ship. Note that his upgrades won't be transferable if you buy a new ship! Come back with the ship you wish to upgrade.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetHullUpgraded)
    assertEqual(game.commander.ship.upgradedHull, false)
    assertEqual(game.scarabStatus, SSSTScarabQuestStatus.ScarabDestroyed)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Get your hull upgraded at Khefka.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetHullUpgraded)
    assertEqual(game2.commander.ship.upgradedHull, false)
    assertEqual(game2.scarabStatus, SSSTScarabQuestStatus.ScarabDestroyed)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Get your hull upgraded at Khefka.")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_No", "click")
    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The organic hull used in the Scarab is still not ready for day-to-day use. But Captain Renwick can certainly upgrade your hull with some of his retrofit technology. It's light stuff, and won't reduce your ship's range. Should he upgrade your ship?")

    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Technicians spent the day replacing welds and bolts, and adding materials to your ship. When they're done, they tell you your ship should be significantly sturdier.")

    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Ship Yard", "click")
    const repairEl = document.getElementById("repairDiv")
    assertEqual(repairDiv.innerHTML, `Your hull strength is at 100%.<br>Your ship has an upgraded hull.<br><input type="checkbox" id="autoRepairCheckbox"><label for="autoRepairCheckbox">Automatically buy repairs upon arrival</label><br><br><button id="buy_escape_pod">Buy an escape pod for $2000</button>`)


    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.upgradedHull, true)
    assertEqual(game.scarabStatus, SSSTScarabQuestStatus.Closed)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.upgradedHull, true)
    assertEqual(game2.scarabStatus, SSSTScarabQuestStatus.Closed)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")

    // Experience some encounters with the upgraded hull
    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)
  }

  test_scarab_militaryBeamDontWork() {
    const replayLog = `{"idLog":["trader","trader","trader","trader","engineer","engineer","engineer","engineer","pilot","pilot","pilot","pilot","fighter","fighter","fighter","fighter","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","namedEvent","namedEvent","namedEvent","galacticChart_useSingularity_121_Adahn","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buyship_Wasp","alertButton_Yes","Equipment","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Beam_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","cheat_freeSingularity","Chart"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|6","slider|input|7","slider|input|8","slider|input|9","click","click","click","click","click","selectPlanet|Regulas","selectPlanet|Tanuga","selectPlanet|Leda","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734408890090}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    // reputationScore is too low for Special to show up
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.Scarab)
    let specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    replay.replayEvent("cheat_averageReputation", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Adahn")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    // Shows up now
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.Scarab)
    specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Captain Renwick developed a new organic hull material for his ship which cannot be damaged except by Pulse lasers. While he was celebrating this success, pirates boarded and stole the craft, which they have named the Scarab. Rumors suggest it's being hidden at the exit to a wormhole. Destroy the ship for a reward!")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game.questListDescription(), "Find and destroy the Scarab (which is hiding near a wormhole).")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game2.questListDescription(), "Find and destroy the Scarab (which is hiding near a wormhole).")

    replay.replayEvent("Chart", "click")

    replay.replayEvent("galacticChart_useSingularity_121_Davlos", "click")
    replay.replayEvent("alertButton_Warp_", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Khefka you encounter a stolen Scarab.<br><br>Your opponent attacks.")

    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
    replay.replayEvent("ecButton_Attack", "click")
    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText.includes("You missed the Scarab."), true)
  }

  test_ionReactor() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")


    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")




    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")



    const breakConditionFn = () => {
      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      return alertTitle && alertTitle.toLowerCase().includes("reactor")
    }


    const seenAlertTitles = []

    const expectedFuel = [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]

    let loopCycles = 0
    for (loopCycles = 0; loopCycles < 100 && game.reactorStatus < SSSTReactorQuestStatus.DaysRemaining._1-1; ++loopCycles) {
      const prevReactorStatus = game.reactorStatus

      replay.replayEvent("Warp", "click")
      replay.replayEvent("warpBlastOff", "click")

      this._replaySkipEncounters(replay, breakConditionFn)

      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      if (alertTitle && [2, 16, 18].includes(game.reactorStatus)) {
        seenAlertTitles.push(alertTitle)
        replay.replayEvent("alertButton_Dismiss", "click")
      }

      assertEqual(game.reactorStatus, prevReactorStatus+1)
      const reactorFuelRemaining = expectedFuel[loopCycles]
      assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 5 + reactorFuelRemaining)
      const baysStr = reactorFuelRemaining === 1 ? "bay" : "bays"
      assertEqual(game.specialCargoDescription(), `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`)
      assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")


      game2 = this._serializeAndDeserialize(game)
      assertEqualGames(game, game2)
      assertEqual(game2.reactorStatus, prevReactorStatus+1)
      assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 5 + reactorFuelRemaining)
      assertEqual(game2.specialCargoDescription(), `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`)
      assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")
    }
    assertEqual(loopCycles, 18)


    const expectedAlertTitles = [
      "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good.",
      "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation.",
      "The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.",
    ]
    assertEqualArrays(seenAlertTitles, expectedAlertTitles)

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Nix", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)


    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Henry Morgan takes delivery of the reactor with great glee. His men immediately set about stabilizing the fuel system. As a reward, Morgan offers you a special, high-powered laser that he designed. Return with an empty weapon slot when you want it installed.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetSpecialLaser)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.ClosedSaved)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), `Get your special laser at Nix.`)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetSpecialLaser)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.ClosedSaved)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), `Get your special laser at Nix.`)


    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Morgan's technicians are standing by with something that looks a lot like a military laser -- if you ignore the additional cooling vents and anodized ducts. Do you want them to install Morgan's special laser?")

    replay.replayEvent("alertButton_No", "click")
    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have already filled all of your available weapon slots.")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Equipment", "click")
    replay.replayEvent("sell_Military_laser", "click")
    replay.replayEvent("alertButton_Yes", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You now have Henry Morgan's special laser installed on your ship.")
    replay.replayEvent("alertButton_Dismiss", "click")


    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMorgansLaser), true)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMorgansLaser), true)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Auto_Attack", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have destroyed your opponent.")
    replay.replayEvent("alertButton_Dismiss", "click")
  }

  test_ionReactor_tooLate() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")


    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")




    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")



    const breakConditionFn = () => {
      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      return alertTitle && alertTitle.toLowerCase().includes("reactor")
    }


    const seenAlertTitles = []

    const expectedFuel = [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]

    let loopCycles = 0
    for (loopCycles = 0; loopCycles < 100 && game.reactorStatus < SSSTReactorQuestStatus.DaysRemaining._1-1; ++loopCycles) {
      const prevReactorStatus = game.reactorStatus

      replay.replayEvent("Warp", "click")
      replay.replayEvent("warpBlastOff", "click")

      this._replaySkipEncounters(replay, breakConditionFn)

      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      if (alertTitle && [2, 16, 18].includes(game.reactorStatus)) {
        seenAlertTitles.push(alertTitle)
        replay.replayEvent("alertButton_Dismiss", "click")
      }

      assertEqual(game.reactorStatus, prevReactorStatus+1)
      const reactorFuelRemaining = expectedFuel[loopCycles]
      assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 5 + reactorFuelRemaining)
      const baysStr = reactorFuelRemaining === 1 ? "bay" : "bays"
      assertEqual(game.specialCargoDescription(), `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`)
      assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")


      game2 = this._serializeAndDeserialize(game)
      assertEqualGames(game, game2)
      assertEqual(game2.reactorStatus, prevReactorStatus+1)
      assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 5 + reactorFuelRemaining)
      assertEqual(game2.specialCargoDescription(), `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`)
      assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")
    }
    assertEqual(loopCycles, 18)


    const expectedAlertTitles = [
      "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good.",
      "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation.",
      "The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.",
    ]
    assertEqualArrays(seenAlertTitles, expectedAlertTitles)


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay, breakConditionFn)

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Just as you approach the docking bay, the reactor explodes into a huge radioactive fireball!")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You are destroyed along with your ship as a result of the explosion.");
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(document.getElementById("endgame") !== null, true)
    assertEqual(game.endStatus, SSSTGameEndStatus.Killed)


    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)
    assertEqual(game2.endStatus, SSSTGameEndStatus.Killed)
  }

  test_ionReactor_tooLate_escapePod() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")


    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")




    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")



    const breakConditionFn = () => {
      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      return alertTitle && alertTitle.toLowerCase().includes("reactor")
    }


    const seenAlertTitles = []

    const expectedFuel = [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]

    let loopCycles = 0
    for (loopCycles = 0; loopCycles < 100 && game.reactorStatus < SSSTReactorQuestStatus.DaysRemaining._1-1; ++loopCycles) {
      const prevReactorStatus = game.reactorStatus

      replay.replayEvent("Warp", "click")
      replay.replayEvent("warpBlastOff", "click")

      this._replaySkipEncounters(replay, breakConditionFn)

      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      if (alertTitle && [2, 16, 18].includes(game.reactorStatus)) {
        seenAlertTitles.push(alertTitle)
        replay.replayEvent("alertButton_Dismiss", "click")
      }

      assertEqual(game.reactorStatus, prevReactorStatus+1)
      const reactorFuelRemaining = expectedFuel[loopCycles]
      assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 5 + reactorFuelRemaining)
      const baysStr = reactorFuelRemaining === 1 ? "bay" : "bays"
      assertEqual(game.specialCargoDescription(), `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`)
      assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")


      game2 = this._serializeAndDeserialize(game)
      assertEqualGames(game, game2)
      assertEqual(game2.reactorStatus, prevReactorStatus+1)
      assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 5 + reactorFuelRemaining)
      assertEqual(game2.specialCargoDescription(), `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`)
      assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")
    }
    assertEqual(loopCycles, 18)


    const expectedAlertTitles = [
      "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good.",
      "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation.",
      "The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.",
    ]
    assertEqualArrays(seenAlertTitles, expectedAlertTitles)

    replay.replayEvent("Ship Yard", "click")

    replay.replayEvent("buy_escape_pod", "click")
    replay.replayEvent("alertButton_Yes", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay, breakConditionFn)

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Just as you approach the docking bay, the reactor explodes into a huge radioactive fireball!")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Just before the final demise of your ship, your escape pod gets activated and ejects you. After a few days, the Space Corps picks you up and drops you off at a nearby space port.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "In 3 days and with $500, you manage to convert your pod into a Flea.")
    replay.replayEvent("alertButton_Dismiss", "click")


    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_ionReactor_surrenderToPolice() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")


    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")




    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")



    const breakConditionFn = () => {
      const encounterTextEl = document.getElementById('eVC_dialog')
      return encounterTextEl && encounterTextEl.innerHTML.includes("you encounter a police")
    }

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay, breakConditionFn)

    let encounterTextEl = document.getElementById('eVC_dialog')
    assertEqual(encounterTextEl.innerHTML.includes("you encounter a police"), true)

    replay.replayEvent("ecButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Surrender? Ha! We want your HEAD!")

    // Erase police record so next surrender works
    game.commander.policeRecordScore = SSSTPoliceRecordScore.Clean;

    replay.replayEvent("alertButton_Dismiss", "click")

    this._replaySkipEncounters(replay, breakConditionFn)

    encounterTextEl = document.getElementById('eVC_dialog')
    assertEqual(encounterTextEl.innerHTML.includes("you encounter a police"), true)



    // Attack the police to gain the option to surrender (otherwise they ignore me)
    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("alertButton_Attack", "click")

    replay.replayEvent("ecButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "If you surrender, you will spend some time in prison and will have to pay a hefty fine. Additionally, the police will destroy the Ion Reactor. Are you sure you want to do that?")
    replay.replayEvent("alertButton_Surrender", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), `You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $299000.\nThe police impounded all of the illegal goods you had on board.\nThe police confiscated the Ion Reactor as evidence of your dealings with unsavory characters. The bad news is that you've lost the Ion Reactor. The good news is that you no longer have to worry about managing its depleting fuel store.`)
    replay.replayEvent("alertButton_Dismiss", "click")


    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_ionReactor_tribble() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","cheat_freeSingularity","Special","alertButton_Yes","alertButton_Dismiss","Chart","galacticChart_useSingularity_121_Rubicum","alertButton_Warp_","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","Commander"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game



    assertEqual(document.getElementById("cargoListDiv").innerHTML, "1 cute, furry tribble.<br>An unstable reactor taking up 5 bays.<br>Enriched reactor fuel taking up 10 bays.")
    assertEqual(document.getElementById("questListDiv").innerHTML, "Get rid of those pesky tribbles.<br>Deliver the unstable reactor to Nix for Henry Morgan.")
    assertEqual(game.specialCargoDescription(), "1 cute, furry tribble.\nAn unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Get rid of those pesky tribbles.\nDeliver the unstable reactor to Nix for Henry Morgan.")
    assertEqual(game.commander.ship.tribbles, 1)

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "1 cute, furry tribble.\nAn unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Get rid of those pesky tribbles.\nDeliver the unstable reactor to Nix for Henry Morgan.")
    assertEqual(game2.commander.ship.tribbles, 1)


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    const breakConditionFn = () => {
      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      return alertTitle && alertTitle.toLowerCase().includes("tribbles")
    }

    this._replaySkipEncounters(replay, breakConditionFn)

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The radiation from the Ion Reactor is deadly to Tribbles. All of the Tribbles on board your ship have died.");

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")
    assertEqual(game.commander.ship.tribbles, 0)


    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.tribbles, 0)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")
  }

  test_ionReactor_early() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")


    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Galactic criminal Henry Morgan wants this illegal ion reactor delivered to Nix. It's a very dangerous mission! The reactor and its fuel are bulky, taking up 15 bays. Worse, it's not stable -- its resonant energy will weaken your shields and hull strength while it's aboard your ship. Are you willing to deliver it?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")




    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")



    const breakConditionFn = () => {
      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      return alertTitle && alertTitle.toLowerCase().includes("reactor")
    }


    const seenAlertTitles = []

    const expectedFuel = [10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]

    let loopCycles = 0
    for (loopCycles = 0; loopCycles < 100 && game.reactorStatus < SSSTReactorQuestStatus.DaysRemaining._1-9; ++loopCycles) {
      const prevReactorStatus = game.reactorStatus

      replay.replayEvent("Warp", "click")
      replay.replayEvent("warpBlastOff", "click")

      this._replaySkipEncounters(replay, breakConditionFn)

      const alertTitle = SSSTAlertViewController.currentAlertTitle()
      if (alertTitle && [2, 16, 18].includes(game.reactorStatus)) {
        seenAlertTitles.push(alertTitle)
        replay.replayEvent("alertButton_Dismiss", "click")
      }

      assertEqual(game.reactorStatus, prevReactorStatus+1)
      const reactorFuelRemaining = expectedFuel[loopCycles]
      assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 5 + reactorFuelRemaining)
      const baysStr = reactorFuelRemaining === 1 ? "bay" : "bays"
      assertEqual(game.specialCargoDescription(), `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`)
      assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")


      game2 = this._serializeAndDeserialize(game)
      assertEqualGames(game, game2)
      assertEqual(game2.reactorStatus, prevReactorStatus+1)
      assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 5 + reactorFuelRemaining)
      assertEqual(game2.specialCargoDescription(), `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${reactorFuelRemaining} ${baysStr}.`)
      assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")
    }
    assertEqual(loopCycles, 10)


    const expectedAlertTitles = [
      "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good.",
      //"The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation.",
      //"The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature.",
    ]
    assertEqualArrays(seenAlertTitles, expectedAlertTitles)

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Nix", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)


    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Henry Morgan takes delivery of the reactor with great glee. His men immediately set about stabilizing the fuel system. As a reward, Morgan offers you a special, high-powered laser that he designed. Return with an empty weapon slot when you want it installed.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetSpecialLaser)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.ClosedSaved)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), `Get your special laser at Nix.`)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetSpecialLaser)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.ClosedSaved)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), `Get your special laser at Nix.`)


    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Morgan's technicians are standing by with something that looks a lot like a military laser -- if you ignore the additional cooling vents and anodized ducts. Do you want them to install Morgan's special laser?")

    replay.replayEvent("alertButton_No", "click")
    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have already filled all of your available weapon slots.")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Equipment", "click")
    replay.replayEvent("sell_Military_laser", "click")
    replay.replayEvent("alertButton_Yes", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You now have Henry Morgan's special laser installed on your ship.")
    replay.replayEvent("alertButton_Dismiss", "click")


    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMorgansLaser), true)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMorgansLaser), true)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Auto_Attack", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have destroyed your opponent.")
    replay.replayEvent("alertButton_Dismiss", "click")
  }

  test_ionReactor_notEnoughBays() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game


    replay.replayEvent("Buy", "click")
    replay.replayEvent("cargo_FursBuy_All", "click")


    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You don't have enough empty cargo bays at the moment.")

    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Sell", "click")
    replay.replayEvent("cargo_FursSell_All", "click")


    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")
  }

  test_ionReactor_cantBuyShip() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Iralius")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("buyship_Termite", "click")


    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Sorry! We can't take your ship as a trade-in. That Ion Reactor looks dangerous, and we have no way of removing it. Come back when you've gotten rid of it.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship.type, SSSTShipModelType.Wasp)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.type, SSSTShipModelType.Wasp)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix before it consumes all of its fuel.")
  }

  test_ionReactor_destroyedInBattle() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Five of your cargo bays now contain the unstable Ion Reactor, and ten of your bays contain enriched fuel.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)

    assertEqual(game.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 15)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.DaysRemaining._20)
    assertEqual(game2.specialCargoDescription(), "An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up 10 bays.")
    assertEqual(game2.questListDescription(), "Deliver the unstable reactor to Nix for Henry Morgan.")


    replay.replayEvent("Equipment", "click")
    replay.replayEvent("sell_Military_laser", "click")
    replay.replayEvent("alertButton_Yes", "click")
    replay.replayEvent("sell_Military_laser", "click")
    replay.replayEvent("alertButton_Yes", "click")
    replay.replayEvent("sell_Military_laser", "click")
    replay.replayEvent("alertButton_Yes", "click")
    replay.replayEvent("sell_Reflective_shield", "click")
    replay.replayEvent("alertButton_Yes", "click")
    replay.replayEvent("sell_Reflective_shield", "click")
    replay.replayEvent("alertButton_Yes", "click")

    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("buy_escape_pod", "click")
    replay.replayEvent("alertButton_Yes", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Auto_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Just before the final demise of your ship, your escape pod gets activated and ejects you. The destruction of your ship is made much more spectacular by the added explosion of the Ion Reactor. After a few days, the Space Corps picks you up and drops you off at a nearby space port.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "In 3 days and with $500, you manage to convert your pod into a Flea.")
    replay.replayEvent("alertButton_Dismiss", "click")


    assertEqual(game.commander.ship.type, SSSTShipModelType.Flea)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.type, SSSTShipModelType.Flea)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor), 0)
    assertEqual(game2.reactorStatus, SSSTReactorQuestStatus.ClosedTooLate)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_experiment_early() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("galacticChart_useSingularity_121_Talani", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "While reviewing the plans for Dr. Fehler's new space-warping drive, Dr. Lowenstam discovered a critical error. If you don't go to Daled and stop the experiment within ten days, the space-time continuum itself could be damaged!")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._10)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._10)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.")

    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_track_121_Daled", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)


    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._9)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._9)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._8)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._8)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.")


    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("autoRepairCheckbox", "change")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Othello")
    replay.replayEvent("warpBlastOff", "click")


    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._7)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._7)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._6)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._6)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.")

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Upon your warning, Dr. Fehler calls off the experiment. As a reward, you are given a Portable Singularity. This device will, for one time only, instantaneously transport you to any system in the galaxy. The Singularity can be accessed on the Galactic Chart.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.canSuperWarp, true)
    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.ClosedSaved)
    assertEqual(game.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.canSuperWarp, true)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.ClosedSaved)
    assertEqual(game2.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_experiment_last_day() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("galacticChart_useSingularity_121_Talani", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "While reviewing the plans for Dr. Fehler's new space-warping drive, Dr. Lowenstam discovered a critical error. If you don't go to Daled and stop the experiment within ten days, the space-time continuum itself could be damaged!")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._10)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._10)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.")

    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_track_121_Daled", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)


    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._9)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._9)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._8)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._8)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.")


    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("autoRepairCheckbox", "change")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Othello")
    replay.replayEvent("warpBlastOff", "click")


    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._7)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._7)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._6)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._6)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._5)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 5 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._5)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 5 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._4)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._4)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 4 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._3)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 3 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._3)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 3 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._2)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled by end of tomorrow.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled by end of tomorrow.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._1)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._1)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.")

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Daled", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._1)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._1)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.")

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Upon your warning, Dr. Fehler calls off the experiment. As a reward, you are given a Portable Singularity. This device will, for one time only, instantaneously transport you to any system in the galaxy. The Singularity can be accessed on the Galactic Chart.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.canSuperWarp, true)
    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.ClosedSaved)
    assertEqual(game.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.canSuperWarp, true)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.ClosedSaved)
    assertEqual(game2.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_experiment_fail() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("galacticChart_useSingularity_121_Talani", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "While reviewing the plans for Dr. Fehler's new space-warping drive, Dr. Lowenstam discovered a critical error. If you don't go to Daled and stop the experiment within ten days, the space-time continuum itself could be damaged!")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._10)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._10)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 10 days.")

    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_track_121_Daled", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)


    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._9)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._9)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 9 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._8)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._8)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 8 days.")


    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("autoRepairCheckbox", "change")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Othello")
    replay.replayEvent("warpBlastOff", "click")


    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._7)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._7)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 7 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._6)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._6)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 6 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._5)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 5 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._5)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 5 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._4)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._4)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 4 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._3)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 3 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._3)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled within 3 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._2)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled by end of tomorrow.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled by end of tomorrow.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._1)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.DaysRemaining._1)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Stop Dr. Fehler's experiment at Daled today.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.ClosedTooLate)
    assertEqual(game.fabricRipProbability, FABRIC_RIP_PROBABILITY_INITIAL)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.ClosedTooLate)
    assertEqual(game2.fabricRipProbability, FABRIC_RIP_PROBABILITY_INITIAL)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The galaxy is abuzz with news of a terrible malfunction in Dr. Fehler's laboratory. Evidently, he was not warned in time and he performed his experiment... with disastrous results! You may not reach your planned destination!")
    replay.replayEvent("alertButton_Dismiss", "click")

    this._replaySkipEncounters(replay)

    let loopCycles = 0
    for (loopCycles = 0; loopCycles < 100 && game.fabricRipProbability > 0; ++loopCycles) {
      replay.replayEvent("Warp", "click")
      replay.replayEvent("warpBlastOff", "click")

      this._replaySkipEncounters(replay)

      assertEqual(game.experimentStatus, SSSTExperimentQuestStatus.ClosedTooLate)
      assertEqual(game.fabricRipProbability, FABRIC_RIP_PROBABILITY_INITIAL - 2 - loopCycles)
      assertEqual(game.specialCargoDescription(), "No special items.")
      assertEqual(game.questListDescription(), "No open quests.")

      game2 = this._serializeAndDeserialize(game)
      assertEqualGames(game, game2)
      assertEqual(game2.experimentStatus, SSSTExperimentQuestStatus.ClosedTooLate)
      assertEqual(game2.fabricRipProbability, FABRIC_RIP_PROBABILITY_INITIAL - 2 - loopCycles)
      assertEqual(game2.specialCargoDescription(), "No special items.")
      assertEqual(game2.questListDescription(), "No open quests.")
    }
    assertEqual(loopCycles, FABRIC_RIP_PROBABILITY_INITIAL-1)
  }

  test_monster() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("galacticChart_useSingularity_121_Antedi", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A space monster has invaded the Acamar system and is disturbing the trade routes. You'll be rewarded handsomely if you manage to destroy it.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.monsterStatus, SSSTMonsterQuestStatus.MonsterExists)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Kill the space monster at Acamar.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.monsterStatus, SSSTMonsterQuestStatus.MonsterExists)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Kill the space monster at Acamar.")

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Acamar", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    const breakConditionFn = () => {
      const encounterText = document.getElementById('eVC_dialog').innerHTML
      return encounterText === "At 1 click from Acamar you encounter the terrifying Space Monster.<br><br>Your opponent attacks."
    }

    this._replaySkipEncounters(replay, breakConditionFn)

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 1 click from Acamar you encounter the terrifying Space Monster.<br><br>Your opponent attacks.")

    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("ecButton_Attack", "click")

    // Run away

    this._replaySkipEncounters(replay)

    assertEqual(game.monsterHull, 299)
    assertEqual(game.monsterStatus, SSSTMonsterQuestStatus.MonsterExists)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Kill the space monster at Acamar.")
    let specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.monsterHull, 299)
    assertEqual(game2.monsterStatus, SSSTMonsterQuestStatus.MonsterExists)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Kill the space monster at Acamar.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("warpBlastOff", "click")


    this._replaySkipEncounters(replay, breakConditionFn)


    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 1 click from Acamar you encounter the terrifying Space Monster.<br><br>Your opponent attacks.")

    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("ecButton_Attack", "click")

    // Run away

    this._replaySkipEncounters(replay)

    assertEqual(game.monsterHull, 196)
    assertEqual(game.monsterStatus, SSSTMonsterQuestStatus.MonsterExists)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Kill the space monster at Acamar.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.monsterHull, 196)
    assertEqual(game2.monsterStatus, SSSTMonsterQuestStatus.MonsterExists)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Kill the space monster at Acamar.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("warpBlastOff", "click")


    this._replaySkipEncounters(replay, breakConditionFn)

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 1 click from Acamar you encounter the terrifying Space Monster.<br><br>Your opponent attacks.")
    assertEqual(game.monsterHull, 215)

    replay.replayEvent("ecButton_Auto_Attack", "click")


    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("alertButton_Dismiss", "click")


    const creditsBefore = game.commander.credits
    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "We thank you for destroying the space monster that circled our system for so long. Please accept $15000 as reward for your heroic deed.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.credits, creditsBefore+15000)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game.monsterStatus, SSSTMonsterQuestStatus.ClosedMonsterDestroyed)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.credits, creditsBefore+15000)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
    assertEqual(game2.monsterStatus, SSSTMonsterQuestStatus.ClosedMonsterDestroyed)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_jarek() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("galacticChart_useSingularity_121_Ashen", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A recent change in the political climate of this solar system has forced ambassador Jarek to flee back to his home system, Devidia. Would you be willing to give him a lift?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have taken Ambassador Jarek on board.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship._crew[0].name, "Ambassador Jarek")
    assertEqual(game.commander.ship._crew[0].forQuest, true)
    assertEqual(game.jarekStatus, SSSTJarekQuestStatus.OnBoard)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Bring Ambassador Jarek to Devidia.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship._crew[0].name, "Ambassador Jarek")
    assertEqual(game2.commander.ship._crew[0].forQuest, true)
    assertEqual(game2.jarekStatus, SSSTJarekQuestStatus.OnBoard)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Bring Ambassador Jarek to Devidia.")


    replay.replayEvent("Roster", "click")

    const crewMember = game.commander.ship.crew[0]
    // We don't show hireFire button
    assertEqual(document.getElementById(MAUtils.sanitizedElementID("hireFire_" + crewMember.name)), null)

    // He shows up with no cost, no skills
    const personnelRow = document.getElementById(`personnelRow-${crewMember.name}`)
    const rowHTML = personnelRow.innerHTML.replace(/ src="data:image\/png[^"]+"/, "") // remove the base64 icon to simplify our string comparison
    assertEqual(rowHTML, `<td><div><img class="roster-icon">Ambassador Jarek</div></td><td class="centered-cell"></td>`)

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Devidia", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)


    const traderSkillBefore = game.commander.ship.crewTraderSkillIncludingCommander(game.commander)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Ambassador Jarek is very grateful to you for delivering him back to Devidia. As a reward, he gives you an experimental handheld haggling computer, which allows you to gain larger discounts when purchasing goods and equipment.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.jarekStatus, SSSTJarekQuestStatus.Closed)
    assertEqual(game.commander.carriesMaxTraderBoost, true)
    assertEqual(game.commander.ship._crew.length, 0)
    assertEqual(game.commander.ship.crewTraderSkillIncludingCommander(game.commander), traderSkillBefore+1)

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    assertEqual(game.specialCargoDescription(), "A haggling computer.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.jarekStatus, SSSTJarekQuestStatus.Closed)
    assertEqual(game2.commander.carriesMaxTraderBoost, true)
    assertEqual(game2.commander.ship._crew.length, 0)
    assertEqual(game2.commander.ship.crewTraderSkillIncludingCommander(game.commander), traderSkillBefore+1)

    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    assertEqual(game2.specialCargoDescription(), "A haggling computer.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_jarek_arrested() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("galacticChart_useSingularity_121_Ashen", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A recent change in the political climate of this solar system has forced ambassador Jarek to flee back to his home system, Devidia. Would you be willing to give him a lift?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have taken Ambassador Jarek on board.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship._crew[0].name, "Ambassador Jarek")
    assertEqual(game.commander.ship._crew[0].forQuest, true)
    assertEqual(game.jarekStatus, SSSTJarekQuestStatus.OnBoard)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Bring Ambassador Jarek to Devidia.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship._crew[0].name, "Ambassador Jarek")
    assertEqual(game2.commander.ship._crew[0].forQuest, true)
    assertEqual(game2.jarekStatus, SSSTJarekQuestStatus.OnBoard)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Bring Ambassador Jarek to Devidia.")


    replay.replayEvent("Roster", "click")

    const crewMember = game.commander.ship.crew[0]
    // We don't show hireFire button
    assertEqual(document.getElementById(MAUtils.sanitizedElementID("hireFire_" + crewMember.name)), null)

    // He shows up with no cost, no skills
    const personnelRow = document.getElementById(`personnelRow-${crewMember.name}`)
    const rowHTML = personnelRow.innerHTML.replace(/ src="data:image\/png[^"]+"/, "") // remove the base64 icon to simplify our string comparison
    assertEqual(rowHTML, `<td><div><img class="roster-icon">Ambassador Jarek</div></td><td class="centered-cell"></td>`)

    // Get arrested

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("alertButton_Attack", "click")
    replay.replayEvent("ecButton_Surrender", "click")
    replay.replayEvent("alertButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $300500.\nThe Space Corps decides to give Ambassador Jarek a lift home to Devidia.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.jarekStatus, SSSTJarekQuestStatus.Closed)
    assertEqual(game.commander.ship.crew.length, 0)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.jarekStatus, SSSTJarekQuestStatus.Closed)
    assertEqual(game2.commander.ship.crew.length, 0)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_jarek_noSlots() {
    const replayLog = `{"idLog":["createCommander","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Og","alertButton_Warp_"],"eventNameLog":["click","click","click","click","click","click"],"gameRandSeed":1733910981199}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    this._replaySkipEncounters(replay)

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.AmbassadorJarek)

    let specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A recent change in the political climate of this solar system has forced ambassador Jarek to flee back to his home system, Devidia. Would you be willing to give him a lift?")

    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You do not have any crew quarters available for Ambassador Jarek.")

    replay.replayEvent("alertButton_Dismiss", "click")
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.AmbassadorJarek)

    specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)
  }

  test_alienArtifact() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Bretel","alertButton_Warp_"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This alien artifact should be delivered to Professor Berger, who is currently traveling. You can probably find him at a hi-tech solar system. The alien race which produced this artifact seems keen on getting it back, however, and may hinder the carrier. Are you, for a price, willing to deliver it?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(game.commander.artifactOnBoard, true)
    assertEqual(game.specialCargoDescription(), "An alien artifact.")
    assertEqual(game.questListDescription(), "Deliver the alien artifact to Professor Berger at some hi-tech system.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.artifactOnBoard, true)
    assertEqual(game2.specialCargoDescription(), "An alien artifact.")
    assertEqual(game2.questListDescription(), "Deliver the alien artifact to Professor Berger at some hi-tech system.")

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")

    replay.replayEvent("galacticChart_useSingularity_121_Krios", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 16 clicks from Krios you encounter an alien Mantis.<br><br>Your opponent attacks.")

    this._replaySkipEncounters(replay)

    const creditsBefore = game.commander.credits

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This is Professor Berger. I thank you for delivering the alien artifact to me. I hope the aliens weren't too much of a nuisance. I have transferred $20000 to your account, which I assume compensates you for your troubles.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")
    assertEqual(game.commander.artifactOnBoard, false)
    assertEqual(game.commander.credits, creditsBefore+20000)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
    assertEqual(game2.commander.artifactOnBoard, false)
    assertEqual(game2.commander.credits, creditsBefore+20000)
  }

  test_alienArtifact_surrender() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Bretel","alertButton_Warp_"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This alien artifact should be delivered to Professor Berger, who is currently traveling. You can probably find him at a hi-tech solar system. The alien race which produced this artifact seems keen on getting it back, however, and may hinder the carrier. Are you, for a price, willing to deliver it?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(game.commander.artifactOnBoard, true)
    assertEqual(game.specialCargoDescription(), "An alien artifact.")
    assertEqual(game.questListDescription(), "Deliver the alien artifact to Professor Berger at some hi-tech system.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.artifactOnBoard, true)
    assertEqual(game2.specialCargoDescription(), "An alien artifact.")
    assertEqual(game2.questListDescription(), "Deliver the alien artifact to Professor Berger at some hi-tech system.")

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")

    replay.replayEvent("galacticChart_useSingularity_121_Krios", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 16 clicks from Krios you encounter an alien Mantis.<br><br>Your opponent attacks.")

    replay.replayEvent("ecButton_Surrender")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "If you surrender to the aliens, they will steal the artifact. Are you sure you wish to do that?")

    replay.replayEvent("alertButton_Surrender")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The aliens have taken the artifact from you. Well, it's rightfully theirs, so you probably shouldn't complain. You won't receive any reward from Professor Berger, though.")

    replay.replayEvent("alertButton_Dismiss")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")
    assertEqual(game.commander.artifactOnBoard, false)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
    assertEqual(game2.commander.artifactOnBoard, false)
  }

  test_gemulon_alienInvasion_fail() {
    const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Largo")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")


    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("Full_repair", "click")
    replay.replayEvent("autoRepairCheckbox", "change")
    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Castor")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 3 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 3 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Japori")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion by end of tomorrow.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion by end of tomorrow.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Kravat")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion today.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion today.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Vagra")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")
    assertEqual(game.invasionStatus, SSSTInvasionQuestStatus.ClosedTooLate)
    let gemulon = game._findSolarSystem('Gemulon');
    assertEqual(gemulon.specialEvent, SSSTSpecialEvent.GemulonInvaded)
    assertEqual(gemulon.techLevel, SSSTTechLevel.PreAgricultural)
    assertEqual(gemulon.politics.type, SSSTPoliticsType.Anarchy)


    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Gemulon")
    replay.replayEvent("warpBlastOff", "click")

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 20 clicks from Gemulon you encounter an alien Mantis.<br><br>Your opponent attacks.")

    this._replaySkipEncounters(replay)

    const systemInfoEl = document.getElementById('system-info-text')
    assertEqual(systemInfoEl.innerText, "large pre-agricultural anarchist state\nunder no particular pressure\nnothing special, no police, excessive pirates")

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Alas, Gemulon has been invaded by aliens, which has thrown us back to pre-agricultural times. If only we had known the exact coordinates where they first arrived at our system, we might have prevented this tragedy from happening.")
  }

  test_gemulon_alienInvasion_oneDayLate() {
    const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Largo")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")


    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("Full_repair", "click")
    replay.replayEvent("autoRepairCheckbox", "change")
    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Castor")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 3 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 3 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Japori")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion by end of tomorrow.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion by end of tomorrow.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Kravat")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion today.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion today.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Vagra")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")
    assertEqual(game.invasionStatus, SSSTInvasionQuestStatus.ClosedTooLate)
    let gemulon = game._findSolarSystem('Gemulon');
    assertEqual(gemulon.specialEvent, SSSTSpecialEvent.GemulonInvaded)
    assertEqual(gemulon.techLevel, SSSTTechLevel.PreAgricultural)
    assertEqual(gemulon.politics.type, SSSTPoliticsType.Anarchy)


    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")



    // Use singularity so it's the same day

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Gemulon", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    this._replaySkipEncounters(replay)

    const systemInfoEl = document.getElementById('system-info-text')
    assertEqual(systemInfoEl.innerText, "large pre-agricultural anarchist state\nunder no particular pressure\nnothing special, no police, excessive pirates")

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Alas, Gemulon has been invaded by aliens, which has thrown us back to pre-agricultural times. If only we had known the exact coordinates where they first arrived at our system, we might have prevented this tragedy from happening.")
  }

  test_gemulon_alienInvasion_arriveLastDay() {
    const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Largo")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")


    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("Full_repair", "click")
    replay.replayEvent("autoRepairCheckbox", "change")
    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Castor")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 3 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 3 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Japori")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion by end of tomorrow.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion by end of tomorrow.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Kravat")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion today.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion today.")

    // Cheat to avoid dying at the hands of the Mantises on the next warp
    game.commander.pilot = 15

    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Gemulon", "click")
    replay.replayEvent("alertButton_Warp_", "click")


    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion today.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion today.")


    // Save Gemulon

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This information of the arrival of the alien invasion force allows us to prepare a defense. You have saved our way of life. As a reward, we have a fuel compactor gadget for you, which allows you to travel 18 parsecs with any ship. Return here to get it installed.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Get your fuel compactor at Gemulon.")
    assertEqual(game.invasionStatus, SSSTInvasionQuestStatus.ClosedSaved)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetFuelCompactor)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Get your fuel compactor at Gemulon.")
    assertEqual(game2.invasionStatus, SSSTInvasionQuestStatus.ClosedSaved)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetFuelCompactor)

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Do you wish for us to install the fuel compactor on your current ship?")
    replay.replayEvent("alertButton_No", "click")
    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Do you wish for us to install the fuel compactor on your current ship?")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You now have a fuel compactor installed on your ship.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship.hasGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor), true)
    assertEqual(game.commander.ship.fuelTankCapacity(), 18)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.hasGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor), true)
    assertEqual(game2.commander.ship.fuelTankCapacity(), 18)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_gemulon_alienInvasion_arriveEarly() {
    const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Largo")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")


    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("Full_repair", "click")
    replay.replayEvent("autoRepairCheckbox", "change")
    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")


    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Gemulon", "click")
    replay.replayEvent("alertButton_Warp_", "click")


    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")


    // Save Gemulon

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This information of the arrival of the alien invasion force allows us to prepare a defense. You have saved our way of life. As a reward, we have a fuel compactor gadget for you, which allows you to travel 18 parsecs with any ship. Return here to get it installed.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Get your fuel compactor at Gemulon.")
    assertEqual(game.invasionStatus, SSSTInvasionQuestStatus.ClosedSaved)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetFuelCompactor)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Get your fuel compactor at Gemulon.")
    assertEqual(game2.invasionStatus, SSSTInvasionQuestStatus.ClosedSaved)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetFuelCompactor)

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Do you wish for us to install the fuel compactor on your current ship?")
    replay.replayEvent("alertButton_No", "click")
    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Do you wish for us to install the fuel compactor on your current ship?")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You now have a fuel compactor installed on your ship.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship.hasGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor), true)
    assertEqual(game.commander.ship.fuelTankCapacity(), 18)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.hasGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor), true)
    assertEqual(game2.commander.ship.fuelTankCapacity(), 18)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_gemulon_alienInvasion_arriveEarly_noSlots() {
    const replayLog = `{"idLog":["trader","trader","trader","trader","fighter","fighter","fighter","fighter","pilot","pilot","pilot","pilot","pilot","engineer","engineer","engineer","createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rochani","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","slider|input|6","slider|input|7","slider|input|8","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733735548129}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "We received word that aliens will invade Gemulon seven days from now. We know exactly at which coordinates they will arrive, but we can't warn Gemulon because an ion storm disturbs all forms of communication. We need someone, anyone, to deliver this info to Gemulon within seven days.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 7 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|Largo")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 6 days.")


    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("Full_repair", "click")
    replay.replayEvent("autoRepairCheckbox", "change")
    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 5 days.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")


    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Gemulon", "click")
    replay.replayEvent("alertButton_Warp_", "click")


    this._replaySkipEncounters(replay)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Inform Gemulon about alien invasion within 4 days.")


    // Save Gemulon

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "This information of the arrival of the alien invasion force allows us to prepare a defense. You have saved our way of life. As a reward, we have a fuel compactor gadget for you, which allows you to travel 18 parsecs with any ship. Return here to get it installed.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Get your fuel compactor at Gemulon.")
    assertEqual(game.invasionStatus, SSSTInvasionQuestStatus.ClosedSaved)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetFuelCompactor)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Get your fuel compactor at Gemulon.")
    assertEqual(game2.invasionStatus, SSSTInvasionQuestStatus.ClosedSaved)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetFuelCompactor)

    replay.replayEvent("Equipment", "click")
    replay.replayEvent("buy_5_extra_cargo_bays", "click")
    replay.replayEvent("alertButton_Yes", "click")


    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Do you wish for us to install the fuel compactor on your current ship?")
    replay.replayEvent("alertButton_No", "click")
    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Do you wish for us to install the fuel compactor on your current ship?")
    replay.replayEvent("alertButton_Yes", "click")



    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have already filled all of your available gadget slots.")
    replay.replayEvent("alertButton_Dismiss", "click")


    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Get your fuel compactor at Gemulon.")
    assertEqual(game.invasionStatus, SSSTInvasionQuestStatus.ClosedSaved)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetFuelCompactor)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Get your fuel compactor at Gemulon.")
    assertEqual(game2.invasionStatus, SSSTInvasionQuestStatus.ClosedSaved)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.GetFuelCompactor)



    replay.replayEvent("Equipment", "click")
    replay.replayEvent("sell_5_extra_cargo_bays", "click")
    replay.replayEvent("alertButton_Yes", "click")


    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Do you wish for us to install the fuel compactor on your current ship?")
    replay.replayEvent("alertButton_Yes", "click")


    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You now have a fuel compactor installed on your ship.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship.hasGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor), true)
    assertEqual(game.commander.ship.fuelTankCapacity(), 18)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.hasGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor), true)
    assertEqual(game2.commander.ship.fuelTankCapacity(), 18)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_cargoForSale() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Ashen","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733734388479}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A trader in second-hand goods offers you 3 sealed cargo canisters for the sum of $1000. It could be a good deal: they could contain robots. Then again, it might just be water. Do you want the canisters?")

    replay.replayEvent("alertButton_No", "click")

    let cargoQuantity = [...game.commander.ship._cargo.values()].reduce((acc, value) => acc + value, 0);
    assertEqual(cargoQuantity, 0)

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The canisters contain medicine.")

    replay.replayEvent("alertButton_Dismiss", "click")

    cargoQuantity = [...game.commander.ship._cargo.values()].reduce((acc, value) => acc + value, 0);
    assertEqual(cargoQuantity, 3)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Medicine), 3)

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    cargoQuantity = [...game2.commander.ship._cargo.values()].reduce((acc, value) => acc + value, 0);
    assertEqual(cargoQuantity, 3)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Medicine), 3)

    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
  }

  test_wild_cleanRecord() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.TransportWild)
    // Don't have a police record, special doesn't show
    let specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)
  }

  test_wild_bribePolice() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Cestus","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","namedEvent","warpBlastOff"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Bretel","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iodine","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Courteney","click"],"gameRandSeed":1733627017971}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("ecButton_Bribe", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "These police officers are willing to forego inspection for $10000.")

    replay.replayEvent("alertButton_Offer_bribe", "click")

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 19 clicks from Courteney you encounter a pirate Bumblebee.<br><br>Your opponent attacks.")
  }

  test_wild_noSlots() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.TransportWild)

    let specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Law Enforcement is closing in on notorious criminal kingpin Jonathan Wild. He would reward you handsomely for smuggling him home to Kravat. You'd have to avoid capture by the Police on the way. Are you willing to give him a berth?")

    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You do not have any crew quarters available for Jonathan Wild.")

    replay.replayEvent("alertButton_Dismiss", "click")
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.TransportWild)

    specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)
  }

  test_wild_noLaser() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Military_laser","alertButton_Yes","sell_Beam_laser","alertButton_Yes","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game


    assertEqual(SSSTAlertViewController.currentAlertTitle(), `Jonathan Wild refuses to board unless you're armed with a Beam Laser or better. He'd rather take his chances hiding out here on Exo.`)

    replay.replayEvent("alertButton_Dismiss", "click")
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.TransportWild)

    const specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)
  }

  test_wild_onBoard() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have taken Jonathan Wild on board.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.OnBoard)
    assertEqual(game.commander.ship.crew.length, 1)
    assertEqual(game.commander.ship.crew[0].name, "Jonathan Wild")
    assertEqual(game.commander.ship.crew[0].forQuest, true)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Smuggle Jonathan Wild to Kravat.")


    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.wildStatus, SSSTWildQuestStatus.OnBoard)
    assertEqual(game2.commander.ship.crew.length, 1)
    assertEqual(game2.commander.ship.crew[0].name, "Jonathan Wild")
    assertEqual(game2.commander.ship.crew[0].forQuest, true)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Smuggle Jonathan Wild to Kravat.")


    replay.replayEvent("Roster", "click")

    const crewMember = game.commander.ship.crew[0]
    // We don't show hireFire button
    assertEqual(document.getElementById(MAUtils.sanitizedElementID("hireFire_" + crewMember.name)), null)

    // He shows up with no cost, no skills
    const personnelRow = document.getElementById(`personnelRow-${crewMember.name}`)
    const rowHTML = personnelRow.innerHTML.replace(/ src="data:image\/png[^"]+"/, "") // remove the base64 icon to simplify our string comparison
    assertEqual(rowHTML, `<td><div><img class="roster-icon">Jonathan Wild</div></td><td class="centered-cell"></td>`)

    // I need the extra pilot skill to survive the journey to Kravat
    replay.replayEvent("hireFire_Mercedez", "click")

    // Now deliver him to Kravat
    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Kravat", "click")
    replay.replayEvent("alertButton_Warp_", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Jonathan Wild is most grateful to you for spiriting him to safety. As a reward, he has one of his Cyber Criminals hack into the Police Database, and clean up your record. He also offers you the opportunity to take his talented nephew Zeethibal along as a Mercenary with no pay.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game.commander.ship.crew.length, 2)
    assertEqual(game.commander.ship.crew[0].name, "Mercedez")
    assertEqual(game.commander.ship.crew[0].forQuest, false)
    assertEqual(game.commander.ship.crew[1].name, "Zeethibal")
    assertEqual(game.commander.ship.crew[1].forQuest, false)
    assertEqual(game.commander.ship.crew[1].freeMercenaryCost, true)
    assertEqual(game.commander.ship.crew[1].pilot, 8)
    assertEqual(game.commander.ship.crew[1].fighter, 5)
    assertEqual(game.commander.ship.crew[1].trader, 10)
    assertEqual(game.commander.ship.crew[1].engineer, 5)
    assertEqual(game.commander.policeRecordScore, SSSTPoliceRecordScore.Clean)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)

    assertEqual(game2.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game2.commander.ship.crew.length, 2)
    assertEqual(game2.commander.ship.crew[0].name, "Mercedez")
    assertEqual(game2.commander.ship.crew[0].forQuest, false)
    assertEqual(game2.commander.ship.crew[1].name, "Zeethibal")
    assertEqual(game2.commander.ship.crew[1].forQuest, false)
    assertEqual(game2.commander.ship.crew[1].freeMercenaryCost, true)
    assertEqual(game2.commander.ship.crew[1].pilot, 8)
    assertEqual(game2.commander.ship.crew[1].fighter, 5)
    assertEqual(game2.commander.ship.crew[1].trader, 10)
    assertEqual(game2.commander.ship.crew[1].engineer, 5)
    assertEqual(game2.commander.policeRecordScore, SSSTPoliceRecordScore.Clean)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
  }

  test_wild_surrenderToPirate() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have taken Jonathan Wild on board.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.OnBoard)
    assertEqual(game.commander.ship.crew.length, 1)
    assertEqual(game.commander.ship.crew[0].name, "Jonathan Wild")
    assertEqual(game.commander.ship.crew[0].forQuest, true)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Smuggle Jonathan Wild to Kravat.")


    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.wildStatus, SSSTWildQuestStatus.OnBoard)
    assertEqual(game2.commander.ship.crew.length, 1)
    assertEqual(game2.commander.ship.crew[0].name, "Jonathan Wild")
    assertEqual(game2.commander.ship.crew[0].forQuest, true)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Smuggle Jonathan Wild to Kravat.")


    replay.replayEvent("Roster", "click")

    const crewMember = game.commander.ship.crew[0]
    // We don't show hireFire button
    assertEqual(document.getElementById(MAUtils.sanitizedElementID("hireFire_" + crewMember.name)), null)

    // He shows up with no cost, no skills
    const personnelRow = document.getElementById(`personnelRow-${crewMember.name}`)
    const rowHTML = personnelRow.innerHTML.replace(/ src="data:image\/png[^"]+"/, "") // remove the base64 icon to simplify our string comparison
    assertEqual(rowHTML, `<td><div><img class="roster-icon">Jonathan Wild</div></td><td class="centered-cell"></td>`)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Surrender", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The pirates are upset that they found no cargo on your ship. To save yourself, you have no choice but to pay them 5% of your current net worth. The pirate captain turns out to be an old associate of Jonathan Wild. He invites Wild to go to Kravat aboard the pirate ship. Wild accepts the offer and thanks you for the ride.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game.commander.ship.crew.length, 0)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game2.commander.ship.crew.length, 0)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_wild_surrenderToPolice() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have taken Jonathan Wild on board.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.OnBoard)
    assertEqual(game.commander.ship.crew.length, 1)
    assertEqual(game.commander.ship.crew[0].name, "Jonathan Wild")
    assertEqual(game.commander.ship.crew[0].forQuest, true)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Smuggle Jonathan Wild to Kravat.")


    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.wildStatus, SSSTWildQuestStatus.OnBoard)
    assertEqual(game2.commander.ship.crew.length, 1)
    assertEqual(game2.commander.ship.crew[0].name, "Jonathan Wild")
    assertEqual(game2.commander.ship.crew[0].forQuest, true)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Smuggle Jonathan Wild to Kravat.")


    replay.replayEvent("Roster", "click")

    const crewMember = game.commander.ship.crew[0]
    // We don't show hireFire button
    assertEqual(document.getElementById(MAUtils.sanitizedElementID("hireFire_" + crewMember.name)), null)

    // He shows up with no cost, no skills
    const personnelRow = document.getElementById(`personnelRow-${crewMember.name}`)
    const rowHTML = personnelRow.innerHTML.replace(/ src="data:image\/png[^"]+"/, "") // remove the base64 icon to simplify our string comparison
    assertEqual(rowHTML, `<td><div><img class="roster-icon">Jonathan Wild</div></td><td class="centered-cell"></td>`)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    replay.replayEvent("ecButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "If you surrender, you will spend some time in prison and will have to pay a hefty fine. Wild will be arrested, too. Are you sure you want to do that?")

    replay.replayEvent("alertButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 30 days in prison and a fine of $292950.\nJonathan Wild is arrested and taken away to stand trial.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game.commander.ship.crew.length, 0)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game2.commander.ship.crew.length, 0)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_wild_podEscape() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","Equipment","sell_Military_laser","alertButton_Yes","sell_Reflective_shield","alertButton_Yes","sell_Reflective_shield","alertButton_Yes","Ship Yard","buy_escape_pod","alertButton_Yes","Warp","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`


    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Jonathan Wild is arrested, and taken away to stand trial.")

    replay.replayEvent("alertButton_Dismiss")
    replay.replayEvent("alertButton_Dismiss")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game.commander.ship.crew.length, 0)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")


    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game2.commander.ship.crew.length, 0)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_wild_sellWeapons() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have taken Jonathan Wild on board.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.OnBoard)
    assertEqual(game.commander.ship.crew.length, 1)
    assertEqual(game.commander.ship.crew[0].name, "Jonathan Wild")
    assertEqual(game.commander.ship.crew[0].forQuest, true)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Smuggle Jonathan Wild to Kravat.")


    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.wildStatus, SSSTWildQuestStatus.OnBoard)
    assertEqual(game2.commander.ship.crew.length, 1)
    assertEqual(game2.commander.ship.crew[0].name, "Jonathan Wild")
    assertEqual(game2.commander.ship.crew[0].forQuest, true)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Smuggle Jonathan Wild to Kravat.")


    replay.replayEvent("Roster", "click")

    const crewMember = game.commander.ship.crew[0]
    // We don't show hireFire button
    assertEqual(document.getElementById(MAUtils.sanitizedElementID("hireFire_" + crewMember.name)), null)

    // He shows up with no cost, no skills
    const personnelRow = document.getElementById(`personnelRow-${crewMember.name}`)
    const rowHTML = personnelRow.innerHTML.replace(/ src="data:image\/png[^"]+"/, "") // remove the base64 icon to simplify our string comparison
    assertEqual(rowHTML, `<td><div><img class="roster-icon">Jonathan Wild</div></td><td class="centered-cell"></td>`)


    replay.replayEvent("Equipment", "click")
    replay.replayEvent("sell_Beam_laser", "click")
    replay.replayEvent("alertButton_Yes", "click")
    replay.replayEvent("sell_Military_laser", "click")
    replay.replayEvent("alertButton_Yes", "click")
    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), `Jonathan Wild isn't about to go with you if you're not armed with at least a Beam Laser. He'd rather take his chances hiding out here on Exo.`)

    replay.replayEvent("alertButton_Cancel", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("alertButton_He_can_stay_", "click")


    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 18 clicks from Malcoria you encounter a police Firefly.<br><br>Your opponent attacks.")

    assertEqual(game.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game.commander.ship.crew.length, 0)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.wildStatus, SSSTWildQuestStatus.Closed)
    assertEqual(game2.commander.ship.crew.length, 0)

    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_wild_ionReactor() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Exo","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Equipment","sell_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Surrender","alertButton_Cancel","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Commander","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Drink","alertButton_I_ll_pass","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Pick_it_up_","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","Commander","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Tarchannen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zuul","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","selectPlanetZoomed|Iralius","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Hulst","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Antedi","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ferris","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tarchannen","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Turkana","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Ligon","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733627017971}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("cheat_freeSingularity", "click")
    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Exo", "click")
    replay.replayEvent("alertButton_Warp_", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Jonathan Wild doesn't like the looks of that Ion Reactor. He thinks it's too dangerous, and won't get on board.")
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.TransportWild)

    const specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)
  }

  test_dragonfly_flee() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Quator","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Commander","ignoreTradeInOrbit","ignoreTraders","ignorePolice","ignorePirates","Chart","galacticChart_useSingularity_121_Baratas","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Melina","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Regulas","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Zalkon","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","fulltank","namedEvent","warpBlastOff"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanet|Regulas","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Kaylon","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zalkon","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    const encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 1 click from Zalkon you encounter a stolen Dragonfly.<br><br>Your opponent attacks.")
  }

  test_dragonfly() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Navigation_system","alertButton_Yes","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Quator","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Commander","ignoreTradeInOrbit","ignoreTraders","ignorePolice","ignorePirates","Chart","galacticChart_useSingularity_121_Baratas","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Melina","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Regulas","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Dismiss","cheat_freeSingularity"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanet|Regulas","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(game.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game.questListDescription(), "Follow the Dragonfly to Zalkon.")


    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game2.questListDescription(), "Follow the Dragonfly to Zalkon.")

    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Zalkon", "click")
    replay.replayEvent("alertButton_Warp_", "click")

    const encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 1 click from Zalkon you encounter a stolen Dragonfly.<br><br>Your opponent attacks.")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have destroyed your opponent.")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Hello, Commander. This is Colonel Jackson again. On behalf of the Space Corps, I thank you for your valuable assistance in destroying the Dragonfly. As a reward, we will install one of the experimental shields on your ship. Return here for that when you're ready.")

    replay.replayEvent("alertButton_Dismiss", "click")


    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "Get your Lightning shield at Zalkon.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "Get your Lightning shield at Zalkon.")


    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Colonel Jackson here. Do you want us to install a Lightning shield on your current ship?")

    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have already filled all of your available shield slots.")
    replay.replayEvent("alertButton_Dismiss", "click")


    replay.replayEvent("Equipment", "click")
    replay.replayEvent("sell_Reflective_shield", "click")
    replay.replayEvent("alertButton_Yes", "click")

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Colonel Jackson here. Do you want us to install a Lightning shield on your current ship?")

    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You now have one Lightning shield installed on your ship.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldLightning), true)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldLightning), true)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_japori_lackMedicine() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","namedEvent","galacticChart_useSingularity_1_Japori","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","selectPlanet|Japori","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733564400516}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    // Don't have medicine, Special doesn't show
    let specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    replay.replayEvent("News", "click")
    replay.replayEvent("purchaseNews", "click")

    const newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The Daily Planet</h4><br>Travelers Claim Sighting of Ship Materializing in Orbit!<br><br>Collector in Styris System Seeks to Purchase Tribbles.<br><br>New Rumors of Severe Drought in the Vandor System.")
  }

  test_japori_noCargoSpace() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Brax","alertButton_Warp_","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","cheat_freeSingularity"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733564700811}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("News", "click")
    replay.replayEvent("purchaseNews", "click")

    let newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The Loyal Subject</h4><br>Travelers Claim Sighting of Ship Materializing in Orbit!<br><br>Editorial: We Must Help Japori!<br><br>Notice: Cold Weather in the Ligon System.")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("cargo_WaterBuy_All", "click")
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Water), 15)

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A strange disease has invaded the Japori system. We would like you to deliver these ten canisters of special antidote to Japori. Note that, if you accept, ten of your cargo bays will remain in use on your way to Japori. Do you accept this mission?")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You must have at least 10 free cargo bays to accept this mission.")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Commander", "click")
    assertEqual(document.getElementById("cargoListDiv").innerHTML, "A Portable Singularity.")
    assertEqual(game.specialCargoDescription(), "A Portable Singularity.")
    assertEqual(game.questListDescription(), "No open quests.")

    let specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)
  }

  test_japori_hasMedicine() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Brax","alertButton_Warp_","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","cheat_freeSingularity"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733564700811}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("News", "click")
    replay.replayEvent("purchaseNews", "click")

    let newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The Loyal Subject</h4><br>Travelers Claim Sighting of Ship Materializing in Orbit!<br><br>Editorial: We Must Help Japori!<br><br>Notice: Cold Weather in the Ligon System.")

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A strange disease has invaded the Japori system. We would like you to deliver these ten canisters of special antidote to Japori. Note that, if you accept, ten of your cargo bays will remain in use on your way to Japori. Do you accept this mission?")
    replay.replayEvent("alertButton_Yes", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Ten of your cargo bays now contain antidote for the Japori system.")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Commander", "click")
    assertEqual(document.getElementById("cargoListDiv").innerHTML, "10 bays of antidote.<br>A Portable Singularity.")
    assertEqual(game.specialCargoDescription(), "10 bays of antidote.\nA Portable Singularity.")
    assertEqual(game.questListDescription(), "Deliver antidote to Japori.")

    let specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    replay.replayEvent("Warp", "click")

		const totalBays = game.commander.ship.totalCargoBays()
		const freeBays = game.commander.ship.freeCargoBays()
    assertEqual(totalBays, 15)
    assertEqual(freeBays, 5)

    replay.replayEvent("cargo_WaterBuy_All", "click")
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Water), 5)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargo), 10)
    assertEqual(game.japoriQuestStatus, SSSTJaporiQuestStatus.HasMedicine)


    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.totalCargoBays(), 15)
    assertEqual(game2.commander.ship.freeCargoBays(), 0)

    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Water), 5)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargo), 10)
    assertEqual(game2.japoriQuestStatus, SSSTJaporiQuestStatus.HasMedicine)


    replay.replayEvent("Chart", "click")
    replay.replayEvent("galacticChart_useSingularity_121_Japori", "click")
    replay.replayEvent("alertButton_Warp_", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("News", "click")
    replay.replayEvent("purchaseNews", "click")

    newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>General Report</h4><br>Travelers Claim Sighting of Ship Materializing in Orbit!<br><br>Disease Antidotes Arrive! Health Officials Optimistic.<br><br>Collector in Titan System Seeks to Purchase Tribbles.<br><br>Weapons Research Increases Kill-Ratio!")

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Thank you for delivering the medicine to us. We don't have any money to reward you, but we do have an alien fast-learning machine with which we will increase your skills.")
    replay.replayEvent("alertButton_Dismiss", "click")

    specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    assertEqual(game.japoriQuestStatus, SSSTJaporiQuestStatus.Closed)
    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargo), 0)
    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 6)
    assertEqual(game.commander.engineer, 6)
    assertEqual(game.commander.fighter, 5)

    assertEqual(game.commander.ship.totalCargoBays(), 15)
    assertEqual(game.commander.ship.freeCargoBays(), 10)
    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)

    assertEqual(game2.japoriQuestStatus, SSSTJaporiQuestStatus.Closed)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargo), 0)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 6)
    assertEqual(game2.commander.engineer, 6)
    assertEqual(game2.commander.fighter, 5)

    assertEqual(game2.commander.ship.totalCargoBays(), 15)
    assertEqual(game2.commander.ship.freeCargoBays(), 10)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_eraseRecord_accept() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Antedi","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733562860803}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    // Don't have a record yet, special doesn't show
    let specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("buyship_Wasp", "click")
    replay.replayEvent("alertButton_Yes", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("alertButton_Attack", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A hacker conveys to you that he has cracked the passwords to the galaxy-wide police computer network, and that he can erase your police record for the sum of $5000. Do you want him to do that?")

    const creditsBefore = game.commander.credits
    assertEqual(game.commander.policeRecordScore, -33)

    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The hacker resets your police record to be clean.")
    replay.replayEvent("alertButton_Dismiss", "click")

    specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    assertEqual(game.commander.credits, creditsBefore - 5000)
    assertEqual(game.commander.policeRecordScore, SSSTPoliceRecordScore.Clean)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.credits, creditsBefore - 5000)
    assertEqual(game2.commander.policeRecordScore, SSSTPoliceRecordScore.Clean)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
  }

  test_eraseRecord_decline() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Antedi","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733562860803}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    // Don't have a record yet, special doesn't show
    let specialEl = document.getElementById("Special")
    assertEqual(specialEl, null)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("buyship_Wasp", "click")
    replay.replayEvent("alertButton_Yes", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Attack", "click")
    replay.replayEvent("alertButton_Attack", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)

    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "A hacker conveys to you that he has cracked the passwords to the galaxy-wide police computer network, and that he can erase your police record for the sum of $5000. Do you want him to do that?")

    const creditsBefore = game.commander.credits
    assertEqual(game.commander.policeRecordScore, -33)

    replay.replayEvent("alertButton_No", "click")

    specialEl = document.getElementById("Special")
    assertEqual(specialEl !== null, true)

    assertEqual(game.commander.credits, creditsBefore)
    assertEqual(game.commander.policeRecordScore, -33)
    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.EraseRecord)

    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.credits, creditsBefore)
    assertEqual(game2.commander.policeRecordScore, -33)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.EraseRecord)
  }

  test_skillIncrease_incidence() {
    const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1732766875181}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(game.solarSystems.filter(x => x.specialEvent === SSSTSpecialEvent.SkillIncrease).length, 3)
  }

  test_skillIncrease_decline() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Korma","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733546197977}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")

    const creditsBefore = game.commander.credits

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "An alien with a fast-learning machine offers to increase one of your skills for the reasonable sum of $3000. You won't be able to pick that skill, though. Do you accept his offer?")

    replay.replayEvent("alertButton_No", "click")

    assertEqual(game.commander.credits, creditsBefore)
    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 5)
    assertEqual(game.commander.engineer, 5)
    assertEqual(game.commander.fighter, 5)

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.SkillIncrease)

    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.credits, creditsBefore)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 5)
    assertEqual(game2.commander.engineer, 5)
    assertEqual(game2.commander.fighter, 5)

    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.SkillIncrease)
  }

  test_skillIncrease_accept() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Korma","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733546197977}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    replay.replayEvent("Special", "click")

    const creditsBefore = game.commander.credits

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "An alien with a fast-learning machine offers to increase one of your skills for the reasonable sum of $3000. You won't be able to pick that skill, though. Do you accept his offer?")

    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(game.commander.credits, creditsBefore-3000)
    assertEqual(game.commander.pilot, 5)
    assertEqual(game.commander.trader, 5)
    assertEqual(game.commander.engineer, 6)
    assertEqual(game.commander.fighter, 5)

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.credits, creditsBefore-3000)
    assertEqual(game2.commander.pilot, 5)
    assertEqual(game2.commander.trader, 5)
    assertEqual(game2.commander.engineer, 6)
    assertEqual(game2.commander.fighter, 5)

    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
  }

  test_lottery_easy() {
    const replayLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|1","click"],"gameRandSeed":1733545440606}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    const creditsBefore = game.commander.credits

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "What luck! While docking in the space port, you receive a message that you won $1000 in a lottery. The prize has been added to your account.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.credits, creditsBefore + 1000)

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.credits, creditsBefore + 1000)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
  }

  test_lottery_beginner() {
    const replayLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|0","click"],"gameRandSeed":1733545440606}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    const creditsBefore = game.commander.credits

    replay.replayEvent("Special", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "What luck! While docking in the space port, you receive a message that you won $1000 in a lottery. The prize has been added to your account.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.credits, creditsBefore + 1000)

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)

    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.credits, creditsBefore + 1000)
    assertEqual(game2.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
  }

  test_lottery_normal() {
    const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1733545440606}`
    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    const creditsBefore = game.commander.credits

    assertEqual(game.commander.currentSystem.specialEvent, SSSTSpecialEvent.None)
  }

  test_retire() {
    const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1734493988106}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game


    replay.replayEvent("cheat_freeMoney")
    replay.replayEvent("cheat_freeSingularity")


    const target = game.solarSystems.find(x => x.specialEvent === SSSTSpecialEvent.MoonForSale)

    replay.replayEvent("Chart")
    replay.replayEvent(`galacticChart_useSingularity_121_${target.name}`)
    replay.replayEvent("alertButton_Warp_")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(game.questListDescription(), "Claim your moon in Utopia.")

    const game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.questListDescription(), "Claim your moon in Utopia.")


    replay.replayEvent("cheat_freeSingularity")

    const target2 = game.solarSystems.find(x => x.specialEvent === SSSTSpecialEvent.MoonBought)

    replay.replayEvent("Chart")
    replay.replayEvent(`galacticChart_useSingularity_121_${target2.name}`)
    replay.replayEvent("alertButton_Warp_")

    this._replaySkipEncounters(replay)

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_No", "click")
    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")

    const endMessage = document.getElementById('end-message').innerText
    assertEqual(endMessage.startsWith("You achieved a score"), true)
    assertTrue(document.getElementById('endgame') !== null, "end game button shows")
  }

  test_tribble() {
    const replayLog = `{"idLog":["createCommander","cheat_freeSingularity","cheat_showSpecial","cheat_freeMoney","Chart","galacticChart_useSingularity_121_Ashen","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_Yes","alertButton_Dismiss","Buy","cargo_FoodBuy_5","Warp","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","alertButton_Dismiss","fulltank","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Buy","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","Warp","cargo_NarcoticsBuy_All","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","alertButton_Dismiss","Sell","Chart","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Helena","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","Sell"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","selectPlanetZoomed|Sefalla","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Deneva","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732873090822}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const game = stG.viewController._game
    const commander = game.commander

    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics), 0)
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 3)
    assertEqual(commander.ship.tribbles, 1946)

    assertEqual(game.specialCargoDescription(), "1946 cute, furry tribbles.")
    assertEqual(game.questListDescription(), "Get rid of those pesky tribbles.")

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    // Spot check some properties
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics), 0)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 3)
    assertEqual(game2.commander.ship.tribbles, 1946)
    assertEqual(game2.specialCargoDescription(), "1946 cute, furry tribbles.")
    assertEqual(game2.questListDescription(), "Get rid of those pesky tribbles.")


    replay.replayEvent("Special", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "An eccentric alien billionaire wants to buy your collection of tribbles and offers half a credit for each of them. Do you accept his offer?")

    replay.replayEvent("alertButton_No", "click")

    replay.replayEvent("Special", "click")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The alien uses advanced technology to beam your whole collection of tribbles to his ship.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(commander.ship.tribbles, 0)

    assertEqual(game.specialCargoDescription(), "No special items.")
    assertEqual(game.questListDescription(), "No open quests.")

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    // Spot check some properties
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics), 0)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 3)
    assertEqual(game2.commander.ship.tribbles, 0)
    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")
  }

  test_tribble_notEnoughMoney() {
    const replayLog = `{"idLog":["createCommander","cheat_freeSingularity","cheat_showSpecial","Chart","galacticChart_useSingularity_121_Rakhar","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Special","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734688054944}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const game = stG.viewController._game
    const commander = game.commander

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You don't have enough cash to accept this offer.")
    assertEqual(game.commander.ship.tribbles, 0)

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.tribbles, 0)
  }

// Replay tests
  test_HPView_updates() {
    const replayLog = `{"idLog":["createCommander","Commander","ignorePolice","ignorePirates","ignoreTraders","ignoreTradeInOrbit","Bank","borrow__500","Warp","warpNext","warpNext","warpNext","warpNext","warpNext","warpNext","warpNext","warpNext","namedEvent","warpBlastOff","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Special","alertButton_No","Ship Yard","fulltank","Warp","warpNext","warpNext","warpNext","cargo_OreBuy_All","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_WaterBuy_All","warpBlastOff","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Ok__I_won_t_","ecButton_Submit","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_WaterSell_All","cargo_FoodSell_All","cargo_OreSell_All","Ship Yard","fulltank","Full_repair","Warp","warpNext","togglePrices_Show_Absolute","togglePrices_Show_Relative","togglePrices_Show_Absolute","togglePrices_Show_Relative","warpNext","warpNext","cargo_FirearmsBuy_All","cargo_MedicineBuy_All","warpBlastOff","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_FirearmsSell_All","Warp","fulltank","Ship Yard","Full_repair","Special","alertButton_No","Sell","Warp","warpNext","Bank","Warp","warpNext","warpNext","cargo_OreBuy_All","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_WaterBuy_All","warpBlastOff","ecButton_Submit","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_OreSell_All","Warp","fulltank","Ship Yard","Full_repair","Bank","borrow__409","Warp","warpNext","warpNext","warpNext","togglePrices_Show_Absolute","togglePrices_Show_Relative","cargo_FirearmsBuy_All","cargo_MedicineBuy_All","warpBlastOff","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_FirearmsSell_All","Ship Yard","fulltank","Full_repair","autoFuelCheckbox","autoRepairCheckbox","Warp","warpNext","warpNext","warpNext","cargo_OreBuy_All","Bank","pay__1000","Sell","Warp","warpBlastOff","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_OreSell_All","Ship Yard","Warp","warpNext","cargo_FirearmsBuy_All","cargo_NarcoticsBuy_All","cargo_MedicineBuy_All","warpBlastOff","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_FirearmsSell_All","cargo_NarcoticsSell_All","cargo_MedicineSell_All","Warp","warpNext","warpNext","warpNext","cargo_OreBuy_All","cargo_FoodBuy_All","warpBlastOff","ecButton_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","alertButton_Dismiss","Sell","cargo_FoodSell_All","cargo_OreSell_All","Warp","warpNext","warpNext","warpNext","cargo_FirearmsBuy_All","cargo_NarcoticsBuy_All","cargo_MedicineBuy_All","warpBlastOff","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss"],"eventNameLog":["click","click","change","change","change","change","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Tantalos","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732919193563}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 10 clicks from Tantalos you encounter a pirate Gnat.<br><br>Your opponent attacks.")

    const hpBarWidthBefore = document.getElementById(`battle-hpBar-self`).style.width

    replay.replayEvent("ecButton_Flee", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 10 clicks from Tantalos you encounter a pirate Gnat.<br><br>Your opponent attacks.<br>The pirate ship missed you.<br>The pirate ship is still following you.")

    const hpBarWidthAfter = document.getElementById(`battle-hpBar-self`).style.width

    assertEqual(hpBarWidthBefore, hpBarWidthAfter)
  }

  test_giveUp() {
    const replayLog = `{"idLog":["createCommander","Commander","giveup","alertButton_Abandon_game"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1732590998247}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const endMessage = document.getElementById('end-message').innerText
    assertEqual(endMessage.startsWith("You achieved a score"), true)
    assertTrue(document.getElementById('endgame') !== null, "end game button shows")

    replay.replayEvent("endgame", "click")
    replay.replayEvent("trader", "slider|input|6")
    replay.replayEvent("createCommander", "click")

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Rutia")

    const commander = stG.viewController._game.commander
    assertEqual(commander.trader, 6)
  }

  test_dieStartOver() {
    const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Attack","alertButton_Attack","ecButton_Auto_Attack","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click"],"gameRandSeed":1732591429497}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const endMessage = document.getElementById('end-message').innerText
    assertEqual(endMessage.startsWith("You achieved a score"), true)
    assertTrue(document.getElementById('endgame') !== null, "end game button shows")

    replay.replayEvent("endgame", "click")
    replay.replayEvent("trader", "slider|input|6")
    replay.replayEvent("createCommander", "click")

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Tantalos")

    const commander = stG.viewController._game.commander
    assertEqual(commander.trader, 6)

    let highScoringGames = JSON.parse(stLocalStorage.getItem('highScoringGames')) || {}
    assertEqual(Object.keys(highScoringGames).length, 1)

    replay.replayEvent("Commander", "click")
    replay.replayEvent("showhighscores", "click")
    replay.replayEvent("clearall", "click")
    replay.replayEvent("alertButton_Cancel", "click")

    highScoringGames = JSON.parse(stLocalStorage.getItem('highScoringGames')) || {}
    assertEqual(Object.keys(highScoringGames).length, 1)

    assertEqual(document.getElementById("highscores").innerHTML, "Jean-Luc was killed after 1 day, worth $8382 on Normal level. Score: 0.9%.")

    replay.replayEvent("clearall", "click")
    replay.replayEvent("alertButton_Clear_all", "click")

    highScoringGames = JSON.parse(stLocalStorage.getItem('highScoringGames')) || {}
    assertEqual(Object.keys(highScoringGames).length, 0)

    assertEqual(document.getElementById("highscores").innerHTML, "None on record")
  }

  test_autoRepairs_autoFuel() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.credits, 999867)
    assertEqual(commander.ship.hullPercentage(), 1)
    assertEqual(commander.ship.fuel, 14)
  }

  test_manualRepairs() {
    const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732357186711}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.credits, 1000)

    assertEqual(commander.ship.hull, 47)

    replay.replayEvent("Buy_1_repair", "click")

    assertEqual(commander.ship.hull, 48)
    assertEqual(commander.credits, 999)

    replay.replayEvent("5_repairs", "click")

    assertEqual(commander.ship.hull, 53)
    assertEqual(commander.credits, 994)

    replay.replayEvent("Full_repair", "click")

    assertEqual(commander.ship.hull, 100)
    assertEqual(commander.credits, 947)
  }

  test_manualFuel() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","Warp","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Flee","ecButton_Flee","ecButton_Flee","ecButton_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.credits, 1000000)

    assertEqual(commander.ship.fuel, 6)

    replay.replayEvent("buy1unit", "click")

    assertEqual(commander.ship.fuel, 7)
    assertEqual(commander.credits, 1000000 - 2*1)

    replay.replayEvent("buy5units", "click")

    assertEqual(commander.ship.fuel, 12)
    assertEqual(commander.credits, 1000000 - 2*1 - 2*5)

    replay.replayEvent("fulltank", "click")

    assertEqual(commander.ship.fuel, 14)
    assertEqual(commander.credits, 1000000 - 16)
  }

  test_manualNews() {
    const replayLog = `{"idLog":["createCommander","News"],"eventNameLog":["click","click"],"gameRandSeed":1732358737231}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.credits, 1000)

    replay.replayEvent("News", "click")

    assertEqual(commander.credits, 1000)

    let newsStrDiv = document.getElementById('newsStrDiv')
    const expectedNews = "<h4>The People's Voice</h4><br>Collector in Aldea System Seeks to Purchase Tribbles.<br><br>Evidence Suggests Severe Drought in the Rubicum System."
    assertTrue(newsStrDiv.innerHTML !== expectedNews, "news not visible yet")

    replay.replayEvent("purchaseNews", "click")

    assertEqual(commander.credits, 997)

    newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, expectedNews)

    replay.replayEvent("Warp", "click")

    newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv, null)

    replay.replayEvent("News", "click")

    assertEqual(commander.credits, 997)

    newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, expectedNews)
  }

  test_autoNews() {
    const replayLog = `{"idLog":["createCommander","News","autoNewsCheckbox","Sell"],"eventNameLog":["click","click","change","click"],"gameRandSeed":1732358737231}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.credits, 1000)

    replay.replayEvent("News", "click")

    assertEqual(commander.credits, 997)

    let newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The People's Voice</h4><br>Collector in Aldea System Seeks to Purchase Tribbles.<br><br>Evidence Suggests Severe Drought in the Rubicum System.")

    replay.replayEvent("Warp", "click")

    newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv, null)

    replay.replayEvent("News", "click")

    assertEqual(commander.credits, 997)

    newsStrDiv = document.getElementById('newsStrDiv')
    assertEqual(newsStrDiv.innerHTML, "<h4>The People's Voice</h4><br>Collector in Aldea System Seeks to Purchase Tribbles.<br><br>Evidence Suggests Severe Drought in the Rubicum System.")
  }

  test_buyShip_debt_upgrade() {
    const replayLog = `{"idLog":["createCommander","Bank","borrow__500","Buy","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","cargo_FursSell_All","cargo_FoodSell_All","namedEvent","Buy","cargo_WaterBuy_All","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_FoodBuy_All","cargo_FursBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Equipment","Ship Yard","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Special","alertButton_No","Ship Yard","fulltank","Buy","cargo_MedicineBuy_All","Sell","cargo_MedicineSell_All","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Buy","cargo_GamesBuy_All","Sell","cargo_GamesSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Bank","Ship Yard","buyship_Flea","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Laertes","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Festen","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732872096993}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.credits, 6057)
    assertEqual(SSSTShipModel.shipModelForType(commander.ship.type).name, "Flea")

    replay.replayEvent("cheat_freeMoney", "click")
    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("buyship_Gnat", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "Before you can buy a new ship or new equipment, you must settle your debts at the bank.")

    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("Bank", "click")
    replay.replayEvent("pay__500", "click")

    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("buyship_Gnat", "click")
    replay.replayEvent("alertButton_Yes", "click")

    assertEqual(commander.credits, 991500)
    assertEqual(SSSTShipModel.shipModelForType(commander.ship.type).name, "Gnat")
  }

  test_buyShip_debt_downgrade() {
    const replayLog = `{"idLog":["createCommander","Bank","borrow__500","Buy","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","cargo_FursSell_All","cargo_FoodSell_All","namedEvent","Buy","cargo_WaterBuy_All","cargo_FursBuy_All","cargo_FoodBuy_All","cargo_FoodBuy_All","cargo_FursBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FursBuy_All","Sell","cargo_FursSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Equipment","Ship Yard","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Special","alertButton_No","Ship Yard","fulltank","Buy","cargo_MedicineBuy_All","Sell","cargo_MedicineSell_All","Buy","cargo_WaterBuy_All","Sell","cargo_WaterSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_FoodBuy_All","Sell","cargo_FoodSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Buy","cargo_GamesBuy_All","Sell","cargo_GamesSell_All","Buy","cargo_OreBuy_All","Sell","cargo_OreSell_All","Bank","Ship Yard","buyship_Flea","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Laertes","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Festen","selectPlanetZoomed|Esmee","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732872096993}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.credits, 6057)
    assertEqual(SSSTShipModel.shipModelForType(commander.ship.type).name, "Flea")
  }

  test_escapePod() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","Ship Yard","buy_escape_pod","alertButton_Yes","Warp","warpBlastOff","ecButton_Auto_Attack","alertButton_Attack","ecButton_Auto_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732415003637}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.credits, 997500)
    assertEqual(commander.currentSystem.name, "Lowry")
    assertEqual(SSSTShipModel.shipModelForType(commander.ship.type).name, "Flea")
  }

  // Sometimes Auto-Flee immediately succeeds in fleeing
  test_autoFlee_withImmediate() {
    const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","pilot","createCommander","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss"],"eventNameLog":["slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","click","click","click","click","click","click"],"gameRandSeed":1734495546137}`

    // This auto-flee was immediate ^

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 13 clicks from Guinifer you encounter a police Hornet.<br><br>It ignores you.")

    this._replaySkipEncounters(replay)

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Guinifer")
  }

  test_autoFlee_noImmediates() {
    const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","engineer","engineer","engineer","engineer","createCommander","Warp","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss"],"eventNameLog":["slider|input|4","slider|input|3","slider|input|2","slider|input|1","slider|input|6","slider|input|7","slider|input|8","slider|input|9","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734495811559}`

    // ^ this was not immediate

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 8 clicks from Kaylon you encounter a trader Bumblebee.<br><br>It ignores you.")

    this._replaySkipEncounters(replay)

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Kaylon")
  }

  test_autoAttack() {
    const replayLog = `{"idLog":["createCommander","namedEvent","cheat_freeMoney","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes"],"eventNameLog":["click","selectPlanetZoomed|Vadera","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733023531445}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")
    replay.replayEvent("ecButton_Ignore", "click")


    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 17 clicks from Capelle you encounter a police Mosquito.<br><br>The police summon you to submit to an inspection.")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    replay.replayEvent("alertButton_Attack", "click")
    replay.replayEvent("alertButton_Attack", "click")
    replay.replayEvent("ecButton_Auto_Attack", "click")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You have destroyed your opponent.")
    replay.replayEvent("alertButton_Dismiss", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 14 clicks from Capelle you encounter a pirate Hornet.<br><br>Your opponent attacks.")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 6 clicks from Capelle you encounter a trader Firefly.<br><br>It ignores you.")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    // Opponent escapes
    replay.replayEvent("alertButton_Dismiss", "click")

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 1 click from Capelle you encounter a trader Gnat.<br><br>It ignores you.")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    // They surrender and offer to let me plunder
    replay.replayEvent("ecButton_Auto_Attack", "click")
    // They surrender and offer to let me plunder
    replay.replayEvent("ecButton_Auto_Attack", "click")
    // Destroyed
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("alertButton_Pick_it_up_", "click")

    replay.replayEvent("alertButton_Dismiss", "click")

    let systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Capelle")

    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("Full_repair", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Ignore", "click")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    // Escaped
    replay.replayEvent("alertButton_Dismiss", "click")

    replay.replayEvent("ecButton_Ignore", "click")
    replay.replayEvent("ecButton_Auto_Flee", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("ecButton_Ignore", "click")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    // Escaped
    replay.replayEvent("alertButton_Dismiss", "click")


    // Arrived at destination
    replay.replayEvent("alertButton_Dismiss", "click")

    systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Gemulon")

    assertEqual(commander.policeKills, 1)
    assertEqual(commander.pirateKills, 0)
    assertEqual(commander.traderKills, 1)
  }

  test_hireMercenary_fireMercenary() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","autoFuelCheckbox","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","Warp","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Bumblebee","alertButton_Yes"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Triacus","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734496062815}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    const creditsBefore = commander.credits
    assertEqual(creditsBefore, 950389)
    assertEqual(commander.ship.crew.length, 0)

    replay.replayEvent("Ship Yard")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("autoRepairCheckbox", "change")

    replay.replayEvent("For Hire", "click")
    replay.replayEvent("hireFire_Milete", "click")
    const sysName = commander.currentSystem.name
    const mercenaryPrice = 69

    assertEqual(commander.ship.crew.length, 1)

    replay.replayEvent("Commander", "click")
    replay.replayEvent("ignorePirates", "change")
    replay.replayEvent("ignorePolice", "change")
    replay.replayEvent("ignoreTraders", "change")
    replay.replayEvent("ignoreTradeInOrbit", "change")
    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(commander.credits, creditsBefore - mercenaryPrice)

    replay.replayEvent("Ship Yard", "click")
    replay.replayEvent("fulltank", "click")
    replay.replayEvent("Full_repair", "click")

    replay.replayEvent("Warp", "click")
    replay.replayEvent("namedEvent", "selectPlanetZoomed|" + sysName)
    replay.replayEvent("warpBlastOff", "click")

    this._replaySkipEncounters(replay)

    assertEqual(document.getElementById("For Hire"), null)

    // Go to roster, fire him
    replay.replayEvent("Roster", "click")
    replay.replayEvent("hireFire_Milete", "click")

    // for hire button should appear
    assertTrue(document.getElementById("For Hire") !== null, "For hire button reappears")
    const roster = document.getElementById("Roster")
    assertEqual(roster.classList.contains('active'), true)
  }

  test_mercenary_arrest() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","autoFuelCheckbox","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","Warp","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Bumblebee","alertButton_Yes"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Triacus","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734496062815}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const game = stG.viewController._game
    const commander = stG.viewController._game.commander

    const creditsBefore = commander.credits
    assertEqual(creditsBefore, 950389)
    assertEqual(commander.ship.crew.length, 0)

    replay.replayEvent("Ship Yard")
    replay.replayEvent("autoFuelCheckbox", "change")
    replay.replayEvent("autoRepairCheckbox", "change")

    replay.replayEvent("For Hire", "click")
    replay.replayEvent("hireFire_Milete", "click")
    const sysName = commander.currentSystem.name
    const mercenaryPrice = 69

    assertEqual(commander.ship.crew.length, 1)

    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    replay.replayEvent("ecButton_Auto_Flee")
    replay.replayEvent("alertButton_Dismiss")
    replay.replayEvent("ecButton_Auto_Flee")
    replay.replayEvent("alertButton_Dismiss")

    replay.replayEvent("ecButton_Attack")
    replay.replayEvent("alertButton_Attack")
    replay.replayEvent("ecButton_Surrender")
    replay.replayEvent("alertButton_Surrender")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $328500.\nYour hired mercenaries have left.")

    replay.replayEvent("alertButton_Dismiss")

    assertEqual(commander.ship.crew.length, 0)

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.ship.crew.length, 0)
  }

  test_tradeInOrbit_buy_selectedValue() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Trade","alertButton_Selected"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const creditsBeforeTrade = commander.credits

    const alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

    // Disable automatically purchasing fuel since there's no opportunity
    // to check credits after trade but before arrival in this situation
    stG.viewController._game.autoFuel = false
    stG.viewController._game.autoRepairs = false

    replay.replayEvent("alertButton_Dismiss", "click")

    const tradeQuantity = 7
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Ore), tradeQuantity)

    const price = 350
    assertEqual(commander.credits, creditsBeforeTrade - tradeQuantity*price)
  }

  test_tradeInOrbit_buy_all() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Trade","alertButton_All"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const creditsBeforeTrade = commander.credits

    const alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

    // Disable automatically purchasing fuel since there's no opportunity
    // to check credits after trade but before arrival in this situation
    stG.viewController._game.autoFuel = false
    stG.viewController._game.autoRepairs = false

    replay.replayEvent("alertButton_Dismiss", "click")

    const tradeQuantity = 14
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Ore), tradeQuantity)

    const price = 350
    assertEqual(commander.credits, creditsBeforeTrade - tradeQuantity*price)
  }

  test_tradeInOrbit_buy_none() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Trade","alertButton_None"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734494396218}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const creditsBeforeTrade = commander.credits

    const alertTitleEl = document.getElementById("ssstalertvc-title")
    assertTrue(!alertTitleEl, "no alert showing")

    const tradeQuantity = 0
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Ore), tradeQuantity)

    const price = 350
    assertEqual(commander.credits, creditsBeforeTrade - tradeQuantity*price)
  }

  test_tradeInOrbit_sell_selectedValue() {
    const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","pilot","createCommander","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePirates","ignorePolice","Warp","cargo_WaterBuy_1","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","warpBlastOff","ecButton_Submit","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Trade","alertButton_Selected"],"eventNameLog":["slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","click","click","click","change","change","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734497194511}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const creditsBeforeTrade = commander.credits

    const alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

    // Disable automatically purchasing fuel since there's no opportunity
    // to check credits after trade but before arrival in this situation
    stG.viewController._game.autoFuel = false
    stG.viewController._game.autoRepairs = false

    replay.replayEvent("alertButton_Dismiss", "click")

    const tradeQuantity = 1
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 3-tradeQuantity)

    assertEqual(commander.credits, creditsBeforeTrade + tradeQuantity*280)
  }

  test_tradeInOrbit_actionLogCanUpdateSlider() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","cheat_freeMoney","Warp","cargo_WaterBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Trade","tradeslider","alertButton_Selected"],"eventNameLog":["click","click","change","change","click","click","click","click","click","click","click","click","click","slider|input|8","click"],"gameRandSeed":1734494396218}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const creditsBeforeTrade = commander.credits

    const alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

    // Disable automatically purchasing fuel since there's no opportunity
    // to check credits after trade but before arrival in this situation
    stG.viewController._game.autoFuel = false

    replay.replayEvent("alertButton_Dismiss", "click")

    const tradeQuantity = 8
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Ore), tradeQuantity)

    assertEqual(commander.credits, creditsBeforeTrade - tradeQuantity*350)
  }

  test_tradeInOrbit_sell_all() {
    const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","pilot","createCommander","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePirates","ignorePolice","Warp","cargo_WaterBuy_1","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","warpBlastOff","ecButton_Submit","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Trade","alertButton_All"],"eventNameLog":["slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","click","click","click","change","change","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734497194511}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const creditsBeforeTrade = commander.credits

    const alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "Thanks for the trade!")

    // Disable automatically purchasing fuel since there's no opportunity
    // to check credits after trade but before arrival in this situation
    stG.viewController._game.autoFuel = false

    replay.replayEvent("alertButton_Dismiss", "click")

    const tradeQuantity = 3
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 3-tradeQuantity)

    assertEqual(commander.credits, creditsBeforeTrade + tradeQuantity*280)
  }

  test_tradeInOrbit_sell_none() {
    const replayLog = `{"idLog":["pilot","pilot","pilot","pilot","pilot","createCommander","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePirates","ignorePolice","Warp","cargo_WaterBuy_1","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","warpBlastOff","ecButton_Submit","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Trade","alertButton_None"],"eventNameLog":["slider|input|6","slider|input|7","slider|input|8","slider|input|9","slider|input|10","click","click","click","change","change","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734497194511}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const creditsBeforeTrade = commander.credits

    // Disable automatically purchasing fuel since there's no opportunity
    // to check credits after trade but before arrival in this situation
    stG.viewController._game.autoFuel = false
    stG.viewController._game.autoRepairs = false

    const tradeQuantity = 0
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 3-tradeQuantity)

    assertEqual(commander.credits, creditsBeforeTrade)
    const alertTitleEl = document.getElementById("ssstalertvc-title")
    assertTrue(!alertTitleEl, "no alert showing")
  }

  test_destroy_pirate_bounty_bug() {
    const replayLog = `{"idLog":["createCommander","namedEvent","cheat_freeMoney","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","Commander","ignoreTradeInOrbit","ignoreTraders","ignorePolice","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","namedEvent","warpBlastOff","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Attack","ecButton_Auto_Attack","ecButton_Plunder","cargo_WaterPlunder_1","alertButton__Plunder_plunderDone","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","namedEvent","warpBlastOff","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Attack","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Attack","ecButton_Auto_Attack","alertButton_Dismiss","alertButton_Dismiss","namedEvent","warpBlastOff","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Auto_Attack"],"eventNameLog":["click","selectPlanetZoomed|Vadera","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","change","click","change","change","click","click","selectPlanetZoomed|Courteney","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Exo","selectPlanetZoomed|Penthara","click","click","click","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Zalkon","click","click","selectPlanetZoomed|Odet","click","click"],"gameRandSeed":1733023531445}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You earned a bounty of $350.")
  }

  test_destroy_pirate_pick_up_canister() {
    const replayLog = `{"idLog":["createCommander","namedEvent","cheat_freeMoney","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePolice","ignoreTraders","ignoreTradeInOrbit","Warp"],"eventNameLog":["click","selectPlanetZoomed|Vadera","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","change","change","change","click"],"gameRandSeed":1733023531445}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.pirateKills, 0)

    replay.replayEvent("namedEvent", "selectPlanetZoomed|Ligon")
    replay.replayEvent("warpBlastOff", "click")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("alertButton_Dismiss", "click")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    const policeRecordBefore = commander.policeRecordScore
    const reputationBefore = commander.reputationScore

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 12 clicks from Capelle you encounter a pirate Hornet.<br><br>Your opponent attacks.")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    // Offer to plunder
    replay.replayEvent("ecButton_Auto_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You earned a bounty of $650.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(commander.policeRecordScore, policeRecordBefore+KILL_PIRATE_SCORE)

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 8 clicks from Capelle you encounter a pirate Bumblebee.<br><br>Your opponent attacks.")


    replay.replayEvent("ecButton_Auto_Attack", "click")
    // Offer to plunder
    replay.replayEvent("ecButton_Auto_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You earned a bounty of $600.")
    replay.replayEvent("alertButton_Dismiss", "click")

    const before = commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs)
    let alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "A canister from the destroyed ship, labelled Furs, drifts within range of your scoops.")

    replay.replayEvent("alertButton_Pick_it_up_", "click")

    const after = commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs)
    assertEqual(before+1, after)

    assertEqual(commander.policeRecordScore, policeRecordBefore+2*KILL_PIRATE_SCORE)
    assertEqual(commander.pirateKills, 2)
    assertEqual(commander.reputationScore, reputationBefore + 1 + Math.floor(SSSTShipModelType.Hornet/2) + 1 + Math.floor(SSSTShipModelType.Bumblebee/2))

    replay.replayEvent("alertButton_Dismiss", "click")

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Capelle")
  }

  test_destroy_pirate_let_go_canister() {
    const replayLog = `{"idLog":["createCommander","namedEvent","cheat_freeMoney","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Commander","ignorePolice","ignoreTraders","ignoreTradeInOrbit","Warp"],"eventNameLog":["click","selectPlanetZoomed|Vadera","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","change","change","change","click"],"gameRandSeed":1733023531445}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const commander = stG.viewController._game.commander

    assertEqual(commander.pirateKills, 0)

    replay.replayEvent("namedEvent", "selectPlanetZoomed|Ligon")
    replay.replayEvent("warpBlastOff", "click")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    replay.replayEvent("alertButton_Dismiss", "click")
    replay.replayEvent("alertButton_Dismiss", "click")


    replay.replayEvent("Warp", "click")
    replay.replayEvent("warpBlastOff", "click")

    const policeRecordBefore = commander.policeRecordScore
    const reputationBefore = commander.reputationScore

    let encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 12 clicks from Capelle you encounter a pirate Hornet.<br><br>Your opponent attacks.")

    replay.replayEvent("ecButton_Auto_Attack", "click")
    // Offer to plunder
    replay.replayEvent("ecButton_Auto_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You earned a bounty of $650.")
    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(commander.policeRecordScore, policeRecordBefore+KILL_PIRATE_SCORE)

    encounterText = document.getElementById('eVC_dialog').innerHTML
    assertEqual(encounterText, "At 8 clicks from Capelle you encounter a pirate Bumblebee.<br><br>Your opponent attacks.")


    replay.replayEvent("ecButton_Auto_Attack", "click")
    // Offer to plunder
    replay.replayEvent("ecButton_Auto_Attack", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You earned a bounty of $600.")
    replay.replayEvent("alertButton_Dismiss", "click")

    const before = commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs)
    let alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "A canister from the destroyed ship, labelled Furs, drifts within range of your scoops.")

    replay.replayEvent("alertButton_Let_it_go", "click")

    const after = commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs)
    assertEqual(before, after)

    assertEqual(commander.policeRecordScore, policeRecordBefore+2*KILL_PIRATE_SCORE)
    assertEqual(commander.pirateKills, 2)
    assertEqual(commander.reputationScore, reputationBefore + 1 + Math.floor(SSSTShipModelType.Hornet/2) + 1 + Math.floor(SSSTShipModelType.Bumblebee/2))

    replay.replayEvent("alertButton_Dismiss", "click")

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Capelle")
  }

  test_plunder_dump_litter_nevermind() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","galacticChart_track_121_Andevian","galacticChart_track_121_Andevian","galacticChart_useSingularity_121_Andevian","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Commander","ignorePolice","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669532436}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const game = stG.viewController._game

    assertEqual(game.commander.litterWarning, false)
    replay.replayEvent("ecButton_Plunder", "click")
    replay.replayEvent("cargo_FursPlunder_1", "click")

    // Erase police record so we get warned about littering
    game.commander.policeRecordScore = SSSTPoliceRecordScore.Clean;

    replay.replayEvent("alertButton__Plunder_plunderDump_some_cargo", "click")
    replay.replayEvent("cargo_FursDump_1", "click")

    let alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "Dumping cargo in space is considered littering. If the police track your dumped goods to you it will be reflected on your criminal record. Do you really wish to dump?")

    assertEqual(game.commander.litterWarning, true)

    replay.replayEvent("alertButton_Nevermind_", "click")
    replay.replayEvent("alertButton__Plunder_dumpResume_plundering", "click")
    replay.replayEvent("alertButton__Plunder_plunderDone", "click")


    assertEqual(game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 1)
  }

  test_plunder_dump_litter_yes() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","galacticChart_track_121_Andevian","galacticChart_track_121_Andevian","galacticChart_useSingularity_121_Andevian","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Commander","ignorePolice","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669532436}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const game = stG.viewController._game
    const commander = game.commander

    replay.replayEvent("ecButton_Plunder", "click")

    // Erase police record so we get warned about littering
    game.commander.policeRecordScore = SSSTPoliceRecordScore.Clean;

    let customViewEl = document.getElementById("ssstalertvc-customView-Plunder_plunder")
    assertTrue(customViewEl.innerHTML.includes(`Furs</span></td><td class="right-aligned-cell">5</td>`), "HTML shows 5 furs")

    replay.replayEvent("cargo_FursPlunder_1", "click")

    customViewEl = document.getElementById("ssstalertvc-customView-Plunder_plunder")
    assertTrue(customViewEl.innerHTML.includes(`Furs</span></td><td class="right-aligned-cell">4</td>`), "HTML shows 4 furs")

    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 1)

    replay.replayEvent("alertButton__Plunder_plunderDump_some_cargo", "click")

    assertEqual(commander.litterWarning, false)

    game.difficulty = 10 // force us to lose the die roll about getting caught littering by the police

    replay.replayEvent("cargo_FursDump_1", "click")

    let alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "Dumping cargo in space is considered littering. If the police track your dumped goods to you it will be reflected on your criminal record. Do you really wish to dump?")

    assertEqual(commander.litterWarning, true)

    replay.replayEvent("alertButton_Yes__I_still_want_to", "click")


    customViewEl = document.getElementById("ssstalertvc-customView-Plunder_dump")
    assertTrue(customViewEl.innerHTML.includes(`Furs</span></td><td class="right-aligned-cell">0</td>`), "HTML updated to show 0 furs")


    replay.replayEvent("alertButton__Plunder_dumpResume_plundering", "click")
    replay.replayEvent("alertButton__Plunder_plunderDone", "click")


    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 0)

    assertEqual(game.breakingNews[0], `Police Trace Orbiting Space Litter to ${commander.name}.`)
  }

  test_plunder_keep() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","galacticChart_track_121_Andevian","galacticChart_track_121_Andevian","galacticChart_useSingularity_121_Andevian","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Commander","ignorePolice","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack","alertButton_Dismiss","alertButton_Dismiss","Warp","warpBlastOff","ecButton_Attack","ecButton_Attack","ecButton_Attack","ecButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669532436}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const game = stG.viewController._game
    const commander = game.commander

    replay.replayEvent("ecButton_Plunder", "click")

    // Erase police record so we get warned about littering
    game.commander.policeRecordScore = SSSTPoliceRecordScore.Clean;

    let customViewEl = document.getElementById("ssstalertvc-customView-Plunder_plunder")
    assertTrue(customViewEl.innerHTML.includes(`Furs</span></td><td class="right-aligned-cell">5</td>`), "HTML shows 5 furs")

    replay.replayEvent("cargo_FursPlunder_1", "click")

    customViewEl = document.getElementById("ssstalertvc-customView-Plunder_plunder")
    assertTrue(customViewEl.innerHTML.includes(`Furs</span></td><td class="right-aligned-cell">4</td>`), "HTML shows 4 furs")

    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 1)

    replay.replayEvent("alertButton__Plunder_plunderDone", "click")

    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 1)
  }

  test_surrender_pirate_noCargo() {
    const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Surrender"],"eventNameLog":["click","click","click","click"],"gameRandSeed":1734497580510}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const netWorthBefore = commander.netWorth()
    replay.replayEvent("ecButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The pirates are upset that they found no cargo on your ship. To save yourself, you have no choice but to pay them 5% of your current net worth.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(commander.netWorth(), netWorthBefore - Math.max(500, Math.floor(netWorthBefore/20)))
  }

  test_surrender_pirate_cargo() {
    const replayLog = `{"idLog":["createCommander","Buy","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_OreBuy_1","cargo_OreBuy_1","cargo_FoodBuy_1","Commander","Chart","Warp","warpBlastOff"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732440726896}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const creditsBefore = commander.credits
    replay.replayEvent("ecButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "The pirates board your ship and transfer as much of your cargo to their own ship as their cargo bays can hold.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(commander.credits, creditsBefore)
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Water), 0)
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 0)
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Food), 0)
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Ore), 0)
  }

  test_surrender_police() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Bank","Buy_Insurance_Policy","alertButton_Dismiss","Ship Yard","buy_escape_pod","alertButton_Yes","Bank","Buy_Insurance_Policy","Warp","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","Ship Yard","fulltank","Warp","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734514049593}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(game.commander.hasInsurance, true)

    let game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.hasInsurance, true)

    const creditsBefore = game.commander.credits
    replay.replayEvent("ecButton_Surrender", "click")
    replay.replayEvent("alertButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $332000.\nSince you can't pay your insurance while you're in prison, your insurance contract has been voided.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(game.commander.credits, creditsBefore-332000)
    assertEqual(game.commander.hasInsurance, false)

    game2 = this._serializeAndDeserialize(game)
    assertEqualGames(game, game2)
    assertEqual(game2.commander.credits, creditsBefore-332000)
    assertEqual(game2.commander.hasInsurance, false)

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Rutia")
  }

  test_surrender_police_cantAffordFine() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Bank","Buy_Insurance_Policy","alertButton_Dismiss","Ship Yard","buy_escape_pod","alertButton_Yes","Bank","Buy_Insurance_Policy","Warp","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","alertButton_Dismiss","Warp","fulltank","cargo_WaterBuy_1","cargo_WaterBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FursBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734514049593}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    // Make it so we can't afford fine
    commander.credits = 100

    const creditsBefore = commander.credits
    replay.replayEvent("ecButton_Surrender", "click")
    replay.replayEvent("alertButton_Surrender", "click")

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to 33 days in prison and a fine of $3000.\nSince you can't pay your insurance while you're in prison, your insurance contract has been voided.\nTo pay your fine, your ship had to be sold at auction. The police have given you a second-hand Flea so you can continue your travels.")

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(commander.credits, 5958)
    assertEqual(commander.hasInsurance, false)

    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Water), 2)
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 3)
    assertEqual(commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Food), 4)

    assertEqual(commander.ship.gadgets.length, 0)

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Rutia")
  }

  test_insurance() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Ship Yard","buy_escape_pod","alertButton_Yes","Bank","Buy_Insurance_Policy","Warp","warpBlastOff","ecButton_Auto_Attack","alertButton_Attack","ecButton_Auto_Attack","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734745362815}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    assertEqual(SSSTAlertViewController.currentAlertTitle(), `Since your ship was insured, the bank pays you $7374, the total value of the destroyed ship.`);

    replay.replayEvent("alertButton_Dismiss")
    replay.replayEvent("alertButton_Dismiss")

    // starting credits - escape pod cost - 1 day of insurance cost + insurance reward - cost of converting escape pod to flea
    assertEqual(game.commander.credits, 1000000 - 2000 - 18 + 7374 - 500)
  }

  test_escapePod_debt() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Ship Yard","buy_escape_pod","alertButton_Yes","Bank","Warp","warpBlastOff","ecButton_Auto_Attack","alertButton_Attack"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734745362815}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    game.commander.credits = 5

    replay.replayEvent("ecButton_Auto_Attack")
    replay.replayEvent("alertButton_Dismiss")
    replay.replayEvent("alertButton_Dismiss")

    assertEqual(game.commander.credits, 0)
    assertEqual(game.commander.debt, 500 - 5)
  }

  test_systemLanding_showForHire() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","autoFuelCheckbox","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","Warp","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Bumblebee","alertButton_Yes"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Triacus","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734496062815}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    const tableRows = slvc._tableRows()
    assertEqual(tableRows.includes("For Hire"), true)
  }

  test_systemLanding_hideForHire() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","cheat_freeMoney","autoFuelCheckbox","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","Warp","namedEvent","warpBlastOff","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Ship Yard","buyship_Bumblebee","alertButton_Yes"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","selectPlanetZoomed|Triacus","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734496062815}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    replay.replayEvent("Warp")
    replay.replayEvent("warpBlastOff")

    this._replaySkipEncounters(replay)

    const tableRows = slvc._tableRows()
    assertEqual(tableRows.includes("For Hire"), false)
  }

  test_galaxyView_selectWarpTarget() {
    const replayLog = `{"idLog":["createCommander","Chart","namedEvent","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanet|Mintaka","click","selectPlanetZoomed|Deneb"],"gameRandSeed":1729657624152}`

    const replay = this._runReplayLog(replayLog)

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Deneb")
  }

  test_galaxyView_selectWarpTarget_multipleTimes() {
    const replayLog = `{"idLog":["createCommander","Chart","namedEvent","Warp","namedEvent","namedEvent","namedEvent","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Mintaka","click","selectPlanetZoomed|Deneb","selectPlanetZoomed|Campor","selectPlanetZoomed|Thera","selectPlanetZoomed|Penthara"],"gameRandSeed":1729657624152}`

    const replay = this._runReplayLog(replayLog)

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Penthara")
  }

  test_galaxyView_systemLanding_selectWarpTarget() {
    const replayLog = `{"idLog":["createCommander","namedEvent"],"eventNameLog":["click","selectPlanetZoomed|Acamar"],"gameRandSeed":1730259230075}`

    const replay = this._runReplayLog(replayLog)

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Acamar")

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController
    assertEqual(slvc._galaxyViewSystem.name, "Acamar")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Acamar")
    assertTrue(document.getElementById("Warp").classList.contains("active"))
  }

  test_galaxyView_systemLanding_showsSystemInfo() {
    const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734670179065}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Helena")
    let systemInfoEl = document.getElementById('system-info-text')
    assertEqual(systemInfoEl.innerText, "small post-industrial dictatorship\nravaged by a plague\nnothing special, moderate police, many pirates")

    let galaxyInfoEl = document.getElementById('gv-system-info')
    assertTrue(!galaxyInfoEl, "no galaxy info")


    replay.replayEvent("namedEvent", "selectPlanetZoomed|Xerxes")

    systemInfoEl = document.getElementById('system-info-text')
    assertTrue(!systemInfoEl, "system info el disappeared")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "small early industrial confederacy\nunder no particular pressure\nspecial herbs, moderate police, some pirates")


    replay.replayEvent("namedEvent", "selectPlanetZoomed|Ligon")
    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "system details unknown")
  }

  test_galaxyView_systemLanding_showsSystemInfo_warpTab() {
    const replayLog = `{"idLog":["difficultySelect","createCommander","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","fulltank"],"eventNameLog":["select|change|1","click","click","selectPlanetZoomed|Castor","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734668502562}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    let galaxyInfoEl = document.getElementById('gv-system-info')
    assertTrue(!galaxyInfoEl, "no galaxy info")

    const systemInfoEl = document.getElementById('system-info-text')
    assertTrue(!systemInfoEl, "system info el disappeared")

    replay.replayEvent("Warp", "click")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "system details unknown")

    replay.replayEvent("warpPrev", "click")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "system details unknown")


    replay.replayEvent("warpPrev", "click")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "small renaissance feudal state\nunder no particular pressure\nwarlike populace, minimal police, abundant pirates")
  }

  test_galaxyView_systemLanding_showsSystemInfo_warpTab_lowFuel() {
    const replayLog = `{"idLog":["difficultySelect","createCommander","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["select|change|1","click","click","selectPlanetZoomed|Castor","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734668502562}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    replay.replayEvent("Warp", "click")

    let galaxyInfoEl = document.getElementById('gv-system-info')
    assertTrue(!galaxyInfoEl, "no galaxy info")

    const systemInfoEl = document.getElementById('system-info-text')
    assertTrue(!systemInfoEl, "system info el disappeared")

    replay.replayEvent("fulltank", "click")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "system details unknown")

    replay.replayEvent("warpNext", "click")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "small renaissance feudal state\nunder no particular pressure\nwarlike populace, minimal police, abundant pirates")

    replay.replayEvent("warpNext", "click")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "system details unknown")


    replay.replayEvent("warpNext", "click")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "system details unknown")


    replay.replayEvent("warpNext", "click")

    galaxyInfoEl = document.getElementById('gv-system-info')
    assertEqual(galaxyInfoEl.innerText, "small renaissance feudal state\nunder no particular pressure\nwarlike populace, minimal police, abundant pirates")
  }

  test_galaxyView_systemLanding_showsSystemInfo_warpTab_lowFuel_buyFromShipYard() {
    const replayLog = `{"idLog":["difficultySelect","createCommander","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["select|change|1","click","click","selectPlanetZoomed|Castor","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734668502562}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    replay.replayEvent("Warp", "click")

    let galaxyInfoEl = document.getElementById('gv-system-info')
    assertTrue(!galaxyInfoEl, "no galaxy info")

    const systemInfoEl = document.getElementById('system-info-text')
    assertTrue(!systemInfoEl, "system info el disappeared")

    assertEqual(slvc._galaxyView.selectedSystem.name, "Castor")

    replay.replayEvent("Ship Yard", "click")

    replay.replayEvent("fulltank", "click")

    replay.replayEvent("Warp", "click")

    assertEqual(slvc._galaxyView.selectedSystem.name, "Cestus")
  }

  test_galaxyView_systemLanding_selectSecondWarpTarget() {
    const replayLog = `{"idLog":["createCommander","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Acamar"],"gameRandSeed":1730277200899}`

    const replay = this._runReplayLog(replayLog)

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Acamar")

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController
    assertEqual(slvc._galaxyViewSystem.name, "Acamar")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Acamar")
    assertTrue(document.getElementById("Warp").classList.contains("active"))
  }

  test_galaxyView_systemLanding_cycleAllWarpSystems_includingWormhole_next() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Chart","cheat_freeSingularity","Ship Yard","Chart","namedEvent","galacticChart_useSingularity_1_Campor","alertButton_Warp_","ecButton_Ignore","alertButton_Dismiss","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Warp"],"eventNameLog":["click","click","change","change","click","click","click","click","selectPlanet|Campor","click","click","click","click","selectPlanetZoomed|Styris","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734686840048}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Mordan")
    assertEqual(slvc._galaxyViewSystem.name, "Styris")
    assertEqual(slvc._galaxyViewWormhole, true)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Styris")
    assertEqual(slvc._galaxyView.selectedWormhole, true)
    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Mordan")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, true)


    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Campor")
    assertEqual(slvc._galaxyViewSystem.name, "Campor")
    assertEqual(slvc._galaxyViewWormhole, false)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Campor")
    assertEqual(slvc._galaxyView.selectedWormhole, false)
    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Campor")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, false)


    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Hulst")
    assertEqual(slvc._galaxyViewSystem.name, "Hulst")
    assertEqual(slvc._galaxyViewWormhole, false)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Hulst")
    assertEqual(slvc._galaxyView.selectedWormhole, false)
    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Hulst")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, false)


    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Melina")
    assertEqual(slvc._galaxyViewSystem.name, "Melina")
    assertEqual(slvc._galaxyViewWormhole, false)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Melina")
    assertEqual(slvc._galaxyView.selectedWormhole, false)
    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Melina")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, false)


    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Rhymus")
    assertEqual(slvc._galaxyViewSystem.name, "Rhymus")
    assertEqual(slvc._galaxyViewWormhole, false)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Rhymus")
    assertEqual(slvc._galaxyView.selectedWormhole, false)
    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Rhymus")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, false)


    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Sigma")
    assertEqual(slvc._galaxyViewSystem.name, "Sigma")
    assertEqual(slvc._galaxyViewWormhole, false)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Sigma")
    assertEqual(slvc._galaxyView.selectedWormhole, false)
    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Sigma")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, false)


    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Thera")
    assertEqual(slvc._galaxyViewSystem.name, "Thera")
    assertEqual(slvc._galaxyViewWormhole, false)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Thera")
    assertEqual(slvc._galaxyView.selectedWormhole, false)
    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Thera")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, false)


    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Mordan")
    assertEqual(slvc._galaxyViewSystem.name, "Styris")
    assertEqual(slvc._galaxyViewWormhole, true)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Styris")
    assertEqual(slvc._galaxyView.selectedWormhole, true)
    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Mordan")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, true)
  }

  test_galaxyView_systemLanding_cycleAllWarpSystems_next() {
    const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1730277328255}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Vadera")

    assertEqual(slvc._galaxyViewSystem.name, "Vadera")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Vadera")

    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Courteney")
    assertEqual(slvc._galaxyViewSystem.name, "Courteney")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Courteney")

    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Hulst")
    assertEqual(slvc._galaxyViewSystem.name, "Hulst")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Hulst")

    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Vadera")
    assertEqual(slvc._galaxyViewSystem.name, "Vadera")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Vadera")

    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Courteney")
    assertEqual(slvc._galaxyViewSystem.name, "Courteney")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Courteney")

    replay.replayEvent("warpPrev", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Vadera")
    assertEqual(slvc._galaxyViewSystem.name, "Vadera")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Vadera")
  }

  test_galaxyView_systemLanding_cycleAllWarpSystems_prev() {
    const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1730277328255}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Vadera")

    assertEqual(slvc._galaxyViewSystem.name, "Vadera")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Vadera")

    replay.replayEvent("warpPrev", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Hulst")
    assertEqual(slvc._galaxyViewSystem.name, "Hulst")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Hulst")

    replay.replayEvent("warpPrev", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Courteney")
    assertEqual(slvc._galaxyViewSystem.name, "Courteney")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Courteney")

    replay.replayEvent("warpPrev", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Vadera")
    assertEqual(slvc._galaxyViewSystem.name, "Vadera")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Vadera")

    replay.replayEvent("warpPrev", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Hulst")
    assertEqual(slvc._galaxyViewSystem.name, "Hulst")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Hulst")

    replay.replayEvent("warpNext", "click")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Vadera")
    assertEqual(slvc._galaxyViewSystem.name, "Vadera")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Vadera")
  }

  test_galaxyView_systemLanding_selectWarpTarget_outOfRange() {
    const replayLog = `{"idLog":["createCommander","namedEvent"],"eventNameLog":["click","selectPlanetZoomed|Tantalos"],"gameRandSeed":1730259708834}`

    const replay = this._runReplayLog(replayLog)

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton, null)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController
    assertEqual(slvc._galaxyViewSystem.name, "Tantalos")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Tantalos")
    assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")
    assertEqual(document.getElementById("warpMessage").textContent, "Out of range.")
  }

  test_galaxyView_systemLanding_selectWarpTarget_wormhole_outOfRange() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Chart","cheat_freeSingularity","Ship Yard","Chart","namedEvent","galacticChart_useSingularity_1_Campor","alertButton_Warp_","ecButton_Ignore","alertButton_Dismiss","namedEvent"],"eventNameLog":["click","click","change","change","click","click","click","click","selectPlanet|Campor","click","click","click","click","selectPlanetZoomed|Styris~wormhole"],"gameRandSeed":1734686840048}`

    const replay = this._runReplayLog(replayLog)

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton, null)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController
    assertEqual(slvc._galaxyViewSystem.name, "Styris")
    assertEqual(slvc._galaxyViewWormhole, true)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Styris")
    assertEqual(slvc._galaxyView.selectedWormhole, true)
    assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")
    assertEqual(document.getElementById("warpMessage").textContent, "Out of range.")

    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Mordan")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, true)
  }

  test_galaxyView_systemLanding_selectWarpTarget_wormholeParent_inRange() {
    const replayLog = `{"idLog":["createCommander","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Chart","cheat_freeSingularity","Ship Yard","Chart","namedEvent","galacticChart_useSingularity_1_Campor","alertButton_Warp_","ecButton_Ignore","alertButton_Dismiss","namedEvent"],"eventNameLog":["click","click","change","change","click","click","click","click","selectPlanet|Campor","click","click","click","click","selectPlanetZoomed|Styris"],"gameRandSeed":1734686840048}`
    const replay = this._runReplayLog(replayLog)

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Styris")

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController
    assertEqual(slvc._galaxyViewSystem.name, "Styris")
    assertEqual(slvc._galaxyViewWormhole, false)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Styris")
    assertEqual(slvc._galaxyView.selectedWormhole, false)
    assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")

    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Styris")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, false)
  }

  test_galaxyView_systemLanding_selectWarpTarget_noSystemsInRange_buyFuel() {
    const replayLog = `{"idLog":["difficultySelect","createCommander","Warp","namedEvent","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["select|change|1","click","click","selectPlanetZoomed|Castor","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734668502562}`

    const replay = this._runReplayLog(replayLog)

    replay.replayEvent("Warp", "click")

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton, null)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController
    assertEqual(slvc._galaxyViewSystem, null)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Castor")
    assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")
    assertEqual(document.getElementById("warpMessage").textContent, "No systems within range Fill tank for $14")

    replay.replayEvent("fulltank", "click")

    assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")

    warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Cestus")

    assertEqual(slvc._galaxyViewSystem.name, "Cestus")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Cestus")
  }

  test_galaxyView_systemLanding_chart_selectingInEitherWorks() {
    const replayLog = `{"idLog":["createCommander","Chart","namedEvent"],"eventNameLog":["click","click","selectPlanet|Yojimbo"],"gameRandSeed":1730276042104}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    assertTrue(document.documentElement.outerHTML.includes(`Selected System</th></tr><tr><td><b>Yojimbo`), "Yojimbo is selected")

    assertTrue(document.getElementById("Chart").classList.contains("active"), "chart is active")
    assertTrue(!document.getElementById("Warp").classList.contains("active"), "warp is not active")

    replay.replayEvent("namedEvent", "selectPlanetZoomed|Kira")

    assertTrue(!document.getElementById("Chart").classList.contains("active"), "chart is not active")
    assertTrue(document.getElementById("Warp").classList.contains("active"), "warp is active")

    let warpButton = document.getElementById("warpBlastOff")
    assertEqual(warpButton.innerText, "Blast Off to Kira")

    assertEqual(slvc._galaxyViewSystem.name, "Kira")
    assertEqual(slvc._galaxyView.selectedSystem.name, "Kira")
  }

  test_galaxyView_systemLanding_chart_selectingWormhole() {
    const replayLog = `{"idLog":["createCommander","Chart","namedEvent"],"eventNameLog":["click","click","selectPlanet|Utopia~wormhole"],"gameRandSeed":1734687673579}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    assertTrue(document.documentElement.outerHTML.includes(`Selected System</th></tr><tr><td><b>Pollux`), "Pollux is selected")

    assertTrue(document.getElementById("Chart").classList.contains("active"), "chart is active")
    assertTrue(!document.getElementById("Warp").classList.contains("active"), "warp is not active")

    const chartGalaxyView = actionLog._namedEvents["selectPlanet"]
    // Force initialization of all the planets
    chartGalaxyView.drawGalaxy(0)
    assertEqual(chartGalaxyView.selectedPlanet.solarSystem.name, "Pollux")
    assertEqual(chartGalaxyView.selectedPlanet.isWormhole, true)
  }

  test_galaxyView_systemLanding_nonwormhole() {
    const replayLog = `{"idLog":["createCommander","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Kira"],"gameRandSeed":1730277328255}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController


    assertEqual(slvc._galaxyViewSystem.name, "Kira")
    assertEqual(slvc._galaxyViewWormhole, false)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Kira")
    assertEqual(slvc._galaxyView.selectedWormhole, false)

    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Kira")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, false)
  }

  test_galaxyView_systemLanding_wormhole_kira() {
    const replayLog = `{"idLog":["createCommander","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Yew~wormhole"],"gameRandSeed":1730277328255}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    assertEqual(slvc._galaxyViewSystem.name, "Yew")
    assertEqual(slvc._galaxyViewWormhole, true)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Yew")
    assertEqual(slvc._galaxyView.selectedWormhole, true)

    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Kira")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, true)
  }

  test_galaxyView_systemLanding_wormhole() {
    const replayLog = `{"idLog":["createCommander","Warp","namedEvent"],"eventNameLog":["click","click","selectPlanetZoomed|Kira~wormhole"],"gameRandSeed":1730277328255}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController

    assertEqual(slvc._galaxyViewSystem.name, "Kira")
    assertEqual(slvc._galaxyViewWormhole, true)
    assertEqual(slvc._galaxyView.selectedSystem.name, "Kira")
    assertEqual(slvc._galaxyView.selectedWormhole, true)

    // Force initialization of all the planets
    slvc._galaxyView.drawGalaxy(0)
    assertEqual(slvc._galaxyView.selectedPlanet.solarSystem.name, "Lave")
    assertEqual(slvc._galaxyView.selectedPlanet.isWormhole, true)
  }

  test_useSingularity() {
    const replayLog = `{"idLog":["createCommander","Chart","cheat_freeSingularity","Chart","galacticChart_useSingularity_121_Othello","alertButton_Not_now","galacticChart_useSingularity_121_Othello","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1732588693057}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const slvc = stG.viewController._systemLandingViewController
    const game = stG.viewController._game

    assertEqual(game.canSuperWarp, false)

    const systemInfoHeader = document.getElementById('system-info-welcome')
    assertEqual(systemInfoHeader.innerText, "Welcome to Othello")
  }

  test_policeSummon_nothingIllegal_submit() {
    const replayLog = `{"idLog":["createCommander","Warp","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","fulltank","autoFuelCheckbox","Full_repair","autoRepairCheckbox","Warp","warpBlastOff","ecButton_Ignore","ecButton_Submit"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","click","change","click","click","click","click"],"gameRandSeed":1734686605552}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander


    const alertTitleEl = document.getElementById("ssstalertvc-title")
    assertEqual(alertTitleEl.innerText, "The police find nothing illegal in your cargo holds and apologize for the inconvenience.")


    const origCredits = commander.credits

    replay.replayEvent("alertButton_Dismiss", "click")

    assertEqual(origCredits, commander.credits)
  }

  test_policeSummon_bribe() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","Warp","cargo_FirearmsBuy_1","warpBlastOff","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Attack","alertButton_Attack","ecButton_Auto_Flee","alertButton_Dismiss","alertButton_Dismiss","Warp","warpBlastOff"],"eventNameLog":["click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669204790}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const commander = stG.viewController._game.commander

    const origCredits = commander.credits

    replay.replayEvent("ecButton_Bribe", "click")
    replay.replayEvent("alertButton_Offer_bribe", "click")

    assertEqual(origCredits - 8400, commander.credits)
    assertTrue(!isNaN(commander.debt), "debt is not NaN")
  }

  test_difficultySelect_replay() {
    const replayLog = `{"idLog":["difficultySelect","engineer"],"eventNameLog":["select|change|1","slider|input|6"],"gameRandSeed":1732270077642}`

    const replay = this._runReplayLog(replayLog)

    assertEqual(document.getElementById("difficultySelect").value, "Easy")

    replay.replayEvent("difficultySelect", "select|change|3")

    assertEqual(document.getElementById("difficultySelect").value, "Hard")
  }

// Saving/Loading tests

  test_saveLoad() {
    const gameDiv = document.getElementById("game")
    let vc = new SSSTViewController(gameDiv, true)

    const randSeed = Date.now()
    gameRand = new MAGameRand(randSeed)
    actionLog = new SSSTActionLogger(randSeed)

    const mockLS = new SSSTMockLocalStorage()

    vc._localStorage = mockLS

    vc.presentView()

    assertEqual(mockLS.getItem('games'), null)
    assertEqual(mockLS.getItem('highScoringGames'), null)

    SSSTActionLogReplay.replayEvent("createCommander", "click")

    // After creating a game, one is saved. No high scoring games are saved.
    let saveGames = JSON.parse(mockLS.getItem('games')) || {}
    assertEqual(Object.keys(saveGames).length, 1)
    assertEqual(mockLS.getItem('highScoringGames'), null)

    // Check that the saved game looks valid
    const gameUniqueID = Object.keys(saveGames)[0]
    MAUtils.ensureType(gameUniqueID, "string")

    const sg = SSSTGame.fromSerializedState(saveGames[gameUniqueID])
    assertEqual(sg.commander.name, "Jean-Luc")
    assertEqual(sg.endStatus, SSSTGameEndStatus.None)

    // Clear out the old instance
    vc = null
    gameDiv.innerHTML = ''

    // Create a new VC and see that it loads the game
    vc = new SSSTViewController(gameDiv, true)
    vc._localStorage = mockLS

    vc.presentView()

    assertEqual(vc._game.uniqueID, gameUniqueID)
    assertEqual(vc._game.commander.name, "Jean-Luc")

    // End the game, check that the game moves to the high scoring list and no longer appears in the in progress list
    SSSTActionLogReplay.replayEvent("Commander", "click")
    SSSTActionLogReplay.replayEvent("giveup", "click")
    SSSTActionLogReplay.replayEvent("alertButton_Abandon_game", "click")

    saveGames = JSON.parse(mockLS.getItem('games')) || {}
    assertEqual(Object.keys(saveGames).length, 0)

    let highScoreGames = JSON.parse(mockLS.getItem('highScoringGames')) || {}
    assertEqual(Object.keys(highScoreGames).length, 1)

    // Check that the saved high score game looks valid
    const sg2 = SSSTGame.fromSerializedState(highScoreGames[gameUniqueID])
    assertEqual(sg2.commander.name, "Jean-Luc")
    assertEqual(sg2.endStatus, SSSTGameEndStatus.Retired)
  }

  _serializeAndDeserialize(game) {
    const gsJSONStr = JSON.stringify(game.serializedState())
    const gs = JSON.parse(gsJSONStr)

    const game2 = SSSTGame.fromSerializedState(gs)

    return game2
  }

  test_serializationDeserialization_newGame() {
    const replayLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1732421539025}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const game = stG.viewController._game

    let game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)

    // Spot check some properties
    assertEqual(game2.difficulty, SSSTDifficulty.Normal)
    assertEqual(game2.commander.credits, 1000)


    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")


    // Mercenary
    const kira2 = game2.solarSystems.find(x => x.name === "Kira")
    const crystal2 = kira2.mercenary
    assertEqual(crystal2.name, "Crystal")
    assertEqual(crystal2.pilot, 5)
    assertEqual(crystal2.fighter, 4)
    assertEqual(crystal2.trader, 5)
    assertEqual(crystal2.engineer, 3)


    const kira = game.solarSystems.find(x => x.name === "Kira")
    const crystal = kira.mercenary
    game.commander.ship.addCrewMember(crystal)

    game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)

    const kira2b = game2.solarSystems.find(x => x.name === "Kira")
    const crystal2b = kira2b.mercenary
    assertEqual(crystal2b.name, "Crystal")
    assertEqual(crystal2b.pilot, 5)
    assertEqual(crystal2b.fighter, 4)
    assertEqual(crystal2b.trader, 5)
    assertEqual(crystal2b.engineer, 3)

    assertEqual(game2.commander.ship.crew.length, 0)


    // Spot check quests

    game.jarekStatus = SSSTJarekQuestStatus.OnBoard

    game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)
    assertEqual(game2.questListDescription(), `Bring Ambassador Jarek to Devidia.`)

		game.wildStatus = SSSTWildQuestStatus.OnBoard

    game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)
    assertEqual(game2.questListDescription(), `Bring Ambassador Jarek to Devidia.\nSmuggle Jonathan Wild to Kravat.`)

		game.commander.boughtMoon = true

    game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)
    assertEqual(game2.questListDescription(), `Bring Ambassador Jarek to Devidia.\nSmuggle Jonathan Wild to Kravat.\nClaim your moon in Utopia.`)
  }

  test_serializationDeserialization() {
    const replayLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","namedEvent","galacticChart_useSingularity_1_Omega","alertButton_Warp_","ecButton_Ignore","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Reflective_shield","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","cheat_showSpecial","Chart","Warp","cargo_WaterBuy_1","cargo_FoodBuy_1","cargo_FoodBuy_1","cargo_OreBuy_1","cargo_OreBuy_1","cargo_GamesBuy_1","cargo_GamesBuy_1"],"eventNameLog":["click","click","click","click","selectPlanet|Omega","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1733198074014}`

    const replay = this._runReplayLog(replayLog)
    const stG = replay.spaceTraderGame

    const game = stG.viewController._game

    let game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)

    // Spot check some properties
    assertEqual(game2.difficulty, SSSTDifficulty.Normal)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Water), 1)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Furs), 0)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Food), 2)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Ore), 2)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Games), 2)
    assertEqual(game2.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Machines), 0)
    assertEqual(game2.commander.credits, 545215)


    assertEqual(game2.specialCargoDescription(), "No special items.")
    assertEqual(game2.questListDescription(), "No open quests.")


    // Mercenary
    const klaatu2 = game2.solarSystems.find(x => x.name === "Klaatu")
    const draco2 = klaatu2.mercenary
    assertEqual(draco2.name, "Draco")
    assertEqual(draco2.pilot, 5)
    assertEqual(draco2.fighter, 8)
    assertEqual(draco2.trader, 4)
    assertEqual(draco2.engineer, 7)


    const klaatu = game.solarSystems.find(x => x.name === "Klaatu")
    const draco = klaatu.mercenary
    game.commander.ship.addCrewMember(draco)

    game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)

    const klaatu2b = game2.solarSystems.find(x => x.name === "Klaatu")
    const draco2b = klaatu2b.mercenary
    assertEqual(draco2b.name, "Draco")
    assertEqual(draco2b.pilot, 5)
    assertEqual(draco2b.fighter, 8)
    assertEqual(draco2b.trader, 4)
    assertEqual(draco2b.engineer, 7)

    assertEqual(game2.commander.ship.crew.length, 1)
    const draco2bShip = game2.commander.ship.crew[0]
    assertEqual(draco2b, draco2bShip)


    // Spot check quests

    game.jarekStatus = SSSTJarekQuestStatus.OnBoard

    game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)
    assertEqual(game2.questListDescription(), `Bring Ambassador Jarek to Devidia.`)

		game.wildStatus = SSSTWildQuestStatus.OnBoard

    game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)
    assertEqual(game2.questListDescription(), `Bring Ambassador Jarek to Devidia.\nSmuggle Jonathan Wild to Kravat.`)

		game.commander.boughtMoon = true

    game2 = this._serializeAndDeserialize(game)

    assertEqualGames(game, game2)
    assertEqual(game2.questListDescription(), `Bring Ambassador Jarek to Devidia.\nSmuggle Jonathan Wild to Kravat.\nClaim your moon in Utopia.`)
  }

  test_auto_attack_interrupt() {
    const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    actionLog.replayInProgressQueueAsyncClosures = true

    replay.replayEvent("warpBlastOff")
    replay.replayEvent("ecButton_Attack")
    replay.replayEvent("alertButton_Attack")

    replay.replayEvent("ecButton_Auto_Attack")
    assertEqual(actionLog.asyncClosureQueue.length, 1)

    replay.replayEvent("ecButton_Interrupt")
    assertEqual(actionLog.asyncClosureQueue.length, 1)

    let closure = actionLog.asyncClosureQueue.shift()
    assertEqual(actionLog.asyncClosureQueue.length, 0)
    closure()

    assertEqual(document.getElementById("ecButton_Interrupt"), null)
    assertEqual(document.getElementById("ecButton_Attack") !== null, true)
  }

  test_auto_attack_flee() {
    const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    actionLog.replayInProgressQueueAsyncClosures = true

    replay.replayEvent("warpBlastOff")
    replay.replayEvent("ecButton_Attack")
    replay.replayEvent("alertButton_Attack")

    replay.replayEvent("ecButton_Auto_Attack")
    assertEqual(actionLog.asyncClosureQueue.length, 1)

    replay.replayEvent("ecButton_Flee")
    assertEqual(actionLog.asyncClosureQueue.length, 1)

    let closure = actionLog.asyncClosureQueue.shift()
    assertEqual(actionLog.asyncClosureQueue.length, 0)
    closure()

    assertEqual(document.getElementById("ecButton_Interrupt"), null)
    assertEqual(document.getElementById("ecButton_Attack") !== null, true)
  }

  test_auto_attack_surrender() {
    const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    actionLog.replayInProgressQueueAsyncClosures = true

    replay.replayEvent("warpBlastOff")
    replay.replayEvent("ecButton_Attack")
    replay.replayEvent("alertButton_Attack")

    replay.replayEvent("ecButton_Auto_Attack")
    assertEqual(actionLog.asyncClosureQueue.length, 1)

    replay.replayEvent("ecButton_Surrender")
    assertEqual(actionLog.asyncClosureQueue.length, 1)

    let closure = actionLog.asyncClosureQueue.shift()
    assertEqual(actionLog.asyncClosureQueue.length, 0)
    closure()

    assertEqual(document.getElementById("ecButton_Interrupt"), null)
    assertEqual(document.getElementById("ecButton_Attack") !== null, true)
  }

  test_auto_attack_auto_flee() {
    const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    actionLog.replayInProgressQueueAsyncClosures = true

    replay.replayEvent("warpBlastOff")
    replay.replayEvent("ecButton_Attack")
    replay.replayEvent("alertButton_Attack")

    replay.replayEvent("ecButton_Auto_Attack")
    assertEqual(actionLog.asyncClosureQueue.length, 1)

    replay.replayEvent("ecButton_Auto_Flee")
    assertEqual(actionLog.asyncClosureQueue.length, 2)

    let closure = actionLog.asyncClosureQueue.shift()
    assertEqual(actionLog.asyncClosureQueue.length, 1)
    closure()

    assertEqual(document.getElementById("ecButton_Interrupt") !== null, true)
    assertEqual(document.getElementById("ecButton_Attack") !== null, true)

    closure = actionLog.asyncClosureQueue.shift()
    assertEqual(actionLog.asyncClosureQueue.length, 0)
    closure()

    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You've managed to escape your opponent.")
  }

  test_auto_flee_interrupt() {
    const replayLog = `{"idLog":["createCommander","Warp"],"eventNameLog":["click","click"],"gameRandSeed":1734746929683}`

    const replay = this._runReplayLog(replayLog)

    const stG = replay.spaceTraderGame
    const game = stG.viewController._game

    actionLog.replayInProgressQueueAsyncClosures = true

    replay.replayEvent("warpBlastOff")
    replay.replayEvent("ecButton_Attack")
    replay.replayEvent("alertButton_Attack")

    replay.replayEvent("ecButton_Auto_Attack")
    assertEqual(actionLog.asyncClosureQueue.length, 1)

    replay.replayEvent("ecButton_Auto_Flee")
    assertEqual(actionLog.asyncClosureQueue.length, 2)

    let closure = actionLog.asyncClosureQueue.shift()
    assertEqual(actionLog.asyncClosureQueue.length, 1)
    closure()

    assertEqual(document.getElementById("ecButton_Interrupt") !== null, true)
    assertEqual(document.getElementById("ecButton_Attack") !== null, true)

    replay.replayEvent("ecButton_Interrupt")

    assertEqual(actionLog.asyncClosureQueue.length, 1)

    closure = actionLog.asyncClosureQueue.shift()
    assertEqual(actionLog.asyncClosureQueue.length, 0)
    closure()

    assertEqual(document.getElementById("ecButton_Interrupt"), null)
    assertEqual(document.getElementById("ecButton_Flee") !== null, true)

    replay.replayEvent("ecButton_Auto_Flee")
    assertEqual(SSSTAlertViewController.currentAlertTitle(), "You've managed to escape your opponent.")
  }

// Stress tests

  stress_beginnerDifficulty() {
    const randSeed = 1732183570755 // Date.now() when I wrote this line
    let initialLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|0","click"],"gameRandSeed":1732326941039}`

    this._performStressTest("Beginner A", randSeed, initialLog, 200, false, false)
    this._performStressTest("Beginner B", randSeed, initialLog, 400, true, false)
    this._performStressTest("Beginner C", randSeed, initialLog, 500, true, true)

    initialLog = `{"idLog":["difficultySelect","createCommander","Special","alertButton_Dismiss","cheat_freeMoney","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod"],"eventNameLog":["select|change|0","click","click","click","click","click","change","change","click"],"gameRandSeed":1732327630785}`
    this._performStressTest("Beginner D", randSeed, initialLog, 1500, true, true)
  }

  stress_easyDifficulty() {
    const randSeed = 1732183570755 // Date.now() when I wrote this line
    let initialLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|1","click"],"gameRandSeed":1732326941039}`

    this._performStressTest("Easy A", randSeed, initialLog, 200, false, false)
    this._performStressTest("Easy B", randSeed, initialLog, 400, true, false)
    this._performStressTest("Easy C", randSeed, initialLog, 500, true, true)

    initialLog = `{"idLog":["difficultySelect","createCommander","Special","alertButton_Dismiss","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","cheat_freeMoney"],"eventNameLog":["select|change|1","click","click","click","click","change","change","click","click"],"gameRandSeed":1732335347505}`
    this._performStressTest("Easy D", randSeed, initialLog, 1500, true, true)
  }

  stress_normalDifficulty() {
    const randSeed = 1732183570755 // Date.now() when I wrote this line
    let initialLog = `{"idLog":["createCommander"],"eventNameLog":["click"],"gameRandSeed":1732183330034}`

    this._performStressTest("Normal A", randSeed, initialLog, 200, false, false)
    this._performStressTest("Normal B", randSeed, initialLog, 400, true, false)
    this._performStressTest("Normal C", randSeed, initialLog, 500, true, true)


    initialLog = `{"idLog":["createCommander","cheat_freeMoney","cheat_freeSingularity","Chart","galacticChart_track_121_Andevian","galacticChart_track_121_Andevian","galacticChart_useSingularity_121_Andevian","alertButton_Warp_","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes"],"eventNameLog":["click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669532436}`

    this._performStressTest("Normal D", randSeed, initialLog, 1500, true, true)
  }

  stress_hardDifficulty() {
    const randSeed = 1732183570755 // Date.now() when I wrote this line
    let initialLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|3","click"],"gameRandSeed":1732335655620}`

    this._performStressTest("Hard A", randSeed, initialLog, 200, false, false)
    this._performStressTest("Hard B", randSeed, initialLog, 400, true, false)
    this._performStressTest("Hard C", randSeed, initialLog, 500, true, true)

    initialLog = `{"idLog":["difficultySelect","createCommander","cheat_freeMoney","cheat_freeSingularity","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Chart","galacticChart_useSingularity_121_Guinifer","alertButton_Warp_","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","ecButton_Auto_Flee","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Navigation_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Warp"],"eventNameLog":["select|change|3","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669747185}`
    this._performStressTest("Hard D", randSeed, initialLog, 1500, true, true)
  }

  stress_absurdDifficulty() {
    const randSeed = 1732183570755 // Date.now() when I wrote this line
    let initialLog = `{"idLog":["difficultySelect","createCommander"],"eventNameLog":["select|change|4","click"],"gameRandSeed":1732336512130}`

    this._performStressTest("Absurd A", randSeed, initialLog, 200, false, false)
    this._performStressTest("Absurd B", randSeed, initialLog, 400, true, false)
    this._performStressTest("Absurd C", randSeed, initialLog, 500, true, true)

    initialLog = `{"idLog":["difficultySelect","createCommander","cheat_freeMoney","cheat_freeSingularity","Ship Yard","autoFuelCheckbox","autoRepairCheckbox","buy_escape_pod","alertButton_Yes","Chart","galacticChart_useSingularity_121_Umberlee","alertButton_Warp_","ecButton_Submit","alertButton_Dismiss","ecButton_Ignore","ecButton_Ignore","ecButton_Ignore","alertButton_Dismiss","Ship Yard","buyship_Wasp","alertButton_Yes","Equipment","buy_Auto_repair_system","alertButton_Yes","buy_Targeting_system","alertButton_Yes","sell_Targeting_system","alertButton_Yes","buy_Cloaking_device","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Beam_laser","alertButton_Yes","buy_Military_laser","alertButton_Yes","buy_Energy_shield","alertButton_Yes","buy_Reflective_shield","alertButton_Yes","Warp"],"eventNameLog":["select|change|4","click","click","click","click","change","change","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click","click"],"gameRandSeed":1734669932644}`

    this._performStressTest("Absurd D", randSeed, initialLog, 1500, true, true)
  }

  _performStressTest(testName, randSeed, initialLog, numActionsToPerform, avoidGalacticChart, prioritizeBlastOff) {
    // Use a deterministic random number generator that is not the one used by the game (so I can take a log that hit an issue and replay it in index.html)
    const testRand = new MAGameRand(randSeed)

    // Hook into actionLog to remember the id of every element registered
    let seenElementIDs = []
    let seenEventNames = []
    const registerEventHandler = (elementID, eventName) => {
      seenElementIDs.push(elementID)
      seenEventNames.push(eventName)
    }

    // Create a game
    const replay = this._runReplayLog(initialLog, null, registerEventHandler)


    let galacticChartConsecutiveActions = 0

    let i = 0;
    for (i = 0; i < numActionsToPerform; ++i) {
      // Look up every known registered element id in the document
      const liveElementIDs = []
      const liveEventNames = []
      for (let j = 0; j < seenElementIDs.length; ++j) {
        // Prune the ones that are no longer present
        if (document.getElementById(seenElementIDs[j])) {
          liveElementIDs.push(seenElementIDs[j])
          liveEventNames.push(seenEventNames[j])
        }
      }
      seenElementIDs = liveElementIDs
      seenEventNames = liveEventNames


      // Filter element id list down to choose an action to perform: remove cheats, filter everything else if there is an alert shown
      const eligibleElementIDs = []
      const eligibleEventNames = []

      for (let j = 0; j < liveElementIDs.length; ++j) {
        const eID = liveElementIDs[j]
        const eName = liveEventNames[j]

        // Remove cheats
        let shouldFilter = eID.startsWith("cheat_")

        // Remove the end game button
        shouldFilter = shouldFilter || eID === "giveup"

        // If an alert is shown, require that the user acts on it
        const alertEls = document.getElementsByClassName("alert-backdrop")
        const alertElement = alertEls ? alertEls[0] : null
        if (alertElement) {
          const thisEl = document.getElementById(eID)
          shouldFilter = shouldFilter || !alertElement.contains(thisEl)
        }

        // Avoid getting stuck on galactic chart
        if (avoidGalacticChart && galacticChartConsecutiveActions > 2) {
          shouldFilter = shouldFilter || eID.startsWith("galacticChart")
        }

        if (!shouldFilter) {
          eligibleElementIDs.push(eID)
          eligibleEventNames.push(eName)
        }
      }

      // Pick an action, execute it
      let chosenElementID = "warpBlastOff"
      let chosenEventName = "click"
      let pickBlastOff = prioritizeBlastOff && eligibleElementIDs.includes("warpBlastOff") && testRand.randomIntBelow(2) == 1
      if (!pickBlastOff) {
        chosenElementID = "Warp"
        chosenEventName = "click"
        pickBlastOff = prioritizeBlastOff && eligibleElementIDs.includes("Warp") && testRand.randomIntBelow(10) == 1
      }

      if (!pickBlastOff) {
        const chosenIndex = testRand.randomIntBelow(eligibleElementIDs.length)
        chosenElementID = eligibleElementIDs[chosenIndex]
        chosenEventName = eligibleEventNames[chosenIndex]
      }

      // Cash infusion so the test doesn't get stuck with no money for long
      if (i > 0 && i % 800 === 0) {
        chosenElementID = "cheat_freeMoney"
        chosenEventName = "click"
      }

      replay.replayEvent(chosenElementID, chosenEventName)

      if (chosenElementID.startsWith("galacticChart")) {
        galacticChartConsecutiveActions++
      } else {
        galacticChartConsecutiveActions = 0
      }

      // Periodically ensure that serializing/deserializing the game results in an identical game
      if (i > 0 && i % 30 === 0) {
        const stG = replay.spaceTraderGame
        const game = stG.viewController._game
        if (game) {
          pLog.log(101)
          let game2 = this._serializeAndDeserialize(game)
          assertEqualGames(game, game2)
        }
      }
    }

    console.log(`==== Stress test ${testName} completed with ${i} / ${numActionsToPerform} actions ==== \n` + actionLog.serializedString())
  }



  // Returns replay instance
  _runReplayLog(replayLog, hackHandler, registerEventHandler) {
    let gameDiv = document.getElementById("game")
    gameDiv.innerHTML = ''
    SSSTAlertViewController.clearAlerts()

    const randSeed = Date.now()
    gameRand = new MAGameRand(randSeed)
    actionLog = new SSSTActionLogger(randSeed)
    stLocalStorage = new SSSTMockLocalStorage()

    if (registerEventHandler) {
      actionLog.registerEventHandler = registerEventHandler
    }

    const spaceTraderGame = new SpaceTraderGame(gameDiv, false)
    spaceTraderGame.main()

    let replay = new SSSTActionLogReplay(replayLog, spaceTraderGame, hackHandler)
    replay.replay()

    return replay
  }

  // Replay utilities
  _replaySkipEncounters(replay, breakConditionFn /* optional */) {
    let loopCount = 0
    do {
      if (breakConditionFn && breakConditionFn()) {
        break
      }


      let buttons = [ "alertButton_Dismiss",
        "ecButton_Ignore",
        "ecButton_Submit",
        "ecButton_Auto_Flee" ]

      const stG = replay.spaceTraderGame
      const game = stG.viewController._game
      if (game.commander.ship.hasIllegalGoods()) {
        buttons = buttons.filter(x => x !== "ecButton_Submit")
      }

      for (let buttonID of buttons) {
        const el = document.getElementById(buttonID)
        if (el) {
          replay.replayEvent(buttonID, "click")
          break
        }
      }

      const systemInfoHeader = document.getElementById('system-info-welcome')
      if (systemInfoHeader) {
        break
      }

      loopCount++
    } while (loopCount < 100)
    assertTrue(loopCount < 100, "Exceeded auto action loop limit")
  }

// Unit test harness

  _runTestsMatching(testNameCheck) {
    const startTime = Date.now()

    let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))

    let onlyMethods = methods.filter(x => x.startsWith("only"))
    methods = onlyMethods.length > 0 ? onlyMethods : methods

    let passCount = 0
    for (let method of methods) {
      if (testNameCheck(method)) {
        MALog.log("=== Invoking " + method + " ===")
        console.log("=== Invoking " + method + " ===")
        this[method]();

        let gameDiv = document.getElementById("game")
        gameDiv.innerHTML = ''

        SSSTAlertViewController.clearAlerts()

        if (caughtError) {
          MALog.log("Failed test: hit exception captured by window.onerror.\n" + caughtError + "\n" + caughtError.stack)
          throw caughtError
        }

        passCount++
      }
    }
    MALog.log(passCount + " tests and " + assertionCount + " assertions passed successfully!")
    MALog.log(pLog.summaryString())
    const endTime = Date.now()
    const runTimeSec = Math.round((endTime - startTime) / 1000)
    MALog.log(`Completed in ${runTimeSec} seconds`)
  }

  run() {
    this._runTestsMatching((n) => {
      return n.startsWith("test") || n.startsWith("only_test")
    })
  }

  runStress() {
    this._runTestsMatching((n) => {
      return n.startsWith("stress") || n.startsWith("only_stress")
    })
  }
}

// Run with:
//  let ut = new UnitTests()
//  ut.run()
