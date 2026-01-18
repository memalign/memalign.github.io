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
  showPicture: false,
  showLetter: true,
  showUppercase: true,
  showLowercase: true,
  showWord: false,
};

// Get elements
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const saveSettingsBtn = document.getElementById("save-settings");
const resetProgressBtn = document.getElementById("reset-progress");
const resetCountBtn = document.getElementById("reset-count");
const letterSelectionBtn = document.getElementById("letter-selection-btn");
const letterSelectionPanel = document.getElementById("letter-selection-panel");
const letterCheckboxesContainer = document.getElementById("letter-checkboxes");
const applyLetterSelectionBtn = document.getElementById("apply-letter-selection");
const weakest5Btn = document.getElementById("weakest-5");
const random5Btn = document.getElementById("random-5");
const selectAllBtn = document.getElementById("select-all");
const selectNoneBtn = document.getElementById("select-none");
const advancedWeakestBtn = document.getElementById("advanced-weakest");
const advancedRandomBtn = document.getElementById("advanced-random");
const advancedSelectAllBtn = document.getElementById("advanced-select-all");
const advancedSelectNoneBtn = document.getElementById("advanced-select-none");

// Checkboxes
const showPictureCheckbox = document.getElementById("show-picture");
const showLetterCheckbox = document.getElementById("show-letter");
const showUppercaseCheckbox = document.getElementById("show-uppercase");
const showLowercaseCheckbox = document.getElementById("show-lowercase");
const showWordCheckbox = document.getElementById("show-word");

// Apply saved settings to checkboxes
showPictureCheckbox.checked = settings.showPicture;
showLetterCheckbox.checked = settings.showLetter;
showUppercaseCheckbox.checked = settings.showUppercase;
showLowercaseCheckbox.checked = settings.showLowercase;
showWordCheckbox.checked = settings.showWord;

function updateVisibility(elements, condition) {
  elements.forEach(element => {
    if (condition) {
      element.classList.remove("invisible")
    } else {
      element.classList.add("invisible")
    }
  });
}

function refreshCards() {
  const cards = frame.querySelectorAll('.card.flashcard');
  cards.forEach(card => {
    const wordValue = card.dataset.word;
    const wordData = allWords.find(w => w.word === wordValue);
    if (wordData) {
      card.innerHTML = generateFlashcardContent(wordData);
    }
  });
}

// Function to save settings
function saveSettings() {
  settings.showPicture = showPictureCheckbox.checked;
  settings.showLetter = showLetterCheckbox.checked;
  settings.showUppercase = showUppercaseCheckbox.checked;
  settings.showLowercase = showLowercaseCheckbox.checked;
  settings.showWord = showWordCheckbox.checked;

  localStorage.setItem("flashcardSettings", JSON.stringify(settings));
  settingsPanel.classList.add("hidden"); // Hide settings panel

  refreshCards();
}

