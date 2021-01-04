class MAMap {
  // Properties:
  // - nameToLocation[string] = MALocation instance
  // - startLocation = Library Lab; accessor

  constructor(gameState) {
    this.gameState = gameState
    this.nameToLocation = {}

    // Create all locations

    //
    // Back Alley
    //

    let loc_backAlley = new MALocation("🌆|🌆 back alley")
    this.startLocation = loc_backAlley
    this.addLocation(loc_backAlley)

    loc_backAlley.appearance = function() {
      let uninspectedDesc = "This isn't much, is it? Just the back sides of a couple of buildings, some peeling yellow paint, and not even much by way of windows to look in through. I think the place where we had the procedure done is just a block or two away, but I've already lost the door. I imagine they change it.\n\nThis alley runs north to the open street, towards the town square. That's the way we'll want to go first."

      let inspectedDesc = "There is nothing here but the back sides of a couple of buildings, some peeling yellow paint; not even much by way of windows to look in through.\n\nThis alley runs north to the open street, towards the town square."

      return this.inspected ? inspectedDesc : uninspectedDesc
    }

    let yellowBuildings = new MAScenery("yellow buildings", "The buildings are no doubt due for renovation, but haven't received it yet. There are no windows facing this way.")
    yellowBuildings.durabilityMessage = "The device warms up a bit in our hand, but fails. It doesn't have enough power to work on something as large as the yellow buildings."
    loc_backAlley.nouns.push(yellowBuildings)

    let yellowPaint = new MAScenery("yellow paint", "In this climate, of course, paint is quickly ruined by the sun.")
    yellowPaint.durabilityMessage = "A good thought — PAINT is a very linguistically productive word — but spread thin over a large area like this it's too hard for a low-powered letter-remover to work on."
    loc_backAlley.nouns.push(yellowPaint)

    let beigeBuildings = new MAScenery("beige buildings", "A little more beige than the buildings facing them, but just as shabby and free of windows.")
    beigeBuildings.durabilityMessage = "The device warms up a bit in our hand, but fails. It doesn't have enough power to work on something as large as the beige buildings."
    loc_backAlley.nouns.push(beigeBuildings)

    let dullHouse = new MAScenery("dull house", "The owners of the house obviously didn't want a view in this direction, as there aren't any windows to see through, just a wall scarred by decades of occasional remodeling.")
    loc_backAlley.nouns.push(dullHouse)



    //
    // Sigil Street
    //

    let loc_sigilStreet = new MALocation("🏬|🏬 Sigil Street")
    this.addLocation(loc_sigilStreet)

    loc_sigilStreet.appearance = function() {
      let prefix = "The buildings here are two and three stories, with shops at ground level and apartments above. The shops are closed for the holiday: a typographer's office, tourist boutiques of colorful skirts and ethnic bodices (rarely if ever worn by natives) and t-shirts covered with font designs."

      var middle = ""
      if (this.hasNounNamed("reflective window")) {
        middle = "\n\nPassing by the reflective window we catch the sight of our single blended body, and it creeps me out."
        if (this.inspected) {
          middle = "\n\nThe reflective window of the closed shops reflects our synthesized self."
        }
      }

      let suffix = "\n\nA narrow alley runs between buildings to the south, while the street continues east."
      return prefix + middle + suffix
    }

    let elderlyApartments = new MAScenery("elderly apartments", "From down here we can only see the shuttered windows and the occasional balcony or awning, but you can guess what they're probably like from the environment: old-fashioned inside, kitchens and bathrooms awkwardly fitted into niches and closets of buildings that weren't designed for plumbing. But they're also probably rather cozy and handsome, with exposed beams under the ceiling.")
    loc_sigilStreet.nouns.push(elderlyApartments)

    let reflectiveWindow = new MAScenery("reflective window")
    reflectiveWindow.appearance = function() {
      let prefix = "I have not gotten used to what we look like since we were synthesized into a single female body. The face that looks back is deeply scary. It's not me. And it's not you either. It's more like one of those computer composites you can have done to envision future offspring: if you and I were to have a somewhat androgynous daughter she might look like this."
      let suffix = this.inspected ? "" : "\n\nBut I am uncomfortable sharing a body, and uncomfortable looking into a mirror and seeing something other than my own face looking out.\n\nYou seem calmer about it: perhaps you've just had more time to reflect, or perhaps somehow you're filtering those emotions out for me. But I think we'll both be happier when we're split back into our own respective bodies."
      return prefix + suffix
    }
    loc_sigilStreet.nouns.push(reflectiveWindow)

    let boutiques = new MAScenery("tourist boutiques")
    boutiques.appearance = function() {
      let prefix = "We peruse the offerings: " + MAUtils.naturalLanguageStringForArray(this.nouns, "and") + "."

      let suffix = this.inspected ? "" : "\n\nI gather from your thoughts that you actually like some of the skirts, but I'd prefer that we skip the cross-dressing for now. Our synthesized body may be female but I'm still getting used to that."

      return prefix + suffix
    }
    loc_sigilStreet.nouns.push(boutiques)

    let colorfulSkirts = new MAScenery("colorful skirts", "Suitable for wearing while doing the local traditional dances, which are slightly Spanish.")
    boutiques.nouns.push(colorfulSkirts)

    let fontTshirts = new MAScenery("font t-shirts", `They feature more "serif" puns than anyone needs in a lifetime.`)
    boutiques.nouns.push(fontTshirts)

    let ethnicBodices = new MAScenery("ethnic bodices", "Closed with ribbons and laces, to be worn over frilly white shirts.")
    boutiques.nouns.push(ethnicBodices)

    let mourningDress = new MAScenery("mourning dress", "A black vintage gown trimmed with much lace and dripping with jet beads.")
    mourningDress.isPlural = function() { return false }
    boutiques.nouns.push(mourningDress)

    let narrowAlley = new MAScenery("narrow alley", "It looks forbidding and a bit unsanitary.")
    loc_sigilStreet.nouns.push(narrowAlley)

    let typographersOffice = new MAScenery("Typographer's office", "The office advertises custom fonts and symbols, though it is very unlikely that anyone decides to have a custom font made simply because they happened to catch a notice in a shop window. In honor of the holiday, there is also a display poster showing the form of the humble comma as it manifests itself in a variety of popular fonts.")
    loc_sigilStreet.nouns.push(typographersOffice)



    //
    // Ampersand Bend
    //

    let loc_ampersandBend = new MALocation("🏛|🏢 Ampersand Bend")
    this.addLocation(loc_ampersandBend)

    loc_ampersandBend.appearance = function() {
      let prefix = "A bend in the street, which runs west and north. This district combines the old and the new: a small museum in an ancient stone building to the east, a shiny real estate office south. The window of the museum is currently displaying one of its exhibits, "

      var exhibit = "a codex."
      if (this.museum.hasNounNamed("code")) {
        exhibit = "a code. Well, not to worry: they'll be able to restore the codex easily enough when the museum reopens."
      }

      let suffix = "\n\nThe sounds from the north suggest a holiday fair in full swing: children laughing and shouting, people selling food and drinks, various fairground machinery, tinny music. Scents of distant popcorn and candy waft this way.\n\nA temporary barrier blocks this empty street from the busy fair to the north"

      let temporaryBarrier = MAUtils.elementNamed(this.nouns, "temporary barrier")
      let barrierSuffix = !temporaryBarrier.unlocked ? ", though there is a door that could be opened with the correct code." : ", though it is currently unlocked and anyone could go through."

      return prefix + exhibit + suffix + barrierSuffix + " From here, the gaiety and excitement of the holiday are fairly loud."
    }

    let museum = new MAScenery("museum")
    museum.appearance = function() {
      let prefix = "One of several small museums around the older part of the island, celebrating the discovery of Atlantean language tools and the development of its modern society.\n\nThis particular museum is housed in a stone building. Parts of the old medieval city wall are still visible in the foundations.\n\nAll that can be seen of the exhibits is the external display window. On the other side of the protective tinted glass is a "

      let suffix = this.hasNounNamed("codex") ? "codex." : "code."
      return prefix + suffix
    }

    loc_ampersandBend.museum = museum
    loc_ampersandBend.nouns.push(museum)

    let codex = new MAScenery("codex", `A manuscript of Atlantean origin from the 16th century. It records a series of slightly mad visions of what the world would be like if the "composition of letters" could be systematically exchanged.\n\nAt that time, the name-driven nature of the universe was not yet understood, but some consciousness of it wiggled towards the surface like a breaking tooth. The lunatics were first to notice.\n\nI've visited this museum before and seen the inside, by the way. Many of the pages are filled with what we would now consider rather elementary rebus puzzles.`)
    museum.nouns.push(codex)

    let temporaryBarrier = new MAScenery("temporary barrier", "It's a high metal fence, supported by sturdy poles. It's designed to contain the chaos a little, and keep people who have come in for the fair from wandering off down the side streets and causing trouble in unpoliced areas of town. It has a code-lock that opens the inset door.")
    loc_ampersandBend.nouns.push(temporaryBarrier)

    let codeLock = new MAScenery("code-lock", "The kind of lock that can be set to a three-digit code, assuming one knows what the code is.")
    temporaryBarrier.nouns.push(codeLock)

    let realEstateOffice = new MAScenery("real estate office")
    realEstateOffice.appearance = function() {
      let prefix = `Advertisements in the window describe the offerings around town, from a studio apartment (looks like a fixer-upper) in Deep Street for $823,000 to a house near the university for $2.5M. Prices for villas in the northwestern part of town are all listed just as "Available on Inquiry."`

      let suffix = this.inspected ? "" : "\n\nI can tell you find all that shockingly overpriced, but trust me: land is scarce on this island and there are a lot of people who want to own it, not just locals but international corporations."

      return prefix + suffix
    }
    loc_ampersandBend.nouns.push(realEstateOffice)


    //
    // Fair
    //

    let loc_fair = new MALocation("🍬|🌭 Fair")
    this.addLocation(loc_fair)

    loc_fair.appearance = function() {
      let prefix = this.inspected ? "" : "Today is Serial Comma Day, one of the biggest holidays on the island, and a time when half the police force is off duty while the other half is over-extended. The perfect day to make an escape. "

      let middle = "The square at the center of town is crowded with people, and there's an overpowering smell of artificial butter and spun sugar.\n\nWe are surrounded by kiosks for spell-offs, face-painting"

      let wheelStr = this.hasNounNamed("wheel") ? ", a wheel to spin for prizes" : ""

      let suffix = ", and other activities best for small children or the very easily amused.\n\nIt smells like candy and popcorn, with a note of booze and another note of sweaty crowd.\n\nThe fair continues with a selection of carnival games to the west, and with open park to the north and east."

      return prefix + middle + wheelStr + suffix
    }

    let kiosks = new MAScenery("kiosks", "They're the usual tacky affairs of brightly painted fiberboard and cheap prizes. I don't see any likely to help us today, however.")
    kiosks.addAttribute("lookOnce")
    loc_fair.nouns.push(kiosks)

    let wheel = new MAScenery("wheel")
    wheel.appearance = function() {
      let prefix = "It's the sort of game where you spin the wheel for a prize."
      let suffix = this.inspected ? "" : " No one seems to be manning or using it any more, though; perhaps the supply of prizes has run out."
      return prefix + suffix
    }
    wheel.addAttribute("lookOnce")
    loc_fair.nouns.push(wheel)


    let randomFoodstuffs = new MAScenery("random foodstuffs", "An assortment of unwholesome things to eat are sold here, and since it's extremely hot, we smell all of them pungently and in rapid succession. If it's not my imagination, actually, I think this female nose is better than mine. (I've heard that women have a better sense of smell. This could be wrong.) At the moment that sensitivity is a liability, as disorienting as flashes of a colored strobe.")
    randomFoodstuffs.addAttribute("lookOnce")
    loc_fair.nouns.push(randomFoodstuffs)

    let crowds = new MAScenery("crowds", "The people seem to be enjoying themselves. I don't recognize anyone in particular, though.")
    crowds.addAttribute("lookOnce")
    loc_fair.nouns.push(crowds)


    //
    // Midway
    //

    let loc_midway = new MALocation("🍎|🍐 Midway")
    this.addLocation(loc_midway)

    loc_midway.appearance = function() {
      let prefix = "Here in front of the pharmacy in the southwestern corner of the town square, various contests have been set up — a strong-man hammering contest, a contest to see who can burst the most balloons using a styrofoam dart-plane, and so on.\n\n"

      let balanceIntro = this.hasNounNamed("barker") ? "I assume you've noticed, though," : "No longer so useful is"

      let balanceSuffix = " the word-balance, which comes up as high as our hip. " + MAUtils.elementNamed(this.nouns, "word-balance").appearance()

      let suffix = this.hasNounNamed("barker") ? "\n\nBeside the word-balance is a barker in a blue suit, the same regulation blue used by the Bureau of Orthography. The barker is also holding a tube." : ""

      return prefix + balanceIntro + balanceSuffix + suffix
    }

    let pharmacy = new MAScenery("pharmacy", "The pharmacy, like many of the other shops in the area, is closed so that the employees can enjoy Serial Comma Day. There's not much to see, as a shade has been pulled down behind the glass front. I can tell you what's back there, though, if you care: the usual assortment of shampoo and razors and analgesics and burn creams; candy, and also toothpaste; and a costly selection of homeopathic remedies in matching brown bottles.")
    pharmacy.addAttribute("lookOnce")
    loc_midway.nouns.push(pharmacy)

    let blankChurchWall = new MAScenery("blank church wall", "The blank wall separates off the church property that lies west of here. The wall is solid here, though the church can be entered from the church forecourt.")
    blankChurchWall.addAttribute("lookOnce")
    loc_midway.nouns.push(blankChurchWall)

    let hammerContest = new MAScenery("strong-man hammering contest", "It's one of those contests where you have to hammer something so that something else flies up and rings a bell. I don't have time for that kind of silly macho display.")
    hammerContest.addAttribute("lookOnce")
    loc_midway.nouns.push(hammerContest)

    let balloons = new MAScenery("balloons", "All stapled in place and ready to be attacked.")
    balloons.addAttribute("lookOnce")
    loc_midway.nouns.push(balloons)

    let actionAttackBalloons = new MAAction()
    actionAttackBalloons.verbString = function() {
      return "Attack [balloons]"
    }
    actionAttackBalloons.description = function() {
      return "(attack) balloons"
    }
    actionAttackBalloons.performHandler = function(gameState) {
      let logs = [
        "Better to leave that nonsense to the little ones.",
        "Come on, we'll never get away if you insist on lollygagging!",
        "We have better things to do, remember?",
      ]
      gameState.log.log(MAUtils.fakeRandomElement(logs, gameState))
    }
    balloons.action = actionAttackBalloons

    let darts = new MAScenery("styrofoam dart-plane", "Ridiculous little styrofoam gliders with dart-noses. No use to us, anyway.")
    darts.addAttribute("lookOnce")
    loc_midway.nouns.push(darts)


    let wordBalance = new MAScenery("word-balance")
    wordBalance.appearance = function() {
      let isBalanced = (this.nouns.length == 0) || (this.hasNounNamed("apple") && this.hasNounNamed("pear"))

      var contents = "Both pans are empty."
      if (this.nouns.length == 2) {
        contents = `On the right pan is ${this.nouns[0].inSentenceName()} and on the left is ${this.nouns[1].inSentenceName()}.`
      } else if (this.nouns.length == 1) {
        contents = `One pan contains ${this.nouns[0].inSentenceName()} and the other pan is empty.`
      }

      return `The beam is ${isBalanced ? "balanced" : "tilting"}. ` + contents
    }
    wordBalance.inspected = true
    loc_midway.nouns.push(wordBalance)

    let apple = new MANoun("apple", "Red-cheeked and rosy.")
    apple.attributes = ["edible", "plant"]
    apple.scentDescription = "apple juice"
    apple.addAttribute("lookOnce")
    wordBalance.nouns.push(apple)

    let pear = new MANoun("pear", "Handsome and green.")
    pear.attributes = ["edible", "plant"]
    pear.addAttribute("lookOnce")
    wordBalance.nouns.push(pear)

    let pearl = new MANoun("pearl", "It is small, slightly uneven, and pale blue in color. Not worth very much, but genuine.")
    pearl.weight = MANounWeight.Tiny

    pear.backingNouns = [pearl]


    let barker = new MAScenery("barker", "He is dapper in his suit, as though he might belong to an especially vivid barber-shop quartet.")
    barker.addAttribute("lookOnce")
    loc_midway.nouns.push(barker)

    let blueSuit = new MAScenery("blue suit", "Carefully tailored in bright blue linen, with fine white pinstripes.")
    blueSuit.addAttribute("lookOnce")
    barker.nouns.push(blueSuit)

    let tube = new MANoun("tube", "It claims to be full of restoration gel, but said gel is mostly gone. If only it had been a larger container to start with.")
    tube.isEssential = true
    tube.scentDescription = "mint"
    tube.addAttribute("lookOnce")
    barker.nouns.push(tube)


    //
    // Park Center
    //

    let loc_parkCenter = new MALocation("👩‍👧‍👧|🌱 Park Center")
    this.addLocation(loc_parkCenter)

    loc_parkCenter.appearance = function() {
      let innerFountain = MAUtils.elementNamed(this.nouns, "marble fountain")
      let hasHorses = innerFountain && innerFountain.hasNounNamed("horses")
      let hasHoses = innerFountain && innerFountain.hasNounNamed("hoses")

      let fountainStr = `${hasHorses ? "an impressive" : "a desecrated"} marble fountain${hasHoses ? ", currently spewing water in all directions" : ""}`

      let smallChildrenStr = this.inspected ? "" : "\n\nI gather from the direction of your thoughts that you dislike small children, so I'll restrain myself from trying to communicate with them."

      let soundStr = hasHoses ? "The sound of children shrieking and jumping through fountain water is by far the loudest component of the assorted din filling the air." : "We can hear children laughing and shouting, people selling food and drinks, various fairground machinery, tinny music, adult conversations, flowing water in the fountain."

      return `This is a handsome expanse of grass, shaped like a rectangle with rounds cut from the corners, bounded by railings along the north side. There are no stalls and no barkers here, but small children are running around ${fountainStr}.${smallChildrenStr}\n\n${soundStr}`
    }


    let railings = new MAScenery("railings", "Painted railings separate the Park and surrounding pedestrian areas from the private property to the north. Some lipstick advertisements have been hung over the railings.")
    railings.addAttribute("lookOnce")
    loc_parkCenter.nouns.push(railings)

    let lipstickAds = new MAScenery("lipstick advertisements", "Over the image of a pouting, lipsticked female, it says: IN EVERY TEMPTRESS THERE IS AN EMPRESS — MAKE YOURSELF UP TO A T! It's selling Temptress Brand cosmetics, apparently.")
    lipstickAds.addAttribute("lookOnce")
    railings.nouns.push(lipstickAds)


    let smallChildren = new MAScenery("small children")
    smallChildren.appearance = function() {
      let innerFountain = MAUtils.elementNamed(loc_parkCenter.nouns, "marble fountain")
      let hasHoses = innerFountain && innerFountain.hasNounNamed("hoses")

      return hasHoses ? "Most of them are now sopping wet, and loving it." : "They look small and harmless, but you're probably right that they have sticky hands."
    }
    loc_parkCenter.nouns.push(smallChildren)


    let grass = new MAScenery("grass", "Deep green and velvety.")
    grass.isPlural = () => false
    grass.indefiniteArticle = () => "some"
    grass.addAttribute("plant")
    grass.addAttribute("lookOnce")
    loc_parkCenter.nouns.push(grass)


    let fountain = new MAScenery("marble fountain")
    fountain.appearance = function() {
      let hasHorses = this.hasNounNamed("horses")
      let hasHoses = this.hasNounNamed("hoses")
      let hasHoe = this.hasNounNamed("hoe")

      var desc = "The former majesty of the fountain has been extensively vandalized"
      if (hasHorses) {
        desc = "It depicts some horses rising out of the waves, with trident-bearing gods on their backs, and some nymphs overseeing the whole operation. Probably 17th-century, to judge by the excessive number of writhing figures"
      } else if (hasHoses) {
        desc = "The nymphs and trident-bearing gods are now aiming hoses out at passers-by"
      } else if (hasHoe) {
        desc = "A single bewildered nymph is carrying a hoe, which presumably isn't much use out at sea"
      }

      let uninspectedStr = this.inspected ? "" : "\n\nThe fountain celebrates — if that's the right word — the conquest of this island by the Dutch in 1607, it having been a Spanish possession for about 140 years before that.\n\nIn spite of this the fountain bears not a word of any foreign language, the original Latin or vernacular inscriptions having been long since renovated away."

      return `${desc}.\n\nThe basin is nearly full of clear water, but there are no coins or other useful articles to be found. This is not a culture that tends to discard what might be of use.${uninspectedStr}`
    }
    loc_parkCenter.nouns.push(fountain)

    let horses = new MAScenery("horses", "Their eyes are wide and their nostrils flared with excitement.")
    horses.addAttribute("lookOnce")
    fountain.nouns.push(horses)

    let sculptedFigures = new MAScenery("sculpted figures", "Nereids and Tritons, apparently, together with tame fish, conch shells, and other representatives of the goods of the sea.")
    sculptedFigures.addAttribute("lookOnce")
    fountain.nouns.push(sculptedFigures)

    let inscriptions = new MAScenery("inscriptions", "Whatever writing once graced the fountain, it has been chiseled off because it wasn't in English.")
    inscriptions.addAttribute("lookOnce")
    fountain.nouns.push(inscriptions)


    //
    // Heritage Corner
    //

    let loc_heritageCorner = new MALocation("👯‍♀️|👯‍♀️ Heritage Corner")
    this.addLocation(loc_heritageCorner)

    loc_heritageCorner.appearance = function() {
      let hostelVisited = this.linkedLocations().filter(x => x.name.endsWith("Hostel"))[0].visited

      let uninspectedDesc = this.inspected ? "" : "\n\nNo, there aren't any here *now*. But trust me. It's an unforgettable sight."
      let hostelDesc = hostelVisited ? "the hostel" : "a backpackers' hostel where you've stayed recently and where you stowed the rest of your important possessions"

      return `This patch of the town square has been paved over in octagonal bricks and is commonly used for displays of traditional dancing: over-50 women in home-made embroidered aprons, skipping arm-in-arm and jumping over broomsticks.${uninspectedDesc}\n\nUnder a bit of shelter in the corner, a diorama table shows scenes from local history, rotated out each week. This week's diorama represents the first sitting of the Committee for the New Orthodox Orthography.\n\nThe park continues to the north and west; to the east is ${hostelDesc}.`
    }


    let bakery = new MAScenery("bakery", "It's closed today and so there are no products on display, since nothing was baked this morning. But on any other day the windows would be stocked with round and oblong loaves, olive bread, crescent pastries, and a traditional specialty, a kind of savory muffin studded with pine nuts.")
    bakery.addAttribute("lookOnce")
    loc_heritageCorner.nouns.push(bakery)

    let hostel = new MAScenery("hostel", "It's a narrow brick townhouse with only one or two rooms on each floor, and silly ornamental brickwork up near the skyline. The label over the entrance merely announces a generic hostel, without the dignity of a name.")
    hostel.addAttribute("lookOnce")
    loc_heritageCorner.nouns.push(hostel)

    let bricks = new MAScenery("octagonal bricks", "Alternating with square bricks of a slightly darker shade of maroon. Nothing about this seems remotely significant.")
    bricks.addAttribute("lookOnce")
    loc_heritageCorner.nouns.push(bricks)

    let shelter = new MAScenery("shelter", "Little more than a clear plastic hood to protect the diorama beneath.")
    shelter.addAttribute("lookOnce")
    loc_heritageCorner.nouns.push(shelter)

    let diorama = new MAScenery("diorama")
    diorama.appearance = function() {
      let hasArmy = this.hasNounNamed("army")
      let hasMembers = this.hasNounNamed("members")
      let hasMember = this.hasNounNamed("member")

      var contentsStr = " Both the army and members are missing."
      if (hasArmy && hasMembers) {
        contentsStr = "";
      } else if (hasArmy && hasMember) {
        contentsStr = " The members have been reduced to a single member.";
      } else if (hasArmy) {
        contentsStr = " The members have been removed.";
      } else if (!hasArmy && hasMembers) {
        contentsStr = " The army has been removed."
      } else if (!hasArmy && hasMember) {
        contentsStr = " The army has been removed; the members have been reduced to a single member."
      }

      var movableStr = ""
      if (!hasArmy && !hasMembers && !hasMember) {
        movableStr = "\n\nThe scenery appears to have been hot-glued in place."
      } else {
        let nounNames = this.nouns.map(x => x.name) // Use nounNames instead of nouns to avoid including their indefiniteArticles
        let nounNamesStr = MAUtils.naturalLanguageStringForArray(nounNames, "and")
        let verb = this.nouns.count > 1 ? "are" : this.nouns[0].isAre()

        movableStr = `\n\nThe ${nounNamesStr} ${verb} movable, but the rest of the scenery appears to have been hot-glued in place.`
      }

      return `The patriotic scene is set against the backdrop of the Bureau's buildings ca. 1895, where the committee first met, but the historians have included a bit of the building exterior to show that the meetings were conducted under army guard. The writing of dictionaries has not always been bloodless.${contentsStr}${movableStr}`
    }
    loc_heritageCorner.nouns.push(diorama)

    let members = new MANoun("members", "Mostly men and a few women, sternly dressed and with solemn expressions.")
    members.addAttribute("naughtySounding")
    members.addAttribute("lookOnce")
    diorama.nouns.push(members)

   let army = new MANoun("army", "A collection of soldier figurines in blue uniforms.")
    army.addAttribute("lookOnce")
    diorama.nouns.push(army)



    //
    // Hostel
    //

    let loc_hostel = new MALocation("👩‍💻|📖 Hostel")
    this.addLocation(loc_hostel)

    loc_hostel.appearance = function() {
      let hasDeskAttendant = this.hasNounNamed("desk attendant")

      var attendantStr = ""
      if (hasDeskAttendant) {
        attendantStr = this.inspected ? "\n\nThe desk attendant is sort of eying us. She is wearing a nose-ring and a blouse." : "\n\nThe desk attendant is sort of eying us. She doesn't recognize you — us — but that's a good thing, I think."
      }

      let guidebookStr = this.hasNounNamed("Guidebook to Anglophone Atlantis") ? "\n\nDiscarded in one corner is a Guidebook to Anglophone Atlantis." : ""

      return `I take it this is where you stayed from the time you got to town until our operation. I would have expected that someone with your credentials would have been able to afford something better: The Fleur d'Or, maybe? But maybe you thought this was lower-profile. At least it's clean and doesn't smell funny.${attendantStr}${guidebookStr}\n\nThere's a narrow hallway that leads south to the dormitory rooms.`
    }

    let narrowHallway = new MAScenery("narrow hallway", "Narrow with a few steps to account for a change in grade. This is not kind to people with luggage, but people with luggage are supposed to stay in real hotels.")
    narrowHallway.addAttribute("lookOnce")
    loc_hostel.nouns.push(narrowHallway)

    let ceiling = new MAScenery("ceiling", "The ceiling is a little cracked but in no way fascinating.")
    ceiling.addAttribute("lookOnce")
    loc_hostel.nouns.push(ceiling)

    let deskAttendant = new MAScenery("desk attendant", "She's dressed in a kind of casual-hippy way: nose ring, poofy blouse that doesn't fit quite right.")
    deskAttendant.addAttribute("lookOnce")
    deskAttendant.addAttribute("person")
    loc_hostel.nouns.push(deskAttendant)

    let blouse = new MAScenery("blouse", "White cotton with little ribbons on it. I hate that kind of frilly nonsense.")
    blouse.addAttribute("lookOnce")
    deskAttendant.nouns.push(blouse)

    let noseRing = new MAScenery("nose ring", "It's silver and reasonably discreet.")
    noseRing.addAttribute("lookOnce")
    deskAttendant.nouns.push(noseRing)

    let attendantsDesk = new MAScenery("attendant's desk", "Formica with a fake wood grain.")
    attendantsDesk.addAttribute("lookOnce")
    loc_hostel.nouns.push(attendantsDesk)

    let guidebook = new MAScenery("Guidebook to Anglophone Atlantis", "A much-thumbed and several years out-of-date guidebook to this immediate area. The cover is tomato-red but the pages are crinkly and beige: it appears that someone has spilled coffee on it.\n\nThere's too much here to take in with a quick read.")
    guidebook.addAttribute("lookOnce")
    loc_hostel.nouns.push(guidebook)



    //
    // Dormitory Room
    //

    let loc_dorm = new MALocation("🛏|🔒 Dormitory Room")
    this.addLocation(loc_dorm)

    loc_dorm.appearance = function() {
      let innerLocker = MAUtils.elementNamed(this.nouns, "locker")
      let isLocked = innerLocker.hasNounNamed("lock")

      let lockerStr = "\n\nThe locker you identify as your own sits near one of the beds, " + (isLocked ? "still locked with its dial lock." : "no longer locked.")

      let girlPresent = this.hasNounNamed("backpacking girl")
      var girlStr = ""
      var girlDialog = ""

      if (girlPresent) {
        girlStr = this.inspected ? "\n\nThe backpacking girl is still hanging out here. She is carrying a heavy pack and wearing a pink t-shirt." : "\n\nA girl of about 19 is standing in the middle of the room, looking around as though she can't quite believe where she landed or what she's doing here. She is carrying a heavy pack and wearing a pink t-shirt.\n\n\"Hey,\" says the girl. \"Do you think this place is safe?\" asks the girl conspiratorially.\n\nI must look blank, because she goes on, \"I saw this documentary once, right, about a serial killer who went from youth hostel to youth hostel, grooming girls and killing them. And then he'd chop up the bodies and put the body parts into the lockers. And no one would find out until he'd gone away again.\"\n\nNothing like that has happened around here, but she seems to get a charge out of scaring herself with this story."

        if (this.inspected) {
          let dialogStrs = [
            `\n\n"Hey," says the girl.`,
            //`\n\nThe girl takes our reappearance in stride.`,
          ]
          girlDialog = MAUtils.fakeRandomElement(dialogStrs, gameState)
        }
      }

      return `Painted off-white, with hard wood floors under many layers of protective gloss coating: there are no surfaces in this room that would take a stain. Four dorm beds are lined up against the wall.${lockerStr}${girlStr}${girlDialog}`
    }

    let dormBeds = new MAScenery("dorm beds", "At this time of day, since everyone is checked out, the beds are all stripped down to bare mattress. Linens may be rented at the front desk — but we're not staying here tonight, so there's no need to experience the thinning sheets and the pilled woolen blankets. Your memory is enough for both of us.")
    dormBeds.addAttribute("lookOnce")
    loc_dorm.nouns.push(dormBeds)

    let hardWoodFloors = new MAScenery("hard wood floors", "The floors are designed to be scrubbed clean every single day, leaving no trace of what might have come or gone.")
    hardWoodFloors.addAttribute("lookOnce")
    loc_dorm.nouns.push(hardWoodFloors)


    let locker = new MAScenery("locker")
    locker.appearance = function() {
      let lockStr = this.hasNounNamed("lock") ? ", and in fact someone (such as yourself) has put a lock on this one" : ", but it is currently bare"

      return `A standard metal locker for travelers to leave their valuable possessions in when they go out — or while they sleep, since one's bunkmates are not always to be trusted. It is of the kind that requires the traveler to bring his own lock${lockStr}.`
    }
    loc_dorm.nouns.push(locker)

    let lock = new MANoun("lock")
    lock.appearance = function() {
      let lockDescs = [
        "The dial turns smoothly — much too smoothly. There are no clicks, no tiny ticks of inward mechanisms working. By the feel of it, there might be no real locking device here at all.",
        "Still no numbers on the dial. My mother had a wristwatch like that once. Always a nuisance.",
        "I once again contemplate the absence of traditional combination markings on the lock. It must not be meant to be unlocked in the usual way.",
        "It's your lock: you brought it with you and put it on the locker. So you must have had some way of opening it again, and not something that would depend on having a clear memory after the operation, either. I don't suppose you remember at all?",
      ]

      return this.inspected ? MAUtils.fakeRandomElement(lockDescs, gameState) : "It's curious, now you look at it: it's a combination lock with a dial face, but no one has bothered putting any numerals onto the dial."
    }
    lock.isFixedInPlace = true
    locker.nouns.push(lock)

    let clock = new MANoun("clock", "It appears to be one of those archetypal alarm clocks that crows at sunrise and generally makes a nuisance of itself.")
    clock.addAttribute("lookOnce")
    lock.backingNouns = [ clock ]


    let backpackingGirl = new MAScenery("backpacking girl", "She is just the sort of tourist who most annoys the locals, but actually I find her type a little endearing: she may not be very sophisticated yet, but she *wants* to expand her horizons, and that's more than you can say for most of the friends she probably left back at home.")
    backpackingGirl.addAttribute("person")
    loc_dorm.nouns.push(backpackingGirl)

    let pinkShirt = new MAScenery("pink t-shirt", "It is somewhat too tight and bears the word JUICY in rhinestones across the bust.")
    pinkShirt.addAttribute("lookOnce")
    backpackingGirl.nouns.push(pinkShirt)

    let heavyPack = new MAScenery("heavy pack", "The flag of Canada is sewn on the back.")
    heavyPack.addAttribute("lookOnce")
    loc_dorm.nouns.push(heavyPack)



    // Hook up the location graph

    loc_backAlley.addLinkInDirection(MADirection.North, loc_sigilStreet)
    loc_sigilStreet.addLinkInDirection(MADirection.East, loc_ampersandBend)
    loc_ampersandBend.addLinkInDirection(MADirection.North, loc_fair)
    loc_fair.addLinkInDirection(MADirection.West, loc_midway)
    loc_fair.addLinkInDirection(MADirection.North, loc_parkCenter)
    loc_fair.addLinkInDirection(MADirection.East, loc_heritageCorner)
    loc_heritageCorner.addLinkInDirection(MADirection.East, loc_hostel)
    loc_hostel.addLinkInDirection(MADirection.South, loc_dorm)
  }

  addLocation(loc) {
    if (this.nameToLocation[loc.name]) {
      console.log(`BUG: Asked to add a location twice for name ${loc.name}`)
      throw "Map.addLocation error\n" + (new Error()).stack
    }
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

  locToEmoji(loc, omitTop, omitLeft, showUser, separator) {
    // Example:
    //  ⬛️⬛️⬛️⬛️
    //  ⬛️🦊🩸⬛️
    //  ⬛️▫️▫️▫️
    //  ⬛️⬛️⬛️⬛️

    if (!separator) {
      separator = ""
    }

    var result = ""

    if (!loc) {
      let left = omitLeft ? "" : ("🌳" + separator)

      result +=
`${left}🌳${separator}🌳${separator}🌳
${left}🌳${separator}🌳${separator}🌳
${left}🌳${separator}🌳${separator}🌳
${left}🌳${separator}🌳${separator}🌳`

    } else {
      var roomName = loc.name.split(" ")[0]
      var userBlock = showUser ? "😶" : "▫️"
      var emptyBlock = "▫️"

      let northLoc = loc.directionToLocation[MADirection.North]
      let southLoc = loc.directionToLocation[MADirection.South]
      let westLoc = loc.directionToLocation[MADirection.West]
      let eastLoc = loc.directionToLocation[MADirection.East]

      var northDoor = northLoc ? "▫️" : "🌳"
      var southDoor = southLoc ? "▫️" : "🌳"
      var westDoor = westLoc ? "▫️" : "🌳"
      var eastDoor = eastLoc ? "▫️" : "🌳"

      // Black out if relevant locations aren't inspected
      if (!loc.inspected) {
        roomName = `🌳${separator}🌳`
        userBlock = "🌳"
        emptyBlock = "🌳"

        // Continue to show a door if the connected location is inspected
        northDoor = (!northLoc || !northLoc.inspected) ? "🌳" : northDoor
        southDoor = (!southLoc || !southLoc.inspected) ? "🌳" : southDoor
        westDoor = (!westLoc || !westLoc.inspected) ? "🌳" : westDoor
        eastDoor = (!eastLoc || !eastLoc.inspected) ? "🌳" : eastDoor
      }


      if (omitLeft) {
        result +=
`🌳${separator}${northDoor}${separator}🌳
${roomName}${separator}🌳
${emptyBlock}${separator}${userBlock}${separator}${eastDoor}
🌳${separator}${southDoor}${separator}🌳`
      } else {
        result +=
`🌳${separator}🌳${separator}${northDoor}${separator}🌳
🌳${separator}${roomName}${separator}🌳
${westDoor}${separator}${emptyBlock}${separator}${userBlock}${separator}${eastDoor}
🌳${separator}🌳${separator}${southDoor}${separator}🌳`
      }
    }

    if (omitTop) {
      let lines = result.split("\n")
      lines.shift()
      result = lines.join("\n")
    }

    return result
  }

  emojiMap(currentLocation, separator) {
    if (!separator) {
      separator = ""
    }

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
        let locLines = this.locToEmoji(currLoc, omitTop, omitLeft, currLoc==currentLocation, separator).split("\n")

        var i = 0
        for (let line of locLines) {
          if (!rowLines[i]) {
            rowLines[i] = line
          } else {
            rowLines[i] += separator + line
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
