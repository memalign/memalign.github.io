class GameGenerator_Number1stGrade extends MAGameGenerator {
  static SSWMFirstGradeRound = {
    Odd: 0,
    Even: 1,
    GreaterThan: 2,
    LessThan: 3,
    SingleDigitAdditionEquality: 4,
    SingleDigitAdditionGreaterThan: 5,
    SingleDigitAdditionLessThan: 6,
    Count: 7 // Not valid, used for book-keeping
  };

  constructor() {
    super();

    this.cachedRoundParamsLevel = -1;
    this.cachedRoundParams = null;

    this.cachedValuesMatchingLevel = -1;
    this.cachedValuesMatching = [];

    this.cachedValuesNonMatchingLevel = -1;
    this.cachedValuesNonMatching = [];
  }

  gameName() {
    return "Number Wolfer: 1st Grade";
  }

  static _valuesFrom(min, max, filter) {
    const ret = [];
    for (let i = min; i <= max; ++i) {
      let accept = true;
      if (filter) {
        accept = filter(i);
      }
      if (accept) {
        ret.push(i);
      }
    }
    return ret;
  }

  _getRoundParams(level) {
    if (level === this.cachedRoundParamsLevel) {
      return this.cachedRoundParams;
    }

    const roundID = level % this.constructor.SSWMFirstGradeRound.Count;
    const difficultyScale = Math.floor(level / this.constructor.SSWMFirstGradeRound.Count) + 1;
    let paramA = 0;

    switch (roundID) {
      case this.constructor.SSWMFirstGradeRound.GreaterThan:
      case this.constructor.SSWMFirstGradeRound.LessThan:
        paramA = (Math.floor(Math.random() * (4 * difficultyScale))) + 4;
        break;

      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionEquality:
      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionGreaterThan:
      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionLessThan:
        paramA = Math.floor(Math.random() * (11 * difficultyScale)) + 4;
        break;
    }

    this.cachedRoundParamsLevel = level;
    this.cachedRoundParams = { roundID, paramA };
    return this.cachedRoundParams;
  }

  _generateValues(level, matching) {
    if (matching) {
      if (this.cachedValuesMatchingLevel === level) {
        return this.cachedValuesMatching;
      }
    } else {
      if (this.cachedValuesNonMatchingLevel === level) {
        return this.cachedValuesNonMatching;
      }
    }

    const { roundID, paramA } = this._getRoundParams(level);

    let result = [];

    switch (roundID) {
      case this.constructor.SSWMFirstGradeRound.Odd:
      case this.constructor.SSWMFirstGradeRound.Even: {
        const timesThroughRounds = Math.floor(level / this.constructor.SSWMFirstGradeRound.Count);
        let max = 10;
        max = max * (timesThroughRounds + 1);

        result = this.constructor._valuesFrom(0, max, (i) => {
          const even = roundID === this.constructor.SSWMFirstGradeRound.Even;
          return (((i % 2) === 0) === even) === matching;
        });
        break;
      }

      case this.constructor.SSWMFirstGradeRound.GreaterThan:
      case this.constructor.SSWMFirstGradeRound.LessThan: {
        result = this.constructor._valuesFrom(Math.max(0, paramA - 10), paramA + 10, (i) => {
          const greaterThan = roundID === this.constructor.SSWMFirstGradeRound.GreaterThan;
          if (greaterThan) {
            return (i > paramA) === matching;
          } else {
            return (i < paramA) === matching;
          }
        });
        break;
      }

      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionEquality:
      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionGreaterThan:
      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionLessThan: {
        const ret = [];
        const vals = this.constructor._valuesFrom(-5, 10, null);
        const FUZZ = 3;

        for (const num of vals) {
          let a = num;
          let b = paramA - a;

          let x = Math.max(a, b);
          let y = Math.min(a, b);

          if (roundID === this.constructor.SSWMFirstGradeRound.SingleDigitAdditionEquality) {
            if (!matching) {
              let xFuzz = Math.floor(Math.random() * FUZZ);
              let yFuzz = Math.floor(Math.random() * FUZZ);
              if (xFuzz === 0 && yFuzz === 0)
                yFuzz = 1;
              x += xFuzz;
              y += yFuzz;
            }
          } else if (roundID === this.constructor.SSWMFirstGradeRound.SingleDigitAdditionGreaterThan) {
            if (matching) {
              let xFuzz = Math.floor(Math.random() * FUZZ);
              let yFuzz = Math.floor(Math.random() * FUZZ);
              if (xFuzz === 0 && yFuzz === 0)
                yFuzz = 1;
              x += xFuzz;
              y += yFuzz;
            }
          } else { // Less than
            if (matching) {
              let xFuzz = Math.floor(Math.random() * (x + 1));
              x -= xFuzz;

              if (y > 0) {
                let yFuzz = Math.floor(Math.random() * (y + 1));
                y -= yFuzz;
              }

              if ((x + y) === paramA) {
                x--;
              }
            } else {
              let xFuzz = Math.floor(Math.random() * FUZZ);
              let yFuzz = Math.floor(Math.random() * FUZZ);

              x += xFuzz;
              y += yFuzz;
            }
          }

          let operand = "+";
          if (y < 0) {
            operand = "-";
            y = -y;
          } else {
            const swapOrder = (Math.floor(Math.random() * 2)) === 0;
            if (swapOrder) {
              let temp = x;
              x = y;
              y = temp;
            }
          }
          ret.push(`${x} ${operand} ${y}`);
        }

        result = ret;
        break;
      }
    }

    if (matching) {
      this.cachedValuesMatchingLevel = level;
      this.cachedValuesMatching = result;
    } else {
      this.cachedValuesNonMatchingLevel = level;
      this.cachedValuesNonMatching = result;
    }

    return result;
  }

  generateMatchingValuesForLevel(level) {
    return this._generateValues(level, true);
  }

  generateNonMatchingValuesForLevel(level) {
    return this._generateValues(level, false);
  }

  failureStringForValue(level, value) {
    const { roundID, paramA } = this._getRoundParams(level);
    let roundName = this.titleForLevel(level);

    switch (roundID) {
      case this.constructor.SSWMFirstGradeRound.Odd:
        roundName = "odd";
        break;
      case this.constructor.SSWMFirstGradeRound.Even:
        roundName = "even";
        break;
    }
    return `"${value}" is not ${roundName}`;
  }

  titleForLevel(level) {
    const { roundID, paramA } = this._getRoundParams(level);
    switch (roundID) {
      case this.constructor.SSWMFirstGradeRound.Odd:
        return "Odd Numbers";
      case this.constructor.SSWMFirstGradeRound.Even:
        return "Even Numbers";
      case this.constructor.SSWMFirstGradeRound.GreaterThan:
        return `> ${paramA}`;
      case this.constructor.SSWMFirstGradeRound.LessThan:
        return `< ${paramA}`;
      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionEquality:
        return `= ${paramA}`;
      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionGreaterThan:
        return `> ${paramA}`;
      case this.constructor.SSWMFirstGradeRound.SingleDigitAdditionLessThan:
        return `< ${paramA}`;
    }
    return "Unknown";
  }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameGenerator_Number1stGrade };
}

if (typeof GameGenerators_classes !== 'undefined') {
  GameGenerators_classes["GameGenerator_Number1stGrade"] = GameGenerator_Number1stGrade;
}
