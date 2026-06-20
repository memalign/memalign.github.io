if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ MADocument } = require('../src/MADocument.js'));
  ({ SpellGame } = require('../src/SpellGame.js'));
  ({ pLog } = require('../src/Utilities.js'));
  ({ MAStorage } = require('../src/MAStorage.js'));
}

class UnitTests_SpellGame {
  _makeGame(seed = 123) {
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
    game.init({ skipLexiconLoad: true, seed });
    game.startGame(seed);
    return game;
  }

  test_game_builds_ui_in_MADocument() {
    const game = this._makeGame();
    assertTrue(!!game.document.getElementById("timer"));
    assertTrue(!!game.document.getElementById("letter-tray"));
    assertTrue(!!game.document.getElementById("play-again"));
    assertTrue(!!game.document.getElementById("landing-page"));
    assertTrue(!!game.document.getElementById("stats-overlay"));
    assertTrue(!!game.document.getElementById("give-up"));
    assertTrue(!!game.document.getElementById("debug-button"));
    assertTrue(!!game.document.getElementById("debug-overlay"));
  }

  test_game_landing_page_is_default_view() {
    const doc = new MADocument();
    const game = new SpellGame({ document: doc, fetchFn: null });
    game.init({ skipLexiconLoad: true });
    assertTrue(!game.elements.landingPage.classList.contains("hidden"));
    assertTrue(game.elements.gameShell.classList.contains("hidden"));
    assertTrue(pLog.probeLog.has(29));
  }

  test_game_replenish_is_deterministic_by_seed() {
    const first = this._makeGame(77);
    const second = this._makeGame(77);
    const firstLetters = first.state.trayTiles.map((tile) => tile.letter).join("");
    const secondLetters = second.state.trayTiles.map((tile) => tile.letter).join("");
    assertEqual(firstLetters, secondLetters);
  }

  test_game_preserves_lexicon_across_startGame() {
    const game = this._makeGame();
    game.setLexiconText("CAT");
    game.startGame(5);
    assertTrue(game.isValidWord("CAT"));
  }

  test_game_keyboard_moves_and_scores_word() {
    const game = this._makeGame();
    game.setLexiconText("CAT");
    game.state.trayTiles = [
      game.createTile("C"),
      game.createTile("A"),
      game.createTile("T"),
      game.createTile("E"),
      game.createTile("R"),
      game.createTile("S"),
      game.createTile("N")
    ];
    game.state.wordTiles = [];
    game.render();

    const makeEvent = (key) => ({
      key,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      preventDefault() { this.defaultPrevented = true; }
    });

    game.handleKeyDown(makeEvent("c"));
    game.handleKeyDown(makeEvent("a"));
    game.handleKeyDown(makeEvent("t"));
    assertEqual(game.computeWord(), "CAT");

    game.handleKeyDown(makeEvent("Enter"));
    assertTrue(game.state.score > 0);
    assertEqual(String(game.state.wordTiles.length), "0");
    assertEqual(game.readUniqueWords()[0], "CAT");
    assertEqual(String(game.readNumber("spell-lifetime-letters")), "3");
  }

  test_game_stats_panel_and_reset_progress() {
    const game = this._makeGame();
    game.showStatsPanel();
    assertTrue(pLog.probeLog.has(36));

    game.storage.setItem("spell-unique-words", JSON.stringify(["CAT", "DOG"]));
    game.storage.setItem("spell-lifetime-letters", "6");
    game.storage.setItem("spell-completed-quotes", JSON.stringify(["Grow each day"]));
    game.showStatsPanel();
    assertTrue(!game.elements.statsOverlay.classList.contains("hidden"));
    assertTrue(game.elements.statsUniqueWords.textContent.includes("2"));
    assertTrue(game.elements.statsLifetimeLetters.textContent.includes("6"));
    assertTrue(game.elements.statsGameProgress.textContent.includes("3%"));
    assertTrue(pLog.probeLog.has(30));
    assertTrue(pLog.probeLog.has(37));

    game.window = { confirm: () => false };
    assertTrue(!game.resetProgressWithConfirmation());
    assertTrue(pLog.probeLog.has(32));
    game.window = { confirm: () => true };
    assertTrue(game.resetProgressWithConfirmation());
    assertEqual(game.storage.getItem("spell-unique-words"), null);
    assertTrue(pLog.probeLog.has(31));
  }

