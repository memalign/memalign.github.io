
// Sort by display order on landing page

const GameGenerators = {
    "word": {
        className: "GameGenerator_Word",
        name: "Word Wolfer",
        shortName: "Word Wolfer",
        icon: "icon",
        iconColor: "#1D2B53",
        emoji: "🍰",
        description: "Grades 1-5. Learn to identify vowel sounds. Wolf down the words that match the vowel sound for each level. This game reinforces how to identify vowel sounds in monosyllabic words, apply phonics rules to determine vowel sounds, and recognize vowel sounds in words that break the rules.",
        displayOrder: 0,
    },

    "phonics": {
        className: "GameGenerator_Phonics",
        name: "Phonics Wolfer",
        shortName: "Phonics Wolfer",
        icon: "icon",
        iconColor: "#1D2B53",
        emoji: "🍎",
        description: "Grades: TK-K. Learn phonics by wolfing down images that start with the letter for each level. This game reinforces identification of the sound each letter most commonly makes.",
        displayOrder: 1,
    },

    "grammar": {
        className: "GameGenerator_Grammar",
        name: "Grammar Wolfer",
        shortName: "Grammar Wolfer",
        icon: "icon",
        iconColor: "#1D2B53",
        emoji: "📖",
        description: "Grades: 4-7. Learn to identify parts of speech, working from simpler to more advanced: nouns, verbs, adjectives, pronouns, adverbs, prepositions, interjections, and conjunctions.",
        displayOrder: 2,
    },

    "number1stgrade": {
        className: "GameGenerator_Number1stGrade",
        name: "Number Wolfer: 1st Grade",
        shortName: "Wolfer 1st",
        icon: "icon",
        iconColor: "#350C26",
        emoji: "1️⃣",
        description: "Grades: 1-2. Practice math skills: identify odds/evens, greater than/less than, single digit addition.",
        displayOrder: 3,
    },

    "number3rdgrade": {
        className: "GameGenerator_Number3rdGrade",
        name: "Number Wolfer: 3rd Grade",
        shortName: "Wolfer 3rd",
        icon: "icon",
        iconColor: "#350C26",
        emoji: "3️⃣",
        description: "Grades: 3-4. Identify multiples of numbers 1-12.",
        displayOrder: 4,
    },

    "spanishnouns": {
        className: "GameGenerator_SpanishNouns",
        name: "Spanish Wolfer: Nouns",
        shortName: "Wolfer ES N",
        icon: "icon",
        iconColor: "#095537",
        emoji: "🥘",
        description: "Spanish levels 1-2. Identify gender of over 500 common nouns, including irregular words.",
        displayOrder: 5,
    },

    "spanishverbs": {
        className: "GameGenerator_SpanishVerbs",
        name: "Spanish Wolfer: Verbs",
        shortName: "Wolfer ES V",
        icon: "icon",
        iconColor: "#095537",
        emoji: "💃",
        description: "Spanish levels 1-2. Match pronouns to conjugated verbs.",
        displayOrder: 6,
    },


    // User submissions:
    "dino": {
        className: "GameGenerator_Dinosaurs",
        name: "Dino Wolfer",
        shortName: "Dino Wolfer",
        icon: "icon",
        iconColor: "#7E2527",
        emoji: "🦖",
        description: "Identify dinosaurs by period, diet, and type!",
        submitter: "Emerson",
        displayOrder: 0,
    },

    "animals": {
        className: "GameGenerator_Animals",
        name: "Animal Wolfer",
        shortName: "Animal Wolfer",
        icon: "icon",
        iconColor: "#7E2527",
        emoji: "🐁",
        description: "Identify birds, insects, animals with fur, etc.",
        submitter: "anonymous",
        displayOrder: 1,
    },

    "morsecode": {
        className: "GameGenerator_MorseCode",
        name: "Morse Code Wolfer",
        shortName: "Morse Wolfer",
        icon: "icon",
        iconColor: "#303030",
        emoji: "💬",
        description: "Practice Morse Code.",
        submitter: "anonymous",
        displayOrder: 2,
    },

    "pokeprescription": {
        className: "GameGenerator_PokePrescription",
        name: "Wolfer: PokéPrescription",
        shortName: "Poké Wolfer",
        icon: "icon",
        iconColor: "#F58FAD",
        emoji: "💊",
        description: "Is it a Pokémon or a prescription medication?",
        submitter: "anonymous",
        displayOrder: 3,
    },
};

function GameGeneratorIconURLForGameName(gameName, scale=1) {
  const game = GameGenerators[gameName];
  let iconURL = game.icon;
  if (!iconURL.includes(".")) {
    const iconPCEImage = PCEImageLibrary.pceImageForNameWithBackgroundColor(iconURL, game.iconColor);
    const scaleFactor = scale;
    if (game.emoji) {
      iconURL = iconPCEImage.generatePNGWithText(scaleFactor*10, game.emoji, scaleFactor*215, scaleFactor*245, scaleFactor*80)
    } else {
      iconURL = iconPCEImage.generatePNG(scaleFactor*10);
    }
  }
  return iconURL;
}

// Will be updated dynamically by GameGenerator files
const GameGenerators_classes = { };
