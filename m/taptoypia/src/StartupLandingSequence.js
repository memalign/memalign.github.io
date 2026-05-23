if (typeof module !== 'undefined' && module.exports) {
    ({ MAUtils } = require('./Utilities.js'));
}

class StartupLandingSequence {
    constructor(gameState, uiManager, options = {}) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.active = !!options.active;
        this.elapsedMs = 0;
        this.durationMs = options.durationMs || 5000;
        this.shipCell = options.shipCell || null;
        this.introDeferred = !!options.introDeferred;
        this.lastCountdownValue = null;
    }

    getCountdownValue() {
        const remainingMs = Math.max(0, this.durationMs - this.elapsedMs);
        return Math.max(1, Math.ceil(remainingMs / 1000));
    }

    getCountdownMessage() {
        const countdownValue = this.getCountdownValue();
        const steps = [];
        for (let value = 5; value >= countdownValue; value--) {
            steps.push(String(value));
        }
        return `Landing sequence commence! Landing in ${steps.join('... ')}...`;
    }

    syncCountdownMessage() {
        const countdownValue = this.getCountdownValue();
        if (this.lastCountdownValue === countdownValue) {
            return;
        }

        if (this.uiManager) {
            this.uiManager.addStoryMessage(this.getCountdownMessage());
        }
        this.lastCountdownValue = countdownValue;
    }

    complete() {
        if (!this.active || !this.shipCell) {
            this.active = false;
            return;
        }

        const shipCell = this.gameState.grid.getCell(this.shipCell.x, this.shipCell.y);
        if (shipCell) {
            shipCell.reveal();
        }

        this.gameState.state.startupLandingPending = false;

        if (this.introDeferred) {
            const storyTriggered = this.gameState.triggerStory("intro", this.uiManager);
            if (!storyTriggered && this.uiManager) {
                this.uiManager.addStoryMessage(`Your survival odds are ${this.gameState.state.survivalOdds}%`);
            }
        }

        this.gameState.save();
        this.active = false;
    }

    update(deltaTime) {
        if (!this.active) {
            return;
        }

        this.elapsedMs += deltaTime;
        this.syncCountdownMessage();

        if (this.elapsedMs >= this.durationMs) {
            this.complete();
        }
    }

    getRenderState(camera) {
        if (!this.active || !this.shipCell || !camera) {
            return null;
        }

        const screenX = (this.shipCell.x * camera.cellSize) - camera.x;
        const screenY = (this.shipCell.y * camera.cellSize) - camera.y;
        const cellSize = camera.cellSize;
        const rawProgress = Math.max(0, Math.min(1, this.elapsedMs / Math.max(this.durationMs, 1)));
        const scaleProgress = MAUtils.easeOutQuad(rawProgress);
        const spriteScale = 3.2 - (2.2 * scaleProgress);
        const spriteSize = cellSize * spriteScale;

        return {
            frameName: this.elapsedMs % 840 < 420 ? 'rocketlanding0' : 'rocketlanding1',
            x: screenX + ((cellSize - spriteSize) / 2),
            y: screenY + ((cellSize - spriteSize) / 2),
            width: spriteSize,
            height: spriteSize
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StartupLandingSequence };
}
