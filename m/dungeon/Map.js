const MAEnemyFactory = {
  newSmallGoblin: function() {

    let smallGoblin = new MAEnemy("small goblin", "He's looking at you menacingly, waiting for you to try something stupid.", 3)

    smallGoblin.taunts = function() {
      return [
      "The small goblin snarls, spraying globs of acidic saliva.",
      "\"Is that all you've got?!\" taunts the goblin.",
      "Your enemy gnashes his teeth.",
      "The small goblin breathes heavily and aggressively. You almost choke as the rotten damp air reaches your nostrils."
      ]
    }

    smallGoblin.attacks = function() {
      let attacks = []

      let clobberAttack = new MAAttack("Clobber", [0, 1])
      clobberAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "Bonk!" : "Whoosh!"
      }
      attacks.push(clobberAttack)

      return attacks
    }

    smallGoblin.defeatHandler = function(gameState) {
      gameState.log.log(`The ${this.name} leaves behind a small potion.`)

      let smallPotion = new MANoun("small potion", "A green liquid in a small glass vial.")
      gameState.currentLocation.nouns.push(smallPotion)
    }

    return smallGoblin
  },

  newAdultGoblin: function() {
    let adultGoblin = new MAEnemy("adult goblin", "He's slowly moving in a circle around you, preparing to lunge and attack.", 6)

    adultGoblin.taunts = function() {
      return [
        "\"I will avenge my brother!\" shouts the goblin.",
        "\"I'll make you regret setting foot in our home!\" the goblin snarls.",
        "The goblin angrily pounds his fists on the ground: *THUMP*.",
        "The goblin's stench fills the air as he pants heavily.",
        "The goblin sneezes and shakes his head, flinging sticky slime droplets against your face and clothes.",
      ]
    }

    adultGoblin.attacks = function() {
      let attacks = []

      let smackdownAttack = new MAAttack("Smackdown", [0, 0, 4])
      smackdownAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "BASH!" : "Dodged!"
      }
      attacks.push(smackdownAttack)

      return attacks
    }

    adultGoblin.defeatHandler = function(gameState) {
      gameState.log.log(`You've really done a number on this family!\n\nThe ${this.name} leaves behind an elixir.`)

      let mediumElixir = new MANoun("elixir", "A glass vial containing a moderate amount of purple liquid.")
      gameState.currentLocation.nouns.push(mediumElixir)
    }

    return adultGoblin
  },


  newSmallTroll: function() {
    // Clumsy, low hit rate but deals high damage

    let enemy = new MAEnemy("small troll", "Far taller, heavier, stronger, and smellier than you are. Also, far dumber.", 8)

    enemy.taunts = function() {
      return [
        "\"I no like you!\" grunts the troll.",
        "The troll teeters, narrowly avoiding falling over.",
        "Weaponless, the troll looks around as if trying to remember where he last dropped his club.",
        "You're still not used to the pungent air. The deep breaths you're taking, thanks to this strenuous battle, can't be healthy.",
        "The troll shouts, \"you leave here!!\" I wish we could, buddy.",
      ]
    }

    enemy.attacks = function() {
      let attacks = []

      let smashAttack = new MAAttack("Smash", [0, 0, 0, 6])
      smashAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "SMASH!" : "Miss!"
      }
      attacks.push(smashAttack)

      return attacks
    }

    enemy.defeatHandler = function(gameState) {
      gameState.log.log(`You are victorious and in desperate need of a shower.\n\nThe ${this.name} leaves behind a potion.`)

      let mediumPotion = new MANoun("potion", "A glass vial containing a moderate amount of green liquid.")
      gameState.currentLocation.nouns.push(mediumPotion)
    }

    return enemy
  },

  newBabyWolf: function() {
    // Deals low damage

    let enemy = new MAEnemy("wolf pup", "Cute. Unfriendly.", 4)

    enemy.taunts = function() {
      return [
        "\"Grrrowl!\" exclaims the wolf pup.",
        "The wolf pup hops forward and back, energetic but unsure about its next move.",
        "The wolf pup bares its teeth and growls.",
        "\"Rrruf ruff!\" barks the wolf pup.",
      ]
    }

    enemy.attacks = function() {
      let attacks = []

      let clawAttack = new MAAttack("Claw", [0, 1])
      clawAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "Ouch!" : "Dodged!"
      }
      attacks.push(clawAttack)

      let nipAttack = new MAAttack("Nip", [0, 1])
      nipAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "Yip!" : "The wolf pup stumbles."
      }
      attacks.push(nipAttack)

      return attacks
    }

    enemy.defeatHandler = function(gameState) {
      gameState.log.log(`You feel some guilt defeating this fuzzy little pup.\n\nThe ${this.name} leaves behind a small potion.`)

      let smallPotion = new MANoun("small potion", "A green liquid in a small glass vial.")
      gameState.currentLocation.nouns.push(smallPotion)
    }

    return enemy
  },

  newAdultWolf: function() {
    // Accurate, deals medium damage
    let enemy = new MAEnemy("wolf", "Large. Angry.", 8)

    enemy.taunts = function() {
      return [
        "\"Arooo!\" wails the wolf.",
        "The wolf snarls and bares its sharp white teeth.",
        "The wolf moves around the room with precision and ferocity.",
        "With a frenzied look, the wolf prepares to attack.",
        "The wolf is not backing down; it's out for revenge.",
      ]
    }

    enemy.attacks = function() {
      let attacks = []

      let razortoothAttack = new MAAttack("Razortooth", [2])
      razortoothAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "Youch! That smarts!" : "Dodged!"
      }
      attacks.push(razortoothAttack)

      return attacks
    }

    enemy.defeatHandler = function(gameState) {
      gameState.log.log(`Like father, like son. You've got a knack for cutting down family trees.\n\nThe ${this.name} leaves behind an elixir.`)

      let mediumElixir = new MANoun("elixir", "A glass vial containing a moderate amount of purple liquid.")
      gameState.currentLocation.nouns.push(mediumElixir)
    }

    return enemy
  },


  newGiantGoblin: function() {
    let enemy = new MAEnemy("giant goblin", "He's flailing wildly, splashing you with green sweat, and closing in for attack.", 11)

    enemy.taunts = function() {
      return [
        "\"Prepare to die!\" shouts the giant goblin.",
        "\"You killed my babies! My poopsies!\"",
        "The giant goblin menacingly shifts its weight from one foot to the other.",
        "\"You villain!\" declares your enemy.",
        "The giant goblin clenches its fists, preparing to attack.",
      ]
    }

    enemy.attacks = function() {
      let attacks = []

      let stompAttack = new MAAttack("Stomp", [2])
      stompAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return "The ground shakes from impact!"
      }
      attacks.push(stompAttack)

      let grabsmackAttack = new MAAttack("Grabsmack", [1, 1, 1, 4])
      grabsmackAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 1) ? "Oof! SMACK!" : "Ouch!"
      }
      attacks.push(grabsmackAttack)

      return attacks
    }

    enemy.defeatHandler = function(gameState) {
      gameState.log.log(`Has this put an end to the goblin bloodline?\n\nYou notice that an orange key fell out of the ${this.name}'s pocket during battle.`)

      let orangeKey = new MANoun("orange key", "An orange key, polished to shine.")
      gameState.currentLocation.nouns.push(orangeKey)
    }

    return enemy
  },


  newTroll: function() {
    // Clumsy, low hit rate but deals very high damage
    let enemy = new MAEnemy("troll", "Very big, very smelly, very dumb.", 12)

    enemy.taunts = function() {
      return [
        "\"FEE FIE FOE FUM, YOU GO IN MY TUM!\" recites the troll.",
        "\"I EAT YOU!\" predicts the troll, hungrily.",
        "The troll clumsily bonks his head on the ceiling.",
        "The air is moist with pungent troll sweat.",
        "The troll puffs in frustration. He is hungry and impatient.",
      ]
    }

    enemy.attacks = function() {
      let attacks = []

      let beatdownAttack = new MAAttack("Beatdown", [0, 0, 0, 7])
      beatdownAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "CRUNCH! Brutal! Was that a bone breaking?" : "Dodged!"
      }
      attacks.push(beatdownAttack)

      let stenchAttack = new MAAttack("Stench", [1])
      stenchAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return "*Gasp* so foul!"
      }
      attacks.push(stenchAttack)

      return attacks
    }

    enemy.defeatHandler = function(gameState) {
      gameState.log.log(`What a strenuous battle!\n\nThe ${this.name} leaves behind a large potion.`)

      let largePotion = new MANoun("large potion", "A large glass vial containing ample green liquid.")
      gameState.currentLocation.nouns.push(largePotion)
    }

    return enemy
  },


  newAlphaWolf: function() {
    let enemy = new MAEnemy("alpha wolf", "Menacing with dark gray fur, sharp white teeth, and drool betraying his hunger...for revenge.", 13)

    enemy.taunts = function() {
      return [
        "\"GGRROWL!\" Never before have you seen such a furious animal.",
        "The alpha wolf threateningly keeps his mouthful of sharp teeth visible. Perfect for tearing flesh from bone. Your flesh.",
        "The alpha wolf is ready to pounce.",
        "Your eyes meet the alpha wolf's. As they pierce your soul, you feel that your opponent is clever and ferocious.",
        "\"AWOOO!\" calls the alpha wolf. Your one advantage may be that wolves normally hunt in packs. Don't squander it by waiting for reinforcements to arrive.",
      ]
    }

    enemy.attacks = function() {
      let attacks = []

      let fangslashAttack = new MAAttack("Fangslash", [3, 4])
      fangslashAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 3) ? "Deep cut!" : "Ouch!"
      }
      attacks.push(fangslashAttack)


      let tackleAttack = new MAAttack("Tackle", [2])
      tackleAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return "Ooof!"
      }
      attacks.push(tackleAttack)

      return attacks
    }

    enemy.defeatHandler = function(gameState) {
      gameState.log.log(`A formidable enemy. It's a shame it had to end this way.\n\nThe ${this.name} leaves behind a large elixir.`)

      let largeElixir = new MANoun("large elixir", "A glass vial containing an ample amount of purple liquid.")
      gameState.currentLocation.nouns.push(largeElixir)
    }

    return enemy
  },


  newDragon: function() {
    // Lazy/unserious, deals extreme damage
    let enemy = new MAEnemy("dragon", "Dark green scales, foot-long fangs, fiery breath.", 15)

    enemy.taunts = function() {
      return [
        "\"You silly toy!\" rumbles the dragon.",
        "\"You poor mortal. Here, I am god!\" taunts the dragon.",
        "The dragon mockingly lays down, as if to nap, mid-battle.",
        "The dragon is not impressed by your attack.",
        "The dragon looks pensive. Maybe he's deciding whether to eat you and your companion in one bite.",
        "The dragon swats at you with his tail as if you're nothing more than an annoying insect.",
      ]
    }

    enemy.attacks = function() {
      let attacks = []

      let flamethrowerAttack = new MAAttack("Flamethrower", [0, 6])
      flamethrowerAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "Scorched!" : "Narrow miss!"
      }
      attacks.push(flamethrowerAttack)

      let rageAttack = new MAAttack("Rage", [0, 8])
      rageAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return (damageAmount > 0) ? "Brutal smash!" : "That was close!"
      }
      attacks.push(rageAttack)

      let yawnAttack = new MAAttack("Yawn", [0])
      yawnAttack.hasNoTarget = true
      yawnAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return "The dragon looks bored."
      }
      attacks.push(yawnAttack)

      let snoozeAttack = new MAAttack("Snooze", [0])
      snoozeAttack.hasNoTarget = true
      snoozeAttack.soundDescriptionForDamageAmount = function(damageAmount) {
        return "The dragon takes a short nap. This is either a taunt or narcolepsy."
      }
      attacks.push(snoozeAttack)

      return attacks
    }

    enemy.defeatHandler = function(gameState) {
      gameState.log.log(`Hubris got the better of this magestic beast. You are no one's pawn.\n\nThe ${this.name} leaves behind a hoard of gold.`)

      let goldHoard = new MANoun("gold hoard", "You escaped with your life, a new companion, and a life-changing mass of gold coins.")
      gameState.currentLocation.nouns.push(goldHoard)
    }

    return enemy
  }
}
Object.freeze(MAEnemyFactory)


