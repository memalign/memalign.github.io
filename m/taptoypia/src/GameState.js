if (typeof module !== 'undefined' && module.exports) {
    ({ Grid } = require('./Grid.js'));
    ({ Inventory } = require('./Inventory.js'));
    ({ Tuning } = require('./Tuning.js'));
    ({ GameCharacter } = require('./GameCharacter.js'));
    ({ pLog } = require('./Utilities.js'));
    ({ maStorage } = require('./MAStorage.js'));
}

class GameState {
    constructor(skipInit = false) {
        this.gridSize = Tuning.GRID_SIZE;
        if (skipInit) return;

        this.grid = new Grid(this.gridSize, this.gridSize);
        this.inventory = new Inventory();

        this.state = {
            firstAnimalRevealed: false,
            firstAnimalOwned: false,
            firstTreeRevealed: false,
            neverMadeFarm: true,
            housesCount: 0,
            everReached20Wood: false,
            isBuildingResearchCenter: false,
            researchCenterBuilt: false,
            researchLevel: 0, // 0: None, 1: Auto-harvest, 2: Auto-feed, 3: Mining
            isBuildingCommunicationTower: false,
            communicationTowerBuilt: false,
            victoryClaimed: false,
            gameEnded: false,
            endGameTimer: null,
            survivalOdds: 0,
            story: {
                introShown: false,
                carrotsGathered: 0,
                woodGathered: 0,
                housesBuilt: 0,
                animalsRecruited: 0,
                oreGathered: 0,
                commTowerBuilt: false,
                settlersArrived: false
            }
        };
    }

    toJSON() {
        return {
            state: this.state,
            inventory: this.inventory.toJSON(),
            grid: this.grid.toJSON()
        };
    }

    static fromJSON(data) {
        const gameState = new GameState(true);
        gameState.state = Object.assign({}, data.state);
        gameState.inventory = Inventory.fromJSON(data.inventory);
        gameState.grid = Grid.fromJSON(data.grid);
        gameState.gridSize = gameState.grid.width;
        return gameState;
    }

    triggerStory(event, uiManager) {
        const story = this.state.story;
        let message = null;

        if (event === "intro" && !story.introShown) {
            story.introShown = true;
            message = "Welcome to the unexplored planet of TapToyPia. Your exciting mission: ensure the survival of humanity by establishing a thriving off-Earth colony. To aid your mission, your rocket ship was fueled for a one-way trip to the planet. I hope you find your new home comfortable. (Click to reveal. Drag to pan or rotate. Scroll to zoom. Zoom far out to view the globe.)";
            pLog.log(98);
        } else if (event === "carrot" && story.carrotsGathered < 10) {
            story.carrotsGathered++;
            this.state.survivalOdds += 1;
            message = `Your survival odds have increased to ${this.state.survivalOdds}%`;
            pLog.log(99);
        } else if (event === "wood" && story.woodGathered < 3) {
            story.woodGathered++;
            this.state.survivalOdds += 5;
            const woodMessages = [
                "What an abundance of natural resources.",
                "You're a regular Paul Bunyon.",
                "Keep this up and you'll be able to build."
            ];
            message = `${woodMessages[story.woodGathered - 1]} Your survival odds have increased to ${this.state.survivalOdds}%`;
            pLog.log(100);
        } else if (event === "house" && story.housesBuilt < 5) {
            story.housesBuilt++;
            this.state.survivalOdds += 4;
            message = `It's starting to feel like home already. Your survival odds have increased to ${this.state.survivalOdds}%`;
            pLog.log(101);
        } else if (event === "animal" && story.animalsRecruited < 2) {
            story.animalsRecruited++;
            this.state.survivalOdds += 5;
            const animalMessages = [
                "Even the fauna are helping out.",
                "Survival is really about the friends we meet along the way."
            ];
            message = `${animalMessages[story.animalsRecruited - 1]} Your survival odds have increased to ${this.state.survivalOdds}%`;
            pLog.log(102);
        } else if (event === "ore" && story.oreGathered < 2) {
            story.oreGathered++;
            this.state.survivalOdds += 6;
            message = `You've struck ore. In your position, that's better than gold. Your survival odds have increased to ${this.state.survivalOdds}%`;
            pLog.log(103);
        } else if (event === "tower" && !story.commTowerBuilt) {
            story.commTowerBuilt = true;
            this.state.survivalOdds += 10;
            message = `Lifeline established. Your survival odds have increased to ${this.state.survivalOdds}%`;
            pLog.log(104);
        } else if (event === "victory" && !story.settlersArrived) {
            story.settlersArrived = true;
            message = "Humanity now has a second home. Humanity's survival odds have increased to 81%. Congratulations on completing your mission! Unfortunately, the new settlers have not taken kindly to your benevolent dictatorship. Your survival odds have decreased to 2%.";
            this.state.survivalOdds = 2; // User's odds

            // Set timer for end game overlay
            this.state.endGameTimer = 8000; 
            pLog.log(105);
        }

        if (message && uiManager) {
            uiManager.addStoryMessage(message);
            this.save();
            return true;
        }
        return false;
    }
    save() {
        try {
            const data = JSON.stringify(this.toJSON());
            maStorage.setItem('memtopia_save', data);
            pLog.log(74);
            return true;
        } catch (e) {
            console.error("Game save failed:", e);
            pLog.log(75);
            return false;
        }
    }

