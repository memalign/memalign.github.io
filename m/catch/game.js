const ASSET_PATH = './';

const CONFIG = {
    nutSize: 15, // Base size, will be scaled
    squirrelMovementSpeed: 0.2, // 20% of screen width per second
    fallingSpeed: 0.5, // 50% of screen height per second
    initialNutProb: 0.15,
    initialRockProb: 0.002,
    directionChangeProb: 0.02,
    levelDuration: 30000, // 30 seconds
    basketLeeway: 2/3, // Allowed to go 2/3 off screen
    charScale: 4.0, // Scale factor for pixel art character
    platformScale: 2.0, // Scale factor for the platform tiles
    squirrelYOffset: 50, // Vertical offset from the top of the screen
    rockRotationSpeed: 1.5, // Radians per second
    gemScale: 2.0, // Scale factor for gems relative to base size
    wormScale: 2.0,
    wormCrawlSpeed: 0.05,
    wormPoints: 5,
    wormInterval: 30,
    ghostScale: 1.5,
    ghostRiseSpeed: 40, // Pixels per second
    ghostWiggleAmplitude: 20,
    ghostWiggleFrequency: 3
};

const GAME_STATE = {
    OVER: 'OVER',
    RUNNING: 'RUNNING',
    LOST_LIFE: 'LOST_LIFE',
    BETWEEN_LEVELS: 'BETWEEN_LEVELS',
    TUTORIAL: 'TUTORIAL',
    WAITING_FOR_LEVEL: 'WAITING_FOR_LEVEL'
};

