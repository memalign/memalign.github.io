/**
 * Hue Slider
 */

colorPickerComp.huePositionMin = 8
colorPickerComp.huePositionMax = 255

colorPickerComp.updateHueSliderWithHue = function (hue) {
	const hueSliderDragger = document.getElementById('color_slider_dragger');

  let sliderLength = colorPickerComp.huePositionMax - colorPickerComp.huePositionMin
  let percent = (359 - hue) * 100 / 359
  let hueX = sliderLength * percent / 100 + colorPickerComp.huePositionMin

	hueSliderDragger.attributes.x.nodeValue = hueX;
}

colorPickerComp.updateHueSliderWithPosition = function (position) {
	// Defining the slider and dragger
	const sliderContainer = document.getElementById('color_slider');
	const sliderDragger = document.getElementById('color_slider_dragger');

	// Defining the X position
	let eventX = position - sliderContainer.getBoundingClientRect().left;

  let xMin = colorPickerComp.huePositionMin;
  let xMax = colorPickerComp.huePositionMax;
	// Making conditions so that the user don't drag outside the box
	if (eventX < xMin) eventX = xMin;

	if (eventX > xMax) eventX = xMax;

	// Percentage of the dragger on the X axis
  let sliderLength = xMax - xMin;
	const percent = ((eventX - xMin) / sliderLength) * 100;

	// Calculating the color
	// Max number for hue colors is 359, I find the percentage of this, from the percent variable
	// I take it away from the max number because the slider should work backwards
	const HColor = Math.round(359 - (359 / 100) * percent);

	// Updating the color values in the data object
  colorPickerComp.h = HColor

  let rgba = colorPickerComp.HSLAToRGBA(colorPickerComp.h, colorPickerComp.s, colorPickerComp.l, colorPickerComp.a, false)
  colorPickerComp.r = rgba.r
  colorPickerComp.g = rgba.g
  colorPickerComp.b = rgba.b


	// Updating the Hue color in the Saturation and lightness box
	document
		.getElementById('saturation')
		.children[1].setAttribute(
			'stop-color',
			`hsla(${HColor}, 100%, 50%, ${colorPickerComp.alpha})`
		);

	// Update the color text values
	colorPickerComp.updateColorValueInput();

	// Setting the data-color attribute to a color string
	// This is so that the color updates properly on instances where the color has not been set
	colorPickerComp.instance.element.setAttribute('data-color', 'color');

	// Update
	colorPickerComp.updatePicker();
};

/**
 * Mouse Events
 */

// Start the slider drag
document.getElementById('color_slider').addEventListener('mousedown', function (event) {
	// Updating the status in the data object
	colorPickerComp.sliderStatus = true;
	// Calling handler function
	colorPickerComp.updateHueSliderWithPosition(event.clientX);
});

// Moving the slider drag
document.addEventListener('mousemove', function (event) {
	// Checking that the drag has started
	if (colorPickerComp.sliderStatus === true) {
		// Calling handler function
		colorPickerComp.updateHueSliderWithPosition(event.clientX);
	}
});

// End the slider drag
document.addEventListener('mouseup', function () {
	// Checking that the drag has started
	if (colorPickerComp.sliderStatus === true) {
		// Updating the status in the data object
		colorPickerComp.sliderStatus = false;
	}
});

/**
 * Touch Events
 */

// Start the slider drag on touch
document.getElementById('color_slider').addEventListener(
	'touchstart',
	function (event) {
		// Updating the status
		colorPickerComp.sliderStatusTouch = true;
		// Calling the handler function
		colorPickerComp.updateHueSliderWithPosition(event.changedTouches[0].clientX);
	},
	{ passive: true }
);

// Moving the slider drag on touch
document.addEventListener(
	'touchmove',
	function () {
		// Checking that the touch drag has started
		if (colorPickerComp.sliderStatusTouch === true) {
			// Prevent page scrolling
			event.preventDefault();
			// Calling the handler function
			colorPickerComp.updateHueSliderWithPosition(event.changedTouches[0].clientX);
		}
	},
	{ passive: false }
);

// End the slider drag on touch
document.addEventListener('touchend', function () {
	// Checking that the touch drag has started
	if (colorPickerComp.sliderStatusTouch === true) {
		// Updating the status
		colorPickerComp.sliderStatusTouch = false;
	}
});
