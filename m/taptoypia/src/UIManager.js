if (typeof module !== 'undefined' && module.exports) {
    ({ Tuning } = require('./Tuning.js'));
    ({ maDocument } = require('./MADocument.js'));
    ({ pLog } = require('./Utilities.js'));
}

class UIManager {
    constructor(gameState, soundEffects = null) {
        this.gameState = gameState;
        this.soundEffects = soundEffects;
        this.storyLog = maDocument.getElementById("story-log");
    }

    addStoryMessage(message) {
        if (!this.storyLog) return;
        this.storyLog.innerHTML = "";
        const msgEl = maDocument.createElement("div");
        msgEl.classList.add("story-message");
        msgEl.appendChild(maDocument.createTextNode(message));
        this.storyLog.appendChild(msgEl);
    }

    showEndGame() {
        const overlay = maDocument.getElementById("end-game-overlay");
        if (overlay) {
            overlay.classList.remove("hidden");
            const playAgainBtn = maDocument.getElementById("play-again-btn");
            if (playAgainBtn) {
                playAgainBtn.onclick = () => {
                    this.gameState.resetGame();
                };
            }
            pLog.log(97);
        }
    }

    getCharacterEmoji(type) {
        switch (type) {
            case "WaterAnimal": return "🐬";
            case "FireAnimal": return "🔥";
            case "GrassAnimal": return "🐘";
            case "Egg": return "🥚";
            default: return "🦁";
        }
    }

    getItemEmoji(item) {
        switch (item) {
            case "Space Ship": return "🚀";
            case "seed": return "🌱";
            case "carrot": return "🥕";
            case "tree": return "🌳";
            case "wood": return "🪵";
            case "house": return "🏠";
            case "Research Center": return "🔬";
            case "ore": return "🪨";
            case "Communication Tower": return "📡";
            default: return "📦";
        }
    }

    showStatus(message) {
        const el = maDocument.getElementById("cell-details");
        if (el) {
            el.innerHTML = ""; // Clear
            const msgDiv = maDocument.createElement("div");
            msgDiv.style.background = "#444";
            msgDiv.style.color = "white";
            msgDiv.style.padding = "4px";
            msgDiv.style.marginBottom = "4px";
            msgDiv.style.borderRadius = "4px";
            msgDiv.appendChild(maDocument.createTextNode(message));
            el.appendChild(msgDiv);
        }
    }

    updateCellDetails(x, y, cell, actionMessage = "") {
        const el = maDocument.getElementById("cell-details");
        if (!el) return;
        el.innerHTML = ""; 

        if (actionMessage) {
            const msgDiv = maDocument.createElement("div");
            msgDiv.style.background = "#444";
            msgDiv.style.color = "white";
            msgDiv.style.padding = "4px";
            msgDiv.style.marginBottom = "4px";
            msgDiv.style.borderRadius = "4px";
            msgDiv.appendChild(maDocument.createTextNode(actionMessage));
            el.appendChild(msgDiv);
        }

        let info = `Cell [${x}, ${y}]: ${cell.landType}`;
        if (cell.item) info += `, Item: ${cell.item}`;
        if (cell.character) {
            info += `, Character: ${cell.character.type}`;
            if (cell.character.type === "Egg") info += ` (Hatches into ${cell.character.hatchesInto})`;
            if (cell.character.owned) info += " (Owned)";
            if (cell.character.isHungry) info += " [Hungry!]";
        }
        el.appendChild(maDocument.createTextNode(info));
    }

