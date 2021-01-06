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


  // Returns array of MANoun instances
  // - filter(owner, noun) => boolean
  actionableNounsForGameState: function(gameState, filter /* optional */) {
    let nouns = []

    let locNouns = this.actionableNounsForContainer(gameState.currentLocation, filter)
    Array.prototype.push.apply(nouns, locNouns)

    let invNouns = this.actionableNounsForContainer(gameState.inventory, filter)
    Array.prototype.push.apply(nouns, invNouns)

    if (!gameState.inventory.hidden) {
      if (!filter || filter(null, gameState.inventory)) {
        nouns.push(gameState.inventory)
      }
    }

    return nouns
  },

  // Returns true if the item was found, false otherwise
  replaceNounWithNounsForContainer: function(needle, replacements, container) {
    if (container.nouns && container.nouns.length) {
      if (!replacements) {
        replacements = []
      }

      var found = false
      let newNouns = []
      for (let noun of container.nouns) {
        if (noun.name == needle.name) {
          Array.prototype.push.apply(newNouns, replacements)
          found = true
        } else {
          newNouns.push(noun)
        }
      }

      container.nouns = newNouns

      if (found) {
        return true
      }

      for (let noun of container.nouns) {
        found = MAUtils.replaceNounWithNounsForContainer(needle, replacements, noun)
        if (found) {
          return true
        }
      }
    }

    return false
  },

  replaceNounWithNounsForGameState: function(needle, replacements, gameState) {
    let foundInCurrentLocation = MAUtils.replaceNounWithNounsForContainer(needle, replacements, gameState.currentLocation)
    if (!foundInCurrentLocation) {
      let foundInInventory = MAUtils.replaceNounWithNounsForContainer(needle, replacements, gameState.inventory)

      if (!foundInInventory) {
        console.log(`Error: could not find owner of noun '${needle.name}' to replace it`)
      }
    }
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
    } else if (str.startsWith("Use letter-remover")) {
      return 2
    } else if (str.startsWith("Use restoration gel")) {
      return 3
    } else if (str.startsWith("Look at yourself")) {
      return 10
    } else if (str.startsWith("Look at inventory")) {
      return 11
    } else if (str.startsWith("Look up from inventory")) {
      return 49
    } else if (str.startsWith("Nevermind")) {
      return 51
    } else if (str.startsWith("Look")) {
      return 4
    } else if (str.startsWith("Go") || str.startsWith("Run")) { // Last

      // Use a more natural sorting for these actions
      let dir = MADirection.parseString(str)
      var dirValue = dir
      if (dir == MADirection.North) {
        dirValue = 0
      } else if (dir == MADirection.West) {
        dirValue = 1
      } else if (dir == MADirection.East) {
        dirValue = 2
      } else if (dir == MADirection.South) {
        dirValue = 3
      }

      return 100 + dirValue
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

  fakeRandomElement: function(arr, gameState) {
    return arr[gameState.fakeRandomInt(arr.length)]
  },

  elementNamed: function(arr, name) {
    let namedElements = arr.filter(x => x.name == name)
    if (namedElements && namedElements.length > 0) {
      return namedElements[0]
    }
    return null
  },

  pastelColor: function(gameState) {
    let colors = ["lavendar", "pink", "sky blue", "mint green", "peach", "daffodil-yellow", "salmon", "mauve"]
    return MAUtils.fakeRandomElement(colors, gameState)
  },

  primaryColor: function(gameState) {
    let colors = ["red", "crimson", "blue", "cerulean", "yellow", "canary"]
    return MAUtils.fakeRandomElement(colors, gameState)
  },

  userAgentIsSearchEngineCrawler(userAgent) {
    if (!userAgent) {
      return false
    }

    let lcUA = userAgent.toLowerCase()

    // https://developers.google.com/search/docs/advanced/crawling/overview-google-crawlers
    let gAPIs = lcUA.includes("apis-google")
    let gAdsBot = lcUA.includes("adsbot")
    let gMediaPartnersGoogle = lcUA.includes("mediapartners-google")
    let googleBot = lcUA.includes("googlebot")
    let gFeedfetcher = lcUA.includes("feedfetcher")
    let gReadAloud = lcUA.includes("google-read-aloud")
    let gDuplexWeb = lcUA.includes("duplexweb-google")
    let gFavicon = lcUA.includes("google favicon")
    let gWeblight = lcUA.includes("googleweblight")

    // https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0
    let bingBot = lcUA.includes("bingbot")
    let bAdidx = lcUA.includes("adidxbot")
    let bingPreview = lcUA.includes("bingpreview")

    return gAPIs || gAdsBot || gMediaPartnersGoogle || googleBot || gFeedfetcher || gReadAloud || gDuplexWeb || gFavicon || gWeblight || bingBot || bAdidx || bingPreview
  },

  htmlTableFromEmojiMap(emojiMap, separator) {
    var mapTableHTML = "<table>\n"
    let mapLines = emojiMap.split("\n")
    for (let mapLine of mapLines) {
      if (mapLine.length == 0) {
        continue
      }
      mapTableHTML += "<tr>\n"

      let mapCols = mapLine.split(separator)
      for (let mapCol of mapCols) {
        mapTableHTML += "<td>" + mapCol + "</td>"
      }

      mapTableHTML += "\n</tr>\n"
    }
    mapTableHTML += "</table>\n"

    return mapTableHTML
  },
}
Object.freeze(MAUtils)
