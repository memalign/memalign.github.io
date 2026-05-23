if (typeof module !== 'undefined' && module.exports) {
    ({ GameState } = require('./GameState.js'));
    ({ SoundEffects } = require('./SoundEffects.js'));
    ({ UIManager } = require('./UIManager.js'));
    ({ Camera } = require('./Camera.js'));
    ({ GameEngine } = require('./GameEngine.js'));
    ({ GlobeRenderer } = require('./GlobeRenderer.js'));
    ({ ThreeMapRenderer } = require('./ThreeMapRenderer.js'));
    ({ SettlerArrivalSequence } = require('./SettlerArrivalSequence.js'));
    ({ pLog } = require('./Utilities.js'));
}

class AppOrchestrator {
    constructor() {
        this.gameState = null;
        this.soundEffects = null;
        this.uiManager = null;
        this.camera = null;
        this.globeRenderer = null;
        this.threeMapRenderer = null;
        this.engine = null;
        this.gridSize = 0;
    }

    findLandingSiteCell() {
        if (!this.gameState || !this.gameState.grid) {
            return null;
        }

        for (let y = 0; y < this.gameState.grid.height; y++) {
            for (let x = 0; x < this.gameState.grid.width; x++) {
                const cell = this.gameState.grid.getCell(x, y);
                if (cell && cell.item === "Space Ship") {
                    return { x, y, cell };
                }
            }
        }

        return null;
    }

    start(viewportWidth, viewportHeight, rendererMode, RENDERER_MODES) {
        // 1. INITIALIZE CORE
        this.gameState = new GameState();
        this.soundEffects = new SoundEffects();
        this.soundEffects.loadSounds();
        this.uiManager = new UIManager(this.gameState, this.soundEffects);
        pLog.log(106);

        // 2. LOAD PERSISTENCE (MUST happen before story or camera)
        this.uiManager.loadGame();
        if (this.gameState.state.victoryClaimed) {
            this.soundEffects.enterEndGameMusicMode();
            pLog.log(125);
        }
        this.gridSize = this.gameState.gridSize;
        const landingSite = this.findLandingSiteCell();
        const startupLandingPending = !!(this.gameState.state && this.gameState.state.startupLandingPending && landingSite);
        if (startupLandingPending) {
            landingSite.cell.revealed = false;
        }
        pLog.log(107);

        // 3. INITIALIZE RENDERERS & CAMERA
        this.camera = new Camera(viewportWidth, viewportHeight, this.gridSize, 60);
        this.globeRenderer = new GlobeRenderer(viewportWidth, viewportHeight);
        this.threeMapRenderer = (rendererMode === RENDERER_MODES.THREE_SURFACE)
            ? new ThreeMapRenderer(viewportWidth, viewportHeight)
            : null;
        pLog.log(108);

        // 4. INITIALIZE ENGINE
        this.engine = new GameEngine(this.gameState, this.uiManager);
        pLog.log(109);

        // 5. STARTUP STORY (MUST happen after load to avoid overwriting with fresh save)
        let introDeferred = false;
        if (this.gameState.state.gameEnded && !this.gameState.state.worldViewActive) {
            this.uiManager.showEndGame(
                SettlerArrivalSequence.buildEndGameSummary(this.gameState),
                SettlerArrivalSequence.formatPlayTime(this.gameState.state.playTimeMs || 0)
            );
            pLog.log(120);
        } else if (startupLandingPending) {
            introDeferred = true;
        } else {
            const storyTriggered = this.gameState.triggerStory("intro", this.uiManager);
            if (!storyTriggered) {
                this.uiManager.addStoryMessage(`Your survival odds are ${this.gameState.state.survivalOdds}%`);
                pLog.log(111);
            } else {
                pLog.log(112);
            }
        }
        pLog.log(110);

        return {
            gameState: this.gameState,
            soundEffects: this.soundEffects,
            uiManager: this.uiManager,
            camera: this.camera,
            globeRenderer: this.globeRenderer,
            threeMapRenderer: this.threeMapRenderer,
            engine: this.engine,
            gridSize: this.gridSize,
            startupLandingPending,
            landingSite: landingSite ? { x: landingSite.x, y: landingSite.y } : null,
            introDeferred
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppOrchestrator };
}
