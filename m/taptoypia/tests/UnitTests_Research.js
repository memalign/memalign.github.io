if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull, assertNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
  ({ maDocument } = require('../src/MADocument.js'));
}

// Speed up tests
Tuning.GRID_SIZE = 40;

function getAllText(el) {
    let text = el.innerText || "";
    for (const child of el.children) {
        text += getAllText(child);
    }
    return text;
}

class UnitTests_Research {
  test_research_progression_ui() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    gameState.state.researchCenterBuilt = true;
    gameState.state.housesCount = 10;
    
    // Level 0 -> Should show tier 1 mission
    gameState.state.researchLevel = 0;
    uiManager.updateMissions();
    let text = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(text.includes("Research auto-harvesting"), "Should show Tier 1 research");

    // Level 1 -> Should show tier 2 mission
    gameState.state.researchLevel = 1;
    uiManager.updateMissions();
    text = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(text.includes("Research auto-feeding"), "Should show Tier 2 research");

    // Level 2 -> Should show tier 3 mission
    gameState.state.researchLevel = 2;
    uiManager.updateMissions();
    text = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(text.includes("Research mining"), "Should show Tier 3 research");
  }

  test_auto_harvest_logic() {
    const gameState = new GameState();
    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "farm";
    cell.revealed = true;
    cell.setItem("carrot");

    gameState.state.researchLevel = 0;
    assertTrue(!gameState.autoHarvest(), "Should not auto-harvest at level 0");
    assertEqual(cell.item, "carrot");

    gameState.state.researchLevel = 1;
    assertTrue(gameState.autoHarvest(), "Should auto-harvest at level 1");
    assertNull(cell.item, "Item should be gone from cell");
    assertEqual(gameState.inventory.getQuantity("carrot"), 1, "Item should be in inventory");
  }

  test_auto_feed_logic() {
    const gameState = new GameState();
    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    cell.revealed = true;
    const char = new GameCharacter("GrassAnimal");
    char.owned = true;
    char.isHungry = true;
    cell.setCharacter(char);

    gameState.state.researchLevel = 1;
    gameState.inventory.addItem("carrot");
    assertTrue(!gameState.autoFeed(), "Should not auto-feed at level 1");
    assertTrue(char.isHungry);

    gameState.state.researchLevel = 2;
    gameState.inventory.removeItem("carrot");
    assertTrue(!gameState.autoFeed(), "Should not auto-feed with 0 carrots");

    gameState.inventory.addItem("carrot");
    assertTrue(gameState.autoFeed(), "Should auto-feed at level 2");
    assertTrue(!char.isHungry, "Animal should be fed");
    assertEqual(gameState.inventory.getQuantity("carrot"), 0, "Carrot consumed");
  }

  test_research_clicks_success_and_failure() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    gameState.state.researchCenterBuilt = true;
    gameState.state.researchLevel = 0;

    const mockBtn = maDocument.createElement("div");
    mockBtn.classList.add("research-tier-mission");
    mockBtn._lvl = 1;
    
    uiManager.handleMissionClick(mockBtn);
    assertEqual(gameState.state.researchLevel, 0, "No research without resources");

    for (let i = 0; i < Tuning.RESEARCH_AUTOHARVEST_WOOD_COST; i++) gameState.inventory.addItem("wood");
    for (let i = 0; i < Tuning.RESEARCH_AUTOHARVEST_FOOD_COST; i++) gameState.inventory.addItem("carrot");
    
    uiManager.handleMissionClick(mockBtn);
    assertEqual(gameState.state.researchLevel, 1, "Research complete");
    assertEqual(gameState.inventory.getQuantity("wood"), 0, "Wood consumed");
    assertEqual(gameState.inventory.getQuantity("carrot"), 0, "Carrots consumed");
  }
}

{
  const thisClass = UnitTests_Research;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
