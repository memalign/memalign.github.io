class MASounds {
  // soundEffects:
  // type - typing sound
  // drip - drip sound
  constructor() {
    this.soundEffects = {}
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

    this.songNames = [
      "songs/06-Meydan-LEtoile-danse-Pt.-1.mp3",
      "songs/Kimiko_Ishizaka_-_05_-_Variatio_4_a_1_Clav.mp3",
      "songs/Funny-Bubbles-Happy-Classical-Music.mp3",
      "songs/Kimiko_Ishizaka_-_07_-_Variatio_6_a_1_Clav_Canone_alla_Seconda.mp3",
      "songs/Orchestral-Suite-no.-2-in-B-minor-BWV-1067-7.-Badinerie.mp3",
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
    this.fetch("type.mp3", "type")
    this.fetch("drip.mp3", "drip")

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
