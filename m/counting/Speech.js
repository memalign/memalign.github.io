
let checkedPreferredVoice = false
let cachedPreferredVoice = null
function preferredVoice() {
  if (checkedPreferredVoice) {
    return cachedPreferredVoice
  }

  checkedPreferredVoice = true

  const voices = window.speechSynthesis.getVoices()

  const prefs = [ "Samantha (en-US)" ]

  for (let pref of prefs) {
    cachedPreferredVoice = voices.find(v => pref === `${v.name} (${v.lang})`)
    if (cachedPreferredVoice) {
      return cachedPreferredVoice
    }
  }

  // Uncomment this to pick the first voice explicitly rather than relying
  // on SpeechSynthesis to pick a voice for the language.
  //cachedPreferredVoice = voices.find(v => v.lang === "en-US")

  return cachedPreferredVoice
}

function maSpeak(str) {
  str = str + ""
  const utterance = new SpeechSynthesisUtterance(str)

  const pv = preferredVoice()
  if (pv) {
    utterance.voice = pv
  }
  utterance.lang = "en-US"

  utterance.volume = 0.3
  utterance.pitch = 1
  let rate = 0
  utterance.rate = Math.pow(Math.abs(rate) + 1, rate < 0 ? -1 : 1);
  speechSynthesis.speak(utterance);
}
