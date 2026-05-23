if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
  ({ maDocument } = require('../src/MADocument.js'));
  ({ Camera } = require('../src/Camera.js'));
  ({ SettlerArrivalSequence } = require('../src/SettlerArrivalSequence.js'));
  ({ pLog } = require('../src/Utilities.js'));
  ({ maStorage } = require('../src/MAStorage.js'));
}

class UnitTests_Story {
  _getAllText(el) {
    let text = el && el.innerText ? el.innerText : "";
    if (!el || !el.children) {
      return text;
    }
    for (const child of el.children) {
      text += this._getAllText(child);
    }
    return text;
  }

  _findLandingSite(gs) {
    for (let y = 0; y < gs.gridSize; y++) {
      for (let x = 0; x < gs.gridSize; x++) {
        const cell = gs.grid.getCell(x, y);
        if (cell && cell.item === "Space Ship") {
          return { x, y };
        }
      }
    }
    return null;
  }

  _revealSettlerLandingArea(gs, landingSite) {
    for (let y = Math.max(0, landingSite.y - 3); y <= Math.min(gs.gridSize - 1, landingSite.y + 3); y++) {
      for (let x = Math.max(0, landingSite.x - 3); x <= Math.min(gs.gridSize - 1, landingSite.x + 3); x++) {
        const cell = gs.grid.getCell(x, y);
        if (!cell || (x === landingSite.x && y === landingSite.y)) {
          continue;
        }
        cell.reveal();
        cell.character = null;
        cell.item = null;
        if (cell.landType === "water") {
          cell.landType = "grass";
        }
      }
    }
  }

  _createSettlerArrivalHarness(gs, messageSink = null) {
    const messages = messageSink || [];
    let endGamePayload = null;
    const playedNames = [];
    const ui = {
      addStoryMessage: (msg) => { messages.push(msg); },
      showEndGame: (summary, playTime) => { endGamePayload = { summary, playTime }; },
      playNamedSound: (name) => { playedNames.push(name); }
    };
    const landingSite = this._findLandingSite(gs);
    const camera = new Camera(800, 600, gs.gridSize, 60);
    const sequence = new SettlerArrivalSequence(gs, ui, camera, landingSite);
    return {
      gs,
      ui,
      camera,
      sequence,
      landingSite,
      messages,
      playedNames,
      getEndGamePayload: () => endGamePayload
    };
  }

  test_story_triggers() {
    const gs = new GameState();
    const ui = new UIManager(gs);
    const messages = [];
    ui.addStoryMessage = (msg) => { messages.push(msg); };

    // Intro
    gs.triggerStory("intro", ui);
    assertEqual(messages.length, 1);
    assertTrue(messages[0].includes("Welcome to the unexplored planet"));
    assertTrue(gs.state.story.introShown);

    // Carrots
    gs.triggerStory("carrot", ui);
    assertEqual(gs.state.story.carrotsGathered, 1);
    assertEqual(gs.state.survivalOdds, 1);
    assertTrue(messages[1].includes("survival odds have increased to 1%."));

    // Wood
    gs.triggerStory("wood", ui);
    assertEqual(gs.state.story.woodGathered, 1);
    assertEqual(gs.state.survivalOdds, 6); // 1 + 5
    assertTrue(messages[2].includes("abundance of natural resources"));

    // House
    gs.triggerStory("house", ui);
    assertEqual(gs.state.story.housesBuilt, 1);
    assertEqual(gs.state.survivalOdds, 10); // 6 + 4
    assertTrue(messages[3].includes("starting to feel like home"));

    // Animal
    gs.triggerStory("animal", ui);
    assertEqual(gs.state.story.animalsRecruited, 1);
    assertEqual(gs.state.survivalOdds, 15); // 10 + 5
    assertTrue(messages[4].includes("Even the fauna"));

    // Ore
    gs.triggerStory("ore", ui);
    assertEqual(gs.state.story.oreGathered, 1);
    assertEqual(gs.state.survivalOdds, 21); // 15 + 6
    assertTrue(messages[5].includes("struck ore"));

    // Tower
    gs.triggerStory("tower", ui);
    assertTrue(gs.state.story.commTowerBuilt);
    assertEqual(gs.state.survivalOdds, 31); // 21 + 10
    assertTrue(messages[6].includes("Lifeline established"));

  }

