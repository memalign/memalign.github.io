if (typeof module !== 'undefined' && module.exports) {
  MAUtils = require('./Utilities');
  ({ MADirection, MACharacterType } = require('./GameState'));
  ({ MAEventType } = require('./Events'));
}

const DEBUG_SLOW_ANIMATIONS = false;

const DEFAULT_FRAME_DURATION_MILLIS = 10;

class AnimationController {
    /**
     * @param {MARunloop} runloop - The game's runloop for scheduling.
     * @param {object} browserEnv - The browser environment object (containing document, window, etc.).
     */
    constructor(runloop, browserEnv) {
        this.runloop = runloop;
        this.browserEnv = browserEnv;

        const getImage = (name) => {
          const pceImageLib = this._pceImageLibrary();
          return pceImageLib ? pceImageLib.pceImageForName(name).generatePNG(1) : null;
        };

        this.animations = {
            'classic-muncher-munch-right': {
                frames: [
                    getImage('muncher_munch0'),
                    getImage('muncher_munch1'),
                    getImage('muncher_munch2'),
                    getImage('muncher_munch1'),
                    getImage('muncher_munch0'),
                    getImage('muncher_munch1'),
                    getImage('muncher_munch2'),
                    getImage('muncher_munch1'),
                    getImage('muncher_munch0'),
                ],
            },

            'classic-muncher-munch-left': {
                frames: [
                    getImage('muncher_munch0_left'),
                    getImage('muncher_munch1_left'),
                    getImage('muncher_munch2_left'),
                    getImage('muncher_munch1_left'),
                    getImage('muncher_munch0_left'),
                    getImage('muncher_munch1_left'),
                    getImage('muncher_munch2_left'),
                    getImage('muncher_munch1_left'),
                    getImage('muncher_munch0_left'),
                ],
            },

            'classic-muncher-walk-right': {
                frames: [
                    getImage('muncher_walk0'),
                    getImage('muncher_walk1'),
                ],
            },

            'classic-muncher-walk-left': {
                frames: [
                    getImage('muncher_walk0_left'),
                    getImage('muncher_walk1_left'),
                ],
            },

            'muncher-munch-right': {
                frames: [
                    getImage('muncher_munch0'),
                    getImage('muncher_munch1'),
                    getImage('muncher_munch2'),
                    getImage('muncher_munch1'),
                    getImage('muncher_munch0'),
                    getImage('muncher_munch1'),
                    getImage('muncher_munch2'),
                    getImage('muncher_munch1'),
                    getImage('muncher_munch0'),
                ],
            },

            'muncher-munch-left': {
                frames: [
                    getImage('muncher_munch0_left'),
                    getImage('muncher_munch1_left'),
                    getImage('muncher_munch2_left'),
                    getImage('muncher_munch1_left'),
                    getImage('muncher_munch0_left'),
                    getImage('muncher_munch1_left'),
                    getImage('muncher_munch2_left'),
                    getImage('muncher_munch1_left'),
                    getImage('muncher_munch0_left'),
                ],
            },

            'muncher-walk-right': {
                frames: [
                    getImage('muncher_walk0'),
                    getImage('muncher_walk1'),
                ],
            },

            'muncher-walk-left': {
                frames: [
                    getImage('muncher_walk0_left'),
                    getImage('muncher_walk1_left'),
                ],
            },

            'reggie-munch': {
                frames: [
                    getImage('reggie_munch0'),
                    getImage('reggie_munch1'),
                    getImage('reggie_munch2'),
                    getImage('reggie_munch1'),
                    getImage('reggie_munch0'),
                    getImage('reggie_munch1'),
                    getImage('reggie_munch2'),
                    getImage('reggie_munch1'),
                    getImage('reggie_munch0'),
                ],
            },

            'reggie-poof': {
                frameDurationMillis: 50,
                shouldLayerOnTopOfCell: true,
                frames: [
                    getImage('reggie_poof0'),
                    getImage('reggie_poof1'),
                    getImage('reggie_poof2'),
                    getImage('reggie_poof3'),
                    getImage('reggie_poof4'),
                ],
            },

            'bashful-munch': {
                frames: [
                    getImage('bashful_munch0'),
                    getImage('bashful_munch1'),
                    getImage('bashful_munch2'),
                    getImage('bashful_munch1'),
                    getImage('bashful_munch0'),
                    getImage('bashful_munch1'),
                    getImage('bashful_munch2'),
                    getImage('bashful_munch1'),
                    getImage('bashful_munch0'),
                ],
            },

            'bashful-poof': {
                frameDurationMillis: 50,
                shouldLayerOnTopOfCell: true,
                frames: [
                    getImage('bashful_poof0'),
                    getImage('bashful_poof1'),
                    getImage('bashful_poof2'),
                    getImage('bashful_poof3'),
                    getImage('bashful_poof4'),
                ],
            },

            'helper-munch': {
                frames: [
                    getImage('helper_munch0'),
                    getImage('helper_munch1'),
                    getImage('helper_munch2'),
                    getImage('helper_munch1'),
                    getImage('helper_munch0'),
                    getImage('helper_munch1'),
                    getImage('helper_munch2'),
                    getImage('helper_munch1'),
                    getImage('helper_munch0'),
                ],
            },

            'helper-poof': {
                frameDurationMillis: 50,
                shouldLayerOnTopOfCell: true,
                frames: [
                    getImage('helper_poof0'),
                    getImage('helper_poof1'),
                    getImage('helper_poof2'),
                    getImage('helper_poof3'),
                    getImage('helper_poof4'),
                ],
            },

            'worker-munch': {
                frames: [
                    getImage('worker_munch0'),
                    getImage('worker_munch1'),
                    getImage('worker_munch2'),
                    getImage('worker_munch1'),
                    getImage('worker_munch0'),
                    getImage('worker_munch1'),
                    getImage('worker_munch2'),
                    getImage('worker_munch1'),
                    getImage('worker_munch0'),
                ],
            },

            'worker-poof': {
                frameDurationMillis: 50,
                shouldLayerOnTopOfCell: true,
                frames: [
                    getImage('worker_poof0'),
                    getImage('worker_poof1'),
                    getImage('worker_poof2'),
                    getImage('worker_poof3'),
                    getImage('worker_poof4'),
                ],
            },

            'smarty-munch-right': {
                frames: [
                    getImage('smarty_munch0'),
                    getImage('smarty_munch1'),
                    getImage('smarty_munch2'),
                    getImage('smarty_munch1'),
                    getImage('smarty_munch0'),
                    getImage('smarty_munch1'),
                    getImage('smarty_munch2'),
                    getImage('smarty_munch1'),
                    getImage('smarty_munch0'),
                ],
            },

            'smarty-munch-left': {
                frames: [
                    getImage('smarty_munch0_left'),
                    getImage('smarty_munch1_left'),
                    getImage('smarty_munch2_left'),
                    getImage('smarty_munch1_left'),
                    getImage('smarty_munch0_left'),
                    getImage('smarty_munch1_left'),
                    getImage('smarty_munch2_left'),
                    getImage('smarty_munch1_left'),
                    getImage('smarty_munch0_left'),
                ],
            },

            'smarty-poof': {
                frameDurationMillis: 50,
                shouldLayerOnTopOfCell: true,
                frames: [
                    getImage('smarty_poof0'),
                    getImage('smarty_poof1'),
                    getImage('smarty_poof2'),
                    getImage('smarty_poof3'),
                    getImage('smarty_poof4'),
                ],
            },

            'smarty-walk-right': {
                frames: [
                    getImage('smarty_walk0'),
                    getImage('smarty_walk1'),
                ],
            },

            'smarty-walk-left': {
                frames: [
                    getImage('smarty_walk0_left'),
                    getImage('smarty_walk1_left'),
                ],
            },

            'reggie-walk-right': {
                frames: [
                    getImage('reggie_right_walk0'),
                    getImage('reggie_right_walk1'),
                ],
            },

            'reggie-walk-left': {
                frames: [
                    getImage('reggie_left_walk0'),
                    getImage('reggie_left_walk1'),
                ],
            },

            'reggie-walk-back': {
                frames: [
                    getImage('reggie_back_walk0'),
                    getImage('reggie_back_walk1'),
                ],
            },

            'reggie-walk-down': {
                frames: [
                    getImage('reggie_walk0'),
                    getImage('reggie_walk1'),
                ],
            },

            'bashful-walk-right': {
                frames: [
                    getImage('bashful_right_walk0'),
                    getImage('bashful_right_walk1'),
                ],
            },

            'bashful-walk-left': {
                frames: [
                    getImage('bashful_left_walk0'),
                    getImage('bashful_left_walk1'),
                ],
            },

            'bashful-walk-back': {
                frames: [
                    getImage('bashful_back_walk0'),
                    getImage('bashful_back_walk1'),
                ],
            },

            'bashful-walk-down': {
                frames: [
                    getImage('bashful_walk0'),
                    getImage('bashful_walk1'),
                ],
            },

            'helper-walk-right': {
                frames: [
                    getImage('helper_right_walk0'),
                    getImage('helper_right_walk1'),
                ],
            },

            'helper-walk-left': {
                frames: [
                    getImage('helper_left_walk0'),
                    getImage('helper_left_walk1'),
                ],
            },

            'helper-walk-back': {
                frames: [
                    getImage('helper_back_walk0'),
                    getImage('helper_back_walk1'),
                ],
            },

            'helper-walk-down': {
                frames: [
                    getImage('helper_walk0'),
                    getImage('helper_walk1'),
                ],
            },

            'worker-walk-right': {
                frames: [
                    getImage('worker_right_walk0'),
                    getImage('worker_right_walk1'),
                ],
            },

            'worker-walk-left': {
                frames: [
                    getImage('worker_left_walk0'),
                    getImage('worker_left_walk1'),
                ],
            },

            'worker-walk-back': {
                frames: [
                    getImage('worker_back_walk0'),
                    getImage('worker_back_walk1'),
                ],
            },

            'worker-walk-down': {
                frames: [
                    getImage('worker_walk0'),
                    getImage('worker_walk1'),
                ],
            },
        };

        this.activeAnimationState = null;
        this.actionQueue = [];
        this.isProcessingQueue = false;

        this.animationWillBeginHandler = null;
    }

