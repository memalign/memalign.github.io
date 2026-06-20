if (typeof module !== "undefined" && module.exports) {
  ({ MAGameRand } = require("./GameRand.js"));
  ({ pLog } = require("./Utilities.js"));
  ({
    LETTER_VALUES,
    LETTER_POOL,
    ROUND_SECONDS,
    KID_MODE_SECONDS,
    TILE_TARGET,
    MULTIPLIER_INTERVAL,
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
  } = require("./SpellGameRules.js"));
  ({
    ACTIVE_REPLENISH_ALGORITHM,
    createReplenisher,
    KidModeReplenisher
  } = require("./LetterReplenisher.js"));
  ({ maStorage } = require("./MAStorage.js"));
}

const STORAGE_KEYS = {
  highScore: "spell-high-score",
  uniqueWords: "spell-unique-words",
  lifetimeLetters: "spell-lifetime-letters",
  quoteIndex: "spell-quote-index",
  quoteWordIndex: "spell-quote-word-index",
  completedQuotes: "spell-completed-quotes",
  enemyIndex: "spell-enemy-index",
  enemyHp: "spell-enemy-hp",
  defeatedEnemies: "spell-defeated-enemies"
};

function maybeRandomSeed() {
  return Math.floor(Math.random() * 0x7fffffff);
}

class SpellGame {
  constructor(options = {}) {
    this.document = options.document || (typeof maDocument !== "undefined" ? maDocument : null);
    this.window = options.window || (typeof window !== "undefined" ? window : null);
    this.storage = options.storage !== undefined
      ? options.storage
      : (typeof maStorage !== "undefined" ? maStorage : (typeof localStorage !== "undefined" ? localStorage : null));
    this.fetchFn = Object.prototype.hasOwnProperty.call(options, "fetchFn")
      ? options.fetchFn
      : (typeof fetch !== "undefined" ? fetch.bind(globalThis) : null);
    this.createSeed = options.createSeed || maybeRandomSeed;
    this.lexiconPath = options.lexiconPath || "lexicon.txt";
    this.timerApi = options.timerApi || {
      setInterval: (fn, ms) => this.window ? this.window.setInterval(fn, ms) : null,
      clearInterval: (id) => { if (this.window && id !== null) { this.window.clearInterval(id); } },
      setTimeout: (fn, ms) => this.window ? this.window.setTimeout(fn, ms) : null,
      clearTimeout: (id) => { if (this.window && id !== null) { this.window.clearTimeout(id); } }
    };
    this.requestFrame = options.requestFrame
      || (this.window && this.window.requestAnimationFrame
        ? this.window.requestAnimationFrame.bind(this.window)
        : (fn) => fn());
    this.performanceNow = options.performanceNow
      || (typeof performance !== "undefined" && performance.now
        ? () => performance.now()
        : () => Date.now());

    this.elements = {};
    this.uiBuilt = false;
    this.eventsBound = false;
    this.letterPool = LETTER_POOL.slice();
    this.boundHandleKeyDown = (event) => this.handleKeyDown(event);
    this.boundOnDragMove = (event) => this.onDragMove(event);
    this.boundEndDrag = (event) => this.endDrag(event);
    this.state = this.createEmptyState();
  }

  createEmptyState() {
    let enemyIndex = this.readNumber(STORAGE_KEYS.enemyIndex);
    const rawHp = this.storage && this.storage.getItem ? this.storage.getItem(STORAGE_KEYS.enemyHp) : null;
    let enemyHp;
    if (rawHp === null) {
      enemyHp = getEnemyByIndex(enemyIndex).hp;
    } else {
      enemyHp = Number(rawHp);
    }
    return {
      enemyIndex,
      enemyHp,
      enemyDefeatedThisRound: false,
      lexicon: new Set(),
      lexiconReady: false,
      trayTiles: [],
      wordTiles: [],
      score: 0,
      bestWord: null,
      tilesScored: 0,
      needsMultiplier: false,
      secondsLeft: ROUND_SECONDS,
      timerId: null,
      toastTimerId: null,
      roundActive: false,
      drag: null,
      dropAnimation: null,
      tileIdCounter: 1,
      randomSeed: null,
      rand: null,
      suppressClickUntil: 0,
      completedQuoteThisRound: null,
      toastQueue: [],
      pendingDamage: [],
      debug: {
        replenishQuoteWord: false,
        capEnemyHp: false,
        kidMode: false
      },
      view: "landing"
    };
  }

  init(options = {}) {
    this.ensureUI();
    this.cacheElements();
    this.bindEvents();

    if (options.lexiconText) {
      this.setLexiconText(options.lexiconText);
      this.showLandingPage();
      return Promise.resolve();
    }

    if (options.skipLexiconLoad) {
      this.showLandingPage();
      return Promise.resolve();
    }

    return this.loadLexicon().finally(() => {
      this.showLandingPage();
    });
  }

  ensureUI() {
    if (this.uiBuilt || !this.document) {
      return;
    }
    if (this.document.getElementById("timer")) {
      this.uiBuilt = true;
      return;
    }
    pLog.log(0);

    const body = this.document.body;
    const landing = this.createElement("section", { id: "landing-page", className: "landing-page" });
    body.appendChild(landing);

    const landingPanel = this.createElement("div", { className: "landing-panel" });
    landing.appendChild(landingPanel);
    const landingContent = this.createElement("div", { className: "landing-content" });
    landingContent.appendChild(this.createElement("h1", { id: "landing-title", text: "ScrivenSpell" }));
    landingContent.appendChild(this.createElement("p", { id: "landing-high-score", className: "landing-score", text: "High score: 0" }));

    const landingEnemyPanel = this.createElement("div", { className: "enemy-panel" });
    landingEnemyPanel.appendChild(this.createElement("div", { id: "landing-enemy-sprite", className: "enemy-sprite" }));
    const lHpBar = this.createElement("div", { className: "enemy-hp-bar" });
    lHpBar.appendChild(this.createElement("div", { id: "landing-enemy-hp-fill", className: "enemy-hp-fill" }));
    landingEnemyPanel.appendChild(lHpBar);
    landingEnemyPanel.appendChild(this.createElement("div", { id: "landing-enemy-hp-text", className: "enemy-hp-text" }));
    landingContent.appendChild(this.createElement("p", { id: "landing-tagline", className: "landing-tagline", text: "You are a wizard in training, sent to the majestic forest to clear it of evil. Are your spells powerful enough?" }));
    landingContent.appendChild(this.createElement("p", { id: "landing-enemy-title", className: "landing-enemy-title", text: "" }));
    landingContent.appendChild(landingEnemyPanel);

    landingContent.appendChild(this.createElement("div", { id: "landing-quote-quest", className: "quote-quest-panel" }));
    landingPanel.appendChild(landingContent);

    const landingActions = this.createElement("div", { className: "landing-actions" });
    landingPanel.appendChild(landingActions);
    landingActions.appendChild(this.createElement("button", {
      id: "start-game",
      className: "primary-button start-game-button",
      text: "Start Game",
      attrs: { type: "button" }
    }));
    landingActions.appendChild(this.createElement("button", {
      id: "stats-button",
      className: "icon-button",
      text: "Stats",
      attrs: { type: "button", "aria-label": "Show stats" }
    }));
    landingActions.appendChild(this.createElement("button", {
      id: "debug-button",
      className: "icon-button",
      text: "Debug",
      attrs: { type: "button", "aria-label": "Show debug settings" }
    }));
    landingActions.appendChild(this.createElement("a", {
      id: "about-link",
      className: "about-link",
      text: "About",
      attrs: { href: "https://memalign.github.io/p/spell.html" }
    }));

    const gameShell = this.createElement("main", { id: "game-shell", className: "game-shell" });
    this.addClass(gameShell, "hidden");
    body.appendChild(gameShell);

    const header = this.createElement("header", { className: "hud" });
    const timeCard = this.buildHudCard("Time", "timer", "2:00", false);
    this.addClass(timeCard, "time-card");
    timeCard.appendChild(this.createElement("button", {
      id: "give-up",
      className: "secondary-button give-up-button",
      text: "Give Up",
      attrs: { type: "button" }
    }));
    header.appendChild(timeCard);

    const titleBlock = this.createElement("div", { className: "title-block" });
    titleBlock.appendChild(this.createElement("h1", { text: "ScrivenSpell" }));
    titleBlock.appendChild(this.createElement("p", { text: "Build fast. Score bigger." }));
    header.appendChild(titleBlock);
    header.appendChild(this.buildHudCard("Score", "score", "0", true));

    const enemyPanel = this.createElement("div", { className: "enemy-panel" });
    enemyPanel.appendChild(this.createElement("div", { id: "enemy-sprite", className: "enemy-sprite" }));
    const eHpBar = this.createElement("div", { className: "enemy-hp-bar" });
    eHpBar.appendChild(this.createElement("div", { id: "enemy-hp-fill", className: "enemy-hp-fill" }));
    enemyPanel.appendChild(eHpBar);
    enemyPanel.appendChild(this.createElement("div", { id: "enemy-hp-text", className: "enemy-hp-text" }));

    const wordContainer = this.createElement("div", { className: "word-container" });
    const wordZone = this.createElement("div", { id: "word-zone", className: "word-zone" });
    wordZone.setAttribute("aria-live", "polite");
    wordContainer.appendChild(wordZone);

    const wordZoneHead = this.createElement("div", { className: "word-zone-head" });
    wordZone.appendChild(wordZoneHead);
    wordZoneHead.appendChild(this.createElement("span", { className: "word-zone-label", text: "Word Tray" }));
    wordZoneHead.appendChild(this.createElement("button", {
      id: "clear-word",
      className: "icon-button",
      text: "↺",
      attrs: { type: "button", "aria-label": "Clear current word" }
    }));

    wordZone.appendChild(this.createElement("button", {
      id: "score-word",
      className: "word-slot empty",
      attrs: { type: "button", "aria-label": "Current word" }
    }));

    const trayContainer = this.createElement("section", { className: "tray-panel" });
    const trayHead = this.createElement("div", { className: "tray-head" });
    trayContainer.appendChild(trayHead);
    trayHead.appendChild(this.createElement("span", { className: "tray-label", text: "Letter Tray" }));
    trayHead.appendChild(this.createElement("button", {
      id: "trash-letters",
      className: "icon-button trash-button",
      text: "🗑",
      attrs: { type: "button", "aria-label": "Dump and replace letters" }
    }));

    trayContainer.appendChild(this.createElement("div", {
      id: "letter-tray",
      className: "tile-row",
      attrs: { "aria-label": "Available letters" }
    }));

    gameShell.appendChild(header);
    gameShell.appendChild(enemyPanel);
    gameShell.appendChild(wordContainer);
    gameShell.appendChild(trayContainer);

    body.appendChild(this.createElement("div", {
      id: "drag-layer",
      className: "drag-layer",
      attrs: { "aria-hidden": "true" }
    }));

    const overlay = this.createElement("div", {
      id: "round-over",
      className: "overlay hidden",
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "round-over-title" }
    });
    body.appendChild(overlay);

