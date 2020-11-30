function uuidv4() {
  // From https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


const MAUtils = {
  fakeRandomInt: function(entropy, maxValue) {
    return Math.floor(Math.sqrt(entropy) * 7) % maxValue
  },

  actionableNounsForContainer: function(container, filter /* optional */) {
    let nouns = []

    for (let noun of container.nouns) {
      if (!filter || filter(container, noun)) {
        nouns.push(noun)
      }

      if (noun.inspected && noun.nouns) {
        let subNouns = this.actionableNounsForContainer(noun, filter)
        Array.prototype.push.apply(nouns, subNouns)
      }
    }

    return nouns
  },


  // arr can contain MANoun instances or String instances
  //   - For MANouns, this function uses inSentenceName(). E.g.  "a dog", "some bones"
  //   - For Strings, this function uses the string value
  // conjunction is a string, usually "and" or "or"

  // Example results:
  // "a dog and a cat", "a dog, a mouse, and a cat"
  naturalLanguageStringForArray: function(arr, conjunction) {
    var str = ""
    if (arr && arr.length > 0) {
      var i = 0
      for (let item of arr) {
        var comma = ""
        if (i == 1 && i == arr.length-1) {
          comma = " " + conjunction + " "
        } else if (i > 1 && i == arr.length-1) {
          comma = ", " + conjunction + " "
        } else if (i > 0) {
          comma = ", "
        }

        let itemStr = (item instanceof MANoun) ? item.inSentenceName() : item
        str += comma + itemStr

        i++
      }
    }

    return str
  },


  // Utilities to sort actions strings, for use with Array.sort()
  // The strings being compared have a format like:
  // "Go " + `<a id='${uuid}'>` + "east" + "</a>" + "➡️"
  //
  // Actions sorting
  // - "Look" comes first, with some specific internal ordering to put most relevant items first
  // - "Go" comes last, sort directions based on MADirection value
  // Everything else is alphabetical
  actionSortValue: function(str) {
    if (str.startsWith("Look at room")) { // First
      return 1
    } else if (str.startsWith("Look at yourself")) {
      return 2
    } else if (str.startsWith("Look at satchel")) {
      return 3
    } else if (str.startsWith("Look up from satchel")) {
      return 49
    } else if (str.startsWith("Look")) {
      return 0
    } else if (str.startsWith("Go") || str.startsWith("Run")) { // Last
      return 100 + MADirection.parseString(str)
    } else {
      return 50
    }
  },

  actionsComparator: function(a, b) {
    // Remove randomly generated id
    a = a.replace(/<a id=\'[^\']+\'>/, "")
    b = b.replace(/<a id=\'[^\']+\'>/, "")

    let aSortValue = MAUtils.actionSortValue(a)
    let bSortValue = MAUtils.actionSortValue(b)

    let diff = aSortValue - bSortValue
    if (diff == 0) {
      // Sort alphabetically
      return a.localeCompare(b)
    } else {
      return diff
    }
  },


  wornFox: function(gameState) {
    return gameState.player.worn.filter(x => x.name == "fox")[0]
  },

  enemyInCurrentLocation: function(gameState) {
    let enemies = gameState.currentLocation.nouns.filter (x => x instanceof MAEnemy)
    if (enemies && enemies.length > 0) {
      return enemies[0]
    }
    return null
  },
}
Object.freeze(MAUtils)
