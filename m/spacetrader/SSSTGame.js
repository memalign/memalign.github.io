const GALAXY_WIDTH = 150;
const GALAXY_HEIGHT = 110;

let STARTING_CREDITS = 1000;

const SSSTGameEndStatus = {
  None: 0,
  Retired: 1,
  Killed: 2,
  Moon: 3,
};

const SSSTRareEvent = {
  MarieCeleste: 0,
  CaptainAhab: 1,
  CaptainConrad: 2,
  CaptainHuie: 3,
  BottleOld: 4,
  BottleGood: 5,

  Count: 6
};


const MIN_DISTANCE = 6;

const HUGE_SQR_DISTANCE = (GALAXY_HEIGHT * GALAXY_HEIGHT + GALAXY_WIDTH * GALAXY_WIDTH);

const DIAGONAL_SIZE = Math.sqrt(GALAXY_WIDTH * GALAXY_WIDTH + GALAXY_HEIGHT * GALAXY_HEIGHT);
const CLOSE_DISTANCE = Math.max(MIN_DISTANCE, (0.07 * DIAGONAL_SIZE));

const WORMHOLE_COUNT = 6;

const MERCENARY_COUNT = SSSTCrewMember.mercenaryNames().length;



class SSSTGame {
  constructor(difficulty, commander) {
    this._saveBlock = null

    if (commander) {
      this._uniqueID = this._generateUniqueID();
      this._endStatus = SSSTGameEndStatus.None

      this._trackedSystem = null
      this._breakingNews = null

      this.canSuperWarp = false
      this.autoNews = false
      this.autoRepairs = false
      this.autoFuel = false
      this.remindLoans = false
      this.tribbleMessage = false
      this.alreadyPaidForNewspaper = false
      this.alwaysIgnorePirates = false
      this.alwaysIgnorePolice = false
      this.alwaysIgnoreTraders = false
      this.alwaysIgnoreTradeInOrbit = false

      this.monsterStatus = 0
      this.dragonflyStatus = 0
      this.scarabStatus = 0
      this.japoriQuestStatus = 0
      this.jarekStatus = 0
      this.invasionStatus = 0
      this.experimentStatus = 0
      this.fabricRipProbability = 0
      this.wildStatus = 0
      this.reactorStatus = 0

      MAUtils.ensureType(commander, "object")
      this.commander = commander;

      MAUtils.ensureInteger(difficulty)
      this.difficulty = difficulty;

      this._populateSolarSystems();
      this._setupEventsAndMercenaries();
      this._setupCommander();
      this._setupInitialGameState();
    }
  }

  static fromSerializedState(serializedState) {
    const instance = new SSSTGame();

    instance.monsterStatus = serializedState.monsterStatus;
    instance.dragonflyStatus = serializedState.dragonflyStatus;
    instance.scarabStatus = serializedState.scarabStatus;
    instance.japoriQuestStatus = serializedState.japoriQuestStatus;
    instance.jarekStatus = serializedState.jarekStatus;
    instance.invasionStatus = serializedState.invasionStatus;
    instance.experimentStatus = serializedState.experimentStatus;
    instance.fabricRipProbability = serializedState.fabricRipProbability;
    instance.wildStatus = serializedState.wildStatus;
    instance.reactorStatus = serializedState.reactorStatus;
    instance.difficulty = serializedState.difficulty;
    instance._endStatus = serializedState.endStatus;

    instance._monsterHull = serializedState.monsterHull;

    instance.remindLoans = serializedState.remindLoans;
    instance.tribbleMessage = serializedState.tribbleMessage;
    instance.alreadyPaidForNewspaper = serializedState.alreadyPaidForNewspaper;
    instance.alwaysIgnorePirates = serializedState.alwaysIgnorePirates;
    instance.alwaysIgnorePolice = serializedState.alwaysIgnorePolice;
    instance.alwaysIgnoreTraders = serializedState.alwaysIgnoreTraders;
    instance.alwaysIgnoreTradeInOrbit = serializedState.alwaysIgnoreTradeInOrbit;
    instance.autoFuel = serializedState.autoFuel;
    instance.autoRepairs = serializedState.autoRepairs;
    instance.autoNews = serializedState.autoNews;
    instance.canSuperWarp = serializedState.canSuperWarp;

    if (serializedState.breakingNews) {
      pLog.log(71)
      instance._breakingNews = [ ...serializedState.breakingNews ];
      MAUtils.ensureArrayOrNull(instance._breakingNews, "string")
    } else {
      pLog.log(72)
      instance._breakingNews = null
    }

    instance._remainingRareEvents = [...serializedState.remainingRareEvents];
    MAUtils.ensureArrayOrNull(instance._remainingRareEvents, "number")

    instance.solarSystems = serializedState.solarSystems.map(ss => SSSTSolarSystem.fromSerializedState(ss));

    instance.solarSystems.forEach((solarSystem, idx) => {
      solarSystem.updateWormholeForSerializedState(serializedState.solarSystems[idx], instance.solarSystems);
    });

    instance._warpSystem = instance._findSolarSystem(serializedState.warpSystemName);
    instance._trackedSystem = instance._findSolarSystem(serializedState.trackedSystemName);

    instance.commander = SSSTCommander.fromSerializedState(serializedState.commander, instance.solarSystems)

    instance._lastSave = new Date(serializedState.lastSave);

    instance._uniqueID = serializedState.uniqueID || instance._generateUniqueID();

    return instance;
  }

