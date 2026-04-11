if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull, assertNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ maDocument } = require('../src/MADocument.js'));
}

// Speed up tests
Tuning.GRID_SIZE = 40;

class UnitTests_Priority {
  test_priority_plant_before_build() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "grass";
    cell.revealed = true;
    cell.item = null;
    cell.character = null;

    let plantCalled = false;
    let buildCalled = false;
    
    gameState.plantFarm = () => { plantCalled = true; return true; };
    gameState.buildHouse = () => { buildCalled = true; return true; };
    gameState.gatherItem = () => { return null; };

    uiManager.handleCellClick(x, y);

    assertTrue(plantCalled, "Should have attempted to plant farm");
    assertTrue(!buildCalled, "Should NOT have attempted to build house (priority check)");
  }

  test_priority_gather_before_plant() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "grass";
    cell.revealed = true;
    cell.item = "carrot"; 
    cell.character = null;
    
    let gatherCalled = false;
    let plantCalled = false;
    
    gameState.gatherItem = () => { gatherCalled = true; return "carrot"; };
    gameState.plantFarm = () => { plantCalled = true; return true; };

    uiManager.handleCellClick(x, y);

    assertTrue(gatherCalled, "Should have attempted to gather item");
    assertTrue(!plantCalled, "Should NOT have attempted to plant farm (priority check)");
  }

  test_buildHouse_path() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "grass";
    cell.revealed = true;
    cell.item = null; 
    cell.character = null;
    
    let buildCalled = false;
    
    gameState.gatherItem = () => { return null; };
    gameState.plantFarm = () => { return false; }; // Cannot plant (e.g. no seeds)
    gameState.buildHouse = () => { buildCalled = true; return true; }; // Can build

    uiManager.handleCellClick(x, y);

    assertTrue(buildCalled, "Should have attempted to build house"); // Probe 24
  }
}

{
  const thisClass = UnitTests_Priority;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
