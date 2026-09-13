if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ MADocument } = require('../src/MADocument.js'));
  ({ SpellGame } = require('../src/SpellGame.js'));
  ({ MAStorage } = require('../src/MAStorage.js'));
  ({ QUOTE_QUEST_QUOTES, RPG_ENEMIES, quoteWords } = require('../src/SpellGameRules.js'));
}

function makeStressGame(seed = 999) {
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

  const allQuoteWords = QUOTE_QUEST_QUOTES.flatMap(q => quoteWords(q));
  const lexiconWords = [
    ...allQuoteWords,
    "A", "I", "AN", "AND", "AT", "BE", "BY", "CAT", "DOG", "DO", "EACH", "GO", "IN", "IS", "IT",
    "ME", "MY", "NO", "ON", "OR", "SO", "TO", "UP", "US", "WE", "YOU", "THE", "WIN", "RUN"
  ];
  game.state.lexiconReady = true;
  game.state.lexicon = new Set(lexiconWords);

  return game;
}

class UnitTests_EndgameStress {
  stress_play_game_to_100_percent_completion() {
    const game = makeStressGame();
    game.startGame(12345);

    let steps = 0;
    const maxSteps = 30000;

    while (steps < maxSteps) {
      steps++;

      const completedQuotes = game.readCompletedQuotes();
      const defeatedEnemies = game.readJSON("spell-defeated-enemies", []);
      const uniqueEnemies = new Set(defeatedEnemies);

      if (completedQuotes.length === QUOTE_QUEST_QUOTES.length && uniqueEnemies.size === RPG_ENEMIES.length) {
        break;
      }

      if (!game.state.roundActive) {
        game.startGame(steps);
      }

      // If an enemy was defeated this round, end the round so endRound advances to the next enemy
      if (game.state.enemyDefeatedThisRound) {
        game.endRound();
        game.startGame(steps);
        continue;
      }

      const progress = game.readQuoteProgress();
      const quote = QUOTE_QUEST_QUOTES[progress.quoteIndex];
      let targetWord = null;
      if (defeatedEnemies.length > 0 && quote) {
        const words = quoteWords(quote);
        if (progress.wordIndex < words.length) {
          targetWord = words[progress.wordIndex];
        }
      }

      const availableTrayTiles = game.state.trayTiles.filter(Boolean);
      let scored = false;

      if (targetWord) {
        const neededLetters = targetWord.split("");
        const matchedTiles = [];
        const usedIndices = new Set();

        for (const ch of neededLetters) {
          const index = availableTrayTiles.findIndex((t, idx) => !usedIndices.has(idx) && t.letter === ch);
          if (index !== -1) {
            usedIndices.add(index);
            matchedTiles.push(availableTrayTiles[index]);
          }
        }

        if (matchedTiles.length === neededLetters.length) {
          matchedTiles.forEach(t => game.moveTile(game.state.trayTiles, game.state.wordTiles, t.id));
          game.scoreCurrentWord();
          if (game._testTimers && game._testTimers.timeoutFn) {
            const fn = game._testTimers.timeoutFn;
            game._testTimers.timeoutFn = null;
            fn();
          }
          scored = true;
        } else {
          if (game.state.wordTiles.length > 0) {
            game.clearWordTray();
          }
          game.dumpLetters();
          if (game._testTimers && game._testTimers.timeoutFn) {
            const fn = game._testTimers.timeoutFn;
            game._testTimers.timeoutFn = null;
            fn();
          }
        }
      } else {
        let foundWordTiles = null;
        for (const word of game.state.lexicon) {
          const wLetters = word.split("");
          const matched = [];
          const used = new Set();
          for (const ch of wLetters) {
            const idx = availableTrayTiles.findIndex((t, i) => !used.has(i) && t.letter === ch);
            if (idx !== -1) {
              used.add(idx);
              matched.push(availableTrayTiles[idx]);
            }
          }
          if (matched.length === wLetters.length) {
            foundWordTiles = matched;
            break;
          }
        }

        if (foundWordTiles) {
          foundWordTiles.forEach(t => game.moveTile(game.state.trayTiles, game.state.wordTiles, t.id));
          game.scoreCurrentWord();
          if (game._testTimers && game._testTimers.timeoutFn) {
            const fn = game._testTimers.timeoutFn;
            game._testTimers.timeoutFn = null;
            fn();
          }
          scored = true;
        } else {
          if (game.state.wordTiles.length > 0) {
            game.clearWordTray();
          }
          game.dumpLetters();
          if (game._testTimers && game._testTimers.timeoutFn) {
            const fn = game._testTimers.timeoutFn;
            game._testTimers.timeoutFn = null;
            fn();
          }
        }
      }

      if (game.state.timerSeconds <= 0) {
        game.endRound();
      }
    }

    const finalCompletedQuotes = game.readCompletedQuotes();
    const finalDefeatedEnemies = game.readJSON("spell-defeated-enemies", []);
    const finalUniqueEnemies = new Set(finalDefeatedEnemies);

    assertEqual(String(finalCompletedQuotes.length), String(QUOTE_QUEST_QUOTES.length));
    assertEqual(String(finalUniqueEnemies.size), String(RPG_ENEMIES.length));

    game.renderStatsPanel();
    assertEqual(game.elements.statsGameProgress.textContent, "Game progress: 100%");
    //console.log(`Stress test completed in ${steps} steps`); // 19058 steps at the time of test creation
  }
}

{
  const thisClass = UnitTests_EndgameStress;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
