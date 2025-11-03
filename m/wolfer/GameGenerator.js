// Class responsibilities:
// GameGenerator specifies the values (e.g. words, numbers) that show up in the game grid

// Notes:
// - Games start on level 0 (which is displayed as level 1 in the UI)

class MAGameGenerator {
  constructor() {

  }

  gameName() {
    return "Yes Wolfer"
  }

  generateMatchingValuesForLevel(level) {
    return ["yes"]
  }

  generateNonMatchingValuesForLevel(level) {
    return ["reallylongword"]
  }

  titleForLevel(level) {
    return "Eat the yes"
  }

  failureStringForValue(level, value) {
    return `"${value}" is wrong on level ${level+1}`
  }

  // HunterBot pursues the user until the level is over or they
  // eliminate HunterBot via a Safe Space. Too challenging for young
  // kids.
  // Consider suppressing HunterBot entirely or on early levels
  // depending on target age for your game.
  isHunterBotAvailableOnLevel(level) {
    // HunterBot won't show up on the first level
    return level > 0;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MAGameGenerator };
}

if (typeof GameGenerators_classes !== 'undefined') {
  GameGenerators_classes["MAGameGenerator"] = MAGameGenerator;
}
