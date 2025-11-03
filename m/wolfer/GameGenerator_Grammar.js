class GameGenerator_Grammar extends MAGameGenerator {
  constructor() {
    super();
    // caches to ensure stability of generate*ForLevel calls
    // keyed by level (number) -> array
    this._matchingCache = {};
    this._nonMatchingCache = {};
  }

  gameName() {
    return "Grammar Wolfer";
  }

  static Attributes = {
    Verb:         0x0001,
    Noun:         0x0002,
    Pronoun:      0x0004,
    Adverb:       0x0008,
    Adjective:    0x0010,
    Preposition:  0x0020,
    Interjection: 0x0040,
    Conjunction:  0x0080,
  };

  // word dictionary (string -> numeric bitflags)
  static _wordDict() {
    if (!this.__wordDict) {
      const A = this.Attributes;

      this.__wordDict = {
        "I"               : (A.Pronoun),
        "about"           : (A.Preposition),
        "above"           : (A.Preposition),
        "abruptly"        : (A.Adverb),
        "abundant"        : (A.Adjective),
        "across"          : (A.Preposition),
        "add"             : (A.Verb),
        "adorable"        : (A.Adjective),
        "advice"          : (A.Noun),
        "after"           : (A.Preposition|A.Conjunction),
        "against"         : (A.Preposition),
        "agreeable"       : (A.Adjective),
        "aha"             : (A.Interjection),
        "ahem"            : (A.Interjection),
        "ahh"             : (A.Interjection),
        "ahoy"            : (A.Interjection),
        "alas"            : (A.Interjection),
        "alive"           : (A.Adjective),
        "allow"           : (A.Verb),
        "almost"          : (A.Adverb),
        "along"           : (A.Preposition|A.Adverb),
        "also"            : (A.Adverb),
        "although"        : (A.Conjunction),
        "always"          : (A.Adverb),
        "am"              : (A.Verb),
        "among"           : (A.Preposition),
        "and"             : (A.Conjunction),
        "angry"           : (A.Adjective),
        "answer"          : (A.Verb|A.Noun),
        "anyone"          : (A.Pronoun),
        "anything"        : (A.Pronoun),
        "appear"          : (A.Verb),
        "apple"           : (A.Noun),
        "are"             : (A.Verb),
        "arithmetic"      : (A.Noun),
        "around"          : (A.Preposition|A.Adverb),
        "at"              : (A.Preposition),
        "aw"              : (A.Interjection),
        "bake"            : (A.Verb),
        "bam"             : (A.Interjection),
        "bang"            : (A.Verb|A.Noun),
        "basket"          : (A.Noun),
        "basketball"      : (A.Noun),
        "battle"          : (A.Verb|A.Noun),
        "be"              : (A.Verb),
        "beast"           : (A.Noun),
        "beautiful"       : (A.Adjective),
        "beautifully"     : (A.Adverb),
        "because"         : (A.Conjunction),
        "become"          : (A.Verb),
        "beetle"          : (A.Noun),
        "before"          : (A.Preposition|A.Conjunction),
        "beggar"          : (A.Noun),
        "behind"          : (A.Preposition),
        "being"           : (A.Verb|A.Noun),
        "below"           : (A.Preposition),
        "beneath"         : (A.Preposition),
        "beside"          : (A.Preposition),
        "best"            : (A.Adverb|A.Verb|A.Noun|A.Adjective),
        "better"          : (A.Adjective),
        "between"         : (A.Preposition),
        "beyond"          : (A.Preposition),
        "bitter"          : (A.Adjective),
        "blue"            : (A.Adjective),
        "boo"             : (A.Interjection),
        "brain"           : (A.Noun),
        "briskly"         : (A.Adverb),
        "brrr"            : (A.Interjection),
        "brutally"        : (A.Adverb),
        "bucket"          : (A.Noun),
        "but"             : (A.Preposition|A.Conjunction),
        "by"              : (A.Preposition),
        "cactus"          : (A.Noun),
        "call"            : (A.Verb|A.Noun),
        "can"             : (A.Verb|A.Noun),
        "cannon"          : (A.Noun),
        "careful"         : (A.Adjective),
        "cattle"          : (A.Noun),
        "celery"          : (A.Noun),
        "cellar"          : (A.Noun),
        "chase"           : (A.Verb|A.Noun),
        "cheerfully"      : (A.Adverb),
        "clean"           : (A.Verb|A.Adjective),
        "cleaner"         : (A.Noun|A.Adjective),
        "cleanest"        : (A.Adjective),
        "clever"          : (A.Adjective),
        "cloth"           : (A.Noun),
        "clumsy"          : (A.Adjective),
        "coach"           : (A.Verb|A.Noun),
        "coast"           : (A.Verb|A.Noun),
        "cuddly"          : (A.Adjective),
        "curly"           : (A.Adjective),
        "damage"          : (A.Verb|A.Noun),
        "damaged"         : (A.Verb|A.Adjective),
        "damp"            : (A.Adjective),
        "dang"            : (A.Interjection),
        "daughter"        : (A.Noun),
        "dead"            : (A.Adjective),
        "delicately"      : (A.Adverb),
        "delicious"       : (A.Adjective),
        "delightfully"    : (A.Adverb),
        "despite"         : (A.Preposition),
        "did"             : (A.Verb),
        "do"              : (A.Verb),
        "does"            : (A.Verb|A.Noun),
        "donkey"          : (A.Noun),
        "down"            : (A.Preposition),
        "downstairs"      : (A.Adverb),
        "drop"            : (A.Verb|A.Noun),
        "drug"            : (A.Verb|A.Noun),
        "duh"             : (A.Interjection),
        "during"          : (A.Preposition),
        "eager"           : (A.Adjective),
        "early"           : (A.Adverb),
        "earthquake"      : (A.Noun),
        "easy"            : (A.Adjective),
        "eek"             : (A.Interjection),
        "end"             : (A.Verb|A.Noun),
        "endlessly"       : (A.Adverb),
        "enough"          : (A.Adverb),
        "escape"          : (A.Verb|A.Noun),
        "eternally"       : (A.Adverb),
        "everybody"       : (A.Pronoun),
        "everyone"        : (A.Pronoun),
        "everything"      : (A.Pronoun),
        "everywhere"      : (A.Adverb),
        "except"          : (A.Preposition),
        "expertly"        : (A.Adverb),
        "faithful"        : (A.Adjective),
        "famous"          : (A.Adjective),
        "fasten"          : (A.Verb),
        "feast"           : (A.Verb|A.Noun),
        "feel"            : (A.Verb),
        "financially"     : (A.Adverb),
        "firmly"          : (A.Adverb),
        "first"           : (A.Adverb),
        "for"             : (A.Preposition|A.Conjunction),
        "frame"           : (A.Verb|A.Noun),
        "fresh"           : (A.Adjective),
        "from"            : (A.Preposition),
        "furniture"       : (A.Noun),
        "gadzooks"        : (A.Interjection),
        "gather"          : (A.Verb),
        "gee"             : (A.Interjection),
        "geese"           : (A.Noun),
        "gentle"          : (A.Adjective),
        "get"             : (A.Verb),
        "gifted"          : (A.Adjective),
        "giraffe"         : (A.Noun),
        "glamorous"       : (A.Adjective),
        "golly"           : (A.Interjection),
        "good"            : (A.Adjective),
        "gosh"            : (A.Interjection),
        "governor"        : (A.Noun),
        "grab"            : (A.Verb),
        "gray"            : (A.Adjective),
        "greasy"          : (A.Adjective),
        "green"           : (A.Adjective),
        "grow"            : (A.Verb),
        "had"             : (A.Verb),
        "haha"            : (A.Interjection),
        "handsome"        : (A.Adjective),
        "hang"            : (A.Verb),
        "happy"           : (A.Adjective),
        "has"             : (A.Verb),
        "have"            : (A.Verb),
        "he"              : (A.Pronoun),
        "helpful"         : (A.Adjective),
        "her"             : (A.Pronoun),
        "here"            : (A.Adverb),
        "hers"            : (A.Pronoun),
        "herself"         : (A.Pronoun),
        "him"             : (A.Pronoun),
        "himself"         : (A.Pronoun),
        "his"             : (A.Pronoun),
        "hissing"         : (A.Verb|A.Adjective),
        "honey"           : (A.Noun),
        "hope"            : (A.Verb|A.Noun),
        "hug"             : (A.Verb|A.Noun),
        "huh"             : (A.Interjection),
        "hydrant"         : (A.Noun),
        "icicle"          : (A.Noun),
        "imagine"         : (A.Verb),
        "important"       : (A.Adjective),
        "in"              : (A.Preposition|A.Adverb),
        "income"          : (A.Noun),
        "inexpensive"     : (A.Adjective),
        "inside"          : (A.Preposition|A.Adverb),
        "into"            : (A.Preposition),
        "is"              : (A.Verb),
        "island"          : (A.Noun),
        "it"              : (A.Pronoun),
        "itch"            : (A.Verb|A.Noun),
        "its"             : (A.Pronoun),
        "jealous"         : (A.Adjective),
        "jeans"           : (A.Noun),
        "jog"             : (A.Verb|A.Noun),
        "jolly"           : (A.Adjective),
        "judge"           : (A.Verb|A.Noun),
        "juicy"           : (A.Adjective),
        "jump"            : (A.Verb|A.Noun),
        "kind"            : (A.Adjective),
        "kinder"          : (A.Adjective),
        "kindest"         : (A.Adjective),
        "lace"            : (A.Verb|A.Noun),
        "lamp"            : (A.Noun),
        "last"            : (A.Adverb),
        "later"           : (A.Adverb),
        "lazy"            : (A.Adjective),
        "lettuce"         : (A.Noun),
        "lie"             : (A.Verb|A.Noun),
        "lightly"         : (A.Adverb),
        "like"            : (A.Verb|A.Preposition),
        "lively"          : (A.Adjective),
        "lock"            : (A.Verb|A.Noun),
        "long"            : (A.Verb|A.Adjective),
        "look"            : (A.Verb|A.Noun),
        "loud"            : (A.Adjective),
        "magnificent"     : (A.Adjective),
        "many"            : (A.Adjective),
        "marble"          : (A.Noun),
        "me"              : (A.Pronoun),
        "mine"            : (A.Pronoun|A.Noun|A.Verb),
        "month"           : (A.Noun),
        "monthly"         : (A.Adverb|A.Adjective),
        "mushy"           : (A.Adjective),
        "my"              : (A.Pronoun),
        "myself"          : (A.Pronoun),
        "mysterious"      : (A.Adjective),
        "near"            : (A.Preposition),
        "nervous"         : (A.Adjective),
        "never"           : (A.Adverb),
        "nor"             : (A.Conjunction),
        "north"           : (A.Noun),
        "nothing"         : (A.Pronoun),
        "now"             : (A.Adverb),
        "numerous"        : (A.Adjective),
        "obedient"        : (A.Adjective),
        "obnoxious"       : (A.Adjective),
        "ocean"           : (A.Noun),
        "of"              : (A.Preposition),
        "off"             : (A.Preposition|A.Adverb),
        "often"           : (A.Adverb),
        "oh"              : (A.Interjection),
        "on"              : (A.Preposition),
        "only"            : (A.Adverb),
        "onto"            : (A.Preposition),
        "open"            : (A.Verb),
        "or"              : (A.Conjunction),
        "our"             : (A.Pronoun),
        "ours"            : (A.Pronoun),
        "out"             : (A.Preposition|A.Adverb),
        "outside"         : (A.Preposition|A.Adverb),
        "over"            : (A.Preposition),
        "ow"              : (A.Interjection),
        "past"            : (A.Preposition),
        "patch"           : (A.Verb|A.Noun),
        "petite"          : (A.Adjective),
        "phew"            : (A.Interjection),
        "phooey"          : (A.Interjection),
        "plain"           : (A.Noun|A.Adjective),
        "plane"           : (A.Noun),
        "playground"      : (A.Noun),
        "poison"          : (A.Verb|A.Noun),
        "promise"         : (A.Verb|A.Noun),
        "proud"           : (A.Adjective),
        "prove"           : (A.Verb),
        "puny"            : (A.Adjective),
        "purple"          : (A.Adjective),
        "quaint"          : (A.Adjective),
        "question"        : (A.Verb|A.Noun),
        "quick"           : (A.Adjective),
        "quickly"         : (A.Adverb),
        "quite"           : (A.Adverb),
        "randomly"        : (A.Adverb),
        "rather"          : (A.Adverb),
        "really"          : (A.Adverb),
        "regularly"       : (A.Adverb),
        "relieved"        : (A.Verb|A.Adjective),
        "remain"          : (A.Verb),
        "rinse"           : (A.Verb|A.Noun),
        "scale"           : (A.Verb|A.Noun),
        "scrawny"         : (A.Adjective),
        "seashore"        : (A.Noun),
        "seem"            : (A.Verb),
        "shall"           : (A.Verb),
        "shallow"         : (A.Adjective),
        "she"             : (A.Pronoun),
        "sheet"           : (A.Noun),
        "shh"             : (A.Interjection),
        "sidewalk"        : (A.Noun),
        "silly"           : (A.Adjective),
        "since"           : (A.Preposition|A.Conjunction),
        "sit"             : (A.Verb),
        "skate"           : (A.Verb|A.Noun),
        "skinny"          : (A.Adjective),
        "sloppily"        : (A.Adverb),
        "smoke"           : (A.Verb|A.Noun),
        "so"              : (A.Adverb|A.Conjunction),
        "somebody"        : (A.Pronoun),
        "someone"         : (A.Pronoun),
        "somewhere"       : (A.Adverb),
        "sorrowfully"     : (A.Adverb),
        "sparkling"       : (A.Adjective),
        "sparse"          : (A.Adjective),
        "stage"           : (A.Verb|A.Noun),
        "station"         : (A.Noun),
        "stay"            : (A.Verb|A.Noun),
        "swift"           : (A.Adjective),
        "talk"            : (A.Verb|A.Noun),
        "tall"            : (A.Adjective),
        "taller"          : (A.Adjective),
        "tallest"         : (A.Adjective),
        "than"            : (A.Conjunction),
        "that"            : (A.Pronoun|A.Conjunction),
        "their"           : (A.Pronoun),
        "theirs"          : (A.Pronoun),
        "them"            : (A.Pronoun),
        "themselves"      : (A.Pronoun),
        "there"           : (A.Adverb),
        "these"           : (A.Pronoun),
        "they"            : (A.Pronoun),
        "this"            : (A.Pronoun),
        "those"           : (A.Pronoun),
        "throat"          : (A.Noun),
        "throne"          : (A.Noun),
        "through"         : (A.Preposition|A.Adverb),
        "throughout"      : (A.Preposition),
        "till"            : (A.Preposition|A.Conjunction),
        "to"              : (A.Preposition),
        "today"           : (A.Adverb),
        "tomorrow"        : (A.Adverb),
        "too"             : (A.Adverb),
        "toothbrush"      : (A.Noun),
        "toward"          : (A.Preposition),
        "truthfully"      : (A.Adverb),
        "turkey"          : (A.Noun),
        "turn"            : (A.Verb|A.Noun),
        "uglier"          : (A.Adjective),
        "ugliest"         : (A.Adjective),
        "ugly"            : (A.Adjective),
        "uh-huh"          : (A.Interjection),
        "under"           : (A.Preposition),
        "underground"     : (A.Adverb),
        "underneath"      : (A.Preposition),
        "underwear"       : (A.Noun),
        "uneasily"        : (A.Adverb),
        "unless"          : (A.Conjunction),
        "unsightly"       : (A.Adjective),
        "untie"           : (A.Verb),
        "until"           : (A.Preposition|A.Conjunction),
        "up"              : (A.Preposition),
        "upon"            : (A.Preposition),
        "upstairs"        : (A.Adverb),
        "us"              : (A.Pronoun),
        "usually"         : (A.Adverb),
        "vanish"          : (A.Verb),
        "vegetable"       : (A.Noun),
        "very"            : (A.Adverb),
        "visit"           : (A.Verb|A.Noun),
        "visitor"         : (A.Noun),
        "walk"            : (A.Verb|A.Noun),
        "was"             : (A.Verb),
        "we"              : (A.Pronoun),
        "wearily"         : (A.Adverb),
        "weirdly"         : (A.Adverb),
        "were"            : (A.Verb),
        "what"            : (A.Pronoun),
        "when"            : (A.Conjunction),
        "whenever"        : (A.Conjunction),
        "where"           : (A.Conjunction),
        "whereas"         : (A.Conjunction),
        "wherever"        : (A.Conjunction),
        "which"           : (A.Pronoun),
        "while"           : (A.Conjunction),
        "who"             : (A.Pronoun),
        "wholeheartedly"  : (A.Adverb),
        "whom"            : (A.Pronoun),
        "whoops"          : (A.Interjection),
        "whose"           : (A.Pronoun),
        "wickedly"        : (A.Adverb),
        "will"            : (A.Verb|A.Noun),
        "willfully"       : (A.Adverb),
        "with"            : (A.Preposition),
        "within"          : (A.Preposition),
        "without"         : (A.Preposition),
        "work"            : (A.Verb|A.Noun),
        "yawn"            : (A.Verb|A.Noun),
        "yeah"            : (A.Interjection),
        "year"            : (A.Noun),
        "yell"            : (A.Verb|A.Noun),
        "yellow"          : (A.Adjective),
        "yes"             : (A.Interjection),
        "yesterday"       : (A.Adverb),
        "yet"             : (A.Conjunction),
        "yikes"           : (A.Interjection),
        "you"             : (A.Pronoun),
        "your"            : (A.Pronoun),
        "yours"           : (A.Pronoun),
      };
    }
    return this.__wordDict;
  }

  static _nameToAttribute() {
    if (!this.__nameToAttribute) {
      this.__nameToAttribute = {
        "prepositions": this.Attributes.Preposition,
        "adverbs":      this.Attributes.Adverb,
        "verbs":        this.Attributes.Verb,
        "nouns":        this.Attributes.Noun,
        "pronouns":     this.Attributes.Pronoun,
        "adjectives":   this.Attributes.Adjective,
        "conjunctions": this.Attributes.Conjunction,
        "interjections":this.Attributes.Interjection,
      };
    }
    return this.__nameToAttribute;
  }

  orderedNames() {
    return [
      "nouns",
      "verbs",
      "adjectives",
      "pronouns",
      "adverbs",
      "prepositions",
      "interjections",
      "conjunctions",
    ];
  }

  roundNameForLevel(level) {
    const ordered = this.orderedNames();
    const idx = level % ordered.length;
    return ordered[idx];
  }

  // map level -> attribute bitflag
  _attributeForLevel(level) {
    const roundName = this.roundNameForLevel(level);
    return this.constructor._nameToAttribute()[roundName];
  }

  generateMatchingValuesForLevel(level) {
    if (this._matchingCache.hasOwnProperty(level)) {
      // return a shallow copy to avoid accidental external mutation
      return this._matchingCache[level].slice();
    }

    const attr = this._attributeForLevel(level);
    const dict = this.constructor._wordDict();

    const keys = Object.keys(dict)
    const result = [];
    for (let i = 0; i < keys.length; i++) {
      const w = keys[i];
      const flags = dict[w];
      if ((flags & attr) !== 0) {
        result.push(w);
      }
    }

    this._matchingCache[level] = result.slice();
    return result.slice();
  }

  generateNonMatchingValuesForLevel(level) {
    if (this._nonMatchingCache.hasOwnProperty(level)) {
      return this._nonMatchingCache[level].slice();
    }

    const attr = this._attributeForLevel(level);
    const dict = this.constructor._wordDict();

    const keys = Object.keys(dict)
    const result = [];
    for (let i = 0; i < keys.length; i++) {
      const w = keys[i];
      const flags = dict[w];
      if ((flags & attr) === 0) {
        result.push(w);
      }
    }

    this._nonMatchingCache[level] = result.slice();
    return result.slice();
  }

  titleForLevel(level) {
    return this.roundNameForLevel(level);
  }

  failureStringForValue(level, value) {
    let roundName = this.roundNameForLevel(level); // plural
    let singular = roundName;
    if (roundName.endsWith("s")) {
      singular = roundName.substring(0, roundName.length - 1);
    }

    const first = singular.charAt(0).toLowerCase();
    const vowels = { a: true, e: true, i: true, o: true, u: true };
    const article = vowels[first] ? "an" : "a";

    return `${value} isn't ${article}\n${singular}`;
  }

  resetLevelCaches() {
    this._matchingCache = {};
    this._nonMatchingCache = {};
  }
}

// export as module and register if required
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameGenerator_Grammar };
}

if (typeof GameGenerators_classes !== 'undefined') {
  GameGenerators_classes["GameGenerator_Grammar"] = GameGenerator_Grammar;
}
