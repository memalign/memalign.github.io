const SSSTRosterSectionType = {
    Commander: 0,
    Crew: 1,
    ForHire: 2,
};

class SSSTPersonnelRosterViewController {
  constructor(div, game) {
    this.div = div
    this._game = game
  }

  presentView() {
    const containerDiv = this.div
    containerDiv.innerHTML = '';

    MAUtils.createElement('h1', { textContent: 'Personnel Roster' }, containerDiv);

    const table = document.createElement('table');
    table.classList.add('tight-table-collapse')

    this._populateCrewRows("Commander", SSSTRosterSectionType.Commander, [this._game.commander], 1, table)

    let crew = this._game.commander.ship.crew
    crew = crew ? crew : []
    this._populateCrewRows("Crew Quarters", SSSTRosterSectionType.Crew, crew, this._game.commander.ship.model.mercenaryQuarters(), table)

    const mercenary = this._game.commander.currentSystem.mercenary
    const alreadyInCrew = crew.includes(mercenary)
    console.log("mercenary: " + mercenary + " " + (mercenary ? mercenary.name : ""))
    const forHire = mercenary && !alreadyInCrew ? [mercenary] : []

    this._populateCrewRows("For Hire", SSSTRosterSectionType.ForHire, forHire, forHire.length, table)

    containerDiv.appendChild(table);
  }

  _createRow(cols, colSpan) {
    const row = document.createElement('tr');

    let cellIndex = 0
    for (const col of cols) {
      const cell = document.createElement('td');
      if (col) {
        if (typeof col === 'string' || col instanceof String) {
          cell.innerText = col;
        } else {
          cell.appendChild(col);
        }
      }

      if (cols.length === 1 && colSpan) {
        cell.colSpan = colSpan;
      }

      if (cellIndex > 0) {
        cell.classList.add('centered-cell')
      }

      row.appendChild(cell);

      cellIndex++
    }

    return row;
  }

	_crewSkillTable(crewMember) {
		const table = document.createElement('table');
    table.classList.add('crew-skill-table')

		const row1 = document.createElement('tr');
		const pilotLabelCell = document.createElement('td');
		pilotLabelCell.textContent = 'Pilot';
		row1.appendChild(pilotLabelCell);
		const pilotCell = document.createElement('td');
		pilotCell.textContent = crewMember.pilot;
		row1.appendChild(pilotCell);
		table.appendChild(row1);

		const row2 = document.createElement('tr');
		const fighterLabelCell = document.createElement('td');
		fighterLabelCell.textContent = 'Fighter';
		row2.appendChild(fighterLabelCell);
		const fighterCell = document.createElement('td');
		fighterCell.textContent = crewMember.fighter;
		row2.appendChild(fighterCell);
		table.appendChild(row2);

		const row3 = document.createElement('tr');
		const traderLabelCell = document.createElement('td');
		traderLabelCell.textContent = 'Trader';
		row3.appendChild(traderLabelCell);
		const traderCell = document.createElement('td');
		traderCell.textContent = crewMember.trader;
		row3.appendChild(traderCell);
		table.appendChild(row3);

		const row4 = document.createElement('tr');
		const engineerLabelCell = document.createElement('td');
		engineerLabelCell.textContent = 'Engineer';
		row4.appendChild(engineerLabelCell);
		const engineerCell = document.createElement('td');
		engineerCell.textContent = crewMember.engineer;
		row4.appendChild(engineerCell);
		table.appendChild(row4);

		return table
	}

  _populateCrewRows(title, sectionType, crewMembers, crewSlots, table) {
    const tableColCount = 2
		// Section header
    {
      const row = this._createRow([title], tableColCount);
      row.className = 'section-label';
      table.appendChild(row);
    }

    if (crewSlots === 0) {
      const nameDiv = document.createElement('div');
      nameDiv.textContent = 'None'
      const icon = document.createElement('img')
      icon.classList.add('roster-icon-box')
      let iconName = 'noslots'

      icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
      nameDiv.prepend(icon)

      const row = this._createRow([nameDiv], tableColCount)
      table.appendChild(row);
    } else {

      for (const crewMember of crewMembers) {
        const showPrice = sectionType != SSSTRosterSectionType.Commander && !crewMember.forQuest
        const name = (showPrice ? `${crewMember.name} ($${crewMember.hirePrice()}/day)` : crewMember.name)

        const skillTable = crewMember.forQuest ? null : this._crewSkillTable(crewMember)

        const hideButton = (sectionType === SSSTRosterSectionType.Commander) || crewMember.forQuest

        let hireFireButton = '';
        if (!hideButton) {
          const enableButton = sectionType === SSSTRosterSectionType.Crew || this._game.commander.ship.model.mercenaryQuarters() > this._game.commander.ship.crewCount()

          hireFireButton = document.createElement('button');
          const buttonIsFire = sectionType === SSSTRosterSectionType.Crew
          hireFireButton.innerText = buttonIsFire ? "Fire" : "Hire";
          hireFireButton.id = MAUtils.sanitizedElementID("hireFire_" + crewMember.name)
          actionLog.registerButtonEventListener(hireFireButton, 'click', () => {
            if (buttonIsFire) {
              this._game.commander.ship.removeCrewMember(crewMember)
              if (this.delegate) {
                this.delegate.personnelRosterViewControllerDidFire(this, crewMember)
              }
            } else {
              this._game.commander.ship.addCrewMember(crewMember)
            }
            this._game.save()
            this.presentView()
          });
          hireFireButton.disabled = !enableButton
        }

				const nameDiv = document.createElement('div');
				nameDiv.textContent = name
        const icon = document.createElement('img')
        icon.classList.add('roster-icon')
        let iconName = 'commander'
        if (sectionType === SSSTRosterSectionType.Crew) {
          iconName = 'roster'
        } else if (sectionType === SSSTRosterSectionType.ForHire) {
          iconName = 'forhire'
        }

        icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
        nameDiv.prepend(icon)

				if (skillTable) {
					nameDiv.appendChild(skillTable)
				}

        const row = this._createRow([nameDiv, hireFireButton]);
        row.id = `personnelRow-${crewMember.name}`
        table.appendChild(row);
      }

      console.log("crew slots: " + crewSlots)
      const openSlots = crewSlots - crewMembers.length
      for (let i = 0; i < openSlots; i++) {
        const nameDiv = document.createElement('div');
        nameDiv.textContent = 'Vacancy'
        const icon = document.createElement('img')
        icon.classList.add('roster-icon-box')
        let iconName = 'empty'
        icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
        nameDiv.prepend(icon)

        const row = this._createRow([nameDiv], tableColCount)
        table.appendChild(row);
      }
    }
  }
}
