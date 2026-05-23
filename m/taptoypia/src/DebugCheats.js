class DebugCheats {
    static findShipCell(gameState) {
        for (let y = 0; y < gameState.gridSize; y++) {
            for (let x = 0; x < gameState.gridSize; x++) {
                const cell = gameState.grid.getCell(x, y);
                if (cell && cell.item === "Space Ship") {
                    return { x, y, cell };
                }
            }
        }
        return null;
    }

    static revealAreaAroundShip(gameState, shipX, shipY) {
        const halfSpan = 10;
        const startX = Math.max(0, shipX - halfSpan);
        const endX = Math.min(gameState.gridSize - 1, shipX + halfSpan - 1);
        const startY = Math.max(0, shipY - halfSpan);
        const endY = Math.min(gameState.gridSize - 1, shipY + halfSpan - 1);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const cell = gameState.grid.getCell(x, y);
                if (cell) {
                    cell.reveal();
                }
            }
        }
    }

    static findBuildableCellsNearShip(gameState, shipX, shipY) {
        const cells = [];
        for (let radius = 0; radius < gameState.gridSize; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = shipX + dx;
                    const y = shipY + dy;
                    const cell = gameState.grid.getCell(x, y);
                    if (!cell || !cell.revealed) {
                        continue;
                    }
                    if (x === shipX && y === shipY) {
                        continue;
                    }
                    cells.push({ x, y, cell });
                }
            }
            if (cells.length > 120) {
                break;
            }
        }
        return cells;
    }

    static prepareCellForStructure(cell, landType = 'grass') {
        cell.revealed = true;
        cell.landType = landType;
        cell.character = null;
        cell.item = null;
    }

    static applyBeatGameCheat({ gameState, uiManager, startupLandingAnimation }) {
        const ship = DebugCheats.findShipCell(gameState);
        if (!ship) {
            return false;
        }

        if (startupLandingAnimation) {
            startupLandingAnimation.active = false;
        }
        gameState.state.startupLandingPending = false;
        ship.cell.reveal();
        DebugCheats.revealAreaAroundShip(gameState, ship.x, ship.y);

        const nearbyCells = DebugCheats.findBuildableCellsNearShip(gameState, ship.x, ship.y);
        let structureIndex = 0;

        const takeNextStructureCell = (preferredLandType = 'grass') => {
            while (structureIndex < nearbyCells.length) {
                const candidate = nearbyCells[structureIndex++];
                if (candidate.cell.item === "Space Ship") {
                    continue;
                }
                DebugCheats.prepareCellForStructure(candidate.cell, preferredLandType);
                return candidate;
            }
            return null;
        };

        let houseCount = 0;
        let researchCenterExists = false;
        let towerExists = false;

        for (let y = 0; y < gameState.gridSize; y++) {
            for (let x = 0; x < gameState.gridSize; x++) {
                const cell = gameState.grid.getCell(x, y);
                if (!cell) {
                    continue;
                }
                if (cell.item === 'house') {
                    houseCount++;
                } else if (cell.item === 'Research Center') {
                    researchCenterExists = true;
                } else if (cell.item === 'Communication Tower') {
                    towerExists = true;
                }
            }
        }

        while (houseCount < 30) {
            const houseSpot = takeNextStructureCell('grass');
            if (!houseSpot) {
                break;
            }
            houseSpot.cell.setItem('house');
            houseCount++;
        }

        if (!researchCenterExists) {
            const rcSpot = takeNextStructureCell('desert');
            if (rcSpot) {
                rcSpot.cell.setItem('Research Center');
            }
        }

        if (!towerExists) {
            const towerSpot = takeNextStructureCell('desert');
            if (towerSpot) {
                towerSpot.cell.setItem('Communication Tower');
            }
        }

        gameState.state.housesCount = Math.max(30, houseCount);
        gameState.state.researchCenterBuilt = true;
        gameState.state.isBuildingResearchCenter = false;
        gameState.state.researchLevel = 3;
        gameState.state.communicationTowerBuilt = true;
        gameState.state.isBuildingCommunicationTower = false;
        gameState.state.victoryClaimed = false;
        gameState.state.gameEnded = false;
        gameState.state.endGameTimer = null;
        gameState.state.stats.housesBuilt = Math.max(gameState.state.stats.housesBuilt || 0, gameState.state.housesCount);

        uiManager.updateInventoryUI();
        uiManager.showStatus("Debug: colony advanced to pre-victory state.");
        gameState.save();
        return true;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DebugCheats };
}
