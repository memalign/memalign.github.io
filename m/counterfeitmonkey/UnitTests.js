
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
      "Go north",
      "Use restoration gel",
      "Look at zebra",
      "Look at yourself",
      "Look at 🌆🌆 back alley",
      "Take food",
      "Go southeast",
      "Use letter-remover",
      "Look at inventory",
      "Go west",
      "Look at cat",
      "Go east",
    ]

    let expectation = [
      "Use letter-remover",
      "Use restoration gel",
      "Look at 🌆🌆 back alley",
      "Look at cat",
      "Look at dog",
      "Look at zebra",
      "Look at yourself",
      "Look at inventory",
      "Take food",
      "Go north",
      "Go south",
      "Go east",
      "Go west",
      "Go southeast",
      "Go northwest",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_actionsComparator_lookUpFromSatchel() {
    let strings = [
      "Look at dog",
      "Look up from inventory",
      "Look at zebra",
      "Look at cat",
    ]

    let expectation = [
      "Look at cat",
      "Look at dog",
      "Look at zebra",
      "Look up from inventory",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_actionsComparator_letterRemover() {
    let strings = [
      "Use letter-remover on temporary barrier",
      "Use letter-remover on codex",
      "Nevermind",
      "Use letter-remover on museum",
    ]

    let expectation = [
      "Use letter-remover on codex",
      "Use letter-remover on museum",
      "Use letter-remover on temporary barrier",
      "Nevermind",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_actionsComparator_letterRemover_letterMode() {
    let strings = [
      "Remove o from codex",
      "Remove c from codex",
      "Remove d from codex",
      "Nevermind",
      "Remove e from codex",
      "Remove x from codex",
    ]

    let expectation = [
      "Remove c from codex",
      "Remove d from codex",
      "Remove e from codex",
      "Remove o from codex",
      "Remove x from codex",
      "Nevermind",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_actionsComparator_restorationGel() {
    let strings = [
      "Rub gel on temporary barrier",
      "Rub gel on codex",
      "Nevermind",
      "Rub gel on museum",
    ]

    let expectation = [
      "Rub gel on codex",
      "Rub gel on museum",
      "Rub gel on temporary barrier",
      "Nevermind",
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
      "Go <a id='f2345-678-abcdef'>south</a>",
      "Go east",
      "Go west",
      "Go southeast",
      "Go northwest",
    ]
    assertEqualArrays(strings.sort(MAUtils.actionsComparator), expectation)
  }

  test_MAUtils_elementNamed() {
    let list = [
      new MANoun("dog"),
      new MANoun("cat"),
      new MANoun("big bear"),
      new MAScenery("goat"),
    ]

    assertTrue(MAUtils.elementNamed(list, "dog") === list[0], "found dog")
    assertTrue(MAUtils.elementNamed(list, "goat") === list[3], "found goat")
    assertTrue(MAUtils.elementNamed(list, "bear") === null, "bear does not exist")
  }

  test_MAUtils_replaceNounWithNounsForContainer_singleReplacement_noRecursion() {
    let cat = new MANoun("cat")
    let frog = new MANoun("frog")
    let dog = new MANoun("dog")
    let pea = new MANoun("pea")

    let replacement = new MANoun("replacement")

    let container = new MAScenery("container")
    container.nouns.push(cat)
    container.nouns.push(frog)
    container.nouns.push(dog)
    container.nouns.push(pea)

    let result = MAUtils.replaceNounWithNounsForContainer(dog, [replacement], container)

    assertTrue(result, "replacement succeeded")

    let expectation = [
      cat,
      frog,
      replacement,
      pea,
    ]

    assertEqualArrays(container.nouns, expectation)
  }

  test_MAUtils_replaceNounWithNounsForContainer_twoReplacements_noRecursion() {
    let cat = new MANoun("cat")
    let frog = new MANoun("frog")
    let dog = new MANoun("dog")
    let pea = new MANoun("pea")

    let replacement1 = new MANoun("replacement1")
    let replacement2 = new MANoun("replacement2")

    let container = new MAScenery("container")
    container.nouns.push(cat)
    container.nouns.push(frog)
    container.nouns.push(dog)
    container.nouns.push(pea)

    let result = MAUtils.replaceNounWithNounsForContainer(dog, [replacement1, replacement2], container)

    assertTrue(result, "replacement succeeded")

    let expectation = [
      cat,
      frog,
      replacement1,
      replacement2,
      pea,
    ]

    assertEqualArrays(container.nouns, expectation)
  }

  test_MAUtils_replaceNounWithNounsForContainer_singleReplacement_recursion() {
    let cat = new MANoun("cat")
    let frog = new MANoun("frog")
    let dog = new MANoun("dog")
    let pea = new MANoun("pea")

    let replacement = new MANoun("replacement")

    let container = new MAScenery("container")
    container.nouns.push(cat)
    container.nouns.push(frog)
    container.nouns.push(dog)
    container.nouns.push(pea)


    let outerContainer = new MAScenery("outerContainer")
    let outer1 = new MANoun("outer1")
    let outer2 = new MAScenery("outer2")
    outer2.nouns.push(new MANoun("fuzz"))

    outerContainer.nouns.push(outer1)
    outerContainer.nouns.push(outer2)
    outerContainer.nouns.push(container)

    let result = MAUtils.replaceNounWithNounsForContainer(dog, [replacement], outerContainer)

    assertTrue(result, "replacement succeeded")

    let expectation = [
      cat,
      frog,
      replacement,
      pea,
    ]

    assertEqualArrays(container.nouns, expectation)
  }

  test_MAUtils_replaceNounWithNounsForContainer_twoReplacements_recursion() {
    let cat = new MANoun("cat")
    let frog = new MANoun("frog")
    let dog = new MANoun("dog")
    let pea = new MANoun("pea")

    let replacement1 = new MANoun("replacement1")
    let replacement2 = new MANoun("replacement2")

    let container = new MAScenery("container")
    container.nouns.push(cat)
    container.nouns.push(frog)
    container.nouns.push(dog)
    container.nouns.push(pea)

    let outerContainer = new MAScenery("outerContainer")
    let outer1 = new MANoun("outer1")
    let outer2 = new MAScenery("outer2")
    outer2.nouns.push(new MANoun("fuzz"))

    outerContainer.nouns.push(outer1)
    outerContainer.nouns.push(outer2)
    outerContainer.nouns.push(container)


    let result = MAUtils.replaceNounWithNounsForContainer(dog, [replacement1, replacement2], outerContainer)

    assertTrue(result, "replacement succeeded")

    let expectation = [
      cat,
      frog,
      replacement1,
      replacement2,
      pea,
    ]

    assertEqualArrays(container.nouns, expectation)
  }

  test_MAUtils_replaceNounWithNounsForContainer_twoReplacements_recursion_noMatch() {
    let cat = new MANoun("cat")
    let frog = new MANoun("frog")
    let dog = new MANoun("dog")
    let pea = new MANoun("pea")

    let replacement1 = new MANoun("replacement1")
    let replacement2 = new MANoun("replacement2")

    let container = new MAScenery("container")
    container.nouns.push(cat)
    container.nouns.push(frog)
    container.nouns.push(dog)
    container.nouns.push(pea)

    let outerContainer = new MAScenery("outerContainer")
    let outer1 = new MANoun("outer1")
    let outer2 = new MAScenery("outer2")
    outer2.nouns.push(new MANoun("fuzz"))

    outerContainer.nouns.push(outer1)
    outerContainer.nouns.push(outer2)
    outerContainer.nouns.push(container)


    let missingDog = new MANoun("missing dog")
    let result = MAUtils.replaceNounWithNounsForContainer(missingDog, [replacement1, replacement2], outerContainer)

    assertTrue(!result, "replacement did not succeed")

    let expectation = [
      cat,
      frog,
      dog,
      pea,
    ]

    assertEqualArrays(container.nouns, expectation)
  }

  tests_MAUtils_userAgentIsSearchEngineCrawler() {
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

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let emojiMap = "\n" + map.emojiMap(loc0_0)

    let expectedMap =
`
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_oneLoc_inspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let emojiMap = "\n" + map.emojiMap(loc0_0)

    let expectedMap =
`
🌳🌳🌳🌳
🌳🏢🏬🌳
🌳▫️😶🌳
🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westInspected_eastUninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("🌆🌆 back alley")
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc0_0)

    let expectedMap =
`
🌳🌳🌳🌳🌳🌳🌳
🌳🏢🏬🌳🌳🌳🌳
🌳▫️😶▫️🌳🌳🌳
🌳🌳🌳🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westUninspected_eastInspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("🌆🌆 back alley")
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
🌳🌳🌳🌳🌳🌳🌳
🌳🌳🌳🌳🌆🌆🌳
🌳🌳🌳▫️▫️😶🌳
🌳🌳🌳🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westInspected_eastInspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("🌆🌆 back alley")
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
🌳🌳🌳🌳🌳🌳🌳
🌳🏢🏬🌳🌆🌆🌳
🌳▫️▫️▫️▫️😶🌳
🌳🌳🌳🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westUninspected_eastUninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("🌆🌆 back alley")
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
🌳🌳🌳🌳🌳🌳🌳
🌳🌳🌳🌳🌳🌳🌳
🌳🌳🌳🌳🌳🌳🌳
🌳🌳🌳🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northInspected_southUninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("🌆🌆 back alley")
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc0_0)

    let expectedMap =
`
🌳🌳🌳🌳
🌳🏢🏬🌳
🌳▫️😶🌳
🌳🌳▫️🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northUninspected_southInspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("🌆🌆 back alley")
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳▫️🌳
🌳🌆🌆🌳
🌳▫️😶🌳
🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northInspected_southInspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("🌆🌆 back alley")
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
🌳🌳🌳🌳
🌳🏢🏬🌳
🌳▫️▫️🌳
🌳🌳▫️🌳
🌳🌆🌆🌳
🌳▫️😶🌳
🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northUninspected_southUninspected() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("🌆🌆 back alley")
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0)

    let expectedMap =
`
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
🌳🌳🌳🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_oneLoc_uninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let emojiMap = "\n" + map.emojiMap(loc0_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_oneLoc_inspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let emojiMap = "\n" + map.emojiMap(loc0_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳
🌳|🏢|🏬|🌳
🌳|▫️|😶|🌳
🌳|🌳|🌳|🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westInspected_eastUninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("🌆🌆 back alley")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc0_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳|🌳|🌳|🌳
🌳|🏢|🏬|🌳|🌳|🌳|🌳
🌳|▫️|😶|▫️|🌳|🌳|🌳
🌳|🌳|🌳|🌳|🌳|🌳|🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westUninspected_eastInspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("🌆🌆 back alley")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = map.emojiMap(loc1_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳|🌆|🌆|🌳
🌳|🌳|🌳|▫️|▫️|😶|🌳
🌳|🌳|🌳|🌳|🌳|🌳|🌳
`

    assertEqualStrings("\n" + emojiMap, expectedMap)

    let htmlMap = "\n" + MAUtils.htmlTableFromEmojiMap(emojiMap, "|")
    let expectedHTML =
`
<table>
<tr>
<td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td><td>🌆</td><td>🌆</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>🌳</td><td>🌳</td><td>▫️</td><td>▫️</td><td>😶</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td>
</tr>
</table>
`
    assertEqualStrings(htmlMap, expectedHTML)
  }

  test_MAMap_twoLocs_westInspected_eastInspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("🌆🌆 back alley")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳|🌳|🌳|🌳
🌳|🏢|🏬|🌳|🌆|🌆|🌳
🌳|▫️|▫️|▫️|▫️|😶|🌳
🌳|🌳|🌳|🌳|🌳|🌳|🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_westUninspected_eastUninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("🌆🌆 back alley")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.East, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳|🌳|🌳|🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northInspected_southUninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("🌆🌆 back alley")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = map.emojiMap(loc0_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳
🌳|🏢|🏬|🌳
🌳|▫️|😶|🌳
🌳|🌳|▫️|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
`

    assertEqualStrings("\n" + emojiMap, expectedMap)

    let htmlMap = "\n" + MAUtils.htmlTableFromEmojiMap(emojiMap, "|")
    let expectedHTML =
`
<table>
<tr>
<td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>🏢</td><td>🏬</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>▫️</td><td>😶</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>🌳</td><td>▫️</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td>
</tr>
<tr>
<td>🌳</td><td>🌳</td><td>🌳</td><td>🌳</td>
</tr>
</table>
`
    assertEqualStrings(htmlMap, expectedHTML)
  }

  test_MAMap_twoLocs_northUninspected_southInspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("🌆🌆 back alley")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|▫️|🌳
🌳|🌆|🌆|🌳
🌳|▫️|😶|🌳
🌳|🌳|🌳|🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northInspected_southInspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    loc0_0.inspected = true

    let loc1_0 = new MALocation("🌆🌆 back alley")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc1_0.inspected = true

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳
🌳|🏢|🏬|🌳
🌳|▫️|▫️|🌳
🌳|🌳|▫️|🌳
🌳|🌆|🌆|🌳
🌳|▫️|😶|🌳
🌳|🌳|🌳|🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }

  test_MAMap_twoLocs_northUninspected_southUninspected_separator() {
    let map = new MAMap()
    map.nameToLocation = {}

    let loc0_0 = new MALocation("🏢🏬 Sigil Street")
    loc0_0.emojiName = "🏢|🏬"
    map.startLocation = loc0_0
    map.addLocation(loc0_0)

    let loc1_0 = new MALocation("🌆🌆 back alley")
    loc1_0.emojiName = "🌆|🌆"
    map.addLocation(loc1_0)

    loc0_0.addLinkInDirection(MADirection.South, loc1_0)

    let emojiMap = "\n" + map.emojiMap(loc1_0, "|")

    let expectedMap =
`
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
🌳|🌳|🌳|🌳
`

    assertEqualStrings(emojiMap, expectedMap)
  }



// MANoun

  test_MANoun_inSentenceName() {
    let noun1 = new MANoun("dog")
    let noun2 = new MANoun("dogs")
    let noun3 = new MANoun("aardvark")
    let noun4 = new MANoun("aardvarks")
    let noun5 = new MANoun("dress")
    noun5.isPlural = () => false

    assertEqualStrings(noun1.inSentenceName(), "a dog")
    assertEqualStrings(noun2.inSentenceName(), "some dogs")
    assertEqualStrings(noun3.inSentenceName(), "an aardvark")
    assertEqualStrings(noun4.inSentenceName(), "some aardvarks")
    assertEqualStrings(noun5.inSentenceName(), "a dress")
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

    // Get through initial waking
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Andra\"", gameState)
    gameEngine.performActionLike("Say \"Ok\"", gameState)

    // Omitted in action
    assertTrue(gameEngine.hasActionLike("Go north", gameState), "can go east")
    assertTrue(!gameEngine.hasActionLike("Go north to ", gameState), "name omitted")
  }

  test_MAGameEngine_visitedLocationName() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    // Get through initial waking
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Andra\"", gameState)
    gameEngine.performActionLike("Say \"Ok\"", gameState)

    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go south", gameState)

    // Present in action
    assertTrue(gameEngine.hasActionLike("Go north ⬆️ to 🏬🏬 Sigil Street", gameState), "name present in action")
  }

  test_MAGameEngine_initialWaking_moreCoverage() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Say \"urggggh\"", gameState)
    assertTrue(this.lastLogContains(`Huh... well at least we're conscious.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`Do you remember our name?`, gameState), "")
    gameEngine.performActionLike("Say \"Huh?\"", gameState)
    assertTrue(this.lastLogContains(`To review, we're Alexandra now. I was Alex, before the synthesis. You were...`, gameState), "")
    gameEngine.performActionLike("Say \"Alexandra\"", gameState)
    assertTrue(this.lastLogContains(`That's our joint name now, yes. I was Alex before the synthesis. You were...`, gameState), "")
    gameEngine.performActionLike("Say \"...\"", gameState)
    assertTrue(this.lastLogContains(`...oh boy. Okay. Okay. I need you on form here. This is going to be hard if you don't remember being yourself. Not panicking. Let's try again...`, gameState), "")
    gameEngine.performActionLike("Say \"...\"", gameState)
    gameEngine.performActionLike("Say \"Alexandra\"", gameState)
    gameEngine.performActionLike("Say \"Andra\"", gameState)
    assertTrue(this.lastLogContains(`Exactly right. I'm Alex and you're Andra, making us jointly Alexandra. As far as I can tell, the operation was a success. We're meant to be one person now, unrecognizable to anyone who knew us before.\n\nLet's try to get a look around. I haven't been able to run our body without your help, but maybe now you're awake, it'll work better.`, gameState), "")
    gameEngine.performActionLike("Say \"Ok\"", gameState)
    assertTrue(gameEngine.hasActionLike("Go north", gameState), "")
  }

  test_MAGameEngine_spinWheel() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)


    // Get through initial waking
    gameEngine.performActionLike("Say \"No\"", gameState)
    gameEngine.performActionLike("Say \"No\"", gameState)
    gameEngine.performActionLike("Say \"Alex\"", gameState)
    gameEngine.performActionLike("Say \"...\"", gameState)
    assertTrue(this.lastLogContains(`...oh boy. Okay. Okay. I need you on form here. This is going to be hard if you don't remember being yourself. Not panicking. Let's try again...`, gameState), "")
    gameEngine.performActionLike("Say \"...\"", gameState)
    gameEngine.performActionLike("Say \"Alexandra\"", gameState)
    gameEngine.performActionLike("Say \"Andra\"", gameState)
    gameEngine.performActionLike("Say \"Ok\"", gameState)

    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at museum", gameState)
    gameEngine.performActionLike("Look at temporary barrier", gameState)
    gameEngine.performActionLike("Look at code-lock", gameState)
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on codex", gameState)
    gameEngine.performActionLike("Remove x from codex", gameState)
    gameEngine.performActionLike("Use code 305", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Look at wheel", gameState)
    gameEngine.performActionLike("Spin wheel", gameState)
    gameEngine.performActionLike("Spin wheel", gameState)
    gameEngine.performActionLike("Spin wheel", gameState)
    assertTrue(this.lastLogContains(`HOT AIR again`, gameState), "")
    gameEngine.performActionLike("Spin wheel", gameState)
    assertTrue(this.lastLogContains(`HOT AIR yet again`, gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Take pear", gameState)
    assertTrue(this.lastLogContains(`None of that!`, gameState, 2), "")
    assertTrue(gameEngine.hasActionLike("Take pear", gameState), "")
    gameEngine.performActionLike("Look at barker", gameState)
    gameEngine.performActionLike("Take tube", gameState)
    assertTrue(this.lastLogContains(`I don't dare invade the personal space of the barker.`, gameState, 2), "")
    assertTrue(gameEngine.hasActionLike("Take tube", gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on tube", gameState)
    assertTrue(this.lastLogContains(`The barker spots us gesticulating and smoothly, almost without thinking about it, swaps the tube into the other hand so that we miss.`, gameState, 2), "")
    assertTrue(gameEngine.hasActionLike("Nevermind", gameState), "")
    gameEngine.performActionLike("Nevermind", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pear", gameState)
    gameEngine.performActionLike("Remove p from pear", gameState)
    gameEngine.performActionLike("Take apple", gameState)
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at tube", gameState)
    assertTrue(this.lastLogContains(`It claims to be full of restoration gel, but said gel is mostly gone. If only it had been a larger container to start with.`, gameState), "")
    gameEngine.performActionLike("Use restoration gel", gameState)
    assertTrue(this.lastLogContains(`Unfortunately, there's hardly any gel remaining in the tube.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Nevermind", gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on tube", gameState)
    gameEngine.performActionLike("Remove e from tube", gameState)
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on ear", gameState)
    assertTrue(this.lastLogContains(`We dip out a fingertip-coating quantity of gel and rub it gently onto the ear. With an audible SPLORT, the ear becomes a pearl and falls to the ground. It is small, slightly uneven, and pale blue in color. Not worth very much, but genuine.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Take pearl", gameState), "")
    gameEngine.performActionLike("Take pearl", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on code", gameState)
    gameEngine.performActionLike("Remove c from code", gameState)
    assertTrue(this.lastLogContains(`With a distinct whiff of paper, the code turns into an ode. A short poem, letter-pressed attractively on a sheet of thick paper. It is entitled "Our Ancestors, The Immortal Spirits of the Pyramids," a fact which disinclines me to study the rest.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Take ode", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at ode", gameState), "")
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on ode", gameState)
    assertTrue(!gameEngine.hasActionLike("Take codex", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at codex", gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on reflective window", gameState)
    gameEngine.performActionLike("Remove n from reflective window", gameState)
    assertTrue(this.lastLogContains(`The reflective window flickers and there is a brief image of a reflective widow in its place, but a legal override kicks in: a letter-remover is hardware-limited to prevent generating any living creature.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at reflective window", gameState), "")
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at apple", gameState)
    assertTrue(this.lastLogContains(`Red-cheeked and rosy.`, gameState), "")
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at apple", gameState)
    assertTrue(this.lastLogContains(`Red-cheeked and rosy.`, gameState), "")
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at tub", gameState)
    assertTrue(this.lastLogContains(`Now a handsome, giant-sized tub with RESTORATION GEL prominently emblazoned on the front. The tub contains a clear, sticky gel that restores objects to their original state, before any letter changing. This is a valuable item in your line of work. As an added bonus, it smells like spearmint.`, gameState), "")
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at tub", gameState)
    assertTrue(this.lastLogContains(`Now a handsome, giant-sized tub with RESTORATION GEL prominently emblazoned on the front. The tub contains a clear, sticky gel that restores objects to their original state, before any letter changing. This is a valuable item in your line of work. As an added bonus, it smells like spearmint.`, gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Look at diorama", gameState)
    assertTrue(this.lastLogContains(`The patriotic scene is set against the backdrop of the Bureau's buildings ca. 1895, where the committee first met, but the historians have included a bit of the building exterior to show that the meetings were conducted under army guard. The writing of dictionaries has not always been bloodless.\n\nThe members and army are movable, but the rest of the scenery appears to have been hot-glued in place.`, gameState), "")
    gameEngine.performActionLike("Take members", gameState)
    gameEngine.performActionLike("Look at diorama", gameState)
    assertTrue(this.lastLogContains(`The patriotic scene is set against the backdrop of the Bureau's buildings ca. 1895, where the committee first met, but the historians have included a bit of the building exterior to show that the meetings were conducted under army guard. The writing of dictionaries has not always been bloodless. The members have been removed.\n\nThe army is movable, but the rest of the scenery appears to have been hot-glued in place.`, gameState), "")
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look up from inventory", gameState)
    gameEngine.performActionLike("Take army", gameState)
    gameEngine.performActionLike("Look at diorama", gameState)
    assertTrue(this.lastLogContains(`The patriotic scene is set against the backdrop of the Bureau's buildings ca. 1895, where the committee first met, but the historians have included a bit of the building exterior to show that the meetings were conducted under army guard. The writing of dictionaries has not always been bloodless. Both the army and members are missing.\n\nThe scenery appears to have been hot-glued in place.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on army", gameState)
    gameEngine.performActionLike("Remove r from army", gameState)
    assertTrue(this.lastLogContains(`The army flickers and there is a brief image of an Amy in its place, but a legal override kicks in: a letter-remover is hardware-limited to prevent generating any living creature.`, gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Look at locker", gameState)
    gameEngine.performActionLike("Look at [lock]", gameState)
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on [lock]", gameState)
    assertTrue(this.lastLogContains(`The backpacking girl is watching our every move with unconcealed curiosity, which makes me a little hesitant to do anything with the locker. I think our best bet is to show her something that really weirds her out.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Nevermind", gameState), "")
    gameEngine.performActionLike("Nevermind", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Look at desk attendant", gameState)
    gameEngine.performActionLike("Ask how to unlock", gameState)
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Look at [lock]", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on army", gameState)
    gameEngine.performActionLike("Remove y from army", gameState)
    gameEngine.performActionLike("Show her the arm", gameState)
    assertTrue(!gameEngine.hasActionLike("Look at anorak", gameState), "")
    gameEngine.performActionLike("Look at heavy pack", gameState)
    assertTrue(this.lastLogContains(`With the girl gone, we can freely inspect its contents.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at anorak", gameState), "")
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on [lock]", gameState)
    gameEngine.performActionLike("Open locker", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on plans", gameState)
    gameEngine.performActionLike("Remove s from plans", gameState)
    assertTrue(this.lastLogContains(`There is a flash of psychedelic colors and the plans turn into a plan. The number of pages in the original roll has been reduced, but this is still obviously a bit of DCL property. The only difference is that this version is incomplete.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at [plan]", gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains(`"I, like, remembered the combination of my lock," we say.\n\n"I'm overjoyed." Deadpan.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on blouse", gameState)
    gameEngine.performActionLike("Remove b from blouse", gameState)
    assertTrue(this.lastLogContains(`The blouse flickers and there is a brief image of a louse in its place, but a legal override kicks in: a letter-remover is hardware-limited to prevent generating any living creature.`, gameState), "")
  }

  test_MAGameEngine_beatGame() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)


    // Get through initial waking
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Andra\"", gameState)
    gameEngine.performActionLike("Say \"Ok\"", gameState)

    assertTrue(this.lastLogContains(`This alley runs north to the open street, towards the town square. That's the way we'll want to go first.`, gameState), "")
    gameEngine.performActionLike("back alley", gameState)
    assertTrue(this.lastLogContains(`There is nothing here but the back sides of a couple of buildings, some peeling yellow paint; not even much by way of windows to look in through.`, gameState), "")
    gameEngine.performActionLike("Look at beige buildings", gameState)
    assertTrue(this.lastLogContains(`A little more beige than the buildings facing them, but just as shabby and free of windows.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`Something makes you think of how we got here.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Remember how we got here", gameState), "")
    gameEngine.performActionLike("Remember how we got here", gameState)
    assertTrue(this.lastLogContains(`But we couldn't move, even though you were half-conscious. So he panicked. We'd paid him to let us recover in comfort, but he wasn't about to risk having a corpse on his hands, even an unidentified one. He picked us up and dumped our body in the back alley and left.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`Then we're back in the present.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Remember", gameState), "")
    gameEngine.performActionLike("Look at dull house", gameState)
    assertTrue(this.lastLogContains(`The owners of the house obviously didn't want a view in this direction, as there aren't any windows to see through, just a wall scarred by decades of occasional remodeling.`, gameState), "")
    gameEngine.performActionLike("Look at yellow buildings", gameState)
    assertTrue(this.lastLogContains(`The buildings are no doubt due for renovation,`, gameState), "")
    gameEngine.performActionLike("Look at yellow paint", gameState)
    assertTrue(this.lastLogContains(`In this climate, of course, paint is quickly ruined by the sun.`, gameState), "")
    gameEngine.performActionLike("Look at yourself", gameState)
    assertTrue(this.lastLogContains(`This body is more you than me — well, it would be, since we came out a girl. Still, I feel a bit odd inspecting us too closely. It feels like invading your privacy.\n\nI don't think anything about us looks out of place. We are female, though a little taller and leaner than average, and with slightly boyish facial features. It's nothing that would attract attention, though.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Look at yourself", gameState), "")
    gameEngine.performActionLike("Look at inventory", gameState)
    assertTrue(!gameEngine.hasActionLike("Go", gameState), "")
    assertTrue(this.lastLogContains(`You insisted that we bring almost nothing into the synthesis room, so the criminal who was performing the synthesis couldn't rob us. I had hoped there was more honor among thieves, but you said no, there isn't.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`You can act on items in the inventory.`, gameState), "")
    gameEngine.performActionLike("Look at letter-remover", gameState)
    assertTrue(this.lastLogContains(`It is a blunt-nosed plastic device, about the size of a laser pointer, that can be waved at things to remove excess letters. It is not very powerful, and often fails against large items. On the other hand, it has a wide range of action: it can be set to any letter we choose.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Use letter-remover", gameState), "")
    gameEngine.performActionLike("Look at inventory", gameState)
    assertTrue(!this.lastLogContains(`You insisted that we bring almost nothing into the synthesis room, so the criminal who was performing the synthesis couldn't rob us. I had hoped there was more honor among thieves, but you said no, there isn't.`, gameState, 2), "")
    gameEngine.performActionLike("Look up from inventory", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on yellow paint", gameState)
    assertTrue(this.lastLogContains(`What letter should we remove?`, gameState), "")
    gameEngine.performActionLike("Remove a from yellow paint", gameState)
    assertTrue(this.lastLogContains(`We smoothly, and almost without thinking about it, reset your device to be an a-remover.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`A good thought — PAINT is a very linguistically productive word — but spread thin over a large area like this it's too hard for a low-powered letter-remover to work on.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Use letter-remover", gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on yellow buildings", gameState)
    gameEngine.performActionLike("Nevermind", gameState)
    assertTrue(gameEngine.hasActionLike("Use letter-remover", gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on yellow buildings", gameState)
    gameEngine.performActionLike("Remove s from yellow buildings", gameState)
    assertTrue(this.lastLogContains(`We reset the device to an s-remover.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`The device warms up a bit in our hand, but fails. It doesn't have enough power to work on something as large as the yellow buildings.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on beige buildings", gameState)
    gameEngine.performActionLike("Remove s from beige buildings", gameState)
    assertTrue(!this.lastLogContains(`"s-remover"`, gameState, 2), "")
    assertTrue(this.lastLogContains(`The device warms up a bit in our hand, but fails. It doesn't have enough power to work on something as large as the beige buildings.`, gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains(`The buildings here are two and three stories, with shops at ground level and apartments above. The shops are closed for the holiday: a typographer's office, tourist boutiques of colorful skirts and ethnic bodices (rarely if ever worn by natives) and t-shirts covered with font designs.`, gameState), "")
    gameEngine.performActionLike("Look at reflective window", gameState)
    assertTrue(this.lastLogContains(`But I am uncomfortable sharing a body, and uncomfortable looking into a mirror and seeing something other than my own face looking out.`, gameState), "")
    gameEngine.performActionLike("Look at reflective window", gameState)
    assertTrue(!this.lastLogContains(`But I am uncomfortable sharing a body, and uncomfortable looking into a mirror and seeing something other than my own face looking out.`, gameState), "")
    assertTrue(this.lastLogContains(`I have not gotten used to what we look like since we were synthesized into a single female body. The face that looks back is deeply scary. It's not me. And it's not you either. It's more like one of those computer composites you can have done to envision future offspring: if you and I were to have a somewhat androgynous daughter she might look like this.`, gameState), "")
    gameEngine.performActionLike("Look at elderly apartments", gameState)
    gameEngine.performActionLike("Look at narrow alley", gameState)
    assertTrue(!gameEngine.hasActionLike("Look at ethnic bodices", gameState), "")
    gameEngine.performActionLike("Look at tourist boutiques", gameState)
    assertTrue(this.lastLogContains(`We peruse the offerings: some colorful skirts, some font t-shirts, some ethnic bodices, and a mourning dress.`, gameState), "")
    gameEngine.performActionLike("Look at ethnic bodices", gameState)
    assertTrue(this.lastLogContains(`Closed with ribbons and laces, to be worn over frilly white shirts.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Take ethnic bodices", gameState), "")
    gameEngine.performActionLike("Look at colorful skirts", gameState)
    gameEngine.performActionLike("Look at font t-shirts", gameState)
    gameEngine.performActionLike("Look at mourning dress", gameState)
    gameEngine.performActionLike("Look at Typographer's office", gameState)
    assertTrue(this.lastLogContains(`The office advertises custom fonts and symbols, though it is very unlikely that anyone decides to have a custom font made simply because they happened to catch a notice in a shop window. In honor of the holiday, there is also a display poster showing the form of the humble comma as it manifests itself in a variety of popular fonts.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on mourning dress", gameState)
    gameEngine.performActionLike("Remove u from mourning dress", gameState)
    assertTrue(this.lastLogContains(`We reset the device to a u-remover.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`There is a flash of psychedelic colors and the mourning dress turns into a morning dress. An outfit of striped trousers and fancy coat, such as men sometimes wear to fancy weddings in the morning.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Take morning dress", gameState), "")
    assertTrue(gameEngine.hasActionLike("Look at morning dress", gameState), "")
    assertTrue(!gameEngine.hasActionLike("Look at mourning dress", gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on font t-shirts", gameState)
    assertTrue(!gameEngine.hasActionLike("Remove - from font t-shirts", gameState), "")
    assertTrue(!gameEngine.hasActionLike("Remove   from font t-shirts", gameState), "")
    assertTrue(!gameEngine.hasActionLike("Remove a from font t-shirts", gameState), "")
    assertTrue(gameEngine.hasActionLike("Remove f from font t-shirts", gameState), "")
    assertTrue(gameEngine.hasActionLike("Remove o from font t-shirts", gameState), "")
    assertTrue(gameEngine.hasActionLike("Remove n from font t-shirts", gameState), "")
    assertTrue(gameEngine.hasActionLike("Remove t from font t-shirts", gameState), "")
    assertTrue(gameEngine.hasActionLike("Remove s from font t-shirts", gameState), "")
    assertTrue(gameEngine.hasActionLike("Remove h from font t-shirts", gameState), "")
    assertTrue(gameEngine.hasActionLike("Remove i from font t-shirts", gameState), "")
    assertTrue(gameEngine.hasActionLike("Remove r from font t-shirts", gameState), "")
    gameEngine.performActionLike("Remove r from font t-shirts", gameState)
    assertTrue(this.lastLogContains(`We smoothly, and almost without thinking about it, reset your device to be an r-remover.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`No doubt this would be a cogent statement about the commercialization of the body, if it weren't for the fact that T-SHIT doesn't describe anything anyone with a functional colon has ever heard of.`, gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    assertEqualStrings(gameState.currentLocation.name, "🏛🏢 Ampersand Bend")
    assertTrue(this.lastLogContains(`The window of the museum is currently displaying one of its exhibits, a codex.`, gameState), "")
    assertTrue(this.lastLogContains(`A temporary barrier blocks this empty street from the busy fair to the north, though there is a door that could be opened with the correct code. From here, the gaiety and excitement of the holiday are fairly loud.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Nevermind", gameState)
    assertTrue(gameEngine.hasActionLike("Look at museum", gameState), "")
    assertTrue(!gameEngine.hasActionLike("Look at codex", gameState), "")
    gameEngine.performActionLike("Look at museum", gameState)
    assertTrue(this.lastLogContains(`All that can be seen of the exhibits is the external display window. On the other side of the protective tinted glass is a codex.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Take codex", gameState), "")
    gameEngine.performActionLike("Look at codex", gameState)
    assertTrue(this.lastLogContains(`A manuscript of Atlantean origin from the 16th century. It records a series of slightly mad visions of what the world would be like if the "composition of letters" could be systematically exchanged.`, gameState), "")
    gameEngine.performActionLike("Look at real estate office", gameState)
    gameEngine.performActionLike("Look at temporary barrier", gameState)
    gameEngine.performActionLike("Look at code-lock", gameState)
    assertTrue(gameEngine.hasActionLike("Use code 614", gameState), "")
    gameEngine.performActionLike("Use code 614", gameState)
    assertTrue(this.lastLogContains(`We set the wheels of the code-lock to 614 but the temporary barrier is still locked. If only the right code were written down somewhere nearby...`, gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains(`The temporary barrier is locked. We need to set the code-lock to the right number first.`, gameState), "")
    assertEqualStrings(gameState.currentLocation.name, "🏛🏢 Ampersand Bend")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on codex", gameState)
    gameEngine.performActionLike("Remove c from codex", gameState)
    assertTrue(this.lastLogContains(`The device buzzes, puzzled. It is unable to create anything recognizable called "odex", or perhaps it just doesn't have sufficient power to handle the codex.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on codex", gameState)
    gameEngine.performActionLike("Remove x from codex", gameState)
    assertTrue(this.lastLogContains(`There is a lavendar cloud and the codex turns into a code. A bit of paper on which is written "305".`, gameState), "")
    gameEngine.performActionLike("Use code 305", gameState)
    assertTrue(this.lastLogContains(`Click! The barrier door unlocks and we can now go north.`, gameState), "")
    gameEngine.performActionLike("Look at museum", gameState)
    assertTrue(this.lastLogContains(`All that can be seen of the exhibits is the external display window. On the other side of the protective tinted glass is a code.`, gameState), "")
    gameEngine.performActionLike("Look at 🏛🏢 Ampersand Bend", gameState)
    assertTrue(this.lastLogContains(`The window of the museum is currently displaying one of its exhibits, a code. Well, not to worry: they'll be able to restore the codex easily enough when the museum reopens.`, gameState), "")
    assertTrue(this.lastLogContains(`A temporary barrier blocks this empty street from the busy fair to the north, though it is currently unlocked and anyone could go through. From here, the gaiety and excitement of the holiday are fairly loud.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Take code", gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    assertTrue(this.lastLogContains(`We are surrounded by kiosks for spell-offs, face-painting, a wheel to spin for prizes, and other activities best for small children or the very easily amused.`, gameState), "")
    gameEngine.performActionLike("Look at crowds", gameState)
    assertTrue(this.lastLogContains(`The people seem to be enjoying themselves.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Look at crowds", gameState), "")
    gameEngine.performActionLike("Look at kiosks", gameState)
    gameEngine.performActionLike("Look at random foodstuffs", gameState)
    assertTrue(!gameEngine.hasActionLike("Spin wheel", gameState), "")
    gameEngine.performActionLike("Look at wheel", gameState)
    assertTrue(this.lastLogContains(`It's the sort of game where you spin the wheel for a prize.`, gameState), "")
    gameEngine.performActionLike("Spin wheel", gameState)
    assertTrue(this.lastLogContains(`We give the wheel a forceful spin. While it's spinning, the flipper makes a satisfying *thup thup thup* noise as it flips from one slot to the next. The pointer lands on HOT AIR, which appears to be the most common reward. Sadly, no one is around to award this prize (which is probably why we were allowed to spin it without having some sort of ticket first).`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on wheel", gameState)
    gameEngine.performActionLike("Remove w from wheel", gameState)
    assertTrue(this.lastLogContains(`You wave the w-remover at the wheel and produce a heel, severed (because after all it would be beyond the parameters of the change to generate the person whose body part it is). It is only moderately gory, and most locals get used to seeing this kind of thing as a prank from six-year-olds every halloween. Still, it might startle a tourist.`, gameState), "")
    gameEngine.performActionLike("Take heel", gameState)
    gameEngine.performActionLike("Look at 🍬🌭 Fair", gameState)
    assertTrue(this.lastLogContains(`We are surrounded by kiosks for spell-offs, face-painting, and other activities best for small children or the very easily amused.`, gameState), "")
    gameEngine.performActionLike("Go west", gameState)
    assertTrue(this.lastLogContains(`I assume you've noticed, though, the word-balance, which comes up as high as our hip. The beam is balanced. On the right pan is an apple and on the left is a pear.\n\nBeside the word-balance is a barker in a blue suit, the same regulation blue used by the Bureau of Orthography. The barker is also holding a tube.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`"Step up and try your hand at the fabulous word-balance!" calls the barker appealingly.`, gameState), "")
    gameEngine.performActionLike("Look at apple", gameState)
    gameEngine.performActionLike("Look at balloons", gameState)
    assertTrue(this.lastLogContains(`"Put the beam out of alignment and win a fabulous prize!" says the barker, holding up a tube.`, gameState), "")
    gameEngine.performActionLike("Attack balloons", gameState)
    assertTrue(this.lastLogContains(`We have better things to do, remember?`, gameState, 2), "")
    gameEngine.performActionLike("Look at barker", gameState)
    gameEngine.performActionLike("Look at blank church wall", gameState)
    gameEngine.performActionLike("Look at blue suit", gameState)
    gameEngine.performActionLike("Look at pear", gameState)
    gameEngine.performActionLike("Look at pharmacy", gameState)
    gameEngine.performActionLike("Look at strong-man hammering contest", gameState)
    gameEngine.performActionLike("Look at styrofoam dart-plane", gameState)
    gameEngine.performActionLike("Look at tube", gameState)
    assertTrue(this.lastLogContains(`We can't get a good look at the tube from this position, but it definitely appears to be authentic restoration gel`, gameState, 2), "")
    gameEngine.performActionLike("Look at word-balance", gameState)
    assertTrue(this.lastLogContains(`The beam is balanced. On the right pan is an apple and on the left is a pear.`, gameState, 2), "")
    gameEngine.performActionLike("Ask about the barker's suit", gameState)
    assertTrue(!gameEngine.hasActionLike("Ask about the barker's suit", gameState), "")
    assertTrue(this.lastLogContains(`The crowd mills around, jostling us.`, gameState, 2), "")
    gameEngine.performActionLike("Ask if anyone ever wins", gameState)
    assertTrue(!gameEngine.hasActionLike("Ask if anyone ever wins", gameState), "")
    assertTrue(this.lastLogContains(`No one has won today,`, gameState, 3), "")
    gameEngine.performActionLike("Ask if the gel is valuable", gameState)
    gameEngine.performActionLike("Ask whether the game is rigged", gameState)
    gameEngine.performActionLike("Put something next to the apple", gameState)
    assertTrue(this.lastLogContains(`You must make one side go down and the other come up,`, gameState, 2), "")
    gameEngine.performActionLike("Take apple", gameState)
    assertTrue(this.lastLogContains(`The barker gives us a warning look. In case you forgot, we may not increase or decrease the contents of the pan by hand or lean on the beam.`, gameState, 2), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on apple", gameState)
    gameEngine.performActionLike("Remove p from apple", gameState)
    assertTrue(this.lastLogContains(`There's a smell of fermenting apple, then cider, then something more malty. In the apple's place there is now a glass of nutbrown ale.`, gameState, 2), "")
    assertTrue(!this.lastLogContains(`the barker`, gameState), "barker stops calling to the crowd")
    gameEngine.performActionLike("Take ale", gameState)
    gameEngine.performActionLike("Take pear", gameState)
    gameEngine.performActionLike("Look at word-balance", gameState)
    assertTrue(this.lastLogContains(`The beam is balanced. Both pans are empty.`, gameState), "")
    gameEngine.performActionLike("Look at 🍎🍐 Midway", gameState)
    assertTrue(this.lastLogContains(`No longer so useful is the word-balance, which comes up as high as our hip. The beam is balanced. Both pans are empty.`, gameState), "")
    gameEngine.performActionLike("Look at inventory", gameState)
    gameEngine.performActionLike("Look at tube", gameState)
    assertTrue(this.lastLogContains(`It claims to be full of restoration gel, but said gel is mostly gone. If only it had been a larger container to start with.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on tube", gameState)
    gameEngine.performActionLike("Remove e from tube", gameState)
    assertTrue(this.lastLogContains(`There is a flash of cerulean light and the tube turns into a tub. Now a handsome, giant-sized tub with RESTORATION GEL prominently emblazoned on the front. The tub contains a clear, sticky gel that restores objects to their original state, before any letter changing. This is a valuable item in your line of work. As an added bonus, it smells like spearmint.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Use restoration gel", gameState), "")
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on pear", gameState)
    assertTrue(this.lastLogContains(`We dip out a pea-sized quantity of gel and rub it gently onto the pear. With an audible SPLORT, the pear becomes a pearl. It is small, slightly uneven, and pale blue in color. Not worth very much, but genuine.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pearl", gameState)
    gameEngine.performActionLike("Remove l from pearl", gameState)
    assertTrue(this.lastLogContains(`There is a flash of psychedelic colors and the pearl turns into a pear. Handsome and green.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pear", gameState)
    gameEngine.performActionLike("Remove r from pear", gameState)
    assertTrue(this.lastLogContains(`There is a mad-scientist cackle and the pear turns into a pea. Just a single green pea.`, gameState), "")
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on pea", gameState)
    assertTrue(this.lastLogContains(`We dip out a fingertip-coating quantity of gel and rub it gently onto the pea. With an audible SPLORT, the pea becomes a pearl.`, gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pearl", gameState)
    gameEngine.performActionLike("Remove p from pearl", gameState)
    assertTrue(this.lastLogContains(`The pearl flickers and there is a brief image of an earl in its place, but a legal override kicks in: a letter-remover is hardware-limited to prevent generating any living creature.`, gameState), "")
    assertTrue(gameState.inventory.hasNounNamed("pearl"), "has pearl")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pearl", gameState)
    gameEngine.performActionLike("Remove l from pearl", gameState)
    assertTrue(this.lastLogContains(`The pearl gives way to the now-familiar pear.`, gameState), "")
    assertTrue(gameState.inventory.hasNounNamed("pear"), "has pear")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on pear", gameState)
    gameEngine.performActionLike("Remove p from pear", gameState)
    assertTrue(this.lastLogContains(`You wave the p-remover at the pear and produce an ear, severed.`, gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on small children", gameState)
    gameEngine.performActionLike("Remove s from small children", gameState)
    assertTrue(this.lastLogContains(`If it were a more powerful device, the letter-remover might be able to generate something resembling the concept of "mall children," but that's not an idiomatic saying around here. Not to mention that the parents would be bound to object.`, gameState), "")
    gameEngine.performActionLike("Look at grass", gameState)
    gameEngine.performActionLike("Look at marble fountain", gameState)
    assertTrue(this.lastLogContains(`It depicts some horses rising out of the waves, with trident-bearing gods on their backs, and some nymphs overseeing the whole operation. Probably 17th-century, to judge by the excessive number of writhing figures.`, gameState), "")
    gameEngine.performActionLike("Look at horses", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on horses", gameState)
    gameEngine.performActionLike("Remove r from horses", gameState)
    assertTrue(this.lastLogContains(`The horses become hoses, redecorating the fountain.`, gameState), "")
    gameEngine.performActionLike("Look at marble fountain", gameState)
    assertTrue(this.lastLogContains(`The nymphs and trident-bearing gods are now aiming hoses out at passers-by.`, gameState), "")
    gameEngine.performActionLike("Look at 👩‍👧‍👧🌱 Park Center", gameState)
    assertTrue(this.lastLogContains(`This is a handsome expanse of grass, shaped like a rectangle with rounds cut from the corners, bounded by railings along the north side. There are no stalls and no barkers here, but small children are running around a desecrated marble fountain, currently spewing water in all directions.\n\nThe sound of children shrieking and jumping through fountain water is by far the loudest component of the assorted din filling the air.`, gameState), "")
    gameEngine.performActionLike("Look at small children", gameState)
    assertTrue(this.lastLogContains(`Most of them are now sopping wet, and loving it.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`You have a fleeting thought of your austere childhood.`, gameState), "")
    gameEngine.performActionLike("Remember your austere childhood", gameState)
    assertTrue(this.lastLogContains(`A small white room with a free-standing wardrobe full of modest home-made clothes; a plain-hewn bookshelf with Bible, study guides, a dictionary and thesaurus; and a sampler on the far wall that reads, "Our pursuit of perfection is our gift to God." It's done in very exact cross-stitch.`, gameState), "")
    assertTrue(this.lastLogContains(`Then we're back in the present.`, gameState), "")
    gameEngine.performActionLike("Remember your austere childhood", gameState)
    gameEngine.performActionLike("Remember your austere childhood", gameState)
    gameEngine.performActionLike("Remember your austere childhood", gameState)
    assertTrue(this.lastLogContains(`The recollections blur together now, rejected and useless.`, gameState), "")
    assertTrue(!this.lastLogContains(`Then we're back in the present`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Remember your austere childhood", gameState), "")
    assertTrue(!gameEngine.hasActionLike("Take hoses", gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on hoses", gameState)
    gameEngine.performActionLike("Remove s from hoses", gameState)
    assertTrue(this.lastLogContains(`The hoses become a hoe, redecorating the fountain.`, gameState), "")
    gameEngine.performActionLike("Take hoe", gameState)
    assertTrue(gameState.inventory.hasNounNamed("hoe"), "has hoe")
    assertTrue(this.lastLogContains(`You pick up the hoe. It's a common gardening implement, perhaps a little larger than usual.`, gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains(`Under a bit of shelter in the corner, a diorama table shows scenes from local history, rotated out each week. This week's diorama represents the first sitting of the Committee for the New Orthodox Orthography.`, gameState), "")
    gameEngine.performActionLike("Look at diorama", gameState)
    assertTrue(this.lastLogContains(`The members and army are movable, but the rest of the scenery appears to have been hot-glued in place.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Take army", gameState), "")
    assertTrue(gameEngine.hasActionLike("Take members", gameState), "")
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on army", gameState)
    gameEngine.performActionLike("Remove y from army", gameState)
    assertTrue(this.lastLogContains(`You wave the y-remover at the army and produce an arm, severed (because after all it would be beyond the parameters of the change to generate the person whose body part it is). It is only moderately gory, and most locals get used to seeing this kind of thing as a prank from six-year-olds every halloween. Still, it might startle a tourist.`, gameState), "")
    assertTrue(!gameState.inventory.hasNounNamed("arm"), "doesn't have arm")
    gameEngine.performActionLike("Take arm", gameState)
    assertTrue(gameState.inventory.hasNounNamed("arm"), "has arm")
    gameEngine.performActionLike("Take members", gameState)
    gameEngine.performActionLike("Use letter-remover", gameState)
    gameEngine.performActionLike("Use letter-remover on shelter", gameState)
    gameEngine.performActionLike("Remove s from shelter", gameState)
    assertTrue(this.lastLogContains(`The device buzzes, puzzled. You can't make "helter" without a bit of "skelter."`, gameState), "")
    gameEngine.performActionLike("Go east", gameState)
    assertTrue(this.lastLogContains("We enter 👩‍💻📖 Hostel", gameState, 2), "")
    assertEqualStrings(gameState.currentLocation.name, "👩‍💻📖 Hostel")
    assertTrue(this.lastLogContains(`The desk attendant is sort of eying us. She doesn't recognize you — us — but that's a good thing, I think.`, gameState), "")
    gameEngine.performActionLike("Look at attendant's desk", gameState)
    assertTrue(!gameEngine.hasActionLike("Ask", gameState), "")
    gameEngine.performActionLike("Look at desk attendant", gameState)
    assertTrue(this.lastLogContains(`She's dressed in a kind of casual-hippy way: nose ring, poofy blouse that doesn't fit quite right.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`She toys unattractively with her nose ring.`, gameState), "")
    assertTrue(gameEngine.hasActionLike("Ask", gameState), "")
    gameEngine.performActionLike("Ask what she recommends", gameState)
    gameEngine.performActionLike("Ask what the fair is for", gameState)
    gameEngine.performActionLike("Ask whether public transport exists", gameState)
    gameEngine.performActionLike("Ask whether she enjoys her job", gameState)
    gameEngine.performActionLike("Ask whether there are beds available", gameState)
    gameEngine.performActionLike("Ask whether there is an internet connection nearby", gameState)
    gameEngine.performActionLike("Ask who would do this", gameState)
    gameEngine.performActionLike("Ask what the other group was like", gameState)
    gameEngine.performActionLike("Ask about the young woman", gameState)
    assertTrue(this.lastLogContains(`"What, the young woman?" The attendant shrugs. "Kind of uptight."`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Ask", gameState), "")
    gameEngine.performActionLike("Compliment the nose ring", gameState)
    assertTrue(this.lastLogContains(`"Thanks." She gives it a little pat. "I'm thinking of getting a sternum piercing next."`, gameState), "")
    gameEngine.performActionLike("Look at blouse", gameState)
    gameEngine.performActionLike("Look at ceiling", gameState)
    gameEngine.performActionLike("Look at Guidebook", gameState)
    gameEngine.performActionLike("Look at narrow hallway", gameState)
    gameEngine.performActionLike("Look at nose ring", gameState)
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on desk attendant", gameState)
    assertTrue(this.lastLogContains(`We dip out a pea-sized quantity of gel and approach the desk attendant with it. "Hey!" says the desk attendant. "That was really cold! What do you think you're doing?"\n\nBut no exciting conversions occur.`, gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains(`The locker you identify as your own sits near one of the beds, still locked with its dial lock.\n\nA girl of about 19 is standing in the middle of the room, looking around as though she can't quite believe where she landed or what she's doing here. She is carrying a heavy pack and wearing a pink t-shirt.`, gameState), "")
    gameEngine.performActionLike("Look at backpacking girl", gameState)
    assertTrue(this.lastLogContains(`She is just the sort of tourist who most annoys the locals, but actually I find her type a little endearing: she may not be very sophisticated yet, but she *wants* to expand her horizons, and that's more than you can say for most of the friends she probably left back at home.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`She bangs her head against the space where a pillow ought to be.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`"Wish I hadn't remembered that serial killer thing," the girl remarks, half to herself. "Now it's going to keep me up later. Picturing someone with a saw hacking me up."`, gameState), "")
    gameEngine.performActionLike("Ask for privacy", gameState)
    assertTrue(this.lastLogContains(`She waves a hand generously. "Don't worry about it, do whatever you've got to do, I don't care," she says. "I'm so tired I couldn't move a muscle, but I've seen everything. I have three brothers and two sisters and I'm in women's rugby so I'm pretty hard to shock."`, gameState), "")
    gameEngine.performActionLike("Look at backpacking girl", gameState)
    assertTrue(this.lastLogContains(`"Oh my gosh, I am SO jetlagged. I feel like I'm just going to fall over, you know?"`, gameState), "")
    gameEngine.performActionLike("Tell her we know how jetlag can be", gameState)
    gameEngine.performActionLike("Tell her a lie", gameState)
    gameEngine.performActionLike("Look at locker", gameState)
    assertTrue(this.lastLogContains(`A standard metal locker for travelers to leave their valuable possessions in when they go out — or while they sleep, since one's bunkmates are not always to be trusted. It is of the kind that requires the traveler to bring his own lock, and in fact someone (such as yourself) has put a lock on this one.`, gameState, 2), "")
    assertTrue(this.lastLogContains(`"So when did you get to Anglophone Atlantis, anyway? How long have you been here?"`, gameState), "")
    gameEngine.performActionLike("Tell her a lie", gameState)
    assertTrue(this.lastLogContains(`"Oh, yeah, that was smart," she says. "I am really not ready for this at all."`, gameState), "")
    gameEngine.performActionLike("Ask whether she had trouble with customs", gameState)
    gameEngine.performActionLike("Look at [lock]", gameState)
    assertTrue(this.lastLogContains(`It's curious, now you look at it: it's a combination lock with a dial face, but no one has bothered putting any numerals onto the dial.`, gameState, 4), "")
    assertTrue(this.lastLogContains(`The backpacking girl is watching our every move with unconcealed curiosity, which makes me a little hesitant to do anything with the locker. I think our best bet is to show her something that really weirds her out.`, gameState, 3), "")
    assertTrue(this.lastLogContains(`Something makes you think of making your lock.`, gameState), "")
    gameEngine.performActionLike("Remember making your lock", gameState)
    assertTrue(this.lastLogContains(`You smiled — a give-away smile. "Wish I could, but we're on a deadline. Go put some pants on. And bring me the razor."`, gameState, 2), "")
    assertTrue(this.lastLogContains(`Then we're back in the present.`, gameState), "")
    assertTrue(!gameEngine.hasActionLike("Remember making your lock", gameState), "")
    assertTrue(gameEngine.hasActionLike("arm", gameState), "")
    assertTrue(gameEngine.hasActionLike("ear", gameState), "")
    assertTrue(gameEngine.hasActionLike("heel", gameState), "")
    gameEngine.performActionLike("Tell her we do", gameState)
    gameEngine.performActionLike("Look at heavy pack", gameState)
    assertTrue(this.lastLogContains(`Overtly searching her possessions`, gameState, 2), "")
    gameEngine.performActionLike("Ask whether she is from Canada", gameState)
    gameEngine.performActionLike("Tell her we agree", gameState)
    assertTrue(this.lastLogContains(`Which I guess is true for me; your memories appear to be a little more diverse.`, gameState), "")
    gameEngine.performActionLike("Go north", gameState)
    gameEngine.performActionLike("Ask how to unlock the lockers", gameState)
    assertTrue(this.lastLogContains(`Her expression of dreamy good will hardens into one of cool contempt`, gameState), "")
    gameEngine.performActionLike("Ask what if a guest", gameState)
    gameEngine.performActionLike("Ask what the All-Purpose is", gameState)
    gameEngine.performActionLike("Ask how the All-Purpose makes blocks", gameState)
    gameEngine.performActionLike("Ask whether the gel resembles ours", gameState)
    assertTrue(this.lastLogContains(`We just smile and shrug pleasantly.`, gameState), "")
    gameEngine.performActionLike("Ask why they do not use a locksmith", gameState)
    gameEngine.performActionLike("Ask what we should do about the lock", gameState)
    assertTrue(this.lastLogContains(`"Remember the combination," she says tartly. Right, then.`, gameState), "")
    gameEngine.performActionLike("Go south", gameState)
    assertTrue(this.lastLogContains(`The locker you identify as your own sits near one of the beds, still locked with its dial lock.`, gameState), "")
    assertTrue(this.lastLogContains(`"Hey," says the girl.`, gameState), "")
    gameEngine.performActionLike("Show her the arm", gameState)
    assertTrue(this.lastLogContains(`"Check this out," we say, holding out the arm for inspection.\n\nThe backpacking girl gags. After a moment to regain her composure, she flees the vicinity.`, gameState), "")
    gameEngine.performActionLike("Look at [lock]", gameState)
    gameEngine.performActionLike("Use restoration gel", gameState)
    gameEngine.performActionLike("Rub gel on [lock]", gameState)
    assertTrue(this.lastLogContains(`We dip out a pea-sized quantity of gel and rub it gently onto the lock. With an audible SPLORT, the lock becomes a clock and falls to the ground. It appears to be one of those archetypal alarm clocks that crows at sunrise and generally makes a nuisance of itself.`, gameState), "")
    gameEngine.performActionLike("Take clock", gameState)
    assertTrue(gameState.inventory.hasNounNamed("clock"), "has clock")
    gameEngine.performActionLike("Open locker", gameState)
    assertTrue(this.lastLogContains(`Now that the lock has been removed, the locker swings open easily, revealing a roll of bills, a letter, some plans, and a note from developer.\n\nWe've accomplished our goal of retrieving your remaining possessions from your locker at the hostel.`, gameState), "")
    gameEngine.performActionLike("Look at dorm beds", gameState)
    gameEngine.performActionLike("Look at hard wood floors", gameState)
    gameEngine.performActionLike("Look at letter", gameState)
    gameEngine.performActionLike("Look at plans", gameState)
    gameEngine.performActionLike("Look at roll of bills", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    assertTrue(this.lastLogContains(`Then we're back in the present.`, gameState), "")
    gameEngine.performActionLike("Remember how it started with Brock", gameState)
    assertTrue(this.lastLogContains(`I get the idea. You don't need to show me more.`, gameState), "")
    assertTrue(!this.lastLogContains(`Then we're back in the present.`, gameState), "")
    gameEngine.performActionLike("Look at note from developer", gameState)
    assertTrue(this.lastLogContains(`Hello!\n\nMy apologies for breaking the 4th wall.\n\nThanks for playing this demo of Counterfeit Monkey! You have now solved all of the puzzles included in this demo. Well done! 🎉🎉🎉`, gameState), "")
  }

  test_MAGameEngine_saveAndLoad() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)


    MATestUtils.goFromStartToEnd(gameEngine, gameState)

    assertTrue(this.lastLogContains(`Hello!\n\nMy apologies for breaking the 4th wall.\n\nThanks for playing this demo of Counterfeit Monkey! You have now solved all of the puzzles included in this demo. Well done! 🎉🎉🎉`, gameState), "")


    // Create a new game from what's stored
    let gameState2 = new MAGameState()
    let gameEngine2 = new MAGameEngine()

    gameEngine2.setupNewGame(gameState2, gameState.serializedActions)
    assertEqualArrays(gameState.serializedActions, gameState2.serializedActions)
    assertEqualArrays(gameState.log.logs, gameState2.log.logs)
    assertEqualStrings(gameState2.currentLocation.name, "🛏🔒 Dormitory Room")

    // Save & restore with JSON serialization in the middle
    let gameState3 = new MAGameState()
    let gameEngine3 = new MAGameEngine()

    let jsonSerializedActions = JSON.stringify(gameState.serializedActions)
    let jsonDeserializedActions = JSON.parse(jsonSerializedActions)
    gameEngine3.setupNewGame(gameState3, jsonDeserializedActions)
    assertEqualArrays(gameState.serializedActions, gameState3.serializedActions)
    assertEqualArrays(gameState.log.logs, gameState3.log.logs)
    assertEqualStrings(gameState3.currentLocation.name, "🛏🔒 Dormitory Room")
    gameEngine3.performActionLike("Go north", gameState3)
    assertEqualStrings(gameState3.currentLocation.name, "👩‍💻📖 Hostel")
  }

  test_MAGameEngine_several_saveAndLoad() {
    let gameState = new MAGameState()
    let gameEngine = new MAGameEngine()
    gameEngine.setupNewGame(gameState)
    MATestUtils.setupTestHooks(gameEngine, gameState)

    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Yes\"", gameState)
    gameEngine.performActionLike("Say \"Andra\"", gameState)
    gameEngine.performActionLike("Say \"Ok\"", gameState)
    gameEngine.performActionLike("Go north", gameState)
    assertEqualStrings(gameState.currentLocation.name, "🏬🏬 Sigil Street")


    // Save & restore with JSON serialization in the middle
    let gameState2 = new MAGameState()
    let gameEngine2 = new MAGameEngine()

    let jsonSerializedActions = JSON.stringify(gameState.serializedActions)
    let jsonDeserializedActions = JSON.parse(jsonSerializedActions)
    gameEngine2.setupNewGame(gameState2, jsonDeserializedActions)
    assertEqualArrays(gameState.serializedActions, gameState2.serializedActions)
    assertEqualArrays(gameState.log.logs, gameState2.log.logs)
    assertEqualStrings(gameState2.currentLocation.name, "🏬🏬 Sigil Street")

    MATestUtils.setupTestHooks(gameEngine2, gameState2)
    gameEngine2.performActionLike("Go east", gameState2)
    gameEngine2.performActionLike("Look at inventory", gameState2)
    gameEngine2.performActionLike("Look at letter-remover", gameState2)
    assertTrue(gameEngine2.hasActionLike("Use letter-remover", gameState2), "can use letter-remover")


    // Save & restore with JSON serialization in the middle
    let gameState3 = new MAGameState()
    let gameEngine3 = new MAGameEngine()

    let jsonSerializedActions2 = JSON.stringify(gameState2.serializedActions)
    let jsonDeserializedActions2 = JSON.parse(jsonSerializedActions2)
    gameEngine3.setupNewGame(gameState3, jsonDeserializedActions2)
    assertEqualArrays(gameState2.serializedActions, gameState3.serializedActions)
    assertEqualArrays(gameState2.log.logs, gameState3.log.logs)
  }



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
