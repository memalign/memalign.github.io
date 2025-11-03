if (typeof module !== 'undefined' && module.exports) {
  ({ MAEventType, MAEvent, MAMoveEvent } = require('./Events'));
  ({ MAGameEngine, MAUserActionType } = require('./GameEngine'));
  ({ MAGridViewProducer } = require('./GridViewProducer'));
  ({ AnimationController } = require('./AnimationController'));
  MAUtils = require('./Utilities');
}

const DEBUG_BYPASS_CONFIRM = false;

let browserEnv = {
  document: typeof document !== 'undefined' ? document : null,
  window: typeof window !== 'undefined' ? window : null,
  localStorage: typeof localStorage !== 'undefined' ? localStorage : null,
  navigator: typeof navigator !== 'undefined' ? navigator : null,
  URLSearchParams: typeof URLSearchParams !== 'undefined' ? URLSearchParams : null,
  confirm: (typeof confirm !== 'undefined' && !DEBUG_BYPASS_CONFIRM) ? confirm : null,
};

const soundEffects = {
  levelCleared: [,0,880,.03,.28,.35,,3.9,,,300,.16,,,,,,.85,.23],
  muncherMunch: [,,520,.01,.03,.08,1,.8,7,,244,.08,.2,,28,,,.82,.04,.5,-1442],
  troggleDies: [,,427,.03,.16,.16,1,3.7,-2,,,,,,46,,,.72,.12],
  safeSquareAdded: [2,0,686,,.02,.11,,.8,,-6,,,.04,,,,.05,.52,.03],
  safeSquareRemoved: [,,428,.03,.17,.16,,3.7,-2.1,,,,,,45,,,.62,.11,.02,1],
  muncherDies: [,0,230,.02,.16,.07,,.3,,,-78,.13,,,,,,.85,.17],
  troggleWillAppear: [3,,494,.1,.12,.33,,.7,5,,,,.1,,,.1,,.84,.1,,-1020],
  extraLife: [1.6,0,638,.08,.22,.05,1,.4,,-27,233,.07,.06,,,,.06,.58,.18,.04],
  gameOver: [,,414,.08,.2,.32,1,1.5,,,,,,,3.9,,,.52,.14],
};

function setBrowserEnv(env) {
  browserEnv = env;
}

// From https://stackoverflow.com/questions/10614481/disable-double-tap-zoom-option-in-browser-on-touch-devices
function preventZoom(e) {
  var t2 = e.timeStamp;
  var t1 = e.currentTarget.dataset.lastTouch || t2;
  var dt = t2 - t1;
  var fingers = e.touches.length;
  e.currentTarget.dataset.lastTouch = t2;

  if (!dt || dt > 500 || fingers > 1) return; // not double-tap

  e.preventDefault();

  // Instead of a click, force onmousedown so our code to act on a specific
  // cell works
  //e.target.click();

  let gameViewDiv = browserEnv.document.getElementById("gameView")
  gameViewDiv.onmousedown(e)
}

class GameController {
  constructor(gameEngine, gridViewProducer, animationController, browserEnv) {
    this.gameEngine = gameEngine;
    this.gridViewProducer = gridViewProducer;
    this.animationController = animationController;
    this.browserEnv = browserEnv;
    this.soundEnabled = false; // Default to false, will be loaded from localStorage

    this.gameEngine.animationController = this.animationController;

    this.animationController.animationWillBeginHandler = () => {
      //    console.log("animationWillBegin")
    };

    this.gameEngine.didPerformActionCallback = (emittedEvent) => {
      this.animationController.enqueueFunction(() => {
        this.gameEventHandler(emittedEvent);
      });
    };
  }

