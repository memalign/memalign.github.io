if (typeof module !== "undefined" && module.exports) {
  ({ pLog } = require("./Utilities.js"));
  ({
    LETTER_POOL,
    QUOTE_QUEST_QUOTES,
    quoteWords,
  } = require("./SpellGameRules.js"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Interface (documentation only — JS uses duck-typing)
//
// A LetterReplenisher must implement:
//   nextLetter(rand, state)  → string (single uppercase letter)
//   reset()                  → void   (called at game start)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Algorithm selector ───────────────────────────────────────────────────────
// Change this value to switch the primary letter-replenish algorithm.
// Valid values: "weighted_random" | "word_bag" | "kid_mode"
const ACTIVE_REPLENISH_ALGORITHM = "word_bag";

// ─── QuoteWordReplenisher ───────────────────────────────────────────────────────
class QuoteWordReplenisher {
  constructor() {
    this._queue = [];
  }

  reset() {
    this._queue = [];
    pLog.log(84);
  }

  nextLetter(rand, state) {
    if (this._queue.length === 0) {
      if (state && state.currentQuoteWord) {
        this._queue = state.currentQuoteWord.toUpperCase().split("").filter(ch => /[A-Z]/.test(ch));
      }
    }
    const letter = this._queue.shift();
    if (letter) {
      pLog.log(47);
      return letter;
    }
    pLog.log(85);
    const index = rand.randomIntBelow(LETTER_POOL.length);
    return LETTER_POOL[index];
  }
}

// ─── WeightedRandomReplenisher ────────────────────────────────────────────────
// Classic weighted-random pick from the full letter pool.
class WeightedRandomReplenisher {
  nextLetter(rand) {
    pLog.log(65);
    const index = rand.randomIntBelow(LETTER_POOL.length);
    return LETTER_POOL[index];
  }

  reset() {
    pLog.log(66);
  }
}

// ─── WordBagReplenisher ───────────────────────────────────────────────────────
// Pick 10 random words from the lexicon; if Quote Quest is active and the user
// has not completed all quotes also include the current quote word (11th word).
// Draw from the bag of letters created from those words. When exhausted, refill
// from a new set of 10 (or 11) words.
class WordBagReplenisher {
  constructor() {
    this._bag = [];
  }

  reset() {
    this._bag = [];
    pLog.log(67);
  }

  _buildBag(rand, lexiconWords, quoteWord) {
    // lexiconWords is an Array of strings from the lexicon Set
    const chosen = [];
    const total = lexiconWords.length;
    if (total === 0) {
      pLog.log(68);
      return [];
    }
    const count = Math.min(10, total);
    // Reservoir-style selection: just pick 10 random indices
    const picked = new Set();
    let attempts = 0;
    while (chosen.length < count && attempts < total * 2) {
      attempts++;
      const idx = rand.randomIntBelow(total);
      if (!picked.has(idx)) {
        picked.add(idx);
        chosen.push(lexiconWords[idx]);
      }
    }
    if (quoteWord) {
      pLog.log(69);
      chosen.push(quoteWord);
    }
    // Flatten all letters from chosen words into a bag
    const bag = [];
    for (const word of chosen) {
      for (const ch of word.toUpperCase()) {
        if (/[A-Z]/.test(ch)) {
          bag.push(ch);
        }
      }
    }
    // Shuffle the bag
    for (let i = bag.length - 1; i > 0; i--) {
      const j = rand.randomIntBelow(i + 1);
      const tmp = bag[i];
      bag[i] = bag[j];
      bag[j] = tmp;
    }
    pLog.log(70);
    return bag;
  }

  nextLetter(rand, state) {
    if (this._bag.length === 0) {
      const lexiconWords = state && state.lexicon ? Array.from(state.lexicon) : [];
      let quoteWord = null;
      if (state && state.quoteQuestActive && state.currentQuoteWord) {
        quoteWord = state.currentQuoteWord;
        pLog.log(71);
      }
      this._bag = this._buildBag(rand, lexiconWords, quoteWord);
    }
    if (this._bag.length === 0) {
      pLog.log(72);
      // Fallback: random from full pool
      const index = rand.randomIntBelow(LETTER_POOL.length);
      return LETTER_POOL[index];
    }
    pLog.log(73);
    return this._bag.pop();
  }
}

// ─── KidModeReplenisher ───────────────────────────────────────────────────────
// Ensures the tray always contains the letters needed to spell at least one of
// 100 simple 2-to-4 letter words a 5-year-old should be able to read.
// Letters for a "target word" are injected into the tray during replenishment;
// remaining slots are filled with weighted-random letters.
const KID_MODE_WORDS = [
  "at", "an", "am", "as", "up", "us", "if", "in", "is", "it",
  "be", "by", "do", "go", "he", "me", "my", "no", "on", "or",
  "so", "to", "we",
  "cat", "dog", "hen", "pig", "cow", "bee", "cup", "hat", "bat", "mat",
  "rat", "sat", "fat", "pat", "can", "man", "pan", "ran", "tan", "van",
  "big", "dig", "fig", "wig", "bit", "fit", "hit", "kit", "sit",
  "hop", "mop", "pop", "top", "cop", "bun", "fun", "run", "sun",
  "bed", "red", "fed", "led", "pot", "hot", "dot", "lot", "got",
  "bug", "hug", "jug", "mug", "rug", "tug", "tub", "cub", "hub", "rub",
  "cake", "lake", "make", "rake", "take", "wake", "bake",
  "gate", "hate", "late", "mate", "rate",
  "bite", "kite", "site",
  "bone", "cone", "tone", "zone", "home"
];

class KidModeReplenisher {
  constructor() {
    this._targetWord = null;
    this._injectedLetters = [];
  }

  reset() {
    this._targetWord = null;
    this._injectedLetters = [];
    pLog.log(74);
  }

  _pickTargetWord(rand, trayLetters) {
    // Find a word whose letters can mostly be satisfied, preferring words
    // that need the fewest missing letters. As a simple approach, pick
    // a random word from KID_MODE_WORDS that has <= (TILE_TARGET - 2) letters,
    // weighted toward words whose letters are already in the tray.
    const available = [...trayLetters];
    let bestWord = null;
    let bestMissing = Infinity;
    const shuffled = KID_MODE_WORDS.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = rand.randomIntBelow(i + 1);
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    for (const word of shuffled) {
      const upper = word.toUpperCase();
      const needed = upper.split("");
      const copy = [...available];
      let missing = 0;
      for (const ch of needed) {
        const idx = copy.indexOf(ch);
        if (idx === -1) {
          missing++;
        } else {
          copy.splice(idx, 1);
        }
      }
      if (missing < bestMissing) {
        bestMissing = missing;
        bestWord = upper;
        if (missing === 0) break; // Can't do better
      }
    }
    pLog.log(75);
    return bestWord;
  }

  // Returns letters that must be injected into the tray.
  // Called before normal replenishment; these letters fill empty slots first.
  computeInjectedLetters(rand, trayTiles, TILE_TARGET) {
    // Determine which letters are currently in the tray
    const trayLetters = trayTiles
      .filter((t) => t != null)
      .map((t) => t.letter);

    const targetWord = this._pickTargetWord(rand, trayLetters);
    if (!targetWord) {
      pLog.log(76);
      return [];
    }
    this._targetWord = targetWord;

    // Figure out which letters of the target are already in the tray
    const remaining = [...trayLetters];
    const toInject = [];
    for (const ch of targetWord) {
      const idx = remaining.indexOf(ch);
      if (idx !== -1) {
        remaining.splice(idx, 1);
      } else {
        toInject.push(ch);
      }
    }
    this._injectedLetters = toInject.slice();
    pLog.log(77);
    return toInject;
  }

  nextLetter(rand, _state) {
    if (this._injectedLetters.length > 0) {
      pLog.log(78);
      return this._injectedLetters.shift();
    }
    // Fill remaining slots with weighted-random
    pLog.log(79);
    const index = rand.randomIntBelow(LETTER_POOL.length);
    return LETTER_POOL[index];
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
function createReplenisher(algorithm) {
  if (algorithm === "word_bag") {
    pLog.log(80);
    return new WordBagReplenisher();
  }
  if (algorithm === "quote_word") {
    pLog.log(86);
    return new QuoteWordReplenisher();
  }
  if (algorithm === "kid_mode") {
    pLog.log(81);
    return new KidModeReplenisher();
  }
  pLog.log(82);
  return new WeightedRandomReplenisher();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ACTIVE_REPLENISH_ALGORITHM,
    WeightedRandomReplenisher,
    WordBagReplenisher,
    KidModeReplenisher,
    QuoteWordReplenisher,
    KID_MODE_WORDS,
    createReplenisher,
  };
}
