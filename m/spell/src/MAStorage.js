
class MAStorage {
    constructor() {
        this.data = {};
        this.isMock = false;

        if (typeof localStorage === 'undefined') {
            this.isMock = true;
        }
    }

    setItem(key, value) {
        if (this.isMock) {
            this.data[key] = String(value);
        } else {
            localStorage.setItem(key, value);
        }
    }

    getItem(key) {
        if (this.isMock) {
            return this.data[key] || null;
        } else {
            return localStorage.getItem(key);
        }
    }

    removeItem(key) {
        if (this.isMock) {
            delete this.data[key];
        } else {
            localStorage.removeItem(key);
        }
    }

    clear() {
        if (this.isMock) {
            this.data = {};
        } else {
            localStorage.clear();
        }
    }

    forceMock() {
        this.isMock = true;
        this.data = {};
    }
}

let maStorage = new MAStorage();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { maStorage, MAStorage };
}
