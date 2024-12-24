const SSSTShipModelType = {
    Flea: 0,
    Gnat: 1,
    Firefly: 2,
    Mosquito: 3,
    Bumblebee: 4,
    Beetle: 5,
    Hornet: 6,
    Grasshopper: 7,
    Termite: 8,
    Wasp: 9,

    Best: 9, // Equivalent to SSSTShipModelTypeWasp

    // Can't be bought
    SpaceMonster: 10,
    Dragonfly: 11,
    Mantis: 12,
    Scarab: 13,
    Bottle: 14,

    Count: 15
};

const MAX_TRIBBLES = 100000;


class SSSTShipModel {
    constructor(type, name, cargoBays, weaponSlots, shieldSlots, gadgetSlots,
                crewQuarters, fuelTanks, minTechLevel, costOfFuel, price,
                bounty, frequency, hullStrength, police, pirates, traders,
                repairCosts, size) {
        this.type = type;
        this.name = name;
        this.cargoBays = cargoBays;
        this.weaponSlots = weaponSlots;
        this.shieldSlots = shieldSlots;
        this.gadgetSlots = gadgetSlots;
        this.crewQuarters = crewQuarters;
        this.fuelTanks = fuelTanks;
        this.minTechLevel = minTechLevel;
        this.costOfFuel = costOfFuel;
        this.price = price;
        this.bounty = bounty;
        this.frequency = frequency;
        this.hullStrength = hullStrength;
        this.police = police;
        this.pirates = pirates;
        this.traders = traders;
        this.repairCosts = repairCosts;
        this.size = size;
    }

    mercenaryQuarters() {
        return this.crewQuarters - 1;
    }

    get shipImage() {
        if (!this._shipImage) {
          this._shipImage = new PCEImage(PCEImageLibrary[this.name.toLowerCase().replace(/\s+/g, '')].imageStr)
        }

        return this._shipImage
    }
}

