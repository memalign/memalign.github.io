const TRAVEL_PROGRESS_DURATION = 0.2;
const CHANCE_OF_TRADE_IN_ORBIT = 100;

class SSSTTravelViewController {
  constructor(div, game, origin, destination, wasVisited) {
    this.div = div
    this._game = game
    this._origin = origin
    this._destination = destination
    this._destWasVisited = wasVisited
    this._startClicksRemaining = this._game.commander.travelClicksRemaining

    this._startedEncounters = false
    this._needPostMarieCustomsPolice = false

    this._encounterController = null
    this._encounterViewController = null
  }

	set delegate(d) {
		this._delegate = d
	}

  presentView() {
    const containerDiv = this.div
    containerDiv.innerHTML = ''

    const travelProgressViewDiv = document.createElement('div');
		travelProgressViewDiv.id = 'travelProgressView'
    containerDiv.appendChild(travelProgressViewDiv);
    this._progressView = new SSSTTravelProgressView(travelProgressViewDiv, this._game, this._origin, this._destination, this._destWasVisited)

    const encounterDiv = document.createElement('div');
    encounterDiv.id = "encounterDiv";
    containerDiv.appendChild(encounterDiv);

    if (!this._encounterViewController) {
      this._encounterViewController = new SSSTEncounterViewController(encounterDiv, this._game)
      this._encounterViewController.delegate = this
    }

    this._encounterViewController.presentView()


    if (!this._startedEncounters) {
      this._startedEncounters = true
      this._processEncounters()
    }
  }


