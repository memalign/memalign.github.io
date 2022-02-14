/**
 * Custom Color Change Event
 */

/**
 * @memberof colorPickerComp
 * @method colorChange
 * @description Function to change the color of an instance via a JavaScript function
 * @param {string} or {object} color - The color you are changing the instance to. If color is an object, it has .r, .g, .b, .a attributes.
 * @param {HTMLElement} elem - The button HTMLElement that is a part of the instance
 *
 * @example
 * const button = document.getElementById('my_button');
 * colorPickerComp.colorChange('#ff0000', button);
 */
colorPickerComp.colorChange = function (color, elem) {
	// If the user send a string manually...
	if (typeof color == 'string') {
		// Change it to the expected value of an RGBA object
		color = colorPickerComp.hexAToRGBA(color, false);
	}

	// Defining the RGBA value conversion
	const rgbaValue = color
	const hex = colorPickerComp.RGBAToHexA(color.r, color.g, color.b, color.a);
  const hslaValue = colorPickerComp.RGBAToHSLA(color.r, color.g, color.b, color.a);

	/**
	 * @event colorChange
	 * @description Event to fire whenever the color picker is closed for new details on the color instance. Calling event.detail will return an object of the following:
	 * @return {object} color - Object of color values
	 * @return {string} color.hex - Hex value of chosen color
	 * @return {string} color.rgb - RGB value of chosen color
	 * @return {string} color.hsl - HSL value of chosen color
	 * @return {string} color.hexa - HexAlpha value of chosen color
	 * @return {string} color.rgba - RGBA value of chosen color
	 * @return {string} color.hsla - HSLA value of chosen color
	 *
	 * @example
	 * const button = document.getElementById('my_button');
	 * button.addEventListener('colorChange', function () {
	 *   const newColor = event.detail.color.hexa;
	 * });
	 */
	const event = new CustomEvent('colorChange', {
		// Adding the response details
		detail: {
			color: {
				hsl: `hsla(${hslaValue.h}, ${hslaValue.s}%, ${hslaValue.l}%)`,
				rgb: `rgba(${rgbaValue.r}, ${rgbaValue.g}, ${rgbaValue.b})`,
				hex: hex,
				hsla: `hsla(${hslaValue.h}, ${hslaValue.s}%, ${hslaValue.l}%, ${color.a})`,
				rgba: `rgba(${rgbaValue.r}, ${rgbaValue.g}, ${rgbaValue.b}, ${rgbaValue.a})`,
				hexa: hex
			}
		}
	});

	// Defining element
  const colorPickerElem = colorPickerComp.instance ? colorPickerComp.instance.element : null;
  const element = elem === undefined ? colorPickerElem : elem;

	// Defining color
  if (element) {

    // Changing color attributes
    element.setAttribute('data-color', hex);
    element.style.background = hex;

    // Dispatching the event for the active object
    element.dispatchEvent(event);
  }
};
