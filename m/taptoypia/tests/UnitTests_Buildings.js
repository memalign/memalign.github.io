if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull, assertNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ maDocument } = require('../src/MADocument.js'));
  ({ SoundEffects } = require('../src/SoundEffects.js'));
}

// Speed up tests
Tuning.GRID_SIZE = 40;

class UnitTests_Buildings {
  test_communicationTower_success() {
    const gameState = new GameState();
    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "grass";
    cell.revealed = true;
    cell.item = null;
    cell.character = null;

    for (let i = 0; i < Tuning.COMMUNICATION_TOWER_ORE_COST; i++) {
        gameState.inventory.addItem("ore");
    }

    const success = gameState.buildCommunicationTower(x, y);
    assertTrue(success, "Should succeed building tower with ore");
    assertEqual(cell.item, "Communication Tower");
    assertTrue(gameState.state.communicationTowerBuilt);
    assertEqual(gameState.inventory.getQuantity("ore"), 0, "Ore consumed");
  }

  test_communicationTower_failure() {
    const gameState = new GameState();
    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "grass";
    cell.revealed = true;
    cell.item = null;
    cell.character = null;

    const success = gameState.buildCommunicationTower(x, y);
    assertTrue(!success, "Should fail building tower without ore");
    assertNull(cell.item);
    assertTrue(!gameState.state.communicationTowerBuilt);
  }

  test_building_clicks_success_and_failure() {
    const gameState = new GameState();
    const soundEffects = new SoundEffects();
    
    // Mock AudioContext to get 100% probe coverage
    const mockSource = {
        connect: () => {},
        start: () => {},
        addEventListener: () => {}
    };
    const mockGain = {
        connect: () => {},
        gain: { value: 1.0 }
    };
    const mockAudioContext = {
        state: 'running',
        createBufferSource: () => mockSource,
        createGain: () => mockGain,
        destination: {}
    };
    soundEffects.setAudioContext(mockAudioContext);
    soundEffects.soundEffects["../song.mp3"] = "dummy-buffer";

    const uiManager = new UIManager(gameState, soundEffects);
    
    // 1. Research Center Click
    const rcBtn = maDocument.createElement("div");
    rcBtn.classList.add("research-center-mission");
    
    uiManager.handleMissionClick(rcBtn);
    assertTrue(pLog.probeLog.has(82), "Should have called requestSong (probe 82)");
    assertTrue(pLog.probeLog.has(83), "Should have called start() (probe 83)");
    assertTrue(!gameState.state.isBuildingResearchCenter);

    for (let i = 0; i < 100; i++) { gameState.inventory.addItem("wood"); gameState.inventory.addItem("carrot"); }
    uiManager.handleMissionClick(rcBtn);
    assertTrue(gameState.state.isBuildingResearchCenter);

    // 2. Comm Tower Click
    const ctBtn = maDocument.createElement("div");
    ctBtn.classList.add("comm-tower-mission");

    uiManager.handleMissionClick(ctBtn);
    assertTrue(!gameState.state.isBuildingCommunicationTower);

    for (let i = 0; i < 10; i++) { gameState.inventory.addItem("ore"); }
    uiManager.handleMissionClick(ctBtn);
    assertTrue(gameState.state.isBuildingCommunicationTower);
  }
}

{
  const thisClass = UnitTests_Buildings;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
