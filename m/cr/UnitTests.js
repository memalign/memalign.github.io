
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

function assertEqual(str1, str2) {
    if (str1 != str2) {
      let str = "Failed assertion: \"" + str1 + "\" does not equal \"" + str2 + "\""
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

function assertPixelColor(ctx, x, y, color) {
  let data = ctx.getImageData(x, y, 1, 1).data
  let hex = MAUtils.rgbToHex(data[0], data[1], data[2])
  assertEqual(hex, color)
}


class UnitTests {

// MAGameRand
  test_randomInt() {
    let r = new MAGameRand(1)
    //              0  1  2  3  4  5  6  7  8  9 10 11
    let observed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    let expected = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
    for (let i = 0; i < 100; ++i) {
      let v = r.randomInt(0, 10)
      observed[v] = 1
    }

    assertEqualArrays(observed, expected)
  }

// MAUtils
  test_obfuscateString() {
    let str = "hello world!"
    let res = MAUtils.obfuscateString(str)
    assertTrue(str != res)
    assertEqual(res[res.length-1], "!")
    assertEqual(str, MAUtils.obfuscateString(res))

    // Special case characters
    str = " ,"
    res = MAUtils.obfuscateString(str)
    assertEqual(res, "QY")

    let testStrings = [
      "Welcome here, there, everywhere",
      "Some emoji 🤔",
      "谢 谢",
      "Name",
      "Bob",
      "Zach Smith",
      " ,",
    ]

    for (str of testStrings) {
      res = MAUtils.obfuscateString(str)
      assertTrue(str != res)
      assertEqual(str, MAUtils.obfuscateString(res))
    }
  }

  test_prettyTimeStringForTimestamp() {
    const now = (1524575637 - (4 * 60 * 60)) * 1000

    let ts = now
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), 'now')

    ts = now - 0.99 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), 'now')

    ts = now - 1 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '1s')

    ts = now - 30 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '30s')

    ts = now - 59 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '59s')

    ts = now - 59.99 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '59s')

    ts = now - 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '1m')

    ts = now - 2 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '2m')

    ts = now - (2 * 60 + 1) * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '2m')

    ts = now - 59 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '59m')

    ts = now - (59 * 60 + 59.99) * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '59m')

    ts = now - 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '1h')

    ts = now - (2 * 60 * 60 - 1) * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '1h')

    ts = now - 2 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '2h')

    ts = now - 23 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '23h')

    ts = now - (24 * 60 * 60 - 1) * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '23h')

    ts = now - 24 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '1d')

    ts = now - 6 * 24 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '6d')

    ts = now - (7 * 24 * 60 * 60 - 1) * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '6d')

    // Assumes test is run in US timezone
    ts = now - 7 * 24 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '4/16/18')

    // Assumes test is run in US timezone
    ts = now - 8 * 24 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeStringForTimestamp(ts, now), '4/15/18')
  }

  test_prettyTimeAgoStringForTimestamp() {
    const now = (1524575637 - (4 * 60 * 60)) * 1000

    let ts = now
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), 'just now')

    ts = now - 0.99 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), 'just now')

    ts = now - 1 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '1s ago')

    ts = now - 30 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '30s ago')

    ts = now - 59 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '59s ago')

    ts = now - 59.99 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '59s ago')

    ts = now - 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '1m ago')

    ts = now - 2 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '2m ago')

    ts = now - (2 * 60 + 1) * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '2m ago')

    ts = now - 59 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '59m ago')

    ts = now - (59 * 60 + 59.99) * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '59m ago')

    ts = now - 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '1h ago')

    ts = now - (2 * 60 * 60 - 1) * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '1h ago')

    ts = now - 2 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '2h ago')

    ts = now - 23 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '23h ago')

    ts = now - (24 * 60 * 60 - 1) * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '23h ago')

    ts = now - 24 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '1d ago')

    ts = now - 6 * 24 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '6d ago')

    ts = now - (7 * 24 * 60 * 60 - 1) * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '6d ago')

    // Assumes test is run in US timezone
    ts = now - 7 * 24 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '4/16/18')

    // Assumes test is run in US timezone
    ts = now - 8 * 24 * 60 * 60 * 1000
    assertEqual(MAUtils.prettyTimeAgoStringForTimestamp(ts, now), '4/15/18')
  }

// MAPlayerPositionHistory

  test_playerPositionHistory_encodeAndDecode() {
    let ph1 = new MAPlayerPositionHistory()
    let baseTimestamp = 5226232
    ph1.addPosition(19.71, baseTimestamp+0)
    ph1.addPosition(19.712, baseTimestamp+7*1)
    ph1.addPosition(219.0, baseTimestamp+7*2)
    ph1.addPosition(281.5, baseTimestamp+7*3+2)
    ph1.addPosition(0, baseTimestamp+7*4)
    ph1.addPosition(55.444, baseTimestamp+7*5+3)

    let base64Str = ph1.encodeToBase64()
    assertTrue(MAUtils.isValidBase64(base64Str))

    let arrBuff = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0)).buffer
    let sizeInBytes = arrBuff.byteLength
    assertTrue(sizeInBytes % 6 == 0)

    let ph2 = MAPlayerPositionHistory.playerPositionHistoryFromBase64(base64Str)

    assertEqual(ph1.positionHistory.length, ph2.positionHistory.length)

    for (let i = 0; i < ph1.positionHistory.length; ++i) {
      let pp1 = ph1.positionHistory[i]
      let pp2 = ph2.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestamp

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }
  }


// MAColumnHistory

  test_columnHistory_encodeAndDecode() {
    let ch1 = new MAColumnHistory()

    ch1.addColumn(new MAGameColumn(20, 20+260-1, -1)) //  0
    ch1.addColumn(new MAGameColumn(15, 15+260-1, -1)) //  1
    ch1.addColumn(new MAGameColumn(19, 19+260-2, -1)) //  2
    ch1.addColumn(new MAGameColumn(24, 24+260-2, -1)) //  3
    ch1.addColumn(new MAGameColumn(27, 27+260-3, -1)) //  4
    ch1.addColumn(new MAGameColumn(30, 30+260-3, -1)) //  5
    ch1.addColumn(new MAGameColumn(34.2, 34.2+260-4, -1)) //  6
    ch1.addColumn(new MAGameColumn(29, 29+260-4, -1)) //  7
    ch1.addColumn(new MAGameColumn(33.555, 33.555+260-5, -1)) //  8
    ch1.addColumn(new MAGameColumn(37, 37+260-5, 47.514)) //  9
    ch1.addColumn(new MAGameColumn(42, 42+260-6, -1)) // 10
    ch1.addColumn(new MAGameColumn(39, 39+260-6, -1)) // 11
    ch1.addColumn(new MAGameColumn(44, 44+260-7, -1)) // 12
    ch1.addColumn(new MAGameColumn(47, 47+260-7, -1)) // 13
    ch1.addColumn(new MAGameColumn(48, 48+260-8, -1)) // 14
    ch1.addColumn(new MAGameColumn(52, 52+260-8, -1)) // 15
    ch1.addColumn(new MAGameColumn(49, 49+260-9, -1)) // 16
    ch1.addColumn(new MAGameColumn(45, 45+260-9, -1)) // 17
    ch1.addColumn(new MAGameColumn(41, 41+260-10, -1)) // 18
    ch1.addColumn(new MAGameColumn(46, 46+260-10, 55.223)) // 19
    ch1.addColumn(new MAGameColumn(51, 51+260-11, -1)) // 20

    let base64Str = ch1.encodeToBase64()
    assertTrue(MAUtils.isValidBase64(base64Str))

    let ch2 = MAColumnHistory.columnHistoryFromBase64(base64Str)

    assertEqual(ch1.columnHistory.length, ch2.columnHistory.length)

    for (let i = 0; i < ch1.columnHistory.length; ++i) {
      let c1 = ch1.columnHistory[i]
      let c2 = ch2.columnHistory[i]

      assertEqualFloats(c1.caveTop, c2.caveTop, 0.01)
      assertEqualFloats(c1.caveBottom, c2.caveBottom, 0.01)
      assertEqualFloats(c1.obstacle, c2.obstacle, 0.01)

      if (i == 9 || i == 19) {
        assertTrue(c2.obstaclePosition != -1)
      } else {
        assertEqual(c2.obstaclePosition, -1)
      }
    }

    assertEqual(ch2.columnHistory[0].caveBottom-ch2.columnHistory[0].caveTop, 259)
  }