    load() {
        try {
            const data = maStorage.getItem('memtopia_save');
            if (data) {
                const parsed = JSON.parse(data);
                const loaded = GameState.fromJSON(parsed);
                this.state = loaded.state;
                this.inventory = loaded.inventory;
                this.gridSize = loaded.grid.width;
                this.grid = loaded.grid;
                pLog.log(76);
                return true;
            }
            pLog.log(77);
        } catch (e) {
            console.error("Game load failed:", e);
            pLog.log(78);
        }
        return false;
    }

    clearSave() {
        maStorage.removeItem('memtopia_save');
        pLog.log(79);
    }

    resetGame() {
        this.clearSave();
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }

    recruitAnimal(x, y) {
        const cell = this.grid.getCell(x, y);
        if (cell && cell.revealed && cell.character && !cell.character.owned && cell.character.type !== "Egg") {
            cell.character.owned = true;
            this.state.firstAnimalOwned = true;
            pLog.log(0);
            return true;
        }
        pLog.log(1);
        return false;
    }

    feedAnimal(x, y) {
        const cell = this.grid.getCell(x, y);
        if (cell && cell.revealed && cell.character && cell.character.owned && cell.character.isHungry) {
            if (this.inventory.getQuantity("carrot") > 0) {
                this.inventory.removeItem("carrot");
                cell.character.isHungry = false;
                cell.character.movesMade = 0;
                pLog.log(2);
                return true;
            }
            pLog.log(3);
        }
        return false;
    }

    gatherItem(x, y) {
        const cell = this.grid.getCell(x, y);
        if (cell && cell.revealed && cell.item) {
            if (cell.item === "Space Ship" || cell.item === "Research Center" || cell.item === "Communication Tower" || cell.item === "house") {
                pLog.log(5);
                return null;
            }

            let itemName = cell.item;
            if (itemName === "tree") {
                itemName = "wood";
            }

            this.inventory.addItem(itemName);
            cell.setItem(null);

            if (this.inventory.getQuantity("wood") >= Tuning.HOUSE_WOOD_COST) {
                this.state.everReached20Wood = true;
            }

            pLog.log(4);
            return itemName;
        }
        return null;
    }

    buildHouse(x, y) {
        const cell = this.grid.getCell(x, y);
        const woodCost = Tuning.HOUSE_WOOD_COST;

        if (this.inventory.getQuantity("wood") >= woodCost &&
            cell && cell.revealed && !cell.character && !cell.item &&
            cell.landType !== "water" && cell.landType !== "farm") {

            for (let i = 0; i < woodCost; i++) {
                this.inventory.removeItem("wood");
            }
            cell.setItem("house");
            this.state.housesCount++;
            pLog.log(6);
            return true;
        }
        pLog.log(7);
        return false;
    }