const ACTION = {
    NUT: 'NUT',
    ROCK: 'ROCK',
    WORM: 'WORM'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreContainer = document.getElementById('score-container');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.messageOverlay = document.getElementById('message-overlay');
        this.homeLink = document.getElementById('home-link');
        this.aboutLink = document.getElementById('about-link');
        this.messageTitle = document.getElementById('message-title');
        this.startButton = document.getElementById('start-button');
        this.tutorialElement = document.getElementById('tutorial');
        this.gameOverInfo = document.getElementById('game-over-info');
        this.tauntElement = document.getElementById('taunt');
        this.finalScoreElement = document.getElementById('final-score');
        this.soundToggleElement = document.getElementById('sound-toggle');
        this.soundActionElement = document.getElementById('sound-action');

        // Create an element to measure safe area insets
        this.safeAreaHelper = document.createElement('div');
        this.safeAreaHelper.style.paddingBottom = 'env(safe-area-inset-bottom)';
        this.safeAreaHelper.style.visibility = 'hidden';
        this.safeAreaHelper.style.position = 'absolute';
        this.safeAreaHelper.style.pointerEvents = 'none';
        document.body.appendChild(this.safeAreaHelper);

        this.assets = {};
        this.soundEffects = new SoundEffects();
        this.squirrelImage = 'char_standing';
        this.lastTime = 0;
        this.state = GAME_STATE.OVER;
        this.score = 0;
        this.gemsCaught = 0;
        this.wormsCaught = 0;
        this.lastWormMilestone = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false'; // Default to true
        this.lastDeathReason = null;
        this.bgOffset = 0;

        this.squirrel = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            headingLeft: false,
            nutProb: CONFIG.initialNutProb,
            rockProb: CONFIG.initialRockProb,
            lastActionTime: 0,
            startTime: 0,
            walkFrame: 0,
            walkTimer: 0,
            isDropping: false,
            dropTimer: 0
        };

        this.basket = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        this.fallingObjects = [];
        this.worms = [];
        this.ghosts = [];
        this.scale = 1;
        this.musicPlaying = false;

        this.init();
    }

    async init() {
        await this.loadAssets();
        this.updateScoreLabels();
        this.resize();
        window.addEventListener('resize', () => {
            // Delay slightly to allow mobile Safari layout to settle
            setTimeout(() => this.resize(), 100);
        });

        this.setupInput();
        this.showTutorial();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    async loadAssets() {
        const images = {
            background: 'img/backgrounds.png',
            basket: 'img/tile_0675_purple.png',
            gem0: 'img/tile_0376.png',
            gem1: 'img/tile_0377.png',
            gem2: 'img/tile_0378.png',
            gem3: 'img/tile_0379.png',
            rock: 'img/tile_0234.png',
            char_standing: 'img/tile_0109.png',
            char_happy: 'img/tile_0111.png',
            char_upset: 'img/tile_0113.png',
            char_walk0: 'img/tile_0116.png',
            char_walk1: 'img/tile_0117.png',
            char_drop: 'img/tile_0118.png',
            platform: 'img/tile_0183.png',
            ground: 'img/tile_0212.png',
            worm0: 'img/tile_0294.png',
            worm1: 'img/tile_0295.png',
            worm_dead: 'img/tile_0296.png',
            ghost: 'img/tile_0446.png'
        };

        const loadImg = (src) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = ASSET_PATH + src;
        });

        for (const [key, src] of Object.entries(images)) {
            this.assets[key] = await loadImg(src);
        }

        this.soundEffects.loadSounds();
    }

    playSound(key) {
        if (this.soundEnabled) {
            this.soundEffects.playSound(key);
            this.soundEffects.requestSong();
        }
    }

    resize() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Measure safe area inset
        const safeAreaBottom = parseInt(getComputedStyle(this.safeAreaHelper).paddingBottom) || 0;

        // Maintain aspect ratio of the background image if possible, or just fill
        const bg = this.assets.background;
        const bgAspect = bg.width / bg.height;
        const viewAspect = viewportWidth / viewportHeight;

        this.canvas.width = viewportWidth;
        this.canvas.height = viewportHeight;

        // Reset context state after resize
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;

        // Calculate scale based on a reference height (original background was 640px)
        // This ensures game objects stay the same relative size regardless of the background asset's dimensions.
        const REFERENCE_HEIGHT = 640;
        this.scale = REFERENCE_HEIGHT / viewportHeight;

        // Background scaling (independent of game objects)
        const bgHeight = bg.height / 3;
        const bgScale = bgHeight / viewportHeight;
        this.bgWidthScaled = bg.width / bgScale;

        // Random x-offset if background is wider than screen (ensured as integer)
        if (this.bgWidthScaled > viewportWidth) {
            this.bgOffset = Math.floor(Math.random() * (viewportWidth - this.bgWidthScaled));
        } else {
            this.bgOffset = Math.floor((viewportWidth - this.bgWidthScaled) / 2);
        }

        // Update object dimensions
        const imgScale = viewportWidth < 768 ? 1.5 : 1.2; // roughly kImageScale from iOS
        this.objDim = Math.floor(imgScale * CONFIG.nutSize / this.scale);

        this.basket.width = Math.floor(imgScale * 80 / this.scale);
        this.basket.height = Math.floor(1.25 * imgScale * 60 / this.scale);
        this.basket.y = viewportHeight - this.basket.height - safeAreaBottom;

        this.squirrel.width = (this.assets.char_standing.width * CONFIG.charScale) / this.scale;
        this.squirrel.height = (this.assets.char_standing.height * CONFIG.charScale) / this.scale;

        if (this.state === GAME_STATE.OVER || this.state === GAME_STATE.LOST_LIFE) {
            this.centerBasketAndSquirrel();
        }
    }

    centerBasketAndSquirrel() {
        this.basket.x = (this.canvas.width - this.basket.width) / 2;
        this.squirrel.x = (this.canvas.width - this.squirrel.width) / 2;
        this.squirrel.y = CONFIG.squirrelYOffset / this.scale;
    }

    setupInput() {
        const handleMove = (x) => {
            if (this.state === GAME_STATE.RUNNING ||
                this.state === GAME_STATE.BETWEEN_LEVELS ||
                this.state === GAME_STATE.WAITING_FOR_LEVEL) {
                const leeway = this.basket.width * CONFIG.basketLeeway;
                const minX = -leeway;
                const maxX = this.canvas.width - this.basket.width + leeway;
                this.basket.x = Math.max(minX, Math.min(maxX, x - this.basket.width / 2));
            }
        };

        window.addEventListener('mousemove', (e) => handleMove(e.clientX));
        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            const speed = 20;
            if (e.key === 'ArrowLeft') handleMove(this.basket.x + this.basket.width / 2 - speed);
            if (e.key === 'ArrowRight') handleMove(this.basket.x + this.basket.width / 2 + speed);
        });

        this.startButton.onclick = () => {
            if (this.state === GAME_STATE.OVER || this.state === GAME_STATE.LOST_LIFE || this.state === GAME_STATE.TUTORIAL) {
                this.startGame();
            }
        };

        const isInteractiveElement = (target) => {
            return target.closest('a') || target.closest('#sound-action') || target.closest('#start-button');
        };

        window.addEventListener('mousedown', (e) => {
            if (this.state === GAME_STATE.TUTORIAL) {
                if (isInteractiveElement(e.target)) return;
                this.startGame();
            }
        });
        window.addEventListener('touchstart', (e) => {
            if (this.state === GAME_STATE.TUTORIAL) {
                if (isInteractiveElement(e.target)) return;
                this.startGame();
                return;
            }
            handleMove(e.touches[0].clientX);
        }, { passive: false });

        this.soundActionElement.onclick = (e) => {
            e.stopPropagation(); // Prevent triggering game start if on start screen
            this.toggleSound();
        };
        this.updateSoundUI();
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('soundEnabled', this.soundEnabled);
        this.updateSoundUI();
        if (!this.soundEnabled) {
            this.soundEffects.stop();
            this.musicPlaying = false;
        }
    }

    updateSoundUI() {
        if (this.soundEnabled) {
            this.soundToggleElement.innerHTML = 'Sound effects will play. <span id="sound-action">Mute</span>';
        } else {
            this.soundToggleElement.innerHTML = 'Sound effects will not play. <span id="sound-action">Unmute</span>';
        }
        // Re-attach listener since innerHTML replaced the element
        document.getElementById('sound-action').onclick = (e) => {
             e.stopPropagation();
             this.toggleSound();
        };
    }

    showTutorial() {
        this.scoreContainer.classList.add('hidden');
        this.homeLink.classList.remove('hidden');
        this.aboutLink.classList.remove('hidden');
        this.messageTitle.classList.remove('hidden');
        this.tutorialElement.classList.remove('hidden');
        this.gameOverInfo.classList.add('hidden');
        this.state = GAME_STATE.TUTORIAL;
        this.startButton.textContent = "Tap to Play";
        this.messageOverlay.classList.remove('hidden');
    }

    startGame() {
        this.scoreContainer.classList.remove('hidden');
        this.homeLink.classList.add('hidden');
        this.aboutLink.classList.add('hidden');
        this.state = GAME_STATE.RUNNING;
        this.messageOverlay.classList.add('hidden');
        this.score = 0;
        this.gemsCaught = 0;
        this.wormsCaught = 0;
        this.lastWormMilestone = 0;
        this.lastDeathReason = null;
        this.squirrel.nutProb = CONFIG.initialNutProb;
        this.squirrel.rockProb = CONFIG.initialRockProb;
        this.updateScoreLabels();
        this.centerBasketAndSquirrel();
        this.fallingObjects = [];
        this.worms = [];
        this.ghosts = [];

        if (this.soundEnabled) {
            this.soundEffects.requestSong();
        }

        this.startLevel();
    }

    startLevel() {
        this.state = GAME_STATE.RUNNING;
        this.squirrelImage = 'char_walk0';
        this.squirrel.startTime = performance.now();
        this.squirrel.lastActionTime = performance.now();
    }

    updateScoreLabels() {
        this.scoreElement.textContent = String(this.score).padStart(5, '0');
        const displayHighScore = Math.max(this.score, this.highScore);
        this.highScoreElement.textContent = String(displayHighScore).padStart(5, '0');
    }

    gameLoop(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.update(time, dt);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    spawnWorm() {
        const headingLeft = Math.random() < 0.5;
        const width = this.assets.worm0.width * CONFIG.wormScale / this.scale;
        const height = this.assets.worm0.height * CONFIG.wormScale / this.scale;
        this.worms.push({
            x: headingLeft ? this.canvas.width : -width,
            y: this.squirrel.y + this.squirrel.height - height,
            width: width,
            height: height,
            headingLeft: headingLeft,
            isDead: false,
            triggeredFalling: false,
            walkFrame: 0,
            walkTimer: 0,
            hasPassedAtLeastOnce: false
        });
    }

    spawnGhost(worm) {
        const width = this.assets.ghost.width * CONFIG.ghostScale / this.scale;
        const height = this.assets.ghost.height * CONFIG.ghostScale / this.scale;
        this.ghosts.push({
            x: worm.x + (worm.width - width) / 2,
            y: worm.y,
            baseX: worm.x + (worm.width - width) / 2,
            width: width,
            height: height,
            headingLeft: worm.headingLeft,
            startTime: performance.now()
        });
    }

    update(time, dt) {
        if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BETWEEN_LEVELS) {
            this.updateSquirrel(time, dt);
            this.updateWorms(time, dt);
            this.updateGhosts(time, dt);
        }

        if (this.state !== GAME_STATE.OVER) {
            this.updateFallingObjects(time, dt);
        }

        if (this.state === GAME_STATE.BETWEEN_LEVELS && this.fallingObjects.length === 0) {
            this.levelComplete();
        }

        if (this.state === GAME_STATE.LOST_LIFE && this.fallingObjects.length === 0) {
            this.gameOver();
        }

        const currentMilestone = Math.floor(this.gemsCaught / CONFIG.wormInterval);
        if (currentMilestone > this.lastWormMilestone) {
            this.lastWormMilestone = currentMilestone;
            this.spawnWorm();
        }
    }

    updateWorms(time, dt) {
        for (let i = this.worms.length - 1; i >= 0; i--) {
            const worm = this.worms[i];

            if (!worm.isDead) {
                let deltaX = CONFIG.wormCrawlSpeed * this.canvas.width * dt;
                if (worm.headingLeft) deltaX *= -1;
                worm.x += deltaX;

                worm.walkTimer += dt;
                if (worm.walkTimer > 0.2) {
                    worm.walkTimer = 0;
                    worm.walkFrame = (worm.walkFrame + 1) % 2;
                }

                const squirrelRect = { x: this.squirrel.x, y: this.squirrel.y, w: this.squirrel.width, h: this.squirrel.height };
                const wormRect = { x: worm.x, y: worm.y, w: worm.width, h: worm.height };
                if (this.rectIntersect(squirrelRect, wormRect)) {
                    worm.isDead = true;
                    this.spawnGhost(worm);
                }

                if ((worm.headingLeft && worm.x < -worm.width) || (!worm.headingLeft && worm.x > this.canvas.width)) {
                    this.worms.splice(i, 1);
                }
            } else if (!worm.triggeredFalling) {
                const squirrelRect = { x: this.squirrel.x, y: this.squirrel.y, w: this.squirrel.width, h: this.squirrel.height };
                const wormRect = { x: worm.x, y: worm.y, w: worm.width, h: worm.height };

                if (!this.rectIntersect(squirrelRect, wormRect)) {
                   worm.hasPassedAtLeastOnce = true;
                }

                if (worm.hasPassedAtLeastOnce && this.rectIntersect(squirrelRect, wormRect)) {
                    worm.triggeredFalling = true;
                    this.dropObject(ACTION.WORM, worm.x, worm.y, worm.headingLeft);
                    this.worms.splice(i, 1);
                }
            }
        }
    }

    updateGhosts(time, dt) {
        for (let i = this.ghosts.length - 1; i >= 0; i--) {
            const ghost = this.ghosts[i];
            const elapsed = (performance.now() - ghost.startTime) / 1000;

            ghost.y -= CONFIG.ghostRiseSpeed * dt;
            ghost.x = ghost.baseX + Math.sin(elapsed * CONFIG.ghostWiggleFrequency) * CONFIG.ghostWiggleAmplitude;

            if (ghost.y + ghost.height < 0) {
                this.ghosts.splice(i, 1);
            }
        }
    }

    rectIntersect(r1, r2) {
        return !(r2.x > r1.x + r1.w ||
                 r2.x + r2.w < r1.x ||
                 r2.y > r1.y + r1.h ||
                 r2.y + r2.h < r1.y);
    }

    updateSquirrel(time, dt) {
        if (this.state === GAME_STATE.RUNNING) {
            if (time >= this.squirrel.startTime + CONFIG.levelDuration) {
                this.state = GAME_STATE.BETWEEN_LEVELS;
                this.squirrel.rockProb = Math.min(this.squirrel.rockProb * 2.0, 0.2);
                return;
            }

            let deltaX = CONFIG.squirrelMovementSpeed * this.canvas.width * dt;
            if (this.squirrel.headingLeft) deltaX *= -1;

            this.squirrel.x += deltaX;
            if (this.squirrel.x < 0) {
                this.squirrel.x = 0;
                this.squirrel.headingLeft = false;
            } else if (this.squirrel.x > this.canvas.width - this.squirrel.width) {
                this.squirrel.x = this.canvas.width - this.squirrel.width;
                this.squirrel.headingLeft = true;
            }

            if (Math.random() < CONFIG.directionChangeProb * (dt / 0.1)) {
                this.squirrel.headingLeft = !this.squirrel.headingLeft;
            }

            this.squirrel.walkTimer += dt;
            if (this.squirrel.walkTimer > 0.1) {
                this.squirrel.walkTimer = 0;
                this.squirrel.walkFrame = (this.squirrel.walkFrame + 1) % 2;
            }

            if (this.squirrel.isDropping) {
                this.squirrel.dropTimer += dt;
                if (this.squirrel.dropTimer > 0.2) {
                    this.squirrel.isDropping = false;
                    this.squirrel.dropTimer = 0;
                }
            }

            if (time - this.squirrel.lastActionTime > 100) {
                this.squirrel.lastActionTime = time;
                if (Math.random() < this.squirrel.nutProb) {
                    this.dropObject(ACTION.NUT);
                } else if (Math.random() < this.squirrel.rockProb) {
                    this.dropObject(ACTION.ROCK);
                }
            }

            if (this.squirrel.isDropping) {
                this.squirrelImage = 'char_drop';
            } else {
                this.squirrelImage = this.squirrel.walkFrame === 0 ? 'char_walk0' : 'char_walk1';
            }
        }
    }

    dropObject(action, customX = null, customY = null, headingLeft = true) {
        this.squirrel.isDropping = true;
        this.squirrel.dropTimer = 0;

        let itemScale = 1.0;
        if (action === ACTION.NUT) itemScale = CONFIG.gemScale;
        if (action === ACTION.WORM) itemScale = CONFIG.wormScale;

        const dim = this.objDim * itemScale;
        const rotationSpeed = action === ACTION.ROCK ? (Math.random() * 4 - 2) * CONFIG.rockRotationSpeed : 0;

        let imageKey = 'rock';
        if (action === ACTION.NUT) {
            imageKey = `gem${Math.floor(Math.random() * 4)}`;
        } else if (action === ACTION.WORM) {
            imageKey = 'worm_dead';
        }

        const dropX = customX !== null ? customX : (this.squirrel.x + this.squirrel.width / 2 - dim / 2);
        const dropY = customY !== null ? customY : (this.squirrel.y + this.squirrel.height);

        this.fallingObjects.push({
            action: action,
            imageKey: imageKey,
            dim: dim,
            x: dropX,
            y: dropY,
            startTime: performance.now(),
            y0: dropY,
            rotationSpeed: rotationSpeed,
            headingLeft: headingLeft
        });
    }

    updateFallingObjects(time, dt) {
        for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
            const obj = this.fallingObjects[i];
            const elapsed = (time - obj.startTime) / 1000;
            obj.y = obj.y0 + elapsed * CONFIG.fallingSpeed * this.canvas.height;

            if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BETWEEN_LEVELS) {
                const basketRect = {
                    x: this.basket.x,
                    y: this.basket.y,
                    w: this.basket.width,
                    h: this.basket.height
                };

                const objRect = { x: obj.x, y: obj.y, w: obj.dim, h: obj.dim };

                if (obj.action === ACTION.NUT || obj.action === ACTION.WORM) {
                    const lenientBasket = {
                        x: basketRect.x - obj.dim / 2,
                        y: basketRect.y - obj.dim / 2,
                        w: basketRect.w + obj.dim,
                        h: basketRect.h + obj.dim / 2
                    };
                    if (this.rectContains(lenientBasket, objRect)) {
                        if (obj.action === ACTION.NUT) {
                            this.score++;
                            this.gemsCaught++;
                        } else {
                            this.score += CONFIG.wormPoints;
                            this.wormsCaught++;
                        }
                        this.updateScoreLabels();
                        this.playSound('nutCatch');
                        this.fallingObjects.splice(i, 1);
                        continue;
                    }
                } else if (obj.action === ACTION.ROCK) {
                    const strictBasket = {
                        x: basketRect.x + obj.dim / 2,
                        y: basketRect.y + obj.dim / 2,
                        w: basketRect.w - obj.dim,
                        h: basketRect.h - obj.dim / 2
                    };
                    if (this.rectContains(strictBasket, objRect)) {
                        this.playSound('rockCatch');
                        this.lastDeathReason = ACTION.ROCK;
                        this.state = GAME_STATE.LOST_LIFE;
                        this.fallingObjects.splice(i, 1);
                        continue;
                    }
                }
            }

            if (obj.y > this.canvas.height) {
                if (obj.action === ACTION.NUT) {
                    this.playSound('nutMiss');
                    if (this.state === GAME_STATE.RUNNING || this.state === GAME_STATE.BETWEEN_LEVELS) {
                        this.lastDeathReason = ACTION.NUT;
                        this.state = GAME_STATE.LOST_LIFE;
                    }
                }
                this.fallingObjects.splice(i, 1);
            }
        }
    }

    rectContains(outer, inner) {
        return (inner.x >= outer.x &&
                inner.x + inner.w <= outer.x + outer.w &&
                inner.y >= outer.y &&
                inner.y + inner.h <= outer.y + outer.h);
    }

    levelComplete() {
        this.squirrelImage = 'char_upset';
        this.playSound('madSquirrel');
        setTimeout(() => {
            this.startLevel();
        }, 2000);
        this.state = GAME_STATE.WAITING_FOR_LEVEL;
    }

    gameOver() {
        this.squirrelImage = 'char_happy';
        this.playSound('happySquirrel');
        this.soundEffects.fadeOut();
        const newRecord = this.score > this.highScore;
        if (newRecord) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
            this.updateScoreLabels();
        }

        setTimeout(() => {
            this.showGameOverScreen(newRecord);
        }, 500);
        this.state = GAME_STATE.OVER;
    }

    showGameOverScreen(newRecord) {
        this.messageTitle.classList.add('hidden');
        this.tutorialElement.classList.add('hidden');
        this.gameOverInfo.classList.remove('hidden');

        let taunt = this.lastDeathReason === ACTION.ROCK ? "You got spiked." : "Butterfingers.";

        this.tauntElement.textContent = taunt;
        const recordText = newRecord ? "a record " : "";

        let scoreSummary = `(${this.score === 0 ? "" : "but "}you saved ${recordText}${this.gemsCaught} gem${this.gemsCaught !== 1 ? 's' : ''}`;
        if (this.wormsCaught > 0) {
            scoreSummary += ` and caught ${this.wormsCaught} tasty worm${this.wormsCaught !== 1 ? 's' : ''}`;
        }
        scoreSummary += `)`;

        this.finalScoreElement.textContent = scoreSummary;

        this.startButton.textContent = "Rematch?";
        this.messageOverlay.classList.remove('hidden');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bg = this.assets.background;
        const bgSrcHeight = bg.height / 3;
        this.ctx.drawImage(
            bg,
            0, 0, bg.width, bgSrcHeight,
            this.bgOffset, 0, this.bgWidthScaled, this.canvas.height
        );

        const platformTile = this.assets.platform;
        if (platformTile) {
            const pScale = CONFIG.platformScale / this.scale;
            const pTileW = platformTile.width * pScale;
            const pTileH = platformTile.height * pScale;
            const pY = this.squirrel.y + this.squirrel.height;
            for (let px = 0; px < this.canvas.width; px += pTileW) {
                this.ctx.drawImage(platformTile, px, pY, pTileW, pTileH);
            }
        }

        for (const worm of this.worms) {
            let img = worm.isDead ? this.assets.worm_dead : (worm.walkFrame === 0 ? this.assets.worm0 : this.assets.worm1);

            this.ctx.save();
            if (!worm.headingLeft) {
                this.ctx.translate(worm.x + worm.width, worm.y);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(img, 0, 0, worm.width, worm.height);
            } else {
                this.ctx.drawImage(img, worm.x, worm.y, worm.width, worm.height);
            }
            this.ctx.restore();
        }

        for (const ghost of this.ghosts) {
            this.ctx.save();
            if (!ghost.headingLeft) {
                this.ctx.translate(ghost.x + ghost.width, ghost.y);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(this.assets.ghost, 0, 0, ghost.width, ghost.height);
            } else {
                this.ctx.drawImage(this.assets.ghost, ghost.x, ghost.y, ghost.width, ghost.height);
            }
            this.ctx.restore();
        }

        let squirrelImg = this.assets[this.squirrelImage];
        if (!squirrelImg) squirrelImg = this.assets.char_standing;

        const sX = Math.round(this.squirrel.x);
        const sY = Math.round(this.squirrel.y);
        const sW = Math.round(this.squirrel.width);
        const sH = Math.round(this.squirrel.height);

        this.ctx.save();
        if (this.squirrelImage !== 'char_standing') {
            if (this.squirrel.headingLeft) {
                this.ctx.translate(sX + sW, sY);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(squirrelImg, 0, 0, sW, sH);
            } else {
                this.ctx.drawImage(squirrelImg, sX, sY, sW, sH);
            }
        } else {
            this.ctx.drawImage(squirrelImg, sX, sY, sW, sH);
        }
        this.ctx.restore();

        for (const obj of this.fallingObjects) {
            const img = this.assets[obj.imageKey];
            const elapsed = (performance.now() - obj.startTime) / 1000;
            const angle = elapsed * (obj.rotationSpeed || 0);

            this.ctx.save();
            const drawX = Math.round(obj.x + obj.dim / 2);
            const drawY = Math.round(obj.y + obj.dim / 2);
            const drawDim = Math.round(obj.dim);

            this.ctx.translate(drawX, drawY);
            this.ctx.rotate(angle);
            if (!obj.headingLeft) {
                this.ctx.scale(-1, 1);
            }
            this.ctx.drawImage(img, -drawDim / 2, -drawDim / 2, drawDim, drawDim);
            this.ctx.restore();
        }

        const groundTile = this.assets.ground;
        if (groundTile) {
            const gScale = CONFIG.platformScale / this.scale;
            const gTileW = groundTile.width * gScale;
            const gTileH = groundTile.height * gScale;
            const gY = this.basket.y + this.basket.height;
            for (let gx = 0; gx < this.canvas.width; gx += gTileW) {
                this.ctx.drawImage(groundTile, gx, gY, gTileW, gTileH);
            }
        }

        this.ctx.drawImage(this.assets.basket, this.basket.x, this.basket.y, this.basket.width, this.basket.height);
    }
}

window.onload = () => {
    new Game();
};
