const SSSTTechLevel = {
    PreAgricultural: 0,
    Agricultural: 1,
    Medieval: 2,
    Renaissance: 3,
    EarlyIndustrial: 4,
    Industrial: 5,
    PostIndustrial: 6,
    HighTech: 7,
    Count: 8,
};

const TECH_LEVEL_STR = (x) => {
    switch (x) {
        case SSSTTechLevel.PreAgricultural: return "Pre-agricultural";
        case SSSTTechLevel.Agricultural: return "Agricultural";
        case SSSTTechLevel.Medieval: return "Medieval";
        case SSSTTechLevel.Renaissance: return "Renaissance";
        case SSSTTechLevel.EarlyIndustrial: return "Early Industrial";
        case SSSTTechLevel.Industrial: return "Industrial";
        case SSSTTechLevel.PostIndustrial: return "Post-industrial";
        case SSSTTechLevel.HighTech: return "High-tech";
        default: return "";
    }
};

const SSSTStatus = {
    Uneventful: 0,
    AtWar: 1,
    Plague: 2,
    Drought: 3,
    Boredom: 4,
    ColdSpell: 5,
    CropFailure: 6,
    LackWorkers: 7,
    Count: 8,
};

const STATUS_STR = (x) => {
    switch (x) {
        case SSSTStatus.Uneventful: return "under no particular pressure";
        case SSSTStatus.AtWar: return "at war";
        case SSSTStatus.Plague: return "ravaged by a plague";
        case SSSTStatus.Drought: return "suffering from a drought";
        case SSSTStatus.Boredom: return "suffering from extreme boredom";
        case SSSTStatus.ColdSpell: return "suffering from a cold spell";
        case SSSTStatus.CropFailure: return "suffering from crop failure";
        case SSSTStatus.LackWorkers: return "lacking enough workers";
        default: return "";
    }
};

const SSSTResource = {
    None: 0,
    MineralRich: 1,
    MineralPoor: 2,
    Desert: 3,
    SweetwaterOceans: 4,
    RichSoil: 5,
    PoorSoil: 6,
    RichFauna: 7,
    Lifeless: 8,
    WeirdMushrooms: 9,
    SpecialHerbs: 10,
    Artistic: 11,
    Warlike: 12,
    Count: 13,
};

const RESOURCES_STR = (x) => {
    switch (x) {
        case SSSTResource.None: return "Nothing special";
        case SSSTResource.MineralRich: return "Mineral rich";
        case SSSTResource.MineralPoor: return "Mineral poor";
        case SSSTResource.Desert: return "Desert";
        case SSSTResource.SweetwaterOceans: return "Sweetwater oceans";
        case SSSTResource.RichSoil: return "Rich soil";
        case SSSTResource.PoorSoil: return "Poor soil";
        case SSSTResource.RichFauna: return "Rich fauna";
        case SSSTResource.Lifeless: return "Lifeless";
        case SSSTResource.WeirdMushrooms: return "Weird mushrooms";
        case SSSTResource.SpecialHerbs: return "Special herbs";
        case SSSTResource.Artistic: return "Artistic populace";
        case SSSTResource.Warlike: return "Warlike populace";
        default: return "";
    }
};

const SSSTTradeItemType = {
    None: -1,
    Water: 0,
    Furs: 1,
    Food: 2,
    Ore: 3,
    Games: 4,
    Firearms: 5,
    Medicine: 6,
    Machines: 7,
    Narcotics: 8,
    Robots: 9,
    Count: 10,
    FakeQuestCargoStart: 11,
    FakeQuestCargo: 11,
    FakeQuestCargoReactor: 12,
};

const TRADE_ITEM_IS_ILLEGAL = (x) => {
    return x === SSSTTradeItemType.Firearms || x === SSSTTradeItemType.Narcotics;
};
