if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ MADocument } = require('../src/MADocument.js'));
  ({ SpellGame } = require('../src/SpellGame.js'));
  ({ pLog } = require('../src/Utilities.js'));
  ({ MAStorage } = require('../src/MAStorage.js'));
}

function makeQuoteQuestGame(seed = 123) {
  const doc = new MADocument();
  const storage = new MAStorage();
  storage.forceMock();
  const timers = {
    timeoutFn: null,
    timeoutMs: null
  };
  const timerApi = {
    setInterval() { return 1; },
    clearInterval() {},
    clearTimeout() {},
    setTimeout(fn, ms) {
      timers.timeoutFn = fn;
      timers.timeoutMs = ms;
      return 1;
    }
  };
  const game = new SpellGame({
    document: doc,
    storage,
    timerApi,
    requestFrame: (fn) => fn(),
    createSeed: () => seed
  });
  game._testTimers = timers;
  game.init({ skipLexiconLoad: true });
  game.startGame(seed);
  return game;
}

class UnitTests_QuoteQuest {
  test_quoteQuest_locked_by_default() {
    const game = makeQuoteQuestGame();
    // No enemies defeated
    assertTrue(!game.updateQuoteQuestForScoredWord("GROW"));
    assertEqual(String(game.readQuoteProgress().wordIndex), "0");
    assertTrue(pLog.probeLog.has(61));
  }

  test_quoteQuest_advances_only_pending_word() {
    const game = makeQuoteQuestGame();
    game.writeJSON("spell-defeated-enemies", ["Buzzing Bee"]);
    game.updateQuoteQuestForScoredWord("EACH");
    assertEqual(String(game.readQuoteProgress().wordIndex), "0");
    assertTrue(game.updateQuoteQuestForScoredWord("GROW"));
    assertEqual(String(game.readQuoteProgress().wordIndex), "1");
    assertTrue(pLog.probeLog.has(33));
  }

  test_quoteQuest_two_words_can_complete_in_same_round() {
    const game = makeQuoteQuestGame();
    game.writeJSON("spell-defeated-enemies", ["Buzzing Bee"]);
    assertTrue(game.updateQuoteQuestForScoredWord("GROW"));
    assertTrue(game.updateQuoteQuestForScoredWord("EACH"));
    assertEqual(String(game.readQuoteProgress().wordIndex), "2");
    assertTrue(game.elements.toast.textContent.includes("grow"));
    assertTrue(game.state.toastQueue[0].includes("each"));
    assertTrue(!game.elements.toast.classList.contains("toast-hidden"));
    assertEqual(String(game._testTimers.timeoutMs), "1800");
    assertTrue(pLog.probeLog.has(43));
    assertTrue(pLog.probeLog.has(44));
  }

  test_quoteQuest_completion_advances_to_next_quote() {
    const game = makeQuoteQuestGame();
    game.writeJSON("spell-defeated-enemies", ["Buzzing Bee"]);
    assertTrue(game.updateQuoteQuestForScoredWord("GROW"));
    assertTrue(game.updateQuoteQuestForScoredWord("EACH"));
    assertTrue(game.updateQuoteQuestForScoredWord("DAY"));
    assertEqual(game.readCompletedQuotes()[0], "Grow each day");
    assertEqual(String(game.readQuoteProgress().quoteIndex), "1");
    assertEqual(String(game.readQuoteProgress().wordIndex), "0");
    assertTrue(game.state.toastQueue[1].includes("Quote complete"));
    assertTrue(pLog.probeLog.has(34));
  }

  test_quoteQuest_next_quote_accepts_word_after_previous_completion() {
    const game = makeQuoteQuestGame();
    game.writeJSON("spell-defeated-enemies", ["Buzzing Bee"]);
    game.updateQuoteQuestForScoredWord("GROW");
    game.updateQuoteQuestForScoredWord("EACH");
    game.updateQuoteQuestForScoredWord("DAY");
    assertTrue(game.updateQuoteQuestForScoredWord("LEARN"));
    assertEqual(String(game.readQuoteProgress().quoteIndex), "1");
    assertEqual(String(game.readQuoteProgress().wordIndex), "1");
  }

  test_quoteQuest_round_over_shows_completed_quote_and_new_quote() {
    const game = makeQuoteQuestGame();
    game.writeJSON("spell-defeated-enemies", ["Buzzing Bee"]);
    game.updateQuoteQuestForScoredWord("GROW");
    game.updateQuoteQuestForScoredWord("EACH");
    game.updateQuoteQuestForScoredWord("DAY");
    game.endRound();
    assertTrue(game.elements.roundOverQuoteCompletion.textContent.includes("Grow each day"));
    assertTrue(game.elements.roundOverQuoteQuest.textContent.includes("Quote Quest"));
    assertTrue(game.elements.roundOverQuoteQuest.textContent.includes("Learn"));
  }

  test_quoteQuest_render_title_on_landing() {
    const game = makeQuoteQuestGame();
    game.writeJSON("spell-defeated-enemies", ["Buzzing Bee"]);
    game.showLandingPage();
    assertTrue(game.elements.landingQuoteQuest.textContent.includes("Quote Quest"));
    assertTrue(game.elements.landingQuoteQuest.textContent.includes("Spell the quote word-by-word"));
  }

  test_quoteQuest_word_classes_mark_completed_and_pending() {
    const game = makeQuoteQuestGame();
    game.writeJSON("spell-defeated-enemies", ["Buzzing Bee"]);
    game.updateQuoteQuestForScoredWord("GROW");
    game.renderQuoteQuest(game.elements.landingQuoteQuest);
    const wordSpans = game.collectNodes(game.elements.landingQuoteQuest, (node) => {
      return node.classList && node.classList.contains("quote-word-text");
    });
    assertTrue(wordSpans[0].classList.contains("completed-quote-word"));
    assertTrue(wordSpans[1].classList.contains("pending-quote-word"));
  }
}

{
  const thisClass = UnitTests_QuoteQuest;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
