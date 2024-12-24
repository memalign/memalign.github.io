class SSSTBuySellCargoViewController {
  constructor(div, game, buyMode, baseSystem) {
    this.div = div
    this._game = game
    this._baseSystem = baseSystem
    this._relativePrices = this._baseSystem ? true : false
    this._buyMode = buyMode
  }

  _buyPriceForItem(tradeItemType) {
    return this._baseSystem ? this._baseSystem.standardPriceForItem(tradeItemType) : this._game.commander.buyPriceForItem(tradeItemType)
  }

  _sellPriceForItem(tradeItemType) {
    return this._baseSystem ? this._baseSystem.standardPriceForItem(tradeItemType) : this._game.commander.sellPriceForItem(tradeItemType)
  }

  _quantityAvailableToBuy(tradeItemType) {
    return this._game.commander.getCurrentSystem().tradeItemQuantityForType(tradeItemType)
  }

	_quantityAvailableToSell(tradeItemType) {
		return this._game.commander.ship.tradeItemQuantityForType(tradeItemType)
	}

  _averageBuyingPrice(tradeItemType) {
    return this._baseSystem ? this._game.commander.buyPriceForItem(tradeItemType) : this._game.commander.ship.tradeItemAverageBuyingPriceForType(tradeItemType)
  }

  presentView() {
    MAUtils.maintainScrollPosition(() => {
      this._presentView()
    })
  }

  _presentView() {
    const containerDiv = this.div

    containerDiv.innerHTML = ''

    const showTitle = !this._baseSystem
    if (showTitle) {
      const title = this._buyMode ? "Buy Cargo" : "Sell Cargo"
      const ch = MAUtils.createElement('h1', { textContent: title }, containerDiv);
    }

    if (this._baseSystem) {
      let pricesTitlePrefix = this._relativePrices ? `Average prices on ` : `Average prices on `
      const el = MAUtils.createElement('h4', { textContent: `${pricesTitlePrefix}${this._baseSystem.getName()} ` }, containerDiv);
      el.classList.add('header-with-buttons')

      const buttonRow = document.createElement('div')
      buttonRow.classList.add('button-row')
      el.appendChild(buttonRow)

      const togglePricesButton = document.createElement('button');
      togglePricesButton.innerText = `Show ${this._relativePrices ? "Absolute" : "Relative"}`;
      togglePricesButton.id = MAUtils.sanitizedElementID("togglePrices_" + togglePricesButton.innerText)
      actionLog.registerButtonEventListener(togglePricesButton, 'click', () => {
        this._togglePricesPressed();
      });
      buttonRow.appendChild(togglePricesButton);
    }


    const hidePrices = false;

    // Create the table element
    const table = document.createElement('table');
    table.classList.add('tight-table')

    // Create rows for each trade item type
    for (let tradeItemType = 0; tradeItemType < SSSTTradeItemType.Count; tradeItemType++) {

      const buyPrice = this._buyPriceForItem(tradeItemType);
      const sellPrice = this._sellPriceForItem(tradeItemType);
      const quantityAvailableToBuy = this._quantityAvailableToBuy(tradeItemType);
      const quantityAvailableToSell = this._quantityAvailableToSell(tradeItemType);
      const averageBuyingPrice = this._averageBuyingPrice(tradeItemType);
      const relativePrices = this._relativePrices;

      const row = document.createElement('tr');

      // Name column
      const nameCell = document.createElement('td');
      const itemName = SSSTTradeItem.tradeItemForType(tradeItemType).name;

      let useBoldTitle = false;
      if (!hidePrices) {
        if (this._buyMode) {
          if (this._baseSystem) {
            if ((sellPrice > averageBuyingPrice) && (quantityAvailableToBuy > 0)) {
              useBoldTitle = true;
            }
          }
        } else {
          if ((sellPrice > averageBuyingPrice) && (quantityAvailableToSell > 0)) {
            useBoldTitle = true;
          }
        }
      }


      const icon = document.createElement('img')
      icon.classList.add('table-row-icon')
      const iconName = itemName
      icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
      nameCell.appendChild(icon)

      if (useBoldTitle) {
        const boldName = document.createElement('b');
        boldName.innerText = itemName;
        nameCell.appendChild(boldName);
      } else {
				const title = document.createElement('span')
				title.textContent = itemName
				nameCell.appendChild(title)
      }

      row.appendChild(nameCell);

      // Quantity column
      const quantityCell = document.createElement('td');
      quantityCell.classList.add('right-aligned-cell')
      quantityCell.innerText = this._buyMode ? quantityAvailableToBuy : quantityAvailableToSell;
      row.appendChild(quantityCell);

      if (!hidePrices) {
        // Cost column
        const costCell = document.createElement('td');
        costCell.classList.add('right-aligned-cell')
        const price = this._relativePrices ? (sellPrice - averageBuyingPrice) : (this._buyMode ? buyPrice : sellPrice)
        const sign = this._relativePrices ? ((price > 0) ? "+" : ((price === 0) ? "" : "-")) : ""
        const showCost = ((this._relativePrices && sellPrice != 0) || // Show only if we can sell this item OR
                          price != 0) // There's a notable price

        costCell.innerText = showCost ? `${sign}$${Math.abs(price)}` : "";
        row.appendChild(costCell);
      }

      // Actions column
			const buttonName = (this._buyMode ? (hidePrices ? "Take" : "Buy") : ((hidePrices || (sellPrice === 0 && quantityAvailableToSell > 0)) ? "Dump" : "Sell"))

			const enableButtons = (this._buyMode && (quantityAvailableToBuy > 0)) || (!this._buyMode && (quantityAvailableToSell > 0));

      const actionsCell = document.createElement('td');
      actionsCell.classList.add('centered-cell')

			const buy1Button = document.createElement('button');
			buy1Button.innerText = `${buttonName} 1`;
      buy1Button.id = MAUtils.sanitizedElementID("cargo_" + itemName + buy1Button.innerText)
      actionLog.registerButtonEventListener(buy1Button, 'click', () => {
				this._buy1Pressed(tradeItemType);
			});
			buy1Button.disabled = !enableButtons;
			actionsCell.appendChild(buy1Button);

			const buy5Button = document.createElement('button');
			buy5Button.innerText = `${buttonName} 5`;
      buy5Button.id = MAUtils.sanitizedElementID("cargo_" + itemName + buy5Button.innerText)
      actionLog.registerButtonEventListener(buy5Button, 'click', () => {
				this._buy5Pressed(tradeItemType);
			});
			buy5Button.disabled = !enableButtons;
			actionsCell.appendChild(buy5Button);

			const buyAllButton = document.createElement('button');
			buyAllButton.innerText = `${buttonName} All`;
      buyAllButton.id = MAUtils.sanitizedElementID("cargo_" + itemName + buyAllButton.innerText)
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

    const baysCreditsEl = MAUtils.createBaysCreditsElement(this._game)
    containerDiv.appendChild(baysCreditsEl)
  }


  _buy1Pressed(tradeItemType) {
    console.log("Buy 1 button. TradeItemType " + tradeItemType);
    if (this._buyMode) {
      this._buyQuantityOfItemType(1, tradeItemType)
    } else {
      this._sellQuantityOfItemType(1, tradeItemType)
    }
  }

  _buy5Pressed(tradeItemType) {
    console.log("Buy 5 button");
    if (this._buyMode) {
      this._buyQuantityOfItemType(5, tradeItemType)
    } else {
      this._sellQuantityOfItemType(5, tradeItemType)
    }
  }

  _buyAllPressed(tradeItemType) {
    console.log("Buy All button");
    if (this._buyMode) {
      this._buyQuantityOfItemType(this._quantityAvailableToBuy(tradeItemType), tradeItemType)
    } else {
      this._sellQuantityOfItemType(this._quantityAvailableToSell(tradeItemType), tradeItemType)
    }
  }

	_buyQuantityOfItemType(quantity, itemType) {
    if (this._game.commander.debtIsTooLargeToBuy()) {
      SSSTAlertViewController.presentAlertWithDismiss("Your debt is too large. Nobody will trade with you.")
      return
    }

    this._game.commander.attemptPurchaseOfItem(itemType, quantity)

    this._didBuyOrSell()
	}

  _sellQuantityOfItemType(quantity, itemType) {
    this._game.commander.attemptSaleOfItem(itemType, quantity, false)
    this._didBuyOrSell()
  }

  _didBuyOrSell() {
    this._game.save()
    // Update UI with new values
    this.presentView()
  }

  _togglePricesPressed() {
    this._relativePrices = !this._relativePrices
    this.presentView()
  }
}