// Show/hide settings panel
settingsBtn.addEventListener("click", (event) => {
  event.stopPropagation() // otherwise the "click anywhere on the document" event handler will immediately dismiss settings panel

  if (settingsPanel.classList.contains("hidden")) {

    const stats = calculateStats(allWords, reviewData)

    const easyStatsEl = document.getElementById("easyStats")
    easyStatsEl.innerText = `${stats.count5} / ${allWords.length} = ${ (stats.count5 * 100 / allWords.length).toFixed(1) }% easy`

    const slowStatsEl = document.getElementById("slowStats")
    slowStatsEl.innerText = `${stats.count3} / ${allWords.length} = ${ (stats.count3 * 100 / allWords.length).toFixed(1) }% slow`

    const dontKnowStatsEl = document.getElementById("dontKnowStats")
    dontKnowStatsEl.innerText = `${stats.count0} / ${allWords.length} = ${ (stats.count0 * 100 / allWords.length).toFixed(1) }% don't know`

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

document.addEventListener("click", function (event) {
  if (letterSelectionPanel.classList.contains("hidden")) {
    return;
  }

  if (!letterSelectionPanel.contains(event.target) && event.target !== letterSelectionBtn) {
    const currentSelection = getSelectedLetters();
    // No modifications to the selected letters since it was presented
    if (JSON.stringify(initialLetterSelection.sort()) === JSON.stringify(currentSelection.sort())) {
      letterSelectionPanel.classList.add("hidden");
    }
  }
});


function calculateStats(wordList, reviewData) {
  let count0 = 0, count3 = 0, count5 = 0, notReviewed = 0;

  const wordSet = new Set(wordList.map(element => element.word));

  for (const [key, wordData] of Object.entries(reviewData)) {
    // Ignore stats for a word that was removed from the dictionary
    if (!wordSet.has(key)) {
      continue
    }

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

  return { count0, count3, count5, notReviewed };
}


function resetProgress() {
  let resetStorage = confirm("Reset Progress? All learning progress will be lost.")

  if (resetStorage) {
    window.localStorage.removeItem('reviewData')
    location.reload()
    return true
  } else {
    return false
  }
}
resetProgressBtn.addEventListener("click", resetProgress);

function resetCount() {
  let resetStorage = confirm("Reset Count? Reviewed cards count will be reset to zero.")

  if (resetStorage) {
    window.localStorage.removeItem('reviewCount')
    location.reload()
    return true
  } else {
    return false
  }
}
resetCountBtn.addEventListener("click", resetCount);


const frame = document.body.querySelector('.frame')

const allWords = Object.values(data).flatMap(category => category.words);
let activeWordList = [];


// Load or initialize review data
const reviewData = JSON.parse(localStorage.getItem("reviewData")) || {};
let cardReviewCount = parseInt(localStorage.getItem('reviewCount') || '0', 10);

// Function to get the next due word
// Pass in wordToSkip (value of wordData.word) when we need the second next word
function getNextWord(wordToSkip /* optional */) {
  const now = Date.now();

  const eligibleWords = wordToSkip ? activeWordList.filter(w => w.word !== wordToSkip) : activeWordList

  // Find the next word due for review
  let dueWords = eligibleWords.filter(word => {
    const wordData = reviewData[word.word] || {};
    return !wordData.nextReview || wordData.nextReview <= now;
  });

  // If all words are scheduled for the future, pick the earliest due with the lowest easeFactor
  if (dueWords.length === 0) {
    if (eligibleWords.length === 0) return undefined;
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
function updateReview(word, quality) {
  const now = Date.now();
  let wordData = reviewData[word] || { interval: 1, repetition: 0, easeFactor: 2.5 };

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

  wordData.nextReview = now + wordData.interval * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  reviewData[word] = wordData;
  localStorage.setItem("reviewData", JSON.stringify(reviewData));

  cardReviewCount++
  localStorage.setItem("reviewCount", cardReviewCount)
}

function setupCards() {
  frame.innerHTML = '';
  if (activeWordList.length > 0) {
    const firstWord = getNextWord();
    if (firstWord) {
      appendCard(firstWord);
      if (activeWordList.length > 1) {
        const secondWord = getNextWord(firstWord.word);
        if (secondWord) {
          appendCard(secondWord);
        }
      }
      current = frame.querySelector('.card:last-child');
      cardOverlay = current.children[0];
      initCard(current);
    }
  }
}

let current
let cardOverlay
let startX = 0, startY = 0, moveX = 0, moveY = 0

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


const countForWord = { }; // word -> integer

function generateFlashcardContent(word) {
  let letterStr = '';
  const isBasicLetter = data.alphabet.words.some(basicWord => basicWord.word === word.word);
  if (isBasicLetter && areAdvancedCheckboxesChecked()) {
    letterStr += word.word[1]; // Only show lowercase for basic letters if advanced are checked
  } else {
    if (settings.showUppercase) {
      letterStr += word.word[0];
    }
    if (settings.showLowercase) {
      letterStr += word.word[1];
    }
  }

  let displayWord = word.english;
  if (word.englishExamples) {
    let currentCountForWord = countForWord[word.word];
    currentCountForWord = currentCountForWord ? currentCountForWord : 0;

    displayWord = word.englishExamples[currentCountForWord % word.englishExamples.length];

    countForWord[word.word] = currentCountForWord + 1;
  }


  // My kid doesn't like the Georgia font's lowercase g, so use a different font for words that contain it
  const additionalClassForStr = function(str) {
    return str.includes("g") ? " GOverride" : "";
  }

  let wordInImage = false;
  let imgStr = ""
  if (word.image && word.image !== "NONE") {
    imgStr = `<div class='emojiImageLarge'>${word.image}</div>`
  } else if (word.imageURL) {
    imgStr = `<img class='wordImageLarge' src=../${word.imageURL}>`
  } else {
    imgStr = `<div class='wordAsImage${additionalClassForStr(displayWord)}'>${displayWord}</div>`
    wordInImage = true;
  }

  const imageCL = "image" + (settings.showPicture ? "" : " invisible")
  const letterCL = "letter" + additionalClassForStr(letterStr) + (settings.showLetter ? "" : " invisible")
  const wordCL = "word" + additionalClassForStr(displayWord) + (settings.showWord ? "" : " invisible")

  const allShowing = settings.showPicture &&
                     settings.showWord &&
                     settings.showLetter
  const tapCL = "tapToReveal" + (allShowing ? " invisible" : "")

  const isLetterOnly = settings.showLetter && !settings.showPicture && !settings.showWord;
  const cardContentClasses = ["card-content"];
  if (isLetterOnly) {
    cardContentClasses.push("letter-only");
  }


  return `
        <div class="card-overlay"></div>
        <div class="${cardContentClasses.join(' ')}">
          <div class="${imageCL}">${imgStr}</div>
          <div class="${letterCL}">${letterStr}</div>
          <div class="${wordCL}">${wordInImage ? '' : displayWord}</div>
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
  newCard.dataset.word = data.word

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

  const cardContent = current.querySelector('.card-content');
  if (cardContent) {
    cardContent.classList.remove('letter-only');
    cardContent.classList.add('revealed');
  }

  updateVisibility(current.querySelectorAll(".image"), true)
  updateVisibility(current.querySelectorAll(".letter"), true)
  updateVisibility(current.querySelectorAll(".word"), true)
  updateVisibility(current.querySelectorAll(".english"), true)
  updateVisibility(current.querySelectorAll(".tapToReveal"), false)
}

let easyRecallStreak = 0;
const effectsContainer = document.getElementById('effects-container');

function showConfetti(emoji) {
  if (!emoji) return;

  for (let i = 0; i < 10; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.innerText = emoji;
    confetti.style.left = `${Math.random() * 100}vw`;

    const duration = 1100;
    const delay = Math.random() * 400;
    confetti.style.setProperty('--fall-duration', `${duration}ms`);
    confetti.style.animationDelay = `${delay}ms`;

    const xMovement = Math.random() * 500 - 250; // -250px to 250px
    confetti.style.setProperty('--fall-x', `${xMovement}px`);

    const rotation = Math.random() * 720 - 360; // -360deg to 360deg
    confetti.style.setProperty('--fall-rotate', `${rotation}deg`);

    effectsContainer.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, duration + delay);
  }
}

function complete(flyUp) {

  let recallRating = 0 // "Don't Know" aka "Again" aka "Couldn't Recall"
  if (flyUp) {
    recallRating = 3 // "Slow Recall" aka "Good"
    easyRecallStreak = 0;
  } else if (moveX > 0) {
    recallRating = 5 // "Easy Recall"
    easyRecallStreak++;
  } else {
    easyRecallStreak = 0;
  }
  const completedWordData = allWords.find(w => w.word === current.dataset.word);

  if (recallRating === 5 && easyRecallStreak > 0 && easyRecallStreak % 3 === 0) {
    if (completedWordData && completedWordData.image && completedWordData.image !== "NONE") {
      showConfetti(completedWordData.image);
    } else {
      showConfetti("🍇");
    }
  }
  const completedWord = current.dataset.word


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
  if (current) {
    cardOverlay = current.children[0]
  }

  updateReview(completedWord, recallRating)

  const nextWord = getNextWord(current ? current.dataset.word : null);
  if (nextWord) {
    appendCard(nextWord)
  }

  setTimeout(() => frame.removeChild(prev), innerWidth)
}

function cancel() {
  moveX = 0
  moveY = 0
  setTransform(0, 0, 0, 100)
  setTimeout(() => current.style.transition = '', 100)
}

// Letter Selection Panel
function getSelectedLetters() {
  const selected = [];
  const checkboxes = document.querySelectorAll('#letter-checkboxes input[type="checkbox"]:checked, #advanced-letter-checkboxes input[type="checkbox"]:checked');
  checkboxes.forEach(checkbox => {
    selected.push(checkbox.value);
  });
  return selected;
}

function getWeakestWords(wordList, count) {
  const wordsWithReviewData = wordList.map(word => {
    const review = reviewData[word.word] || { easeFactor: 2.5, lastReview: -1 };
    return { ...word, ...review };
  });

  wordsWithReviewData.sort((a, b) => {
    const aScore = a.easeFactor + (a.lastReview === 0 ? -1 : 0);
    const bScore = b.easeFactor + (b.lastReview === 0 ? -1 : 0);
    return aScore - bScore;
  });

  return wordsWithReviewData.slice(0, count);
}

function updateApplyButtonState() {
  const checkedCheckboxes = document.querySelectorAll('#letter-checkboxes input[type="checkbox"]:checked, #advanced-letter-checkboxes input[type="checkbox"]:checked');
  applyLetterSelectionBtn.disabled = checkedCheckboxes.length === 0;
}

function updateBasicLetterLabels() {
  const advancedChecked = areAdvancedCheckboxesChecked();
  const basicCheckboxes = document.querySelectorAll('#letter-checkboxes label');
  basicCheckboxes.forEach(label => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    const word = data.alphabet.words.find(w => w.word === checkbox.value);
    if (word) {
      // Last child of a label is the text node
      // We need to show only lowercase when an advanced flashcard is in
      // rotation because the user needs to read letter combinations.
      // E.g. Showing "Oo" for the basic "o" card would be very confusing.
      if (advancedChecked) {
        label.lastChild.textContent = word.word[1]; // Only lowercase
      } else {
        label.lastChild.textContent = word.word; // Both upper and lowercase
      }
    }
  });
}

function populateLetterSelectionPanel() {
  letterCheckboxesContainer.innerHTML = '';
  data.alphabet.words.forEach(word => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `letter-${word.word}`;
    checkbox.value = word.word;
    checkbox.checked = activeWordList.some(activeWord => activeWord.word === word.word);

    const label = document.createElement('label');
    label.htmlFor = `letter-${word.word}`;
    label.id = `letter-label-${word.word}`;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(word.word));
    letterCheckboxesContainer.appendChild(label);
  });
  updateBasicLetterLabels();

  const advancedLetterCheckboxesContainer = document.getElementById('advanced-letter-checkboxes');
  advancedLetterCheckboxesContainer.innerHTML = '';
  for (const key in data) {
    if (key !== 'alphabet') {
      const category = data[key];
      const categoryLabel = document.createElement('h4');
      categoryLabel.textContent = category.label;
      advancedLetterCheckboxesContainer.appendChild(categoryLabel);

      const categoryWordsContainer = document.createElement('div');
      categoryWordsContainer.className = 'letter-checkboxes';
      category.words.forEach(word => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `letter-${word.word}`;
        checkbox.value = word.word;
        checkbox.checked = activeWordList.some(activeWord => activeWord.word === word.word);

        const label = document.createElement('label');
        label.htmlFor = `letter-${word.word}`;
        label.id = `letter-label-${word.word}`;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(word.word));
        categoryWordsContainer.appendChild(label);
      });
      advancedLetterCheckboxesContainer.appendChild(categoryWordsContainer);
    }
  }

  updateApplyButtonState();
}

let initialLetterSelection = [];
letterSelectionBtn.addEventListener("click", (event) => {
  event.stopPropagation();

  if (letterSelectionPanel.classList.contains("hidden")) {
    populateLetterSelectionPanel();
    initialLetterSelection = getSelectedLetters();
    letterSelectionPanel.classList.remove("hidden");
  } else {
    const currentSelection = getSelectedLetters();
    if (JSON.stringify(initialLetterSelection.sort()) === JSON.stringify(currentSelection.sort())) {
      letterSelectionPanel.classList.add("hidden");
    }
  }
});

applyLetterSelectionBtn.addEventListener("click", () => {
  const selectedWords = [];
  const checkboxes = document.querySelectorAll('#letter-checkboxes input[type="checkbox"], #advanced-letter-checkboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const wordData = allWords.find(w => w.word === checkbox.value);
      if (wordData) {
        selectedWords.push(wordData);
      }
    }
  });
  activeWordList = selectedWords;
  letterSelectionPanel.classList.add("hidden");

  setupCards();
});

weakest5Btn.addEventListener("click", () => {
  const weakest = getWeakestWords(data.alphabet.words, 5).map(w => w.word);
  const checkboxes = document.querySelectorAll('#letter-checkboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = weakest.includes(checkbox.value);
  });
  updateApplyButtonState();
});

random5Btn.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll('#letter-checkboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = false);

  const shuffled = [...data.alphabet.words].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5).map(w => w.word);

  checkboxes.forEach(checkbox => {
    if (selected.includes(checkbox.value)) {
      checkbox.checked = true;
    }
  });
  updateApplyButtonState();
});

selectAllBtn.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll('#letter-checkboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = true);
  updateApplyButtonState();
});

selectNoneBtn.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll('#letter-checkboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = false);
  updateApplyButtonState();
});

const advancedWords = Object.keys(data).filter(key => key !== 'alphabet').flatMap(key => data[key].words);

advancedWeakestBtn.addEventListener("click", () => {
    const weakest = getWeakestWords(advancedWords, 5).map(w => w.word);
    const checkboxes = document.querySelectorAll('#advanced-letter-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = weakest.includes(checkbox.value);
    });
    updateApplyButtonState();
    updateBasicLetterLabels();
});

advancedRandomBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll('#advanced-letter-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    const shuffled = [...advancedWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5).map(w => w.word);
    checkboxes.forEach(checkbox => {
        if (selected.includes(checkbox.value)) {
            checkbox.checked = true;
        }
    });
    updateApplyButtonState();
    updateBasicLetterLabels();
});

advancedSelectAllBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll('#advanced-letter-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
    updateApplyButtonState();
    updateBasicLetterLabels();
});

advancedSelectNoneBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll('#advanced-letter-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    updateApplyButtonState();
    updateBasicLetterLabels();
});

document.getElementById('letter-selection-panel').addEventListener('change', (event) => {
  if (event.target.type === 'checkbox') {
    updateApplyButtonState();
    // After any change, refresh cards to reflect potential lowercase changes
    refreshCards();
    updateBasicLetterLabels();
  }
});

function areAdvancedCheckboxesChecked() {
  const advancedCheckboxes = document.querySelectorAll('#advanced-letter-checkboxes input[type="checkbox"]:checked');
  return advancedCheckboxes.length > 0;
}

// Initial setup
activeWordList = getWeakestWords(data.alphabet.words, 5);
setupCards();