  test_game_keyboard_still_scores_after_reset_progress() {
    const game = this._makeGame();
    game.window = { confirm: () => true, addEventListener() {} };
    assertTrue(game.resetProgressWithConfirmation());
    game.setLexiconText("CAT");
    game.state.roundActive = true;
    game.state.trayTiles = [
      game.createTile("C"),
      game.createTile("A"),
      game.createTile("T"),
      game.createTile("E"),
      game.createTile("R"),
      game.createTile("S"),
      game.createTile("N")
    ];
    game.state.wordTiles = [];
    const makeEvent = (key) => ({
      key,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      preventDefault() { this.defaultPrevented = true; }
    });
    game.handleKeyDown(makeEvent("C"));
    game.handleKeyDown(makeEvent("A"));
    game.handleKeyDown(makeEvent("T"));
    assertTrue(game.handleKeyDown(makeEvent("Enter")));
    assertTrue(game.state.score > 0);
  }

  test_game_readJSON_bad_data_uses_fallback() {
    const game = this._makeGame();
    game.storage.setItem("spell-unique-words", "{");
    assertEqual(String(game.readUniqueWords().length), "0");
    assertTrue(pLog.probeLog.has(35));

    const noStorageGame = new SpellGame({ document: new MADocument(), storage: null, fetchFn: null });
    noStorageGame.init({ skipLexiconLoad: true });
    noStorageGame.readUniqueWords();
    assertTrue(pLog.probeLog.has(39));
  }

  test_game_backspace_returns_last_word_tile() {
    const game = this._makeGame();
    const c = game.createTile("C");
    c.trayIndex = 2;
    game.state.trayTiles = [game.createTile("A"), game.createTile("B"), null];
    game.state.wordTiles = [c];
    game.render();

    const event = {
      key: "Backspace",
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      preventDefault() { this.defaultPrevented = true; }
    };

    game.handleKeyDown(event);
    assertEqual(String(game.state.wordTiles.length), "0");
    assertEqual(game.state.trayTiles[2].letter, "C");
  }

  test_game_letter_tray_keeps_empty_slot_when_tile_moves_to_word() {
    const game = this._makeGame();
    const c = game.createTile("C");
    const a = game.createTile("A");
    c.trayIndex = 0;
    a.trayIndex = 1;
    game.state.trayTiles = [c, a];
    game.state.wordTiles = [];
    assertTrue(game.moveTile(game.state.trayTiles, game.state.wordTiles, c.id));
    assertEqual(game.state.trayTiles[0], null);
    assertEqual(game.state.trayTiles[1].letter, "A");
    assertEqual(game.state.wordTiles[0].letter, "C");
    assertTrue(pLog.probeLog.has(59));
  }

  test_game_moveTile_missing_tile_logs_probe() {
    const game = this._makeGame();
    assertTrue(!game.moveTile(game.state.trayTiles, game.state.wordTiles, -1));
    assertTrue(pLog.probeLog.has(58));
  }

  test_game_word_tray_shifts_when_tile_removed() {
    const game = this._makeGame();
    const c = game.createTile("C");
    const a = game.createTile("A");
    game.state.trayTiles = [];
    game.state.wordTiles = [c, a];
    assertTrue(game.moveTile(game.state.wordTiles, game.state.trayTiles, c.id));
    assertEqual(game.state.wordTiles[0].letter, "A");
    assertTrue(game.state.wordTiles.length === 1);
  }

  test_game_return_to_tray_uses_original_empty_slot() {
    const game = this._makeGame();
    const c = game.createTile("C");
    const a = game.createTile("A");
    c.trayIndex = 0;
    a.trayIndex = 1;
    game.state.trayTiles = [null, a];
    game.state.wordTiles = [c];
    game.returnTileToTray(c.id);
    assertEqual(game.state.trayTiles[0].letter, "C");
    assertEqual(game.state.trayTiles[1].letter, "A");
  }

  test_game_dragging_within_letter_tray_reorders_tiles() {
    const game = this._makeGame();
    const a = game.createTile("A");
    const b = game.createTile("B");
    a.trayIndex = 0;
    b.trayIndex = 1;
    game.state.trayTiles = [a, b];
    game.state.wordTiles = [];
    game.render();
    game.state.drag = {
      tile: a,
      tileId: a.id,
      sourceZone: "tray",
      sourceIndex: 0,
      dragging: true,
      hoverZone: "tray",
      hoverIndex: 1,
      ghost: null
    };
    game.state.trayTiles[0] = null;
    game.commitDraggedTile();
    assertEqual(game.state.trayTiles[0].letter, "B");
    assertEqual(game.state.trayTiles[1].letter, "A");
    game.render();
    const placeholders = game.collectNodes(game.elements.letterTray, (node) => {
      return node.classList && node.classList.contains("tile-placeholder");
    });
    assertEqual(String(placeholders.length), "0");
  }

