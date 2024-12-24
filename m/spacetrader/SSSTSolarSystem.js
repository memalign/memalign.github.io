class SSSTSolarSystem {
    constructor(name, x, y, difficulty) {
        if (!name) {
          return
        }

        MAUtils.ensureType(name, "string")
        this._name = name;

        MAUtils.ensureArrayOrNull([x, y, difficulty], "number")
        this._x = x;
        this._y = y;
        this._difficulty = difficulty;

        this._mercenary = null
        this._wormhole = null

        this._specialEvent = SSSTSpecialEvent.None;
        this._visited = false;

        // Randomize the other properties
        this._techLevel = gameRand.randomIntBelow(SSSTTechLevel.Count);
        this._politics = SSSTPolitics.randomPoliticsForTechLevel(this._techLevel);

        if (gameRand.randomIntBelow(5) >= 3) {
            this._specialResource = 1 + gameRand.randomIntBelow((SSSTResource.Count - 1));
        } else {
            this._specialResource = SSSTResource.None;
        }

        this._size = gameRand.randomIntBelow(SSSTSystemSize.Count);

        this._status = SSSTStatus.Uneventful;
        this.randomizeStatus();

        this._inventoryReplenishCountdown = 0;
        this._initializeInventories();
    }

    static solarSystemNames() {
        if (!this.sSystemNames) {
            this.sSystemNames = [
                "Acamar", "Adahn", "Aldea", "Andevian", "Antedi", "Ashen", "Balosnee", "Baratas", "Brax", "Bretel", "Calondia",
                "Campor", "Capelle", "Carzon", "Castor", "Cestus", "Cheron", "Courteney", "Daled", "Damast", "Davlos", "Deneb",
                "Deneva", "Devidia", "Draylon", "Drema", "Endor", "Esmee", "Exo", "Ferris", "Festen", "Fourmi", "Frolix",
                "Gemulon", "Guinifer", "Hades", "Hamlet", "Helena", "Hulst", "Iodine", "Iralius", "Janus", "Japori", "Jarada",
                "Jason", "Kaylon", "Khefka", "Kira", "Klaatu", "Klaestron", "Korma", "Kravat", "Krios", "Laertes", "Largo",
                "Lave", "Leda", "Ligon", "Lowry", "Magrat", "Malcoria", "Melina", "Mentar", "Merik", "Mintaka", "Montor",
                "Mordan", "Nelvana", "Nix", "Nyle", "Odet", "Og", "Omega", "Omphalos", "Orias", "Othello", "Parade", "Penthara",
                "Picard", "Pollux", "Quator", "Rakhar", "Ran", "Regulas", "Relva", "Rhymus", "Rochani", "Rubicum", "Rutia",
                "Sarpeidon", "Sefalla", "Seltrice", "Sigma", "Sol", "Somari", "Stakoron", "Styris", "Talani", "Tamus",
                "Tantalos", "Tanuga", "Tarchannen", "Terosa", "Thera", "Titan", "Torin", "Triacus", "Turkana", "Tyrus",
                "Umberlee", "Utopia", "Vadera", "Vagra", "Vandor", "Ventax", "Xenon", "Xerxes", "Yew", "Yojimbo", "Zalkon",
                "Zuul"
            ];
        }
        return this.sSystemNames;
    }

    static indexForSystemName(name) {
        return SSSTSolarSystem.solarSystemNames().indexOf(name);
    }

    static solarSystemForName(name, solarSystems) {
        MAUtils.ensureArrayOrNull(solarSystems, "object")

        if (!name) return null;

        for (const solarSystem of solarSystems) {
            if (solarSystem._name === name) {
                return solarSystem;
            }
        }
        return null;
    }

    static fromSerializedState(serializedState) {
        const solarSystem = new SSSTSolarSystem()
        solarSystem._name = serializedState.name;
        solarSystem._techLevel = serializedState.techLevel;
        solarSystem._status = serializedState.status;
        solarSystem._specialResource = serializedState.specialResource;
        solarSystem._size = serializedState.size;
        solarSystem._specialEvent = serializedState.specialEvent;
        solarSystem._difficulty = serializedState.difficulty;
        solarSystem._politics = SSSTPolitics.politicsForType(serializedState.politicsType);

        solarSystem._x = serializedState.x;
        solarSystem._y = serializedState.y;

        solarSystem._inventoryReplenishCountdown = serializedState.inventoryReplenishCountdown;

        solarSystem._visited = serializedState.visited;

        const mercenaryState = serializedState.mercenary;
        if (mercenaryState) {
            solarSystem._mercenary = SSSTCrewMember.fromSerializedState(mercenaryState);
            MAUtils.ensureObjectOrNull(solarSystem._mercenary)
        } else {
            solarSystem._mercenary = null
        }

        const tradeItemInventoryArray = serializedState.tradeItemInventory;
        solarSystem._tradeItemInventory = Array(SSSTTradeItemType.Count).fill(0);
        for (let tradeItemType = 0; tradeItemType < SSSTTradeItemType.Count; ++tradeItemType) {
            solarSystem._tradeItemInventory[tradeItemType] = tradeItemInventoryArray[tradeItemType];
        }

        return solarSystem
    }

    updateWormholeForSerializedState(serializedState, solarSystems) {
        const wormholeName = serializedState.wormholeName;
        this._wormhole = SSSTSolarSystem.solarSystemForName(wormholeName, solarSystems);
    }

    get x() {
      return this._x
    }

    get y() {
      return this._y
    }

    get size() {
      return this._size
    }

    getName() {
        return this._name;
    }

    get name() {
        return this._name;
    }

		get techLevel() {
				return this._techLevel;
		}

    set techLevel(t) {
      if (MAUtils.ensureInteger(t)) {
        this._techLevel = t
      }
    }

    setVisited(v) {
      if (MAUtils.ensureBool(v)) {
        this._visited = v;
      }
    }

		get visited() {
				return this._visited;
		}

		set visited(v) {
      this.setVisited(v)
		}

		get inventoryReplenishCountdown() {
				return this._inventoryReplenishCountdown;
		}

		set inventoryReplenishCountdown(i) {
      if (MAUtils.ensureInteger(i)) {
				this._inventoryReplenishCountdown = i;
      }
		}

    setWormhole(sys) {
      if (MAUtils.ensureType(sys, "object")) {
        this._wormhole = sys;
      }
    }

		get wormhole() {
				return this._wormhole;
		}

		getStatus() {
				return this._status;
		}

    get status() {
        return this._status;
    }

    setSpecialEvent(sE) {
      if (MAUtils.ensureInteger(sE)) {
        this._specialEvent = sE;
      }
    }

    getSpecialEvent() {
        return this._specialEvent;
    }

    get specialEvent() {
        return this._specialEvent;
    }

    set specialEvent(sE) {
      this.setSpecialEvent(sE)
    }

    setMercenary(m) {
      if (MAUtils.ensureType(m, "object")) {
        this._mercenary = m;
      }
    }

    getMercenary() {
        return this._mercenary;
    }

    get mercenary() {
        return this._mercenary;
    }

		getPolitics() {
				return this._politics;
		}

    get politics() {
        return this._politics;
    }

    set politics(p) {
      if (MAUtils.ensureInteger(p.type)) {
        this._politics = p
      }
    }

    hashCode() {
      let str = this._name;

      let hash = 0, i, chr;
      if (str.length === 0) return hash;
      for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
        hash  = Math.abs(hash)
      }
      return hash;
    }

    _initializeInventories() {
        this._tradeItemInventory = Array(SSSTTradeItemType.Count).fill(0);
        for (let itemType = 0; itemType < SSSTTradeItemType.Count; ++itemType) {
            const item = SSSTTradeItem.tradeItemForType(itemType);

            if (!this._canProduceItem(itemType)) {
                this._tradeItemInventory[itemType] = 0;
                continue;
            }

            this._tradeItemInventory[itemType] = ((9 + gameRand.randomIntBelow(5)) - Math.abs(item.techLevelMaxProd - this._techLevel)) * (1 + this._size);

            if (itemType === SSSTTradeItemType.Robots || itemType === SSSTTradeItemType.Narcotics) {
                this._tradeItemInventory[itemType] = Math.floor((this._tradeItemInventory[itemType] * (5 - this._difficulty)) / (6 - this._difficulty)) + 1;
            }

            if (item.cheapResource !== SSSTResource.None) {
                if (this._specialResource === item.cheapResource) {
                    this._tradeItemInventory[itemType] = Math.floor((this._tradeItemInventory[itemType] * 4) / 3);
                }
            }

            if (item.expensiveResource !== SSSTResource.None) {
                if (this._specialResource === item.expensiveResource) {
                    this._tradeItemInventory[itemType] = Math.floor((this._tradeItemInventory[itemType] * 3) / 4);
                }
            }

            if (item.doublePriceStatus !== SSSTStatus.Uneventful) {
                if (this._status === item.doublePriceStatus) {
                    this._tradeItemInventory[itemType] = Math.floor(this._tradeItemInventory[itemType] / 5);
                }
            }

            this._tradeItemInventory[itemType] = this._tradeItemInventory[itemType] - gameRand.randomIntBelow(10) + gameRand.randomIntBelow(10);
            this._tradeItemInventory[itemType] = Math.max(this._tradeItemInventory[itemType], 0);

            MAUtils.ensureInteger(this._tradeItemInventory[itemType])
        }
    }

    distanceTo(other) {
        return Math.floor(Math.sqrt(this.squaredDistanceTo(other)));
    }

    squaredDistanceTo(other) {
        return Math.floor(this.squaredDistanceToXY(other._x, other._y));
    }

    squaredDistanceToXY(x, y) {
      MAUtils.ensureInteger(x)
      MAUtils.ensureInteger(y)
      return Math.floor((this._x - x) ** 2 + (this._y - y) ** 2);
    }

    standardPriceForItem(itemType) {
        if ((itemType === SSSTTradeItemType.Narcotics && !this._politics.drugsTradeable) ||
            (itemType === SSSTTradeItemType.Firearms && !this._politics.firearmsTradeable)) {
            return 0;
        }

        const item = SSSTTradeItem.tradeItemForType(itemType);

        if (this._techLevel < item.techLevelToUse) {
            return 0;
        }

        let price = item.priceLowTech + Math.floor(this._techLevel * item.priceIncreasePerTechLevel);

        if (this._politics.mostDesiredTradeItem === itemType) {
            price = Math.floor((price * 4) / 3);
        }

        price = Math.floor((price * (100 - 2 * this._politics.occurrenceTraders)) / 100);
        price = Math.floor((price * (100 - this._size)) / 100);

        if (this._visited && this._specialResource !== SSSTResource.None) {
            if (item.cheapResource === this._specialResource) {
                price = Math.floor((price * 3) / 4);
            }

            if (item.expensiveResource === this._specialResource) {
                price = Math.floor((price * 4) / 3);
            }
        }

        MAUtils.ensureInteger(price)

        return Math.max(price, 0);
    }

    tradeItemQuantityForType(type) {
        //console.assert(type >= 0 && type < SSSTTradeItemType.Count);
        MAUtils.ensureInteger(type)
        return this._tradeItemInventory[type];
    }

    boughtQuantity(quantity, type) {
        //console.assert(type >= 0 && type < SSSTTradeItemType.Count);
        if (MAUtils.ensureInteger(quantity) && MAUtils.ensureInteger(type)) {
          this._tradeItemInventory[type] -= Math.min(quantity, this._tradeItemInventory[type]);
        }
    }

    _canProduceItem(itemType) {
        const item = SSSTTradeItem.tradeItemForType(itemType);

        const cantProduceItem =
            ((itemType === SSSTTradeItemType.Narcotics) && !this._politics.drugsTradeable) ||
            ((itemType === SSSTTradeItemType.Firearms) && !this._politics.firearmsTradeable) ||
            (this._techLevel < item.techLevelToProduce);

        return !cantProduceItem;
    }

    updateInventories() {
        if (this._inventoryReplenishCountdown > 0) {
            this._inventoryReplenishCountdown--;

            if (this._inventoryReplenishCountdown <= 0) {
                this._initializeInventories();
            } else {
                for (let itemType = 0; itemType < SSSTTradeItemType.Count; ++itemType) {
                    if (!this._canProduceItem(itemType)) {
                        this._tradeItemInventory[itemType] = 0;
                        continue;
                    }

                    this._tradeItemInventory[itemType] = Math.max(0, this._tradeItemInventory[itemType] + gameRand.randomIntBelow(5) - gameRand.randomIntBelow(5));
                }
            }
        } else {
            for (let itemType = 0; itemType < SSSTTradeItemType.Count; ++itemType) {
                if (!this._canProduceItem(itemType)) {
                    this._tradeItemInventory[itemType] = 0;
                    continue;
                }
            }
        }
    }

    randomizeStatus() {
        const hasStatus = this._status !== SSSTStatus.Uneventful;

        if (gameRand.randomIntBelow(100) < 15) {
            this._status = hasStatus ? SSSTStatus.Uneventful : (1 + gameRand.randomIntBelow((SSSTStatus.Count - 1)));
        }
    }

    systemInfoString() {
        const systemInfo = `${SYSTEM_SIZE_STR(this.size).toLowerCase()} ${TECH_LEVEL_STR(this.techLevel).toLowerCase()} ${this.politics.name.toLowerCase()}\n${STATUS_STR(this.status).toLowerCase()}\n${RESOURCES_STR(this._specialResource).toLowerCase()}, ${occurrenceStr(this.politics.occurrencePolice).toLowerCase()} police, ${occurrenceStr(this.politics.occurrencePirates).toLowerCase()} pirates`;
        return systemInfo;
    }

    serializedState() {
        const state = {};

        MAUtils.ensureType(this._name, "string")
        state.name = this._name;

        MAUtils.ensureInteger(this._techLevel)
        state.techLevel = this._techLevel;

        MAUtils.ensureInteger(this._status)
        state.status = this._status;

        MAUtils.ensureInteger(this._specialResource)
        state.specialResource = this._specialResource;

        MAUtils.ensureInteger(this._size)
        state.size = this._size;

        MAUtils.ensureInteger(this._specialEvent)
        state.specialEvent = this._specialEvent;

        MAUtils.ensureInteger(this._difficulty)
        state.difficulty = this._difficulty;

        MAUtils.ensureInteger(this._politics.type)
        state.politicsType = this._politics.type;

        MAUtils.ensureInteger(this._x)
        state.x = this._x;
        MAUtils.ensureInteger(this._y)
        state.y = this._y;

        MAUtils.ensureInteger(this._inventoryReplenishCountdown)
        state.inventoryReplenishCountdown = this._inventoryReplenishCountdown;

        MAUtils.ensureBool(this._visited)
        state.visited = this._visited;

        MAUtils.ensureObjectOrNull(this._wormhole)
        if (this._wormhole) {
          MAUtils.ensureType(this._wormhole.name, "string")
          state.wormholeName = this._wormhole.name;
        }

        MAUtils.ensureObjectOrNull(this._mercenary)
        if (this._mercenary) {
          state.mercenary = this._mercenary.serializedState();
        }

        MAUtils.ensureArrayOrNull(this._tradeItemInventory, "number")
        state.tradeItemInventory = this._tradeItemInventory.map(item => item);

        return state;
    }
}
