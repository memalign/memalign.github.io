if (typeof module !== 'undefined' && module.exports) {
    ({ Cell } = require('./Cell.js'));
    ({ GameCharacter } = require('./GameCharacter.js'));
    ({ Tuning } = require('./Tuning.js'));
}

class Grid {
    constructor(width, height, skipGeneration = false) {
        this.width = width;
        this.height = height;
        this.debugRevealAll = false;

        if (skipGeneration) {
            this.cells = [];
            return;
        }

        this.cells = this.generateGrid(width, height);

        // Find the nearest non-water cell for the landing site
        let centerX = Math.floor(width / 2);
        let centerY = Math.floor(height / 2);
        let startCell = this.cells[centerY][centerX];

        if (startCell.landType === "water") {
            let found = false;
            for (let radius = 1; radius < 100 && !found; radius++) {
                for (let dy = -radius; dy <= radius && !found; dy++) {
                    for (let dx = -radius; dx <= radius && !found; dx++) {
                        const nx = centerX + dx;
                        const ny = centerY + dy;
                        const candidate = this.getCell(nx, ny);
                        if (candidate && candidate.landType !== "water") {
                            centerX = nx;
                            centerY = ny;
                            startCell = candidate;
                            found = true;
                        }
                    }
                }
            }
        }

        startCell.reveal();
        startCell.setItem("Space Ship");
    }

    toJSON() {
        return {
            width: this.width,
            height: this.height,
            cells: this.cells.map(row => row.map(cell => cell.toCompactJSON()))
        };
    }

    static fromJSON(data) {
        const grid = new Grid(data.width, data.height, true);
        grid.cells = data.cells.map((row, y) => row.map((cellData, x) => Cell.fromCompactJSON(cellData, x, y)));
        return grid;
    }

    toggleDebug() {
        this.debugRevealAll = !this.debugRevealAll;
    }

    generateGrid(width, height) {
        const landTypes = ["grass", "water", "desert"];
        let grid = [];
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                const type = landTypes[Math.floor(Math.random() * landTypes.length)];
                grid[y][x] = new Cell(x, y, type);
            }
        }

        const smoothingIterations = Tuning.SMOOTHING_ITERATIONS;
        const radius = Tuning.SMOOTHING_RADIUS;

        for (let i = 0; i < smoothingIterations; i++) {
            const nextGrid = [];
            for (let y = 0; y < height; y++) {
                nextGrid[y] = [];
                for (let x = 0; x < width; x++) {
                    const counts = {};
                    landTypes.forEach(t => counts[t] = 0);

                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                counts[grid[ny][nx].landType]++;
                            }
                        }
                    }

                    let bestType = grid[y][x].landType;
                    let maxCount = 0;
                    for (const type in counts) {
                        if (counts[type] > maxCount) {
                            maxCount = counts[type];
                            bestType = type;
                        }
                    }

                    if (Math.random() < 0.01) {
                        bestType = landTypes[Math.floor(Math.random() * landTypes.length)];
                    }

                    nextGrid[y][x] = new Cell(x, y, bestType);
                }
            }
            grid = nextGrid;
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid[y][x];
                if (Math.random() < Tuning.INITIAL_ITEM_PROBABILITY) {
                    const possibleItems = ["carrot", "seed"];
                    if (cell.landType === "grass") {
                        possibleItems.push("tree");
                    }
                    cell.setItem(possibleItems[Math.floor(Math.random() * possibleItems.length)]);
                }

                if (Math.random() < 0.01) {
                    let charType = null;
                    if (cell.landType === "water") {
                        charType = "WaterAnimal";
                    } else if (cell.landType === "desert") {
                        charType = "FireAnimal";
                    } else if (cell.landType === "grass") {
                        charType = "GrassAnimal";
                    }

                    if (charType) {
                        cell.setCharacter(new GameCharacter(charType));
                    }
                }
            }
        }

        return grid;
    }

    getCell(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.cells[y][x];
        }
        return null;
    }

    canReveal(x, y) {
        const cell = this.getCell(x, y);
        if (!cell || cell.revealed) {
            return false;
        }
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) {
                    continue;
                }
                const neighbor = this.getCell(x + dx, y + dy);
                if (neighbor && neighbor.revealed) {
                    return true;
                }
            }
        }
        return false;
    }

    revealCell(x, y) {
        if (this.canReveal(x, y)) {
            const cell = this.getCell(x, y);
            cell.reveal();
            return cell;
        }
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Grid };
}
