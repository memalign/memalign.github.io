const MAEventType = {
  Munch: 0,
  MuncherMove: 1,
  MunchedBadEat: 2,
  LevelCleared: 3,
  TroggleEatsMuncher: 4,
  TroggleDiesInSafeSquare: 5,
  TroggleMove: 6,
  TrogglePending: 7,
  TroggleMunch: 8,
  SafeSquareAdded: 9,
  SafeSquareRemoved: 10,
  TroggleMovedOffscreen: 11,
  ExtraLife: 12,
}
Object.freeze(MAEventType)

class MAEvent {
  // Properties:
  // - type (MAEventType)
  // - x (int, grid location)
  // - y (int, grid location)
  // - str (string, optional string to show in the UI)
  // - characterType (MACharacterType, optional, only for TroggleDiesInSafeSquare)
  constructor(eventType, x, y, str, characterType) {
    this.type = eventType
    this.x = x
    this.y = y
    this.str = str ? str : null
    this.characterType = characterType ? characterType : null
  }
}

class MAMoveEvent extends MAEvent {
  // Properties:
  // - startGridX (int)
  // - startGridY (int)
  // - endGridX (int)
  // - endGridY (int)
  // - direction (MADirection)
  constructor(eventType, startGridX, startGridY, endGridX, endGridY, direction, str = null, characterType = null) {
    super(eventType, endGridX, endGridY, str, characterType);
    this.startGridX = startGridX;
    this.startGridY = startGridY;
    this.endGridX = endGridX;
    this.endGridY = endGridY;
    this.direction = direction;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MAEventType,
    MAEvent,
    MAMoveEvent,
  };
}
