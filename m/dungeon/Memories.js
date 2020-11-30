class MAMemory {
  // Properties:
  // - name (string)
  // - lookTriggers (array of strings, elements are name of lookable)
  // - triggered (boolean) - when true, this memory will be available as an action
  // - rememberCount (int) - amount of times user has visisted this memory
  // - descriptions (array of strings) - user will see descriptions[min(rememberCount, descriptions.length-1)] when visiting this memory

  
  constructor(name) {
    this.name = name
    this.lookTriggers = []
    this.rememberCount = 0
    this.descriptions = []
    this.triggered = false
  }
  
  completed() {
    return this.rememberCount >= this.descriptions.length
  }
  
  description() {
    let len = this.descriptions.length
    if (len <= 0) {
      return ""
    }
    
    let i = Math.min(this.rememberCount, len-1)
    return this.descriptions[i]
  }
}


class MAMemories {
  // Properties:
  // - memories (array of MAMemory instances)

  constructor() {
    this.memories = []
    
    // Create all memories
    
    var memory = new MAMemory("computer lab pranks")
    this.memories.push(memory)
    memory.lookTriggers.push("computer mouse")
    memory.descriptions.push("You and your classmates would spice up trips to the computer lab. One time, Bobby took a screenshot of the Desktop, set it as the wallpaper, and then removed all Desktop icons. Mrs. Yarlick's patience wore thin as she double-clicked to no avail.")
    memory.descriptions.push("In the computer lab, it was sneaky fun to twist open the bottom cover on a mouse and take its dense rubber ball.")
    memory.descriptions.push("You feel a shred of guilt for disrupting lesson plans all those years ago.")
  }
}