// Static variable initialization
const sModels = {};
(() => {
  for (let shipType = 0; shipType < SSSTShipModelType.Count; ++shipType) {
    switch (shipType) {
      case SSSTShipModelType.Flea:
        sModels[shipType] = new SSSTShipModel(shipType, "Flea", 10, 0, 0, 0, 1, 20, SSSTTechLevel.EarlyIndustrial, 1, 2000, 5, 2, 25, -1, -1, 0, 1, 0);
        break;
      case SSSTShipModelType.Gnat:
        sModels[shipType] = new SSSTShipModel(shipType, "Gnat", 15, 1, 0, 1, 1, 14, SSSTTechLevel.Industrial, 2, 10000, 50, 28, 100, 0, 0, 0, 1, 1);
        break;
      case SSSTShipModelType.Firefly:
        sModels[shipType] = new SSSTShipModel(shipType, "Firefly", 20, 1, 1, 1, 1, 17, SSSTTechLevel.Industrial, 3, 25000, 75, 20, 100, 0, 0, 0, 1, 1);
        break;
      case SSSTShipModelType.Mosquito:
        sModels[shipType] = new SSSTShipModel(shipType, "Mosquito", 15, 2, 1, 1, 1, 13, SSSTTechLevel.Industrial, 5, 30000, 100, 20, 100, 0, 1, 0, 1, 1);
        break;
      case SSSTShipModelType.Bumblebee:
        sModels[shipType] = new SSSTShipModel(shipType, "Bumblebee", 25, 1, 2, 2, 2, 15, SSSTTechLevel.Industrial, 7, 60000, 125, 15, 100, 1, 1, 0, 1, 2);
        break;
      case SSSTShipModelType.Beetle:
        sModels[shipType] = new SSSTShipModel(shipType, "Beetle", 50, 0, 1, 1, 3, 14, SSSTTechLevel.Industrial, 10, 80000, 50, 3, 50, -1, -1, 0, 1, 2);
        break;
      case SSSTShipModelType.Hornet:
        sModels[shipType] = new SSSTShipModel(shipType, "Hornet", 20, 3, 2, 1, 2, 16, SSSTTechLevel.PostIndustrial, 15, 100000, 200, 6, 150, 2, 3, 1, 2, 3);
        break;
      case SSSTShipModelType.Grasshopper:
        sModels[shipType] = new SSSTShipModel(shipType, "Grasshopper", 30, 2, 2, 3, 3, 15, SSSTTechLevel.PostIndustrial, 15, 150000, 300, 2, 150, 3, 4, 2, 3, 3);
        break;
      case SSSTShipModelType.Termite:
        sModels[shipType] = new SSSTShipModel(shipType, "Termite", 60, 1, 3, 2, 3, 13, SSSTTechLevel.HighTech, 20, 225000, 300, 2, 200, 4, 4, 3, 4, 4);
        break;
      case SSSTShipModelType.Wasp:
        sModels[shipType] = new SSSTShipModel(shipType, "Wasp", 35, 3, 2, 2, 3, 14, SSSTTechLevel.HighTech, 20, 300000, 500, 2, 200, 5, 6, 4, 5, 4);
        break;
      case SSSTShipModelType.SpaceMonster:
        sModels[shipType] = new SSSTShipModel(shipType, "Space Monster", 0, 3, 0, 0, 1, 1, SSSTTechLevel.Count, 1, 500000, 0, 0, 500, 8, 8, 8, 1, 4);
        break;
      case SSSTShipModelType.Dragonfly:
        sModels[shipType] = new SSSTShipModel(shipType, "Dragonfly", 0, 2, 3, 2, 1, 1, SSSTTechLevel.Count, 1, 500000, 0, 0, 10, 8, 8, 8, 1, 1);
        break;
      case SSSTShipModelType.Mantis:
        sModels[shipType] = new SSSTShipModel(shipType, "Mantis", 0, 3, 1, 3, 3, 1, SSSTTechLevel.Count, 1, 500000, 0, 0, 300, 8, 8, 8, 1, 2);
        break;
      case SSSTShipModelType.Scarab:
        sModels[shipType] = new SSSTShipModel(shipType, "Scarab", 20, 2, 0, 0, 2, 1, SSSTTechLevel.Count, 1, 500000, 0, 0, 400, 8, 8, 8, 1, 3);
        break;
      case SSSTShipModelType.Bottle:
        sModels[shipType] = new SSSTShipModel(shipType, "Bottle", 0, 0, 0, 0, 0, 1, SSSTTechLevel.Count, 1, 100, 0, 0, 0, 8, 8, 8, 1, 1);
        break;
      default:
        break;
    }
  }
})();

// Method to retrieve ship model by type
SSSTShipModel.shipModelForType = function(type) {
    return sModels[type];
};



class SSSTShip {
    constructor(type, difficulty) {
        if (type >= SSSTShipModelType.Count) {
          return
        }
        this._type = type;
        this._difficulty = difficulty;
        this._fuel = SSSTShipModel.shipModelForType(type).fuelTanks;
        this._hull = this._hullStrength();
        this._upgradedHull = false
        this._currentShieldPower = 0;
        this._cargoBuyingPrice = new Map();
        this._cargo = new Map();
        this._weapons = [];
        this._shields = [];
        this._gadgets = [];
        this._crew = [];
        this.tribbles = 0;
    }

    static bestShipWithDifficulty(difficulty) {
        MAUtils.ensureInteger(difficulty)

        let ship = new SSSTShip(SSSTShipModelType.Best, difficulty);

        while (ship.addShieldOfType(SSSTAccessoryType.ShieldLastBuyable)) {}
        while (ship.addWeaponOfType(SSSTAccessoryType.WeaponLastBuyable)) {}

        ship.addGadgetOfType(SSSTAccessoryType.GadgetTargetingSystem);
        ship.addGadgetOfType(SSSTAccessoryType.GadgetNavigationSystem);

        return ship;
    }

