const MAX_SAFE_PILOT_INSURANCE_DISCOUNT = 90;
const MAX_SKILL_LEVEL = 10;

const CAUGHT_WITH_WILD_SCORE = -4;
const PLUNDER_PIRATE_SCORE = -1;
const PLUNDER_TRADER_SCORE = -2;
const ATTACK_POLICE_SCORE = -3;
const ATTACK_TRADER_SCORE = -2;
const KILL_POLICE_SCORE = -6;
const KILL_PIRATE_SCORE = 1;
const KILL_TRADER_SCORE = -4;
const FLEE_FROM_INSPECTION_SCORE = -2;
const TRAFFICKING_SCORE = -1;

const SSSTPoliceRecordScore = {
    Psycho: -100,
    Villain: -70,
    Criminal: -30,
    Crook: -10,
    Dubious: -5,
    Clean: 0,
    Lawful: 5,
    Trusted: 10,
    Liked: 25,
    Hero: 75
};

function POLICE_RECORD_STR(x) {
    if (x <= SSSTPoliceRecordScore.Psycho) {
        return "Psycho";
    } else if (x <= SSSTPoliceRecordScore.Villain) {
        return "Villain";
    } else if (x <= SSSTPoliceRecordScore.Criminal) {
        return "Criminal";
    } else if (x <= SSSTPoliceRecordScore.Crook) {
        return "Crook";
    } else if (x <= SSSTPoliceRecordScore.Dubious) {
        return "Dubious";
    } else if (x >= SSSTPoliceRecordScore.Hero) {
        return "Hero";
    } else if (x >= SSSTPoliceRecordScore.Liked) {
        return "Liked";
    } else if (x >= SSSTPoliceRecordScore.Trusted) {
        return "Trusted";
    } else if (x >= SSSTPoliceRecordScore.Lawful) {
        return "Lawful";
    } else {
        return "Clean";
    }
}

function POLICE_RECORD_MULTIPLIER(x) {
    if (x < SSSTPoliceRecordScore.Psycho) {
        return 3;
    } else if (x < SSSTPoliceRecordScore.Villain) {
        return 2;
    } else {
        return 1;
    }
}

const SSSTReputationScore = {
    Harmless: 0,
    MostlyHarmless: 10,
    Poor: 20,
    Average: 40,
    AboveAverage: 80,
    Competent: 150,
    Dangerous: 300,
    Deadly: 600,
    Elite: 1500
};

let DEFAULT_REPUTATION_SCORE = SSSTReputationScore.Harmless;


function REPUTATION_STR(x) {
    if (x >= SSSTReputationScore.Elite) {
        return "Elite";
    } else if (x >= SSSTReputationScore.Deadly) {
        return "Deadly";
    } else if (x >= SSSTReputationScore.Dangerous) {
        return "Dangerous";
    } else if (x >= SSSTReputationScore.Competent) {
        return "Competent";
    } else if (x >= SSSTReputationScore.AboveAverage) {
        return "Above Average";
    } else if (x >= SSSTReputationScore.Average) {
        return "Average";
    } else if (x >= SSSTReputationScore.Poor) {
        return "Poor";
    } else if (x >= SSSTReputationScore.MostlyHarmless) {
        return "Mostly Harmless";
    } else {
        return "Harmless";
    }
}


class SSSTCommander extends SSSTCrewMember {
    constructor(name, engineer = 0, pilot = 0, fighter = 0, trader = 0) {
			super(name, engineer, pilot, fighter, trader)

      this._basePrices = null
			this.days = 0
      this._noClaim = 0
			this.policeKills = 0
			this.traderKills = 0
			this.pirateKills = 0
			this.policeRecordScore = 0
			this._debt = 0
      this._reputationScore = DEFAULT_REPUTATION_SCORE
      this._travelClicksRemaining = 0
      this._arrivedViaWormhole = false
      this.artifactOnBoard = false
      this._litterWarning = false
      this._inspected = false
      this._raided = false
      this._boughtMoon = false
      this._hasEscapePod = false
      this._hasInsurance = false
		}

    static fromSerializedState(serializedState, solarSystems) {
        const commander = new SSSTCommander(serializedState.name);
        commander.updateWithSerializedState(serializedState, solarSystems);
        return commander;
    }

