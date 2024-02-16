class MAGameRand {
  constructor(seed) {
    this.randHigh = seed
    this.randLow = seed ^ 0x49616E42
  }

  // Return value >= min && value <= max
  randomInt(min, max) {
    this.randHigh = ((this.randHigh << 16) + (this.randHigh >> 16) + this.randLow) & 0xffffffff
    this.randLow = (this.randLow + this.randHigh) & 0xffffffff
    let n = (this.randHigh >>> 0) / 0xffffffff
    return (min + n * (max-min+1)) | 0
  }
}
