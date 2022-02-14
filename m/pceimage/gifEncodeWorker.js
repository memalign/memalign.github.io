// This file is intended to be used as a Worker to encode GIFs off the main thread

importScripts("jsgif/LZWEncoder.js", "jsgif/NeuQuant.js", "jsgif/GIFEncoder.js", "jsgif/b64.js")

addEventListener("message", event => {
  let dataOffset = 0
  let generationID = event.data[dataOffset++]
  let usesTransparency = event.data[dataOffset++]

  let encoder = new GIFEncoder()
  encoder.setRepeat(0)
  encoder.setDelay(150)
  encoder.start()
  if (usesTransparency) {
    encoder.setTransparent(0xFFFFF1)
  }

  for (let i = dataOffset; i < event.data.length; i++) {
    let imageData = event.data[i]
    encoder.addFrame(imageData, true)
  }

  encoder.finish()

  let gifData = encoder.stream().getData()

  let base64GIFStr = 'data:image/gif;base64,' + encode64(gifData)
  postMessage([base64GIFStr, generationID])
})

