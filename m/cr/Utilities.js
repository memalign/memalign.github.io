
const MAUtils = {
  uuidv4: function() {
    // From https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  // Returns a random int less than upperBound
  randomInt: function(upperBound) {
    return Math.floor(Math.random() * Math.floor(upperBound))
  },

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

}
Object.freeze(MAUtils)
