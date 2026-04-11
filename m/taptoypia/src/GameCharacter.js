if (typeof module !== 'undefined' && module.exports) {
    ({ MAUtils } = require('./Utilities.js'));
}

class GameCharacter {
    constructor(type, parentIds = []) {
        this.id = MAUtils.uuidv4();
        this.type = type; // e.g., "WaterAnimal", "FireAnimal", "GrassAnimal", or "Egg"
        this.owned = false;
        this.movesMade = 0;
        this.isHungry = false;

        this.parentIds = parentIds;
        this.reproductionCount = 0;

        // EGG PROPERTIES
        this.hatchesInto = null; // The type it will become
        this.hatchTime = null;   // Timestamp when it hatches
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            owned: this.owned,
            movesMade: this.movesMade,
            isHungry: this.isHungry,
            parentIds: this.parentIds,
            reproductionCount: this.reproductionCount,
            hatchesInto: this.hatchesInto,
            hatchTime: this.hatchTime
        };
    }

    static fromJSON(data) {
        const char = new GameCharacter(data.type, data.parentIds);
        char.id = data.id;
        char.owned = data.owned;
        char.movesMade = data.movesMade;
        char.isHungry = data.isHungry;
        char.reproductionCount = data.reproductionCount;
        char.hatchesInto = data.hatchesInto;
        char.hatchTime = data.hatchTime;
        return char;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameCharacter };
}
