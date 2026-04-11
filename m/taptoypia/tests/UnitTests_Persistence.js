if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull, assertNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ maStorage, MAStorage } = require('../src/MAStorage.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
  ({ UIManager } = require('../src/UIManager.js'));
}

class UnitTests_Persistence {
  _runWithMockStorage(testFn) {
    const oldStorage = maStorage;
    const mockStorage = new MAStorage();
    mockStorage.forceMock();
    maStorage = mockStorage;
    try {
      testFn.call(this);
    } finally {
      maStorage = oldStorage;
    }
  }

  test_save_load_basic() {
    this._runWithMockStorage(() => {
      const gameState = new GameState();

      // Modify state
      gameState.inventory.addItem("wood");
      gameState.state.housesCount = 5;
      const cell = gameState.grid.getCell(10, 10);
      cell.landType = "farm";
      cell.setItem("carrot");
      const char = new GameCharacter("GrassAnimal");
      char.owned = true;
      cell.setCharacter(char);

      assertTrue(gameState.save(), "Save should succeed");

      const newGameState = new GameState();
      assertTrue(newGameState.load(), "Load should succeed");

      assertEqual(newGameState.inventory.getQuantity("wood"), 1, "Wood should be 1");
      assertEqual(newGameState.state.housesCount, 5, "Houses should be 5");

      const loadedCell = newGameState.grid.getCell(10, 10);
      assertEqual(loadedCell.landType, "farm", "LandType should be farm");
      assertEqual(loadedCell.item, "carrot", "Item should be carrot");
      assertNotNull(loadedCell.character, "Character should exist");
      assertEqual(loadedCell.character.type, "GrassAnimal", "Character type should match");
      assertTrue(loadedCell.character.owned, "Character should be owned");
    });
  }

  test_save_load_save_consistency() {
    this._runWithMockStorage(() => {
      const gameState = new GameState();

      // Add some complexity
      gameState.inventory.addItem("ore");
      gameState.state.researchLevel = 2;
      const cell = gameState.grid.getCell(15, 15);
      cell.reveal();
      cell.setItem("house");

      // First save
      gameState.save();
      const save1 = maStorage.getItem('memtopia_save');
      assertNotNull(save1, "Save 1 should exist");

      // Load into new state
      const gameState2 = new GameState();
      gameState2.load();

      // Second save from loaded state
      gameState2.save();
      const save2 = maStorage.getItem('memtopia_save');
      assertNotNull(save2, "Save 2 should exist");

      assertEqual(save1, save2, "Subsequent saves should be identical");

      // Parse and check equality of objects just in case stringification order differs (though usually stable for these simple objects)
      const obj1 = JSON.parse(save1);
      const obj2 = JSON.parse(save2);
      // Note: Use a simple comparison if deep equals isn't available or just rely on string comparison if order is deterministic
      assertEqual(JSON.stringify(obj1), JSON.stringify(obj2), "Objects should be identical");
    });
  }

  test_load_no_data() {
    this._runWithMockStorage(() => {
      const gameState = new GameState();
      const originalState = JSON.stringify(gameState.toJSON());

      const loaded = gameState.load();
      assertTrue(!loaded, "Load should fail when no data exists");

      assertEqual(JSON.stringify(gameState.toJSON()), originalState, "State should remain unchanged after failed load");
    });
  }

  test_clear_save() {
    this._runWithMockStorage(() => {
      const gameState = new GameState();
      gameState.save();
      assertNotNull(maStorage.getItem('memtopia_save'));

      gameState.clearSave();
      assertNull(maStorage.getItem('memtopia_save'), "Save should be cleared");
      assertEqual(pLog.probeLog.has(79), true, "Should log probe 79");
    });
  }

  test_save_failure_probe() {
    this._runWithMockStorage(() => {
      const gs = new GameState();
      const oldStringify = JSON.stringify;
      const oldError = console.error;
      console.error = () => {}; 
      
      JSON.stringify = () => { throw new Error("Mock error"); };
      try {
        gs.save();
      } catch (e) {}
      
      JSON.stringify = oldStringify;
      console.error = oldError;
      assertTrue(pLog.probeLog.has(75), "Should log probe 75 (save failure)");
    });
  }

  test_load_corrupted_probe() {
    this._runWithMockStorage(() => {
      maStorage.setItem('memtopia_save', 'invalid json');
      const gs = new GameState();
      
      const oldError = console.error;
      console.error = () => {};
      
      gs.load();
      
      console.error = oldError;
      assertTrue(pLog.probeLog.has(78), "Should log probe 78 (load failure/parse error)");
    });
  }

