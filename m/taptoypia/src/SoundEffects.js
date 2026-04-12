if (typeof module !== 'undefined' && module.exports) {
  ({ pLog } = require('./Utilities.js'));
}

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
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  setAudioContext(ctx) {
    this.audioContext = ctx;
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
  // TODO: Load the right effects
    //this.fetch("rocksound.mp3", "rockCatch")

    for (let songName of this.songNames) {
      this.fetch(songName, songName)
    }
  }

  fadeOut() {
    if (this.currentPlayingSong && this.audioContext) {
      let currentTime = this.audioContext.currentTime

      let fadeDuration = 4
      this.currentPlayingSongGainNode.gain.linearRampToValueAtTime(0, currentTime + fadeDuration)

      this.currentPlayingSong.stop(currentTime + fadeDuration)
    }
  }

  stop() {
    if (this.currentPlayingSong) {
      this.currentPlayingSong.stop()
      this.currentPlayingSong = null
      this.currentPlayingSongGainNode = null
    }
  }

  playSound(name) {
    if (!this.audioContext) { return }
    if (this.audioContext.state === 'suspended') { this.audioContext.resume() }
    if (this.soundEffects[name]) {
      const source = this.audioContext.createBufferSource()
      source.buffer = this.soundEffects[name]
      source.connect(this.audioContext.destination)
      source.start()
    }
  }

  // Will start playing the next song if a song is not already playing
  requestSong() {
    pLog.log(82)
    if (!this.musicEnabled) { return }
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
  module.exports = { SoundEffects };
}
