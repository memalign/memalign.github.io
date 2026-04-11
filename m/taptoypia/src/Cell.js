if (typeof module !== 'undefined' && module.exports) {
    ({ GameCharacter } = require('./GameCharacter.js'));
    ({ pLog } = require('./Utilities.js'));
}

class Cell {
    constructor(x, y, landType) {
        this.x = x;
        this.y = y;
        this.landType = landType;
        this.item = null;
        this.character = null;
        this.revealed = false;
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            landType: this.landType,
            item: this.item,
            character: this.character ? this.character.toJSON() : null,
            revealed: this.revealed
        };
    }

    toCompactJSON() {
        pLog.log(84);
        // Simple map for landType to single character
        const landMap = { grass: 'g', water: 'w', desert: 'd', farm: 'f' };
        const result = {
            t: landMap[this.landType] || 'g',
            r: this.revealed ? 1 : 0
        };
        if (this.item) result.i = this.item;
        if (this.character) result.c = this.character.toJSON();
        return result;
    }

    static fromJSON(data) {
        if (data.t !== undefined) {
            return Cell.fromCompactJSON(data);
        }
        const cell = new Cell(data.x, data.y, data.landType);
        cell.item = data.item;
        cell.character = data.character ? GameCharacter.fromJSON(data.character) : null;
        cell.revealed = data.revealed;
        return cell;
    }

    static fromCompactJSON(data, x, y) {
        pLog.log(85);
        const landMap = { g: 'grass', w: 'water', d: 'desert', f: 'farm' };
        const cell = new Cell(x, y, landMap[data.t] || 'grass');
        cell.revealed = !!data.r;
        if (data.i) cell.item = data.i;
        if (data.c) cell.character = GameCharacter.fromJSON(data.c);
        return cell;
    }

    reveal() {
        this.revealed = true;
    }

    setItem(item) {
        this.item = item;
    }

    setCharacter(character) {
        this.character = character;
    }

    getDisplayColor(debugRevealAll = false) {
        if (!this.revealed && !debugRevealAll) {
            return "#333"; // Darker opaque for fog of war
        }

        switch (this.landType) {
            case "grass": return "#2E8B57"; // Sea Green
            case "water": return "#1E90FF"; // Dodger Blue
            case "desert": return "#EDC9AF"; // Desert Sand
            case "farm": return "#8B4513";   // Saddle Brown
            default: return "#333";
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Cell };
}