class MAMap {
  // Properties:
  // - nameToLocation[string] = MALocation instance
  // - startLocation = Library Lab; accessor

  constructor(gameState) {
    this.gameState = gameState
    this.nameToLocation = {}

    // Create all locations

    //
    // (0,0)
    //
    let loc0_0 = new MALocation("room 👀👃")
    this.startLocation = loc0_0
    this.addLocation(loc0_0)

    loc0_0.appearance = function() {
      let beginning = this.inspected ? "" : "You open your eyes and find yourself in dimly lit surroundings. "

      let middle = "The air is damp and cool. The smell of mildew reminds you of an old basement."

      let inYourHead = this.inspected ? "" : " In your head, you label this location \"" + this.name + "\"."

      return beginning + middle + inYourHead + "\n\n" + this.nounsAndLocationsString()
    }

    let smallPotion = new MANoun("small potion", "A green liquid in a small glass vial.")
    loc0_0.nouns.push(smallPotion)



    //
    // (1,0)
    //
    let loc1_0 = new MALocation("room 🛏🩹")
    this.addLocation(loc1_0)

    loc1_0.appearance = function() {
      var prefix = "Still no exit to the outside... this"
      if (loc1_0.inspected) {
        prefix = "This"
      }

      return prefix + " room is square with several neighboring rooms.\n\n" + loc1_0.nounsAndLocationsString()
    }

    let cot = new MAScenery("cot", "An old tattered cot. Better than the floor if you need to rest and heal.")
    loc1_0.nouns.push(cot)


    //
    // (2,0)
    //
    let loc2_0 = new MALocation("room 💼🔒")
    this.addLocation(loc2_0)

    loc2_0.appearance = function() {
      var prefix = "This system of rooms is bigger than you had hoped... will you be able to escape safely? "
      if (loc2_0.inspected) {
        prefix = ""
      }

      return prefix + "There is a door to the south.\n\n" + loc2_0.nounsAndLocationsString()
    }

    let satchel = new MANoun("satchel", "A bag for carrying items.")
    satchel.hidden = true // hide from inventory listing
    loc2_0.nouns.push(satchel)

    let pawPrints = new MAScenery("paw prints", "Red paw prints heading east.")
    loc2_0.nouns.push(pawPrints)



    //
    // (3,0)
    //
    let loc4_0 = new MALocation("room 🩸🦊")

    let loc3_0 = new MALocation("room 🩸〰️")
    this.addLocation(loc3_0)

    loc3_0.appearance = function() {
      var prefix = "You're startled to see the paw prints become a"
      if (loc3_0.inspected) {
        prefix = "You see the now-familiar"
      }

      var suffix = loc4_0.inspected ? "" : " Whatever creature left it behind must be hurt."
      if (gameState.player.hasNounNamed("fox")) {
        suffix = " The fox whimpers, seemingly remembering recent trauma."
      }

      return prefix + " blood trail heading east." + suffix + "\n\n" + loc3_0.nounsAndLocationsString()
    }

    let tornParchment1 = new MANoun("torn parchment", "A torn piece of parchment. You can't decipher its contents without more context.")
    loc3_0.nouns.push(tornParchment1)



    //
    // (4,0)
    //
    this.addLocation(loc4_0)

    loc4_0.appearance = function() {
      var prefix = "You follow the blood trail to a pitiful-looking creature curled up, dead, in the corner. At least you assumed it was dead. Now aware of your presence, it whines faintly. Upon further inspection, you can see that it's a fox, barely alive."

      if (loc4_0.inspected) {
        let foxInLoc = loc4_0.hasNounNamed("injured fox")

        if (foxInLoc) {
          prefix = "The injured fox whines in the corner, in need of help."
        } else {
          prefix = "There is nothing notable here."
        }
      }

      return prefix + "\n\n" + loc4_0.linkedLocationsString()
    }

    let injuredFox = new MAScenery("injured fox", "A creature in distress with orange and white fur matted with blood. Its already-weak cries are growing fainter.")
    loc4_0.nouns.push(injuredFox)



    //
    // (0,1)
    //
    let loc0_1 = new MALocation("room 🔵🗝")
    this.addLocation(loc0_1)

    loc0_1.appearance = function() {
      var prefix = ""

      let blueGlimmerInLoc = this.hasNounNamed("blue glimmer")
      let blueKeyInLoc = this.hasNounNamed("blue key")

      if (!loc0_1.inspected) {
        prefix = "As you enter the room, you notice a blue glimmer of light from an otherwise dark corner.\n\n"
      } else if (blueGlimmerInLoc) {
        prefix = "There's a blue glimmer of light in the corner.\n\n"
      } else if (blueKeyInLoc) {
        prefix = "There's a blue key on the ground which may prove useful in this dark maze.\n\n"
      }

      return prefix + loc0_1.linkedLocationsString()
    }

    let blueGlimmer = new MAScenery("blue glimmer", "Upon closer inspection, the blue glimmer turns out to be a small shiny blue key.")
    loc0_1.nouns.push(blueGlimmer)



    //
    // (1,1)
    //
    let loc1_1 = new MALocation("room 🐂🛡")
    this.addLocation(loc1_1)

    loc1_1.appearance = function() {
      let hasFox = gameState.player.hasNounNamed("fox")
      let armorInLoc = loc1_1.hasNounNamed("small leather armor")

      let prefix = ""
      if (hasFox && armorInLoc) {
        prefix = "There's some adorable fox-sized leather armor stacked in a neat pile. How fortunate for your furry companion!"
      } else if (armorInLoc) {
        prefix = "You find a comically small set of leather armor stacked in a neat pile. This doesn't seem to be particularly useful to you at the moment."

        if (!loc1_1.inspected) {
          prefix += " Your own vulnerability in this dark maze suddenly feels more apparent."
        }
      } else {
        prefix = "There's nothing of note here."
      }

      return prefix + "\n\n" + loc1_1.linkedLocationsString()
    }

    let leatherArmor = new MANoun("small leather armor", "A set of armor more appropriate for a cat than yourself.")
    leatherArmor.indefiniteArticle = function() { return "some" }
    loc1_1.nouns.push(leatherArmor)



    //
    // (2,1)
    //
    let loc2_1 = new MALocation("room 🧑‍🎤1️⃣")
    this.addLocation(loc2_1)

    loc2_1.appearance = function() {
      let goblinInLoc = loc2_1.hasNounNamed("small goblin")

      var prefix = "You hear a cackling, \"Ohhhahahaha! So you found the key did you? Well you won't get farther than this!\"\n\nA goblin. This goblin is only about waist-high. He's smaller than others you've encountered and has the usual green skin."

      if (loc2_1.inspected && goblinInLoc) {
        prefix = "The small goblin shifts his weight between knobbly green feet."
      } else if (loc2_1.inspected) {
        prefix = "The small goblin who once inhabited this room is gone."
      }

      return prefix + (goblinInLoc ? "" : "\n\n" + loc2_1.linkedLocationsString())
    }

    let smallGoblin = MAEnemyFactory.newSmallGoblin()
    loc2_1.nouns.push(smallGoblin)



    //
    // (3,1)
    //
    let loc3_1 = new MALocation("room 🦊🦷")
    this.addLocation(loc3_1)

    let bones = new MAScenery("piles of bones")

    loc3_1.appearance = function() {
      var prefix = "This room smells faintly of rotting meat. You step carefully around piles of bones. Good thing you defeated the goblin or you would have met a similar fate."
      if (loc3_1.inspected) {
        prefix = "You recognize the familiar stench and scattered remains of those who fell to the goblin."

        if (bones.inspected && bones.hasNounNamed("metal fangs")) {
          prefix += "\n\nAmong the bones, you can see a set of metal fangs."
        }
      }

      return prefix + "\n\n" + loc3_1.linkedLocationsString()
    }

    loc3_1.nouns.push(bones)

    bones.appearance = function() {
      let hasFangs = this.hasNounNamed("metal fangs")

      if (!this.inspected) {
        return "You search the bones for anything useful left behind by less-fortunate creatures who came before you. You strike great fortune! You find a set of metal fangs, a perfect fit for your furry companion."
      } else if (hasFangs) {
        return "White bones with teeth marks. Among the bones you can see a set of fox-sized metal fangs."
      } else {
        return "White bones chewed clean by goblins."
      }
    }

    let metalFangs = new MANoun("metal fangs", "Sharp, shiny, and ready to do some damage.")
    bones.nouns.push(metalFangs)



    //
    // (4,1)
    //
    let loc4_1 = new MALocation("room 📜🦷")
    this.addLocation(loc4_1)

    loc4_1.appearance = function() {
      return loc4_1.nounsAndLocationsString()
    }

    let pamphlet = new MANoun("pamphlet", "A pamphlet that describes the workings of mechanical metal fangs.")
    loc4_1.nouns.push(pamphlet)



    //
    // (0,2)
    //
    let loc0_2 = new MALocation("room 🥉⛑")
    this.addLocation(loc0_2)

    let bones2 = new MAScenery("piles of bones")

    loc0_2.appearance = function() {
      let aAnother = loc3_1.inspected ? "Another" : "A"
      var prefix = aAnother + " room of bones of those who perished at the hands (and teeth) of this goblin horde."

      if (bones2.inspected && bones2.hasNounNamed("bronze helm")) {
        prefix += "\n\nAmong the bones, you can see a bronze helm."
      }

      return prefix + "\n\n" + loc0_2.linkedLocationsString()
    }

    loc0_2.nouns.push(bones2)

    bones2.appearance = function() {
      let hasHelm = this.hasNounNamed("bronze helm")

      if (!this.inspected) {
        return "You search the bones for anything useful left behind by less-fortunate creatures who came before you. You strike great fortune! You find a bronze helm, a perfect fit for your own head."
      } else if (hasHelm) {
        return "White bones with teeth marks. Among the bones you can see a bronze helm."
      } else {
        return "White bones chewed clean by goblins."
      }
    }

    let bronzeHelm = new MANoun("bronze helm", "A battle-worn but intact piece of armor for a human head. Fortunately, the original owner's head is no longer inside. Fortunate for you at least.")
    bones2.nouns.push(bronzeHelm)



    //
    // (1,2)
    //
    let loc1_2 = new MALocation("room 🧑‍🎤2️⃣")
    this.addLocation(loc1_2)

    loc1_2.appearance = function() {
      let goblinInLoc = loc1_2.hasNounNamed("adult goblin")

      var desc = "You hear a sharp wail! \"Youuuuuuuuuu! You attacked my poor innocent brother!\"\n\nAnother goblin. This one is larger, fully grown, and only a foot shorter than you. He weighs a lot more than you, looking about twice as thick. The family resemblance is real, green skin and all.\n\n\"You'll regret coming here!\" he yells. As if you were here on purpose; as if your regret about this unpleasant and unexpected adventure could increase..."

      if (loc1_2.inspected && goblinInLoc) {
        desc = "The goblin gnashes his teeth and glares at you."
      } else if (loc1_2.inspected) {
        desc = loc1_2.linkedLocationsString()
      }

      return desc
    }

    let adultGoblin = MAEnemyFactory.newAdultGoblin()
    loc1_2.nouns.push(adultGoblin)



    //
    // (2,2)
    //
    let loc2_2 = new MALocation("room 📜2️⃣")
    this.addLocation(loc2_2)

    loc2_2.appearance = function() {
      var prefix = "Goblins tend to travel in groups... fortunately, there are none here. Maybe you're lucky."
      if (loc2_2.inspected) {
        prefix = "No goblins, whew."
      }

      return prefix + "\n\n" + loc2_2.nounsAndLocationsString()
    }

    let tornParchment2 = new MANoun("torn parchment #2", "A torn piece of parchment. You can't decipher its contents without more context. Maybe several reassembled pieces would be legible.")
    loc2_2.nouns.push(tornParchment2)



    //
    // (3,2)
    //
    let loc3_2 = new MALocation("room 👿1️⃣")
    this.addLocation(loc3_2)

    loc3_2.appearance = function() {
      let trollInLoc = loc3_2.hasNounNamed("small troll")

      var prefix = "You are hit by an intense stench. You gag and your eyes water as you try to regain your bearings.\n\nYou hear deep loud breathing punctuated with a snarl.\n\n\"Hrrrnngh! You DARE disturb me??\" the room's occupant shouts this seemingly rhetorical question.\n\nTroll in the dungeon! (Thought you ought to know...)\n\nThis specimen is a small one -- towering over you by only two feet."

      if (loc3_2.inspected && trollInLoc) {
        prefix = "The troll breathes heavily and could lunge at any moment."
      } else if (loc3_2.inspected) {
        prefix = "The troll is gone but the stench remains."
      }

      return prefix + (trollInLoc ? "" : "\n\n" + loc3_2.linkedLocationsString())
    }

    let smallTroll = MAEnemyFactory.newSmallTroll()
    loc3_2.nouns.push(smallTroll)



    //
    // (4,2)
    //
    let loc4_2 = new MALocation("room 🧪1️⃣")
    this.addLocation(loc4_2)

    loc4_2.appearance = function() {
      let potionInLoc = loc4_2.hasNounNamed("potion")

      var prefix = ""
      if (!loc4_2.inspected) {
        prefix = "After your recent run-ins with aggressive creatures, you're relieved to see a potion in the middle of the room. "
      } else if (potionInLoc) {
        prefix = "There's a potion in the middle of the room. "
      }

      return prefix + "There is a door to the north.\n\n" + loc4_2.linkedLocationsString()
    }

    let mediumPotion = new MANoun("potion", "A glass vial containing a moderate amount of green liquid.")
    loc4_2.nouns.push(mediumPotion)

    let orangeDoor = new MAScenery("door", "A door with an orange lock.")
    loc4_2.nouns.push(orangeDoor)



    //
    // (0,3)
    //
    let loc0_3 = new MALocation("room 🐺1️⃣")
    this.addLocation(loc0_3)

    loc0_3.appearance = function() {
      let wolfInLoc = loc0_3.hasNounNamed("wolf pup")

      let prefix = "Aw! Is that a cute baby wolf napping in the corner?\n\nHmm... your entrance causes it to stir.\n\n\"Grrrr!\" It does not appear to be friendly."

      if (loc0_3.inspected) {
        if (wolfInLoc) {
          prefix = "An unfriendly wolf pup quietly growls while maintaining uncomfortable eye contact."
        } else {
          prefix = "Hard not to feel guilty for dispatching that cute lil wolf pup."
        }
      }

      return prefix + (wolfInLoc ? "" : "\n\n" + loc0_3.linkedLocationsString())
    }

    let babyWolf = MAEnemyFactory.newBabyWolf()
    loc0_3.nouns.push(babyWolf)



    //
    // (1,3)
    //
    let loc1_3 = new MALocation("room 🐺2️⃣")
    this.addLocation(loc1_3)

    loc1_3.appearance = function() {
      let wolfInLoc = loc1_3.hasNounNamed("wolf")

      let prefix = "Uh-oh. Here's papa wolf ready for revenge.\n\nUnlike his less-aggressive (and recently-vanquished) offspring, papa wolf leaps and gnashes at you immediately. You narrowly dodge."

      if (loc1_3.inspected) {
        if (wolfInLoc) {
          prefix = "Papa wolf's teeth and ambitions are bared... he's prepared... to attack."
        } else {
          prefix = "Fur and blood cover the floor."
        }
      }

      return prefix + (wolfInLoc ? "" : "\n\n" + loc1_3.linkedLocationsString())
    }

    let adultWolf = MAEnemyFactory.newAdultWolf()
    loc1_3.nouns.push(adultWolf)



    //
    // (2,3)
    //
    let loc2_3 = new MALocation("room 🧑‍🎤3️⃣")
    this.addLocation(loc2_3)

    loc2_3.appearance = function() {
      let goblinInLoc = loc2_3.hasNounNamed("giant goblin")

      var prefix = "\"WELCOME TO HELL!\" bellows this room's unfriendly occupant.\n\nStanding in front of you is the biggest goblin that you have ever had the misfortune of meeting.\n\nThis goblin is green, sweaty, round like a globe, and matches you in height. Hopefully he's peaceful.\n\n\"You cut down my children. YOU SHALL PAY!\"\n\nYou notice giant slimy egg shells scattered around the room."

      if (loc2_3.inspected && goblinInLoc) {
        prefix = "The goblin looks uncomfortable -- like he's either going to lay another egg or rip your head off."
      } else if (loc2_3.inspected) {
        prefix = "Giant slimy egg shells are scattered around the room."
      }

      return prefix + (goblinInLoc ? "" : "\n\n" + loc2_3.linkedLocationsString())
    }

    let giantGoblin = MAEnemyFactory.newGiantGoblin()
    loc2_3.nouns.push(giantGoblin)

    let eggShells = new MAScenery("egg shells", "Giant beige egg shells with green splotches and green slime. You learned something about goblin reproduction today.")
    loc2_3.nouns.push(eggShells)



    //
    // (3,3)
    //
    let loc3_3 = new MALocation("room 👿2️⃣")
    this.addLocation(loc3_3)

    loc3_3.appearance = function() {
      let trollInLoc = loc3_3.hasNounNamed("troll")

      var prefix = "You have to squeeze into this room because it's already nearly full with a gigantic foul-smelling occupant. Another troll. This one is even bigger than the first one, needing to slouch to avoid hitting his head on the ceiling.\n\n\"YOU NOT WELCOME! ME CRUSH YOU!\" What he has in size, he lacks in eloquence."

      if (loc3_3.inspected && trollInLoc) {
        prefix = "The troll angrily tries to stand upright to intimidate you but thumps his thick skull on the rocky ceiling. *bonk!*"
      } else if (loc3_3.inspected) {
        prefix = "The troll is gone but the stench remains."
      }

      return prefix + (trollInLoc ? "" : "\n\n" + loc3_3.linkedLocationsString())
    }

    let troll = MAEnemyFactory.newTroll()
    loc3_3.nouns.push(troll)



    //
    // (4,3)
    //
    let loc4_3 = new MALocation("room 🐺3️⃣")
    this.addLocation(loc4_3)

    loc4_3.appearance = function() {
      let wolfInLoc = loc4_3.hasNounNamed("alpha wolf")

      let prefix = "\"AWOoooooOOooOoo!\" the alpha wolf howls as you enter. His sensitive nose tells him your story: he smells troll sweat, he smells wolf pup, he smells dirty goblins, he smells his favorite lieutenant wolf, he smells DEATH!\n\nHe smells fear...yours?\n\nThe alpha wolf's growls are a deep reverberating rumble in this stone chamber."

      if (loc4_3.inspected) {
        if (wolfInLoc) {
          prefix = "Alpha wolf readies himself to pounce on a puny human."
        } else {
          prefix = "Fur, blood, claws, and teeth cover the floor."
        }
      }

      return prefix + (wolfInLoc ? "" : "\n\n" + loc4_3.linkedLocationsString())
    }

    let alphaWolf = MAEnemyFactory.newAlphaWolf()
    loc4_3.nouns.push(alphaWolf)



    //
    // (0,4)
    //
    let loc0_4 = new MALocation("room 🧪2️⃣")
    this.addLocation(loc0_4)

    loc0_4.appearance = function() {
      let potionInLoc = this.hasNounNamed("potion")

      var prefix = ""
      if (!this.inspected) {
        prefix = "A nourishing potion is on the ground here."
      } else if (potionInLoc) {
        prefix = "There's a potion on the ground."
      } else {
        prefix = "There's nothing notable here."
      }

      return prefix + "\n\n" + this.linkedLocationsString()
    }

    let mediumPotion2 = new MANoun("potion", "A glass vial containing a moderate amount of green liquid.")
    loc0_4.nouns.push(mediumPotion2)



    //
    // (1,4)
    //
    let loc1_4 = new MALocation("room 🧪3️⃣")
    this.addLocation(loc1_4)

    loc1_4.appearance = function() {
      let potionInLoc = this.hasNounNamed("potion")

      var prefix = ""
      if (!this.inspected) {
        prefix = "Just what you needed: a potion!"
      } else if (potionInLoc) {
        prefix = "There's a potion on the ground."
      } else {
        prefix = "There's nothing notable here."
      }

      return prefix + "\n\n" + this.linkedLocationsString()
    }

    let mediumPotion3 = new MANoun("potion", "A glass vial containing a moderate amount of green liquid.")
    loc1_4.nouns.push(mediumPotion3)


    //
    // (2,4)
    //
    let loc2_4 = new MALocation("room 🧪4️⃣")
    this.addLocation(loc2_4)

    loc2_4.appearance = function() {
      let potionInLoc = this.hasNounNamed("potion")

      var prefix = ""
      if (!this.inspected) {
        prefix = "On the floor is yet another potion. Is this ominous?"
      } else if (potionInLoc) {
        prefix = "There's a potion on the ground. Should you be worried?"
      } else {
        prefix = "There's nothing notable here."
      }

      return prefix + "\n\n" + this.linkedLocationsString()
    }

    let mediumPotion4 = new MANoun("potion", "A glass vial containing a moderate amount of green liquid.")
    loc2_4.nouns.push(mediumPotion4)



    //
    // (3,4)
    //
    let loc3_4 = new MALocation("room 🔑💜")
    this.addLocation(loc3_4)

    loc3_4.appearance = function() {
      if (!this.inspected) {
        return "This room is a dead end with two useful items: a gold key and a large elixir.\n\n" + this.linkedLocationsString()
      } else {
        return this.nounsAndLocationsString();
      }
    }

    let largeElixir = new MANoun("large elixir", "A glass vial containing an ample amount of purple liquid.")
    loc3_4.nouns.push(largeElixir)

    let goldKey = new MANoun("gold key", "Hopefully this key unlocks golden treasure...or an exit from this dungeon.")
    loc3_4.nouns.push(goldKey)



    //
    // (4,4)
    //
    let loc4_4 = new MALocation("room 🐲🐉")
    this.addLocation(loc4_4)

    loc4_4.appearance = function() {
      let dragonInLoc = this.hasNounNamed("dragon")
      let goldInLoc = this.hasNounNamed("gold hoard")

      var prefix = ""
      if (!this.inspected) {
        prefix = "The air smells like smoke and sulphur.\n\nA green-scaled dragon meets your gaze. Its deep voice shakes the room and you feel it in your bones. \"I summoned you here to rid my cavern passages of goblin, troll, and wolf parasites. You may act like a knight but you've been nothing more than my pawn! And now I'll have a nice snack before returning to my slumber.\""
      } else if (dragonInLoc) {
        prefix = "The dragon is unimpressed."
      } else if (goldInLoc) {
        prefix = "The dragon's hoard of gold is on the ground for the taking."
      } else {
        prefix = "Nothing notable. You would never guess that a magestic beast lost its life here."
      }

      return prefix + (dragonInLoc ? "" : "\n\n" + this.linkedLocationsString())
    }

    let dragon = MAEnemyFactory.newDragon()
    loc4_4.nouns.push(dragon)



    //
    // (5,4)
    //
    let loc5_4 = new MALocation("room 🎊🎉")
    this.addLocation(loc5_4)

    loc5_4.appearance = function() {
      return "Fresh air! Your nose is suddenly more aware of how stale and putrid the cavern air has been.\n\nBright light! You squint as you adjust to the warm and overwhemling sunlight.\n\nYou have escaped with your life and also new wealth! Congratulations!\n\nNow... where the heck are you?\n\nTHE END 🥳"
    }



    // Hook up the location graph
    // See map in Resources/map.png

    // Organized by row, using East and North to specify links

    // Row 0
    loc0_0.addLinkInDirection(MADirection.East, loc1_0)
    loc1_0.addLinkInDirection(MADirection.East, loc2_0)
    loc2_0.addLinkInDirection(MADirection.East, loc3_0)
    loc3_0.addLinkInDirection(MADirection.East, loc4_0)

    // Row 1
    loc0_1.addLinkInDirection(MADirection.East, loc1_1)
    loc1_1.addLinkInDirection(MADirection.North, loc1_0)
    loc2_1.addLinkInDirection(MADirection.North, loc2_0)
    loc2_1.addLinkInDirection(MADirection.East, loc3_1)

    // Row 2
    loc0_2.addLinkInDirection(MADirection.East, loc1_2)
    loc1_2.addLinkInDirection(MADirection.East, loc2_2)
    loc2_2.addLinkInDirection(MADirection.North, loc2_1)
    loc3_2.addLinkInDirection(MADirection.North, loc3_1)
    loc3_2.addLinkInDirection(MADirection.East, loc4_2)
    loc4_2.addLinkInDirection(MADirection.North, loc4_1)

    // Row 3
    loc0_3.addLinkInDirection(MADirection.North, loc0_2)
    loc0_3.addLinkInDirection(MADirection.East, loc1_3)
    loc2_3.addLinkInDirection(MADirection.North, loc2_2)
    loc2_3.addLinkInDirection(MADirection.East, loc3_3)
    loc3_3.addLinkInDirection(MADirection.East, loc4_3)

    // Row 4
    loc0_4.addLinkInDirection(MADirection.North, loc0_3)
    loc1_4.addLinkInDirection(MADirection.North, loc1_3)
    loc1_4.addLinkInDirection(MADirection.East, loc2_4)
    loc2_4.addLinkInDirection(MADirection.East, loc3_4)
    loc4_4.addLinkInDirection(MADirection.North, loc4_3)
    loc4_4.addLinkInDirection(MADirection.East, loc5_4)
  }

