class SSSTActionLogger {
  constructor(gameRandSeed) {
    this._gameRandSeed = gameRandSeed
    this._idLog = []
    this._eventNameLog = []
    this.logUpdateHandler = null
    this.registerEventHandler = null
    this.replayInProgress = false
    this.replayInProgressQueueAsyncClosures = false
    this.asyncClosureQueue = null
    this._namedEvents = []
  }

  _logUpdated() {
    if (this.logUpdateHandler) {
      this.logUpdateHandler(this)
    }
  }

  _registerEvent(elementID, eventName) {
    if (this.registerEventHandler) {
      this.registerEventHandler(elementID, eventName)
    }
  }

  performAsync(handler, delay) {
    if (this.replayInProgressQueueAsyncClosures) {
      if (!this.asyncClosureQueue) {
        this.asyncClosureQueue = []
      }

      this.asyncClosureQueue.push(handler)
    } else if (this.replayInProgress) {
      handler()
    } else {
      setTimeout(() => {
        handler()
      }, delay);
    }
  }

  registerButtonEventListener(button, eventName, handler) {
    this._registerEvent(button.id, eventName)

    button.addEventListener(eventName, () => {
      console.log("Button invoked: " + button.id + " \"" + button.textContent + "\"")
      if (!button.id) {
        throw "ActionLogger requires button to have unique id"
      }
      this._idLog.push(button.id)
      this._eventNameLog.push(eventName)
      this._logUpdated()
      handler()
    })
  }

  registerAEventListener(a, eventName, handler) {
    this._registerEvent(a.id, eventName)

    a.addEventListener(eventName, (event) => {
      console.log("Link invoked: " + a.id + " \"" + a.textContent + "\"")
      if (!a.id) {
        throw "ActionLogger requires a element to have unique id"
      }
      this._idLog.push(a.id)
      this._eventNameLog.push(eventName)
      this._logUpdated()
      handler(event)
    })
  }

  registerCheckboxEventListener(checkbox, eventName, handler) {
    this._registerEvent(checkbox.id, eventName)

    checkbox.addEventListener(eventName, (event) => {
      console.log("Checkbox invoked: " + checkbox.id)
      if (!checkbox.id) {
        throw "ActionLogger requires checkbox element to have unique id"
      }
      this._idLog.push(checkbox.id)
      this._eventNameLog.push(eventName)
      this._logUpdated()
      handler(event)
    })
  }

  registerSliderEventListener(slider, eventName, handler) {
    this._registerEvent(slider.id, "slider|" + eventName)

    slider.addEventListener(eventName, () => {
      console.log("Slider changed: " + slider.id + " \"" + slider.value + "\"")
      if (!slider.id) {
        throw "ActionLogger requires slider element to have unique id"
      }
      this._idLog.push(slider.id)
      this._eventNameLog.push("slider|" + eventName + "|" + slider.value)
      this._logUpdated()
      handler()
    })
  }

  registerSelectEventListener(select, eventName, handler) {
    this._registerEvent(select.id, "select|" + eventName)

    select.addEventListener(eventName, () => {
      console.log("Select changed: " + select.id + " \"" + select.selectedIndex + "\"")
      if (!select.id) {
        throw "ActionLogger requires select element to have unique id"
      }
      this._idLog.push(select.id)
      this._eventNameLog.push("select|" + eventName + "|" + select.selectedIndex)
      this._logUpdated()
      handler()
    })
  }

  registerNamedEventListener(handlerObject, eventName) {
    console.log("registering named event listener for: " + eventName)
    this._namedEvents[eventName] = handlerObject
  }

  logNamedEvent(eventName, eventContext) {
    // this._registerEvent(...) - not implemented

    this._idLog.push("namedEvent")
    this._eventNameLog.push(eventName + "|" + eventContext)
    this._logUpdated()
  }

  serializedString() {
    return JSON.stringify({
      idLog: this._idLog,
      eventNameLog: this._eventNameLog,
      gameRandSeed: this._gameRandSeed
    })
  }
}

class SSSTActionLogReplay {
  // hackHandler is an optional function that will be invoked before every
  // replayed event, taking this.spaceTraderGame as an argument.
  constructor(serializedString, spaceTraderGame, hackHandler /* optional */) {
    const obj = JSON.parse(serializedString)
    this.spaceTraderGame = spaceTraderGame
    this._gameRandSeed = obj.gameRandSeed
    this._idLog = obj.idLog
    this._eventNameLog = obj.eventNameLog
    this._hackHandler = hackHandler
  }

  replay() {
    console.log("Starting action log replay")
    actionLog._gameRandSeed = this._gameRandSeed
    actionLog.replayInProgress = true
    console.log("Replacing gameRand instance with action log seed")
    gameRand = new MAGameRand(this._gameRandSeed)

    const len = this._idLog.length
    console.log(`Replaying ${len} actions...`)
    for (let i = 0; i < len; i++) {
      const elID = this._idLog[i]
      const eventName = this._eventNameLog[i]

      console.log(`Replay[${i}] ${eventName} ${elID}`)
      this.replayEvent(elID, eventName)
    }
    console.log("Finished action log replay")
    actionLog.replayInProgress = false
  }

  replayEvent(elementID, eventName) {
    eventName = eventName ? eventName : "click"
    this.constructor.replayEvent(elementID, eventName, this.spaceTraderGame, this._hackHandler)
  }

  static replayEvent(elementID, eventName, spaceTraderGame, hackHandler) {
    actionLog.replayInProgress = true // force async to happen immediately from now on

    if (hackHandler) {
      hackHandler(spaceTraderGame)
    }

    if (elementID === "namedEvent") {
      const eventComponents = eventName.split(/\|/);
      const actualEventName = eventComponents[0]
      const eventContext = eventComponents[1]

      const handlerObj = actionLog._namedEvents[actualEventName]
      handlerObj.handleNamedEvent(actualEventName, eventContext)
      actionLog.logNamedEvent(actualEventName, eventContext)
    } else {
      const element = document.getElementById(elementID)
      if (!element) {
        console.log(`Did not find element for ${elementID}. EventName: ${eventName}`)
        console.log(`Current replayLog: ${actionLog.serializedString()}`)
      }
      MAUtils.ensureType(element, "object")

      if (eventName.startsWith("slider")) {
        const eventComponents = eventName.split(/\|/);
        const actualEventName = eventComponents[1]
        const sliderValue = eventComponents[2]
        element.value = sliderValue
        let inputEvent = new Event(actualEventName)
        element.dispatchEvent(inputEvent)
      } else if (eventName.startsWith("select")) {
        const eventComponents = eventName.split(/\|/);
        const actualEventName = eventComponents[1]
        const selectedIndex = eventComponents[2]
        element.selectedIndex = selectedIndex
        let inputEvent = new Event(actualEventName)
        element.dispatchEvent(inputEvent)
      } else if (eventName === "click") {
        element.click()
      } else if (eventName === "change") {
        element.checked = !element.checked
        let changeEvent = new Event('change')
        element.dispatchEvent(changeEvent)
      }
    }
  }
}
