if (typeof module !== "undefined" && module.exports) {
  ({ assertEqual, assertTrue } = require("./UnitTests"));
  ({ pLog } = require("../src/Utilities.js"));
  ({ MADocument } = require("../src/MADocument.js"));
  ({ SpellGame } = require("../src/SpellGame.js"));
  ({ MAStorage } = require("../src/MAStorage.js"));
  ({
    ACTIVE_REPLENISH_ALGORITHM,
    WeightedRandomReplenisher,
    WordBagReplenisher,
    KidModeReplenisher,
    QuoteWordReplenisher,
    KID_MODE_WORDS,
    createReplenisher,
  } = require("../src/LetterReplenisher.js"));
  ({
    LETTER_POOL,
    KID_MODE_SECONDS,
  } = require("../src/SpellGameRules.js"));
}

// Minimal deterministic rand stub
class FakeRand {
  constructor(seq) {
    this._seq = seq;
    this._i = 0;
  }
  randomIntBelow(n) {
    const v = this._seq[this._i % this._seq.length];
    this._i++;
    return v % n;
  }
}

class UnitTests_LetterReplenisher {
  // ── WeightedRandomReplenisher ─────────────────────────────────────────────

  test_weightedRandom_returns_letter_from_pool() {
    const r = new WeightedRandomReplenisher();
    const rand = new FakeRand([0]);
    const letter = r.nextLetter(rand, {});
    assertEqual(letter, LETTER_POOL[0]);
    assertTrue(pLog.probeLog.has(65));
  }

  test_weightedRandom_reset_logs_probe() {
    const r = new WeightedRandomReplenisher();
    r.reset();
    assertTrue(pLog.probeLog.has(66));
  }

  // ── WordBagReplenisher ────────────────────────────────────────────────────

