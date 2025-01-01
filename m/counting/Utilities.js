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

  shuffleArrayInPlace: function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
      [array[i], array[j]] = [array[j], array[i]];   // Swap elements
    }
    return array;
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
    MAUtils.throwError(str)
  },

  // Treat an array like an ordered set
  addToOrderedSet: function(arr, item) {
    if (!arr.includes(item)) {
      arr.push(item);
    }
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

  eventIsForLink(e) {
    return e.target.tagName === "A"
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

  // From https://stackoverflow.com/questions/6735470/get-pixel-color-from-canvas-on-mousemove
  // r, g, b range 0-255
  rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255) {
      throw "Invalid color component"
    }
    let str = "000000" + ((r << 16) | (g << 8) | b).toString(16)
    str = str.slice(-6)
    return "#" + str.toUpperCase()
  },

  // r, g, b range 0-255; a range 0-1
  rgbaToHex(r, g, b, a) {
    let rgbHex = MAUtils.rgbToHex(r, g, b)
    const alphaHex = a >= 1 ? "" : Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase()
    return rgbHex + alphaHex
  },
}
Object.freeze(MAUtils)