  get trackedSystem() {
    return this._trackedSystem
  }

  set trackedSystem(s) {
    if (MAUtils.ensureObjectOrNull(s)) {
      this._trackedSystem = s
    }
  }

  get endStatus() {
    return this._endStatus
  }

  set endStatus(st) {
    if (MAUtils.ensureInteger(st)) {
      this._endStatus = st
    }
  }

  get uniqueID() {
    return this._uniqueID
  }

  _generateUniqueID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  serializedState() {
    const state = {};

    MAUtils.ensureInteger(this.monsterStatus)
    state.monsterStatus = this.monsterStatus;

    MAUtils.ensureInteger(this.dragonflyStatus)
    state.dragonflyStatus = this.dragonflyStatus;

    MAUtils.ensureInteger(this.scarabStatus)
    state.scarabStatus = this.scarabStatus;

    MAUtils.ensureInteger(this.japoriQuestStatus)
    state.japoriQuestStatus = this.japoriQuestStatus;

    MAUtils.ensureInteger(this.jarekStatus)
    state.jarekStatus = this.jarekStatus;

    MAUtils.ensureInteger(this.invasionStatus)
    state.invasionStatus = this.invasionStatus;

    MAUtils.ensureInteger(this.experimentStatus)
    state.experimentStatus = this.experimentStatus;

    MAUtils.ensureInteger(this.fabricRipProbability)
    state.fabricRipProbability = this.fabricRipProbability;

    MAUtils.ensureInteger(this.wildStatus)
    state.wildStatus = this.wildStatus;

    MAUtils.ensureInteger(this.reactorStatus)
    state.reactorStatus = this.reactorStatus;

    MAUtils.ensureInteger(this.difficulty)
    state.difficulty = this.difficulty;

    MAUtils.ensureInteger(this._endStatus)
    state.endStatus = this._endStatus;

    MAUtils.ensureInteger(this._monsterHull)
    state.monsterHull = this._monsterHull;

    state.score = this.score()
    MAUtils.ensureInteger(state.score)

    MAUtils.ensureBool(this.remindLoans)
    state.remindLoans = this.remindLoans;

    MAUtils.ensureBool(this.tribbleMessage)
    state.tribbleMessage = this.tribbleMessage;

    MAUtils.ensureBool(this.alreadyPaidForNewspaper)
    state.alreadyPaidForNewspaper = this.alreadyPaidForNewspaper;

    MAUtils.ensureBool(this.alwaysIgnorePirates)
    state.alwaysIgnorePirates = this.alwaysIgnorePirates;

    MAUtils.ensureBool(this.alwaysIgnorePolice)
    state.alwaysIgnorePolice = this.alwaysIgnorePolice;

    MAUtils.ensureBool(this.alwaysIgnoreTraders)
    state.alwaysIgnoreTraders = this.alwaysIgnoreTraders;

    MAUtils.ensureBool(this.alwaysIgnoreTradeInOrbit)
    state.alwaysIgnoreTradeInOrbit = this.alwaysIgnoreTradeInOrbit;

    MAUtils.ensureBool(this.autoFuel)
    state.autoFuel = this.autoFuel;

    MAUtils.ensureBool(this.autoRepairs)
    state.autoRepairs = this.autoRepairs;

    MAUtils.ensureBool(this.autoNews)
    state.autoNews = this.autoNews;

    MAUtils.ensureBool(this.canSuperWarp)
    state.canSuperWarp = this.canSuperWarp;

    MAUtils.ensureArrayOrNull(this._breakingNews, "string")
    if (this._breakingNews) {
      state.breakingNews = [ ...this._breakingNews ];
      pLog.log(73)
    }

    state.commander = this.commander.serializedState();

    MAUtils.ensureObjectOrNull(this._warpSystem)
    if (this._warpSystem) {
      MAUtils.ensureType(this._warpSystem.name, "string")
      state.warpSystemName = this._warpSystem.name;
    }

    MAUtils.ensureObjectOrNull(this._trackedSystem)
    if (this._trackedSystem) {
      MAUtils.ensureType(this._trackedSystem.name, "string")
      state.trackedSystemName = this._trackedSystem.name;
      pLog.log(74)
    }

    MAUtils.ensureType(this._uniqueID, "string")
    state.uniqueID = this._uniqueID;

    MAUtils.ensureArrayOrNull(this._remainingRareEvents, "number")
    if (this._remainingRareEvents) {
      state.remainingRareEvents = [...this._remainingRareEvents];
      pLog.log(75)
    }

    MAUtils.ensureArrayOrNull(this.solarSystems, "object")
    state.solarSystems = this.solarSystems.map(solarSystem => solarSystem.serializedState());

    this._lastSave = new Date();
    state.lastSave = this._lastSave;

    return state;
  }

