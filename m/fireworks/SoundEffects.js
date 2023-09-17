class MASounds {
  // soundEffects:
  // type - typing sound
  // drip - drip sound
  constructor() {
    this.soundEffects = {}
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

    this.songNames = [
      "songs/March,_ 22The_Stars_and_Stripes_Forever 22_·_Colonel_John_R._Bourgeois,_Director_·_John_Philip_Sousa_·_United_States_Marine_Band.mp3",
    ]

    this.isPlayingSong = false
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
    this.fetch("explosion0.mp3", "explosion0")
    this.fetch("explosion1.mp3", "explosion1")
    this.fetch("explosion2.mp3", "explosion2")

    for (let songName of this.songNames) {
      this.fetch(songName, songName)
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
    if (this.isPlayingSong) { return }

    let songName = this.songNames[this.nextSongIndex]

    if (!this.soundEffects[songName]) { return }

    this.isPlayingSong = true

    const source = this.audioContext.createBufferSource()

    source.addEventListener('ended', () => { this.isPlayingSong = false })

    source.buffer = this.soundEffects[songName]
    source.connect(this.audioContext.destination)
    source.start()

    this.nextSongIndex = Math.floor((this.nextSongIndex + 1) % this.songNames.length)
  }
}
