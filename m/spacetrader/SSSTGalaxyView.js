const GalaxyViewEdgeBuffer = 23
const DEBUG_OVERRIDE_SCALE_TO_1 = false

const VisitedSystemColor = "#6699CC"
const UnvisitedSystemColor = "#414141"
const WormholeSystemColor = "#FFA500"
const SpecialSystemColor = "#66CC85"

class SSSTGalaxyView {
  constructor(div, game, selectedSystem, selectedWormhole, zoomed, showNames) {
    this.div = div
    this.game = game;
    this.zoomed = zoomed;
    this.showNames = showNames;
    this.planets = [];
    this.selectedSystem = selectedSystem
    this.selectedWormhole = selectedWormhole
    this.selectedPlanet = null

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.id = zoomed ? "zoomedGalaxyViewCanvasContainer" : "galaxyViewCanvasContainer"
    this.div.appendChild(this.canvasContainer);

    this.canvas = document.createElement('canvas');
    this.canvas.id = zoomed ? "zoomedGalaxyViewCanvas" : "galaxyViewCanvas"
    this.context = this.canvas.getContext('2d');
    this.canvasContainer.appendChild(this.canvas);
    this.initCanvas();
    this.initEvents();

    this.startAnimating()
  }

  startAnimating() {
    requestAnimationFrame((timestamp) => {
      this.animationStartTime = timestamp
      this.animateGalaxy(timestamp)
    })
  }

