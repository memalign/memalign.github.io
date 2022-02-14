/**
 * Update Picker
 */

// color is a string matching one of these formats:
// #FFFFFF
// rbga(255, 255, 255, 1)
// hsla(300, 0%, 100%, 1)
colorPickerComp.setColorWithString = function (color) {
  let setAsHSL = false

	// Checking if color picker has not been set
	if (color == 'undefined') {
		// Setting the default color positioning of the player to red
		color = {
			r: 255,
			g: 0,
			b: 0,
			a: 1
		};
	} else {
		// Checking the color type that has been given
		if (color.substring(0, 1) == '#') {
			// Converting the color to RGBA
			color = colorPickerComp.hexAToRGBA(color, false);
		} else if (color.substring(0, 1) == 'r') {
			// Extracting the values
			const rgb = color.match(/[.?\d]+/g);

			// Making sure there is a alpha value
			rgb[3] = rgb[3] == undefined ? 1 : rgb[3];

			color = {
				r: parseInt(rgb[0]),
				g: parseInt(rgb[1]),
				b: parseInt(rgb[2]),
				a: parseFloat(rgb[3])
			};
		} else {
			// Extracting the values
			const hsl = color.match(/[.?\d]+/g);

			// Making sure there is a alpha value
			hsl[3] = hsl[3] == undefined ? 1 : hsl[3];

      setAsHSL = true
			color = {
				h: parseInt(hsl[0]),
				s: parseInt(hsl[1]),
				l: parseInt(hsl[2]),
				a: parseFloat(hsl[3])
			};
		}
	}

	// Updating the data object
  if (setAsHSL) {
    colorPickerComp.h = color.h;
    colorPickerComp.s = color.s;
    colorPickerComp.l = color.l;
    colorPickerComp.alpha = color.a;

    let rgba = colorPickerComp.HSLAToRGBA(color.h, color.s, color.l, color.a, false)
    colorPickerComp.r = rgba.r;
    colorPickerComp.g = rgba.g;
    colorPickerComp.b = rgba.b;

  } else {
    colorPickerComp.r = color.r;
    colorPickerComp.g = color.g;
    colorPickerComp.b = color.b;
    colorPickerComp.alpha = color.a;

    const hsla = colorPickerComp.RGBAToHSLA(color.r, color.g, color.b, color.a)
    colorPickerComp.h = hsla.h;
    colorPickerComp.s = hsla.s;
    colorPickerComp.l = hsla.l;
  }


  colorPickerComp.updatePicker()
};


colorPickerComp.updatePicker = function () {
	colorPickerComp.updateColorValueInput();

  colorPickerComp.updateSLBoxWithColor()
  colorPickerComp.updateHueSliderWithHue(colorPickerComp.h)
  colorPickerComp.updateOpacitySliderWithColor()

	const hex = colorPickerComp.RGBAToHexA(colorPickerComp.r, colorPickerComp.g, colorPickerComp.b, colorPickerComp.alpha);
  let textBox = document.getElementById("color_text_values");
  textBox.style.backgroundColor = hex

	// Calling Event to make all the necessary changes
	colorPickerComp.colorChange({
		r: colorPickerComp.r,
		g: colorPickerComp.g,
		b: colorPickerComp.b,
		a: colorPickerComp.alpha
	});
};

// Update text fields (hex, rgba, hsla)
colorPickerComp.updateColorValueInput = function () {
	// Checking the value color type the user has selected
	if (colorPickerComp.colorTypeStatus == 'HEXA') {
    const hexValue = colorPickerComp.RGBAToHexA(
      colorPickerComp.r,
      colorPickerComp.g,
      colorPickerComp.b,
      colorPickerComp.alpha
    );

		document.getElementById('hex_input').value = hexValue.toUpperCase();

	} else if (colorPickerComp.colorTypeStatus == 'RGBA') {
		document.getElementsByClassName('rgba_input')[0].value = colorPickerComp.r;
		document.getElementsByClassName('rgba_input')[1].value = colorPickerComp.g;
		document.getElementsByClassName('rgba_input')[2].value = colorPickerComp.b;
		document.getElementsByClassName('rgba_input')[3].value = colorPickerComp.alpha;

	} else {
		document.getElementsByClassName('hsla_input')[0].value = colorPickerComp.h;
		document.getElementsByClassName('hsla_input')[1].value = colorPickerComp.s;
		document.getElementsByClassName('hsla_input')[2].value = colorPickerComp.l;
		document.getElementsByClassName('hsla_input')[3].value = colorPickerComp.alpha;
	}
};