    static createFromPreviousShip(type, previousShip) {
        const ship = new SSSTShip(type, previousShip._difficulty)

        if (previousShip) {
            for (let accessory of previousShip._weapons) {
                if (!ship.addWeaponOfType(accessory.type)) {
                    break;
                }
            }
            for (let accessory of previousShip._shields) {
                if (!ship.addShieldOfType(accessory.type)) {
                    break;
                }
            }
            for (let accessory of previousShip._gadgets) {
                if (!ship.addGadgetOfType(accessory.type)) {
                    break;
                }
            }
            for (let itemType = SSSTTradeItemType.Count - 1; itemType >= 0; itemType--) {
                let quantity = previousShip.tradeItemQuantityForType(itemType);
                MAUtils.ensureInteger(quantity)
                if (quantity > 0) {
                    if (ship.boughtQuantity(quantity, itemType, previousShip.tradeItemAverageBuyingPriceForType(itemType)) <= 0) {
                        break;
                    }
                }
            }
        }

        return ship
    }

    static fromSerializedState(serializedState, solarSystems) {
        const ship = new SSSTShip(SSSTShipModelType.Count)

        ship._upgradedHull = serializedState.upgradedHull || false;
        ship._type = serializedState.type || 0;
        ship._difficulty = serializedState.difficulty || 0;
        ship._fuel = serializedState.fuel || 0;
        ship._hull = serializedState.hull || 0;
        ship.tribbles = serializedState.tribbles || 0;

        ship._crew = [];
        if (serializedState.crewMap) {
            for (let crewName in serializedState.crewMap) {
                let mercenary = SSSTShip.crewMemberForName(crewName, solarSystems);
                if (mercenary) {
                    ship.addCrewMember(mercenary);
                } else {
                    let crewMember = SSSTCrewMember.fromSerializedState(serializedState.crewMap[crewName]);
                    ship.addCrewMember(crewMember);
                }
            }
        }

        ship._cargo = new Map();
        if (serializedState.cargoKeys && serializedState.cargoValues) {
            serializedState.cargoKeys.forEach((key, idx) => {
                MAUtils.ensureInteger(key)
                MAUtils.ensureInteger(idx)
                ship._cargo.set(key, serializedState.cargoValues[idx]);
            });
        }

        ship._cargoBuyingPrice = new Map();
        if (serializedState.cargoBuyingPriceKeys && serializedState.cargoBuyingPriceValues) {
            serializedState.cargoBuyingPriceKeys.forEach((key, idx) => {
                MAUtils.ensureInteger(key)
                MAUtils.ensureInteger(idx)
                ship._cargoBuyingPrice.set(key, serializedState.cargoBuyingPriceValues[idx]);
            });
        }

        ship._weapons = [];
        if (serializedState.weaponTypes) {
            serializedState.weaponTypes.forEach(accessoryType => {
                MAUtils.ensureInteger(accessoryType)
                ship.addAccessoryOfType(accessoryType);
            });
        }

        ship._shields = [];
        if (serializedState.shieldTypes) {
            serializedState.shieldTypes.forEach(accessoryType => {
                MAUtils.ensureInteger(accessoryType)
                ship.addAccessoryOfType(accessoryType);
            });
        }

        // Set this after adding shields to correct the current shield power
        ship._currentShieldPower = serializedState.currentShieldPower || 0;

        ship._gadgets = [];
        if (serializedState.gadgetTypes) {
            serializedState.gadgetTypes.forEach(accessoryType => {
                MAUtils.ensureInteger(accessoryType)
                ship.addAccessoryOfType(accessoryType);
            });
        }

        return ship
    }

    // Accessors
    get type() {
      return this._type;
    }

    get gadgets() {
      return this._gadgets;
    }

    get weapons() {
      return this._weapons;
    }

    get shields() {
      return this._shields;
    }

    get gadgetSlots() {
      return SSSTShipModel.shipModelForType(this._type).gadgetSlots;
    }

    get weaponSlots() {
      return SSSTShipModel.shipModelForType(this._type).weaponSlots;
    }

    get shieldSlots() {
      return SSSTShipModel.shipModelForType(this._type).shieldSlots;
    }

    // Static method to get crew member by name
    static crewMemberForName(name, solarSystems) {
        if (!name) return null;

        for (let solarSystem of solarSystems) {
            if (solarSystem.mercenary && solarSystem.mercenary.name === name) {
                return solarSystem.mercenary;
            }
        }

        return null;
    }

