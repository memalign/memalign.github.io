if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ SoundEffects } = require('../src/SoundEffects.js'));
  ({ GameState } = require('../src/GameState.js'));
  ({ UIManager } = require('../src/UIManager.js'));
  ({ GameCharacter } = require('../src/GameCharacter.js'));
  ({ maDocument } = require('../src/MADocument.js'));
  ({ Tuning } = require('../src/Tuning.js'));
  ({ pLog } = require('../src/Utilities.js'));

  zzfx = null;
}

class UnitTests_Sound {
  test_music_toggle_probes() {
    const se = new SoundEffects();

    // Simulate what happens in main.js for toggle
    se.setMusicEnabled(true);
    pLog.log(91);
    assertTrue(pLog.probeLog.has(91), "Should log probe 91");

    se.setMusicEnabled(false);
    pLog.log(92);
    assertTrue(pLog.probeLog.has(92), "Should log probe 92");
    assertTrue(!se.musicEnabled, "Music should be disabled");
  }

  test_sound_effects_toggle_controls_playback() {
    const se = new SoundEffects();
    let sourceStartCount = 0;

    let oldZzfx = zzfx;
    let zzfxCount = 0;

    zzfx = () => { zzfxCount++; };
    se.setAudioContext({
      state: 'running',
      createBufferSource: () => ({
        connect: () => {},
        start: () => { sourceStartCount++; }
      }),
      destination: {}
    });
    se.soundEffects.harvest = "dummy-buffer";

    se.setSoundEffectsEnabled(false);
    se.playSound("harvest");
    se.playZzFX([1, 2, 3]);
    assertEqual(sourceStartCount, 0);
    assertEqual(zzfxCount, 0);

    se.setSoundEffectsEnabled(true);
    se.playSound("harvest");
    se.playZzFX([1, 2, 3]);
    assertEqual(sourceStartCount, 1);
    assertEqual(zzfxCount, 1);

    zzfx = oldZzfx;
  }

  test_endgame_music_mode_fades_and_suppresses_song_requests() {
    const se = new SoundEffects();
    let scheduledDelay = null;
    let scheduledCallback = null;
    let rampTarget = null;
    let stopTime = null;
    let sourceStartCount = 0;
    let endedHandler = null;

    se.setScheduler((callback, delay) => {
      scheduledCallback = callback;
      scheduledDelay = delay;
    });
    se.setAudioContext({
      currentTime: 10,
      state: 'running',
      createBufferSource: () => ({
        connect: () => {},
        start: () => { sourceStartCount++; },
        addEventListener: () => {}
      }),
      createGain: () => ({
        connect: () => {},
        gain: { value: 1.0 }
      }),
      destination: {}
    });
    se.currentPlayingSong = {
      stop: (time) => { stopTime = time; },
      addEventListener: (name, handler) => {
        if (name === 'ended') {
          endedHandler = handler;
        }
      }
    };
    se.currentPlayingSongGainNode = {
      gain: {
        value: 0.5,
        cancelScheduledValues: () => {},
        setValueAtTime: () => {},
        linearRampToValueAtTime: (value, time) => { rampTarget = { value, time }; }
      }
    };
    se.soundEffects["song.mp3"] = "dummy-buffer";

    let fadeCompleteCount = 0;
    se.enterEndGameMusicMode(() => { fadeCompleteCount++; });

    assertTrue(pLog.probeLog.has(121), "Should log probe 121 when entering endgame music mode");
    assertTrue(pLog.probeLog.has(122), "Should log probe 122 when scheduling delayed fade completion");
    assertTrue(se.songPlaybackSuppressed, "Endgame music mode should suppress future song playback");
    assertEqual(scheduledDelay, Tuning.ENDGAME_MUSIC_FADE_OUT_MS + 50);
    assertEqual(rampTarget.value, 0);
    assertEqual(rampTarget.time, 10 + (Tuning.ENDGAME_MUSIC_FADE_OUT_MS / 1000));
    assertEqual(stopTime, 10 + (Tuning.ENDGAME_MUSIC_FADE_OUT_MS / 1000));
    assertEqual(fadeCompleteCount, 0);

    se.requestSong();
    assertTrue(pLog.probeLog.has(124), "Should log probe 124 when suppressed song playback is requested");
    assertEqual(sourceStartCount, 0);

    endedHandler();
    assertEqual(fadeCompleteCount, 1);

    scheduledCallback();
    assertEqual(fadeCompleteCount, 1);
  }

