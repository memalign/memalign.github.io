
// Implementations of DOM classes that work in Node.js, for unit tests

class MAHTMLElement {
  constructor() {
    this.parentEl = null;
    this.children = [];

    this.classList = (() => {
      let list = [];
      return {
        add: function(item) { if (!list.includes(item)) { list.push(item) } },
        remove: function(item) { list = list.filter(x => x !== item) },
        contains: function(item) { return list.includes(item) }
      };
    })();

    this.style = { };
  }

  appendChild(child) {
    child.parentEl = this;
    this.children.push(child);
  }

  removeChild(child) {
    if (child.parentEl === this) {
      child.parentEl = null;
    }
    this.children = this.children.filter(x => x !== child)
  }

  remove() {
    if (this.parentEl) {
      this.parentEl.removeChild(this);
    }
  }

  set innerHTML(str) {
    if (str !== "") {
      MAUtils.handleFatalError("MADocument does not support arbitrary innerHTML")
    } else {
      this.children = []
    }
  }

  get textContent() {
    return this.innerText
  }

  set textContent(t) {
    this.innerText = t
  }

  getElementById(elID) {
    for (const child of this.children) {
      if (child && child.id === elID) {
        return child;
      }

      const found = child ? child.getElementById(elID) : null;
      if (found) {
        return found
      }
    }
    return null;
  }

  addEventListener(eventName, handler) {
    if (!this.eventHandlers) {
      this.eventHandlers = []
    }

    if (this.eventHandlers[eventName]) {
      MAUtils.handleFatalError("MADocument does not support multiple event handlers on the same element for the same event name")
    }

    this.eventHandlers[eventName] = handler;
  }

  click() {
    if (this.eventHandlers && this.eventHandlers['click']) {
      this.eventHandlers['click']();
    }
  }

  closest(selector) {
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      if (this.classList.contains(className)) {
        return this;
      }
    } else if (this.tagName === selector.toUpperCase()) {
      return this;
    }

    if (this.parentEl) {
      return this.parentEl.closest(selector);
    }
    return null;
  }
}

class MADocument {
  constructor() {
    this.body = new MAHTMLElement();

    // Create the elements in index.html
    const uiInfo = this.createElementWithId('div', 'ui-info');
    uiInfo.scrollTop = 0;
    this.body.appendChild(uiInfo);
    uiInfo.appendChild(this.createElementWithId('div', 'story-log'));
    uiInfo.appendChild(this.createElementWithId('div', 'cell-details'));
    uiInfo.appendChild(this.createElementWithId('hr', 'hud-separator-1'));
    const clickDiagnostics = this.createElementWithId('div', 'click-diagnostics');
    clickDiagnostics.classList.add('hidden');
    uiInfo.appendChild(clickDiagnostics);
    clickDiagnostics.appendChild(this.createElement('div'));
    clickDiagnostics.appendChild(this.createElementWithId('button', 'copy-diagnostics'));
    clickDiagnostics.appendChild(this.createElementWithId('pre', 'diagnostics-output'));
    uiInfo.appendChild(this.createElementWithId('hr', 'hud-separator-2'));
    uiInfo.appendChild(this.createElementWithId('div', 'missions-list'));
    uiInfo.appendChild(this.createElementWithId('hr', 'hud-separator-3'));
    uiInfo.appendChild(this.createElementWithId('div', 'inventory-info'));
    this.body.appendChild(this.createElementWithId('button', 'debug-btn'));
    const debugMenu = this.createElementWithId('div', 'debug-menu');
    debugMenu.classList.add('hidden');
    this.body.appendChild(debugMenu);
    this.body.appendChild(this.createElementWithId('button', 'debug-toggle-map'));
    this.body.appendChild(this.createElementWithId('button', 'debug-add-wood'));
    this.body.appendChild(this.createElementWithId('button', 'debug-add-ore'));
    this.body.appendChild(this.createElementWithId('button', 'debug-add-carrot'));
    this.body.appendChild(this.createElementWithId('button', 'debug-beat-game'));
    this.body.appendChild(this.createElementWithId('button', 'zoom-in'));
    this.body.appendChild(this.createElementWithId('button', 'zoom-out'));
    this.body.appendChild(this.createElementWithId('button', 'save-screenshot-btn'));
    this.body.appendChild(this.createElementWithId('button', 'settings-btn'));
    const settingsMenu = this.createElementWithId('div', 'settings-menu');
    settingsMenu.classList.add('hidden');
    this.body.appendChild(settingsMenu);
    this.body.appendChild(this.createElementWithId('input', 'music-toggle'));
    this.body.appendChild(this.createElementWithId('input', 'sound-effects-toggle'));
    this.body.appendChild(this.createElementWithId('a', 'about-link'));
    this.body.appendChild(this.createElementWithId('button', 'start-over-btn'));
    const endGameOverlay = this.createElementWithId('div', 'end-game-overlay');
    endGameOverlay.classList.add('hidden');
    this.body.appendChild(endGameOverlay);
    this.body.appendChild(this.createElementWithId('div', 'engraving-subtitle'));
    this.body.appendChild(this.createElementWithId('div', 'end-game-story'));
    this.body.appendChild(this.createElementWithId('button', 'view-world-btn'));
    this.body.appendChild(this.createElementWithId('button', 'play-again-btn'));
    const exitWorldViewBtn = this.createElementWithId('button', 'exit-world-view-btn');
    exitWorldViewBtn.classList.add('hidden');
    this.body.appendChild(exitWorldViewBtn);
  }

  createElement(elType) {
    const r = new MAHTMLElement();
    r.tagName = elType.toUpperCase();
    return r;
  }

  createElementWithId(elType, elID) {
    const e = this.createElement(elType);
    e.id = elID;
    return e;
  }

  getElementById(elID) {
    return this.body.getElementById(elID);
  }

  createTextNode(text) {
    const e = this.createElement("TEXT_NODE");
    e.innerText = text;
    return e;
  }
}

let maDocument = null;

if (typeof document !== 'undefined') {
  maDocument = document;
} else {
  maDocument = new MADocument();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    maDocument,
    MADocument,
  }
}
