'use strict';

///////////////////////////////////////////////////////////////////////////////
class Wall extends EngineObject {
  constructor(pos, size) {
    super(pos, size);

    this.mass = 0; // make object have static physics
    this.setCollision(); // make object collide
    this.color = rgb(0,0,0,0); // make object invisible
  }
}

///////////////////////////////////////////////////////////////////////////////
class Fish extends EngineObject {
  constructor(sprite) {
    super(vec2(-1,-1), sprite.size, sprite.animationFrame(0), 0)

    this.sprite = sprite

    this.updatePosIfNecessary()

    this.velocity = vec2(rand(-0.5, 0.5), rand(-0.5, 0.5));

    this.originalSpeed = this.velocity.length()

    this.moveCyclePercent = 0

    this.updateShouldMirror()

    this.elasticity = 1;

    this.setCollision(true, false, true, true); // collide with the walls but otherwise this object is not solid
  }

  collideWithObject(o) {
    // Remain the same speed even as the object changes direction due to collision
    this.velocity = this.velocity.normalize(this.originalSpeed);

    return 1;
  }

  // Randomly position this object
  // Expected to update when initializing and when canvas size changes
  updatePosIfNecessary() {
    const pos = this.pos
    const posIsValid = (pos.x >= 0 && pos.x <= mainCanvasSize.x) &&
                       (pos.y >= 0 && pos.y <= mainCanvasSize.y)
    if (!posIsValid) {
      // I could get away with adding/subtracting only half of the size, but
      // let's subtract the whole size to have some safety buffer.
      const minPoint = vec2(0, 0).add(this.sprite.size)
      const maxPoint = mainCanvasSize.copy().subtract(this.sprite.size)
      this.pos.x = rand(minPoint.x, maxPoint.x)
      this.pos.y = rand(minPoint.y, maxPoint.y)
    }
  }

  updateShouldMirror() {
    const mirrorSign = this.sprite.facesLeft ? -1 : 1
    this.mirror = (mirrorSign * this.velocity.x < 0)
  }

  update() {
    super.update();

    this.updatePosIfNecessary()

    this.updateShouldMirror()

    const speed = this.velocity.length();
    this.moveCyclePercent += speed * .02;
    this.moveCyclePercent = speed > .01 ? mod(this.moveCyclePercent) : 0;
  }

  ma_handleMouseDown() {
    // This special callback occurs outside a normal update callback so
    // being destroyed from a tap/click may not be fully handled yet.
    if (this.destroyed) { return }

    if (mouseWasPressed(0)) {
      if (this.ma_containsPoint(mousePos)) {
        this.onClick()
      }
    }
  }

  ma_handleTouchEnd() {
    // This special callback occurs outside a normal update callback so
    // being destroyed from a tap/click may not be fully handled yet.
    if (this.destroyed) { return }

    if (mouseWasReleased(0)) {
      if (this.ma_containsPoint(mousePos)) {
        this.onClick()
      }
    }
  }

  render() {
    // update animation
    const animationFrame = this.sprite.frameCount*this.moveCyclePercent|0
    this.tileInfo = this.sprite.animationFrame(animationFrame)

    let bodyPos = this.pos;

    // bounce pos with move cycle
    bodyPos = bodyPos.add(vec2(0,100*(.01+.05*Math.sin(this.moveCyclePercent*PI))));

    drawTile(bodyPos, this.drawSize || this.size, this.tileInfo, this.color, this.angle, this.mirror, this.additiveColor);
  }

  onClick() {
    clearInput() // Only the first object should react to this click
    this.renderOrder = 10 // bring to front

    updateScore(score+1)

    // make explosion effect
    const color1 = new Color(1, 1, 1)
    const color2 = color1.lerp(rgb(1, 1, 1, 0), .5);
    new ParticleEmitter(
      this.pos, 0, // pos, angle
      this.size.scale(0.5), .1, 200, PI, // emitSize, emitTime, emitRate, emiteCone
      tile(0, vec2(40, 40)),     // tileIndex, tileSize
      color1, color2,            // colorStartA, colorStartB
      color1.scale(1,0), color2.scale(1,0), // colorEndA, colorEndB
      .3, .8 * 30, .3, .05, .05, // time, sizeStart, sizeEnd, speed, angleSpeed
      .99, .95, .4, PI,          // damp, angleDamp, gravity, cone
      .1, .8, 0, 1               // fade, randomness, collide, additive
    );

    this.destroy()
  }
}

