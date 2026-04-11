if (typeof module !== 'undefined' && module.exports) {
    ({ pLog } = require('./Utilities.js'));
}

class Inventory {
    constructor() {
        this.items = {};
    }

    toJSON() {
        return {
            items: this.items
        };
    }

    static fromJSON(data) {
        const inventory = new Inventory();
        inventory.items = Object.assign({}, data.items);
        return inventory;
    }

    addItem(itemName) {
        if (!this.items[itemName]) {
            this.items[itemName] = 0;
        }
        this.items[itemName]++;
    }

    removeItem(itemName) {
        if (this.items[itemName] && this.items[itemName] > 0) {
            this.items[itemName]--;
            if (this.items[itemName] === 0) {
                delete this.items[itemName];
            }
            pLog.log(14);
            return true;
        }
        pLog.log(15);
        return false;
    }

    getQuantity(itemName) {
        return this.items[itemName] || 0;
    }

    getAllItems() {
        return this.items;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Inventory };
}