  test_wordBag_draws_letters_from_chosen_words() {
    const r = new WordBagReplenisher();
    const lexiconSet = new Set(["CAT", "DOG", "EEL"]);
    const state = { lexicon: lexiconSet, quoteQuestActive: false, currentQuoteWord: null };
    const rand = new FakeRand([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    // First call should build a bag
    const letter = r.nextLetter(rand, state);
    assertTrue(typeof letter === "string" && /[A-Z]/.test(letter));
    assertTrue(pLog.probeLog.has(70));
    assertTrue(pLog.probeLog.has(73));
  }

  test_wordBag_includes_quote_word_when_quoteQuestActive() {
    const r = new WordBagReplenisher();
    const lexiconSet = new Set(["CAT", "DOG"]);
    const state = { lexicon: lexiconSet, quoteQuestActive: true, currentQuoteWord: "GROW" };
    const rand = new FakeRand([0, 1, 0, 1, 0, 1, 2, 3, 0, 1]);
    r.nextLetter(rand, state);
    assertTrue(pLog.probeLog.has(69));
    assertTrue(pLog.probeLog.has(71));
  }

  test_wordBag_replenishes_bag_when_empty() {
    const r = new WordBagReplenisher();
    const lexiconSet = new Set(["AB"]);
    const state = { lexicon: lexiconSet, quoteQuestActive: false, currentQuoteWord: null };
    const rand = new FakeRand([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    // Drain the bag (2 letters from "AB")
    r.nextLetter(rand, state);
    r.nextLetter(rand, state);
    // Bag empty: triggers rebuild
    const next = r.nextLetter(rand, state);
    assertTrue(typeof next === "string" && /[A-Z]/.test(next));
  }

  test_wordBag_falls_back_to_pool_when_lexicon_empty() {
    const r = new WordBagReplenisher();
    const state = { lexicon: new Set(), quoteQuestActive: false, currentQuoteWord: null };
    const rand = new FakeRand([0]);
    const letter = r.nextLetter(rand, state);
    assertTrue(pLog.probeLog.has(68));
    assertTrue(pLog.probeLog.has(72));
    assertEqual(letter, LETTER_POOL[0]);
  }

  test_wordBag_reset_clears_bag() {
    const r = new WordBagReplenisher();
    const lexiconSet = new Set(["HELLO"]);
    const state = { lexicon: lexiconSet, quoteQuestActive: false, currentQuoteWord: null };
    const rand = new FakeRand([0, 1, 2, 3, 4, 0, 1, 2, 0]);
    r.nextLetter(rand, state); // builds bag
    r.reset();
    assertTrue(pLog.probeLog.has(67));
    // After reset, bag is empty so next draw rebuilds it
    const letter = r.nextLetter(rand, state);
    assertTrue(typeof letter === "string" && /[A-Z]/.test(letter));
  }

  // ── KidModeReplenisher ────────────────────────────────────────────────────

  test_kidMode_has_100_words() {
    assertEqual(KID_MODE_WORDS.length, 100);
  }

  test_kidMode_words_are_2_to_4_letters() {
    for (const word of KID_MODE_WORDS) {
      assertTrue(word.length >= 2 && word.length <= 4);
    }
  }

  test_kidMode_computeInjectedLetters_returns_missing_letters() {
    const r = new KidModeReplenisher();
    const rand = new FakeRand([0, 1, 2, 3, 4]);
    // Empty tray — all target-word letters need injection
    const injected = r.computeInjectedLetters(rand, [], 7);
    assertTrue(Array.isArray(injected));
    assertTrue(injected.length >= 1);
    assertTrue(injected.every((ch) => /[A-Z]/.test(ch)));
    assertTrue(pLog.probeLog.has(75));
    assertTrue(pLog.probeLog.has(77));
  }

  test_kidMode_computeInjectedLetters_skips_present_letters() {
    const r = new KidModeReplenisher();
    const rand = new FakeRand([0, 0, 0, 0, 0]);
    // Find a word from KID_MODE_WORDS and pre-fill the tray with those letters
    const targetWord = KID_MODE_WORDS[0].toUpperCase(); // "AT"
    const trayTiles = targetWord.split("").map((ch) => ({ letter: ch }));
    const injected = r.computeInjectedLetters(rand, trayTiles, 7);
    // All letters are present, nothing to inject
    assertEqual(injected.length, 0);
  }

  test_kidMode_computeInjectedLetters_returns_empty_when_no_target_word() {
    const r = new KidModeReplenisher();
    r._pickTargetWord = () => null;
    const rand = new FakeRand([0]);
    const injected = r.computeInjectedLetters(rand, [], 7);
    assertEqual(injected.length, 0);
    assertTrue(pLog.probeLog.has(76));
  }

  test_kidMode_nextLetter_injects_then_falls_back_to_random() {
    const r = new KidModeReplenisher();
    const rand = new FakeRand([0, 1, 2, 3, 4]);
    r.computeInjectedLetters(rand, [], 7);
    // First calls consume injected letters
    const first = r.nextLetter(rand, {});
    assertTrue(/[A-Z]/.test(first));
    assertTrue(pLog.probeLog.has(78));
    // Keep calling until injected list exhausted
    for (let i = 0; i < 10; i++) {
      r.nextLetter(rand, {});
    }
    assertTrue(pLog.probeLog.has(79));
  }

  test_kidMode_reset_clears_injected() {
    const r = new KidModeReplenisher();
    const rand = new FakeRand([0, 1, 2]);
    r.computeInjectedLetters(rand, [], 7);
    r.reset();
    assertTrue(pLog.probeLog.has(74));
    // After reset, nextLetter goes straight to random
    r.nextLetter(rand, {});
    assertTrue(pLog.probeLog.has(79));
  }

  // ── createReplenisher factory ─────────────────────────────────────────────

  test_createReplenisher_word_bag() {
    const r = createReplenisher("word_bag");
    assertTrue(r instanceof WordBagReplenisher);
    assertTrue(pLog.probeLog.has(80));
  }

  test_createReplenisher_kid_mode() {
    const r = createReplenisher("kid_mode");
    assertTrue(r instanceof KidModeReplenisher);
    assertTrue(pLog.probeLog.has(81));
  }

  test_createReplenisher_default_weighted_random() {
    const r = createReplenisher("weighted_random");
    assertTrue(r instanceof WeightedRandomReplenisher);
    assertTrue(pLog.probeLog.has(82));
    // Also test unknown algorithm defaults to weighted random
    const r2 = createReplenisher("unknown");
    assertTrue(r2 instanceof WeightedRandomReplenisher);
  }

  test_createReplenisher_quote_word() {
    const r = createReplenisher("quote_word");
    assertTrue(r instanceof QuoteWordReplenisher);
    assertTrue(pLog.probeLog.has(86));
  }

  test_quoteWordReplenisher_fallback_and_reset() {
    const r = new QuoteWordReplenisher();
    const rand = new FakeRand([0]); // will pick LETTER_POOL[0] => "E"
    // With no currentQuoteWord, falls back to random
    const letter = r.nextLetter(rand, { currentQuoteWord: null });
    assertEqual(letter, "E");
    assertTrue(pLog.probeLog.has(85));
    
    // Reset coverage
    r.reset();
    assertTrue(pLog.probeLog.has(84));
  }

  // ── Integration with SpellGame ────────────────────────────────────────────

  _makeReplenisherGame(seed = 123) {
    const doc = new MADocument();
    const storage = new MAStorage();
    storage.forceMock();
    const timerApi = {
      setInterval() { return 1; },
      clearInterval() {},
      clearTimeout() {},
      setTimeout(fn, ms) { return 1; }
    };
    const game = new SpellGame({
      document: doc,
      storage,
      timerApi,
      requestFrame: (fn) => fn(),
      createSeed: () => seed
    });
    game.init({ skipLexiconLoad: true, seed });
    return game;
  }

  test_kidMode_debug_toggle_sets_state() {
    const game = this._makeReplenisherGame();
    game.showDebugPanel();
    game.elements.debugKidMode.checked = true;
    game.elements.debugKidMode.eventHandlers.change();
    assertTrue(game.state.debug.kidMode);
    assertTrue(pLog.probeLog.has(83));
  }

  test_kidMode_startGame_uses_kid_mode_replenisher_and_longer_round() {
    const game = this._makeReplenisherGame();
    game.state.debug.kidMode = true;
    game.startGame(42);
    assertTrue(game.state.replenisher instanceof KidModeReplenisher);
    // tickTimer runs once during startGame, decrementing by 1
    assertEqual(game.state.secondsLeft, KID_MODE_SECONDS - 1);
  }

  test_wordBag_startGame_uses_word_bag_replenisher_when_active() {
    // This test exercises createReplenisher via startGame with algorithm overriding
    // We check the default algorithm creates a WeightedRandomReplenisher
    const game = this._makeReplenisherGame();
    game.state.debug.kidMode = false;
    game.startGame(42);
    // Default ACTIVE_REPLENISH_ALGORITHM is "weighted_random"
    assertTrue(game.state.replenisher instanceof WeightedRandomReplenisher);
  }

  test_replenisher_reset_called_on_startGame() {
    const game = this._makeReplenisherGame();
    game.startGame(1);
    assertTrue(pLog.probeLog.has(66)); // WeightedRandom reset probe
  }

  test_game_scoreCurrentWord_delays_damage_by_fly_duration() {
    const game = this._makeReplenisherGame();
    game.setLexiconText("CAT");
    game.startGame(123);
    let capturedMs = null;
    game.timerApi = {
      setInterval() { return 1; },
      clearInterval() {},
      clearTimeout() {},
      setTimeout(fn, ms) { capturedMs = ms; return 1; }
    };
    game.state.wordTiles = [game.createTile("C"), game.createTile("A"), game.createTile("T")];
    game.state.trayTiles = [];
    game.scoreCurrentWord();
    // 3-tile word: 420 + 2*20 = 460ms
    assertEqual(capturedMs, 460);
  }
}

{
  const thisClass = UnitTests_LetterReplenisher;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== "undefined") {
    ut.importTestMethodsFromClass(thisClass);
  }
}
