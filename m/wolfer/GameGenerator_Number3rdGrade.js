class GameGenerator_Number3rdGrade extends MAGameGenerator {
  constructor() {
    super();
    this._cache = {}; // cache by level for stability
  }

  gameName() {
    return "Number Wolfer: 3rd Grade";
  }

  // Helper: return integers [min, max], filtered
  static valuesFrom(min, max, filterFn) {
    const result = [];
    for (let i = min; i <= max; i++) {
      if (!filterFn || filterFn(i)) result.push(i);
    }
    return result;
  }
  
  _roundForLevel(level) {
    return level + 2;
  }

  _generateValues(level, matching) {
    const round = this._roundForLevel(level);
    const kNormalMax = 12;
    const max = Math.max(kNormalMax * kNormalMax, round * round);

    return this.constructor.valuesFrom(2, max, (i) => {
      const isTooBig = i > round * Math.max(kNormalMax, round);
      const isDivisible = (i % round) === 0;
      return !isTooBig && (isDivisible === matching);
    });
  }

  _cached(level, key, generatorFn) {
    // Each level has its own cache object
    if (!this._cache[level]) this._cache[level] = {};
    const levelCache = this._cache[level];

    if (!(key in levelCache)) {
      levelCache[key] = generatorFn();
    }

    return levelCache[key];
  }

  generateMatchingValuesForLevel(level) {
    return this._cached(level, "matching", () => this._generateValues(level, true));
  }

  generateNonMatchingValuesForLevel(level) {
    return this._cached(level, "nonmatching", () => this._generateValues(level, false));
  }

  titleForLevel(level) {
    return this._cached(level, "title", () => {
      const round = this._roundForLevel(level);
      return `Multiples of ${round}`;
    });
  }

  failureStringForValue(level, value) {
    const round = this._roundForLevel(level);
    return `${value}\nis not a multiple of ${round}`;
  }
}

// Register if environment supports it
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameGenerator_Number3rdGrade };
}

if (typeof GameGenerators_classes !== 'undefined') {
  GameGenerators_classes["GameGenerator_Number3rdGrade"] = GameGenerator_Number3rdGrade;
}