  animateGalaxy(timestamp) {
    this.drawGalaxy(timestamp)

    // Allow us to get garbage collected if the view is removed from the document
    let shouldContinueAnimating = true
    if (!this.lastInvalidationCheckTimestamp) {
      this.lastInvalidationCheckTimestamp = timestamp
    }

    if (timestamp - this.lastInvalidationCheckTimestamp > 5000) {
      shouldContinueAnimating = document.body.contains(this.canvasContainer)
    }

    if (shouldContinueAnimating) {
      requestAnimationFrame((newTimestamp) => this.animateGalaxy(newTimestamp))
    } else {
      //console.log("GalaxyView removed from document. Stopping animation.")
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
    let needsResize = false

    const xyScaleFactors = this.getXYScaleFactors()
    if (this._prevXYScaleFactors) {
      // Scale factors change when the commander's ship changes to have different range
      needsResize = (xyScaleFactors.xScaleFactor !== this._prevXYScaleFactors.xScaleFactor) ||
                    (xyScaleFactors.yScaleFactor !== this._prevXYScaleFactors.yScaleFactor)
    }
    this._prevXYScaleFactors = xyScaleFactors


    const rect = this.canvasContainer.getBoundingClientRect()
    needsResize = needsResize ||
                  this.cachedBoundingRect.width !== rect.width ||
                  this.cachedBoundingRect.height !== rect.height


    if (needsResize) {
      //console.log("Canvas resized")
      this.planets = []
      this.initCanvas()
    }
  }

  eventHandlerName() {
    return this.zoomed ? "Zoomed" : ""
  }

  initEvents() {
    this.canvas.addEventListener('mouseup', this.onInputEnd.bind(this));

    actionLog.registerNamedEventListener(this, "selectPlanet" + this.eventHandlerName())

    window.addEventListener('resize', this.resizeCanvasIfNeeded.bind(this));
  }

  handleNamedEvent(eventName, eventContext) {
    if (eventName === "selectPlanet" + this.eventHandlerName()) {
      const splitContext = eventContext.split("~")
      const systemName = splitContext[0]
      const isWormhole = splitContext.length > 1

      const s = this.game.solarSystems.find(s => s.name === systemName)
      this.selectSystem(s, isWormhole);
    }
  }

  onInputEnd(event) {
    if (!this.delegate) {
      return
    }

    const pos = this.getEventPosition(event);
    //console.log(`input end (${pos.x}, ${pos.y}) scale ${this.scale}`)
    const planet = this.getPlanetAtPosition(pos.x, pos.y);
    if (planet) {
      let s = planet.solarSystem
      let isWormhole = planet.isWormhole === true
      //console.log("Found planet: " + s.name + " wormhole: " + planet.isWormhole)
      if (planet.isWormhole) {
        s = this.game.solarSystems.find(x => x.wormhole === planet.solarSystem)
      }

      //console.log(`selected planet (${planet.x}, ${planet.y})`)
      this.selectSystem(s, isWormhole);

      actionLog.logNamedEvent("selectPlanet" + this.eventHandlerName(), s.name + (isWormhole ? "~wormhole" : ""))
    }
  }

  getEventPosition(event) {
    let ret = { x: event.clientX, y: event.clientY };

    if (event.touches && event.touches.length > 0) {
      const touch = event.touches[0];
      ret = { x: touch.clientX, y: touch.clientY };
    }

    const rect = this.canvas.getBoundingClientRect()
    //console.log(`boundingRect: left ${rect.left} top ${rect.top}  right ${rect.right}  bottom ${rect.bottom}`)

    ret.x = ret.x - rect.left
    ret.y = ret.y - rect.top

    return ret
  }

  getPlanetAtPosition(x, y) {
    let closestDistance = Math.sqrt(Math.pow(this.canvas.width/this.scale, 2) + Math.pow(this.canvas.height/this.scale, 2))
    let closestPlanet = null

    for (let planet of this.planets) {
      const dist = Math.sqrt(Math.pow(planet.x - x, 2) + Math.pow(planet.y - y, 2));

      if (dist < closestDistance) {
        closestDistance = dist
        closestPlanet = planet
      }

      // Position is inside planet
      if (dist <= planet.radius) {
        return planet
      }
    }

    return closestPlanet
  }

  selectSystem(s, wormhole) {
    //console.log(`Selected system: ${s.name} wormhole: ${wormhole}`);

    let planet = null

    if (this.planets.length > 0) {
      if (wormhole) {
        planet = this.planets.find(p => p.isWormhole && p.solarSystem === s.wormhole)
      } else {
        planet = this.planets.find(p => !p.isWormhole && p.solarSystem === s)
      }
    }

    this.selectedPlanet = planet
    this.selectedSystem = s
    this.selectedWormhole = wormhole
    if (this.delegate) {
      this.delegate.galaxyViewSelectedSolarSystem(this, s, wormhole)
    }


    if (this.zoomed) {
      let systemInfoEl = document.getElementById('gv-system-info')
      if (!systemInfoEl) {
        systemInfoEl = document.createElement('div')
        systemInfoEl.id = 'gv-system-info'
        this.canvasContainer.appendChild(systemInfoEl)
        systemInfoEl.classList.add('gv-system-info')
      }

      const realSystem = wormhole ? s.wormhole : s
      const resourceText = realSystem.visited ? realSystem.systemInfoString() : "system details unknown"
      systemInfoEl.innerText = resourceText
    }
  }

  planetRadius() {
    const canvasDimension = Math.min((this.canvas.height / this.scale) / GALAXY_HEIGHT, (this.canvas.width / this.scale) / GALAXY_WIDTH)
    const nonZoomedPlanetSize = 300 * canvasDimension / 150
    const radius = this.zoomed ? (600 * canvasDimension / 150) : nonZoomedPlanetSize
    return radius
  }

  drawGalaxy(timestamp) {
    this.resizeCanvasIfNeeded()
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      //console.log("Canvas is 0 width or height")
      return
    }

    //console.log("drawGalaxy: canvas width: " + this.canvas.width)
    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const bodyColor = window.getComputedStyle(document.body).color;
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    const textColor = isDarkMode ? bodyColor : 'white'

    const solarSystems = this.game.solarSystems;
    const radius = this.planetRadius()

    if (this.planets.length <= 0) {
      solarSystems.forEach(solarSystem => {
        const center = this.getPlanetPosition(solarSystem);

        let planet = { x: center.x, y: center.y, radius: radius, solarSystem: solarSystem, isWormhole: false }
        this.planets.push(planet)

        if (!this.selectedWormhole && solarSystem === this.selectedSystem) {
          this.selectedPlanet = planet
        }

        let wormholeCenter = { x: 0, y: 0 }
        if (solarSystem.wormhole) {
          const wormholePadding = Math.floor(radius/4)
          wormholeCenter.x = center.x + 2*radius + wormholePadding
          wormholeCenter.y = center.y

          let wormholePlanet = { x: wormholeCenter.x, y: wormholeCenter.y, radius: radius, solarSystem: solarSystem.wormhole, isWormhole: true }
          this.planets.push(wormholePlanet)

          if (this.selectedWormhole && solarSystem === this.selectedSystem) {
            this.selectedPlanet = wormholePlanet
          }
        }
      });
    }

    // Drawing:

    this.drawPilotRange()

    this.drawTrackedArrow()

    // Draw a circle for every planet
    this.planets.forEach(planet => {
      let color = planet.isWormhole ? WormholeSystemColor : (planet.solarSystem.visited ? VisitedSystemColor : UnvisitedSystemColor)

      // If showSpecialSystems cheat is enabled
      if (this.game.showSpecialSystems && planet.solarSystem.specialEvent !== SSSTSpecialEvent.None) {
        color = SpecialSystemColor
      }

      this.context.fillStyle = color;
      this.context.beginPath();
      this.context.arc(planet.x, planet.y, radius, 0, Math.PI * 2);
      this.context.fill();
    });


    this.drawTrackingRings(timestamp)

    // Draw names last so they are not obscured by any planets
    if (this.showNames) {
      this.planets.forEach(planet => {
        const namePadding = Math.floor(radius)
        this.context.fillStyle = textColor;
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.font = '10px Helvetica, Arial, san-serif';
        if (!planet.isWormhole) {
          this.context.fillText(planet.solarSystem.name, planet.x, planet.y - planet.radius - namePadding);
        } else {
          this.context.fillText(planet.solarSystem.name, planet.x, planet.y + planet.radius + namePadding)
        }
      })
    }
  }

