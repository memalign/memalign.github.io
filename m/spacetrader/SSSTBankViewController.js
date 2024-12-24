class SSSTBankViewController {
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
    this.div.innerHTML = ''

    const containerDiv = document.createElement('div')
    containerDiv.classList.add('centered-div')
    this.div.appendChild(containerDiv)

    const bh = MAUtils.createElement('h1', { textContent: 'Bank' }, containerDiv);
    bh.classList.add('centered-div')

    MAUtils.createElement('h4', { textContent: 'Loans' }, containerDiv);

    const creditTable = document.createElement('table');
    creditTable.classList.add('bankTable')
    containerDiv.appendChild(creditTable);
    creditTable.style.borderCollapse = 'collapse';
    {
      const row = document.createElement('tr');

      const titleCell = document.createElement('td');
      titleCell.innerText = "Current debt:";
      row.appendChild(titleCell);

      const amtCell = document.createElement('td');
      amtCell.classList.add('right-aligned-cell')
      amtCell.innerText = `$${this._game.commander.debt}`;
      row.appendChild(amtCell);

      creditTable.appendChild(row);
    }

    if (this._game.commander.debt > 0) {
      const row = document.createElement('tr');
      creditTable.appendChild(row)

      const cell = document.createElement('td');
      row.appendChild(cell);


			const payTinyButton = document.createElement('button');
			payTinyButton.innerText = `Pay back $${this._payableTinyIncrement()}`;
      payTinyButton.id = MAUtils.sanitizedElementID(payTinyButton.innerText)
      actionLog.registerButtonEventListener(payTinyButton, 'click', () => {
				this._tinyPayPressed();
			});
			cell.appendChild(payTinyButton);

			const payMediumButton = document.createElement('button');
			payMediumButton.innerText = `$${this._payableMediumIncrement()}`;
      payMediumButton.id = MAUtils.sanitizedElementID("pay_" + payMediumButton.innerText)
      actionLog.registerButtonEventListener(payMediumButton, 'click', () => {
				this._mediumPayPressed();
			});
			cell.appendChild(payMediumButton);

			const payAllButton = document.createElement('button');
			payAllButton.innerText = `$${this._payable()}`;
      payAllButton.id = MAUtils.sanitizedElementID("pay_" + payAllButton.innerText)
      actionLog.registerButtonEventListener(payAllButton, 'click', () => {
				this._maxPayPressed();
			});
			cell.appendChild(payAllButton);
    }

    {
      const row = document.createElement('tr');

      const titleCell = document.createElement('td');
      titleCell.innerText = "Available credit:";
      row.appendChild(titleCell);

      const amtCell = document.createElement('td');
      amtCell.classList.add('right-aligned-cell')
      amtCell.innerText = `$${this._borrowable()}`;
      row.appendChild(amtCell);

      creditTable.appendChild(row);
    }

    if (this._borrowable() > 0) {
      const row = document.createElement('tr')
      creditTable.appendChild(row)

      const cell = document.createElement('td')
      row.appendChild(cell)

			const borrowTinyButton = document.createElement('button');
			borrowTinyButton.innerText = `Borrow $${this._borrowableTinyIncrement()}`;
      borrowTinyButton.id = MAUtils.sanitizedElementID(borrowTinyButton.innerText)
      actionLog.registerButtonEventListener(borrowTinyButton, 'click', () => {
				this._tinyLoanPressed();
			});
			cell.appendChild(borrowTinyButton);

			const borrowMediumButton = document.createElement('button');
			borrowMediumButton.innerText = `$${this._borrowableMediumIncrement()}`;
      borrowMediumButton.id = MAUtils.sanitizedElementID("borrow_" + borrowMediumButton.innerText)
      actionLog.registerButtonEventListener(borrowMediumButton, 'click', () => {
				this._mediumLoanPressed();
			});
			cell.appendChild(borrowMediumButton);

			const borrowAllButton = document.createElement('button');
			borrowAllButton.innerText = `$${this._borrowable()}`;
      borrowAllButton.id = MAUtils.sanitizedElementID("borrow_" + borrowAllButton.innerText)
      actionLog.registerButtonEventListener(borrowAllButton, 'click', () => {
				this._maxLoanPressed();
			});
			cell.appendChild(borrowAllButton);
    }

    {
      // Create the checkbox input element
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'remindLoansCheckbox';
      checkbox.checked = this._game.remindLoans;

      // Create the label for the checkbox
      const label = document.createElement('label');
      label.htmlFor = 'remindLoansCheckbox';
      label.innerText = 'Remind about loans';

      // Append the checkbox and label to the container div
      containerDiv.appendChild(checkbox);
      containerDiv.appendChild(label);

      actionLog.registerCheckboxEventListener(checkbox, 'change', (e) => {
        this._remindLoansValueChanged(e)
      });
    }

    containerDiv.appendChild(document.createElement('br'));
    containerDiv.appendChild(document.createElement('br'));

    MAUtils.createElement('h4', { textContent: 'Insurance' }, containerDiv);

    const insTable = document.createElement('table');
    insTable.classList.add('bankTable')
    insTable.style.borderCollapse = 'collapse';
    {
      const row = document.createElement('tr');

      const titleCell = document.createElement('td');
      titleCell.innerText = "Ship value:";
      row.appendChild(titleCell);

      const amtCell = document.createElement('td');
      amtCell.classList.add('right-aligned-cell')
      amtCell.innerText = `$${this._game.commander.cargoAndShipValuationForInsurance(true)}`;
      row.appendChild(amtCell);

      insTable.appendChild(row);
    }
    {
      const row = document.createElement('tr');

      const titleCell = document.createElement('td');
      titleCell.innerText = "Safe pilot discount:";
      row.appendChild(titleCell);

      const amtCell = document.createElement('td');
      amtCell.classList.add('right-aligned-cell')
      const discount = Math.min(MAX_SAFE_PILOT_INSURANCE_DISCOUNT, this._game.commander.noClaim)
      amtCell.innerText = `$${discount}`;
      row.appendChild(amtCell);

      insTable.appendChild(row);
    }
    {
      const row = document.createElement('tr');

      const titleCell = document.createElement('td');
      titleCell.innerText = "Cost:";
      row.appendChild(titleCell);

      const amtCell = document.createElement('td');
      amtCell.classList.add('right-aligned-cell')
      amtCell.innerText = `$${this._game.commander.insurancePrice()}/day`;
      row.appendChild(amtCell);

      insTable.appendChild(row);
    }
    containerDiv.appendChild(insTable);

    const insButton = document.createElement('button');
    insButton.innerText = this._game.commander.hasInsurance ? "Cancel Insurance Policy" : "Buy Insurance Policy"
    insButton.id = MAUtils.sanitizedElementID(insButton.innerText)
    actionLog.registerButtonEventListener(insButton, 'click', () => {
      this._insuranceButtonPressed();
    });
    containerDiv.appendChild(insButton);

    containerDiv.appendChild(document.createElement('br'));
    containerDiv.appendChild(document.createElement('br'));

    const baysCreditsEl = MAUtils.createBaysCreditsElement(this._game)
    containerDiv.appendChild(baysCreditsEl)
  }

	_insuranceButtonPressed() {
		const commander = this._game.commander;

		if (!commander.hasInsurance) {
			if (!commander.hasEscapePod) {
        SSSTAlertViewController.presentAlertWithDismiss("Without an escape pod, insurance isn't useful because you will be killed if your ship is destroyed. Buy one at the Ship Yard.")
				return;
			}

      commander.hasInsurance = true
		} else {
      commander.hasInsurance = false
			commander.noClaim = 0
		}

    this._game.save()

		this.presentView()
	}

	_payable() {
		return this._game.commander.debt;
	}

	_payableTinyIncrement() {
		return Math.max(5, Math.floor(this._payable() / 50));
	}

	_payableMediumIncrement() {
		return Math.max(2 * this._payableTinyIncrement(), Math.floor(this._payable() / 10));
	}

	_tinyPayPressed() {
		this._payAmount(this._payableTinyIncrement());
	}

	_mediumPayPressed(button) {
		this._payAmount(this._payableMediumIncrement());
	}

	_maxPayPressed(button) {
		this._payAmount(this._payable());
	}

	_payAmount(amount) {
		const commander = this._game.commander;
		amount = Math.min(amount, Math.min(commander.debt, commander.credits));
    commander.credits = commander.credits - amount;
    commander.debt = commander.debt - amount;
    this._game.save()
    this.presentView();
	}

	_borrowable() {
		const commander = this._game.commander;
		return Math.max(0, commander.maxLoan() - commander.debt);
	}

	_borrowableTinyIncrement() {
		return Math.max(5, Math.floor(this._borrowable() / 50));
	}

	_borrowableMediumIncrement() {
		return Math.max(2 * this._borrowableTinyIncrement(), Math.floor(this._borrowable() / 10));
	}

	_tinyLoanPressed() {
		this._borrowAmount(this._borrowableTinyIncrement());
	}

	_mediumLoanPressed() {
		this._borrowAmount(this._borrowableMediumIncrement());
	}

	_maxLoanPressed() {
		this._borrowAmount(this._borrowable());
	}

	_borrowAmount(amount) {
		const commander = this._game.commander;
		amount = Math.min(this._borrowable(), amount);
    commander.credits = commander.credits + amount
    commander.debt = commander.debt + amount
    this._game.save()
		this.presentView()
	}

  _remindLoansValueChanged(event) {
    console.log(`Remind loans checkbox value changed: ${event.target.checked}`);
    this._game.remindLoans = event.target.checked
    this._game.save();
  }
}
