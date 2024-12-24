class SSSTEncounterViewController {
  constructor(div, game) {
    this.div = div
    this._game = game
    this.delegate = null
  }

  presentView() {
    const containerDiv = this.div

    const commanderShieldStr = this._game.commander.ship.hasAnyShield() ? ` Shield: ${Math.ceil(this._game.commander.ship.shieldPercentage()*100)}%` : ``
    const commanderStr = `Commander: HP: ${Math.ceil(this._game.commander.ship.hullPercentage()*100)}%${commanderShieldStr}`
    console.log(commanderStr)

    if (!this._battleViewsContainer) {
      this._battleViewsContainer = document.createElement('div')
      this._battleViewsContainer.id = 'battleViewsContainer'
      containerDiv.appendChild(this._battleViewsContainer)
    }

    if (!this._commanderDiv) {
      this._commanderDiv = document.createElement('div');
      this._commanderDiv.classList.add('crossfade-container')
      this._battleViewsContainer.appendChild(this._commanderDiv)

      this._commanderBattleView = new SSSTBattleOpponentView(this._commanderDiv, this._game.commander.ship, false, true)
    } else {
      this._commanderBattleView.updateHPPercentage()
    }


    if (!this._opponentDiv) {
      this._opponentDiv = document.createElement('div');
      this._opponentDiv.classList.add('crossfade-container')
      this._battleViewsContainer.appendChild(this._opponentDiv)
    }

    if (this.delegate) {
      const opponent = this.delegate.encounterViewControllerOpponent(this)

      if (opponent) {
        const opponentShieldStr = opponent.ship.hasAnyShield() ? ` Shield: ${Math.ceil(opponent.ship.shieldPercentage()*100)}%` : ``
        const opponentStr = `Opponent: HP: ${Math.ceil(opponent.ship.hullPercentage()*100)}%${opponentShieldStr}`
        console.log(opponentStr)

        if (!this._opponentBattleView ||
            this._opponentBattleView.ship !== opponent.ship) {
          if (this._opponentBattleView) {
            this._opponentBattleView.fadeOutAndRemove()
          }
          this._opponentBattleView = new SSSTBattleOpponentView(this._opponentDiv, opponent.ship, true, true)
        }

      } else if (this._opponentBattleView) { // No opponent
        this._opponentBattleView.fadeOutAndRemove()
      }
    }

    const dialog = this._text ? this._text : ""
    if (!this._dialogDiv) {
      this._dialogDiv = document.createElement('div');
      this._dialogDiv.id = "eVC_dialog"
      containerDiv.appendChild(this._dialogDiv)
    }
    this._dialogDiv.innerHTML = dialog.replace(/\n/g, '<br>');

    if (!this._buttonsDiv) {
      this._buttonsDiv = document.createElement('div');
      this._buttonsDiv.id = "buttonsDiv";
      containerDiv.appendChild(this._buttonsDiv);
    }

    this._updateButtons(this._buttonsDiv)
  }

  _updateButtons(buttonsDiv) {
    buttonsDiv.innerHTML = '';

    const buttonTitles = this._buttonTitles ? this._buttonTitles : []

    const battleButtonsDiv = document.createElement('ul')
    battleButtonsDiv.classList.add('battleButtons')
    buttonsDiv.appendChild(battleButtonsDiv)

    buttonTitles.forEach(row => {
      const button = document.createElement('li')
      button.classList.add('battle-button-item')
      battleButtonsDiv.appendChild(button)

      const a = document.createElement('a');
      a.id = MAUtils.sanitizedElementID("ecButton_" + row)
      a.classList.add('battle-button-link')
      a.href = '#'; // Use # to make the link focusable/clickable without navigating

      const icon = document.createElement('img')
      const iconClass = 'battle-button-icon'
      icon.classList.add(iconClass)
      const iconName = row
      icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
      a.appendChild(icon)

      const title = document.createElement('span')
      title.textContent = row
      a.appendChild(title)

      button.appendChild(a)

      // Add click event listener
      actionLog.registerAEventListener(a, 'click', (event) => {
        event.preventDefault(); // Prevent the default link behavior

        this.delegate.encounterViewControllerDidSelectAction(this, row)
      });

      battleButtonsDiv.appendChild(a);
    });
  }

  updateAnimated(animated) {
    this.presentView()
  }

  updateHPViewsAnimated(animated) {
    this._commanderBattleView.updateHPPercentage()
    this._opponentBattleView.updateHPPercentage()
  }

  setText(t) {
    this._text = t
    this.presentView()
  }

  setButtonTitles(buttonTitles) {
    this._buttonTitles = buttonTitles
    this.presentView()
  }
}
