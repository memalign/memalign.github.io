function uuidv4() {
  // From https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


const MAUtils = {
  // Returns a random int less than upperBound
  randomInt: function(upperBound) {
    return Math.floor(Math.random() * Math.floor(upperBound))
  },

  randomElement(arr) {
    let i = MAUtils.randomInt(arr.length)
    return arr[i]
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


  // From https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
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
