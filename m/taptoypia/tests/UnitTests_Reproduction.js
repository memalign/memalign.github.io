if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ Reproduction } = require('../src/Reproduction.js'));
}

Tuning.GRID_SIZE = 40;

class UnitTests_Reproduction {
  _withRandomSequence(values, fn) {
    const oldRandom = Math.random;
    let index = 0;
    Math.random = () => {
      const value = index < values.length ? values[index] : values[values.length - 1];
      index++;
      return value;
    };

    try {
      fn();
    } finally {
      Math.random = oldRandom;
    }
  }

  _makeContext() {
    const gameState = new GameState();
    const uiManager = new UIManager(gameState);

    for (let y = 0; y < Tuning.GRID_SIZE; y++) {
      for (let x = 0; x < Tuning.GRID_SIZE; x++) {
        const cell = gameState.grid.getCell(x, y);
        cell.character = null;
        cell.item = null;
        cell.revealed = true;
        cell.landType = 'grass';
      }
    }

    return { gameState, uiManager };
  }

  test_reproduction_probe_egg_short_circuit() {
    const { gameState, uiManager } = this._makeContext();
    const egg = new GameCharacter('Egg');
    assertEqual(Reproduction.tryReproduction(gameState, uiManager, egg, 5, 5), false);
  }

  test_reproduction_probe_max_reproductions_short_circuit() {
    const { gameState, uiManager } = this._makeContext();
    const char = new GameCharacter('GrassAnimal');
    char.reproductionCount = Tuning.CHARACTER_MAX_REPRODUCTIONS;
    assertEqual(Reproduction.tryReproduction(gameState, uiManager, char, 5, 5), false);
  }

  test_reproduction_probe_random_gate_short_circuit() {
    const { gameState, uiManager } = this._makeContext();
    const char = new GameCharacter('GrassAnimal');
    this._withRandomSequence([0.9], () => {
      assertEqual(Reproduction.tryReproduction(gameState, uiManager, char, 5, 5), false);
    });
  }

  test_reproduction_probe_mate_max_reproductions() {
    const { gameState, uiManager } = this._makeContext();
    const cell = gameState.grid.getCell(5, 5);
    const mateCell = gameState.grid.getCell(6, 5);
    const char = new GameCharacter('GrassAnimal');
    const mate = new GameCharacter('GrassAnimal');
    mate.reproductionCount = Tuning.CHARACTER_MAX_REPRODUCTIONS;
    cell.setCharacter(char);
    mateCell.setCharacter(mate);

    this._withRandomSequence([0.1], () => {
      assertEqual(Reproduction.tryReproduction(gameState, uiManager, char, 5, 5), false);
    });
  }

  test_reproduction_probe_parent_child_block() {
    const { gameState, uiManager } = this._makeContext();
    const cell = gameState.grid.getCell(5, 5);
    const mateCell = gameState.grid.getCell(6, 5);
    const char = new GameCharacter('GrassAnimal');
    const mate = new GameCharacter('GrassAnimal');
    char.parentIds = [mate.id];
    cell.setCharacter(char);
    mateCell.setCharacter(mate);

    this._withRandomSequence([0.1], () => {
      assertEqual(Reproduction.tryReproduction(gameState, uiManager, char, 5, 5), false);
    });
  }

  test_reproduction_probe_sibling_block() {
    const { gameState, uiManager } = this._makeContext();
    const cell = gameState.grid.getCell(5, 5);
    const mateCell = gameState.grid.getCell(6, 5);
    const sharedParentId = 'shared-parent';
    const char = new GameCharacter('GrassAnimal', [sharedParentId]);
    const mate = new GameCharacter('GrassAnimal', [sharedParentId]);
    cell.setCharacter(char);
    mateCell.setCharacter(mate);

    this._withRandomSequence([0.1], () => {
      assertEqual(Reproduction.tryReproduction(gameState, uiManager, char, 5, 5), false);
    });
  }

  test_reproduction_probe_no_spawn_candidates() {
    const { gameState, uiManager } = this._makeContext();
    const cell = gameState.grid.getCell(5, 5);
    const mateCell = gameState.grid.getCell(6, 5);
    const char = new GameCharacter('GrassAnimal');
    const mate = new GameCharacter('GrassAnimal');
    cell.setCharacter(char);
    mateCell.setCharacter(mate);

    for (let y = 4; y <= 6; y++) {
      for (let x = 4; x <= 6; x++) {
        if ((x === 5 && y === 5) || (x === 6 && y === 5)) continue;
        gameState.grid.getCell(x, y).setCharacter(new GameCharacter('GrassAnimal'));
      }
    }

    this._withRandomSequence([0.1, 0.1], () => {
      assertEqual(Reproduction.tryReproduction(gameState, uiManager, char, 5, 5), false);
    });
  }

  test_reproduction_probe_success() {
    const { gameState, uiManager } = this._makeContext();
    const cell = gameState.grid.getCell(5, 5);
    const mateCell = gameState.grid.getCell(6, 5);
    const spawnCell = gameState.grid.getCell(4, 4);
    const char = new GameCharacter('GrassAnimal');
    const mate = new GameCharacter('GrassAnimal');
    cell.setCharacter(char);
    mateCell.setCharacter(mate);
    spawnCell.character = null;

    this._withRandomSequence([0.1, 0.1, 0.0, 0.0], () => {
      assertEqual(Reproduction.tryReproduction(gameState, uiManager, char, 5, 5), true);
    });

    assertNotNull(spawnCell.character, 'Expected egg to be spawned');
    assertEqual(spawnCell.character.type, 'Egg');
    assertEqual(char.reproductionCount, 1);
    assertEqual(mate.reproductionCount, 1);
  }

  test_reproduction_probe_no_valid_mates() {
    const { gameState, uiManager } = this._makeContext();
    const char = new GameCharacter('GrassAnimal');
    gameState.grid.getCell(5, 5).setCharacter(char);

    this._withRandomSequence([0.1], () => {
      assertEqual(Reproduction.tryReproduction(gameState, uiManager, char, 5, 5), false);
    });
  }
}

{
  const thisClass = UnitTests_Reproduction;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