    _pceImageLibrary() {
      if (typeof PCEImageLibrary !== 'undefined') {
        return PCEImageLibrary;
      }
      return null;
    }

    _getCellSize() {
        const cellTd = this.browserEnv.document.querySelector('td.cell_0_0');
        if (cellTd) {
            return { width: cellTd.offsetWidth, height: cellTd.offsetHeight };
        }
        return { width: 32, height: 32 }; // Default fallback
    }

    /**
     * Plays a generic character movement animation between two grid cells.
     * @param {number} startGridX - The starting x-coordinate of the character.
     * @param {number} startGridY - The starting y-coordinate of the character.
     * @param {number} endGridX - The ending x-coordinate of the character.
     * @param {number} endGridY - The ending y-coordinate of the character.
     * @param {number} direction - The direction of movement (MADirection.Left, MADirection.Right, etc.).
     * @param {MACharacterType} characterType - The type of character being animated.
     * @param {string} cssClass - The CSS class to apply to the animation sprite div.
     * @param {function} completionCallback - Function to call when the animation is complete.
     * @private
     */
    _playCharacterMoveAnimation(startGridX, startGridY, endGridX, endGridY, direction, characterType, cssClass, completionCallback) {
        let actualAnimationName;

        if (characterType === MACharacterType.Muncher) {
            actualAnimationName = (direction === MADirection.Left) ? 'muncher-walk-left' : 'muncher-walk-right';

            if (classicMode) {
              actualAnimationName = "classic-" + actualAnimationName;
            }
        } else if (characterType === MACharacterType.Smarty) {
            actualAnimationName = (direction === MADirection.Left) ? 'smarty-walk-left' : 'smarty-walk-right';
        } else {
            // Handle other character types
            const characterName = MAUtils.characterTypeToString(characterType, true).toLowerCase();
            switch (direction) {
                case MADirection.Left:
                    actualAnimationName = `${characterName}-walk-left`;
                    break;
                case MADirection.Right:
                    actualAnimationName = `${characterName}-walk-right`;
                    break;
                case MADirection.Up:
                    actualAnimationName = `${characterName}-walk-back`;
                    break;
                case MADirection.Down:
                    actualAnimationName = `${characterName}-walk-down`;
                    break;
                default:
                    actualAnimationName = `${characterName}-walk-down`; // Fallback to down if direction is unknown
                    break;
            }
        }

        const animation = this.animations[actualAnimationName];

        if (!animation || animation.frames.length === 0) {
            if (completionCallback) {
                completionCallback();
            }
            this.isProcessingQueue = false;
            this._processQueue(); // Process next item
            return;
        }

        let animationDuration = animation.duration || 60;
        if (DEBUG_SLOW_ANIMATIONS) {
            animationDuration *= 10;
        }

        const cellSize = this._getCellSize();
        const cellWidth = cellSize.width;
        const cellHeight = cellSize.height;

        const tableBorder = 2;
        const tdBorder = 1;
        const cellDivBorder = 4;

        const effectiveImageWidth = cellWidth - (2 * tdBorder) - (2 * cellDivBorder);
        const effectiveImageHeight = cellHeight - (2 * tdBorder) - (2 * cellDivBorder);

        const startPixelX = (startGridX * cellWidth);
        const verticalStride = cellHeight - tdBorder;
        const startPixelY = (startGridY * verticalStride);
        const endPixelX = (endGridX * cellWidth);
        const endPixelY = (endGridY * verticalStride);

        const characterDiv = this.browserEnv.document.createElement('div');
        characterDiv.classList.add(cssClass);
        characterDiv.style.position = 'absolute';

        characterDiv.style.width = `${effectiveImageWidth}px`;
        characterDiv.style.height = `${effectiveImageHeight}px`;

        const initialLeft = startPixelX + tableBorder + tdBorder + cellDivBorder;
        const initialTop = startPixelY + tableBorder + tdBorder + cellDivBorder - 1;

        characterDiv.style.left = `${initialLeft}px`;
        characterDiv.style.top = `${initialTop}px`;

        const gameGridDiv = this.browserEnv.document.getElementById('muncherGrid');
        if (!gameGridDiv) {
            if (completionCallback) {
                completionCallback();
            }
            this.isProcessingQueue = false;
            this._processQueue();
            return;
        }
        gameGridDiv.appendChild(characterDiv);

        this.activeAnimationState = {
            type: 'character-move',
            startGridX,
            startGridY,
            endGridX,
            endGridY,
            startTime: Date.now(),
            duration: animationDuration,
            direction,
            characterType,
        };

        if (this.animationWillBeginHandler) {
            this.animationWillBeginHandler();
        }

        const animationFrames = animation.frames;

        const animateFrame = () => {
            const elapsedTime = Date.now() - this.activeAnimationState.startTime;
            const progress = Math.min(1, elapsedTime / animationDuration);

            if (progress < 1) {
                const currentPixelX = initialLeft + (endPixelX - startPixelX) * progress;
                const currentPixelY = initialTop + (endPixelY - startPixelY) * progress;

                characterDiv.style.left = `${currentPixelX}px`;
                characterDiv.style.top = `${currentPixelY}px`;

                const frameIndex = Math.floor(progress * animationFrames.length) % animationFrames.length;
                characterDiv.style.backgroundImage = `url(${animationFrames[frameIndex]})`;

                let currentFrameDuration = animation.frameDurationMillis || DEFAULT_FRAME_DURATION_MILLIS;
                if (DEBUG_SLOW_ANIMATIONS) {
                    currentFrameDuration *= 10;
                }
                this.runloop.runFunctionAfterDelay(animateFrame, currentFrameDuration / 1000);
            } else {
                // Animation finished
                gameGridDiv.removeChild(characterDiv);
                this.activeAnimationState = null;
                if (completionCallback) {
                    completionCallback();
                }
                this.isProcessingQueue = false;
                this._processQueue(); // Process next item
            }
        };
        animateFrame();
    }

