// Constants
const MOON_PRICE = 500000;

const SQR = (x) => (x * x);

// Enumerations
const SSSTDifficulty = {
    Beginner: 0,
    Easy: 1,
    Normal: 2,
    Hard: 3,
    Absurd: 4,
    Count: 5
};

const ADJUST_SKILL_FOR_DIFFICULTY = (skill, difficulty) => {
    MAUtils.ensureInteger(skill)
    MAUtils.ensureInteger(difficulty)
    if (difficulty <= SSSTDifficulty.Easy) {
        return skill + 1;
    } else if (difficulty == SSSTDifficulty.Absurd) {
        return Math.max(2, skill) - 1;
    } else {
        return skill;
    }
};

const SKILL_BONUS = 3;
const CLOAK_BONUS = 2;

const DIFFICULTY_STR = (x) => {
    switch (x) {
        case SSSTDifficulty.Beginner:
            return "Beginner";
        case SSSTDifficulty.Easy:
            return "Easy";
        case SSSTDifficulty.Normal:
            return "Normal";
        case SSSTDifficulty.Hard:
            return "Hard";
        case SSSTDifficulty.Absurd:
            return "Absurd";
        default:
            return "Unknown";
    }
};

const SSSTSystemSize = {
    Tiny: 0,
    Small: 1,
    Medium: 2,
    Large: 3,
    Huge: 4,
    Count: 5
};

const SYSTEM_SIZE_STR = (x) => {
    switch (x) {
        case SSSTSystemSize.Tiny:
            return "Tiny";
        case SSSTSystemSize.Small:
            return "Small";
        case SSSTSystemSize.Medium:
            return "Medium-sized";
        case SSSTSystemSize.Large:
            return "Large";
        case SSSTSystemSize.Huge:
            return "Huge";
        default:
            return "Unknown";
    }
};

// Quest Status Enumerations
const SSSTJaporiQuestStatus = {
    Open: 0,
    HasMedicine: 1,
    Closed: 2
};

const SSSTScarabQuestStatus = {
    Open: 0,
    ScarabExists: 1,
    ScarabDestroyed: 2,
    Closed: 3
};

const SSSTMonsterQuestStatus = {
    Open: 0,
    MonsterExists: 1,
    ClosedMonsterDestroyed: 2
};

const SSSTDragonflyQuestStatus = {
    Open: 0,
    GoToBaratas: 1,
    GoToMelina: 2,
    GoToRegulas: 3,
    GoToZalkon: 4,
    ClosedDragonflyDestroyed: 5
};

const SSSTInvasionQuestStatus = {
    Open: 0,
    DaysUntilInvasion: {
        _7: 1,
        _6: 2,
        _5: 3,
        _4: 4,
        _3: 5,
        _2: 6,
        _1: 7
    },
    ClosedTooLate: 8,
    ClosedSaved: 9,
    ClosedRewardClaimed: 10
};

const SSSTExperimentQuestStatus = {
    Open: 0,
    DaysRemaining: {
        _10: 1,
        _9: 2,
        _8: 3,
        _7: 4,
        _6: 5,
        _5: 6,
        _4: 7,
        _3: 8,
        _2: 9,
        _1: 10
    },
    ClosedTooLate: 11,
    ClosedSaved: 12
};

const REACTOR_BAY_COUNT = 5;
const REACTOR_MAX_FUEL = 10;

const SSSTReactorQuestStatus = {
    Open: 0,
    DaysRemaining: {
      _20: 1,
      _1: 20,
    },
    ClosedTooLate: 21,
    ClosedSaved: 22
};

const SSSTJarekQuestStatus = {
    Open: 0,
    OnBoard: 1,
    Closed: 2
};

const SSSTWildQuestStatus = {
    Open: 0,
    OnBoard: 1,
    Closed: 2
};

const SSSTSpecialEvent = {
    None: -1,
    // Fixed locations
    DragonflyDestroyed: 0,
    FlyBaratas: 1,
    FlyMelina: 2,
    FlyRegulas: 3,
    MonsterKilled: 4,
    MedicineDelivery: 5,
    MoonBought: 6,
    ScarabDestroyed: 7,
    ReactorDelivered: 8,
    JarekGetsOut: 9,
    GemulonRescued: 10,
    ExperimentStopped: 11,
    ExperimentNotStopped: 12,
    WildGetsOut: 13,
    // Random locations
    MoonForSale: 14,
    SkillIncrease: 15,
    Tribble: 16,
    EraseRecord: 17,
    BuyTribble: 18,
    SpaceMonster: 19,
    Dragonfly: 20,
    CargoForSale: 21,
    InstallLightningShield: 22,
    JaporiDisease: 23,
    LotteryWinner: 24,
    ArtifactDelivered: 25,
    AlienArtifact: 26,
    AmbassadorJarek: 27,
    AlienInvasion: 28,
    GemulonInvaded: 29,
    GetFuelCompactor: 30,
    Experiment: 31,
    TransportWild: 32,
    GetReactor: 33,
    GetSpecialLaser: 34,
    Scarab: 35,
    GetHullUpgraded: 36,
    Count: 37
};