// MAReplay

  test_MAReplay_encodeDecode() {
    let ph1 = new MAPlayerPositionHistory()
    let baseTimestamp = 5226232
    ph1.addPosition(19.71, baseTimestamp+0)
    ph1.addPosition(19.712, baseTimestamp+7*1)
    ph1.addPosition(219.0, baseTimestamp+7*2)
    ph1.addPosition(281.5, baseTimestamp+7*3+2)
    ph1.addPosition(0, baseTimestamp+7*4)
    ph1.addPosition(55.444, baseTimestamp+7*5+3)


    let ch1 = new MAColumnHistory()

    let r1 = new MAReplay(ph1, ch1, "memalign", 868, 1704013514980, 1704013514983, null)
    assertEqual(r1.replay, null)

    let str = r1.encodeToString()

    assertTrue(!str.includes(","))
    assertTrue(!str.includes("%"))

    let r2 = MAReplay.replayFromEncodedString(str)

    assertEqual(r2.replay, null)
    assertEqual(r1.name, r2.name)
    assertEqual(r1.score, r2.score)
    assertEqual(r1.timestamp, r2.timestamp)
    assertEqual(r1.rngSeed, r2.rngSeed)
    assertEqual(r2.columnHistory, null)

    let str2 = r2.encodeToString()

    assertEqual(str, str2)


    let ph2 = r2.playerPositionHistory

    assertEqual(ph1.positionHistory.length, ph2.positionHistory.length)

    for (let i = 0; i < ph1.positionHistory.length; ++i) {
      let pp1 = ph1.positionHistory[i]
      let pp2 = ph2.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestamp

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }
  }

  test_MAReplay_encodeDecode_oneSubreplay() {
    let ph1b = new MAPlayerPositionHistory()
    let baseTimestampB = 5226232
    ph1b.addPosition(20.19, baseTimestampB+0)
    ph1b.addPosition(22.612, baseTimestampB+7*1)
    ph1b.addPosition(119.0, baseTimestampB+7*2)
    ph1b.addPosition(181.5, baseTimestampB+7*3+2)
    ph1b.addPosition(0, baseTimestampB+7*4)
    ph1b.addPosition(55.555, baseTimestampB+7*5+3)


    let ch1b = new MAColumnHistory()

    let r1b = new MAReplay(ph1b, ch1b, "replay-b", 870, 1704013514980, 1704013014983, null)




    let ph1a = new MAPlayerPositionHistory()
    let baseTimestampA = 5226235
    ph1a.addPosition(19.71, baseTimestampA+0)
    ph1a.addPosition(19.712, baseTimestampA+7*1)
    ph1a.addPosition(219.0, baseTimestampA+7*2)
    ph1a.addPosition(281.5, baseTimestampA+7*3+2)
    ph1a.addPosition(0, baseTimestampA+7*4)
    ph1a.addPosition(55.444, baseTimestampA+7*5+3)


    let ch1a = new MAColumnHistory()

    let r1a = new MAReplay(ph1a, ch1a, "memalign", 868, 1704013514980, 1704013514983, r1b)

    assertEqual(r1a.replay, r1b)
    assertEqual(r1b.replay, null)

    let str = r1a.encodeToString()

    assertTrue(!str.includes(","))
    assertTrue(!str.includes("%"))

    let r2a = MAReplay.replayFromEncodedString(str)

    assertEqual(r1a.name, r2a.name)
    assertEqual(r1a.score, r2a.score)
    assertEqual(r1a.timestamp, r2a.timestamp)
    assertEqual(r1a.rngSeed, r2a.rngSeed)

    let str2 = r2a.encodeToString()

    assertEqual(str, str2)


    let ph2a = r2a.playerPositionHistory

    assertEqual(ph1a.positionHistory.length, ph2a.positionHistory.length)

    for (let i = 0; i < ph1a.positionHistory.length; ++i) {
      let pp1 = ph1a.positionHistory[i]
      let pp2 = ph2a.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampA

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2a = r2a.columnHistory
    assertEqual(ch2a, null)



    let r2b = r2a.replay
    assertEqual(r2b.replay, null)
    assertEqual(r1b.name, r2b.name)
    assertEqual(r1b.score, r2b.score)
    assertEqual(r1b.timestamp, r2b.timestamp)
    assertEqual(r1b.rngSeed, r2b.rngSeed)

    let ph2b = r2b.playerPositionHistory

    assertEqual(ph1b.positionHistory.length, ph2b.positionHistory.length)

    for (let i = 0; i < ph1b.positionHistory.length; ++i) {
      let pp1 = ph1b.positionHistory[i]
      let pp2 = ph2b.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampB

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2b = r2b.columnHistory
    assertEqual(ch2b, null)
  }

  test_MAReplay_encodeDecode_twoSubreplays() {
    let ph1c = new MAPlayerPositionHistory()
    let baseTimestampC = 5216232
    ph1c.addPosition(20.19, baseTimestampC+0)
    ph1c.addPosition(22.612, baseTimestampC+7*1)
    ph1c.addPosition(119.0, baseTimestampC+7*2)
    ph1c.addPosition(181.5, baseTimestampC+7*3+2)
    ph1c.addPosition(0, baseTimestampC+7*4)
    ph1c.addPosition(55.555, baseTimestampC+7*5+3)


    let ch1c = new MAColumnHistory()

    let r1c = new MAReplay(ph1c, ch1c, "replay-c", 852, 1704012014980, 1704012014983, null)


    let ph1b = new MAPlayerPositionHistory()
    let baseTimestampB = 5226232
    ph1b.addPosition(20.19, baseTimestampB+0)
    ph1b.addPosition(22.612, baseTimestampB+7*1)
    ph1b.addPosition(119.0, baseTimestampB+7*2)
    ph1b.addPosition(181.5, baseTimestampB+7*3+2)
    ph1b.addPosition(0, baseTimestampB+7*4)


    let ch1b = new MAColumnHistory()

    let r1b = new MAReplay(ph1b, ch1b, "replay-b", 870, 1704013014980, 1704013014983, r1c)




    let ph1a = new MAPlayerPositionHistory()
    let baseTimestampA = 5226235
    ph1a.addPosition(19.71, baseTimestampA+0)
    ph1a.addPosition(19.712, baseTimestampA+7*1)
    ph1a.addPosition(219.0, baseTimestampA+7*2)
    ph1a.addPosition(281.5, baseTimestampA+7*3+2)
    ph1a.addPosition(0, baseTimestampA+7*4)
    ph1a.addPosition(55.444, baseTimestampA+7*5+3)


    let ch1a = new MAColumnHistory()


    let r1a = new MAReplay(ph1a, ch1a, "memalign", 868, 1704013514980, 1704013514983, r1b)

    assertEqual(r1a.replay, r1b)
    assertEqual(r1b.replay, r1c)
    assertEqual(r1c.replay, null)

    let str = r1a.encodeToString()

    assertTrue(!str.includes(","))
    assertTrue(!str.includes("%"))

    let r2a = MAReplay.replayFromEncodedString(str)

    assertEqual(r1a.name, r2a.name)
    assertEqual(r1a.score, r2a.score)
    assertEqual(r1a.timestamp, r2a.timestamp)
    assertEqual(r1a.rngSeed, r2a.rngSeed)

    let str2 = r2a.encodeToString()

    assertEqual(str, str2)


    let ph2a = r2a.playerPositionHistory

    assertEqual(ph1a.positionHistory.length, ph2a.positionHistory.length)

    for (let i = 0; i < ph1a.positionHistory.length; ++i) {
      let pp1 = ph1a.positionHistory[i]
      let pp2 = ph2a.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampA

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2a = r2a.columnHistory
    assertEqual(ch2a, null)



    let r2b = r2a.replay
    assertTrue(r2b.replay != null)
    assertEqual(r1b.name, r2b.name)
    assertEqual(r1b.score, r2b.score)
    assertEqual(r1b.timestamp, r2b.timestamp)
    assertEqual(r1b.rngSeed, r2b.rngSeed)

    let ph2b = r2b.playerPositionHistory

    assertEqual(ph1b.positionHistory.length, ph2b.positionHistory.length)

    for (let i = 0; i < ph1b.positionHistory.length; ++i) {
      let pp1 = ph1b.positionHistory[i]
      let pp2 = ph2b.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampB

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2b = r2b.columnHistory
    assertEqual(ch2b, null)



    let r2c = r2b.replay
    assertEqual(r2c.replay, null)
    assertEqual(r1c.name, r2c.name)
    assertEqual(r1c.score, r2c.score)
    assertEqual(r1c.timestamp, r2c.timestamp)
    assertEqual(r1c.rngSeed, r2c.rngSeed)

    let ph2c = r2c.playerPositionHistory

    assertEqual(ph1c.positionHistory.length, ph2c.positionHistory.length)

    for (let i = 0; i < ph1c.positionHistory.length; ++i) {
      let pp1 = ph1c.positionHistory[i]
      let pp2 = ph2c.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampC

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2c = r2c.columnHistory
    assertEqual(ch2c, null)
  }

  test_MAReplay_encodeDecode_storeCH() {
    let storeCHOrig = DEBUG_STORE_COLUMNHISTORY
    DEBUG_STORE_COLUMNHISTORY = true

    let ph1 = new MAPlayerPositionHistory()
    let baseTimestamp = 5226232
    ph1.addPosition(19.71, baseTimestamp+0)
    ph1.addPosition(19.712, baseTimestamp+7*1)
    ph1.addPosition(219.0, baseTimestamp+7*2)
    ph1.addPosition(281.5, baseTimestamp+7*3+2)
    ph1.addPosition(0, baseTimestamp+7*4)
    ph1.addPosition(55.444, baseTimestamp+7*5+3)


    let ch1 = new MAColumnHistory()

    ch1.addColumn(new MAGameColumn(20, 20+260-1, -1)) //  0
    ch1.addColumn(new MAGameColumn(15, 15+260-1, -1)) //  1
    ch1.addColumn(new MAGameColumn(19, 19+260-2, -1)) //  2
    ch1.addColumn(new MAGameColumn(24, 24+260-2, -1)) //  3
    ch1.addColumn(new MAGameColumn(27, 27+260-3, -1)) //  4
    ch1.addColumn(new MAGameColumn(30, 30+260-3, -1)) //  5
    ch1.addColumn(new MAGameColumn(34.2, 34.2+260-4, -1)) //  6
    ch1.addColumn(new MAGameColumn(29, 29+260-4, -1)) //  7
    ch1.addColumn(new MAGameColumn(33.555, 33.555+260-5, -1)) //  8
    ch1.addColumn(new MAGameColumn(37, 37+260-5, 47.514)) //  9
    ch1.addColumn(new MAGameColumn(42, 42+260-6, -1)) // 10
    ch1.addColumn(new MAGameColumn(39, 39+260-6, -1)) // 11
    ch1.addColumn(new MAGameColumn(44, 44+260-7, -1)) // 12
    ch1.addColumn(new MAGameColumn(47, 47+260-7, -1)) // 13
    ch1.addColumn(new MAGameColumn(48, 48+260-8, -1)) // 14
    ch1.addColumn(new MAGameColumn(52, 52+260-8, -1)) // 15
    ch1.addColumn(new MAGameColumn(49, 49+260-9, -1)) // 16
    ch1.addColumn(new MAGameColumn(45, 45+260-9, -1)) // 17
    ch1.addColumn(new MAGameColumn(41, 41+260-10, -1)) // 18
    ch1.addColumn(new MAGameColumn(46, 46+260-10, 55.223)) // 19
    ch1.addColumn(new MAGameColumn(51, 51+260-11, -1)) // 20

    let r1 = new MAReplay(ph1, ch1, "memalign", 868, 1704013514980, 1704013514983, null)
    assertEqual(r1.replay, null)

    let str = r1.encodeToString()

    assertTrue(!str.includes(","))
    assertTrue(!str.includes("%"))

    let r2 = MAReplay.replayFromEncodedString(str)

    assertEqual(r2.replay, null)
    assertEqual(r1.name, r2.name)
    assertEqual(r1.score, r2.score)
    assertEqual(r1.timestamp, r2.timestamp)
    assertEqual(r1.rngSeed, r2.rngSeed)

    let str2 = r2.encodeToString()

    assertEqual(str, str2)


    let ph2 = r2.playerPositionHistory

    assertEqual(ph1.positionHistory.length, ph2.positionHistory.length)

    for (let i = 0; i < ph1.positionHistory.length; ++i) {
      let pp1 = ph1.positionHistory[i]
      let pp2 = ph2.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestamp

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2 = r2.columnHistory

    assertEqual(ch1.columnHistory.length, ch2.columnHistory.length)

    for (let i = 0; i < ch1.columnHistory.length; ++i) {
      let c1 = ch1.columnHistory[i]
      let c2 = ch2.columnHistory[i]

      assertEqualFloats(c1.caveTop, c2.caveTop, 0.01)
      assertEqualFloats(c1.caveBottom, c2.caveBottom, 0.01)
      assertEqualFloats(c1.obstacle, c2.obstacle, 0.01)

      if (i == 9 || i == 19) {
        assertTrue(c2.obstaclePosition != -1)
      } else {
        assertEqual(c2.obstaclePosition, -1)
      }
    }

    assertEqual(ch2.columnHistory[0].caveBottom-ch2.columnHistory[0].caveTop, 259)

    DEBUG_STORE_COLUMNHISTORY = storeCHOrig
  }

  test_MAReplay_encodeDecode_oneSubreplay_storeCH() {
    let storeCHOrig = DEBUG_STORE_COLUMNHISTORY
    DEBUG_STORE_COLUMNHISTORY = true

    let ph1b = new MAPlayerPositionHistory()
    let baseTimestampB = 5226232
    ph1b.addPosition(20.19, baseTimestampB+0)
    ph1b.addPosition(22.612, baseTimestampB+7*1)
    ph1b.addPosition(119.0, baseTimestampB+7*2)
    ph1b.addPosition(181.5, baseTimestampB+7*3+2)
    ph1b.addPosition(0, baseTimestampB+7*4)
    ph1b.addPosition(55.555, baseTimestampB+7*5+3)


    let ch1b = new MAColumnHistory()

    ch1b.addColumn(new MAGameColumn(10, 10+260-1, -1)) //  0
    ch1b.addColumn(new MAGameColumn(15, 15+260-1, -1)) //  1
    ch1b.addColumn(new MAGameColumn(19, 19+260-2, -1)) //  2
    ch1b.addColumn(new MAGameColumn(24, 24+260-2, -1)) //  3
    ch1b.addColumn(new MAGameColumn(27, 27+260-3, -1)) //  4
    ch1b.addColumn(new MAGameColumn(30, 30+260-3, -1)) //  5
    ch1b.addColumn(new MAGameColumn(34.2, 34.2+260-4, -1)) //  6
    ch1b.addColumn(new MAGameColumn(29, 29+260-4, -1)) //  7
    ch1b.addColumn(new MAGameColumn(33.555, 33.555+260-5, -1)) //  8
    ch1b.addColumn(new MAGameColumn(37, 37+260-5, 47.514)) //  9
    ch1b.addColumn(new MAGameColumn(42, 42+260-6, -1)) // 10
    ch1b.addColumn(new MAGameColumn(39, 39+260-6, -1)) // 11
    ch1b.addColumn(new MAGameColumn(44, 44+260-7, -1)) // 12
    ch1b.addColumn(new MAGameColumn(47, 47+260-7, -1)) // 13
    ch1b.addColumn(new MAGameColumn(48, 48+260-8, -1)) // 14
    ch1b.addColumn(new MAGameColumn(52, 52+260-8, -1)) // 15
    ch1b.addColumn(new MAGameColumn(55, 55+260-9, -1)) // 16
    ch1b.addColumn(new MAGameColumn(45, 45+260-9, -1)) // 17
    ch1b.addColumn(new MAGameColumn(41, 41+260-10, -1)) // 18
    ch1b.addColumn(new MAGameColumn(46, 46+260-10, 55.223)) // 19
    ch1b.addColumn(new MAGameColumn(51, 51+260-11, -1)) // 20

    let r1b = new MAReplay(ph1b, ch1b, "replay-b", 870, 1704013514980, 1704013014983, null)




    let ph1a = new MAPlayerPositionHistory()
    let baseTimestampA = 5226235
    ph1a.addPosition(19.71, baseTimestampA+0)
    ph1a.addPosition(19.712, baseTimestampA+7*1)
    ph1a.addPosition(219.0, baseTimestampA+7*2)
    ph1a.addPosition(281.5, baseTimestampA+7*3+2)
    ph1a.addPosition(0, baseTimestampA+7*4)
    ph1a.addPosition(55.444, baseTimestampA+7*5+3)


    let ch1a = new MAColumnHistory()

    ch1a.addColumn(new MAGameColumn(20, 20+260-1, -1)) //  0
    ch1a.addColumn(new MAGameColumn(15, 15+260-1, -1)) //  1
    ch1a.addColumn(new MAGameColumn(19, 19+260-2, -1)) //  2
    ch1a.addColumn(new MAGameColumn(24, 24+260-2, -1)) //  3
    ch1a.addColumn(new MAGameColumn(27, 27+260-3, -1)) //  4
    ch1a.addColumn(new MAGameColumn(30, 30+260-3, -1)) //  5
    ch1a.addColumn(new MAGameColumn(34.2, 34.2+260-4, -1)) //  6
    ch1a.addColumn(new MAGameColumn(29, 29+260-4, -1)) //  7
    ch1a.addColumn(new MAGameColumn(33.555, 33.555+260-5, -1)) //  8
    ch1a.addColumn(new MAGameColumn(37, 37+260-5, 47.514)) //  9
    ch1a.addColumn(new MAGameColumn(42, 42+260-6, -1)) // 10
    ch1a.addColumn(new MAGameColumn(39, 39+260-6, -1)) // 11
    ch1a.addColumn(new MAGameColumn(44, 44+260-7, -1)) // 12
    ch1a.addColumn(new MAGameColumn(47, 47+260-7, -1)) // 13
    ch1a.addColumn(new MAGameColumn(48, 48+260-8, -1)) // 14
    ch1a.addColumn(new MAGameColumn(52, 52+260-8, -1)) // 15
    ch1a.addColumn(new MAGameColumn(49, 49+260-9, -1)) // 16
    ch1a.addColumn(new MAGameColumn(45, 45+260-9, -1)) // 17
    ch1a.addColumn(new MAGameColumn(41, 41+260-10, -1)) // 18
    ch1a.addColumn(new MAGameColumn(46, 46+260-10, 55.223)) // 19
    ch1a.addColumn(new MAGameColumn(51, 51+260-11, -1)) // 20


    let r1a = new MAReplay(ph1a, ch1a, "memalign", 868, 1704013514980, 1704013514983, r1b)

    assertEqual(r1a.replay, r1b)
    assertEqual(r1b.replay, null)

    let str = r1a.encodeToString()

    assertTrue(!str.includes(","))
    assertTrue(!str.includes("%"))

    let r2a = MAReplay.replayFromEncodedString(str)

    assertEqual(r1a.name, r2a.name)
    assertEqual(r1a.score, r2a.score)
    assertEqual(r1a.timestamp, r2a.timestamp)

    let str2 = r2a.encodeToString()

    assertEqual(str, str2)


    let ph2a = r2a.playerPositionHistory

    assertEqual(ph1a.positionHistory.length, ph2a.positionHistory.length)

    for (let i = 0; i < ph1a.positionHistory.length; ++i) {
      let pp1 = ph1a.positionHistory[i]
      let pp2 = ph2a.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampA

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2a = r2a.columnHistory

    assertEqual(ch1a.columnHistory.length, ch2a.columnHistory.length)

    for (let i = 0; i < ch1a.columnHistory.length; ++i) {
      let c1 = ch1a.columnHistory[i]
      let c2 = ch2a.columnHistory[i]

      assertEqualFloats(c1.caveTop, c2.caveTop, 0.01)
      assertEqualFloats(c1.caveBottom, c2.caveBottom, 0.01)
      assertEqualFloats(c1.obstacle, c2.obstacle, 0.01)

      if (i == 9 || i == 19) {
        assertTrue(c2.obstaclePosition != -1)
      } else {
        assertEqual(c2.obstaclePosition, -1)
      }
    }

    assertEqual(ch2a.columnHistory[0].caveBottom-ch2a.columnHistory[0].caveTop, 259)


    let r2b = r2a.replay
    assertEqual(r2b.replay, null)
    assertEqual(r1b.name, r2b.name)
    assertEqual(r1b.score, r2b.score)
    assertEqual(r1b.timestamp, r2b.timestamp)

    let ph2b = r2b.playerPositionHistory

    assertEqual(ph1b.positionHistory.length, ph2b.positionHistory.length)

    for (let i = 0; i < ph1b.positionHistory.length; ++i) {
      let pp1 = ph1b.positionHistory[i]
      let pp2 = ph2b.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampB

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2b = r2b.columnHistory

    assertEqual(ch1b.columnHistory.length, ch2b.columnHistory.length)

    for (let i = 0; i < ch1b.columnHistory.length; ++i) {
      let c1 = ch1b.columnHistory[i]
      let c2 = ch2b.columnHistory[i]

      assertEqualFloats(c1.caveTop, c2.caveTop, 0.01)
      assertEqualFloats(c1.caveBottom, c2.caveBottom, 0.01)
      assertEqualFloats(c1.obstacle, c2.obstacle, 0.01)

      if (i == 9 || i == 19) {
        assertTrue(c2.obstaclePosition != -1)
      } else {
        assertEqual(c2.obstaclePosition, -1)
      }
    }

    assertEqual(ch2b.columnHistory[0].caveBottom-ch2b.columnHistory[0].caveTop, 259)

    DEBUG_STORE_COLUMNHISTORY = storeCHOrig
  }

  test_MAReplay_encodeDecode_twoSubreplays_storeCH() {
    let storeCHOrig = DEBUG_STORE_COLUMNHISTORY
    DEBUG_STORE_COLUMNHISTORY = true

    let ph1c = new MAPlayerPositionHistory()
    let baseTimestampC = 5216232
    ph1c.addPosition(20.19, baseTimestampC+0)
    ph1c.addPosition(22.612, baseTimestampC+7*1)
    ph1c.addPosition(119.0, baseTimestampC+7*2)
    ph1c.addPosition(181.5, baseTimestampC+7*3+2)
    ph1c.addPosition(0, baseTimestampC+7*4)
    ph1c.addPosition(55.555, baseTimestampC+7*5+3)


    let ch1c = new MAColumnHistory()

    ch1c.addColumn(new MAGameColumn(10, 10+260-1, -1)) //  0
    ch1c.addColumn(new MAGameColumn(15, 15+260-1, -1)) //  1
    ch1c.addColumn(new MAGameColumn(19, 19+260-2, -1)) //  2
    ch1c.addColumn(new MAGameColumn(24, 24+260-2, -1)) //  3
    ch1c.addColumn(new MAGameColumn(27, 27+260-3, -1)) //  4
    ch1c.addColumn(new MAGameColumn(30, 30+260-3, -1)) //  5
    ch1c.addColumn(new MAGameColumn(34.2, 34.2+260-4, -1)) //  6
    ch1c.addColumn(new MAGameColumn(29, 29+260-4, -1)) //  7
    ch1c.addColumn(new MAGameColumn(33.555, 33.555+260-5, -1)) //  8
    ch1c.addColumn(new MAGameColumn(37, 37+260-5, 47.514)) //  9
    ch1c.addColumn(new MAGameColumn(42, 42+260-6, -1)) // 10
    ch1c.addColumn(new MAGameColumn(39, 39+260-6, -1)) // 11
    ch1c.addColumn(new MAGameColumn(44, 44+260-7, -1)) // 12
    ch1c.addColumn(new MAGameColumn(47, 47+260-7, -1)) // 13
    ch1c.addColumn(new MAGameColumn(48, 48+260-8, -1)) // 14
    ch1c.addColumn(new MAGameColumn(52, 52+260-8, -1)) // 15
    ch1c.addColumn(new MAGameColumn(55, 55+260-9, -1)) // 16
    ch1c.addColumn(new MAGameColumn(45, 45+260-9, -1)) // 17
    ch1c.addColumn(new MAGameColumn(41, 41+260-10, -1)) // 18
    ch1c.addColumn(new MAGameColumn(46, 46+260-10, 55.223)) // 19

    let r1c = new MAReplay(ph1c, ch1c, "replay-c", 852, 1704012014980, 1704012014983, null)


    let ph1b = new MAPlayerPositionHistory()
    let baseTimestampB = 5226232
    ph1b.addPosition(20.19, baseTimestampB+0)
    ph1b.addPosition(22.612, baseTimestampB+7*1)
    ph1b.addPosition(119.0, baseTimestampB+7*2)
    ph1b.addPosition(181.5, baseTimestampB+7*3+2)
    ph1b.addPosition(0, baseTimestampB+7*4)


    let ch1b = new MAColumnHistory()

    ch1b.addColumn(new MAGameColumn(10, 10+260-1, -1)) //  0
    ch1b.addColumn(new MAGameColumn(15, 15+260-1, -1)) //  1
    ch1b.addColumn(new MAGameColumn(19, 19+260-2, -1)) //  2
    ch1b.addColumn(new MAGameColumn(24, 24+260-2, -1)) //  3
    ch1b.addColumn(new MAGameColumn(27, 27+260-3, -1)) //  4
    ch1b.addColumn(new MAGameColumn(30, 30+260-3, -1)) //  5
    ch1b.addColumn(new MAGameColumn(34.2, 34.2+260-4, -1)) //  6
    ch1b.addColumn(new MAGameColumn(29, 29+260-4, -1)) //  7
    ch1b.addColumn(new MAGameColumn(33.555, 33.555+260-5, -1)) //  8
    ch1b.addColumn(new MAGameColumn(37, 37+260-5, 47.514)) //  9
    ch1b.addColumn(new MAGameColumn(42, 42+260-6, -1)) // 10
    ch1b.addColumn(new MAGameColumn(39, 39+260-6, -1)) // 11
    ch1b.addColumn(new MAGameColumn(44, 44+260-7, -1)) // 12
    ch1b.addColumn(new MAGameColumn(47, 47+260-7, -1)) // 13
    ch1b.addColumn(new MAGameColumn(48, 48+260-8, -1)) // 14
    ch1b.addColumn(new MAGameColumn(52, 52+260-8, -1)) // 15
    ch1b.addColumn(new MAGameColumn(55, 55+260-9, -1)) // 16
    ch1b.addColumn(new MAGameColumn(45, 45+260-9, -1)) // 17
    ch1b.addColumn(new MAGameColumn(41, 41+260-10, -1)) // 18
    ch1b.addColumn(new MAGameColumn(46, 46+260-10, 55.223)) // 19
    ch1b.addColumn(new MAGameColumn(51, 51+260-11, -1)) // 20

    let r1b = new MAReplay(ph1b, ch1b, "replay-b", 870, 1704013014980, 1704013014983, r1c)




    let ph1a = new MAPlayerPositionHistory()
    let baseTimestampA = 5226235
    ph1a.addPosition(19.71, baseTimestampA+0)
    ph1a.addPosition(19.712, baseTimestampA+7*1)
    ph1a.addPosition(219.0, baseTimestampA+7*2)
    ph1a.addPosition(281.5, baseTimestampA+7*3+2)
    ph1a.addPosition(0, baseTimestampA+7*4)
    ph1a.addPosition(55.444, baseTimestampA+7*5+3)


    let ch1a = new MAColumnHistory()

    ch1a.addColumn(new MAGameColumn(20, 20+260-1, -1)) //  0
    ch1a.addColumn(new MAGameColumn(15, 15+260-1, -1)) //  1
    ch1a.addColumn(new MAGameColumn(19, 19+260-2, -1)) //  2
    ch1a.addColumn(new MAGameColumn(24, 24+260-2, -1)) //  3
    ch1a.addColumn(new MAGameColumn(27, 27+260-3, -1)) //  4
    ch1a.addColumn(new MAGameColumn(30, 30+260-3, -1)) //  5
    ch1a.addColumn(new MAGameColumn(34.2, 34.2+260-4, -1)) //  6
    ch1a.addColumn(new MAGameColumn(29, 29+260-4, -1)) //  7
    ch1a.addColumn(new MAGameColumn(33.555, 33.555+260-5, -1)) //  8
    ch1a.addColumn(new MAGameColumn(37, 37+260-5, 47.514)) //  9
    ch1a.addColumn(new MAGameColumn(42, 42+260-6, -1)) // 10
    ch1a.addColumn(new MAGameColumn(39, 39+260-6, -1)) // 11
    ch1a.addColumn(new MAGameColumn(44, 44+260-7, -1)) // 12
    ch1a.addColumn(new MAGameColumn(47, 47+260-7, -1)) // 13
    ch1a.addColumn(new MAGameColumn(48, 48+260-8, -1)) // 14
    ch1a.addColumn(new MAGameColumn(52, 52+260-8, -1)) // 15
    ch1a.addColumn(new MAGameColumn(49, 49+260-9, -1)) // 16
    ch1a.addColumn(new MAGameColumn(45, 45+260-9, -1)) // 17
    ch1a.addColumn(new MAGameColumn(41, 41+260-10, -1)) // 18
    ch1a.addColumn(new MAGameColumn(46, 46+260-10, 55.223)) // 19
    ch1a.addColumn(new MAGameColumn(51, 51+260-11, -1)) // 20


    let r1a = new MAReplay(ph1a, ch1a, "memalign", 868, 1704013514980, 1704013514983, r1b)

    assertEqual(r1a.replay, r1b)
    assertEqual(r1b.replay, r1c)
    assertEqual(r1c.replay, null)

    let str = r1a.encodeToString()

    assertTrue(!str.includes(","))
    assertTrue(!str.includes("%"))

    let r2a = MAReplay.replayFromEncodedString(str)

    assertEqual(r1a.name, r2a.name)
    assertEqual(r1a.score, r2a.score)
    assertEqual(r1a.timestamp, r2a.timestamp)

    let str2 = r2a.encodeToString()

    assertEqual(str, str2)


    let ph2a = r2a.playerPositionHistory

    assertEqual(ph1a.positionHistory.length, ph2a.positionHistory.length)

    for (let i = 0; i < ph1a.positionHistory.length; ++i) {
      let pp1 = ph1a.positionHistory[i]
      let pp2 = ph2a.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampA

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2a = r2a.columnHistory

    assertEqual(ch1a.columnHistory.length, ch2a.columnHistory.length)

    for (let i = 0; i < ch1a.columnHistory.length; ++i) {
      let c1 = ch1a.columnHistory[i]
      let c2 = ch2a.columnHistory[i]

      assertEqualFloats(c1.caveTop, c2.caveTop, 0.01)
      assertEqualFloats(c1.caveBottom, c2.caveBottom, 0.01)
      assertEqualFloats(c1.obstacle, c2.obstacle, 0.01)

      if (i == 9 || i == 19) {
        assertTrue(c2.obstaclePosition != -1)
      } else {
        assertEqual(c2.obstaclePosition, -1)
      }
    }

    assertEqual(ch2a.columnHistory[0].caveBottom-ch2a.columnHistory[0].caveTop, 259)


    let r2b = r2a.replay
    assertTrue(r2b.replay != null)
    assertEqual(r1b.name, r2b.name)
    assertEqual(r1b.score, r2b.score)
    assertEqual(r1b.timestamp, r2b.timestamp)

    let ph2b = r2b.playerPositionHistory

    assertEqual(ph1b.positionHistory.length, ph2b.positionHistory.length)

    for (let i = 0; i < ph1b.positionHistory.length; ++i) {
      let pp1 = ph1b.positionHistory[i]
      let pp2 = ph2b.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampB

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2b = r2b.columnHistory

    assertEqual(ch1b.columnHistory.length, ch2b.columnHistory.length)

    for (let i = 0; i < ch1b.columnHistory.length; ++i) {
      let c1 = ch1b.columnHistory[i]
      let c2 = ch2b.columnHistory[i]

      assertEqualFloats(c1.caveTop, c2.caveTop, 0.01)
      assertEqualFloats(c1.caveBottom, c2.caveBottom, 0.01)
      assertEqualFloats(c1.obstacle, c2.obstacle, 0.01)

      if (i == 9 || i == 19) {
        assertTrue(c2.obstaclePosition != -1)
      } else {
        assertEqual(c2.obstaclePosition, -1)
      }
    }

    assertEqual(ch2b.columnHistory[0].caveBottom-ch2b.columnHistory[0].caveTop, 259)



    let r2c = r2b.replay
    assertEqual(r2c.replay, null)
    assertEqual(r1c.name, r2c.name)
    assertEqual(r1c.score, r2c.score)
    assertEqual(r1c.timestamp, r2c.timestamp)

    let ph2c = r2c.playerPositionHistory

    assertEqual(ph1c.positionHistory.length, ph2c.positionHistory.length)

    for (let i = 0; i < ph1c.positionHistory.length; ++i) {
      let pp1 = ph1c.positionHistory[i]
      let pp2 = ph2c.positionHistory[i]

      let nts1 = pp1.timestamp - baseTimestampC

      assertEqualFloats(nts1, pp2.timestamp, 0.1)
      assertEqualFloats(pp1.yPos, pp2.yPos, 0.01)
    }


    let ch2c = r2c.columnHistory

    assertEqual(ch1c.columnHistory.length, ch2c.columnHistory.length)

    for (let i = 0; i < ch1c.columnHistory.length; ++i) {
      let c1 = ch1c.columnHistory[i]
      let c2 = ch2c.columnHistory[i]

      assertEqualFloats(c1.caveTop, c2.caveTop, 0.01)
      assertEqualFloats(c1.caveBottom, c2.caveBottom, 0.01)
      assertEqualFloats(c1.obstacle, c2.obstacle, 0.01)

      if (i == 9 || i == 19) {
        assertTrue(c2.obstaclePosition != -1)
      } else {
        assertEqual(c2.obstaclePosition, -1)
      }
    }

    assertEqual(ch2c.columnHistory[0].caveBottom-ch2c.columnHistory[0].caveTop, 259)

    DEBUG_STORE_COLUMNHISTORY = storeCHOrig
  }

  test_MAReplay_encodeDecode_withLimit() {
    let longReplay3973 = "67O7cEOiIYqnnYtnSWFSWFDnFSFYtnSWFSWnZFAAn&C=AAAAACcQAAABbx9OAAABdx9OAAAEIy7GAAAFNiwmAAAG8DKCAAAI4SpFAAAK9TNeAAAL6jGSAAAOcD42AAAPRjzDAAAQTD7QAAARtTrdAAASwD0XAAAT5Tp8AAAVZz9DAAAWQj2nAAAXPj&B=pAAAYqjtXAAAZTjwmAAAaeTknAAAa&B=TmbAAAcqDPAAAAdGzQ5AAAefTBKAAAf1zPvAAAhii3hAAAjvTcsAAAknTWrAAAl3TjjAAAmJji2AAAmLzi2AAAneDwJAAAohTm6AAApQDrBAAAp8DnkAAArRj1lAAAr&B=Dx5AAAszT3kAAAuAzsHAAAu7DykAAAv&B=TpzAAAwJTqBAAAw5TlZAAAyHjxYAAAzHTozAAAzfTp7AAA00TawAAA1yjiYAAA2dTemAAA4wELgAAA5zUB1AAA6iEGKAAA8rTg1AAA9WjkjAAA&B=zDTyAABDUkefAABEh0SzAABEtUTJAABEvUTJAABGnj2dAABIIUIlAABIjkHKAABKC0ZgAABKFUZgAABKMEZWAABMH01vAABMhU0cAABNJE3lAABPDEa&F=AABQFkjrAABRrUPvAABSGERMAABTUkFGAABUWEN&F=AABU6ULWAABWVkbSAABXXkSTAABXnES2AABZWD7VAABZoD7&B=AABaKD5cAABcTkeIAABd2kLYAABeLkMZAABe5UIXAABflUL3AABf&B=UKiAABgykPuAABiMEAGAABjNEIlAABjUEIfAABkjEU2AABlcEOXAABpglFkAABrDkzUAABrRUzuAABsyEhaAABtUUjkAABuk0WlAABvU0bBAABwhEPnAABxRET8AABx40Q7AABzNkfLAAB0m0PwAAB1N0S0AAB2K0LgAAB3fUZbAAB3h0ZZAAB4oUjLAAB6TUMtAAB95Vy5AAB&F=dFfKAAB&F=qlfkAACDKD3tAACDQj3hAACGWFEvAACHUE9jAACH&F=VBVAACMGDtAAACNBDzsAACNfjx&F=AACPvUbJAACR1z4OAACVU1I4AACWD1ATAACW&B=UzSAACX6067AACYhU4KAACaSlRIAACanVQVAACbuVaTAACcQlYFAACePlv9AACkGj9NAACl40WTAACm0EPzAACnFEQdAACn3kMAAACqvFLdAACqxVLcAACr3FUsAACsflRxAACtNFV5AACtilVLAACxQWO7AACxSWO6AACxU2O8AACyQGWJAACzR2N&B=AAC0TGWRAAC1NWPrAAC1iWQgAAC18GN9AAC4nFiCAAC5ulsEAAC6T1pmAAC6kFqhAAC6qlqrAAC8QVW9AAC8dlXVAAC&B=a05fAAC&F=Mk&F=vAAC&F=VlAIAADALU7CAADDD10NAADDvVwUAADDz1wYAADD&F=FwxAADGBVPEAADHl1ixAADH&B=1htAADIOFiQAADIZFh0AADJ7FLDAADLqFj7AADMHliRAADNNlr5AADNq1qDAADREWXyAADR9mRFAADS4GXcAADT2WPxAADUUGRfAADV1l&B=pAADWb2BXAADXlF2KAADZPmMvAADa2V2zAADbsV9DAADc01ywAADeKWCCAADeQ2B&B=AADfEWHqAADfo2FAAADfyGFLAADhplUC&d=67O7cEOiIYWSFYtnSWFSWFStSnF&C=AAAAACcQAAABDyK&B=AAAEMzhbAAAFajUVAAAGgzevAAAHZDYIAAAItzn0AAAJFjm0AAAKJDwlAAALizgZAAAMpzppAAANOTm7AAAP80FJAAAQfUCvAAARKEGPAAASGj&B=1AAAUnEbDAAAUpUbAAAAWDErIAAAW9kj9AAAXVUlDAAAYYUbxAAAYakbyAAAZp0O7AAAaUESbAAAbFUNbAAAbu0RJAAAcc0M7AAAdh0WoAAAeLUTTAAAfxUoSAAAgf0jvAAAhLknYAAAib0anAAAjM0fLAAAkeUScAAAlXEY5AAAmVkRgAAAm7kUVAAAoSkFcAAAo&F=EJBAAAp50CLAAAqdUEWAAAsDzveAAAsqzyPAAAtMzvpAAAxUkoFAAAytEYJAAAy0EYMAAAz8kNUAAA1BUW8AAA2AUONAAA3jkiXAAA32UhnAAA4&B=Er8AAA5AUr6AAA6ulEfAAA7mU&B=jAAA8Q1CVAAA9Nk7SAAA9j08UAAA&B=yUvxAAA&F=YUylAABAhUnyAABAwkoUAABCV0UcAABDE0ZJAABEBESQAABEcETtAABF3UCkAABGoEHBAABHzj7qAABJRUMnAABJdkMUAABMpE7gAABNx0xaAABOBkx9AABRAkHkAABRMEH0AABSzzzEAABT4T8DAABUPT69AABVSkD5AABV0EBXAABXFUOKAABXvkKVAABYR0MdAABZBkH3AABZWEItAABb1DqdAABdh0AcAABd5D&F=UAABeuUE5AABewUE3AABhzUtOAABh50tKAABiuUy3AABjdkusAABnkF1xAABomGGgAABtyUFwAABvE0S1AABvi0QxAABwBUSSAAByLDtBAABzXT4zAAB1SC&B=f&d=67O7cEOiIYDZFYtnSWFSWnnUnZU&C=AAAAACcQAAABPSEPAAAECTIkAAAEwDEBAAAGrDjZAAAHSjftAAAIWDpQAAAI2jnNAAAJtTtfAAAKbzpJAAALYjwVAAALajwTAAAO0Uk0AAAPekhbAAAQVEnPAAARSEfbAAARvUhCAAASrEZ6AAATn0hhAAAUWkdOAAAVxUt&F=AAAWAUtiAAAXEE3IAAAX&B=kwWAAAYp00EAAAZZUutAAAZ&B=0xpAAAb2EUGAAAcEkUpAAAdRkIbAAAf&B=UoAAAAg60gmAAAhdEi6AAAiNUeOAAAi0Ug8AAAjz0Y4AAAkSEafAAAld0O7AAAmA0RIAAAnWECyAAAn0EEeAAAo4D7eAAAprkAuAAApuEAuAAAq0T3cAAAr3EAQAAAsLz&F=hAAAtnEP6AAAt3UPcAAAvJEcTAAAveEbaAAAxEkwJAAAxzUr9AAAyVEuZAAAzrEgEAAA0fUlpAAA1EUilAAA2KUsiAAA2oEqoAAA3bkwFAAA3&B=UteAAA5n1D2AAA6IlBfAAA6lVDFAAA8cUmaAAA8ekmbAAA9o0bXAAA&B=lUixAAA&B=wUilAABAw1E3AABBbVBbAABB0VCxAABDUkwhAABD&B=00JAABGBkhCAABGNUhNAABHUkW9AABIYEfpAABI&F=UctAABKLkoaAABKNkoaAABLqE5TAABMKE3UAABNBk9SAABOE002AABQVV8i&d=67O7cEOiIYDUFYtnSWFSWnZFAAn&C=AAAAACcQAAABkB40AAAEhjEhAAAFmi54AAAGMy8&F=AAAGOy8&F=AAAHbCwSAAAJLDKAAAAKoS5EAAALrTCDAAAM8y1XAAAPoTs3AAAP0DsiAAAROD8BAAASDT2mAAAS8D85AAATsD4ZAAAUx0CMAAAVPEAnAAAWLUILAAAW1kEqAAAXx0MBAAAYTUJ1AAAZXETfAAAaTEL6AAAbF0Q6AAAcK0HNAAAcs0JeAAAdvEAjAAAeRkCtAAAfhj16AAAfxj2XAAAhDTpdAAAhwjtOAAAidTpaAAAjdjwvAAAjpjwZAAAk&F=j98AAAm&F=jeLAAAp&B=UCkAAAqzj9XAAArBz9vAAAsujnQAAAtfTqAAAAtmDp7AAAvGT73AAAwbTt7AAAwiTuCAAAzty3mAAA0Bi4TAAA0XS3WAAA1Pi&B=kAAA1&F=i57AAA2Bi59AAA4EyW7AAA4tyarAAA6AiMrAAA68yToAAA7oCP3AABALzaWAABA6TWBAABBXDXvAABC5DEvAABDWTGXAABE1y01AABFgC4tAABGPy0bAABHKy7fAABIJiz6AABJfTB6AABJ9y&F=8AABK&F=jINAABLEDIKAABLGTIKAABLuTOo"

    let replay = MAReplay.replayFromEncodedString(longReplay3973)

    let baseURL = "http://localhost:60764/sfcave/index.html#r="

    assertEqual(replay.encodeToString().length, 3973)
    assertEqual(replay.encodeToString().length + baseURL.length, 4016)

    assertTrue(replay.replay != null)
    assertTrue(replay.replay.replay != null)
    assertTrue(replay.replay.replay.replay != null)
    assertEqual(replay.replay.replay.replay.replay, null)


    let encodedWith3999 = replay.encodeToString(3999-baseURL.length)
    assertEqual(encodedWith3999.length, 3322)
    assertTrue(encodedWith3999.length + baseURL.length <= 3999)
    assertEqual(encodedWith3999.length + baseURL.length, 3365)

    let replay3999 = MAReplay.replayFromEncodedString(encodedWith3999)
    assertTrue(replay3999.replay != null)
    assertTrue(replay3999.replay.replay != null)
    assertEqual(replay3999.replay.replay.replay, null)


    let encodedWith3365 = replay.encodeToString(3365-baseURL.length)
    assertEqual(encodedWith3365.length, 3322)
    assertTrue(encodedWith3365.length + baseURL.length <= 3999)
    assertEqual(encodedWith3365.length + baseURL.length, 3365)

    let replay3365 = MAReplay.replayFromEncodedString(encodedWith3365)
    assertTrue(replay3365.replay != null)
    assertTrue(replay3365.replay.replay != null)
    assertEqual(replay3365.replay.replay.replay, null)


    let encodedWith3364 = replay.encodeToString(3364-baseURL.length)
    assertEqual(encodedWith3364.length, 2581)
    assertTrue(encodedWith3364.length + baseURL.length <= 3999)
    assertEqual(encodedWith3364.length + baseURL.length, 2624)

    let replay3364 = MAReplay.replayFromEncodedString(encodedWith3364)
    assertTrue(replay3364.replay != null)
    assertEqual(replay3364.replay.replay, null)


    let encodedWith1700 = replay.encodeToString(1700 - baseURL.length)
    assertEqual(encodedWith1700.length, 1674)
    let replay1700 = MAReplay.replayFromEncodedString(encodedWith1700)
    assertEqual(replay1700.replay, null)
  }

// PCEImage

  test_overwritePixelsWithPCEImage() {
    let baseImgStr = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    let baseImg = new PCEImage(baseImgStr)

    let rImg = new PCEImage(`.:#000000
o:#FFFFFF

ooo
ooo`)

    baseImg.overwritePixelsWithPCEImage(2, 3, rImg)

    let exp = `.:#000000
o:#FFFFFF

.....
.....
.....
..ooo
..ooo`

    assertEqual(baseImg.imageStr(), exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(0, 0, rImg)
    exp = `.:#000000
o:#FFFFFF

ooo..
ooo..
.....
.....
.....`

    assertEqual(baseImg.imageStr(), exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(-1, 0, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr(), exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(0, -1, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr(), exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(3, 0, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr(), exp)



    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(0, 4, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr(), exp)


    baseImg = new PCEImage(baseImgStr)
    baseImg.overwritePixelsWithPCEImage(3, 4, rImg)
    exp = `.:#000000
o:#FFFFFF

.....
.....
.....
.....
.....`

    assertEqual(baseImg.imageStr(), exp)
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