    updateMissions() {
        const el = maDocument.getElementById("missions-list");
        if (!el) return;
        el.innerHTML = ""; 
        pLog.log(16);
        
        const title = maDocument.createElement("b");
        title.appendChild(maDocument.createTextNode("Current Missions:"));
        el.appendChild(title);

        let missions = [];

        if (this.gameState.state.firstAnimalRevealed && !this.gameState.state.firstAnimalOwned) {
            missions.push({ text: "Train animal to explore" });
        }

        let hungryCount = 0;
        for (let y = 0; y < this.gameState.gridSize; y++) {
            for (let x = 0; x < this.gameState.gridSize; x++) {
                const cell = this.gameState.grid.getCell(x, y);
                const char = cell ? cell.character : null;
                if (char && char.owned && char.isHungry) hungryCount++;
            }
        }
        if (hungryCount > 0) {
            const plural = hungryCount > 1 ? "s" : "";
            if (hungryCount > 1) { pLog.log(17); } else { pLog.log(18); }
            missions.push({ 
                text: `Feed hungry animal${plural}`,
                cost: `${hungryCount} carrot${hungryCount > 1 ? 's' : ''}`
            });
        }

        if (this.gameState.state.neverMadeFarm && this.gameState.inventory.getQuantity("seed") >= 1) {
            missions.push({ text: "Plant seeds" });
        }

        if (this.gameState.state.firstTreeRevealed && !this.gameState.state.everReached20Wood) {
            missions.push({ text: "Gather wood" });
        }

        if (this.gameState.state.housesCount === 0 && this.gameState.inventory.getQuantity("wood") >= Tuning.HOUSE_WOOD_COST) {
            missions.push({ 
                text: "Build house",
                cost: `${Tuning.HOUSE_WOOD_COST} wood`
            });
        } else if (this.gameState.state.housesCount >= 1 && this.gameState.state.housesCount < 10) {
            const remaining = 10 - this.gameState.state.housesCount;
            if (remaining > 1) { pLog.log(19); } else { pLog.log(20); }
            missions.push({ 
                text: `Build village (${remaining} more ${remaining === 1 ? 'house' : 'houses'})`,
                cost: `${Tuning.HOUSE_WOOD_COST} wood each`
            });
        } else if (this.gameState.state.housesCount >= 10 && !this.gameState.state.researchCenterBuilt) {
            const canAfford = this.gameState.inventory.getQuantity("wood") >= Tuning.RESEARCH_CENTER_WOOD_COST && 
                              this.gameState.inventory.getQuantity("carrot") >= Tuning.RESEARCH_CENTER_FOOD_COST;
            const status = this.gameState.state.isBuildingResearchCenter ? " (Select desert or grass cell)" : "";
            missions.push({ 
                text: "Build Research Center", 
                status: status,
                className: "research-center-mission",
                style: canAfford ? 'color:#4CAF50; cursor:pointer; text-decoration:underline;' : 'color:#888; cursor:not-allowed;',
                cost: `${Tuning.RESEARCH_CENTER_WOOD_COST} wood, ${Tuning.RESEARCH_CENTER_FOOD_COST} carrots`
            });
        } else if (this.gameState.state.researchCenterBuilt) {
            const lvl = this.gameState.state.researchLevel;
            if (lvl === 0) {
                const canAfford = this.gameState.inventory.getQuantity("wood") >= Tuning.RESEARCH_AUTOHARVEST_WOOD_COST && 
                                  this.gameState.inventory.getQuantity("carrot") >= Tuning.RESEARCH_AUTOHARVEST_FOOD_COST;
                pLog.log(27);
                missions.push({ 
                    text: "Research auto-harvesting", className: "research-tier-mission", dataLvl: 1, 
                    style: canAfford ? 'color:#4CAF50; cursor:pointer; text-decoration:underline;' : 'color:#888; cursor:not-allowed;',
                    cost: `${Tuning.RESEARCH_AUTOHARVEST_WOOD_COST} wood, ${Tuning.RESEARCH_AUTOHARVEST_FOOD_COST} carrots`
                });
            } else if (lvl === 1) {
                const canAfford = this.gameState.inventory.getQuantity("wood") >= Tuning.RESEARCH_AUTOFEED_WOOD_COST && 
                                  this.gameState.inventory.getQuantity("carrot") >= Tuning.RESEARCH_AUTOFEED_FOOD_COST;
                pLog.log(28);
                missions.push({ 
                    text: "Research auto-feeding", className: "research-tier-mission", dataLvl: 2,
                    style: canAfford ? 'color:#4CAF50; cursor:pointer; text-decoration:underline;' : 'color:#888; cursor:not-allowed;',
                    cost: `${Tuning.RESEARCH_AUTOFEED_WOOD_COST} wood, ${Tuning.RESEARCH_AUTOFEED_FOOD_COST} carrots`
                });
            } else if (lvl === 2) {
                const canAfford = this.gameState.inventory.getQuantity("wood") >= Tuning.RESEARCH_MINING_WOOD_COST && 
                                  this.gameState.inventory.getQuantity("carrot") >= Tuning.RESEARCH_MINING_FOOD_COST;
                pLog.log(29);
                missions.push({ 
                    text: "Research mining", className: "research-tier-mission", dataLvl: 3,
                    style: canAfford ? 'color:#4CAF50; cursor:pointer; text-decoration:underline;' : 'color:#888; cursor:not-allowed;',
                    cost: `${Tuning.RESEARCH_MINING_WOOD_COST} wood, ${Tuning.RESEARCH_MINING_FOOD_COST} carrots`
                });
            } else if (lvl >= 3) {
                if (!this.gameState.state.communicationTowerBuilt) {
                    const oreCount = this.gameState.inventory.getQuantity("ore");
                    if (oreCount < 10) {
                        missions.push({ text: "Gather ore" });
                    } else {
                        const status = this.gameState.state.isBuildingCommunicationTower ? " (Select desert or grass cell)" : "";
                        missions.push({ 
                            text: "Build Communication Tower", 
                            status: status,
                            className: "comm-tower-mission",
                            style: 'color:#4CAF50; cursor:pointer; text-decoration:underline;',
                            cost: `${Tuning.COMMUNICATION_TOWER_ORE_COST} ore`
                        });
                    }
                } else if (this.gameState.state.housesCount < 30) {
                    const remaining = 30 - this.gameState.state.housesCount;
                    pLog.log(73);
                    missions.push({ 
                        text: `Build city (${remaining} more ${remaining === 1 ? 'house' : 'houses'})`,
                        cost: `${Tuning.HOUSE_WOOD_COST} wood each`
                    });
        } else if (!this.gameState.state.victoryClaimed) {
                    pLog.log(21);
                    missions.push({ 
                        text: "Invite settlers", 
                        status: " (claim victory)",
                        className: "victory-mission", 
                        style: "color:#FFD700; font-weight:bold; cursor:pointer; text-decoration:underline;" 
                    });
                } else {
                    pLog.log(94);
                    missions.push({ text: "Survive, if you can" });
                }
            }
        }

        if (missions.length === 0) {
            pLog.log(95);
            missions.push({ text: "Explore the landscape" });
        }

        missions.forEach(m => {
            const item = maDocument.createElement("div");
            
            let itemStyle = "";
            let actionStyle = "";
            if (m.style) {
                const styles = m.style.split(';');
                styles.forEach(s => {
                    const parts = s.split(':');
                    if (parts.length === 2) {
                        const key = parts[0].trim();
                        const val = parts[1].trim();
                        if (key === "cursor" || key === "text-decoration") actionStyle += `${key}:${val};`;
                        else itemStyle += `${key}:${val};`;
                    }
                });
            }

            if (itemStyle) {
                itemStyle.split(';').forEach(s => {
                    const parts = s.split(':');
                    if (parts.length === 2) item.style[parts[0].trim()] = parts[1].trim();
                });
            }

            const actionSpan = maDocument.createElement("span");
            if (m.className) actionSpan.classList.add(m.className);
            if (m.dataLvl) actionSpan._lvl = m.dataLvl;
            if (actionStyle) {
                actionStyle.split(';').forEach(s => {
                    const parts = s.split(':');
                    if (parts.length === 2) actionSpan.style[parts[0].trim()] = parts[1].trim();
                });
            }
            actionSpan.appendChild(maDocument.createTextNode(m.text));
            item.appendChild(actionSpan);

            if (m.status) {
                item.appendChild(maDocument.createTextNode(m.status));
            }

            if (m.cost) {
                const costSpan = maDocument.createElement("span");
                costSpan.classList.add("mission-cost");
                costSpan.appendChild(maDocument.createTextNode(`(Cost: ${m.cost})`));
                item.appendChild(costSpan);
            }
            el.appendChild(item);
        });
    }

