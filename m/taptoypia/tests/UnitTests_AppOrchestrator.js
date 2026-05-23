if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ AppOrchestrator } = require('../src/AppOrchestrator.js'));
  ({ GameState } = require('../src/GameState.js'));
  ({ StartupLandingSequence } = require('../src/StartupLandingSequence.js'));
  ({ pLog } = require('../src/Utilities.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ maStorage } = require('../src/MAStorage.js'));
  ({ maDocument } = require('../src/MADocument.js'));
}

class UnitTests_AppOrchestrator {
  test_orchestrator_startup_sequence() {
    const orchestrator = new AppOrchestrator();
    
    // We want to verify:
    // 1. loadGame() is called before triggerStory("intro")
    // 2. Camera uses the gridSize that exists AFTER loadGame()
    
    const callLog = [];
    
    // Mock the dependencies during start()
    // We'll let the actual objects be created, but stub the critical sequence methods
    const originalStart = orchestrator.start;
    orchestrator.start = function(w, h, mode, modes) {
        const result = originalStart.call(this, w, h, mode, modes);
        
        // Wrap the methods to track calls
        const originalLoad = this.uiManager.loadGame;
        this.uiManager.loadGame = () => {
            callLog.push("loadGame");
            this.gameState.gridSize = 99; // Simulate a loaded grid size
            return true;
        };
        
        const originalTrigger = this.gameState.triggerStory;
        this.gameState.triggerStory = (event) => {
            if (event === "intro") callLog.push("triggerStoryIntro");
        };

        // Re-run the critical parts or just use the trackers if we had injected mocks
        // Since start() already ran, we actually need to mock BEFORE start()
        return result;
    };

    // Let's try again with a more robust mock approach
    const testOrchestrator = new AppOrchestrator();
    const RENDERER_MODES = { CLASSIC_2D: "classic_2d" };
    
    // Override methods on prototype or instance before calling start
    // But they aren't created until start() runs. 
    // So we'll mock the classes or just verify the pLog sequence.
    
    const result = testOrchestrator.start(800, 600, "classic_2d", RENDERER_MODES);
    
    // Verify pLog sequence
    const logs = Array.from(pLog.probeLog);
    const p106 = logs.indexOf(106);
    const p107 = logs.indexOf(107);
    const p108 = logs.indexOf(108);
    const p109 = logs.indexOf(109);
    const p110 = logs.indexOf(110);
    
    assertTrue(p106 < p107, "Init Core (106) should be before Load (107)");
    assertTrue(p107 < p108, "Load (107) should be before Camera (108)");
    assertTrue(p108 < p109, "Camera (108) should be before Engine (109)");
    assertTrue(p109 < p110, "Engine (109) should be before Story (110)");
    
    assertEqual(result.camera.gridSize, result.gameState.gridSize, "Camera should use loaded gridSize");
  }

  test_orchestrator_placeholder_message() {
    const RENDERER_MODES = { CLASSIC_2D: "classic_2d" };
    
    // 1. First run defers intro until the landing sequence completes
    const orchestrator = new AppOrchestrator();
    const firstRun = orchestrator.start(800, 600, "classic_2d", RENDERER_MODES);
    assertTrue(firstRun.startupLandingPending, "Fresh startup should begin with landing pending");
    assertTrue(firstRun.introDeferred, "Intro should be deferred while landing animation runs");
    assertTrue(!firstRun.gameState.state.story.introShown, "Intro should not yet be shown before landing completes");
    const landingSequence = new StartupLandingSequence(firstRun.gameState, firstRun.uiManager, {
        active: firstRun.startupLandingPending,
        durationMs: 5000,
        shipCell: firstRun.landingSite,
        introDeferred: firstRun.introDeferred
    });
    landingSequence.update(1000);
    const countdownMsg = firstRun.uiManager.storyLog.children[0].children[0].innerText;
    assertTrue(countdownMsg.includes("Landing sequence commence! Landing in 5..."), "Should show landing countdown during animation");
    landingSequence.update(4000);
    assertTrue(firstRun.gameState.state.story.introShown, "Intro should be shown after landing completes");

    // 2. Simulate startup with no landing pending where intro triggers immediately
    const orchestrator2 = new AppOrchestrator();
    const originalLoad = GameState.prototype.load;
    const originalTrigger = GameState.prototype.triggerStory;
    GameState.prototype.load = function() {
        this.state.startupLandingPending = false;
        return true;
    };
    
    try {
        orchestrator2.start(800, 600, "classic_2d", RENDERER_MODES);
        assertTrue(pLog.probeLog.has(112), "Should have triggered intro message (probe 112)");

        // 3. Simulate subsequent run with no landing pending where intro does not trigger
        GameState.prototype.triggerStory = () => false;
        const orchestrator3 = new AppOrchestrator();
        orchestrator3.start(800, 600, "classic_2d", RENDERER_MODES);
        assertTrue(pLog.probeLog.has(111), "Should have triggered placeholder message (probe 111)");
    } finally {
        GameState.prototype.load = originalLoad;
        GameState.prototype.triggerStory = originalTrigger;
    }
  }

  test_orchestrator_restores_completed_end_game_overlay() {
    maStorage.forceMock();
    maStorage.clear();

    const savedGame = new GameState();
    savedGame.state.startupLandingPending = false;
    savedGame.state.victoryClaimed = true;
    savedGame.state.gameEnded = true;
    savedGame.state.playTimeMs = 61000;
    savedGame.state.stats.animalsRecruited = 1;
    savedGame.state.stats.carrotsHarvested = 1;
    savedGame.state.stats.woodGathered = 1;
    savedGame.state.stats.seedsPlanted = 1;
    savedGame.state.stats.housesBuilt = 1;
    const revealedCell = savedGame.grid.getCell(0, 0);
    revealedCell.reveal();
    assertTrue(savedGame.save(), "Completed game save should persist");

    const orchestrator = new AppOrchestrator();
    const RENDERER_MODES = { CLASSIC_2D: "classic_2d" };
    const result = orchestrator.start(800, 600, "classic_2d", RENDERER_MODES);

    const overlay = maDocument.getElementById("end-game-overlay");
    const subtitle = maDocument.getElementById("engraving-subtitle");
    const story = maDocument.getElementById("end-game-story");
    const missions = maDocument.getElementById("missions-list");
    const inventory = maDocument.getElementById("inventory-info");

    assertTrue(result.gameState.state.gameEnded, "Loaded game should still be ended");
    assertTrue(result.soundEffects.songPlaybackSuppressed, "Completed end-game startup should suppress background song playback");
    assertTrue(pLog.probeLog.has(125), "Completed end-game startup should log probe 125 when suppressing song playback on reload");
    assertTrue(!result.introDeferred, "Completed end-game startup should not defer intro");
    assertTrue(!result.gameState.state.story.introShown, "Completed end-game startup should not retrigger intro");
    assertTrue(!overlay.classList.contains("hidden"), "Completed end-game overlay should be restored on startup");
    assertTrue(missions.classList.contains("hidden"), "Missions should be hidden after game end");
    assertTrue(inventory.classList.contains("hidden"), "Inventory should be hidden after game end");
    assertEqual(subtitle.textContent, "(1 minute)");
    assertTrue(story.textContent.includes("You recruited 1 animal"), "End-game summary should be restored");
    assertTrue(pLog.probeLog.has(120), "Completed end-game startup should log probe 120");

    maStorage.clear();
  }

  test_orchestrator_preserves_world_view_mode_after_reload() {
    maStorage.forceMock();
    maStorage.clear();

    const savedGame = new GameState();
    savedGame.state.startupLandingPending = false;
    savedGame.state.victoryClaimed = true;
    savedGame.state.gameEnded = true;
    savedGame.state.worldViewActive = true;
    savedGame.state.playTimeMs = 61000;
    assertTrue(savedGame.save(), "World view end-game save should persist");

    const orchestrator = new AppOrchestrator();
    const RENDERER_MODES = { CLASSIC_2D: "classic_2d" };
    const result = orchestrator.start(800, 600, "classic_2d", RENDERER_MODES);

    const overlay = maDocument.getElementById("end-game-overlay");
    const missions = maDocument.getElementById("missions-list");
    const inventory = maDocument.getElementById("inventory-info");

    assertTrue(result.gameState.state.gameEnded, "Reloaded world-view game should still be ended");
    assertTrue(result.gameState.state.worldViewActive, "Reloaded world-view game should preserve world-view mode");
    assertTrue(result.soundEffects.songPlaybackSuppressed, "World-view reload should suppress background song playback");
    assertTrue(pLog.probeLog.has(125), "World-view reload should log probe 125 when suppressing song playback on reload");
    assertTrue(result.introDeferred === false, "World-view reload should not defer intro");
    assertTrue(overlay.classList.contains("hidden"), "World-view reload should not reopen the tombstone overlay");
    assertTrue(missions.classList.contains("hidden"), "World-view reload should keep missions hidden");
    assertTrue(inventory.classList.contains("hidden"), "World-view reload should keep inventory hidden");

    maStorage.clear();
  }
}

{
  const thisClass = UnitTests_AppOrchestrator;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
