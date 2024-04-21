let convertImageCanvas = null

function handleConvertImage(input) {
  const file = input.files[0]
  if (file) {
    const reader = new FileReader()

    reader.onload = function (e) {
      const img = new Image()
      img.src = e.target.result

      img.onload = function () {
        convertImageCanvas = document.createElement('canvas')
        const ctx = convertImageCanvas.getContext('2d')
        convertImageCanvas.width = img.width
        convertImageCanvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)

        convertImage()
      }
    }

    reader.readAsDataURL(file)
  }
}

function handleConvertScaleDropdownChange() {
  convertImage()
}

function convertImage() {
  if (!convertImageCanvas) {
    return
  }

  let dropdown = document.getElementById("convertScaleDropdown")
  let convertScale = parseInt(dropdown.value)

  let resultStr = PCEImage.pceImageFromCanvas(convertImageCanvas, convertScale).imageStrLines.join("\n")

  if (!canReplaceContents()) {
    return
  }

  setEditorText(resultStr, false)
}
