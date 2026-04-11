if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue, assertNotNull } = require('./UnitTests'));
  ({ GameState } = require('../src/GameState.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
  ({ maDocument } = require('../src/MADocument.js'));
  ({ pLog } = require('../src/Utilities.js'));
}

class UnitTests_Story {
  test_story_triggers() {
    const gs = new GameState();
    const ui = new UIManager(gs);
    const messages = [];
    ui.addStoryMessage = (msg) => { messages.push(msg); };

    // Intro
    gs.triggerStory("intro", ui);
    assertEqual(messages.length, 1);
    assertTrue(messages[0].includes("Welcome to the unexplored planet"));
    assertTrue(gs.state.story.introShown);

    // Carrots
    gs.triggerStory("carrot", ui);
    assertEqual(gs.state.story.carrotsGathered, 1);
    assertEqual(gs.state.survivalOdds, 1);
    assertTrue(messages[1].includes("survival odds have increased to 1%"));

    // Wood
    gs.triggerStory("wood", ui);
    assertEqual(gs.state.story.woodGathered, 1);
    assertEqual(gs.state.survivalOdds, 6); // 1 + 5
    assertTrue(messages[2].includes("abundance of natural resources"));

    // House
    gs.triggerStory("house", ui);
    assertEqual(gs.state.story.housesBuilt, 1);
    assertEqual(gs.state.survivalOdds, 10); // 6 + 4
    assertTrue(messages[3].includes("starting to feel like home"));

    // Animal
    gs.triggerStory("animal", ui);
    assertEqual(gs.state.story.animalsRecruited, 1);
    assertEqual(gs.state.survivalOdds, 15); // 10 + 5
    assertTrue(messages[4].includes("Even the fauna"));

    // Ore
    gs.triggerStory("ore", ui);
    assertEqual(gs.state.story.oreGathered, 1);
    assertEqual(gs.state.survivalOdds, 21); // 15 + 6
    assertTrue(messages[5].includes("struck ore"));

    // Tower
    gs.triggerStory("tower", ui);
    assertTrue(gs.state.story.commTowerBuilt);
    assertEqual(gs.state.survivalOdds, 31); // 21 + 10
    assertTrue(messages[6].includes("Lifeline established"));

    // Victory
    gs.triggerStory("victory", ui);
    assertTrue(gs.state.story.settlersArrived);
    assertEqual(gs.state.survivalOdds, 2);
    assertEqual(gs.state.endGameTimer, 8000);
    assertTrue(messages[7].includes("Humanity now has a second home"));
    assertTrue(pLog.probeLog.has(93), "Should log probe 93 (victory claim)");
  }

  test_survival_odds_limits() {
    const gs = new GameState();
    const ui = { addStoryMessage: () => {} };

    // 10 carrots -> 10%
    for (let i = 0; i < 15; i++) gs.triggerStory("carrot", ui);
    assertEqual(gs.state.story.carrotsGathered, 10);
    assertEqual(gs.state.survivalOdds, 10);

    // 3 wood -> +15% = 25%
    for (let i = 0; i < 5; i++) gs.triggerStory("wood", ui);
    assertEqual(gs.state.story.woodGathered, 3);
    assertEqual(gs.state.survivalOdds, 25);

    // 5 houses -> +20% = 45%
    for (let i = 0; i < 10; i++) gs.triggerStory("house", ui);
    assertEqual(gs.state.story.housesBuilt, 5);
    assertEqual(gs.state.survivalOdds, 45);

    // 2 animals -> +10% = 55%
    for (let i = 0; i < 5; i++) gs.triggerStory("animal", ui);
    assertEqual(gs.state.story.animalsRecruited, 2);
    assertEqual(gs.state.survivalOdds, 55);

    // 2 ore -> +12% = 67%
    for (let i = 0; i < 5; i++) gs.triggerStory("ore", ui);
    assertEqual(gs.state.story.oreGathered, 2);
    assertEqual(gs.state.survivalOdds, 67);

    // 1 tower -> +10% = 77%
    for (let i = 0; i < 2; i++) gs.triggerStory("tower", ui);
    assertTrue(gs.state.story.commTowerBuilt);
    assertEqual(gs.state.survivalOdds, 77);

    // Victory -> resets to 2%
    gs.triggerStory("victory", ui);
    assertEqual(gs.state.survivalOdds, 2);
  }

  test_end_game_timer_and_overlay() {
    if (typeof module !== 'undefined' && module.exports) {
        ({ GameEngine } = require('../src/GameEngine.js'));
    }
    const gs = new GameState();
    const ui = new UIManager(gs);
    const engine = new GameEngine(gs, ui);
    
    gs.state.endGameTimer = 100;
    engine.update(100);
    
    assertEqual(gs.state.endGameTimer, null);
    assertTrue(gs.state.gameEnded);
    assertTrue(pLog.probeLog.has(96), "Should log probe 96 (engine end game)");
    assertTrue(pLog.probeLog.has(97), "Should log probe 97 (ui show end game)");
  }
}

{
  const thisClass = UnitTests_Story;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
