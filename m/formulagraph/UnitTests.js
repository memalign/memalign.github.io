
class MALogger {
  constructor() {
    this.logs = []
  }

  log(str) {
    this.logs.push(str)
  }
}

let MALog = new MALogger()

var assertionCount = 0
function assertTrue(condition, str) {
  if (!condition) {
    MALog.log("Failed assertion: " + str)
    throw "Failed assertion: " + str + "\n" + (new Error()).stack
  }
  assertionCount++
}

function assertNull(str1) {
  if (str1 != null) {
    let str = "Failed assertion: \"" + str1 + "\" does not equal null"
    MALog.log(str)
    throw str + "\n" + (new Error()).stack
  }
  assertionCount++
}

function assertEqual(str1, str2) {
  if (str1 != str2) {
    let str = "Failed assertion: \"" + str1 + "\" does not equal \"" + str2 + "\""
    MALog.log(str)
    throw str + "\n" + (new Error()).stack
  }
  assertionCount++
}

function assertEqualFloats(f1, f2) {
  if (!MAFloatMath.floatEquals(f1, f2)) {
    let str = "Failed assertion: \"" + f1 + "\" does not equal \"" + f2 + "\""
    MALog.log(str)
    throw str + "\n" + (new Error()).stack
  }
  assertionCount++
}

