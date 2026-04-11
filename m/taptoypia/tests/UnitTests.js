if (typeof module !== 'undefined' && module.exports) {
  ({ MAUtils, pLog } = require('../src/Utilities.js'));
  ({ maDocument, MADocument } = require('../src/MADocument.js'));
}

class MALogger {
  constructor() {
    this.logs = []
  }

  log(str) {
    this.logs.push(str)
  }

  clear() {
    this.logs = []
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

function assertNotNull(obj, str) {
    if (obj === null) {
      const msg = str || `Expected not null, but was null`;
      const fullMsg = `Failed assertion: ${msg}\n${(new Error()).stack}`;
      MALog.log(fullMsg);
      throw fullMsg;
    }
    assertionCount++;
}

function assertNull(obj, str) {
    if (obj !== null) {
      const msg = str || `Expected null, but was ${obj}`;
      const fullMsg = `Failed assertion: ${msg}\n${(new Error()).stack}`;
      MALog.log(fullMsg);
      throw fullMsg;
    }
    assertionCount++;
}

function assertEqual(str1, str2) {
    if (str1 !== str2) {
      let str = "Failed assertion: \"" + str1 + "\" does not equal \"" + str2 + "\"" + "\n" + (new Error()).stack
      MALog.log(str)
      throw str
    }
    assertionCount++
}

function assertEqualVec2(v1, v2) {
  assertEqual(v1.toString(), v2.toString())
}

function assertEqualDeep(obj1, obj2) {
    let ineqStr = ""
    const ineqHandler = (s) => {
      ineqStr = " ; " + s
    }

    if (!MAUtils.isEqualDeep(obj1, obj2, ineqHandler)) {
      let str = "Failed assertion: \"" + obj1 + "\" does not deep equal \"" + obj2 + "\"" + ineqStr
      MALog.log(str)
      throw str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqualFloats(f1, f2, tolerance) {
  if (!tolerance) {
    tolerance = 0
  }

    if (Math.abs(f1-f2) > tolerance) {
      let str = "Failed assertion: \"" + f1 + "\" does not equal \"" + f2 + "\""
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

function assertEqual2DArrays(actual, expected) {
  let errorStr = null
	for (let i = 0; i < expected.length; i++) {
		if (actual[i].length !== expected[i].length) {
      errorStr = `Row ${i} length mismatch`
      break
    }

		for (let j = 0; j < expected[i].length; j++) {
			const v1 = actual[i][j]
			const v2 = expected[i][j]
			const tolerance = 0.00001
			const fEqual = v1 === v2 || (Math.abs(v1-v2) < tolerance)

      if (!fEqual) {
        errorStr = `Mismatch at (${i}, ${j}): ${actual[i][j]} does not equal ${expected[i][j]}`
        break
      }
		}

    if (errorStr) {
      break
    }
	}

  if (errorStr) {
    let str = "Failed assertion:\n\n\"" + errorStr + "\""
    MALog.log(str)
    throw str + "\n" + (new Error()).stack
  }

  assertionCount++
}

function assertPixelColor(ctx, x, y, color) {
  let data = ctx.getImageData(x, y, 1, 1).data
  let hex = MAUtils.rgbToHex(data[0], data[1], data[2])
  assertEqual(hex, color)
}


// Unit test harness
// Do not implement test case methods in this class. They will not be run.
// Put them in "UnitTest_" files instead.
class UnitTests {
  importTestMethodsFromClass(className) {
    const testInstance = new className();

    const proto = Object.getPrototypeOf(testInstance);

    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key.startsWith('test') || key.startsWith('only') || key.startsWith('_')) {
        if (this[key]) {
          throw new Error(`Duplicate test name: ${key}`);
        }
        this[key] = proto[key].bind(this);
      }
    }
  }

  _runTestsMatching(testNameCheck) {
    const startTime = Date.now()

   // let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    let methods = Object.getOwnPropertyNames(this)

    let onlyMethods = methods.filter(x => x.startsWith("only"))
    methods = onlyMethods.length > 0 ? onlyMethods : methods

    let passCount = 0
    for (let method of methods) {
      if (testNameCheck(method)) {
        MALog.log("=== Invoking " + method + " ===")
        //console.log("=== Invoking " + method + " ===")

        // Reset global DOM mock before each test
        maDocument = new MADocument();

        this[method]();

        if (typeof caughtError !== 'undefined' && caughtError) {
          MALog.log("Failed test: hit exception captured by window.onerror.\n" + caughtError + "\n" + caughtError.stack)
          throw caughtError
        }

        passCount++
      }
    }
    MALog.log(passCount + " tests and " + assertionCount + " assertions passed successfully!")
    MALog.log(pLog.summaryString())
    const endTime = Date.now()
    const runTimeSec = Math.round((endTime - startTime) / 1000)
    MALog.log(`Completed in ${runTimeSec} seconds`)
  }

  run() {
    this._runTestsMatching((n) => {
      return n.startsWith("test") || n.startsWith("only_test")
    })
  }

  runStress() {
    this._runTestsMatching((n) => {
      return n.startsWith("stress") || n.startsWith("only_stress")
    })
  }
}


// Run with:
//  let ut = new UnitTests()
//  ut.run()

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    UnitTests,
    MALog,
    assertTrue,
    assertNotNull,
    assertNull,
    assertEqual,
    assertEqualVec2,
    assertEqualDeep,
    assertEqualFloats,
    assertEqualArrays,
    assertEqual2DArrays,
    assertPixelColor,
  };
}