  setSaveBlock(saveBlock) {
    this._saveBlock = saveBlock;
  }

  save() {
    if (this._saveBlock) {
      this._saveBlock(this);
    }
  }

  score() {
    let score = 0;
    const worth = this.commander.netWorth();
    const MILLION = 1000000;
    const adjustedWorth = worth < MILLION ? worth : Math.floor(MILLION + (worth - MILLION) / 10);

    if (this._endStatus === SSSTGameEndStatus.Killed) {
      score = (this.difficulty + 1) * ((adjustedWorth * 90) / 50000);
    } else if (this._endStatus === SSSTGameEndStatus.Retired) {
      score = (this.difficulty + 1) * ((adjustedWorth * 95) / 50000);
    } else {
      const dayFactor = Math.max(0, (this.difficulty + 1) * 100 - this.commander.days);
      score = (this.difficulty + 1) * ((adjustedWorth + (dayFactor * 1000)) / 500);
    }

    score = Math.floor(score)
    MAUtils.ensureInteger(score)

    return score
  }

  scorePercentageString() {
    const score = this.score();
    const wholeNumber = Math.floor(score / 50);
    const decimal = Math.floor((score % 50) / 5);
    return `${wholeNumber}.${decimal}%`;
  }

  _populateSolarSystems() {
    if (this.solarSystems) return;

    const solarSystemCount = SSSTSolarSystem.solarSystemNames().length;
    let solarSystems = [];
    let solarSystemNames = [...SSSTSolarSystem.solarSystemNames()];

    let i = 0;
    while (i < solarSystemCount) {
      let x = 0;
      let y = 0;
      const hasWormhole = i < WORMHOLE_COUNT;

      if (hasWormhole) {
        // Distribute the wormholes evenly across the board, not too close to the edge

        x =
          Math.floor(CLOSE_DISTANCE / 2) -
          gameRand.randomIntBelow(CLOSE_DISTANCE) +
          Math.floor((GALAXY_WIDTH * (1 + 2 * (i % Math.floor(WORMHOLE_COUNT / 2)))) /
            WORMHOLE_COUNT);
        y =
          Math.floor(CLOSE_DISTANCE / 2) -
          gameRand.randomIntBelow(CLOSE_DISTANCE) +
          Math.floor((GALAXY_HEIGHT * (i < Math.floor(WORMHOLE_COUNT / 2) ? 1 : 3)) / 4);
      } else {
        x = 1 + gameRand.randomIntBelow((GALAXY_WIDTH - 2));
        y = 1 + gameRand.randomIntBelow((GALAXY_HEIGHT - 2));
      }

      let closeFound = hasWormhole; // systems with wormholes are close to each other
      let tooClose = false;

      // We are trying to fill in systems around existing clusters with wormholes
      if (i >= WORMHOLE_COUNT) {
        for (let j = 0; j < i; ++j) {
          // Enforce minimum distance between two systems
          const squaredDistanceToSystemJ = solarSystems[j].squaredDistanceToXY(
            x,
            y
          );
          if (squaredDistanceToSystemJ <= (MIN_DISTANCE + 1) ** 2) {
            tooClose = true;
            break;
          }

          if (squaredDistanceToSystemJ < CLOSE_DISTANCE ** 2) {
            closeFound = true;
          }
        }
      }

      // We're either too close or not close enough, recalculate coordinates for this system.
      if (tooClose || !closeFound) continue;

      const randomNameIndex = gameRand.randomIntBelow(solarSystemNames.length);
      const solarSystem = new SSSTSolarSystem(
        solarSystemNames[randomNameIndex],
        x,
        y,
        this.difficulty
      );
      solarSystemNames.splice(randomNameIndex, 1);

      solarSystems.push(solarSystem);

      i++;
    }

    this.solarSystems = solarSystems;

    // Wormholes go in a loop
    let wormholeSystems = solarSystems.slice(0, WORMHOLE_COUNT);
    let randomWormholeSystems = [];
    while (wormholeSystems.length > 0) {
      const randomIndex = gameRand.randomIntBelow(wormholeSystems.length);
      randomWormholeSystems.push(wormholeSystems[randomIndex]);
      wormholeSystems.splice(randomIndex, 1);
    }

    for (let i = 0; i < WORMHOLE_COUNT - 1; ++i) {
      randomWormholeSystems[i].setWormhole(randomWormholeSystems[i + 1]);
    }
    randomWormholeSystems[WORMHOLE_COUNT - 1].setWormhole(randomWormholeSystems[0]);
  }