  addLocation(loc) {
    this.nameToLocation[loc.name] = loc
  }

  linkLocInDirToLoc(loc1Str, dir, loc2Str) {
    let loc1 = this.nameToLocation[loc1Str]
    let loc2 = this.nameToLocation[loc2Str]
    if (!loc1) {
      MALog.log("Couldn't find location: " + loc1Str)
    } else if (!loc2) {
      MALog.log("Couldn't find location: " + loc2Str)
    } else {
      loc1.addLinkInDirection(dir, loc2)
    }
  }


  //
  // Drawing emoji map
  //
  // Limitations:
  // This code only handles north/south/east/west links between locations

  // Populate nameToXY for all locations in the graph
  populateCoords(nameToXY, startLoc) {
    let minX = 0
    let minY = 0

    let locsToVisit = [ startLoc ]

    while (locsToVisit.length > 0) {
      let loc = locsToVisit.pop()

      let locXY = nameToXY[loc.name]
      let dirs = Object.keys(loc.directionToLocation).sort()

      for (let dir of dirs) {
        let linkedLoc = loc.directionToLocation[dir]

        if (nameToXY[linkedLoc.name]) {
          continue
        }

        let xDelta = 0
        if (dir == MADirection.East) {
          xDelta = 1
        } else if (dir == MADirection.West) {
          xDelta = -1
        }

        let yDelta = 0
        if (dir == MADirection.North) {
          yDelta = -1
        } else if (dir == MADirection.South) {
          yDelta = 1
        }

        let linkedLocXY = {x: locXY.x + xDelta, y: locXY.y + yDelta}
        nameToXY[linkedLoc.name] = linkedLocXY

        minX = Math.min(minX, linkedLocXY.x)
        minY = Math.min(minY, linkedLocXY.y)

        locsToVisit.push(linkedLoc)
      }
    }

    // Normalize all coordinates to be positive

    if (minX < 0 || minY < 0) {
      let locNames = Object.keys(nameToXY)
      for (let locName of locNames) {
        let xy = nameToXY[locName]
        xy.x += -minX
        xy.y += -minY
      }
    }
  }