  test_survival_odds_limits() {
    const gs = new GameState();
    const ui = { addStoryMessage: () => {} };

    // 10 carrots -> 10%
    for (let i = 0; i < 15; i++) gs.triggerStory("carrot", ui);
    assertEqual(gs.state.story.carrotsGathered, 10);
    assertEqual(gs.state.survivalOdds, 10);

    // 3 wood -> +15% = 25%
    for (let i = 0; i < 5; i++) gs.triggerStory("wood", ui);
    assertEqual(gs.state.story.woodGathered, 3);
    assertEqual(gs.state.survivalOdds, 25);

    // 5 houses -> +20% = 45%
    for (let i = 0; i < 10; i++) gs.triggerStory("house", ui);
    assertEqual(gs.state.story.housesBuilt, 5);
    assertEqual(gs.state.survivalOdds, 45);

    // 2 animals -> +10% = 55%
    for (let i = 0; i < 5; i++) gs.triggerStory("animal", ui);
    assertEqual(gs.state.story.animalsRecruited, 2);
    assertEqual(gs.state.survivalOdds, 55);

    // 2 ore -> +12% = 67%
    for (let i = 0; i < 5; i++) gs.triggerStory("ore", ui);
    assertEqual(gs.state.story.oreGathered, 2);
    assertEqual(gs.state.survivalOdds, 67);

    // 1 tower -> +10% = 77%
    for (let i = 0; i < 2; i++) gs.triggerStory("tower", ui);
    assertTrue(gs.state.story.commTowerBuilt);
    assertEqual(gs.state.survivalOdds, 77);

  }

  test_end_game_timer_and_overlay() {
    if (typeof module !== 'undefined' && module.exports) {
        ({ GameEngine } = require('../src/GameEngine.js'));
    }
    const gs = new GameState();
    const ui = new UIManager(gs);
    const engine = new GameEngine(gs, ui);
    
    gs.state.endGameTimer = 100;
    engine.update(100);
    
    assertEqual(gs.state.endGameTimer, null);
    assertTrue(gs.state.gameEnded);
    assertTrue(pLog.probeLog.has(96), "Should log probe 96 (engine end game)");
    assertTrue(pLog.probeLog.has(97), "Should log probe 97 (ui show end game)");
  }

  test_engine_pauses_in_world_view() {
    if (typeof module !== 'undefined' && module.exports) {
        ({ GameEngine } = require('../src/GameEngine.js'));
    }
    const gs = new GameState();
    const ui = new UIManager(gs);
    const engine = new GameEngine(gs, ui);

    gs.state.gameEnded = true;
    gs.state.worldViewActive = true;
    gs.state.playTimeMs = 2500;

    engine.update(1000);

    assertEqual(gs.state.playTimeMs, 2500);
    assertEqual(engine.farmTimer, 0);
    assertEqual(engine.treeTimer, 0);
    assertEqual(engine.hatchTimer, 0);
    assertEqual(engine.exploreTimer, 0);
    assertEqual(engine.autoTimer, 0);
    assertEqual(engine.saveTimer, 0);
  }

  test_postgame_hides_missions_and_inventory() {
    const gs = new GameState();
    const ui = new UIManager(gs);
    const missions = maDocument.getElementById("missions-list");
    const inventory = maDocument.getElementById("inventory-info");

    ui.updateInventoryUI();
    assertTrue(!missions.classList.contains("hidden"), "Missions should be visible during gameplay");
    assertTrue(!inventory.classList.contains("hidden"), "Inventory should be visible during gameplay");

    gs.state.gameEnded = true;
    ui.showEndGame("Summary", "(1 minute)");
    ui.updateInventoryUI();
    ui.updateMissions();

    assertTrue(missions.classList.contains("hidden"), "Missions should be hidden after game end");
    assertTrue(inventory.classList.contains("hidden"), "Inventory should be hidden after game end");
  }

  test_hud_refinements() {
    const gs = new GameState();
    const ui = new UIManager(gs);
    const uiInfo = maDocument.getElementById("ui-info");
    const cellDetails = maDocument.getElementById("cell-details");
    const separator1 = maDocument.getElementById("hud-separator-1");
    const separator2 = maDocument.getElementById("hud-separator-2");
    const separator3 = maDocument.getElementById("hud-separator-3");

    uiInfo.scrollTop = 99;
    ui.addStoryMessage("Fresh story");
    assertEqual(uiInfo.scrollTop, 0);

    const shipCell = (() => {
      for (let y = 0; y < gs.gridSize; y++) {
        for (let x = 0; x < gs.gridSize; x++) {
          const cell = gs.grid.getCell(x, y);
          if (cell && cell.item === "Space Ship") {
            return { x, y, cell };
          }
        }
      }
      return null;
    })();

    ui.updateCellDetails(shipCell.x, shipCell.y, shipCell.cell);
    assertTrue(!this._getAllText(cellDetails).includes("Cell ["), "Cell details should not include coordinate prefix");
    assertTrue(!this._getAllText(cellDetails).includes("grass"), "Cell details should not include tile type");
    assertEqual(this._getAllText(cellDetails), "");

    ui.updateInventoryUI();
    assertTrue(separator1.classList.contains("hidden"), "No separator should remain above an empty cell-details section");
    assertTrue(separator2.classList.contains("hidden"), "Hidden diagnostics should not leave an extra separator");
    assertTrue(!separator3.classList.contains("hidden"), "A single separator should remain between visible missions and inventory sections");
  }