  _setupEventsAndMercenaries() {
    // Setup special events and any hard-coded mercenaries

    let eventsToPlace = SSSTSpecialEventSpecifier.randomOccurrenceEventTypes();

    const kravat = this._findSolarSystem('Kravat');
    kravat.setSpecialEvent(SSSTSpecialEvent.WildGetsOut);

    this._findSolarSystem('Acamar').setSpecialEvent(SSSTSpecialEvent.MonsterKilled);
    this._findSolarSystem('Baratas').setSpecialEvent(SSSTSpecialEvent.FlyBaratas);
    this._findSolarSystem('Melina').setSpecialEvent(SSSTSpecialEvent.FlyMelina);
    this._findSolarSystem('Regulas').setSpecialEvent(SSSTSpecialEvent.FlyRegulas);
    this._findSolarSystem('Zalkon').setSpecialEvent(SSSTSpecialEvent.DragonflyDestroyed);
    this._findSolarSystem('Japori').setSpecialEvent(SSSTSpecialEvent.MedicineDelivery);
    this._findSolarSystem('Utopia').setSpecialEvent(SSSTSpecialEvent.MoonBought);
    this._findSolarSystem('Devidia').setSpecialEvent(SSSTSpecialEvent.JarekGetsOut);

    const SPECIAL_SQR_DISTANCE = 70*70
    const gemulon = this._findSolarSystem('Gemulon');
    gemulon.setSpecialEvent(SSSTSpecialEvent.GemulonRescued);
    let bestDistance = Infinity;
    let rescueSystem = null;
    // Perform search in reverse to prefer systems without wormholes
		const solarSystemsReversed = this.solarSystems.slice().reverse()
    solarSystemsReversed.forEach((other) => {
      if (other.getSpecialEvent() === SSSTSpecialEvent.None) {
        const distance = gemulon.squaredDistanceTo(other);
        if (distance >= SPECIAL_SQR_DISTANCE && distance < bestDistance) {
          rescueSystem = other;
          bestDistance = distance;
        }
      }
    });
    rescueSystem.setSpecialEvent(SSSTSpecialEvent.AlienInvasion);

    const daled = this._findSolarSystem('Daled');
    daled.setSpecialEvent(SSSTSpecialEvent.ExperimentStopped);
    bestDistance = Infinity;
    let experimentSystem = null;
    solarSystemsReversed.forEach((other) => {
      if (other.getSpecialEvent() === SSSTSpecialEvent.None) {
        const distance = daled.squaredDistanceTo(other);
        if (distance >= SPECIAL_SQR_DISTANCE && distance < bestDistance) {
          experimentSystem = other;
          bestDistance = distance;
        }
      }
    });
    experimentSystem.setSpecialEvent(SSSTSpecialEvent.Experiment);

    const nix = this._findSolarSystem('Nix');
    nix.setSpecialEvent(SSSTSpecialEvent.ReactorDelivered);
    bestDistance = Infinity;
    let getReactorSystem = null;
    solarSystemsReversed.forEach((other) => {
      if (other.getSpecialEvent() === SSSTSpecialEvent.None) {
        const distance = nix.squaredDistanceTo(other);
        if (distance >= SPECIAL_SQR_DISTANCE && distance < bestDistance) {
          getReactorSystem = other;
          bestDistance = distance;
        }
      }
    });
    getReactorSystem.setSpecialEvent(SSSTSpecialEvent.GetReactor);

    let wormholeSystemsSpecial = this.solarSystems.slice(0, WORMHOLE_COUNT);
    while (wormholeSystemsSpecial.length > 0) {
      const randomIndex = gameRand.randomIntBelow(wormholeSystemsSpecial.length);
      if (wormholeSystemsSpecial[randomIndex].getSpecialEvent() === SSSTSpecialEvent.None) {
        wormholeSystemsSpecial[randomIndex].setSpecialEvent(SSSTSpecialEvent.ScarabDestroyed);
        eventsToPlace.push(SSSTSpecialEvent.Scarab);
        break;
      }
      wormholeSystemsSpecial.splice(randomIndex, 1);
    }

		for (let highTech of solarSystemsReversed) {
      if (highTech.getSpecialEvent() === SSSTSpecialEvent.None && highTech.techLevel >= SSSTTechLevel.HighTech) {
        highTech.setSpecialEvent(SSSTSpecialEvent.ArtifactDelivered);
        eventsToPlace.push(SSSTSpecialEvent.AlienArtifact);
        break
      }
    }

		for (let eventSystem of solarSystemsReversed) {
      if (eventsToPlace.length === 0) {
				break
			}

      if (eventSystem.getSpecialEvent() === SSSTSpecialEvent.None) {
        eventSystem.setSpecialEvent(eventsToPlace[0]);
        eventsToPlace.shift();
      }
    }


    // Create and place randomized mercenaries
    for (let i = 0; i < MERCENARY_COUNT - 1; ++i) {
      let mercenarySystem = null;
      while (!mercenarySystem) {
        mercenarySystem = this.solarSystems[gameRand.randomIntBelow(this.solarSystems.length)];
        if (mercenarySystem.getMercenary()) mercenarySystem = null;
      }

      const mercenary = new SSSTCrewMember(SSSTCrewMember.mercenaryNames()[i]);
      mercenary.randomizeAttributes();
      mercenarySystem.setMercenary(mercenary);
    }
  }