function assertListVisuallyContainsPoint(arr, p, resolution, shouldContain) {
  shouldContain = (shouldContain == undefined) ? true : shouldContain

  if (MAUtils.listVisuallyContainsPoint(arr, p, resolution) != shouldContain) {
    let str = `Failed assertion: list ${shouldContain ? "does" : "should"} not contain point (${p.x}, ${p.y})`
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

  test_MAUtils_convertFormulaToFnSyntax() {
    let res = MAUtils._convertFormulaToFnSyntax("1+1")
    assertEqual(res, "plus(plus(1, 1), neg(y))")

    res = MAUtils._convertFormulaToFnSyntax("y=1+1")
    assertEqual(res, "plus(y, neg(plus(1, 1)))")

    res = MAUtils._convertFormulaToFnSyntax("y=1*1")
    assertEqual(res, "plus(y, neg(times(1, 1)))")

    res = MAUtils._convertFormulaToFnSyntax("y=1+1*1")
    assertEqual(res, "plus(y, neg(plus(1, times(1, 1))))")

    res = MAUtils._convertFormulaToFnSyntax("r=theta")
    assertEqual(res, "plus(mathContext.rFn(x,y), neg(mathContext.thetaFn(y,x)))")
  }

  test_MAUtils_convertFormulaToJS() {
    // not a valid formula but the error is detected later
    assertEqual(MAUtils.convertFormulaToJS("y="), "with(MAIntervalMath) {return(plus(y, neg()));}")

    assertEqual(MAUtils.convertFormulaToJS("x > y"), "with(MAIntervalMath) {return(ltz(plus(y, neg(x))));}")
    assertEqual(MAUtils.convertFormulaToJS("x >= y"), "with(MAIntervalMath) {return(ltz(plus(y, neg(x))));}")
    assertEqual(MAUtils.convertFormulaToJS("x < y"), "with(MAIntervalMath) {return(ltz(plus(x, neg(y))));}")
    assertEqual(MAUtils.convertFormulaToJS("x <= y"), "with(MAIntervalMath) {return(ltz(plus(x, neg(y))));}")
    assertEqual(MAUtils.convertFormulaToJS("x = y"), "with(MAIntervalMath) {return(plus(x, neg(y)));}")
    assertEqual(MAUtils.convertFormulaToJS("x = y+2"), "with(MAIntervalMath) {return(plus(x, neg(plus(y, 2))));}")
    assertEqual(MAUtils.convertFormulaToJS("x^y = y+2"), "with(MAIntervalMath) {return(plus(pow(x, y), neg(plus(y, 2))));}")
    assertEqual(MAUtils.convertFormulaToJS("pow(x, y) = plus(y, 2)"), "with(MAIntervalMath) {return(plus(pow(x, y), neg(plus(y, 2))));}")
    assertEqual(MAUtils.convertFormulaToJS("x"), "with(MAIntervalMath) {return(plus(x, neg(y)));}")
    assertEqual(MAUtils.convertFormulaToJS("pow(x, y)"), "with(MAIntervalMath) {return(plus(pow(x, y), neg(y)));}")
    assertEqual(MAUtils.convertFormulaToJS("r = 1"), "with(MAIntervalMath) {return(plus(mathContext.rFn(x,y), neg(1)));}")
    assertEqual(MAUtils.convertFormulaToJS("r = theta"), "with(MAIntervalMath) {return(plus(mathContext.rFn(x,y), neg(mathContext.thetaFn(y,x))));}")
    assertEqual(MAUtils.convertFormulaToJS("r = sqrt(theta)"), "with(MAIntervalMath) {return(plus(mathContext.rFn(x,y), neg(sqrt(mathContext.thetaFn(y,x)))));}")
    assertEqual(MAUtils.convertFormulaToJS("sqrt(r) = sqrt(theta)"), "with(MAIntervalMath) {return(plus(sqrt(mathContext.rFn(x,y)), neg(sqrt(mathContext.thetaFn(y,x)))));}")
    assertNull(MAUtils.convertFormulaToJS(""))
  }

  test_MAUtils_convertFormulaToJS_parserProducesEquivalentFn() {
    let str1 = "plus(pow(x,2), pow(y,2)) = 1"
    let str2 = "x^2 + y^2 = 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "pow(y,y) = pow(x,x)"
    str2 = "y^y = x^x"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(x,x)"
    str2 = "y = x^x"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(x,3)"
    str2 = "y = x^3"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = times(times(x,x), x)"
    str2 = "y = x*x*x"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(x,3.1)"
    str2 = "y = x^3.1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(x,2)"
    str2 = "y = x^2"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = times(x,x)"
    str2 = "y = x*x"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(x,2.1)"
    str2 = "y = x^2.1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "pow(x,y)=pow(x,pow(x,pow(x,pow(x,pow(x,x)))))"
    str2 = "x^y = x^(x^(x^(x^(x^x))))"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "pow(x,y)=pow(pow(pow(pow(pow(x,x), x), x), x), x)"
    str2 = "x^y = x^x^x^x^x^x"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(x,2), pow(y,2)) = 1"
    str2 = "x^2 + y^2 = 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(times(x,x), times(y,y)) = 1"
    str2 = "x*x + y*y = 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(x,2), pow(y,2)) < 1"
    str2 = "x^2 + y^2 < 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(x,2), pow(y,2)) <= 1"
    str2 = "x^2 + y^2 <= 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(x,2), pow(y,2)) > 1"
    str2 = "x^2 + y^2 > 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(x,2), pow(y,2)) >= 1"
    str2 = "x^2 + y^2 >= 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(x,4), pow(y,4)) = 1"
    str2 = "x^4 + y^4 = 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(x,2)"
    str2 = "y = x^2"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = mod(x,2)"
    str2 = "y = x % 2"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = times(x,x)"
    str2 = "y = x*x"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "x = pow(y,2)"
    str2 = "x = y^2"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "x = times(y,y)"
    str2 = "x = y*y"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = plus(times(2,x),1)"
    str2 = "y = 2*x+1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y > pow(x,2)"
    str2 = "y > x^2"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y < pow(x,2)"
    str2 = "y < x^2"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = plus(times(2,x),1)"
    str2 = "y = 2*x+1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y <= plus(times(2,x),1)"
    str2 = "y <= 2*x+1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = neg(x)"
    str2 = "y = -x"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = sin(plus(x, pi/2))"
    str2 = "y = sin(x+pi/2)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(x, -1)"
    str2 = "y = x^-1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(x, -1)"
    str2 = "y = x^(-1)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "pow(x,y) = pow(y,x)"
    str2 = "x^y = y^x"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r = neg(theta)"
    str2 = "r = -theta"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r = times(4, cos(times(4, theta)))"
    str2 = "r = 4*cos(4*theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r = times(4, cos(times(3, theta)))"
    str2 = "r = 4*cos(3*theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r = times(4, sin(times(2, theta)))"
    str2 = "r = 4*sin(2*theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r = times(4, sin(times(5, theta)))"
    str2 = "r = 4*sin(5*theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "pow(r,2) = sin(times(2, theta))"
    str2 = "r^2 = sin(2*theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "pow(r,2) = cos(times(2, theta))"
    str2 = "r^2 = cos(2*theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r=plus(1, neg(times(cos(theta), sin(times(3,theta)))))"
    str2 = "r = 1-cos(theta)*sin(3*theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r=times(4, recip(plus(sin(theta), neg(cos(theta)))))"
    str2 = "r = 4/(sin(theta)-cos(theta))"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r=times(1, recip(plus(1,cos(theta))))"
    str2 = "r = 1/(1+cos(theta))"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r = plus(1, times(3, sin(theta)))"
    str2 = "r = 1 + 3*sin(theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r = plus(1, sin(theta))"
    str2 = "r = 1+sin(theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "r = plus(1, times(-1, sin(theta)))"
    str2 = "r = 1 + -1*sin(theta)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(times(times(x, times(y, times(plus(x, neg(y)),plus(x,y)))), plus(plus(pow(x,2),pow(y,2)), neg(4))), 2), neg(1)) < 1"
    str2 = "((x * (y * ((x-y)*(x+y)))) * ((x^2+y^2) - 4))^2 - 1 < 1"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(x,3),pow(y,3)) = times(3,times(x,y))"
    str2 = "x^3+y^3 = 3*(x*y)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "plus(pow(x,t),pow(y,t)) = times(t,times(x,y))"
    str2 = "x^t+y^t = t*(x*y)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    // This behavior matches Excel and MATLAB but not WolframAlpha
    str1 = "y = pow(pow(2,3),4)"
    str2 = "y = 2^3^4"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(2,pow(3, 4))"
    str2 = "y = 2^(3^4)"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = times(2,pow(x,3))"
    str2 = "y = 2*x^3"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    str1 = "y = pow(times(2,x),3)"
    str2 = "y = (2*x)^3"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))

    // This behavior matches Excel but not WolframAlpha and Google
    str1 = "y = pow(neg(3),2)"
    str2 = "y = -3^2"
    assertEqual(MAUtils.convertFormulaToJS(str1), MAUtils.convertFormulaToJS(str2))
  }

  test_MAUtils_formulaFnUsesR() {
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x > y"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x >= y"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x < y"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x <= y"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x = y"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x = y+2"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = y+2"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("pow(x, y) = plus(y, 2)"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("pow(x, y)"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("sqrt(x) = 1"))), false)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = 1"))), true)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = theta"))), true)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = sqrt(theta)"))), true)
    assertEqual(MAUtils.formulaFnUsesR(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("sqrt(r) = sqrt(theta)"))), true)
  }

  test_MAUtils_formulaFnUsesTheta() {
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x > y"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x >= y"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x < y"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x <= y"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x = y"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x = y+2"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = y+2"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("pow(x, y) = plus(y, 2)"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("pow(x, y)"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("sqrt(x) = 1"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = 1"))), false)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = theta"))), true)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = sqrt(theta)"))), true)
    assertEqual(MAUtils.formulaFnUsesTheta(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("sqrt(r) = sqrt(theta)"))), true)
  }

  test_MAUtils_formulaFnUsesT() {
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x > y"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x >= y"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x < y"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x <= y"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x = y"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x = y+2"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = y+2"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("pow(x, y) = plus(y, 2)"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("pow(x, y) = plus(y, t)"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = y+t"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = y*t"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = y-t"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = y-(t)"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = y - t"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^y = t - y"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x^t = 1 - y"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("x"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("pow(x, y)"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("sqrt(x) = 1"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = 1"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("t = 1"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = theta"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = sqrt(theta)"))), false)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("r = sqrt(theta^t)"))), true)
    assertEqual(MAUtils.formulaFnUsesT(MAUtils.convertJSToFn(MAUtils.convertFormulaToJS("sqrt(r) = sqrt(theta)"))), false)
  }

  test_MAUtils_listVisuallyContainsPoint() {
    let box = new MABox(new MAPoint(0, 0), new MAPoint(3, 3))

    let line = new MALineSegment(new MAPoint(1, 2), new MAPoint(1, 4))

    let res = 0.03

    assertEqual(line.visuallyContainsPoint(new MAPoint(1, 2), res), true)

    assertEqual(MAUtils.listVisuallyContainsPoint([box, line], new MAPoint(0, 0), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([box, line], new MAPoint(1, 2), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([box, line], new MAPoint(3, 3), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([box, line], new MAPoint(1, 4), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([box, line], new MAPoint(5, 5), res), false)

    assertEqual(MAUtils.listVisuallyContainsPoint([line, box], new MAPoint(0, 0), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([line, box], new MAPoint(1, 2), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([line, box], new MAPoint(3, 3), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([line, box], new MAPoint(1, 4), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([line, box], new MAPoint(5, 5), res), false)

    assertEqual(MAUtils.listVisuallyContainsPoint([line], new MAPoint(0, 0), res), false)
    assertEqual(MAUtils.listVisuallyContainsPoint([line], new MAPoint(1, 2), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([line], new MAPoint(3, 3), res), false)
    assertEqual(MAUtils.listVisuallyContainsPoint([line], new MAPoint(1, 4), res), true)
    assertEqual(MAUtils.listVisuallyContainsPoint([line], new MAPoint(5, 5), res), false)
  }

// MACache

  test_MACache_empty() {
    let c = new MACache()

    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,2), pow(y,2)) = 1"))

    assertEqual(c.cachedRenderResults(formulaFn, null, null), null)

    let xInterval = new MAInterval(1, 2)
    let yInterval = new MAInterval(1, 2)
    assertEqual(c.cachedRenderResults(formulaFn, xInterval, yInterval), null)
    assertEqual(c.cachedRenderResults(null, xInterval, yInterval), null)
  }

  test_MACache_twoFormulas() {
    let c = new MACache()

    let formulaFn1 = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,2), pow(y,2)) = 1"))
    let formulaFn2 = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,3), 2) = 1"))

    let xInterval = new MAInterval(1, 2)
    let yInterval = new MAInterval(1, 2)
    assertEqual(c.cachedRenderResults(formulaFn1, xInterval, yInterval), null)
    assertEqual(c.cachedRenderResults(formulaFn2, xInterval, yInterval), null)

    let res1 = ["a", "b"]
    let res2 = ["c", "d"]
    c.updateCache(formulaFn1, res1, xInterval, yInterval)

    assertEqualArrays(c.cachedRenderResults(formulaFn1, xInterval, yInterval), res1)
    assertEqual(c.cachedRenderResults(formulaFn2, xInterval, yInterval), null)

    c.updateCache(formulaFn2, res2, xInterval, yInterval)

    assertEqualArrays(c.cachedRenderResults(formulaFn1, xInterval, yInterval), res1)
    assertEqualArrays(c.cachedRenderResults(formulaFn2, xInterval, yInterval), res2)

    let xDifferent = new MAInterval(3, 4)

    assertEqual(c.cachedRenderResults(formulaFn1, xDifferent, yInterval), null)
    assertEqual(c.cachedRenderResults(formulaFn1, xInterval, xDifferent), null)
    assertEqual(c.cachedRenderResults(formulaFn2, xDifferent, yInterval), null)
    assertEqual(c.cachedRenderResults(formulaFn2, xInterval, xDifferent), null)

    assertEqualArrays(c.cachedRenderResults(formulaFn1, xInterval, yInterval), res1)
    assertEqualArrays(c.cachedRenderResults(formulaFn2, xInterval, yInterval), res2)


    let res3 = ["e", "f"]
    c.updateCache(formulaFn1, res3, xDifferent, yInterval)

    // Original result got purged
    assertEqual(c.cachedRenderResults(formulaFn1, xInterval, yInterval), null)
    assertEqual(c.cachedRenderResults(formulaFn2, xInterval, yInterval), null)

    // Correct result for new interval
    assertEqualArrays(c.cachedRenderResults(formulaFn1, xDifferent, yInterval), res3)
    assertEqual(c.cachedRenderResults(formulaFn2, xDifferent, yInterval), null)
  }

// MAIntervalMath

  test_MAIntervalMath_toInterval() {
    let interval = new MAInterval(1, 2)
    assertEqual(interval.lb, 1)
    assertEqual(interval.ub, 2)

    let res1 = MAIntervalMath.toInterval(interval)
    assertEqual(res1.lb, 1)
    assertEqual(res1.ub, 2)

    let res2 = MAIntervalMath.toInterval(3)
    assertEqual(res2.lb, 3)
    assertEqual(res2.ub, 3)

    let res3 = MAIntervalMath.toInterval(MAIntervalMath.neg)
    assertEqual(res3, null)
  }

  test_MAIntervalMath_plus() {
    // Two numbers
    let res = MAIntervalMath.plus(1, 2)
    assertEqual(res.lb, 3)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)

    // a number + an interval
    res = MAIntervalMath.plus(4, new MAInterval(1, 2))
    assertEqual(res.lb, 5)
    assertEqual(res.ub, 6)
    assertEqual(res.isEmpty, false)

    // an interval + a number
    res = MAIntervalMath.plus(new MAInterval(1, 2), 5)
    assertEqual(res.lb, 6)
    assertEqual(res.ub, 7)
    assertEqual(res.isEmpty, false)

    // Two intervals
    res = MAIntervalMath.plus(new MAInterval(1, 2), new MAInterval(1, 7))
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 9)
    assertEqual(res.isEmpty, false)

    // NaN lower bound
    res = MAIntervalMath.plus(new MAInterval(Number.NaN, 2), 1)
    assertEqual(res.lb, Number.NEGATIVE_INFINITY)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)

    // NaN upper bound
    res = MAIntervalMath.plus(new MAInterval(2, Number.NaN), 1)
    assertEqual(res.lb, 3)
    assertEqual(res.ub, Number.POSITIVE_INFINITY)
    assertEqual(res.isEmpty, false)

    // Empty + an interval
    res = MAIntervalMath.plus(MAInterval.empty(), new MAInterval(2, 3))
    assertEqual(res.isEmpty, true)

    // Empty + a number
    res = MAIntervalMath.plus(MAInterval.empty(), 2)
    assertEqual(res.isEmpty, true)

    // Empty + Empty
    res = MAIntervalMath.plus(MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    // an interval + Empty
    res = MAIntervalMath.plus(new MAInterval(2, 3), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    // a number + Empty
    res = MAIntervalMath.plus(3, MAInterval.empty())
    assertEqual(res.isEmpty, true)
  }

  test_MAIntervalMath_neg() {
    let res = MAIntervalMath.neg(new MAInterval(-1, 2))
    assertEqual(res.lb, -2)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.neg(1)
    assertEqual(res.lb, -1)
    assertEqual(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.neg(new MAInterval(Number.NEGATIVE_INFINITY, 2))
    assertEqual(res.lb, -2)
    assertEqual(res.ub, Number.POSITIVE_INFINITY)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.neg(MAInterval.empty())
    assertEqual(res.isEmpty, true)
  }

  test_MAIntervalMath_sign() {
    let res = MAIntervalMath.sign(new MAInterval(-1, 2))
    assertEqual(res.lb, -1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sign(1)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sign(10)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sign(-1)
    assertEqual(res.lb, -1)
    assertEqual(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sign(-10)
    assertEqual(res.lb, -1)
    assertEqual(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sign(new MAInterval(Number.NEGATIVE_INFINITY, 2))
    assertEqual(res.lb, -1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sign(MAInterval.empty())
    assertEqual(res.isEmpty, true)
  }

  test_MAIntervalMath_times() {
    let res = MAIntervalMath.times(MAInterval.empty(), new MAInterval(3, 5))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.times(new MAInterval(3, 5), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.times(2, new MAInterval(3, 5))
    assertEqual(res.lb, 6)
    assertEqual(res.ub, 10)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.times(-2, new MAInterval(3, 5))
    assertEqual(res.lb, -10)
    assertEqual(res.ub, -6)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.times(new MAInterval(3, 5), -2)
    assertEqual(res.lb, -10)
    assertEqual(res.ub, -6)
    assertEqual(res.isEmpty, false)

    // a.lb >= 0, b.lb >= 0
    // a.lb >= 0, b.ub > 0
    res = MAIntervalMath.times(new MAInterval(2, 3), new MAInterval(4, 5))
    assertEqual(res.lb, 8)
    assertEqual(res.ub, 15)
    assertEqual(res.isEmpty, false)

    // a.lb >= 0, b.ub <= 0
    res = MAIntervalMath.times(new MAInterval(2, 3), new MAInterval(-5, -4))
    assertEqual(res.lb, -15)
    assertEqual(res.ub, -8)
    assertEqual(res.isEmpty, false)

    // a.lb >= 0, b.lb < 0
    res = MAIntervalMath.times(new MAInterval(2, 3), new MAInterval(-4, 5))
    assertEqual(res.lb, -12)
    assertEqual(res.ub, 15)
    assertEqual(res.isEmpty, false)

    // a.ub < 0, b.lb >= 0
    // a.ub < 0, b.ub > 0
    res = MAIntervalMath.times(new MAInterval(-3, -2), new MAInterval(4, 5))
    assertEqual(res.lb, -15)
    assertEqual(res.ub, -8)
    assertEqual(res.isEmpty, false)

    // a.ub < 0, b.lb < 0
    res = MAIntervalMath.times(new MAInterval(-3, -2), new MAInterval(-5, -4))
    assertEqual(res.lb, 8)
    assertEqual(res.ub, 15)
    assertEqual(res.isEmpty, false)

    // a.ub < 0, b.ub <= 0
    res = MAIntervalMath.times(new MAInterval(-3, -2), new MAInterval(-4, 0))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 12)
    assertEqual(res.isEmpty, false)

    // a.ub < 0, b.lb < 0, b.ub > 0
    res = MAIntervalMath.times(new MAInterval(-3, -2), new MAInterval(-4, 5))
    assertEqual(res.lb, -15)
    assertEqual(res.ub, 12)
    assertEqual(res.isEmpty, false)

    // a.lb < 0, a.ub > 0, b.lb >= 0
    res = MAIntervalMath.times(new MAInterval(-3, 2), new MAInterval(4, 5))
    assertEqual(res.lb, -15)
    assertEqual(res.ub, 10)
    assertEqual(res.isEmpty, false)

    // a.lb < 0, a.ub > 0, b.ub <= 0
    res = MAIntervalMath.times(new MAInterval(-3, 2), new MAInterval(-4, -5))
    assertEqual(res.lb, -8)
    assertEqual(res.ub, 12)
    assertEqual(res.isEmpty, false)

    // a.lb < 0, a.ub > 0, b.lb < 0, b.ub > 0
    res = MAIntervalMath.times(new MAInterval(-3, 2), new MAInterval(-4, 5))
    assertEqual(res.lb, -15)
    assertEqual(res.ub, 12)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.times(new MAInterval(-5, 2), new MAInterval(-5, 2))
    assertEqual(res.lb, -10)
    assertEqual(res.ub, 25)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_abs() {
    let res = MAIntervalMath.abs(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    // a.lb >= 0
    res = MAIntervalMath.abs(new MAInterval(2, 3))
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)

    // a.ub <= 0
    res = MAIntervalMath.abs(new MAInterval(-3, -2))
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)

    // a.lb < 0, a.ub > 0
    res = MAIntervalMath.abs(new MAInterval(-3, 2))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.abs(new MAInterval(-2, 4))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_mod() {
    let res = MAIntervalMath.mod(MAInterval.empty(), 1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.mod(1, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.recip(0)
    assertEqual(res.isEmpty, true)

    // Close enough to zero that we treat it as such
    res = MAIntervalMath.recip(1e-4)
    assertEqual(res.isEmpty, true)


    res = MAIntervalMath.mod(2, 2)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(3, 2)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(4, 2)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(5, 2)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(5, 2.1)
    assertEqualFloats(res.lb, 5 % 2.1)
    assertEqualFloats(res.ub, 5 % 2.1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(-5, 2.1)
    assertEqualFloats(res.lb, MAUtils.floorMod(-5, 2.1))
    assertEqualFloats(res.ub, MAUtils.floorMod(-5, 2.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(4, -4)
    assertEqualFloats(res.lb, MAUtils.floorMod(4, -4))
    assertEqualFloats(res.ub, MAUtils.floorMod(4, -4))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(4, -5)
    assertEqualFloats(res.lb, MAUtils.floorMod(4, -5))
    assertEqualFloats(res.ub, MAUtils.floorMod(4, -5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(4, -6.4)
    assertEqualFloats(res.lb, MAUtils.floorMod(4, -6.4))
    assertEqualFloats(res.ub, MAUtils.floorMod(4, -6.4))
    assertEqual(res.isEmpty, false)


    res = MAIntervalMath.mod(new MAInterval(-2, 4), 2)
    assertTrue(res.lb <= 0)
    assertTrue(res.ub >= 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(new MAInterval(2, 4), 2)
    assertTrue(res.lb <= 0)
    assertEqualFloats(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(new MAInterval(-2.1, 4.6), 2.1)
    assertTrue(res.lb <= 0)
    assertTrue(res.ub >= 2.1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.mod(new MAInterval(2.1, 4.6), 2.1)
    assertTrue(res.lb <= 0)
    assertTrue(res.ub >= 2.1)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_floor() {
    let res = MAIntervalMath.floor(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.floor(new MAInterval(-2, 4))
    assertEqual(res.lb, -2)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.floor(new MAInterval(-2.1, 4.6))
    assertEqual(res.lb, -3)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.floor(new MAInterval(2.1, 4.6))
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_ceil() {
    let res = MAIntervalMath.ceil(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.ceil(new MAInterval(-2, 4))
    assertEqual(res.lb, -2)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ceil(new MAInterval(-2.1, 4.6))
    assertEqual(res.lb, -2)
    assertEqual(res.ub, 5)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ceil(new MAInterval(2.1, 4.6))
    assertEqual(res.lb, 3)
    assertEqual(res.ub, 5)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_trunc() {
    let res = MAIntervalMath.trunc(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.trunc(new MAInterval(-2, 4))
    assertEqual(res.lb, -2)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.trunc(new MAInterval(-2.1, 4.6))
    assertEqual(res.lb, -2)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.trunc(new MAInterval(2.1, 4.6))
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.trunc(0.5)
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.trunc(-0.5)
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_max() {
    let res = MAIntervalMath.max(MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.max(1, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.max(MAInterval.empty(), 1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.max(1, 2)
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.max(2, 1)
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.max(1, -2)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.max(-2, 1)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.max(new MAInterval(1, 2), new MAInterval(3, 4))
    assertEqual(res.lb, 3)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.max(new MAInterval(3, 4), new MAInterval(1, 2))
    assertEqual(res.lb, 3)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.max(new MAInterval(-1, 4), new MAInterval(1, 2))
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.max(new MAInterval(1, 2), new MAInterval(-1, 4))
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_min() {
    let res = MAIntervalMath.min(MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.min(1, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.min(MAInterval.empty(), 1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.min(1, 2)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.min(2, 1)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.min(1, -2)
    assertEqual(res.lb, -2)
    assertEqual(res.ub, -2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.min(-2, 1)
    assertEqual(res.lb, -2)
    assertEqual(res.ub, -2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.min(new MAInterval(1, 2), new MAInterval(3, 4))
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.min(new MAInterval(3, 4), new MAInterval(1, 2))
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.min(new MAInterval(-1, 4), new MAInterval(1, 2))
    assertEqual(res.lb, -1)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.min(new MAInterval(1, 2), new MAInterval(-1, 4))
    assertEqual(res.lb, -1)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_clamp() {
    let res = MAIntervalMath.clamp(MAInterval.empty(), MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.clamp(1, MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.clamp(MAInterval.empty(), 1, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.clamp(MAInterval.empty(), MAInterval.empty(), 1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.clamp(new MAInterval(-10, 10), 1, 3)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.clamp(new MAInterval(2, 3), 1, 4)
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_saturate() {
    let res = MAIntervalMath.saturate(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.saturate(new MAInterval(2, 3))
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.saturate(new MAInterval(-2, -1))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.saturate(0.5)
    assertEqual(res.lb, 0.5)
    assertEqual(res.ub, 0.5)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_smoothstep() {
    let res = MAIntervalMath.smoothstep(MAInterval.empty(), MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.smoothstep(1, MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.smoothstep(MAInterval.empty(), 1, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.smoothstep(MAInterval.empty(), MAInterval.empty(), 1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.smoothstep(0, 1, new MAInterval(-3, -2))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.smoothstep(0, 1, new MAInterval(3, 4))
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.smoothstep(0, 1, 0.5)
    assertEqualFloats(res.lb, 0.5)
    assertEqualFloats(res.ub, 0.5)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_cellnoise() {
    let res = MAIntervalMath.cellnoise(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    // Wide interval gets wide result
    res = MAIntervalMath.cellnoise(new MAInterval(1, 3))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    // Interval that spans different integers gets wide result
    res = MAIntervalMath.cellnoise(new MAInterval(0.7, 1.2))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cellnoise(new MAInterval(1.0, 1.2))
    assertEqualFloats(res.lb, 0.226367589)
    assertEqualFloats(res.ub, 0.226367589)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cellnoise(1)
    assertEqualFloats(res.lb, 0.226367589)
    assertEqualFloats(res.ub, 0.226367589)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cellnoise(-0.5)
    assertEqualFloats(res.lb, 0.09987029831387809)
    assertEqualFloats(res.ub, 0.09987029831387809)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cellnoise(-1.5)
    assertEqualFloats(res.lb, 0.703196765087358)
    assertEqualFloats(res.ub, 0.703196765087358)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cellnoise(1.5)
    assertEqualFloats(res.lb, 0.22636758983749142)
    assertEqualFloats(res.ub, 0.22636758983749142)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cellnoise(2.5)
    assertEqualFloats(res.lb, 0.7063706416418708)
    assertEqualFloats(res.ub, 0.7063706416418708)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cellnoise(3.5)
    assertEqualFloats(res.lb, 0.25717555504692147)
    assertEqualFloats(res.ub, 0.25717555504692147)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cellnoise(4.5)
    assertEqualFloats(res.lb, 0.4142366674296178)
    assertEqualFloats(res.ub, 0.4142366674296178)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_noise() {
    let res = MAIntervalMath.noise(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    // Wide interval gets wide result
    res = MAIntervalMath.noise(new MAInterval(1, 3))
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.noise(new MAInterval(0, 0.6))
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)


    res = MAIntervalMath.noise(new MAInterval(0, 0.4))
    assertEqualFloats(res.lb, -0.349138628)
    assertEqualFloats(res.ub, 0.92394769)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.noise(1)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.noise(1.1)
    assertEqualFloats(res.lb, -0.11487556438544302)
    assertEqualFloats(res.ub, -0.11487556438544302)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.noise(2.4)
    assertEqualFloats(res.lb, 0.41037381258869304)
    assertEqualFloats(res.ub, 0.41037381258869304)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.noise(-2.5)
    assertEqualFloats(res.lb, 0.17380025940337218)
    assertEqualFloats(res.ub, 0.17380025940337218)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.noise(-3.6)
    assertEqualFloats(res.lb, -0.3893447104600595)
    assertEqualFloats(res.ub, -0.3893447104600595)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_voronoi() {
    let res = MAIntervalMath.voronoi(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.voronoi(new MAInterval(1, 3))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 3)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.voronoi(new MAInterval(-10, 10))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 21)
    assertEqual(res.isEmpty, false)


    res = MAIntervalMath.voronoi(0)
    assertEqualFloats(res.lb, 0.2817883573)
    assertEqualFloats(res.ub, 0.2817883573)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.voronoi(1)
    assertEqualFloats(res.lb, 0.2263675898)
    assertEqualFloats(res.ub, 0.2263675898)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.voronoi(1.2)
    assertEqualFloats(res.lb, 0.0263675898)
    assertEqualFloats(res.ub, 0.0263675898)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.voronoi(3)
    assertEqualFloats(res.lb, 0.2571755550)
    assertEqualFloats(res.ub, 0.2571755550)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.voronoi(-1.1)
    assertEqualFloats(res.lb, 0.19680323491264196)
    assertEqualFloats(res.ub, 0.19680323491264196)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.voronoi(-3.1)
    assertEqualFloats(res.lb, 0.49351491569390393)
    assertEqualFloats(res.ub, 0.49351491569390393)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_exp() {
    let res = MAIntervalMath.exp(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.exp(new MAInterval(-1, 1))
    assertEqual(res.lb, 1/Math.E)
    assertEqual(res.ub, Math.E)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.exp(new MAInterval(-2, 2))
    assertEqual(Math.abs(res.lb - 1/(Math.E*Math.E)) < 0.0000001, true)
    assertEqual(Math.abs(res.ub - Math.E*Math.E) < 0.0000001, true)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_ln() {
    // ub <= 0
    let res = MAIntervalMath.ln(new MAInterval(-2, -1))
    assertEqual(res.isEmpty, true)

    // lb <= 0
    res = MAIntervalMath.ln(new MAInterval(-1, 1))
    assertEqual(res.lb, Number.NEGATIVE_INFINITY)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    // lb > 0
    res = MAIntervalMath.ln(new MAInterval(2, 3))
    assertEqual(Math.abs(res.lb - 0.6931471805599) < 0.0000001, true)
    assertEqual(Math.abs(res.ub - 1.0986122886681) < 0.0000001, true)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ln(MAInterval.empty())
    assertEqual(res.isEmpty, true)
  }

  test_MAIntervalMath_log() {
    // ub <= 0
    let res = MAIntervalMath.log(new MAInterval(-2, -1))
    assertEqual(res.isEmpty, true)

    // lb <= 0
    res = MAIntervalMath.log(new MAInterval(-1, 1))
    assertEqual(res.lb, Number.NEGATIVE_INFINITY)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    // lb > 0
    res = MAIntervalMath.log(new MAInterval(2, 3))
    assertEqualFloats(res.lb, Math.log(2)/Math.log(10))
    assertEqualFloats(res.ub, Math.log(3)/Math.log(10))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.log(MAInterval.empty())
    assertEqual(res.isEmpty, true)
  }

  test_MAIntervalMath_pow() {
    let res = MAIntervalMath.pow(MAInterval.empty(), 2)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(2, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(MAInterval.empty(), new MAInterval(2, 3))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(new MAInterval(2, 3), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(2, 2)
    assertEqual(res.lb, 4)
    assertEqual(res.ub, 4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(2, 3)
    assertEqualFloats(res.lb, 8)
    assertEqualFloats(res.ub, 8)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(5, 3)
    assertEqualFloats(res.lb, 125)
    assertEqualFloats(res.ub, 125)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(4, 0.5)
    assertEqualFloats(res.lb, 2)
    assertEqualFloats(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(-1, 0.5)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(new MAInterval(-5, -4), 0.5)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(new MAInterval(-4, 5), 0.5)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 2.23606797749979)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(4, 5), 0.5)
    assertEqualFloats(res.lb, 2)
    assertEqualFloats(res.ub, Math.sqrt(5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(4, 5), 2)
    assertEqualFloats(res.lb, 16)
    assertEqualFloats(res.ub, 25)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, -4), 2)
    assertEqualFloats(res.lb, 16)
    assertEqualFloats(res.ub, 25)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, 4), 2)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 25)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, -4), 3)
    assertEqualFloats(res.lb, -125)
    assertEqualFloats(res.ub, -64)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, 4), 3)
    assertEqualFloats(res.lb, -125)
    assertEqualFloats(res.ub, 64)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(4, 5), 3)
    assertEqualFloats(res.lb, 64)
    assertEqualFloats(res.ub, 125)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(-1, 3)
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(2, 0)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(-1, 0)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(0, 0)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-2, -1), 0)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-2, 5), 0)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(2, 5), 0)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, -2), 1.2)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(new MAInterval(-2, 5), 1.2)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 5**1.2)
    assertEqualFloats(res.ub, 6.898648307306074)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(2, 5), 1.2)
    assertEqualFloats(res.lb, 2.2973967099940698)
    assertEqualFloats(res.ub, 6.898648307306074)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, -2), -2)
    assertEqualFloats(res.lb, 1/25)
    assertEqualFloats(res.ub, 1/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, 2), -2)
    assertEqualFloats(res.lb, 1/25)
    assertEqual(res.ub, Number.POSITIVE_INFINITY)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(2, 5), -2)
    assertEqualFloats(res.lb, 1/25)
    assertEqualFloats(res.ub, 1/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, -2), -3)
    assertEqualFloats(res.lb, -1/8)
    assertEqualFloats(res.ub, -1/125)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-5, 2), -3)
    assertEqualFloats(res.lb, -Infinity)
    assertEqual(res.ub, Infinity)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(2, 5), -3)
    assertEqualFloats(res.lb, 1/125)
    assertEqualFloats(res.ub, 1/8)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(2, new MAInterval(-5, -2))
    assertEqualFloats(res.lb, 1/32)
    assertEqualFloats(res.ub, 0.25)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(2, new MAInterval(-2, 5))
    assertEqualFloats(res.lb, 0.25)
    assertEqualFloats(res.ub, 32)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(2, new MAInterval(2, 5))
    assertEqualFloats(res.lb, 4)
    assertEqualFloats(res.ub, 32)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(2, new MAInterval(2, 5.1))
    assertEqualFloats(res.lb, 4)
    assertEqualFloats(res.ub, 34.29675080116137)
    assertEqual(res.isEmpty, false)

    // It's probably possible to come up with an implementation that will give
    // a non-empty interval for these operations raising a negative number to an interval
    res = MAIntervalMath.pow(-2, new MAInterval(-5, -2))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(-2, new MAInterval(-2, 5))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(-2, new MAInterval(2, 5))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(-2, new MAInterval(2, 5.1))
    assertEqual(res.isEmpty, true)

    // Raise intervals to interval powers
    // Interval values:             Power values:
    // negative lb, negative ub     negative lb, negative ub
    // negative lb, negative ub     negative lb, positive ub
    // negative lb, negative ub     positive lb, positive ub
    res = MAIntervalMath.pow(new MAInterval(-3, -2), new MAInterval(-5, -4))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(new MAInterval(-3, -2), new MAInterval(-5, 4))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.pow(new MAInterval(-3, -2), new MAInterval(4, 5))
    assertEqual(res.isEmpty, true)

    // negative lb, positive ub     negative lb, negative ub
    // negative lb, positive ub     negative lb, positive ub
    // negative lb, positive ub     positive lb, positive ub
    res = MAIntervalMath.pow(new MAInterval(-3, 2), new MAInterval(-5, -4))
    assertEqualFloats(res.lb, 0.03125)
    assertEqualFloats(res.ub, Infinity)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-3, 2), new MAInterval(-5, 4))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, Infinity)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(-3, 2), new MAInterval(4, 5))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 32)
    assertEqual(res.isEmpty, false)

    // positive lb, positive ub     negative lb, negative ub
    // positive lb, positive ub     negative lb, positive ub
    // positive lb, positive ub     positive lb, positive ub
    res = MAIntervalMath.pow(new MAInterval(2, 3), new MAInterval(-5, -4))
    assertEqualFloats(res.lb, 0.0041152263374485566)
    assertEqualFloats(res.ub, 0.0625)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(2, 3), new MAInterval(-5, 4))
    assertEqualFloats(res.lb, 0.0041152263374485566)
    assertEqualFloats(res.ub, 81)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.pow(new MAInterval(2, 3), new MAInterval(4, 5))
    assertEqualFloats(res.lb, 16)
    assertEqualFloats(res.ub, 243)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_powToInteger() {
    let res = MAIntervalMath.powToInteger(new MAInterval(-3, -2), 1)
    assertEqual(res.lb, -3)
    assertEqual(res.ub, -2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, 2), 1)
    assertEqual(res.lb, -3)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(2, 3), 1)
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, -2), 0)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, 2), 0)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(2, 3), 0)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, -2), 2)
    assertEqual(res.lb, 4)
    assertEqual(res.ub, 9)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, 2), 2)
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 9)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(2, 3), 2)
    assertEqual(res.lb, 4)
    assertEqual(res.ub, 9)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, -2), 4)
    assertEqual(res.lb, 16)
    assertEqual(res.ub, 81)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, 2), 4)
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 81)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(2, 3), 4)
    assertEqual(res.lb, 16)
    assertEqual(res.ub, 81)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, -2), 3)
    assertEqual(res.lb, -27)
    assertEqual(res.ub, -8)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(-3, 2), 3)
    assertEqual(res.lb, -27)
    assertEqual(res.ub, 8)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.powToInteger(new MAInterval(2, 3), 3)
    assertEqual(res.lb, 8)
    assertEqual(res.ub, 27)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_recip() {
    let res = MAIntervalMath.recip(new MAInterval(0, 0))
    assertEqual(res.isEmpty, true)

    // Close enough to zero that we treat it as such
    res = MAIntervalMath.recip(1e-4)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.recip(new MAInterval(-3, -2))
    assertEqualFloats(res.lb, 1/-2)
    assertEqualFloats(res.ub, 1/-3)
    assertEqualFloats(res.isEmpty, false)

    res = MAIntervalMath.recip(new MAInterval(2, 3))
    assertEqualFloats(res.lb, 1/3)
    assertEqualFloats(res.ub, 1/2)
    assertEqualFloats(res.isEmpty, false)

    res = MAIntervalMath.recip(new MAInterval(0, 3))
    assertEqualFloats(res.lb, 1/3)
    assertEqualFloats(res.ub, Infinity)
    assertEqualFloats(res.isEmpty, false)

    res = MAIntervalMath.recip(new MAInterval(-3, 0))
    assertEqualFloats(res.lb, -Infinity)
    assertEqualFloats(res.ub, 1/-3)
    assertEqualFloats(res.isEmpty, false)

    res = MAIntervalMath.recip(new MAInterval(-3, 2))
    assertEqualFloats(res.lb, -Infinity)
    assertEqualFloats(res.ub, Infinity)
    assertEqualFloats(res.isEmpty, false)
  }

  test_MAIntervalMath_sqrt() {
    let res = MAIntervalMath.sqrt(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.sqrt(4)
    assertEqual(res.lb, 2)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sqrt(-4)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.sqrt(new MAInterval(-2, -1))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.sqrt(new MAInterval(-2, 2))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sqrt(new MAInterval(0, 2.5))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, Math.sqrt(2.5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sqrt(new MAInterval(1, 9))
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 3)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_sin() {
    let res = MAIntervalMath.sin(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    // I'm reusing assertions from test_MAIntervalMath_cos by shifting the
    // input to sin to give the same result
    let offset = Math.PI/2

    res = MAIntervalMath.sin(0+offset)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(Math.PI/2+offset)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(Math.PI+offset)
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(3*Math.PI/2+offset)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(2*Math.PI+offset)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(0+2*Math.PI+offset)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(Math.PI/2 + 2*Math.PI+offset)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(Math.PI + 2*Math.PI+offset)
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(3*Math.PI/2 + 2*Math.PI+offset)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(2*Math.PI + 2*Math.PI+offset)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(0-2*Math.PI+offset)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(Math.PI/2 - 2*Math.PI+offset)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(Math.PI - 2*Math.PI+offset)
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(3*Math.PI/2 - 2*Math.PI+offset)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(2*Math.PI - 2*Math.PI+offset)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)


    res = MAIntervalMath.sin(new MAInterval(0+offset, 2*Math.PI+offset))
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(new MAInterval(0+offset, Math.PI/2+offset))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.sin(new MAInterval(-Math.PI/2+offset, Math.PI/2+offset))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_cos() {
    let res = MAIntervalMath.cos(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.cos(0)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(Math.PI/2)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(Math.PI)
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(3*Math.PI/2)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(2*Math.PI)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(0+2*Math.PI)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(Math.PI/2 + 2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(Math.PI + 2*Math.PI)
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(3*Math.PI/2 + 2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(2*Math.PI + 2*Math.PI)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(0-2*Math.PI)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(Math.PI/2 - 2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(Math.PI - 2*Math.PI)
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, -1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(3*Math.PI/2 - 2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(2*Math.PI - 2*Math.PI)
    assertEqualFloats(res.lb, 1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)


    res = MAIntervalMath.cos(new MAInterval(0, 2*Math.PI))
    assertEqualFloats(res.lb, -1)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(new MAInterval(0, Math.PI/2))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.cos(new MAInterval(-Math.PI/2, Math.PI/2))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 1)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_tan() {
    let res = MAIntervalMath.tan(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.tan(0)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    // cosine is 0 for this input so tan is undefined
    res = MAIntervalMath.tan(Math.PI/2)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.tan(Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    // cosine is 0 for this input so tan is undefined
    res = MAIntervalMath.tan(3*Math.PI/2)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.tan(2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)



    res = MAIntervalMath.tan(0+2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    // cosine is 0 for this input so tan is undefined
    res = MAIntervalMath.tan(Math.PI/2+2*Math.PI)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.tan(Math.PI+2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    // cosine is 0 for this input so tan is undefined
    res = MAIntervalMath.tan(3*Math.PI/2+2*Math.PI)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.tan(2*Math.PI+2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)



    res = MAIntervalMath.tan(0-2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    // cosine is 0 for this input so tan is undefined
    res = MAIntervalMath.tan(Math.PI/2-2*Math.PI)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.tan(Math.PI-2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    // cosine is 0 for this input so tan is undefined
    res = MAIntervalMath.tan(3*Math.PI/2-2*Math.PI)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.tan(2*Math.PI-2*Math.PI)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)



    res = MAIntervalMath.tan(new MAInterval(0, 2*Math.PI))
    assertEqualFloats(res.lb, -Infinity)
    assertEqualFloats(res.ub, Infinity)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.tan(new MAInterval(0, Math.PI/2))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, Math.tan(Math.PI/2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.tan(new MAInterval(-Math.PI/2, Math.PI/2))
    assertEqualFloats(res.lb, Math.tan(-Math.PI/2)) // huge negative number
    assertEqualFloats(res.ub, Math.tan(Math.PI/2)) // huge positive number
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_asin() {
    let res = MAIntervalMath.asin(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.asin(0)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(1)
    assertEqualFloats(res.lb, Math.asin(1))
    assertEqualFloats(res.ub, Math.asin(1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(-1)
    assertEqualFloats(res.lb, Math.asin(-1))
    assertEqualFloats(res.ub, Math.asin(-1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(0.1)
    assertEqualFloats(res.lb, Math.asin(0.1))
    assertEqualFloats(res.ub, Math.asin(0.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(-0.1)
    assertEqualFloats(res.lb, Math.asin(-0.1))
    assertEqualFloats(res.ub, Math.asin(-0.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(0.5)
    assertEqualFloats(res.lb, Math.asin(0.5))
    assertEqualFloats(res.ub, Math.asin(0.5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(-0.5)
    assertEqualFloats(res.lb, Math.asin(-0.5))
    assertEqualFloats(res.ub, Math.asin(-0.5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(1.1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.asin(-1.1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.asin(10)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.asin(-10)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.asin(new MAInterval(-1.1, 1.1))
    assertEqualFloats(res.lb, Math.asin(-1))
    assertEqualFloats(res.ub, Math.asin(1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(new MAInterval(-2, 10))
    assertEqualFloats(res.lb, Math.asin(-1))
    assertEqualFloats(res.ub, Math.asin(1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(new MAInterval(0.5, 0.8))
    assertEqualFloats(res.lb, Math.asin(0.5))
    assertEqualFloats(res.ub, Math.asin(0.8))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.asin(new MAInterval(1.1, 2))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.asin(new MAInterval(-2, -1.1))
    assertEqual(res.isEmpty, true)
  }

  test_MAIntervalMath_acos() {
    let res = MAIntervalMath.acos(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.acos(0)
    assertEqualFloats(res.lb, Math.acos(0))
    assertEqualFloats(res.ub, Math.acos(0))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(1)
    assertEqualFloats(res.lb, Math.acos(1))
    assertEqualFloats(res.ub, Math.acos(1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(-1)
    assertEqualFloats(res.lb, Math.acos(-1))
    assertEqualFloats(res.ub, Math.acos(-1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(0.1)
    assertEqualFloats(res.lb, Math.acos(0.1))
    assertEqualFloats(res.ub, Math.acos(0.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(-0.1)
    assertEqualFloats(res.lb, Math.acos(-0.1))
    assertEqualFloats(res.ub, Math.acos(-0.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(0.5)
    assertEqualFloats(res.lb, Math.acos(0.5))
    assertEqualFloats(res.ub, Math.acos(0.5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(-0.5)
    assertEqualFloats(res.lb, Math.acos(-0.5))
    assertEqualFloats(res.ub, Math.acos(-0.5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(1.1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.acos(-1.1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.acos(10)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.acos(-10)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.acos(new MAInterval(-1.1, 1.1))
    assertEqualFloats(res.lb, Math.acos(1))
    assertEqualFloats(res.ub, Math.acos(-1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(new MAInterval(-2, 10))
    assertEqualFloats(res.lb, Math.acos(1))
    assertEqualFloats(res.ub, Math.acos(-1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(new MAInterval(0.5, 0.8))
    assertEqualFloats(res.lb, Math.acos(0.8))
    assertEqualFloats(res.ub, Math.acos(0.5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.acos(new MAInterval(1.1, 2))
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.acos(new MAInterval(-2, -1.1))
    assertEqual(res.isEmpty, true)
  }

  test_MAIntervalMath_atan() {
    let res = MAIntervalMath.atan(MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.atan(0)
    assertEqualFloats(res.lb, Math.atan(0))
    assertEqualFloats(res.ub, Math.atan(0))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(1)
    assertEqualFloats(res.lb, Math.atan(1))
    assertEqualFloats(res.ub, Math.atan(1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(-1)
    assertEqualFloats(res.lb, Math.atan(-1))
    assertEqualFloats(res.ub, Math.atan(-1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(0.1)
    assertEqualFloats(res.lb, Math.atan(0.1))
    assertEqualFloats(res.ub, Math.atan(0.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(-0.1)
    assertEqualFloats(res.lb, Math.atan(-0.1))
    assertEqualFloats(res.ub, Math.atan(-0.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(0.5)
    assertEqualFloats(res.lb, Math.atan(0.5))
    assertEqualFloats(res.ub, Math.atan(0.5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(-0.5)
    assertEqualFloats(res.lb, Math.atan(-0.5))
    assertEqualFloats(res.ub, Math.atan(-0.5))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(10)
    assertEqualFloats(res.lb, Math.atan(10))
    assertEqualFloats(res.ub, Math.atan(10))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(-10)
    assertEqualFloats(res.lb, Math.atan(-10))
    assertEqualFloats(res.ub, Math.atan(-10))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(new MAInterval(-1.1, 1.1))
    assertEqualFloats(res.lb, Math.atan(-1.1))
    assertEqualFloats(res.ub, Math.atan(1.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(new MAInterval(-2, 10))
    assertEqualFloats(res.lb, Math.atan(-2))
    assertEqualFloats(res.ub, Math.atan(10))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(new MAInterval(0.5, 0.8))
    assertEqualFloats(res.lb, Math.atan(0.5))
    assertEqualFloats(res.ub, Math.atan(0.8))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(new MAInterval(1.1, 2))
    assertEqualFloats(res.lb, Math.atan(1.1))
    assertEqualFloats(res.ub, Math.atan(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(new MAInterval(-2, -1.1))
    assertEqualFloats(res.lb, Math.atan(-2))
    assertEqualFloats(res.ub, Math.atan(-1.1))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan(new MAInterval(-15, 15))
    assertEqualFloats(res.lb, Math.atan(-15))
    assertEqualFloats(res.ub, Math.atan(15))
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_atan2() {
    let res = MAIntervalMath.atan2(1, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.atan2(MAInterval.empty(), 1)
    assertEqual(res.isEmpty, true)

    // Mathematically this would be undefined (due to division by 0) but JavaScript's
    // atan2 returns a result of 0
    res = MAIntervalMath.atan2(0, 0)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)


    // Positive x-axis
    res = MAIntervalMath.atan2(0, 1)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(0, 2.5)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)


    // Quadrant I
    res = MAIntervalMath.atan2(1, 1)
    assertEqualFloats(res.lb, Math.PI/4)
    assertEqualFloats(res.ub, Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(4, 4)
    assertEqualFloats(res.lb, Math.PI/4)
    assertEqualFloats(res.ub, Math.PI/4)
    assertEqual(res.isEmpty, false)


    // Positive y-axis
    res = MAIntervalMath.atan2(1, 0)
    assertEqualFloats(res.lb, Math.PI/2)
    assertEqualFloats(res.ub, Math.PI/2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(5.12, 0)
    assertEqualFloats(res.lb, Math.PI/2)
    assertEqualFloats(res.ub, Math.PI/2)
    assertEqual(res.isEmpty, false)


    // Quadrant II
    res = MAIntervalMath.atan2(1, -1)
    assertEqualFloats(res.lb, 3*Math.PI/4)
    assertEqualFloats(res.ub, 3*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(4, -4)
    assertEqualFloats(res.lb, 3*Math.PI/4)
    assertEqualFloats(res.ub, 3*Math.PI/4)
    assertEqual(res.isEmpty, false)


    // Negative x-axis
    res = MAIntervalMath.atan2(0, -1)
    assertEqualFloats(res.lb, -Math.PI)
    assertEqualFloats(res.ub, -Math.PI)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(0, -2.5)
    assertEqualFloats(res.lb, -Math.PI)
    assertEqualFloats(res.ub, -Math.PI)
    assertEqual(res.isEmpty, false)


    // Quadrant III
    res = MAIntervalMath.atan2(-1, -1)
    assertEqualFloats(res.lb, -3*Math.PI/4)
    assertEqualFloats(res.ub, -3*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(-4, -4)
    assertEqualFloats(res.lb, -3*Math.PI/4)
    assertEqualFloats(res.ub, -3*Math.PI/4)
    assertEqual(res.isEmpty, false)


    // Negative y-axis
    res = MAIntervalMath.atan2(-1, 0)
    assertEqualFloats(res.lb, -Math.PI/2)
    assertEqualFloats(res.ub, -Math.PI/2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(-5.12, 0)
    assertEqualFloats(res.lb, -Math.PI/2)
    assertEqualFloats(res.ub, -Math.PI/2)
    assertEqual(res.isEmpty, false)


    // Quadrant IV
    res = MAIntervalMath.atan2(-1, 1)
    assertEqualFloats(res.lb, -Math.PI/4)
    assertEqualFloats(res.ub, -Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(-4, 4)
    assertEqualFloats(res.lb, -Math.PI/4)
    assertEqualFloats(res.ub, -Math.PI/4)
    assertEqual(res.isEmpty, false)


    // Test an interval for x that has lb<0, ub>0
    // This uncovered a bug in the original relplot impl
    res = MAIntervalMath.atan2(0, new MAInterval(-1, 1))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, Math.PI)
    assertEqual(res.isEmpty, false)

    // Results on either side of the x-axis are correct:
    // - Test with y=0.01
    res = MAIntervalMath.atan2(0.01, new MAInterval(-1, 1))
    assertEqualFloats(res.lb, 0.00999966) // nearly 0
    assertEqualFloats(res.ub, 3.13159298) // nearly PI
    assertEqual(res.isEmpty, false)

    // - Test with y=-0.01
    res = MAIntervalMath.atan2(-0.01, new MAInterval(-1, 1))
    assertEqualFloats(res.lb, -3.13159298) // nearly -PI
    assertEqualFloats(res.ub, -0.00999966) // nearly 0
    assertEqual(res.isEmpty, false)

    // - Test the range y=[0.01, -0.01]
    res = MAIntervalMath.atan2(new MAInterval(-0.01, 0.01), new MAInterval(-1, 1))
    assertEqualFloats(res.lb, -Math.PI)
    assertEqualFloats(res.ub, Math.PI)
    assertEqual(res.isEmpty, false)

    // Interval that spans part of the y-axis
    res = MAIntervalMath.atan2(new MAInterval(-1, 1), 0)
    assertEqualFloats(res.lb, -Math.PI/2)
    assertEqualFloats(res.ub, Math.PI/2)
    assertEqual(res.isEmpty, false)

    // Test the special discontinuity
    res = MAIntervalMath.atan2(new MAInterval(-0.0000001, 0.0000001), -1)
    assertEqualFloats(res.lb, -Math.PI)
    assertEqualFloats(res.ub, -Math.PI)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.atan2(new MAInterval(-0.000001, 0.000001), -1)
    assertEqualFloats(res.lb, -Math.PI)
    assertEqualFloats(res.ub, Math.PI)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_rFunc() {
    let res = MAIntervalMath.rFunc(1, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.rFunc(MAInterval.empty(), 1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.rFunc(MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.rFunc(0, 0)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.rFunc(1, 1)
    assertEqualFloats(res.lb, Math.sqrt(2))
    assertEqualFloats(res.ub, Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.rFunc(1, -1)
    assertEqualFloats(res.lb, Math.sqrt(2))
    assertEqualFloats(res.ub, Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.rFunc(-1, 1)
    assertEqualFloats(res.lb, Math.sqrt(2))
    assertEqualFloats(res.ub, Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.rFunc(-1, -1)
    assertEqualFloats(res.lb, Math.sqrt(2))
    assertEqualFloats(res.ub, Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.rFunc(4, 5)
    assertEqualFloats(res.lb, Math.sqrt(16+25))
    assertEqualFloats(res.ub, Math.sqrt(16+25))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.rFunc(new MAInterval(-4, 3), new MAInterval(-1, 2))
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, Math.sqrt(16+4))
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_negRFunc() {
    let res = MAIntervalMath.negRFunc(1, MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.negRFunc(MAInterval.empty(), 1)
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.negRFunc(MAInterval.empty(), MAInterval.empty())
    assertEqual(res.isEmpty, true)

    res = MAIntervalMath.negRFunc(0, 0)
    assertEqualFloats(res.lb, 0)
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.negRFunc(1, 1)
    assertEqualFloats(res.lb, -Math.sqrt(2))
    assertEqualFloats(res.ub, -Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.negRFunc(1, -1)
    assertEqualFloats(res.lb, -Math.sqrt(2))
    assertEqualFloats(res.ub, -Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.negRFunc(-1, 1)
    assertEqualFloats(res.lb, -Math.sqrt(2))
    assertEqualFloats(res.ub, -Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.negRFunc(-1, -1)
    assertEqualFloats(res.lb, -Math.sqrt(2))
    assertEqualFloats(res.ub, -Math.sqrt(2))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.negRFunc(4, 5)
    assertEqualFloats(res.lb, -Math.sqrt(16+25))
    assertEqualFloats(res.ub, -Math.sqrt(16+25))
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.negRFunc(new MAInterval(-4, 3), new MAInterval(-1, 2))
    assertEqualFloats(res.lb, -Math.sqrt(16+4))
    assertEqualFloats(res.ub, 0)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_theta() {
    // Theta will range from 0 to 2PI
    let res = MAIntervalMath.theta(0, 1) // y, x
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.theta(1, 1)
    assertEqualFloats(res.lb, Math.PI/4)
    assertEqualFloats(res.ub, Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.theta(1, 0)
    assertEqualFloats(res.lb, Math.PI/2)
    assertEqualFloats(res.ub, Math.PI/2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.theta(1, -1)
    assertEqualFloats(res.lb, 3*Math.PI/4)
    assertEqualFloats(res.ub, 3*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.theta(0, -1)
    assertEqualFloats(res.lb, Math.PI)
    assertEqualFloats(res.ub, Math.PI)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.theta(-1, -1)
    assertEqualFloats(res.lb, 5*Math.PI/4)
    assertEqualFloats(res.ub, 5*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.theta(-1, 0)
    assertEqualFloats(res.lb, 6*Math.PI/4)
    assertEqualFloats(res.ub, 6*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.theta(-1, 1)
    assertEqualFloats(res.lb, 7*Math.PI/4)
    assertEqualFloats(res.ub, 7*Math.PI/4)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_thetaFunc() {
    let resF = MAIntervalMath.thetaFunc(0, 0)
    assertEqual(typeof resF, "function")

    // This theta will range from 0 to 2PI
    let res = resF(0, 1) // y, x
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = resF(1, 1)
    assertEqualFloats(res.lb, Math.PI/4)
    assertEqualFloats(res.ub, Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = resF(1, 0)
    assertEqualFloats(res.lb, Math.PI/2)
    assertEqualFloats(res.ub, Math.PI/2)
    assertEqual(res.isEmpty, false)

    res = resF(1, -1)
    assertEqualFloats(res.lb, 3*Math.PI/4)
    assertEqualFloats(res.ub, 3*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = resF(0, -1)
    assertEqualFloats(res.lb, Math.PI)
    assertEqualFloats(res.ub, Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(-1, -1)
    assertEqualFloats(res.lb, 5*Math.PI/4)
    assertEqualFloats(res.ub, 5*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = resF(-1, 0)
    assertEqualFloats(res.lb, 6*Math.PI/4)
    assertEqualFloats(res.ub, 6*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = resF(-1, 1)
    assertEqualFloats(res.lb, 7*Math.PI/4)
    assertEqualFloats(res.ub, 7*Math.PI/4)
    assertEqual(res.isEmpty, false)


    // Test i=1
    resF = MAIntervalMath.thetaFunc(1, 0)
    assertEqual(typeof resF, "function")

    // This theta will range from 2PI to 4PI
    res = resF(0, 1) // y, x
    assertEqual(res.lb, 0+2*Math.PI)
    assertEqual(res.ub, 0+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(1, 1)
    assertEqualFloats(res.lb, Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(1, 0)
    assertEqualFloats(res.lb, Math.PI/2+2*Math.PI)
    assertEqualFloats(res.ub, Math.PI/2+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(1, -1)
    assertEqualFloats(res.lb, 3*Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, 3*Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(0, -1)
    assertEqualFloats(res.lb, Math.PI+2*Math.PI)
    assertEqualFloats(res.ub, Math.PI+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(-1, -1)
    assertEqualFloats(res.lb, 5*Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, 5*Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(-1, 0)
    assertEqualFloats(res.lb, 6*Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, 6*Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(-1, 1)
    assertEqualFloats(res.lb, 7*Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, 7*Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)


    // Test i=0, offset=PI
    resF = MAIntervalMath.thetaFunc(0, Math.PI)
    assertEqual(typeof resF, "function")

    // This theta will range from 0 to 2PI
    // Offset of PI gives us the opposite result so let's flip the sign of the inputs to reuse the same
    // assertions
    res = resF(0, -1) // y, x
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = resF(-1, -1)
    assertEqualFloats(res.lb, Math.PI/4)
    assertEqualFloats(res.ub, Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = resF(-1, 0)
    assertEqualFloats(res.lb, Math.PI/2)
    assertEqualFloats(res.ub, Math.PI/2)
    assertEqual(res.isEmpty, false)

    res = resF(-1, 1)
    assertEqualFloats(res.lb, 3*Math.PI/4)
    assertEqualFloats(res.ub, 3*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = resF(0, 1)
    assertEqualFloats(res.lb, Math.PI)
    assertEqualFloats(res.ub, Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(1, 1)
    assertEqualFloats(res.lb, 5*Math.PI/4)
    assertEqualFloats(res.ub, 5*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = resF(1, 0)
    assertEqualFloats(res.lb, 6*Math.PI/4)
    assertEqualFloats(res.ub, 6*Math.PI/4)
    assertEqual(res.isEmpty, false)

    res = resF(1, -1)
    assertEqualFloats(res.lb, 7*Math.PI/4)
    assertEqualFloats(res.ub, 7*Math.PI/4)
    assertEqual(res.isEmpty, false)


    // Test i=1, offset=PI
    resF = MAIntervalMath.thetaFunc(1, Math.PI)
    assertEqual(typeof resF, "function")

    // This theta will range from 2PI to 4PI
    // Offset of PI gives us the opposite result so let's flip the sign of the inputs to reuse the same
    // assertions
    res = resF(0, -1) // y, x
    assertEqual(res.lb, 0+2*Math.PI)
    assertEqual(res.ub, 0+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(-1, -1)
    assertEqualFloats(res.lb, Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(-1, 0)
    assertEqualFloats(res.lb, Math.PI/2+2*Math.PI)
    assertEqualFloats(res.ub, Math.PI/2+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(-1, 1)
    assertEqualFloats(res.lb, 3*Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, 3*Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(0, 1)
    assertEqualFloats(res.lb, Math.PI+2*Math.PI)
    assertEqualFloats(res.ub, Math.PI+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(1, 1)
    assertEqualFloats(res.lb, 5*Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, 5*Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(1, 0)
    assertEqualFloats(res.lb, 6*Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, 6*Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)

    res = resF(1, -1)
    assertEqualFloats(res.lb, 7*Math.PI/4+2*Math.PI)
    assertEqualFloats(res.ub, 7*Math.PI/4+2*Math.PI)
    assertEqual(res.isEmpty, false)
  }

  test_MAIntervalMath_ltz() {
    let res = MAIntervalMath.ltz(new MAInterval(-2, -1))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ltz(new MAInterval(0, 0))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ltz(0)
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 0)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ltz(1)
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 1)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ltz(new MAInterval(-1, 2))
    assertEqual(res.lb, 0)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ltz(new MAInterval(1, 2))
    assertEqual(res.lb, 1)
    assertEqual(res.ub, 2)
    assertEqual(res.isEmpty, false)

    res = MAIntervalMath.ltz(MAInterval.empty())
    assertEqual(res.isEmpty, true)
  }

  test_MAIntervalMath_containsZero() {
    let i = new MAInterval(1, 2)
    assertEqual(MAIntervalMath.containsZero(i), false)

    i = new MAInterval(0, 2)
    assertEqual(MAIntervalMath.containsZero(i), true)

    i = new MAInterval(-1, 0)
    assertEqual(MAIntervalMath.containsZero(i), true)

    i = new MAInterval(-1, 2)
    assertEqual(MAIntervalMath.containsZero(i), true)

    assertEqual(MAIntervalMath.containsZero(0), true)

    assertEqual(MAIntervalMath.containsZero(1), false)

    assertEqual(MAIntervalMath.containsZero(-1), false)

    assertEqual(MAIntervalMath.containsZero(MAInterval.empty()), false)
  }

  test_MAIntervalMath_equalsNumber() {
    assertEqual(MAIntervalMath.equalsNumber(new MAInterval(1, 2), 1), false)
    assertEqual(MAIntervalMath.equalsNumber(new MAInterval(3, 5), 1), false)
    assertEqual(MAIntervalMath.equalsNumber(new MAInterval(-5, -3), 1), false)
    assertEqual(MAIntervalMath.equalsNumber(new MAInterval(1, 1), 1), true)
    assertEqual(MAIntervalMath.equalsNumber(new MAInterval(1.1, 1.1), 1.1), true)
    assertEqual(MAIntervalMath.equalsNumber(new MAInterval(1.1, 1.1), 1), false)
    assertEqual(MAIntervalMath.equalsNumber(1, 1), true)
    assertEqual(MAIntervalMath.equalsNumber(MAInterval.empty(), 1), false)
  }

  test_MAIntervalMath_isFinite() {
    assertEqual(MAIntervalMath.isFinite(new MAInterval(1, 2)), true)
    assertEqual(MAIntervalMath.isFinite(new MAInterval(-11, 2)), true)
    assertEqual(MAIntervalMath.isFinite(-1), true)
    assertEqual(MAIntervalMath.isFinite(-Infinity), false)
    assertEqual(MAIntervalMath.isFinite(Infinity), false)
    assertEqual(MAIntervalMath.isFinite(new MAInterval(-11, Infinity)), false)
    assertEqual(MAIntervalMath.isFinite(new MAInterval(-Infinity, 1)), false)
    assertEqual(MAIntervalMath.isFinite(new MAInterval(-Infinity, Infinity)), false)
    assertEqual(MAIntervalMath.isFinite(MAInterval.empty(), 1), false)
  }

  test_MAIntervalMath_checkZeros() {
    let testFn = function(x, y, t) { return x }

    let x = 0
    let y = 0
    let t = 0

    // [mayContainZero, mustContainZero, isFinite]

    x = new MAInterval(1, Infinity)
    assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [false, false, false])
    x = new MAInterval(1, 2)
    assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [false, false, true])
    x = 2
    assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [false, false, true])
    // 'may' should be true when 'must' is true
    //assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [false, true, false])
    //assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [false, true, true])
    x = new MAInterval(0, Infinity)
    assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [true, false, false])
    x = new MAInterval(-1, 1)
    assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [true, false, true])
    // Not possible to equal 0 and be infinite
    //assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [true, true, false])
    x = new MAInterval(0, 0)
    assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [true, true, true])
    x = 0
    assertEqualArrays(MAIntervalMath.checkZeros(testFn, x, y, t), [true, true, true])
  }

// MARelplot

  test_MARelplot_findZero() {
    let testFn = function(x, y, t) { return MAIntervalMath.plus(MAIntervalMath.pow(y,y), MAIntervalMath.neg(MAIntervalMath.pow(x,x))) }
    let i0 = MARelplot.findZero(testFn, 0.984375, 0, 0.984375, 0.001)
    assertNull(i0)
  }

  test_MARelplot_restitch_y_equals_2xplus1() {
    let formulaStr = "y = plus(times(2,x),1)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800

    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    let resultWithoutRestitch = []
    let mc = new MAMathContext()
    MARelplot._render(formulaFn, xInterval, yInterval, 0, mc, res, resultWithoutRestitch)

    let restitchedLength = result.length
    let rawLength = resultWithoutRestitch.length
    let directRestitchedLength = MARelplot.restitch(resultWithoutRestitch).length

    assertEqual(restitchedLength == directRestitchedLength, true)
    assertEqual(restitchedLength < rawLength/100, true)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 2*0.2+1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.3, -4.3*2+1), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, -5), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 11), res, false)
  }

  test_MARelplot_restitch_circle() {
    // plus(pow(x,2), pow(y,2)) = 1
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,2), pow(y,2)) = 1"))
    let res = 0.03

    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    let resultWithoutRestitch = []
    let mc = new MAMathContext()
    MARelplot._render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, mc, res, resultWithoutRestitch)

    let restitchedLength = result.length
    let rawLength = resultWithoutRestitch.length
    let directRestitchedLength = MARelplot.restitch(resultWithoutRestitch).length

    // Losing too many segments makes the circle visibly boxy
    assertEqual(restitchedLength >= 0.75*rawLength, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
  }

  test_MARelplot_render_yEqualsX() {
    // y = x
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = x"))

    let res = 1/80
    MARelplot.render(formulaFn, new MAInterval(-5, 5), new MAInterval(-5, 5), 0, 1/80, result)

    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res)
    assertListVisuallyContainsPoint(result, new MAPoint(3.0001, 3.0001), res)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, -3), res)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -5), res)
    assertListVisuallyContainsPoint(result, new MAPoint(4.9, 4.9), res)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 6), res, false) // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -6), res, false) // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(3, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3.2, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3.03, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3.03), res, false)
  }

  test_MARelplot_render_powyy_equals_powxx() {
    // pow(y,y) = pow(x,x)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("pow(y,y) = pow(x,x)"))
    let xInterval = new MAInterval(-0.1, 3.6)
    let yInterval = new MAInterval(-0.1, 3.6)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertEqual(result.filter(x => x instanceof MABox).length, 0)
    // Need to perform checks this precise more zoomed in (see next test)
    //assertListVisuallyContainsPoint(result, new MAPoint(0.3807, 0.3670), res, false)
    //assertListVisuallyContainsPoint(result, new MAPoint(0.368, 0.388), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.388), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.5, 3.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.25), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.25, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.37, 0.37), res, true)
  }

  test_MARelplot_render_powyy_equals_powxx_preciseCheck() {
    // pow(y,y) = pow(x,x)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("pow(y,y) = pow(x,x)"))
    let xInterval = new MAInterval(0, 0.56)
    let yInterval = new MAInterval(0, 0.56)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertEqual(result.filter(x => x instanceof MABox).length, 0)
    assertListVisuallyContainsPoint(result, new MAPoint(0.3807, 0.3670), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.368, 0.388), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.388), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    //assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    //assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    //assertListVisuallyContainsPoint(result, new MAPoint(3.5, 3.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.25), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.25, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.37, 0.37), res, true)
  }

  test_MARelplot_render_y_equals_powxx() {
    // y = pow(x,x)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = pow(x,x)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**0.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**0.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**2), res, true)

    // Though technically a solution to this formula, it's a single point and relplot does not find these point solutions when raising a negative number to a negative integer power
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2+0.1, 2**2), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**5), res, false)
  }

  test_MARelplot_render_y_equals_powxx_smallRanges() {
    // y = pow(x,x)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = pow(x,x)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-5, 5), new MAInterval(-5, 5), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**0.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**0.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**2), res, true)

    // Though technically a solution to this formula, it's a single point and relplot does not find these point solutions when raising a negative number to a negative integer power
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2+0.1, 2**2), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**5), res, false)
  }

  test_MARelplot_render_y_equals_powxx_largeRanges() {
    // y = pow(x,x)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = pow(x,x)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-100, 100), new MAInterval(-100, 100), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**0.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**0.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**2), res, true)

    // Though technically a solution to this formula, it's a single point and relplot does not find these point solutions when raising a negative number to a negative integer power
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2+0.1, 2**2), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**5), res, false)
  }

  test_MARelplot_render_y_equals_powx3() {
    // y = pow(x,3)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = pow(x,3)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-0.1, (-0.1)**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, (-0.2)**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, (-0.5)**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, (-2)**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2+0.1, 2**3), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**3), res, false)
  }

  test_MARelplot_render_y_equals_powx3_usingTimes() {
    // y = pow(x,3)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = times(x,times(x,x))"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-0.1, (-0.1)**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, (-0.2)**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, (-0.5)**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, (-2)**3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2+0.1, 2**3), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**3), res, false)
  }

  test_MARelplot_render_y_equals_powx3point1() {
    // y = pow(x,3.1)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = pow(x,3.1)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**3.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**3.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**3.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**3.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-0.1, (-0.1)**3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2+0.1, 2**3.1), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**3.1), res, false)
  }

  test_MARelplot_render_y_equals_powx2() {
    // y = pow(x,2)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = pow(x,2)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.1, 0.1**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, 0.2**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 2**2), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.1+2**2), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**2), res, false)
  }

  test_MARelplot_render_y_equals_powx2_usingTimes() {
    // y = pow(x,2)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = times(x,x)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.1, 0.1**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, 0.2**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5**2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 2**2), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.1+2**2), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**2), res, false)
  }

  test_MARelplot_render_y_equals_powx2point1() {
    // y = pow(x,2.1)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = pow(x,2.1)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.1**2.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0.2**2.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5**2.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2**2.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-0.1, (-0.1)**3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.3+2**2.1), res, false)
    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5**2.1), res, false)
  }

  test_MARelplot_render_powxy_equals_powxxxxxx() {
    // pow(x,y) = pow(x,pow(x,pow(x,pow(x,pow(x,x)))))
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("pow(x,y)=pow(x,pow(x,pow(x,pow(x,pow(x,x)))))"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    // Vertical line at x=1
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 2.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 5.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -5), res, true)

    // Curvy portion
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.25, Math.log(0.25**0.25**0.25**0.25**0.25**0.25) / Math.log(0.25)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, Math.log(0.5**0.5**0.5**0.5**0.5**0.5) / Math.log(0.5)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, Math.log(1.5**1.5**1.5**1.5**1.5**1.5) / Math.log(1.5)), res, true)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(1.7, Math.log(1.7**1.7**1.7**1.7**1.7**1.7) / Math.log(1.7)), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
  }

  test_MARelplot_render_circle() {
    // plus(pow(x,2), pow(y,2)) = 1
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,2), pow(y,2)) = 1"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
  }

  test_MARelplot_render_circle_usingTimes() {
    // plus(times(x,x), times(y,y)) = 1
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(times(x,x), times(y,y)) = 1"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
  }

  test_MARelplot_render_circle_usingPolarCoordinates() {
    let formulaStr = "r = 1"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
  }

  test_MARelplot_render_circle_filled() {
    // plus(pow(x,2), pow(y,2)) < 1
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,2), pow(y,2)) < 1"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    // Inside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, 0.3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, true)

    // Outside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, false)
  }

  test_MARelplot_render_circle_filled_usingPolarCoordinates() {
    let formulaStr = "r < 1"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    // Inside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, 0.3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, true)

    // Outside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, false)
  }

  test_MARelplot_render_circle_filled_lte() {
    // plus(pow(x,2), pow(y,2)) <= 1
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,2), pow(y,2)) <= 1"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    // Inside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, 0.3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, true)

    // Outside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, false)
  }

  test_MARelplot_render_circle_filled_outside() {
    // plus(pow(x,2), pow(y,2)) > 1
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,2), pow(y,2)) > 1"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    // Inside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, false)

    // Outside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.3, -3.7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, true)
    // Out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(0, 15), res, false)
  }

  test_MARelplot_render_circle_filled_outside_usingPolarCoordinates() {
    let formulaStr = "r > 1"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    // Inside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, false)

    // Outside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.3, -3.7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, true)
    // Out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(0, 15), res, false)
  }

  test_MARelplot_render_circle_filled_outside_gte() {
    // plus(pow(x,2), pow(y,2)) >= 1
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,2), pow(y,2)) >= 1"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, true)

    // Inside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.2, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, false)

    // Outside the circle
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.3, -3.7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, true)
    // Out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(0, 15), res, false)
  }

  test_MARelplot_render_powx4_plus_powy4_equals1() {
    // plus(pow(x,4), pow(y,4)) = 1
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("plus(pow(x,4), pow(y,4)) = 1"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0.8, Math.sqrt(Math.sqrt(1-(0.8**4)))), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.8, Math.sqrt(Math.sqrt(1-(0.8**4)))), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.8, -Math.sqrt(Math.sqrt(1-(0.8**4)))), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.8, -Math.sqrt(Math.sqrt(1-(0.8**4)))), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0.6, Math.sqrt(Math.sqrt(1-(0.6**4)))), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.6, Math.sqrt(Math.sqrt(1-(0.6**4)))), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.6, -Math.sqrt(Math.sqrt(1-(0.6**4)))), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.6, -Math.sqrt(Math.sqrt(1-(0.6**4)))), res, true)

    // Doesn't contain these points on a normal circle
    // 45 degrees: x and y value are equal so these two lines are equivalent
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.sin(Math.PI/4)), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.cos(Math.PI/4), Math.cos(Math.PI/4)), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.75, 0.83), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
  }

  test_MARelplot_render_y_equals_powx2() {
    // y = pow(x,2)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = pow(x,2)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 2.5*2.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.5, 2.5*2.5), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 25), res, false)
  }

  test_MARelplot_render_y_equals_powx2_usingTimes() {
    // y = times(x,x)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("y = times(x,x)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 2.5*2.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.5, 2.5*2.5), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 25), res, false)
  }

  test_MARelplot_render_x_equals_powy2() {
    // x = pow(y,2)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("x = pow(y,2)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5*2.5, 2.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5*2.5, -2.5), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.3, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.6, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.8, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(25, 5), res, false)
  }

  test_MARelplot_render_x_equals_powy2_usingTimes() {
    // x = pow(y,2)
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS("x = times(y,y)"))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5*2.5, 2.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5*2.5, -2.5), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.3, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.6, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.8, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(25, 5), res, false)
  }

  test_MARelplot_render_y_greaterThan_powx2() {
    let formulaStr = "y > pow(x,2)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)


    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 2.5*2.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.5, 2.5*2.5), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 25), res, false)
  }

  test_MARelplot_render_y_lessThan_powx2() {
    let formulaStr = "y < pow(x,2)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)


    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 2.5*2.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.5, 2.5*2.5), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(9, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9.2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9.2, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9.2, -4), res, true)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 25), res, false)
  }

  test_MARelplot_render_y_gte_ceilx() {
    let formulaStr = "y >= ceil(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let res = 0.03
    MARelplot.render(formulaFn, new MAInterval(-12, 12), new MAInterval(-9, 9), 0, res, result)


    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 3), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, true)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(10, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, -3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(2, 25), res, false)
  }

  test_MARelplot_render_y_equals_floorx() {
    let formulaStr = "y = floor(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.1, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.5, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.6, 3), res, true)

    // These points are not valid solutions to the formula but some graphing
    // calculators (including relplot and graphtoy) show them
    // relplot-js has fixed this
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.9), res, false)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(11, 11), res, false)
  }

  test_MARelplot_render_y_equals_x_minus_floorx() {
    let formulaStr = "y = x-floor(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(9, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(9, 1), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-5.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(9.5, 0.5), res, true)


    // These points are not valid solutions to the formula but some graphing
    // calculators show them
    // relplot-js does not show them
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(9, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0.9), res, false)
  }

  test_MARelplot_render_y_equals_floor_x_minus_floorx() {
    let formulaStr = "y = floor(x-floor(x))"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-9, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 0), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 3.2), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, -3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, -1), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, 0), res, false)
  }

  test_MARelplot_render_y_equals_ceil_x_minus_floorx() {
    let formulaStr = "y = ceil(x-floor(x))"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-9.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8.05, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5.2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.05, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5.03, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7.02, 1), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 3.2), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, -3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, -1), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, 1), res, false)
  }

  test_MARelplot_render_y_equals_floor_x_mod_2() {
    let formulaStr = "y = mod(floor(x), 2)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-9.1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5.6, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.7, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7.1, 1), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 3.2), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, -3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, -1), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(12.5, 0), res, false)
  }

  test_MARelplot_render_y_equals_ceilx_minus_1() {
    let formulaStr = "y = ceil(x-1)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.01, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.1, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.5, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.6, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 4), res, true)

    // These points are not valid solutions to the formula but some graphing
    // calculators (including relplot and graphtoy) show them
    // relplot-js has fixed this
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.9), res, false)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(11, 11), res, false)
  }

  test_MARelplot_render_y_equals_truncx() {
    let formulaStr = "y = trunc(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.1, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.5, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.6, 3), res, true)

    // Vertical line segments are not part of the graph
    // These points are not valid solutions to the formula but some graphing
    // calculators (including relplot and graphtoy) show them
    // relplot-js has been fixed to not show them
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2.9), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -0.5), res, false)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -3), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(11, 11), res, false)
  }

  test_MARelplot_render_y_equals_min_4_x() {
    let formulaStr = "y = min(4, x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, -6.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 4), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -3), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 3.5), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(14, 4), res, false)
  }

  test_MARelplot_render_y_equals_max_4_x() {
    let formulaStr = "y = max(4, x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.5, 4.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 6), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 8), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 7), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, -3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 3.5), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(-14, 4), res, false)
  }

  test_MARelplot_render_y_equals_2xplus1() {
    let formulaStr = "y = plus(times(2,x),1)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 2*0.2+1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.3, -4.3*2+1), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, -5), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 11), res, false)
  }

  test_MARelplot_render_y_lte_2xplus1() {
    let formulaStr = "y <= plus(times(2,x),1)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, 2*0.2+1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.3, -4.3*2+1), res, true)

    // Above the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // Below the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, -5), res, true)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, 11), res, false)
  }

  test_MARelplot_render_y_equals_negx() {
    let formulaStr = "y = neg(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, -1.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 5), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(11, -11), res, false)
  }

  test_MARelplot_render_y_equals_signx() {
    let formulaStr = "y = sign(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, -1), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, 1), res, false)
  }

  test_MARelplot_render_y_equals_absx() {
    let formulaStr = "y = abs(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.2, 1.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, 1.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(-11, 11), res, false)
  }

  test_MARelplot_render_y_equals_expx() {
    let formulaStr = "y = exp(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, Math.E), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, Math.exp(2)), res, true)

    // y = effectively (but not exactly) 0 for these x values
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-7.2, 0), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, Math.exp(5)), res, false)
  }

  test_MARelplot_render_y_equals_e_to_x() {
    let formulaStr = "y = e^x"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, Math.E), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, Math.exp(2)), res, true)

    // y = effectively (but not exactly) 0 for these x values
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-7.2, 0), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(5, Math.exp(5)), res, false)
  }

  test_MARelplot_render_y_equals_lnexpx() {
    let formulaStr = "y = ln(exp(x))"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, 1.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -5), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(-11, -11), res, false)
  }

  test_MARelplot_render_y_equals_explnx() {
    let formulaStr = "y = exp(ln(x))"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, 1.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, true)

    // No values for x < 0
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -5), res, false)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(11, 11), res, false)
  }

  test_MARelplot_render_y_equals_lnx() {
    let formulaStr = "y = ln(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, Math.log(3)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11, Math.log(11)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.17, Math.log(0.17)), res, true)

    // Effectively goes to -Infinity at x=0
    assertListVisuallyContainsPoint(result, new MAPoint(0, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -6), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -8), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(11, 11), res, false)
  }

  test_MARelplot_render_y_equals_logx() {
    let formulaStr = "y = log(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, Math.log(3)/Math.log(10)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11, Math.log(11)/Math.log(10)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.17, Math.log(0.17)/Math.log(10)), res, true)

    // Effectively goes to -Infinity at x=0
    assertListVisuallyContainsPoint(result, new MAPoint(0, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -6), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(11, 11), res, false)
  }

  test_MARelplot_render_y_equals_sqrtx() {
    let formulaStr = "y = sqrt(x)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, Math.sqrt(3)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11, Math.sqrt(11)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.17, Math.sqrt(0.17)), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, Math.sqrt(13)), res, false)
  }

  test_MARelplot_render_y_equals_cosx() {
    let formulaStr = "y = cos(x)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.PI, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3*Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+Math.PI, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+3*Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+Math.PI, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+3*Math.PI/2, 0), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, Math.cos(13)), res, false)
  }

  test_MARelplot_render_y_equals_tanx() {
    let formulaStr = "y = tan(x)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    let x = Math.PI/2-0.2
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x, Math.tan(-x)), res, true)
    x = 0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x, Math.tan(-x)), res, true)
    x = 0
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.tan(x)), res, true)
    x = 1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x, Math.tan(-x)), res, true)

    // tan repeats every PI
    x = Math.PI/2-0.2
    assertListVisuallyContainsPoint(result, new MAPoint(x+Math.PI, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x+Math.PI, Math.tan(-x)), res, true)
    x = 0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x+Math.PI, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x+Math.PI, Math.tan(-x)), res, true)
    x = 0
    assertListVisuallyContainsPoint(result, new MAPoint(x+Math.PI, Math.tan(x)), res, true)
    x = 1
    assertListVisuallyContainsPoint(result, new MAPoint(x+Math.PI, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x+Math.PI, Math.tan(-x)), res, true)

    x = Math.PI/2-0.2
    assertListVisuallyContainsPoint(result, new MAPoint(x-Math.PI, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x-Math.PI, Math.tan(-x)), res, true)
    x = 0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x-Math.PI, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x-Math.PI, Math.tan(-x)), res, true)
    x = 0
    assertListVisuallyContainsPoint(result, new MAPoint(x-Math.PI, Math.tan(x)), res, true)
    x = 1
    assertListVisuallyContainsPoint(result, new MAPoint(x-Math.PI, Math.tan(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-x-Math.PI, Math.tan(-x)), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_y_equals_3sinx_over_x() {
    let formulaStr = "y = 3*sin(x)/x"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    let x = -1
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = -0.8
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = -0.5
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = -0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 0.5
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 0.8
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 1
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = -10
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = -10.2
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = -4
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = -2.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = -1.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 10
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 10.2
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 4
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 2.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)
    x = 1.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, 3*Math.sin(x)/x), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -3.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_y_equals_asinx() {
    let formulaStr = "y = asin(x)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    let x = -1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.asin(x)), res, true)
    x = -0.8
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.asin(x)), res, true)
    x = -0.5
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.asin(x)), res, true)
    x = -0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.asin(x)), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    x = 0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.asin(x)), res, true)
    x = 0.5
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.asin(x)), res, true)
    x = 0.8
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.asin(x)), res, true)
    x = 1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.asin(x)), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_y_equals_acosx() {
    let formulaStr = "y = acos(x)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    let x = -1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)
    x = -0.8
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)
    x = -0.5
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)
    x = -0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)
    x = 0
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)
    x = 0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)
    x = 0.5
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)
    x = 0.8
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)
    x = 1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.acos(x)), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_y_equals_atanx() {
    let formulaStr = "y = atan(x)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    let x = -1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = -0.8
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = -0.5
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = -0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = 0
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = 0.1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = 0.5
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = 0.8
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = 1
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = 10
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)
    x = -10
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // Out of bounds
    x = 13
    assertListVisuallyContainsPoint(result, new MAPoint(x, Math.atan(x)), res, false)
  }

  test_MARelplot_render_y_equals_sin_x_plus_pi_over_2() {
    let formulaStr = "y = sin(plus(x, pi/2))" // equivalent to y=cos(x)
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.PI, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3*Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+Math.PI, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+3*Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+Math.PI/2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+Math.PI, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+3*Math.PI/2, 0), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, Math.cos(13)), res, false)
  }

  test_MARelplot_render_y_equals_sin_x() {
    let formulaStr = "y = sin(x)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.PI/2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(Math.PI, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3*Math.PI/2, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+Math.PI/2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+Math.PI, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2*Math.PI+3*Math.PI/2, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+Math.PI/2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+Math.PI, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2*Math.PI+3*Math.PI/2, -1), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, Math.sin(13)), res, false)
  }

  test_MARelplot_render_y_equals_recipx() {
    let formulaStr = "y = recip(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 1/10), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -1/10), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(1/10, 10), res, false)
  }

  test_MARelplot_render_y_equals_x_over_x() {
    let formulaStr = "y = x/x"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(-9.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5.2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.4, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.6, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7.2, 1), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.9), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.9), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -3.6), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, 1), res, false)
  }

  test_MARelplot_render_y_equals_powxneg1() {
    let formulaStr = "y = pow(x, -1)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 1/10), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -1/10), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(1/10, 10), res, false)
  }

  test_MARelplot_render_powxy_equals_powyx() {
    let formulaStr = "pow(x,y) = pow(y,x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // The line y=x for x>=0
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.2, 4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, true)

    // Not y=x for x<0
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, -3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.2, -4.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -5), res, false)

    // The curve
    assertListVisuallyContainsPoint(result, new MAPoint(1.45, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 1.45), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.71, 2.71), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 1.75), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.75, 5), res, true)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, 13), res, false)
  }

  test_MARelplot_render_y_equals_mod_x_2() {
    let formulaStr = "y = x % 2"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, 1.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.5, 1.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 2), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 1.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 2), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
  }

  test_MARelplot_render_y_equals_mod_4_x() {
    let formulaStr = "y = 4 % x"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Vertical line segment is not a valid solution for the formula
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -0.8), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -3), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 0), res, true)

    // Vertical line segment is not a valid solution for the formula
    assertListVisuallyContainsPoint(result, new MAPoint(4, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 3), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(4, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 4), res, true)

    // Using the floored division definition
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0), res, true)

    // Vertical line segment is not a valid solution for the formula
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -1), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, 0), res, true)

    // Vertical line segment is not a valid solution for the formula
    assertListVisuallyContainsPoint(result, new MAPoint(-4, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, -2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, -3), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(-4, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -6), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -4), res, false)
  }

  test_MARelplot_render_y_equals_cellnoise_x() {
    let formulaStr = "y = cellnoise(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(1.0, 0.226367589), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, 0.226367589), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.3, 0.226367589), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.4, 0.226367589), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, 0.226367589), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.9, 0.226367589), res, true)

    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.09987029831387809), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.5, 0.703196765087358), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, 0.22636758983749142), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 0.7063706416418708), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.5, 0.25717555504692147), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.5, 0.4142366674296178), res, true)


    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -4), res, false)
  }

  test_MARelplot_render_y_equals_noise_x() {
    let formulaStr = "y = noise(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(1.0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.1, -0.11487556438544302), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.4, 0.41037381258869304), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.5, 0.17380025940337218), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.6, -0.3893447104600595), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -4), res, false)
  }

  test_MARelplot_render_y_equals_voronoi_x() {
    let formulaStr = "y = voronoi(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.2817883573), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0.2263675898), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.2, 0.0263675898), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0.2571755550), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.1, 0.19680323491264196), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.1, 0.49351491569390393), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -4), res, false)
  }

  test_MARelplot_render_y_equals_clamp_x_negative1_1() {
    let formulaStr = "y = clamp(x, -1, 1)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(-7, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.2, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.3, -0.3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.3, 0.3), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -4), res, false)
  }

  test_MARelplot_render_y_equals_saturate_x() {
    let formulaStr = "y = saturate(x)"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(-7, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.3, 0.3), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -4), res, false)
  }

  test_MARelplot_render_y_equals_smoothstep_sin() {
    let formulaStr = "y = 4+4*smoothstep(0,0.7,sin(x))"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)


    // Flat upper portions
    assertListVisuallyContainsPoint(result, new MAPoint(-11.2, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-10.6, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5.3, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.18, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.1, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.11, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7.32, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8.3, 8), res, true)

    // Flat lower portions
    assertListVisuallyContainsPoint(result, new MAPoint(-9.18, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-7.5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5.5, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11.5, 4), res, true)

    // Diagonal portions
    assertListVisuallyContainsPoint(result, new MAPoint(-10, 7.48), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9.66, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5.8, 7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.48, 6), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.22, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.48, 7), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.66, 7), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-10, -4), res, false)
  }

  // Before fixing a parser bug, one of the segments in a batman curve drew anellipse instead of two partial segments. I added parens here to graph the ellipse on purpose so I can assert that these same points do not show up in the graph of the correctly parsed formula in the next test
  test_MARelplot_render_batman_ellipse() {
    let formulaStr = "(x^2+(4*y)^2-100*sqrt(abs((7-abs(2*y-1)))/(7-abs(2*y-1))))=0"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(0, 2.48), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2.48), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 2.15), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 2.15), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -2.15), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, -2.15), res, true)

    // On both curves
    assertListVisuallyContainsPoint(result, new MAPoint(-10, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 0), res, true)


    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(8, -3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 3), res, false)

    // Not on either curve
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(6, -4), res, false)
  }

  test_MARelplot_render_batman_partial_ellipse() {
    let formulaStr = "(x^2+4*y^2-100*sqrt(abs((7-abs(2*y-1)))/(7-abs(2*y-1))))=0"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 3), res, true)

    // On both curves
    assertListVisuallyContainsPoint(result, new MAPoint(-10, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 0), res, true)


    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2.48), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2.48), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 2.15), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 2.15), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -2.15), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, -2.15), res, false)

    // Not on either curve
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(6, -4), res, false)
  }

  test_MARelplot_render_batman_partial_ellipse_with_parens() {
    let formulaStr = "(x^2+4*(y^2)-100*sqrt(abs((7-abs(2*y-1)))/(7-abs(2*y-1))))=0"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(-6, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 3), res, true)

    // On both curves
    assertListVisuallyContainsPoint(result, new MAPoint(-10, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 0), res, true)


    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2.48), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2.48), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 2.15), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 2.15), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -2.15), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(5, -2.15), res, false)

    // Not on either curve
    assertListVisuallyContainsPoint(result, new MAPoint(-6, -4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(6, -4), res, false)
  }

  // Rendering polar coordinate formulas

  test_MARelplot_render_r_equals_cos_theta() {
    let formulaStr = "r = cos(theta)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.78, 0.39), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.87, -0.34), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, -0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.19, -0.39), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_sin_theta() {
    let formulaStr = "r = sin(theta)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.39, 0.78), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.34, 0.87), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.39, 0.19), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_sin_theta_shifted_view() {
    let formulaStr = "r = sin(theta)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-5, 6.58)
    let yInterval = new MAInterval(-3.8, 4.86)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.34, 0.87), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.34, 0.87), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.39, 0.19), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
    // These points were a visual glitch caused by a bug in atan2
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.4, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.4, 0), res, false)
  }

  test_MARelplot_render_r_equals_theta() {
    let formulaStr = "r = theta"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.41), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1.55), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.14, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.64, -3.04), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -4.71), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.91, -2.97), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.28, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 7.85), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8.99, 2.04), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(9.93, -6.65), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11.06, 7.05), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_theta_shifted_view() {
    let formulaStr = "r = theta"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-10.53, 13.4)
    let yInterval = new MAInterval(-8.32, 9.59)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.41), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1.55), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.14, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.64, -3.04), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -4.71), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.91, -2.97), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.28, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 7.85), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8.99, 2.04), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(9.93, -6.65), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11.06, 7.05), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_neg_theta() {
    let formulaStr = "r = neg(theta)"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, -0.41), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1.55), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.14, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.64, 3.04), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4.71), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.91, 2.97), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.28, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -7.85), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8.99, -2.04), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-11.06, -7.05), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9.93, 6.65), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_4cos_4theta() {
    let formulaStr = "r = times(4, cos(times(4, theta)))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Petal 1
    assertListVisuallyContainsPoint(result, new MAPoint(3.02, 0.53), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.02, -0.53), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 0), res, true)

    // Petal 2
    assertListVisuallyContainsPoint(result, new MAPoint(2.69, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2.69), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.82, 2.82), res, true)

    // Petal 3
    assertListVisuallyContainsPoint(result, new MAPoint(0.53, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.53, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)

    // Petal 4
    assertListVisuallyContainsPoint(result, new MAPoint(-2.69, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 2.69), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.82, 2.82), res, true)

    // Petal 5
    assertListVisuallyContainsPoint(result, new MAPoint(-3.02, 0.53), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.02, -0.53), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, 0), res, true)

    // Petal 6
    assertListVisuallyContainsPoint(result, new MAPoint(-2.69, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2.69), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.82, -2.82), res, true)

    // Petal 7
    assertListVisuallyContainsPoint(result, new MAPoint(0.53, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.53, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -4), res, true)

    // Petal 8
    assertListVisuallyContainsPoint(result, new MAPoint(2.69, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, -2.69), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.82, -2.82), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_4cos_3theta() {
    let formulaStr = "r = times(4, cos(times(3, theta)))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Petal 1
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0.71), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, -0.71), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 0), res, true)

    // Petal 2
    assertListVisuallyContainsPoint(result, new MAPoint(-0.95, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.25, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.07, 3.43), res, true)

    // Petal 3
    assertListVisuallyContainsPoint(result, new MAPoint(-0.95, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.25, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.07, -3.43), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_4sin_2theta() {
    let formulaStr = "r = times(4, sin(times(2, theta)))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Petal 1
    assertListVisuallyContainsPoint(result, new MAPoint(2.98, 1.69), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.69, 2.98), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.82, 2.82), res, true)

    // Petal 2
    assertListVisuallyContainsPoint(result, new MAPoint(-2.98, 1.69), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.69, 2.98), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.82, 2.82), res, true)

    // Petal 3
    assertListVisuallyContainsPoint(result, new MAPoint(-2.98, -1.69), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.69, -2.98), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.82, -2.82), res, true)

    // Petal 4
    assertListVisuallyContainsPoint(result, new MAPoint(2.98, -1.69), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.69, -2.98), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.82, -2.82), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_4sin_5theta() {
    let formulaStr = "r = times(4, sin(times(5, theta)))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Petal 1
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0.53), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1.39), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.78, 1.26), res, true)

    // Petal 2
    assertListVisuallyContainsPoint(result, new MAPoint(0.42, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.42, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)

    // Petal 3
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 0.53), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 1.39), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.78, 1.26), res, true)

    // Petal 4
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -3.21), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.37, -3.24), res, true)

    // Petal 5
    assertListVisuallyContainsPoint(result, new MAPoint(2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, -3.21), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.37, -3.24), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_squared_equals_sin_2theta() {
    let formulaStr = "pow(r,2) = sin(times(2, theta))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Petal 1
    assertListVisuallyContainsPoint(result, new MAPoint(0.799, 0.397), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.397, 0.799), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.703, 0.703), res, true)

    // Petal 2
    assertListVisuallyContainsPoint(result, new MAPoint(-0.799, -0.397), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.397, -0.799), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.703, -0.703), res, true)

    // Petals that are not there
    assertListVisuallyContainsPoint(result, new MAPoint(-0.799, 0.397), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.397, 0.799), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.703, 0.703), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(0.799, -0.397), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.397, -0.799), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.703, -0.703), res, false)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_squared_equals_cos_2theta() {
    let formulaStr = "pow(r,2) = cos(times(2, theta))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Petal 1
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.60, 0.34), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.60, -0.34), res, true)

    // Petal 2
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.60, 0.34), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.60, -0.34), res, true)

    // Petals that are not there
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.34, 0.60), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.34, 0.60), res, false)

    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.34, -0.60), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.34, -0.60), res, false)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_1_minus_cos_theta_times_sin3theta() {
    let formulaStr = "r=plus(1, neg(times(cos(theta), sin(times(3,theta)))))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // Quadrant I
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.108, 0.059), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.466, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.203, 1.132), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)

    // Quadrant II
    assertListVisuallyContainsPoint(result, new MAPoint(-0.19, 0.80), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.80, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.69, 0.81), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.60, 0.40), res, true)


    // Quadrant III
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.108, -0.059), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.466, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.203, -1.132), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -1), res, true)

    // Quadrant IV
    assertListVisuallyContainsPoint(result, new MAPoint(0.19, -0.80), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.80, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.69, -0.81), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.60, -0.40), res, true)


    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_polar_line() {
    let formulaStr = "r=times(4, recip(plus(sin(theta), neg(cos(theta)))))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the line
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, -4), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_polar_parabola() {
    let formulaStr = "r=recip(plus(1,cos(theta)))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the line
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 3.31), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-12, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -3.31), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-12, -5), res, true)

    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_1_plus_3sin_theta() {
    let formulaStr = "r = plus(1, times(3, sin(theta)))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    // Bit sticking down below x-axis
    assertListVisuallyContainsPoint(result, new MAPoint(-0.59, -0.08), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.59, -0.08), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    // Inner loop
    assertListVisuallyContainsPoint(result, new MAPoint(0.83, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.83, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)
    // Outer loop
    assertListVisuallyContainsPoint(result, new MAPoint(2.24, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.24, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)


    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_1_plus_sin_theta() {
    let formulaStr = "r = plus(1, sin(theta))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    // Bit sticking down below x-axis
    assertListVisuallyContainsPoint(result, new MAPoint(-0.408, -0.251), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.408, -0.251), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    // Outer loop
    assertListVisuallyContainsPoint(result, new MAPoint(-1.273, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.273, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)


    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  test_MARelplot_render_r_equals_1_plus_neg_sin_theta() {
    let formulaStr = "r = plus(1, times(-1, sin(theta)))"
    let result = []
    let formulaFn = MAUtils.convertJSToFn(MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // On the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    // Bit sticking above the x-axis
    assertListVisuallyContainsPoint(result, new MAPoint(-0.408, 0.251), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.408, 0.251), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    // Outer loop
    assertListVisuallyContainsPoint(result, new MAPoint(-1.273, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.273, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, true)


    // Not on the curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -4), res, false)
  }

  // Rendering some crazy stuff

  test_MARelplot_render_triangle_wave() {
    let formulaStr = "y = (mod(floor(x),2))*(x-floor(x))+(1-mod(floor(x),2))*(-x-floor(-x)) + (1-mod(floor(x),2))*(1-ceil(x-floor(x)))"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    assertListVisuallyContainsPoint(result, new MAPoint(-10, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-7, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(9, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-10.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-8.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-7.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(9.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(8.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(7.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, 0.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.5, 0.5), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.5), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0.1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 7), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 5), res, false)
  }

  test_MARelplot_render_concentric_circles() {
    let formulaStr = "0 = (x^2+y^2+25)%40"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // First circle
    assertListVisuallyContainsPoint(result, new MAPoint(3.87, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.87, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3.87), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -3.87), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.31, 1.98), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.31, 1.98), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3.31, -1.98), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3.31, -1.98), res, true)

    // Second circle
    assertListVisuallyContainsPoint(result, new MAPoint(7.41, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-7.41, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 7.41), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -7.41), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.78, 2.99), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.78, 2.99), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.78, -2.99), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.78, -2.99), res, true)

    // Third circle
    assertListVisuallyContainsPoint(result, new MAPoint(9.75, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-9.75, 0), res, true)
    // Out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(0, 9.75), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -9.75), res, false)

    // A few other points
    assertListVisuallyContainsPoint(result, new MAPoint(11.62, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-11.62, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(10.49, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-10.49, 5), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 7), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 5), res, false)
  }

  test_MARelplot_render_concentric_hearts() {
    let formulaStr = "0=((x^2+(y-(x^2)^(1/3))^2)+21) % 25"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)

    // First heart
    assertListVisuallyContainsPoint(result, new MAPoint(0, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.57, 2.58), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.57, 2.58), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 1.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 1.5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.5, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.77, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.77, -1), res, true)

    // Second heart
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5.41), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -5.33), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.95, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.95, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4, -1), res, true)

    // Third heart
    assertListVisuallyContainsPoint(result, new MAPoint(0, 7.45), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, -7.25), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.97, 6), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.97, 6), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.46, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-6.46, 0), res, true)

    // A few other points
    assertListVisuallyContainsPoint(result, new MAPoint(7.95, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-7.95, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(11, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-11, 2), res, true)

    // Not on curve
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 7), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 1), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 2), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 4), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 5), res, false)
  }

  test_MARelplot_render_crazyLotus() {
    // Andrew Myers lists this shape on the relplot website
    // ((xy(x-y)(x+y)(x^2+y^2-4))^2 - 1) < 1
    // aka
    // plus(pow(times(times(x, times(y, times(plus(x, neg(y)),plus(x,y)))), plus(plus(pow(x,2),pow(y,2)), neg(4))), 2), neg(1)) < 1
    let formulaStr = "plus(pow(times(times(x, times(y, times(plus(x, neg(y)),plus(x,y)))), plus(plus(pow(x,2),pow(y,2)), neg(4))), 2), neg(1)) < 1"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)


    // Line y=x
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.2, 4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.2, -4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -5), res, true)

    // Line y=-x
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.2, -4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.2, 4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 5), res, true)

    // Line x=0
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5.6), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 6.1), res, true)

    // Line y=0
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5.6, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.1, 0), res, true)

    // Lotus - inner filled portion
    assertListVisuallyContainsPoint(result, new MAPoint(0.3, 0.67), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.3, -0.8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.7, -0.53), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.9, 0.47), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.57, -0.8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Lotus - outer filled portion
    assertListVisuallyContainsPoint(result, new MAPoint(0.7, 1.84), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.58, -1.21), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.25, -1.95), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.26, -1.58), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.95, -0.33), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.95, 0.33), res, true)

    // Lotus - holes
    assertListVisuallyContainsPoint(result, new MAPoint(0.57, 1.47), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, 0.62), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1.52, -0.44), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.54, -1.42), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.73, -1.47), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.5, -0.62), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.36, 0.49), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.62, 1.58), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, 13), res, false)
  }

  test_MARelplot_render_crazyLotus_usingParser() {
    // Andrew Myers lists this shape on the relplot website
    // ((xy(x-y)(x+y)(x^2+y^2-4))^2 - 1) < 1
    // aka
    // plus(pow(times(times(x, times(y, times(plus(x, neg(y)),plus(x,y)))), plus(plus(pow(x,2),pow(y,2)), neg(4))), 2), neg(1)) < 1
    let formulaStr = "((x*y*(x-y)*(x+y)*(x^2+y^2-4))^2 - 1) < 1"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)


    // Line y=x
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.2, 4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, 5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.2, -4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, -5), res, true)

    // Line y=-x
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, -1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, -2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4.2, -4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-2, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-4.2, 4.2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 5), res, true)

    // Line x=0
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 1), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 5.6), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 6.1), res, true)

    // Line y=0
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(2, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(5.6, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(6.1, 0), res, true)

    // Lotus - inner filled portion
    assertListVisuallyContainsPoint(result, new MAPoint(0.3, 0.67), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.3, -0.8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.7, -0.53), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.9, 0.47), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.57, -0.8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)

    // Lotus - outer filled portion
    assertListVisuallyContainsPoint(result, new MAPoint(0.7, 1.84), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.58, -1.21), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.25, -1.95), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.26, -1.58), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.95, -0.33), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.95, 0.33), res, true)

    // Lotus - holes
    assertListVisuallyContainsPoint(result, new MAPoint(0.57, 1.47), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1.5, 0.62), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(1.52, -0.44), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(0.54, -1.42), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.73, -1.47), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.5, -0.62), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-1.36, 0.49), res, false)
    assertListVisuallyContainsPoint(result, new MAPoint(-0.62, 1.58), res, false)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(13, 13), res, false)
  }

  test_MARelplot_render_curlicue() {
    // Andrew Myers lists this shape on the relplot website
    // x^3+y^3=3xy
    // aka
    // plus(pow(x,3),pow(y,3)) = times(3,times(x,y))
    let formulaStr = "plus(pow(x,3),pow(y,3)) = times(3,times(x,y))"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 0, res, result)


    // Linear portion
    assertListVisuallyContainsPoint(result, new MAPoint(2, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, true)

    // Curlicue portion
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.15, 0.62), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.53, 1.21), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.49, 1.49), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.43, 0.8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0.37), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.38, 0.06), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, -0.72), res, true)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(-11, 10), res, false)
  }

  test_MARelplot_render_curlicue_with_t() {
    // Andrew Myers lists this shape on the relplot website
    // x^3+y^3=3xy
    // aka
    // plus(pow(x,3),pow(y,3)) = times(3,times(x,y))
    let formulaStr = "plus(pow(x,t),pow(y,t)) = times(t,times(x,y))"
    let result = []
    let formulaFn = new Function("x,y,t,mathContext", MAUtils.convertFormulaToJS(formulaStr))
    let xInterval = new MAInterval(-12, 12)
    let yInterval = new MAInterval(-9, 9)
    let res = (xInterval.ub-xInterval.lb)/800
    MARelplot.render(formulaFn, xInterval, yInterval, 3, res, result)


    // Linear portion
    assertListVisuallyContainsPoint(result, new MAPoint(2, -3), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(3, -4), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(4, -5), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-3, 2), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(-5, 4), res, true)

    // Curlicue portion
    assertListVisuallyContainsPoint(result, new MAPoint(0, 0), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.15, 0.62), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.53, 1.21), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.49, 1.49), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1.43, 0.8), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(1, 0.37), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.38, 0.06), res, true)
    assertListVisuallyContainsPoint(result, new MAPoint(0.2, -0.72), res, true)

    // out of bounds
    assertListVisuallyContainsPoint(result, new MAPoint(-11, 10), res, false)
  }


