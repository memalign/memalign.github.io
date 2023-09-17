
class Firework {
  constructor(sx, sy, tx, ty, sizeTier) {
    // current coordinates
    this.x = sx
    this.y = sy

    // starting coordinates
    this.sx = sx
    this.sy = sy

    // target coordinates
    this.tx = tx
    this.ty = ty

    // distance from starting point to target
    this.distanceToTarget = MAUtils.distance(sx, sy, tx, ty)
    this.distanceTraveled = 0

    // track the past coordinates of each firework to create a trail effect, increase the coordinate count to create more prominent trails
    this.coordinates = []
    this.coordinateCount = 3

    // populate initial coordinate collection with the current coordinates
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y])
    }

    this.angle = Math.atan2(ty - sy, tx - sx)
    this.speed = MAUtils.randomFloat(0.75, 1.5)
    this.acceleration = 1.02
    this.brightness = MAUtils.randomFloat(50, 70)
    this.hue = MAUtils.randomFloat(0, 360)

    // circle target indicator radius
    this.targetRadius = 1;

    this.sizeTier = sizeTier
  }

  update(index) {
    // remove last item in coordinates array
    this.coordinates.pop()

    // add current coordinates to the start of the array
    this.coordinates.unshift([this.x, this.y])

    this.targetRadius += 0.2

    // speed up the firework
    this.speed *= this.acceleration

    // get the current velocities based on angle and speed
    let vx = Math.cos(this.angle) * this.speed
    let vy = Math.sin(this.angle) * this.speed

    this.distanceTraveled = MAUtils.distance(this.sx, this.sy, this.x + vx, this.y + vy)

    // if the distance traveled, including velocities, is greater than the initial distance to the target, then the target has been reached
    if (this.distanceTraveled >= this.distanceToTarget) {
      this.createParticles(this.tx, this.ty)

      // remove the firework, use the index passed into the update function to determine which to remove
      fireworks.splice(index, 1)
    } else {
      // target not reached, keep traveling
      this.x += vx
      this.y += vy
    }
  }

  draw() {
    let canvas = document.getElementById('canvas')
    let ctx = canvas.getContext('2d')

    ctx.lineCap = 'round'
    ctx.lineWidth = 1

    ctx.beginPath();
    // move to the last tracked coordinate in the set, then draw a line to the current x and y
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1])
    ctx.lineTo(this.x, this.y)
    let alpha = 1
    ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + alpha + ')'
    ctx.stroke()

    alpha = Math.min(1, Math.max(0, 1.5 - ((this.targetRadius-1) / 7.0)))
    ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + alpha + ')'
    ctx.beginPath()
    // draw the target for this firework with a pulsing circle
    ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2)
    ctx.stroke()
  }

  createParticles(x, y) {
    // increase the particle count for a bigger explosion, but beware of the performance cost of more particles
    let particleCount = 100 + (this.sizeTier*500)

    while (particleCount--) {
      let hueRange = 23
      let hue = MAUtils.randomFloat(this.hue - hueRange, this.hue + hueRange)
      if (hue >= 360) { hue -= 360 }
      if (hue < 0) { hue += 360 }
      particles.push(new Particle(x, y, hue))
    }

    if (soundEnabled) {
      soundEffects.playSound(MAUtils.randomElement(["explosion0", "explosion1", "explosion2"]))
    }
  }
}

class Particle {
  constructor(x, y, hue) {
    this.x = x
    this.y = y
    // track the past coordinates of each particle to create a trail effect, increase the coordinate count to create more prominent trails
    this.coordinates = []
    this.coordinateCount = 5
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y])
    }

    // set a random angle in all possible directions, in radians
    this.angle = MAUtils.randomFloat(0, Math.PI * 2)
    this.speed = MAUtils.randomFloat(1, 10)

    // friction will slow the particle down
    this.friction = 0.95

    // gravity will be applied and pull the particle down
    this.gravity = 1

    this.hue = hue
    this.brightness = MAUtils.randomFloat(50, 80)
    this.alpha = 1

    // set how fast the particle fades out
    this.decay = MAUtils.randomFloat(0.015, 0.03)
  }

  update(index) {
    // remove last item in coordinates array
    this.coordinates.pop()

    // add current coordinates to the start of the array
    this.coordinates.unshift([this.x, this.y])

    // slow down the particle
    this.speed *= this.friction

    // apply velocity
    this.x += Math.cos(this.angle) * this.speed
    this.y += Math.sin(this.angle) * this.speed + this.gravity

    // fade out the particle
    this.alpha -= this.decay

    // remove the particle once the alpha is low enough, based on the passed in index
    if (this.alpha <= this.decay) {
      particles.splice(index, 1)
    }
  }

  draw() {
    let canvas = document.getElementById('canvas')
    let ctx = canvas.getContext('2d')

    ctx.lineCap = 'round'
    ctx.lineWidth = 2

    ctx. beginPath()
    // move to the last tracked coordinates in the set, then draw a line to the current x and y
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1])
    ctx.lineTo(this.x, this.y)
    ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')'
    ctx.stroke()
  }
}