  drawTrackingRings(timestamp) {
    const elapsedTime = timestamp - this.animationStartTime

    if (this.selectedPlanet) {
      this.drawTrackingRing({x: this.selectedPlanet.x, y: this.selectedPlanet.y}, 'red', elapsedTime)
    }

    const selectedSolarSystem = this.selectedPlanet && !this.selectedWormhole ? this.selectedPlanet.solarSystem : null

    if (this.game.trackedSystem && this.game.trackedSystem !== selectedSolarSystem) {

      const center = this.getPlanetPosition(this.game.trackedSystem)
      this.drawTrackingRing(center, 'blue', elapsedTime)
    }
  }

  drawTrackingRing(center, color, elapsedTime) {
    const animationDurationMS = 1500
    let animationProportion = 1
    const elapsedAnimationTimeMS = elapsedTime % animationDurationMS
    if (elapsedAnimationTimeMS <= animationDurationMS/2) {
      // Grow
      animationProportion = elapsedAnimationTimeMS / (animationDurationMS/2)
    } else {
      // Shrink
      animationProportion = 1 - ((elapsedAnimationTimeMS - animationDurationMS/2) /(animationDurationMS/2))
    }

    const radiusGrowth = 0.2 * MAUtils.easeInOutSine(animationProportion)

    const radius = this.planetRadius()*(1.05+radiusGrowth)

    this.context.strokeStyle = color
    this.context.lineWidth = 2;
    this.context.beginPath()
    this.context.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.context.stroke()
  }

  drawPilotRange() {
    const currentSystemCenter = this.getPlanetPosition(this.game.commander.currentSystem)

    const range = this.game.commander.ship.fuel

    const xyScaleFactors = this.getXYScaleFactors()
    const horizontalRadius = range * xyScaleFactors.xScaleFactor
    const verticalRadius = range * xyScaleFactors.yScaleFactor

    this.context.strokeStyle = 'white'
    this.context.lineWidth = 1

    this.context.beginPath()
    this.context.ellipse(currentSystemCenter.x, currentSystemCenter.y, horizontalRadius, verticalRadius, 0, 0, 2*Math.PI)
    this.context.stroke()
  }

  drawTrackedArrow() {
    if (!this.game.trackedSystem || this.game.commander.currentSystem === this.game.trackedSystem) {
      return
    }

    const currentSystemCenter = this.getPlanetPosition(this.game.commander.currentSystem)
    const trackedSystemCenter = this.getPlanetPosition(this.game.trackedSystem)

    let unitVector = { x: (trackedSystemCenter.x-currentSystemCenter.x), y: (trackedSystemCenter.y-currentSystemCenter.y) }
    const magnitude = Math.sqrt(this.squaredDistance(currentSystemCenter, trackedSystemCenter))
    unitVector.x /= magnitude
    unitVector.y /= magnitude

    const arrowLength = 3*this.planetRadius()
    const arrowEndPoint = { x: currentSystemCenter.x + unitVector.x * arrowLength, y: currentSystemCenter.y + unitVector.y * arrowLength }

    // Find the start points: rotate our unit vector 90 degrees both directions then multiply by the radius of the planet
    const clockwiseUnitVector = { x: -unitVector.y, y: unitVector.x }
    const ccwUnitVector = { x: -clockwiseUnitVector.x, y: -clockwiseUnitVector.y }

    const lineWidth = 1
    const planetEdge = this.planetRadius() * 0.85
    const start1 = {
      x: currentSystemCenter.x + clockwiseUnitVector.x * planetEdge,
      y: currentSystemCenter.y + clockwiseUnitVector.y * planetEdge
    }
    const start2 = {
      x: currentSystemCenter.x + ccwUnitVector.x * planetEdge,
      y: currentSystemCenter.y + ccwUnitVector.y * planetEdge
    }


    this.context.strokeStyle = 'white'
    this.context.lineCap = 'round'
    this.context.lineWidth = lineWidth

    this.context.beginPath()
    this.context.moveTo(start1.x, start1.y)
    this.context.lineTo(arrowEndPoint.x, arrowEndPoint.y)
    this.context.stroke()

    this.context.beginPath()
    this.context.moveTo(start2.x, start2.y)
    this.context.lineTo(arrowEndPoint.x, arrowEndPoint.y)
    this.context.stroke()
  }