// MAFloatMath

  test_MAFloatMath_floatEquals() {
    assertEqual(MAFloatMath.floatEquals(0, 0), true)
    assertEqual(MAFloatMath.floatEquals(1, 0), false)
    assertEqual(MAFloatMath.floatEquals(0.001, 0), false)
    assertEqual(MAFloatMath.floatEquals(0.000000001, 0), true)
    assertEqual(MAFloatMath.floatEquals(0.0000001, 0), false)
    assertEqual(MAFloatMath.floatEquals(1.5, 1.6), false)
    assertEqual(MAFloatMath.floatEquals(1.5+0.1, 1.6), true)
    assertEqual(MAFloatMath.floatEquals(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY), true)
    assertEqual(MAFloatMath.floatEquals(Number.POSITIVE_INFINITY, 1/0), true)
    assertEqual(MAFloatMath.floatEquals(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY), false)
    assertEqual(MAFloatMath.floatEquals(-1/0, Number.NEGATIVE_INFINITY), true)
    assertEqual(MAFloatMath.floatEquals(Number.POSITIVE_INFINITY, 1.1), false)
  }

  test_MAFloatMath_floatNear() {
    assertEqual(MAFloatMath.floatNear(0, 0), true)
    assertEqual(MAFloatMath.floatNear(1, 0), false)
    assertEqual(MAFloatMath.floatNear(0.001, 0), false)
    assertEqual(MAFloatMath.floatNear(0.000000001, 0), true)
    assertEqual(MAFloatMath.floatNear(0.0000001, 0), true)
    assertEqual(MAFloatMath.floatNear(1.5, 1.6), false)
    assertEqual(MAFloatMath.floatNear(1.5+0.1, 1.6), true)
    assertEqual(MAFloatMath.floatNear(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY), true)
    assertEqual(MAFloatMath.floatNear(Number.POSITIVE_INFINITY, 1/0), true)
    assertEqual(MAFloatMath.floatNear(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY), false)
    assertEqual(MAFloatMath.floatNear(-1/0, Number.NEGATIVE_INFINITY), true)
    assertEqual(MAFloatMath.floatNear(Number.POSITIVE_INFINITY, 1.1), false)
  }