    plantFarm(x, y) {
        const cell = this.grid.getCell(x, y);
        if (cell && cell.revealed && cell.landType === "grass" && !cell.character && !cell.item &&
            this.inventory.getQuantity("seed") > 0) {

            this.inventory.removeItem("seed");
            cell.landType = "farm";
            this.state.neverMadeFarm = false;
            pLog.log(8);
            return true;
        }
        pLog.log(9);
        return false;
    }

    establishResearchCenter(x, y) {
        const cell = this.grid.getCell(x, y);
        const woodCost = Tuning.RESEARCH_CENTER_WOOD_COST;
        const foodCost = Tuning.RESEARCH_CENTER_FOOD_COST;

        if (this.inventory.getQuantity("wood") >= woodCost &&
            this.inventory.getQuantity("carrot") >= foodCost &&
            cell && cell.revealed && !cell.character && !cell.item &&
            (cell.landType === "grass" || cell.landType === "desert")) {

            for (let i = 0; i < woodCost; i++) { this.inventory.removeItem("wood"); }
            for (let i = 0; i < foodCost; i++) { this.inventory.removeItem("carrot"); }

            cell.setItem("Research Center");
            this.state.researchCenterBuilt = true;
            this.state.isBuildingResearchCenter = false;
            pLog.log(10);
            return true;
        }
        pLog.log(11);
        return false;
    }

  buildCommunicationTower(x, y) {
    const cell = this.grid.getCell(x, y);
    const oreCost = Tuning.COMMUNICATION_TOWER_ORE_COST;

    if (this.inventory.getQuantity("ore") >= oreCost &&
      cell && cell.revealed && !cell.character && !cell.item &&
      (cell.landType === "grass" || cell.landType === "desert")) {

      for (let i = 0; i < oreCost; i++) { this.inventory.removeItem("ore"); }

      cell.setItem("Communication Tower");
      this.state.communicationTowerBuilt = true;
      this.state.isBuildingCommunicationTower = false;
      pLog.log(30);
      return true;
    }
    pLog.log(31);
    return false;
  }

    // AUTOMATION LOGIC
    autoHarvest() {
        if (this.state.researchLevel < 1) {
            pLog.log(32);
            return false;
        }

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell.revealed && cell.landType === "farm" && cell.item) {
                    this.gatherItem(x, y);
                    pLog.log(25);
                    return true;
                }
            }
        }
        return false;
    }

    autoFeed() {
        if (this.state.researchLevel < 2) {
            pLog.log(33);
            return false;
        }
        if (this.inventory.getQuantity("carrot") === 0) {
            pLog.log(34);
            return false;
        }

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid.getCell(x, y);
                if (cell.revealed && cell.character && cell.character.owned && cell.character.isHungry) {
                    if (this.feedAnimal(x, y)) {
                        pLog.log(26);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    updateMining() {
        if (this.state.researchLevel < 3) {
            pLog.log(35);
            return false;
        }

        if (Math.random() < Tuning.ORE_SPAWN_PROBABILITY_PERIODIC) {
            const candidates = [];
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    const cell = this.grid.getCell(x, y);
                    if (cell.revealed && cell.landType === "desert" && !cell.item && !cell.character) {
                        candidates.push(cell);
                    }
                }
            }
            if (candidates.length > 0) {
                const randomIndex = Math.floor(Math.random() * candidates.length);
                candidates[randomIndex].setItem("ore");
                pLog.log(37);
                return true;
            }
        } else {
            pLog.log(36);
        }
        return false;
    }

    revealCell(x, y) {
        const revealedCell = this.grid.revealCell(x, y);
        if (revealedCell) {
            if (revealedCell.character) {
                this.state.firstAnimalRevealed = true;
                pLog.log(12);
            }
            if (revealedCell.item === "tree") {
                this.state.firstTreeRevealed = true;
                pLog.log(13);
            }

            // Mining logic on reveal
            if (this.state.researchLevel >= 3 && revealedCell.landType === "desert" && !revealedCell.item && !revealedCell.character) {
                pLog.log(38);
                if (Math.random() < Tuning.ORE_SPAWN_PROBABILITY_REVEAL) {
                    revealedCell.setItem("ore");
                    pLog.log(39);
                }
            }

            return revealedCell;
        }
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameState };
}
