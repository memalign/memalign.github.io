class MAMap {
  // Properties:
  // - nameToLocation[string] = MALocation instance
  // - startLocation = MALocation instance; accessor
  // - ghostStartLocation = MALocation instance; accessor

  constructor(gameState) {
    this.gameState = gameState
    this.nameToLocation = {}

    // Create all locations

    let dot = new MAScenery("dot", "Edible yet unsatisfying.")

    let sharedAppearance = function() {
      let entropy = parseInt(this.name.replace(/[\(,\)]/g, ""))

      let descs = [
        "A dank and dark room.",
        "The smell of mildew permeates the room.",
        "A chamber in this endless maze.",
        "Dimly lit and filled with stale air.",
        "Stale air and dim lighting.",
        "A catacomb-like chamber.",
        "Another depressing cubicle.",
        "More like a very spacious coffin than a room.",
        "Another cave-like room.",
        "The dungeon continues.",
        "A dark, depressing cell.",
      ]

      let randDesc = descs[MAUtils.fakeRandomInt(entropy, descs.length)]

      let powerPelletStr = this.hasNounNamed("power pellet") ? "\n\nThe power pellet gives off a warm glow." : ""

      var portalStr = ""
      if (this.westPortal) {
        portalStr = " A mysterious void extends to the west."
      } else if (this.eastPortal) {
        portalStr = " A mysterious void extends to the east."
      }

      return randDesc + "\n\n" + this.visibleNounsString() + powerPelletStr + "\n\n" + this.linkedLocationsString() + portalStr
    }

    // (0,0)
    let loc0_0 = new MALocation("(0,0)")
    loc0_0.appearance = sharedAppearance
    this.addLocation(loc0_0)
    loc0_0.nouns.push(dot)
    // (1,0)
    let loc1_0 = new MALocation("(1,0)")
    loc1_0.appearance = sharedAppearance
    this.addLocation(loc1_0)
    loc1_0.nouns.push(dot)
    // (3,0)
    let loc3_0 = new MALocation("(3,0)")
    loc3_0.appearance = sharedAppearance
    this.addLocation(loc3_0)
    loc3_0.nouns.push(dot)
    // (4,0)
    let loc4_0 = new MALocation("(4,0)")
    loc4_0.appearance = sharedAppearance
    this.addLocation(loc4_0)
    loc4_0.nouns.push(dot)
    // (1,1)
    let loc1_1 = new MALocation("(1,1)")
    loc1_1.appearance = sharedAppearance
    this.addLocation(loc1_1)
    loc1_1.nouns.push(dot)

    // (2,1)
    let loc2_1 = new MALocation("(2,1)")
    loc2_1.appearance = sharedAppearance
    this.addLocation(loc2_1)
    let powerPellet = new MAScenery("power pellet", "A glowing orb, emanating warmth.")
    loc2_1.nouns.push(powerPellet)

    let ghost = new MAScenery("ghost", "Floating and spooky.")
    ghost.invisible = true // Mark ghost as invisible so it isn't listed as part of the room's contents right before it automatically moved elsewhere
    loc2_1.nouns.push(ghost)

    this.ghostStartLocation = loc2_1


    // (3,1)
    let loc3_1 = new MALocation("(3,1)")
    loc3_1.appearance = sharedAppearance
    this.addLocation(loc3_1)
    loc3_1.nouns.push(dot)
    // (0,2)
    let loc0_2 = new MALocation("(0,2)")
    loc0_2.appearance = sharedAppearance
    this.addLocation(loc0_2)
    loc0_2.nouns.push(dot)
    // (1,2)
    let loc1_2 = new MALocation("(1,2)")
    loc1_2.appearance = sharedAppearance
    this.addLocation(loc1_2)
    loc1_2.nouns.push(dot)
    // (3,2)
    let loc3_2 = new MALocation("(3,2)")
    loc3_2.appearance = sharedAppearance
    this.addLocation(loc3_2)
    loc3_2.nouns.push(dot)
    // (4,2)
    let loc4_2 = new MALocation("(4,2)")
    loc4_2.appearance = sharedAppearance
    this.addLocation(loc4_2)
    loc4_2.nouns.push(dot)
    // (1,3)
    let loc1_3 = new MALocation("(1,3)")
    loc1_3.appearance = sharedAppearance
    this.addLocation(loc1_3)
    loc1_3.nouns.push(dot)

    // (2,3)
    let loc2_3 = new MALocation("(2,3)")
    this.addLocation(loc2_3)

    this.startLocation = loc2_3

    loc2_3.appearance = function() {
      let beginning = this.inspected ? "" : "You open your eyes and find yourself in dimly lit surroundings. You are shocked to find that your body has somehow become a smooth yellow sphere. You panic. Your giant wedge-shaped mouth gapes open as you gasp for air.\n\n"

      var middle = "The air is damp and cool. The smell ...and taste... of mildew reminds you of an old basement. Being mostly mouth has unlocked new gustatory experiences for you."
      if (this.inspected) {
        middle = "The air is damp and cool. The smell and taste of mildew reminds you of an old basement."
      }

      let ending = this.inspected ? "" : "\n\nYou spot a round morsel and are suddenly overwhelmed by hunger. CHOMP. Nearly flavorless and similarly unsatiating."

      return beginning + middle + ending + "\n\n" + this.nounsAndLocationsString()
    }


    // (3,3)
    let loc3_3 = new MALocation("(3,3)")
    loc3_3.appearance = sharedAppearance
    this.addLocation(loc3_3)
    loc3_3.nouns.push(dot)
    // (0,4)
    let loc0_4 = new MALocation("(0,4)")
    loc0_4.appearance = sharedAppearance
    this.addLocation(loc0_4)
    loc0_4.nouns.push(dot)
    // (1,4)
    let loc1_4 = new MALocation("(1,4)")
    loc1_4.appearance = sharedAppearance
    this.addLocation(loc1_4)
    loc1_4.nouns.push(dot)
    // (3,4)
    let loc3_4 = new MALocation("(3,4)")
    loc3_4.appearance = sharedAppearance
    this.addLocation(loc3_4)
    loc3_4.nouns.push(dot)
    // (4,4)
    let loc4_4 = new MALocation("(4,4)")
    loc4_4.appearance = sharedAppearance
    this.addLocation(loc4_4)
    loc4_4.nouns.push(dot)



    // Hook up the location graph
    // See map in Resources/map.png

    // Organized by row, using East and North to specify links

    // Row 0
    loc0_0.addLinkInDirection(MADirection.East, loc1_0)
    loc3_0.addLinkInDirection(MADirection.East, loc4_0)

    // Row 1
    loc1_1.addLinkInDirection(MADirection.North, loc1_0)
    loc1_1.addLinkInDirection(MADirection.East, loc2_1)
    loc2_1.addLinkInDirection(MADirection.East, loc3_1)
    loc3_1.addLinkInDirection(MADirection.North, loc3_0)

    // Row 2
    loc0_2.addLinkInDirection(MADirection.East, loc1_2)
    loc1_2.addLinkInDirection(MADirection.North, loc1_1)
    loc3_2.addLinkInDirection(MADirection.East, loc4_2)
    loc3_2.addLinkInDirection(MADirection.North, loc3_1)

    loc0_2.westPortal = loc4_2
    loc4_2.eastPortal = loc0_2

    // Row 3
    loc1_3.addLinkInDirection(MADirection.North, loc1_2)
    loc1_3.addLinkInDirection(MADirection.East, loc2_3)
    loc2_3.addLinkInDirection(MADirection.East, loc3_3)
    loc3_3.addLinkInDirection(MADirection.North, loc3_2)

    // Row 4
    loc0_4.addLinkInDirection(MADirection.East, loc1_4)
    loc1_4.addLinkInDirection(MADirection.North, loc1_3)
    loc3_4.addLinkInDirection(MADirection.East, loc4_4)
    loc3_4.addLinkInDirection(MADirection.North, loc3_3)
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

  locations() {
    return Object.values(this.nameToLocation)
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
      let left = omitLeft ? "" : ("⬛️" + separator)

      result +=
`${left}⬛️${separator}⬛️${separator}⬛️
${left}⬛️${separator}⬛️${separator}⬛️
${left}⬛️${separator}⬛️${separator}⬛️
${left}⬛️${separator}⬛️${separator}⬛️`

    } else {
      var dotStr = "▫️"
      if (loc.hasNounNamed("dot")) {
        dotStr = "🟡"
      } else if (loc.hasNounNamed("power pellet")) {
        dotStr = "⭐️"
      }

      var ghostStr = "▫️"
      if (loc.hasNounNamed("ghost")) {
        ghostStr = "👻"
      } else if (loc.hasNounNamed("scared ghost")) {
        ghostStr = "🥶"
      } else if (loc.hasNounNamed("floating eyes")) {
        ghostStr = "👀"
      }

      let roomName = dotStr + separator + ghostStr

      var userBlock = showUser ? "😶" : "▫️"
      var fruitBlock = loc.hasNounNamed("cherries") ? "🍒" : "▫️"

      let northLoc = loc.directionToLocation[MADirection.North]
      let southLoc = loc.directionToLocation[MADirection.South]
      let westLoc = loc.directionToLocation[MADirection.West]
      let eastLoc = loc.directionToLocation[MADirection.East]

      var northDoor = northLoc ? "▫️" : "⬛️"
      var southDoor = southLoc ? "▫️" : "⬛️"
      var westDoor = (westLoc || loc.westPortal) ? "▫️" : "⬛️"
      var eastDoor = (eastLoc || loc.eastPortal) ? "▫️" : "⬛️"

      let hideUninspected = false

      // Black out if relevant locations aren't inspected
      if (hideUninspected && !loc.inspected) {
        roomName = `⬛️${separator}⬛️`
        userBlock = "⬛️"
        fruitBlock = "⬛️"

        // Continue to show a door if the connected location is inspected
        northDoor = (!northLoc || !northLoc.inspected) ? "⬛️" : northDoor
        southDoor = (!southLoc || !southLoc.inspected) ? "⬛️" : southDoor
        westDoor = (!westLoc || !westLoc.inspected) ? "⬛️" : westDoor
        eastDoor = (!eastLoc || !eastLoc.inspected) ? "⬛️" : eastDoor
      }


      if (omitLeft) {
        result +=
`⬛️${separator}${northDoor}${separator}⬛️
${roomName}${separator}⬛️
${fruitBlock}${separator}${userBlock}${separator}${eastDoor}
⬛️${separator}${southDoor}${separator}⬛️`
      } else {
        result +=
`⬛️${separator}⬛️${separator}${northDoor}${separator}⬛️
⬛️${separator}${roomName}${separator}⬛️
${westDoor}${separator}${fruitBlock}${separator}${userBlock}${separator}${eastDoor}
⬛️${separator}⬛️${separator}${southDoor}${separator}⬛️`
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