    const overlayCard = this.createElement("div", { className: "overlay-card" });
    overlay.appendChild(overlayCard);
    overlayCard.appendChild(this.createElement("p", { className: "overlay-kicker", text: "Round Over" }));
    overlayCard.appendChild(this.createElement("h2", { id: "round-over-title", text: "Final Score" }));
    overlayCard.appendChild(this.createElement("p", { id: "final-score", className: "overlay-score", text: "0" }));
    overlayCard.appendChild(this.createElement("p", { id: "high-score-message", className: "overlay-message", text: "" }));
    overlayCard.appendChild(this.createElement("p", { id: "best-word", className: "overlay-detail", text: "" }));
    overlayCard.appendChild(this.createElement("p", { id: "round-over-unlock-message", className: "hidden", text: "" }));
    overlayCard.appendChild(this.createElement("p", { id: "round-over-quote-completion", className: "quote-completion-message hidden", text: "" }));
    overlayCard.appendChild(this.createElement("div", { id: "round-over-quote-quest", className: "quote-quest-panel overlay-quest" }));
    const overlayActions = this.createElement("div", { className: "overlay-actions" });
    overlayCard.appendChild(overlayActions);
    overlayActions.appendChild(this.createElement("button", {
      id: "play-again",
      className: "primary-button",
      text: "Play Again",
      attrs: { type: "button" }
    }));
    overlayActions.appendChild(this.createElement("button", {
      id: "exit-round",
      className: "secondary-button",
      text: "Exit",
      attrs: { type: "button" }
    }));