  _processEncounters() {
    let eventLoopInitialClicks = this._game.commander.travelClicksRemaining;
    let currentClicks = eventLoopInitialClicks;

    currentClicks = Math.max(currentClicks - 1, 0);
    if (currentClicks <= 0) {
      this._game.commander.travelClicksRemaining = currentClicks;
      this._progressView.setProgress(1 - (currentClicks * 1.0 / this._startClicksRemaining));
    }

    while (currentClicks > 0) {
      let encounterType = SSSTEncounterType.None;

      this._game.commander.travelClicksRemaining = currentClicks;
      this._progressView.setProgress(1 - (currentClicks * 1.0 / this._startClicksRemaining));

      // Automatic repairs based on engineering skill
      let engineerSkill = this._game.commander.ship.crewEngineerSkillIncludingCommander(this._game.commander);
      let repairAmount = gameRand.randomIntBelow(engineerSkill / 2);

      repairAmount = this._game.commander.ship.repairHullByAmount(repairAmount);
      this._game.commander.ship.rechargeShieldPowerByAmount(2 * repairAmount); // Shields are easier to recharge

      let opponentType = SSSTOpponentType.Count;

      if (currentClicks === 1 && this._needPostMarieCustomsPolice) {
        opponentType = SSSTOpponentType.Police;
      } else if (currentClicks === 1 && this._destination.name === "Acamar" && this._game.monsterStatus === SSSTMonsterQuestStatus.MonsterExists) {
        opponentType = SSSTOpponentType.Monster;
      } else if (currentClicks === 1 && this._destination.name === "Zalkon" && this._game.dragonflyStatus === SSSTDragonflyQuestStatus.GoToZalkon) {
        opponentType = SSSTOpponentType.Dragonfly;
      } else if (currentClicks === 20 && this._destination.specialEvent === SSSTSpecialEvent.ScarabDestroyed && this._game.scarabStatus === SSSTScarabQuestStatus.ScarabExists && this._game.commander.arrivedViaWormhole) {
        opponentType = SSSTOpponentType.Scarab;
        pLog.log(169)
      } else if (this._destination.name === "Gemulon" && this._game.invasionStatus === SSSTInvasionQuestStatus.ClosedTooLate) {
        if (gameRand.randomIntBelow(10) > 4) {
          opponentType = SSSTOpponentType.Mantis;
        }
      } else {
        let encounterTest = gameRand.randomIntBelow((44 - (2 * this._game.difficulty)));

        // Fleas have half as many encounters
        if (this._game.commander.ship.type === SSSTShipModelType.Flea) {
          encounterTest *= 2;
        }

        MAUtils.ensureInteger(encounterTest)

        if (encounterTest < this._destination.politics.occurrencePirates && !this._game.commander.raided) {
          opponentType = SSSTOpponentType.Pirate;
        } else if (encounterTest < this._destination.politics.occurrencePirates +
          this._destination.politics.occurrencePolice * POLICE_RECORD_MULTIPLIER(this._game.commander.policeRecordScore)) {
          opponentType = SSSTOpponentType.Police;
        } else if (encounterTest < this._destination.politics.occurrencePirates +
          this._destination.politics.occurrencePolice * POLICE_RECORD_MULTIPLIER(this._game.commander.policeRecordScore) +
          this._destination.politics.occurrenceTraders) {
          opponentType = SSSTOpponentType.Trader;
        } else {
          // Welcome to Kravat, outlaw!
          if (this._game.wildStatus === SSSTWildQuestStatus.OnBoard && this._destination.name === "Kravat") {
            let diceRoll = gameRand.randomIntBelow(100);
            if ((this._game.difficulty <= SSSTDifficulty.Easy && diceRoll < 25) ||
              (this._game.difficulty === SSSTDifficulty.Normal && diceRoll < 33) ||
              (this._game.difficulty > SSSTDifficulty.Normal && diceRoll < 50)) {
              pLog.log(125)
              opponentType = SSSTOpponentType.Police;
            }
          }
        }

        MAUtils.ensureInteger(opponentType)

        if (opponentType >= SSSTOpponentType.Count) {
          if (this._game.commander.artifactOnBoard && gameRand.randomIntBelow(20) <= 3) {
            opponentType = SSSTOpponentType.Mantis;
          }
        }
      }

      let opponent = null;

      if (opponentType === SSSTOpponentType.Police) {
        opponent = SSSTOpponent.generateOpponentWithType(opponentType, this._game);

        if (currentClicks === 1 && this._needPostMarieCustomsPolice) {
          encounterType = SSSTEncounterType.PostMarieCelestePoliceEncounter;
          this._needPostMarieCustomsPolice = false;
        } else {
          encounterType = SSSTEncounterType.PoliceIgnore;
          let policeHaveWeapons = opponent.ship.weapons.length > 0;

          if (this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(this._game.commander, opponent)) {
            encounterType = SSSTEncounterType.PoliceIgnore;
          } else if (this._game.commander.policeRecordScore < SSSTPoliceRecordScore.Dubious) {
            // If you're a criminal, the police will try to attack
            if (!policeHaveWeapons) {
              if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)) {
                encounterType = SSSTEncounterType.PoliceIgnore;
              } else {
                encounterType = SSSTEncounterType.PoliceFlee;
              }
            } else if (this._game.commander.reputationScore < SSSTReputationScore.Average) {
              encounterType = SSSTEncounterType.PoliceAttack;
            } else if (gameRand.randomIntBelow(SSSTReputationScore.Elite) > Math.floor((this._game.commander.reputationScore / (1 + opponent.ship.type)))) {
              encounterType = SSSTEncounterType.PoliceAttack;
            } else if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)) {
              encounterType = SSSTEncounterType.PoliceIgnore;
            } else {
              encounterType = SSSTEncounterType.PoliceFlee;
            }
          } else if (this._game.commander.policeRecordScore >= SSSTPoliceRecordScore.Dubious && this._game.commander.policeRecordScore < SSSTPoliceRecordScore.Clean && !this._game.commander.inspected) {
            // If your reputation is dubious, the police will inspect you
            encounterType = SSSTEncounterType.PoliceInspection;
            this._game.commander.inspected = true;
          } else if (this._game.commander.policeRecordScore < SSSTPoliceRecordScore.Lawful) {
            // Clean record, infrequent inspections
            if (gameRand.randomIntBelow((12 - this._game.difficulty)) < 1 && !this._game.commander.inspected) {
              encounterType = SSSTEncounterType.PoliceInspection;
              this._game.commander.inspected = true;
            }
          } else {
            // Lawful trader, very infrequent inspections
            if (gameRand.randomIntBelow(40) === 1 && !this._game.commander.inspected) {
              encounterType = SSSTEncounterType.PoliceInspection;
              this._game.commander.inspected = true;
            }
          }

