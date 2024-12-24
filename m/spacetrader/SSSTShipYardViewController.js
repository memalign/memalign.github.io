const kEscapePodPrice = 2000;

class SSSTShipYardViewController {
  constructor(div, game) {
    this.div = div
    this._game = game
  }

  presentView() {
    MAUtils.maintainScrollPosition(() => {
      this._presentView()
    })
  }

  _presentView() {
    const containerDiv = this.div
    containerDiv.innerHTML = '';

    const header = MAUtils.createElement('h1', { textContent: 'Ship Yard' }, containerDiv);
    header.classList.add('centered-div')


    const maintenanceDiv = document.createElement('div');
    maintenanceDiv.id = "maintenaceDiv";
    containerDiv.appendChild(maintenanceDiv);

    this._presentMaintenanceView(maintenanceDiv);


    const shipsDiv = document.createElement('div');
    shipsDiv.id = "shipsDiv";
    containerDiv.appendChild(shipsDiv);

    this._presentShipsView(shipsDiv);
  }

  _autoFuelValueChanged(event) {
    console.log(`Fuel checkbox value changed: ${event.target.checked}`);
    console.log("game: " + this._game)
    this._game.autoFuel = event.target.checked
    this._game.save()
  }

  _autoRepairValueChanged(event) {
    console.log(`Repair checkbox value changed: ${event.target.checked}`);
    console.log("game: " + this._game)
    this._game.autoRepairs = event.target.checked
    this._game.save()
  }

	_buy1FuelPressed() {
    pLog.log(39)
    console.log("Buy 1 fuel button");
		this._game.commander.attemptPurchaseOfFuel(1)
    this._game.save()
		this.presentView()
		this.delegate.shipYardViewControllerDidBuyFuel(this)
	}

	_buy5FuelPressed() {
    pLog.log(40)
    console.log("Buy 5 fuel button");
		this._game.commander.attemptPurchaseOfFuel(5)
    this._game.save()
		this.presentView()
		this.delegate.shipYardViewControllerDidBuyFuel(this)
	}

	_buyFullFuelPressed() {
    pLog.log(41)
    console.log("Buy full fuel button");
		this._game.commander.attemptPurchaseOfFuel(this._game.commander.ship.fuelTankCapacity())
    this._game.save()
		this.presentView()
		this.delegate.shipYardViewControllerDidBuyFuel(this)
	}

  _buy1RepairPressed() {
    pLog.log(34)
    console.log("Buy 1 repair button");
		this._game.commander.attemptPurchaseOfRepairs(1)
    this._game.save()
		this.presentView()
  }

  _buy5RepairsPressed() {
    pLog.log(35)
    console.log("Buy 5 repair button");
		this._game.commander.attemptPurchaseOfRepairs(5)
    this._game.save()
		this.presentView()
  }

  _buyFullRepairsPressed() {
    pLog.log(36)
    console.log("Buy full repairs button");
		this._game.commander.attemptPurchaseOfRepairs(this._game.commander.ship.maximumHullStrength())
    this._game.save()
		this.presentView()
  }

  _buyEscapePodPressed() {
    console.log("Buy escape pod button");

    // Prompt instead of immediately buying since $2000 would be a lot to spend due to an accidental button press
    let aC = new SSSTAlertViewController(`Buy an escape pod for $${kEscapePodPrice}?`)
    aC.addAction("Yes", SSSTAlertActionType.Default, () => {
      this._game.commander.credits -= kEscapePodPrice
      this._game.commander.hasEscapePod = true
      this._game.save()
      this.presentView()
    })

    aC.addAction("No", SSSTAlertActionType.Cancel, null)

    aC.presentView()
  }