  test_settler_arrival_sequence() {
    const gs = new GameState();
    gs.state.playTimeMs = ((2 * 60) + 5) * 60000;
    gs.state.stats.animalsRecruited = 1;
    gs.state.stats.carrotsHarvested = 1;
    gs.state.stats.woodGathered = 1;
    gs.state.stats.seedsPlanted = 1;
    gs.state.stats.housesBuilt = 1;

    const landingSite = this._findLandingSite(gs);
    this._revealSettlerLandingArea(gs, landingSite);

    const harness = this._createSettlerArrivalHarness(gs);
    const { sequence, camera, messages, playedNames } = harness;

    assertTrue(sequence.start(), "Settler arrival sequence should start");
    assertTrue(messages[0].includes("Transmitting invitation to Earth"), "Should start with transmitting message");
    assertTrue(playedNames.includes("inviteSettlers"), "Should play inviteSettlers at sequence start");
    assertTrue(pLog.probeLog.has(105), "Should log probe 105");

    sequence.update(2000);
    assertTrue(messages[messages.length - 1].includes("Settlers arriving"), "Should show arrival message");
    assertTrue(pLog.probeLog.has(114), "Should log probe 114");

    sequence.update(2000);
    assertTrue(pLog.probeLog.has(115), "Should log probe 115");
    assertTrue(camera.targetX !== camera.x || camera.targetY !== camera.y, "Camera should pan toward the landing site");

    sequence.update(2000);
    assertTrue(sequence.getRocketRenderStates(camera).length > 0, "Should produce rocket render states during landing");

    sequence.update(3200);
    assertTrue(messages[messages.length - 1].includes("Congratulations on completing your mission"), "Should show congratulations message");
    assertTrue(gs.state.story.settlersArrived, "Settlers should be marked as arrived");
    assertEqual(gs.state.survivalOdds, 81);
    assertTrue(playedNames.includes("settlersArrive"), "Should play settlersArrive when settlers land");
    assertTrue(pLog.probeLog.has(116), "Should log probe 116");
    assertTrue(gs.state.settlerLandingSites.length > 0, "Settler landing sites should be chosen and persisted");
    const firstLandingCell = gs.grid.getCell(gs.state.settlerLandingSites[0].x, gs.state.settlerLandingSites[0].y);
    assertEqual(firstLandingCell.item, "Space Ship", "Settler ships should persist onto chosen landing cells");

    sequence.update(Tuning.SETTLER_POST_LANDING_DELAY_MS);
    assertTrue(messages[messages.length - 1].includes("not taken kindly"), "Should show downfall message");
    assertEqual(gs.state.survivalOdds, 2);
    assertTrue(playedNames.includes("settlersUnhappy"), "Should play settlersUnhappy at the downfall story beat");
    assertTrue(pLog.probeLog.has(117), "Should log probe 117");

    sequence.update(Tuning.SETTLER_POST_LANDING_DELAY_MS);
    assertTrue(gs.state.gameEnded, "Game should be marked ended at tombstone");
    assertNotNull(harness.getEndGamePayload(), "End game overlay payload should be produced");
    const endGamePayload = harness.getEndGamePayload();
    assertTrue(playedNames.includes("gameOver"), "Should play gameOver at tombstone");
    assertEqual(endGamePayload.playTime, "(2 hours, 5 minutes)");
    assertTrue(endGamePayload.summary.includes("You recruited 1 animal"), "Summary should singularize animals");
    assertTrue(endGamePayload.summary.includes("harvested 1 carrot"), "Summary should singularize carrots");
    assertTrue(endGamePayload.summary.includes("gathered 1 wood"), "Summary should handle wood count");
    assertTrue(endGamePayload.summary.includes("planted 1 seed"), "Summary should singularize seeds");
    assertTrue(endGamePayload.summary.includes("built 1 house"), "Summary should singularize houses");
    assertTrue(pLog.probeLog.has(118), "Should log probe 118");
  }

