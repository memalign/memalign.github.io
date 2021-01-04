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

    var memory = new MAMemory("how we got here")
    this.memories.push(memory)
    memory.lookTriggers.push("yellow buildings")
    memory.lookTriggers.push("yellow paint")
    memory.lookTriggers.push("beige buildings")
    memory.lookTriggers.push("dull house")
    memory.descriptions.push(`Cluttered Industrial Room\n\nThe synthesizer was right at the center of the room, and we were inside it. An unshaven man in a blue jumper was prodding us with his foot. "Wake up! Wake up!"\n\nBut we couldn't move, even though you were half-conscious. So he panicked. We'd paid him to let us recover in comfort, but he wasn't about to risk having a corpse on his hands, even an unidentified one. He picked us up and dumped our body in the back alley and left.`)


    memory = new MAMemory("your austere childhood")
    this.memories.push(memory)
    memory.lookTriggers.push("small children")
    memory.lookTriggers.push("funnel")
    memory.lookTriggers.push("school")
    memory.descriptions.push(`Your Childhood Bedroom\n\nA small white room with a free-standing wardrobe full of modest home-made clothes; a plain-hewn bookshelf with Bible, study guides, a dictionary and thesaurus; and a sampler on the far wall that reads, "Our pursuit of perfection is our gift to God." It's done in very exact cross-stitch.`)
    memory.descriptions.push(`Your Childhood Bedroom\n\nYou hung your newly ironed clothes in the wardrobe. Your clothes were frumpy foolish things. But they were made for you by your parents with great care. Your father made the wardrobe himself. Your mother sewed all your clothes. She had an eye for color and detail. It shows in the neatness of the hems, the crisp piping on a pocket, the surprising yellow buttons on a pale blue cuff.\n\nEvery day you wore those clothes was like being armored in love.`)
    memory.descriptions.push(`Your Kitchen\n\nYour mother sits at the kitchen table sipping a strong tea while she coaches you through your routine. This is what informed your life, every day. Every morning, the hours of spelling practice. Your mother's words about how you must nurture your talent in gratitude to the deity who bestowed it on you.`)
    memory.descriptions.push(`The recollections blur together now, rejected and useless.`)


    memory = new MAMemory("how it started with Brock")
    this.memories.push(memory)
    memory.lookTriggers.push("dorm beds")
    memory.lookTriggers.push("futon")
    memory.descriptions.push(`Brock's Stateroom\n\nIt was early morning, almost a year ago now. A dim light came through the portholes. A four-thousand dollar mink blanket covered your hip.\n\nYou sat up and started fishing around beside the bed, in the dove-grey shadows, for your bra.\n\nBrock put a hand on your thigh. It seems you woke him.\n\n"That wasn't your first time," he said.\n\n"No." You were still feeling for the underpants and the shirt, not looking at him.\n\n"Well. You're made of human after all." Brock stretched, grinned. "After breakfast I'll clear you some drawer space."\n\n"This was a one-night event," you said. "You're familiar with the concept."\n\nHe got very still. Then he got out of bed. Without looking at you, he got his trunks out of his drawer. "I'm going for a swim."`)
    memory.descriptions.push(`Navigation Area\n\nBrock was sitting at the controls, with you leaning over him. He pushed you away. "Cut it out. I'm not available every time you decide to go slumming."\n\nIt was deep blue summer twilight. He was driving the yacht with one hand on the steering wheel and the other loosely in his lap. You turned to go.`)
    memory.descriptions.push(`Sunning Deck\n\nBrock was sprawled out on the cushions with his sunglasses on. Pretending not to see you. You stood so that your shadow crossed his face and he had to look up.\n\n"I've been a jerk and I'm sorry," you said.\n\n"I'm not the man-whore of Babylon," he replied. "I've had the odd fling. That's all."\n\n"I know."\n\n"I'm not James Bond here."\n\nYou pulled your towel more tightly around you. "I know."\n\n"And you have lost the right ever to give me crap about women again," he said.\n\nYour teeth were starting to chatter. "Yes."\n\n"Okay. Apology accepted." He lowered his sunglasses again.`)
    memory.descriptions.push(`Café, Marseilles\n\nBrock was scowling into his drink. "I don't know, Andra. Are you going to flip on me again if we try to be together? I'm not blaming you for your parents, and... honestly, I'm surprised how much you've been able to assemble yourself into someone new. But gosh."\n\n"What happened to your thing about how everyone goes through life hurting everyone else a little bit, like radiation?" you asked. "But mostly people heal, and it's worth it?"\n\n"Yeah, that's true," he said. "But you still don't go into the reactor core with no suit, if you see what I mean."\n\nYou tilted your head. "You weathered it pretty well when you and Annalisa split up."\n\nHe swirled the melted ice in the bottom of his glass. "Is this what you're fishing for?" he said. "For me to tell you you're special, you're different, I care about you more and therefore it would ruin everything if we ever broke up?"\n\nYou didn't answer.\n\n"It *would* ruin everything," he says. "Because you're on my crew. But as to the girlfriend thing, I have no idea. We don't know each other that way."`)
    memory.descriptions.push(`Brock's Stateroom\n\nBrock had tied your wrists to the headboard and your left ankle to the corner of the bed. He had a thesaurus open and was writing, with a paintbrush, across your stomach.\n\n"Floozy?" he asked.\n\nYou giggled, so he painted the word above your navel, smiling, giving the Y a big flourishing curlicue.\n\n"Let's see, what else. Fornicator?"\n\nYou drew in your breath sharply. Remembering an angry lesson read from the lectern.\n\n"Okay," he said. "Not that one, yet," and licked away the F he'd begun to paint.`)
    memory.descriptions.push(`I get the idea. You don't need to show me more.`)


    memory = new MAMemory("making your lock")
    this.memories.push(memory)
    memory.lookTriggers.push("lock")
    memory.descriptions.push(`Galley\n\nYou were going through the galley cupboards on the yacht. "If you're looking for coffee, Slango forgot to resupply," Brock said, descending the galley staircase in a wet Speedo.\n\n"No, the first-letter razor," you replied, holding up a portable clock. "I need a lock that responds to restoration gel but nothing else."\n\n"Ah." Brock toweled his hair. "It's in my bunk, sorry. Want to come look for it?"\n\nYou smiled — a give-away smile. "Wish I could, but we're on a deadline. Go put some pants on. And bring me the razor."`)
  }
}