// MAPoint

  test_MAPoint_isNear() {
    let p = new MAPoint(0, 1)

    assertEqual(p.isNear(new MAPoint(1, 0)), false)
    assertEqual(p.isNear(new MAPoint(2, 2)), false)
    assertEqual(p.isNear(new MAPoint(0, 1)), true)
    assertEqual(p.isNear(new MAPoint(0, -1)), false)
    assertEqual(p.isNear(new MAPoint(-0, 1)), true)
    assertEqual(p.isNear(new MAPoint(0.001, 1)), false)
    assertEqual(p.isNear(new MAPoint(0, 1.001)), false)
    assertEqual(p.isNear(new MAPoint(0, 1.00001)), false)
    assertEqual(p.isNear(new MAPoint(0, 1.000001)), true)
    assertEqual(p.isNear(new MAPoint(0, 1.0000001)), true)
    assertEqual(p.isNear(new MAPoint(0.000001, 1)), false)
    assertEqual(p.isNear(new MAPoint(0.0000001, 1)), true)
  }

  test_MAPoint_isEqual() {
    let p = new MAPoint(0, 1)

    assertEqual(p.isEqual(new MAPoint(1, 0)), false)
    assertEqual(p.isEqual(new MAPoint(2, 2)), false)
    assertEqual(p.isEqual(new MAPoint(0, 1)), true)
    assertEqual(p.isEqual(new MAPoint(0, -1)), false)
    assertEqual(p.isEqual(new MAPoint(-0, 1)), true)
    assertEqual(p.isEqual(new MAPoint(0.001, 1)), false)
    assertEqual(p.isEqual(new MAPoint(0, 1.001)), false)
    assertEqual(p.isEqual(new MAPoint(0, 1.000001)), false)
    assertEqual(p.isEqual(new MAPoint(0, 1.00001)), false)
    assertEqual(p.isEqual(new MAPoint(0, 1.000001)), false)
    assertEqual(p.isEqual(new MAPoint(0, 1.0000001)), true)
    assertEqual(p.isEqual(new MAPoint(0.000001, 1)), false)
    assertEqual(p.isEqual(new MAPoint(0.0000001, 1)), false)
    assertEqual(p.isEqual(new MAPoint(0.00000001, 1)), true)
  }

