const systemLandingOptionsDivID = "systemLandingOptionsDiv";

class SSSTSystemLandingViewController {
  constructor(div) {
    this.div = div
  }

  updateWithGame(game) {
    console.log("SystemLandingViewController updateWithGame: " + game);
    pLog.log(26)

    if (game === this._game) { return; }

    this._game = game;

    if (!this._game) { return; }

    // Tear down and recreate this view controller's content
    this.presentView();
  }

  _tableRows() {
    const tableRows = ["Special",
                       "News",
                       "For Hire", // Mercenary for Hire
                       "Buy", // Buy Cargo
                       "Sell", // Sell Cargo
                       "Equipment", // Buy and Sell Equipment
                       "Warp",
                       "Ship Yard",
                       "Bank",
                       "Roster", // Personnel Roster
                       "Commander", // Commander Status
                       "Chart",
    ]

    const currentSystemMercenary = this._game.commander.getCurrentSystem().mercenary;
    const crew = this._game.commander.ship.crew;
    if (!currentSystemMercenary || (crew && crew.includes(currentSystemMercenary))) {
      const index = tableRows.indexOf("For Hire");
      if (index !== -1) {
        pLog.log(27)
        tableRows.splice(index, 1);
      }
    }

    const specialEvent = this._game.commander.getCurrentSystem().getSpecialEvent();
    const specialEventTypeToSpecifier = SSSTSpecialEventSpecifier.specialEventTypeToSpecifier();
    const shouldHideBlock = specialEventTypeToSpecifier.get(specialEvent) && specialEventTypeToSpecifier.get(specialEvent).shouldHideBlock;

    if (specialEvent === SSSTSpecialEvent.None || (shouldHideBlock && shouldHideBlock(this._game))) {
      const index = tableRows.indexOf("Special");
      if (index !== -1) {
        pLog.log(28)
        tableRows.splice(index, 1);
      }
    }

    return tableRows
  }

  _clearedSubContentDiv() {
    const elID = "systemLandingSubContentDiv";
    let contentDiv = document.getElementById(elID);
    if (!contentDiv) {
      contentDiv = document.createElement('div');
      contentDiv.id = elID;
      this.div.appendChild(contentDiv);
    }

    contentDiv.innerHTML = '';

    return contentDiv
  }

  handleRowClick(row) {
    MAUtils.maintainScrollPosition(() => {
      this._handleRowClick(row)
    })
  }

