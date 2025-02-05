let lastTouchEnd = 0;
document.addEventListener("touchend", (event) => {
  if (event.target.tagName !== "BUTTON") {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault(); // Prevent double-tap zoom
    }
    lastTouchEnd = now;
  }
}, { passive: false });


// Load settings from local storage or set defaults
const settings = JSON.parse(localStorage.getItem("flashcardSettings")) || {
  showPicture: true,
  showPinyin: false,
  showChinese: false,
  showEnglish: false,
  showSpeak: false
};

// Get elements
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const saveSettingsBtn = document.getElementById("save-settings");
const resetProgressBtn = document.getElementById("reset-progress");

// Checkboxes
const showPictureCheckbox = document.getElementById("show-picture");
const showPinyinCheckbox = document.getElementById("show-pinyin");
const showChineseCheckbox = document.getElementById("show-chinese");
const showEnglishCheckbox = document.getElementById("show-english");
const showSpeakCheckbox = document.getElementById("show-speak");

// Apply saved settings to checkboxes
showPictureCheckbox.checked = settings.showPicture;
showPinyinCheckbox.checked = settings.showPinyin;
showChineseCheckbox.checked = settings.showChinese;
showEnglishCheckbox.checked = settings.showEnglish;
showSpeakCheckbox.checked = settings.showSpeak;

function updateVisibility(elements, condition) {
  elements.forEach(element => {
    if (condition) {
      element.classList.remove("invisible")
    } else {
      element.classList.add("invisible")
    }
  });
}

// Function to save settings
function saveSettings() {
  settings.showPicture = showPictureCheckbox.checked;
  settings.showPinyin = showPinyinCheckbox.checked;
  settings.showChinese = showChineseCheckbox.checked;
  settings.showEnglish = showEnglishCheckbox.checked;
  settings.showSpeak = showSpeakCheckbox.checked;

  localStorage.setItem("flashcardSettings", JSON.stringify(settings));
  settingsPanel.classList.add("hidden"); // Hide settings panel

  updateVisibility(document.querySelectorAll(".image"), settings.showPicture)
  updateVisibility(document.querySelectorAll(".pinyin"), settings.showPinyin)
  updateVisibility(document.querySelectorAll(".chinese"), settings.showChinese)
  updateVisibility(document.querySelectorAll(".english"), settings.showEnglish)
  updateVisibility(document.querySelectorAll(".speakButton"), settings.showSpeak)

  const allShowing = settings.showPicture &&
                     settings.showChinese &&
                     settings.showPinyin &&
                     settings.showEnglish &&
                     settings.showSpeak
  const shouldHideTapToReveal = settings.showSpeak || allShowing
  updateVisibility(document.querySelectorAll(".tapToReveal"), !shouldHideTapToReveal)
}

// Show/hide settings panel
settingsBtn.addEventListener("click", (event) => {
  event.stopPropagation() // otherwise the "click anywhere on the document" event handler will immediately dismiss settings panel

  if (settingsPanel.classList.contains("hidden")) {

    const stats = calculateStats(reviewData)

    const easyStatsEl = document.getElementById("easyStats")
    easyStatsEl.innerText = `${stats.count5} / ${wordList.length} = ${ (stats.count5 * 100 / wordList.length).toFixed(1) }% easy`

    const slowStatsEl = document.getElementById("slowStats")
    slowStatsEl.innerText = `${stats.count3} / ${wordList.length} = ${ (stats.count3 * 100 / wordList.length).toFixed(1) }% slow`

    const dontKnowStatsEl = document.getElementById("dontKnowStats")
    dontKnowStatsEl.innerText = `${stats.count0} / ${wordList.length} = ${ (stats.count0 * 100 / wordList.length).toFixed(1) }% don't know`

    const reviewCountEl = document.getElementById("reviewCount");
    reviewCountEl.innerText = `${cardReviewCount} card${cardReviewCount === 1 ? "" : "s"} reviewed`

    settingsPanel.classList.remove("hidden")
  } else {
    saveSettings()
  }
});
saveSettingsBtn.addEventListener("click", saveSettings);

document.addEventListener("click", function (event) {
  // Already hidden; do nothing
  if (settingsPanel.classList.contains("hidden")) {
    return
  }

  // Check if the click was outside the panel
  if (!settingsPanel.contains(event.target)) {
    saveSettings();
  }
});


