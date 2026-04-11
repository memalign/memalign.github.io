if (typeof module !== 'undefined' && module.exports) {
    ({ Tuning } = require('./Tuning.js'));
    ({ Reproduction } = require('./Reproduction.js'));
    ({ pLog } = require('./Utilities.js'));
}

class GameEngine {
    constructor(gameState, uiManager) {
        this.gameState = gameState;
        this.uiManager = uiManager;

        this.farmTimer = 0;
        this.treeTimer = 0;
        this.hatchTimer = 0;
        this.exploreTimer = 0;
        this.autoTimer = 0;
        this.saveTimer = 0;
    }

    update(deltaTime) {
        this.farmTimer += deltaTime;
        this.treeTimer += deltaTime;
        this.hatchTimer += deltaTime;
        this.exploreTimer += deltaTime;
        this.autoTimer += deltaTime;
        this.saveTimer += deltaTime;

        if (this.farmTimer >= Tuning.FARM_GROWTH_INTERVAL_MS) {
            this.updateFarming();
            pLog.log(40);
            this.farmTimer = 0;
        }
        if (this.treeTimer >= Tuning.TREE_GROWTH_INTERVAL_MS) {
            this.updateTreeGrowth();
            this.gameState.updateMining();
            pLog.log(41);
            this.treeTimer = 0;
        }
        if (this.hatchTimer >= Tuning.CHARACTER_HATCH_CHECK_INTERVAL_MS) {
            this.updateHatching();
            pLog.log(42);
            this.hatchTimer = 0;
        }
        if (this.exploreTimer >= Tuning.CHARACTER_EXPLORE_INTERVAL_MS) {
            this.updateExploration();
            pLog.log(43);
            this.exploreTimer = 0;
        }

        if (this.autoTimer >= Tuning.AUTO_AUTOMATION_INTERVAL_MS) {
            let actionOccurred = false;
            if (this.gameState.autoHarvest()) { actionOccurred = true; }
            if (this.gameState.autoFeed()) { actionOccurred = true; }

            if (actionOccurred) {
                this.uiManager.updateInventoryUI();
            }
            pLog.log(44);
            this.autoTimer = 0;
        }

        if (this.saveTimer >= Tuning.AUTO_SAVE_INTERVAL_MS) {
            this.gameState.save();
            pLog.log(80);
            this.saveTimer = 0;
        }

        if (this.gameState.state.endGameTimer !== null) {
            this.gameState.state.endGameTimer -= deltaTime;
            if (this.gameState.state.endGameTimer <= 0) {
                this.gameState.state.endGameTimer = null;
                this.gameState.state.gameEnded = true;
                this.uiManager.showEndGame();
                this.gameState.save();
                pLog.log(96);
            }
        }
    }

    updateFarming() {
        let growthOccurred = false;
        const GRID_SIZE = this.gameState.gridSize;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = this.gameState.grid.getCell(x, y);
                if (cell && cell.revealed && cell.landType === "farm" && !cell.item && !cell.character) {
                    const rand = Math.random();
                    if (rand < Tuning.FARM_TREE_PROBABILITY) {
                        cell.setItem("tree"); growthOccurred = true;
                        pLog.log(51);
                    } else if (rand < Tuning.FARM_TREE_PROBABILITY + Tuning.FARM_CARROT_PROBABILITY) {
                        cell.setItem("carrot"); growthOccurred = true;
                        pLog.log(52);
                    } else if (rand < Tuning.FARM_TREE_PROBABILITY + Tuning.FARM_CARROT_PROBABILITY + Tuning.FARM_SEED_PROBABILITY) {
                        cell.setItem("seed"); growthOccurred = true;
                        pLog.log(53);
                    }
                }
            }
        }
        if (growthOccurred) {
            this.uiManager.updateMissions();
        }
    }

    updateTreeGrowth() {
        if (Math.random() < Tuning.TREE_GROWTH_PROBABILITY) {
            const candidates = [];
            const GRID_SIZE = this.gameState.gridSize;
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const cell = this.gameState.grid.getCell(x, y);
                    if (cell && cell.revealed && cell.landType === "grass" && !cell.item && !cell.character) {
                        candidates.push(cell);
                    }
                }
            }
            if (candidates.length > 0) {
                candidates[Math.floor(Math.random() * candidates.length)].setItem("tree");
                this.uiManager.updateMissions();
                pLog.log(54);
            } else {
                pLog.log(56);
            }
        } else {
            pLog.log(55);
        }
    }

    updateHatching() {
        const now = Date.now();
        const GRID_SIZE = this.gameState.gridSize;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = this.gameState.grid.getCell(x, y);
                if (cell && cell.character) {
                    const char = cell.character;
                    if (char.type === "Egg" && now >= char.hatchTime) {
                        char.type = char.hatchesInto;
                        char.hatchesInto = null;
                        char.hatchTime = null;
                        pLog.log(57);
                    }
                }
            }
        }
    }

    updateExploration() {
        const activeCharacters = [];
        const GRID_SIZE = this.gameState.gridSize;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = this.gameState.grid.getCell(x, y);
                if (cell && cell.character && cell.character.owned && !cell.character.isHungry) {
                    activeCharacters.push({ cell, x, y });
                }
            }
        }

        activeCharacters.forEach(({ cell, x, y }) => {
            const char = cell.character;
            const potentialTargets = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) { continue; }
                    const nx = x + dx, ny = y + dy;
                    const neighbor = this.gameState.grid.getCell(nx, ny);
                    if (neighbor) {
                        const weight = neighbor.revealed ? 1 : 10;
                        for (let i = 0; i < weight; i++) { potentialTargets.push({ nx, ny, neighbor }); }
                    }
                }
            }

            if (potentialTargets.length > 0) {
                const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                const wasRevealed = target.neighbor.revealed;
                target.neighbor.reveal();

                if (!wasRevealed) {
                    pLog.log(58);
                    if (target.neighbor.character) {
                        this.gameState.state.firstAnimalRevealed = true;
                        pLog.log(59);
                    }
                    if (target.neighbor.item === "tree") {
                        this.gameState.state.firstTreeRevealed = true;
                        pLog.log(60);
                    }
                    this.uiManager.updateMissions();
                }

                let canEnter = (char.type === "WaterAnimal") ? (target.neighbor.landType === "water") :
                               (char.type === "FireAnimal") ? (target.neighbor.landType !== "water") : true;

                if (canEnter && !target.neighbor.character) {
                    cell.setCharacter(null);
                    target.neighbor.setCharacter(char);
                    char.movesMade++;
                    pLog.log(61);

                    if (Reproduction.tryReproduction(this.gameState, this.uiManager, char, target.nx, target.ny)) {
                        pLog.log(62);
                    }

                    if (char.movesMade >= Tuning.CHARACTER_MAX_MOVES) {
                        char.isHungry = true;
                        this.uiManager.updateInventoryUI();
                        pLog.log(63);
                    }
                }
            }
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine };
}