  _setupCommander() {
    this.commander.credits = STARTING_CREDITS;

    let ship = new SSSTShip(SSSTShipModelType.Gnat, this.difficulty);
    this.commander.ship = ship;

    this.commander.setCurrentSystem(this.solarSystems[this.solarSystems.length - 1]);

    let squaredFuel = this.commander.ship.fuel;
    squaredFuel *= squaredFuel;

    for (let i = this.solarSystems.length - 1; i >= 0; i--) {
      let startSystem = this.solarSystems[i];
      if (
        startSystem.getSpecialEvent() === SSSTSpecialEvent.None &&
        startSystem.techLevel >= SSSTTechLevel.Agricultural &&
        startSystem.techLevel < SSSTTechLevel.PostIndustrial
      ) {
        let nearbyCount = 0;
        for (let j = 0; j < this.solarSystems.length; j++) {
          let nearbySystem = this.solarSystems[j];
          if (startSystem.squaredDistanceTo(nearbySystem) <= squaredFuel) {
            nearbyCount++;
            if (nearbyCount >= 3) {
              this.commander.getCurrentSystem().setVisited(false);
              this.commander.setCurrentSystem(startSystem);
              return;
            }
          }
        }
      }
    }
  }

  _setupInitialGameState() {
    for (let i = 0; i < SSSTRareEvent.Count; ++i) {
      this.addRemainingRareEvents([i]);
    }
    this.addRemainingRareEvents([
      SSSTRareEvent.BottleGood,
      SSSTRareEvent.BottleGood,
      SSSTRareEvent.BottleOld,
      SSSTRareEvent.BottleOld,
    ]); // Some extra skill enhancements

    this._warpSystem = this.commander.getCurrentSystem();
    this.remindLoans = true;
    this._monsterHull = SSSTShipModel.shipModelForType(SSSTShipModelType.SpaceMonster).hullStrength;

    if (this.difficulty < SSSTDifficulty.Normal) {
      if (this.commander.getCurrentSystem().getSpecialEvent() === SSSTSpecialEvent.None) {
        pLog.log(109)
        this.commander.getCurrentSystem().setSpecialEvent(SSSTSpecialEvent.LotteryWinner);
      }
    }
  }

  _findSolarSystem(name) {
    return SSSTSolarSystem.solarSystemForName(name, this.solarSystems);
  }