    get crew() {
        return this._crew;
    }

    // Method to add a crew member
    addCrewMember(crew) {
      if (this._crew.length >= SSSTShipModel.shipModelForType(this._type).mercenaryQuarters()) {
        return false
      }

      if (MAUtils.ensureType(crew, "object")) {
        pLog.log(44)
        this._crew.push(crew)
        return true;
      }

      return false
    }

    // Method to remove a crew member
    removeCrewMember(crew) {
        if (crew) {
            const index = this._crew.indexOf(crew);
            if (index > -1) {
                pLog.log(45)
                this._crew.splice(index, 1);
            }
        }
    }

    // Method to remove a crew member by name
    removeCrewMemberWithName(name) {
        let toRemove = null;
        this._crew.forEach((crewMember) => {
            if (crewMember.name === name) {
                toRemove = crewMember;
            }
        });

        if (toRemove) {
            pLog.log(46)
            this.removeCrewMember(toRemove);
        }
    }

    // Method to get the count of crew members
    crewCount() {
      if (this._crew !== null && MAUtils.ensureArrayOrNull(this._crew, "object")) {
        return this._crew.length
      }

      return 0
    }

    // Method to remove all crew members
    removeAllCrewMembers() {
        this._crew = [];
    }

    get hull() {
        return this._hull;
    }

    // Method to get the maximum hull strength
    maximumHullStrength() {
        return this._hullStrength();
    }

    // Private method to calculate hull strength
    _hullStrength() {
      const baseStrength = SSSTShipModel.shipModelForType(this._type).hullStrength;
      let result = baseStrength + (this._upgradedHull ? 50 : 0);
      MAUtils.ensureInteger(result)
      return result
    }

		get upgradedHull() {
				return this._upgradedHull;
		}

    // Method to set upgraded hull
    setUpgradedHull(upgradedHull) {
      if (!MAUtils.ensureBool(upgradedHull)) { return }

      if (upgradedHull !== this._upgradedHull) {
        this._upgradedHull = upgradedHull;
        this._hull += (this._upgradedHull ? 50 : 0);
      }
    }

    // Method to calculate weapon power within a range
    weaponPowerBetweenMinMaxInclusive(min, max) {
        let power = 0;

        this._weapons.forEach((weapon) => {
            const type = weapon.type;
            if (type >= min && type <= max) {
                power += weapon.power;
            }
        });

        MAUtils.ensureInteger(power)
        return power;
    }

    // Method to check if ship has a weapon of a specific type
    hasWeaponOfType(type) {
        return this.weaponPowerBetweenMinMaxInclusive(type, type) > 0;
    }

    // Method to check if ship has a gadget of a specific type
    hasGadgetOfType(accessoryType) {
        return this.countGadgetOfType(accessoryType, true) > 0;
    }

    // Method to count gadgets of a specific type
    countGadgetOfType(gadgetType, limitOne) {
        let count = 0;

        for (let gadget of this._gadgets) {
            if (gadget.type === gadgetType) {
                count++;
                if (limitOne) {
                    return count;
                }
            }
        }

        return count;
    }

    // Method to check if the ship has a shield of a specific type
    hasShieldOfType(type) {
        return this._shields && this._shields.includes(SSSTShield.shieldForType(type));
    }

    // Method to check if the ship has any shields
    hasAnyShield() {
        MAUtils.ensureType(this._shields, "object")
        return this._shields.length !== 0;
    }

    // Method to calculate free slots for an accessory type
    freeSlotsForAccessoryType(type) {
        let totalSlots = 0;
        let accessories = [];

        if (SSSTShield.shieldForType(type)) {
            totalSlots = SSSTShipModel.shipModelForType(this._type).shieldSlots;
            accessories = this._shields;
        } else if (SSSTGadget.gadgetForType(type)) {
            totalSlots = SSSTShipModel.shipModelForType(this._type).gadgetSlots;
            accessories = this._gadgets;
        } else if (SSSTWeapon.weaponForType(type)) {
            totalSlots = SSSTShipModel.shipModelForType(this._type).weaponSlots;
            accessories = this._weapons;
        }

        MAUtils.ensureInteger(totalSlots)
        MAUtils.ensureInteger(accessories.length)

        return Math.max(0, totalSlots - accessories.length);
    }

