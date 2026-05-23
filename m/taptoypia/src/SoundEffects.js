if (typeof module !== 'undefined' && module.exports) {
  ({ Tuning } = require('./Tuning.js'));
  ({ pLog } = require('./Utilities.js'));
}

const zzSoundEffects = {
  reveal: [10,.7,50,.005,,.01,4,,,,,,,,10,,,.5],
  plantSeed: [10,,150,.05,,.05,,1.3,,,,,,3],
  feedAnimal_alt: [10,,15,.1,.01,.04,,.45,,,,,,,,,,.91,.01,,332],
  feedAnimal: [10,,520,.01,.03,.08,1,.8,7,,244,.08,.2,,28,,,.82,.04,.5,-1442],
  build: [10,,700,,,.07,,,,3.7,,,,3,,,.1],
};

class SoundEffects {
  constructor() {
    this.soundEffects = {}
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } else {
      this.audioContext = null
    }

    this.songNames = [
      "song.mp3",
    ]

    this.currentPlayingSong = null
    this.currentPlayingSongGainNode = null
    this.nextSongIndex = Math.floor(Math.random() * this.songNames.length)
    this.musicEnabled = true
    this.soundEffectsEnabled = true
    this.songPlaybackSuppressed = false
    this.scheduler = (typeof setTimeout === 'function') ? setTimeout : null
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  setSoundEffectsEnabled(enabled) {
    this.soundEffectsEnabled = enabled
  }

  setAudioContext(ctx) {
    this.audioContext = ctx;
  }

  setScheduler(schedulerFn) {
    this.scheduler = schedulerFn;
  }

  fetch(url, soundName) {
    if (!this.audioContext) { return }
    let me = this
    window.fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => me.audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        let typeSoundBuffer = audioBuffer
        me.soundEffects[soundName] = typeSoundBuffer
      })
  }

  loadSounds() {
    this.fetch("sounds/book_close.mp3", "harvest")
    this.fetch("sounds/gem_collect.mp3", "researchUpgrade")
    this.fetch("sounds/steel_drums_chime_quick.mp3", "recruitAnimal")
    this.fetch("sounds/xylophone_inn.mp3", "settlersArrive")
    this.fetch("sounds/xylophone_mystery.mp3", "inviteSettlers")
    this.fetch("sounds/pencil_eraser.mp3", "animalHungry")
    this.fetch("sounds/pottery_clang.mp3", "mineOre")
    this.fetch("sounds/vibraphone_level_complete.mp3", "gameOver")
    this.fetch("sounds/vibraphone_defeated.mp3", "settlersUnhappy")

    for (let songName of this.songNames) {
      this.fetch(songName, songName)
    }
  }

  fadeOut() {
    if (this.currentPlayingSong && this.audioContext) {
      let currentTime = this.audioContext.currentTime

      let fadeDuration = (((typeof Tuning !== 'undefined' && Tuning.ENDGAME_MUSIC_FADE_OUT_MS) || 2000) / 1000)
      if (this.currentPlayingSongGainNode && this.currentPlayingSongGainNode.gain) {
        if (this.currentPlayingSongGainNode.gain.cancelScheduledValues) {
          this.currentPlayingSongGainNode.gain.cancelScheduledValues(currentTime)
        }
        if (this.currentPlayingSongGainNode.gain.setValueAtTime) {
          this.currentPlayingSongGainNode.gain.setValueAtTime(this.currentPlayingSongGainNode.gain.value, currentTime)
        }
      }
      this.currentPlayingSongGainNode.gain.linearRampToValueAtTime(0, currentTime + fadeDuration)

      this.currentPlayingSong.stop(currentTime + fadeDuration)
    }
  }

  enterEndGameMusicMode(onFadeComplete = null) {
    this.songPlaybackSuppressed = true
    pLog.log(121)

    const callback = typeof onFadeComplete === 'function' ? onFadeComplete : null
    const hasActiveSong = !!(this.currentPlayingSong && this.audioContext)
    if (hasActiveSong) {
      const fadingSong = this.currentPlayingSong
      let callbackFired = false
      const runCallbackOnce = () => {
        if (callbackFired || !callback) {
          return
        }
        callbackFired = true
        callback()
      }

      if (callback && fadingSong.addEventListener) {
        fadingSong.addEventListener('ended', runCallbackOnce, { once: true })
      }
      this.fadeOut()
      if (callback && this.scheduler) {
        pLog.log(122)
        this.scheduler(runCallbackOnce, ((typeof Tuning !== 'undefined' && Tuning.ENDGAME_MUSIC_FADE_OUT_MS) || 2000) + 50)
      }
      return
    }

    if (!callback) {
      return
    }

    pLog.log(123)
    callback()
  }

  stop() {
    if (this.currentPlayingSong) {
      this.currentPlayingSong.stop()
      this.currentPlayingSong = null
      this.currentPlayingSongGainNode = null
    }
  }

  playSound(name) {
    if (!this.soundEffectsEnabled) { return }
    if (!this.audioContext) { return }
    if (this.audioContext.state === 'suspended') { this.audioContext.resume() }
    if (this.soundEffects[name]) {
      const source = this.audioContext.createBufferSource()
      source.buffer = this.soundEffects[name]
      source.connect(this.audioContext.destination)
      source.start()
    }
  }

  playZzFX(soundParameters) {
    if (!this.soundEffectsEnabled) { return }
    if (zzfx) {
      zzfx(...soundParameters)
    }
  }

  // Will start playing the next song if a song is not already playing
  requestSong() {
    pLog.log(82)
    if (!this.musicEnabled) { return }
    if (this.songPlaybackSuppressed) {
      pLog.log(124)
      return
    }
    if (!this.audioContext) { return }
    if (this.audioContext.state === 'suspended') { this.audioContext.resume() }
    if (this.currentPlayingSong) { return }
    let songName = this.songNames[this.nextSongIndex]

    if (!this.soundEffects[songName]) { return }

    pLog.log(83)
    const source = this.audioContext.createBufferSource()
    this.currentPlayingSong = source
    this.currentPlayingSongGainNode = this.audioContext.createGain()

    // GainNode lets us create a fadeOut when stopping the song
    source.connect(this.currentPlayingSongGainNode)
    this.currentPlayingSongGainNode.connect(this.audioContext.destination)

    // Use a value < 1.0 to reduce volume
    this.currentPlayingSongGainNode.gain.value = 0.5

    let se = this
    source.addEventListener('ended', function() {
      se.currentPlayingSong = null
      se.currentPlayingSongGainNode = null
    })

    source.buffer = this.soundEffects[songName]
    source.start()

    this.nextSongIndex = Math.floor((this.nextSongIndex + 1) % this.songNames.length)
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SoundEffects,
    zzSoundEffects,
  };
}
