class SSSTGalacticChartViewController {
  constructor(div, game) {
    this.div = div
    this._game = game

    this._sortedSolarSystems = this._game.solarSystems.sort((a, b) => {
      if (a.name < b.name) {
        return -1
      }
      if (a.name > b.name) {
        return 1
      }
      return 0
    })

    this._selectedSystem = this._game.commander.currentSystem
    this._selectedWormhole = false
  }

  presentView() {
    MAUtils.maintainScrollPosition(() => {
      this._presentView()
    })
  }

  _presentView() {
    const containerDiv = this.div
    containerDiv.innerHTML = '';

    MAUtils.createElement('h1', { textContent: 'Galactic Chart' }, containerDiv);

    const galaxyViewDiv = document.createElement('div');
    containerDiv.appendChild(galaxyViewDiv);
    const galaxyView = new SSSTGalaxyView(galaxyViewDiv, this._game, this._selectedSystem, this._selectedWormhole, false, true)
    galaxyView.delegate = this

    {
      const systemToShow = this._selectedWormhole ? this._selectedSystem.wormhole : this._selectedSystem
      const table = this._createTableForSolarSystems([ systemToShow ], "Selected System")
      containerDiv.appendChild(table);
    }


    {
      const table = this._createTableForSolarSystems(this._sortedSolarSystems)
      containerDiv.appendChild(table);
    }

  }

  _createTableForSolarSystems(solarSystems, systemHeader) {
    systemHeader = systemHeader ? systemHeader : "System List"

    // Create the table element
    const table = document.createElement('table');
    table.classList.add('tight-table')

    // Create the table header
    const headerRow = document.createElement('tr');
    const colCount = 2
    const th = document.createElement('th');
    th.innerText = systemHeader;
    th.colSpan = colCount;
    headerRow.appendChild(th);
    table.appendChild(headerRow);

    // Create rows for each solar system
    for (let solarSystem of solarSystems) {
      const row = document.createElement('tr');

      // Name column
      const nameCell = document.createElement('td');
      const systemName = solarSystem.name

      let cheatStr = ""

      if (this._game.showSpecialSystems && solarSystem.specialEvent != SSSTSpecialEvent.None) {
        const specialEventTypeToSpecifier = SSSTSpecialEventSpecifier.specialEventTypeToSpecifier()
        const specialEventType = solarSystem.specialEvent
        const specialEventSpecifier = specialEventTypeToSpecifier.get(specialEventType)
        cheatStr = `\nSpecial: ${specialEventSpecifier.name}`
      }

      nameCell.innerHTML = `<b>${systemName}</b>\n${SYSTEM_SIZE_STR(solarSystem.size).toLowerCase()} ${TECH_LEVEL_STR(solarSystem.techLevel).toLowerCase()} ${solarSystem.politics.name.toLowerCase()}\n${solarSystem.distanceTo(this._game.commander.currentSystem)} parsecs${cheatStr}`.replace(/\n/g, '<br>')
      row.appendChild(nameCell);

      // Actions column
      const actionsCell = document.createElement('td');
      actionsCell.style.textAlign = "center"

			const trackButton = document.createElement('button');
			trackButton.innerText = (this._game.trackedSystem === solarSystem) ? `Untrack` : `Track`
      trackButton.id = MAUtils.sanitizedElementID("galacticChart_track_" + solarSystems.length + "_" + systemName)
      actionLog.registerButtonEventListener(trackButton, 'click', () => {
        if (this._game.trackedSystem === solarSystem) {
          this._game.trackedSystem = null
        } else {
          this._game.trackedSystem = solarSystem
        }
        this._game.save()
        this.presentView()
			});
			actionsCell.appendChild(trackButton);

      if (this._game.canSuperWarp) {
        actionsCell.appendChild(document.createElement('br'));
        const singularityButton = document.createElement('button');
        singularityButton.innerText = `Use Singularity`
        singularityButton.id = MAUtils.sanitizedElementID("galacticChart_useSingularity_" + solarSystems.length + "_" + systemName)
        singularityButton.disabled = solarSystem === this._game.commander.currentSystem
        actionLog.registerButtonEventListener(singularityButton, 'click', () => {
          let aC = new SSSTAlertViewController(`Use your Portable Singularity to warp to ${solarSystem.name}? You can only use it once.`)
          aC.addAction("Warp!", SSSTAlertActionType.Default, () => {
            pLog.log(61)
            this._game.canSuperWarp = false
            this.delegate.galacticChartViewControllerWarpViaSingularity(this, solarSystem)
          })

          aC.addAction("Not now", SSSTAlertActionType.Cancel, null)

          aC.presentView()
        });
        actionsCell.appendChild(singularityButton);
      }

      row.appendChild(actionsCell);

      // Append the row to the table
      table.appendChild(row);
    }

    return table
  }


  // SSSTGalaxyView delegate
  galaxyViewSelectedSolarSystem(gv, solarSystem, wormhole) {
    //console.log("Selected system: " + solarSystem.name + " wormhole: " + wormhole)
    this._selectedSystem = solarSystem
    this._selectedWormhole = wormhole
    this.presentView()
  }
}