    // Method to add an accessory of a specific type
    addAccessoryOfType(type) {
        return this.addGadgetOfType(type) || this.addShieldOfType(type) || this.addWeaponOfType(type);
    }

    // Private method to remove an accessory type from a list
    _removeType(type, list) {
        if (!list) {
            return false;
        }

        const index = list.indexOf(ACCESSORY_FOR_TYPE(type));
        if (index !== -1) {
            list.splice(index, 1);
            return true;
        }
        return false;
    }

    // Method to remove an accessory of a specific type
    removeAccessoryOfType(type) {
        return this._removeType(type, this._gadgets) || this._removeType(type, this._weapons) || this._removeType(type, this._shields);
    }

    // Method to add a shield of a specific type
    addShieldOfType(type) {
        const shield = SSSTShield.shieldForType(type);

        if (!shield || this._shields.length >= SSSTShipModel.shipModelForType(this._type).shieldSlots) {
            return false;
        }

        this._shields.push(shield);
        this._currentShieldPower += shield.power;

        return true;
    }

    // Method to add a weapon of a specific type
    addWeaponOfType(type) {
        const weapon = SSSTWeapon.weaponForType(type);

        if (!weapon || this._weapons.length >= SSSTShipModel.shipModelForType(this._type).weaponSlots) {
            return false;
        }

        this._weapons.push(weapon);

        return true;
    }

    // Method to add a gadget of a specific type
    addGadgetOfType(type) {
        const gadget = SSSTGadget.gadgetForType(type);

        if (!gadget || this._gadgets.length >= SSSTShipModel.shipModelForType(this._type).gadgetSlots) {
            return false;
        }

        this._gadgets.push(gadget);

        return true;
    }