  locToEmoji(loc, omitTop, omitLeft, showUser) {
    // Example:
    //  ⬛️⬛️⬛️⬛️
    //  ⬛️🦊🩸⬛️
    //  ⬛️▫️▫️▫️
    //  ⬛️⬛️⬛️⬛️

    var result = ""

    if (!loc) {
      let left = omitLeft ? "" : "⬛️"

      result +=
`${left}⬛️⬛️⬛️
${left}⬛️⬛️⬛️
${left}⬛️⬛️⬛️
${left}⬛️⬛️⬛️`

    } else {
      var roomName = loc.name.replace("room ", "")
      var userBlock = showUser ? "😶" : "▫️"
      var emptyBlock = "▫️"

      let northLoc = loc.directionToLocation[MADirection.North]
      let southLoc = loc.directionToLocation[MADirection.South]
      let westLoc = loc.directionToLocation[MADirection.West]
      let eastLoc = loc.directionToLocation[MADirection.East]

      var northDoor = northLoc ? "▫️" : "⬛️"
      var southDoor = southLoc ? "▫️" : "⬛️"
      var westDoor = westLoc ? "▫️" : "⬛️"
      var eastDoor = eastLoc ? "▫️" : "⬛️"

      // Black out if relevant locations aren't inspected
      if (!loc.inspected) {
        roomName = "⬛️⬛️"
        userBlock = "⬛️"
        emptyBlock = "⬛️"

        // Continue to show a door if the connected location is inspected
        northDoor = (!northLoc || !northLoc.inspected) ? "⬛️" : northDoor
        southDoor = (!southLoc || !southLoc.inspected) ? "⬛️" : southDoor
        westDoor = (!westLoc || !westLoc.inspected) ? "⬛️" : westDoor
        eastDoor = (!eastLoc || !eastLoc.inspected) ? "⬛️" : eastDoor
      }


      if (omitLeft) {
        result +=
`⬛️${northDoor}⬛️
${roomName}⬛️
${emptyBlock}${userBlock}${eastDoor}
⬛️${southDoor}⬛️`
      } else {
        result +=
`⬛️⬛️${northDoor}⬛️
⬛️${roomName}⬛️
${westDoor}${emptyBlock}${userBlock}${eastDoor}
⬛️⬛️${southDoor}⬛️`
      }
    }

    if (omitTop) {
      let lines = result.split("\n")
      lines.shift()
      result = lines.join("\n")
    }

    return result
  }

