
// Implementations of DOM classes that work in Node.js, for unit tests

class MAHTMLElement {
  constructor() {
    this.parentEl = null;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.disabled = false;
    this.innerText = "";

    this.classList = (() => {
      let list = [];
      return {
        add: function(item) { if (!list.includes(item)) { list.push(item) } },
        remove: function(item) { list = list.filter(x => x !== item) },
        contains: function(item) { return list.includes(item) },
        toggle: function(item, force) {
          const shouldAdd = force === undefined ? !list.includes(item) : !!force;
          if (shouldAdd) {
            if (!list.includes(item)) { list.push(item) }
          } else {
            list = list.filter(x => x !== item)
          }
          return shouldAdd;
        },
        toString: function() { return list.join(" "); }
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
    if (this.children.length === 0) {
      return this.innerText
    }
    return this.children.map((child) => child.textContent || "").join("")
  }

  set textContent(t) {
    this.children = []
    this.innerText = t
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
    if (name === "id") {
      this.id = value;
    } else if (name === "class") {
      for (const className of String(value).split(/\s+/).filter(Boolean)) {
        this.classList.add(className);
      }
    } else if (name.startsWith("data-")) {
      const key = name.substring(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[key] = value;
    } else {
      this[name] = value;
    }
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  replaceChildren(...children) {
    this.children = [];
    for (const child of children) {
      this.appendChild(child);
    }
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

  getBoundingClientRect() {
    const fallbackWidth = this.dataset && this.dataset.id !== undefined ? 40 : 0;
    const fallbackHeight = this.dataset && this.dataset.id !== undefined ? 40 : 0;
    let width = Number.parseFloat(this.style.width || 0) || fallbackWidth;
    let height = Number.parseFloat(this.style.height || 0) || fallbackHeight;
    let left = Number.parseFloat(this.style.left || 0);
    let top = Number.parseFloat(this.style.top || 0);

    if ((!left && left !== 0) || Number.isNaN(left)) {
      left = 0;
    }
    if ((!top && top !== 0) || Number.isNaN(top)) {
      top = 0;
    }

    if (this.dataset && this.dataset.id !== undefined && !this.style.left && !this.style.top) {
      const index = Number.parseInt(this.dataset.index || "0", 10) || 0;
      const zone = this.dataset.zone || "";
      left = index * 48;
      top = zone === "word" ? 0 : 60;
    }

    return {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height
    };
  }

  get offsetWidth() {
    return this.getBoundingClientRect().width;
  }

  get offsetHeight() {
    return this.getBoundingClientRect().height;
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

  querySelectorAll(selector) {
    const results = [];
    const classNames = selector.split(",").map((s) => s.trim().substring(1));
    const visit = (node) => {
      if (node && node.classList) {
        for (const className of classNames) {
          if (node.classList.contains(className)) {
            results.push(node);
            break;
          }
        }
      }
      if (node.children) {
        for (const child of node.children) {
          visit(child);
        }
      }
    };
    visit(this.body);
    return results;
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
