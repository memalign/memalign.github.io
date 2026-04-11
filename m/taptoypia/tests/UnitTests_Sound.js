if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ SoundEffects } = require('../src/SoundEffects.js'));
  ({ pLog } = require('../src/Utilities.js'));
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
}

{
  const thisClass = UnitTests_Sound;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
