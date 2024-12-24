const MADebugMode = {
  Disabled: 0,
  Alert: 1,
  Assert: 2,
};

// Measure code coverage of unit tests by sprinkling probes
const MA_PROBE_NEXT = 172 // Next unused probe value. `grep pLog . -r | sort -t '(' -k2,2n`
class MAProbeLog {
  constructor() {
    this.probeLog = new Set()
  }

  log(probeNumber) {
    this.probeLog.add(probeNumber)
  }

  missingProbes() {
    const result = []
    for (let i = 0; i < MA_PROBE_NEXT; ++i) {
      if (!this.probeLog.has(i)) {
        result.push(i)
      }
    }

    return result
  }

  summaryString() {
    const missing = this.missingProbes()
    const perc = Math.floor((this.probeLog.size / MA_PROBE_NEXT) * 1000) / 10

    const missingStr = missing.length > 0 ? `Missing: ${missing.join(',')}.` : "Perfect!"
    return `Probe coverage: saw ${this.probeLog.size} / ${MA_PROBE_NEXT} (${perc}%) probes. ${missingStr}`
  }
}

const pLog = new MAProbeLog()


class SSSTMockLocalStorage {
  constructor() {
    this.dict = {}
  }

  getItem(k) {
    if (this.dict[k]) {
      return this.dict[k]
    }

    return null
  }

  setItem(k, v) {
    this.dict[k] = v
  }
}