          // Police aren't intimidated if your ship is weaker
          if (encounterType === SSSTEncounterType.PoliceFlee && opponent.ship.type > this._game.commander.ship.type) {
            if (policeHaveWeapons && this._game.commander.policeRecordScore < SSSTPoliceRecordScore.Dubious) {
              encounterType = SSSTEncounterType.PoliceAttack;
            } else {
              encounterType = SSSTEncounterType.PoliceInspection;
            }
          }

          let noConfrontation = (encounterType === SSSTEncounterType.PoliceFlee || encounterType === SSSTEncounterType.PoliceIgnore);

          if (noConfrontation && opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)) {
            encounterType = SSSTEncounterType.None;
          } else if (noConfrontation && this._game.alwaysIgnorePolice) {
            encounterType = SSSTEncounterType.None;
          }
        }
      } else if (opponentType === SSSTOpponentType.Pirate || opponentType === SSSTOpponentType.Mantis) {
        opponent = SSSTOpponent.generateOpponentWithType(opponentType, this._game);

        if (opponentType === SSSTOpponentType.Mantis) {
          encounterType = SSSTEncounterType.PirateAttack;
        } else if (this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(this._game.commander, opponent)) {
          encounterType = SSSTEncounterType.PirateIgnore;
        } else if (opponent.ship.type >= SSSTShipModelType.Grasshopper ||
          opponent.ship.type > this._game.commander.ship.type ||
          gameRand.randomIntBelow(SSSTReputationScore.Elite) > Math.floor(this._game.commander.reputationScore * 4 / (1 + opponent.ship.type))) {
          // Pirates mostly attack but will flee if commander's reputation is too high
          encounterType = SSSTEncounterType.PirateAttack;
        } else {
          encounterType = SSSTEncounterType.PirateFlee;
        }

        let noConfrontation = (encounterType === SSSTEncounterType.PirateFlee || encounterType === SSSTEncounterType.PirateIgnore);

        // If this isn't a confrontation and we can't see the pirate, skip the encounter
        if (noConfrontation && opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)) {
          encounterType = SSSTEncounterType.None;
        } else if (noConfrontation && this._game.alwaysIgnorePirates) {
          encounterType = SSSTEncounterType.None;
        }
      } else if (opponentType === SSSTOpponentType.Trader) {
        opponent = SSSTOpponent.generateOpponentWithType(opponentType, this._game);
        encounterType = SSSTEncounterType.TraderIgnore;

        if (this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(this._game.commander, opponent)) {
          encounterType = SSSTEncounterType.TraderIgnore;
        } else if (this._game.commander.policeRecordScore <= SSSTPoliceRecordScore.Criminal) {
          // Traders flee from sketchy commanders
          if (gameRand.randomIntBelow(SSSTReputationScore.Elite) <= Math.floor(this._game.commander.reputationScore * 10 / (1 + opponent.ship.type))) {
            if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)) {
              encounterType = SSSTEncounterType.TraderIgnore;
            } else {
              encounterType = SSSTEncounterType.TraderFlee;
            }
          }
        }

        if (
          encounterType === SSSTEncounterType.TraderIgnore &&
          gameRand.randomIntBelow(1000) < CHANCE_OF_TRADE_IN_ORBIT
        ) {
          if (
            this._game.commander.ship.freeCargoBays() > 0 &&
            opponent.ship.hasTradeableItemsForSystem(
              this._game.commander.currentSystem,
              this._game.commander.policeRecordScore <
              SSSTPoliceRecordScore.Dubious
            )
          ) {
            encounterType = SSSTEncounterType.TraderSell;
          } else if (
            this._game.commander.ship.hasTradeableItemsForSystem(
              this._game.commander.currentSystem,
              this._game.commander.policeRecordScore <
              SSSTPoliceRecordScore.Dubious
            )
          ) {
            encounterType = SSSTEncounterType.TraderBuy;
          }
        }

        let noTrade =
          encounterType === SSSTEncounterType.TraderFlee ||
          encounterType === SSSTEncounterType.TraderIgnore;

        if (opponent.ship.shipOwnedByCommanderIsCloakedToOpponent(opponent, this._game.commander)) {
          encounterType = SSSTEncounterType.None;
        } else if (noTrade && this._game.alwaysIgnoreTraders) {
          encounterType = SSSTEncounterType.None;
        } else if (this._game.alwaysIgnoreTradeInOrbit) {
          encounterType = SSSTEncounterType.None;
        }
      } else if (opponentType === SSSTOpponentType.Scarab) {
        opponent = SSSTOpponent.generateOpponentWithType(opponentType, this._game);
        encounterType = SSSTEncounterType.ScarabAttack;

        if (this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(this._game.commander, opponent)) {
          encounterType = SSSTEncounterType.ScarabIgnore;
        }
      } else if (opponentType === SSSTOpponentType.Dragonfly) {
        opponent = SSSTOpponent.generateOpponentWithType(opponentType, this._game);
        encounterType = SSSTEncounterType.DragonflyAttack;

        if (this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(this._game.commander, opponent)) {
          encounterType = SSSTEncounterType.DragonflyIgnore;
        }
      } else if (opponentType === SSSTOpponentType.Monster) {
        opponent = SSSTOpponent.generateOpponentWithType(opponentType, this._game);
        encounterType = SSSTEncounterType.MonsterAttack;

        if (this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(this._game.commander, opponent)) {
          encounterType = SSSTEncounterType.MonsterIgnore;
        }
      } else {
        // Very Rare Random Events:
        // 1. Encounter the abandoned Marie Celeste, which you may loot.
        // 2. Captain Ahab will trade your Reflective Shield for skill points in Piloting.
        // 3. Captain Conrad will trade your Military Laser for skill points in Engineering.
        // 4. Captain Huie will trade your Military Laser for points in Trading.
        // 5. Encounter an expired bottle of Captain Marmoset's Skill Tonic. This will affect skills depending on game difficulty level.
        // 6. Encounter a good bottle of Captain Marmoset's Skill Tonic, which will improve a random skill one or two times, depending on difficulty.

        if (this._game.forceRareEvent || // testing hook
            (this._game.commander.days > 10 && gameRand.randomIntBelow(1000) < 5)) {
          const rareEvents = this._game.remainingRareEvents;
          MAUtils.ensureArrayOrNull(rareEvents, "number")

          const index =
            rareEvents.length > 0
            ? gameRand.randomIntBelow(rareEvents.length)
            : -1;
          const rareEvent =
            index !== -1 ? rareEvents[index] : SSSTRareEvent.Count;

          MAUtils.ensureInteger(rareEvent)

          switch (rareEvent) {
            case SSSTRareEvent.CaptainAhab:
              if (
                this._game.commander.ship.hasShieldOfType(
                  SSSTAccessoryType.ShieldReflective
                ) &&
                this._game.commander.pilot < MAX_SKILL_LEVEL &&
                this._game.commander.policeRecordScore >
                SSSTPoliceRecordScore.Criminal
              ) {
                pLog.log(95)
                encounterType = SSSTEncounterType.FamousCaptainAhabEncounter;
                opponent = SSSTOpponent.generateOpponentWithType(
                  SSSTOpponentType.FamousCaptain,
                  this._game
                );
              }
              break;

            case SSSTRareEvent.CaptainConrad:
              if (
                this._game.commander.ship.hasWeaponOfType(
                  SSSTAccessoryType.WeaponMilitaryLaser
                ) &&
                this._game.commander.engineer < MAX_SKILL_LEVEL &&
                this._game.commander.policeRecordScore >
                SSSTPoliceRecordScore.Criminal
              ) {
                pLog.log(96)
                encounterType =
                  SSSTEncounterType.FamousCaptainConradEncounter;
                opponent = SSSTOpponent.generateOpponentWithType(
                  SSSTOpponentType.FamousCaptain,
                  this._game
                );
              }
              break;

            case SSSTRareEvent.CaptainHuie:
              if (
                this._game.commander.ship.hasWeaponOfType(
                  SSSTAccessoryType.WeaponMilitaryLaser
                ) &&
                this._game.commander.trader < MAX_SKILL_LEVEL &&
                this._game.commander.policeRecordScore >
                SSSTPoliceRecordScore.Criminal
              ) {
                pLog.log(97)
                encounterType = SSSTEncounterType.FamousCaptainHuieEncounter;
                opponent = SSSTOpponent.generateOpponentWithType(
                  SSSTOpponentType.FamousCaptain,
                  this._game
                );
              }
              break;

            case SSSTRareEvent.MarieCeleste:
              pLog.log(98)
              encounterType = SSSTEncounterType.MarieCelesteEncounter;
              opponent = SSSTOpponent.generateOpponentWithType(
                SSSTOpponentType.MarieCeleste,
                this._game
              );
              break;

            case SSSTRareEvent.BottleOld:
              pLog.log(99)
              encounterType = SSSTEncounterType.BottleOld;
              opponent = SSSTOpponent.generateOpponentWithType(
                SSSTOpponentType.Bottle,
                this._game
              );
              break;

            case SSSTRareEvent.BottleGood:
              pLog.log(100)
              encounterType = SSSTEncounterType.BottleGood
              opponent = SSSTOpponent.generateOpponentWithType(
                SSSTOpponentType.Bottle,
                this._game
              );
              break;

            default:
              break;
          }

          if (encounterType !== SSSTEncounterType.None) {
            this._game.removeRemainingRareEvent(rareEvent);
          }
        }
      }

      if (encounterType !== SSSTEncounterType.None && opponent) {
        const encounterController = new SSSTEncounterController(
          encounterType,
          this._game,
          opponent
        );
        this.setEncounterController(encounterController)
        return;
      }

      currentClicks--;
    }

    this._game.handleArrival();

    this._progressView.setProgress(1);
    this.setEncounterController(null)


    const alertStrings = [];

    alertStrings.push(
      eventLoopInitialClicks >= this._startClicksRemaining
      ? "After an uneventful trip, you arrive at your destination."
      : "You arrive at your destination."
    );

    if (this._game.commander.debt >= 75000) {
      alertStrings.push(
        "Your debt is getting too large. Reduce it quickly or your ship will be put on a chain!"
      );
    } else if (
      this._game.commander.debt > 0 &&
      this._game.remindLoans &&
      this._game.commander.days % 5 === 0
    ) {
      alertStrings.push(
        `You have a debt of $${this._game.commander.debt}.`
      );
    }

    switch (this._game.reactorStatus) {
      case 2:
        alertStrings.push(
          "The reactor was unstable to begin with. Now, it seems that it's rapidly consuming fuel -- half a bay in just one day! It is not clear what will happen if it runs out but you have no reason to suspect it will be anything good."
        );
        pLog.log(152)
        break;
      case 16:
        alertStrings.push(
          "The Ion Reactor is emitting a shrill whine, and it's shaking. The display indicates that it is suffering from fuel starvation."
        );
        pLog.log(153)
        break;
      case 18:
        alertStrings.push(
          "The Ion Reactor is smoking and making loud noises. The display warns that the core is close to the melting temperature."
        );
        pLog.log(154)
        break;
      case SSSTReactorQuestStatus.DaysRemaining._1:
        this._game.reactorStatus = SSSTReactorQuestStatus.ClosedTooLate;

        let alerts = [];

        alerts.push("Just as you approach the docking bay, the reactor explodes into a huge radioactive fireball!");
        if (!this._game.commander.hasEscapePod) {
          alerts.push("You are destroyed along with your ship as a result of the explosion.");
        }

        this._promptForStrings(alerts, () => {
          if (this._game.commander.hasEscapePod) {
            this._performPodEscape();
            pLog.log(155)
          } else {
            this._delegate.travelViewControllerGameDidEndWithStatus(this, SSSTGameEndStatus.Killed);
            pLog.log(156)
          }
        });

        return;

    }

    let foodOnBoard = false;
    let currentTribbles = this._game.commander.ship.tribbles;
    MAUtils.ensureInteger(currentTribbles)

    let previousTribbles = currentTribbles;
    let reactorStatus = (this._game.reactorStatus > SSSTReactorQuestStatus.Open && this._game.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate);

    if (currentTribbles > 0 && reactorStatus) {
      currentTribbles = Math.floor(currentTribbles / 2);
      if (currentTribbles < 10) {
        currentTribbles = 0;
        alertStrings.push("The radiation from the Ion Reactor is deadly to Tribbles. All of the Tribbles on board your ship have died.");
      } else {
        alertStrings.push("The radiation from the Ion Reactor seems to be deadly to Tribbles. Half the Tribbles on board died.");
      }
      pLog.log(157)
    } else if (currentTribbles > 0 && this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics) > 0) {
      currentTribbles += 1 + gameRand.randomIntBelow(3);
      let amountNarcotics = this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics);
      let consumedNarcotics = Math.min(1 + gameRand.randomIntBelow(3), amountNarcotics);
      this._game.commander.ship.soldQuantity(consumedNarcotics, SSSTTradeItemType.Narcotics);
      this._game.commander.ship.boughtQuantity(consumedNarcotics, SSSTTradeItemType.Furs, 0);
      alertStrings.push("You find that, instead of narcotics, some of your cargo bays contain only dead tribbles!");
      pLog.log(158)
    } else if (currentTribbles > 0 && this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Food) > 0) {
      let amountFood = this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Food);
      currentTribbles += 100 + gameRand.randomIntBelow((amountFood * 100));
      let foodConsumed = gameRand.randomIntBelow(amountFood);
      this._game.commander.ship.soldQuantity(foodConsumed, SSSTTradeItemType.Food);
      foodOnBoard = true;
      alertStrings.push("You find that, instead of food, some of your cargo bays contain only tribbles!");
      pLog.log(159)
    }

    if (currentTribbles > 0 && currentTribbles < MAX_TRIBBLES) {
      currentTribbles += 1 + gameRand.randomIntBelow(Math.max(1, currentTribbles / (foodOnBoard ? 1 : 2)));
    }

    currentTribbles = Math.min(currentTribbles, MAX_TRIBBLES);
    MAUtils.ensureInteger(currentTribbles)
    this._game.commander.ship.tribbles = currentTribbles;

    if ((previousTribbles < 100 && currentTribbles >= 100) ||
      (previousTribbles < 1000 && currentTribbles >= 1000) ||
      (previousTribbles < 10000 && currentTribbles >= 10000) ||
      (previousTribbles < 50000 && currentTribbles >= 50000)) {
      alertStrings.push(`Excuse me, but do you realize you have ${currentTribbles >= MAX_TRIBBLES ? "a dangerous number of" : currentTribbles} tribbles on board your ship?`);
    }

    this._game.tribbleMessage = false;

    let engineerSkill = this._game.commander.ship.crewEngineerSkillIncludingCommander(this._game.commander);
    let repairAmount = gameRand.randomIntBelow(engineerSkill);
    this._game.commander.ship.repairHullByAmount(repairAmount);

    let failString = "";
    if (this._game.autoFuel) {
      pLog.log(37)
      this._game.commander.attemptPurchaseOfFuel(this._game.commander.ship.fuelTankCapacity());
      if (this._game.commander.ship.fuelTankCapacity() !== this._game.commander.ship.fuel) {
        failString += "full tanks";
      }
    }

    if (this._game.autoRepairs) {
      pLog.log(38)
      this._game.commander.attemptPurchaseOfRepairs(this._game.commander.ship.maximumHullStrength());
      if (this._game.commander.ship.maximumHullStrength() !== this._game.commander.ship.hull) {
        failString += `${failString.length > 0 ? " or " : ""}full hull repairs`;
      }
    }

		console.log("Calling promptForStrings: " + alertStrings);
    this._promptForStrings(alertStrings, () => {
      this._delegate.travelViewControllerDidComplete(this);

      if (failString.length > 0) {
        let aC = new SSSTAlertViewController(`You don't have enough money to buy ${failString}.`)

        aC.addAction("Darn", SSSTAlertActionType.Default, null)

        aC.presentView()
      }
    });
  }

	_promptForStrings(alertStrings, completion) {
		let firstString = alertStrings.length > 0 ? alertStrings[0] : null;

		if (firstString) {
			alertStrings.shift();  // Removes the first element from the array

			console.log("Prompt with alert string: " + firstString);

      let aC = new SSSTAlertViewController(firstString)
      aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
				this._promptForStrings(alertStrings, completion);
			})

      aC.presentView()
		} else {
			completion();  // Call the completion handler when the array is empty
		}
	}

  setEncounterController(eC) {
    if (eC !== this._encounterController) {
      if (this._encounterController) {
        this._encounterController.invalidate()
      }

      this._encounterController = eC
      if (this._encounterController) {
        this._encounterController.delegate = this
      }
    }


    this._refreshEncounterText()
    this._refreshEncounterButtons()
    if (this._encounterViewController) {
      this._encounterViewController.updateAnimated(false)
    }
  }

  _refreshEncounterText() {
    if (this._encounterViewController) {
      const newText = this._encounterController ? this._encounterController.encounterText() : null
      this._encounterViewController.setText(newText)
    }
  }

  _refreshEncounterButtons() {
    if (this._encounterViewController) {
      const newButtons = this._encounterController ? this._encounterController.encounterButtons() : null
      this._encounterViewController.setButtonTitles(newButtons)
    }
  }

