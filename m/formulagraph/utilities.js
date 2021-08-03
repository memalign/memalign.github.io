const MAUtils = {

  logBacktrace: function() {
    console.log("Logging backtrace:\n" + (new Error()).stack)
  },

  floorMod: function(a, b) {
    return a - b * Math.floor(a/b)
  },

  maxRenderLength: 50000,

  _convertFormulaToExpression: function(rawFormula) {
    if (rawFormula.includes(">=") ||
      rawFormula.includes(">")) {

      let tokens = rawFormula.split(/>=?/)
      rawFormula = `ltz(plus(${tokens[1]}, neg(${tokens[0]})))`

    } else if (rawFormula.includes("<=") ||
      rawFormula.includes("<")) {

      let tokens = rawFormula.split(/<=?/)
      rawFormula = `ltz(plus(${tokens[0]}, neg(${tokens[1]})))`

    } else if (rawFormula.includes("=")) {
      let tokens = rawFormula.split("=")
      rawFormula = `plus(${tokens[0]}, neg(${tokens[1]}))`

    } else if (rawFormula.length > 0) {
      rawFormula = `plus(${rawFormula}, neg(y))`

    } else {
      console.log("Invalid formula: " + rawFormula)
      return null
    }

    return rawFormula
  },

  // Convert a formula like "y = 2*x" to "plus(y, neg(times(2, x)))"
  _convertFormulaToFnSyntax: function(rawFormula) {
    rawFormula = this._convertFormulaToExpression(rawFormula)

    if (!rawFormula) {
      return null
    }

    let stream = new Stream(rawFormula)
    let lexer = new CommentStripper(new Lexer(stream))
    let parser = new Parser(lexer)

    try {
      let builtinSymbolTable = SymbolTable.makeBuiltinSymbolTable()
      let rootNode = parser.parseExpression(builtinSymbolTable)

      //console.log("Parsed formula:\n" + rootNode.print(""))
      //console.log("Fn syntax: " + rootNode.toFnStr())

      let fnStr = rootNode.toFnStr()

      fnStr = fnStr.replace(/\br\b/g, "mathContext.rFn(x,y)")
      fnStr = fnStr.replace(/theta/g, "mathContext.thetaFn(y,x)")

      return fnStr
    } catch (e) {
      if (e instanceof PascalError) {
        console.log(e.getMessage())
      }
      console.log(e.stack)
      throw e
    }
  },

  convertFormulaToJS: function(rawFormula) {
    let fnStr = this._convertFormulaToFnSyntax(rawFormula)

    if (!fnStr) {
      return null
    }

    return `with(MAIntervalMath) {return(${fnStr});}`;
  },

  convertJSToFn: function(formulaJS) {
    return new Function("x,y,t,mathContext", formulaJS)
  },

  formulaFnUsesTheta: function(formulaFn) {
    let fnStr = formulaFn.toString()
    let tokens = fnStr.split("{")
    if (tokens.length >= 3) {
      return tokens[2].includes("thetaFn")
    }
    return false
  },

  formulaFnUsesR: function(formulaFn) {
    let fnStr = formulaFn.toString()
    let tokens = fnStr.split("{")
    if (tokens.length >= 3) {
      return tokens[2].includes("rFn")
    }
    return false
  },

  formulaFnUsesT: function(formulaFn) {
    let fnStr = formulaFn.toString()
    let tokens = fnStr.split("{")
    if (tokens.length >= 3) {
      let result = /\bt\b/.test(tokens[2])
      return result
    }
    return false
  },

  // list: array of MABox and MALineSegment instances
  // p: MAPoint
  // Returns true if p is within any box or line segment
  listVisuallyContainsPoint: function(list, p, resolution) {
    for (let item of list) {
      if (item.visuallyContainsPoint(p, resolution)) {
        return true
      }
    }

    return false
  },

  // Limit the scale of the graph to avoid graphing at precision levels
  // where rendering becomes inaccurate
  sanitize_mRa: function(newMRa) {
    // At smaller mRa values, y=floor(x) shows large glitches
    return Math.max(newMRa, 0.2279)
  },

  performAsync: function(fnToPerform, delayMS) {
    if (!delayMS) {
      delayMS = 0
    }
    setTimeout(fnToPerform, delayMS)
  },
}
Object.freeze(MAUtils)