  test_settler_arrival_sequence_resume_mid_phase_after_reload() {
    maStorage.forceMock();
    maStorage.clear();

    const gs = new GameState();
    const landingSite = this._findLandingSite(gs);
    this._revealSettlerLandingArea(gs, landingSite);
    const firstHarness = this._createSettlerArrivalHarness(gs);

    assertTrue(firstHarness.sequence.start(), "Sequence should start before reload");
    firstHarness.sequence.update(1500);
    assertEqual(gs.state.endGameSequence.phase, "transmitting");
    assertEqual(gs.state.endGameSequence.phaseElapsedMs, 1500);

    const reloaded = new GameState();
    assertTrue(reloaded.load(), "Reloaded state should load from storage");
    const reloadedHarness = this._createSettlerArrivalHarness(reloaded);
    assertTrue(reloadedHarness.sequence.resumeFromSavedState(), "Sequence should resume from saved state");
    assertEqual(reloadedHarness.sequence.phase, "transmitting");
    assertEqual(reloadedHarness.sequence.phaseElapsedMs, 1500);
    assertTrue(reloadedHarness.messages[0].includes("Transmitting invitation to Earth"), "Reload should restore the transmitting message");
    assertTrue(pLog.probeLog.has(119), "Should log probe 119 when resuming");

    reloadedHarness.sequence.update(600);
    assertEqual(reloadedHarness.sequence.phase, "arriving");
    assertTrue(reloadedHarness.messages[reloadedHarness.messages.length - 1].includes("Settlers arriving"), "Resume should continue into the next phase");
    maStorage.clear();
  }

  test_settler_arrival_sequence_resume_across_late_phases_after_reload() {
    maStorage.forceMock();
    maStorage.clear();

    const gs = new GameState();
    gs.state.playTimeMs = 61000;
    const landingSite = this._findLandingSite(gs);
    this._revealSettlerLandingArea(gs, landingSite);
    const firstHarness = this._createSettlerArrivalHarness(gs);

    firstHarness.sequence.start();
    firstHarness.sequence.update(2000);
    firstHarness.sequence.update(2000);
    firstHarness.sequence.update(2000);
    firstHarness.sequence.update(500);
    assertEqual(gs.state.endGameSequence.phase, "rockets");
    assertEqual(gs.state.endGameSequence.phaseElapsedMs, 500);

    const reloadedForRockets = new GameState();
    assertTrue(reloadedForRockets.load(), "Rocket phase state should load from storage");
    const rocketHarness = this._createSettlerArrivalHarness(reloadedForRockets);
    assertTrue(rocketHarness.sequence.resumeFromSavedState(), "Rocket phase should resume");
    assertEqual(rocketHarness.sequence.phase, "rockets");
    assertEqual(rocketHarness.sequence.phaseElapsedMs, 500);
    assertTrue(rocketHarness.sequence.getRocketRenderStates(rocketHarness.camera).length > 0, "Rocket render states should be restored after reload");
    assertTrue(rocketHarness.camera.targetX !== rocketHarness.camera.x || rocketHarness.camera.targetY !== rocketHarness.camera.y, "Reloaded rocket phase should restore landing-site camera focus");

    rocketHarness.sequence.update(2700);
    assertEqual(reloadedForRockets.state.endGameSequence.phase, "congrats");
    assertTrue(reloadedForRockets.state.story.settlersArrived, "Settlers should arrive after resumed rocket phase");

    const reloadedForCongrats = new GameState();
    assertTrue(reloadedForCongrats.load(), "Congrats phase state should load from storage");
    const congratsHarness = this._createSettlerArrivalHarness(reloadedForCongrats);
    assertTrue(congratsHarness.sequence.resumeFromSavedState(), "Congrats phase should resume");
    assertEqual(congratsHarness.sequence.phase, "congrats");
    assertTrue(congratsHarness.messages[0].includes("Congratulations on completing your mission"), "Reload should restore the congratulations message");
    congratsHarness.sequence.update(Tuning.SETTLER_POST_LANDING_DELAY_MS);
    assertEqual(reloadedForCongrats.state.endGameSequence.phase, "downfall");

    const reloadedForDownfall = new GameState();
    assertTrue(reloadedForDownfall.load(), "Downfall phase state should load from storage");
    const downfallHarness = this._createSettlerArrivalHarness(reloadedForDownfall);
    assertTrue(downfallHarness.sequence.resumeFromSavedState(), "Downfall phase should resume");
    assertEqual(downfallHarness.sequence.phase, "downfall");
    assertTrue(downfallHarness.messages[0].includes("not taken kindly"), "Reload should restore the downfall message");
    downfallHarness.sequence.update(Tuning.SETTLER_POST_LANDING_DELAY_MS);

    assertTrue(reloadedForDownfall.state.gameEnded, "Game should still end after reloading during the downfall phase");
    assertEqual(reloadedForDownfall.state.endGameSequence.active, false);
    assertEqual(reloadedForDownfall.state.endGameSequence.phase, "tombstone");
    assertNotNull(downfallHarness.getEndGamePayload(), "Reloaded sequence should still produce the tombstone overlay");
    assertEqual(downfallHarness.getEndGamePayload().playTime, "(1 minute)");
    maStorage.clear();
  }
}

{
  const thisClass = UnitTests_Story;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
