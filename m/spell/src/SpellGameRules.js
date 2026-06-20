const LETTER_VALUES = {
  A: 1, B: 4, C: 3, D: 2, E: 1, F: 3, G: 3, H: 2, I: 1, J: 8, K: 4, L: 2, M: 3,
  N: 1, O: 1, P: 3, Q: 9, R: 1, S: 1, T: 1, U: 1, V: 5, W: 3, X: 8, Y: 4, Z: 9
};

const LETTER_WEIGHTS = {
  E: 12, A: 9, I: 9, O: 8, N: 6, R: 6, T: 6, L: 4, S: 4, U: 4, D: 4, G: 3, H: 3,
  C: 3, M: 3, P: 3, F: 2, W: 2, Y: 2, B: 2, K: 1, V: 1, J: 1, X: 1, Q: 1, Z: 1
};

const LENGTH_BONUSES = { 5: 5, 6: 12, 7: 21 };
const ROUND_SECONDS = 120;
const KID_MODE_SECONDS = 300;
const TILE_TARGET = 7;
const MULTIPLIER_INTERVAL = 25;
const QUOTE_QUEST_DESCRIPTION = "Spell the quote word-by-word";

const RPG_ENEMIES = [
  { id: "bee", name: "Buzzing Bee", sprite: "🐝", prefixes: ["Brawling", "Brutal", "Beastly", "Baneful"] },
  { id: "spider", name: "Creepy Crawler", sprite: "🕷️", prefixes: ["Cruel", "Crazed", "Cursed", "Calamitous"] },
  { id: "rat", name: "Ravenous Rat", sprite: "🐀", prefixes: ["Raging", "Rabid", "Ruthless", "Ruinous"] },
  { id: "monkey", name: "Malicious Monkey", sprite: "🐒", prefixes: ["Maniacal", "Monstrous", "Murderous", "Malevolent"] },
  { id: "dragon", name: "Dangerous Dragon", sprite: "🐉", prefixes: ["Deadly", "Demonic", "Destructive", "Diabolical"] }
];

function getEnemyByIndex(index) {
  const baseIndex = index % RPG_ENEMIES.length;
  const cycle = Math.floor(index / RPG_ENEMIES.length);
  const baseEnemy = RPG_ENEMIES[baseIndex];
  let prefix = "";
  if (cycle > 0) {
    const prefixIndex = Math.min(cycle - 1, baseEnemy.prefixes.length - 1);
    prefix = baseEnemy.prefixes[prefixIndex] + " ";
  }
  return {
    id: baseEnemy.id,
    name: prefix + baseEnemy.name,
    hp: 100 * Math.pow(2, index),
    sprite: baseEnemy.sprite,
    baseName: baseEnemy.name
  };
}

const QUOTE_QUEST_QUOTES = [
  "Grow each day",
  "Learn by doing",
  "Heed the call",
  "Small steps win",
  "Pain can teach",
  "Keep your cool",
  "Fear no loss",
  "Mind your time",
  "You can win",
  "Joy will come",
  "You are strong",
  "Time will tell",
  "Truth does win",
  "Trust your gut",
  "Think then act",
  "Seek the truth",
  "Build your way",
  "Let hope lead you when days feel dark",
  "Faster yields more",
  "Stay in flow",
  "Almost final step",
  "Nearly done",
  "Second to last",
  "Quest passed. Zero quotes remain. Stick around anyway."
];

function buildLetterPool(weights) {
  const pool = [];
  for (const [letter, weight] of Object.entries(weights)) {
    for (let i = 0; i < weight; i += 1) {
      pool.push(letter);
    }
  }
  return pool;
}

function createLexiconSet(text) {
  return new Set(
    text
      .split(/\r?\n/)
      .map((line) => line.trim().toUpperCase())
      .filter(Boolean)
  );
}

function computeWord(tiles) {
  return tiles.map((tile) => tile.letter).join("");
}

function scoreWordValue(tiles) {
  const base = tiles.reduce((sum, tile) => sum + LETTER_VALUES[tile.letter], 0);
  const bonus = LENGTH_BONUSES[tiles.length] || 0;
  const multiplierCount = tiles.filter((tile) => tile.multiplier).length;
  return (base + bonus) * (2 ** multiplierCount);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function quoteWords(quote) {
  return quote
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z]/g, "").toUpperCase())
    .filter(Boolean);
}

function normalizeQuestWord(word) {
  return String(word).replace(/[^A-Za-z]/g, "").toUpperCase();
}

const LETTER_POOL = buildLetterPool(LETTER_WEIGHTS);

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LETTER_VALUES,
    LETTER_WEIGHTS,
    LENGTH_BONUSES,
    ROUND_SECONDS,
    KID_MODE_SECONDS,
    TILE_TARGET,
    MULTIPLIER_INTERVAL,
    LETTER_POOL,
    buildLetterPool,
    createLexiconSet,
    computeWord,
    scoreWordValue,
    formatTime,
    QUOTE_QUEST_DESCRIPTION,
    QUOTE_QUEST_QUOTES,
    RPG_ENEMIES,
    getEnemyByIndex,
    quoteWords,
    normalizeQuestWord
  };
}
