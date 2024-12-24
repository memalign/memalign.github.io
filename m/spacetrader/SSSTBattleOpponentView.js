
class SSSTBattleOpponentView {
  constructor(div, ship, isEnemy, enableCrossfade) {
    this.div = div
    this.ship = ship
    this._enableCrossfade = enableCrossfade
    this._isEnemy = isEnemy

    this._setupView()
  }

  _setupView() {
    const contentDiv = document.createElement('div')
    contentDiv.classList.add('battle-opponent')
    if (this._enableCrossfade) {
      contentDiv.classList.add('battle-opponent-crossfade')
      contentDiv.classList.add('fade-in')
    }
    this.div.appendChild(contentDiv)
    this._contentDiv = contentDiv

    console.log("setupView")
    // Ship
    const imgEl = document.createElement('img')
    imgEl.classList.add('full-width-img')
    if (this._isEnemy) {
      imgEl.classList.add('flipped')
    }
    imgEl.src = this.ship.model.shipImage.generatePNG(3)

    contentDiv.appendChild(imgEl)

    // HP meter
    this._hpContainer = document.createElement('div')
    this._hpContainer.classList.add('hp-container')
    this._hpContainer.id = `battle-hpContainer-${this._isEnemy ? "enemy" : "self"}-${this.ship.model.name}`
    contentDiv.appendChild(this._hpContainer)

    this._hpBar = document.createElement('div')
    this._hpBar.classList.add('hp-bar')
    this._hpBar.id = `battle-hpBar-${this._isEnemy ? "enemy" : "self"}`
    this._hpContainer.appendChild(this._hpBar)
    this._hpContainer.style.visibility = this.ship.model.hullStrength === 0 ? "hidden" : "visible"

    // Shield meter
    this._shieldContainer = document.createElement('div')
    this._shieldContainer.classList.add('shield-container')
    contentDiv.appendChild(this._shieldContainer)
    this._shieldContainer.style.visibility = this.ship.hasAnyShield() ? "visible" : "hidden"

    this._shieldBar = document.createElement('div')
    this._shieldBar.classList.add('shield-bar')
    this._shieldContainer.appendChild(this._shieldBar)

    this._setHPPercentage()

    // Trigger fade-in
    setTimeout(() => {
      contentDiv.classList.add('visible')
    }, 10)
  }

  fadeOutAndRemove() {
    if (!this._contentDiv) { return }

    this._contentDiv.classList.remove('visible')
    setTimeout(() => {
      if (this._contentDiv) {
        this._contentDiv.remove()
        this._contentDiv = null
      }
    }, 2000)
  }

  _setHPPercentage() {
    const hp = this.ship.hullPercentage()
    const width = this._hpContainer.getBoundingClientRect().width
    const newWidth = hp * width
    this._hpBar.style.width = `${newWidth}px`

    const sp = this.ship.shieldPercentage()
    const swidth = this._shieldContainer.getBoundingClientRect().width
    const newSWidth = sp * swidth
    this._shieldBar.style.width = `${newSWidth}px`
  }

  updateHPPercentage() {
    // Add animation
    this._hpBar.classList.add('bar-width-transition')
    this._shieldBar.classList.add('bar-width-transition')

    this._setHPPercentage()
  }
}
