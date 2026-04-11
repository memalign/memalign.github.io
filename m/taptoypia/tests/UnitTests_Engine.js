if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull, assertNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ GameEngine } = require('../src/GameEngine.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
  ({ maDocument } = require('../src/MADocument.js'));
}

// Speed up tests
Tuning.GRID_SIZE = 40;

class UnitTests_Engine {
  _pickExplorationTarget(gameState, x, y, targetX, targetY) {
    const potentialTargets = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) {
          continue;
        }

        const nx = x + dx;
        const ny = y + dy;
        const neighbor = gameState.grid.getCell(nx, ny);
        if (!neighbor) {
          continue;
        }

        const weight = neighbor.revealed ? 1 : 10;
        for (let i = 0; i < weight; i++) {
          potentialTargets.push({ nx, ny });
        }
      }
    }

    const targetIndex = potentialTargets.findIndex((target) => target.nx === targetX && target.ny === targetY);
    assertTrue(targetIndex >= 0, `Expected exploration target (${targetX}, ${targetY}) to be selectable`);

    return (targetIndex + 0.01) / potentialTargets.length;
  }

  test_engine_timers() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    const engine = new GameEngine(gameState, uiManager);

    engine.update(Tuning.FARM_GROWTH_INTERVAL_MS);
    assertEqual(engine.farmTimer, 0);

    engine.update(Tuning.TREE_GROWTH_INTERVAL_MS);
    assertEqual(engine.treeTimer, 0);

    engine.update(Tuning.CHARACTER_HATCH_CHECK_INTERVAL_MS);
    assertEqual(engine.hatchTimer, 0);

    engine.update(Tuning.CHARACTER_EXPLORE_INTERVAL_MS);
    assertEqual(engine.exploreTimer, 0);

    engine.update(Tuning.AUTO_AUTOMATION_INTERVAL_MS);
    assertEqual(engine.autoTimer, 0);
  }

  test_engine_farming_branches() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    const engine = new GameEngine(gameState, uiManager);

    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "farm";
    cell.revealed = true;
    cell.item = null;

    const oldRand = Math.random;

    Math.random = () => 0.1;
    engine.updateFarming();
    assertEqual(cell.item, "tree");

    cell.item = null;
    Math.random = () => 0.5;
    engine.updateFarming();
    assertEqual(cell.item, "carrot");

    cell.item = null;
    Math.random = () => 0.9;
    engine.updateFarming();
    assertEqual(cell.item, "seed");

    Math.random = oldRand;
  }

  test_engine_tree_growth_branches() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    const engine = new GameEngine(gameState, uiManager);

    const oldRand = Math.random;

    Math.random = () => 0.99;
    engine.updateTreeGrowth();

    for(let y=0; y<40; y++) for(let x=0; x<40; x++) {
        const c = gameState.grid.getCell(x,y);
        c.landType = "grass"; c.revealed = true; c.item = null; c.character = null;
    }
    Math.random = () => 0.01;
    engine.updateTreeGrowth();

    for(let y=0; y<40; y++) for(let x=0; x<40; x++) {
        const c = gameState.grid.getCell(x,y);
        c.landType = "water";
    }
    Math.random = () => 0.01;
    engine.updateTreeGrowth();

    Math.random = oldRand;
  }

  test_engine_hatching() {
    const gameState = new GameState();
    const engine = new GameEngine(gameState, null);

    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    const egg = new GameCharacter("Egg");
    egg.hatchesInto = "FireAnimal";
    egg.hatchTime = Date.now() - 1000;
    cell.setCharacter(egg);

    engine.updateHatching();
    assertEqual(egg.type, "FireAnimal");
  }

  test_engine_exploration_branches() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    const engine = new GameEngine(gameState, uiManager);

    // Clear EVERYTHING
    for(let gy=0; gy<40; gy++) for(let gx=0; gx<40; gx++) {
        const c = gameState.grid.getCell(gx, gy);
        c.character = null; c.item = null; c.revealed = false; c.landType = "water";
    }

    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    cell.landType = "grass";
    cell.revealed = true;
    const char = new GameCharacter("GrassAnimal");
    char.owned = true;
    cell.setCharacter(char);

    const tx = 6, ty = 5;
    const target = gameState.grid.getCell(tx, ty);
    target.landType = "grass";
    target.revealed = false;

    const oldRand = Math.random;

    Math.random = () => this._pickExplorationTarget(gameState, x, y, tx, ty);
    engine.updateExploration();
    assertTrue(target.revealed, "Target should be revealed");
    assertEqual(target.character, char, "Character moved");

    const ax = 7, ay = 5;
    const aCell = gameState.grid.getCell(ax, ay);
    aCell.landType = "grass";
    aCell.revealed = false;
    aCell.setCharacter(new GameCharacter("WaterAnimal"));
    Math.random = () => this._pickExplorationTarget(gameState, tx, ty, ax, ay);
    engine.updateExploration();
    assertTrue(aCell.revealed, "Animal cell revealed");
    assertTrue(gameState.state.firstAnimalRevealed);

    const bx = 6, by = 6;
    const bCell = gameState.grid.getCell(bx, by);
    bCell.landType = "grass";
    bCell.revealed = false;
    bCell.setItem("tree");
    Math.random = () => this._pickExplorationTarget(gameState, tx, ty, bx, by);
    engine.updateExploration();
    assertTrue(bCell.revealed, "Tree cell revealed");
    assertTrue(gameState.state.firstTreeRevealed);

    const cx = 7, cy = 6;
    const cCell = gameState.grid.getCell(cx, cy);
    cCell.landType = "grass";
    cCell.revealed = true;
    cCell.setCharacter(new GameCharacter("GrassAnimal"));
    Math.random = () => this._pickExplorationTarget(gameState, tx, ty, cx, cy);
    engine.updateExploration();

    char.movesMade = Tuning.CHARACTER_MAX_MOVES - 1;
    const dx = 5, dy = 6;
    const dCell = gameState.grid.getCell(dx, dy);
    dCell.landType = "grass";
    dCell.revealed = false;
    dCell.character = null;
    Math.random = () => this._pickExplorationTarget(gameState, tx, ty, dx, dy);
    engine.updateExploration();
    assertTrue(char.isHungry, "Hungry now");

    Math.random = oldRand;
  }

  test_engine_exploration_reproduction_probe() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);
    const engine = new GameEngine(gameState, uiManager);

    for (let gy = 0; gy < 40; gy++) for (let gx = 0; gx < 40; gx++) {
      const c = gameState.grid.getCell(gx, gy);
      c.character = null; c.item = null; c.revealed = true; c.landType = "grass";
    }

    const x = 5, y = 5;
    const cell = gameState.grid.getCell(x, y);
    const char = new GameCharacter("GrassAnimal");
    char.owned = true;
    cell.setCharacter(char);

    const mateCell = gameState.grid.getCell(7, 5);
    mateCell.setCharacter(new GameCharacter("GrassAnimal"));

    const spawnCell = gameState.grid.getCell(5, 4);
    spawnCell.character = null;

    const oldRand = Math.random;
    const randomValues = [this._pickExplorationTarget(gameState, x, y, 6, 5), 0.1, 0.1, 0.0, 0.0];
    let randomIndex = 0;
    Math.random = () => {
      const value = randomIndex < randomValues.length ? randomValues[randomIndex] : randomValues[randomValues.length - 1];
      randomIndex++;
      return value;
    };

    try {
      engine.updateExploration();
    } finally {
      Math.random = oldRand;
    }

    assertEqual(gameState.grid.getCell(6, 5).character, char, "Character moved to exploration target");
    assertNotNull(spawnCell.character, "Expected reproduction to spawn an egg during exploration");
    assertEqual(spawnCell.character.type, "Egg");
  }
}

{
  const thisClass = UnitTests_Engine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
