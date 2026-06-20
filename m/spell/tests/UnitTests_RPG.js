if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ MADocument } = require('../src/MADocument.js'));
  ({ SpellGame } = require('../src/SpellGame.js'));
  ({ pLog } = require('../src/Utilities.js'));
  ({ getEnemyByIndex } = require('../src/SpellGameRules.js'));
  ({ MAStorage } = require('../src/MAStorage.js'));
}

function makeRpgGame(seed = 456) {
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

class UnitTests_RPG {
  test_rpg_enemy_initializes_with_first_enemy() {
    const game = makeRpgGame();
    assertEqual(game.state.enemyIndex, 0);
    assertEqual(game.state.enemyHp, 100);
    assertTrue(game.elements.enemySprite.textContent.includes("\uD83D\uDC1D"));
    assertTrue(pLog.probeLog.has(55));
  }

  test_rpg_enemy_takes_damage_on_score() {
    const game = makeRpgGame();
    game.state.lexiconReady = true;
    game.state.lexicon = new Set(["A"]);
    game.state.wordTiles = [game.createTile("A")];
    game.scoreCurrentWord();
    if (game._testTimers && game._testTimers.timeoutFn) {
      game._testTimers.timeoutFn();
    }

    assertEqual(game.state.enemyHp, 99);
    assertTrue(game.elements.enemyHpText.textContent.includes("99"));
    assertTrue(pLog.probeLog.has(57));
  }

  test_rpg_enemy_defeated_advances_after_round() {
    const game = makeRpgGame();
    game.state.lexiconReady = true;
    game.state.lexicon = new Set(["AA"]);
    game.state.enemyHp = 2;
    game.state.wordTiles = [game.createTile("A"), game.createTile("A")];
    game.scoreCurrentWord();
    if (game._testTimers && game._testTimers.timeoutFn) {
      game._testTimers.timeoutFn();
    }

    assertEqual(game.state.enemyHp, 0);
    assertTrue(game.state.enemyDefeatedThisRound);
    assertTrue(pLog.probeLog.has(56));

    game.endRound();
    assertEqual(game.state.enemyIndex, 1);
    assertEqual(game.state.enemyHp, 200);

    const defeated = game.readJSON("spell-defeated-enemies", []);
    assertTrue(defeated.length === 1);
    assertTrue(defeated[0] === "bee");
  }

  test_rpg_landing_page_shows_enemy() {
    const game = makeRpgGame();
    game.storage.setItem("spell-enemy-index", "1");
    game.storage.setItem("spell-enemy-hp", "50");
    game.state.enemyIndex = 1;
    game.state.enemyHp = 50;
    game.renderEnemy();
    game.showLandingPage();
    assertTrue(game.elements.landingEnemyHpText.textContent.includes("50"));
  }

  test_rpg_stats_panel_shows_defeated_enemies() {
    const game = makeRpgGame();
    game.writeJSON("spell-defeated-enemies", ["bee", "bee", "spider"]);
    game.renderStatsPanel();
    assertTrue(game.elements.statsDefeatedEnemies.textContent.includes("🐝 x2"));
    assertTrue(game.elements.statsDefeatedEnemies.textContent.includes("🕷️ x1"));
  }

  test_rpg_reset_progress_resets_enemy() {
    const game = makeRpgGame();
    game.window = { confirm: () => true };
    game.state.enemyIndex = 3;
    game.state.enemyHp = 100;
    game.storage.setItem("spell-enemy-index", "3");
    game.storage.setItem("spell-enemy-hp", "100");
    game.writeJSON("spell-defeated-enemies", ["bee"]);
    game.resetProgressWithConfirmation();
    assertEqual(game.state.enemyIndex, 0);
    assertEqual(game.state.enemyHp, 100);
  }

  test_rpg_capEnemyHp_keeps_original_max_but_starts_at_10() {
    const game = makeRpgGame();
    game.state.enemyIndex = 1;
    game.state.enemyHp = 200;
    game.elements.debugCapEnemyHp.checked = true;
    game.elements.debugCapEnemyHp.eventHandlers.change();
    assertEqual(String(game.state.enemyHp), "10");
    assertTrue(game.elements.enemyHpText.textContent.includes("10 / 200"));
    assertTrue(pLog.probeLog.has(62));
  }

  test_rpg_capEnemyHp_applies_to_restored_and_new_enemies() {
    const game = makeRpgGame();
    game.storage.setItem("spell-enemy-index", "1");
    game.storage.setItem("spell-enemy-hp", "150");
    game.state.debug.capEnemyHp = true;
    game.startGame(10);
    assertEqual(String(game.state.enemyHp), "10");

    game.state.enemyHp = 0;
    game.state.enemyDefeatedThisRound = true;
    game.endRound();
    assertEqual(String(game.state.enemyHp), "10");
    assertTrue(pLog.probeLog.has(63));
  }

  test_rpg_getEnemyByIndex_cycles_with_superlatives() {
    // Cycle 0: base names
    assertEqual(getEnemyByIndex(0).name, "Buzzing Bee");
    assertEqual(getEnemyByIndex(0).hp, 100);
    // Cycle 1: first prefix
    assertEqual(getEnemyByIndex(5).name, "Brawling Buzzing Bee");
    assertEqual(getEnemyByIndex(5).hp, 100 * Math.pow(2, 5));
    // Cycle 2: second prefix
    assertEqual(getEnemyByIndex(10).name, "Brutal Buzzing Bee");
    // Last prefix clamps
    assertEqual(getEnemyByIndex(25).name, "Baneful Buzzing Bee");
    assertEqual(getEnemyByIndex(30).name, "Baneful Buzzing Bee");
  }

  test_rpg_defeat_shows_toast() {
    const game = makeRpgGame();
    game.state.lexiconReady = true;
    game.state.lexicon = new Set(["AA"]);
    game.state.enemyHp = 2;
    game.state.wordTiles = [game.createTile("A"), game.createTile("A")];
    const toasts = [];
    const origShowToast = game.showToast.bind(game);
    game.showToast = (msg) => { toasts.push(msg); origShowToast(msg); };
    game.scoreCurrentWord();
    if (game._testTimers && game._testTimers.timeoutFn) {
      game._testTimers.timeoutFn();
    }
    assertTrue(toasts.some(t => t.includes("defeated") && t.includes("Buzzing Bee")));
  }

  test_rpg_landing_enemy_title() {
    const game = makeRpgGame();
    assertTrue(game.elements.landingEnemyTitle !== undefined);
    assertTrue(game.elements.landingEnemyTitle.textContent.includes("is attacking!"));
    assertTrue(game.elements.landingEnemyTitle.textContent.includes("Buzzing Bee"));
  }
}

{
  const thisClass = UnitTests_RPG;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
