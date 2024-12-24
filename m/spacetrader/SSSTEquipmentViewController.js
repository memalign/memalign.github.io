class SSSTEquipmentViewController {
  constructor(div, game) {
    this.div = div
    this._game = game
    this._buyMode = true
  }

  presentView() {
    const containerDiv = this.div

    containerDiv.innerHTML = ''

    MAUtils.createElement('h4', { textContent: 'Ship Equipment Slots'}, containerDiv);

		this._presentSellTable()

    containerDiv.appendChild(document.createElement('br'));

    MAUtils.createElement('h4', { textContent: 'Buy Equipment'}, containerDiv);
		this._presentBuyTable()
	}

	_presentBuyTable() {
    const containerDiv = this.div

    // Create the table element
    const table = document.createElement('table');
    table.classList.add('tight-table')

    // Create the table header
    const headers = ['Name', 'Cost', ''];

    // Create rows for each accessory type
    for (let accessoryType = 0; accessoryType < SSSTAccessoryType.None; accessoryType++) {
      const validAccessory = ACCESSORY_FOR_TYPE(accessoryType);
      if (!validAccessory || !validAccessory.isBuyable) { continue; }

      let forceDisable = false;
      if (this._buyMode &&
          (validAccessory instanceof SSSTGadget) &&
          accessoryType !== SSSTAccessoryType.GadgetFiveExtraCargoBays) {
        forceDisable = this._game.commander.ship.hasGadgetOfType(accessoryType)
      }

      const price = this._buyMode ? this._game.commander.buyPriceForAccessory(accessoryType) : this._game.commander.sellPriceForAccessory(accessoryType)

      const spendingMoney = this._game.commander.spendingMoney()
      const canAfford = !forceDisable && (this._buyMode ? (price <= spendingMoney) : true)


      const row = document.createElement('tr');

      // Name column
      const nameCell = document.createElement('td');
      const itemName = validAccessory.name;

      const icon = document.createElement('img')
      icon.classList.add('table-row-icon')
      const iconName = itemName
      icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
      nameCell.appendChild(icon)

      const title = document.createElement('span')
      title.textContent = itemName
      nameCell.appendChild(title)

      row.appendChild(nameCell);


      // Cost column
      const costCell = document.createElement('td');
      const showCost = (price > 0);
      if (showCost) {
        costCell.classList.add('right-aligned-cell')
      } else {
        costCell.classList.add('centered-cell')
      }

      costCell.innerText = showCost ? `$${price}` : "unavailable";
      row.appendChild(costCell);


      // Actions column
			const buttonName = (this._buyMode ? "Buy" : "Sell")

			const enableButton = (price !== 0) && canAfford
			const hideButton = (price === 0) && !this._buyMode

      const actionsCell = document.createElement('td');
      actionsCell.classList.add("centered-cell")

      if (!hideButton) {
        const buyButton = document.createElement('button');
        buyButton.innerText = buttonName;
        buyButton.id = MAUtils.sanitizedElementID("buy_" + itemName)
        actionLog.registerButtonEventListener(buyButton, 'click', () => {
          this._buyPressed(accessoryType, price);
        });
        buyButton.disabled = !enableButton;
        actionsCell.appendChild(buyButton);
      }

      row.appendChild(actionsCell);

      // Append the row to the table
      table.appendChild(row);
    }

    // Append the table to the container div
    containerDiv.appendChild(table);
  }

  _createRow(cols, colSpan, showIcon) {
    const row = document.createElement('tr');

    for (const col of cols) {
      const cell = document.createElement('td');
      if (col) {
        if (typeof col === 'string' || col instanceof String) {

					if (showIcon) {
						const icon = document.createElement('img')
						icon.classList.add('table-row-icon')
						const iconName = col
						icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
						cell.appendChild(icon)

						const title = document.createElement('span')
						title.textContent = col
						cell.appendChild(title)
					} else {
						cell.innerText = col;
					}

        } else {
          cell.appendChild(col);
          cell.classList.add('centered-cell')
        }
      }

      if (cols.length === 1 && colSpan) {
        cell.colSpan = colSpan;
      }

      row.appendChild(cell);
    }

    return row;
  }

  _populateSellRows(title, accessories, accessorySlots, table, headers) {
		// Section header
    {
      const row = this._createRow([title], headers.length, false);
      row.className = 'section-label';
      table.appendChild(row);
    }

    if (accessorySlots === 0) {
      const row = this._createRow(['No slots'], headers.length, true)
      table.appendChild(row);
    } else {
      for (const accessory of accessories) {
        const name = accessory.name;
        const value = this._game.commander.sellPriceForAccessory(accessory.type);

        const hideButton = value === 0

        let sellButton = null;
        if (!hideButton) {
          sellButton = document.createElement('button');
          sellButton.innerText = `Sell for $${value}`;
          sellButton.id = MAUtils.sanitizedElementID("sell_" + name)
          actionLog.registerButtonEventListener(sellButton, 'click', () => {
            this._sellPressed(accessory.type, value);
          });
        }

        const row = this._createRow([name, sellButton], headers.length, true);
        table.appendChild(row);
      }

      const openSlots = accessorySlots - accessories.length
      for (let i = 0; i < openSlots; i++) {
        const row = this._createRow(['Empty'], headers.length, true)
        table.appendChild(row);
      }
    }
  }

	_presentSellTable() {
    const containerDiv = this.div

    // Create the table element
    const table = document.createElement('table');
    table.classList.add('tight-table-collapse')

    // Create the table header
    const headers = ['', ''];

		// Gadgets
    const gadgets = this._game.commander.ship.gadgets
    const gadgetSlots = this._game.commander.ship.gadgetSlots
    this._populateSellRows("Gadgets", gadgets, gadgetSlots, table, headers);

    // Weapons
    const weapons = this._game.commander.ship.weapons
    const weaponSlots = this._game.commander.ship.weaponSlots
    this._populateSellRows("Weapons", weapons, weaponSlots, table, headers);

    // Shields
    const shields = this._game.commander.ship.shields
    const shieldSlots = this._game.commander.ship.shieldSlots
    this._populateSellRows("Shields", shields, shieldSlots, table, headers);


    // Append the table to the container div
    containerDiv.appendChild(table);

    const baysCreditsEl = MAUtils.createBaysCreditsElement(this._game)
    containerDiv.appendChild(baysCreditsEl)
  }


  _buyPressed(accessoryType, price) {
    console.log("Buy accessory button. AccessoryType " + accessoryType);

    const accessory = ACCESSORY_FOR_TYPE(accessoryType)

    let alertString = null;

    if (this._game.commander.debt > 0) {
      alertString = "Before you can buy a new ship or new equipment, you must settle your debts at the bank.";
    } else if (this._game.commander.ship.freeSlotsForAccessoryType(accessoryType) <= 0) {
      alertString = `You have no available ${accessory.constructor.accessoryCategory()} slots.`;
    }

    if (alertString) {
      SSSTAlertViewController.presentAlertWithDismiss(alertString)
      return;
    }

    alertString = `Do you want to install ${accessory.name} for $${price}?`;

    let aC = new SSSTAlertViewController(alertString)
    aC.addAction("Yes", SSSTAlertActionType.Default, () => {
        this._game.commander.ship.addAccessoryOfType(accessoryType);
        this._game.commander.setCredits(this._game.commander.credits - price);
        this._didBuyOrSell();
    })

    aC.addAction("No", SSSTAlertActionType.Cancel, null)

    aC.presentView()
  }

  _sellPressed(accessoryType, price) {
    console.log("Sell accessory button. AccessoryType " + accessoryType);

    const accessory = ACCESSORY_FOR_TYPE(accessoryType)

    if (accessoryType === SSSTAccessoryType.GadgetFiveExtraCargoBays && this._game.commander.ship.freeCargoBays() < 5) {
      SSSTAlertViewController.presentAlertWithDismiss("The extra cargo bays are still filled with goods. You can only sell them when they're empty.")
      return;
    }

    const alertString = `Are you sure you want to sell your ${accessory.name} for $${price}?`;

    let aC = new SSSTAlertViewController(alertString)
    aC.addAction("Yes", SSSTAlertActionType.Default, () => {
        this._game.commander.ship.removeAccessoryOfType(accessoryType);
        this._game.commander.setCredits(this._game.commander.credits + price);
        this._didBuyOrSell()
    })

    aC.addAction("No", SSSTAlertActionType.Cancel, null)

    aC.presentView()
  }

  _didBuyOrSell() {
    this._game.save()
    // Update UI with new values
    this.presentView()
  }
}
