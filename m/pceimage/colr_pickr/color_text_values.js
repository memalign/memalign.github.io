/**
 * Color Text Values
 */

// Function to switch the color type inputs
colorPickerComp.switchColorType = function () {
	// Checking the current selected input color type
	if (colorPickerComp.colorTypeStatus == 'HEXA') {
		// Updating the data object
		colorPickerComp.colorTypeStatus = 'RGBA';

		// Displaying the correct elements
		document.getElementById('hexa').style.display = 'none';
		document.getElementById('rgba').style.display = 'block';

		// Applying the value to the inputs
		document.getElementsByClassName('rgba_input')[0].value = colorPickerComp.r;
		document.getElementsByClassName('rgba_input')[1].value = colorPickerComp.g;
		document.getElementsByClassName('rgba_input')[2].value = colorPickerComp.b;
		document.getElementsByClassName('rgba_input')[3].value = colorPickerComp.alpha;
	} else if (colorPickerComp.colorTypeStatus == 'RGBA') {
		// Updating the data object
		colorPickerComp.colorTypeStatus = 'HSLA';

		// Displaying the correct elements
		document.getElementById('rgba').style.display = 'none';
		document.getElementById('hsla').style.display = 'block';

		// Applying the value to the inputs
		document.getElementsByClassName('hsla_input')[0].value = colorPickerComp.h;
		document.getElementsByClassName('hsla_input')[1].value = colorPickerComp.s;
		document.getElementsByClassName('hsla_input')[2].value = colorPickerComp.l;
		document.getElementsByClassName('hsla_input')[3].value = colorPickerComp.alpha;

	} else if (colorPickerComp.colorTypeStatus == 'HSLA') {
		// Updating the data object
		colorPickerComp.colorTypeStatus = 'HEXA';

		// Displaying the correct elements
		document.getElementById('hsla').style.display = 'none';
		document.getElementById('hexa').style.display = 'block';

		// Converting the value
		const hexValue = colorPickerComp.RGBAToHexA(
			colorPickerComp.r,
			colorPickerComp.g,
			colorPickerComp.b,
			colorPickerComp.alpha
		);

		// Applying the value to the input
		document.getElementById('hex_input').value = hexValue.toUpperCase();
	}
};
document.getElementById('switch_color_type').addEventListener('click', function () {
	colorPickerComp.switchColorType();
});

// Event to update the color when the user leaves the hex value box
document.getElementById('hex_input').addEventListener('change', function () {
	// Value
	const hexInput = this.value;

	// Check to see if the hex is formatted correctly
	if (hexInput.match(/^#[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i)) {
		colorPickerComp.setColorWithString(hexInput);
	}
});

// Gathering all the rgba inputs boxes
document.querySelectorAll('.rgba_input').forEach((element) => {
	// Event to update the color when the user changes the value to any of the input boxes
	element.addEventListener('change', function () {
		// Input boxes
		const rgbaInput = document.querySelectorAll('.rgba_input');

		// Checking that the numbers are within the correct boundaries
		if (rgbaInput[0].value > 255) return;
		if (rgbaInput[1].value > 255) return;
		if (rgbaInput[2].value > 255) return;
		if (rgbaInput[3].value > 1) return;

		// Updating the picker
		colorPickerComp.setColorWithString(
			`rgba(${rgbaInput[0].value}, ${rgbaInput[1].value}, ${rgbaInput[2].value}, ${rgbaInput[3].value})`
		);
	});
});

// Gathering all the hsla inputs boxes
document.querySelectorAll('.hsla_input').forEach((element) => {
	// Event to update the color when the user changes the value to any of the input boxes
	element.addEventListener('change', function () {
		// Input boxes
		const hslaInput = document.querySelectorAll('.hsla_input');

		// Checking that the numbers are within the correct boundaries
		if (hslaInput[0].value > 359) throw 'Value must be below 360';
		if (hslaInput[1].value > 100) throw 'Value must be below 100';
		if (hslaInput[2].value > 100) throw 'Value must be below 100';
		if (hslaInput[3].value > 1) throw 'Value must be equal to or below 1';

		// Updating the picker
		colorPickerComp.setColorWithString(
			`hsla(${hslaInput[0].value}, ${hslaInput[1].value}%, ${hslaInput[2].value}%, ${hslaInput[3].value})`
		);
	});
});