    /**
     * Enqueues a function to be executed after all current and pending animations and enqueued functions complete.
     * @param {function} func - The function to enqueue.
     */
    enqueueFunction(func) {
        this.actionQueue.push({ type: 'function', func: func });
        this._processQueue();
    }

    /**
     * Plays an animation on a specific grid cell.
     * @param {string} animationName - The name of the animation to play.
     * @param {number} x - The x-coordinate of the cell.
     * @param {number} y - The y-coordinate of the cell.
     * @param {number} direction - The direction the character is facing (MADirection.Left, MADirection.Right, MADirection.Up, MADirection.Down).
     * @param {MACharacterType} characterType - The type of character being animated (e.g., MACharacterType.Muncher, MACharacterType.Reggie).
     * @param {function} completionCallback - Function to call when the animation is complete.
     */
    playAnimation(animationName, x, y, direction, characterType, completionCallback) {
        this.actionQueue.push({
            type: 'animation',
            animationName,
            x,
            y,
            direction,
            characterType,
            completionCallback
        });
        this._processQueue();
    }

    /**
     * Plays a muncher movement animation between two grid cells.
     * @param {number} startGridX - The starting x-coordinate of the muncher.
     * @param {number} startGridY - The starting y-coordinate of the muncher.
     * @param {number} endGridX - The ending x-coordinate of the muncher.
     * @param {number} endGridY - The ending y-coordinate of the muncher.
     * @param {number} direction - The direction of movement (MADirection.Left, MADirection.Right, etc.).
     * @param {function} completionCallback - Function to call when the animation is complete.
     */
    playMuncherMoveAnimation(startGridX, startGridY, endGridX, endGridY, direction, completionCallback) {
        this.actionQueue.push({
            type: 'muncher-move',
            startGridX,
            startGridY,
            endGridX,
            endGridY,
            direction,
            completionCallback
        });
        this._processQueue();
    }