function calculateStats(reviewData) {
  let total = 0;
  let count0 = 0, count3 = 0, count5 = 0, notReviewed = 0;

  for (const [key, wordData] of Object.entries(reviewData)) {
    total++

    if (wordData.lastReview === undefined) {
      notReviewed++
    } else if (wordData.lastReview === 0) {
      count0++
    } else if (wordData.lastReview === 3) {
      count3++
    } else if (wordData.lastReview === 5) {
      count5++
    }
  }

  return { total, count0, count3, count5, notReviewed };
}


function resetProgress() {
  let resetStorage = confirm("Reset Progress? All learning progress will be lost.")

  if (resetStorage) {
    window.localStorage.removeItem('reviewCount')
    window.localStorage.removeItem('reviewData')
    location.reload()
    return true
  } else {
    return false
  }
}
resetProgressBtn.addEventListener("click", resetProgress);

const frame = document.body.querySelector('.frame')

// For easy testing
/*
const smallData = {
  food: {
    label: "Food",
    pinyinLabel: "Shíwù",
    chinese: "食物",
    words: [
      { word: "苹果", pinyin: "Píngguǒ", image: "🍎", english: "Apple" },
      { word: "面条", pinyin: "Miàntiáo", imageURL: "img/noodles.png", english: "Noodles" },
      { word: "番茄", pinyin: "Fānqié", image: "🍅", english: "Tomato" },
      { word: "香蕉", pinyin: "Xiāngjiāo", image: "🍌", english: "Banana" },
      { word: "米饭", pinyin: "Mǐfàn", image: "🍚", english: "Rice" },
      { word: "面包", pinyin: "Miànbāo", image: "🍞", english: "Bread" },
      { word: "鸡蛋", pinyin: "Jīdàn", image: "🥚", english: "Egg" },
    ]
  }
}

const wordList = Object.values(smallData).map(category => category.words).flat()
*/
const wordList = Object.values(data).map(category => category.words).flat()


// Load or initialize review data
const reviewData = JSON.parse(localStorage.getItem("reviewData")) || {};
let cardReviewCount = parseInt(localStorage.getItem('reviewCount') || '0', 10);

// Function to get the next due word
// Pass in wordToSkip (value of wordData.word) when we need the second next word
function getNextWord(wordToSkip /* optional */) {
  const now = Date.now();

  const eligibleWords = wordToSkip ? wordList.filter(w => w.word !== wordToSkip) : wordList

  // Find the next word due for review
  let dueWords = eligibleWords.filter(word => {
    const wordData = reviewData[word.word] || {};
    return !wordData.nextReview || wordData.nextReview <= now;
  });

  // If all words are scheduled for the future, pick the earliest due with the lowest easeFactor
  if (dueWords.length === 0) {
    dueWords = eligibleWords.sort((a, b) => {
      const fiveMinsInMillis = 5*60*1000
      const aTimestamp = (reviewData[a.word]?.nextReview || 0)
      const bTimestamp = (reviewData[b.word]?.nextReview || 0)

      const delta = aTimestamp - bTimestamp

      // Treat timestamps within five minutes of each other as the same
      if (Math.abs(delta) < fiveMinsInMillis) {
        // If the words are due to be reviewed at the same time, review the word with
        // the worst (lowest) easeFactor first.

        const aEaseFactor = (reviewData[a.word]?.easeFactor || 2.5)
        const bEaseFactor = (reviewData[b.word]?.easeFactor || 2.5)

        return aEaseFactor - bEaseFactor
      }

      // Sort by timestamp, earliest first
      return delta
    });
  }

  return dueWords[0];
}