class MACache {
  // Properties:
  // - xInterval (MAInterval instance; x-axis range for these cached render results)
  // - yInterval (MAInterval instance; y-axis range for these cached render results)
  // - formulaStrToRenderResults (JS object mapping formulaFn.toString() to an array of render results (MABox and MALineSegment instances))
  constructor() {
    this.xInterval = null
    this.yInterval = null
    this.formulaStrToRenderResults = {}
  }

  cachedRenderResults(formulaFn, xInterval, yInterval) {
    if (!formulaFn) {
      return null
    }

    if (!this.xInterval || !this.yInterval) {
      return null
    }

    if (!this.xInterval.isEqual(xInterval) || !this.yInterval.isEqual(yInterval)) {
      return null
    }

    return this.formulaStrToRenderResults[formulaFn.toString()]
  }

  updateCache(formulaFn, renderResults, xInterval, yInterval) {
    if (!formulaFn) {
      return
    }

    let xDiffers = !this.xInterval || !this.xInterval.isEqual(xInterval)
    let yDiffers = !this.yInterval || !this.yInterval.isEqual(yInterval)
    if (xDiffers || yDiffers) {
      // Purge cache
      this.xInterval = xInterval
      this.yInterval = yInterval
      this.formulaStrToRenderResults = {}
    }

    this.formulaStrToRenderResults[formulaFn.toString()] = renderResults
  }
}


// Returns a string in function-syntax (e.g. plus(1, 1))
Node.prototype.toFnStr = function () {
  let s = "";

  switch (this.nodeType) {
    case Node.IDENTIFIER:
    case Node.NUMBER:
    case Node.BOOLEAN:
    case Node.POINTER:
      s += this.token.value;
      break
    case Node.CAST:
      s += this.expression.toFnStr()
      break
    case Node.PROCEDURE_CALL:
    case Node.FUNCTION_CALL:
      s += this.name.print()
      let argumentList = []
      for (let i = 0; i < this.argumentList.length; i++) {
        argumentList.push(this.argumentList[i].toFnStr())
      }
      if (argumentList.length > 0) {
        s += "(" + argumentList.join(", ") + ")"
      } else {
        s += "()"
      }
      break
    case Node.NEGATIVE:
      s += "neg(" + this.expression.toFnStr() + ")"
      break
    case Node.ADDITION:
      s += "plus(" + this.lhs.toFnStr() + ", " + this.rhs.toFnStr() + ")"
      break
    case Node.SUBTRACTION:
      s += "plus(" + this.lhs.toFnStr() + ", neg(" + this.rhs.toFnStr() + "))"
      break
    case Node.MULTIPLICATION:
      s += "times(" + this.lhs.toFnStr() + ", " + this.rhs.toFnStr() + ")"
      break
    case Node.DIVISION:
      s += "times(" + this.lhs.toFnStr() + ", recip(" + this.rhs.toFnStr() + "))"
      break
    case Node.RAISE_TO_POWER:
      s += "pow(" + this.lhs.toFnStr() + ", " + this.rhs.toFnStr() + ")"
      break
    //case Node.AND:
    //  s += this.lhs.print() + " and " + this.rhs.print();
    //  break
    //case Node.OR:
    //  s += this.lhs.print() + " or " + this.rhs.print();
    //  break
    case Node.INTEGER_DIVISION:
      s += "times(" + this.lhs.toFnStr() + ", recip(" + this.rhs.toFnStr() + "))"
      break
    case Node.MOD:
      s += "mod(" + this.lhs.toFnStr() + ", " + this.rhs.toFnStr() + ")"
      break
    default:
      s = `<UNKNOWN nodeType: ${this.nodeType}>`
      break
  }

  return s
}