    fuelTankCapacity() {
        return this.hasGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor) ? 18 : SSSTShipModel.shipModelForType(this._type).fuelTanks;
    }

		get currentShieldPower() {
				return this._currentShieldPower;
		}

    get fuel() {
        return Math.min(this._fuel, this.fuelTankCapacity());
    }

    consumeFuelOverDistance(distance) {
      if (MAUtils.ensureInteger(distance)) {
        this._fuel -= Math.min(distance, this._fuel);
      }
    }

    refillFuelTanks() {
        this._fuel = this.fuelTankCapacity();
    }

    // Float between [0, 1] for display in UI
    hullPercentage() {
        const r = this._hull / this._hullStrength();
        return r;
    }

    // Float between [0, 1] for display in UI
    shieldPercentage() {
        const currentShield = this._currentShieldPower;
        this.rechargeShieldPower();
        const fullShield = this._currentShieldPower;
        this._currentShieldPower = currentShield;

        return currentShield / fullShield;
    }

    rechargeShieldPower() {
        this._currentShieldPower = 0;
        this._shields.forEach(shield => {
            this._currentShieldPower += shield.power;
        });
    }

    rechargeShieldPowerByAmount(amount) {
        if (amount <= 0) { return }
        if (!MAUtils.ensureInteger(amount)) { return }

        const allowedRechargedShieldPower = this._currentShieldPower + amount;
        this.rechargeShieldPower(); // fully recharge
        this._currentShieldPower = Math.min(this._currentShieldPower, allowedRechargedShieldPower);
    }

    damageShieldsByAmount(amount) {
        if (!MAUtils.ensureInteger(amount)) {
          return
        }

        if (amount <= 0) return 0;

        this._currentShieldPower -= amount;
        const damageRemaining = -1 * Math.min(this._currentShieldPower, 0);
        this._currentShieldPower = Math.max(this._currentShieldPower, 0);

        return damageRemaining;
    }

    fillFuelByAmount(amount) {
        if (!MAUtils.ensureInteger(amount)) {
          return
        }

        this._fuel = Math.min(this._fuel + amount, this.fuelTankCapacity());
    }

    repairHullByAmount(amount) {
        if (!MAUtils.ensureInteger(amount)) {
          return
        }

        const previousHullStrength = this._hull;

        const fullHullStrength = this._hullStrength();
        const allowedHullStrength = this._hull + amount;
        this._hull = Math.min(fullHullStrength, allowedHullStrength);

        const consumedRepairs = this._hull - previousHullStrength;

        return (amount - consumedRepairs);
    }

    damageHullByAmount(amount) {
        if (!MAUtils.ensureInteger(amount)) {
          return
        }

        if (amount <= 0) return;

        this._hull -= amount;
        this._hull = Math.max(this._hull, 0);
    }

    shipOwnedByCommanderIsCloakedToOpponent(commander, opponent) {
        return this.hasGadgetOfType(SSSTAccessoryType.GadgetCloakingDevice) &&
               this.crewEngineerSkillIncludingCommander(commander) > opponent.ship.crewEngineerSkillIncludingCommander(opponent);
    }

    shipValuationForInsurance(insurance) {
        let value = 0;
        const model = SSSTShipModel.shipModelForType(this._type);
        const SELLDISCOUNT = (x) => Math.floor((x * 3) / 4);

        value += (this.tribbles > 0 && !insurance) ? Math.floor(model.price / 4) : SELLDISCOUNT(model.price);

        value -= (this._hullStrength() - this._hull) * model.repairCosts;
        value -= (model.fuelTanks - this._fuel) * model.costOfFuel;

        this._weapons.forEach(weapon => {
            value += SELLDISCOUNT(weapon.price);
        });

        this._shields.forEach(shield => {
            value += SELLDISCOUNT(shield.price);
        });

        this._gadgets.forEach(gadget => {
            value += SELLDISCOUNT(gadget.price);
        });

        MAUtils.ensureInteger(value)

        return Math.floor(value);
    }

    _enemyShipValuationWithOpponent(opponent) {
        let value = 0;
        const model = SSSTShipModel.shipModelForType(this._type);
        value += model.price;

        this._weapons.forEach(weapon => {
            value += weapon.price;
        });

        this._shields.forEach(shield => {
            value += shield.price;
        });

        // Don't include gadgets since they influnce the skill-based valuation
        value = value * (2 * this.crewPilotSkillIncludingCommander(opponent) +
            this.crewEngineerSkillIncludingCommander(opponent) +
            3 * this.crewFighterSkillIncludingCommander(opponent)) / 60;

        value = Math.floor(value)

        MAUtils.ensureInteger(value)

        return value
    }

    bountyForEnemyShipWithOpponent(opponent) {
        let value = this._enemyShipValuationWithOpponent(opponent);
        value /= 200;
        value /= 25;
        value = Math.floor(value)
        value *= 25;
        return Math.min(Math.max(value, 25), 2500);
    }

    crewEngineerSkillIncludingCommander(commander) {
        let maxSkill = commander.engineer;
        this._crew.forEach(crewMember => {
            maxSkill = Math.max(maxSkill, crewMember.engineer);
        });

        if (this.hasGadgetOfType(SSSTAccessoryType.GadgetAutoRepairSystem)) {
            maxSkill += SKILL_BONUS;
        }

        MAUtils.ensureInteger(maxSkill)

        return ADJUST_SKILL_FOR_DIFFICULTY(maxSkill, this._difficulty);
    }

    crewTraderSkillIncludingCommander(commander) {
        let maxSkill = commander.trader;
        this._crew.forEach(crewMember => {
            maxSkill = Math.max(maxSkill, crewMember.trader);
        });

        if (commander.carriesMaxTraderBoost) {
            maxSkill++;
        }

        MAUtils.ensureInteger(maxSkill)

        return ADJUST_SKILL_FOR_DIFFICULTY(maxSkill, this._difficulty);
    }

    crewFighterSkillIncludingCommander(commander) {
        let maxSkill = commander.fighter;
        this._crew.forEach(crewMember => {
            maxSkill = Math.max(maxSkill, crewMember.fighter);
        });

        if (this.hasGadgetOfType(SSSTAccessoryType.GadgetTargetingSystem)) {
            maxSkill += SKILL_BONUS;
        }

        MAUtils.ensureInteger(maxSkill)

        return ADJUST_SKILL_FOR_DIFFICULTY(maxSkill, this._difficulty);
    }

    crewPilotSkillIncludingCommander(commander) {
        let maxSkill = commander.pilot;
        this._crew.forEach(crewMember => {
            maxSkill = Math.max(maxSkill, crewMember.pilot);
        });

        if (this.hasGadgetOfType(SSSTAccessoryType.GadgetNavigationSystem)) {
            maxSkill += SKILL_BONUS;
        }

        if (this.hasGadgetOfType(SSSTAccessoryType.GadgetCloakingDevice)) {
            maxSkill += CLOAK_BONUS;
        }

        MAUtils.ensureInteger(maxSkill)

        return ADJUST_SKILL_FOR_DIFFICULTY(maxSkill, this._difficulty);
    }

    tradeItemQuantityForType(type) {
        return this._cargo.get(type) || 0;
    }

    tradeItemAverageBuyingPriceForType(type) {
        const numItems = this.tradeItemQuantityForType(type);

        if (numItems === 0) {
            return 0;
        }

        return Math.floor((this._cargoBuyingPrice.get(type) || 0) / numItems);
    }

    boughtQuantity(quantity, itemType, price) {
        if (!MAUtils.ensureArrayOrNull([quantity, itemType, price], "number")) {
          return 0
        }

        const freeCargoBays = this.freeCargoBays();
        quantity = Math.min(quantity, freeCargoBays);

        const currentQuantity = this._cargo.get(itemType) || 0;
        this._cargo.set(itemType, currentQuantity + quantity);

        const currentPrice = this._cargoBuyingPrice.get(itemType) || 0;
        this._cargoBuyingPrice.set(itemType, currentPrice + price * quantity);

        return quantity;
    }

    soldQuantity(quantity, itemType) {
        if (!MAUtils.ensureArrayOrNull([quantity, itemType], "number")) {
          return
        }

        const oldQuantity = this.tradeItemQuantityForType(itemType);
        if (quantity === 0 || (oldQuantity === 0 && quantity > 0)) {
            return;
        }

        const newQuantity = oldQuantity - Math.min(oldQuantity, quantity);
        this._cargo.set(itemType, newQuantity);

        const oldBuyingPrice = this._cargoBuyingPrice.get(itemType) || 0;
        const newBuyingPrice = Math.floor((oldBuyingPrice * newQuantity) / oldQuantity);
        this._cargoBuyingPrice.set(itemType, newBuyingPrice);
    }

    _tradeableItemsForSystem(solarSystem, onlyIllegal, onlyLegalOrIllegal, limit) {
        const ret = [];

        for (const [tradeItem, quantity] of this._cargo) {
            if (quantity <= 0) {
                continue;
            }

            if (tradeItem >= SSSTTradeItemType.FakeQuestCargoStart) {
                continue;
            }

            if (onlyIllegal !== TRADE_ITEM_IS_ILLEGAL(tradeItem) && onlyLegalOrIllegal) {
                continue;
            }

            if (!solarSystem || solarSystem.standardPriceForItem(tradeItem) > 0) {
                ret.push(tradeItem);
                if (ret.length >= limit) {
                    break;
                }
            }
        }

        return ret;
    }

    hasTradeableItemsForSystem(solarSystem, onlyIllegal) {
        return this._tradeableItemsForSystem(solarSystem, onlyIllegal, true, 1).length > 0;
    }

    randomTradeableItemForSystem(solarSystem, onlyIllegal) {
        const items = this._tradeableItemsForSystem(solarSystem, onlyIllegal, true, this._cargo.size);
        if (items.length <= 0) {
            return SSSTTradeItemType.None;
        }

        const randomIndex = gameRand.randomIntBelow(items.length)
        return items[randomIndex];
    }

    randomTradeableItem() {
        const items = this._tradeableItemsForSystem(null, false, false, this._cargo.size);
        if (items.length <= 0) {
            return SSSTTradeItemType.None;
        }

        const randomIndex = gameRand.randomIntBelow(items.length)
        return items[randomIndex];
    }


    totalCargoBays() {
      const extraCount = this.countGadgetOfType(SSSTAccessoryType.GadgetFiveExtraCargoBays, false);
      const result = SSSTShipModel.shipModelForType(this._type).cargoBays + 5 * extraCount;
      MAUtils.ensureInteger(result)
      return result
    }

    freeCargoBays() {
      const totalBays = this.totalCargoBays();
      let consumedBays = 0;
      this._cargo.forEach(quantity => {
        consumedBays += quantity;
      });

      consumedBays = Math.min(consumedBays, totalBays);
      const result = totalBays - consumedBays;
      MAUtils.ensureInteger(result)
      return result
    }

    mercenaryPricePerDay() {
        return this._crew.reduce((price, crew) => price += crew.hirePrice(), 0);
    }

    costOfFuel() {
        return SSSTShipModel.shipModelForType(this._type).costOfFuel;
    }

    get model() {
        return SSSTShipModel.shipModelForType(this._type);
    }

    hasIllegalGoods() {
        return this.tradeItemQuantityForType(SSSTTradeItemType.Firearms) > 0 ||
               this.tradeItemQuantityForType(SSSTTradeItemType.Narcotics) > 0 ||
               this.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor) > 0;
    }

    serializedState() {
        const state = {};

        // BOOL
        MAUtils.ensureBool(this._upgradedHull)
        state.upgradedHull = this._upgradedHull;

        // char
        MAUtils.ensureInteger(this._type)
        state.type = this._type;

        MAUtils.ensureInteger(this._difficulty)
        state.difficulty = this._difficulty;

        MAUtils.ensureInteger(this._fuel)
        state.fuel = this._fuel;

        // NSInteger
        MAUtils.ensureInteger(this._hull)
        state.hull = this._hull;

        MAUtils.ensureInteger(this.tribbles)
        state.tribbles = this.tribbles;

        MAUtils.ensureInteger(this._currentShieldPower)
        state.currentShieldPower = this._currentShieldPower;

        // NSDictionary
        MAUtils.ensureMapOrNull(this._cargo)
        if (this._cargo) {
          state.cargoKeys = [];
          state.cargoValues = [];

					for (const [key, value] of this._cargo) {
              MAUtils.ensureInteger(key)
              state.cargoKeys.push(key);

              MAUtils.ensureInteger(value)
              state.cargoValues.push(value);
          }
        }

        MAUtils.ensureMapOrNull(this._cargoBuyingPrice)
        if (this._cargoBuyingPrice) {
          state.cargoBuyingPriceKeys = [];
          state.cargoBuyingPriceValues = [];

					for (const [key, value] of this._cargoBuyingPrice) {
              MAUtils.ensureInteger(key)
              state.cargoBuyingPriceKeys.push(key);

              MAUtils.ensureInteger(value)
              state.cargoBuyingPriceValues.push(value);
          }
        }

        // NSArray
        MAUtils.ensureArrayOrNull(this._weapons, "object")
        if (this._weapons.length) {
            state.weaponTypes = this._weapons.map(weapon => weapon.type);
            MAUtils.ensureArrayOrNull(state.weaponTypes, "number")
        }

        MAUtils.ensureArrayOrNull(this._shields, "object")
        if (this._shields.length) {
            state.shieldTypes = this._shields.map(shield => shield.type);
            MAUtils.ensureArrayOrNull(state.shieldTypes, "number")
        }

        MAUtils.ensureArrayOrNull(this._gadgets, "object")
        if (this._gadgets.length) {
            state.gadgetTypes = this._gadgets.map(gadget => gadget.type);
            MAUtils.ensureArrayOrNull(state.gadgetTypes, "number")
        }

        MAUtils.ensureArrayOrNull(this._crew, "object")
        if (this._crew.length) {
            state.crewMap = {};
            this._crew.forEach(crewMember => {
                MAUtils.ensureType(crewMember.name, "string")
                state.crewMap[crewMember.name] = crewMember.serializedState();
            });
        }

        return state;
    }
}