// MAInterval

  test_MAInterval_empty() {
    let a = new MAInterval(0, 0)
    assertEqual(a.isEmpty, false)

    let b = MAInterval.empty()
    assertEqual(b.isEmpty, true)
  }

  test_MAInterval_isEqual() {
    let a = new MAInterval(0, 0)
    let b = MAInterval.empty()

    assertEqual(a.isEqual(b), false)
    assertEqual(b.isEqual(a), false)
    assertEqual(a.isEqual(a), true)
    assertEqual(b.isEqual(b), true)

    assertEqual(b.isEqual(MAInterval.empty()), true)
    assertEqual(MAInterval.empty().isEqual(b), true)

    a = new MAInterval(1, 2)
    assertEqual(a.isEqual(b), false)
    assertEqual(b.isEqual(a), false)
    assertEqual(a.isEqual(null), false)
    assertEqual(b.isEqual(null), false)

    assertEqual(a.isEqual(new MAInterval(1, 2)), true)
    assertEqual(a.isEqual(new MAInterval(1, 3)), false)
    assertEqual(a.isEqual(new MAInterval(2, 2)), false)
  }

// MALineSegment

  test_MALineSegment_containsPoint() {
    // vertical pointing up
    let line = new MALineSegment(new MAPoint(1, 2), new MAPoint(1, 4))
    assertEqual(line.containsPoint(new MAPoint(1, 2)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 3)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 3.1)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 4)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 5)), false) // above
    assertEqual(line.containsPoint(new MAPoint(1, 1)), false) // below
    assertEqual(line.containsPoint(new MAPoint(0, 3)), false) // to left
    assertEqual(line.containsPoint(new MAPoint(2, 3)), false) // to right

    // vertical pointing down
    line = new MALineSegment(new MAPoint(1, 4), new MAPoint(1, 2))
    assertEqual(line.containsPoint(new MAPoint(1, 2)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 3)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 3.1)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 4)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 5)), false) // above
    assertEqual(line.containsPoint(new MAPoint(1, 1)), false) // below
    assertEqual(line.containsPoint(new MAPoint(0, 3)), false) // to left
    assertEqual(line.containsPoint(new MAPoint(2, 3)), false) // to right

    // horizontal pointing left
    line = new MALineSegment(new MAPoint(4, 1), new MAPoint(2, 1))
    assertEqual(line.containsPoint(new MAPoint(2, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(3, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(3.1, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(4, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(5, 1)), false) // to right
    assertEqual(line.containsPoint(new MAPoint(1, 1)), false) // to left
    assertEqual(line.containsPoint(new MAPoint(3, 0)), false) // below
    assertEqual(line.containsPoint(new MAPoint(3, 2)), false) // above

    // horizontal pointing right
    line = new MALineSegment(new MAPoint(2, 1), new MAPoint(4, 1))
    assertEqual(line.containsPoint(new MAPoint(2, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(3, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(3.1, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(4, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(5, 1)), false) // to right
    assertEqual(line.containsPoint(new MAPoint(1, 1)), false) // to left
    assertEqual(line.containsPoint(new MAPoint(3, 0)), false) // below
    assertEqual(line.containsPoint(new MAPoint(3, 2)), false) // above

    // line pointing up to the right
    line = new MALineSegment(new MAPoint(1, 1), new MAPoint(3, 7)) // up 6, over 2
    assertEqual(line.containsPoint(new MAPoint(1, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(3, 7)), true)
    assertEqual(line.containsPoint(new MAPoint(2, 4)), true)
    assertEqual(line.containsPoint(new MAPoint(2, 5)), false) // above
    assertEqual(line.containsPoint(new MAPoint(2, 3)), false) // below
    assertEqual(line.containsPoint(new MAPoint(1, 4)), false) // to left
    assertEqual(line.containsPoint(new MAPoint(3, 4)), false) // to right
    assertEqual(line.containsPoint(new MAPoint(0, -2)), false) // beyond p1
    assertEqual(line.containsPoint(new MAPoint(4, 10)), false) // beyond p2

    // line pointing down to the left
    line = new MALineSegment(new MAPoint(3, 7), new MAPoint(1, 1)) // up 6, over 2
    assertEqual(line.containsPoint(new MAPoint(1, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(3, 7)), true)
    assertEqual(line.containsPoint(new MAPoint(2, 4)), true)
    assertEqual(line.containsPoint(new MAPoint(2, 5)), false) // above
    assertEqual(line.containsPoint(new MAPoint(2, 3)), false) // below
    assertEqual(line.containsPoint(new MAPoint(1, 4)), false) // to left
    assertEqual(line.containsPoint(new MAPoint(3, 4)), false) // to right
    assertEqual(line.containsPoint(new MAPoint(0, -2)), false) // beyond p2
    assertEqual(line.containsPoint(new MAPoint(4, 10)), false) // beyond p1

    // line pointing up to the left
    line = new MALineSegment(new MAPoint(3, 1), new MAPoint(1, 7)) // up 6, over -2
    assertEqual(line.containsPoint(new MAPoint(3, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 7)), true)
    assertEqual(line.containsPoint(new MAPoint(2, 4)), true)
    assertEqual(line.containsPoint(new MAPoint(2, 5)), false) // above
    assertEqual(line.containsPoint(new MAPoint(2, 3)), false) // below
    assertEqual(line.containsPoint(new MAPoint(1, 4)), false) // to left
    assertEqual(line.containsPoint(new MAPoint(3, 4)), false) // to right
    assertEqual(line.containsPoint(new MAPoint(4, -2)), false) // beyond p1
    assertEqual(line.containsPoint(new MAPoint(0, 10)), false) // beyond p2

    // line pointing down to the right
    line = new MALineSegment(new MAPoint(1, 7), new MAPoint(3, 1)) // up 6, over -2
    assertEqual(line.containsPoint(new MAPoint(3, 1)), true)
    assertEqual(line.containsPoint(new MAPoint(1, 7)), true)
    assertEqual(line.containsPoint(new MAPoint(2, 4)), true)
    assertEqual(line.containsPoint(new MAPoint(2, 5)), false) // above
    assertEqual(line.containsPoint(new MAPoint(2, 3)), false) // below
    assertEqual(line.containsPoint(new MAPoint(1, 4)), false) // to left
    assertEqual(line.containsPoint(new MAPoint(3, 4)), false) // to right
    assertEqual(line.containsPoint(new MAPoint(4, -2)), false) // beyond p2
    assertEqual(line.containsPoint(new MAPoint(0, 10)), false) // beyond p1

    // Real line segment from rendering y=x
    line = new MALineSegment(new MAPoint(0.99609375, 0.996093824505806), new MAPoint(1.005859375, 1.005859300494194))
    assertEqual(line.containsPoint(new MAPoint(1, 1)), true)
  }

  test_MALineSegment_combineWith() {
    // a.p1 == b.p1, can combine
    let a1 = new MAPoint(1, 2)
    let a2 = new MAPoint(3, 5)
    let b1 = a1
    let b2 = new MAPoint(1-2, 2-3)
    let a = new MALineSegment(a1, a2)
    let b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), true)
    assertEqual(a.p1.x, b2.x)
    assertEqual(a.p1.y, b2.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // a.p1 == b.p2, can combine
    a1 = new MAPoint(1, 2)
    a2 = new MAPoint(3, 5)
    b1 = new MAPoint(1-2, 2-3)
    b2 = a1
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), true)
    assertEqual(a.p1.x, b1.x)
    assertEqual(a.p1.y, b1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // a.p2 == b.p1, can combine
    a1 = new MAPoint(3, 5)
    a2 = new MAPoint(1, 2)
    b1 = a2
    b2 = new MAPoint(1-2, 2-3)
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), true)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, b2.y)
    assertEqual(a.p2.y, b2.y)

    // a.p2 == b.p2, can combine
    a1 = new MAPoint(3, 5)
    a2 = new MAPoint(1, 2)
    b1 = new MAPoint(1-2, 2-3)
    b2 = a2
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), true)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, b1.y)
    assertEqual(a.p2.y, b1.y)

    // a == b
    a1 = new MAPoint(3, 5)
    a2 = new MAPoint(1, 2)
    b1 = a1
    b2 = a2
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), true)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // a == b (inverted)
    a1 = new MAPoint(3, 5)
    a2 = new MAPoint(1, 2)
    b1 = a2
    b2 = a1
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), true)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)


    // a.p1 == b.p1, can't combine
    a1 = new MAPoint(1, 2)
    a2 = new MAPoint(3, 5)
    b1 = a1
    b2 = new MAPoint(10, 1)
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // a.p1 == b.p2, can't combine
    a1 = new MAPoint(1, 2)
    a2 = new MAPoint(3, 5)
    b1 = new MAPoint(6, 7)
    b2 = a1
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // a.p2 == b.p1, can't combine
    a1 = new MAPoint(3, 5)
    a2 = new MAPoint(1, 2)
    b1 = a2
    b2 = new MAPoint(5, 5)
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // a.p2 == b.p2, can't combine
    a1 = new MAPoint(3, 5)
    a2 = new MAPoint(1, 2)
    b1 = new MAPoint(1-2+0.1, 2-3+0.1)
    b2 = a2
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)


    // a is a sub-line of b
    a1 = new MAPoint(3, 5)
    a2 = new MAPoint(1, 2)
    b1 = a1
    b2 = new MAPoint(1-2, 2-3)
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    // We could enhance combineWith so that this could return true
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // a is a sub-line of b (inverted)
    a1 = new MAPoint(3, 5)
    a2 = new MAPoint(1, 2)
    b1 = new MAPoint(1-2, 2-3)
    b2 = a1
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    // We could enhance combineWith so that this could return true
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)


    // b is a sub-line of a
    b1 = new MAPoint(3, 5)
    b2 = new MAPoint(1, 2)
    a1 = b1
    a2 = new MAPoint(1-2, 2-3)
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    // We could enhance combineWith so that this could return true
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // b is a sub-line of a (inverted)
    b1 = new MAPoint(3, 5)
    b2 = new MAPoint(1, 2)
    a1 = new MAPoint(1-2, 2-3)
    a2 = b1
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    // We could enhance combineWith so that this could return true
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    // no shared point
    a1 = new MAPoint(1-2, 2-3)
    a2 = new MAPoint(6, 7)
    b1 = new MAPoint(3, 5)
    b2 = new MAPoint(1, 2)
    a = new MALineSegment(a1, a2)
    b = new MALineSegment(b1, b2)
    assertEqual(a.combineWith(b), false)
    assertEqual(a.p1.x, a1.x)
    assertEqual(a.p1.y, a1.y)
    assertEqual(a.p2.y, a2.y)
    assertEqual(a.p2.y, a2.y)

    assertEqual(b.combineWith(a), false)
    assertEqual(b.p1.x, b1.x)
    assertEqual(b.p1.y, b1.y)
    assertEqual(b.p2.y, b2.y)
    assertEqual(b.p2.y, b2.y)
  }

