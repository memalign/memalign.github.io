if (typeof module !== 'undefined' && module.exports) {
    ({ Tuning } = require('./Tuning.js'));
    ({ GameCharacter } = require('./GameCharacter.js'));
    ({ pLog } = require('./Utilities.js'));
}

const Reproduction = {
    tryReproduction(gameState, uiManager, char, x, y) {
        if (char.type === 'Egg') {
            pLog.log(64);
            return false;
        }
        if (char.reproductionCount >= Tuning.CHARACTER_MAX_REPRODUCTIONS) {
            pLog.log(65);
            return false;
        }
        if (Math.random() > 0.5) {
            pLog.log(66);
            return false;
        }

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                const neighbor = gameState.grid.getCell(nx, ny);
                if (neighbor && neighbor.character && neighbor.character.type !== 'Egg') {
                    const mate = neighbor.character;
                    if (mate.reproductionCount >= Tuning.CHARACTER_MAX_REPRODUCTIONS) {
                        pLog.log(67);
                        continue;
                    }
                    if (char.parentIds.includes(mate.id) || mate.parentIds.includes(char.id)) {
                        pLog.log(68);
                        continue;
                    }
                    if (char.parentIds.some(id => mate.parentIds.includes(id)) && char.parentIds.length > 0) {
                        pLog.log(69);
                        continue;
                    }

                    const offspringType = Math.random() < 0.5 ? char.type : mate.type;
                    const spawnCandidates = [];
                    for (let sdy = -1; sdy <= 1; sdy++) {
                        for (let sdx = -1; sdx <= 1; sdx++) {
                            const snx = x + sdx;
                            const sny = y + sdy;
                            const sCell = gameState.grid.getCell(snx, sny);
                            if (sCell && !sCell.character) {
                                if (offspringType === 'WaterAnimal' ? sCell.landType === 'water' : sCell.landType !== 'water') {
                                    spawnCandidates.push(sCell);
                                }
                            }
                        }
                    }

                    if (spawnCandidates.length > 0) {
                        const spawnCell = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];
                        const egg = new GameCharacter('Egg', [char.id, mate.id]);
                        egg.hatchesInto = offspringType;
                        const waitTime = Tuning.EGG_MIN_HATCH_MS + Math.random() * (Tuning.EGG_MAX_HATCH_MS - Tuning.EGG_MIN_HATCH_MS);
                        egg.hatchTime = Date.now() + waitTime;

                        spawnCell.setCharacter(egg);
                        char.reproductionCount++;
                        mate.reproductionCount++;
                        uiManager.updateMissions();
                        pLog.log(70);
                        return true;
                    }

                    pLog.log(71);
                }
            }
        }

        pLog.log(72);
        return false;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Reproduction };
}
