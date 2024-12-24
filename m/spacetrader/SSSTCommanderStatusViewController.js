class SSSTCommanderStatusViewController {
  constructor(div, game) {
    this.div = div
    this._game = game
  }

  _ignorePiratesValueChanged(event) {
    console.log('ignorePirates checkbox value changed to:', event.target.checked);
    this._game.alwaysIgnorePirates = event.target.checked;
    this._game.save();
  }

  _ignorePoliceValueChanged(event) {
    console.log('ignorePolice checkbox value changed to:', event.target.checked);
    this._game.alwaysIgnorePolice = event.target.checked;
    this._game.save();
  }

  _ignoreTradersValueChanged(event) {
    console.log('ignoreTraders checkbox value changed to:', event.target.checked);
    this._game.alwaysIgnoreTraders = event.target.checked;
    this._game.save();
  }

  _ignoreTradeInOrbitValueChanged(event) {
    console.log('ignoreTradeInOrbit checkbox value changed to:', event.target.checked);
    this._game.alwaysIgnoreTradeInOrbit = event.target.checked;
    this._game.save();
  }

  _reserveMoneyValueChanged(event) {
    console.log('Reserve money checkbox value changed to:', event.target.checked);
    this._game.commander.setReserveMoney(event.target.checked);
    this._game.save();
  }

  _giveUpButtonPressed() {
    console.log("Give up button");

    let aC = new SSSTAlertViewController("Give Up?")
    aC.addAction("Abandon game", SSSTAlertActionType.Destructive, () => {
      pLog.log(64)
      this.delegate.gameDidEndWithStatus(SSSTGameEndStatus.Retired)
    })

    aC.addAction("Cancel", SSSTAlertActionType.Cancel, null)

    aC.presentView()
  }

  _showHighScoresButtonPressed() {
    console.log("Show high scores button");
    const highScoresVC = new SSSTEndGameViewController(this.div, this._game, true)
    highScoresVC.delegate = this
    highScoresVC.presentView()
  }

  presentView() {
    this.div.innerHTML = ''
    const containerDiv = document.createElement('div')
    this.div.appendChild(containerDiv)
    containerDiv.classList.add('centered')

    MAUtils.createElement('h1', { textContent: this._game.commander.name }, containerDiv);


		const game = this._game;
		const commander = game.commander;

		// Calculate the adjusted skills
		const adjustedPilot = commander.ship.crewPilotSkillIncludingCommander(commander);
		const adjustedFighter = commander.ship.crewFighterSkillIncludingCommander(commander);
		const adjustedTrader = commander.ship.crewTraderSkillIncludingCommander(commander);
		const adjustedEngineer = commander.ship.crewEngineerSkillIncludingCommander(commander);

		// Create the HTML table
		const table = document.createElement('table');
    table.classList.add('commanderTable')
		const tableHeader = `
		<tr>
				<th></th>
				<th>Skill</th>
				<th>(Plus crew & gadgets)</th>
		</tr>
`;

		const tableContent = `
		<tr>
				<td>Pilot</td>
				<td>${commander.pilot}</td>
				<td>(${adjustedPilot})</td>
		</tr>
		<tr>
				<td>Fighter</td>
				<td>${commander.fighter}</td>
				<td>(${adjustedFighter})</td>
		</tr>
		<tr>
				<td>Trader</td>
				<td>${commander.trader}</td>
				<td>(${adjustedTrader})</td>
		</tr>
		<tr>
				<td>Engineer</td>
				<td>${commander.engineer}</td>
				<td>(${adjustedEngineer})</td>
		</tr>
`;

		// Append the header and content to the table
		table.innerHTML = tableHeader + tableContent;

		containerDiv.appendChild(table);


    containerDiv.appendChild(document.createElement('br'));



		// Create the table element
		const itemsTable = document.createElement('table');
    itemsTable.classList.add('commanderTable')

		// Create an array of items and values
		const itemsAndValues = [
			{ item: 'Time:', value: `${this._game.commander.days} days` },
			{ item: 'Difficulty:', value: DIFFICULTY_STR(this._game.difficulty) },
			{ item: 'Police Record:', value: POLICE_RECORD_STR(this._game.commander.policeRecordScore) },
			{ item: 'Reputation:', value: REPUTATION_STR(this._game.commander.reputationScore) },
			{ item: 'Kills:', value: `${this._game.commander.policeKills + this._game.commander.traderKills + this._game.commander.pirateKills}`, styleClass: 'right-aligned-cell' },
			{ item: 'Cash:', value: `$${this._game.commander.getCredits()}`, styleClass: 'right-aligned-cell' },
			{ item: 'Debt:', value: `$${this._game.commander.getDebt()}`, styleClass: 'right-aligned-cell' },
			{ item: 'Net Worth:', value: `$${this._game.commander.netWorth()}`, styleClass: 'right-aligned-cell'}
		];

		// Create the rows and append them to the table
		itemsAndValues.forEach(entry => {
			const row = document.createElement('tr');

			const itemCell = document.createElement('td');
			itemCell.textContent = entry.item;
			row.appendChild(itemCell);

			const valueCell = document.createElement('td');
      if (entry.styleClass) {
        valueCell.classList.add(entry.styleClass)
      }
			valueCell.textContent = entry.value;
			row.appendChild(valueCell);

			itemsTable.appendChild(row);
		});

		containerDiv.appendChild(itemsTable);


    containerDiv.appendChild(document.createElement('br'));



    MAUtils.createElement('h4', { textContent: "Special Cargo" }, containerDiv);

    const cargoList = this._game.specialCargoDescription()

		const cargoListDiv = document.createElement('div');
    cargoListDiv.id = "cargoListDiv"
		cargoListDiv.innerHTML = cargoList.replace(/\n/g, '<br>');
		containerDiv.appendChild(cargoListDiv);


    containerDiv.appendChild(document.createElement('br'));


    MAUtils.createElement('h4', { textContent: "Open Quests" }, containerDiv);

		const questList = this._game.questListDescription()
		const questListDiv = document.createElement('div');
    questListDiv.id = "questListDiv"
		questListDiv.innerHTML = questList.replace(/\n/g, '<br>');
		containerDiv.appendChild(questListDiv);


    containerDiv.appendChild(document.createElement('br'));


    // Create the checkbox input element
    let checkboxID = "ignorePirates";
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxID;
    checkbox.checked = this._game.alwaysIgnorePirates;
    actionLog.registerCheckboxEventListener(checkbox, 'change', (e) => {
      this._ignorePiratesValueChanged(e)
    });

    // Create the label for the checkbox
    let label = document.createElement('label');
    label.htmlFor = checkboxID;
    label.innerText = 'Ignore pirates when possible';

    // Append the checkbox and label to the container div
    containerDiv.appendChild(checkbox);
    containerDiv.appendChild(label);

    containerDiv.appendChild(document.createElement('br'));


    // Create the checkbox input element
    checkboxID = "ignorePolice";
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxID;
    checkbox.checked = this._game.alwaysIgnorePolice;
    actionLog.registerCheckboxEventListener(checkbox, 'change', (e) => {
      this._ignorePoliceValueChanged(e)
    });

    // Create the label for the checkbox
    label = document.createElement('label');
    label.htmlFor = checkboxID;
    label.innerText = 'Ignore police when possible';

    // Append the checkbox and label to the container div
    containerDiv.appendChild(checkbox);
    containerDiv.appendChild(label);

    containerDiv.appendChild(document.createElement('br'));


    // Create the checkbox input element
    checkboxID = "ignoreTraders";
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxID;
    checkbox.checked = this._game.alwaysIgnoreTraders;
    actionLog.registerCheckboxEventListener(checkbox, 'change', (e) => {
      this._ignoreTradersValueChanged(e)
    });

    // Create the label for the checkbox
    label = document.createElement('label');
    label.htmlFor = checkboxID;
    label.innerText = 'Ignore traders when possible';

    // Append the checkbox and label to the container div
    containerDiv.appendChild(checkbox);
    containerDiv.appendChild(label);

    containerDiv.appendChild(document.createElement('br'));


    // Create the checkbox input element
    checkboxID = "ignoreTradeInOrbit";
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxID;
    checkbox.checked = this._game.alwaysIgnoreTradeInOrbit;
    actionLog.registerCheckboxEventListener(checkbox, 'change', (e) => {
      this._ignoreTradeInOrbitValueChanged(e)
    });

    // Create the label for the checkbox
    label = document.createElement('label');
    label.htmlFor = checkboxID;
    label.innerText = 'Ignore offers to trade in orbit';

    // Append the checkbox and label to the container div
    containerDiv.appendChild(checkbox);
    containerDiv.appendChild(label);

    containerDiv.appendChild(document.createElement('br'));

    // Create the checkbox input element
    checkboxID = "reserveMoney";
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxID;
    checkbox.checked = this._game.commander.getReserveMoney();
    actionLog.registerCheckboxEventListener(checkbox, 'change', (e) => {
      this._reserveMoneyValueChanged(e)
    });

    // Create the label for the checkbox
    label = document.createElement('label');
    label.htmlFor = checkboxID;
    label.innerText = 'Reserve money for recurring costs';

    // Append the checkbox and label to the container div
    containerDiv.appendChild(checkbox);
    containerDiv.appendChild(label);


    containerDiv.appendChild(document.createElement('br'));
    containerDiv.appendChild(document.createElement('br'));


    const showHighScoresButton = document.createElement('button');
    showHighScoresButton.innerText = 'Commander Hall of Fame';
    showHighScoresButton.id = "showhighscores"
    actionLog.registerButtonEventListener(showHighScoresButton, 'click', () => {
      this._showHighScoresButtonPressed()
    });

    containerDiv.appendChild(showHighScoresButton);


    containerDiv.appendChild(document.createElement('br'));


    // Create the "Give Up" button
    const giveUpButton = document.createElement('button');
    giveUpButton.innerText = 'Give Up';
    giveUpButton.id = "giveup"
    actionLog.registerButtonEventListener(giveUpButton, 'click', () => {
      this._giveUpButtonPressed()
    });

    // Append the "Give Up" button to the container div
    containerDiv.appendChild(giveUpButton);
  }

// SSSTEndGameViewController delegate

  clearAllHighScoringGames() {
    this.delegate.clearAllHighScoringGames()
  }

  highScoringGamesWithinCount(c) {
    return this.delegate.highScoringGamesWithinCount(c)
  }

  endGameViewControllerWantsContinue(vc) {
    this.delegate.endGameViewControllerWantsContinue(vc)
  }
}
