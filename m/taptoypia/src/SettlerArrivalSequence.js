if (typeof module !== 'undefined' && module.exports) {
    ({ pLog, MAUtils } = require('./Utilities.js'));
    ({ Tuning } = require('./Tuning.js'));
}

class SettlerArrivalSequence {
    constructor(gameState, uiManager, camera, landingSite) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.camera = camera;
        this.landingSite = landingSite;
        this.active = false;
        this.phase = null;
        this.phaseElapsedMs = 0;
        this.rocketOffsetsMs = [0, 180, 360, 540, 720];
        this.phaseDelayMs = (typeof Tuning !== 'undefined' && Tuning.SETTLER_POST_LANDING_DELAY_MS) || 10000;
    }

    getPersistedSequenceState() {
        return this.gameState && this.gameState.state && this.gameState.state.endGameSequence
            ? this.gameState.state.endGameSequence
            : null;
    }

    persistSequenceState() {
        if (!this.gameState || !this.gameState.state) {
            return;
        }

        this.gameState.state.endGameSequence = {
            active: !!this.active,
            phase: this.phase || null,
            phaseElapsedMs: Math.max(0, Math.floor(this.phaseElapsedMs || 0))
        };
        this.gameState.save();
    }

    static formatPlayTime(playTimeMs) {
        const totalMinutes = playTimeMs > 0
            ? Math.max(1, Math.round(playTimeMs / 60000))
            : 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) {
            return `(${hours} hour${hours === 1 ? '' : 's'}, ${minutes} minute${minutes === 1 ? '' : 's'})`;
        }
        return `(${minutes} minute${minutes === 1 ? '' : 's'})`;
    }

    static pluralizedCount(count, singular, plural = `${singular}s`) {
        return `${count} ${count === 1 ? singular : plural}`;
    }

    static buildEndGameSummary(gameState) {
        const totalCells = Math.max(1, gameState.gridSize * gameState.gridSize);
        let revealedCount = 0;
        for (let y = 0; y < gameState.gridSize; y++) {
            for (let x = 0; x < gameState.gridSize; x++) {
                const cell = gameState.grid.getCell(x, y);
                if (cell && cell.revealed) {
                    revealedCount++;
                }
            }
        }
        const revealedPercent = Math.round((revealedCount / totalCells) * 100);
        const stats = gameState.state.stats || {};
        return `You revealed ${revealedPercent}% of the map. You recruited ${SettlerArrivalSequence.pluralizedCount(stats.animalsRecruited || 0, 'animal')}, harvested ${SettlerArrivalSequence.pluralizedCount(stats.carrotsHarvested || 0, 'carrot')}, gathered ${SettlerArrivalSequence.pluralizedCount(stats.woodGathered || 0, 'wood', 'wood')}, planted ${SettlerArrivalSequence.pluralizedCount(stats.seedsPlanted || 0, 'seed')}, and built ${SettlerArrivalSequence.pluralizedCount(stats.housesBuilt || 0, 'house')}. Though you built a thriving colony, the new settlers did not accept your leadership. At least your legacy lives on.`;
    }

    getLandingSites() {
        return Array.isArray(this.gameState.state.settlerLandingSites)
            ? this.gameState.state.settlerLandingSites
            : [];
    }

    ensureLandingSites() {
        const existingSites = this.getLandingSites();
        if (existingSites.length >= 5) {
            return existingSites;
        }

        const candidates = [];
        for (let y = 0; y < this.gameState.gridSize; y++) {
            for (let x = 0; x < this.gameState.gridSize; x++) {
                const cell = this.gameState.grid.getCell(x, y);
                if (!cell || !cell.revealed || cell.item || cell.character || cell.landType === 'water') {
                    continue;
                }
                const dx = x - this.landingSite.x;
                const dy = y - this.landingSite.y;
                candidates.push({
                    x,
                    y,
                    distance: Math.abs(dx) + Math.abs(dy)
                });
            }
        }

        candidates.sort((a, b) => a.distance - b.distance);
        const chosenSites = candidates.slice(0, 5).map(({ x, y }) => ({ x, y }));
        this.gameState.state.settlerLandingSites = chosenSites;
        return chosenSites;
    }

    placeSettlerShipsOnMap() {
        const landingSites = this.ensureLandingSites();
        landingSites.forEach(({ x, y }) => {
            const cell = this.gameState.grid.getCell(x, y);
            if (!cell) {
                return;
            }
            cell.reveal();
            cell.setItem("Space Ship");
        });
    }

    getPhaseStoryMessage(phase = this.phase) {
        if (phase === 'transmitting') {
            return "Transmitting invitation to Earth...";
        }
        if (phase === 'arriving' || phase === 'pan' || phase === 'rockets') {
            return "Settlers arriving...";
        }
        if (phase === 'congrats') {
            return "Humanity now has a second home. Humanity's survival odds have increased to 81%. Congratulations on completing your mission!";
        }
        if (phase === 'downfall') {
            return "Unfortunately, the new settlers have not taken kindly to your benevolent dictatorship. Your survival odds have decreased to 2%.";
        }
        return null;
    }

    restorePresentationForCurrentPhase() {
        if (this.phase === 'pan' || this.phase === 'rockets' || this.phase === 'congrats' || this.phase === 'downfall') {
            this.camera.centerOn(this.landingSite.x, this.landingSite.y);
        }

        if (this.phase === 'congrats' || this.phase === 'downfall') {
            this.placeSettlerShipsOnMap();
        }

        const message = this.getPhaseStoryMessage();
        if (message) {
            this.uiManager.addStoryMessage(message);
        }
    }

    start() {
        if (this.active || !this.landingSite) {
            return false;
        }
        this.active = true;
        this.phase = 'transmitting';
        this.phaseElapsedMs = 0;
        this.ensureLandingSites();
        this.uiManager.addStoryMessage("Transmitting invitation to Earth...");
        if (this.uiManager && this.uiManager.beginEndGameMusicMode) {
            this.uiManager.beginEndGameMusicMode(() => {
                if (this.uiManager && this.uiManager.playNamedSound) {
                    this.uiManager.playNamedSound("inviteSettlers");
                }
            });
        } else if (this.uiManager && this.uiManager.playNamedSound) {
            this.uiManager.playNamedSound("inviteSettlers");
        }
        pLog.log(105);
        this.persistSequenceState();
        return true;
    }

    resumeFromSavedState() {
        const savedState = this.getPersistedSequenceState();
        if (!savedState || !savedState.active || !savedState.phase || !this.landingSite) {
            return false;
        }

        this.active = true;
        this.phase = savedState.phase;
        this.phaseElapsedMs = Math.max(0, savedState.phaseElapsedMs || 0);
        this.restorePresentationForCurrentPhase();
        pLog.log(119);
        return true;
    }

    advancePhase(nextPhase) {
        this.phase = nextPhase;
        this.phaseElapsedMs = 0;

        if (nextPhase === 'arriving') {
            this.uiManager.addStoryMessage("Settlers arriving...");
            pLog.log(114);
        } else if (nextPhase === 'pan') {
            this.camera.centerOn(this.landingSite.x, this.landingSite.y);
            pLog.log(115);
        } else if (nextPhase === 'rockets') {
            this.camera.centerOn(this.landingSite.x, this.landingSite.y);
        } else if (nextPhase === 'congrats') {
            this.placeSettlerShipsOnMap();
            this.gameState.state.story.settlersArrived = true;
            this.gameState.state.survivalOdds = 81;
            this.uiManager.addStoryMessage("Humanity now has a second home. Humanity's survival odds have increased to 81%. Congratulations on completing your mission!");
            if (this.uiManager && this.uiManager.playNamedSound) {
                this.uiManager.playNamedSound("settlersArrive");
            }
            pLog.log(116);
            this.gameState.save();
        } else if (nextPhase === 'downfall') {
            this.gameState.state.survivalOdds = 2;
            this.uiManager.addStoryMessage("Unfortunately, the new settlers have not taken kindly to your benevolent dictatorship. Your survival odds have decreased to 2%.");
            if (this.uiManager && this.uiManager.playNamedSound) {
                this.uiManager.playNamedSound("settlersUnhappy");
            }
            pLog.log(117);
            this.gameState.save();
        } else if (nextPhase === 'tombstone') {
            this.active = false;
            this.gameState.state.gameEnded = true;
            this.gameState.state.endGameTimer = null;
            this.uiManager.showEndGame(
                SettlerArrivalSequence.buildEndGameSummary(this.gameState),
                SettlerArrivalSequence.formatPlayTime(this.gameState.state.playTimeMs || 0)
            );
            if (this.uiManager && this.uiManager.playNamedSound) {
                this.uiManager.playNamedSound("gameOver");
            }
            this.persistSequenceState();
            pLog.log(118);
            return;
        }

        this.persistSequenceState();
    }

    update(deltaTime) {
        if (!this.active || !this.phase) {
            return;
        }

        this.phaseElapsedMs += deltaTime;
        this.persistSequenceState();

        if (this.phase === 'transmitting' && this.phaseElapsedMs >= 2000) {
            this.advancePhase('arriving');
        } else if (this.phase === 'arriving' && this.phaseElapsedMs >= 2000) {
            this.advancePhase('pan');
        } else if (this.phase === 'pan' && this.phaseElapsedMs >= 2000) {
            this.advancePhase('rockets');
        } else if (this.phase === 'rockets' && this.phaseElapsedMs >= 3200) {
            this.advancePhase('congrats');
        } else if (this.phase === 'congrats' && this.phaseElapsedMs >= this.phaseDelayMs) {
            this.advancePhase('downfall');
        } else if (this.phase === 'downfall' && this.phaseElapsedMs >= this.phaseDelayMs) {
            this.advancePhase('tombstone');
        }
    }

    getRocketRenderStates(camera = this.camera) {
        if (!this.active || this.phase !== 'rockets' || !this.landingSite || !camera) {
            return [];
        }

        const landingSites = this.ensureLandingSites();
        const states = [];
        for (let i = 0; i < Math.min(this.rocketOffsetsMs.length, landingSites.length); i++) {
            const localElapsedMs = this.phaseElapsedMs - this.rocketOffsetsMs[i];
            if (localElapsedMs < 0) {
                continue;
            }

            const progress = Math.max(0, Math.min(1, localElapsedMs / 2200));
            const scaleProgress = MAUtils.easeOutQuad(progress);
            const spriteScale = 3.2 - (2.2 * scaleProgress);
            const targetX = landingSites[i].x;
            const targetY = landingSites[i].y;
            const screenX = (targetX * camera.cellSize) - camera.x;
            const screenY = (targetY * camera.cellSize) - camera.y;
            const cellSize = camera.cellSize;
            const spriteSize = cellSize * spriteScale;

            states.push({
                frameName: localElapsedMs % 840 < 420 ? 'rocketlanding0' : 'rocketlanding1',
                x: screenX + ((cellSize - spriteSize) / 2),
                y: screenY + ((cellSize - spriteSize) / 2),
                width: spriteSize,
                height: spriteSize
            });
        }

        return states;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettlerArrivalSequence };
}
