class MANounRepository {
  // Properties:
  // - inspectedNouns[string] = bool
  // - nameToNounFn[string] = function that returns MANoun
  constructor() {
    this.inspectedNouns = {}
    this.nameToNounFn = {}

    this.populateNameToNounFn()
  }

  populateNameToNounFn() {
    let nounArr = []

    // A

    nounArr.push(function() {
      let ale = new MANoun("ale", "A delicious nutbrown ale in a cool glass.")
      ale.addAttribute("edible")
      ale.isPlural = (() => true)
      ale.generationDescription = function(noun, backingNoun) {
        if (backingNoun.name == "apple") {
          return "There's a smell of fermenting apple, then cider, then something more malty. In the apple's place there is now a glass of nutbrown ale."
        }
        return null
      }
      return ale
    })

    nounArr.push(function() {
      let n = new MANoun("Amy", "She smiles at us when we look at her. She has an air of confused good will, as though she means well but isn't quite paying attention to this plane of reality.")
      n.addAttribute("person")
      return n
    })

    nounArr.push(function() {
      let n = new MANoun("arm", "A girl's arm, by the look of it, amputated neatly at the shoulder joint. The fingernails are painted shell-pink.")
      n.addAttribute("long")
      n.addAttribute("freaky")
      return n
    })


    // B

    nounArr.push(function() {
      let n = new MANoun("boomstick skit")
      n.errorMessage = "The device buzzes, inquisitively. It apparently hasn't been exposed to enough old-timey weapon imagery to improvise a compelling boomstick skit."
      return n
    })


    // C

    nounArr.push(function() {
      let cock = new MANoun("cock", "It stares back at us malevolently through one eye.")
      cock.scentDescription = "something objectionable"
      cock.addAttribute("creature")
      cock.addAttribute("noisy")
      cock.addAttribute("naughtySounding")
      return cock
    })

    nounArr.push(function() {
      let n = new MANoun("cod", "There's about twelve pounds of fish-and-chips-in-waiting here — it's actually materialized as fillets rather than the fish itself, which is some indication of how Atlanteans think about cod, when they can get it. Overfishing, you know.") // Untakeable
      n.addAttribute("edible")
      return n
    })

    nounArr.push(() => new MAScenery("code", "A bit of paper on which is written \"305\"."))


    // E

    nounArr.push(function() {
      let ear = new MANoun("ear", "Severed. It's not a nice thing to look at.")
      ear.scentDescription = "wax"
      ear.addAttribute("freaky")
      ear.weight = MANounWeight.Tiny
      return ear
    })

    nounArr.push(function() {
      let n = new MANoun("earl", `An Earl stands a few feet away, decked in identifying ermine. He looks anxious and out-of-place`)
      n.addAttribute("person")
      n.scentDescription = "musty furs"
      return n
    })

    nounArr.push(function() {
      let n = new MANoun("eel", `Manifested dead, because out of its proper element, the eel nonetheless gleams with silver and stripes.`)
      n.addAttribute("edible")
      n.scentDescription = "a sort of oily, fishy tang"
      return n
    })


    // F

    nounArr.push(function() {
      let n = new MANoun("font t-shits")
      n.errorMessage = "No doubt this would be a cogent statement about the commercialization of the body, if it weren't for the fact that T-SHIT doesn't describe anything anyone with a functional colon has ever heard of."
      return n
    })


    // H

    nounArr.push(function() {
      let heel = new MANoun("heel", "Calloused and leathery, a gruesome souvenir of years of unhappy shoe-wearing.")
      heel.addAttribute("freaky")
      return heel
    })

    nounArr.push(function() {
      let helter = new MANoun("helter")
      helter.errorMessage = `The device buzzes, puzzled. You can't make "helter" without a bit of "skelter."`
      return helter
    })

    nounArr.push(function() {
      let ho = new MANoun("ho", "She looks to be in her mid-twenties and is wearing a tight, neon blue outfit that makes her look like a naked water nymph.")
      ho.addAttribute("person")
      return ho
    })

    nounArr.push(function() {
      let hoe = new MANoun("hoe", "It's a common gardening implement, perhaps a little larger than usual.")
      hoe.generationDescription = function(noun, backingNoun) {
        return `The ${backingNoun.name} become${backingNoun.isPlural() ? "" : "s"} a hoe, redecorating the fountain.`
      }
      hoe.addAttribute("long")
      return hoe
    })

    nounArr.push(function() {
      let hoses = new MAScenery("hoses", "There are at least a half-dozen of them, spraying water in every direction as though the concept of conservation had never been invented.") // untakeable
      hoses.generationDescription = function(noun, backingNoun) {
        return `The ${backingNoun.name} become${backingNoun.isPlural() ? "" : "s"} hoses, redecorating the fountain.`
      }
      return hoses
    })


    // L

    nounArr.push(function() {
      let n = new MANoun("leer", `It is a good humored, slightly-drunk kind of leer, but it's unmistakable.`)
      n.addAttribute("abstract")
      return n
    })

    nounArr.push(function() {
      let louse = new MANoun("louse", "Ick.")
      louse.addAttribute("creature")
      louse.weight = MANounWeight.Tiny
      return louse
    })


    // M

    nounArr.push(function() {
      let mallChildren = new MANoun("mall children")
      mallChildren.errorMessage = `If it were a more powerful device, the letter-remover might be able to generate something resembling the concept of "mall children," but that's not an idiomatic saying around here. Not to mention that the parents would be bound to object.`
      return mallChildren
    })

    nounArr.push(function() {
      let n = new MANoun("member", "It is a figure of a member of the Committee to Establish an Orthodox Orthography. It is plastic, small enough to sit on our palm, and wears the stiff clothing and conservative hairstyle of about 1895. It looks slightly cross, as though the member has guessed its work would take another 15 years to complete.")
      n.addAttribute("naughtySounding")
      return n
    })

    nounArr.push(function() {
      let n = new MAScenery("morning dress", "An outfit of striped trousers and fancy coat, such as men sometimes wear to fancy weddings in the morning.") // untakeable
      n.isPlural = function() { return false }
      n.addAttribute("floppy")
      n.addAttribute("wearable")
      return n
    })


    // O

    nounArr.push(function() {
      let n = new MAScenery("ode", `A short poem, letter-pressed attractively on a sheet of thick paper. It is entitled "Our Ancestors, The Immortal Spirits of the Pyramids," a fact which disinclines me to study the rest.`) // untakeable
      n.scentDescription = "paper"
      return n
    })


    // P

    nounArr.push(function() {
      let n = new MANoun("pa", `He's a Norman Rockwell figure: gruff, upstanding, honest, not a big talker. Doesn't actually come with a child attached, but it stands to reason he would have a large-ish brood of them.`)
      n.addAttribute("person")
      n.scentDescription = "shaving cream"
      return n
    })

    nounArr.push(function() {
      let n = new MANoun("pal", `Our pal smiles back at us with friendly, boyish affection. There are whole summers' worth of innocence in that grin. Did you ever have a best friend, growing up? I didn't, really. I was more of a loner. But I liked that, I think.`)
      n.addAttribute("person")
      return n
    })

    nounArr.push(() => new MANoun("pan", "A flat cast iron skillet: bulky and heavy."))

    nounArr.push(() => new MANoun("pans", "A set of flat skillets in cast iron: extremely bulky and heavy."))

    nounArr.push(function() {
      let n = new MANoun("pea", "Just a single green pea.")
      n.addAttribute("edible")
      n.addAttribute("plant")
      n.weight = MANounWeight.Tiny
      return n
    })

    nounArr.push(function() {
      let n = new MANoun("peal", `It is the embodiment of a peal of bells: no weight or size, but the impression of bronze, early Gothic spires in a spare English countryside, and clangor.`)
      n.addAttribute("noisy")
      return n
    })

    nounArr.push(function() {
      let n = new MANoun("pear", "Handsome and green.")
      n.addAttribute("edible")
      n.addAttribute("plant")
      return n
    })

    nounArr.push(function() {
      let n = new MANoun("perl", `A flickering of regular expressions and .pl filenames, translucent in the air. I never could see the appeal, but I have a friend in linguistic engineering who swears that regular expressions are the language God speaks.`)
      n.addAttribute("abstract")
      return n
    })

    nounArr.push(function() {
      let n = new MANoun("pink t-shit")
      n.errorMessage = "That would be intriguingly disgusting, if it weren't for the fact that T-SHIT doesn't describe anything anyone with a functional colon has ever heard of."
      return n
    })

    nounArr.push(function() {
      let n = new MANoun("plan", `The number of pages in the original roll has been reduced, but this is still obviously a bit of DCL property. The only difference is that this version is incomplete.`)
      n.addAttribute("long")
      n.addAttribute("floppy")
      n.addAttribute("illegal")
      return n
    })


    // R

    nounArr.push(function() {
      let n = new MANoun("railing")
      n.errorMessage = "The letter-remover warms in our hand, but nothing visibly changes, perhaps because RAILING lies on the awkward verge between a count noun and a mass noun, and if we say RAILINGS we mean something not very different from A QUANTITY OF RAILING, making RAILING a word with cumulative reference."
      return n
    })

    nounArr.push(function() {
      let n = new MAScenery("reflective widow", `A tall woman with a widow's peak and a distant look in her eyes.`) // untakeable
      n.addAttribute("person")
      n.scentDescription = "paper"
      return n
    })


    // T

    nounArr.push(() => new MANoun("tub", "Now a handsome, giant-sized tub with RESTORATION GEL prominently emblazoned on the front. The tub contains a clear, sticky gel that restores objects to their original state, before any letter changing. This is a valuable item in your line of work. As an added bonus, it smells like spearmint."))


    // Transform into the structure we need
    for (let nounFn of nounArr) {
      let tempNoun = nounFn()
      this.nameToNounFn[tempNoun.name.toLowerCase()] = nounFn
    }
  }


  nounForString(str) {
    let foundFn = this.nameToNounFn[str.toLowerCase()]
    if (foundFn) {
      let foundNoun = foundFn()
      foundNoun.inspected = this.inspectedNouns[str.toLowerCase()] === true
      return foundNoun
    }
    return null
  }

  inspectNoun(noun) {
    this.inspectedNouns[noun.name.toLowerCase()] = true
  }
}