  _presentMaintenanceView(containerDiv) {
    const fuelDiv = document.createElement('div');
    fuelDiv.classList.add('centered-div')
    fuelDiv.classList.add('centered')
    fuelDiv.id = "fuelDiv";
    containerDiv.appendChild(fuelDiv);

    let fuelString = `You have fuel to fly ${this._game.commander.ship.fuel} parsecs.`;

    let fuelNeeded = (this._game.commander.ship.fuelTankCapacity() - this._game.commander.ship.fuel);
    if (fuelNeeded > 0) {
      let price = fuelNeeded * this._game.commander.ship.model.costOfFuel;
      fuelString += `\nFuel costs $${this._game.commander.ship.model.costOfFuel}/unit. A full tank costs $${price}.`;
    }

		fuelDiv.innerHTML = fuelString.replace(/\n/g, '<br>');
    fuelDiv.appendChild(document.createElement('br'));

		if (fuelNeeded > 0) {
			const buy1Button = document.createElement('button');
			buy1Button.innerText = `Buy 1 unit`;
      buy1Button.id = "buy1unit"
      actionLog.registerButtonEventListener(buy1Button, 'click', () => {
				this._buy1FuelPressed();
			});
			fuelDiv.appendChild(buy1Button);

			const buy5Button = document.createElement('button');
			buy5Button.innerText = `5 units`;
      buy5Button.id = "buy5units"
      actionLog.registerButtonEventListener(buy5Button, 'click', () => {
				this._buy5FuelPressed();
			});
			fuelDiv.appendChild(buy5Button);

			const buyAllButton = document.createElement('button');
			buyAllButton.innerText = `Full tank`;
      buyAllButton.id = "fulltank"
      actionLog.registerButtonEventListener(buyAllButton, 'click', () => {
				this._buyFullFuelPressed();
			});
			fuelDiv.appendChild(buyAllButton);

      fuelDiv.appendChild(document.createElement('br'));
		}


    // Create the checkbox input element
    const fcheckbox = document.createElement('input');
    fcheckbox.type = 'checkbox';
    fcheckbox.id = 'autoFuelCheckbox';
    fcheckbox.checked = this._game.autoFuel;

    // Create the label for the checkbox
    const flabel = document.createElement('label');
    flabel.htmlFor = 'autoFuelCheckbox';
    flabel.innerText = 'Automatically fill tanks upon arrival';

    // Append the checkbox and label to the container div
    fuelDiv.appendChild(fcheckbox);
    fuelDiv.appendChild(flabel);

    actionLog.registerCheckboxEventListener(fcheckbox, 'change', (e) => {
      this._autoFuelValueChanged(e)
    });


    containerDiv.appendChild(document.createElement('br'));

    const commanderDiv = document.createElement('div');
    commanderDiv.classList.add('shipYardCommanderShip')
    containerDiv.appendChild(commanderDiv)
    const commanderBattleView = new SSSTBattleOpponentView(commanderDiv, this._game.commander.ship, false, false)

    const repairDiv = document.createElement('div');
    repairDiv.id = "repairDiv";
    containerDiv.appendChild(repairDiv);

		let repairsString = `Your hull strength is at ${Math.floor(100 * this._game.commander.ship.hullPercentage())}%.`;

		if (this._game.commander.ship.upgradedHull) {
			repairsString += "\nYour ship has an upgraded hull.";
		}

		let repairsNeeded = (this._game.commander.ship.maximumHullStrength() - this._game.commander.ship.hull);
		if (repairsNeeded > 0) {
			let price = repairsNeeded * this._game.commander.ship.model.repairCosts;
			repairsString += `\nRepairs cost $${this._game.commander.ship.model.repairCosts} each. A full repair costs $${price}.`;
		}

		repairDiv.innerHTML = repairsString.replace(/\n/g, '<br>');

    if (this._game.commander.hasEscapePod) {
      repairDiv.appendChild(document.createElement('br'));
      let textNode = document.createTextNode("You have an escape pod installed.")
      repairDiv.appendChild(textNode)
    }

		if (repairsNeeded > 0) {
      repairDiv.appendChild(document.createElement('br'));

			const buy1Button = document.createElement('button');
			buy1Button.innerText = `Buy 1 repair`;
      buy1Button.id = MAUtils.sanitizedElementID(buy1Button.innerText)
      actionLog.registerButtonEventListener(buy1Button, 'click', () => {
				this._buy1RepairPressed();
			});
			repairDiv.appendChild(buy1Button);

			const buy5Button = document.createElement('button');
			buy5Button.innerText = `5 repairs`;
      buy5Button.id = MAUtils.sanitizedElementID(buy5Button.innerText)
      actionLog.registerButtonEventListener(buy5Button, 'click', () => {
				this._buy5RepairsPressed();
			});
			repairDiv.appendChild(buy5Button);

			const buyAllButton = document.createElement('button');
			buyAllButton.innerText = `Full repair`;
      buyAllButton.id = MAUtils.sanitizedElementID(buyAllButton.innerText)
      actionLog.registerButtonEventListener(buyAllButton, 'click', () => {
				this._buyFullRepairsPressed();
			});
			repairDiv.appendChild(buyAllButton);
		}

    repairDiv.appendChild(document.createElement('br'));


    // Create the checkbox input element
    const rcheckbox = document.createElement('input');
    rcheckbox.type = 'checkbox';
    rcheckbox.id = 'autoRepairCheckbox';
    rcheckbox.checked = this._game.autoRepairs;

    // Create the label for the checkbox
    const rlabel = document.createElement('label');
    rlabel.htmlFor = 'autoRepairCheckbox';
    rlabel.innerText = 'Automatically buy repairs upon arrival';

    // Append the checkbox and label to the container div
    repairDiv.appendChild(rcheckbox);
    repairDiv.appendChild(rlabel);

    actionLog.registerCheckboxEventListener(rcheckbox, 'change', (e) => {
      this._autoRepairValueChanged(e)
    });


    repairDiv.appendChild(document.createElement('br'));

    if (!this._game.commander.hasEscapePod) {
			const buyPod = document.createElement('button');
			buyPod.innerText = `Buy an escape pod for $${kEscapePodPrice}`;
      buyPod.id = "buy_escape_pod"
      actionLog.registerButtonEventListener(buyPod, 'click', () => {
				this._buyEscapePodPressed();
			});
			buyPod.disabled = (this._game.commander.credits < kEscapePodPrice);
      repairDiv.appendChild(document.createElement('br'))
      repairDiv.appendChild(buyPod);
    }
  }