  test_game_beginPointerInteraction_ignores_sparse_tray_slots() {
    const game = this._makeGame();
    const a = game.createTile("A");
    game.state.trayTiles = [null, a];
    const node = game.renderTile(a, "tray", 1);
    game.beginPointerInteraction({
      currentTarget: node,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      preventDefault() {}
    });
    assertTrue(!!game.state.drag);
    assertEqual(String(game.state.drag.sourceIndex), "1");
  }

  test_game_scoreCurrentWord_replenishes_before_render() {
    const game = this._makeGame();
    game.setLexiconText("CAT");
    const c = game.createTile("C");
    const a = game.createTile("A");
    const t = game.createTile("T");
    c.trayIndex = 0;
    a.trayIndex = 1;
    t.trayIndex = 2;
    game.state.trayTiles = [null, null, null, game.createTile("S"), game.createTile("R"), game.createTile("N"), game.createTile("E")];
    game.state.wordTiles = [c, a, t];
    assertTrue(game.scoreCurrentWord());
    assertTrue(game.state.trayTiles[0] !== null);
    assertTrue(game.state.trayTiles[1] !== null);
    assertTrue(game.state.trayTiles[2] !== null);
    assertEqual(String(game.getRenderedTiles(game.elements.letterTray).length), "7");
  }

  test_game_appendFirstMatchingLetter_success_logs_probe() {
    const game = this._makeGame();
    const c = game.createTile("C");
    game.state.trayTiles = [c];
    game.state.wordTiles = [];
    assertTrue(game.appendFirstMatchingLetter("C"));
    assertTrue(pLog.probeLog.has(60));
  }

  test_game_layout_transition_runs_for_tap_cancel_and_backspace() {
    const game = this._makeGame();
    game.state.trayTiles = [
      game.createTile("C"),
      game.createTile("A"),
      game.createTile("T")
    ];
    game.state.wordTiles = [];
    game.render();

    game.appendFirstMatchingLetter("C");
    assertTrue(game.getRenderedTiles(game.elements.scoreWord).some((tile) => (tile.style.transition || "").includes("transform")));

    game.clearWordTray();
    assertTrue(game.getRenderedTiles(game.elements.letterTray).some((tile) => (tile.style.transition || "").includes("transform")));

    game.appendFirstMatchingLetter("A");
    game.popLastWordTile();
    assertTrue(game.getRenderedTiles(game.elements.letterTray).some((tile) => (tile.style.transition || "").includes("transform")));
  }

  test_game_multiplier_is_awarded_after_25_tiles() {
    const game = this._makeGame();
    game.setLexiconText("AAAAA");
    game.state.wordTiles = [
      game.createTile("A"),
      game.createTile("A"),
      game.createTile("A"),
      game.createTile("A"),
      game.createTile("A")
    ];
    game.state.trayTiles = [game.createTile("B"), game.createTile("C")];
    game.state.tilesScored = 20;
    game.scoreCurrentWord();
    assertTrue(game.state.trayTiles.some((tile) => tile.multiplier));
  }

  test_game_endRound_records_high_score() {
    const game = this._makeGame();
    game.state.score = 42;
    game.endRound();
    assertEqual(game.storage.getItem("spell-high-score"), "42");
    assertEqual(game.elements.finalScore.textContent, "42");
  }

  test_game_giveUp_button_ends_round() {
    const game = this._makeGame();
    game.elements.giveUp.click();
    assertTrue(!game.state.roundActive);
    assertTrue(!game.elements.overlay.classList.contains("hidden"));
  }

  test_game_roundOver_actions_contain_playAgain_and_exit() {
    const game = this._makeGame();
    const actionRows = game.collectNodes(game.elements.overlay, (node) => {
      return node.classList && node.classList.contains("overlay-actions");
    });
    assertEqual(String(actionRows.length), "1");
    assertTrue(actionRows[0].children.includes(game.elements.playAgain));
    assertTrue(actionRows[0].children.includes(game.elements.exitRound));
  }

