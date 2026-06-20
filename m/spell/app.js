if (typeof module !== "undefined" && module.exports) {
  ({ SpellGame } = require("./src/SpellGame.js"));
  ({ maDocument } = require("./src/MADocument.js"));
} else {
  window.spellGame = new SpellGame({ document: maDocument, window });
  window.spellGame.init();
}
