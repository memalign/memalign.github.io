
function showAll() {
  clearSearch(true)
	const button = document.getElementById("show-all")
  button.style.display = "none"
	showCategories(Object.keys(data))
}

let englishVisible = false;

function toggleEnglish() {
	englishVisible = !englishVisible;

	const toggleButton = document.getElementById("toggle-english")
	toggleButton.textContent = englishVisible ? "Hide English" : "Show English"

	updateEnglishVisibility()
}

function updateEnglishVisibility() {
	const englishElements = document.querySelectorAll(".english-translation");

	// Toggle the visibility of each element
	englishElements.forEach(element => {
		if (!englishVisible) {
			element.style.display = "none";
		} else {
			element.style.display = "inline";
		}
	});

	const chineseElements = document.querySelectorAll(".chinese");

	// Toggle the visibility of each element
	chineseElements.forEach(element => {
		if (englishVisible) {
			element.style.display = "none";
		} else {
			element.style.display = "inline";
		}
	});

	adjustWordTileTextToFit()
}

function isWordWrapping(element) {
	const lc = getLineCount(element)
	return lc > 2
}

function getLineCount(element) {
	const lineHeight = parseInt(window.getComputedStyle(element).lineHeight, 10);
	if (!lineHeight) {
		// If line height is not explicitly set, default to the font size.
		const fontSize = parseInt(window.getComputedStyle(element).fontSize, 10);
		return Math.ceil(element.scrollHeight / fontSize); // Estimate the line count based on font size
	}
	return Math.ceil(element.scrollHeight / lineHeight); // Calculate number of lines
}

function adjustWordTileTextToFit() {
  const allTiles = document.querySelectorAll('.word-tile');

  allTiles.forEach(t => {
		const pinyin = t.querySelector('.pinyin')
		const english = t.querySelector('.english-translation')
		const chinese = t.querySelector('.chinese')

		let amtWrapping = 0
		amtWrapping += isWordWrapping(pinyin) ? 1 : 0
		amtWrapping += englishVisible && isWordWrapping(english) ? 1 : 0
		amtWrapping += !englishVisible && isWordWrapping(chinese) ? 1 : 0

		if (amtWrapping >= 2) {
			const emojiImage = t.querySelector('.emojiImage')
			if (emojiImage) {
				emojiImage.classList.remove('emojiImage')
				emojiImage.classList.add('emojiImageMedium')
			}

			const wordImage = t.querySelector('.wordImage')
			if (wordImage) {
				wordImage.classList.remove('wordImage')
				wordImage.classList.add('wordImageMedium')
			}
		} else {
			const emojiImage = t.querySelector('.emojiImageMedium')
			if (emojiImage) {
				emojiImage.classList.remove('emojiImageMedium')
				emojiImage.classList.add('emojiImage')
			}

			const wordImage = t.querySelector('.wordImageMedium')
			if (wordImage) {
				wordImage.classList.remove('wordImageMedium')
				wordImage.classList.add('wordImage')
			}
		}
	});
}

function loadCategories() {
	const categoriesDiv = document.getElementById("categories");
	categoriesDiv.innerHTML = "";

	Object.keys(data).forEach(categoryKey => {
		const category = data[categoryKey];
		const button = document.createElement("button");
		button.className = "category-tile";
		button.onclick = () => showCategory(categoryKey);


		if (category.image) {
			const emojiImg = document.createElement('div');
			emojiImg.classList.add('emojiImageMedium');
			emojiImg.innerText = category.image;
			button.appendChild(emojiImg);

		} else {
			// Create a container for the 2x2 image grid
			const gridContainer = document.createElement('div');
			gridContainer.classList.add('image-grid');

			// Select the first four images from the category's words
			const images = category.words.slice(0, 4); // Get up to 4 words
			images.forEach(word => {
				const img = document.createElement('div');

				let imgStr = ""
				if (word.image) {
					imgStr = word.image
				} else if (word.imageURL) {
					imgStr = `<img class='wordImageSmall' src=${word.imageURL}>`
				}

				img.innerHTML = imgStr

				img.classList.add('grid-image');

				gridContainer.appendChild(img);
			});

			button.appendChild(gridContainer);
		}

		// Add the pinyin label
		{
			const pinyinLabel = document.createElement('div');
			pinyinLabel.innerText = category.pinyinLabel;
			button.appendChild(pinyinLabel);
		}

		// Add the Chinese label
		{
			const chineseLabel = document.createElement('div');
			chineseLabel.innerText = category.chinese;
			button.appendChild(chineseLabel);
		}

		categoriesDiv.appendChild(button);
	});
}

