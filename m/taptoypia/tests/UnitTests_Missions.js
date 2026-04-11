if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull, assertNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
  ({ maDocument } = require('../src/MADocument.js'));
}

function getAllText(el) {
  let text = el.innerText || "";
  for (const child of el.children) {
    text += getAllText(child);
  }
  return text;
}

// Speed up tests by using a smaller grid
Tuning.GRID_SIZE = 40;

class UnitTests_Missions {
  test_hungryAnimalMission_pluralization() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    // Setup 2 hungry animals
    const char1 = new GameCharacter("GrassAnimal");
    char1.owned = true;
    char1.isHungry = true;
    const cell1 = gameState.grid.getCell(10, 10);
    cell1.revealed = true;
    cell1.setCharacter(char1);

    const char2 = new GameCharacter("FireAnimal");
    char2.owned = true;
    char2.isHungry = true;
    const cell2 = gameState.grid.getCell(11, 11);
    cell2.revealed = true;
    cell2.setCharacter(char2);

    uiManager.updateMissions();

    const missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Feed hungry animals"), "Should be plural for 2 animals");
  }

  test_hungryAnimalMission_singular() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    const char1 = new GameCharacter("GrassAnimal");
    char1.owned = true;
    char1.isHungry = true;
    const cell1 = gameState.grid.getCell(10, 10);
    cell1.revealed = true;
    cell1.setCharacter(char1);

    uiManager.updateMissions();

    const missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Feed hungry animal"), "Should be singular for 1 animal");
    assertTrue(!missionsText.includes("Feed hungry animals"), "Should not be plural for 1 animal");
  }

  test_firstHouseMission_hides_after_first_house() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    for (let i = 0; i < Tuning.HOUSE_WOOD_COST; i++) {
      gameState.inventory.addItem("wood");
    }
    uiManager.updateMissions();
    let missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Build house"), "Should show the first-house mission before any house is built");

    gameState.state.housesCount = 1;
    uiManager.updateMissions();
    missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(!missionsText.includes("Build house"), "Should stop showing the first-house mission after the first house");
    assertTrue(missionsText.includes("Build village (9 more houses)"), "Should switch to the village mission after the first house");
  }

  test_villageMission() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    gameState.state.housesCount = 1;
    uiManager.updateMissions();
    let missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Build village (9 more houses)"), "Should show 9 more houses");

    gameState.state.housesCount = 9;
    uiManager.updateMissions();
    missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Build village (1 more house)"), "Should show 1 more house (singular)");
  }

  test_cityMission_appears_after_communication_tower() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    gameState.state.housesCount = 10;
    gameState.state.researchCenterBuilt = true;
    gameState.state.researchLevel = 3;
    gameState.state.communicationTowerBuilt = true;
    uiManager.updateMissions();

    let missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Build city (20 more houses)"), "Should show the city mission after the communication tower");
    assertTrue(!missionsText.includes("Invite settlers (claim victory)"), "Should not show the settlers mission before the city is built");

    gameState.state.housesCount = 29;
    uiManager.updateMissions();
    missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Build city (1 more house)"), "Should singularize the remaining city houses");
  }

  test_victoryMission_requires_completed_city() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    gameState.state.housesCount = 30;
    gameState.state.researchCenterBuilt = true;
    gameState.state.researchLevel = 3;
    gameState.state.communicationTowerBuilt = true;
    uiManager.updateMissions();

    const missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Invite settlers (claim victory)"), "Should show victory mission after the city is built");
    assertTrue(!missionsText.includes("Build city"), "Should not keep showing the city mission after completion");
  }

  test_victoryMission_hides_after_claim() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    gameState.state.housesCount = 30;
    gameState.state.researchCenterBuilt = true;
    gameState.state.researchLevel = 3;
    gameState.state.communicationTowerBuilt = true;
    uiManager.updateMissions();

    let missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Invite settlers (claim victory)"));

    const victoryBtn = maDocument.createElement("div");
    victoryBtn.classList.add("victory-mission");
    uiManager.handleMissionClick(victoryBtn);

    assertTrue(gameState.state.victoryClaimed, "Victory should be claimed");
    
    uiManager.updateMissions();
    missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(!missionsText.includes("Invite settlers"), "Victory mission should be hidden after claim");
  }

  test_exploreLandscapeMission_hidden_if_other_missions() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    // Default state: no missions, so should show "Explore the landscape"
    uiManager.updateMissions();
    let missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Explore the landscape"), "Should show Explore mission when empty");

    // Add a mission (e.g., reveal first animal)
    gameState.state.firstAnimalRevealed = true;
    gameState.state.firstAnimalOwned = false;
    uiManager.updateMissions();
    missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Train animal to explore"), "Should show Train mission");
    assertTrue(!missionsText.includes("Explore the landscape"), "Should hide Explore mission when other missions exist");
  }

  test_survivalMission_after_victory() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    gameState.state.housesCount = 30;
    gameState.state.researchCenterBuilt = true;
    gameState.state.researchLevel = 3;
    gameState.state.communicationTowerBuilt = true;
    gameState.state.victoryClaimed = true;

    uiManager.updateMissions();
    const missionsText = getAllText(maDocument.getElementById("missions-list"));
    assertTrue(missionsText.includes("Survive, if you can"), "Should show survival mission after victory");
    assertTrue(pLog.probeLog.has(94), "Should log probe 94");
  }
}

{
  const thisClass = UnitTests_Missions;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
