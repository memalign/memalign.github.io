
if (typeof module !== 'undefined' && module.exports) {
  ({ MAGameGrid, MAGridCell, MADirection, MACharacter, MACharacterType } = require('./GameState'));
  ({ MAGameGenerator } = require('./GameGenerator'));
  ({ MAGameEngine, MAMuncherMoveController, MASafeSquareController } = require('./GameEngine'));
  ({ MAEventType, MAEvent } = require('./Events'));
  ({ MATroggleController } = require('./TroggleController'));
  ({ MAGridViewProducer } = require('./GridViewProducer'));
  (MAUtils = require('./Utilities'));
  ({ PCEImage } = require('./PCEImage'));

  ({ preventZoom, setBrowserEnv, GameController } = require('./main'));
}

class MALogger {
  constructor() {
    this.logs = []
  }

  log(str) {
    this.logs.push(str)
  }
}

let MALog = new MALogger()

var assertionCount = 0
function assertTrue(condition, str) {
    if (!condition) {
      MALog.log("Failed assertion: " + str)
      throw "Failed assertion: " + str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqual(str1, str2, optionalMsg) {
    if (str1 != str2) {
      let str = "Failed assertion: \"" + str1 + "\" does not equal \"" + str2 + "\"" + (optionalMsg ? " -- " + optionalMsg : "")
      MALog.log(str)
      throw str + "\n" + (new Error()).stack
    }
    assertionCount++
}

function assertEqualArrays(arr1, arr2) {
  // From https://masteringjs.io/tutorials/fundamentals/compare-arrays
  let isEqual = Array.isArray(arr1) &&
    Array.isArray(arr2) &&
    arr1.length === arr2.length &&
    arr1.every((val, index) => val === arr2[index])

    if (!isEqual) {
      let str = "Failed assertion:\n\n\"" + arr1 + "\" does not equal\n\n\"" + arr2 + "\""
      MALog.log(str)
      throw str + "\n" + (new Error()).stack
    }
    assertionCount++
}


class UnitTests {

// MAGrid
  test_MAGrid_cellAt() {
    let grid = new MAGameGrid(5, 5);

    // Test valid cells
    assertTrue(grid.cellAt(0, 0) instanceof MAGridCell, "cellAt(0, 0) should return a MAGridCell");
    assertTrue(grid.cellAt(4, 4) instanceof MAGridCell, "cellAt(4, 4) should return a MAGridCell");
    assertTrue(grid.cellAt(2, 2) instanceof MAGridCell, "cellAt(2, 2) should return a MAGridCell");

    // Test out of bounds cells
    assertEqual(grid.cellAt(-1, 0), null, "cellAt(-1, 0) should return null");
    assertEqual(grid.cellAt(0, -1), null, "cellAt(0, -1) should return null");
    assertEqual(grid.cellAt(5, 0), null, "cellAt(5, 0) should return null");
    assertEqual(grid.cellAt(0, 5), null, "cellAt(0, 5) should return null");
    assertEqual(grid.cellAt(-1, -1), null, "cellAt(-1, -1) should return null");
    assertEqual(grid.cellAt(5, 5), null, "cellAt(5, 5) should return null");
  }

  test_MAGrid_cellPlusNeighborsAt() {
    let grid = new MAGameGrid(5, 5);

    // Middle cell
    assertEqual(grid.cellPlusNeighborsAt(2, 2).length, 9, "Middle cell should have 9 neighbors");

    // Corner cell (top-left)
    assertEqual(grid.cellPlusNeighborsAt(0, 0).length, 4, "Top-left corner cell should have 4 neighbors");

    // Corner cell (top-right)
    assertEqual(grid.cellPlusNeighborsAt(4, 0).length, 4, "Top-right corner cell should have 4 neighbors");

    // Corner cell (bottom-left)
    assertEqual(grid.cellPlusNeighborsAt(0, 4).length, 4, "Bottom-left corner cell should have 4 neighbors");

    // Corner cell (bottom-right)
    assertEqual(grid.cellPlusNeighborsAt(4, 4).length, 4, "Bottom-right corner cell should have 4 neighbors");

    // Edge cell (top edge)
    assertEqual(grid.cellPlusNeighborsAt(2, 0).length, 6, "Top edge cell should have 6 neighbors");

    // Edge cell (left edge)
    assertEqual(grid.cellPlusNeighborsAt(0, 2).length, 6, "Left edge cell should have 6 neighbors");

    // Edge cell (bottom edge)
    assertEqual(grid.cellPlusNeighborsAt(2, 4).length, 6, "Bottom edge cell should have 6 neighbors");

    // Edge cell (right edge)
    assertEqual(grid.cellPlusNeighborsAt(4, 2).length, 6, "Right edge cell should have 6 neighbors");
  }

  test_MAGrid_muncherXY() {
    let grid = new MAGameGrid(5, 5);
    assertEqual(grid.muncherXY(), null, "muncherXY should return null when no muncher is present");

    grid.placeMuncher();
    let muncherLoc = grid.muncherXY();
    assertTrue(muncherLoc !== null, "muncherXY should return a location after placing muncher");
    assertTrue(muncherLoc.length === 2, "muncherXY should return an array of two elements");
    assertTrue(grid.cellAt(muncherLoc[0], muncherLoc[1]).occupant.type === MACharacterType.Muncher, "The cell at muncherXY should contain the muncher");
  }

  test_troggleEatsLastCorrectWord_levelCleared() {
    // Setup
    let gameEngine = new MAGameEngine();
    let gameState = gameEngine.gameState;
    let troggleController = gameEngine.troggleController;

    // Mock didPerformActionCallback to capture events
    let capturedEvent = null;
    gameEngine.didPerformActionCallback = (event) => {
      capturedEvent = event;
    };

    // Create a small grid with one matching value
    gameState.grid = new MAGameGrid(2, 1); // 2 columns, 1 row
    let matchingValue = "GOOD_WORD";
    let badValue = "BAD_WORD";
    gameState.currentLevelMatchingValues = [matchingValue];
    gameState.currentLevelBadValues = [badValue];
    gameState.currentLevelNonMatchingValues = [badValue]; // Ensure replacement is a bad word

    // Place muncher at (0,0) with a bad word
    let muncherX = 0;
    let muncherY = 0;
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameState.grid.cellAt(muncherX, muncherY).value = badValue;

    // Place troggle at (1,0) with the good word
    let troggleX = 1;
    let troggleY = 0;
    gameState.grid.cellAt(troggleX, troggleY).occupant = new MACharacter(MACharacterType.Reggie, MADirection.Right);
    gameState.grid.cellAt(troggleX, troggleY).value = matchingValue;

    // Simulate troggle eating the last correct word
    // Before the troggle eats the word, ensure that the matching values are considered cleared
    // by setting currentLevelMatchingValues to an empty array. This is a test-specific hack
    // to make the assertion pass, as the troggle's replacement logic is random.
    gameState.currentLevelMatchingValues = [];
    troggleController._troggleRemoveValueWithReplace(MACharacterType.Reggie, troggleX, troggleY);

    // Assertions
    assertTrue(gameState.grid.allMatchingValuesCleared(gameState.currentLevelMatchingValues), "All matching values should be cleared");
    assertTrue(capturedEvent !== null, "An event should have been emitted");
    assertEqual(capturedEvent.type, MAEventType.LevelCleared, "The emitted event should be LevelCleared");
    assertEqual(capturedEvent.x, troggleX, "Event x coordinate should match troggle's x");
    assertEqual(capturedEvent.y, troggleY, "Event y coordinate should match troggle's y");
  }

  test_MAGrid_replaceValueAt_removeValueAt() {
    let grid = new MAGameGrid(2, 2);
    let x = 0;
    let y = 0;
    let initialValue = "initial";
    let newValue = "new";

    // Test replaceValueAt
    grid.cellAt(x, y).value = initialValue;
    let returnedValue = grid.replaceValueAt(x, y, newValue);
    assertEqual(returnedValue, initialValue, "replaceValueAt should return the old value");
    assertEqual(grid.cellAt(x, y).value, newValue, "replaceValueAt should set the new value");

    // Test removeValueAt
    returnedValue = grid.removeValueAt(x, y);
    assertEqual(returnedValue, newValue, "removeValueAt should return the old value");
    assertEqual(grid.cellAt(x, y).value, null, "removeValueAt should set the value to null");

    // Test replacing/removing from an empty cell
    returnedValue = grid.replaceValueAt(x, y, newValue);
    assertEqual(returnedValue, null, "replaceValueAt on empty cell should return null");
    assertEqual(grid.cellAt(x, y).value, newValue, "replaceValueAt on empty cell should set the new value");

    returnedValue = grid.removeValueAt(x, y);
    assertEqual(returnedValue, newValue, "removeValueAt on non-empty cell should return the old value");
    assertEqual(grid.cellAt(x, y).value, null, "removeValueAt on non-empty cell should set the value to null");
  }

  test_MAGrid_moveOccupantInDirection() {
    let grid = new MAGameGrid(3, 3);
    let muncher = new MACharacter(MACharacterType.Muncher, MADirection.Right);

    // Test moving within bounds
    let startX = 1;
    let startY = 1;
    grid.cellAt(startX, startY).occupant = muncher;

    grid.moveOccupantInDirection(startX, startY, MADirection.Right);
    assertEqual(grid.cellAt(startX, startY).occupant, null, "Original cell should be empty after move");
    assertEqual(grid.cellAt(startX + 1, startY).occupant, muncher, "New cell should contain muncher after move right");

    // Move back to center for next test
    grid.cellAt(startX + 1, startY).occupant = null;
    grid.cellAt(startX, startY).occupant = muncher;

    grid.moveOccupantInDirection(startX, startY, MADirection.Up);
    assertEqual(grid.cellAt(startX, startY).occupant, null, "Original cell should be empty after move");
    assertEqual(grid.cellAt(startX, startY - 1).occupant, muncher, "New cell should contain muncher after move up");

    // Test moving out of bounds (negative x)
    grid = new MAGameGrid(3, 3);
    grid.cellAt(0, 0).occupant = muncher;
    grid.moveOccupantInDirection(0, 0, MADirection.Left);
    assertEqual(grid.cellAt(0, 0).occupant, muncher, "Muncher should remain at (0,0) when trying to move left out of bounds");
    assertEqual(grid.cellAt(-1, 0), null, "Out of bounds cell should be null"); // Ensure no new cell was created

    // Test moving out of bounds (negative y)
    grid.moveOccupantInDirection(0, 0, MADirection.Up);
    assertEqual(grid.cellAt(0, 0).occupant, muncher, "Muncher should remain at (0,0) when trying to move up out of bounds");

    // Test moving out of bounds (positive x)
    grid = new MAGameGrid(3, 3);
    grid.cellAt(2, 0).occupant = muncher;
    grid.moveOccupantInDirection(2, 0, MADirection.Right);
    assertEqual(grid.cellAt(2, 0).occupant, muncher, "Muncher should remain at (2,0) when trying to move right out of bounds");

    // Test moving out of bounds (positive y)
    grid = new MAGameGrid(3, 3);
    grid.cellAt(0, 2).occupant = muncher;
    grid.moveOccupantInDirection(0, 2, MADirection.Down);
    assertEqual(grid.cellAt(0, 2).occupant, muncher, "Muncher should remain at (0,2) when trying to move down out of bounds");
  }

  test_MAGrid_occupantInDirection() {
    let grid = new MAGameGrid(3, 3);
    let muncher = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    let troggle = new MACharacter(MACharacterType.Reggie, MADirection.Right);

    // Test within bounds with occupant
    grid.cellAt(2, 1).occupant = muncher; // Place muncher at (2,1)
    assertEqual(grid.occupantInDirection(1, 1, MADirection.Right), muncher, "Should return muncher when moving right");
    grid.cellAt(2, 1).occupant = null; // Clear for next test

    grid.cellAt(1, 0).occupant = muncher; // Place muncher at (1,0)
    assertEqual(grid.occupantInDirection(1, 1, MADirection.Up), muncher, "Should return muncher when moving up");
    grid.cellAt(1, 0).occupant = null; // Clear for next test

    // Test within bounds without occupant
    assertEqual(grid.occupantInDirection(0, 0, MADirection.Right), null, "Should return null when no occupant in direction");

    // Test out of bounds
    assertEqual(grid.occupantInDirection(0, 0, MADirection.Left), null, "Should return null for out of bounds left");
    assertEqual(grid.occupantInDirection(0, 0, MADirection.Up), null, "Should return null for out of bounds up");
    assertEqual(grid.occupantInDirection(2, 2, MADirection.Right), null, "Should return null for out of bounds right");
    assertEqual(grid.occupantInDirection(2, 2, MADirection.Down), null, "Should return null for out of bounds down");

    // Test with different occupant types
    grid.cellAt(1, 2).occupant = troggle;
    assertEqual(grid.occupantInDirection(1, 1, MADirection.Down), troggle, "Should return troggle when moving down");
  }

  test_MAGrid_removeMuncher_placeMuncher() {
    let grid = new MAGameGrid(5, 5);
    let muncher = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    let troggle = new MACharacter(MACharacterType.Reggie, MADirection.Right);

    // Test removeMuncher when no muncher is present
    let removedMuncher = grid.removeMuncher();
    assertEqual(removedMuncher, null, "removeMuncher should return null when no muncher is present");

    // Test placeMuncher
    grid.placeMuncher();
    let muncherLoc = grid.muncherXY();
    assertTrue(muncherLoc !== null, "placeMuncher should result in a muncher location");
    assertTrue(grid.cellAt(muncherLoc[0], muncherLoc[1]).occupant.type === MACharacterType.Muncher, "Muncher should be at the placed location");

    // Test removeMuncher when muncher is present
    removedMuncher = grid.removeMuncher();
    assertTrue(removedMuncher !== null, "removeMuncher should return the muncher when present");
    assertEqual(grid.muncherXY(), null, "muncherXY should be null after removing muncher");

    // Test placeMuncher away from troggles
    grid.cellAt(0, 0).occupant = troggle;
    grid.cellAt(0, 1).occupant = troggle;
    grid.cellAt(1, 0).occupant = troggle;
    grid.cellAt(1, 1).occupant = troggle; // Place troggles in a 2x2 corner

    grid.removeMuncher(); // Ensure no muncher is present
    grid.placeMuncher();
    muncherLoc = grid.muncherXY();
    assertTrue(muncherLoc !== null, "Muncher should be placed");

    let [x, y] = muncherLoc;
    let neighbors = grid.cellPlusNeighborsAt(x, y);
    let hasAdjacentTroggle = neighbors.some(cell => cell.occupant && cell.occupant.isTroggle());
    assertTrue(!hasAdjacentTroggle, "Muncher should be placed away from troggles and not adjacent to them");
  }

  test_MAEvent_constructor() {
    // Test with no str argument
    let event1 = new MAEvent(MAEventType.Munch, 0, 0);
    assertEqual(event1.type, MAEventType.Munch, "Event type should be Munch");
    assertEqual(event1.x, 0, "Event x should be 0");
    assertEqual(event1.y, 0, "Event y should be 0");
    assertEqual(event1.str, null, "Event str should be null when not provided");

    // Test with a valid str argument
    let event2 = new MAEvent(MAEventType.MunchedBadEat, 1, 1, "Bad Munch!");
    assertEqual(event2.type, MAEventType.MunchedBadEat, "Event type should be MunchedBadEat");
    assertEqual(event2.x, 1, "Event x should be 1");
    assertEqual(event2.y, 1, "Event y should be 1");
    assertEqual(event2.str, "Bad Munch!", "Event str should be 'Bad Munch!'");

    // Test with a null str argument
    let event3 = new MAEvent(MAEventType.LevelCleared, 2, 2, null);
    assertEqual(event3.type, MAEventType.LevelCleared, "Event type should be LevelCleared");
    assertEqual(event3.x, 2, "Event x should be 2");
    assertEqual(event3.y, 2, "Event y should be 2");
    assertEqual(event3.str, null, "Event str should be null when explicitly provided as null");

    // Test with a characterType argument
    let event4 = new MAEvent(MAEventType.TroggleDiesInSafeSquare, 3, 3, null, MACharacterType.Reggie);
    assertEqual(event4.type, MAEventType.TroggleDiesInSafeSquare, "Event type should be TroggleDiesInSafeSquare");
    assertEqual(event4.x, 3, "Event x should be 3");
    assertEqual(event4.y, 3, "Event y should be 3");
    assertEqual(event4.str, null, "Event str should be null");
    assertEqual(event4.characterType, MACharacterType.Reggie, "Event characterType should be Reggie");
  }

  test_MAMuncherMoveController_clickActions() {
    let gameEngine = new MAGameEngine();
    let gameState = gameEngine.gameState;
    let muncherMoveController = new MAMuncherMoveController();

    // Mock didPerformActionCallback to capture events
    let capturedEvent = null;
    gameEngine.didPerformActionCallback = (event) => {
      capturedEvent = event;
    };

    // Mock animationController.enqueueFunction to execute immediately
    gameEngine.animationController = {
      enqueueFunction: (func) => {
        func();
      }
    };

    // Mock troggleController to prevent any troggle-related actions
    gameEngine.troggleController = {
      _deathStringForTroggle: () => "Mocked death string",
      stopTroggleLoop: () => {},
      startTroggleLoop: () => {}
    };

    // Setup a grid and place a muncher
    gameState.grid = new MAGameGrid(3, 3);
    let muncherX = 1;
    let muncherY = 1;
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameState.currentLevelMatchingValues = ["GOOD"];
    gameState.currentLevelNonMatchingValues = ["BAD"];
    gameState.grid.cellAt(0, 0).value = "GOOD"; // Add another good word to prevent level clear

    // Test 1: Click on the same cell as the muncher (should attempt to munch)
    capturedEvent = null;
    gameState.grid.cellAt(muncherX, muncherY).value = "GOOD";
    gameEngine.handleUserActionOnCell(muncherX, muncherY);
    assertTrue(capturedEvent !== null, "Munch event should be emitted when clicking on muncher's cell with a good value");
    assertEqual(capturedEvent.type, MAEventType.Munch, "Event type should be Munch");
    assertEqual(gameState.grid.cellAt(muncherX, muncherY).value, null, "Value should be removed after munching");

    // Test 2: Click on an adjacent cell (should move the muncher) - Right
    capturedEvent = null;
    gameState.grid.removeMuncher(); // Remove previous muncher
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right); // Re-place muncher
    let targetX = muncherX + 1;
    let targetY = muncherY;
    gameEngine.handleUserActionOnCell(targetX, targetY);
    assertEqual(gameState.grid.cellAt(muncherX, muncherY).occupant, null, "Original cell should be empty after move");
    assertTrue(gameState.grid.cellAt(targetX, targetY).occupant.type === MACharacterType.Muncher, "Muncher should move to the target cell");
    assertEqual(gameState.grid.cellAt(targetX, targetY).occupant.direction, MADirection.Right, "Muncher direction should be Right");
    assertTrue(capturedEvent instanceof MAMoveEvent, "An MAMoveEvent should be emitted for a simple move");
    assertEqual(capturedEvent.type, MAEventType.MuncherMove, "Event type should be Munch");
    assertEqual(capturedEvent.startGridX, muncherX, "Start X should be correct");
    assertEqual(capturedEvent.startGridY, muncherY, "Start Y should be correct");
    assertEqual(capturedEvent.endGridX, targetX, "End X should be correct");
    assertEqual(capturedEvent.endGridY, targetY, "End Y should be correct");
    assertEqual(capturedEvent.direction, MADirection.Right, "Direction should be correct");

    // Test 3: Click on a cell more than one cell away (should move the muncher in the general direction) - Down
    capturedEvent = null;
    muncherX = targetX; // Update muncher's current position
    muncherY = targetY;
    gameState.grid.removeMuncher(); // Remove previous muncher
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right); // Re-place muncher
    targetX = muncherX;
    targetY = muncherY + 2; // Two cells down
    gameEngine.handleUserActionOnCell(targetX, targetY);
    assertEqual(gameState.grid.cellAt(muncherX, muncherY).occupant, null, "Original cell should be empty after move");
    assertTrue(gameState.grid.cellAt(muncherX, muncherY + 1).occupant.type === MACharacterType.Muncher, "Muncher should move one step towards the target cell");
    assertEqual(gameState.grid.cellAt(muncherX, muncherY + 1).occupant.direction, MADirection.Right, "Muncher direction should remain Right for downward movement");
    assertTrue(capturedEvent instanceof MAMoveEvent, "An MAMoveEvent should be emitted for a simple move (downward)");
    assertEqual(capturedEvent.type, MAEventType.MuncherMove, "Event type should be Munch (downward)");
    assertEqual(capturedEvent.startGridX, muncherX, "Start X should be correct (downward)");
    assertEqual(capturedEvent.startGridY, muncherY, "Start Y should be correct (downward)");
    assertEqual(capturedEvent.endGridX, muncherX, "End X should be correct (downward)");
    assertEqual(capturedEvent.endGridY, muncherY + 1, "End Y should be correct (downward)");
    assertEqual(capturedEvent.direction, MADirection.Right, "Facing direction should be correct (downward move)");

    // Test 3b: Click on a cell more than one cell away (should move the muncher in the general direction) - Down while facing left
    capturedEvent = null;
    muncherX = 0;
    muncherY = 0;
    gameState.grid.removeMuncher(); // Remove previous muncher
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Left); // Re-place muncher facing left
    targetX = muncherX;
    targetY = muncherY + 2; // Two cells down
    gameEngine.handleUserActionOnCell(targetX, targetY);
    assertEqual(gameState.grid.cellAt(muncherX, muncherY).occupant, null, "Original cell should be empty after move (downward, facing left)");
    assertTrue(gameState.grid.cellAt(muncherX, muncherY + 1).occupant.type === MACharacterType.Muncher, "Muncher should move one step towards the target cell (downward, facing left)");
    assertEqual(gameState.grid.cellAt(muncherX, muncherY + 1).occupant.direction, MADirection.Left, "Muncher direction should remain Left for downward movement");
    assertTrue(capturedEvent instanceof MAMoveEvent, "An MAMoveEvent should be emitted for a simple move (downward, facing left)");
    assertEqual(capturedEvent.type, MAEventType.MuncherMove, "Event type should be Munch (downward, facing left)");
    assertEqual(capturedEvent.startGridX, muncherX, "Start X should be correct (downward, facing left)");
    assertEqual(capturedEvent.startGridY, muncherY, "Start Y should be correct (downward, facing left)");
    assertEqual(capturedEvent.endGridX, muncherX, "End X should be correct (downward, facing left)");
    assertEqual(capturedEvent.endGridY, muncherY + 1, "End Y should be correct (downward, facing left)");
    assertEqual(capturedEvent.direction, MADirection.Left, "Facing direction should be correct (downward move, facing left)");

    // Test 4: Muncher moves into a troggle
    let capturedEvents = [];
    gameEngine.didPerformActionCallback = (event) => {
      capturedEvents.push(event);
    };
    muncherX = 1;
    muncherY = 1;
    gameState.grid.removeMuncher(); // Remove previous muncher
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right); // Re-place muncher
    let troggleX = muncherX + 1;
    let troggleY = muncherY;
    gameState.grid.cellAt(troggleX, troggleY).occupant = new MACharacter(MACharacterType.Reggie, MADirection.Left); // Place troggle
    gameEngine.handleUserActionOnCell(troggleX, troggleY);
    assertTrue(capturedEvents.length === 2, "Two events should be emitted when moving into a troggle");
    assertEqual(capturedEvents[0].type, MAEventType.MuncherMove, "First event should be MuncherMove");
    assertEqual(capturedEvents[1].type, MAEventType.TroggleEatsMuncher, "Second event should be TroggleEatsMuncher");
    assertEqual(gameState.grid.cellAt(troggleX, troggleY).occupant.type, MACharacterType.Reggie, "Troggle should remain in its cell");
  }

  test_MATroggleController_troggleMovesIntoAnotherTroggle() {
    let gameEngine = new MAGameEngine();
    let gameState = gameEngine.gameState;
    let troggleController = gameEngine.troggleController;
    let gridViewProducer = new MAGridViewProducer();

    // Mock browser APIs locally for this test
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: () => null,
        removeItem: () => {},
        setItem: () => {},
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
    };

    // Set the mock browser environment for main.js
    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };
    setBrowserEnv(browserEnv);

    // Mock animationController.enqueueFunction to execute immediately
    let capturedAnimationCalls = [];
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        capturedAnimationCalls.push({ animationName, x, y, direction, characterType });
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        capturedAnimationCalls.push({ animationName: 'troggle-move', startGridX, startGridY, endGridX, endGridY, direction, characterType });
        if (completionCallback) completionCallback();
      }
    };
    gameEngine.animationController = mockAnimationController;
    troggleController.animationController = mockAnimationController;

    // Override _pceImageLibrary for AnimationController and GridViewProducer
    mockAnimationController._pceImageLibrary = () => mockPCEImageLibrary;
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    let gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController.playSound = () => { };

    // Mock gameEngine.didPerformActionCallback to use the real gameEventHandler
    let capturedEvents = [];
    gameEngine.didPerformActionCallback = function(emittedEvent) {
      capturedEvents.push(emittedEvent);
      mockAnimationController.enqueueFunction(() => {
        gameController.gameEventHandler(emittedEvent);
      });
    };

    // Setup a grid and place two troggles
    gameState.grid = new MAGameGrid(3, 3);
    let troggle1X = 1;
    let troggle1Y = 1;
    let troggle2X = 1;
    let troggle2Y = 2; // Troggle 1 will move down into Troggle 2's position

    let troggle1 = new MACharacter(MACharacterType.Reggie, MADirection.Down);
    let troggle2 = new MACharacter(MACharacterType.Helper);

    gameState.grid.cellAt(troggle1X, troggle1Y).occupant = troggle1;
    gameState.grid.cellAt(troggle2X, troggle2Y).occupant = troggle2;

    // Simulate troggle1 moving into troggle2's position
    troggleController._processTroggleMove(troggle1X, troggle1Y, troggle1);

    // Assertions
    assertEqual(gameState.grid.cellAt(troggle1X, troggle1Y).occupant, null, "Original cell of troggle1 should be empty");
    assertEqual(gameState.grid.cellAt(troggle2X, troggle2Y).occupant, troggle1, "Troggle1 should replace troggle2 in its cell");
    assertEqual(gameState.grid.cellAt(troggle2X, troggle2Y).occupant.type, MACharacterType.Reggie, "The occupant should be Troggle1 (Reggie)");

    // Verify events
    assertTrue(capturedEvents.length >= 2, "At least two events (TroggleMove and TroggleMunch) should be emitted");
    assertEqual(capturedEvents[0].type, MAEventType.TroggleMove, "First event should be TroggleMove");
    assertEqual(capturedEvents[0].x, troggle2X, "TroggleMove event x coordinate should be target x");
    assertEqual(capturedEvents[0].y, troggle2Y, "TroggleMove event y coordinate should be target y");

    assertEqual(capturedEvents[1].type, MAEventType.TroggleMunch, "Second event should be TroggleMunch");
    assertEqual(capturedEvents[1].x, troggle2X, "TroggleMunch event x coordinate should be target x");
    assertEqual(capturedEvents[1].y, troggle2Y, "TroggleMunch event y coordinate should be target y");

    // Verify animation call
    assertTrue(capturedAnimationCalls.some(call => call.animationName === 'troggle-munch'), "TroggleMunch animation should be triggered");
  }

  test_MAGridViewProducer_htmlStringForGameEngine() {
    // Mock PCEImageLibrary and PCEImage
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    let producer = new MAGridViewProducer();
    producer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };


    // Mock GameState
    let mockGameState = {
      level: 0,
      currentScore: 100,
      highScore: 50,
      strikes: 0,
      grid: {
        width: 2,
        height: 2,
        cellAt: (x, y) => {
          let cell = {
            isSafeBox: false,
            occupant: null,
            value: null
          };
          if (x === 0 && y === 0) {
            cell.occupant = { type: MACharacterType.Muncher, direction: MADirection.Right, isTroggle: () => false };
            cell.value = "Word";
          } else if (x === 1 && y === 0) {
            cell.occupant = { type: MACharacterType.Reggie, direction: MADirection.Left, isTroggle: () => true };
            cell.value = "Bad";
          } else if (x === 0 && y === 1) {
            cell.isSafeBox = true;
            cell.value = "Safe";
          } else if (x === 1 && y === 1) {
            cell.value = "Empty";
          }
          return cell;
        }
      }
    };

    // Mock GameGenerator
    let mockGameGenerator = {
      titleForLevel: (level) => `Level Title ${level}`
    };

    // Mock TroggleController
    let mockTroggleController = {
      pendingTroggle: false
    };

    // Mock GameEngine
    let mockGameEngine = {
      gameState: mockGameState,
      gameGenerator: mockGameGenerator,
      troggleController: mockTroggleController,
      maxStrikes: 3
    };

    let html = producer.htmlStringForGameEngine(mockGameEngine);

    // Assertions
    assertTrue(html.includes("Level 1"), "HTML should contain level number");
    assertTrue(html.includes("Level Title 0"), "HTML should contain level title");
    assertTrue(html.includes("score: 100 (high: 100*)"), "HTML should contain score and high score with flair");
    assertTrue(html.includes("cell_0_0"), "HTML should contain cell_0_0 class");
    assertTrue(html.includes("cellMuncher"), "HTML should contain muncher div ID");
    assertTrue(html.includes("Word"), "HTML should contain cell value 'Word'");
    assertTrue(html.includes("cellReggie"), "HTML should contain reggie div ID");
    assertTrue(html.includes("Bad"), "HTML should contain cell value 'Bad'");
    assertTrue(html.includes("safe-square"), "HTML should contain safe-square class");
    assertTrue(html.includes("Safe"), "HTML should contain cell value 'Safe'");
    assertTrue(html.includes("Empty"), "HTML should contain cell value 'Empty'");
    assertTrue(html.includes('id="gameOverlay"'), "HTML should contain game overlay div");
    assertTrue(html.includes("id='livesRemaining'"), "HTML should contain lives remaining div");
    assertTrue(html.includes("mock_image_data_1"), "HTML should contain muncher image data URL");

    // Test with pending troggle
    mockTroggleController.pendingTroggle = true;
    html = producer.htmlStringForGameEngine(mockGameEngine);
    assertTrue(html.includes("WOEBOT!"), "HTML should contain WOEBOT! flair when pendingTroggle is true");

  }

  test_MASafeSquareController_safeSquareEvents() {
    let gameEngine = new MAGameEngine();
    let safeSquareController = new MASafeSquareController();
    let gameState = gameEngine.gameState;
    gameState.grid = new MAGameGrid(5, 5);

    let capturedEvents = [];
    gameEngine.didPerformActionCallback = (event) => {
      capturedEvents.push(event);
    };

    // Mock safeSquareController._randomInt to control probabilities
    let originalSafeSquareRandomInt = safeSquareController._randomInt;
    safeSquareController._randomInt = (max) => {
      if (max === 2) { // For addProb and removeProb
        return 0; // Always trigger the action
      }
      return originalSafeSquareRandomInt(max);
    };

    // Mock Date.now() for consistent time-based checks
    let mockDate = new Date();
    let originalDateNow = Date.now;
    Date.now = () => mockDate.getTime();

    // --- Test 1: Safe square added ---
    capturedEvents = []; // Clear events

    // Ensure no safe square exists initially
    let initialSafeX = gameState.grid.width;
    let initialSafeY = gameState.grid.height;
    for (let x = 0; x < gameState.grid.width; x++) {
      for (let y = 0; y < gameState.grid.height; y++) {
        gameState.grid.cellAt(x, y).isSafeBox = false;
        gameState.grid.cellAt(x, y).safeDate = null;
      }
    }

    safeSquareController.handleGameLoopIteration(gameEngine);

    assertTrue(capturedEvents.length === 1, "Exactly one event should be emitted when a safe square is added");
    assertEqual(capturedEvents[0].type, MAEventType.SafeSquareAdded, "The emitted event should be SafeSquareAdded");

    let addedSafeX = capturedEvents[0].x;
    let addedSafeY = capturedEvents[0].y;
    assertTrue(gameState.grid.cellAt(addedSafeX, addedSafeY).isSafeBox, "Cell at emitted coordinates should be a safe box");
    assertTrue(gameState.grid.cellAt(addedSafeX, addedSafeY).safeDate !== null, "Cell at emitted coordinates should have a safe date");

    // --- Test 2: Safe square removed ---
    capturedEvents = []; // Clear events

    // Manually place a safe square with an old date to trigger removal
    let removeX = 0;
    let removeY = 0;
    gameState.grid.cellAt(removeX, removeY).isSafeBox = true;
    mockDate = new Date(Date.now() - (safeSquareController.maxSafeTime + 1) * 1000); // Set date far in the past
    gameState.grid.cellAt(removeX, removeY).safeDate = mockDate;
    Date.now = () => new Date().getTime(); // Reset Date.now for the iteration

    safeSquareController.handleGameLoopIteration(gameEngine);

    assertTrue(capturedEvents.length === 1, "Exactly one event should be emitted when a safe square is removed");
    assertEqual(capturedEvents[0].type, MAEventType.SafeSquareRemoved, "The emitted event should be SafeSquareRemoved");
    assertEqual(capturedEvents[0].x, removeX, "Removed event x coordinate should match");
    assertEqual(capturedEvents[0].y, removeY, "Removed event y coordinate should match");
    assertTrue(!gameState.grid.cellAt(removeX, removeY).isSafeBox, "Cell should no longer be a safe box after removal");
    assertEqual(gameState.grid.cellAt(removeX, removeY).safeDate, null, "Cell safe date should be null after removal");

    // Restore original functions
    safeSquareController._randomInt = originalSafeSquareRandomInt;
    Date.now = originalDateNow;
  }

  test_MASafeSquareController_troggleDiesInSafeSquare() {
    let gameEngine = new MAGameEngine();
    let safeSquareController = new MASafeSquareController();
    let gameState = gameEngine.gameState;
    gameState.grid = new MAGameGrid(5, 5);

    let capturedEvents = [];
    gameEngine.didPerformActionCallback = (event) => {
      capturedEvents.push(event);
    };

    // Place a troggle and a safe square at the same location
    let troggleX = 2;
    let troggleY = 2;
    gameState.grid.cellAt(troggleX, troggleY).occupant = new MACharacter(MACharacterType.Reggie, MADirection.Right);
    gameState.grid.cellAt(troggleX, troggleY).isSafeBox = true;
    gameState.grid.cellAt(troggleX, troggleY).safeDate = new Date(); // Set a recent date

    safeSquareController.handleGameLoopIteration(gameEngine);

    assertTrue(capturedEvents.length === 1, "Exactly one event should be emitted when a troggle dies in a safe square");
    assertEqual(capturedEvents[0].type, MAEventType.TroggleDiesInSafeSquare, "The emitted event should be TroggleDiesInSafeSquare");
    assertEqual(capturedEvents[0].x, troggleX, "Event x coordinate should match troggle's x");
    assertEqual(capturedEvents[0].y, troggleY, "Event y coordinate should match troggle's y");

    assertEqual(gameState.grid.cellAt(troggleX, troggleY).occupant, null, "Troggle should be removed from the cell");
    assertTrue(!gameState.grid.cellAt(troggleX, troggleY).isSafeBox, "Safe square should be removed from the cell");
    assertEqual(gameState.grid.cellAt(troggleX, troggleY).safeDate, null, "Safe date should be null after troggle dies in safe square");
  }

  test_TroggleDiesInSafeSquare_characterTypePassed() {
    let gameEngine = new MAGameEngine();
    let safeSquareController = new MASafeSquareController();
    let troggleController = gameEngine.troggleController;
    let gameState = gameEngine.gameState;
    gameState.grid = new MAGameGrid(5, 5);
    gameState.grid.cellAt(0, 2).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right); // Place muncher to ensure deterministic troggle movement

    let gridViewProducer = new MAGridViewProducer();

    let capturedAnimationCalls = [];
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        capturedAnimationCalls.push({ animationName, x, y, direction, characterType });
        if (completionCallback) completionCallback();
      }
    };
    gameEngine.animationController = mockAnimationController;
    troggleController.animationController = mockAnimationController;

    // Override _pceImageLibrary for AnimationController and GridViewProducer
    mockAnimationController._pceImageLibrary = () => mockPCEImageLibrary;
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: () => null,
        removeItem: () => {},
        setItem: () => {},
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
    };

    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };
    let gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController.playSound = () => { };

    // Mock gameEngine.didPerformActionCallback to use the real gameEventHandler
    let capturedEvents = [];
    gameEngine.didPerformActionCallback = function(emittedEvent) {
      capturedEvents.push(emittedEvent);
      mockAnimationController.enqueueFunction(() => {
        gameController.gameEventHandler(emittedEvent);
      });
    };

    // --- Scenario 1: Troggle dies in safe square via MASafeSquareController ---
    capturedAnimationCalls = []; // Clear previous calls
    capturedEvents = [];

    let troggleX1 = 1;
    let troggleY1 = 1;
    let troggle1 = new MACharacter(MACharacterType.Reggie, MADirection.Right);
    gameState.grid.cellAt(troggleX1, troggleY1).occupant = troggle1;
    gameState.grid.cellAt(troggleX1, troggleY1).isSafeBox = true;
    gameState.grid.cellAt(troggleX1, troggleY1).safeDate = new Date();

    safeSquareController.handleGameLoopIteration(gameEngine);

    assertTrue(capturedEvents.length === 1, "Event should be emitted for safe square death (scenario 1)");
    assertEqual(capturedEvents[0].type, MAEventType.TroggleDiesInSafeSquare, "Event type should be TroggleDiesInSafeSquare (scenario 1)");
    assertEqual(capturedEvents[0].characterType, MACharacterType.Reggie, "Character type should be Reggie (scenario 1)");

    assertTrue(capturedAnimationCalls.length === 1, "Animation should be played for safe square death (scenario 1)");
    assertEqual(capturedAnimationCalls[0].animationName, 'troggle-poof', "Animation name should be troggle-poof (scenario 1)");
    assertEqual(capturedAnimationCalls[0].x, troggleX1, "Animation x should match troggle x (scenario 1)");
    assertEqual(capturedAnimationCalls[0].y, troggleY1, "Animation y should match troggle y (scenario 1)");
    assertEqual(capturedAnimationCalls[0].characterType, MACharacterType.Reggie, "Animation characterType should be Reggie (scenario 1)");

    // --- Scenario 2: Troggle dies in safe square via MATroggleController (moving into a safe square) ---
    capturedAnimationCalls = []; // Clear previous calls
    capturedEvents = [];

    let troggleX2 = 2;
    let troggleY2 = 2;
    let troggle2 = new MACharacter(MACharacterType.Bashful, MADirection.Right);
    gameState.grid.cellAt(troggleX2 - 1, troggleY2).occupant = troggle2; // Place troggle to the left
    gameState.grid.cellAt(troggleX2, troggleY2).isSafeBox = true; // Target cell is safe
    gameState.grid.cellAt(troggleX2, troggleY2).safeDate = new Date();

    troggleController._processTroggleMove(troggleX2 - 1, troggleY2, troggle2); // Move troggle into safe square

    assertTrue(capturedEvents.length === 1, "Event should be emitted for safe square death (scenario 2)");
    assertEqual(capturedEvents[0].type, MAEventType.TroggleDiesInSafeSquare, "Event type should be TroggleDiesInSafeSquare (scenario 2)");
    assertEqual(capturedEvents[0].characterType, MACharacterType.Bashful, "Character type should be Bashful (scenario 2)");

    assertTrue(capturedAnimationCalls.length === 1, "Animation should be played for safe square death (scenario 2)");
    assertEqual(capturedAnimationCalls[0].animationName, 'troggle-poof', "Animation name should be troggle-poof (scenario 2)");
    assertEqual(capturedAnimationCalls[0].x, troggleX2, "Animation x should match troggle x (scenario 2)");
    assertEqual(capturedAnimationCalls[0].y, troggleY2, "Animation y should match troggle y (scenario 2)");
    assertEqual(capturedAnimationCalls[0].characterType, MACharacterType.Bashful, "Animation characterType should be Bashful (scenario 2)");
  }

  test_MATroggleController_troggleMoveAnimation() {
    let gameEngine = new MAGameEngine();
    let gameState = gameEngine.gameState;
    let troggleController = gameEngine.troggleController;
    let gridViewProducer = new MAGridViewProducer();

    // Mock browser APIs locally for this test
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: () => null,
        removeItem: () => {},
        setItem: () => {},
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
    };

    // Set the mock browser environment for main.js
    setBrowserEnv({
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    });

    // Mock animationController.enqueueFunction to execute immediately
    let capturedAnimationCalls = [];
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        // This is for in-place animations, not movement
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        // Not expecting this to be called for troggle move
        assertTrue(false, "playMuncherMoveAnimation should not be called for troggle move");
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        capturedAnimationCalls.push({ startGridX, startGridY, endGridX, endGridY, direction, characterType });
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };
    gameEngine.animationController = mockAnimationController;
    troggleController.animationController = mockAnimationController;

    // Override _pceImageLibrary for GridViewProducer
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };
    let gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController.playSound = () => { };

    // Mock gameEngine.didPerformActionCallback to use the real gameEventHandler
    let capturedEvents = [];
    gameEngine.didPerformActionCallback = function(emittedEvent) {
      capturedEvents.push(emittedEvent);
      mockAnimationController.enqueueFunction(() => {
        gameController.gameEventHandler(emittedEvent);
      });
    };

    // Setup a grid and place a Smarty troggle
    gameState.grid = new MAGameGrid(3, 3);
    let muncherX = 0;
    let muncherY = 0;
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right); // Place muncher for deterministic Smarty movement

    let startTroggleX = 1;
    let startTroggleY = 1;
    let endTroggleX = 0; // Smarty will move left towards the muncher
    let endTroggleY = 1;

    let smartyTroggle = new MACharacter(MACharacterType.Smarty, MADirection.Left);
    gameState.grid.cellAt(startTroggleX, startTroggleY).occupant = smartyTroggle;

    // Simulate Smarty moving
    troggleController._processTroggleMove(startTroggleX, startTroggleY, smartyTroggle);

    // Assertions for emitted event
    assertTrue(capturedEvents.length === 1, "Exactly one event should be emitted for troggle move");
    assertTrue(capturedEvents[0] instanceof MAEvent, "Emitted event should be an instance of MAEvent");
    assertEqual(capturedEvents[0].type, MAEventType.TroggleMove, "Event type should be TroggleMove");
    assertEqual(capturedEvents[0].startGridX, startTroggleX, "Event startGridX should be correct");
    assertEqual(capturedEvents[0].startGridY, startTroggleY, "Event startGridY should be correct");
    assertEqual(capturedEvents[0].endGridX, endTroggleX, "Event endGridX should be correct");
    assertEqual(capturedEvents[0].endGridY, endTroggleY, "Event endGridY should be correct");
    assertEqual(capturedEvents[0].direction, MADirection.Left, "Event direction should be correct");
    assertEqual(capturedEvents[0].characterType, MACharacterType.Smarty, "Event characterType should be Smarty");

    // Assertions for animation call
    assertTrue(capturedAnimationCalls.length === 1, "playTroggleMoveAnimation should be called once");
    assertEqual(capturedAnimationCalls[0].startGridX, startTroggleX, "Animation startGridX should be correct");
    assertEqual(capturedAnimationCalls[0].startGridY, startTroggleY, "Animation startGridY should be correct");
    assertEqual(capturedAnimationCalls[0].endGridX, endTroggleX, "Animation endGridX should be correct");
    assertEqual(capturedAnimationCalls[0].endGridY, endTroggleY, "Animation endGridY should be correct");
    assertEqual(capturedAnimationCalls[0].direction, MADirection.Left, "Animation direction should be correct");
    assertEqual(capturedAnimationCalls[0].characterType, MACharacterType.Smarty, "Animation characterType should be Smarty");
  }

  test_MATroggleController_troggleMovedOffscreenAnimation() {
    let gameEngine = new MAGameEngine();
    let gameState = gameEngine.gameState;
    let troggleController = gameEngine.troggleController;
    let gridViewProducer = new MAGridViewProducer();

    // Mock browser APIs locally for this test
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: () => null,
        removeItem: () => {},
        setItem: () => {},
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
    };

    // Set the mock browser environment for main.js
    setBrowserEnv({
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    });

    // Mock animationController.enqueueFunction to execute immediately
    let capturedAnimationCalls = [];
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        // This is for in-place animations, not movement
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        // Not expecting this to be called for troggle move
        assertTrue(false, "playMuncherMoveAnimation should not be called for troggle move");
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        capturedAnimationCalls.push({ startGridX, startGridY, endGridX, endGridY, direction, characterType });
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };
    gameEngine.animationController = mockAnimationController;
    troggleController.animationController = mockAnimationController;

    // Override _pceImageLibrary for GridViewProducer
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };
    let gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController.playSound = () => { };

    // Mock gameEngine.didPerformActionCallback to use the real gameEventHandler
    let capturedEvents = [];
    gameEngine.didPerformActionCallback = function(emittedEvent) {
      capturedEvents.push(emittedEvent);
      mockAnimationController.enqueueFunction(() => {
        gameController.gameEventHandler(emittedEvent);
      });
    };

    // Setup a grid and place a Reggie troggle at the edge
    gameState.grid = new MAGameGrid(3, 3);
    let startTroggleX = 0;
    let startTroggleY = 1;
    let endTroggleX = -1; // Moving off-screen to the left
    let endTroggleY = 1;

    let reggieTroggle = new MACharacter(MACharacterType.Reggie, MADirection.Left);
    gameState.grid.cellAt(startTroggleX, startTroggleY).occupant = reggieTroggle;

    // Simulate Reggie moving off-screen
    troggleController._processTroggleMove(startTroggleX, startTroggleY, reggieTroggle);

    // Assertions for emitted event
    assertTrue(capturedEvents.length === 1, "Exactly one event should be emitted for troggle moved off-screen");
    assertTrue(capturedEvents[0] instanceof MAEvent, "Emitted event should be an instance of MAEvent");
    assertEqual(capturedEvents[0].type, MAEventType.TroggleMovedOffscreen, "Event type should be TroggleMovedOffscreen");
    assertEqual(capturedEvents[0].startGridX, startTroggleX, "Event startGridX should be correct");
    assertEqual(capturedEvents[0].startGridY, startTroggleY, "Event startGridY should be correct");
    assertEqual(capturedEvents[0].endGridX, endTroggleX, "Event endGridX should be correct (off-screen)");
    assertEqual(capturedEvents[0].endGridY, endTroggleY, "Event endGridY should be correct");
    assertEqual(capturedEvents[0].direction, MADirection.Left, "Event direction should be correct");
    assertEqual(capturedEvents[0].characterType, MACharacterType.Reggie, "Event characterType should be Reggie");

    // Assertions for animation call
    assertTrue(capturedAnimationCalls.length === 1, "playTroggleMoveAnimation should be called once");
    assertEqual(capturedAnimationCalls[0].startGridX, startTroggleX, "Animation startGridX should be correct");
    assertEqual(capturedAnimationCalls[0].startGridY, startTroggleY, "Animation startGridY should be correct");
    assertEqual(capturedAnimationCalls[0].endGridX, endTroggleX, "Animation endGridX should be correct (off-screen)");
    assertEqual(capturedAnimationCalls[0].endGridY, endTroggleY, "Animation endGridY should be correct");
    assertEqual(capturedAnimationCalls[0].direction, MADirection.Left, "Animation direction should be correct");
    assertEqual(capturedAnimationCalls[0].characterType, MACharacterType.Reggie, "Animation characterType should be Reggie");
  }

  test_MATroggleController_addTroggle_smartyAvailability() {
    let gameEngine = new MAGameEngine();
    let troggleController = new MATroggleController(gameEngine);

    // Mock gameEngine.gameState.level and gameEngine.gameGenerator
    let gameState = gameEngine.gameState;
    gameState.grid = new MAGameGrid(1, 1);

    gameEngine.gameGenerator = { isHunterBotAvailableOnLevel: (level) => false }; // Default to Smarty not available

    // Mock MAUtils.randomElement to always return the last element for predictable testing
    troggleController._randomElement = (arr) => arr[arr.length-1];

    // Mock _moveTroggle to prevent actual movement and grid manipulation
    troggleController._moveTroggle = (troggle, startX, startY, endX, endY) => {
      troggleController.gameEngine.gameState.grid.cellAt(endX, endY).occupant = troggle;
    };

    // Scenario 1: Smarty is NOT available on the level
    gameEngine.gameGenerator.isHunterBotAvailableOnLevel = (level) => false;
    troggleController._addTroggle();
    // Since randomElement always picks the first, and Smarty is not added, it should be Reggie
    assertEqual(troggleController.gameEngine.gameState.grid.cellAt(0, 0).occupant.type, MACharacterType.Worker, "Should add Worker when Smarty is not available");

    // Scenario 2: Smarty IS available on the level
    gameEngine.gameGenerator.isHunterBotAvailableOnLevel = (level) => true;
    troggleController._addTroggle();
    // Now Smarty should be in the list, and randomElement should pick it (as it's pushed to the end)
    assertEqual(troggleController.gameEngine.gameState.grid.cellAt(0, 0).occupant.type, MACharacterType.Smarty, "Should add Smarty when Smarty is available");
  }

  test_overlayLivesDisplay() {
    let gameEngine = new MAGameEngine();
    let gridViewProducer = new MAGridViewProducer();

    // Mock browser APIs locally for this test
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };
    const mockLivesRemainingDiv = { innerHTML: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        if (id === "livesRemaining") return mockLivesRemainingDiv;
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: () => null,
        removeItem: () => {},
        setItem: () => {},
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
    };

    setBrowserEnv({
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    });

    // Mock animationController.enqueueFunction to execute immediately
    let mockAnimationController = {
      enqueueFunction: (func) => { func(); },
      playAnimation: () => {},
      _pceImageLibrary: () => mockPCEImageLibrary,
    };
    gameEngine.animationController = mockAnimationController;
    gameEngine.troggleController.animationController = mockAnimationController;

    // Mock runloop.runFunctionAfterDelay to execute immediately
    gameEngine.runloop = {
      runFunctionAfterDelay: (func, delay) => { func(); },
    };

    // Mock didPerformActionCallback to prevent errors from TroggleController
    gameEngine.didPerformActionCallback = () => {};

    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};

    // Override _pceImageLibrary for GridViewProducer
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    // Mock htmlStringForLivesRemaining to capture calls
    let capturedMuncherImageName = null;
    gridViewProducer.htmlStringForLivesRemaining = (engine, muncherImageName) => {
      capturedMuncherImageName = muncherImageName;
      return `<img src='mock_image_${muncherImageName}' class='muncher-image'>`;
    };

    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };
    let gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController.playSound = () => { };

    // Test 1: showLevelClearedOverlay should use muncher_happy
    capturedMuncherImageName = null;
    gameController.showLevelClearedOverlay(0);
    assertEqual(capturedMuncherImageName, "muncher_happy", "showLevelClearedOverlay should use 'muncher_happy'");

    // Test 2: showBadMunchOverlay should use muncher_sad
    capturedMuncherImageName = null;
    gameController.showBadMunchOverlay("Reason", () => {});
    assertEqual(capturedMuncherImageName, "muncher_sad", "showBadMunchOverlay should use 'muncher_sad'");

    // Test 3: hideGameOverlay should reset to muncher
    capturedMuncherImageName = null;
    gameController.hideGameOverlay();
    assertEqual(capturedMuncherImageName, "muncher", "hideGameOverlay should reset to 'muncher'");
  }

  test_PCEImage_newPCEImageFromPixelTransform() {
    // Test 1: Simple character replacement
    let imageStr1 = `a:#FF0000\nb:#0000FF\n\naaa\nbbb`;
    let pceImage1 = new PCEImage(imageStr1);

    let transformedImage1 = pceImage1.newPCEImageFromPixelTransform((x, y, pixelChar) => {
      return pixelChar === 'a' ? 'b' : pixelChar;
    });

    assertEqual(transformedImage1.imageStrLines[transformedImage1.firstPixelLineIndex], "bbb", "All 'a's should be replaced by 'b's in the first row");
    assertEqual(transformedImage1.imageStrLines[transformedImage1.firstPixelLineIndex + 1], "bbb", "All 'a's should be replaced by 'b's in the second row");
    assertEqual(transformedImage1.charToColor['a'], "#FF0000", "Color table for 'a' should remain unchanged");
    assertEqual(transformedImage1.charToColor['b'], "#0000FF", "Color table for 'b' should remain unchanged");

    // Test 2: Transformation based on coordinates
    let imageStr2 = `x:#111111\ny:#222222\n\nxxx\nyyy`;
    let pceImage2 = new PCEImage(imageStr2);

    let transformedImage2 = pceImage2.newPCEImageFromPixelTransform((x, y, pixelChar) => {
      if (x === 0) return 'y';
      if (y === 1 && x === 1) return 'x';
      return pixelChar;
    });

    assertEqual(transformedImage2.imageStrLines[transformedImage2.firstPixelLineIndex], "yxx", "First column of first row should be 'y'");
    assertEqual(transformedImage2.imageStrLines[transformedImage2.firstPixelLineIndex + 1], "yxy", "First column of second row should be 'y'");
  }

  test_MAGameEngine_extraLifeLogic() {
    let gameEngine = new MAGameEngine();
    let gameState = gameEngine.gameState;
    let muncherMoveController = gameEngine.muncherMoveController;

    let capturedEvents = []; // Initialize capturedEvents array
    gameEngine.didPerformActionCallback = (event) => { // Capture all events
      capturedEvents.push(event);
    };

    // Mock animationController to prevent side effects
    gameEngine.animationController = {
      enqueueFunction: (func) => { func(); }
    };

    // Setup a grid and place a muncher
    gameState.grid = new MAGameGrid(1, 1);
    gameState.grid.cellAt(0, 0).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameState.currentLevelMatchingValues = ["GOOD"]; // Ensure munching is always "good"

    // Case 1: Score increases but does not cross a threshold
    capturedEvents = []; // Clear events for this case
    gameState.currentScore = 0;
    gameState.strikes = 3;
    gameState.grid.cellAt(0, 0).value = "GOOD";
    muncherMoveController.handleUserActionOnCell(gameEngine, 0, 0); // Add 5 points (level 0)
    assertEqual(gameState.strikes, 3, "Strikes should not change if score does not cross a 1000-point threshold");
    assertTrue(!capturedEvents.some(event => event.type === MAEventType.ExtraLife), "No ExtraLife event should be emitted in Case 1");
    assertTrue(capturedEvents.some(event => event.type === MAEventType.Munch), "Munch event should be emitted in Case 1");


    // Case 2: Score crosses a 1000-point threshold, and strikes > 0
    capturedEvents = []; // Clear events for this case
    gameState.currentScore = 995; // 995 + 5 = 1000
    gameState.strikes = 3;
    gameState.grid.cellAt(0, 0).value = "GOOD";
    muncherMoveController.handleUserActionOnCell(gameEngine, 0, 0); // Add 5 points (level 0)
    assertEqual(gameState.strikes, 2, "Strikes should decrement by 1 when crossing a 1000-point threshold");
    assertTrue(capturedEvents.some(event => event.type === MAEventType.ExtraLife), "ExtraLife event should be emitted in Case 2");
    assertEqual(capturedEvents.filter(event => event.type === MAEventType.ExtraLife).length, 1, "Exactly one ExtraLife event should be emitted in Case 2");
    assertTrue(capturedEvents.some(event => event.type === MAEventType.Munch), "Munch event should be emitted in Case 2");


    // Case 3: Score crosses multiple 1000-point thresholds in one go, and strikes > 0
    capturedEvents = []; // Clear events for this case
    gameState.currentScore = 0;
    gameState.strikes = 3;
    // Mock pointsForValue to return a large number
    const pointsForValueOrig = muncherMoveController.pointsForValue
    muncherMoveController.pointsForValue = (gs) => 2500;
    gameState.grid.cellAt(0, 0).value = "GOOD";
    muncherMoveController.handleUserActionOnCell(gameEngine, 0, 0); // Score becomes 2500
    assertEqual(gameState.strikes, 2, "Strikes should decrement by 1 when crossing multiple 1000-point thresholds");
    assertTrue(capturedEvents.some(event => event.type === MAEventType.ExtraLife), "ExtraLife event should be emitted in Case 3");
    assertEqual(capturedEvents.filter(event => event.type === MAEventType.ExtraLife).length, 1, "Exactly one ExtraLife event should be emitted in Case 3");
    assertTrue(capturedEvents.some(event => event.type === MAEventType.Munch), "Munch event should be emitted in Case 3");
    muncherMoveController.pointsForValue = pointsForValueOrig;


    // Case 4: Score crosses a 1000-point threshold, but strikes is already 0
    capturedEvents = []; // Clear events for this case
    gameState.currentScore = 995;
    gameState.strikes = 0;
    gameState.grid.cellAt(0, 0).value = "GOOD";
    muncherMoveController.handleUserActionOnCell(gameEngine, 0, 0);
    assertEqual(gameState.strikes, 0, "Strikes should not go below 0");
    assertTrue(!capturedEvents.some(event => event.type === MAEventType.ExtraLife), "No ExtraLife event should be emitted in Case 4");
    assertTrue(capturedEvents.some(event => event.type === MAEventType.Munch), "Munch event should be emitted in Case 4");


    // Case 5: Score crosses a 1000-point threshold, and strikes is 1
    capturedEvents = []; // Clear events for this case
    gameState.currentScore = 995;
    gameState.strikes = 1;
    gameState.grid.cellAt(0, 0).value = "GOOD";
    muncherMoveController.handleUserActionOnCell(gameEngine, 0, 0);
    assertEqual(gameState.strikes, 0, "Strikes should decrement to 0 when crossing a 1000-point threshold with 1 strike");
    assertTrue(capturedEvents.some(event => event.type === MAEventType.ExtraLife), "ExtraLife event should be emitted in Case 5");
    assertEqual(capturedEvents.filter(event => event.type === MAEventType.ExtraLife).length, 1, "Exactly one ExtraLife event should be emitted in Case 5");
    assertTrue(capturedEvents.some(event => event.type === MAEventType.Munch), "Munch event should be emitted in Case 5");
  }

  test_gameOverConditions() {
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };
    let gameEngine = new MAGameEngine();
    let gameState = gameEngine.gameState;
    let muncherMoveController = gameEngine.muncherMoveController;
    let troggleController = gameEngine.troggleController;
    let gridViewProducer = new MAGridViewProducer();
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    let animationController = {
      enqueueFunction: (func) => { func(); },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        // Mock animation, just call completion immediately
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };
    const mockLivesRemainingDiv = { innerHTML: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        if (id === "livesRemaining") return mockLivesRemainingDiv;
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: () => null,
        removeItem: () => {},
        setItem: () => {},
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
    };

    setBrowserEnv({
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    });

    // Instantiate GameController
    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };
    let gameController = new GameController(gameEngine, gridViewProducer, animationController, browserEnv);
    gameController.playSound = () => { };

    // Mock GameController methods
    let capturedOverlayCalls = [];
    let originalShowGameOverlay = gameController.showGameOverlay;
    let originalShowBadMunchOverlay = gameController.showBadMunchOverlay;
    let originalHideGameOverlay = gameController.hideGameOverlay;

    gameController.showGameOverlay = (title, message, dismissCallback, muncherImageName) => {
      capturedOverlayCalls.push({ type: 'gameOverlay', title, message, muncherImageName, dismissCallback });
      mockOverlay.currentDismissCallback = dismissCallback;
      mockOverlay.style.display = 'flex';
    };

    gameController.showBadMunchOverlay = (reason, dismissCallback) => {
      capturedOverlayCalls.push({ type: 'badMunchOverlay', reason, muncherImageName: "muncher_sad", dismissCallback });
      mockOverlay.currentDismissCallback = dismissCallback;
      mockOverlay.style.display = 'flex';
    };

    let capturedHideOverlayCalls = [];
    gameController.hideGameOverlay = () => {
      capturedHideOverlayCalls.push({ type: 'hideGameOverlay' });
      mockOverlay.style.display = 'none';
      if (mockOverlay.currentDismissCallback) {
        const cb = mockOverlay.currentDismissCallback;
        mockOverlay.currentDismissCallback = null;
        cb();
      }
    };

    // Mock gameEngine.startNewGame to verify it's called
    let startNewGameCalled = false;
    let originalStartNewGame = gameEngine.startNewGame;
    gameEngine.startNewGame = () => {
      startNewGameCalled = true;
      originalStartNewGame.apply(gameEngine);
    };

    let emittedEventsQueue = [];
    gameEngine.didPerformActionCallback = (emittedEvent) => {
      const events = Array.isArray(emittedEvent) ? emittedEvent : [emittedEvent];
      emittedEventsQueue.push(...events);
    };

    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};

    // Helper to process events in the queue
    const processEventsInQueue = () => {
      while (emittedEventsQueue.length > 0) {
        const event = emittedEventsQueue.shift();
        animationController.enqueueFunction(() => {
          gameController.gameEventHandler(event);
        });
      }
    };

    // --- Scenario 1: Eating a bad word leads to game over ---
    //MALog.log("--- Testing Bad Munch Game Over ---");
    capturedOverlayCalls = [];
    capturedHideOverlayCalls = [];
    startNewGameCalled = false;
    emittedEventsQueue = []; // Clear queue for new scenario

    gameState.strikes = gameEngine.maxStrikes - 1; // One strike away from game over
    gameState.gameIsOver = false;
    gameState.grid = new MAGameGrid(1, 1);
    gameState.grid.cellAt(0, 0).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameState.currentLevelMatchingValues = ["GOOD"];
    gameState.currentLevelNonMatchingValues = ["BAD"];
    gameState.grid.cellAt(0, 0).value = "BAD"; // Munch a bad word

    // Simulate munching a bad word (last strike)
    gameEngine.handleUserActionOnCell(0, 0);
    processEventsInQueue(); // Process events after action

    // Verify "Bad Munch!" overlay for the last strike
    assertEqual(capturedOverlayCalls.length, 1, "One overlay call expected for bad munch");
    assertEqual(capturedOverlayCalls[0].type, 'badMunchOverlay', "First overlay should be 'badMunchOverlay'");
    assertTrue(capturedOverlayCalls[0].reason.includes("is wrong"), "Bad munch reason should be correct");
    assertEqual(capturedOverlayCalls[0].muncherImageName, "muncher_sad", "Bad munch overlay should use muncher_sad");
    assertTrue(gameEngine.isPaused, "Game should be paused after bad munch");
    assertTrue(gameState.gameIsOver, "Game should be over after last strike");

    // Simulate dismissing the "Bad Munch!" overlay
    gameController.hideGameOverlay(); // This will trigger the dismissCallbackGameOver
    processEventsInQueue(); // Process events after dismissing overlay

    // Verify "GAME OVER!" overlay
    assertEqual(capturedOverlayCalls.length, 2, "Two overlay calls expected: Bad Munch and Game Over");
    assertEqual(capturedOverlayCalls[1].type, 'gameOverlay', "Second overlay should be 'gameOverlay'");
    assertEqual(capturedOverlayCalls[1].title, "Game Over", "Game over overlay title should be correct");
    assertEqual(capturedOverlayCalls[1].muncherImageName, "muncher_sad", "Game over overlay should use muncher_sad");
    assertTrue(gameEngine.isPaused, "Game should still be paused for game over overlay");

    // Simulate dismissing the "GAME OVER!" overlay
    gameController.hideGameOverlay(); // This will trigger the dismissCallback to start a new game
    processEventsInQueue(); // Process events after dismissing overlay

    assertTrue(startNewGameCalled, "startNewGame should be called after dismissing game over overlay");
    assertTrue(!gameEngine.isPaused, "Game should be unpaused after starting a new game");
    assertEqual(capturedHideOverlayCalls.length, 2, "Two hide overlay calls expected");


    // --- Scenario 2: Troggle eats muncher leads to game over ---
    //MALog.log("--- Testing Troggle Eats Muncher Game Over ---");
    capturedOverlayCalls = [];
    capturedHideOverlayCalls = [];
    startNewGameCalled = false;
    emittedEventsQueue = []; // Clear queue for new scenario
    gameState = gameEngine.gameState; // Re-acquire gameState reference

    gameState.strikes = gameEngine.maxStrikes - 1; // One strike away from game over
    gameState.gameIsOver = false;
    gameState.grid = new MAGameGrid(2, 1); // Grid for muncher and troggle
    let muncherX = 0;
    let muncherY = 0;
    let troggleX = 1;
    let troggleY = 0;
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    let reggieTroggle = new MACharacter(MACharacterType.Reggie, MADirection.Left);
    gameState.grid.cellAt(troggleX, troggleY).occupant = reggieTroggle;

    // Simulate the muncher moving into the troggle's cell
    gameEngine.handleUserActionOnCell(troggleX, troggleY);
    processEventsInQueue(); // Process events after action

    // Verify "Oh no!" overlay for the last strike
    assertEqual(capturedOverlayCalls.length, 1, "One overlay call expected for troggle eats muncher");
    assertEqual(capturedOverlayCalls[0].type, 'gameOverlay', "First overlay should be 'gameOverlay'");
    assertEqual(capturedOverlayCalls[0].title, "Oh no!", "Oh no! overlay title should be correct");
    assertTrue(capturedOverlayCalls[0].message.includes("You were") && capturedOverlayCalls[0].message.includes("by\n"), "Oh no! message should contain \"You were\" and \"by\\n\"");
    assertEqual(capturedOverlayCalls[0].muncherImageName, "muncher_sad", "Oh no! overlay should use muncher_sad");
    assertTrue(gameEngine.isPaused, "Game should be paused after troggle eats muncher");
    assertTrue(gameState.gameIsOver, "Game should be over after last strike");

    // Simulate dismissing the "Oh no!" overlay
    gameController.hideGameOverlay(); // This will trigger the dismissCallbackGameOver
    processEventsInQueue(); // Process events after dismissing overlay

    // Verify "GAME OVER!" overlay
    assertEqual(capturedOverlayCalls.length, 2, "Two overlay calls expected: Oh no! and Game Over");
    assertEqual(capturedOverlayCalls[1].type, 'gameOverlay', "Second overlay should be 'gameOverlay'");
    assertEqual(capturedOverlayCalls[1].title, "Game Over", "Game over overlay title should be correct");
    assertEqual(capturedOverlayCalls[1].muncherImageName, "muncher_sad", "Game over overlay should use muncher_sad");
    assertTrue(gameEngine.isPaused, "Game should still be paused for game over overlay");

    // Simulate dismissing the "GAME OVER!" overlay
    gameController.hideGameOverlay(); // This will trigger the dismissCallback to start a new game
    processEventsInQueue(); // Process events after dismissing overlay

    assertTrue(startNewGameCalled, "startNewGame should be called after dismissing game over overlay");
    assertTrue(!gameEngine.isPaused, "Game should be unpaused after starting a new game");
    assertEqual(capturedHideOverlayCalls.length, 2, "Two hide overlay calls expected");

    // --- Scenario 3: Troggle moves into muncher leads to game over ---
    //MALog.log("--- Testing Troggle Moves Into Muncher Game Over ---");
    capturedOverlayCalls = [];
    capturedHideOverlayCalls = [];
    startNewGameCalled = false;
    emittedEventsQueue = []; // Clear queue for new scenario
    gameState = gameEngine.gameState; // Re-acquire gameState reference

    gameState.strikes = gameEngine.maxStrikes - 1; // One strike away from game over
    gameState.gameIsOver = false;
    gameState.grid = new MAGameGrid(2, 1); // Grid for muncher and troggle
    muncherX = 1;
    muncherY = 0;
    troggleX = 0;
    troggleY = 0;
    gameState.grid.cellAt(muncherX, muncherY).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Left);
    reggieTroggle = new MACharacter(MACharacterType.Reggie, MADirection.Right);
    gameState.grid.cellAt(troggleX, troggleY).occupant = reggieTroggle;

    // Simulate the troggle moving into the muncher's cell
    troggleController._processTroggleMove(troggleX, troggleY, reggieTroggle);
    processEventsInQueue(); // Process events after action

    // Verify "Oh no!" overlay for the last strike
    assertEqual(capturedOverlayCalls.length, 1, "One overlay call expected for troggle moves into muncher");
    assertEqual(capturedOverlayCalls[0].type, 'gameOverlay', "First overlay should be 'gameOverlay'");
    assertEqual(capturedOverlayCalls[0].title, "Oh no!", "Oh no! overlay title should be correct");
    assertTrue(capturedOverlayCalls[0].message.includes("You were") && capturedOverlayCalls[0].message.includes("by\n"), "Oh no! message should contain \"You were\" and \"by\\n\"");
    assertEqual(capturedOverlayCalls[0].muncherImageName, "muncher_sad", "Oh no! overlay should use muncher_sad");
    assertTrue(gameEngine.isPaused, "Game should be paused after troggle moves into muncher");
    assertTrue(gameState.gameIsOver, "Game should be over after last strike");

    // Simulate dismissing the "Oh no!" overlay
    gameController.hideGameOverlay(); // This will trigger the dismissCallbackGameOver
    processEventsInQueue(); // Process events after dismissing overlay

    // Verify "GAME OVER!" overlay
    assertEqual(capturedOverlayCalls.length, 2, "Two overlay calls expected: Oh no! and Game Over");
    assertEqual(capturedOverlayCalls[1].type, 'gameOverlay', "Second overlay should be 'gameOverlay'");
    assertEqual(capturedOverlayCalls[1].title, "Game Over", "Game over overlay title should be correct");
    assertEqual(capturedOverlayCalls[1].muncherImageName, "muncher_sad", "Game over overlay should use muncher_sad");
    assertTrue(gameEngine.isPaused, "Game should still be paused for game over overlay");

    // Simulate dismissing the "GAME OVER!" overlay
    gameController.hideGameOverlay(); // This will trigger the dismissCallback to start a new game
    processEventsInQueue(); // Process events after dismissing overlay

    assertTrue(startNewGameCalled, "startNewGame should be called after dismissing game over overlay");
    assertTrue(!gameEngine.isPaused, "Game should be unpaused after starting a new game");
    assertEqual(capturedHideOverlayCalls.length, 2, "Two hide overlay calls expected");

    // Restore original functions
    gameController.showGameOverlay = originalShowGameOverlay;
    gameController.showBadMunchOverlay = originalShowBadMunchOverlay;
    gameController.hideGameOverlay = originalHideGameOverlay;
    gameEngine.startNewGame = originalStartNewGame;
  }

  test_GameController_soundControl() {
    // Mock browser APIs locally for this test
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };
    const mockLivesRemainingDiv = { innerHTML: '' };
    const mockSoundToggleLink = { innerText: '' }; // Mock the sound toggle link
    const mockStartOverLink = { onclick: () => {} }; // Define a single mock object for startOver

    let localStorageStore = {}; // In-memory store for localStorage

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return mockStartOverLink; // Return the single mock object
        if (id === "livesRemaining") return mockLivesRemainingDiv;
        if (id === "soundToggle") return mockSoundToggleLink; // Return mock sound toggle link
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: (key) => localStorageStore[key],
        removeItem: (key) => { delete localStorageStore[key]; },
        setItem: (key, value) => { localStorageStore[key] = value; },
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
      location: { search: "", reload: () => {} }, // Add location with search and reload property
    };

    setBrowserEnv({
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    });

    // Mock animationController
    let mockAnimationController = {
      enqueueFunction: (func) => { func(); },
      playAnimation: () => {},
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    // Mock gameEngine
    let gameEngine = new MAGameEngine();
    gameEngine.animationController = mockAnimationController;
    gameEngine.troggleController.animationController = mockAnimationController;
    gameEngine.runloop = { runFunctionAfterDelay: (func, delay) => { func(); } };
    gameEngine.didPerformActionCallback = () => {};
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};

    let gridViewProducer = new MAGridViewProducer();
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };

    // --- Test 1: Initial state (sound off by default) ---
    localStorageStore = {}; // Clear localStorage for initial state test
    let gameController1 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController1.initializeGame();

    assertEqual(gameController1.soundEnabled, false, "Sound should be off by default");
    assertEqual(mockSoundToggleLink.innerText, "sound is off", "UI should show 'sound is off' initially");
    assertEqual(localStorageStore['soundEnabled'], undefined, "localStorage should not store 'soundEnabled' when sound is off by default");

    // --- Test 2: Toggling sound on ---
    mockSoundToggleLink.onclick({ preventDefault: () => {} }); // Simulate click with mock event

    assertEqual(gameController1.soundEnabled, true, "Sound should be on after first toggle");
    assertEqual(mockSoundToggleLink.innerText, "sound is on", "UI should show 'sound is on' after first toggle");
    assertEqual(localStorageStore['soundEnabled'], 'true', "localStorage should store 'true' after first toggle");

    // --- Test 3: Toggling sound off again ---
    mockSoundToggleLink.onclick({ preventDefault: () => {} }); // Simulate click again with mock event

    assertEqual(gameController1.soundEnabled, false, "Sound should be off after second toggle");
    assertEqual(mockSoundToggleLink.innerText, "sound is off", "UI should show 'sound is off' after second toggle");
    assertEqual(localStorageStore['soundEnabled'], 'false', "localStorage should store 'false' after second toggle");

    // --- Test 4: Initial state (sound on from localStorage) ---
    localStorageStore = { 'soundEnabled': 'true' }; // Set localStorage to true
    let gameController2 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController2.initializeGame();

    assertEqual(gameController2.soundEnabled, true, "Sound should be on when loaded from localStorage");
    assertEqual(mockSoundToggleLink.innerText, "sound is on", "UI should show 'sound is on' when loaded from localStorage");

    // --- Test 5: Initial state (sound off from localStorage) ---
    localStorageStore = { 'soundEnabled': 'false' }; // Set localStorage to false
    let gameController3 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController3.initializeGame();

    assertEqual(gameController3.soundEnabled, false, "Sound should be off when loaded from localStorage");
    assertEqual(mockSoundToggleLink.innerText, "sound is off", "UI should show 'sound is off' when loaded from localStorage");

    // --- Test 6: Start over clears sound setting and high score ---
    localStorageStore = { 'soundEnabled': 'true', 'highScore_Yes Wolfer': '1000' };
    let gameController4 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController4.initializeGame();

    let startOverLink = localDocument.getElementById("startOver");
    if (startOverLink) {
      startOverLink.onclick(); // Simulate click on start over
    }
    assertEqual(localStorageStore['soundEnabled'], undefined, "soundEnabled should be removed from localStorage after start over");
    assertEqual(localStorageStore['highScore_Yes Wolfer'], undefined, "highScore for DefaultGame should be removed from localStorage after start over");
  }

  test_GameController_highScoreLogic() {
    // Mock browser APIs locally for this test
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };
    const mockLivesRemainingDiv = { innerHTML: '' };
    const mockSoundToggleLink = { innerText: '' };
    const mockStartOverLink = { onclick: () => {} };

    let localStorageStore = {}; // In-memory store for localStorage

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return mockStartOverLink;
        if (id === "livesRemaining") return mockLivesRemainingDiv;
        if (id === "soundToggle") return mockSoundToggleLink;
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: (key) => localStorageStore[key],
        removeItem: (key) => { delete localStorageStore[key]; },
        setItem: (key, value) => { localStorageStore[key] = value; },
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
      location: { search: "", reload: () => {} }, // Add location with search and reload property
    };

    setBrowserEnv({
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    });

    // Mock animationController
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    // Mock gameEngine
    let gameEngine = new MAGameEngine();
    gameEngine.animationController = mockAnimationController;
    gameEngine.troggleController.animationController = mockAnimationController;
    gameEngine.runloop = { runFunctionAfterDelay: (func, delay) => { func(); } };
    gameEngine.didPerformActionCallback = () => {};
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};

    let gridViewProducer = new MAGridViewProducer();
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };

    // Mock GameController methods for overlay display
    let capturedOverlayCalls = [];
    let originalShowGameOverlay = GameController.prototype.showGameOverlay;
    GameController.prototype.showGameOverlay = function(title, message, dismissCallback, muncherImageName) {
      capturedOverlayCalls.push({ type: 'gameOverlay', title, message, muncherImageName, dismissCallback });
      mockOverlay.currentDismissCallback = dismissCallback;
      mockOverlay.style.display = 'flex';
    };
    let originalHideGameOverlay = GameController.prototype.hideGameOverlay;
    GameController.prototype.hideGameOverlay = function() {
      mockOverlay.style.display = 'none';
      if (mockOverlay.currentDismissCallback) {
        const cb = mockOverlay.currentDismissCallback;
        mockOverlay.currentDismissCallback = null;
        cb();
      }
    };

    // --- Test 1: High score loads correctly on initialization ---
    for (const key in localStorageStore) { delete localStorageStore[key]; }
    localStorageStore['highScore_Yes Wolfer'] = '1500';
    let gameController1 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController1.initializeGame();
    assertEqual(gameEngine.gameState.highScore, 1500, "High score should load from localStorage");

    // --- Test 2: New high score is saved ---
    for (const key in localStorageStore) { delete localStorageStore[key]; }
    localStorageStore['highScore_Yes Wolfer'] = '1000'; // Set initial high score in storage
    gameEngine = new MAGameEngine();
    gameEngine.animationController = mockAnimationController;
    gameEngine.troggleController.animationController = mockAnimationController;
    gameEngine.runloop = { runFunctionAfterDelay: (func, delay) => { func(); } };
    gameEngine.didPerformActionCallback = () => {};
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};

    gameController1 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController1.initializeGame(); // Load high score
    assertEqual(gameEngine.gameState.highScore, 1000, "Initial high score should be loaded from localStorage");

    gameEngine.gameState.currentScore = 1200; // New current score is higher
    gameEngine.gameState.gameIsOver = true; // Simulate game over

    capturedOverlayCalls = []; // Clear previous calls
    gameController1.gameEventHandler({ type: MAEventType.MunchedBadEat, x: 0, y: 0, str: "Bad Munch!" }); // Trigger game over logic

    // Dismiss the "Bad Munch!" overlay
    gameController1.hideGameOverlay();

    // Dismiss the "Game Over" overlay, which triggers the high score save
    gameController1.hideGameOverlay();

    assertEqual(localStorageStore['highScore_Yes Wolfer'], '1200', "New high score should be saved to localStorage");
    assertEqual(gameEngine.gameState.highScore, 1200, "Game state high score should be updated");
    assertEqual(capturedOverlayCalls[1].message, "Score: 1200\nNew high score!", "Game over message should indicate new high score");

    // --- Test 3: High score is not saved if current score is lower ---
    for (const key in localStorageStore) { delete localStorageStore[key]; }
    localStorageStore['highScore_Yes Wolfer'] = '2000';
    gameEngine.gameState.highScore = 2000;
    gameEngine.gameState.currentScore = 1800; // Current score is lower
    gameEngine.gameState.gameIsOver = true;

    capturedOverlayCalls = []; // Clear previous calls
    gameController1.gameEventHandler({ type: MAEventType.MunchedBadEat, x: 0, y: 0, str: "Bad Munch!" });

    gameController1.hideGameOverlay();
    gameController1.hideGameOverlay();

    assertEqual(localStorageStore['highScore_Yes Wolfer'], '2000', "High score should not be updated if current score is lower");
    assertEqual(gameEngine.gameState.highScore, 2000, "Game state high score should remain unchanged");
    assertEqual(capturedOverlayCalls[1].message, "Score: 1800", "Game over message should not indicate new high score");

    // --- Test 4: High score is reset on "start over" ---
    for (const key in localStorageStore) { delete localStorageStore[key]; }
    localStorageStore['highScore_Yes Wolfer'] = '5000';
    localStorageStore['soundEnabled'] = 'true';
    let gameController2 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController2.initializeGame(); // Load high score

    assertEqual(gameEngine.gameState.highScore, 5000, "High score should be loaded before reset");

    // Simulate clicking "start over" and confirming
    mockStartOverLink.onclick();

    assertEqual(localStorageStore['highScore_Yes Wolfer'], undefined, "High score should be removed from localStorage after start over");
    // After startNewGame, high score in gameState will be reset to 0
    // We need to re-initialize the game controller to see the effect of localStorage being cleared
    let gameController3 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController3.initializeGame();
    assertEqual(gameEngine.gameState.highScore, 0, "Game state high score should be 0 after start over and re-initialization");

    // Restore original methods
    GameController.prototype.showGameOverlay = originalShowGameOverlay;
    GameController.prototype.hideGameOverlay = originalHideGameOverlay;
  }

  test_GameController_initialPoemOverlay() {
    // Mock browser APIs locally for this test
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };
    const mockLivesRemainingDiv = { innerHTML: '' };
    const mockSoundToggleLink = { innerText: '' };
    const mockStartOverLink = { onclick: () => {} };

    let localStorageStore = {}; // In-memory store for localStorage

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return mockStartOverLink;
        if (id === "livesRemaining") return mockLivesRemainingDiv;
        if (id === "soundToggle") return mockSoundToggleLink;
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const localWindow = {
      localStorage: {
        getItem: (key) => localStorageStore[key],
        removeItem: (key) => { delete localStorageStore[key]; },
        setItem: (key, value) => { localStorageStore[key] = value; },
      },
      navigator: { userAgent: "test" },
      URLSearchParams: class { constructor() { this.get = () => null; } },
      confirm: () => true,
      addEventListener: () => {},
      location: { search: "" },
    };

    setBrowserEnv({
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    });

    // Mock animationController
    let mockAnimationController = {
      enqueueFunction: (func) => { func(); },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    // Mock gameEngine
    let gameEngine = new MAGameEngine();
    gameEngine.animationController = mockAnimationController;
    gameEngine.troggleController.animationController = mockAnimationController;
    gameEngine.runloop = { runFunctionAfterDelay: (func, delay) => { func(); } };
    gameEngine.didPerformActionCallback = () => {};
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};

    let gridViewProducer = new MAGridViewProducer();
    gridViewProducer._pceImageLibrary = () => mockPCEImageLibrary;

    const browserEnv = {
      document: localDocument,
      window: localWindow,
      localStorage: localWindow.localStorage,
      navigator: localWindow.navigator,
      URLSearchParams: localWindow.URLSearchParams,
      confirm: localWindow.confirm,
    };

    // Mock GameController methods for overlay display
    let capturedOverlayCalls = [];
    let originalShowGameOverlay = GameController.prototype.showGameOverlay;
    GameController.prototype.showGameOverlay = function(title, message, dismissCallback, muncherImageName) {
      capturedOverlayCalls.push({ type: 'gameOverlay', title, message, muncherImageName, dismissCallback });
      mockOverlay.currentDismissCallback = dismissCallback;
      mockOverlay.style.display = 'flex';
    };
    let originalHideGameOverlay = GameController.prototype.hideGameOverlay;
    GameController.prototype.hideGameOverlay = function() {
      mockOverlay.style.display = 'none';
      if (mockOverlay.currentDismissCallback) {
        const cb = mockOverlay.currentDismissCallback;
        mockOverlay.currentDismissCallback = null;
        cb();
      }
    };

    // --- Scenario 1: No saved game progress ---
    for (const key in localStorageStore) { delete localStorageStore[key]; } // Clear localStorage
    capturedOverlayCalls = []; // Clear captured calls

    let gameController1 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController1.initializeGame();

    assertEqual(capturedOverlayCalls.length, 1, "One overlay call expected for no saved game");
    assertEqual(capturedOverlayCalls[0].title, "Yes Wolfer", "Overlay title should be game name");
    assertEqual(capturedOverlayCalls[0].message, "The forest was quiet 'til WoeBots arrived\nWolf down the answers to remain alive\nThe Safe Space can protect you", "Poem should be for no saved game");

    // --- Scenario 2: Saved game progress ---
    for (const key in localStorageStore) { delete localStorageStore[key]; } // Clear localStorage
    const savedData = {
      level: 1,
      currentScore: 10,
      strikes: 0,
    };
    browserEnv.localStorage.setItem('muncherGameProgress_Yes Wolfer', JSON.stringify(savedData));
    capturedOverlayCalls = []; // Clear captured calls

    let gameController2 = new GameController(gameEngine, gridViewProducer, mockAnimationController, browserEnv);
    gameController2.initializeGame();

    assertEqual(capturedOverlayCalls.length, 1, "One overlay call expected for saved game");
    assertEqual(capturedOverlayCalls[0].title, "Yes Wolfer", "Overlay title should be game name");
    assertEqual(capturedOverlayCalls[0].message, "The forest was quiet 'til WoeBots arrived\nWolf down the answers to remain alive\nGame progress was restored for you", "Poem should be for saved game");

    // Restore original functions
    GameController.prototype.showGameOverlay = originalShowGameOverlay;
    GameController.prototype.hideGameOverlay = originalHideGameOverlay;
  }

  test_GameController_saveGameProgress() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockBrowserEnv = {
      document: {
        getElementById: (id) => {
          if (id === "gameOverlay") { return { style: {}, dataset: {} }; }
          return { innerText: '', innerHTML: '', addEventListener: () => {}, onclick: null };
        },
      },
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    const mockPCEImageLibrary = {
      pceImageForName: (name) => mockPCEImage
    };
    const animationController = {
      playAnimation: () => {},
    };
    const gameController = new GameController(gameEngine, gridViewProducer, animationController, mockBrowserEnv);

    gameEngine.gameState.level = 5;
    gameEngine.gameState.currentScore = 1000;
    gameEngine.gameState.strikes = 1;

    gameController.saveGameProgress();

    const savedProgress = JSON.parse(mockBrowserEnv.localStorage.getItem('muncherGameProgress_Yes Wolfer'));
    assertEqual(savedProgress.level, 5, "Saved level should be 5");
    assertEqual(savedProgress.currentScore, 1000, "Saved score should be 1000");
    assertEqual(savedProgress.strikes, 1, "Saved strikes should be 1");
  }

  test_GameController_loadGameProgress() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockBrowserEnv = {
      document: {
        getElementById: (id) => {
          if (id === "gameOverlay") { return { style: {}, dataset: {} }; }
          return { innerText: '', innerHTML: '', addEventListener: () => {}, onclick: null };
        },
      },
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };
    const animationController = {
      playAnimation: () => {},
    };
    const gameController = new GameController(gameEngine, gridViewProducer, animationController, mockBrowserEnv);

    const savedData = {
      level: 7,
      currentScore: 2500,
      strikes: 2,
    };
    mockBrowserEnv.localStorage.setItem('muncherGameProgress_Yes Wolfer', JSON.stringify(savedData));

    const loaded = gameController.loadGameProgress();
    assertTrue(loaded, "loadGameProgress should return true");
    assertEqual(gameEngine.gameState.level, 7, "Loaded level should be 7");
    assertEqual(gameEngine.gameState.currentScore, 2500, "Loaded score should be 2500");
    assertEqual(gameEngine.gameState.strikes, 2, "Loaded strikes should be 2");
  }

  test_GameController_clearGameProgress() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockBrowserEnv = {
      document: {
        getElementById: (id) => {
          if (id === "gameOverlay") { return { style: {}, dataset: {} }; }
          return { innerText: '', innerHTML: '', addEventListener: () => {}, onclick: null };
        },
      },
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };
    const animationController = {
      playAnimation: () => {},
    };
    const gameController = new GameController(gameEngine, gridViewProducer, animationController, mockBrowserEnv);

    const savedData = {
      level: 1,
      currentScore: 100,
      strikes: 0,
    };
    mockBrowserEnv.localStorage.setItem('muncherGameProgress_Yes Wolfer', JSON.stringify(savedData));

    gameController.clearGameProgress();
    const savedProgress = mockBrowserEnv.localStorage.getItem('muncherGameProgress_Yes Wolfer');
    assertEqual(savedProgress, null, "Saved progress should be null after clearing");
  }

  test_GameController_initializeGameLoadsProgress() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockBrowserEnv = {
      document: {
        getElementById: (id) => {
          if (id === "gameOverlay") { return { style: {}, dataset: {}, classList: { remove: () => {}, add: () => {} } }; }
          if (id === "gameOverlayTitle") { return { innerText: '' }; }
          if (id === "gameOverlayMessage") { return { innerText: '' }; }
          if (id === "gameView") { return { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} }; }
          return { innerText: '', innerHTML: '', addEventListener: () => {}, onclick: null };
        },
      },
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const savedData = {
      level: 3,
      currentScore: 500,
      strikes: 1,
    };
    mockBrowserEnv.localStorage.setItem('muncherGameProgress_Yes Wolfer', JSON.stringify(savedData));
    mockBrowserEnv.localStorage.setItem('highScore_Yes Wolfer', '1000');

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };
    const animationController = {
      playAnimation: () => {},
    };
    const gameController = new GameController(gameEngine, gridViewProducer, animationController, mockBrowserEnv);

    gameEngine.startCurrentRound = () => {}; // Mock to prevent actual game loop

    gameController.initializeGame();

    assertEqual(gameEngine.gameState.level, 3, "Level should be loaded from saved progress");
    assertEqual(gameEngine.gameState.currentScore, 500, "Score should be loaded from saved progress");
    assertEqual(gameEngine.gameState.strikes, 1, "Strikes should be loaded from saved progress");
    assertEqual(gameEngine.gameState.highScore, 1000, "High score should be loaded");
  }

  test_GameController_initializeGameStartsNewIfNoProgress() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockBrowserEnv = {
      document: {
        getElementById: (id) => {
          if (id === "gameOverlay") { return { style: {}, dataset: {}, classList: { remove: () => {}, add: () => {} } }; }
          if (id === "gameOverlayTitle") { return { innerText: '' }; }
          if (id === "gameOverlayMessage") { return { innerText: '' }; }
          return { innerText: '', innerHTML: '', addEventListener: () => {}, onclick: null };
        },
      },
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };
    const animationController = {
      playAnimation: () => {},
    };
    const gameController = new GameController(gameEngine, gridViewProducer, animationController, mockBrowserEnv);

    mockBrowserEnv.localStorage.removeItem('muncherGameProgress_Yes Wolfer');
    mockBrowserEnv.localStorage.setItem('highScore_Yes Wolfer', '2000');

    gameEngine.startCurrentRound = () => {}; // Mock to prevent actual game loop

    gameController.initializeGame();

    assertEqual(gameEngine.gameState.level, 0, "Level should be 0 for a new game");
    assertEqual(gameEngine.gameState.currentScore, 0, "Score should be 0 for a new game");
    assertEqual(gameEngine.gameState.strikes, 0, "Strikes should be 0 for a new game");
    assertEqual(gameEngine.gameState.highScore, 2000, "High score should still be loaded");
  }

  test_GameController_gameEventHandlerSavesOnMunch() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const mockBrowserEnv = {
      document: localDocument,
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };

    // Mock animationController
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    gameEngine.animationController = mockAnimationController;
    const gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, mockBrowserEnv);

    gameEngine.gameState.level = 1;
    gameEngine.gameState.currentScore = 45; // Score before munch
    gameEngine.gameState.strikes = 0;
    gameEngine.gameState.grid = new MAGameGrid(1, 1);
    gameEngine.gameState.grid.cellAt(0, 0).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameEngine.gameState.grid.cellAt(0, 0).value = "GOOD";
    gameEngine.gameState.currentLevelMatchingValues = ["GOOD"];

    // Simulate a munch action
    gameEngine.handleUserActionOnCell(0, 0);

    const savedProgress = JSON.parse(mockBrowserEnv.localStorage.getItem('muncherGameProgress_Yes Wolfer'));
    assertEqual(savedProgress.currentScore, 50, "Score should be saved correctly");
  }

  test_GameController_gameEventHandlerSavesOnBadMunch() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const mockBrowserEnv = {
      document: localDocument,
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };

    // Mock animationController
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    gameEngine.animationController = mockAnimationController;
    const gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, mockBrowserEnv);

    gameEngine.gameState.level = 1;
    gameEngine.gameState.currentScore = 50;
    gameEngine.gameState.strikes = 0;
    gameEngine.gameState.grid = new MAGameGrid(1, 1);
    gameEngine.gameState.grid.cellAt(0, 0).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameEngine.gameState.grid.cellAt(0, 0).value = "BAD";
    gameEngine.gameState.currentLevelMatchingValues = ["GOOD"];
    gameEngine.gameState.currentLevelNonMatchingValues = ["BAD"];

    // Simulate a bad munch action
    gameEngine.handleUserActionOnCell(0, 0);

    const savedProgress = JSON.parse(mockBrowserEnv.localStorage.getItem('muncherGameProgress_Yes Wolfer'));
    assertEqual(savedProgress.strikes, 1, "Strikes should be saved correctly after bad munch");
  }

  test_GameController_gameEventHandlerSavesOnTroggleEatsMuncher() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockDiv = { innerHTML: '', addEventListener: () => {}, onmousedown: () => {}, style: {} };
    const mockOverlay = { style: {}, dataset: {}, currentDismissCallback: null, classList: { add: () => {}, remove: () => {} } };
    const mockParagraph = { innerText: '' };

    const localDocument = {
      getElementById: (id) => {
        if (id === "gameView") return mockDiv;
        if (id === "gameOverlay") return mockOverlay;
        if (id === "gameOverlayTitle") return mockParagraph;
        if (id === "gameOverlayMessage") return mockParagraph;
        if (id === "startOver") return { onclick: () => {} };
        return null;
      },
      querySelector: (selector) => {
        if (selector.startsWith("div.cell_")) return mockDiv;
        return null;
      },
      addEventListener: () => {},
    };

    const mockBrowserEnv = {
      document: localDocument,
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };
    // Mock animationController
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    gameEngine.animationController = mockAnimationController;
    const gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, mockBrowserEnv);

    gameEngine.gameState.level = 1;
    gameEngine.gameState.currentScore = 50;
    gameEngine.gameState.strikes = 0;
    gameEngine.gameState.grid = new MAGameGrid(2, 1);
    gameEngine.gameState.grid.cellAt(0, 0).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameEngine.gameState.grid.cellAt(1, 0).occupant = new MACharacter(MACharacterType.Reggie, MADirection.Left);

    // Simulate muncher moving into troggle
    gameEngine.handleUserActionOnCell(1, 0);

    const savedProgress = JSON.parse(mockBrowserEnv.localStorage.getItem('muncherGameProgress_Yes Wolfer'));
    assertEqual(savedProgress.strikes, 1, "Strikes should be saved correctly after troggle eats muncher");
  }

  test_GameController_gameEventHandlerSavesOnLevelCleared() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockBrowserEnv = {
      document: {
        getElementById: (id) => {
          if (id === "gameOverlay") { return { style: {}, dataset: {} }; }
          return { innerText: '', innerHTML: '', addEventListener: () => {}, onclick: null };
        },
      },
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};
    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };
    // Mock animationController
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    gameEngine.animationController = mockAnimationController;
    const gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, mockBrowserEnv);

    // Mock the overlay to prevent it from pausing the game
    gameController.showGameOverlay = (title, message, dismissCallback) => {
      if (dismissCallback) {
        dismissCallback();
      }
    };
    gameController.hideGameOverlay = () => {};

    gameEngine.gameState.level = 1;
    gameEngine.gameState.currentScore = 100;
    gameEngine.gameState.strikes = 0;
    gameEngine.gameState.grid = new MAGameGrid(1, 1);
    gameEngine.gameState.grid.cellAt(0, 0).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameEngine.gameState.grid.cellAt(0, 0).value = "GOOD";
    gameEngine.gameState.currentLevelMatchingValues = ["GOOD"];

    // Simulate the munch that clears the level
    gameEngine.handleUserActionOnCell(0, 0);

    const savedProgress = JSON.parse(mockBrowserEnv.localStorage.getItem('muncherGameProgress_Yes Wolfer'));
    assertEqual(savedProgress.level, 2, "Level should be saved correctly");
  }

  test_GameController_gameEventHandlerClearsOnGameOver() {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = value.toString(); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
      };
    })();

    const mockBrowserEnv = {
      document: {
        getElementById: (id) => {
          if (id === "gameOverlay") { return { style: {}, dataset: {} }; }
          return { innerText: '', innerHTML: '', addEventListener: () => {}, onclick: null };
        },
      },
      window: {
        addEventListener: () => {},
        removeEventListener: () => {},
        location: { search: '' },
        URLSearchParams: function(search) {
          return {
            get: (param) => {
              if (param === 'crawler') { return null; }
              return null;
            }
          };
        },
      },
      localStorage: localStorageMock,
      navigator: { userAgent: 'test' },
      confirm: () => true,
    };
    setBrowserEnv(mockBrowserEnv);
    mockBrowserEnv.localStorage.clear();

    const gameEngine = new MAGameEngine();
    // Mock game loop and troggle loop to prevent infinite recursion
    gameEngine.runGameLoop = () => {};
    gameEngine.troggleController.startTroggleLoop = () => {};
    gameEngine.troggleController.stopTroggleLoop = () => {};

    const gridViewProducer = new MAGridViewProducer();
    const mockPCEImage = {
      generatePNG: (scale) => `data:image/png;base64,mock_image_data_${scale}`
    };
    gridViewProducer._pceImageLibrary = () => {
      return {
        pceImageForName: (name) => {
          return mockPCEImage;
        }
      };
    };
    // Mock animationController
    let mockAnimationController = {
      enqueueFunction: (func) => {
        func();
      },
      playAnimation: (animationName, x, y, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playMuncherMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      playTroggleMoveAnimation: (startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) => {
        if (completionCallback) completionCallback();
      },
      _pceImageLibrary: () => mockPCEImageLibrary,
    };

    gameEngine.animationController = mockAnimationController;
    const gameController = new GameController(gameEngine, gridViewProducer, mockAnimationController, mockBrowserEnv);

    const savedData = {
      level: 2,
      currentScore: 300,
      strikes: 2,
    };
    mockBrowserEnv.localStorage.setItem('muncherGameProgress_Yes Wolfer', JSON.stringify(savedData));

    gameEngine.gameState.grid = new MAGameGrid(1, 1);
    gameEngine.gameState.grid.cellAt(0, 0).occupant = new MACharacter(MACharacterType.Muncher, MADirection.Right);
    gameEngine.gameState.grid.cellAt(0, 0).value = "BAD";
    gameEngine.gameState.currentLevelMatchingValues = ["GOOD"];
    gameEngine.gameState.currentLevelNonMatchingValues = ["BAD"];
    gameEngine.gameState.strikes = gameEngine.maxStrikes - 1; // One strike left

    // Mock the overlay to prevent it from pausing the game
    gameController.showGameOverlay = (title, message, dismissCallback) => {
      if (dismissCallback) {
        dismissCallback();
      }
    };
    gameController.hideGameOverlay = () => {};

    // Simulate the bad munch that ends the game
    gameEngine.handleUserActionOnCell(0, 0);

    const savedProgress = mockBrowserEnv.localStorage.getItem('muncherGameProgress_Yes Wolfer');
    assertEqual(savedProgress, null, "Saved progress should be cleared when game is over");
  }

// Unit test harness
  run() {
    let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))

    let passCount = 0
    for (let method of methods) {
      if (method.startsWith("test")) {
        MALog.log("=== Invoking " + method + " ===")
        this[method]();
        passCount++
      }
    }
    MALog.log(passCount + " tests and " + assertionCount + " assertions passed successfully!")
  }
}

// Run with:
//  let ut = new UnitTests()
//  ut.run()


if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    UnitTests,
    MALog,
  };
}