    updateWithSerializedState(serializedState, solarSystems) {
        super.updateWithSerializedState(serializedState);

        // Integer properties
        this._credits = parseInt(serializedState.credits, 10);
        this._debt = parseInt(serializedState.debt, 10);
        this.days = parseInt(serializedState.days, 10);
        this.policeKills = parseInt(serializedState.policeKills, 10);
        this.traderKills = parseInt(serializedState.traderKills, 10);
        this.pirateKills = parseInt(serializedState.pirateKills, 10);
        this.policeRecordScore = parseInt(serializedState.policeRecordScore, 10);
        this._reputationScore = parseInt(serializedState.reputationScore, 10);
        this._noClaim = parseInt(serializedState.noClaim, 10);
        this._travelClicksRemaining = parseInt(serializedState.travelClicksRemaining, 10);
        this._difficulty = parseInt(serializedState.difficulty, 10);

        // Boolean properties
        this._boughtMoon = Boolean(serializedState.boughtMoon);
        this._hasEscapePod = Boolean(serializedState.hasEscapePod);
        this._hasInsurance = Boolean(serializedState.hasInsurance);
        this._raided = Boolean(serializedState.raided);
        this._inspected = Boolean(serializedState.inspected);
        this._litterWarning = Boolean(serializedState.litterWarning);
        this.artifactOnBoard = Boolean(serializedState.artifactOnBoard);
        this._arrivedViaWormhole = Boolean(serializedState.arrivedViaWormhole);
        this._reserveMoney = Boolean(serializedState.reserveMoney);


        // Set current system and ship
        this._currentSystem = SSSTSolarSystem.solarSystemForName(serializedState.currentSystemName, solarSystems)
        MAUtils.ensureType(this._currentSystem, "object")

        this.ship = SSSTShip.fromSerializedState(serializedState.ship, solarSystems);

        // Base prices
        if (serializedState.basePrices) {
          this._basePrices = [ ...serializedState.basePrices ];
          MAUtils.ensureArrayOrNull(this._basePrices, "number")
        } else {
          this._basePrices = null
        }
    }

    _hasDubiousPoliceRecord() {
        return this.policeRecordScore <= SSSTPoliceRecordScore.Dubious;
    }

    get boughtMoon() {
        return this._boughtMoon
    }

    set boughtMoon(b) {
      if (MAUtils.ensureBool(b)) {
        this._boughtMoon = b
      }
    }

    setReserveMoney(rM) {
      if (MAUtils.ensureBool(rM)) {
        this._reserveMoney = rM;
      }
    }

    getReserveMoney() {
        return this._reserveMoney;
    }

    _checkCreditsAmount(c) {
      return MAUtils.ensureInteger(c)
    }

    setCredits(c) {
        if (this._checkCreditsAmount(c)) {
          this._credits = c;
        }
    }

    getCredits() {
        return this._credits;
    }

		get credits() {
				return this._credits;
		}

		set credits(c) {
      this.setCredits(c)
		}

    get hasEscapePod() {
        return this._hasEscapePod;
    }

		set hasEscapePod(h) {
      if (MAUtils.ensureBool(h)) {
				this._hasEscapePod = h;
      }
		}

		get hasInsurance() {
				return this._hasInsurance;
		}

		set hasInsurance(h) {
      if (MAUtils.ensureBool(h)) {
				this._hasInsurance = h;
      }
		}

    get noClaim() {
        return this._noClaim;
    }

		set noClaim(n) {
      if (MAUtils.ensureInteger(n)) {
				this._noClaim = n;
      }
		}

    get reputationScore() {
        return this._reputationScore;
    }

    set reputationScore(r) {
      if (MAUtils.ensureInteger(r)) {
        this._reputationScore = r
      }
    }

		get raided() {
				return this._raided;
		}

		set raided(r) {
      if (MAUtils.ensureBool(r)) {
				this._raided = r;
      }
		}

		get inspected() {
				return this._inspected;
		}

		set inspected(i) {
      if (MAUtils.ensureBool(i)) {
				this._inspected = i;
      }
		}

		get litterWarning() {
				return this._litterWarning;
		}

		set litterWarning(l) {
      if (MAUtils.ensureBool(l)) {
				this._litterWarning = l;
      }
		}

		getDebt() {
				return this._debt;
		}

    get debt() {
      return this._debt;
    }

    set debt(d) {
      if (this._checkCreditsAmount(d)) {
        this._debt = d;
      }
    }