// Function to calculate next review interval using SM-2
function updateReview(chinese, quality) {
  const now = Date.now();
  let wordData = reviewData[chinese] || { interval: 1, repetition: 0, easeFactor: 2.5 };

  wordData.lastReview = quality

  if (quality === 0) { // "Again" button
    wordData.repetition = 0;
    wordData.interval = 1; // Reset to 1 day
  } else {
    wordData.repetition += 1;
    wordData.easeFactor = Math.max(1.3, wordData.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (wordData.repetition === 1) {
      wordData.interval = 1; // 1 day
    } else if (wordData.repetition === 2) {
      wordData.interval = 3; // 3 days
    } else {
      wordData.interval = Math.round(wordData.interval * wordData.easeFactor);
    }
  }

  // console.log(`Updated ${chinese} with rating ${quality}. repetition ${wordData.repetition}  easeFactor ${wordData.easeFactor}  interval ${wordData.interval}`)

  wordData.nextReview = now + wordData.interval * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  reviewData[chinese] = wordData;
  localStorage.setItem("reviewData", JSON.stringify(reviewData));

  cardReviewCount++
  localStorage.setItem("reviewCount", cardReviewCount)
}


// Set up the first two cards
{
  const firstWord = getNextWord()
  appendCard(firstWord)
  appendCard(getNextWord(firstWord.word))
}


let current = frame.querySelector('.card:last-child')
let cardOverlay = current.children[0]
let startX = 0, startY = 0, moveX = 0, moveY = 0
initCard(current)

document.getElementById("again").addEventListener("click", () => {
  moveX = -1
  moveY = 0
  complete()
})

document.getElementById("good").addEventListener("click", () => {
  moveX = -2
  moveY = -40
  complete(true)
})

document.getElementById("easy").addEventListener("click", () => {
  moveX = 1
  moveY = 0
  complete()
})


function generateFlashcardContent(word) {
  const imageCL = "image" + (settings.showPicture ? "" : " invisible")
  const chineseCL = "chinese" + (settings.showChinese ? "" : " invisible")
  const pinyinCL = "pinyin" + (settings.showPinyin ? "" : " invisible")
  const englishCL = "english" + (settings.showEnglish ? "" : " invisible")
  const speakCL = "speakButton" + (settings.showSpeak ? "" : " invisible")

  const allShowing = settings.showPicture &&
                     settings.showChinese &&
                     settings.showPinyin &&
                     settings.showEnglish &&
                     settings.showSpeak
  // tap to reveal is laid out in a spot that overlaps speak button so only show one of the two
  const tapCL = "tapToReveal" + ((settings.showSpeak || allShowing) ? " invisible" : "")


  let englishStr = `<div class="${englishCL}">${word.english}</div>`

  let imgStr = ""
  if (word.image && word.image !== "NONE") {
    imgStr = `<div class='emojiImageLarge'>${word.image}</div>`
  } else if (word.imageURL) {
    imgStr = `<img class='wordImageLarge' src=../${word.imageURL}>`
  } else {
    imgStr = `${word.english}`
    englishStr = ""
  }

  return `
        <div class="card-overlay"></div>
        <div class="card-content">
          <div class="${imageCL}">${imgStr}</div>
          <div class="${chineseCL}">${word.word}</div>
          <div class="${pinyinCL}">${word.pinyin}</div>
          ${englishStr}
          <button class="${speakCL}" onclick="speakWord('${word.word}')">🔊 Speak</button>
          <div class="${tapCL}">Tap to Reveal</div>
        </div>
    `;
}

function cardBoxShadow(imitateTwoCards) {
  const opacity = imitateTwoCards ? 0.7 : 0.4
  return `3px 3px 10px rgba(0, 0, 0, ${opacity})`
}

function appendCard(data) {
  const firstCard = frame.children[0]
  const newCard = document.createElement('div')
  newCard.className = 'card'
  newCard.classList.add('flashcard')
  newCard.style.boxShadow = cardBoxShadow()

  newCard.innerHTML = generateFlashcardContent(data)
  newCard.dataset.chinese = data.word

  if (firstCard) {
    firstCard.style.boxShadow = cardBoxShadow() // reset shadow now that any swipes are complete
    frame.insertBefore(newCard, firstCard)
  } else {
    frame.appendChild(newCard)
  }
}

function initCard(card) {
  card.addEventListener('pointerdown', onPointerDown)
}

function setTransform(x, y, deg, duration) {
  current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${deg}deg)`
  let opacity = 0
  if (-y > Math.abs(x)) {
    opacity = Math.min(Math.abs((y / innerHeight * 2.1)), 1)
    cardOverlay.style.opacity = opacity
    cardOverlay.className = `card-overlay up`
    cardOverlay.innerText = "Slow"
  } else {
    opacity = Math.min(Math.abs((x / innerWidth * 2.1)), 1)
    cardOverlay.style.opacity = opacity
    cardOverlay.className = `card-overlay ${x > 0 ? 'right' : 'left'}`
    cardOverlay.innerText = x > 0 ? "Easy" : "Don't Know"
  }

  // Both cards will be in the stack when this transform is complete
  // If one card is in the stack by itself, keep the box shadow of the deck looking consistent by
  // simulating two stacked shadows.
  const twoCardsAreStacked = (x === 0 && y === 0)
  const nextCard = frame.children[0]
  nextCard.style.boxShadow = cardBoxShadow(!twoCardsAreStacked)

  if (duration) {
    current.style.transition = `transform ${duration}ms`;
    cardOverlay.style.transition = `opacity ${2*duration/3}ms`; // looks better for the opacity to transition faster
  }
}

function onPointerDown({ clientX, clientY }) {
  startX = clientX
  startY = clientY
  current.addEventListener('pointermove', onPointerMove)
  current.addEventListener('pointerup', onPointerUp)
  current.addEventListener('pointerleave', onPointerUp)
}

function onPointerMove({ clientX, clientY }) {
  moveX = clientX - startX
  moveY = clientY - startY
  setTransform(moveX, moveY, moveX / innerWidth * 50)
}

function onPointerUp(event) {
  //console.log(`Pointer up at (${event.clientX}, ${event.clientY})`);
  //console.log(`pointer up moveX ${moveX} moveY ${moveY}`)

  current.removeEventListener('pointermove', onPointerMove)
  current.removeEventListener('pointerup', onPointerUp)
  current.removeEventListener('pointerleave', onPointerUp)

  const moveThreshold = frame.clientWidth / 6
  const flyUp = -moveY > moveThreshold
  if (flyUp || Math.abs(moveX) > moveThreshold) {
    current.removeEventListener('pointerdown', onPointerDown)
    complete(flyUp)
  } else {
    const movement = Math.abs(moveX) + Math.abs(moveY)
    if (movement < 9) {
      handleCardClick(event)
    }

    cancel()
  }
}

function handleCardClick(event) {
  const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);
  const shouldIgnore = elementUnderCursor && elementUnderCursor.tagName === "BUTTON"
  if (shouldIgnore) { return } // Button gets its own onclick callback
  if (!settingsPanel.classList.contains("hidden")) { return } // Ignore clicks while settings is open

  updateVisibility(current.querySelectorAll(".image"), true)
  updateVisibility(current.querySelectorAll(".pinyin"), true)
  updateVisibility(current.querySelectorAll(".chinese"), true)
  updateVisibility(current.querySelectorAll(".english"), true)
  updateVisibility(current.querySelectorAll(".speakButton"), true)
  updateVisibility(current.querySelectorAll(".tapToReveal"), false)
}

function complete(flyUp) {

  let recallRating = 0 // "Don't Know" aka "Again" aka "Couldn't Recall"
  if (flyUp) {
    recallRating = 3 // "Slow Recall" aka "Good"
  } else if (moveX > 0) {
    recallRating = 5 // "Easy Recall"
  }
  const completedWordChinese = current.dataset.chinese


  if (!flyUp) {
    const flyX = (Math.abs(moveX) / moveX) * innerWidth * 1.3
    const flyY = (moveY / moveX) * flyX
    setTransform(flyX, flyY, flyX / innerWidth * 50, innerWidth)
  } else {
    const flyY = (Math.abs(moveY) / moveY) * innerHeight * 1.3
    const flyX = (moveX / moveY) * flyY
    setTransform(flyX, flyY, 0, innerHeight)
  }

  moveX = 0
  moveY = 0

  const prev = current
  const next = current.previousElementSibling
  if (next) initCard(next)
  current = next
  cardOverlay = current.children[0]

  updateReview(completedWordChinese, recallRating)

  appendCard(getNextWord(current.dataset.chinese))

  setTimeout(() => frame.removeChild(prev), innerWidth)
}

function cancel() {
  moveX = 0
  moveY = 0
  setTransform(0, 0, 0, 100)
  setTimeout(() => current.style.transition = '', 100)
}


let checkedPreferredVoice = false
let cachedPreferredVoice = null
function preferredVoice() {
  if (checkedPreferredVoice) {
    return cachedPreferredVoice
  }

  checkedPreferredVoice = true

  const voices = window.speechSynthesis.getVoices()

  const prefs = [ "Tingting (zh-CN)" ]

  for (let pref of prefs) {
    cachedPreferredVoice = voices.find(v => pref === `${v.name} (${v.lang})`)
    if (cachedPreferredVoice) {
      return cachedPreferredVoice
    }
  }

  // Pick the first voice explicitly rather than relying
  // on SpeechSynthesis to pick a voice for the language.
  // Seems to be required on iPhone for zh-CN to work on a phone
  // configured for English:
  // https://stackoverflow.com/questions/51904607/ios-safari-speechsynthesisutterance-can-not-set-language
  cachedPreferredVoice = voices.find(v => v.lang === "zh-CN")

  return cachedPreferredVoice
}

function speakWord(str) {
  str = str + ""
  const utterance = new SpeechSynthesisUtterance(str)

  const pv = preferredVoice()
  if (pv) {
    utterance.voice = pv
  }

  utterance.lang = "zh-CN"

  // Some optional parameters:
  utterance.volume = 0.5
  //utterance.pitch = 1
  //let rate = 0
  //utterance.rate = Math.pow(Math.abs(rate) + 1, rate < 0 ? -1 : 1);

  speechSynthesis.speak(utterance);
}