    updateInventoryUI() {
        const el = maDocument.getElementById("inventory-info");
        if (!el) return;
        el.innerHTML = ""; 
        el.appendChild(maDocument.createTextNode("Inventory: "));
        const items = this.gameState.inventory.getAllItems();
        const itemKeys = Object.keys(items);
        if (itemKeys.length === 0) {
            const empty = maDocument.createElement("i");
            empty.appendChild(maDocument.createTextNode("Empty"));
            el.appendChild(empty);
        } else {
            for (const item of itemKeys) {
                const span = maDocument.createElement("span");
                span.appendChild(maDocument.createTextNode(`${this.getItemEmoji(item)} x${items[item]}`));
                el.appendChild(span);
            }
        }
        const ownedChars = {};
        const hungryChars = {};
        for (let y = 0; y < this.gameState.gridSize; y++) {
            for (let x = 0; x < this.gameState.gridSize; x++) {
                const cell = this.gameState.grid.getCell(x, y);
                const char = cell ? cell.character : null;
                if (char && char.owned) {
                    ownedChars[char.type] = (ownedChars[char.type] || 0) + 1;
                    if (char.isHungry) hungryChars[char.type] = (hungryChars[char.type] || 0) + 1;
                }
            }
        }
        const charKeys = Object.keys(ownedChars);
        if (charKeys.length > 0) {
            el.appendChild(maDocument.createElement("br"));
            el.appendChild(maDocument.createTextNode("Characters: "));
            for (const type of charKeys) {
                const span = maDocument.createElement("span");
                span.appendChild(maDocument.createTextNode(`${this.getCharacterEmoji(type)} x${ownedChars[type]}`));
                const hungryCount = hungryChars[type] || 0;
                if (hungryCount > 0) {
                    const small = maDocument.createElement("small");
                    small.classList.add("hungry-jump");
                    small.style.color = "red";
                    small.style.cursor = "pointer";
                    small.style.textDecoration = "underline";
                    small._type = type; 
                    span.appendChild(maDocument.createTextNode(" "));
                    small.appendChild(maDocument.createTextNode(`(Hungry: ${hungryCount})`));
                    span.appendChild(small);
                }
                el.appendChild(span);
            }
        }
        this.updateMissions();
    }