  test_load_startup_probe() {
    this._runWithMockStorage(() => {
      const gs = new GameState();
      const ui = new UIManager(gs);
      gs.save(); // save initial empty state

      // Now load via UIManager to test integration
      assertTrue(ui.loadGame(), "loadGame should return true when save exists");
      assertTrue(pLog.probeLog.has(81), "Should log probe 81 via UIManager.loadGame()");
    });
  }

  test_immediate_save_on_reveal() {
    this._runWithMockStorage(() => {
      const gs = new GameState();
      const ui = new UIManager(gs);
      
      // Find the landing site (Space Ship) which is already revealed
      let shipX, shipY;
      for (let y = 0; y < gs.gridSize; y++) {
        for (let x = 0; x < gs.gridSize; x++) {
          if (gs.grid.getCell(x, y).item === "Space Ship") {
            shipX = x; shipY = y; break;
          }
        }
        if (shipX !== undefined) break;
      }

      // Click an adjacent cell to reveal it
      const targetX = shipX + 1;
      const targetY = shipY;
      const cell = gs.grid.getCell(targetX, targetY);
      cell.revealed = false;
      
      ui.handleCellClick(targetX, targetY);
      
      assertTrue(pLog.probeLog.has(90), "Should log probe 90 (reveal save)");
      assertTrue(pLog.probeLog.has(74), "Should log probe 74 (save success)");
      
      // Verify data in storage
      const data = maStorage.getItem('memtopia_save');
      assertNotNull(data);
      const parsed = JSON.parse(data);
      assertTrue(parsed.grid.cells[targetY][targetX].r === 1, "Cell should be revealed in saved data");
    });
  }

  test_immediate_save_on_build_rc() {
    this._runWithMockStorage(() => {
      const gs = new GameState();
      const ui = new UIManager(gs);
      for (let i = 0; i < 100; i++) { gs.inventory.addItem("wood"); gs.inventory.addItem("carrot"); }
      
      const rcBtn = maDocument.createElement("div");
      rcBtn.classList.add("research-center-mission");
      ui.handleMissionClick(rcBtn); // Toggle mode
      
      const x = 5, y = 5;
      const cell = gs.grid.getCell(x, y);
      cell.landType = "grass";
      cell.revealed = true;
      cell.item = null;
      cell.character = null;
      
      ui.handleCellClick(x, y);
      assertTrue(pLog.probeLog.has(86), "Should log probe 86 (RC established)");
      assertTrue(pLog.probeLog.has(74), "Should log probe 74 (save success)");
    });
  }

  test_immediate_save_on_build_tower() {
    this._runWithMockStorage(() => {
      const gs = new GameState();
      const ui = new UIManager(gs);
      for (let i = 0; i < 100; i++) { gs.inventory.addItem("ore"); }
      
      const towerBtn = maDocument.createElement("div");
      towerBtn.classList.add("comm-tower-mission");
      ui.handleMissionClick(towerBtn); // Toggle mode
      
      const x = 5, y = 5;
      const cell = gs.grid.getCell(x, y);
      cell.landType = "grass";
      cell.revealed = true;
      cell.item = null;
      cell.character = null;
      
      ui.handleCellClick(x, y);
      assertTrue(pLog.probeLog.has(87), "Should log probe 87 (Tower established)");
      assertTrue(pLog.probeLog.has(74), "Should log probe 74 (save success)");
    });
  }

  test_immediate_save_on_feed() {
    this._runWithMockStorage(() => {
      const gs = new GameState();
      const ui = new UIManager(gs);
      gs.inventory.addItem("carrot");
      
      const x = 5, y = 5;
      const cell = gs.grid.getCell(x, y);
      cell.revealed = true;
      const char = new GameCharacter("GrassAnimal");
      char.owned = true;
      char.isHungry = true;
      cell.setCharacter(char);
      
      ui.handleCellClick(x, y);
      assertTrue(pLog.probeLog.has(88), "Should log probe 88 (animal fed)");
      assertTrue(pLog.probeLog.has(74), "Should log probe 74 (save success)");
    });
  }

  test_immediate_save_on_recruit() {
    this._runWithMockStorage(() => {
      const gs = new GameState();
      const ui = new UIManager(gs);
      
      const x = 5, y = 5;
      const cell = gs.grid.getCell(x, y);
      cell.revealed = true;
      const char = new GameCharacter("GrassAnimal");
      char.owned = false;
      cell.setCharacter(char);
      
      ui.handleCellClick(x, y);
      assertTrue(pLog.probeLog.has(89), "Should log probe 89 (animal recruited)");
      assertTrue(pLog.probeLog.has(74), "Should log probe 74 (save success)");
    });
  }
}

{
  const thisClass = UnitTests_Persistence;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
