if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ AppOrchestrator } = require('../src/AppOrchestrator.js'));
  ({ pLog } = require('../src/Utilities.js'));
  ({ Tuning } = require('../src/Tuning.js'));
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
    const orchestrator = new AppOrchestrator();
    const RENDERER_MODES = { CLASSIC_2D: "classic_2d" };
    
    // 1. First run (Intro shown)
    orchestrator.start(800, 600, "classic_2d", RENDERER_MODES);
    assertTrue(pLog.probeLog.has(112), "Should have triggered intro message (probe 112)");

    // 2. Simulate subsequent run where intro is already in state
    const orchestrator2 = new AppOrchestrator();
    
    // We'll wrap triggerStory to ensure it returns false (simulating introShown: true)
    const originalTrigger = GameState.prototype.triggerStory;
    GameState.prototype.triggerStory = () => false;
    
    try {
        orchestrator2.start(800, 600, "classic_2d", RENDERER_MODES);
        assertTrue(pLog.probeLog.has(111), "Should have triggered placeholder message (probe 111)");
    } finally {
        GameState.prototype.triggerStory = originalTrigger;
    }
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
