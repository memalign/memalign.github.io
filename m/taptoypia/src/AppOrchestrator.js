if (typeof module !== 'undefined' && module.exports) {
    ({ GameState } = require('./GameState.js'));
    ({ SoundEffects } = require('./SoundEffects.js'));
    ({ UIManager } = require('./UIManager.js'));
    ({ Camera } = require('./Camera.js'));
    ({ GameEngine } = require('./GameEngine.js'));
    ({ GlobeRenderer } = require('./GlobeRenderer.js'));
    ({ ThreeMapRenderer } = require('./ThreeMapRenderer.js'));
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

    start(viewportWidth, viewportHeight, rendererMode, RENDERER_MODES) {
        // 1. INITIALIZE CORE
        this.gameState = new GameState();
        this.soundEffects = new SoundEffects();
        this.uiManager = new UIManager(this.gameState, this.soundEffects);
        pLog.log(106);

        // 2. LOAD PERSISTENCE (MUST happen before story or camera)
        this.uiManager.loadGame();
        this.gridSize = this.gameState.gridSize;
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
        this.soundEffects.loadSounds();
        pLog.log(109);

        // 5. STARTUP STORY (MUST happen after load to avoid overwriting with fresh save)
        const storyTriggered = this.gameState.triggerStory("intro", this.uiManager);
        if (!storyTriggered) {
            this.uiManager.addStoryMessage(`Your survival odds are ${this.gameState.state.survivalOdds}%`);
            pLog.log(111);
        } else {
            pLog.log(112);
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
            gridSize: this.gridSize
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppOrchestrator };
}