  emojiMap(currentLocation) {
    let nameToXY = {}

    let loc = this.startLocation
    nameToXY[loc.name] = {x: 0, y: 0}

    this.populateCoords(nameToXY, loc)

    // Convert nameToXY to an x,y grid (2d array)
    let grid = []
    let maxX = 0
    let maxY = 0

    let locNames = Object.keys(nameToXY)
    for (let locName of locNames) {
      let currLoc = this.nameToLocation[locName]
      let xy = nameToXY[locName]

      let yArr = grid[xy.x]
      if (!yArr) {
        yArr = []
        grid[xy.x] = yArr
      }
      grid[xy.x][xy.y] = currLoc

      maxX = Math.max(maxX, xy.x)
      maxY = Math.max(maxY, xy.y)
    }

    // Convert the grid of locations to a string
    // Omit the top line and left line for a room to avoid double-thick walls between rooms
    // (Keep the top-line for the top-most rooms (and left-line for left-most rooms) since those don't have neighbors)
    var result = ""

    for (var y = 0; y <= maxY; ++y) {
      var rowLines = []

      let omitTop = (y > 0)

      for (var x = 0; x <= maxX; ++x) {
        let omitLeft = (x > 0)

        let currLoc = grid[x] ? grid[x][y] : null
        let locLines = this.locToEmoji(currLoc, omitTop, omitLeft, currLoc==currentLocation).split("\n")

        var i = 0
        for (let line of locLines) {
          if (!rowLines[i]) {
            rowLines[i] = line
          } else {
            rowLines[i] += line
          }
          i++
        }
      }

      for (let rowLine of rowLines) {
        result += rowLine + "\n"
      }
    }

    return result
  }
}