  _priceForModel(model) {
    let price = this._game.commander.buyPriceForShipModel(model) - this._game.commander.cargoAndShipValuationForInsurance(false)

    if (price === 0) {
      price = 1
    }

    return price
  }

	_buyShipPressed(model) {
		console.log("_buyShipPressed")

		let cantBuyString = null;

		let price = this._priceForModel(model);

		if (price > 0 && this._game.commander.debt > 0) {
      pLog.log(103)
			cantBuyString = "Before you can buy a new ship or new equipment, you must settle your debts at the bank.";
		} else if (this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.FakeQuestCargoReactor) > 0) {
			cantBuyString = "Sorry! We can't take your ship as a trade-in. That Ion Reactor looks dangerous, and we have no way of removing it. Come back when you've gotten rid of it.";
      pLog.log(165)
		}

		if (cantBuyString) {
      console.log("Can't buy: " + cantBuyString);
      let aC = new SSSTAlertViewController(cantBuyString)
      aC.addAction("Dismiss", SSSTAlertActionType.Default, null)
      aC.presentView()
			return;
		}

		let extraCost = 0;
		let alertString = "";
		let comma = "";
		let hasLightning = false;

		if (this._game.commander.ship.hasShieldOfType(SSSTAccessoryType.ShieldLightning)) {
			if (model.shieldSlots === 0) {
				alertString += `${comma}You will lose your Lightning shield due to insufficient shield slots.`;
				comma = "\n";
			} else {
				hasLightning = true;
				extraCost += Math.floor(ACCESSORY_FOR_TYPE(SSSTAccessoryType.ShieldLightning).price * 2 / 3);
			}
		}