  _handleRowClick(row) {
    console.log(`Row clicked: ${row}`);

    const contentDiv = this._clearedSubContentDiv()

    if (row === "Chart") {
      pLog.log(0)
      const viewController = new SSSTGalacticChartViewController(contentDiv, this._game)
      viewController.delegate = this
      viewController.presentView()
    } else if (row === "Buy") {
      pLog.log(1)
      const viewController = new SSSTBuySellCargoViewController(contentDiv, this._game, true);
      viewController.presentView();
    } else if (row === "Sell") {
      pLog.log(2)
      const viewController = new SSSTBuySellCargoViewController(contentDiv, this._game, false);
      viewController.presentView();
    } else if (row === "Warp") {
      pLog.log(3)
      if (!this._galaxyViewSystem) {
        pLog.log(4)
        const closeSystems = SSSTWarpViewController.systemsWithinRange(this._game)
        this._galaxyViewSystem = closeSystems.length > 0 ? closeSystems[0] : null
        this._galaxyViewWormhole = false
        if (this._galaxyViewSystem && this._game.commander.currentSystem.wormhole === this._galaxyViewSystem) {
          pLog.log(5)
          this._galaxyViewSystem = this._game.commander.currentSystem
          this._galaxyViewWormhole = true
        }

        if (this._galaxyViewSystem) {
          pLog.log(6)
          this._galaxyView.selectSystem(this._galaxyViewSystem, this._galaxyViewWormhole)
          return // galaxyView.selectSystem invokes delegate method that will call back into handleRowClick
        }
      }

      pLog.log(7)
      const warpSystem = this._galaxyViewWormhole ? this._galaxyViewSystem.wormhole : this._galaxyViewSystem

      const viewController = new SSSTWarpViewController(contentDiv, this._game, warpSystem);
      viewController.delegate = this;
      viewController.presentView();
    } else if (row === "Equipment") {
      pLog.log(8)
      const viewController = new SSSTEquipmentViewController(contentDiv, this._game);
      viewController.presentView();
    } else if (row === "Ship Yard") {
      pLog.log(9)
      const viewController = new SSSTShipYardViewController(contentDiv, this._game);
			viewController.delegate = this;
      viewController.presentView();
    } else if (row === "For Hire" || row === "Roster") {
      pLog.log(10)
      const viewController = new SSSTPersonnelRosterViewController(contentDiv, this._game);
      viewController.delegate = this
      viewController.presentView();
    } else if (row === "News") {
      pLog.log(11)
      // To avoid the news changing between viewings, use one instance
      if (!this._newsViewController) {
        this._newsViewController = new SSSTNewsViewController(contentDiv, this._game);
      }
      this._newsViewController.div = contentDiv; // changes after a warp
      this._newsViewController.presentView();
    } else if (row === "Bank") {
      pLog.log(12)
      const viewController = new SSSTBankViewController(contentDiv, this._game);
      viewController.presentView();
    } else if (row === "Commander") {
      pLog.log(13)
      const viewController = new SSSTCommanderStatusViewController(contentDiv, this._game);
      viewController.delegate = this
      viewController.presentView();
    } else if (row === "Special") {
      pLog.log(14)
      const specialEventTypeToSpecifier = SSSTSpecialEventSpecifier.specialEventTypeToSpecifier()
      const specialEventType = this._game.commander.getCurrentSystem().getSpecialEvent()
      const specialEventSpecifier = specialEventTypeToSpecifier.get(specialEventType)

      const acceptEventAction = () => {
        if (this._game.commander.spendingMoney() < specialEventSpecifier.price) {
          pLog.log(15)
          SSSTAlertViewController.presentAlertWithDismiss("You don't have enough cash to accept this offer.")
        } else {
          pLog.log(16)
          this._game.commander.setCredits(this._game.commander.getCredits() - specialEventSpecifier.price);

          if (specialEventSpecifier.action) {
            pLog.log(17)
            specialEventSpecifier.action(this._game, this);
            this._game.save();
            this.presentView()
          }
        }
      };

      console.log("Special event specifier: " + specialEventSpecifier)
      console.log("Special event name: " + specialEventSpecifier.name)
      console.log("Special event prompt: " + specialEventSpecifier.prompt)

      let aC = new SSSTAlertViewController(specialEventSpecifier.prompt)

      if (specialEventSpecifier.messageOnly) {
        aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
          pLog.log(18)
          acceptEventAction();
        })

      } else {
        aC.addAction("Yes", SSSTAlertActionType.Default, () => {
          pLog.log(19)
          acceptEventAction();
        })

        aC.addAction("No", SSSTAlertActionType.Cancel, () => {
          pLog.log(20)
        })
      }

      aC.presentView()
    }
  }

  presentView() {
    MAUtils.maintainScrollPosition(() => {
      this._presentView()
    })
  }

  _presentView() {
    // Clear the div
    this.div.innerHTML = '';

    const contentDiv = document.createElement('div');
    contentDiv.id = systemLandingOptionsDivID
    this.div.appendChild(contentDiv);


    const galaxyViewDiv = document.createElement('div');
    contentDiv.appendChild(galaxyViewDiv);
    this._galaxyView = new SSSTGalaxyView(galaxyViewDiv, this._game, this._game.commander.currentSystem, false, true, true)
    this._galaxyView.delegate = this

    const subVCButtonsDiv = document.createElement('ul')
    subVCButtonsDiv.id = 'subVCButtonsDiv'
    subVCButtonsDiv.classList.add('systemLandingButtons')
    contentDiv.appendChild(subVCButtonsDiv)

    this._subVCButtons = []
    this._updateSubVCButtons()

    const subContentDiv = this._clearedSubContentDiv()

    const welcomeH = MAUtils.createElement('h1', { textContent: 'Welcome to ' + this._game.commander.getCurrentSystem().getName() }, subContentDiv);
    welcomeH.id = 'system-info-welcome'
    welcomeH.classList.add('centered-div')
    welcomeH.classList.add('system-info-header')

    const cS = this._game.commander.currentSystem
    const resourceText = cS.systemInfoString()
    const systemInfoEl = document.createElement('h4')
    subContentDiv.appendChild(systemInfoEl)
    systemInfoEl.id = 'system-info-text'
    systemInfoEl.classList.add('system-info')
    systemInfoEl.classList.add('centered-div')
    systemInfoEl.classList.add('centered')
    systemInfoEl.innerText = resourceText
  }

  _updateSubVCButtons() {
    const subVCButtonsDiv = document.getElementById('subVCButtonsDiv')
    if (!subVCButtonsDiv) { return }

    const activeButtons = this._subVCButtons.filter(x => x.classList.contains('active'))
    let activeButtonID = activeButtons.length > 0 ? activeButtons[0].id : null

    subVCButtonsDiv.innerHTML = ''

    const tableRows = this._tableRows();

    tableRows.forEach(row => {
      const button = document.createElement('li')
      button.classList.add('button-item')
      subVCButtonsDiv.appendChild(button)

      const a = document.createElement('a');
      a.id = row;
      a.classList.add('button-link')
      a.href = '#'; // Use # to make the link focusable/clickable without navigating
      this._subVCButtons.push(a)

      const icon = document.createElement('img')
      const iconClass = row === "Chart" ? 'button-icon-chart' : 'button-icon'
      icon.classList.add(iconClass)
      const iconName = row === "Ship Yard" ? this._game.commander.ship.model.name : row
      icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
      a.appendChild(icon)

      const title = document.createElement('span')
      title.textContent = row
      a.appendChild(title)

      button.appendChild(a)

      // Add click event listener
      actionLog.registerAEventListener(a, 'click', (event) => {
        event.preventDefault(); // Prevent the default link behavior

        this._subVCButtons.forEach(btn => btn.classList.remove('active'))

        if (a.id !== "Special") {
          a.classList.add('active')
        }

        this.handleRowClick(row);
      });

      if (a.id === activeButtonID) {
        a.classList.add('active')
      }

      subVCButtonsDiv.appendChild(a);
    });
  }

  gameDidEndWithStatus(st) {
    pLog.log(21)
    this.delegate.systemLandingViewControllerGameDidEndWithStatus(this, st)
  }