    const statsOverlay = this.createElement("div", {
      id: "stats-overlay",
      className: "overlay hidden",
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "stats-title" }
    });
    body.appendChild(statsOverlay);
    const statsCard = this.createElement("div", { className: "overlay-card stats-card" });
    statsOverlay.appendChild(statsCard);
    statsCard.appendChild(this.createElement("h2", { id: "stats-title", text: "Stats" }));
    statsCard.appendChild(this.createElement("h3", { text: "Lifetime Progress" }));
    statsCard.appendChild(this.createElement("div", { id: "stats-unique-words", className: "overlay-detail" }));
    statsCard.appendChild(this.createElement("div", { id: "stats-lifetime-letters", className: "overlay-detail" }));
    statsCard.appendChild(this.createElement("div", { id: "stats-game-progress", className: "overlay-detail" }));
    statsCard.appendChild(this.createElement("div", { id: "stats-completed-quotes", className: "completed-quotes" }));
    statsCard.appendChild(this.createElement("div", { id: "stats-defeated-enemies", className: "completed-quotes" }));
    statsCard.appendChild(this.createElement("button", {
      id: "reset-progress",
      className: "secondary-button danger-button",
      text: "Reset Progress",
      attrs: { type: "button" }
    }));
    statsCard.appendChild(this.createElement("button", {
      id: "close-stats",
      className: "primary-button",
      text: "Close",
      attrs: { type: "button" }
    }));

    const debugOverlay = this.createElement("div", {
      id: "debug-overlay",
      className: "overlay hidden",
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "debug-title" }
    });
    body.appendChild(debugOverlay);
    const debugCard = this.createElement("div", { className: "overlay-card debug-card" });
    debugOverlay.appendChild(debugCard);
    debugCard.appendChild(this.createElement("h2", { id: "debug-title", text: "Debug" }));
    const debugLabel = this.createElement("label", { className: "debug-setting" });
    const debugInput = this.createElement("input", {
      id: "debug-replenish-quote-word",
      attrs: { type: "checkbox" }
    });
    debugLabel.appendChild(debugInput);
    debugLabel.appendChild(this.createElement("span", { text: "Replenish letters with quote word" }));
    debugCard.appendChild(debugLabel);
    const debugHpLabel = this.createElement("label", { className: "debug-setting" });
    const debugHpInput = this.createElement("input", {
      id: "debug-cap-enemy-hp",
      attrs: { type: "checkbox" }
    });
    debugHpLabel.appendChild(debugHpInput);
    debugHpLabel.appendChild(this.createElement("span", { text: "Cap enemies at 10 HP" }));
    debugCard.appendChild(debugHpLabel);
    const debugKidLabel = this.createElement("label", { className: "debug-setting" });
    const debugKidInput = this.createElement("input", {
      id: "debug-kid-mode",
      attrs: { type: "checkbox" }
    });
    debugKidLabel.appendChild(debugKidInput);
    debugKidLabel.appendChild(this.createElement("span", { text: "Kid Mode (simple words, 5-min rounds)" }));
    debugCard.appendChild(debugKidLabel);
    debugCard.appendChild(this.createElement("p", {
      className: "overlay-detail",
      text: "Debug settings reset when the page reloads."
    }));
    debugCard.appendChild(this.createElement("button", {
      id: "close-debug",
      className: "primary-button",
      text: "Close",
      attrs: { type: "button" }
    }));

    body.appendChild(this.createElement("div", {
      id: "toast",
      className: "toast toast-hidden",
      attrs: { role: "status", "aria-live": "polite" }
    }));

    this.uiBuilt = true;
  }

  buildHudCard(label, valueId, valueText, rightAlign) {
    const classes = rightAlign ? "hud-card hud-card-score" : "hud-card";
    const card = this.createElement("div", { className: classes });
    card.appendChild(this.createElement("span", { className: "hud-label", text: label }));
    card.appendChild(this.createElement("span", { id: valueId, className: "hud-value", text: valueText }));
    return card;
  }

  cacheElements() {
    this.elements = {
      timer: this.document.getElementById("timer"),
      score: this.document.getElementById("score"),
      scoreWord: this.document.getElementById("score-word"),
      gameShell: this.document.getElementById("game-shell"),
      clearWord: this.document.getElementById("clear-word"),
      letterTray: this.document.getElementById("letter-tray"),
      trashLetters: this.document.getElementById("trash-letters"),
      overlay: this.document.getElementById("round-over"),
      finalScore: this.document.getElementById("final-score"),
      highScoreMessage: this.document.getElementById("high-score-message"),
      bestWord: this.document.getElementById("best-word"),
      roundOverQuoteCompletion: this.document.getElementById("round-over-quote-completion"),
      landingPage: this.document.getElementById("landing-page"),
      landingHighScore: this.document.getElementById("landing-high-score"),
      landingQuoteQuest: this.document.getElementById("landing-quote-quest"),
      startGame: this.document.getElementById("start-game"),
      statsButton: this.document.getElementById("stats-button"),
      debugButton: this.document.getElementById("debug-button"),
      enemyPanel: this.document.getElementById("enemy-panel"),
      enemySprite: this.document.getElementById("enemy-sprite"),
      enemyHpFill: this.document.getElementById("enemy-hp-fill"),
      enemyHpText: this.document.getElementById("enemy-hp-text"),
      landingEnemySprite: this.document.getElementById("landing-enemy-sprite"),
      landingEnemyHpFill: this.document.getElementById("landing-enemy-hp-fill"),
      landingEnemyHpText: this.document.getElementById("landing-enemy-hp-text"),
      landingEnemyTitle: this.document.getElementById("landing-enemy-title"),
      statsOverlay: this.document.getElementById("stats-overlay"),
      statsUniqueWords: this.document.getElementById("stats-unique-words"),
      statsLifetimeLetters: this.document.getElementById("stats-lifetime-letters"),
      statsGameProgress: this.document.getElementById("stats-game-progress"),
      statsCompletedQuotes: this.document.getElementById("stats-completed-quotes"),
      statsDefeatedEnemies: this.document.getElementById("stats-defeated-enemies"),
      resetProgress: this.document.getElementById("reset-progress"),
      closeStats: this.document.getElementById("close-stats"),
      debugOverlay: this.document.getElementById("debug-overlay"),
      debugReplenishQuoteWord: this.document.getElementById("debug-replenish-quote-word"),
      debugCapEnemyHp: this.document.getElementById("debug-cap-enemy-hp"),
      debugKidMode: this.document.getElementById("debug-kid-mode"),
      closeDebug: this.document.getElementById("close-debug"),
      roundOverUnlockMessage: this.document.getElementById("round-over-unlock-message"),
      roundOverQuoteQuest: this.document.getElementById("round-over-quote-quest"),
      exitRound: this.document.getElementById("exit-round"),
      playAgain: this.document.getElementById("play-again"),
      giveUp: this.document.getElementById("give-up"),
      toast: this.document.getElementById("toast"),
      dragLayer: this.document.getElementById("drag-layer")
    };
  }

  bindEvents() {
    if (this.eventsBound) {
      return;
    }
    this.elements.clearWord.addEventListener("click", () => this.clearWordTray());
    this.elements.trashLetters.addEventListener("click", () => this.dumpLetters());
    this.elements.scoreWord.addEventListener("click", () => this.scoreCurrentWord());
    this.elements.scoreWord.addEventListener("pointerdown", (event) => {
      if (event.target === this.elements.scoreWord) {
        pLog.log(51);
        event.preventDefault();
        this.scoreCurrentWord();
      }
    });
    this.elements.giveUp.addEventListener("click", () => this.endRound());
    this.elements.startGame.addEventListener("click", () => this.startGame());
    this.elements.statsButton.addEventListener("click", () => this.showStatsPanel());
    this.elements.debugButton.addEventListener("click", () => this.showDebugPanel());
    this.elements.closeStats.addEventListener("click", () => this.hideStatsPanel());
    this.elements.closeDebug.addEventListener("click", () => this.hideDebugPanel());
    this.elements.statsOverlay.addEventListener("click", (e) => {
      if (e.target === this.elements.statsOverlay) {
        this.hideStatsPanel();
      }
    });
    this.elements.debugReplenishQuoteWord.addEventListener("change", () => {
      this.state.debug.replenishQuoteWord = !!this.elements.debugReplenishQuoteWord.checked;
      pLog.log(46);
    });
    this.elements.debugCapEnemyHp.addEventListener("change", () => {
      this.state.debug.capEnemyHp = !!this.elements.debugCapEnemyHp.checked;
      if (this.state.debug.capEnemyHp) {
        this.applyEnemyHpCap();
      }
      this.renderEnemy();
    });
    this.elements.debugKidMode.addEventListener("change", () => {
      this.state.debug.kidMode = !!this.elements.debugKidMode.checked;
      pLog.log(83);
    });
    this.elements.resetProgress.addEventListener("click", () => this.resetProgressWithConfirmation());
    this.elements.playAgain.addEventListener("click", () => {
      this.addClass(this.elements.overlay, "hidden");
      this.startGame();
    });
    this.elements.exitRound.addEventListener("click", () => {
      this.addClass(this.elements.overlay, "hidden");
      this.showLandingPage();
    });
    if (this.window && this.window.addEventListener) {
      this.window.addEventListener("keydown", this.boundHandleKeyDown);
    }
    this.eventsBound = true;
  }

  loadLexicon() {
    if (!this.fetchFn) {
      pLog.log(1);
      this.state.lexiconReady = false;
      return Promise.resolve();
    }

    const handleResponse = (response) => {
      if (!response || !response.ok) {
        pLog.log(2);
        throw new Error(`HTTP ${response ? response.status : "missing"}`);
      }
      const textResult = typeof response.text === "function" ? response.text() : "";
      if (textResult && typeof textResult.then === "function") {
        pLog.log(16);
        return textResult.then((text) => {
          this.setLexiconText(text);
          pLog.log(3);
        });
      }
      pLog.log(17);
      this.setLexiconText(textResult);
      pLog.log(42);
      return Promise.resolve();
    };

    try {
      const fetchResult = this.fetchFn(this.lexiconPath);
      if (fetchResult && typeof fetchResult.then === "function") {
        pLog.log(18);
        return fetchResult
          .then((response) => handleResponse(response))
          .catch(() => {
            pLog.log(20);
            this.state.lexiconReady = false;
          });
      }
      pLog.log(19);
      try {
        return handleResponse(fetchResult);
      } catch (error) {
        pLog.log(4);
        this.state.lexiconReady = false;
        return Promise.resolve();
      }
    } catch (error) {
      pLog.log(21);
      this.state.lexiconReady = false;
      return Promise.resolve();
    }
  }

  setLexiconText(text) {
    this.state.lexicon = createLexiconSet(text);
    this.state.lexiconReady = true;
  }

  startGame(seed) {
    const savedLexicon = this.state.lexicon;
    const savedLexiconReady = this.state.lexiconReady;
    const savedDebug = this.state.debug;
    this.clearTimer();
    const randomSeed = seed !== undefined ? seed : this.createSeed();
    this.state = this.createEmptyState();
    this.state.lexicon = savedLexicon;
    this.state.lexiconReady = savedLexiconReady;
    this.state.debug = savedDebug;
    this.applyEnemyHpCap();
    this.cleanupOrphans();
    this.state.randomSeed = randomSeed;
    this.state.rand = new MAGameRand(randomSeed);
    this.state.roundActive = true;
    this.state.view = "game";
    // Set round duration based on Kid Mode
    if (this.state.debug.kidMode) {
      this.state.secondsLeft = KID_MODE_SECONDS;
    }
    // Create the replenisher for this game
    const algorithm = this.state.debug.kidMode ? "kid_mode" : ACTIVE_REPLENISH_ALGORITHM;
    this.state.replenisher = createReplenisher(algorithm);
    this.state.replenisher.reset();
    this.addClass(this.elements.landingPage, "hidden");
    this.removeClass(this.elements.gameShell, "hidden");
    pLog.log(5);
    this.replenishTray();
    this.renderEnemy();
    this.render();
    this.tickTimer();
    if (this.timerApi.setInterval) {
      this.state.timerId = this.timerApi.setInterval(() => this.tickTimer(), 1000);
    }
  }

  clearTimer() {
    if (this.state.timerId !== null) {
      this.timerApi.clearInterval(this.state.timerId);
      this.state.timerId = null;
    }
  }

  createTile(letter, multiplier = false) {
    return {
      id: this.state.tileIdCounter++,
      letter,
      multiplier,
      justSpawned: true,
      trayIndex: null
    };
  }

  randomLetter() {
    const index = this.state.rand.randomIntBelow(this.letterPool.length);
    return this.letterPool[index];
  }

  _buildReplenishContext() {
    const progress = this.readQuoteProgress();
    const quote = QUOTE_QUEST_QUOTES[progress.quoteIndex];
    const defeatedEnemies = this.readJSON(STORAGE_KEYS.defeatedEnemies, []);
    const quoteQuestActive = defeatedEnemies.length > 0 && !!quote;
    let currentQuoteWord = null;
    if (quote) {
      currentQuoteWord = (quoteWords(quote)[progress.wordIndex] || "");
    }
    return {
      lexicon: this.state.lexicon,
      quoteQuestActive,
      currentQuoteWord
    };
  }

  nextReplenishLetter() {
    const ctx = this._buildReplenishContext();
    if (this.state.debug.replenishQuoteWord) {
      if (!this.state.quoteReplenisher) {
        this.state.quoteReplenisher = createReplenisher("quote_word");
      }
      return this.state.quoteReplenisher.nextLetter(this.state.rand, ctx);
    }
    if (!this.state.replenisher) {
      return this.randomLetter();
    }
    return this.state.replenisher.nextLetter(this.state.rand, ctx);
  }

  currentQuoteWordLetters() {
    const progress = this.readQuoteProgress();
    const quote = QUOTE_QUEST_QUOTES[progress.quoteIndex];
    if (!quote) {
      return [];
    }
    const word = quoteWords(quote)[progress.wordIndex] || "";
    return word.split("");
  }

  replenishTray() {
    const replenisher = this.state.replenisher;
    // Kid Mode: compute letters to inject before filling slots
    if (replenisher && replenisher instanceof KidModeReplenisher && !this.state.debug.replenishQuoteWord) {
      replenisher.computeInjectedLetters(this.state.rand, this.state.trayTiles, TILE_TARGET);
    }
    for (let i = 0; i < TILE_TARGET; i++) {
      if (!this.state.trayTiles[i]) {
        const tile = this.createTile(this.nextReplenishLetter(), this.state.needsMultiplier);
        tile.trayIndex = i;
        if (tile.multiplier) {
          pLog.log(6);
        }
        this.state.needsMultiplier = false;
        this.state.trayTiles[i] = tile;
      }
    }
  }

  computeWord() {
    return computeWord(this.state.wordTiles);
  }

  isValidWord(word) {
    const result = this.state.lexiconReady && this.state.lexicon.has(word);
    if (result) {
      pLog.log(7);
    }
    return result;
  }

  awardMultiplierIfNeeded() {
    if (this.state.tilesScored > 0 && this.state.tilesScored % MULTIPLIER_INTERVAL === 0) {
      pLog.log(8);
      this.state.needsMultiplier = true;
    }
  }

  scoreCurrentWord() {
    if (!this.state.roundActive || this.state.drag) {
      pLog.log(9);
      return false;
    }
    const word = this.computeWord();
    if (!this.isValidWord(word) || this.state.wordTiles.length === 0) {
      pLog.log(10);
      return false;
    }

    const scoredTiles = this.state.wordTiles.slice();
    const wordScore = scoreWordValue(scoredTiles);
    this.state.score += wordScore;
    this.recordScoredWord(word, scoredTiles.length);
    this.updateQuoteQuestForScoredWord(word);
    if (!this.state.bestWord || wordScore > this.state.bestWord.score) {
      this.state.bestWord = { word, score: wordScore };
    }

    this.state.tilesScored += scoredTiles.length;
    this.awardMultiplierIfNeeded();

    // Animate scored word before clearing from DOM
    this.animateScoredWord(scoredTiles, wordScore);

    this.state.wordTiles = [];
    this.replenishTray();
    this.render();

    const tileCount = scoredTiles.length;
    const flyDuration = 420 + (tileCount - 1) * 20; // matches CSS flyToEnemy duration + stagger
    if (this.timerApi.setTimeout) {
      const timeoutId = this.timerApi.setTimeout(() => {
        this.state.pendingDamage = this.state.pendingDamage.filter((p) => p.id !== timeoutId);
        this.damageEnemy(wordScore);
        pLog.log(87);
      }, flyDuration);
      this.state.pendingDamage.push({ id: timeoutId, damage: wordScore });
    } else {
      this.damageEnemy(wordScore);
      pLog.log(88);
    }
    pLog.log(11);
    return true;
  }

  clearWordTray() {
    if (!this.state.roundActive || this.state.wordTiles.length === 0) {
      pLog.log(12);
      return false;
    }
    for (const tile of this.state.wordTiles) {
      this.placeTileInTray(tile);
    }
    this.state.wordTiles = [];
    this.render();
    return true;
  }

  dumpLetters() {
    if (!this.state.roundActive || this.state.trayTiles.length === 0 || this.state.wordTiles.length > 0 || this.state.drag) {
      pLog.log(13);
      return false;
    }
    this.addClass(this.elements.letterTray, "dumping");
    const currentTiles = this.getRenderedTiles(this.elements.letterTray);
    currentTiles.forEach((tileNode, index) => {
      tileNode.style.animationDelay = `${index * 40}ms`;
    });
    this.timerApi.setTimeout(() => {
      this.state.trayTiles = [];
      this.replenishTray();
      this.removeClass(this.elements.letterTray, "dumping");
      this.render();
    }, 2000);
    return true;
  }

  moveTile(from, to, tileId, targetIndex = to.length) {
    const index = from.findIndex((tile) => tile && tile.id === tileId);
    if (index === -1) {
      pLog.log(58);
      return false;
    }
    const tile = from[index];
    if (from === this.state.trayTiles) {
      from[index] = null;
      tile.trayIndex = index;
    } else {
      from.splice(index, 1);
    }
    if (to === this.state.trayTiles) {
      this.placeTileInTray(tile, targetIndex);
      pLog.log(64);
      return true;
    }
    to.splice(targetIndex, 0, tile);
    pLog.log(59);
    return true;
  }

  appendFirstMatchingLetter(letter) {
    const match = this.state.trayTiles.find((tile) => tile && tile.letter === letter.toUpperCase());
    if (!match) {
      pLog.log(14);
      return false;
    }
    this.moveTile(this.state.trayTiles, this.state.wordTiles, match.id);
    this.render();
    pLog.log(60);
    return true;
  }

  popLastWordTile() {
    if (this.state.wordTiles.length === 0) {
      return false;
    }
    const tile = this.state.wordTiles.pop();
    this.placeTileInTray(tile);
    this.render();
    return true;
  }

  placeTileInTray(tile, preferredIndex = tile ? tile.trayIndex : null) {
    if (!tile) {
      return false;
    }
    let index = Number.isInteger(preferredIndex) && preferredIndex >= 0 && preferredIndex < TILE_TARGET
      ? preferredIndex
      : -1;
    if (index !== -1 && this.state.trayTiles[index]) {
      const emptyIndex = this.state.trayTiles.findIndex(t => !t);
      if (emptyIndex !== -1) {
        const occupant = this.state.trayTiles[index];
        this.state.trayTiles[emptyIndex] = occupant;
        occupant.trayIndex = emptyIndex;
        pLog.log(89);
      }
    }
    if (index === -1) {
      index = this.state.trayTiles.findIndex(t => !t);
    }
    if (index === -1) {
      index = this.state.trayTiles.length;
    }
    this.state.trayTiles[index] = tile;
    tile.trayIndex = index;
    return true;
  }

  handleKeyDown(event) {
    if (!this.state.roundActive || this.state.drag || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return false;
    }
    const key = event.key;
    if (/^[a-zA-Z]$/.test(key)) {
      event.preventDefault();
      return this.appendFirstMatchingLetter(key);
    }
    if (key === "Backspace") {
      event.preventDefault();
      return this.popLastWordTile();
    }
    if (key === "Enter") {
      event.preventDefault();
      return this.scoreCurrentWord();
    }
    return false;
  }

  tickTimer() {
    this.elements.timer.textContent = formatTime(this.state.secondsLeft);
    if (this.state.secondsLeft <= 0) {
      pLog.log(15);
      this.endRound();
      return;
    }
    this.state.secondsLeft -= 1;
  }

  cleanupOrphans() {
    if (!this.document || !this.document.querySelectorAll) return;
    const orphans = this.document.querySelectorAll('.floating-letter, .dragging');
    if (orphans.length > 0) {
      pLog.log(53);
    }
    for (let i = 0; i < orphans.length; i++) {
      if (orphans[i] && orphans[i].remove) orphans[i].remove();
    }
  }

  endRound() {
    if (!this.state.roundActive) {
      return;
    }
    if (this.state.drag) {
      this.finishActiveDragBeforeRoundEnd();
      pLog.log(48);
    }
    // Flush any pending damage from flying tiles
    if (this.state.pendingDamage && this.state.pendingDamage.length > 0) {
      for (const pending of this.state.pendingDamage) {
        if (this.timerApi.clearTimeout) {
          this.timerApi.clearTimeout(pending.id);
        }
        this.damageEnemy(pending.damage);
        pLog.log(90);
      }
      this.state.pendingDamage = [];
    }
    this.state.roundActive = false;
    this.cleanupOrphans();
    this.clearTimer();
    const savedHighScore = this.readHighScore();
    const isNewHighScore = this.state.score > savedHighScore;
    if (isNewHighScore) {
      this.writeHighScore(this.state.score);
    }

    if (this.state.enemyHp <= 0 && this.state.enemyDefeatedThisRound) {
      let nextIndex = this.state.enemyIndex + 1;
      let nextHp = getEnemyByIndex(nextIndex).hp;
      if (this.state.debug.capEnemyHp) {
        nextHp = 10;
        pLog.log(63);
      }
      this.writeNumber(STORAGE_KEYS.enemyIndex, nextIndex);
      this.writeNumber(STORAGE_KEYS.enemyHp, nextHp);
      this.state.enemyIndex = nextIndex;
      this.state.enemyHp = nextHp;
    }
    this.elements.finalScore.textContent = String(this.state.score);
    if (isNewHighScore) {
      this.elements.highScoreMessage.textContent = "New high score!";
      this.addClass(this.elements.highScoreMessage, "new-high-score");
    } else {
      this.elements.highScoreMessage.textContent = `High score: ${Math.max(savedHighScore, this.state.score)}`;
      this.removeClass(this.elements.highScoreMessage, "new-high-score");
    }
    if (this.state.unlockedQuoteQuestThisRound) {
      this.elements.roundOverUnlockMessage.textContent = "Unlocked Quote Quest!";
      this.removeClass(this.elements.roundOverUnlockMessage, "hidden");
      this.addClass(this.elements.roundOverUnlockMessage, "new-high-score");
      pLog.log(91);
    } else {
      this.addClass(this.elements.roundOverUnlockMessage, "hidden");
    }
    this.elements.bestWord.textContent = this.state.bestWord
      ? `Best word: ${this.state.bestWord.word} for ${this.state.bestWord.score}`
      : "No scored words this round.";
    this.renderRoundOverQuoteCompletion();
    this.renderQuoteQuest(this.elements.roundOverQuoteQuest);
    this.removeClass(this.elements.overlay, "hidden");
  }

  renderRoundOverQuoteCompletion() {
    if (!this.state.completedQuoteThisRound) {
      this.elements.roundOverQuoteCompletion.textContent = "";
      this.addClass(this.elements.roundOverQuoteCompletion, "hidden");
      return;
    }
    this.elements.roundOverQuoteCompletion.textContent = `Completed this round: “${this.state.completedQuoteThisRound}”`;
    this.removeClass(this.elements.roundOverQuoteCompletion, "hidden");
  }

  readHighScore() {
    if (!this.storage || !this.storage.getItem) {
      return 0;
    }
    return Number(this.storage.getItem("spell-high-score") || "0");
  }

  writeHighScore(value) {
    if (this.storage && this.storage.setItem) {
      this.storage.setItem("spell-high-score", String(value));
    }
  }

  showLandingPage() {
    this.state.view = "landing";
    this.clearTimer();
    this.state.roundActive = false;
    this.addClass(this.elements.gameShell, "hidden");
    this.addClass(this.elements.overlay, "hidden");
    this.removeClass(this.elements.landingPage, "hidden");
    this.renderLandingPage();
    pLog.log(29);
  }

  renderEnemy() {
    const enemyInfo = getEnemyByIndex(this.state.enemyIndex);
    const maxHp = enemyInfo.hp;
    const isDefeated = this.state.enemyHp <= 0;
    const hpDisplay = Math.max(0, this.state.enemyHp);
    const hpText = `${hpDisplay} / ${maxHp}`;
    const hpPercent = Math.max(0, (this.state.enemyHp / maxHp) * 100);

    if (this.elements.enemySprite) {
      this.elements.enemySprite.textContent = enemyInfo.sprite;
      if (isDefeated) {
        this.addClass(this.elements.enemySprite, "enemy-squished");
      } else {
        this.removeClass(this.elements.enemySprite, "enemy-squished");
      }
      this.elements.enemyHpText.textContent = hpText;
      this.elements.enemyHpFill.style.width = `${hpPercent}%`;
    }

    if (this.elements.landingEnemySprite) {
      this.elements.landingEnemySprite.textContent = enemyInfo.sprite;
      if (isDefeated) {
        this.addClass(this.elements.landingEnemySprite, "enemy-squished");
      } else {
        this.removeClass(this.elements.landingEnemySprite, "enemy-squished");
      }
      this.elements.landingEnemyHpText.textContent = hpText;
      this.elements.landingEnemyHpFill.style.width = `${hpPercent}%`;
    }

    if (this.elements.landingEnemyTitle) {
      this.elements.landingEnemyTitle.textContent = `${enemyInfo.name} is attacking!`;
    }
    pLog.log(55);
  }

  applyEnemyHpCap() {
    if (!this.state.debug.capEnemyHp || this.state.enemyHp <= 10) {
      return false;
    }
    this.state.enemyHp = 10;
    this.writeNumber(STORAGE_KEYS.enemyHp, this.state.enemyHp);
    pLog.log(62);
    return true;
  }

  damageEnemy(damage) {
    if (this.state.enemyDefeatedThisRound || this.state.enemyHp <= 0) {
      return;
    }
    this.state.enemyHp -= damage;
    this.writeNumber(STORAGE_KEYS.enemyHp, this.state.enemyHp);
    if (this.state.enemyHp <= 0) {
      this.state.enemyDefeatedThisRound = true;
      const enemyInfo = getEnemyByIndex(this.state.enemyIndex);
      const defeatedList = this.readJSON(STORAGE_KEYS.defeatedEnemies, []);
      defeatedList.push(enemyInfo.id);
      this.writeJSON(STORAGE_KEYS.defeatedEnemies, defeatedList);
      this.showToast(`You defeated ${enemyInfo.name}!`);
      if (defeatedList.length === 1) {
        this.showToast("Unlocked: Quote Quest!");
        this.state.unlockedQuoteQuestThisRound = true;
      }
      pLog.log(56);
    } else {
      pLog.log(57);
    }
    this.renderEnemy();
    this.animateEnemyHit();
  }

  animateEnemyHit() {
    if (!this.elements.enemySprite) {
      return;
    }
    this.addClass(this.elements.enemySprite, "enemy-hit");
    if (this.timerApi.setTimeout) {
      this.timerApi.setTimeout(() => {
        this.removeClass(this.elements.enemySprite, "enemy-hit");
      }, 150);
    }
  }

  renderLandingPage() {
    this.elements.landingHighScore.textContent = `High score: ${this.readHighScore()}`;
    this.renderEnemy();
    this.renderQuoteQuest(this.elements.landingQuoteQuest);
  }

  showStatsPanel() {
    this.renderStatsPanel();
    this.removeClass(this.elements.statsOverlay, "hidden");
    pLog.log(30);
  }

  hideStatsPanel() {
    this.addClass(this.elements.statsOverlay, "hidden");
  }

  showDebugPanel() {
    this.elements.debugReplenishQuoteWord.checked = !!this.state.debug.replenishQuoteWord;
    this.elements.debugCapEnemyHp.checked = !!this.state.debug.capEnemyHp;
    this.elements.debugKidMode.checked = !!this.state.debug.kidMode;
    this.removeClass(this.elements.debugOverlay, "hidden");
    pLog.log(45);
  }

  hideDebugPanel() {
    this.addClass(this.elements.debugOverlay, "hidden");
  }

  renderStatsPanel() {
    const uniqueWords = this.readUniqueWords();
    const completedQuotes = this.readCompletedQuotes();
    const defeatedEnemies = this.readJSON(STORAGE_KEYS.defeatedEnemies, []);
    const uniqueEnemies = new Set(defeatedEnemies.map(e => {
      // Map old name format to ID if necessary
      const match = RPG_ENEMIES.find(r => r.name === e || r.id === e);
      return match ? match.id : e;
    }));
    const totalGoals = QUOTE_QUEST_QUOTES.length + RPG_ENEMIES.length;
    const progress = Math.floor(((completedQuotes.length + uniqueEnemies.size) / totalGoals) * 100);
    this.elements.statsUniqueWords.textContent = `Unique words: ${uniqueWords.length}`;
    this.elements.statsLifetimeLetters.textContent = `Letters scored: ${this.readNumber(STORAGE_KEYS.lifetimeLetters)}`;
    this.elements.statsGameProgress.textContent = `Game progress: ${progress}%`;
    this.clearChildren(this.elements.statsCompletedQuotes);
    this.elements.statsCompletedQuotes.appendChild(this.createElement("h3", { text: "Completed Quotes" }));
    if (completedQuotes.length === 0) {
      pLog.log(36);
      this.elements.statsCompletedQuotes.appendChild(this.createElement("p", { className: "overlay-detail", text: "None yet." }));
    } else {
      pLog.log(37);
      completedQuotes.forEach((q) => {
        this.elements.statsCompletedQuotes.appendChild(this.createElement("p", { className: "completed-quote-item", text: q }));
      });
    }

    this.clearChildren(this.elements.statsDefeatedEnemies);
    this.elements.statsDefeatedEnemies.appendChild(this.createElement("h3", { text: "Defeated Enemies" }));
    if (defeatedEnemies.length === 0) {
      this.elements.statsDefeatedEnemies.appendChild(this.createElement("p", { className: "overlay-detail", text: "None yet." }));
    } else {
      const counts = {};
      defeatedEnemies.forEach(e => {
        const match = RPG_ENEMIES.find(r => r.name === e || r.id === e);
        const id = match ? match.id : e;
        counts[id] = (counts[id] || 0) + 1;
      });
      for (const [id, count] of Object.entries(counts)) {
        const match = RPG_ENEMIES.find(r => r.id === id);
        const text = match ? `${match.sprite} x${count}` : `${id} x${count}`;
        this.elements.statsDefeatedEnemies.appendChild(this.createElement("p", { className: "overlay-detail", text }));
      }
    }
  }

  resetProgressWithConfirmation() {
    const confirmed = !this.window || !this.window.confirm || this.window.confirm("Are you sure you want to completely reset your lifetime progress?");
    if (!confirmed) {
      pLog.log(32);
      return false;
    }
    this.removeStorageItem(STORAGE_KEYS.totalTiles);
    this.removeStorageItem(STORAGE_KEYS.uniqueWords);
    this.removeStorageItem(STORAGE_KEYS.completedQuotes);
    this.removeStorageItem(STORAGE_KEYS.defeatedEnemies);
    this.removeStorageItem(STORAGE_KEYS.enemyIndex);
    this.removeStorageItem(STORAGE_KEYS.enemyHp);
    this.removeStorageItem("spell-high-score");
    this.state.enemyIndex = 0;
    this.state.enemyHp = getEnemyByIndex(0).hp;
    this.hideStatsPanel();
    this.showToast("Progress reset");
    this.renderEnemy();
    if (this.window && this.window.addEventListener) {
      this.window.addEventListener("keydown", this.boundHandleKeyDown);
    }
    if (this.elements.scoreWord && this.elements.scoreWord.focus) {
      this.elements.scoreWord.focus();
    }
    if (this.elements.highScoreMessage) {
      this.elements.highScoreMessage.textContent = "High score: 0";
    }
    if (this.elements.landingHighScore) {
      this.elements.landingHighScore.textContent = "High score: 0";
    }
    this.renderLandingPage();
    this.renderStatsPanel();
    pLog.log(31);
    return true;
  }

  recordScoredWord(word, letterCount) {
    pLog.log(38);
    const normalized = normalizeQuestWord(word);
    const uniqueWords = this.readUniqueWords();
    if (!uniqueWords.includes(normalized)) {
      uniqueWords.push(normalized);
      this.writeJSON(STORAGE_KEYS.uniqueWords, uniqueWords);
    }
    this.writeNumber(STORAGE_KEYS.lifetimeLetters, this.readNumber(STORAGE_KEYS.lifetimeLetters) + letterCount);
  }

  updateQuoteQuestForScoredWord(word) {
    const defeatedEnemies = this.readJSON(STORAGE_KEYS.defeatedEnemies, []);
    if (defeatedEnemies.length === 0) {
      pLog.log(61);
      return false;
    }
    const normalized = normalizeQuestWord(word);
    const progress = this.readQuoteProgress();
    const quote = QUOTE_QUEST_QUOTES[progress.quoteIndex];
    if (!quote) {
      return false;
    }
    const words = quoteWords(quote);
    if (normalized !== words[progress.wordIndex]) {
      return false;
    }
    progress.wordIndex += 1;
    pLog.log(33);
    if (progress.wordIndex >= words.length) {
      const completedQuotes = this.readCompletedQuotes();
      if (!completedQuotes.includes(quote)) {
        completedQuotes.push(quote);
        this.writeJSON(STORAGE_KEYS.completedQuotes, completedQuotes);
      }
      this.state.completedQuoteThisRound = quote;
      this.writeNumber(STORAGE_KEYS.quoteIndex, progress.quoteIndex + 1);
      this.writeNumber(STORAGE_KEYS.quoteWordIndex, 0);
      this.showToast(`Quote complete: “${quote}”`);
      pLog.log(34);
    } else {
      this.showToast(`Quote word spelled: ${word.toLowerCase()}`);
      pLog.log(43);
      this.writeNumber(STORAGE_KEYS.quoteIndex, progress.quoteIndex);
      this.writeNumber(STORAGE_KEYS.quoteWordIndex, progress.wordIndex);
    }
    return true;
  }

  readQuoteProgress() {
    return {
      quoteIndex: Math.min(this.readNumber(STORAGE_KEYS.quoteIndex), QUOTE_QUEST_QUOTES.length),
      wordIndex: this.readNumber(STORAGE_KEYS.quoteWordIndex)
    };
  }

  renderQuoteQuest(container) {
    this.clearChildren(container);
    const defeatedEnemies = this.readJSON(STORAGE_KEYS.defeatedEnemies, []);
    if (defeatedEnemies.length === 0) {
      this.addClass(container, "hidden");
      return;
    }
    this.removeClass(container, "hidden");
    container.appendChild(this.createElement("h3", { className: "quote-quest-title", text: "Quote Quest" }));
    container.appendChild(this.createElement("p", { className: "quote-quest-description", text: QUOTE_QUEST_DESCRIPTION }));
    const progress = this.readQuoteProgress();
    const quote = QUOTE_QUEST_QUOTES[progress.quoteIndex];
    if (!quote) {
      container.appendChild(this.createElement("p", { className: "quote-word pending-quote-word", text: "Quest complete" }));
      return;
    }
    const rawTokens = quote.split(/\s+/);
    const quoteLine = this.createElement("p", { className: "quote-line" });
    rawTokens.forEach((token, index) => {
      const container = this.createElement("span", { className: "quote-word" });
      let text = token;
      let className = "quote-word-text";
      if (index === progress.wordIndex) {
        className += " pending-quote-word";
      } else if (index > progress.wordIndex) {
        text = token.replace(/[A-Za-z]/g, "_");
        className += " hidden-quote-word";
      } else {
        className += " completed-quote-word";
      }

      if (index === 0) {
        container.appendChild(this.createElement("span", { className: "quote-mark", text: "“" }));
      }
      container.appendChild(this.createElement("span", { className, text }));
      if (index === rawTokens.length - 1) {
        container.appendChild(this.createElement("span", { className: "quote-mark", text: "”" }));
      }

      quoteLine.appendChild(container);
    });
    container.appendChild(quoteLine);
  }

  readUniqueWords() {
    return this.readJSON(STORAGE_KEYS.uniqueWords, []);
  }

  readCompletedQuotes() {
    return this.readJSON(STORAGE_KEYS.completedQuotes, []);
  }

  readJSON(key, fallback) {
    if (!this.storage || !this.storage.getItem) {
      pLog.log(39);
      return fallback.slice ? fallback.slice() : fallback;
    }
    try {
      const raw = this.storage.getItem(key);
      if (!raw) {
        pLog.log(40);
        return fallback.slice ? fallback.slice() : fallback;
      }
      const parsed = JSON.parse(raw);
      pLog.log(41);
      return parsed;
    } catch (error) {
      pLog.log(35);
      return fallback.slice ? fallback.slice() : fallback;
    }
  }

  writeJSON(key, value) {
    if (this.storage && this.storage.setItem) {
      this.storage.setItem(key, JSON.stringify(value));
    }
  }

  readNumber(key) {
    if (!this.storage || !this.storage.getItem) {
      return 0;
    }
    return Number(this.storage.getItem(key) || "0");
  }

  writeNumber(key, value) {
    if (this.storage && this.storage.setItem) {
      this.storage.setItem(key, String(value));
    }
  }

  showToast(message) {
    this.state.toastQueue.push(message);
    if (this.state.toastTimerId === null) {
      this.processToastQueue();
    }
  }

  processToastQueue() {
    if (this.state.toastQueue.length === 0) {
      this.addClass(this.elements.toast, "toast-hidden");
      this.state.toastTimerId = null;
      return;
    }
    const message = this.state.toastQueue.shift();
    this.elements.toast.textContent = message;
    this.removeClass(this.elements.toast, "toast-hidden");
    pLog.log(44);
    if (this.timerApi.setTimeout) {
      this.state.toastTimerId = this.timerApi.setTimeout(() => {
        this.addClass(this.elements.toast, "toast-hidden");
        if (this.timerApi.setTimeout) {
          this.state.toastTimerId = this.timerApi.setTimeout(() => this.processToastQueue(), 200);
        } else {
          this.processToastQueue();
        }
      }, 1800);
    }
  }

  clearToastTimer() {
    if (this.state.toastTimerId === null) {
      return;
    }
    if (this.timerApi.clearTimeout) {
      this.timerApi.clearTimeout(this.state.toastTimerId);
    } else if (this.timerApi.clearInterval) {
      this.timerApi.clearInterval(this.state.toastTimerId);
    }
    this.state.toastTimerId = null;
  }

  removeStorageItem(key) {
    if (this.storage && this.storage.removeItem) {
      this.storage.removeItem(key);
    } else if (this.storage && this.storage.values) {
      delete this.storage.values[key];
    }
  }

  render() {
    const previousRects = this.snapshotTileRects();
    if (this.state.dropAnimation) {
      previousRects.set(String(this.state.dropAnimation.tileId), {
        rect: this.state.dropAnimation.rect,
        isDrop: true
      });
      this.state.dropAnimation = null;
    }
    this.renderText(this.elements.score, String(this.state.score));
    this.renderZone(this.elements.letterTray, this.state.trayTiles, "tray");
    this.renderZone(this.elements.scoreWord, this.state.wordTiles, "word");
    const word = this.computeWord();
    const valid = this.isValidWord(word);
    this.toggleClass(this.elements.scoreWord, "valid", valid);
    this.toggleClass(this.elements.scoreWord, "ready", valid);
    this.toggleClass(this.elements.scoreWord, "empty", this.state.wordTiles.length === 0);
    this.elements.scoreWord.setAttribute("aria-label", word ? `Current word ${word}` : "Current word");
    this.elements.trashLetters.disabled = this.state.wordTiles.length > 0 || !this.state.roundActive || !!this.state.drag;
    this.playLayoutTransitions(previousRects);
    this.clearSpawnFlags();
  }

  renderZone(container, tiles, zoneName) {
    this.clearChildren(container);
    const nodes = [];
    for (let i = 0; i < tiles.length; i += 1) {
      if (tiles[i]) {
        nodes.push(this.renderTile(tiles[i], zoneName, i));
      } else {
        nodes.push(this.renderPlaceholder());
      }
    }
    if (zoneName !== "tray" && this.state.drag && this.state.drag.dragging && this.state.drag.hoverZone === zoneName && this.state.drag.hoverIndex >= 0) {
      const placeholder = this.renderPlaceholder();
      const insertIndex = Math.max(0, Math.min(this.state.drag.hoverIndex, nodes.length));
      nodes.splice(insertIndex, 0, placeholder);
    }
    for (const node of nodes) {
      container.appendChild(node);
    }
  }

  renderTile(tile, zoneName, index) {
    const tileNode = this.createElement("div", { className: "tile" });
    tileNode.setAttribute("data-id", String(tile.id));
    tileNode.setAttribute("data-zone", zoneName);
    tileNode.setAttribute("data-index", String(index));
    if (tile.multiplier) {
      this.addClass(tileNode, "multiplier");
    }
    if (tile.justSpawned) {
      this.addClass(tileNode, "tile-entering");
    }

    const letter = this.createElement("span", { className: "tile-letter", text: tile.letter });
    const score = this.createElement("span", { className: "tile-score", text: String(LETTER_VALUES[tile.letter]) });
    tileNode.appendChild(letter);
    tileNode.appendChild(score);

    if (tile.multiplier) {
      tileNode.appendChild(this.createElement("span", { className: "tile-bonus", text: "2x" }));
    }

    tileNode.addEventListener("click", () => this.handleTileClick(tile.id, zoneName));
    tileNode.addEventListener("pointerdown", (event) => this.beginPointerInteraction(event));
    return tileNode;
  }

  renderPlaceholder() {
    const placeholder = this.createElement("div", { className: "tile tile-placeholder" });
    placeholder.setAttribute("aria-hidden", "true");
    return placeholder;
  }

  handleTileClick(tileId, zoneName) {
    if (this.now() < this.state.suppressClickUntil) {
      if (zoneName !== "word") {
        return false;
      }
      pLog.log(49);
    }
    return this.handleTileTap(tileId, zoneName);
  }

  handleTileTap(tileId, zoneName) {
    if (this.state.drag) {
      return false;
    }
    if (zoneName === "tray") {
      this.moveTile(this.state.trayTiles, this.state.wordTiles, tileId);
      this.render();
      return true;
    }
    if (zoneName === "word") {
      return this.scoreCurrentWord();
    }
    return false;
  }

  beginPointerInteraction(event) {
    if (!this.state.roundActive) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    const tileNode = event.currentTarget;
    const tileId = Number(tileNode.dataset.id);
    const zoneName = tileNode.dataset.zone;
    const sourceTiles = zoneName === "tray" ? this.state.trayTiles : this.state.wordTiles;
    const sourceIndex = sourceTiles.findIndex((tile) => tile && tile.id === tileId);
    if (sourceIndex === -1) {
      return;
    }
    if (tileNode.setPointerCapture && event.pointerId !== undefined) {
      tileNode.setPointerCapture(event.pointerId);
    }

    const rect = tileNode.getBoundingClientRect();
    const pageX = event.pageX !== undefined ? event.pageX : event.clientX;
    const pageY = event.pageY !== undefined ? event.pageY : event.clientY;

    this.state.drag = {
      pointerId: event.pointerId,
      tileId,
      sourceZone: zoneName,
      sourceIndex,
      sourceNode: tileNode,
      tile: sourceTiles[sourceIndex],
      dragging: false,
      hoverZone: null,
      hoverIndex: -1,
      startedAt: this.now(),
      startX: event.clientX,
      startY: event.clientY,
      startPageX: pageX,
      startPageY: pageY,
      lastX: event.clientX,
      lastY: event.clientY,
      offsetX: pageX - (rect.left + this.scrollX()),
      offsetY: pageY - (rect.top + this.scrollY()),
      ghost: null
    };

    if (this.window && this.window.addEventListener) {
      this.window.addEventListener("pointermove", this.boundOnDragMove);
      this.window.addEventListener("pointerup", this.boundEndDrag);
      this.window.addEventListener("pointercancel", this.boundEndDrag);
    }
  }

  onDragMove(event) {
    if (!this.state.drag || event.pointerId !== this.state.drag.pointerId) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    const pageX = event.pageX !== undefined ? event.pageX : event.clientX;
    const pageY = event.pageY !== undefined ? event.pageY : event.clientY;
    if (!this.state.drag.dragging) {
      const dx = event.clientX - this.state.drag.startX;
      const dy = event.clientY - this.state.drag.startY;
      if (Math.hypot(dx, dy) <= 6) {
        return;
      }
      this.startDragVisual();
    }

    this.updateGhostPosition(pageX, pageY);
    const hit = this.resolveDropTarget(event.clientX, event.clientY);
    this.highlightZones(hit ? hit.zone : null);
    if (!hit) {
      if (this.state.drag.hoverZone !== null || this.state.drag.hoverIndex !== -1) {
        this.state.drag.hoverZone = null;
        this.state.drag.hoverIndex = -1;
        this.render();
      }
      return;
    }

    if (this.shouldUpdateHover(hit, event.clientX)) {
      this.state.drag.hoverZone = hit.zone;
      this.state.drag.hoverIndex = hit.index;
      this.state.drag.lastX = event.clientX;
      this.state.drag.lastY = event.clientY;
      this.render();
    }
  }

  startDragVisual() {
    const drag = this.state.drag;
    drag.dragging = true;
    const ghost = this.cloneTileNode(drag.sourceNode);
    this.removeClass(ghost, "drag-source");
    this.removeClass(ghost, "tile-entering");
    this.addClass(ghost, "dragging");
    ghost.style.width = `${drag.sourceNode.offsetWidth}px`;
    ghost.style.height = `${drag.sourceNode.offsetHeight}px`;
    this.document.body.appendChild(ghost);
    drag.ghost = ghost;
    this.addClass(drag.sourceNode, "drag-source");

    const sourceTiles = drag.sourceZone === "tray" ? this.state.trayTiles : this.state.wordTiles;
    if (drag.sourceZone === "tray") {
      sourceTiles[drag.sourceIndex] = null;
    } else {
      sourceTiles.splice(drag.sourceIndex, 1);
    }
    drag.hoverZone = drag.sourceZone;
    drag.hoverIndex = drag.sourceIndex;
    this.render();
    this.updateGhostPosition(drag.startPageX, drag.startPageY);
  }

  updateGhostPosition(pageX, pageY) {
    const drag = this.state.drag;
    if (!drag || !drag.ghost) {
      return;
    }
    drag.ghost.style.left = `${pageX - drag.offsetX}px`;
    drag.ghost.style.top = `${pageY - drag.offsetY}px`;
  }

  resolveDropTarget(clientX, clientY) {
    const zones = [
      { name: "word", element: this.elements.scoreWord, tiles: this.state.wordTiles },
      { name: "tray", element: this.elements.letterTray, tiles: this.state.trayTiles }
    ];

    for (const zone of zones) {
      const rect = zone.element.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        continue;
      }
      const tileNodes = this.getRenderedTiles(zone.element);
      let index = zone.tiles.length;
      for (let i = 0; i < tileNodes.length; i += 1) {
        const tileRect = tileNodes[i].getBoundingClientRect();
        if (clientX < tileRect.left + tileRect.width * 0.5) {
          pLog.log(52);
          index = i;
          break;
        }
      }
      return { zone: zone.name, index };
    }
    return null;
  }

  endDrag(event) {
    if (!this.state.drag || event.pointerId !== this.state.drag.pointerId) {
      return;
    }
    const dragSnapshot = { ...this.state.drag };
    if (!this.state.drag.dragging) {
      this.cleanupDrag();
      if (this.shouldFlickToTray(dragSnapshot, event)) {
        this.returnTileToTray(dragSnapshot.tileId);
      } else {
        this.handleTileTap(dragSnapshot.tileId, dragSnapshot.sourceZone);
      }
      return;
    }

    if (this.shouldFlickToTray(dragSnapshot, event)) {
      this.setDropAnimationFromGhost();
      this.moveDraggedTileToTray();
    } else if (this.state.drag.hoverZone) {
      this.setDropAnimationFromGhost();
      this.commitDraggedTile();
    } else {
      this.setDropAnimationFromGhost();
      this.restoreDraggedTile();
    }
    this.cleanupDrag();
  }

  setDropAnimationFromGhost() {
    if (!this.state.drag || !this.state.drag.ghost) {
      return;
    }
    this.state.dropAnimation = {
      tileId: this.state.drag.tileId,
      rect: this.state.drag.ghost.getBoundingClientRect()
    };
    pLog.log(50);
  }

  finishActiveDragBeforeRoundEnd() {
    if (!this.state.drag) {
      return;
    }
    if (this.state.drag.dragging) {
      this.restoreDraggedTile();
    }
    this.cleanupDrag();
  }

  cleanupDrag() {
    if (!this.state.drag) {
      return;
    }
    if (this.state.drag.sourceNode) {
      this.removeClass(this.state.drag.sourceNode, "drag-source");
    }
    if (this.state.drag.ghost) {
      this.state.drag.ghost.remove();
    }
    this.state.suppressClickUntil = this.now() + 250;
    this.state.drag = null;
    this.highlightZones(null);
    if (this.window && this.window.removeEventListener) {
      this.window.removeEventListener("pointermove", this.boundOnDragMove);
      this.window.removeEventListener("pointerup", this.boundEndDrag);
      this.window.removeEventListener("pointercancel", this.boundEndDrag);
    }
    this.render();
  }

  restoreDraggedTile() {
    const drag = this.state.drag;
    const sourceTiles = drag.sourceZone === "tray" ? this.state.trayTiles : this.state.wordTiles;
    if (drag.sourceZone === "tray") {
      this.placeTileInTray(drag.tile, drag.sourceIndex);
      return;
    }
    const insertIndex = Math.max(0, Math.min(drag.sourceIndex, sourceTiles.length));
    sourceTiles.splice(insertIndex, 0, drag.tile);
  }

  commitDraggedTile() {
    const drag = this.state.drag;
    const targetTiles = drag.hoverZone === "tray" ? this.state.trayTiles : this.state.wordTiles;
    const insertIndex = Math.max(0, Math.min(drag.hoverIndex, targetTiles.length));
    if (drag.hoverZone === "tray") {
      this.placeTileInTray(drag.tile, insertIndex);
      return;
    }
    targetTiles.splice(insertIndex, 0, drag.tile);
  }

  moveDraggedTileToTray() {
    this.placeTileInTray(this.state.drag.tile);
  }

  returnTileToTray(tileId) {
    const index = this.state.wordTiles.findIndex((tile) => tile && tile.id === tileId);
    if (index === -1) {
      return;
    }
    this.placeTileInTray(this.state.wordTiles.splice(index, 1)[0]);
    this.render();
  }

  shouldFlickToTray(dragSnapshot, event) {
    if (dragSnapshot.sourceZone !== "word") {
      return false;
    }
    const dx = event.clientX - dragSnapshot.startX;
    const dy = event.clientY - dragSnapshot.startY;
    const elapsed = this.now() - dragSnapshot.startedAt;
    return dy > 36 && dy > Math.abs(dx) * 1.2 && elapsed < 260;
  }

  shouldUpdateHover(hit, pointerX) {
    if (!this.state.drag) {
      return false;
    }
    if (this.state.drag.hoverZone !== hit.zone) {
      return true;
    }
    if (this.state.drag.hoverIndex === hit.index) {
      return false;
    }
    const direction = pointerX - this.state.drag.lastX;
    if (hit.index > this.state.drag.hoverIndex && direction <= 0) {
      return false;
    }
    if (hit.index < this.state.drag.hoverIndex && direction >= 0) {
      return false;
    }

    const hysteresis = 2;
    if (Math.abs(hit.index - this.state.drag.hoverIndex) === 1) {
      const boundary = this.getSlotBoundary(hit.zone, Math.min(hit.index, this.state.drag.hoverIndex));
      if (boundary !== null) {
        if (hit.index > this.state.drag.hoverIndex && pointerX < boundary + hysteresis) {
          return false;
        }
        if (hit.index < this.state.drag.hoverIndex && pointerX > boundary - hysteresis) {
          return false;
        }
      }
    }
    return true;
  }

  getSlotBoundary(zoneName, leftIndex) {
    const zoneElement = zoneName === "word" ? this.elements.scoreWord : this.elements.letterTray;
    const tileNodes = this.getRenderedTiles(zoneElement);
    if (leftIndex < 0 || leftIndex >= tileNodes.length) {
      return null;
    }
    const rect = tileNodes[leftIndex].getBoundingClientRect();
    return rect.left + rect.width / 2;
  }

  highlightZones(activeZone) {
    this.toggleClass(this.elements.scoreWord, "zone-hover", activeZone === "word");
    this.toggleClass(this.elements.letterTray, "zone-hover", activeZone === "tray");
  }

  animateScoredWord(scoredTiles) {
    const tileNodes = this.getRenderedTiles(this.elements.scoreWord);
    // Get enemy target position
    const enemySpriteEl = this.elements.enemySprite;
    const enemyRect = enemySpriteEl && enemySpriteEl.getBoundingClientRect
      ? enemySpriteEl.getBoundingClientRect()
      : null;

    tileNodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const ghost = this.cloneTileNode(node);
      this.addClass(ghost, "floating-letter");
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.position = "fixed";

      if (enemyRect) {
        const targetX = enemyRect.left + enemyRect.width / 2 - rect.left - rect.width / 2;
        const targetY = enemyRect.top + enemyRect.height / 2 - rect.top - rect.height / 2;
        if (ghost.style.setProperty) {
          ghost.style.setProperty("--fly-tx", `${targetX}px`);
          ghost.style.setProperty("--fly-ty", `${targetY}px`);
        }
        this.addClass(ghost, "tile-flying-to-enemy");
        ghost.style.animationDelay = `${index * 20}ms`;
      } else {
        const targetY = rect.top - 150;
        if (ghost.style.setProperty) {
          ghost.style.setProperty("--fly-tx", "0px");
          ghost.style.setProperty("--fly-ty", `${targetY - rect.top}px`);
        }
        this.addClass(ghost, "tile-flying-to-enemy");
        ghost.style.animationDelay = `${index * 20}ms`;
      }
      this.document.body.appendChild(ghost);
      if (ghost.addEventListener) {
        ghost.addEventListener("animationend", () => ghost.remove());
      }
    });
  }

  snapshotTileRects() {
    const rects = new Map();
    const zones = [this.elements.letterTray, this.elements.scoreWord];
    zones.forEach((zone) => {
      this.getRenderedTiles(zone).forEach((node) => {
        rects.set(node.dataset.id, { rect: node.getBoundingClientRect(), isDrop: false });
      });
    });
    return rects;
  }

  playLayoutTransitions(previousRects) {
    const zones = [this.elements.letterTray, this.elements.scoreWord];
    zones.forEach((zone) => {
      this.getRenderedTiles(zone).forEach((node) => {
        const previousData = previousRects.get(node.dataset.id);
        if (!previousData || this.hasClass(node, "tile-entering")) {
          return;
        }
        const previous = previousData.rect;
        const isDrop = previousData.isDrop;
        if (isDrop) {
          pLog.log(54);
        }
        const current = node.getBoundingClientRect();
        const dx = previous.left - current.left;
        const dy = previous.top - current.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && !isDrop) {
          return;
        }
        node.style.transition = "none";
        node.style.zIndex = "2500";
        node.style.transform = `translate(${dx}px, ${dy}px)${isDrop ? " rotate(-4deg) scale(1.06)" : ""}`;
        this.requestFrame(() => {
          node.style.transition = "transform 220ms cubic-bezier(.2, .8, .2, 1)";
          node.style.transform = "";
          const clearTransition = () => {
            node.style.transition = "";
            node.style.zIndex = "";
            if (node.removeEventListener) {
              node.removeEventListener("transitionend", clearTransition);
            }
          };
          if (node.addEventListener) {
            node.addEventListener("transitionend", clearTransition);
          } else {
            clearTransition();
          }
        });
      });
    });
  }

  getRenderedTiles(root) {
    return this.collectNodes(root, (node) => node.dataset && node.dataset.id !== undefined);
  }

  collectNodes(root, predicate) {
    const result = [];
    const visit = (node) => {
      if (!node) {
        return;
      }
      if (predicate(node)) {
        result.push(node);
      }
      if (node.children) {
        for (const child of node.children) {
          visit(child);
        }
      }
    };
    visit(root);
    return result;
  }

  clearSpawnFlags() {
    for (const tile of [...this.state.trayTiles, ...this.state.wordTiles]) {
      if (tile) {
        tile.justSpawned = false;
      }
    }
  }

  createElement(tagName, options = {}) {
    const el = this.document.createElement(tagName);
    if (options.id) {
      el.id = options.id;
    }
    if (options.className) {
      for (const className of options.className.split(/\s+/).filter(Boolean)) {
        el.classList.add(className);
      }
    }
    if (options.text !== undefined) {
      el.appendChild(this.document.createTextNode(options.text));
    }
    if (options.attrs) {
      for (const [key, value] of Object.entries(options.attrs)) {
        el.setAttribute(key, value);
      }
    }
    return el;
  }

  cloneTileNode(source) {
    if (source.tagName === "TEXT_NODE") {
      pLog.log(22);
      return this.document.createTextNode(source.textContent || "");
    }
    pLog.log(23);
    const clone = this.createElement(source.tagName || "div", { className: source.classList.toString() });
    if (source.dataset) {
      for (const [key, value] of Object.entries(source.dataset)) {
        clone.setAttribute(`data-${this.camelToKebab(key)}`, value);
      }
    }
    if (source.style) {
      this.copyStyleProperties(clone.style, source.style);
    }
    if (source.children) {
      for (const child of source.children) {
        clone.appendChild(this.cloneTileNode(child));
      }
    } else if (source.textContent) {
      clone.appendChild(this.document.createTextNode(source.textContent));
    }
    if (!clone.children.length && source.textContent) {
      clone.textContent = source.textContent;
    }
    return clone;
  }

  copyStyleProperties(targetStyle, sourceStyle) {
    const copied = new Set();
    for (const key of Object.keys(sourceStyle)) {
      if (/^\d+$/.test(key)) {
        pLog.log(24);
        continue;
      }
      try {
        targetStyle[key] = sourceStyle[key];
        pLog.log(25);
        copied.add(key);
      } catch (error) {
        pLog.log(26);
        // ignore readonly style slots
      }
    }
    if (typeof sourceStyle.length === "number" && typeof sourceStyle.item === "function" && typeof sourceStyle.getPropertyValue === "function") {
      for (let i = 0; i < sourceStyle.length; i += 1) {
        const propName = sourceStyle.item(i);
        if (!propName || copied.has(propName)) {
          continue;
        }
        const propValue = sourceStyle.getPropertyValue(propName);
        if (propValue) {
          try {
            if (typeof targetStyle.setProperty === "function") {
              pLog.log(27);
              targetStyle.setProperty(propName, propValue);
            } else {
              pLog.log(28);
              targetStyle[propName] = propValue;
            }
          } catch (error) {
            // ignore readonly style slots
          }
        }
      }
    }
  }

  camelToKebab(str) {
    return String(str).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  }

  renderText(el, text) {
    el.textContent = text;
  }

  clearChildren(el) {
    while (el.children.length > 0) {
      el.removeChild(el.children[0]);
    }
    el.innerText = "";
  }

  addClass(el, className) {
    el.classList.add(className);
  }

  removeClass(el, className) {
    el.classList.remove(className);
  }

  hasClass(el, className) {
    return el.classList.contains(className);
  }

  toggleClass(el, className, shouldHave) {
    if (shouldHave) {
      this.addClass(el, className);
    } else {
      this.removeClass(el, className);
    }
  }

  now() {
    return this.performanceNow();
  }

  scrollX() {
    return this.window && this.window.scrollX ? this.window.scrollX : 0;
  }

  scrollY() {
    return this.window && this.window.scrollY ? this.window.scrollY : 0;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SpellGame
  };
}