  solarSystemsWithinRange() {
    let result = [];
    let squaredFuel = this.commander.ship.fuel;
    squaredFuel *= squaredFuel;

    if (this.commander.getCurrentSystem().wormhole) {
      result.push(this.commander.getCurrentSystem().wormhole);
    }

    for (let i = 0; i < this.solarSystems.length; i++) {
      let nearbySystem = this.solarSystems[i];
      if (
        this.commander.getCurrentSystem() !== nearbySystem &&
        this.commander.getCurrentSystem().squaredDistanceTo(nearbySystem) <= squaredFuel
      ) {
        result.push(nearbySystem);
      }
    }

    MAUtils.ensureArrayOrNull(result, "object")

    return result;
  }

  systemClosestToXY(x, y) {
    let minDistance = Infinity;
    let closest = null;

    for (let i = 0; i < this.solarSystems.length; i++) {
      let nearbySystem = this.solarSystems[i];
      let distance = nearbySystem.squaredDistanceToXY(x, y);
      if (distance < minDistance) {
        closest = nearbySystem;
        minDistance = distance;
      }
    }
    return closest;
  }

	getBreakingNews() {
		return this._breakingNews
	}

  get breakingNews() {
    return this._breakingNews
  }

  addBreakingNewsItem(item) {
    if (!MAUtils.ensureType(item, "string")) { return }

    if (!this._breakingNews) {
      this._breakingNews = [];
    }
    this._breakingNews.push(item);
  }

  replaceNewsContainingString(needle, item) {
    if (!MAUtils.ensureType(needle, "string")) { return }
    if (!MAUtils.ensureType(item, "string")) { return }

    let index = this._breakingNews.findIndex((existingItem) => existingItem.includes(needle));
    if (index !== -1) {
      this._breakingNews.splice(index, 1);
    }
    this.addBreakingNewsItem(item);
  }

  clearBreakingNews() {
    this._breakingNews = null;
  }

  get remainingRareEvents() {
    return this._remainingRareEvents;
  }

  addRemainingRareEvents(rareEvents) {
    if (!MAUtils.ensureArrayOrNull(rareEvents, "number")) { return }

    if (!this._remainingRareEvents) {
      this._remainingRareEvents = [];
    }
    this._remainingRareEvents.push(...rareEvents);
  }

  removeRemainingRareEvent(rareEvent) {
    MAUtils.ensureInteger(rareEvent)

    let index = this._remainingRareEvents.indexOf(rareEvent);
    if (index !== -1) {
      this._remainingRareEvents.splice(index, 1);
    }
  }

  handleArrival() {
    this.commander.travelClicksRemaining = 0;
    this.updateInventories();
    this.shuffleStatus();
    this.alreadyPaidForNewspaper = false;
  }

  timePassed(days) {
    MAUtils.ensureInteger(days)

    this.commander.timePassed(days);

    if (
      this.invasionStatus >= SSSTInvasionQuestStatus.DaysUntilInvasion._7 &&
      this.invasionStatus <= SSSTInvasionQuestStatus.DaysUntilInvasion._1
    ) {
      this.invasionStatus = Math.min(SSSTInvasionQuestStatus.ClosedTooLate, this.invasionStatus + days);
      if (this.invasionStatus === SSSTInvasionQuestStatus.ClosedTooLate) {
        let gemulon = this._findSolarSystem('Gemulon');
        gemulon.setSpecialEvent(SSSTSpecialEvent.GemulonInvaded);
        gemulon.techLevel = SSSTTechLevel.PreAgricultural
        gemulon.politics = SSSTPolitics.politicsForType(SSSTPoliticsType.Anarchy)
        gemulon.updateInventories();
        pLog.log(134)
      }
    }

    if (this.reactorStatus > SSSTReactorQuestStatus.Open && this.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate) {
      this.reactorStatus = Math.min(SSSTReactorQuestStatus.DaysRemaining._1, this.reactorStatus + days);

      let currentQuantity = this.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor);
      let desiredQuantity = REACTOR_BAY_COUNT + REACTOR_MAX_FUEL - Math.floor((this.reactorStatus - 1) / 2);
      if (desiredQuantity < currentQuantity) {
        this.commander.ship.soldQuantity(currentQuantity - desiredQuantity, SSSTTradeItemType.FakeQuestCargoReactor);
      }
    }