		get arrivedViaWormhole() {
				return this._arrivedViaWormhole;
		}

		set arrivedViaWormhole(v) {
      if (MAUtils.ensureBool(v)) {
				this._arrivedViaWormhole = v;
      }
		}

		get travelClicksRemaining() {
				return this._travelClicksRemaining;
		}

		set travelClicksRemaining(t) {
      if (MAUtils.ensureInteger(t)) {
				this._travelClicksRemaining = t;
      }
		}

    setDifficulty(d) {
      if (MAUtils.ensureInteger(d)) {
        this._difficulty = d;
      }
    }

    get difficulty() {
      return this._difficulty
    }

    setCurrentSystem(currentSystem) {
      MAUtils.ensureType(currentSystem, "object")

      if (this._currentSystem !== currentSystem) {
        this._currentSystem = currentSystem;
        this._currentSystem.setVisited(true);

        const basePrices = [];
        for (let item = 0; item < SSSTTradeItemType.Count; ++item) {
          basePrices.push(this._calculateBasePriceForItem(item));
        }
        this._basePrices = basePrices;
      }
    }

    getCurrentSystem() {
        return this._currentSystem;
    }

    get currentSystem() {
        return this._currentSystem;
    }

    _calculateBasePriceForItem(itemType) {
        let price = this._currentSystem.standardPriceForItem(itemType);
        if (price <= 0) return 0;

        const item = SSSTTradeItem.tradeItemForType(itemType);
        if (item.doublePriceStatus !== SSSTStatus.Uneventful && this._currentSystem.status === item.doublePriceStatus) {
            // DoublePriceStatus is a misleading name
            price = Math.floor((price * 3) / 2)
        }

        price += gameRand.randomIntBelow(item.priceVariance) - gameRand.randomIntBelow(item.priceVariance);

        MAUtils.ensureInteger(price)

        return Math.max(price, 0);
    }

    sellPriceForItem(itemType) {
      const validState = MAUtils.ensureArrayOrNull(this._basePrices, "number") && MAUtils.ensureType(this._basePrices, "object")

      if (!validState) { return 0 }

      let price = this._basePrices[itemType];
      if (price <= 0) return 0;
      if (this._hasDubiousPoliceRecord()) {
        // We need to pay off a middleman
        price = Math.floor((price * 90) / 100);
      }

      MAUtils.ensureInteger(price)

      return price;
    }

    buyPriceForItem(itemType) {
        let price = this._basePrices[itemType];
        if (price <= 0) return 0;
        price = Math.floor(price * (103 + (MAX_SKILL_LEVEL - this.ship.crewTraderSkillIncludingCommander(this))) / 100);
        price = Math.max(price, this.sellPriceForItem(itemType) + 1);

        MAUtils.ensureInteger(price)

        return price;
    }

    buyPriceForAccessory(accessoryType) {
        const accessory = ACCESSORY_FOR_TYPE(accessoryType);
        let price = (accessory.techLevel > this._currentSystem.techLevel) ? 0 : Math.floor((accessory.price * (100 - this.ship.crewTraderSkillIncludingCommander(this))) / 100);

        MAUtils.ensureInteger(price)

        return price;
    }

    sellPriceForAccessory(accessoryType) {
      const result = Math.floor(ACCESSORY_FOR_TYPE(accessoryType).price * 3 / 4)
      MAUtils.ensureInteger(result)
      return result
    }

    buyPriceForShipModel(shipModel) {
      const result = Math.floor(shipModel.price * (100 - this.ship.crewTraderSkillIncludingCommander(this)) / 100)
      MAUtils.ensureInteger(result)
      return result
    }

    debtIsTooLargeToBuy() {
      return this.debt > 100000;
    }

    spendingMoney() {
      const result = this._reserveMoney ? Math.max(0, this._credits - this.ship.mercenaryPricePerDay() - this.currentInsuranceCost()) : this._credits
      MAUtils.ensureInteger(result)
      return result
    }

    currentInsuranceCost() {
        return this._hasInsurance ? this.insurancePrice() : 0;
    }

    insurancePrice() {
      const result = Math.max(1, Math.floor(Math.floor(this.ship.shipValuationForInsurance(true) * 5 / 2000) * (100 - Math.min(this._noClaim, MAX_SAFE_PILOT_INSURANCE_DISCOUNT)) / 100))
      MAUtils.ensureInteger(result)
      return result
    }