// SSSTEncounterViewController delegate
  encounterViewControllerOpponent(encounterVC) {
    if (this._encounterController) {
      return this._encounterController.opponent
    }

    return null
  }

  encounterViewControllerDidSelectAction(eVC, action) {
    this._encounterController.performAction(action)
  }


// SSSTEncounterController delegate

  encounterControllerDidPlunder(controller, didPlunder) {
    if (controller.type === SSSTEncounterType.MarieCelesteEncounter && didPlunder) {
      this._needPostMarieCustomsPolice = true
    }
  }

  encounterControllerEncounterContinues(controller, encounterContinues) {
    if (encounterContinues) {
      this._encounterViewController.updateHPViewsAnimated(true)
      this._refreshEncounterText()
      this._refreshEncounterButtons()
    } else {
      this.setEncounterController(null)
      this._processEncounters()
    }
  }

  encounterControllerHasUpdatedHP(c) {
    this._encounterViewController.updateHPViewsAnimated(true)
  }

  encounterControllerHasUpdatedButtons(c) {
    this._refreshEncounterButtons()
  }

  encounterControllerDidCompleteWithArrest(ec) {
    this.setEncounterController(null)
    this._delegate.travelViewControllerDidComplete(this);
  }

  encounterControllerDidCompleteWithDestruction(ec) {
    this.setEncounterController(null)

    if (this._game.commander.hasEscapePod) {
      pLog.log(29)
      this._performPodEscape();
    } else {
      pLog.log(30)
      this._delegate.travelViewControllerGameDidEndWithStatus(this, SSSTGameEndStatus.Killed);
    }
  }

  _performPodEscape() {
    let alerts = [];

    let reactorStr = ""
    if (this._game.reactorStatus > SSSTReactorQuestStatus.Open && this._game.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate) {
      reactorStr = " The destruction of your ship is made much more spectacular by the added explosion of the Ion Reactor."
      this._game.reactorStatus = SSSTReactorQuestStatus.ClosedTooLate;
      pLog.log(160)
    }

    alerts.push(`Just before the final demise of your ship, your escape pod gets activated and ejects you.${reactorStr} After a few days, the Space Corps picks you up and drops you off at a nearby space port.`);

    if (this._game.japoriQuestStatus === SSSTJaporiQuestStatus.HasMedicine) {
      this._game.japoriQuestStatus = SSSTJaporiQuestStatus.Open;
      alerts.push("The antidote for the Japori system was destroyed with your ship. Fortunately, they probably have some new antidote in the system where you originally got it.");
    }

    if (this._game.commander.artifactOnBoard) {
      this._game.commander.artifactOnBoard = false;
      alerts.push("You couldn't take the artifact with you in the escape pod, so now it's lost in the wreckage. The aliens will probably pick it up there.");
    }

    if (this._game.jarekStatus === SSSTJarekQuestStatus.OnBoard) {
      alerts.push("The Space Corps decides to give ambassador Jarek a lift home to Devidia.");
      this._game.jarekStatus = SSSTJarekQuestStatus.Closed;
    }

    if (this._game.wildStatus === SSSTWildQuestStatus.OnBoard) {
      alerts.push("Jonathan Wild is arrested, and taken away to stand trial.");
      this._game.wildStatus = SSSTWildQuestStatus.Closed;
      this._game.commander.ship.removeCrewMemberWithName("Jonathan Wild");
      this._game.addBreakingNewsItem("Notorious Criminal Jonathan Wild Arrested!");
      this._game.commander.policeRecordScore = this._game.commander.policeRecordScore + CAUGHT_WITH_WILD_SCORE;
      pLog.log(31)
    }

    this._game.handleArrival();

    if (this._game.commander.ship.tribbles > 0) {
      alerts.push("Your tribbles all died in the explosion.");
      this._game.commander.ship.tribbles = 0;
    }

    if (this._game.commander.hasInsurance) {
      let shipValue = this._game.commander.ship.shipValuationForInsurance(true);
      this._game.commander.credits = this._game.commander.credits + shipValue;
      alerts.push(`Since your ship was insured, the bank pays you $${shipValue}, the total value of the destroyed ship.`);
      pLog.log(32)
    }

    this._game.commander.hasInsurance = false;
    this._game.commander.noClaim = 0;
    this._game.commander.hasEscapePod = false;

    alerts.push("In 3 days and with $500, you manage to convert your pod into a Flea.");

    let credits = this._game.commander.credits;
    credits -= 500;
    if (credits < 0) {
      this._game.commander.debt = this._game.commander.debt - credits;
      credits = 0;
      pLog.log(33)
    }
    this._game.commander.credits = credits;

    this._game.timePassed(3);

    let ship = new SSSTShip(SSSTShipModelType.Flea, this._game.difficulty);
    this._game.commander.ship = ship;

    this._promptForStrings(alerts, () => {
      this._delegate.travelViewControllerDidComplete(this);
    });
  }

}