// SSSTWarpViewController delegate
  warpControllerGetGalaxyViewSystem(wc) {
    return this._galaxyViewWormhole ? this._galaxyViewSystem.wormhole : this._galaxyViewSystem
  }

  warpControllerSelectedSystem(wc, s) {
    console.log("warp selected system: " + s)
    const isWormhole = this._game.commander.currentSystem.wormhole === s
    const selectedSystem = isWormhole ? this._game.commander.currentSystem : s
    this._galaxyView.selectSystem(selectedSystem, isWormhole)
  }

  warpControllerWillBeginWarp(wc) {
    // Hide the SystemLanding UI since we only want to see the travel UI
    const el = document.getElementById(systemLandingOptionsDivID)
    if (el) {
      el.remove()
    }
  }

  warpControllerCompletedWarp(wc) {
    this._galaxyViewSystem = null
    this._galaxyViewWormhole = false
    this._game.save()
    this.presentView()
  }

  warpControllerGameDidEndWithStatus(wc, st) {
    this.gameDidEndWithStatus(st)
  }

  warpControllerDidBuyFuel(wc) {
    pLog.log(22)
    this.handleRowClick("Warp")
  }


// SSSTShipYardViewController delegate

	shipYardViewControllerDidBuyFuel(syVC) {
    // GalaxyView automatically picks up on the expanded range so no need to forward this callback
	}


// SSSTGalacticChartViewController delegate

  galacticChartViewControllerWarpViaSingularity(vc, solarSystem) {
    pLog.log(23)
    const contentDiv = this._clearedSubContentDiv()
    const viewController = new SSSTWarpViewController(contentDiv, this._game)
    viewController.delegate = this;
    viewController.presentView();
    SSSTWarpViewController.warpWithGame(this._game, true, solarSystem, viewController);
  }

// SSSTCommanderStatusViewController delegate

  clearAllHighScoringGames() {
    this.delegate.clearAllHighScoringGames()
  }

  highScoringGamesWithinCount(c) {
    return this.delegate.highScoringGamesWithinCount(c)
  }

  endGameViewControllerWantsContinue(vc) {
    pLog.log(23)
    this.delegate.endGameViewControllerWantsContinue(vc)
  }

// SSSTPersonnelRosterViewController delegate

  personnelRosterViewControllerDidFire(vc, crewMember) {
    const currentSystemMercenary = this._game.commander.currentSystem.mercenary;
    if (currentSystemMercenary === crewMember) {
      pLog.log(47)
      this._updateSubVCButtons()
    }
  }

// SSSTGalaxyView delegate

  galaxyViewSelectedSolarSystem(gv, solarSystem, wormhole) {
    this._galaxyViewSystem = solarSystem
    this._galaxyViewWormhole = wormhole
    this._subVCButtons.forEach(btn => {
      if (btn.id === "Warp") {
        pLog.log(24)
        btn.classList.add('active')
      } else {
        pLog.log(25)
        btn.classList.remove('active')
      }
    })
    this.handleRowClick("Warp")
  }
}