    netWorth() {
      const result = this.cargoAndShipValuationForInsurance(false) + this._credits - this.debt + (this._boughtMoon ? MOON_PRICE : 0)
      MAUtils.ensureInteger(result)
      return result
    }

    maxLoan() {
      const result = (this.policeRecordScore >= SSSTPoliceRecordScore.Clean) ? Math.floor(this.netWorth() / 10 / 500) * 500 : 500
      MAUtils.ensureInteger(result)
      return result
    }

    _cargoValue() {
        let value = 0;
        for (let item = 0; item < SSSTTradeItemType.Count; ++item) {
            const quantity = this.ship.tradeItemQuantityForType(item);
            value += quantity * this.sellPriceForItem(item);
        }

        MAUtils.ensureInteger(value)

        return value;
    }

    cargoAndShipValuationForInsurance(forInsurance) {
      const result = this.ship.shipValuationForInsurance(forInsurance) + this._cargoValue()
      MAUtils.ensureInteger(result)
      return result
    }

    attemptPurchaseOfFuel(amount) {
      if (MAUtils.ensureInteger(amount)) {
        let realAmount = Math.min(this.ship.fuelTankCapacity() - this.ship.fuel, amount);
        realAmount = Math.min(realAmount, Math.floor(this._credits / this.ship.model.costOfFuel));
        this.ship.fillFuelByAmount(realAmount);
        this.credits -= realAmount * this.ship.model.costOfFuel;
      }
    }

    attemptPurchaseOfRepairs(amount) {
      if (MAUtils.ensureInteger(amount)) {
        let realAmount = Math.min(this.ship.maximumHullStrength() - this.ship.hull, amount);
        realAmount = Math.floor(Math.min(realAmount, this._credits / this.ship.model.repairCosts));
        this.ship.repairHullByAmount(realAmount);
        this.credits -= realAmount * this.ship.model.repairCosts;
      }
    }

    attemptPurchaseOfItem(itemType, quantity) {
      if (MAUtils.ensureInteger(itemType) && MAUtils.ensureInteger(quantity)) {
        let actualBuyAmount = Math.min(quantity, this._currentSystem.tradeItemQuantityForType(itemType));
        actualBuyAmount = Math.min(actualBuyAmount, this.ship.freeCargoBays());
        const buyPrice = this.buyPriceForItem(itemType);
        if (buyPrice > 0) {
            actualBuyAmount = Math.min(actualBuyAmount, Math.floor(this.spendingMoney() / buyPrice));
        } else {
            actualBuyAmount = 0;
        }

        this.ship.boughtQuantity(actualBuyAmount, itemType, this.buyPriceForItem(itemType));
        this.credits -= actualBuyAmount * this.buyPriceForItem(itemType);
        this._currentSystem.boughtQuantity(actualBuyAmount, itemType);
      }
    }

    attemptSaleOfItem(itemType, quantity, forceDump) {
      if (MAUtils.ensureInteger(itemType) && MAUtils.ensureInteger(quantity) && MAUtils.ensureBool(forceDump)) {
        let actualSellAmount = Math.min(quantity, this.ship.tradeItemQuantityForType(itemType));

        const isDumping = forceDump || this.sellPriceForItem(itemType) === 0;
        const dumpPenalty = 5 * (this._difficulty + 1);
        if (isDumping) {
            actualSellAmount = Math.min(actualSellAmount, Math.floor(this.spendingMoney() / dumpPenalty));
        }

        this.ship.soldQuantity(quantity, itemType);

        if (isDumping) {
            this.credits -= actualSellAmount * dumpPenalty;
        } else {
            this.credits += actualSellAmount * this.sellPriceForItem(itemType);
        }
      }
    }

    wormholeTaxToWarpToSystem(destination) {
      MAUtils.ensureType(destination, "object")
      return (this._currentSystem.wormhole === destination) ? this.ship.costOfFuel() * 25 : 0
    }

    increaseSkillRandomly() {
        return this._tweakSkillRandomly(true);
    }

    decreaseSkillRandomly() {
        this._tweakSkillRandomly(false);
    }

