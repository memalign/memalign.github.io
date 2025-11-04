// Phonics Wolfer -- a phonics-based game for kids.
// Each level corresponds to a letter (A→Z), skipping letters
// that don’t have enough clear, child-recognizable emoji.
// Matching = emoji whose name starts with the level's letter.
// Non-matching = emoji starting with other letters.
//
// Example: Level 0 → "Starts with A" → 🍎 🐜 🚗
// Non-matching = 🐻 🍌 🐱 🦆

class GameGenerator_Phonics extends MAGameGenerator {
  constructor() {
    super();

    // Map of easy-to-recognize emoji by starting letter
    this.emojiByLetter = {
      A: ["🍎", "🐜", "🪓"],              // Apple, Ant, Ax
      B: ["🐻", "🍌", "🐝", "🚲", "📦"], // Bear, Banana, Bee, Bike, Box
      C: ["🐱", "🐄", "🌽", "🦀"], // Cat, Cow, Corn, Crab
      D: ["🦆", "🐶", "🐉"],        // Duck, Dog, Dragon
      E: ["🥚", "🐘"],              // Egg, Elephant
      F: ["🐸", "🐟", "🌸", "🔥"], // Frog, Fish, Flower, Fire
      G: ["🍇", "👻"],              // Grapes, Ghost
      H: ["🏠", "🐹", "🍯"],       // House, Hamster, Honey
      // I: could not find emoji that start with the phonics "i"
      J: ["🕹️", "🗾"],             // Joystick, Japan
      K: ["🔑", "🥝"],             // Key, Kiwi
      L: ["🍋", "🦁", "🦎"],       // Lemon, Lion, Lizard
      M: ["🐒", "🍄", "🌕"],      // Monkey, Mushroom, Moon
      N: ["👃", "🪹"],             // Nose, Nest
      O: ["🐙", "🫒"],             // Octopus, Olive
      P: ["🍍", "🐷", "🥞"],       // Pineapple, Pig, Pancake
      Q: ["👸", "❓"],             // Queen, Question
      R: ["🐀", "🌈", "🤖"],       // Rat, Rainbow, Robot
      S: ["🐍", "🌻", "☀️", "6️⃣"], // Snake, Sunflower, Sun
      T: ["🐯", "🌮", "🐢"],       // Tiger, Taco, Turtle
      U: ["☂️", "⬆️"],             // Umbrella, Up
      V: ["🎻", "🌋", "🚐"],       // Violin, Volcano, Van
      W: ["🐺", "🍉", "🚶"],       // Wolf, Watermelon, Walk
      // X has a different rule: ends with
      X: ["📦", "🪓", "6️⃣"],       // Box, Ax, Six
      Y: ["🧶", "☯️"],             // Yarn, Yinyang
      Z: ["🦓", "0️⃣"],             // Zebra, Zero
    };

    // Build an easy-access alphabet skipping empty sets
    this.availableLetters = Object.keys(this.emojiByLetter);

    this.lastSeenLevel = 10000000;
    this.cachedStartLevel = 0;
  }

  gameName() {
    return "Phonics Wolfer";
  }

  // Determine which letter this level corresponds to
  letterForLevel(level) {
    // Randomize start letter every new game
    if (level < this.lastSeenLevel) {
      this.cachedStartLevel = Math.floor(Math.random() * this.availableLetters.length);
      this.lastSeenLevel = level;
    }

    const index = (this.cachedStartLevel + level) % this.availableLetters.length;
    return this.availableLetters[index];
  }

  titleForLevel(level) {
    const letter = this.letterForLevel(level);
    if (letter === "X") {
      return `Ends with ${letter}${letter.toLowerCase()}`;
    }
    return `Starts with ${letter}${letter.toLowerCase()}`;
  }

  generateMatchingValuesForLevel(level) {
    const letter = this.letterForLevel(level);
    return this.emojiByLetter[letter];
  }

  generateNonMatchingValuesForLevel(level) {
    const letter = this.letterForLevel(level);
    // Flatten all emoji and remove the current letter's
    const allEmoji = Object.values(this.emojiByLetter).flat();
    const nonMatching = allEmoji.filter(e => !this.emojiByLetter[letter].includes(e));
    return nonMatching;
  }

  failureStringForValue(level, value) {
    const letter = this.letterForLevel(level);
    if (letter === "X") {
      return `${value} doesn’t end with ${letter}!`;
    }
    return `${value} doesn’t start with ${letter}!`;
  }

  // Since this is for little kids, always suppress HunterBot
  isHunterBotAvailableOnLevel(level) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameGenerator_Phonics };
}

if (typeof GameGenerators_classes !== 'undefined') {
  GameGenerators_classes["GameGenerator_Phonics"] = GameGenerator_Phonics;
}
