const SSSTAccessoryType = {
    // Gadgets
    GadgetFiveExtraCargoBays: 0,
    GadgetAutoRepairSystem: 1,
    GadgetNavigationSystem: 2,
    GadgetTargetingSystem: 3,
    GadgetCloakingDevice: 4,
    GadgetFuelCompactor: 5, // Can't be bought

    GadgetFirst: 0,
    GadgetLastBuyable: 4,
    GadgetLast: 5,

    // Weapons
    WeaponPulseLaser: 6,
    WeaponBeamLaser: 7,
    WeaponMilitaryLaser: 8,
    WeaponMorgansLaser: 9, // Can't be bought

    WeaponFirst: 6,
    WeaponLastBuyable: 8,
    WeaponLast: 9,

    // Shields
    ShieldEnergy: 10,
    ShieldReflective: 11,
    ShieldLightning: 12, // Can't be bought

    ShieldFirst: 10,
    ShieldLastBuyable: 11,
    ShieldLast: 12,

    None: 13
};

const COUNT_BUYABLE_ACCESSORIES =
    (SSSTAccessoryType.GadgetLastBuyable - SSSTAccessoryType.GadgetFirst + 1) +
    (SSSTAccessoryType.WeaponLastBuyable - SSSTAccessoryType.WeaponFirst + 1) +
    (SSSTAccessoryType.ShieldLastBuyable - SSSTAccessoryType.ShieldFirst + 1);

function ACCESSORY_FOR_TYPE(type) {
    return SSSTGadget.gadgetForType(type) ||
           SSSTWeapon.weaponForType(type) ||
           SSSTShield.shieldForType(type);
}


class SSSTAccessory {
    constructor(type, name, price, techLevel, occurrence) {
        this._type = type;
        this._name = name;
        this._price = price;
        this._techLevel = techLevel;
        this._occurrence = occurrence;
    }

    get type() {
        return this._type;
    }

    get name() {
        return this._name;
    }

    get price() {
        return this._price;
    }

    get techLevel() {
        return this._techLevel;
    }

    get occurrence() {
        return this._occurrence;
    }

    icon() {
        return null;
    }

    static accessoryCategory() {
        return "accessory";
    }

    isEqual(object) {
        if (object instanceof SSSTAccessory) {
            return this._type === object.type;
        }
        return this === object;
    }

    hash() {
        return this._type;
    }
}


class SSSTGadget extends SSSTAccessory {
    constructor(type, name, price, techLevel, occurrence, icon) {
        super(type, name, price, techLevel, occurrence);
        this._icon = icon;
    }

    static accessoryCategory() {
        return "gadget";
    }

    static gadgetForType(type) {
        if (!this.sItems) {
            this.sItems = new Map();
        }

        let item = this.sItems.get(type);

        if (!item) {
            switch (type) {
                case SSSTAccessoryType.GadgetFiveExtraCargoBays:
                    item = new SSSTGadget(type, "5 extra cargo bays", 2500, SSSTTechLevel.EarlyIndustrial, 35, "");
                    break;

                case SSSTAccessoryType.GadgetAutoRepairSystem:
                    item = new SSSTGadget(type, "Auto-repair system", 7500, SSSTTechLevel.Industrial, 20, "");
                    break;

                case SSSTAccessoryType.GadgetNavigationSystem:
                    item = new SSSTGadget(type, "Navigation system", 15000, SSSTTechLevel.PostIndustrial, 20, "");
                    break;

                case SSSTAccessoryType.GadgetTargetingSystem:
                    item = new SSSTGadget(type, "Targeting system", 25000, SSSTTechLevel.PostIndustrial, 20, "");
                    break;

                case SSSTAccessoryType.GadgetCloakingDevice:
                    item = new SSSTGadget(type, "Cloaking device", 100000, SSSTTechLevel.HighTech, 5, "");
                    break;

                case SSSTAccessoryType.GadgetFuelCompactor:
                    item = new SSSTGadget(type, "Fuel compactor", 30000, SSSTTechLevel.Count, 0, "");
                    break;

                default:
                    break;
            }

            if (item) {
                this.sItems.set(type, item);
            }
        }

        return item;
    }

    icon() {
        return this._icon;
    }

    get isBuyable() {
      return this._type <= SSSTAccessoryType.GadgetLastBuyable
    }
}


class SSSTWeapon extends SSSTAccessory {
    constructor(type, name, price, techLevel, occurrence, power) {
        super(type, name, price, techLevel, occurrence);
        this._power = power;
    }

    get power() {
      return this._power;
    }

    static accessoryCategory() {
        return "weapon";
    }

    static weaponForType(type) {
        if (!this.sItems) {
            this.sItems = new Map();
        }

        let item = this.sItems.get(type);

        if (!item) {
            switch (type) {
                case SSSTAccessoryType.WeaponPulseLaser:
                    item = new SSSTWeapon(type, "Pulse laser", 2000, SSSTTechLevel.Industrial, 50, 15);
                    break;

                case SSSTAccessoryType.WeaponBeamLaser:
                    item = new SSSTWeapon(type, "Beam laser", 12500, SSSTTechLevel.PostIndustrial, 35, 25);
                    break;

                case SSSTAccessoryType.WeaponMilitaryLaser:
                    item = new SSSTWeapon(type, "Military laser", 35000, SSSTTechLevel.HighTech, 15, 35);
                    break;

                case SSSTAccessoryType.WeaponMorgansLaser:
                    item = new SSSTWeapon(type, "Morgan's laser", 50000, SSSTTechLevel.Count, 0, 85);
                    break;

                default:
                    break;
            }

            if (item) {
                this.sItems.set(type, item);
            }
        }

        return item;
    }

    get isBuyable() {
      return this._type <= SSSTAccessoryType.WeaponLastBuyable
    }

    icon() {
        return "";
    }
}

class SSSTShield extends SSSTAccessory {
    constructor(type, name, price, techLevel, occurrence, power) {
        super(type, name, price, techLevel, occurrence);
        this._power = power;
    }

    get power() {
      return this._power;
    }

    static accessoryCategory() {
        return "shield";
    }

    static shieldForType(type) {
        if (!this.sItems) {
            this.sItems = new Map();
        }

        let item = this.sItems.get(type);

        if (!item) {
            switch (type) {
                case SSSTAccessoryType.ShieldEnergy:
                    item = new SSSTShield(type, "Energy shield", 5000, SSSTTechLevel.Industrial, 70, 100);
                    break;

                case SSSTAccessoryType.ShieldReflective:
                    item = new SSSTShield(type, "Reflective shield", 20000, SSSTTechLevel.PostIndustrial, 30, 200);
                    break;

                case SSSTAccessoryType.ShieldLightning:
                    item = new SSSTShield(type, "Lightning shield", 45000, SSSTTechLevel.Count, 0, 350);
                    break;

                default:
                    break;
            }

            if (item) {
                this.sItems.set(type, item);
            }
        }

        return item;
    }

    get isBuyable() {
      return this._type <= SSSTAccessoryType.ShieldLastBuyable
    }

    icon() {
        return "";
    }
}

