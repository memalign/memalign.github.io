/**
 * Saturation and Lightness Box
 */

colorPickerComp.SL_xMin = 10;
colorPickerComp.SL_xMax = 253; // width is 263
colorPickerComp.SL_yMin = 10;
colorPickerComp.SL_yMax = 120; // height is 130

colorPickerComp.updateSLBoxWithColor = function () {
	document
		.getElementById('saturation')
		.children[1].setAttribute('stop-color', `hsl(${colorPickerComp.h}, 100%, 50%)`);

	const boxDragger = document.getElementById('box_dragger');

  let xMin = colorPickerComp.SL_xMin
  let xMax = colorPickerComp.SL_xMax
  let yMin = colorPickerComp.SL_yMin
  let yMax = colorPickerComp.SL_yMax

  let xLength = xMax - xMin
  let yLength = yMax - yMin


  // Based on formulas from https://en.wikipedia.org/wiki/HSL_and_HSV
  // The y position is "V" in HSV
  //
  // Convert HSL to HSV:
  let sPercent = colorPickerComp.s / 100
  let v = colorPickerComp.l/100 + sPercent * Math.min(colorPickerComp.l/100, 1-colorPickerComp.l/100)

  let y = yLength * (1-v) + yMin

  let xPercent = 0
  if (colorPickerComp.l === 0) {
    // lightness === 0 means the color is black
    // To avoid popping the color selector to the canonical representation of black (with s == 0, over in the left corner), keep the s that corresponds to the position of the mouse
    xPercent = colorPickerComp.s/100
  } else {
    let hsv_s = (v === 0) ? 0 : 2 * (1 - colorPickerComp.l/100 / v)
    xPercent = hsv_s
  }

  let x = xLength * xPercent + xMin


	boxDragger.attributes.x.nodeValue = x;
	boxDragger.attributes.y.nodeValue = y;
}


colorPickerComp.updateSLBoxWithPosition = function (positionX, positionY, adjustForScroll) {
	// Defining the box and dragger
	const boxContainer = document.getElementById('color_box');
	const boxDragger = document.getElementById('box_dragger');

	// Defining X and Y position, Y differently works with scroll so I make conditions for that
	let eventX = positionX - boxContainer.getBoundingClientRect().left;
	let eventY =
		adjustForScroll === true
			? positionY - boxContainer.getBoundingClientRect().top
			: positionY -
			  boxContainer.getBoundingClientRect().top -
			  document.getElementsByTagName('HTML')[0].scrollTop;

	// Making conditions so that the user don't drag outside the box
  let xMin = colorPickerComp.SL_xMin
  let xMax = colorPickerComp.SL_xMax
  let yMin = colorPickerComp.SL_yMin
  let yMax = colorPickerComp.SL_yMax

	if (eventX < xMin) eventX = xMin;

	if (eventX > xMax) eventX = xMax;

	if (eventY < yMin) eventY = yMin;

	if (eventY > yMax) eventY = yMax;


  let xLength = xMax - xMin
	const hsv_SPercent = (eventX - xMin) / xLength

  let yLength = yMax - yMin
	const hsv_VPercent = 1 - ((eventY - yMin) / yLength);


  colorPickerComp.l = hsv_VPercent * (1 - hsv_SPercent/2)

  if (colorPickerComp.l === 0) {
    // lightness === 0 means the color is black
    // To avoid popping the color selector to the canonical representation of black (with s == 0, over in the left corner), keep the s that corresponds to the position of the mouse
    colorPickerComp.s = hsv_SPercent
  } else {
    colorPickerComp.s = (colorPickerComp.l === 1 || colorPickerComp.l === 0) ? 0 : (hsv_VPercent - colorPickerComp.l) / Math.min(colorPickerComp.l, 1-colorPickerComp.l)
  }

  colorPickerComp.l *= 100
  colorPickerComp.s *= 100



  let rgba = colorPickerComp.HSLAToRGBA(colorPickerComp.h, colorPickerComp.s, colorPickerComp.l, colorPickerComp.alpha, false)
  colorPickerComp.r = rgba.r
  colorPickerComp.g = rgba.g
  colorPickerComp.b = rgba.b

	// Update the color text values
	colorPickerComp.updateColorValueInput();

	// Setting the data-color attribute to a color string
	// This is so that the color updates properly on instances where the color has not been set
  if (colorPickerComp.instance && colorPickerComp.instance.element) {
    colorPickerComp.instance.element.setAttribute('data-color', 'color');
  }

	colorPickerComp.updatePicker();
};

/**
 * Mouse Events
 */

// Start box drag listener
document.getElementById('color_box').addEventListener('mousedown', function (event) {
	// Updating the status in the data object
	colorPickerComp.boxStatus = true;
	// Calling handler function
	colorPickerComp.updateSLBoxWithPosition(event.clientX, event.clientY, true);
});

// Moving box drag listener
document.addEventListener('mousemove', function (event) {
	// Checking that the drag has started
	if (colorPickerComp.boxStatus === true) {
		// Calling handler function
		colorPickerComp.updateSLBoxWithPosition(event.clientX, event.clientY, true);
	}
});

// End box drag listener
document.addEventListener('mouseup', function (event) {
	// Checking that the drag has started
	if (colorPickerComp.boxStatus === true) {
		// Updating the status in the data object
		colorPickerComp.boxStatus = false;
	}
});

/**
 * Touch Events
 */

// Start the box drag on touch
document.getElementById('color_box').addEventListener(
	'touchstart',
	function (event) {
		// Updating the status
		colorPickerComp.boxStatusTouch = true;
		// Calling the handler function
		colorPickerComp.updateSLBoxWithPosition(
			event.changedTouches[0].clientX,
			event.changedTouches[0].clientY,
			true
		);
	},
	{ passive: true }
);

// Moving the box drag on touch
document.addEventListener(
	'touchmove',
	function () {
		// Checking that the touch drag has started
		if (colorPickerComp.boxStatusTouch === true) {
			// Prevent page scrolling
			event.preventDefault();
			// Calling the handler function
			colorPickerComp.updateSLBoxWithPosition(
				event.changedTouches[0].clientX,
				event.changedTouches[0].clientY,
				true
			);
		}
	},
	{ passive: false }
);

// End box drag on touch
document.addEventListener('touchend', function () {
	// Checking that the touch drag has started
	if (colorPickerComp.boxStatusTouch === true) {
		// Calling the handler function
		colorPickerComp.boxStatusTouch = false;
	}
});