    if (
      this.experimentStatus >= SSSTExperimentQuestStatus.DaysRemaining._10 &&
      this.experimentStatus <= SSSTExperimentQuestStatus.DaysRemaining._1
    ) {
      this.experimentStatus = Math.min(SSSTExperimentQuestStatus.ClosedTooLate, this.experimentStatus + days);
      if (this.experimentStatus === SSSTExperimentQuestStatus.ClosedTooLate) {
        this.fabricRipProbability = FABRIC_RIP_PROBABILITY_INITIAL;

        let daled = this._findSolarSystem('Daled');
        daled.setSpecialEvent(SSSTSpecialEvent.ExperimentNotStopped);
        this.addBreakingNewsItem('Travelers Report Timespace Damage, Warp Problems!');
        pLog.log(145)
      }
    } else if (this.experimentStatus === SSSTExperimentQuestStatus.ClosedTooLate && this.fabricRipProbability > 0) {
      this.fabricRipProbability -= Math.min(this.fabricRipProbability, days);
      MAUtils.ensureInteger(this.fabricRipProbability)
      pLog.log(146)
    }
  }

  get monsterHull() {
    return this._monsterHull
  }

  set monsterHull(m) {
    if (MAUtils.ensureInteger(m)) {
      this._monsterHull = m
    }
  }

  healMonster() {
    this._monsterHull = Math.min(
      SSSTShipModel.shipModelForType(SSSTShipModelType.SpaceMonster).hullStrength,
      Math.floor((this._monsterHull * 105) / 100)
    );
    MAUtils.ensureInteger(this._monsterHull)
    pLog.log(142)
  }

  shuffleStatus() {
    this.solarSystems.forEach((solarSystem) => solarSystem.randomizeStatus());
  }

  updateInventories() {
    this.solarSystems.forEach((solarSystem) => solarSystem.updateInventories());
  }

  specialCargoDescription() {
    let cargoList = '';
    let comma = '';

    const numTribbles = this.commander.ship.tribbles;
    if (numTribbles > 0) {
      cargoList += comma;
      if (numTribbles >= MAX_TRIBBLES) {
        cargoList += 'An infestation of tribbles.';
      } else {
        cargoList += `${numTribbles} cute, furry tribble${numTribbles === 1 ? '' : 's'}.`;
      }
      comma = '\n';
    }

    if (this.japoriQuestStatus === SSSTJaporiQuestStatus.HasMedicine) {
      cargoList += comma;
      cargoList += '10 bays of antidote.';
      comma = '\n';
    }

    if (this.commander.artifactOnBoard) {
      cargoList += comma;
      cargoList += 'An alien artifact.';
      comma = '\n';
    }

    if (this.reactorStatus > SSSTReactorQuestStatus.Open && this.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate) {
      cargoList += comma;
      let numFuelBays = Math.max(0, this.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor) - REACTOR_BAY_COUNT);
      cargoList += `An unstable reactor taking up 5 bays.\nEnriched reactor fuel taking up ${numFuelBays} bay${numFuelBays === 1 ? '' : 's'}.`;
      comma = '\n';
    }

    if (this.commander.carriesMaxTraderBoost) {
      cargoList += `${comma}A haggling computer.`;
      comma = '\n';
    }

    if (this.canSuperWarp) {
      cargoList += `${comma}A Portable Singularity.`;
      comma = '\n';
    }

    if (cargoList.length === 0) {
      cargoList = 'No special items.';
    }

    return cargoList
  }

  questListDescription() {
    let questList = ''
		let comma = '';
    const numTribbles = this.commander.ship.tribbles;

		if (numTribbles > 0) {
      pLog.log(76)
			questList += `${comma}Get rid of those pesky tribbles.`;
			comma = '\n';
		}

		if (this.commander.artifactOnBoard) {
      pLog.log(77)
			questList += `${comma}Deliver the alien artifact to Professor Berger at some hi-tech system.`;
			comma = '\n';
		}

		if (SSSTSolarSystem.solarSystemForName("Nix", this.solarSystems).getSpecialEvent() === SSSTSpecialEvent.GetSpecialLaser) {
      pLog.log(78)
			questList += `${comma}Get your special laser at Nix.`;
			comma = '\n';
		}

    if (this.scarabStatus === SSSTScarabQuestStatus.ScarabDestroyed) {
      const hullSystems = this.solarSystems.filter(x => x.specialEvent === SSSTSpecialEvent.GetHullUpgraded)
      const hullSystem = hullSystems.length > 0 ? hullSystems[0] : null
			questList += `${comma}Get your hull upgraded at ${hullSystem ? hullSystem.name : ""}.`;
			comma = '\n';
      pLog.log(170)
    }

		if (this.japoriQuestStatus === SSSTJaporiQuestStatus.HasMedicine) {
      pLog.log(79)
			questList += `${comma}Deliver antidote to Japori.`;
			comma = '\n';
		}

		if (this.scarabStatus === SSSTScarabQuestStatus.ScarabExists) {
      pLog.log(80)
			questList += `${comma}Find and destroy the Scarab (which is hiding near a wormhole).`;
			comma = '\n';
		}

		if (this.monsterStatus === SSSTMonsterQuestStatus.MonsterExists) {
      pLog.log(81)
			questList += `${comma}Kill the space monster at Acamar.`;
			comma = '\n';
		}

		let dragonflyStatus = this.dragonflyStatus;
		if (dragonflyStatus > SSSTDragonflyQuestStatus.Open && dragonflyStatus !== SSSTDragonflyQuestStatus.ClosedDragonflyDestroyed) {
			let nextSystem = (dragonflyStatus === SSSTDragonflyQuestStatus.GoToBaratas ? "Baratas" :
				dragonflyStatus === SSSTDragonflyQuestStatus.GoToMelina ? "Melina" :
				dragonflyStatus === SSSTDragonflyQuestStatus.GoToRegulas ? "Regulas" :
				"Zalkon");
      pLog.log(82)
			questList += `${comma}Follow the Dragonfly to ${nextSystem}.`;
			comma = '\n';
		} else if (SSSTSolarSystem.solarSystemForName("Zalkon", this.solarSystems).getSpecialEvent() === SSSTSpecialEvent.InstallLightningShield) {
      pLog.log(83)
			questList += `${comma}Get your Lightning shield at Zalkon.`;
			comma = '\n';
		}

		if (this.invasionStatus >= SSSTInvasionQuestStatus.DaysUntilInvasion._7 && this.invasionStatus <= SSSTInvasionQuestStatus.DaysUntilInvasion._1) {
			let whenString =
				(this.invasionStatus === SSSTInvasionQuestStatus.DaysUntilInvasion._2) ? "by end of tomorrow" :
				(this.invasionStatus === SSSTInvasionQuestStatus.DaysUntilInvasion._1) ? "today" :
				`within ${SSSTInvasionQuestStatus.ClosedTooLate - this.invasionStatus} days`;
      pLog.log(84)
			questList += `${comma}Inform Gemulon about alien invasion ${whenString}.`;
			comma = '\n';
		} else if (this.invasionStatus === SSSTInvasionQuestStatus.ClosedSaved) {
      pLog.log(85)
			questList += `${comma}Get your fuel compactor at Gemulon.`;
			comma = '\n';
		}

		if (this.experimentStatus >= SSSTExperimentQuestStatus.DaysRemaining._10 && this.experimentStatus <= SSSTExperimentQuestStatus.DaysRemaining._1) {
      pLog.log(86)
			let whenString =
				(this.experimentStatus === SSSTExperimentQuestStatus.DaysRemaining._2) ? "by end of tomorrow" :
				(this.experimentStatus === SSSTExperimentQuestStatus.DaysRemaining._1) ? "today" :
				`within ${SSSTExperimentQuestStatus.ClosedTooLate - this.experimentStatus} days`;
			questList += `${comma}Stop Dr. Fehler's experiment at Daled ${whenString}.`;
			comma = '\n';
		}

		if (this.reactorStatus > SSSTReactorQuestStatus.Open && this.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate) {
			questList += `${comma}Deliver the unstable reactor to Nix `;
			if (this.reactorStatus <= SSSTReactorQuestStatus.DaysRemaining._20) {
        pLog.log(87)
				questList += 'for Henry Morgan.';
			} else {
        pLog.log(88)
				questList += 'before it consumes all of its fuel.';
			}
			comma = '\n';
		}

		if (this.jarekStatus === SSSTJarekQuestStatus.OnBoard) {
      pLog.log(89)
			questList += `${comma}Bring Ambassador Jarek to Devidia.`;
			comma = '\n';
		}

		if (this.wildStatus === SSSTWildQuestStatus.OnBoard) {
      pLog.log(90)
			questList += `${comma}Smuggle Jonathan Wild to Kravat.`;
			comma = '\n';
		}

		if (this.commander.boughtMoon) {
      pLog.log(91)
			questList += `${comma}Claim your moon in Utopia.`;
			comma = '\n';
		}

		if (questList.length === 0) {
      pLog.log(92)
			questList = 'No open quests.';
		}

    return questList
  }

}