// MABox

  test_MABox_containsPoint() {
    // normal box
    let box = new MABox(new MAPoint(0, 0), new MAPoint(5, 5))
    assertEqual(box.containsPoint(new MAPoint(0, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(5, 5)), true)
    assertEqual(box.containsPoint(new MAPoint(0, 5)), true)
    assertEqual(box.containsPoint(new MAPoint(5, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(1, 1)), true)
    assertEqual(box.containsPoint(new MAPoint(4, 4)), true)
    assertEqual(box.containsPoint(new MAPoint(-1, 0)), false)
    assertEqual(box.containsPoint(new MAPoint(1, -1)), false)
    assertEqual(box.containsPoint(new MAPoint(6, 5)), false)
    assertEqual(box.containsPoint(new MAPoint(5, 5.1)), false)
    assertEqual(box.containsPoint(new MAPoint(0, 6)), false)
    assertEqual(box.containsPoint(new MAPoint(-0.1, 5)), false)
    assertEqual(box.containsPoint(new MAPoint(6, 0)), false)
    assertEqual(box.containsPoint(new MAPoint(5, -0.1)), false)

    box = new MABox(new MAPoint(-1, -2), new MAPoint(5, 5))
    assertEqual(box.containsPoint(new MAPoint(-1, -2)), true)
    assertEqual(box.containsPoint(new MAPoint(0, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(5, 5)), true)
    assertEqual(box.containsPoint(new MAPoint(0, 5)), true)
    assertEqual(box.containsPoint(new MAPoint(5, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(1, 1)), true)
    assertEqual(box.containsPoint(new MAPoint(4, 4)), true)
    assertEqual(box.containsPoint(new MAPoint(-1, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(1, -1)), true)
    assertEqual(box.containsPoint(new MAPoint(6, 5)), false)
    assertEqual(box.containsPoint(new MAPoint(5, 5.1)), false)
    assertEqual(box.containsPoint(new MAPoint(0, 6)), false)
    assertEqual(box.containsPoint(new MAPoint(-0.1, 5)), true)
    assertEqual(box.containsPoint(new MAPoint(6, 0)), false)
    assertEqual(box.containsPoint(new MAPoint(5, -0.1)), true)

    // box with no width
    box = new MABox(new MAPoint(0, 0), new MAPoint(0, 5))
    assertEqual(box.containsPoint(new MAPoint(0, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(0, 5)), true)
    assertEqual(box.containsPoint(new MAPoint(0, 4)), true)
    assertEqual(box.containsPoint(new MAPoint(0, 6)), false)
    assertEqual(box.containsPoint(new MAPoint(0, -1)), false)
    assertEqual(box.containsPoint(new MAPoint(-1, 4)), false)
    assertEqual(box.containsPoint(new MAPoint(1, 4)), false)

    // box with no height
    box = new MABox(new MAPoint(0, 0), new MAPoint(5, 0))
    assertEqual(box.containsPoint(new MAPoint(0, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(5, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(4, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(6, 0)), false)
    assertEqual(box.containsPoint(new MAPoint(-1, 0)), false)
    assertEqual(box.containsPoint(new MAPoint(4, -1)), false)
    assertEqual(box.containsPoint(new MAPoint(4, 1)), false)

    // box with no height or width
    box = new MABox(new MAPoint(0, 0), new MAPoint(0, 0))
    assertEqual(box.containsPoint(new MAPoint(0, 0)), true)
    assertEqual(box.containsPoint(new MAPoint(-1, 0)), false)
    assertEqual(box.containsPoint(new MAPoint(1, 0)), false)
    assertEqual(box.containsPoint(new MAPoint(0, 1)), false)
    assertEqual(box.containsPoint(new MAPoint(0, -1)), false)
  }

// Unit test harness

  run() {
    let startMillis = performance.now()

    let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))

    let runExclusively = methods.filter(x => x.startsWith("test_exclusive_"))
    if (runExclusively.length > 0) {
      methods = runExclusively
    }

    let passCount = 0
    for (let method of methods) {
      if (method.startsWith("test")) {
        MALog.log("=== Invoking " + method + " ===")
        this[method]();
        passCount++
      }
    }
    MALog.log(passCount + " tests and " + assertionCount + " assertions passed successfully!")

    let endMillis = performance.now()
    let duration = endMillis-startMillis
    MALog.log(`Tests completed in ${duration/1000}s`)
  }
}

// Run with:
//  let ut = new UnitTests()
//  ut.run()