const MAUtils = {
  uuidv4: function() {
    // From https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  symmetricDifference: function(arr1, arr2) {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    // Find elements in arr1 that are not in arr2
    const diff1 = arr1.filter(item => !set2.has(item));

    // Find elements in arr2 that are not in arr1
    const diff2 = arr2.filter(item => !set1.has(item));

    // Combine the differences
    return [...diff1, ...diff2];
  },

  isEqualDeep: function(objA, objB, inequalityHandler /* optional */, keyName /* optional */) {

    const MAX_DEPTH = 30 // avoid infinite loop due to circular references

    if (!keyName) {
      keyName = "toplevel"
    }

    if (keyName.split(".").length > MAX_DEPTH) {
      //console.log("keyname: " + keyName)
      //inequalityHandler("Recursed too deep: " + keyName)
      //return false
      return true
    }

    if (objA === objB) return true; // Same reference or both null or same primitive value
    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
      inequalityHandler(`[${keyName}] basic equality ${objA} ; ${objB}`)
      return false;
    }
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) {
      const differentKeys = MAUtils.symmetricDifference(keysA, keysB)
      inequalityHandler(`[${keyName}] keys length equality objA ${keysA.length} keys ; objB ${keysB.length} keys ; differing keys: ${differentKeys.join(',')}`)
      return false;
    }

    for (let key of keysA) {
      if (!keysB.includes(key)) {
        inequalityHandler(`[${keyName}] extra key: ` + key)
        return false;
      }

      if (!MAUtils.isEqualDeep(objA[key], objB[key], inequalityHandler, keyName+"."+key)) {
        return false; // Recursive comparison for nested objects
      }
    }
    return true;
  },

  // Returns a sanitized id string
  sanitizedElementID: function(str) {
    const buttonTitleSanitized = str.replace(/[^a-zA-Z0-9]/g, "_")
    return buttonTitleSanitized
  },

  logStackTrace: function() {
    const stackTrace = (new Error()).stack
    console.log("Log stack trace: " + stackTrace)
    return stackTrace
  },

  throwError: function(str) {
    throw "Throw error: " + str + "\n" + (new Error()).stack
  },

  handleFatalError: function(str) {
    const stackTrace = MAUtils.logStackTrace()
    if (debugMode === MADebugMode.Alert) {
      SSSTAlertViewController.presentAlertWithDismiss("DEBUG: " + str + stackTrace)
    } else if (debugMode === MADebugMode.Assert) {
      MAUtils.throwError(str)
    }
  },

  ensureInteger: function(n) {
    if (!Number.isInteger(n)) {
      MAUtils.handleFatalError("ensureInteger failed")
      return false
    }
    return true
  },

  ensureNumber: function(n) {
    if (isNaN(n)) {
      MAUtils.handleFatalError("ensureNumber failed")
      return false
    }
    return true
  },

  ensureType: function(b, typeStr) {
    if (b === null || (typeof b) !== typeStr) {
      MAUtils.handleFatalError(`ensureType ${typeStr} failed. Got this instead: ${b}`)
      return false
    }
    return true
  },

  ensureBool: function(b) {
    return MAUtils.ensureType(b, `boolean`)
  },

  ensureArrayOrNull: function(a, elementType) {
    if (a === null) {
      return true
    }

    let valid = Array.isArray(a)
    if (valid) {
      for (let e of a) {
        if (typeof e !== elementType) {
          valid = false
          break
        }
      }
    }

    if (!valid) {
      MAUtils.handleFatalError("ensureArrayOrNull failed")
      return false
    }

    return true
  },

  ensureMapOrNull: function(a) {
    if (a === null) {
      return true
    }

    if (typeof (a.set) === "function" && typeof (a.get) === "function") {
      return true
    }

    MAUtils.handleFatalError("ensureMapOrNull failed")
    return false
  },

  ensureObjectOrNull: function(o) {
    if (o === null) {
      return true
    }
    return MAUtils.ensureType(o, "object")
  },

  // Treat an array like an ordered set
  addToOrderedSet: function(arr, item) {
    if (!arr.includes(item)) {
      arr.push(item);
    }
  },

  // Commented out because I need to use GameRand to have deterministic behavior
  // Returns a random int less than upperBound
  //randomInt: function(upperBound) {
  //  return Math.floor(Math.random() * Math.floor(upperBound))
  //},

  // https://easings.net/#easeInOutCubic
  // proportionOfTimeElapsed ranges from 0 to 1
  easeInOutCubic: function(proportionOfTimeElapsed) {
    let x = proportionOfTimeElapsed
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
  },

  // https://easings.net/#easeInQuad
  easeInQuad: function(proportionOfTimeElapsed) {
    let x = proportionOfTimeElapsed
    return x * x
  },

  // https://easings.net/#easeOutQuad
  easeOutQuad: function(proportionOfTimeElapsed) {
    let x = proportionOfTimeElapsed
    return 1 - (1 - x) * (1 - x)
  },

  // https://easings.net/#easeInOutQuad
  easeInOutQuad: function(proportionOfTimeElapsed) {
    let x = proportionOfTimeElapsed
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
    //return x < 0.655 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 4
  },

  // https://easings.net/#easeInOutSine
  easeInOutSine: function(proportionOfTimeElapsed) {
    let x = proportionOfTimeElapsed
    return -(Math.cos(Math.PI * x) - 1) / 2;
  },


  // Color utilities

  // Convert RGBA to HexA
  RGBAToHexA: function (r, g, b, a) {
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);
    a = Math.round(a * 255).toString(16);

    if (r.length == 1) r = '0' + r;
    if (g.length == 1) g = '0' + g;
    if (b.length == 1) b = '0' + b;
    if (a.length == 1) a = '0' + a;

    if (a == 'ff') {
      return '#' + r + g + b;
    } else {
      return '#' + r + g + b + a;
    }
  },

  // Convert HexA to RGBA
  hexAToRGBA: function (h) {
    if (h.length == 7) h += 'ff';
    else if (h.length == 4) h += h.substring(1, 4) + 'ff';

    let r = 0,
      g = 0,
      b = 0,
      a = 1;

    if (h.length == 5) {
      r = '0x' + h[1] + h[1];
      g = '0x' + h[2] + h[2];
      b = '0x' + h[3] + h[3];
      a = '0x' + h[4] + h[4];
    } else if (h.length == 9) {
      r = '0x' + h[1] + h[2];
      g = '0x' + h[3] + h[4];
      b = '0x' + h[5] + h[6];
      a = '0x' + h[7] + h[8];
    }

    r = parseInt(r, 16)
    g = parseInt(g, 16)
    b = parseInt(b, 16)
    a = +(a / 255).toFixed(3);

    return {
      r: r,
      g: g,
      b: b,
      a: a
    };
  },

  hexColorWithMaxAlpha: function(hex, maxAlpha) {
    let rgba = this.hexAToRGBA(hex)
    rgba.a = Math.min(rgba.a, maxAlpha)
    return this.RGBAToHexA(rgba.r, rgba.g, rgba.b, rgba.a)
  },


  // Base64
  isValidBase64(str) {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    return base64Regex.test(str)
  },

  removeBase64Padding(base64Str) {
    return base64Str.replace(/={1,2}$/, '')
  },

  addBase64Padding(base64Str) {
    const missingPadding = (4 - (base64Str.length % 4)) % 4
    return base64Str + '='.repeat(missingPadding)
  },


  // Simple symmetric string obfuscation inspired by rot13
  obfuscateString(str) {
    // Length = 26 + 26 + 1 (space) + 1 (comma) + 10 (digits) = 64
    //
    // Doing something special for CaveRibbon to make my URI encoding more efficient:
    // Map " " and comma (characters which need to be %-encoded) to uncommon letters
    // " " is mapped to Q
    // "," is mapped to Y
    let substitution = "aQYNbcCd0efBghAi1jIWX89Zk2lDmOH7nToE3pUV4qFr5sGtu6JKLvwSRxyzM, P"

    return str.split('').map(letter => {
      let index = substitution.indexOf(letter)

      if (index < 0) {
        return letter
      }

      let newIndex = substitution.length - 1 - index
      return substitution.charAt(newIndex)
    }).join('')
  },

  isScoreEligibleForObfuscation(score) {
    return (score >= 700) && (score <= 1200)
  },

  obfuscateScore(score) {
    // Prepend 0 to make it four characters long if necessary
    let result = String(score).padStart(4, '0')

    // Move the last character to the front
    const lastChar = result.slice(-1)
    result = lastChar + result.slice(0, -1)

    const substitutionMap = {
        '0': '8',
        '1': '1',
        '2': 'I',
        '3': 'a',
        '4': '4',
        '5': 'l',
        '6': 'd',
        '7': '9',
        '8': 'O',
        '9': '0',
    }

    result = result.split('').map(c => substitutionMap[c] || c).join('')

    return result
  },

  eventIsForRegularUserInput(e) {
    // Ignore DIVs because Safari tries to go into text selection mode when
    // repeatedly tapping on them which makes game input unreliable.
    return e.target.id.endsWith("_input") || e.target.tagName === "A" || e.target.tagName === "DIV"
  },

  createElement(type, attributes, parent) {
    const element = document.createElement(type)
    for (const key in attributes) {
      element[key] = attributes[key]
    }
    if (parent) {
      parent.appendChild(element)
    }
    return element
  },

  createBaysCreditsElement(game) {
    const container = document.createElement('div')
    container.classList.add('bays-credits')

		const totalBays = game.commander.ship.totalCargoBays()
		const freeBays = game.commander.ship.freeCargoBays()
    const baysSpan = document.createElement('span')
    baysSpan.textContent = `Bays: ${totalBays - freeBays}/${totalBays}`
		container.appendChild(baysSpan);

    let creditsSpan = document.createElement('span')
    creditsSpan.textContent = `$${game.commander.getCredits()}`
		container.appendChild(creditsSpan);

    return container
  },

  installCheats(div, sTG) {
    div.innerHTML = ''

    const moneyButton = document.createElement('button');
    moneyButton.innerText = "Free Money"
    moneyButton.id = "cheat_freeMoney"

    actionLog.registerButtonEventListener(moneyButton, 'click', () => {
        if (!sTG) { return }
        if (!sTG.viewController) { return }
        if (!sTG.viewController._game) { return }
        if (!sTG.viewController._game.commander) { return }

        const commander = sTG.viewController._game.commander
        commander.credits = 1000000
    });

    div.appendChild(moneyButton);


    const singularityButton = document.createElement('button');
    singularityButton.innerText = "Free Singularity"
    singularityButton.id = "cheat_freeSingularity"

    actionLog.registerButtonEventListener(singularityButton, 'click', () => {
        sTG.viewController._game.canSuperWarp = true
    });

    div.appendChild(singularityButton);


    const specialButton = document.createElement('button');
    specialButton.innerText = "Show Special"
    specialButton.id = "cheat_showSpecial"

    actionLog.registerButtonEventListener(specialButton, 'click', () => {
        sTG.viewController._game.showSpecialSystems = true
    });

    div.appendChild(specialButton);


    {
      const b = document.createElement('button');
      b.innerText = "Average reputationScore"
      b.id = "cheat_averageReputation"

      actionLog.registerButtonEventListener(b, 'click', () => {
          sTG.viewController._game.commander.reputationScore = SSSTReputationScore.Average
      });

      div.appendChild(b);
    }

    {
      const b = document.createElement('button');
      b.innerText = "Fighter 15"
      b.id = "cheat_fighter15"

      actionLog.registerButtonEventListener(b, 'click', () => {
          sTG.viewController._game.commander.fighter = 15
      });

      div.appendChild(b);
    }



    const rareEvents = [
      "Marie Celeste",
      "Captain Ahab",
      "Captain Conrad",
      "Captain Huie",
      "Old Bottle",
      "Good Bottle",
    ]

    for (let rareEvent = 0; rareEvent < SSSTRareEvent.Count; rareEvent++) {
      const eventButton = document.createElement('button');
      eventButton.innerText = "Encounter " + rareEvents[rareEvent]
      eventButton.id = "cheat_" + MAUtils.sanitizedElementID(eventButton.innerText)

      actionLog.registerButtonEventListener(eventButton, 'click', () => {
        sTG.viewController._game.forceRareEvent = true
        // Note: this overwrites pending rare events
        sTG.viewController._game._remainingRareEvents = [ rareEvent ]
      });

      div.appendChild(eventButton);
    }
  },

  prettyTimeStringForTimestamp(timestamp, now) {
    if (!timestamp || !now) {
      return null
    }

    const delta = (now - timestamp) / 1000 // in seconds

    let result = null

    if (delta < 1) {
      result = 'now'
    } else if (delta < 60) {
      result = `${Math.floor(delta)}s`
    } else if (delta < 60 * 60) {
      const numMinutes = Math.min(Math.floor(delta / 60), 59)
      result = `${numMinutes}m`
    } else if (delta < 24 * 60 * 60) {
      const numHours = Math.min(Math.floor(delta / (60 * 60)), 23)
      result = `${numHours}h`
    } else if (delta < 7 * 24 * 60 * 60) {
      const numDays = Math.min(Math.floor(delta / (24 * 60 * 60)), 6)
      result = `${numDays}d`
    } else {
      let localDate = new Date()
      const dateObject = new Date(timestamp - (localDate.getTimezoneOffset() * 60 * 1000))
      const month = dateObject.getMonth() + 1
      const day = dateObject.getDate()
      const year = dateObject.getFullYear() % 100
      result = `${month}/${day}/${year}`
    }

    return result
  },

  prettyTimeAgoStringForTimestamp(timestamp, now) {
    let str = MAUtils.prettyTimeStringForTimestamp(timestamp, now)

    if (!str) {
      // do nothing
    } else if (str == "now") {
        str = "just now"
    } else if (!str.includes("/")) {
        str += " ago"
    }

    return str
  },

  maintainScrollPosition(block) {
    const scrollX = window.scrollX
    const scrollY = window.scrollY
    ma_maintainScrollPositionLevel++

    block()

    ma_maintainScrollPositionLevel--

    if (ma_maintainScrollPositionLevel === 0) {
      console.log(`Restoring scroll position ${scrollX} ${scrollY}`)
      // Worked most of the time without setTimeout but failed a small
      // percent of the time. Adding an async retry allows layout to settle.
      window.scrollTo(scrollX, scrollY)
      setTimeout(() => {
        window.scrollTo(scrollX, scrollY)
      }, 0)
    }
  },
}
Object.freeze(MAUtils)

let ma_maintainScrollPositionLevel = 0
