class SSSTTravelProgressView {
  constructor(div, game, origin, destination, wasVisited) {
    this.div = div
    this.game = game;
    this.origin = origin;
    this.destination = destination;
    this.wasVisited = wasVisited;
    this.planets = [];

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.id = "travelProgressViewCanvasContainer"
    this.div.appendChild(this.canvasContainer);

    this.canvas = document.createElement('canvas');
    this.canvas.id = "travelProgressViewCanvas"
    this.context = this.canvas.getContext('2d');
    this.canvasContainer.appendChild(this.canvas);
    this.initCanvas();
    this.initEvents();

    this.shipProgress = 0
    this.shipTargetProgress = 0
    this.progressAnimationStartTime = 0

    // Excessive to run this the whole time. Consider animating only during progress animation.
    this.startAnimating()
  }

  startAnimating() {
    requestAnimationFrame((timestamp) => {
      this.animationStartTime = timestamp
      this.animateView(timestamp)
    })
  }

  animateView(timestamp) {
    this.drawView(timestamp)

    // Allow us to get garbage collected if the view is removed from the document
    let shouldContinueAnimating = true
    if (!this.lastInvalidationCheckTimestamp) {
      this.lastInvalidationCheckTimestamp = timestamp
    }

    if (timestamp - this.lastInvalidationCheckTimestamp > 5000) {
      shouldContinueAnimating = document.body.contains(this.canvasContainer)
    }

    if (shouldContinueAnimating) {
      requestAnimationFrame((newTimestamp) => this.animateView(newTimestamp))
    } else {
      //console.log("ProgressView removed from document. Stopping animation.")
    }
  }

  initCanvas() {
    const rect = this.canvasContainer.getBoundingClientRect()
    this.cachedBoundingRect = rect
    if (DEBUG_OVERRIDE_SCALE_TO_1) {
      this.scale = 1
    } else {
      this.scale = window.devicePixelRatio
    }

    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height}px`

    this.canvas.width = rect.width * this.scale
    this.canvas.height = rect.height * this.scale

    this.context.scale(this.scale, this.scale)
  }

  resizeCanvasIfNeeded() {
    const rect = this.canvasContainer.getBoundingClientRect()
    if (this.cachedBoundingRect.width !== rect.width ||
        this.cachedBoundingRect.height !== rect.height) {
      //console.log("Canvas resized")
      this.initCanvas()
    }
  }

  initEvents() {
    window.addEventListener('resize', this.resizeCanvasIfNeeded.bind(this));
  }

  planetRadius() {
    const radius = this.canvas.height / this.scale / 3 / 2
    return radius
  }

  // Returns the x-coordinate of the center of the solar system
  _solarSystemXOrigin(left) {
    const radius = this.planetRadius()

    const edgePadding = 2
    const horizontalPadding = edgePadding + this._textHeight()

    const xOrigin = left ? horizontalPadding + radius : this.canvas.width/this.scale - horizontalPadding - radius

    return xOrigin
  }

  _textHeight() {
    return 10
  }

  _drawSolarSystem(s, left, visited) {
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    const textHeight = this._textHeight()
    this.context.font = `${textHeight}px Helvetica, Arial, san-serif`;

    const sname = s.name
    const textMetrics = this.context.measureText(sname)

    const radius = this.planetRadius()

    const edgePadding = 2

    const xOrigin = this._solarSystemXOrigin(left)

    const yOrigin = this.canvas.height/this.scale / 2

    //console.log(`xOrigin, yOrigin = ${xOrigin}, ${yOrigin}`)

    const color = visited ? VisitedSystemColor : UnvisitedSystemColor
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(xOrigin, yOrigin, radius, 0, Math.PI * 2);
    this.context.fill();

    let nameY = yOrigin + radius + edgePadding + textHeight/2
    let nameX = xOrigin - Math.floor(textMetrics.width/2)
    if (left) {
      nameX = Math.max(edgePadding, nameX) + textMetrics.width/2
    } else {
      nameX = Math.min(this.canvas.width/this.scale - textMetrics.width - edgePadding, nameX) + textMetrics.width/2
    }

    this.context.fillStyle = 'white';
    this.context.fillText(sname, nameX, nameY);
  }

  drawView(timestamp) {
    this.lastDrawTimestamp = timestamp

    if (this.shipTargetProgress > this.shipProgress && !this.progressAnimationStartTime) {
      this.progressAnimationStartTime = timestamp
    }


    this.resizeCanvasIfNeeded()
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      //console.log("Canvas is 0 width or height")
      return
    }

    //console.log("drawView: canvas width: " + this.canvas.width)
    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);


    // SolarSystems
    this._drawSolarSystem(this.origin, true, true)
    this._drawSolarSystem(this.destination, false, this.wasVisited)


    // Ship
    let shipDistance = this.shipTargetProgress

    if (this.progressAnimationStartTime > 0) {
      const animationTimeElapsed = timestamp - this.progressAnimationStartTime
      let animationPercent = animationTimeElapsed / (TRAVEL_PROGRESS_DURATION * 1000)

      if (animationPercent >= 1) {
        // Animation is complete
        this.progressAnimationStartTime = 0
        animationPercent = 1
      }

      const distancePercent = MAUtils.easeInOutCubic(animationPercent)
      shipDistance = this.shipProgress + distancePercent * (this.shipTargetProgress - this.shipProgress)

      if (animationPercent >= 1) {
        this.shipProgress = this.shipTargetProgress
      }
    } else {
      this.shipProgress = this.shipTargetProgress
    }


    const shipPCEImage = this.game.commander.ship.model.shipImage
    const shipScale = Math.max(1, Math.ceil(this.planetRadius()*2 / shipPCEImage.height))

    const edgePadding = 2
    const shipXOrigin = this._solarSystemXOrigin(true) + this.planetRadius() + edgePadding
    const shipXDestination = this._solarSystemXOrigin(false) - this.planetRadius() - edgePadding - (shipPCEImage.width * shipScale)
    const shipX = Math.floor(shipXOrigin + (shipXDestination - shipXOrigin) * shipDistance)
    const shipY = Math.floor((this.canvas.height/this.scale - (shipPCEImage.height * shipScale)) / 2)

    shipPCEImage.drawInCanvas(this.canvas, shipScale, shipX, shipY)
  }

  setProgress(p) {
    this.shipTargetProgress = p
    this.progressAnimationStartTime = this.lastDrawTimestamp
  }
}
