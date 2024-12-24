
const WARP_START_CLICKS = 21;

class SSSTWarpViewController {
  constructor(div, game, selectedSystem) {
    this.div = div
    this._game = game

    this._closeSystems = this.constructor.systemsWithinRange(this._game)
    const foundIndex = this._closeSystems.findIndex(s => s === selectedSystem)
    this._systemIndex = foundIndex
  }

  static systemsWithinRange(game) {
    return game.solarSystemsWithinRange().filter(x => x !== game.commander.currentSystem)
  }

  set delegate(d) {
    this._delegate = d
  }

  _currentBaseSystem() {
    if (this._systemIndex >= 0 && this._systemIndex < this._closeSystems.length) {
      return this._closeSystems[this._systemIndex]
    }

    return null
  }

  presentView() {
    MAUtils.maintainScrollPosition(() => {
      this._presentView()
    })
  }

  _presentView() {
    const containerDiv = this.div

    containerDiv.innerHTML = ''

    const warpHeader = MAUtils.createElement('h1', { textContent: "Warp" }, containerDiv);
    warpHeader.classList.add('header-with-buttons')

    const baseSystem = this._currentBaseSystem()

    const elID = "buyContainerDiv";
    const buyContainerDiv = document.createElement('div');
    buyContainerDiv.id = elID;
    containerDiv.appendChild(buyContainerDiv);


		if (baseSystem) {
			const buyVC = new SSSTBuySellCargoViewController(buyContainerDiv, this._game, true, baseSystem);
			buyVC.presentView();

      const buttonRow = document.createElement('div')
      buttonRow.classList.add('button-row')
      warpHeader.appendChild(buttonRow)

			const blastOffButton = document.createElement('button');
			blastOffButton.innerText = `Blast Off to ${baseSystem.getName()}`;
      blastOffButton.id = 'warpBlastOff';
			actionLog.registerButtonEventListener(blastOffButton, 'click', () => {
				this._blastOffPressed();
			});
			buttonRow.appendChild(blastOffButton);

			const prevButton = document.createElement('button');
			prevButton.innerText = `Prev`;
      prevButton.id = 'warpPrev';
      actionLog.registerButtonEventListener(prevButton, 'click', () => {
				this._prevPressed();
			});
			buttonRow.appendChild(prevButton);

			const nextButton = document.createElement('button');
			nextButton.innerText = `Next`;
      nextButton.id = 'warpNext';
      actionLog.registerButtonEventListener(nextButton, 'click', () => {
				this._nextPressed();
			});
			buttonRow.appendChild(nextButton);

		} else if (this._closeSystems.length === 0) {
			const wm = MAUtils.createElement('h3', { id: "warpMessage", textContent: "No systems within range " }, containerDiv);

      let fuelNeeded = (this._game.commander.ship.fuelTankCapacity() - this._game.commander.ship.fuel);
      let price = fuelNeeded * this._game.commander.ship.model.costOfFuel;
			const buyAllButton = document.createElement('button');
			buyAllButton.innerText = `Fill tank for $${price}`;
      buyAllButton.id = "fulltank"
      actionLog.registerButtonEventListener(buyAllButton, 'click', () => {
        this._game.commander.attemptPurchaseOfFuel(this._game.commander.ship.fuelTankCapacity())
        this._game.save()
        this._delegate.warpControllerDidBuyFuel(this)
			});
			wm.appendChild(buyAllButton);

		} else if (this._delegate.warpControllerGetGalaxyViewSystem(this) === this._game.commander.currentSystem) {
			MAUtils.createElement('h3', { id: "warpMessage", textContent: "Select a destination." }, containerDiv);
    } else {
			MAUtils.createElement('h3', { id: "warpMessage", textContent: "Out of range." }, containerDiv);
    }
  }


  _nextPressed() {
    console.log(`Next system pressed. SystemIndex: ${this._systemIndex} CloseSystemsLength: ${this._closeSystems.length}`)
    this._systemIndex += 1
    if (this._systemIndex >= this._closeSystems.length) {
      this._systemIndex -= this._closeSystems.length
      this._systemIndex = Math.min(this._systemIndex, this._closeSystems.length-1) // handle 0 close systems
    }

    this._delegate.warpControllerSelectedSystem(this, this._closeSystems[this._systemIndex])
  }

  _prevPressed() {
    console.log(`Prev system pressed. SystemIndex: ${this._systemIndex} CloseSystemsLength: ${this._closeSystems.length}`)
    this._systemIndex -= 1
    if (this._systemIndex < 0) {
      this._systemIndex += this._closeSystems.length
      this._systemIndex = Math.max(this._systemIndex, this._closeSystems.length-1) // handle 0 close systems
    }

    this._delegate.warpControllerSelectedSystem(this, this._closeSystems[this._systemIndex])
  }

  _blastOffPressed() {
		const destination = this._currentBaseSystem()
		this.constructor.warpWithGame(this._game, false, destination, this)
  }

