let maxValue = 1;
let numbers = [];
let target = 0;
let targetPair = [];
let selections = [];
let roundLocked = false;

const targetElement = document.getElementById("target");
const choicesElement = document.getElementById("choices");
const selectionElements = [
  document.getElementById("selection1"),
  document.getElementById("selection2")
];
const messageElement = document.getElementById("message");
const fireworksElement = document.getElementById("fireworks");

function randomNumber(max) {
  return Math.floor(Math.random() * max) + 1;
}

function generateRound() {
  roundLocked = false;
  selections = [];

  document.body.classList.remove("mistake", "success");
  messageElement.textContent = "";

  numbers = Array.from({ length: 5 }, () => randomNumber(maxValue));

  const firstIndex = Math.floor(Math.random() * 5);
  let secondIndex = Math.floor(Math.random() * 5);

  while (secondIndex === firstIndex) {
    secondIndex = Math.floor(Math.random() * 5);
  }

  targetPair = [firstIndex, secondIndex];
  target = numbers[firstIndex] + numbers[secondIndex];

  targetElement.textContent = target;

  renderChoices();
  resetSelections();
}

function renderChoices() {
  choicesElement.innerHTML = "";

  numbers.forEach((number, index) => {
    const button = document.createElement("button");

    button.className = "choice";
    button.textContent = number;
    button.dataset.index = index;

    button.addEventListener("click", () => selectNumber(index));

    choicesElement.appendChild(button);
  });
}

function resetSelections() {
  selectionElements.forEach(selection => {
    selection.classList.remove("filled");
    selection.querySelector(".selectedValue").textContent = "";
  });
}

function selectNumber(index) {
  if (roundLocked || selections.length >= 2) {
    return;
  }

  selections.push(index);

  const selectionSlot = selections.length - 1;
  const selectionElement = selectionElements[selectionSlot];

  selectionElement.classList.add("filled");
  selectionElement.querySelector(".selectedValue").textContent = numbers[index];

  const choiceElement = choicesElement.querySelector(
    `[data-index="${index}"]`
  );

  choiceElement.classList.add("disabled");

  if (selections.length === 2) {
    checkAnswer();
  }
}

function removeSelection(slot) {
  if (roundLocked) {
    return;
  }

  const index = selections[slot];

  if (index === undefined) {
    return;
  }

  selections.splice(slot, 1);

  selectionElements[slot].classList.remove("filled");
  selectionElements[slot].querySelector(".selectedValue").textContent = "";

  const choiceElement = choicesElement.querySelector(
    `[data-index="${index}"]`
  );

  if (choiceElement) {
    choiceElement.classList.remove("disabled");
  }

  // Move the second selection into the first slot if necessary.
  if (slot === 0 && selections.length === 1) {
    const remainingIndex = selections[0];

    selectionElements[0].classList.add("filled");
    selectionElements[0].querySelector(".selectedValue").textContent =
      numbers[remainingIndex];

    selectionElements[1].classList.remove("filled");
    selectionElements[1].querySelector(".selectedValue").textContent = "";

    selections = [remainingIndex];

    const remainingChoice = choicesElement.querySelector(
      `[data-index="${remainingIndex}"]`
    );

    if (remainingChoice) {
      remainingChoice.classList.add("disabled");
    }
  }

  document.body.classList.remove("mistake");
  messageElement.textContent = "";
}

selectionElements.forEach((selection, slot) => {
  selection.querySelector(".remove").addEventListener("click", event => {
    event.stopPropagation();
    removeSelection(slot);
  });
});

function checkAnswer() {
  const firstNumber = numbers[selections[0]];
  const secondNumber = numbers[selections[1]];
  const sum = firstNumber + secondNumber;

  if (sum === target) {
    handleSuccess();
  } else {
    handleMistake();
  }
}

function handleMistake() {
  document.body.classList.add("mistake");
  messageElement.textContent = "Try again!";
}

function handleSuccess() {
  roundLocked = true;

  document.body.classList.remove("mistake");
  document.body.classList.add("success");

  messageElement.textContent = "🎉 Correct!";

  createFireworks();

  // The matched target becomes the new maximum.
  maxValue = target;

  setTimeout(() => {
    generateRound();
  }, 1600);
}

function createFireworks() {
  fireworksElement.innerHTML = "";

  const emojis = ["🎉", "🎊", "✨", "🥳", "⭐"];

  for (let i = 0; i < 35; i++) {
    const emoji = document.createElement("span");

    emoji.className = "emoji";
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    const startX = 50 + (Math.random() - 0.5) * 20;
    const startY = 50 + (Math.random() - 0.5) * 20;

    const distance = 100 + Math.random() * 300;
    const angle = Math.random() * Math.PI * 2;

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    emoji.style.left = `${startX}%`;
    emoji.style.top = `${startY}%`;
    emoji.style.setProperty("--x", `${x}px`);
    emoji.style.setProperty("--y", `${y}px`);
    emoji.style.setProperty(
      "--rotation",
      `${(Math.random() - 0.5) * 720}deg`
    );

    emoji.style.animationDelay = `${Math.random() * 0.2}s`;

    fireworksElement.appendChild(emoji);
  }

  setTimeout(() => {
    fireworksElement.innerHTML = "";
  }, 1800);
}

generateRound();