    _tweakSkillRandomly(increase) {
        MAUtils.ensureBool(increase)

        const skillArray = [];
        const BOUND_CHECK = (x) => (increase ? x < MAX_SKILL_LEVEL : x > 0);

        if (BOUND_CHECK(this.pilot)) skillArray.push(0);
        if (BOUND_CHECK(this.fighter)) skillArray.push(1);
        if (BOUND_CHECK(this.trader)) skillArray.push(2);
        if (BOUND_CHECK(this.engineer)) skillArray.push(3);

        const increaseAmount = increase ? 1 : -1;
        if (skillArray.length) {
            const randomSkill = skillArray[gameRand.randomIntBelow(skillArray.length)];
            switch (randomSkill) {
                case 0:
                    this.pilot += increaseAmount;
                    return 'pilot';
                case 1:
                    this.fighter += increaseAmount;
                    return 'fighter';
                case 2:
                    this.trader += increaseAmount;
                    return 'trader';
                case 3:
                    this.engineer += increaseAmount;
                    return 'engineer';
                default:
                    return '';
            }
        }
        return '';
    }

    payInterest() {
        if (this.debt > 0) {
            const debtIncrease = Math.max(1, Math.floor(this.debt / 10));
            MAUtils.ensureInteger(debtIncrease)
            if (this.credits > debtIncrease) {
                this.credits -= debtIncrease;
            } else {
                this.debt += (debtIncrease - this.credits);
                this.credits = 0;
            }
        }
    }

    timePassed(days) {
        if (!MAUtils.ensureInteger(days)) { return }

        this.days += days;
        if (this._hasInsurance) {
            this._noClaim += days;
        }

        if (this.policeRecordScore > SSSTPoliceRecordScore.Clean) {
            if (this.days % 3 === 0) {
                this.policeRecordScore--;
            }
        } else if (this.policeRecordScore < SSSTPoliceRecordScore.Dubious) {
            if (this._difficulty <= SSSTDifficulty.Normal || this.days % this._difficulty === 0) {
                this.policeRecordScore++;
            }
        }
    }

    serializedState() {
        const state = super.serializedState();

        // Integer properties
        MAUtils.ensureInteger(this._credits)
        state.credits = this._credits;

        MAUtils.ensureInteger(this._debt)
        state.debt = this._debt;

        MAUtils.ensureInteger(this.days)
        state.days = this.days;

        MAUtils.ensureInteger(this.policeKills)
        state.policeKills = this.policeKills;

        MAUtils.ensureInteger(this.traderKills)
        state.traderKills = this.traderKills;

        MAUtils.ensureInteger(this.pirateKills)
        state.pirateKills = this.pirateKills;

        MAUtils.ensureInteger(this.policeRecordScore)
        state.policeRecordScore = this.policeRecordScore;

        MAUtils.ensureInteger(this._reputationScore)
        state.reputationScore = this._reputationScore;

        MAUtils.ensureInteger(this._noClaim)
        state.noClaim = this._noClaim;

        MAUtils.ensureInteger(this._travelClicksRemaining)
        state.travelClicksRemaining = this._travelClicksRemaining;

        MAUtils.ensureInteger(this._difficulty)
        state.difficulty = this._difficulty;

        // Boolean properties
        MAUtils.ensureBool(this._boughtMoon)
        state.boughtMoon = this._boughtMoon;

        MAUtils.ensureBool(this._hasEscapePod)
        state.hasEscapePod = this._hasEscapePod;

        MAUtils.ensureBool(this._hasInsurance)
        state.hasInsurance = this._hasInsurance;

        MAUtils.ensureBool(this._raided)
        state.raided = this._raided;

        MAUtils.ensureBool(this._inspected)
        state.inspected = this._inspected;

        MAUtils.ensureBool(this._litterWarning)
        state.litterWarning = this._litterWarning;

        MAUtils.ensureBool(this.artifactOnBoard)
        state.artifactOnBoard = this.artifactOnBoard;

        MAUtils.ensureBool(this._arrivedViaWormhole)
        state.arrivedViaWormhole = this._arrivedViaWormhole;

        MAUtils.ensureBool(this._reserveMoney)
        state.reserveMoney = this._reserveMoney;

        // Current system and ship
        MAUtils.ensureType(this._currentSystem.name, "string")
        state.currentSystemName = this._currentSystem.name;

        state.ship = this.ship.serializedState();

        // Base prices
        MAUtils.ensureArrayOrNull(this._basePrices, "number")
        if (this._basePrices) {
          state.basePrices = [ ...this._basePrices ];
        }

        return state;
    }
}