	static warpWithGame(game, viaSingularity, destination, viewController) {
    MAUtils.ensureType(game, "object")
    MAUtils.ensureBool(viaSingularity)
    MAUtils.ensureType(destination, "object")
    MAUtils.ensureType(viewController, "object")

		const origin = game.commander.currentSystem;

		let alertString = null;
		let dismissLabel = "Darn!";
		let destructiveLabel = null;
		let destructiveAction = null;

		if (game.wildStatus === SSSTWildQuestStatus.OnBoard) {
			if (game.commander.ship.weaponPowerBetweenMinMaxInclusive(SSSTAccessoryType.WeaponBeamLaser, SSSTAccessoryType.WeaponLast) <= 0) {
        pLog.log(128)
				alertString = `Jonathan Wild isn't about to go with you if you're not armed with at least a Beam Laser. He'd rather take his chances hiding out here on ${origin.name}.`;
				dismissLabel = "Cancel";
				destructiveLabel = "He can stay!";
				destructiveAction = () => {
          pLog.log(129)
					game.wildStatus = SSSTWildQuestStatus.Closed
					game.commander.ship.removeCrewMemberWithName("Jonathan Wild");
					SSSTWarpViewController.warpWithGame(game, viaSingularity, destination, viewController);
				};
			}
		}

		let currentCredits = game.commander.credits;
    MAUtils.ensureInteger(currentCredits)

		if (!viaSingularity) {
			if (game.commander.debtIsTooLargeToBuy()) {
				alertString = "Your debt is too large. You are not allowed to leave this system until your debt is lowered.";
			}

      currentCredits -= game.commander.ship.mercenaryPricePerDay();
      MAUtils.ensureInteger(currentCredits)
			if (!alertString && currentCredits < 0) {
				alertString = "You don't have enough cash to pay your mercenaries to come on this trip. Fire them or make sure you have enough cash.";
			}

			if (game.commander.hasInsurance) {
				currentCredits -= game.commander.currentInsuranceCost();
        MAUtils.ensureInteger(currentCredits)
				if (!alertString && currentCredits < 0) {
					alertString = "You can't leave if you haven't paid your insurance. If you have no way to pay, you should stop your insurance at the bank.";
				}
			}

      let wormholeTax = game.commander.wormholeTaxToWarpToSystem(destination);
			currentCredits -= wormholeTax;
      MAUtils.ensureInteger(currentCredits)

			if (!alertString && currentCredits < 0) {
				alertString = "You don't have enough money to pay for the wormhole tax.";
			}
		}

		if (alertString) {
      let aC = new SSSTAlertViewController(alertString)
      aC.addAction(dismissLabel, SSSTAlertActionType.Default, null)

      if (destructiveLabel) {
        aC.addAction(destructiveLabel, SSSTAlertActionType.Destructive, () => {
					if (destructiveAction) {
						destructiveAction();
					}
        })
      }

      aC.presentView()

			console.log("Alert string: " + alertString);
			return;
		}

		game.commander.setCredits(currentCredits);
		game.commander.ship.rechargeShieldPower();
		game.commander.currentSystem.inventoryReplenishCountdown = game.difficulty + 3;

		let distance = 0;
		let arrivedViaWormhole = true;

		if (!viaSingularity && game.commander.currentSystem.wormhole !== destination) {
			arrivedViaWormhole = false;
			distance = game.commander.currentSystem.distanceTo(destination);
			game.commander.ship.consumeFuelOverDistance(distance);
		}

		game.commander.arrivedViaWormhole = arrivedViaWormhole;
		game.clearBreakingNews();

    // Evaluate whether we will suffer from the rip in space-time before accounting for time passing so our alert is accurate
		let fabricRipAlert = null;
		if (game.experimentStatus === SSSTExperimentQuestStatus.ClosedTooLate && game.fabricRipProbability > 0) {
			if (game.fabricRipProbability === FABRIC_RIP_PROBABILITY_INITIAL) {
				fabricRipAlert = "The galaxy is abuzz with news of a terrible malfunction in Dr. Fehler's laboratory. Evidently, he was not warned in time and he performed his experiment... with disastrous results! You may not reach your planned destination!";
			} else if (gameRand.randomIntBelow(100) < game.fabricRipProbability) {
				fabricRipAlert = "You have flown through a tear in the timespace continuum caused by Dr. Fehler's failed experiment. You may end up at some other destination!";
			}
		}

		if (fabricRipAlert) {
			const solarSystems = game.solarSystems;
			destination = solarSystems[gameRand.randomIntBelow(solarSystems.length)];
      MAUtils.ensureType(destination, "object")
      pLog.log(149)
		}

		if (!viaSingularity) {
			game.commander.payInterest();
			game.timePassed(1);
		} else {
			game.addBreakingNewsItem("Travelers Claim Sighting of Ship Materializing in Orbit!");
		}

		game.commander.travelClicksRemaining = WARP_START_CLICKS;
		game.commander.raided = false;
		game.commander.inspected = false;
		game.commander.litterWarning = false;

		game.healMonster();

		const wasVisited = destination.visited;
		game.commander.setCurrentSystem(destination);

		const performTravel = () => {
			const travelController = new SSSTTravelViewController(viewController.div, game, origin, destination, wasVisited);
      travelController.delegate = viewController;

      if (viewController._delegate) {
        viewController._delegate.warpControllerWillBeginWarp(this)
      }

			travelController.presentView()
		};

		if (fabricRipAlert) {
      let aC = new SSSTAlertViewController(fabricRipAlert)
      aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
        performTravel();
      })

      aC.presentView()
		} else {
			performTravel();
		}
	}

  // SSSTTravelViewController delegate

  travelViewControllerDidComplete(vc) {
    if (this._delegate) {
      this._delegate.warpControllerCompletedWarp(this)
    }
  }

  travelViewControllerGameDidEndWithStatus(tvc, st) {
    if (this._delegate) {
      this._delegate.warpControllerGameDidEndWithStatus(this, st)
    }
  }
}