  test_game_debug_panel_replenishes_with_quote_word() {
    const game = this._makeGame();
    game.showDebugPanel();
    assertTrue(!game.elements.debugOverlay.classList.contains("hidden"));
    assertTrue(pLog.probeLog.has(45));
    game.elements.debugReplenishQuoteWord.checked = true;
    game.elements.debugReplenishQuoteWord.eventHandlers.change();
    assertTrue(game.state.debug.replenishQuoteWord);
    assertTrue(pLog.probeLog.has(46));

    game.state.trayTiles = [];
    game.replenishTray();
    assertEqual(game.state.trayTiles.slice(0, 4).map((tile) => tile.letter).join(""), "GROW");
    assertTrue(pLog.probeLog.has(47));
  }

  test_game_word_tile_click_scores_during_suppression_window() {
    const game = this._makeGame();
    game.setLexiconText("CAT");
    const c = game.createTile("C");
    const a = game.createTile("A");
    const t = game.createTile("T");
    game.state.trayTiles = [];
    game.state.wordTiles = [c, a, t];
    game.render();
    game.state.suppressClickUntil = game.now() + 1000;
    assertTrue(game.handleTileClick(c.id, "word"));
    assertTrue(game.state.score > 0);
    assertTrue(pLog.probeLog.has(49));
  }

  test_game_endRound_restores_active_dragged_tile() {
    const game = this._makeGame();
    const a = game.createTile("A");
    const b = game.createTile("B");
    a.justSpawned = false;
    b.justSpawned = false;
    game.state.wordTiles = [b];
    const ghost = game.renderTile(a, "word", 0);
    game.document.body.appendChild(ghost);
    game.state.drag = {
      tile: a,
      tileId: a.id,
      sourceZone: "word",
      sourceIndex: 0,
      sourceNode: null,
      dragging: true,
      ghost
    };
    game.endRound();
    assertEqual(game.state.wordTiles.map((tile) => tile.letter).join(""), "AB");
    assertTrue(!game.state.drag);
    assertTrue(pLog.probeLog.has(48));
  }

  test_game_drop_animation_uses_ghost_rect() {
    const game = this._makeGame();
    const a = game.createTile("A");
    const b = game.createTile("B");
    a.justSpawned = false;
    b.justSpawned = false;
    game.state.wordTiles = [b];
    game.render();
    const ghost = game.renderTile(a, "word", 0);
    ghost.style.left = "96px";
    ghost.style.top = "0px";
    game.document.body.appendChild(ghost);
    game.state.drag = {
      tile: a,
      tileId: a.id,
      sourceZone: "word",
      sourceIndex: 0,
      sourceNode: null,
      dragging: true,
      hoverZone: "word",
      hoverIndex: 1,
      ghost
    };
    game.setDropAnimationFromGhost();
    game.commitDraggedTile();
    game.cleanupDrag();
    const animatedTile = game.getRenderedTiles(game.elements.scoreWord).find((tile) => tile.dataset.id === String(a.id));
    assertTrue((animatedTile.style.transition || "").includes("transform"));
    assertTrue(pLog.probeLog.has(50));
  }

  test_game_dumpLetters_delays_replenish_and_marks_dumping() {
    const game = this._makeGame();
    const beforeLetters = game.state.trayTiles.map((tile) => tile.id).join(",");
    assertTrue(game.dumpLetters());
    assertTrue(game.elements.letterTray.classList.contains("dumping"));
    assertEqual(String(game._testTimers.timeoutMs), "2000");
    const duringLetters = game.state.trayTiles.map((tile) => tile.id).join(",");
    assertEqual(duringLetters, beforeLetters);
    game._testTimers.timeoutFn();
    assertTrue(!game.elements.letterTray.classList.contains("dumping"));
    const afterLetters = game.state.trayTiles.map((tile) => tile.id).join(",");
    assertTrue(afterLetters !== beforeLetters);
  }

