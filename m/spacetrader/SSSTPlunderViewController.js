class SSSTPlunderViewController {
  constructor(game, opponent, plunderLabel) {
    this._game = game
    this._opponent = opponent
    this._plunderLabel = plunderLabel
    this._plunderMode = true
    this._plundered = false
  }

  get plundered() {
    return this._plundered
  }

  presentView() {
    const title = this._plunderMode ? this._plunderLabel : "Dump"
    const alertID = this._plunderLabel + "_" + (this._plunderMode ? "plunder" : "dump")
    const aC = new SSSTAlertViewController(title, alertID)

    if (this._plunderMode) {
      aC.addAction("Dump some cargo", SSSTAlertActionType.Default, () => {
        this._plunderMode = false
        this.presentView()
      })

      aC.addAction("Done", SSSTAlertActionType.Default, () => {
        this.delegate.plunderViewControllerDidFinishPlundering(this)
      })

    } else {
      // Dump mode
      aC.addAction("Resume plundering", SSSTAlertActionType.Default, () => {
        this._plunderMode = true
        this.presentView()
      })
    }

    aC.presentationStyle = SSSTAlertPresentationStyle.High

    aC.customViewHandler = (div) => {
      this._customViewDiv = div
      div.classList.add('centered-div')
      this._populateDiv(div)
    }

    aC.presentView()
  }

  _populateDiv(div) {
    const containerDiv = div

    containerDiv.innerHTML = ''

    // Create the table element
    const table = document.createElement('table');
    table.classList.add('tight-table')

    // Create rows for each trade item type
    for (let tradeItemType = 0; tradeItemType < SSSTTradeItemType.Count; tradeItemType++) {

      const quantityAvailable = this._quantityAvailable(tradeItemType)

      const row = document.createElement('tr');

      // Name column
      const nameCell = document.createElement('td');
      nameCell.classList.add('left-aligned-cell')
      const itemName = SSSTTradeItem.tradeItemForType(tradeItemType).name;

      const icon = document.createElement('img')
      icon.classList.add('table-row-icon')
      const iconName = itemName
      icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
      nameCell.appendChild(icon)

      const title = document.createElement('span')
      title.textContent = itemName
      nameCell.appendChild(title)


      row.appendChild(nameCell);

      // Quantity column
      const quantityCell = document.createElement('td');
      quantityCell.classList.add('right-aligned-cell')
      quantityCell.innerText = quantityAvailable
      row.appendChild(quantityCell);

      // Actions column
			const buttonName = this._plunderMode ? this._plunderLabel : "Dump"

			const enableButtons = quantityAvailable > 0

      const actionsCell = document.createElement('td');

			const buy1Button = document.createElement('button');
			buy1Button.innerText = `${buttonName} 1`;
      buy1Button.id = MAUtils.sanitizedElementID("cargo_" + itemName + buy1Button.innerText)
      actionLog.registerButtonEventListener(buy1Button, 'click', () => {
				this._buy1Pressed(tradeItemType);
			});
			buy1Button.disabled = !enableButtons;
			actionsCell.appendChild(buy1Button);

			const buy5Button = document.createElement('button');
			buy5Button.innerText = `5`;
      buy5Button.id = MAUtils.sanitizedElementID("cargo_" + itemName + `${buttonName} 5`)
      actionLog.registerButtonEventListener(buy5Button, 'click', () => {
				this._buy5Pressed(tradeItemType);
			});
			buy5Button.disabled = !enableButtons;
			actionsCell.appendChild(buy5Button);

			const buyAllButton = document.createElement('button');
			buyAllButton.innerText = `All`;
      buyAllButton.id = MAUtils.sanitizedElementID("cargo_" + itemName + `${buttonName} All`)
      actionLog.registerButtonEventListener(buyAllButton, 'click', () => {
				this._buyAllPressed(tradeItemType);
			});
			buyAllButton.disabled = !enableButtons;
			actionsCell.appendChild(buyAllButton);

      row.appendChild(actionsCell);

      // Append the row to the table
      table.appendChild(row);
    }

    // Append the table to the container div
    containerDiv.appendChild(table);


		const totalBays = this._game.commander.ship.totalCargoBays()
		const freeBays = this._game.commander.ship.freeCargoBays()
    let baysNode = document.createTextNode(`Bays: ${totalBays - freeBays}/${totalBays}`);
		containerDiv.appendChild(baysNode);


    containerDiv.appendChild(document.createElement('br'));
  }


  _takeQuantity(quantity, tradeItemType) {
    const actualQuantity = this._game.commander.ship.boughtQuantity(quantity, tradeItemType, 0)
    if (actualQuantity > 0) {
      this._plundered = true
      this._opponent.ship.soldQuantity(quantity, tradeItemType)
    }
  }

  _executeDump(quantity, tradeItemType) {
    if (gameRand.randomIntBelow(10) < this._game.difficulty + 1) {
      const currentPoliceRecordScore = this._game.commander.policeRecordScore;
      if (currentPoliceRecordScore > SSSTPoliceRecordScore.Dubious) {
        this._game.commander.policeRecordScore = SSSTPoliceRecordScore.Dubious
      } else {
        this._game.commander.policeRecordScore = currentPoliceRecordScore - 1
      }

      this._game.addBreakingNewsItem(`Police Trace Orbiting Space Litter to ${this._game.commander.name}.`)
    }

    this._game.commander.attemptSaleOfItem(tradeItemType, quantity, true)
  }

  _dumpQuantity(quantity, tradeItemType) {
    if (!this._game.commander.litterWarning && this._game.commander.policeRecordScore > SSSTPoliceRecordScore.Dubious) {
      this._game.commander.litterWarning = true

      const aC = new SSSTAlertViewController("Dumping cargo in space is considered littering. If the police track your dumped goods to you it will be reflected on your criminal record. Do you really wish to dump?")

      aC.addAction("Yes, I still want to", SSSTAlertActionType.Destructive, () => {
        this._executeDump(quantity, tradeItemType)
        this._populateDiv(this._customViewDiv)
      })

      aC.addAction("Nevermind!", SSSTAlertActionType.Cancel, null)

      aC.presentView()

    } else {
      this._executeDump(quantity, tradeItemType)
    }
  }

  _buy1Pressed(tradeItemType) {
    console.log("Buy 1 button. TradeItemType " + tradeItemType);
    if (this._plunderMode) {
      this._takeQuantity(1, tradeItemType)
    } else {
      this._dumpQuantity(1, tradeItemType)
    }

    this._populateDiv(this._customViewDiv)
  }

  _buy5Pressed(tradeItemType) {
    console.log("Buy 5 button");
    if (this._plunderMode) {
      this._takeQuantity(5, tradeItemType)
    } else {
      this._dumpQuantity(5, tradeItemType)
    }

    this._populateDiv(this._customViewDiv)
  }

  _buyAllPressed(tradeItemType) {
    console.log("Buy All button");
    const quantity = this._quantityAvailable(tradeItemType)
    if (this._plunderMode) {
      this._takeQuantity(quantity, tradeItemType)
    } else {
      this._dumpQuantity(quantity, tradeItemType)
    }

    this._populateDiv(this._customViewDiv)
  }

  _quantityAvailable(tradeItemType) {
    return this._plunderMode ? this._opponent.ship.tradeItemQuantityForType(tradeItemType) : this._game.commander.ship.tradeItemQuantityForType(tradeItemType)
  }
}
