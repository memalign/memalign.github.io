
var assertionCount = 0
function assertTrue(condition, str) {
    if (!condition) {
      MALog.log("Failed assertion: " + str)
      throw "Failed assertion: " + str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqualStrings(str1, str2) {
    if (str1 != str2) {
      let str = "Failed assertion: \"" + str1 + "\" does not equal \"" + str2 + "\""
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


class UnitTests {

// MAUtils

  test_MAUtils_naturalLanguageStringForArray() {
    var str = MAUtils.naturalLanguageStringForArray(null, "and")
    assertEqualStrings(str, "")

    str = MAUtils.naturalLanguageStringForArray([], "and")
    assertEqualStrings(str, "")

    // One item

    str = MAUtils.naturalLanguageStringForArray(["dog"], "and")
    assertEqualStrings(str, "dog")

    str = MAUtils.naturalLanguageStringForArray([new MANoun("dog")], "and")
    assertEqualStrings(str, "a dog")

    // Two items

    str = MAUtils.naturalLanguageStringForArray(["dog", "cat"], "and")
    assertEqualStrings(str, "dog and cat")

    str = MAUtils.naturalLanguageStringForArray([new MANoun("dog"), new MANoun("cat")], "or")
    assertEqualStrings(str, "a dog or a cat")

    str = MAUtils.naturalLanguageStringForArray(["dog", new MANoun("cat")], "or")
    assertEqualStrings(str, "dog or a cat")

    // Three items

    str = MAUtils.naturalLanguageStringForArray(["dog", "cat", "mouse"], "and")
    assertEqualStrings(str, "dog, cat, and mouse")

    str = MAUtils.naturalLanguageStringForArray([new MANoun("dog"), new MANoun("cat"), new MANoun("bones")], "or")
    assertEqualStrings(str, "a dog, a cat, or some bones")

    str = MAUtils.naturalLanguageStringForArray(["dog", new MANoun("cat"), new MANoun("bones")], "or")
    assertEqualStrings(str, "dog, a cat, or some bones")
  }

  test_MAUtils_actionsComparator() {
    let strings = [
      "Look at dog",
      "Go northwest",
      "Go south",
      "Look at satchel",
      "Go north",
      "Look at zebra",
      "Look at yourself",
      "Look at room 👀🍒",
      "Take food",
      "Go southeast",
      "Go west",
      "Look at cat",
      "Go east",
    ]

    let expectation = [
      "Look at cat",
      "Look at dog",
      "Look at zebra",
      "Look at room 👀🍒",
      "Look at yourself",
      "Look at satchel",
      "Take food",
      "Go north",
      "Go west",
      "Go east",
      "Go south",
      "Go southeast",
      "Go northwest",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_actionsComparator_lookUpFromSatchel() {
    let strings = [
      "Look at dog",
      "Look up from satchel",
      "Look at zebra",
      "Look at cat",
    ]

    let expectation = [
      "Look at cat",
      "Look at dog",
      "Look at zebra",
      "Look up from satchel",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_actionsComparator_battleActions() {
    let strings = [
      "Look at small goblin",
      "Kick small goblin",
      "Punch small goblin",
      "Run away",
      "Tell fox to Bite small goblin",
      "Tell fox to Scratch small goblin",
    ]

    let expectation = [
      "Look at small goblin",
      "Kick small goblin",
      "Punch small goblin",
      "Tell fox to Bite small goblin",
      "Tell fox to Scratch small goblin",
      "Run away",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_actionsComparator_withGUIDs() {
    let strings = [
      "Look at <a id='12345-678-abcdef'>dog</a>",
      "Go northwest",
      "Go <a id='f2345-678-abcdef'>south</a>",
      "Go north",
      "Take food",
      "Go southeast",
      "Go west",
      "Look at cat",
      "Go east",
    ]

    let expectation = [
      "Look at cat",
      "Look at <a id='12345-678-abcdef'>dog</a>",
      "Take food",
      "Go north",
      "Go west",
      "Go east",
      "Go <a id='f2345-678-abcdef'>south</a>",
      "Go southeast",
      "Go northwest",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_userAgentIsSearchEngineCrawler() {
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/W.X.Y.Z Safari/537.36 Edg/W.X.Y.Z"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 Edg/W.X.Y.Z (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (compatible; adidxbot/2.0; +http://www.bing.com/bingbot.htm)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; adidxbot/2.0; +http://www.bing.com/bingbot.htm)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Windows Phone 8.1; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 530) like Gecko (compatible; adidxbot/2.0; +http://www.bing.com/bingbot.htm)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534+ (KHTML, like Gecko) BingPreview/1.0b"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Windows Phone 8.1; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 530) like Gecko BingPreview/1.0b"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("APIs-Google (+https://developers.google.com/webmasters/APIs-Google.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mediapartners-Google"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Linux; Android 5.0; SM-G920A) AppleWebKit (KHTML, like Gecko) Chrome Mobile Safari (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1 (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("AdsBot-Google (+http://www.google.com/adsbot.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Googlebot-Image/1.0"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Googlebot-News"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Googlebot-Video/1.0"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Googlebot/2.1 (+http://www.google.com/bot.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("compatible; Mediapartners-Google/2.1; +http://www.google.com/bot.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("AdsBot-Google-Mobile-Apps"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("FeedFetcher-Google; (+http://www.google.com/feedfetcher.html)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36 (compatible; Google-Read-Aloud; +https://developers.google.com/search/docs/advanced/crawling/overview-google-crawlers)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36 (compatible; Google-Read-Aloud; +https://developers.google.com/search/docs/advanced/crawling/overview-google-crawlers)"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012; DuplexWeb-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Mobile Safari/537.36"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.75 Safari/537.36 Google Favicon"), "")
    assertTrue(MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko; googleweblight) Chrome/38.0.1025.166 Mobile Safari/535.19"), "")


    assertTrue(!MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"), "iPhone Safari")
    assertTrue(!MAUtils.userAgentIsSearchEngineCrawler("Safari: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15"), "iPad Safari")
    assertTrue(!MAUtils.userAgentIsSearchEngineCrawler("Safari: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36"), "Mac Safari")
    assertTrue(!MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"), "Mac Chrome")
    assertTrue(!MAUtils.userAgentIsSearchEngineCrawler("Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19"), "Android Chrome")
  }


// MADirection

  test_MADirection_opposite() {
    assertTrue(MADirection.opposite(MADirection.North) == MADirection.South, "north / south")
    assertTrue(MADirection.opposite(MADirection.South) == MADirection.North, "south / north")
  }

  test_MADirection_parseString() {
    assertTrue(MADirection.parseString("North") == MADirection.North, "north")
    assertTrue(MADirection.parseString("noRth") == MADirection.North, "north")
    assertTrue(MADirection.parseString("Go north to another room") == MADirection.North, "north")

    assertTrue(MADirection.parseString("north") == MADirection.North, "north")
    assertTrue(MADirection.parseString("south") == MADirection.South, "south")
    assertTrue(MADirection.parseString("east") == MADirection.East, "east")
    assertTrue(MADirection.parseString("west") == MADirection.West, "west")
    assertTrue(MADirection.parseString("southeast") == MADirection.SouthEast, "southeast")
    assertTrue(MADirection.parseString("northwest") == MADirection.NorthWest, "northwest")
    assertTrue(MADirection.parseString("southwest") == MADirection.SouthWest, "southwest")
    assertTrue(MADirection.parseString("northeast") == MADirection.NorthEast, "northeast")
    assertTrue(MADirection.parseString("up") == MADirection.Up, "up")
    assertTrue(MADirection.parseString("down") == MADirection.Down, "down")

  }

// MALocation

  test_MALocation_addLinkInDirection() {
    let loc1 = new MALocation("Bedroom")
    let loc2 = new MALocation("Bathroom")

    loc1.addLinkInDirection(MADirection.North, loc2)

    assertTrue(loc1.directionToLocation[MADirection.North].name == "Bathroom", "bathroom is north of bedroom")
    assertTrue(loc2.directionToLocation[MADirection.South].name == "Bedroom", "bedroom is south of bathroom")

    assertTrue(!loc1.directionToLocation[MADirection.East], "nothing east of bedroom")
  }

  test_MALocation_linkedLocationsString() {
    let loc1 = new MALocation("MainRoom")
    let loc2 = new MALocation("NorthRoom")
    let loc3 = new MALocation("SouthRoom")
    let loc4 = new MALocation("EastRoom")
    let loc5 = new MALocation("WestRoom")

    loc1.addLinkInDirection(MADirection.North, loc2)

    assertTrue(loc1.linkedLocationsString() == "You can head north.", "one unvisited")
    loc2.inspected = true
    assertTrue(loc1.linkedLocationsString() == "You can head north to NorthRoom.", "one visited")


    loc1.addLinkInDirection(MADirection.South, loc3)
    assertTrue(loc1.linkedLocationsString() == "You can head north to NorthRoom or south.", "two locs str")


    loc1.addLinkInDirection(MADirection.East, loc4)
    assertTrue(loc1.linkedLocationsString() == "You can head north to NorthRoom, south, or east.", "three locs str")

    loc4.inspected = true
    assertTrue(loc1.linkedLocationsString() == "You can head north to NorthRoom, south, or east to EastRoom.", "three locs str, two inspected")


    loc1.addLinkInDirection(MADirection.West, loc5)
    assertTrue(loc1.linkedLocationsString() == "You can head north to NorthRoom, south, east to EastRoom, or west.", "four locs str, two inspected")
  }

  test_MALocation_visibleNounsString() {
    let loc = new MALocation("Main Room")

    assertEqualStrings(loc.visibleNounsString(), "There are no notable items nearby.")

    loc.nouns.push(new MANoun("dog"))
    assertEqualStrings(loc.visibleNounsString(), "You notice a dog.")

    loc.nouns.push(new MANoun("cats"))
    assertEqualStrings(loc.visibleNounsString(), "Nearby, you see a dog and some cats.")


    loc.nouns.push(new MANoun("log"))
    assertEqualStrings(loc.visibleNounsString(), "You can see a dog, some cats, and a log.")
  }

// MAMap
  test_MAMap_oneLoc_uninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let emojiMap = "\n" + map.emojiMap(loc0_0)

    let expectedMap =
`
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_oneLoc_inspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let emojiMap = "\n" + map.emojiMap(loc0_0)

    let expectedMap =
`
⬛️⬛️⬛️⬛️
⬛️👀👃⬛️
⬛️▫️😶⬛️
⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westInspected_eastUninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("room 📜1️⃣")
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc0_0)

    let expectedMap =
`
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
⬛️👀👃⬛️⬛️⬛️⬛️
⬛️▫️😶▫️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westUninspected_eastInspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("room 📜1️⃣")
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️📜1️⃣⬛️
⬛️⬛️⬛️▫️▫️😶⬛️
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westInspected_eastInspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("room 📜1️⃣")
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
⬛️👀👃⬛️📜1️⃣⬛️
⬛️▫️▫️▫️▫️😶⬛️
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westUninspected_eastUninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("room 📜1️⃣")
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northInspected_southUninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc0_1 = new MALocation("room 📜1️⃣")
    map.addLocation(loc0_1)

    loc0_0.addLinkInDirection(MADirection.South, loc0_1)

    let emojiMap = "\n" + map.emojiMap(loc0_0)

    let expectedMap =
`
⬛️⬛️⬛️⬛️
⬛️👀👃⬛️
⬛️▫️😶⬛️
⬛️⬛️▫️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northUninspected_southInspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc0_1 = new MALocation("room 📜1️⃣")
    map.addLocation(loc0_1)

    loc0_1.inspected = true

    loc0_0.addLinkInDirection(MADirection.South, loc0_1)

    let emojiMap = "\n" + map.emojiMap(loc0_1)

    let expectedMap =
`
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️▫️⬛️
⬛️📜1️⃣⬛️
⬛️▫️😶⬛️
⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northInspected_southInspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc0_1 = new MALocation("room 📜1️⃣")
    map.addLocation(loc0_1)

    loc0_1.inspected = true

    loc0_0.addLinkInDirection(MADirection.South, loc0_1)

    let emojiMap = "\n" + map.emojiMap(loc0_1)

    let expectedMap =
`
⬛️⬛️⬛️⬛️
⬛️👀👃⬛️
⬛️▫️▫️⬛️
⬛️⬛️▫️⬛️
⬛️📜1️⃣⬛️
⬛️▫️😶⬛️
⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northUninspected_southUninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 👀👃")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc0_1 = new MALocation("room 📜1️⃣")
    map.addLocation(loc0_1)

    loc0_0.addLinkInDirection(MADirection.South, loc0_1)

    let emojiMap = "\n" + map.emojiMap(loc0_1)

    let expectedMap =
`
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
⬛️⬛️⬛️⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }


  test_MAMap_oneLoc_inspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let emojiMap = "\n" + map.emojiMap(loc0_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️
⬛️|🏢|🏬|⬛️
⬛️|▫️|😶|⬛️
⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westInspected_eastUninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("room 🌆🌆")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc0_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
⬛️|🏢|🏬|⬛️|⬛️|⬛️|⬛️
⬛️|▫️|😶|▫️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westUninspected_eastInspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("room 🌆🌆")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = map.emojiMap(loc1_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️|🌆|🌆|⬛️
⬛️|⬛️|⬛️|▫️|▫️|😶|⬛️
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings("\n" + emojiMap, expectedMap)

    let htmlMap = "\n" + MAUtils.htmlTableFromEmojiMap(emojiMap, "|")
    let expectedHTML =
`
<table>
<tr>
<td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td><td>🌆</td><td>🌆</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>⬛️</td><td>⬛️</td><td>▫️</td><td>▫️</td><td>😶</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td>
</tr>
</table>
`
    assertEqualStrings(htmlMap, expectedHTML)
  }

  test_MAMap_twoLocs_westInspected_eastInspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("room 🌆🌆")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
⬛️|🏢|🏬|⬛️|🌆|🌆|⬛️
⬛️|▫️|▫️|▫️|▫️|😶|⬛️
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westUninspected_eastUninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("room 🌆🌆")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northInspected_southUninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("room 🌆🌆")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = map.emojiMap(loc0_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️
⬛️|🏢|🏬|⬛️
⬛️|▫️|😶|⬛️
⬛️|⬛️|▫️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings("\n" + emojiMap, expectedMap)

    let htmlMap = "\n" + MAUtils.htmlTableFromEmojiMap(emojiMap, "|")
    let expectedHTML =
`
<table>
<tr>
<td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>🏢</td><td>🏬</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>▫️</td><td>😶</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>⬛️</td><td>▫️</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td>
</tr>
<tr>
<td>⬛️</td><td>⬛️</td><td>⬛️</td><td>⬛️</td>
</tr>
</table>
`
    assertEqualStrings(htmlMap, expectedHTML)
  }

  test_MAMap_twoLocs_northUninspected_southInspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("room 🌆🌆")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|▫️|⬛️
⬛️|🌆|🌆|⬛️
⬛️|▫️|😶|⬛️
⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northInspected_southInspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("room 🌆🌆")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️
⬛️|🏢|🏬|⬛️
⬛️|▫️|▫️|⬛️
⬛️|⬛️|▫️|⬛️
⬛️|🌆|🌆|⬛️
⬛️|▫️|😶|⬛️
⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northUninspected_southUninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("room 🏢🏬")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("room 🌆🌆")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
⬛️|⬛️|⬛️|⬛️
`

    assertEqualStrings(emojiMap, expectedMap)
  }


// MANoun

  test_MANoun_inSentenceName() {
    let noun1 = new MANoun("dog")
    let noun2 = new MANoun("dogs")
    let noun3 = new MANoun("aardvark")
    let noun4 = new MANoun("aardvarks")

    assertEqualStrings(noun1.inSentenceName(), "a dog")
    assertEqualStrings(noun2.inSentenceName(), "some dogs")
    assertEqualStrings(noun3.inSentenceName(), "an aardvark")
    assertEqualStrings(noun4.inSentenceName(), "some aardvarks")
  }

// MAGameEngine

  lastLogContains(str, gameState, numBack) {
    if (!numBack) {
      numBack = 0
    }

    let logs = gameState.log.logs

    let checkedStrings = []

    var result = false
    for (var i = 0; i <= numBack; i++) {
      let strToCheck = logs[logs.length-i-1]
      checkedStrings.unshift(strToCheck)

      result = strToCheck.includes(str)
      if (result) {
        break
      }
    }

    if (!result) {
      console.log("lastLogContains: Check failed. Log does not contain \"" + str + "\". Logs checked:\n\n" + checkedStrings.join("\n"))
    }
    return result
  }

  test_MAGameEngine_unvisitedLocationName() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    // Omitted in description
    assertTrue(this.lastLogContains("You can head east.", gameState), "omits room name")

    // Omitted in action
    assertTrue(gameEngine.hasActionLike("Go east", gameState), "can go east")
    assertTrue(!gameEngine.hasActionLike("Go east to ", gameState), "name omitted")
  }

  test_MAGameEngine_visitedLocationName() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)

    // Present in description
    assertTrue(this.lastLogContains("You can head east to room 🛏🩹.", gameState), "has room name")

    // Present in action
    assertTrue(gameEngine.hasActionLike("Go east ➡️ to room 🛏🩹", gameState), "name present in action")
  }

  test_MAGameEngine_satchel() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    // Can't take before we have satchel
    gameEngine.performActionLike("Take [small potion]", gameState)

    assertTrue(this.lastLogContains("You need some way to carry items", gameState), "can't take potion")
    assertTrue(gameState.inventory.nouns.length == 0, "no nouns")


    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Take [satchel]", gameState)
    assertTrue(gameState.hasItemNamed("satchel"), "has satchel")


    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Take [small potion]", gameState)

    assertTrue(this.lastLogContains("A green liquid", gameState), "got potion")
    assertTrue(gameState.hasItemNamed("small potion"), "has small potion")
  }

  test_MAGameEngine_satchel_inventoryMode() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    // Can't take before we have satchel
    gameEngine.performActionLike("Take [small potion]", gameState)

    assertTrue(this.lastLogContains("You need some way to carry items", gameState), "can't take potion")
    assertTrue(gameState.inventory.nouns.length == 0, "no nouns")


    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Take [satchel]", gameState)
    assertTrue(gameState.hasItemNamed("satchel"), "has satchel")


    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Take [small potion]", gameState)

    assertTrue(this.lastLogContains("A green liquid", gameState), "got potion")
    assertTrue(gameState.hasItemNamed("small potion"), "has small potion")

    // This action isn't available because we need to go into inventoryMode by looking at the satchel
    assertTrue(!gameEngine.hasActionLike("Look at [small potion]", gameState), "look small potion not available")

    gameEngine.performActionLike("Look at [satchel]", gameState)

    assertTrue(this.lastLogContains("The satchel contains 1 item.", gameState, 1), "satchel content log")
    assertTrue(this.lastLogContains("You can act on items in the satchel.", gameState), "you can act log")

    assertTrue(gameEngine.hasActionLike("Look at [small potion]", gameState), "look small potion available")
    assertTrue(!gameEngine.hasActionLike("Look at [satchel]", gameState), "look satchel not available")
    assertTrue(!gameEngine.hasActionLike("Go", gameState), "go action not available")

    gameEngine.performActionLike("Look at [small potion]", gameState)
    assertTrue(this.lastLogContains("A green liquid", gameState), "look potion")

    assertTrue(!gameEngine.hasActionLike("Look at [small potion]", gameState), "lacks look small potion available")
    assertTrue(gameEngine.hasActionLike("Look at [satchel]", gameState), "look satchel available")
    assertTrue(gameEngine.hasActionLike("Go", gameState), "go action available")

    gameEngine.performActionLike("Look at [satchel]", gameState)
    assertTrue(!gameEngine.hasActionLike("Go", gameState), "go action not available 2")
    gameEngine.performActionLike("Look [up from satchel]", gameState)
    assertTrue(gameEngine.hasActionLike("Go", gameState), "go action available 2")
  }

  test_MAGameEngine_blueKey() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)
    gameState.inventory.nouns.push(new MANoun("debug token", ""))

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go south", gameState)

    assertTrue(this.lastLogContains("You use the blue key to unlock", gameState, 5), "blue key unlock log")

    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")

    gameEngine.performActionLike("Kill", gameState)

    gameEngine.performActionLike("Go north", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")

    // Put some irrelevant logs to make our next check robust
    gameEngine.performActionLike("Look at [room", gameState)
    gameEngine.performActionLike("Look at [room", gameState)
    gameEngine.performActionLike("Look at [room", gameState)
    gameEngine.performActionLike("Look at [room", gameState)
    gameEngine.performActionLike("Look at [room", gameState)

    gameEngine.performActionLike("Go south", gameState)
    assertTrue(!this.lastLogContains("You use the blue key to unlock", gameState, 5), "skipped blue key unlock log")

    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")
  }

  test_MAGameEngine_blueLock() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")

    // Fails
    gameEngine.performActionLike("Go south", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")

    assertTrue(this.lastLogContains("A locked door blocks your way", gameState), "locked door log")
  }

  test_MAGameEngine_healFox() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(gameState.currentLocation.hasNounNamed("injured fox"), "loc has injured fox")
    assertTrue(!gameEngine.hasActionLike("Take", gameState), "can't take injured fox")

    gameEngine.performActionLike("Heal", gameState)

    assertTrue(this.lastLogContains("carefully open its mouth", gameState), "carefully open its mouth log")
    assertTrue(gameState.currentLocation.hasNounNamed("fox"), "loc has fox")
    assertTrue(!gameState.currentLocation.hasNounNamed("injured fox"), "loc lacks injured fox")
    assertTrue(!gameEngine.hasActionLike("Take", gameState), "can't take fox")

    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("the fox quickly leaps", gameState, 5), "fox quickly leaps log")
    assertTrue(gameState.player.hasNounNamed("fox"), "player has fox")
    assertTrue(!gameState.inventory.hasNounNamed("small potion"), "inventory lacks small potion")

    gameEngine.performActionLike("Look at [satchel]", gameState)
    assertTrue(!gameEngine.hasActionLike("Look at [fox]", gameState), "fox not in satchel")

    assertTrue(this.lastLogContains("The satchel contains 0 items.", gameState), "satchel contains 0 log")
    assertTrue(!this.lastLogContains("You can act on items in the satchel", gameState, 5), "satchel does not provide actions")

    gameEngine.performActionLike("Go east", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🩸🦊")
    assertTrue(!gameState.currentLocation.hasNounNamed("fox"), "loc lacks fox")

    assertTrue(this.lastLogContains("There is nothing notable here", gameState, 2), "nothing notable log")
  }

  test_MAGameEngine_healFox_southBlockedReasons() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at [blue glimmer]", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)

    gameEngine.performActionLike("Go east", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")
    // Fails
    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")
    assertTrue(this.lastLogContains("You feel compelled to investigate the paw prints before moving on.", gameState), "compelled paw prints log")


    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")
    // Fails
    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")
    assertTrue(this.lastLogContains("You feel compelled to investigate the blood trail before moving on.", gameState), "compelled blood trail log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")
    // Fails
    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")
    assertTrue(this.lastLogContains("It doesn't feel right to continue exploring without trying to help the injured fox.", gameState), "without trying to help log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(gameState.currentLocation.hasNounNamed("injured fox"), "loc has injured fox")
    assertTrue(!gameEngine.hasActionLike("Take", gameState), "can't take injured fox")

    gameEngine.performActionLike("Heal", gameState)

    assertTrue(this.lastLogContains("carefully open its mouth", gameState), "carefully open its mouth log")
    assertTrue(gameState.currentLocation.hasNounNamed("fox"), "loc has fox")
    assertTrue(!gameState.currentLocation.hasNounNamed("injured fox"), "loc lacks injured fox")
    assertTrue(!gameEngine.hasActionLike("Take", gameState), "can't take fox")

    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("the fox quickly leaps", gameState, 5), "fox quickly leaps log")
    assertTrue(gameState.player.hasNounNamed("fox"), "inventory has fox")
    assertTrue(!gameState.inventory.hasNounNamed("small potion"), "inventory lacks small potion")

    assertTrue(this.lastLogContains("You see the now-familiar blood trail heading east. The fox whimpers, seemingly remembering recent trauma.", gameState, 2), "fox whimpers log")



    gameEngine.performActionLike("Look at [satchel]", gameState)
    assertTrue(!gameEngine.hasActionLike("Look at [fox]", gameState), "fox not in satchel")

    assertTrue(this.lastLogContains("The satchel contains 1 item.", gameState, 2), "satchel contains 1 log")
    assertTrue(this.lastLogContains("You can act on items in the satchel", gameState, 5), "satchel provides actions")

    gameEngine.performActionLike("Look", gameState)

    gameEngine.performActionLike("Go east", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🩸🦊")
    assertTrue(!gameState.currentLocation.hasNounNamed("fox"), "loc lacks fox")

    assertTrue(this.lastLogContains("There is nothing notable here", gameState, 2), "nothing notable log")
  }

  test_MAGameEngine_bloodTrail() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(this.lastLogContains("some paw prints", gameState, 5), "paw prints log")

    gameEngine.performActionLike("Go east", gameState)

    assertTrue(this.lastLogContains("startled to see", gameState, 5), "startled paw prints log")
    assertTrue(this.lastLogContains("Whatever creature left it behind", gameState, 5), "Whatever creature log")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("You see the now-familiar blood trail heading east. Whatever creature left it behind must be hurt.", gameState, 2), "Whatever creature log")

    gameEngine.performActionLike("Go east", gameState)

    assertTrue(this.lastLogContains("You follow the blood trail to a pitiful-looking creature curled up, dead, in the corner. At least you assumed it was dead. Now aware of your presence, it whines faintly. Upon further inspection, you can see that it's a fox, barely alive.", gameState, 2), "follow the blood trail log")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("The injured fox whines", gameState, 2), "injured fox whines log")

    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("You see the now-familiar blood trail heading east.", gameState, 2), "now-familiar log")
    assertTrue(!this.lastLogContains("Whatever creature left it behind", gameState, 2), "Whatever creature log absent")
  }

  test_MAGameEngine_wearHelm() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)
    gameState.inventory.nouns.push(new MANoun("debug token", ""))

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go south", gameState)

    assertTrue(this.lastLogContains("You use the blue key to unlock", gameState, 5), "blue key unlock log")

    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")


    gameEngine.performActionLike("Kill", gameState)

    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Kill", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at piles", gameState)

    assertTrue(!gameEngine.hasActionLike("Wear [bronze helm]", gameState), "wear bronze helm not available")
    gameEngine.performActionLike("Take bronze helm", gameState)

    assertTrue(gameState.inventory.hasNounNamed("bronze helm"), "has bronze helm")
    assertTrue(gameEngine.hasActionLike("Wear [bronze helm]", gameState), "wear bronze helm available")
    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).", gameState), "wearing a fox, no helm")
    gameEngine.performActionLike("Wear bronze helm", gameState)
    assertTrue(!gameState.inventory.hasNounNamed("bronze helm"), "inventory lacks bronze helm")
    assertTrue(gameState.player.hasNounNamed("bronze helm"), "player has bronze helm")
    assertTrue(!gameEngine.hasActionLike("Wear [bronze helm]", gameState), "wear bronze helm not available2")
    assertTrue(this.lastLogContains("You gently push your head into the bronze helm", gameState), "head into bronze helm log")
    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder) and a bronze helm.", gameState), "wearing a fox and helm")
  }

  test_MAGameEngine_foxGear() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)
    gameState.inventory.nouns.push(new MANoun("debug token", ""))

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You look normal.", gameState), "normal yourself log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🐂🛡")
    gameEngine.performActionLike("Take small leather armor", gameState)
    assertTrue(gameState.inventory.hasNounNamed("small leather armor"), "has small leather armor")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox before we have the fox")

    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox looks normal.", gameState), "wearing fox, fox normal log")

    assertTrue(gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can put small leather armor on fox")

    gameEngine.performActionLike("Put small leather armor on fox", gameState)

    assertTrue(this.lastLogContains("You put the small leather armor on the fox.", gameState), "put armor on fox")

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox twice")

    assertTrue(!gameState.inventory.hasNounNamed("small leather armor"), "armor is out of inventory")

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox is wearing some small leather armor.", gameState), "wearing fox, fox wearing armor")

    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go south", gameState)

    assertTrue(this.lastLogContains("You use the blue key to unlock", gameState, 5), "blue key unlock log")

    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")

    gameEngine.performActionLike("Kill", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take metal fangs", gameState)
    gameEngine.performActionLike("Put metal fangs on fox", gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox is wearing some small leather armor and some metal fangs.", gameState), "wearing fox, fox wearing armor and fangs")
  }

  test_MAGameEngine_battle_lookAtEnemy() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You look normal.", gameState), "normal yourself log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🐂🛡")
    gameEngine.performActionLike("Take small leather armor", gameState)
    assertTrue(gameState.inventory.hasNounNamed("small leather armor"), "has small leather armor")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox before we have the fox")

    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox looks normal.", gameState), "wearing fox, fox normal log")

    assertTrue(gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can put small leather armor on fox")

    gameEngine.performActionLike("Put small leather armor on fox", gameState)

    assertTrue(this.lastLogContains("You put the small leather armor on the fox.", gameState), "put armor on fox")

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox twice")

    assertTrue(!gameState.inventory.hasNounNamed("small leather armor"), "armor is out of inventory")

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox is wearing some small leather armor.", gameState), "wearing fox, fox wearing armor")

    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go south", gameState)

    assertTrue(this.lastLogContains("You use the blue key to unlock", gameState, 5), "blue key unlock log")

    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")

    assertTrue(gameEngine.hasActionLike("Kick small goblin", gameState), "in battle mode with small goblin")

    assertTrue(!gameEngine.hasActionLike("Go", gameState), "Can't Go in battle mode")

    gameEngine.performActionLike("Look at small goblin",  gameState)
    assertTrue(this.lastLogContains("He's looking at you menacingly", gameState), "can look at small goblin during battle")
  }

  test_MAGameEngine_battle_smallGoblin() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You look normal.", gameState), "normal yourself log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🐂🛡")
    gameEngine.performActionLike("Take small leather armor", gameState)
    assertTrue(gameState.inventory.hasNounNamed("small leather armor"), "has small leather armor")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox before we have the fox")

    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox looks normal.", gameState), "wearing fox, fox normal log")

    assertTrue(gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can put small leather armor on fox")

    gameEngine.performActionLike("Put small leather armor on fox", gameState)

    assertTrue(this.lastLogContains("You put the small leather armor on the fox.", gameState), "put armor on fox")

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox twice")

    assertTrue(!gameState.inventory.hasNounNamed("small leather armor"), "armor is out of inventory")

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox is wearing some small leather armor.", gameState), "wearing fox, fox wearing armor")

    gameEngine.performActionLike("Go west", gameState)

    assertTrue(typeof(gameState.player.maxHealth) === "undefined", "maxHealth is undefined before first battle")
    assertTrue(typeof(gameState.player.currentHealth) === "undefined", "currentHealth is undefined before first battle")
    assertTrue(typeof(MAUtils.wornFox(gameState).maxHealth) === "undefined", "fox maxHealth is undefined before first battle")
    assertTrue(typeof(MAUtils.wornFox(gameState).currentHealth) === "undefined", "fox currentHealth is undefined before first battle")


    gameEngine.performActionLike("Go south", gameState)

    assertTrue(this.lastLogContains("You use the blue key to unlock", gameState, 5), "blue key unlock log")


    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")

    assertTrue(!this.lastLogContains("The battle with the small goblin resumes! Unfortunately for you, enough time has passed for significant healing.", gameState, 5), "no resume log on first battle attempt")

    assertTrue(gameEngine.hasActionLike("Kick small goblin", gameState), "in battle mode with small goblin")
    assertTrue(!gameEngine.hasActionLike("Kill", gameState), "Kill action is missing when debug token is not in inventory")

    assertTrue(gameState.player.maxHealth == 10, "maxHealth is 10 after entering first battle")
    assertTrue(gameState.player.currentHealth == 10, "currentHealth is 10 after entering first battle")

    assertTrue(MAUtils.wornFox(gameState).maxHealth == 5, "fox maxHealth is 5 after entering first battle")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox currentHealth is 5 after entering first battle")



    gameEngine.performActionLike("Kick", gameState)

    assertTrue(this.lastLogContains("Oof!", gameState, 5), "kick oof")

    assertTrue(this.lastLogContains("Your attack dealt 1 damage. Woo! The small goblin has 2 health remaining.", gameState, 5), "kick damaged small goblin")

    assertTrue(this.lastLogContains("The small goblin takes aim at you with its Clobber attack.", gameState, 5), "small goblin takes aim at you")

    assertTrue(this.lastLogContains("The small goblin dealt 0 damage. Whew! You have 10 health remaining.", gameState, 5), "small goblin dealt 0")

    assertTrue(!gameEngine.hasActionLike("Go", gameState), "Can't Go during battle with small goblin")

    gameEngine.performActionLike("Punch", gameState)

    assertTrue(this.lastLogContains("Pow!", gameState, 3), "punch pow")
    assertTrue(this.lastLogContains("Your attack dealt 2 damage. Wow!", gameState, 3), "punch dealt 2 damage")
    assertTrue(this.lastLogContains("The small goblin has been dispatched from this realm!", gameState, 2), "punch destroyed goblin")
    assertTrue(!this.lastLogContains("health remaining", gameState, 4), "don't log health remaining when destroyed")
    assertTrue(this.lastLogContains("The small goblin leaves behind a small potion.", gameState, 2), "goblin drops potion")
    assertTrue(gameState.currentLocation.nouns.filter(x => x.name == "small potion").length > 0, "small potion is in room")

    assertTrue(gameEngine.hasActionLike("Go", gameState), "Able to go after destroying small goblin")

    gameEngine.performActionLike("Look at room", gameState)
    assertTrue(this.lastLogContains("The small goblin who once inhabited this room is gone.\n\nYou can head north to room 💼🔒, south, or east.", gameState), "post-battle goblin room appearance")
  }

  test_MAGameEngine_battle_smallGoblin_lose() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)
    gameState.inventory.nouns.push(new MANoun("debug token", ""))

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You look normal.", gameState), "normal yourself log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🐂🛡")
    gameEngine.performActionLike("Take small leather armor", gameState)
    assertTrue(gameState.inventory.hasNounNamed("small leather armor"), "has small leather armor")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox before we have the fox")

    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox looks normal.", gameState), "wearing fox, fox normal log")

    gameEngine.performActionLike("Go west", gameState)

    assertTrue(typeof(gameState.player.maxHealth) === "undefined", "maxHealth is undefined before first battle")
    assertTrue(typeof(gameState.player.currentHealth) === "undefined", "currentHealth is undefined before first battle")
    assertTrue(typeof(MAUtils.wornFox(gameState).maxHealth) === "undefined", "fox maxHealth is undefined before first battle")
    assertTrue(typeof(MAUtils.wornFox(gameState).currentHealth) === "undefined", "fox currentHealth is undefined before first battle")


    gameEngine.performActionLike("Go south", gameState)

    assertTrue(this.lastLogContains("You use the blue key to unlock", gameState, 5), "blue key unlock log")


    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")

    assertTrue(!this.lastLogContains("The battle with the small goblin resumes! Unfortunately for you, enough time has passed for significant healing.", gameState, 5), "no resume log on first battle attempt")

    assertTrue(gameEngine.hasActionLike("Kick small goblin", gameState), "in battle mode with small goblin")
    assertTrue(gameEngine.hasActionLike("Miss", gameState), "Miss action is available when debug token is in inventory")

    assertTrue(gameState.player.maxHealth == 10, "maxHealth is 10 after entering first battle")
    assertTrue(gameState.player.currentHealth == 10, "currentHealth is 10 after entering first battle")

    assertTrue(MAUtils.wornFox(gameState).maxHealth == 5, "fox maxHealth is 5 after entering first battle")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox currentHealth is 5 after entering first battle")



    gameEngine.performActionLike("Miss", gameState)

    assertTrue(this.lastLogContains("Whoosh!", gameState, 5), "miss whoosh")

    assertTrue(this.lastLogContains("Your attack dealt 0 damage.", gameState, 5), "miss did not damage small goblin")

    assertTrue(!gameEngine.hasActionLike("Go", gameState), "Can't Go during battle with small goblin")

    let gob1 = MAUtils.enemyInCurrentLocation(gameState)
    assertTrue(gob1.currentHealth == gob1.maxHealth, "goblin has max health")

    gameEngine.performActionLike("Kick", gameState)

    let gob2 = MAUtils.enemyInCurrentLocation(gameState)
    assertTrue(gob2.currentHealth < gob2.maxHealth, "goblin has less than max health")

    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)

    assertTrue(gameEngine.hasActionLike("Tell fox", gameState), "Fox can attack while conscious")

    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)

    assertTrue(this.lastLogContains("Your furry companion is knocked unconscious. Hold on little guy!", gameState, 5), "fox unconcious")
    assertTrue(!gameEngine.hasActionLike("Tell fox", gameState), "Fox can't attack after running out of health")

    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)

    assertTrue(this.lastLogContains("Feeling faint, you manage to stagger out of the room back the way you came", gameState, 5), "stagger out")
    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")

    assertTrue(gameState.player.currentHealth == 1, "currentHealth is 1 after losing battle")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 0, "fox currentHealth is 0 after losing battle")

    gameEngine.performActionLike("Look at yourself", gameState)

    assertTrue(this.lastLogContains("You look bruised and battle-worn. You need to heal.\n\nYou are wearing a fox (on your shoulder).\n\nYou balance with care because the fox is still unconscious from battle.", gameState), "bruised and battle-worn")


    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")


    assertTrue(this.lastLogContains("The battle with the small goblin resumes! Unfortunately for you, enough time has passed for significant healing.", gameState, 5), "resume log on second battle attempt")
    let gob3 = MAUtils.enemyInCurrentLocation(gameState)
    assertTrue(gob3.currentHealth == gob3.maxHealth, "goblin health has reset")
    assertTrue(gob3.battleAttempts == 1, "goblin battle attempts increased")
  }

  test_MAGameEngine_cot_unnecessaryRest() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    assertTrue(!gameEngine.hasActionLike("Rest on cot", gameState), "Can't rest on cot when there is no cot")

    gameEngine.performActionLike("Go east", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 🛏🩹")

    assertTrue(!gameEngine.hasActionLike("Rest on cot", gameState), "Can't rest on cot before inspecting it")

    gameEngine.performActionLike("Look at cot", gameState)

    assertTrue(gameEngine.hasActionLike("Rest on cot", gameState), "Can rest on cot after inspecting it")

    gameEngine.performActionLike("Rest on cot", gameState)


    assertTrue(this.lastLogContains("After a short nap, you wake up feeling refreshed.", gameState), "Already full health log")
    assertTrue(!this.lastLogContains("You sure like to sleep", gameState), "No sleep taunt first time")

    gameEngine.performActionLike("Rest on cot", gameState)
    assertTrue(this.lastLogContains("You sure like to sleep", gameState), "Sleep taunt second time")
  }

  test_MAGameEngine_cot_withFox_unnecessaryRest() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You look normal.", gameState), "normal yourself log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🐂🛡")
    gameEngine.performActionLike("Take small leather armor", gameState)
    assertTrue(gameState.inventory.hasNounNamed("small leather armor"), "has small leather armor")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox before we have the fox")

    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox looks normal.", gameState), "wearing fox, fox normal log")

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 🛏🩹")

    assertTrue(!gameEngine.hasActionLike("Rest on cot", gameState), "Can't rest on cot before inspecting it")

    gameEngine.performActionLike("Look at cot", gameState)

    assertTrue(gameEngine.hasActionLike("Rest on cot", gameState), "Can rest on cot after inspecting it")

    gameEngine.performActionLike("Rest on cot", gameState)


    assertTrue(this.lastLogContains("After a short nap, you and the fox wake up feeling refreshed.", gameState), "Already full health log")
    assertTrue(!this.lastLogContains("You sure like to sleep", gameState), "No sleep taunt first time")

    gameEngine.performActionLike("Rest on cot", gameState)
    assertTrue(this.lastLogContains("You sure like to sleep", gameState), "Sleep taunt second time")
  }

  test_MAGameEngine_cot_healAfterBattleLoss() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)
    gameState.inventory.nouns.push(new MANoun("debug token", ""))

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You look normal.", gameState), "normal yourself log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🐂🛡")
    gameEngine.performActionLike("Take small leather armor", gameState)
    assertTrue(gameState.inventory.hasNounNamed("small leather armor"), "has small leather armor")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox before we have the fox")

    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox looks normal.", gameState), "wearing fox, fox normal log")

    gameEngine.performActionLike("Go west", gameState)

    assertTrue(typeof(gameState.player.maxHealth) === "undefined", "maxHealth is undefined before first battle")
    assertTrue(typeof(gameState.player.currentHealth) === "undefined", "currentHealth is undefined before first battle")
    assertTrue(typeof(MAUtils.wornFox(gameState).maxHealth) === "undefined", "fox maxHealth is undefined before first battle")
    assertTrue(typeof(MAUtils.wornFox(gameState).currentHealth) === "undefined", "fox currentHealth is undefined before first battle")


    gameEngine.performActionLike("Go south", gameState)

    assertTrue(this.lastLogContains("You use the blue key to unlock", gameState, 5), "blue key unlock log")


    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")

    assertTrue(gameEngine.hasActionLike("Kick small goblin", gameState), "in battle mode with small goblin")
    assertTrue(gameEngine.hasActionLike("Miss", gameState), "Miss action is available when debug token is in inventory")

    assertTrue(gameState.player.maxHealth == 10, "maxHealth is 10 after entering first battle")
    assertTrue(gameState.player.currentHealth == 10, "currentHealth is 10 after entering first battle")

    assertTrue(MAUtils.wornFox(gameState).maxHealth == 5, "fox maxHealth is 5 after entering first battle")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox currentHealth is 5 after entering first battle")



    gameEngine.performActionLike("Miss", gameState)

    assertTrue(this.lastLogContains("Whoosh!", gameState, 5), "miss whoosh")

    assertTrue(this.lastLogContains("Your attack dealt 0 damage.", gameState, 5), "miss did not damage small goblin")

    assertTrue(!gameEngine.hasActionLike("Go", gameState), "Can't Go during battle with small goblin")


    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)

    assertTrue(gameEngine.hasActionLike("Tell fox", gameState), "Fox can attack while conscious")

    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)

    assertTrue(this.lastLogContains("Your furry companion is knocked unconscious. Hold on little guy!", gameState, 5), "fox unconcious")
    assertTrue(!gameEngine.hasActionLike("Tell fox", gameState), "Fox can't attack after running out of health")

    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)
    gameEngine.performActionLike("Miss", gameState)

    assertTrue(this.lastLogContains("Feeling faint, you manage to stagger out of the room back the way you came", gameState, 5), "stagger out")
    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")

    assertTrue(gameState.player.currentHealth == 1, "currentHealth is 1 after losing battle")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 0, "fox currentHealth is 0 after losing battle")

    gameEngine.performActionLike("Look at yourself", gameState)

    assertTrue(this.lastLogContains("You look bruised and battle-worn. You need to heal.\n\nYou are wearing a fox (on your shoulder).\n\nYou balance with care because the fox is still unconscious from battle.", gameState), "bruised and battle-worn")

    gameEngine.performActionLike("Go west", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 🛏🩹")

    assertTrue(!gameEngine.hasActionLike("Rest on cot", gameState), "Can't rest on cot before inspecting it")

    gameEngine.performActionLike("Look at cot", gameState)

    assertTrue(gameEngine.hasActionLike("Rest on cot", gameState), "Can rest on cot after inspecting it")

    gameEngine.performActionLike("Rest on cot", gameState)


    assertTrue(this.lastLogContains("After a long rest, you and the fox wake up fully healed.", gameState), "wake up fully healed log")

    assertTrue(gameState.player.currentHealth == gameState.player.maxHealth, "currentHealth restored")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == MAUtils.wornFox(gameState).maxHealth, "fox currentHealth is restored")

    assertTrue(!this.lastLogContains("You sure like to sleep", gameState), "No sleep taunt when healing")

    gameEngine.performActionLike("Look at yourself", gameState)

    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox looks normal.", gameState), "wearing fox, fox normal log")

    gameEngine.performActionLike("Rest on cot", gameState)

    assertTrue(!this.lastLogContains("You sure like to sleep", gameState), "No sleep taunt first time")

    gameEngine.performActionLike("Rest on cot", gameState)
    assertTrue(this.lastLogContains("You sure like to sleep", gameState), "Sleep taunt second time")
  }

  test_MAGameEngine_cot_unnecessaryRest_afterBattle() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You look normal.", gameState), "normal yourself log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertTrue(this.lastLogContains("you notice a blue glimmer", gameState), "blue glimmer log")

    gameEngine.performActionLike("Look at [blue glimmer]", gameState)

    assertTrue(!gameEngine.hasActionLike("Look at [blue glimmer]", gameState), "look blue glimmer not available")
    assertTrue(gameEngine.hasActionLike("Take [blue key]", gameState), "take blue key available")

    gameEngine.performActionLike("Look at [room", gameState)

    assertTrue(this.lastLogContains("blue key on the ground", gameState), "blue key log")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take [satchel]", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [small potion]", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go south", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 🐂🛡")
    gameEngine.performActionLike("Take small leather armor", gameState)
    assertTrue(gameState.inventory.hasNounNamed("small leather armor"), "has small leather armor")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take [blue key]", gameState)

    assertTrue(gameState.inventory.hasNounNamed("blue key"), "has blue key")

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox before we have the fox")

    gameEngine.performActionLike("Heal", gameState)
    gameEngine.performActionLike("Go west", gameState)

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox looks normal.", gameState), "wearing fox, fox normal log")

    assertTrue(gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can put small leather armor on fox")

    gameEngine.performActionLike("Put small leather armor on fox", gameState)

    assertTrue(this.lastLogContains("You put the small leather armor on the fox.", gameState), "put armor on fox")

    assertTrue(!gameEngine.hasActionLike("Put small leather armor on fox", gameState), "can't put small leather armor on fox twice")

    assertTrue(!gameState.inventory.hasNounNamed("small leather armor"), "armor is out of inventory")

    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder).\n\nThe fox is wearing some small leather armor.", gameState), "wearing fox, fox wearing armor")

    gameEngine.performActionLike("Go west", gameState)

    assertTrue(typeof(gameState.player.maxHealth) === "undefined", "maxHealth is undefined before first battle")
    assertTrue(typeof(gameState.player.currentHealth) === "undefined", "currentHealth is undefined before first battle")
    assertTrue(typeof(MAUtils.wornFox(gameState).maxHealth) === "undefined", "fox maxHealth is undefined before first battle")
    assertTrue(typeof(MAUtils.wornFox(gameState).currentHealth) === "undefined", "fox currentHealth is undefined before first battle")

    // Perform an action now to advance the random number generator to give us coverage of specific things below
    gameEngine.performActionLike("Look at yourself", gameState)

    gameEngine.performActionLike("Go south", gameState)

    assertTrue(this.lastLogContains("You use the blue key to unlock", gameState, 5), "blue key unlock log")


    assertEqualStrings(gameState.currentLocation.name, "room 🧑‍🎤1️⃣")

    assertTrue(gameEngine.hasActionLike("Kick small goblin", gameState), "in battle mode with small goblin")
    assertTrue(!gameEngine.hasActionLike("Kill", gameState), "Kill action is missing when debug token is not in inventory")

    assertTrue(gameState.player.maxHealth == 10, "maxHealth is 10 after entering first battle")
    assertTrue(gameState.player.currentHealth == 10, "currentHealth is 10 after entering first battle")

    assertTrue(MAUtils.wornFox(gameState).maxHealth == 5, "fox maxHealth is 5 after entering first battle")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox currentHealth is 5 after entering first battle")


    gameEngine.performActionLike("Kick", gameState)

    assertTrue(this.lastLogContains("Thunk!", gameState, 5), "kick thunk")

    assertTrue(this.lastLogContains("Your attack dealt 1 damage. Success! The small goblin has 2 health remaining.", gameState, 5), "kick damaged small goblin")
    assertTrue(this.lastLogContains("\"Is that all you've got?!\" taunts the goblin.", gameState, 5), "small goblin taunt")

    assertTrue(this.lastLogContains("The fox's small leather armor protected it from 1 damage. The small goblin dealt 0 damage. How fortunate! The fox has 5 health remaining.", gameState, 5), "fox armor reduced damage")

    assertTrue(!gameEngine.hasActionLike("Go", gameState), "Can't Go during battle with small goblin")

    gameEngine.performActionLike("Punch", gameState)

    assertTrue(this.lastLogContains("Bam!", gameState, 3), "punch pow")
    assertTrue(this.lastLogContains("Your attack dealt 2 damage. Woo!", gameState, 3), "punch dealt 2 damage")
    assertTrue(this.lastLogContains("The small goblin has been dispatched from this realm!", gameState, 2), "punch destroyed goblin")
    assertTrue(!this.lastLogContains("health remaining", gameState, 3), "don't log health remaining when destroyed")

    assertTrue(gameEngine.hasActionLike("Go", gameState), "Able to go after destroying small goblin")

    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)

    assertEqualStrings(gameState.currentLocation.name, "room 🛏🩹")

    assertTrue(!gameEngine.hasActionLike("Rest on cot", gameState), "Can't rest on cot before inspecting it")

    gameEngine.performActionLike("Look at cot", gameState)

    assertTrue(gameEngine.hasActionLike("Rest on cot", gameState), "Can rest on cot after inspecting it")

    gameEngine.performActionLike("Rest on cot", gameState)


    assertTrue(this.lastLogContains("After a short nap, you and the fox wake up feeling refreshed.", gameState), "Already full health log")
    assertTrue(!this.lastLogContains("You sure like to sleep", gameState), "No sleep taunt first time")

    gameEngine.performActionLike("Rest on cot", gameState)
    assertTrue(this.lastLogContains("You sure like to sleep", gameState), "Sleep taunt second time")
  }

  test_MAGameEngine_seeButNotDefeatTrollAndWolf() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take small leather armor", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at blue glimmer", gameState)
    gameEngine.performActionLike("Take blue key", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take torn parchment", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal injured fox", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Put small leather armor", gameState)
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("A goblin. This goblin is only about waist-high", gameState), "")
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take metal fangs", gameState)
    gameEngine.performActionLike("Put metal fangs on fox", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Run away", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take bronze helm", gameState)
    gameEngine.performActionLike("Wear bronze helm", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Run away", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Kick giant goblin", gameState)
    gameEngine.performActionLike("Kick giant goblin", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("Another troll. This one is even bigger than the first one, needing to slouch to avoid hitting his head on the ceiling.", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Take large potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("the alpha wolf howls as you enter. His sensitive nose tells him your story: he smells troll sweat, he smells wolf pup, he smells dirty goblins, he smells his favorite lieutenant wolf, he smells DEATH!", gameState), "")
  }

  test_MAGameEngine_notSeeingWolfBeforeAlphaWolf() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take small leather armor", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at blue glimmer", gameState)
    gameEngine.performActionLike("Take blue key", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take torn parchment", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal injured fox", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Put small leather armor", gameState)
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("A goblin. This goblin is only about waist-high", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "Can Run away in battle mode")
    assertTrue(gameEngine.hasActionLike("Punch small goblin", gameState), "Can Punch in battle mode")
    assertTrue(gameEngine.hasActionLike("Tell fox to Bite small goblin", gameState), "Can Bite in battle mode")
    assertTrue(gameEngine.hasActionLike("Tell fox to Scratch small goblin", gameState), "Can Scratch in battle mode")
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(this.lastLogContains("The satchel contains 2 items.", gameState, 2), "")
    assertTrue(this.lastLogContains("You can act on items in the satchel.", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at blue key", gameState), "satchel mode can look at blue key")
    assertTrue(gameEngine.hasActionLike("Look at torn parchment", gameState), "satchel mode can look at torn parchment")
    assertTrue(gameEngine.hasActionLike("Look up from satchel", gameState), "Has look up from satchel action in satchel mode")
    gameEngine.performActionLike("Look at blue key", gameState)
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "look at an item leaves satchel mode")
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Look up from satchel", gameState), "Has look up from satchel action in satchel mode")
    assertTrue(!gameEngine.hasActionLike("Run away", gameState), "No Run away action in satchel mode")
    gameEngine.performActionLike("Look up from satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "look up from satchel leaves satchel mode")
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Use small potion", gameState), "can use small potion in satchel mode")
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at satchel", gameState), "left satchel mode by trying to use small potion unnecessarily")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take metal fangs", gameState)
    gameEngine.performActionLike("Put metal fangs on fox", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("You cut down my spawn. YOU SHALL PAY!", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("You have to squeeze into this room because it's already nearly full with a gigantic foul-smelling occupant. A troll. This one is truly huge, needing to slouch to avoid hitting his head on the ceiling.", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Take large potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("His sensitive nose tells him your story: he smells troll sweat, he smells dirty goblins, he smells DEATH!", gameState), "")
  }

  test_MAGameEngine_beatGame() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take small leather armor", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at blue glimmer", gameState)
    gameEngine.performActionLike("Take blue key", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take torn parchment", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal injured fox", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Put small leather armor", gameState)
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("A goblin. This goblin is only about waist-high", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "Can Run away in battle mode")
    assertTrue(gameEngine.hasActionLike("Punch small goblin", gameState), "Can Punch in battle mode")
    assertTrue(gameEngine.hasActionLike("Tell fox to Bite small goblin", gameState), "Can Bite in battle mode")
    assertTrue(gameEngine.hasActionLike("Tell fox to Scratch small goblin", gameState), "Can Scratch in battle mode")
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(this.lastLogContains("The satchel contains 2 items.", gameState, 2), "")
    assertTrue(this.lastLogContains("You can act on items in the satchel.", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at blue key", gameState), "satchel mode can look at blue key")
    assertTrue(gameEngine.hasActionLike("Look at torn parchment", gameState), "satchel mode can look at torn parchment")
    assertTrue(gameEngine.hasActionLike("Look up from satchel", gameState), "Has look up from satchel action in satchel mode")
    gameEngine.performActionLike("Look at blue key", gameState)
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "look at an item leaves satchel mode")
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Look up from satchel", gameState), "Has look up from satchel action in satchel mode")
    assertTrue(!gameEngine.hasActionLike("Run away", gameState), "No Run away action in satchel mode")
    gameEngine.performActionLike("Look up from satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "look up from satchel leaves satchel mode")
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Use small potion", gameState), "can use small potion in satchel mode")
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at satchel", gameState), "left satchel mode by trying to use small potion unnecessarily")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take metal fangs", gameState)
    gameEngine.performActionLike("Put metal fangs on fox", gameState)
    assertTrue(MAUtils.wornFox(gameState).worn.filter(x => x.name == "metal fangs").length == 1, "fox is wearing metal fangs")
    assertTrue(!gameState.inventory.hasNounNamed("metal fangs"), "metal fangs moved out of inventory")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("This specimen is a small one", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "using small potion leaves satchel mode")
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Look at potion x2", gameState), "has 2 potions coalesced")
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains("A locked door blocks your way.", gameState), "")
    assertTrue(gameState.currentLocation.name == "room 🧪1️⃣", "in potion room")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains("You can head north to room 💼🔒, south, or east to room 🦊🦷.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(!gameEngine.hasActionLike("Combine torn pieces", gameState), "no Combine action after doing it")
    gameEngine.performActionLike("Take torn parchment #2", gameState)
    gameEngine.performActionLike("Combine torn pieces of parchment", gameState)
    assertTrue(gameState.inventory.hasNounNamed("magic parchment"), "has magic parchment")
    assertTrue(!gameState.inventory.hasNounNamed("torn parchment"), "no more torn parchment")
    assertTrue(!gameState.inventory.hasNounNamed("torn parchment #2"), "no more torn parchment #2")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("This magic parchment appears to show its holder information that will be useful. What a great find!", gameState, 3), "")
    assertTrue(this.lastLogContains("The parchment's ink snakes around and shifts shape as it updates.", gameState, 2), "")
    assertTrue(this.lastLogContains("Health:\n😶 10/10\n🦊 5/5\n\nEquipment:\nsmall leather armor - reduces damage taken by 1\nmetal fangs - enables Metallic Bite attack\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nMetallic Bite - deals between 0 and 5 damage. Average: 2.6\n\nInventory:\nsmall potion - restores 3 health\npotion - restores 5 health", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains("As if you were here on purpose", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(this.lastLogContains("You break open the small potion and pour it all into the fox's mouth.", gameState), "")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox health is 5")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The adult goblin dealt 4 damage. A direct hit! You have 6 health remaining.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("You break open the potion and drink its entire contents.", gameState), "")
    assertTrue(gameState.player.currentHealth == 10, "health is 10")
    assertTrue(gameState.inventory.nouns.filter(x => x.name == "potion").length == 1, "exactly 1 potion")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("CHOMP! Critical hit!", gameState, 3), "")
    assertTrue(this.lastLogContains("The adult goblin leaves behind an elixir.", gameState), "")
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("You can head east to room 📜2️⃣ or west to room 🥉⛑.", gameState), "")
    assertTrue(!this.lastLogContains("goblin", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take bronze helm", gameState)
    gameEngine.performActionLike("Wear bronze helm", gameState)
    assertTrue(this.lastLogContains("The helm wasn't enough to save its previous owner, though...", gameState), "")
    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder) and a bronze helm.\n\nThe fox is wearing some small leather armor and some metal fangs.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("It does not appear to be friendly.", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Punch wolf pup", gameState)
    gameEngine.performActionLike("Punch wolf pup", gameState)
    assertTrue(this.lastLogContains("The wolf pup leaves behind a small potion.", gameState), "")
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("Unlike his less-aggressive (and recently-vanquished) offspring, papa wolf leaps and gnashes at you immediately. You narrowly dodge.", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("Youch! That smarts!", gameState, 2), "")
    assertTrue(this.lastLogContains("Your bronze helm protected you from 1 damage. The wolf dealt 1 damage. A direct hit! You have 9 health remaining.", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("Your attack dealt 4 damage. Nice!", gameState, 3), "")
    assertTrue(this.lastLogContains("The wolf has been dispatched from this realm!", gameState, 2), "")
    assertTrue(this.lastLogContains("Like father, like son. You've got a knack for cutting down family trees.\n\nThe wolf leaves behind an elixir.", gameState), "")
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("This room is a dead end with two useful items: a gold key and a large elixir.", gameState), "")
    gameEngine.performActionLike("Take gold key", gameState)
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Look at room", gameState)
    assertTrue(this.lastLogContains("There are no notable items nearby.", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains("Fur and blood cover the floor.", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains("Hard not to feel guilty for dispatching that cute lil wolf pup.", gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("No goblins, whew.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("You notice giant slimy egg shells scattered around the room.", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The fox's small leather armor protected it from 1 damage. The giant goblin dealt 3 damage. Misfortune! The fox has 2 health remaining.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Look at elixir x2", gameState), "elixir x2")
    assertTrue(gameEngine.hasActionLike("Look at potion x4", gameState), "potion x4")
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("You break open the potion, drink what you need, and share the rest with the fox.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("Health:\n😶 10/10\n🦊 5/5\n\nEquipment:\nbronze helm - reduces damage taken by 1\nsmall leather armor - reduces damage taken by 1\nmetal fangs - enables Metallic Bite attack\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nMetallic Bite - deals between 0 and 5 damage. Average: 2.6\n\nInventory:\nsmall potion - restores 3 health\npotion - restores 5 health\nelixir - revives unconscious fox and restores 1 health\nlarge elixir - revives unconscious fox and restores full health", gameState), "")
    assertTrue(!gameEngine.hasActionLike("Look up from satchel", gameState), "look at magic parchment leaves satchel mode")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("Has this put an end to the goblin bloodline?", gameState), "")
    assertTrue(this.lastLogContains("You notice that an orange key fell out of the giant goblin's pocket during battle.", gameState), "")
    gameEngine.performActionLike("Take orange key", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("You recognize the familiar stench and scattered remains of those who fell to the goblin.\n\nYou can head south to room 👿1️⃣ or west to room 🧑‍🎤1️⃣.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("There is a door to the north.\n\nYou can head north or west to room 👿1️⃣.", gameState), "")
    gameEngine.performActionLike("Look at door", gameState)
    assertTrue(this.lastLogContains("A door with an orange lock.", gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains("You use the orange key to unlock the door to the north.", gameState, 2), "")
    assertTrue(this.lastLogContains("You notice a pamphlet.", gameState), "")
    gameEngine.performActionLike("Take pamphlet", gameState)
    gameEngine.performActionLike("Read pamphlet", gameState)
    assertTrue(this.lastLogContains("The pamphlet is super informative and you use its instructions to upgrade the metal fangs into super metal fangs!", gameState), "")
    assertTrue(MAUtils.wornFox(gameState).worn.filter(x => x.name == "metal fangs").length == 0, "metal fangs removed")
    assertTrue(MAUtils.wornFox(gameState).worn.filter(x => x.name == "super metal fangs").length == 1, "super metal fangs added")
    assertTrue(!gameEngine.hasActionLike("Read pamphlet", gameState), "read pamphlet only once")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("Health:\n😶 9/10\n🦊 5/5\n\nEquipment:\nbronze helm - reduces damage taken by 1\nsmall leather armor - reduces damage taken by 1\nsuper metal fangs - enables Super Metallic Bite attack\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nSuper Metallic Bite - deals between 0 and 7 damage. Average: 3\n\nInventory:\nsmall potion - restores 3 health\npotion - restores 5 health\nelixir - revives unconscious fox and restores 1 health\nlarge elixir - revives unconscious fox and restores full health", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("You have to squeeze into this room because it's already nearly full with a gigantic foul-smelling occupant. Another troll. This one is even bigger than the first one, needing to slouch ", gameState), "")
    assertTrue(this.lastLogContains("What he has in size, he lacks in eloquence", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("CHOMP! Critical hit!", gameState, 5), "")
    assertTrue(this.lastLogContains("Your attack dealt 7 damage. Wow! The troll has 1 health remaining.", gameState, 4), "")
    gameEngine.performActionLike("Tell fox to Scratch troll", gameState)
    assertTrue(this.lastLogContains("The troll leaves behind a large potion.", gameState), "")
    gameEngine.performActionLike("Take large potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("The parchment's ink snakes around and shifts shape as it updates.", gameState, 2), "")
    assertTrue(this.lastLogContains("Health:\n😶 9/10\n🦊 5/5\n\nEquipment:\nbronze helm - reduces damage taken by 1\nsmall leather armor - reduces damage taken by 1\nsuper metal fangs - enables Super Metallic Bite attack\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nSuper Metallic Bite - deals between 0 and 7 damage. Average: 3\n\nInventory:\nsmall potion - restores 3 health\npotion - restores 5 health\nlarge potion - restores 10 health\nelixir - revives unconscious fox and restores 1 health\nlarge elixir - revives unconscious fox and restores full health", gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("the alpha wolf howls as you enter. His sensitive nose tells him your story: he smells troll sweat, he smells wolf pup, he smells dirty goblins, he smells his favorite lieutenant wolf, he smells DEATH", gameState), "")
    assertTrue(this.lastLogContains("The alpha wolf's growls are a deep reverberating rumble in this stone chamber.", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Scratch", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large potion", gameState)
    assertTrue(this.lastLogContains("You break open the large potion, drink what you need, and share the rest with the fox.", gameState), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The alpha wolf leaves behind a large elixir.", gameState), "")
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("You break open the potion, drink what you need, and share the rest with the fox.", gameState), "")
    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder) and a bronze helm.\n\nThe fox is wearing some small leather armor and some super metal fangs.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains('A green-scaled dragon meets your gaze. Its deep voice shakes the room and you feel it in your bones. "I summoned you here to rid my cavern passages of goblin, troll, and wolf parasites. You may act like a knight but you\'ve been nothing more than my pawn! And now I\'ll have a nice snack before returning to my slumber."', gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The dragon uses Yawn.", gameState, 3), "")
    assertTrue(!this.lastLogContains("taking aim at", gameState, 3), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The dragon uses Snooze.", gameState, 3), "")
    assertTrue(!this.lastLogContains("taking aim at", gameState, 3), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The fox has taken too much damage and collapses. It's up to you now.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    assertTrue(this.lastLogContains("You break open the elixir and pour it all into the fox's mouth. After a moment, it is revived back to consciousness.", gameState), "")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 1, "fox health is 1")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(!gameEngine.hasActionLike("Super Metallic Bite", gameState), "fox attacks gone")
    assertTrue(this.lastLogContains("The fox has taken too much damage and collapses. It's up to you now.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large elixir", gameState)
    assertTrue(this.lastLogContains("You break open the large elixir and pour it all into the fox's mouth. After a moment, it is revived back to full health!", gameState), "")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox health is 5")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("Hubris got the better of this magestic beast. You are no one's pawn.\n\nThe dragon leaves behind a hoard of gold.", gameState), "")
    gameEngine.performActionLike("Look at room", gameState)
    assertTrue(this.lastLogContains("The dragon's hoard of gold is on the ground for the taking.\n\nYou can head north to room 🐺3️⃣ or east.", gameState), "")
    gameEngine.performActionLike("Look at gold hoard", gameState)
    assertTrue(this.lastLogContains("You escaped with your life, a new companion, and a life-changing mass of gold coins.", gameState), "")
    gameEngine.performActionLike("Take gold hoard", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("You use the gold key to unlock the door to the east.", gameState, 2), "")
    assertTrue(this.lastLogContains("You enter room 🎊🎉.", gameState, 2), "")
    assertTrue(this.lastLogContains("Fresh air! Your nose is suddenly more aware of how stale and putrid the cavern air has been.\n\nBright light! You squint as you adjust to the warm and overwhemling sunlight.\n\nYou have escaped with your life and also new wealth! Congratulations!\n\nNow... where the heck are you?\n\nTHE END 🥳\n\n\n<a href=\"/p/dungeon.html\">Learn more about this game</a>", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains("Nothing notable. You would never guess that a magestic beast lost its life here.", gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(!this.lastLogContains("to unlock the door", gameState, 2), "")

  }

  test_MAGameEngine_magicParchmentNoInventoryOrEquipment() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal injured fox", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take torn parchment", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at blue glimmer", gameState)
    gameEngine.performActionLike("Take blue key", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take torn parchment #2", gameState)
    gameEngine.performActionLike("Combine torn pieces of parchment", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("Health:\n😶 10/10\n🦊 5/5\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nBite - deals between 0 and 5 damage. Average: 2.2", gameState), "")
    assertTrue(!this.lastLogContains("Inventory", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Scratch", gameState)
    assertTrue(gameState.currentLocation.nouns.filter(x => x.name == "giant goblin")[0].currentHealth == 10, "giant goblin has 10 health after attack")
    gameEngine.performActionLike("Run away", gameState)
    assertTrue(this.lastLogContains("You run away, escaping with your life to fight another day.", gameState, 2), "")
    assertTrue(this.lastLogContains("You are in room 📜2️⃣.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(gameState.currentLocation.nouns.filter(x => x.name == "giant goblin")[0].currentHealth == 11, "giant goblin has 11 health after returning")
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look up from satchel", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(gameState.player.currentHealth == 4, "user health is 4")
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at cot", gameState)
    gameEngine.performActionLike("Rest on cot", gameState)
    assertTrue(this.lastLogContains("After a long rest, you and the fox wake up fully healed.", gameState), "wake up fully healed log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Take orange key", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Kick", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("You break open the potion and drink its entire contents.", gameState), "Potion is not shared with unconscious fox")
    assertTrue(gameState.player.currentHealth == 10, "user health is 10")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 0, "fox health is 0")
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Take pamphlet", gameState)
    assertTrue(!gameEngine.hasActionLike("Read pamphlet", gameState), "cannot read pamphlet before we have fangs")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take metal fangs", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    // It would be reasonable to update magic parchment to explain the metal fangs when they are in inventory
    assertTrue(!this.lastLogContains("Equipment", gameState), "equipment is not explained by magic parchment before it is worn")
    gameEngine.performActionLike("Read pamphlet", gameState)
    assertTrue(gameState.inventory.hasNounNamed("super metal fangs"), "inventory has super metal fangs")
    assertTrue(!gameState.inventory.hasNounNamed("metal fangs"), "inventory lacks metal fangs")
    assertTrue(!MAUtils.wornFox(gameState).worn || MAUtils.wornFox(gameState).worn.filter(x => x.name == "super metal fangs").length == 0, "fox is not wearing super metal fangs")
    gameEngine.performActionLike("Put super metal fangs on fox", gameState)
    assertTrue(MAUtils.wornFox(gameState).worn.filter(x => x.name == "super metal fangs").length == 1, "fox is wearing super metal fangs")
    assertTrue(!gameState.inventory.hasNounNamed("super metal fangs"), "inventory lacks super metal fangs")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 1, "fox health is 1 after using elixir outside battle")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take bronze helm", gameState)
    gameEngine.performActionLike("Wear bronze helm", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Run away", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(gameState.inventory.hasNounNamed("potion"), "potion was not consumed")
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "Can't use potion on unconscious fox")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Kick", gameState)
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large elixir", gameState)
    assertTrue(this.lastLogContains("You break open the large elixir and pour it all into the fox's mouth. After a moment, it is revived back to full health!", gameState), "use large elixir outside battle")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox health is 5")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at large potion", gameState)
    gameEngine.performActionLike("Take large potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large potion", gameState)
    assertTrue(gameState.player.currentHealth == 10, "user health is 10")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox health is 5")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large elixir", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("A locked door blocks your way.", gameState), "gold lock without key")
    assertEqualStrings(gameState.currentLocation.name, "room 🐲🐉")
  }

  test_MAGameEngine_healingActionsDontAppearBeforeFirstBattle() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Look at small potion", gameState), "has look at small potion action")
    assertTrue(!gameEngine.hasActionLike("Use small potion", gameState), "lacks healing action")
  }

  test_MAGameEngine_showStableGoActionLinks() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)


    let actionStrs = gameEngine.actionStrings(gameState)

    assertTrue(actionStrs.filter(x => x.includes("north")).length == 1, "has one north action")
    assertTrue(actionStrs.filter(x => x.includes("[north")).length == 0, "north action is inactive")

    assertTrue(actionStrs.filter(x => x.includes("west")).length == 1, "has one west action")
    assertTrue(actionStrs.filter(x => x.includes("[west")).length == 0, "west action is inactive")

    assertTrue(actionStrs.filter(x => x.includes("east")).length == 1, "has one east action")
    assertTrue(actionStrs.filter(x => x.includes("[east")).length == 1, "east action is active")

    assertTrue(actionStrs.filter(x => x.includes("south")).length == 1, "has one south action")
    assertTrue(actionStrs.filter(x => x.includes("[south")).length == 0, "south action is inactive")
  }

  test_MAGameEngine_saveAndLoad() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal injured fox", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take torn parchment", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at blue glimmer", gameState)
    gameEngine.performActionLike("Take blue key", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take torn parchment #2", gameState)
    gameEngine.performActionLike("Combine torn pieces of parchment", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("Health:\n😶 10/10\n🦊 5/5\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nBite - deals between 0 and 5 damage. Average: 2.2", gameState), "")
    assertTrue(!this.lastLogContains("Inventory", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Scratch", gameState)
    assertTrue(gameState.currentLocation.nouns.filter(x => x.name == "giant goblin")[0].currentHealth == 10, "giant goblin has 10 health after attack")
    gameEngine.performActionLike("Run away", gameState)
    assertTrue(this.lastLogContains("You run away, escaping with your life to fight another day.", gameState, 2), "")
    assertTrue(this.lastLogContains("You are in room 📜2️⃣.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(gameState.currentLocation.nouns.filter(x => x.name == "giant goblin")[0].currentHealth == 11, "giant goblin has 11 health after returning")
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look up from satchel", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(gameState.player.currentHealth == 4, "user health is 4")
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at cot", gameState)
    gameEngine.performActionLike("Rest on cot", gameState)
    assertTrue(this.lastLogContains("After a long rest, you and the fox wake up fully healed.", gameState), "wake up fully healed log")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Take orange key", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Kick", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("You break open the potion and drink its entire contents.", gameState), "Potion is not shared with unconscious fox")
    assertTrue(gameState.player.currentHealth == 10, "user health is 10")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 0, "fox health is 0")
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Take pamphlet", gameState)
    assertTrue(!gameEngine.hasActionLike("Read pamphlet", gameState), "cannot read pamphlet before we have fangs")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take metal fangs", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    // It would be reasonable to update magic parchment to explain the metal fangs when they are in inventory
    assertTrue(!this.lastLogContains("Equipment", gameState), "equipment is not explained by magic parchment before it is worn")
    gameEngine.performActionLike("Read pamphlet", gameState)
    assertTrue(gameState.inventory.hasNounNamed("super metal fangs"), "inventory has super metal fangs")
    assertTrue(!gameState.inventory.hasNounNamed("metal fangs"), "inventory lacks metal fangs")
    assertTrue(!MAUtils.wornFox(gameState).worn || MAUtils.wornFox(gameState).worn.filter(x => x.name == "super metal fangs").length == 0, "fox is not wearing super metal fangs")
    gameEngine.performActionLike("Put super metal fangs on fox", gameState)
    assertTrue(MAUtils.wornFox(gameState).worn.filter(x => x.name == "super metal fangs").length == 1, "fox is wearing super metal fangs")
    assertTrue(!gameState.inventory.hasNounNamed("super metal fangs"), "inventory lacks super metal fangs")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 1, "fox health is 1 after using elixir outside battle")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take bronze helm", gameState)
    gameEngine.performActionLike("Wear bronze helm", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Run away", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(gameState.inventory.hasNounNamed("potion"), "potion was not consumed")
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "Can't use potion on unconscious fox")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Kick", gameState)
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large elixir", gameState)
    assertTrue(this.lastLogContains("You break open the large elixir and pour it all into the fox's mouth. After a moment, it is revived back to full health!", gameState), "use large elixir outside battle")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox health is 5")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at large potion", gameState)
    gameEngine.performActionLike("Take large potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large potion", gameState)
    assertTrue(gameState.player.currentHealth == 10, "user health is 10")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox health is 5")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large elixir", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Punch", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("A locked door blocks your way.", gameState), "gold lock without key")
    assertEqualStrings(gameState.currentLocation.name, "room 🐲🐉")


    // Create a new game from what's stored
    let gameState2 = new MAGameState()
    let gameEngine2 = new MAGameEngine()

    gameEngine2.setupNewGame(gameState2, gameState.serializedActions)
    assertEqualArrays(gameState.serializedActions, gameState2.serializedActions)
    assertEqualArrays(gameState.log.logs, gameState2.log.logs)
    assertEqualStrings(gameState2.currentLocation.name, "room 🐲🐉")

    // Save & restore with JSON serialization in the middle
    let gameState3 = new MAGameState()
    let gameEngine3 = new MAGameEngine()

    let jsonSerializedActions = JSON.stringify(gameState.serializedActions)
    let jsonDeserializedActions = JSON.parse(jsonSerializedActions)
    gameEngine3.setupNewGame(gameState3, jsonDeserializedActions)
    assertEqualArrays(gameState.serializedActions, gameState3.serializedActions)
    assertEqualArrays(gameState.log.logs, gameState3.log.logs)
    assertEqualStrings(gameState3.currentLocation.name, "room 🐲🐉")
  }

  test_MAGameEngine_beatGame_saveAndLoad() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take small leather armor", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at blue glimmer", gameState)
    gameEngine.performActionLike("Take blue key", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take torn parchment", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Heal injured fox", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Put small leather armor", gameState)
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("A goblin. This goblin is only about waist-high", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "Can Run away in battle mode")
    assertTrue(gameEngine.hasActionLike("Punch small goblin", gameState), "Can Punch in battle mode")
    assertTrue(gameEngine.hasActionLike("Tell fox to Bite small goblin", gameState), "Can Bite in battle mode")
    assertTrue(gameEngine.hasActionLike("Tell fox to Scratch small goblin", gameState), "Can Scratch in battle mode")
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(this.lastLogContains("The satchel contains 2 items.", gameState, 2), "")
    assertTrue(this.lastLogContains("You can act on items in the satchel.", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at blue key", gameState), "satchel mode can look at blue key")
    assertTrue(gameEngine.hasActionLike("Look at torn parchment", gameState), "satchel mode can look at torn parchment")
    assertTrue(gameEngine.hasActionLike("Look up from satchel", gameState), "Has look up from satchel action in satchel mode")
    gameEngine.performActionLike("Look at blue key", gameState)
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "look at an item leaves satchel mode")
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Look up from satchel", gameState), "Has look up from satchel action in satchel mode")
    assertTrue(!gameEngine.hasActionLike("Run away", gameState), "No Run away action in satchel mode")
    gameEngine.performActionLike("Look up from satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "look up from satchel leaves satchel mode")
    gameEngine.performActionLike("Tell fox to Bite", gameState)
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Use small potion", gameState), "can use small potion in satchel mode")
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at satchel", gameState), "left satchel mode by trying to use small potion unnecessarily")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take metal fangs", gameState)
    gameEngine.performActionLike("Put metal fangs on fox", gameState)
    assertTrue(MAUtils.wornFox(gameState).worn.filter(x => x.name == "metal fangs").length == 1, "fox is wearing metal fangs")
    assertTrue(!gameState.inventory.hasNounNamed("metal fangs"), "metal fangs moved out of inventory")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("This specimen is a small one", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    assertTrue(gameEngine.hasActionLike("Run away", gameState), "using small potion leaves satchel mode")
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite small troll", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Look at potion x2", gameState), "has 2 potions coalesced")
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains("A locked door blocks your way.", gameState), "")
    assertTrue(gameState.currentLocation.name == "room 🧪1️⃣", "in potion room")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains("You can head north to room 💼🔒, south, or east to room 🦊🦷.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(!gameEngine.hasActionLike("Combine torn pieces", gameState), "no Combine action after doing it")
    gameEngine.performActionLike("Take torn parchment #2", gameState)
    gameEngine.performActionLike("Combine torn pieces of parchment", gameState)
    assertTrue(gameState.inventory.hasNounNamed("magic parchment"), "has magic parchment")
    assertTrue(!gameState.inventory.hasNounNamed("torn parchment"), "no more torn parchment")
    assertTrue(!gameState.inventory.hasNounNamed("torn parchment #2"), "no more torn parchment #2")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("This magic parchment appears to show its holder information that will be useful. What a great find!", gameState, 3), "")
    assertTrue(this.lastLogContains("The parchment's ink snakes around and shifts shape as it updates.", gameState, 2), "")
    assertTrue(this.lastLogContains("Health:\n😶 10/10\n🦊 5/5\n\nEquipment:\nsmall leather armor - reduces damage taken by 1\nmetal fangs - enables Metallic Bite attack\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nMetallic Bite - deals between 0 and 5 damage. Average: 2.6\n\nInventory:\nsmall potion - restores 3 health\npotion - restores 5 health", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains("As if you were here on purpose", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use small potion", gameState)
    assertTrue(this.lastLogContains("You break open the small potion and pour it all into the fox's mouth.", gameState), "")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox health is 5")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The adult goblin dealt 4 damage. A direct hit! You have 6 health remaining.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("You break open the potion and drink its entire contents.", gameState), "")
    assertTrue(gameState.player.currentHealth == 10, "health is 10")
    assertTrue(gameState.inventory.nouns.filter(x => x.name == "potion").length == 1, "exactly 1 potion")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("CHOMP! Critical hit!", gameState, 3), "")
    assertTrue(this.lastLogContains("The adult goblin leaves behind an elixir.", gameState), "")
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    assertTrue(this.lastLogContains("There's no need to use that item.", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("You can head east to room 📜2️⃣ or west to room 🥉⛑.", gameState), "")
    assertTrue(!this.lastLogContains("goblin", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Look at piles of bones", gameState)
    gameEngine.performActionLike("Take bronze helm", gameState)
    gameEngine.performActionLike("Wear bronze helm", gameState)
    assertTrue(this.lastLogContains("The helm wasn't enough to save its previous owner, though...", gameState), "")
    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder) and a bronze helm.\n\nThe fox is wearing some small leather armor and some metal fangs.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("It does not appear to be friendly.", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Punch wolf pup", gameState)
    gameEngine.performActionLike("Punch wolf pup", gameState)
    assertTrue(this.lastLogContains("The wolf pup leaves behind a small potion.", gameState), "")
    gameEngine.performActionLike("Take small potion", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("Unlike his less-aggressive (and recently-vanquished) offspring, papa wolf leaps and gnashes at you immediately. You narrowly dodge.", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("Youch! That smarts!", gameState, 2), "")
    assertTrue(this.lastLogContains("Your bronze helm protected you from 1 damage. The wolf dealt 1 damage. A direct hit! You have 9 health remaining.", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("Your attack dealt 4 damage. Nice!", gameState, 3), "")
    assertTrue(this.lastLogContains("The wolf has been dispatched from this realm!", gameState, 2), "")
    assertTrue(this.lastLogContains("Like father, like son. You've got a knack for cutting down family trees.\n\nThe wolf leaves behind an elixir.", gameState), "")
    gameEngine.performActionLike("Take elixir", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take potion", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("This room is a dead end with two useful items: a gold key and a large elixir.", gameState), "")
    gameEngine.performActionLike("Take gold key", gameState)
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Look at room", gameState)
    assertTrue(this.lastLogContains("There are no notable items nearby.", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains("Fur and blood cover the floor.", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains("Hard not to feel guilty for dispatching that cute lil wolf pup.", gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("No goblins, whew.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains("You notice giant slimy egg shells scattered around the room.", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The fox's small leather armor protected it from 1 damage. The giant goblin dealt 3 damage. Misfortune! The fox has 2 health remaining.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    assertTrue(gameEngine.hasActionLike("Look at elixir x2", gameState), "elixir x2")
    assertTrue(gameEngine.hasActionLike("Look at potion x4", gameState), "potion x4")
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("You break open the potion, drink what you need, and share the rest with the fox.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("Health:\n😶 10/10\n🦊 5/5\n\nEquipment:\nbronze helm - reduces damage taken by 1\nsmall leather armor - reduces damage taken by 1\nmetal fangs - enables Metallic Bite attack\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nMetallic Bite - deals between 0 and 5 damage. Average: 2.6\n\nInventory:\nsmall potion - restores 3 health\npotion - restores 5 health\nelixir - revives unconscious fox and restores 1 health\nlarge elixir - revives unconscious fox and restores full health", gameState), "")
    assertTrue(!gameEngine.hasActionLike("Look up from satchel", gameState), "look at magic parchment leaves satchel mode")
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Metallic Bite", gameState)
    assertTrue(this.lastLogContains("Has this put an end to the goblin bloodline?", gameState), "")
    assertTrue(this.lastLogContains("You notice that an orange key fell out of the giant goblin's pocket during battle.", gameState), "")
    gameEngine.performActionLike("Take orange key", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("You recognize the familiar stench and scattered remains of those who fell to the goblin.\n\nYou can head south to room 👿1️⃣ or west to room 🧑‍🎤1️⃣.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("There is a door to the north.\n\nYou can head north or west to room 👿1️⃣.", gameState), "")
    gameEngine.performActionLike("Look at door", gameState)
    assertTrue(this.lastLogContains("A door with an orange lock.", gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains("You use the orange key to unlock the door to the north.", gameState, 2), "")
    assertTrue(this.lastLogContains("You notice a pamphlet.", gameState), "")
    gameEngine.performActionLike("Take pamphlet", gameState)
    gameEngine.performActionLike("Read pamphlet", gameState)
    assertTrue(this.lastLogContains("The pamphlet is super informative and you use its instructions to upgrade the metal fangs into super metal fangs!", gameState), "")
    assertTrue(MAUtils.wornFox(gameState).worn.filter(x => x.name == "metal fangs").length == 0, "metal fangs removed")
    assertTrue(MAUtils.wornFox(gameState).worn.filter(x => x.name == "super metal fangs").length == 1, "super metal fangs added")
    assertTrue(!gameEngine.hasActionLike("Read pamphlet", gameState), "read pamphlet only once")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("Health:\n😶 9/10\n🦊 5/5\n\nEquipment:\nbronze helm - reduces damage taken by 1\nsmall leather armor - reduces damage taken by 1\nsuper metal fangs - enables Super Metallic Bite attack\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nSuper Metallic Bite - deals between 0 and 7 damage. Average: 3\n\nInventory:\nsmall potion - restores 3 health\npotion - restores 5 health\nelixir - revives unconscious fox and restores 1 health\nlarge elixir - revives unconscious fox and restores full health", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("What he has in size, he lacks in eloquence", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("CHOMP! Critical hit!", gameState, 5), "")
    assertTrue(this.lastLogContains("Your attack dealt 7 damage. Wow! The troll has 1 health remaining.", gameState, 4), "")
    gameEngine.performActionLike("Tell fox to Scratch troll", gameState)
    assertTrue(this.lastLogContains("The troll leaves behind a large potion.", gameState), "")
    gameEngine.performActionLike("Take large potion", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Look at magic parchment", gameState)
    assertTrue(this.lastLogContains("The parchment's ink snakes around and shifts shape as it updates.", gameState, 2), "")
    assertTrue(this.lastLogContains("Health:\n😶 9/10\n🦊 5/5\n\nEquipment:\nbronze helm - reduces damage taken by 1\nsmall leather armor - reduces damage taken by 1\nsuper metal fangs - enables Super Metallic Bite attack\n\nAttacks:\n😶\nKick - deals 1 damage\nPunch - deals between 0 and 3 damage. Average: 1.4\n\n🦊\nScratch - deals 1 damage\nSuper Metallic Bite - deals between 0 and 7 damage. Average: 3\n\nInventory:\nsmall potion - restores 3 health\npotion - restores 5 health\nlarge potion - restores 10 health\nelixir - revives unconscious fox and restores 1 health\nlarge elixir - revives unconscious fox and restores full health", gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("The alpha wolf's growls are a deep reverberating rumble in this stone chamber.", gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Scratch", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large potion", gameState)
    assertTrue(this.lastLogContains("You break open the large potion, drink what you need, and share the rest with the fox.", gameState), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The alpha wolf leaves behind a large elixir.", gameState), "")
    gameEngine.performActionLike("Take large elixir", gameState)
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use potion", gameState)
    assertTrue(this.lastLogContains("You break open the potion, drink what you need, and share the rest with the fox.", gameState), "")
    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains("You are wearing a fox (on your shoulder) and a bronze helm.\n\nThe fox is wearing some small leather armor and some super metal fangs.", gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains('A green-scaled dragon meets your gaze. Its deep voice shakes the room and you feel it in your bones. "I summoned you here to rid my cavern passages of goblin, troll, and wolf parasites. You may act like a knight but you\'ve been nothing more than my pawn! And now I\'ll have a nice snack before returning to my slumber."', gameState), "")
    assertTrue(!this.lastLogContains("You can head", gameState), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The dragon uses Yawn.", gameState, 3), "")
    assertTrue(!this.lastLogContains("taking aim at", gameState, 3), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The dragon uses Snooze.", gameState, 3), "")
    assertTrue(!this.lastLogContains("taking aim at", gameState, 3), "")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("The fox has taken too much damage and collapses. It's up to you now.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use elixir", gameState)
    assertTrue(this.lastLogContains("You break open the elixir and pour it all into the fox's mouth. After a moment, it is revived back to consciousness.", gameState), "")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 1, "fox health is 1")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(!gameEngine.hasActionLike("Super Metallic Bite", gameState), "fox attacks gone")
    assertTrue(this.lastLogContains("The fox has taken too much damage and collapses. It's up to you now.", gameState), "")
    gameEngine.performActionLike("Look at satchel", gameState)
    gameEngine.performActionLike("Use large elixir", gameState)
    assertTrue(this.lastLogContains("You break open the large elixir and pour it all into the fox's mouth. After a moment, it is revived back to full health!", gameState), "")
    assertTrue(MAUtils.wornFox(gameState).currentHealth == 5, "fox health is 5")
    gameEngine.performActionLike("Tell fox to Super Metallic Bite", gameState)
    assertTrue(this.lastLogContains("Hubris got the better of this magestic beast. You are no one's pawn.\n\nThe dragon leaves behind a hoard of gold.", gameState), "")
    gameEngine.performActionLike("Look at room", gameState)
    assertTrue(this.lastLogContains("The dragon's hoard of gold is on the ground for the taking.\n\nYou can head north to room 🐺3️⃣ or east.", gameState), "")
    gameEngine.performActionLike("Look at gold hoard", gameState)
    assertTrue(this.lastLogContains("You escaped with your life, a new companion, and a life-changing mass of gold coins.", gameState), "")
    gameEngine.performActionLike("Take gold hoard", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("You use the gold key to unlock the door to the east.", gameState, 2), "")
    assertTrue(this.lastLogContains("You enter room 🎊🎉.", gameState, 2), "")
    assertTrue(this.lastLogContains("Fresh air! Your nose is suddenly more aware of how stale and putrid the cavern air has been.\n\nBright light! You squint as you adjust to the warm and overwhemling sunlight.\n\nYou have escaped with your life and also new wealth! Congratulations!\n\nNow... where the heck are you?\n\nTHE END 🥳", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains("Nothing notable. You would never guess that a magestic beast lost its life here.", gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(!this.lastLogContains("to unlock the door", gameState, 2), "")


    // Create a new game from what's stored
    let gameState2 = new MAGameState()
    let gameEngine2 = new MAGameEngine()

    gameEngine2.setupNewGame(gameState2, gameState.serializedActions)
    assertEqualArrays(gameState.serializedActions, gameState2.serializedActions)
    assertEqualArrays(gameState.log.logs, gameState2.log.logs)
    gameEngine2.performActionLike("Go west", gameState2)
    assertEqualStrings(gameState2.currentLocation.name, "room 🐲🐉")

    // Save & restore with JSON serialization in the middle
    let gameState3 = new MAGameState()
    let gameEngine3 = new MAGameEngine()

    let jsonSerializedActions = JSON.stringify(gameState.serializedActions)
    let jsonDeserializedActions = JSON.parse(jsonSerializedActions)
    gameEngine3.setupNewGame(gameState3, jsonDeserializedActions)
    assertEqualArrays(gameState.serializedActions, gameState3.serializedActions)
    assertEqualArrays(gameState.log.logs, gameState3.log.logs)
    gameEngine3.performActionLike("Go west", gameState3)
    assertEqualStrings(gameState3.currentLocation.name, "room 🐲🐉")
  }


  test_MAGameEngine_beatGame_saveAndLoad() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Take satchel", gameState)
    assertEqualStrings(gameState.currentLocation.name, "room 💼🔒")


    // Save & restore with JSON serialization in the middle
    let gameState2 = new MAGameState()
    let gameEngine2 = new MAGameEngine()

    let jsonSerializedActions = JSON.stringify(gameState.serializedActions)
    let jsonDeserializedActions = JSON.parse(jsonSerializedActions)
    gameEngine2.setupNewGame(gameState2, jsonDeserializedActions)
    assertEqualArrays(gameState.serializedActions, gameState2.serializedActions)
    assertEqualArrays(gameState.log.logs, gameState2.log.logs)
    assertEqualStrings(gameState2.currentLocation.name, "room 💼🔒")

    gameEngine2.performActionLike("Go west", gameState2)
    gameEngine2.performActionLike("Go west", gameState2)
    gameEngine2.performActionLike("Take small potion", gameState2)
    assertTrue(gameState2.inventory.hasNounNamed("small potion"), "has small potion")


    // Save & restore with JSON serialization in the middle
    let gameState3 = new MAGameState()
    let gameEngine3 = new MAGameEngine()

    let jsonSerializedActions2 = JSON.stringify(gameState2.serializedActions)
    let jsonDeserializedActions2 = JSON.parse(jsonSerializedActions2)
    gameEngine3.setupNewGame(gameState3, jsonDeserializedActions2)
    assertEqualArrays(gameState2.serializedActions, gameState3.serializedActions)
    assertEqualArrays(gameState2.log.logs, gameState3.log.logs)
  }



// Memories

/*
  test_Memories_performActionRemember() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine)

    gameEngine.performActionLike("look", gameState)

    assertTrue(gameState.currentLocation.nouns.find(x => x.name == "computer mouse"), "mouse in loc")

    gameEngine.performActionLike("look at [computer mouse]", gameState)
    assertTrue(this.lastLogContains("computer lab pranks", gameState), "look mouse")

    gameEngine.performActionLike("remember", gameState)
    assertTrue(this.lastLogContains("You and your classmates", gameState), "remember mouse 1")

    gameEngine.performActionLike("remember", gameState)
    assertTrue(this.lastLogContains("sneaky fun", gameState), "remember mouse 2")

    assertTrue(gameEngine.hasActionLike("remember", gameState), "still can remember mouse")
    gameEngine.performActionLike("remember", gameState)
    assertTrue(this.lastLogContains("shred of guilt", gameState), "remember mouse 3")


    assertTrue(!gameEngine.hasActionLike("remember", gameState), "remember used up")
  }
*/


// Unit test harness

  run() {
    let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))

    let passCount = 0
    for (let method of methods) {
      if (method.startsWith("test")) {
        MALog.log("=== Invoking " + method + " ===")
        this[method]();
        passCount++
      }
    }
    MALog.log(passCount + " tests and " + assertionCount + " assertions passed successfully!")
  }
}

// Run with:
//  let ut = new UnitTests()
//  ut.run()