  test_game_loadLexicon_branches() {
    const noFetchGame = new SpellGame({ document: new MADocument(), fetchFn: null });
    noFetchGame.ensureUI();
    noFetchGame.cacheElements();
    noFetchGame.loadLexicon();
    assertTrue(pLog.probeLog.has(1));

    const okGame = new SpellGame({
      document: new MADocument(),
      fetchFn: () => ({ ok: true, text: () => "CAT" })
    });
    okGame.ensureUI();
    okGame.cacheElements();
    okGame.loadLexicon();
    assertTrue(pLog.probeLog.has(42));

    const badGame = new SpellGame({
      document: new MADocument(),
      fetchFn: () => ({ ok: false, status: 500, text: () => "" })
    });
    badGame.ensureUI();
    badGame.cacheElements();
    badGame.loadLexicon();
    assertTrue(pLog.probeLog.has(2));

    const thrownGame = new SpellGame({
      document: new MADocument(),
      fetchFn: () => { throw new Error("boom"); }
    });
    thrownGame.ensureUI();
    thrownGame.cacheElements();
    thrownGame.loadLexicon();
    assertTrue(pLog.probeLog.has(21));
  }

  test_game_loadLexicon_thenable_branches() {
    const thenableTextGame = new SpellGame({
      document: new MADocument(),
      fetchFn: () => ({
        then(onFulfilled) {
          onFulfilled({
            ok: true,
            text: () => ({
              then(onText) {
                onText("DOG");
                return { catch() {} };
              }
            })
          });
          return { catch() {} };
        }
      })
    });
    thenableTextGame.ensureUI();
    thenableTextGame.cacheElements();
    thenableTextGame.loadLexicon();
    assertTrue(pLog.probeLog.has(18));
    assertTrue(pLog.probeLog.has(16));
    assertTrue(thenableTextGame.isValidWord("DOG"));

    const rejectedGame = new SpellGame({
      document: new MADocument(),
      fetchFn: () => ({
        then() {
          return {
            catch(onRejected) {
              onRejected(new Error("nope"));
            }
          };
        }
      })
    });
    rejectedGame.ensureUI();
    rejectedGame.cacheElements();
    rejectedGame.loadLexicon();
    assertTrue(pLog.probeLog.has(20));
  }

  test_game_guard_branches_and_timer_end() {
    const game = this._makeGame();
    game.scoreCurrentWord();
    game.clearWordTray();
    game.state.wordTiles = [game.createTile("Q")];
    game.dumpLetters();
    game.appendFirstMatchingLetter("Z");
    game.state.secondsLeft = 0;
    game.tickTimer();
    assertTrue(pLog.probeLog.has(10));
    assertTrue(pLog.probeLog.has(12));
    assertTrue(pLog.probeLog.has(13));
    assertTrue(pLog.probeLog.has(14));
    assertTrue(pLog.probeLog.has(15));
  }

  test_game_score_guard_when_dragging() {
    const game = this._makeGame();
    game.state.drag = {};
    game.scoreCurrentWord();
    assertTrue(pLog.probeLog.has(9));
  }

  test_game_shouldFlickToTray_for_quick_downward_drag() {
    const game = this._makeGame();
    game.performanceNow = () => 120;
    const snapshot = {
      sourceZone: "word",
      startX: 10,
      startY: 10,
      startedAt: 0
    };
    const event = { clientX: 14, clientY: 70 };
    assertTrue(game.shouldFlickToTray(snapshot, event));
  }

  test_game_cloneTileNode_copies_dataset_and_text() {
    const game = this._makeGame();
    const tile = game.renderTile(game.createTile("Q"), "tray", 0);
    tile.style.left = "12px";
    tile.style.top = "20px";
    const clone = game.cloneTileNode(tile);
    assertEqual(clone.dataset.id, tile.dataset.id);
    assertEqual(clone.children[0].textContent, "Q");
    assertEqual(clone.children[1].textContent, "9");
    assertTrue(pLog.probeLog.has(22));
    assertTrue(pLog.probeLog.has(23));
  }

  test_game_flick_and_word_reorder_do_not_duplicate_tiles() {
    const game = this._makeGame();
    const a = game.createTile("A");
    const b = game.createTile("B");
    game.state.trayTiles = [];
    game.state.wordTiles = [a, b];
    game.render();

    game.state.drag = {
      tile: a,
      sourceZone: "word",
      sourceIndex: 0,
      hoverZone: "word",
      hoverIndex: 1
    };
    game.state.wordTiles = [b];
    game.commitDraggedTile();
    assertEqual(game.state.wordTiles.filter((tile) => tile.id === a.id).length, 1);
    assertEqual(game.state.wordTiles.map((tile) => tile.id).join(","), `${b.id},${a.id}`);

    game.state.wordTiles = [a];
    game.state.trayTiles = [];
    game.returnTileToTray(a.id);
    assertEqual(game.state.wordTiles.filter((tile) => tile.id === a.id).length, 0);
    assertEqual(game.state.trayTiles.filter((tile) => tile.id === a.id).length, 1);
  }