    loadGame() {
        if (this.gameState.load()) {
            pLog.log(81);
            this.updateInventoryUI();
            return true;
        }
        return false;
    }

    handleMissionClick(target) {
        if (this.soundEffects) this.soundEffects.requestSong();
        if (target.closest(".victory-mission")) {
            this.showStatus("Victory! Settlers are arriving.");
            this.gameState.state.victoryClaimed = true;
            this.updateMissions();
            this.gameState.triggerStory("victory", this);
            this.gameState.save();
            pLog.log(93);
            return true;
        }
        
        if (target.closest(".research-center-mission")) {
            const woodCost = Tuning.RESEARCH_CENTER_WOOD_COST;
            const foodCost = Tuning.RESEARCH_CENTER_FOOD_COST;
            if (this.gameState.inventory.getQuantity("wood") >= woodCost && this.gameState.inventory.getQuantity("carrot") >= foodCost) {
                this.gameState.state.isBuildingResearchCenter = !this.gameState.state.isBuildingResearchCenter;
                this.updateMissions();
                pLog.log(49);
                this.gameState.save();
            } else {
                this.showStatus(`Need ${woodCost} wood and ${foodCost} carrots!`);
                pLog.log(50);
            }
            return true;
        }

        const tierBtn = target.closest(".research-tier-mission");
        if (tierBtn) {
            const targetLvl = tierBtn._lvl;
            let woodCost = 0, foodCost = 0;
            if (targetLvl === 1) { woodCost = Tuning.RESEARCH_AUTOHARVEST_WOOD_COST; foodCost = Tuning.RESEARCH_AUTOHARVEST_FOOD_COST; }
            else if (targetLvl === 2) { woodCost = Tuning.RESEARCH_AUTOFEED_WOOD_COST; foodCost = Tuning.RESEARCH_AUTOFEED_FOOD_COST; }
            else if (targetLvl === 3) { woodCost = Tuning.RESEARCH_MINING_WOOD_COST; foodCost = Tuning.RESEARCH_MINING_FOOD_COST; }

            if (this.gameState.inventory.getQuantity("wood") >= woodCost && this.gameState.inventory.getQuantity("carrot") >= foodCost) {
                for (let i = 0; i < woodCost; i++) this.gameState.inventory.removeItem("wood");
                for (let i = 0; i < foodCost; i++) this.gameState.inventory.removeItem("carrot");
                this.gameState.state.researchLevel = targetLvl;
                this.updateInventoryUI();
                pLog.log(45);
                this.gameState.save();
            } else {
                this.showStatus(`Need ${woodCost} wood and ${foodCost} carrots!`);
                pLog.log(46);
            }
            return true;
        }

        const towerBtn = target.closest(".comm-tower-mission");
        if (towerBtn) {
            const oreCost = Tuning.COMMUNICATION_TOWER_ORE_COST;
            if (this.gameState.inventory.getQuantity("ore") >= oreCost) {
                this.gameState.state.isBuildingCommunicationTower = !this.gameState.state.isBuildingCommunicationTower;
                this.updateMissions();
                pLog.log(47);
                this.gameState.save();
            } else {
                this.showStatus(`Need ${oreCost} ore!`);
                pLog.log(48);
            }
            return true;
        }
        return false;
    }