  squaredDistance(p1, p2) {
    return (Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
  }

  // Returns { xMin, xMax, yMin, yMax } of all solarSystems
  getSolarSystemBounds() {
    if (this.solarSystemBounds) {
      return this.solarSystemBounds
    }

    let bounds = { xMin: GALAXY_WIDTH, xMax: 0, yMin: GALAXY_HEIGHT, yMax: 0 }
    this.game.solarSystems.forEach(solarSystem => {
      bounds.xMin = Math.min(solarSystem.x, bounds.xMin)
      bounds.xMax = Math.max(solarSystem.x, bounds.xMax)
      bounds.yMin = Math.min(solarSystem.y, bounds.yMin)
      bounds.yMax = Math.max(solarSystem.y, bounds.yMax)
    })

    this.solarSystemBounds = bounds

    return bounds
  }

  getPixelEdgeBuffer() {
    const pixelEdgeBuffer = this.zoomed ? 0 : GalaxyViewEdgeBuffer
    return pixelEdgeBuffer
  }

  getXYScaleFactors() {
    const solarSystemBounds = this.getSolarSystemBounds()

    const occupiedGalaxyWidth = solarSystemBounds.xMax - solarSystemBounds.xMin
    const occupiedGalaxyHeight = solarSystemBounds.yMax - solarSystemBounds.yMin

    const pixelEdgeBuffer = this.getPixelEdgeBuffer()


    const viewRadius = this.game.commander.ship.fuelTankCapacity() * 1.5
    const viewWidthInGalaxyPoints = this.zoomed ? viewRadius*2 : occupiedGalaxyWidth
    const viewHeightInGalaxyPoints = this.zoomed ? viewRadius*2 : occupiedGalaxyHeight

    const horizontalScale = (this.canvas.width/this.scale - 2*pixelEdgeBuffer) / viewWidthInGalaxyPoints
    const verticalScale = (this.canvas.height/this.scale - 2*pixelEdgeBuffer) / viewHeightInGalaxyPoints

    if (this.zoomed) {
      // Prefer to have a square aspect ratio when zoomed so pilot range is a perfect circle
      const maxScale = Math.min(horizontalScale, verticalScale)
      return { xScaleFactor: maxScale, yScaleFactor: maxScale }
    }

    return { xScaleFactor: horizontalScale, yScaleFactor: verticalScale }
  }

  getPlanetPosition(solarSystem) {
    //console.log("getPlanetPosition: canvas width: " + this.canvas.width)
    const solarSystemBounds = this.getSolarSystemBounds()

    const xyScaleFactors = this.getXYScaleFactors()
    const horizontalScale = xyScaleFactors.xScaleFactor
    const verticalScale = xyScaleFactors.yScaleFactor

    const x = solarSystem.x
    const y = solarSystem.y

    const drawXOffset = this.zoomed ? 0 : solarSystemBounds.xMin
    const drawYOffset = this.zoomed ? 0 : solarSystemBounds.yMin
    let drawX = Math.floor((x - drawXOffset) * horizontalScale)
    let drawY = Math.floor((y - drawYOffset) * verticalScale)


    if (this.zoomed) {
      const centerX = Math.floor(this.game.commander.currentSystem.x * horizontalScale)
      const centerY = Math.floor(this.game.commander.currentSystem.y * verticalScale)

      drawX = drawX - centerX + Math.floor(this.canvas.width/this.scale/2)
      drawY = drawY - centerY + Math.floor(this.canvas.height/this.scale/2)
    }

    const pixelEdgeBuffer = this.getPixelEdgeBuffer()
    const retX = drawX + pixelEdgeBuffer
    const retY = drawY + pixelEdgeBuffer
    return { x: retX, y: retY }
  }
}
