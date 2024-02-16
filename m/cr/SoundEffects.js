class MASounds {
  constructor() {
    this.soundEffects = {}
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

    this.songNames = [
      "sounds/song.mp3",
    ]

    this.currentPlayingSong = null
    this.currentPlayingSongGainNode = null
    this.nextSongIndex = MAUtils.randomInt(this.songNames.length)
  }

  fetch(url, soundName) {
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
    this.fetch("sounds/bloop.mp3", "bloop")
    this.fetch("sounds/shatter.mp3", "shatter")

    for (let songName of this.songNames) {
      this.fetch(songName, songName)
    }
  }

  fadeOut() {
    if (this.currentPlayingSong) {
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
    if (this.soundEffects[name]) {
      const source = this.audioContext.createBufferSource()
      source.buffer = this.soundEffects[name]
      source.connect(this.audioContext.destination)
      source.start()
    }
  }

  // Will start playing the next song if a song is not already playing
  requestSong() {
    if (this.currentPlayingSong) { return }

    let songName = this.songNames[this.nextSongIndex]

    if (!this.soundEffects[songName]) { return }

    const source = this.audioContext.createBufferSource()
    this.currentPlayingSong = source
    this.currentPlayingSongGainNode = this.audioContext.createGain()

    // GainNode lets us create a fadeOut when stopping the song
    source.connect(this.currentPlayingSongGainNode)
    this.currentPlayingSongGainNode.connect(this.audioContext.destination)

    this.currentPlayingSongGainNode.gain.value = 1.0

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