  playSound(soundParameters) {
    if (this.soundEnabled && zzfx) {
      zzfx(...soundParameters);
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.browserEnv.localStorage.setItem('soundEnabled', this.soundEnabled ? 'true' : 'false');
    this.updateSoundToggleUI();
  }

  saveGameProgress() {
    const gameState = this.gameEngine.gameState;
    const savedGame = {
      level: gameState.level,
      currentScore: gameState.currentScore,
      strikes: gameState.strikes,
    };
    const gameName = this.gameEngine.gameGenerator.gameName();
    this.browserEnv.localStorage.setItem(`muncherGameProgress_${gameName}`, JSON.stringify(savedGame));
  }

  loadGameProgress() {
    const gameName = this.gameEngine.gameGenerator.gameName();
    const savedGameRaw = this.browserEnv.localStorage.getItem(`muncherGameProgress_${gameName}`);
    if (savedGameRaw) {
      try {
        const savedGame = JSON.parse(savedGameRaw);
        this.gameEngine.gameState.level = savedGame.level;
        this.gameEngine.gameState.currentScore = savedGame.currentScore;
        this.gameEngine.gameState.strikes = savedGame.strikes;
        return true; // Game loaded
      } catch (e) {
        console.error("Error parsing saved game progress:", e);
        this.clearGameProgress(); // Clear corrupted data
      }
    }
    return false; // No game loaded
  }

  clearGameProgress() {
    const gameName = this.gameEngine.gameGenerator.gameName();
    this.browserEnv.localStorage.removeItem(`muncherGameProgress_${gameName}`);
  }

  updateSoundToggleUI() {
    let soundToggleLink = this.browserEnv.document.getElementById("soundToggle");
    if (soundToggleLink) {
      soundToggleLink.innerText = this.soundEnabled ? 'sound is on' : 'sound is off';
    }
  }

  updateGameView(forceEvenIfPaused) {
    if (this.gameEngine.isPaused) {
      //MAUtils.logStackTrace("updateGameView called while game is paused!");

      if (!forceEvenIfPaused) {
        return; // Updating DOM while game is paused causes game overlay to be cleared without actually resuming the game. Symptoms: overlay is cleared without user input, user input stops working, game is frozen.
      } else {
        // It's safe (and useful) to force an update right before an animation is played so the grid state is accurate during the animation.
        // For example, when the muncher moves into a troggle (or a troggle moves into the muncher), we don't want to show a duplicate  muncher/troggle in their previous grid location during the animation.
      }
    }

    //  console.log("updateGameView called");
    //  MAUtils.logStackTrace("updateGameView called");

    let gameViewDiv = this.browserEnv.document.getElementById("gameView")

    let htmlStr = this.gridViewProducer.htmlStringForGameEngine(this.gameEngine)

    gameViewDiv.innerHTML = htmlStr

    this.adjustCellFontSizes();

    // Disable double-tap to zoom
    gameViewDiv.addEventListener('touchstart', preventZoom)
  }

  adjustCellFontSizes() {
    if (!this.browserEnv.document.querySelectorAll) { return; }

    const cells = this.browserEnv.document.querySelectorAll('.cell-div');
    cells.forEach(cell => {
      // Reset font size to default to recalculate
      cell.style.fontSize = '';

      let fontSize = parseInt(this.browserEnv.window.getComputedStyle(cell).fontSize);

      // Check for overflow
      while (cell.scrollWidth > cell.clientWidth && fontSize > 0) {
        fontSize--;
        cell.style.fontSize = fontSize + 'px';
      }
    });
  }

  updateLivesDisplay(muncherImageName) {
    let livesRemainingDiv = this.browserEnv.document.getElementById('livesRemaining');
    if (livesRemainingDiv) {
      livesRemainingDiv.innerHTML = this.gridViewProducer.htmlStringForLivesRemaining(this.gameEngine, muncherImageName);
    }
  }

  // Functions to show and hide the game overlay
  showGameOverlay(title, message, dismissCallback, muncherImageName, isGameOver = false) {
    this.gameEngine.pauseGame()

    let overlay = this.browserEnv.document.getElementById("gameOverlay");
    let titleParagraph = this.browserEnv.document.getElementById("gameOverlayTitle");
    let messageParagraph = this.browserEnv.document.getElementById("gameOverlayMessage");

    if (typeof classicMode !== "undefined" && classicMode) {
      title = title.replace("Wolfer", "Muncher");
    }

    titleParagraph.innerText = title;
    messageParagraph.innerText = message;
    overlay.style.display = 'flex';

    if (isGameOver) {
      overlay.classList.add('gameOverOverlay');
    } else {
      overlay.classList.remove('gameOverOverlay');
    }

    overlay.currentDismissCallback = dismissCallback;
    overlay.dataset.presentedTime = Date.now();

    if (muncherImageName) {
      this.updateLivesDisplay(muncherImageName);
    }
  }

  hideGameOverlay() {
    let overlay = this.browserEnv.document.getElementById("gameOverlay");
    overlay.style.display = 'none';
    overlay.classList.remove('gameOverOverlay');

    this.gameEngine.unpauseGame()

    if (overlay.currentDismissCallback) {
      const dismissCallback = overlay.currentDismissCallback
      overlay.currentDismissCallback = null;
      dismissCallback();
    }

    this.updateGameView();
  }

  // Handles input events for overlay dismissal. Returns true if an overlay was dismissed, false otherwise.
  handleInputForOverlayDismissal(event) {
    let overlay = this.browserEnv.document.getElementById("gameOverlay");
    if (overlay && overlay.style.display && overlay.style.display !== 'none') {
      const presentedTime = parseInt(overlay.dataset.presentedTime, 10);
      const currentTime = Date.now();
      const minDismissalTime = 250; // milliseconds

      event.preventDefault();

      // If the user is playing quickly, they may tap/click/hit keys before
      // they can read the overlay. Prevent dismissal for minDismissalTime.
      if (currentTime - presentedTime < minDismissalTime) {
        return true; // Input was handled, but overlay not dismissed yet
      }

      this.hideGameOverlay();
      return true;
    }

    return false;
  }

  showBadMunchOverlay(reason, dismissCallback) {
    const c = (typeof classicMode !== "undefined" && classicMode);
    const msg = c ? "Bad Munch!" : "Yuck!";
    this.showGameOverlay(msg, reason, dismissCallback, "muncher_sad");
  }

  showLevelClearedOverlay(levelNum) {
    this.showGameOverlay("Well done!", `You cleared level ${levelNum + 1}!`, () => {
      this.gameEngine.advanceToNextLevel();
      this.saveGameProgress(); // Save game progress after level cleared
    }, "muncher_happy");
  }

  gameEventHandler(emittedEvent) {
    //console.log(`gameEventHandler invoked for event type: ${emittedEvent.type}`);
    if (emittedEvent && (
      emittedEvent.type == MAEventType.Munch ||
      emittedEvent.type == MAEventType.MuncherMove ||
      emittedEvent.type == MAEventType.MunchedBadEat ||
      emittedEvent.type == MAEventType.LevelCleared ||
      emittedEvent.type == MAEventType.TroggleEatsMuncher ||
      emittedEvent.type == MAEventType.TroggleMunch ||
      emittedEvent.type == MAEventType.TroggleDiesInSafeSquare ||
      emittedEvent.type == MAEventType.TroggleMove ||
      emittedEvent.type == MAEventType.TroggleMovedOffscreen
    )) {
      let muncherDirection = this.gameEngine.gameState.grid.muncherDirection();
      let animationName = 'muncher-munch';

      let characterType = null;
      let animationDirection = muncherDirection; // Default to muncher direction

      if (emittedEvent.type == MAEventType.Munch) {
        this.playSound(soundEffects.muncherMunch)
        this.saveGameProgress(); // Save game progress after munch

      } else if (emittedEvent.type == MAEventType.MunchedBadEat) {
        this.playSound(soundEffects.muncherDies);
        this.saveGameProgress(); // Save game progress after bad munch (losing a life)
        // Ensure the bad munch value is cleared from the grid before
        // overlay is shown
        this.updateGameView(true);

      } else if (emittedEvent instanceof MAMoveEvent && emittedEvent.type == MAEventType.MuncherMove) {
        this.animationController.playMuncherMoveAnimation(emittedEvent.startGridX, emittedEvent.startGridY, emittedEvent.endGridX, emittedEvent.endGridY, emittedEvent.direction, () => {
          this.updateGameView();
        });
        return; // Exit early as movement animation is handled
      } else if (emittedEvent instanceof MAMoveEvent && emittedEvent.type == MAEventType.TroggleMove) {
        this.animationController.playTroggleMoveAnimation(emittedEvent.startGridX, emittedEvent.startGridY, emittedEvent.endGridX, emittedEvent.endGridY, emittedEvent.direction, emittedEvent.characterType, () => {
          this.updateGameView();
        });
        return; // Exit early as movement animation is handled
      } else if (emittedEvent instanceof MAMoveEvent && emittedEvent.type == MAEventType.TroggleMovedOffscreen) {
        this.animationController.playTroggleMoveAnimation(emittedEvent.startGridX, emittedEvent.startGridY, emittedEvent.endGridX, emittedEvent.endGridY, emittedEvent.direction, emittedEvent.characterType, () => {
          this.updateGameView();
        });
        return; // Exit early as movement animation is handled

      } else if (emittedEvent.type == MAEventType.LevelCleared) {
        this.playSound(soundEffects.levelCleared);
        // Ensure the last eaten value is cleared from the grid before
        // overlay is shown
        this.updateGameView(true);
        this.showLevelClearedOverlay(this.gameEngine.gameState.level);
        return; // No animation required

      } else if (emittedEvent.type == MAEventType.TroggleEatsMuncher) {
        this.playSound(soundEffects.muncherDies);
        this.saveGameProgress(); // Save game progress after troggle eats muncher (losing a life)

        animationName = 'troggle-munch';
        // When a troggle eats a muncher, the troggle is now at emittedEvent.x, emittedEvent.y
        const troggle = this.gameEngine.gameState.grid.cellAt(emittedEvent.x, emittedEvent.y).occupant;
        if (troggle) {
          characterType = troggle.type;
          animationDirection = troggle.direction; // Use troggle's direction for troggle munch animation
        }


      } else if (emittedEvent.type == MAEventType.TroggleMunch) {
        animationName = 'troggle-munch';
        const troggle = this.gameEngine.gameState.grid.cellAt(emittedEvent.x, emittedEvent.y).occupant;
        if (troggle) {
          characterType = troggle.type;
          animationDirection = troggle.direction;
        }

      } else if (emittedEvent.type == MAEventType.TroggleDiesInSafeSquare) {
        this.playSound(soundEffects.troggleDies);
        animationName = 'troggle-poof';
        characterType = emittedEvent.characterType;
        this.updateGameView(true)
      }

      //console.log("Invoking playAnimation: " + animationName);

      this.animationController.playAnimation(animationName, emittedEvent.x, emittedEvent.y, animationDirection, characterType, () => {
        //console.log("playAnimation completion handler invoked: " + animationName);

        let dismissCallbackGameOver = null
        if (this.gameEngine.gameState.gameIsOver) {
          this.clearGameProgress(); // Clear saved game progress when game is over
          dismissCallbackGameOver = () => {
            const isHighScore = this.gameEngine.gameState.currentScore > this.gameEngine.gameState.highScore;
            if (isHighScore) {
              this.gameEngine.gameState.highScore = this.gameEngine.gameState.currentScore;
              const gameName = this.gameEngine.gameGenerator.gameName();
              this.browserEnv.localStorage.setItem(`highScore_${gameName}`, this.gameEngine.gameState.highScore.toString());
            }

            let message = `Score: ${this.gameEngine.gameState.currentScore}`;
            if (isHighScore) {
              message += "\nNew high score!";
            }

            this.playSound(soundEffects.gameOver);

            this.showGameOverlay("Game Over", message, () => {
              this.gameEngine.startNewGame();
            }, "muncher_sad", true);
          }
        }

        this.updateGameView();
        if (emittedEvent.type == MAEventType.MunchedBadEat) {
          this.showBadMunchOverlay(emittedEvent.str, dismissCallbackGameOver);
        } else if (emittedEvent.type == MAEventType.TroggleEatsMuncher) {
          this.showGameOverlay("Oh no!", emittedEvent.str, dismissCallbackGameOver, "muncher_sad");
        }
      });
    } else {

      if (emittedEvent.type == MAEventType.SafeSquareAdded) {
        this.playSound(soundEffects.safeSquareAdded);
      } else if (emittedEvent.type == MAEventType.SafeSquareRemoved) {
        this.playSound(soundEffects.safeSquareRemoved);
      } else if (emittedEvent.type == MAEventType.TrogglePending) {
        this.playSound(soundEffects.troggleWillAppear);
      } else if (emittedEvent.type == MAEventType.ExtraLife) {
        this.playSound(soundEffects.extraLife);
      }

      this.updateGameView()
    }
  }

  initializeGame() {
    // Setup link handlers
    let startOverLink = this.browserEnv.document.getElementById("startOver")
    if (startOverLink) {
      startOverLink.onclick = (event) => {
        if (event) {
          event.preventDefault(); // Stop navigation for this link click
        }

        let resetStorage = true;

        if (this.browserEnv.confirm) {
          const promptStr = "Start Over? All game progress will be lost.";
          // Invoke confirm directly (instead of using this.browserEnv.confirm) because Safari will block it otherwise
          if (typeof confirm !== 'undefined' && this.browserEnv.confirm === confirm) {
            resetStorage = confirm(promptStr);
          } else {
            resetStorage = this.browserEnv.confirm(promptStr);
          }
        }

        if (resetStorage) {
          this.browserEnv.localStorage.removeItem('soundEnabled') // Also clear sound setting
          const gameName = this.gameEngine.gameGenerator.gameName();
          this.browserEnv.localStorage.removeItem(`highScore_${gameName}`) // Clear high score
          this.clearGameProgress(); // Clear saved game progress
          this.browserEnv.window.location.reload(); // Reload the current URL with existing query parameters
        }
      }
    }

    let soundToggleLink = this.browserEnv.document.getElementById("soundToggle")
    if (soundToggleLink) {
      soundToggleLink.onclick = (e) => {
        e.preventDefault();
        this.toggleSound();
      }
    }

    // Load sound setting
    const savedSoundEnabled = this.browserEnv.localStorage.getItem('soundEnabled');
    if (savedSoundEnabled !== null) {
      this.soundEnabled = (savedSoundEnabled === 'true');
    } else {
      // Default to sound off if not set
      this.soundEnabled = false;
    }
    this.updateSoundToggleUI();

    let loadedHighScore = 0;
    const gameName = this.gameEngine.gameGenerator.gameName();
    const savedHighScore = this.browserEnv.localStorage.getItem(`highScore_${gameName}`);
    if (savedHighScore) {
      loadedHighScore = parseInt(savedHighScore, 10);
    }

    this.gameEngine.startNewGame()

    // Apply the loaded high score to the new gameState
    this.gameEngine.gameState.highScore = loadedHighScore;

    // Load game progress
    const gameLoaded = this.loadGameProgress();
    if (gameLoaded) {
      this.gameEngine.startCurrentRound(); // Resume the loaded game
    }

    this.updateGameView()

    let poem = "The forest was quiet 'til WoeBots arrived\nWolf down the answers to remain alive\n";
    if (gameLoaded) {
      poem += "Game progress was restored for you";
    } else {
      poem += "The Safe Space can protect you";
    }

    this.showGameOverlay(this.gameEngine.gameGenerator.gameName(), poem, () => {});

    // Setup user input handling
    let gameViewDiv = this.browserEnv.document.getElementById("gameView")
    if (gameViewDiv) {
      gameViewDiv.onmousedown = (e) => {
        if (this.handleInputForOverlayDismissal(e)) {
          return;
        }

        if (!e) {
          e = this.browserEnv.window.event
        }

        var target = e.target ? e.target : e.srcElement

        console.log(`User clicked ${target.tagName} element with id ${target.id} class ${target.className}`)

        let className = target.className

        // cell_$1_$2
        let match = className.match(/cell_(\d+)_(\d+)/)
        if (match) {
          let xStr = match[1]
          let yStr = match[2]
          let x = parseInt(xStr)
          let y = parseInt(yStr)

          this.gameEngine.handleUserActionOnCell(x, y)
        }

      }
    }

    let gameKeyDownHandler = (e) => {
      if (this.handleInputForOverlayDismissal(e)) {
        return;
      }

      // Prevent scroll due to keyboard events
      // https://stackoverflow.com/questions/8916620/disable-arrow-key-scrolling-in-users-browser
      if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault()
      }

      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          this.gameEngine.handleUserAction(MAUserActionType.Left)
          break

        case "ArrowRight":
        case "KeyD":
          this.gameEngine.handleUserAction(MAUserActionType.Right)
          break

        case "ArrowUp":
        case "KeyW":
          this.gameEngine.handleUserAction(MAUserActionType.Up)
          break

        case "ArrowDown":
        case "KeyS":
          this.gameEngine.handleUserAction(MAUserActionType.Down)
          break

        case "Space":
        case "Enter":
          this.gameEngine.handleUserAction(MAUserActionType.Eat)
          break

        default:
          //console.log("Key code: " + e.code)
          break
      }

    }
    this.browserEnv.window.addEventListener("keydown", gameKeyDownHandler, false)

    this.browserEnv.window.addEventListener('resize', () => {
      this.adjustCellFontSizes();
    });
  }
}

if (typeof window !== 'undefined') {
  window.onload = () => {
    let gameGenerator = null;
    if (gameName) {
      const className = GameGenerators[gameName].className;
      console.log("Loading specified gameName: " + gameName + " className: " + className);
      gameGenerator = new GameGenerators_classes[className]();
    }

    const gameEngine = new MAGameEngine(gameGenerator);
    const gridViewProducer = new MAGridViewProducer();
    const animationController = new AnimationController(gameEngine.runloop, browserEnv);
    new GameController(gameEngine, gridViewProducer, animationController, browserEnv).initializeGame();
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    preventZoom,
    setBrowserEnv,
    GameController,
  };
}