  test_game_copyStyleProperties_branch_coverage() {
    const game = this._makeGame();

    const sourceStyle = { 0: "skip", color: "red" };
    Object.defineProperty(sourceStyle, "readonlyThing", {
      enumerable: true,
      get() { return "x"; }
    });
    const targetStyle = {};
    Object.defineProperty(targetStyle, "readonlyThing", {
      set() { throw new Error("readonly"); }
    });
    game.copyStyleProperties(targetStyle, sourceStyle);
    assertEqual(targetStyle.color, "red");
    assertTrue(pLog.probeLog.has(24));
    assertTrue(pLog.probeLog.has(25));
    assertTrue(pLog.probeLog.has(26));

    const cssSource = {
      length: 1,
      item(index) { return index === 0 ? "background-color" : null; },
      getPropertyValue(name) { return name === "background-color" ? "blue" : ""; }
    };
    const targetWithSetProperty = {
      values: {},
      setProperty(name, value) { this.values[name] = value; }
    };
    game.copyStyleProperties(targetWithSetProperty, cssSource);
    assertEqual(targetWithSetProperty.values["background-color"], "blue");
    assertTrue(pLog.probeLog.has(27));

    const targetWithoutSetProperty = {};
    game.copyStyleProperties(targetWithoutSetProperty, cssSource);
    assertEqual(targetWithoutSetProperty["background-color"], "blue");
    assertTrue(pLog.probeLog.has(28));
  }

  test_game_scoreWord_pointerdown_triggers_score() {
    const game = this._makeGame();
    game.setLexiconText("CAT");
    game.state.wordTiles = [game.createTile("C"), game.createTile("A"), game.createTile("T")];
    game.render();
    game.elements.scoreWord.eventHandlers.pointerdown({ target: game.elements.scoreWord, preventDefault() {} });
    assertTrue(game.state.score > 0);
    assertTrue(pLog.probeLog.has(51));
  }

  test_game_resolveDropTarget_sensitivity() {
    const game = this._makeGame();
    game.state.wordTiles = [game.createTile("A"), game.createTile("B")];
    game.render();
    const tileNodes = game.getRenderedTiles(game.elements.scoreWord);
    // Mock rects
    tileNodes[0].getBoundingClientRect = () => ({ left: 10, width: 100, right: 110, top: 10, bottom: 110 });
    tileNodes[1].getBoundingClientRect = () => ({ left: 120, width: 100, right: 220, top: 10, bottom: 110 });
    game.elements.scoreWord.getBoundingClientRect = () => ({ left: 0, width: 300, right: 300, top: 0, bottom: 120 });
    // Should drop before index 1 if < 120 + 50 = 170.
    const hit = game.resolveDropTarget(160, 50);
    assertEqual(hit.zone, "word");
    assertEqual(String(hit.index), "1");
    assertTrue(pLog.probeLog.has(52));
  }

  test_game_cleanupOrphans_on_endRound() {
    const game = this._makeGame();
    const ghost = game.createElement("div", { className: "floating-letter" });
    let removed = false;
    ghost.remove = () => { removed = true; };
    game.document.body.appendChild(ghost);
    game.endRound();
    assertTrue(removed);
    assertTrue(pLog.probeLog.has(53));
  }

  test_game_playLayoutTransitions_adds_transform_for_dropped_tile() {
    const game = this._makeGame();
    game.requestFrame = (fn) => { game._deferredFrame = fn; };
    game.state.wordTiles = [game.createTile("A")];
    game.render();
    if (game._deferredFrame) game._deferredFrame();
    
    game.state.dropAnimation = {
      tileId: game.state.wordTiles[0].id,
      rect: { left: 50, top: 50, right: 90, bottom: 90, width: 40, height: 40 }
    };
    game.render();
    const tileNode = game.getRenderedTiles(game.elements.scoreWord)[0];
    assertTrue((tileNode.style.transform || "").includes("rotate(-4deg)"));
    assertTrue((tileNode.style.transform || "").includes("scale(1.06)"));
    assertTrue(pLog.probeLog.has(54));
  }
}

{
  const thisClass = UnitTests_SpellGame;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