function selectTile(tile) {
  // Remove 'selected' class from all word tiles
  const allTiles = document.querySelectorAll('.word-tile');
  allTiles.forEach(t => t.classList.remove('selected'));

  tile.classList.add('selected');
}

function showCategory(categoryKey) {
	const button = document.getElementById("show-all")
  button.style.display = "inline"
	showCategories([ categoryKey ])
}

function showCategories(categoryKeys) {
  const wordsDiv = document.getElementById("words");
  const wordTilesDiv = document.getElementById("word-tiles");

  // Clear previous word tiles
  wordTilesDiv.innerHTML = "";

  // Add word tiles for the selected category
	for (const categoryKey of categoryKeys) {
		const category = data[categoryKey];
		category.words.forEach(item => {
			const tile = document.createElement("button");
			tile.className = "word-tile";
			tile.dataset.pinyin = item.pinyin
			tile.dataset.strippedPinyin = removeAccents(item.pinyin)
			tile.dataset.word = item.word
			tile.dataset.english = item.english

      if (item.pinyin.length + item.english.length > 37) {
        tile.classList.add('small-font')
      }

			let imgStr = ""
			if (item.image && item.image !== "NONE") {
				imgStr = `<div class='emojiImage'>${item.image || "<>"}</div>`
			} else if (item.imageURL) {
				imgStr = `<img class='wordImage' src=${item.imageURL}>`
			} else {
        imgStr = `${item.english}`
      }

			tile.innerHTML = `
				${imgStr}
				<div class="pinyin">${item.pinyin}</div>
				<div class="chinese">${item.word}</div>
				<div class="english-translation">${item.english}</div>
			`;
			tile.onclick = () => {
				selectTile(tile);
				speakWord(item.word);
			}
			wordTilesDiv.appendChild(tile);
		});
	}

	updateEnglishVisibility()

  // Show words section
  wordsDiv.classList.remove("hidden");
}

function handleSearchFocus() {
	// Show tiles for all words to allow us to search the full dataset
  showAll()
}

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function filterTiles() {
  const searchQuery = document.getElementById("search-bar").value.toLowerCase();
	const clearButton = document.getElementById("clear-button");
  const wordTiles = document.querySelectorAll(".word-tile");

	// Show or hide the clear button and Show All button based on input value
	if (searchQuery) {
		clearButton.style.display = "block";
    const button = document.getElementById("show-all")
    button.style.display = "inline"
	} else {
		clearButton.style.display = "none";
    const button = document.getElementById("show-all")
    button.style.display = "none"
	}

  // Loop through all word tiles and hide/show based on the search query
  wordTiles.forEach(tile => {
    const pinyin = tile.dataset.pinyin.toLowerCase();
		const strippedPinyin = tile.dataset.strippedPinyin.toLowerCase();
    const word = tile.dataset.word.toLowerCase();
		const english = tile.dataset.english.toLowerCase();
    if (pinyin.includes(searchQuery) || strippedPinyin.includes(searchQuery) || word.includes(searchQuery) || english.includes(searchQuery)) {
      tile.style.display = "flex"; // Show tile
    } else {
      tile.style.display = "none"; // Hide tile
    }
  });
}

function clearSearch(suppressFocus) {
	const searchBar = document.getElementById("search-bar");
	const clearButton = document.getElementById("clear-button");
	const wordTiles = document.querySelectorAll(".word-tile");

	// Clear the search bar and hide the clear button
	searchBar.value = "";
	clearButton.style.display = "none";

	// Show all word tiles
	wordTiles.forEach(tile => {
		tile.style.display = "flex";
	});

  if (!suppressFocus) {
    searchBar.focus();
  }
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

// Initialize the app by loading categories
window.onload = () => {
  loadCategories();
  showAll()
}
