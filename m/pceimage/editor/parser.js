
var codeMirrorFn = function() {
    'use strict';

    return {
        copyState: function(state) {
            let charToColorCopy = {};
            for (let i in state.charToColor) {
              if (state.charToColor.hasOwnProperty(i)) {
                let o = state.charToColor[i];
                charToColorCopy[i] = o
              }
            }

            var nstate = {
              section: state.section,
              charToColor: charToColorCopy,
            };

            return nstate;
        }, // copy

        blankLine: function(state) {
          //console.log("Blank line handler called")
          state.section = "pixels"
        },

        token: function(stream, state) {
          let colorToReturn = null

          if (state.section == '') {
            state.section = "colors"
          }

          //console.log("State section: " + state.section)

          if (state.section == "colors") {
            let reg_colorLine = /(.)\:(#[0-9a-fA-F]+)$/

            let matchColorLine = stream.match(reg_colorLine, true)
            if (matchColorLine) {
              let pixelChar = matchColorLine[1]
              let color = matchColorLine[2]

              state.charToColor[pixelChar] = color
              colorToReturn = color

            } else {
              // Colorize hex codes found in comments
              let reg_color = /(#[0-9a-fA-F]+)/
              let matchColor = stream.match(reg_color, true)
              if (matchColor) {
                let color = matchColor[1]
                colorToReturn = color
              }
            }

          } else if (state.section == "pixels") {
            let ch = stream.eat(/./)
            //console.log("Got char: "+ch)
            colorToReturn = state.charToColor[ch]
          }

          if (colorToReturn) {
            return 'COLOR BOLDCOLOR COLOR-' + colorToReturn
          }

          stream.eat(/./)
          return 'COLOR FADECOLOR';
        },
        startState: function() {
            return {
                section: '',
                charToColor: {},
            };
        }
    };
};

window.CodeMirror.defineMode('pceimage', codeMirrorFn);