		let hasFuelCompactor = false;
		if (this._game.commander.ship.hasGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor)) {
			if (model.gadgetSlots === 0) {
				alertString += `${comma}You will lose your Fuel Compactor due to insufficient gadget slots.`;
				comma = "\n";
			} else {
				hasFuelCompactor = true;
				extraCost += Math.floor(ACCESSORY_FOR_TYPE(SSSTAccessoryType.GadgetFuelCompactor).price * 2 / 3);
			}
		}

		let hasMorganLaser = false;
		if (this._game.commander.ship.hasWeaponOfType(SSSTAccessoryType.WeaponMorgansLaser)) {
			if (model.weaponSlots === 0) {
				alertString += `${comma}You will lose your Morgan's Laser due to insufficient weapon slots.`;
				comma = "\n";
			} else {
				hasMorganLaser = true;
				extraCost += Math.floor(ACCESSORY_FOR_TYPE(SSSTAccessoryType.WeaponMorgansLaser).price * 2 / 3);
			}
		}

		if ((price + extraCost) > this._game.commander.spendingMoney()) {
      console.log("Can't buy: extra cost is too high")

      let aC = new SSSTAlertViewController(`You've got special equipment on board which will cost $${extraCost} to move over. Unfortunately, you can't afford this cost and must sell some equipment or increase your cash to proceed.`)
      aC.addAction("Dismiss", SSSTAlertActionType.Default, null)
      aC.presentView()

			return;
		}

		if (model.mercenaryQuarters() < this._game.commander.ship.crewCount()) {
      console.log("Can't buy: crew count")
      let aC = new SSSTAlertViewController("The new ship you picked doesn't have enough quarters for your crew. You need to fire some mercenaries or pick a more accommodating ship.")
      aC.addAction("Dismiss", SSSTAlertActionType.Default, null)
      aC.presentView()

			return;
		}

		let prompt = `Are you sure you want to trade your ${this._game.commander.ship.model.name} for a ${model.name} for${price < 0 ? " a credit of" : ""} $${Math.abs(price)}?`;
		if (hasLightning || hasFuelCompactor || hasMorganLaser) {
			prompt += ` To keep your rare equipment, you will need to pay an extra $${extraCost}.`;
		}

		if (alertString.length) {
			prompt += ` Please note that:\n${alertString}`;
		}

    console.log("Buy ship prompt: " + prompt);

    let aC = new SSSTAlertViewController(prompt)
    aC.addAction("Yes", SSSTAlertActionType.Default, () => {
			let ship = new SSSTShip(model.type, this._game.difficulty);

			this._game.commander.ship.crew.forEach(crewMember => {
				ship.addCrewMember(crewMember);
			});

			if (hasLightning) {
				ship.addShieldOfType(SSSTAccessoryType.ShieldLightning);
			}

			if (hasFuelCompactor) {
				ship.addGadgetOfType(SSSTAccessoryType.GadgetFuelCompactor);
			}

			if (hasMorganLaser) {
				ship.addWeaponOfType(SSSTAccessoryType.WeaponMorgansLaser);
			}

			this._game.commander.ship = ship;
      this._game.commander.credits = this._game.commander.credits - price - extraCost

      this._game.save()

			this.presentView();
    })

    aC.addAction("No", SSSTAlertActionType.Cancel, null)

    aC.presentView()
	}

  _presentShipsView(containerDiv) {
    if (this._game.commander.ship.tribbles > 0 && !this._game.tribbleMessage) {
      this._game.tribbleMessage = true

      SSSTAlertViewController.presentAlertWithDismiss("You would normally receive about 75% of the worth of a new ship as trade-in value, but a tribble-infested ship will sell for only 25%. Trading is a way to get rid of your tribbles, though...")
    }


    MAUtils.createElement('h3', { textContent: 'Ships'}, containerDiv);

    // Create the table element
    const table = document.createElement('table');
    table.classList.add('tight-table')

    // Create the table header
    const headerRow = document.createElement('tr');
    const headers = ['Name', 'Details', 'Cost', ''];

    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.innerText = headerText;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Create rows for each ship model
    for (let shipType = 0; shipType <= SSSTShipModelType.Best; shipType++) {
      const model = SSSTShipModel.shipModelForType(shipType)

      let price = 0;
      let priceText = "not sold";

      if (model.type === this._game.commander.ship.type) {
        priceText = "got one";
      } else if (model.minTechLevel <= this._game.commander.currentSystem.techLevel) {
        price = this._priceForModel(model);
        const sign = (price >= 0) ? "" : "-";
        priceText = `${sign}$${Math.abs(price)}`;
      }

      const canBuy = (price !== 0) && (price <= this._game.commander.spendingMoney())


      const row = document.createElement('tr');

      // Name column
      const nameCell = document.createElement('td');

      const imgEl = document.createElement('img')
      imgEl.classList.add('full-width-img')
      imgEl.src = model.shipImage.generatePNG(3)

      nameCell.appendChild(imgEl)

      const itemName = model.name
      const nameSpan = document.createElement('span')
      nameSpan.classList.add('centered-text')
      nameSpan.textContent = itemName
      nameCell.appendChild(nameSpan)

      row.appendChild(nameCell);

      // Details column
      const detailsCell = document.createElement('td');

			function quantityStr(name, x) {
				return `${x} ${name}${x === 1 ? "" : "s"}`;
			}

			let details = `${quantityStr("mercenary quarter", model.mercenaryQuarters())}\n` +
				`${quantityStr("gadget slot", model.gadgetSlots)}\n` +
				`${quantityStr("weapon slot", model.weaponSlots)}\n` +
				`${quantityStr("shield slot", model.shieldSlots)}\n` +
				`${quantityStr("cargo bay", model.cargoBays)}\n` +
				`${quantityStr("fuel tank", model.fuelTanks)}\n` +
				`${model.hullStrength} hull strength`;

      detailsCell.innerText = details;

      row.appendChild(detailsCell);


      // Cost column
      const costCell = document.createElement('td');

      if (priceText.includes('$')) {
        costCell.classList.add('right-aligned-cell')
      } else {
        costCell.classList.add('centered-cell')
      }

      costCell.innerText = priceText

      row.appendChild(costCell);


      // Actions column
      const buttonName = "Buy"

      const enableButton = canBuy

      const actionsCell = document.createElement('td');
      actionsCell.classList.add('centered-cell')

      const buyButton = document.createElement('button');
      buyButton.innerText = buttonName;
      buyButton.id = MAUtils.sanitizedElementID("buyship_" + model.name)
      actionLog.registerButtonEventListener(buyButton, 'click', () => {
				this._buyShipPressed(model)
      });
      buyButton.disabled = !enableButton;
      actionsCell.appendChild(buyButton);

      row.appendChild(actionsCell);

      // Append the row to the table
      table.appendChild(row);
    }

    // Append the table to the container div
    containerDiv.appendChild(table);

    const baysCreditsEl = MAUtils.createBaysCreditsElement(this._game)
    containerDiv.appendChild(baysCreditsEl)
  }
}