  test_endgame_music_mode_without_active_song_calls_back_immediately() {
    const se = new SoundEffects();
    let callbackCount = 0;

    se.enterEndGameMusicMode(() => { callbackCount++; });

    assertTrue(pLog.probeLog.has(121), "Should log probe 121 when entering endgame music mode without active song");
    assertTrue(pLog.probeLog.has(123), "Should log probe 123 when no fade delay is needed");
    assertEqual(callbackCount, 1);
  }

  test_ui_action_sound_triggers() {
    const gs = new GameState();
    const playedNames = [];
    const playedZzFx = [];
    const ui = new UIManager(gs, {
      requestSong: () => {},
      playSound: (name) => { playedNames.push(name); },
      playZzFX: (params) => { playedZzFx.push(params); }
    });

    let shipX = 0, shipY = 0;
    for (let y = 0; y < gs.gridSize; y++) {
      for (let x = 0; x < gs.gridSize; x++) {
        if (gs.grid.getCell(x, y).item === "Space Ship") {
          shipX = x;
          shipY = y;
          break;
        }
      }
    }

    const revealX = shipX + 1;
    const revealY = shipY;
    gs.grid.getCell(revealX, revealY).revealed = false;
    ui.handleCellClick(revealX, revealY);
    assertEqual(playedZzFx.length, 1);

    const recruitX = shipX;
    const recruitY = shipY + 1;
    const recruitCell = gs.grid.getCell(recruitX, recruitY);
    recruitCell.reveal();
    recruitCell.character = new GameCharacter("GrassAnimal");
    ui.handleCellClick(recruitX, recruitY);
    assertTrue(playedNames.includes("recruitAnimal"), "Recruiting should play recruitAnimal");

    const gatherX = shipX;
    const gatherY = shipY + 2;
    const gatherCell = gs.grid.getCell(gatherX, gatherY);
    gatherCell.reveal();
    gatherCell.character = null;
    gatherCell.setItem("tree");
    ui.handleCellClick(gatherX, gatherY);
    assertTrue(playedNames.includes("harvest"), "Gathering wood should play harvest");

    const oreX = shipX;
    const oreY = shipY + 3;
    const oreCell = gs.grid.getCell(oreX, oreY);
    oreCell.reveal();
    oreCell.character = null;
    oreCell.setItem("ore");
    ui.handleCellClick(oreX, oreY);
    assertTrue(playedNames.includes("mineOre"), "Gathering ore should play mineOre");

    const plantX = shipX + 1;
    const plantY = shipY + 1;
    const plantCell = gs.grid.getCell(plantX, plantY);
    plantCell.reveal();
    plantCell.character = null;
    plantCell.item = null;
    plantCell.landType = "grass";
    gs.inventory.addItem("seed");
    ui.handleCellClick(plantX, plantY);
    assertEqual(playedZzFx.length, 2);

    const feedX = shipX + 1;
    const feedY = shipY + 2;
    const feedCell = gs.grid.getCell(feedX, feedY);
    feedCell.reveal();
    feedCell.item = null;
    feedCell.character = new GameCharacter("GrassAnimal");
    feedCell.character.owned = true;
    feedCell.character.isHungry = true;
    gs.inventory.addItem("carrot");
    ui.handleCellClick(feedX, feedY);
    assertEqual(playedZzFx.length, 3);

    const buildX = shipX + 1;
    const buildY = shipY + 3;
    const buildCell = gs.grid.getCell(buildX, buildY);
    buildCell.reveal();
    buildCell.item = null;
    buildCell.character = null;
    buildCell.landType = "grass";
    for (let i = 0; i < 20; i++) {
      gs.inventory.addItem("wood");
    }
    ui.handleCellClick(buildX, buildY);
    assertEqual(playedZzFx.length, 4);

    gs.state.researchCenterBuilt = true;
    gs.state.researchLevel = 0;
    const researchBtn = maDocument.createElement("div");
    researchBtn.classList.add("research-tier-mission");
    researchBtn._lvl = 1;
    for (let i = 0; i < 50; i++) {
      gs.inventory.addItem("wood");
      gs.inventory.addItem("carrot");
    }
    ui.handleMissionClick(researchBtn);
    assertTrue(playedNames.includes("researchUpgrade"), "Research should play researchUpgrade");
  }
}

{
  const thisClass = UnitTests_Sound;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