    handleCellClick(x, y) {
        if (this.soundEffects) this.soundEffects.requestSong();
        const cell = this.gameState.grid.getCell(x, y);
        if (!cell) return false;
        if (cell.revealed) {
            if (this.gameState.state.isBuildingResearchCenter) {
                if (this.gameState.establishResearchCenter(x, y)) {
                    this.updateInventoryUI();
                    this.updateCellDetails(x, y, cell, "Research Center established!");
                    this.gameState.save();
                    pLog.log(86);
                } else {
                    this.updateCellDetails(x, y, cell, "Invalid site for Research Center!");
                }
                return true;
            }
            if (this.gameState.state.isBuildingCommunicationTower) {
                if (this.gameState.buildCommunicationTower(x, y)) {
                    this.updateInventoryUI();
                    this.updateCellDetails(x, y, cell, "Communication Tower established!");
                    this.gameState.triggerStory("tower", this);
                    this.gameState.save();
                    pLog.log(87);
                } else {
                    this.updateCellDetails(x, y, cell, "Invalid site for Communication Tower!");
                }
                return true;
            }
            if (cell.character && cell.character.owned && cell.character.isHungry) {
                if (this.gameState.feedAnimal(x, y)) {
                    this.updateInventoryUI();
                    this.updateCellDetails(x, y, cell, "Fed the animal!");
                    this.gameState.save();
                    pLog.log(88);
                } else {
                    this.updateCellDetails(x, y, cell, "Need a carrot to feed!");
                }
                return true;
            }
            if (cell.character && !cell.character.owned && cell.character.type !== "Egg") {
                if (this.gameState.recruitAnimal(x, y)) {
                    this.updateInventoryUI();
                    this.updateCellDetails(x, y, cell, "Animal recruited!");
                    this.gameState.triggerStory("animal", this);
                    this.gameState.save();
                    pLog.log(89);
                }
                return true;
            }
            const gathered = this.gameState.gatherItem(x, y);
            if (gathered) {
                pLog.log(22);
                this.updateInventoryUI();
                this.updateCellDetails(x, y, cell, `Gathered ${gathered}!`);
                if (gathered === "carrot") this.gameState.triggerStory("carrot", this);
                else if (gathered === "wood") this.gameState.triggerStory("wood", this);
                else if (gathered === "ore") this.gameState.triggerStory("ore", this);
                this.gameState.save();
            } else if (this.gameState.plantFarm(x, y)) {
                pLog.log(23);
                this.gameState.save();
                this.updateInventoryUI();
                this.updateCellDetails(x, y, cell, "Planted a farm!");
            } else if (this.gameState.buildHouse(x, y)) {
                pLog.log(24);
                this.updateInventoryUI();
                this.updateCellDetails(x, y, cell, "Built a house!");
                this.gameState.triggerStory("house", this);
                this.gameState.save();
            } else {
                this.updateCellDetails(x, y, cell);
            }
            return true;
        } else {
            const revealed = this.gameState.revealCell(x, y);
            if (revealed) {
                this.updateCellDetails(x, y, revealed, "Revealed!");
                this.updateMissions();
                this.gameState.save();
                pLog.log(90);
                return true;
            }
        }
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
}
