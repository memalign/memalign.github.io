if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull, assertNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
}

// Speed up tests
Tuning.GRID_SIZE = 40;

class UnitTests_GameState {
  test_initialState() {
    const gameState = new GameState();
    assertEqual(gameState.state.housesCount, 0);
    assertEqual(gameState.state.researchCenterBuilt, false);
    assertNotNull(gameState.grid);
    assertNotNull(gameState.inventory);
  }

  test_recruitAnimal_success_and_failure() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.revealed = true;
    const char = new GameCharacter("GrassAnimal");
    cell.setCharacter(char);
    
    assertTrue(gameState.recruitAnimal(x, y), "Should recruit unowned animal");
    assertTrue(char.owned, "Animal should be owned");
    assertTrue(!gameState.recruitAnimal(x, y), "Should not recruit already owned animal");
  }

  test_feedAnimal_success_and_failure() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.revealed = true;
    const char = new GameCharacter("GrassAnimal");
    char.owned = true;
    char.isHungry = true;
    cell.setCharacter(char);
    
    assertTrue(!gameState.feedAnimal(x, y), "Should fail without carrot");
    gameState.inventory.addItem("carrot");
    assertTrue(gameState.feedAnimal(x, y), "Should succeed with carrot");
    assertTrue(!char.isHungry, "Should not be hungry anymore");
    assertEqual(gameState.inventory.getQuantity("carrot"), 0, "Carrot should be consumed");
  }

  test_gatherItem_standard() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.setItem("carrot");
    cell.revealed = true;
    const gathered = gameState.gatherItem(x, y);
    assertEqual(gathered, "carrot");
    assertNull(cell.item);
    assertEqual(gameState.inventory.getQuantity("carrot"), 1);
  }

  test_gatherItem_uncollectible() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.setItem("Space Ship");
    cell.revealed = true;
    const gathered = gameState.gatherItem(x, y);
    assertNull(gathered);
    assertEqual(cell.item, "Space Ship");

    cell.setItem("house");
    const gatheredHouse = gameState.gatherItem(x, y);
    assertNull(gatheredHouse, "House should not be gatherable");
    assertEqual(cell.item, "house");
  }

  test_buildHouse_success() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "grass";
    cell.revealed = true;
    cell.item = null;
    cell.character = null;
    for (let i = 0; i < Tuning.HOUSE_WOOD_COST; i++) gameState.inventory.addItem("wood");
    const success = gameState.buildHouse(x, y);
    assertTrue(success, "Should succeed building house");
    assertEqual(cell.item, "house");
    assertEqual(gameState.inventory.getQuantity("wood"), 0, "Wood should be consumed");
  }

  test_buildHouse_failure() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.revealed = true;
    cell.item = null;
    cell.character = null;
    assertTrue(!gameState.buildHouse(x, y), "Should fail building house");
  }

  test_buildHouse_onFarm_failure() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "farm";
    cell.revealed = true;
    cell.item = null;
    cell.character = null;
    for (let i = 0; i < Tuning.HOUSE_WOOD_COST; i++) gameState.inventory.addItem("wood");
    assertTrue(!gameState.buildHouse(x, y), "Should fail building house on farm");
    assertEqual(gameState.inventory.getQuantity("wood"), Tuning.HOUSE_WOOD_COST, "Wood should NOT be consumed");
  }

  test_plantFarm_success() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "grass";
    cell.revealed = true;
    cell.item = null;
    cell.character = null;
    gameState.inventory.addItem("seed");
    assertTrue(gameState.plantFarm(x, y), "Should succeed planting farm");
    assertEqual(cell.landType, "farm");
    assertEqual(gameState.inventory.getQuantity("seed"), 0, "Seed should be consumed");
  }

  test_plantFarm_failure() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.revealed = true;
    cell.landType = "water";
    cell.item = null;
    cell.character = null;
    gameState.inventory.addItem("seed");
    assertTrue(!gameState.plantFarm(x, y), "Should fail planting on water");
  }

  test_establishResearchCenter_success_and_failure() {
    const gameState = new GameState();
    const x = 10, y = 10;
    const cell = gameState.grid.getCell(x, y);
    cell.revealed = true;
    cell.landType = "desert";
    cell.item = null;
    cell.character = null;
    assertTrue(!gameState.establishResearchCenter(x, y), "Should fail without resources");
    for (let i = 0; i < Tuning.RESEARCH_CENTER_WOOD_COST; i++) gameState.inventory.addItem("wood");
    for (let i = 0; i < Tuning.RESEARCH_CENTER_FOOD_COST; i++) gameState.inventory.addItem("carrot");
    assertTrue(gameState.establishResearchCenter(x, y), "Should succeed with resources");
    assertEqual(gameState.inventory.getQuantity("wood"), 0, "Wood consumed");
    assertEqual(gameState.inventory.getQuantity("carrot"), 0, "Carrots consumed");
  }

  test_mining_logic() {
    const gameState = new GameState();
    for (let y = 0; y < Tuning.GRID_SIZE; y++) {
        for (let x = 0; x < Tuning.GRID_SIZE; x++) {
            const c = gameState.grid.getCell(x, y);
            c.landType = "grass";
            c.revealed = true;
            c.item = null;
            c.character = null;
        }
    }
    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "desert";
    cell.revealed = true;
    gameState.state.researchLevel = 2;
    assertTrue(!gameState.updateMining());
    gameState.state.researchLevel = 3;
    const oldRand = Math.random;
    Math.random = () => 0.99; 
    assertTrue(!gameState.updateMining());
    Math.random = () => 0.01;
    assertTrue(gameState.updateMining());
    assertEqual(cell.item, "ore");
    cell.item = null;
    cell.revealed = false;
    gameState.grid.getCell(x-1, y).revealed = true;
    Math.random = () => 0.01;
    gameState.revealCell(x, y);
    assertEqual(cell.item, "ore");
    Math.random = oldRand;
  }

  test_revealCell_tracking() {
    const gameState = new GameState();
    let startX = -1, startY = -1;
    for (let y = 0; y < Tuning.GRID_SIZE; y++) {
        for (let x = 0; x < Tuning.GRID_SIZE; x++) {
            if (gameState.grid.getCell(x, y).revealed) {
                startX = x; startY = y; break;
            }
        }
        if (startX !== -1) break;
    }
    const x1 = startX + 1, y1 = startY;
    const cell1 = gameState.grid.getCell(x1, y1);
    cell1.item = null;
    cell1.setCharacter(new GameCharacter("WaterAnimal"));
    gameState.revealCell(x1, y1);
    assertTrue(gameState.state.firstAnimalRevealed);

    const x2 = startX + 1, y2 = startY + 1;
    const cell2 = gameState.grid.getCell(x2, y2);
    cell2.character = null;
    cell2.setItem("tree");
    gameState.revealCell(x2, y2);
    assertTrue(gameState.state.firstTreeRevealed);
  }

  test_inventory_removeItem_failure() {
    const gameState = new GameState();
    assertTrue(!gameState.inventory.removeItem("gold"), "Should fail removal");
  }
}

{
  const thisClass = UnitTests_GameState;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
