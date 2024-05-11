class MASounds {
  constructor() {
    this.soundEffects = {}
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

    this.songNames = [
      "songs/italianpolka.mp3",
    ]

    this.currentPlayingSong = null
    this.nextSongIndex = MAUtils.randomInt(this.songNames.length)

    // WebKit only lets you play audio via direct user input
    // and will silently play nothing otherwise.
    // mousedown and touchstart seem to count as direct user input.
    // Wait to "play" sound effects or song until we have started audio
    // playback via direct user input first. Otherwise, we'll end up in
    // a state where we think a song is playing but it's inaudible.
    this.hasPlayedAudio = false
  }

  fetch(url, soundName) {
    let me = this
    // setTimeout can be used to test slow loading
//  setTimeout(() => {
//    console.log("performing fetch: "+ url)
    window.fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => me.audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        let typeSoundBuffer = audioBuffer
        me.soundEffects[soundName] = typeSoundBuffer
      })
      .catch(error => console.error('Error loading audio file:', error))
//  }, 5000)
  }

  loadSounds() {
    this.fetch("slice.mp3", "slice")
    this.fetch("whoosh.mp3", "whoosh")
    this.fetch("tada.mp3", "tada")

    for (let songName of this.songNames) {
      this.fetch(songName, songName)
    }
  }

  playSlice() {
    let now = performance.now()

    // Don't play slice sound effect multiple overlapping times because
    // that sounds unnatural
    if (this.lastSliceTimestampMS) {
      let timeSinceLastSliceMS = now - this.lastSliceTimestampMS

      if (timeSinceLastSliceMS < 100) {
        return
      }
    }


    if (this.lastSliceGainNode) {
      let fadeDuration = 0.01 // seconds
      this.lastSliceGainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeDuration)
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = this.soundEffects["slice"]

    const gainNode = this.audioContext.createGain()
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    this.lastSliceGainNode = gainNode

    source.start()

    this.lastSliceTimestampMS = performance.now()
  }

  playSound(name) {
    if (!this.hasPlayedAudio) { return }

    if (name == "slice") {
      this.playSlice()
      return
    }

    if (this.soundEffects[name]) {
      // console.log("playing effect " + name)
      const source = this.audioContext.createBufferSource()
      source.buffer = this.soundEffects[name]

      source.connect(this.audioContext.destination)

      source.start()
    }
  }

  stop() {
    if (this.currentPlayingSong) {
      this.currentPlayingSong.stop()
    }
  }

  // Will start playing the next song if a song is not already playing
  requestSong(isFromDirectUserInput) {
    if (this.currentPlayingSong) { return }

    if (!isFromDirectUserInput && !this.hasPlayedAudio) { return }

    let songName = this.songNames[this.nextSongIndex]

    if (!this.soundEffects[songName]) { return }

    // console.log("SONG IS STARTING")

    const source = this.audioContext.createBufferSource()
    this.currentPlayingSong = source

    let se = this
    source.addEventListener('ended', () => { se.currentPlayingSong = null })

    source.buffer = this.soundEffects[songName]
    source.connect(this.audioContext.destination)
    source.start()

    this.hasPlayedAudio = true

    this.nextSongIndex = Math.floor((this.nextSongIndex + 1) % this.songNames.length)
  }
}