    /**
     * Plays a troggle movement animation between two grid cells.
     * @param {number} startGridX - The starting x-coordinate of the troggle.
     * @param {number} startGridY - The starting y-coordinate of the troggle.
     * @param {number} endGridX - The ending x-coordinate of the troggle.
     * @param {number} endGridY - The ending y-coordinate of the troggle.
     * @param {number} direction - The direction of movement (MADirection.Left, MADirection.Right, etc.).
     * @param {MACharacterType} characterType - The type of character being animated (e.g., MACharacterType.Smarty).
     * @param {function} completionCallback - Function to call when the animation is complete.
     */
    playTroggleMoveAnimation(startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback) {
        this.actionQueue.push({
            type: 'troggle-move',
            startGridX,
            startGridY,
            endGridX,
            endGridY,
            direction,
            characterType,
            completionCallback
        });
        this._processQueue();
    }

    /**
     * Processes the animation and function queue.
     * @private
     */
    _processQueue() {
        if (this.isProcessingQueue || this.actionQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        const action = this.actionQueue.shift();

        if (action.type === 'function') {
            action.func();
            this.isProcessingQueue = false;
            this._processQueue(); // Process next item
        } else if (action.type === 'animation') {
            const { animationName, x, y, direction, characterType, completionCallback } = action;

            let actualAnimationName = animationName;

            if (animationName === 'muncher-munch') {
                if (direction === MADirection.Left) {
                    actualAnimationName = 'muncher-munch-left';
                } else {
                    actualAnimationName = 'muncher-munch-right';
                }

                if (classicMode) {
                  actualAnimationName = "classic-" + actualAnimationName;
                }
            } else if (animationName.startsWith('troggle-')) {
                const animationType = animationName.substring('troggle-'.length);

                switch (characterType) {
                    case MACharacterType.Reggie:
                    case MACharacterType.Bashful:
                    case MACharacterType.Helper:
                    case MACharacterType.Worker:
                        actualAnimationName = `${MAUtils.characterTypeToString(characterType, true).toLowerCase()}-${animationType}`;
                        break;
                    case MACharacterType.Smarty:
                        if (animationType === 'munch') {
                            if (direction === MADirection.Left) {
                                actualAnimationName = 'smarty-munch-left';
                            } else {
                                actualAnimationName = 'smarty-munch-right';
                            }
                        } else if (animationType === 'poof') {
                            actualAnimationName = 'smarty-poof';
                        }
                        break;
                    default:
                        actualAnimationName = `${animationType}`;
                        break;
                }
            }

            const animation = this.animations[actualAnimationName];
            if (!animation || animation.frames.length === 0) {
                if (completionCallback) {
                    completionCallback();
                }
                this.isProcessingQueue = false;
                this._processQueue(); // Process next item
                return;
            }

            const cellDiv = this.browserEnv.document.querySelector(`div.cell_${x}_${y}`);
            if (!cellDiv) {
                if (completionCallback) {
                    completionCallback();
                }
                this.isProcessingQueue = false;
                this._processQueue(); // Process next item
                return;
            }

            if (this.animationWillBeginHandler) {
               this.animationWillBeginHandler()
            }

            let frameIndex = 0;
            const shouldLayer = animation.shouldLayerOnTopOfCell;

            let animationFrameDiv = null;
            if (shouldLayer) {
                animationFrameDiv = this.browserEnv.document.createElement('div');
                animationFrameDiv.classList.add('animation-frame');
                cellDiv.appendChild(animationFrameDiv);
            } else {
                cellDiv.id = 'cellNone';
            }

            const playNextFrame = () => {
                if (frameIndex < animation.frames.length) {
                    if (shouldLayer) {
                        animationFrameDiv.style.backgroundImage = `url(${animation.frames[frameIndex]})`;
                    } else {
                        cellDiv.style.backgroundImage = `url(${animation.frames[frameIndex]})`;
                    }
                    frameIndex++;
                    let currentFrameDuration = animation.frameDurationMillis || DEFAULT_FRAME_DURATION_MILLIS;
                    if (DEBUG_SLOW_ANIMATIONS) {
                      currentFrameDuration *= 10;
                    }
                    this.runloop.runFunctionAfterDelay(playNextFrame, currentFrameDuration / 1000);
                } else {
                    // Animation finished.
                    if (shouldLayer) {
                        cellDiv.removeChild(animationFrameDiv);
                    }

                    if (completionCallback) {
                        completionCallback();
                    }
                    this.isProcessingQueue = false;
                    this._processQueue(); // Process next item
                }
            };

            playNextFrame();
        } else if (action.type === 'muncher-move') {
            const staticMuncherDiv = this.browserEnv.document.querySelector('#cellMuncher');
            if (staticMuncherDiv) {
                staticMuncherDiv.style.backgroundImage = 'none';
            }
            const { startGridX, startGridY, endGridX, endGridY, direction, completionCallback } = action;
            this._playCharacterMoveAnimation(startGridX, startGridY, endGridX, endGridY, direction, MACharacterType.Muncher, 'muncher-animation-sprite', completionCallback);
        } else if (action.type === 'troggle-move') {
            const staticTroggleDiv = this.browserEnv.document.querySelector(`div.cell_${action.startGridX}_${action.startGridY}`);
            if (staticTroggleDiv) {
                staticTroggleDiv.style.backgroundImage = 'none';
            }
            const { startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback } = action;
            this._playCharacterMoveAnimation(startGridX, startGridY, endGridX, endGridY, direction, characterType, 'troggle-animation-sprite', completionCallback);
        } else if (action.type === MAEventType.TroggleMovedOffscreen) {
            const staticTroggleDiv = this.browserEnv.document.querySelector(`div.cell_${action.startGridX}_${action.startGridY}`);
            if (staticTroggleDiv) {
                staticTroggleDiv.style.backgroundImage = 'none';
            }
            const { startGridX, startGridY, endGridX, endGridY, direction, characterType, completionCallback } = action;
            this._playCharacterMoveAnimation(startGridX, startGridY, endGridX, endGridY, direction, characterType, 'troggle-animation-sprite', completionCallback);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationController };
}
