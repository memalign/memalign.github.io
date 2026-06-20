if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertEqualArrays, assertTrue } = require('./UnitTests'));
  ({
    LETTER_POOL,
    createLexiconSet,
    computeWord,
    scoreWordValue,
    formatTime
  } = require('../src/SpellGameRules.js'));
}

class UnitTests_SpellGameRules {
  test_rules_createLexiconSet_normalizes_lines() {
    const lexicon = createLexiconSet("cat\nDOG \n\nbird");
    assertTrue(lexicon.has("CAT"));
    assertTrue(lexicon.has("DOG"));
    assertTrue(lexicon.has("BIRD"));
  }

  test_rules_computeWord_and_scoreWordValue() {
    const tiles = [
      { letter: "C", multiplier: false },
      { letter: "A", multiplier: false },
      { letter: "T", multiplier: true },
      { letter: "S", multiplier: false },
      { letter: "E", multiplier: false }
    ];
    assertEqual(computeWord(tiles), "CATSE");
    assertEqual(String(scoreWordValue(tiles)), String((3 + 1 + 1 + 1 + 1 + 5) * 2));
  }

  test_rules_formatTime() {
    assertEqual(formatTime(120), "2:00");
    assertEqual(formatTime(9), "0:09");
  }

  test_rules_letterPool_contains_weighted_letters() {
    assertTrue(LETTER_POOL.includes("Q"));
    assertTrue(LETTER_POOL.includes("E"));
    assertTrue(LETTER_POOL.length > 26);
  }
}

{
  const thisClass = UnitTests_SpellGameRules;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
