/**
 * Opacity Slider
 */

colorPickerComp.opacityPositionMin = 8
colorPickerComp.opacityPositionMax = 255

colorPickerComp.updateOpacitySliderWithColor = function () {
	const alphaSliderDragger = document.getElementById('opacity_slider_dragger');

  let sliderLength = colorPickerComp.opacityPositionMax - colorPickerComp.opacityPositionMin;
  let alphaX = colorPickerComp.alpha * sliderLength + colorPickerComp.opacityPositionMin

	// Making changes the the UI
	alphaSliderDragger.attributes.x.nodeValue = alphaX;

	// Updating the color in the opacity slider
	document.getElementById('opacity').children[0].setAttribute('stop-color', `hsla(${colorPickerComp.h}, ${colorPickerComp.s}%, ${colorPickerComp.l}%, 1)`);
	document.getElementById('opacity').children[1].setAttribute('stop-color', `hsl(${colorPickerComp.h}, ${colorPickerComp.s}%, ${colorPickerComp.l}%, 0)`);
}

colorPickerComp.updateOpacitySliderWithPosition = function (position) {
	// Defining the slider and dragger
	const sliderContainer = document.getElementById('opacity_slider');
	const sliderDragger = document.getElementById('opacity_slider_dragger');

	// Defining the X position
	let eventX = position - sliderContainer.getBoundingClientRect().left;

  let xMin = colorPickerComp.opacityPositionMin;
  let xMax = colorPickerComp.opacityPositionMax;

	// Making conditions so that the user don't drag outside the box
	if (eventX < xMin) eventX = xMin;

	if (eventX > xMax) eventX = xMax;

	// Percentage of the dragger on the X axis
  let sliderLength = xMax - xMin;
  let alpha = ((eventX - xMin) / sliderLength)

	// Rounding the value to the nearest 2 decimals
	alpha = Number(Math.round(alpha + 'e' + 2) + 'e-' + 2);

	// Updating the data objects
	colorPickerComp.alpha = alpha;

	// Update the color text values
	colorPickerComp.updateColorValueInput();

	// Setting the data-color attribute to a color string
	// This is so that the color updates properly on instances where the color has not been set
  if (colorPickerComp.instance && colorPickerComp.instance.element) {
    colorPickerComp.instance.element.setAttribute('data-color', 'color');
  }

	// Update
	colorPickerComp.updatePicker();
};

/**
 * Mouse Events
 */

// Start the slider drag for opacity
document.getElementById('opacity_slider').addEventListener('mousedown', function (event) {
	// Updating the status in the data object
	colorPickerComp.opacityStatus = true;
	// Calling the handler function
	colorPickerComp.updateOpacitySliderWithPosition(event.clientX);
});

// Moving the slider drag for opacity
document.addEventListener('mousemove', function (event) {
	// Checking that the drag has started
	if (colorPickerComp.opacityStatus === true) {
		// Calling the handler function
		colorPickerComp.updateOpacitySliderWithPosition(event.clientX);
	}
});

// End the slider drag
document.addEventListener('mouseup', function () {
	// Checking that the drag has started
	if (colorPickerComp.opacityStatus === true) {
		// Updating the status in the data object
		colorPickerComp.opacityStatus = false;
	}
});

/**
 * Touch Events
 */

// Start the slider drag on touch
document.getElementById('opacity_slider').addEventListener(
	'touchstart',
	function (event) {
		// Updating the status
		colorPickerComp.opacityStatusTouch = true;
		// Calling the handler function
		colorPickerComp.updateOpacitySliderWithPosition(event.changedTouches[0].clientX);
	},
	{ passive: true }
);

// Moving the slider drag on touch
document.addEventListener(
	'touchmove',
	function () {
		// Checking that the touch drag has started
		if (colorPickerComp.opacityStatusTouch === true) {
			// Prevent page scrolling
			event.preventDefault();
			// Calling the handler function
			colorPickerComp.updateOpacitySliderWithPosition(event.changedTouches[0].clientX);
		}
	},
	{ passive: false }
);

// End the slider drag on touch
document.addEventListener('touchend', function () {
	// Checking that the touch drag has started
	if (colorPickerComp.opacityStatusTouch === true) {
		// Updating the status
		colorPickerComp.opacityStatusTouch = false;
	}
});
