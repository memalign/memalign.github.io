// Class responsibilities:
// GameGenerator provides puzzles for each level

class MAGameGenerator {
  constructor() {
    // The original game's puzzles come from:
    // https://github.com/chockenberry/LightsOffTouch/blob/master/puzzles.plist
    //
    // Puzzles for a specific number of taps were generated using
    // the "test_generateLevels" method in UnitTests.js
    //
    // x means a cell is lit
    this.levels = [
      // Puzzles from the original game:
      "-x---|xxx--|-x-x-|--xxx|---x-",
      "xx-xx|x---x|-----|x---x|xx-xx",
      "--x--|--x--|xx-xx|--x--|--x--",
      "x----|-x---|--x--|---x-|----x",
      "xxxxx|xxxxx|-----|xxxxx|xxxxx",

      // Puzzles that take 3 taps:
      "xxxx-|x-x--|-xx--|-x---|-----",
      "-----|-----|-x--x|xxx-x|-xxx-",
      "x-xxx|xx-x-|x----|----x|---xx",
      "xxx--|---x-|xx-xx|-x-x-|-----",
      "-----|-----|--x--|x-xx-|-----",
      "----x|---xx|----x|-x--x|xxxxx",
      "-----|-----|--x--|-xxx-|--x--",
      "-xxxx|xxxx-|xx---|xx---|x----",
      "-----|-x---|x-xx-|x--xx|-x-x-",
      "xx---|x--x-|--x-x|--x-x|---x-",
      "-----|-x---|-xx-x|x--xx|x---x",
      "--x-x|--x-x|--xx-|-xxx-|--x--",
      "x-xxx|xx-x-|x-x--|-xxx-|--x--",
      "---xx|----x|-----|-----|-----",
      "--xx-|xx---|-x---|x----|xx---",
      "-xxx-|--xx-|---xx|-xx--|--x--",
      "-----|-----|-----|----x|---xx",
      "x-x--|-----|x----|-----|-----",
      "-x--x|--xx-|----x|---xx|----x",
      "xxx--|-x---|---x-|---xx|-xx--",

      // Puzzles that take 4 taps:
      "--xx-|----x|x---x|-x---|-x---",
      "-xxx-|-----|--xx-|xx--x|-x-xx",
      "---xx|----x|----x|---xx|----x",
      "xxxx-|-xxx-|-xxxx|--x--|-----",
      "-----|-----|----x|x--xx|xx--x",
      "-x---|xx---|--xx-|----x|-xx-x",
      "--xx-|-x--x|-xxx-|x-x--|x-x--",
      "-----|--x-x|xxx-x|xxx--|x--xx",
      "--xx-|xxxxx|---x-|--x--|-xxx-",
      "xxx--|-x---|-----|x----|xx---",
      "---x-|--xxx|---xx|---xx|----x",
      "-x---|xxxx-|x-xx-|--xxx|---x-",
      "-----|---x-|---xx|x-x--|-----",
      "xx---|x----|--x--|-xxx-|--x--",
      "-xxxx|--xxx|----x|---xx|--x--",
      "---xx|----x|x--x-|-xxxx|-x-x-",
      "----x|-x-x-|x----|x----|-----",
      "x-xxx|xx-x-|-----|x----|-xx--",
      "-x---|xxxx-|--x-x|xx--x|-x-x-",
      "xx---|x-xx-|xxxx-|x-xxx|---x-",

      // Puzzles that take 5 taps:
      "xx-xx|xx--x|xxx--|xx-x-|xxxxx",
      "xx--x|xxxx-|xx---|xxxx-|-xxxx",
      "-xx--|xxxxx|-x---|-----|-----",
      "-----|-----|-x---|-x---|xxxx-",
      "-----|-x---|xx-x-|----x|--xx-",
      "-xxxx|x---x|-x-xx|--xx-|-xxx-",
      "----x|---xx|---xx|--x-x|--x-x",
      "---x-|--xxx|--xx-|-x-x-|-x-x-",
      "-----|-xx--|--xx-|---x-|----x",
      "--x-x|-----|----x|-----|-----",
      "----x|--x-x|-x---|--xx-|-----",
      "---xx|-x-x-|xx---|-----|xx---",
      "xx-xx|x-x-x|----x|x--xx|----x",
      "xx---|x----|-----|-----|-----",
      "--xx-|xx---|-x-x-|x--xx|x-x--",
      "-----|x----|xxx-x|xxx-x|--x-x",
      "xxx--|--x-x|--x--|x----|xx---",
      "xx---|-----|xx---|x---x|---xx",
      "xx-xx|-xxx-|xxxx-|xxx-x|x--xx",
      "-----|-----|x-x-x|x--xx|xxx--",

      // Puzzles that take 6 taps:
      "--xx-|-x---|-x---|x-xx-|xxxxx",
      "--xx-|--x-x|-xx--|--x--|-xx-x",
      "-x-xx|xx-xx|-xxxx|xx-x-|xxx--",
      "--xxx|-xxx-|--xx-|x--x-|-x---",
      "-xxxx|---x-|x-xxx|x----|xx---",
      "-xx--|x--xx|xx-x-|-x--x|--xxx",
      "--x--|-x-x-|-----|-xxxx|--x--",
      "x--x-|-x-xx|-x-x-|xx-x-|---xx",
      "xx-xx|xxx--|-xx--|xxx--|-x---",
      "--xx-|-xx--|-----|-xx--|--xx-",
      "-----|-x--x|xxxxx|---xx|xx-xx",
      "--x--|-x---|-xx-x|--xxx|---xx",
      "xx---|xxx-x|x---x|--x-x|-xx-x",
      "---x-|xx---|-x-x-|--xx-|-x---",
      "xx---|--x--|xx--x|--xxx|-xxxx",
      "x-xx-|x-x--|-x---|xxx-x|-x-xx",
      "xx--x|x--xx|----x|xx---|--x--",
      "---x-|-----|-x---|--x--|--x--",
      "-xxx-|--x--|-----|-x---|xxx--",
      "-xx--|---xx|---xx|-xx-x|x-x--",

      // Puzzles that take 7 taps:
      "---xx|-x-xx|x-xxx|-xx--|xx-x-",
      "--x--|--x-x|xxx--|-xx--|-x-x-",
      "xxxx-|xxxxx|x-x--|--xxx|-xxx-",
      "--xxx|-x---|xx-xx|-----|-----",
      "-x---|-x---|x--x-|--xxx|---x-",
      "-----|x-xx-|xxxxx|--xx-|-xxx-",
      "x-xxx|-xxx-|---x-|xx-xx|-x-x-",
      "xxx-x|-x-x-|--xx-|x--xx|-xxx-",
      "-xxxx|xxx--|--xx-|xxx-x|-x--x",
      "xxx-x|-x--x|-xx--|xx--x|-x-x-",
      "-xxx-|---xx|---x-|xx-x-|----x",
      "--xx-|-x---|--x-x|-x-xx|xx-xx",
      "--xxx|---xx|---xx|--x-x|-xxx-",
      "---xx|-xx--|-xx-x|xx-xx|--xxx",
      "x-x--|x--xx|x--xx|-x-x-|-x-x-",
      "x-x-x|xxx-x|-xxx-|x--xx|xxx--",
      "-----|xx-xx|-x---|--x--|-xx--",
      "xx---|-x-xx|---xx|x----|x-x-x",
      "x-x--|--xxx|----x|---x-|-----",
      "---x-|xxxxx|xxxxx|xxxx-|xxx-x",

      // Puzzles that take 8 taps:
      "----x|x-xx-|x-x-x|x--x-|-xxxx",
      "-xx-x|-xxxx|-x-xx|x--xx|x--xx",
      "-xxx-|--x-x|x---x|xxxx-|x--x-",
      "---xx|-xx-x|x--x-|--x--|xxx--",
      "-xx-x|---x-|---x-|xxxx-|--x-x",
      "--x--|---xx|x--xx|x-x--|-x---",
      "----x|x-x--|-xx--|xx-x-|xxx--",
      "xx---|x----|-x---|-xx-x|x--xx",
      "xx-xx|xx-xx|xx-xx|-x-x-|-----",
      "x-x-x|x-xxx|-x--x|----x|---xx",
      "xxxxx|xx-x-|xxxx-|-x-x-|-x---",
      "x----|-x-x-|-----|-x--x|xx--x",
      "xxxxx|x-x--|x-xxx|xx---|x--xx",
      "xx---|-x-x-|-x-xx|xxx--|-x-xx",
      "xx--x|xxxx-|xxx--|x-xx-|---x-",
      "--xxx|---x-|x-x-x|x-xx-|x---x",
      "x-xx-|x-x--|--x--|---xx|x--x-",
      "-x---|-x-x-|-x--x|-xxxx|x--xx",
      "---x-|xxxxx|x-xxx|x--xx|-x--x",
      "-xxx-|-x-x-|x-xxx|-----|-xx--",

      // Puzzles in the original game:
      "-----|-----|x-x-x|-----|-----",
      "xx-xx|xx-x-|-x---|-x---|x----",
      "-x---|x-x--|-x---|--x--|-xxx-",
      "-x--x|xxx-x|-x-x-|-xxxx|-----",
      "xxx-x|-x-xx|-x--x|xxx--|-x---",
      "-xxx-|-xxx-|xx-xx|---x-|xxx--",
      "x-x--|xxxxx|x-x--|-x-x-|xx---",
      "--x--|xxx-x|xxxx-|xx-x-|--xx-",
      "-xxxx|xxxxx|-x-xx|--xxx|---xx",
      "-xxx-|x--x-|xxx--|x-xxx|x-x-x",
      "-xxx-|x-x--|xx--x|x--xx|-x-xx",
      "xx-xx|x--xx|---xx|-xxx-|---xx",
      "-x-x-|---xx|-x-x-|-----|-xxx-",
      "---x-|---x-|---x-|xxxxx|--x--",
      "x-xxx|xxx--|x-xxx|x-x-x|-----",
      "--xx-|---x-|xxxx-|xxx--|-x--x",
      "-xx--|x-xxx|-xxxx|xxxx-|xx-xx",
      "--x--|-xx--|----x|x-x--|xxxx-",
      "xx--x|-xxxx|--xxx|--x--|--xx-",
      "xxx--|-xxxx|--x--|-----|x---x",
      "--x-x|xxx--|-x--x|-xxxx|xxxx-",
      "-x-xx|x----|x-x--|x--x-|---xx",
      "--x--|x-x-x|xxx-x|xxx--|xxxx-",
      "--xxx|xx--x|--xxx|---x-|--xxx",
      "--x--|xx---|---xx|x-x-x|xx---",
      "xxxxx|x-x-x|x---x|-x-xx|---xx",
      "x--x-|-x--x|xx---|-x-x-|-xx-x",
      "x-x-x|-x--x|x-x-x|---x-|x---x",
      "-xxxx|-xx--|x-x--|xxx-x|-x-x-",
      "-x---|----x|x-x-x|---xx|xxxx-",
      "x---x|-x-x-|x--x-|--x-x|-xx-x",
      "xxx--|x-xxx|-----|-xx--|-----",
      "x-xxx|-xx--|--x-x|xx-x-|--x--",
      "-x--x|----x|x-x-x|----x|-xxx-",
      "-xx-x|xx---|xxxx-|xx-xx|-xx--",
      "--x--|-x--x|-----|-x--x|xx---",
      "xx---|x----|xx-x-|--xx-|xx-x-",
      "xx-x-|-xx--|xxx--|---xx|----x",
      "x-xx-|x-x-x|-xxxx|-x-xx|x--xx",
      "----x|-xxxx|-x---|xx--x|xx---",
      "----x|x-x-x|-xx-x|---xx|----x",
      "xx---|-x--x|-x-x-|---x-|--xxx",
      "-----|xx-x-|xxx-x|x----|-xxxx",
      "xx-x-|x----|-x--x|--xxx|--x-x",
      "xxxx-|x----|xx---|-xx-x|x----",
      "--xxx|xxx-x|---x-|-x-x-|x----",
      "x---x|xxxxx|-x--x|xx-x-|xxx--",
      "--xxx|xx--x|x-xxx|--xxx|x--xx",
      "x---x|xxx--|--xxx|----x|xx---",
      "-x-x-|-x-xx|xx--x|--xxx|x----",
      "x-x--|x---x|xx--x|--xx-|-xxx-",
      "--x--|xxxx-|xxxx-|---x-|--xx-",
      "xxx-x|-xxx-|xxx--|-xx-x|--x-x",
      "x---x|----x|----x|x-xxx|-xxxx",
      "x-xx-|---xx|-xx-x|--xxx|x-x-x",
      "---xx|--x--|x--xx|--xxx|x-x--",
      "-x---|-xx-x|x---x|x-xx-|xx--x",
      "--x-x|-xxxx|---x-|x-x-x|xx---",
      "-----|x-x-x|xxxx-|-----|----x",
      "x----|xx--x|xxxx-|xxxx-|-xxx-",
      "xxxx-|----x|-x--x|x--xx|--xx-",
      "-xx-x|xxx-x|xx-x-|--xx-|xx--x",
      "-xx-x|x-xx-|x-x--|xx-x-|-xx--",
      "-x--x|-x-x-|x--xx|xx-x-|--x-x",
      "x-xx-|--xxx|--xxx|x---x|xxx--",
      "xx--x|x--x-|xx---|x--x-|-x---",
      "xxx-x|x--x-|--xx-|xx--x|-xx-x",
      "x-xx-|-----|x-x-x|-----|xx-xx",
      "xx-x-|x-x-x|xxx-x|xxxx-|--xxx",
      "-xx-x|xxxx-|-xxxx|-xxxx|---x-",
      "-xxx-|-xx-x|-xxx-|-----|x--x-",
      "--x-x|x--xx|x-x-x|x--x-|x----",
      "xx--x|--xx-|-x--x|-xx--|x-x--",
      "-x-xx|xxxx-|xxxx-|xx--x|---xx",
      "-x--x|x---x|x-xx-|xx-xx|---xx",
      "-----|x----|-x-xx|-xxx-|x--xx",
      "x--xx|-----|xxx-x|x---x|x-xx-",
      "x-x-x|-xx-x|----x|xx-xx|-xx--",
      "x-x--|x--xx|---x-|xx---|x--x-",
      "x--x-|xx-x-|--xxx|--x--|-xxx-",
      "xxxx-|xx--x|x-x-x|xxx-x|--xx-",
      "---xx|-xxxx|---xx|x----|-x-x-",
      "-x-x-|-----|x--xx|x-x-x|--xx-",
      "-xx--|--x-x|x-xx-|x--xx|xxx-x",
      "x----|-xx--|-----|--x--|-xx--",
      "xxxx-|xxxxx|xxx-x|-xxxx|-xxx-",
      "xxx--|xxx-x|-x--x|---xx|x---x",
      "x---x|--xx-|--xx-|--xx-|-xxxx",
      "x-xx-|--x--|-xx-x|x-x--|-x--x",
      "--x--|x----|-x-xx|--xx-|x-xxx",
      "-xxxx|xxxxx|xx-xx|-x---|x----",
      "--xxx|----x|--x-x|-xx--|-x---",
      "----x|-x-xx|--x--|--xxx|xx--x",
      "-xx-x|-----|--xx-|xxxx-|xxxx-",
      "xxx--|x----|xxx-x|-xx-x|xx-x-",
      "-----|-----|-x-x-|--x-x|x---x",
      "--x--|----x|-x--x|x-xx-|x---x",
      "xx---|-x--x|-xxxx|-xx--|x-xxx",
      "xxxx-|-xxxx|xxxx-|xx---|-xxx-",
      "xxx-x|-x-x-|-xx-x|xxxx-|xx-x-",
      "-xxx-|---x-|x--xx|xx--x|-x-xx",
      "-----|--xxx|xxx--|xx--x|xxx--",
      "xx-xx|x-xx-|xxxx-|xxx--|x--xx",
      "--x--|x----|xxx--|xxxx-|x---x",
      "----x|--xx-|xxxxx|x----|xxx-x",
      "-x---|x-x-x|-xxx-|-x-xx|xxxx-",
      "-xxxx|x-x-x|x--x-|---x-|--xx-",
      "xxx-x|-xx--|xxx-x|-xx-x|x---x",
      "x-xxx|-xx--|xxxx-|x----|xxxxx",
      "-x-xx|x-xxx|xxx-x|-x-xx|x-x-x",

      // Manually crafted final levels
      "x---x|-x-x-|-----|-x-x-|x---x", // tap along both diagonals
      "-x-x-|x---x|-----|x---x|-x-x-", // tap along the +
      "xxxxx|x-x-x|xx-xx|x-x-x|xxxxx", // tap outer boundary
      "x---x|-xxx-|-xxx-|-xxx-|x---x", // tap every cell
      "xxxxx|xxxxx|xxxxx|xxxxx|xxxxx", // every cell is lit

      // In the original game but not solvable:
      //"xx---|xxxx-|--xx-|-xxxx|-x-x-",
      //"-x-x-|xxx-x|xxxxx|-x--x|----x",
      //"x----|-xx--|xxx-x|-x---|xxx-x",
      //"x-xx-|x-xx-|-x--x|xx--x|x----",
      //"x----|-xxxx|xx-xx|x----|---xx",
      //"-x-x-|-x-x-|-x-x-|x--x-|x--xx",
      //"-x---|x--xx|xx-xx|x-xx-|--x--",
      //"xxx--|--xxx|--x-x|--xxx|-x--x",
      //"x-x-x|-xxxx|xxxxx|-x-xx|-xx--",
      //"x--xx|x-xxx|x----|xx-xx|xxxx-",
      //"x----|x-xx-|-----|xxx--|xx-xx",
      //"x--x-|xx---|xxxx-|xx---|xx-xx",
      //"--x-x|-xx--|x-x-x|x---x|--xxx",
      //"---xx|xxx-x|-x--x|x--x-|-x---",
      //"x--xx|-x---|x-xx-|-xxxx|-xxx-",
      //"x---x|xx--x|-----|-----|x----",
      //"xxx-x|x-x-x|x-x-x|xxxxx|xx-xx",
      //"x-xxx|-x--x|-x-xx|xxxxx|---x-",
      //"x--x-|-xxxx|---x-|xx--x|--xxx",
      //"xx--x|x-x-x|xx---|---xx|xxxxx",
      //"xxxxx|--xxx|xx--x|--x--|--x--",
      //"xx--x|--xx-|x---x|xx-x-|x--x-",
      //"---xx|xxxxx|x-xx-|-xxxx|x-xxx",
      //"xxxx-|-x--x|xxxx-|-xxxx|x--xx",
      //"-----|-xx--|xxx-x|x-x-x|x--x-",
      //"---x-|xxxx-|-x---|-xx-x|x----",
      //"xxx--|-x---|x--x-|x----|x--xx",
      //"xx---|xxx-x|xx--x|-xxxx|-xxx-",
      //"x----|x----|x-xx-|xx---|--xxx",
      //"-x---|x-x--|---xx|x-xxx|--xxx",
      //"xx-x-|x-xx-|x----|x--x-|----x",
      //"xx--x|---x-|xx--x|x---x|--xx-",
      //"-x---|xx---|-xx--|---xx|xxx-x",
      //"--x-x|-xx--|-x--x|-x-xx|x--x-",
      //"xx--x|xxxxx|x-xxx|-xx--|--xx-",
      //"---x-|xx--x|xxx--|x-xx-|-x--x",
      //"x-x--|x-x-x|xx-x-|-x-x-|x--xx",
      //"x--xx|-x--x|x----|---x-|x-x--",
      //"xxx-x|-x---|-x-xx|x--xx|xx--x",
      //"--xx-|x---x|--xxx|xx--x|x-xx-",
      //"-xx--|-xxxx|xx--x|--xx-|--xx-",
      //"x--xx|x---x|x---x|x-xxx|-xx-x",
      //"-----|xxx-x|--x--|xxxxx|x-xxx",
      //"-xx-x|-x--x|--xx-|xxx-x|x-x-x",
      //"x----|-xx-x|x-x-x|--x-x|x-xx-",
      //"-x--x|-xxxx|-xx-x|--xx-|-x-xx",
      //"xxxx-|xxxxx|---xx|--xx-|xx---",
      //"x---x|xx-xx|-x---|-xx--|-x-x-",
      //"xxxx-|--xxx|xx---|--xx-|xx-xx",
      //"---xx|--x--|xx---|x-xx-|x-xxx",
      //"x-x-x|-xxx-|x--x-|x-x-x|xx--x",
      //"xx--x|--xxx|xx---|-x--x|xx-xx",
      //"----x|xx-xx|--xxx|x-xxx|x-x-x",
      //"-x--x|xxx--|xx-x-|-x-xx|x--x-",
      //"----x|x-x-x|-----|x-x-x|-xx-x",
      //"--x--|---xx|--x-x|-x---|xx---",
      //"---xx|-xx-x|x--x-|x---x|-x---",
      //"-----|-x---|xx-x-|xxxx-|x--x-",
      //"-----|-xxxx|-x-x-|-x---|xxx-x",
      //"----x|--x-x|x---x|--xx-|--x--",
      //"-----|-xx--|---xx|x--x-|-xx--",
      //"x--x-|-xx--|-xx-x|----x|x--xx",
      //"x-xxx|--x--|x---x|-xxx-|-xx-x",
      //"x-xxx|-x-x-|---x-|-x-x-|xxxx-",
      //"x--x-|-xxxx|x----|x--x-|---xx",
      //"xxx-x|-x-xx|-xxxx|--x--|x--xx",
      //"x----|-----|---xx|x----|x-x-x",
      //"-x-xx|--x--|x-x--|x-xxx|xxxx-",
      //"-----|xxxxx|--x-x|x-x-x|x--x-",
      //"xxxx-|-xxx-|---xx|x--x-|xxxxx",
      //"-x---|--xx-|x-xx-|xx-x-|-xxx-",
      //"xx---|xxx--|-----|x--xx|-xxxx",
      //"xxxxx|---xx|xxxx-|x--x-|x-xx-",
      //"-----|-x-xx|x-xxx|---x-|xx-xx",
      //"--x--|-xx--|-x-x-|xxxxx|x-x--",
      //"-xxxx|--xxx|x--xx|--xxx|x----",
      //"xx---|-xx--|--xx-|xxxx-|-x--x",
      //"--xxx|xxx--|-xx--|x-xxx|xx-xx",
      //"x-xx-|-x--x|xx-x-|xx-xx|-xx-x",
      //"x----|x-xx-|x-xxx|xx-x-|-x-xx",
      //"-x---|xxx-x|x-xxx|x--x-|xxx-x",
      //"xxx--|x-x-x|xx-x-|xx-x-|---xx",
      //"---xx|---x-|x----|-xx-x|x-xx-",
      //"x--xx|xxxx-|-x-x-|xx-x-|--xxx",
      //"-x-x-|x--xx|xxx-x|--xx-|-----",
      //"---x-|---xx|xx--x|xxxxx|----x",
      //"x-x-x|xx---|---xx|---xx|-xxxx",
      //"x---x|----x|x--x-|xxxxx|x----",
      //"-x--x|xxxx-|xx-x-|x-x--|-----",
      //"----x|x-x--|---x-|xx--x|-xxxx",
      //"x-x-x|xx-xx|-x-xx|-xxx-|xxxxx",
    ]
  }

  puzzleStringForLevel(level) {
    return this.levels[level]
  }
}

