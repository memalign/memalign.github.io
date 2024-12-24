const SSSTPoliticsType = {
    Anarchy: 0,
    Capitalist: 1,
    Communist: 2,
    Confederacy: 3,
    Corporate: 4,
    Cybernetic: 5,
    Democracy: 6,
    Dictatorship: 7,
    Fascist: 8,
    Feudal: 9,
    Military: 10,
    Monarchy: 11,
    Pacifist: 12,
    Socialist: 13,
    Satori: 14,
    Technocracy: 15,
    Theocracy: 16,

    Count: 17
};

function occurrenceStr(x) {
    switch (x) {
        case 0: return "No";
        case 1: return "Minimal";
        case 2: return "Few";
        case 3: return "Some";
        case 4: return "Moderate";
        case 5: return "Many";
        case 6: return "Abundant";
        default: return "Excessive";
    }
}


class SSSTPolitics {
    constructor(type, name, mastheads, headlines, reactionIllegal, occurrencePolice, occurrencePirates, occurrenceTraders, minTechLevel, maxTechLevel, bribeWillingness, drugsTradeable, firearmsTradeable, mostDesiredTradeItem) {
        this.type = type;
        this.name = name;
        this.mastheads = mastheads;
        this.headlines = headlines;
        this.reactionIllegal = reactionIllegal;
        this.occurrencePolice = occurrencePolice;
        this.occurrencePirates = occurrencePirates;
        this.occurrenceTraders = occurrenceTraders;
        this.minTechLevel = minTechLevel;
        this.maxTechLevel = maxTechLevel;
        this.bribeWillingness = bribeWillingness;
        this.drugsTradeable = drugsTradeable;
        this.firearmsTradeable = firearmsTradeable;
        this.mostDesiredTradeItem = mostDesiredTradeItem;
    }

    static randomPoliticsForTechLevel(techLevel) {
        while (true) {
            let politics = SSSTPolitics.politicsForType(gameRand.randomIntBelow(SSSTPoliticsType.Count));
            if (politics.minTechLevel <= techLevel && politics.maxTechLevel >= techLevel) {
                return politics;
            }
        }
    }

    static politicsForType(type) {
        if (!this.sPolitics) {
            this.sPolitics = new Map();
        }

        let politics = this.sPolitics.get(type);

        if (!politics) {
            switch (type) {
                case SSSTPoliticsType.Anarchy:
                    politics = new SSSTPolitics(
                        type,
                        "Anarchist State",
                        ["The %@ Arsenal", "The Grassroot", "Kick It!"],
                        ["Riots, Looting Mar Factional Negotiations.",
                         "Communities Seek Consensus.",
                         "Successful Bakunin Day Rally!",
                         "Major Faction Conflict Expected for the Weekend!"],
                        0,
                        0,
                        7,
                        1,
                        SSSTTechLevel.PreAgricultural,
                        SSSTTechLevel.Industrial,
                        7,
                        true,
                        true,
                        SSSTTradeItemType.Food
                    );
                    break;

                case SSSTPoliticsType.Capitalist:
                    politics = new SSSTPolitics(
                        type,
                        "Capitalist State",
                        ["The Objectivist", "The %@ Market", "The Invisible Hand"],
                        ["Editorial: Taxes Too High!",
                         "Market Indices Read Record Levels!",
                         "Corporate Profits Up!",
                         "Restrictions on Corporate Freedom Abolished by Courts!"],
                        2,
                        3,
                        2,
                        7,
                        SSSTTechLevel.EarlyIndustrial,
                        SSSTTechLevel.HighTech,
                        1,
                        true,
                        true,
                        SSSTTradeItemType.Ore
                    );
                    break;

                case SSSTPoliticsType.Communist:
                    politics = new SSSTPolitics(
                        type,
                        "Communist State",
                        ["The Daily Worker", "The People's Voice", "The %@ Proletariat"],
                        ["Party Reports Productivity Increase.",
                         "Counter-Revolutionary Bureaucrats Purged from Party!",
                         "Party: Bold New Future Predicted!",
                         "Politburo Approves New 5-Year Plan!"],
                        6,
                        6,
                        4,
                        4,
                        SSSTTechLevel.Agricultural,
                        SSSTTechLevel.Industrial,
                        5,
                        true,
                        true,
                        SSSTTradeItemType.None
                    );
                    break;

                case SSSTPoliticsType.Confederacy:
                    politics = new SSSTPolitics(
                        type,
                        "Confederacy",
                        ["Planet News", "The %@ Times", "Interstate Update"],
                        ["States Dispute Natural Resource Rights!",
                         "States Denied Federal Funds over Local Laws!",
                         "Southern States Resist Federal Taxation for Capital Projects!",
                         "States Request Federal Intervention in Citrus Conflict!"],
                        5,
                        4,
                        3,
                        5,
                        SSSTTechLevel.Agricultural,
                        SSSTTechLevel.PostIndustrial,
                        3,
                        true,
                        true,
                        SSSTTradeItemType.Games
                    );
                    break;

                case SSSTPoliticsType.Corporate:
                    politics = new SSSTPolitics(
                        type,
                        "Corporate State",
                        ["%@ Memo", "News From The Board", "Status Report"],
                        ["Robot Shortages Predicted for Q4.",
                         "Profitable Quarter Predicted.",
                         "CEO: Corporate Rebranding Progressing.",
                         "Advertising Budgets to Increase."],
                        2,
                        6,
                        2,
                        7,
                        SSSTTechLevel.EarlyIndustrial,
                        SSSTTechLevel.HighTech,
                        2,
                        true,
                        true,
                        SSSTTradeItemType.Robots
                    );
                    break;

                case SSSTPoliticsType.Cybernetic:
                    politics = new SSSTPolitics(
                        type,
                        "Cybernetic State",
                        ["Pulses", "Binary Stream", "The System Clock"],
                        ["Olympics: Software Beats Wetware in All Events!",
                         "New Network Protocols To Be Deployed.",
                         "Storage Banks to be Upgraded!",
                         "System Backup Rescheduled."],
                        0,
                        7,
                        7,
                        5,
                        SSSTTechLevel.PostIndustrial,
                        SSSTTechLevel.HighTech,
                        0,
                        false,
                        false,
                        SSSTTradeItemType.Ore
                    );
                    break;

                case SSSTPoliticsType.Democracy:
                    politics = new SSSTPolitics(
                        type,
                        "Democracy",
                        ["The Daily Planet", "The %@ Majority", "Unanimity"],
                        ["Local Elections on Schedule!",
                         "Polls: Voter Satisfaction High!",
                         "Campaign Spending Aids Economy!",
                         "Police, Politicians Vow Improvements."],
                        4,
                        3,
                        2,
                        5,
                        SSSTTechLevel.Renaissance,
                        SSSTTechLevel.HighTech,
                        2,
                        true,
                        true,
                        SSSTTradeItemType.Games
                    );
                    break;

                case SSSTPoliticsType.Dictatorship:
                    politics = new SSSTPolitics(
                        type,
                        "Dictatorship",
                        ["The Command", "Leader's Voice", "The %@ Mandate"],
                        ["New Palace Planned; Taxes Increase.",
                         "Future Presents More Opportunities for Sacrifice!",
                         "Insurrection Crushed: Rebels Executed!",
                         "Police Powers to Increase!"],
                        3,
                        4,
                        5,
                        3,
                        SSSTTechLevel.PreAgricultural,
                        SSSTTechLevel.HighTech,
                        2,
                        true,
                        true,
                        SSSTTradeItemType.None
                    );
                    break;

                case SSSTPoliticsType.Fascist:
                    politics = new SSSTPolitics(
                        type,
                        "Fascist State",
                        ["State Tribune", "Motherland News", "Homeland Report"],
                        ["Drug Smugglers Sentenced to Death!",
                         "Aliens Required to Carry Visible Identification at All Times!",
                         "Foreign Sabotage Suspected.",
                         "Stricter Immigration Laws Installed."],
                        7,
                        7,
                        7,
                        1,
                        SSSTTechLevel.EarlyIndustrial,
                        SSSTTechLevel.HighTech,
                        0,
                        false,
                        true,
                        SSSTTradeItemType.Machines
                    );
                    break;

                case SSSTPoliticsType.Feudal:
                    politics = new SSSTPolitics(
                        type,
                        "Feudal State",
                        ["News from the Keep", "The Town Crier", "The %@ Herald"],
                        ["Farmers Drafted to Defend Lord's Castle!",
                         "Report: Kingdoms Near Flashpoint!",
                         "Baron Ignores Ultimatum!",
                         "War of Succession Threatens!"],
                        1,
                        1,
                        6,
                        2,
                        SSSTTechLevel.PreAgricultural,
                        SSSTTechLevel.Renaissance,
                        6,
                        true,
                        true,
                        SSSTTradeItemType.Firearms
                    );
                    break;

                case SSSTPoliticsType.Military:
                    politics = new SSSTPolitics(
                        type,
                        "Military State",
                        ["General Report", "%@ Dispatch", "The %@ Sentry"],
                        ["Court-Martials Up 2% This Year.",
                         "Editorial: Why Wait to Invade?",
                         "HQ: Invasion Plans Reviewed.",
                         "Weapons Research Increases Kill-Ratio!"],
                        7,
                        7,
                        0,
                        6,
                        SSSTTechLevel.Medieval,
                        SSSTTechLevel.HighTech,
                        0,
                        false,
                        true,
                        SSSTTradeItemType.Robots
                    );
                    break;

                case SSSTPoliticsType.Monarchy:
                    politics = new SSSTPolitics(
                        type,
                        "Monarchy",
                        ["Royal Times", "The Loyal Subject", "The Fanfare"],
                        ["King to Attend Celebrations.",
                         "Queen's Birthday Celebration Ends in Riots!",
                         "King Commissions New Artworks.",
                         "Prince Exiled for Palace Plot!"],
                        3,
                        4,
                        3,
                        4,
                        SSSTTechLevel.PreAgricultural,
                        SSSTTechLevel.Industrial,
                        4,
                        true,
                        true,
                        SSSTTradeItemType.Medicine
                    );
                    break;

                case SSSTPoliticsType.Pacifist:
                    politics = new SSSTPolitics(
                        type,
                        "Pacifist State",
                        ["Pax Humani", "Principle", "The %@ Chorus"],
                        ["Dialog Averts Eastern Conflict!",
                         "Universal Peace: Is it Possible?",
                         "Editorial: Life in Harmony.",
                         "Polls: Happiness Quotient High!"],
                        7,
                        2,
                        1,
                        5,
                        SSSTTechLevel.PreAgricultural,
                        SSSTTechLevel.Renaissance,
                        1,
                        true,
                        false,
                        SSSTTradeItemType.None
                    );
                    break;

            case SSSTPoliticsType.Socialist:
                politics = new SSSTPolitics(
                    type,
                    "Socialist State",
                    ["All for One", "Brotherhood", "The People's Syndicate"],
                    ["Government Promises Increased Welfare Benefits!",
                     "State Denies Food Rationing Required to Prevent Famine.",
                     "'Welfare Actually Boosts Economy,' Minister Says.",
                     "Hoarder Lynched by Angry Mob!"],
                    4,
                    2,
                    5,
                    3,
                    SSSTTechLevel.PreAgricultural,
                    SSSTTechLevel.Industrial,
                    6,
                    true,
                    true,
                    SSSTTradeItemType.None
                );
                break;

            case SSSTPoliticsType.Satori:
                politics = new SSSTPolitics(
                    type,
                    "State of Satori",
                    ["The Daily Koan", "Haiku", "One Hand Clapping"],
                    ["Millions at Peace.",
                     "Sun Rises.",
                     "Countless Hearts Awaken.",
                     "Serenity Reigns."],
                    0,
                    1,
                    1,
                    1,
                    SSSTTechLevel.PreAgricultural,
                    SSSTTechLevel.Agricultural,
                    0,
                    false,
                    false,
                    SSSTTradeItemType.None
                );
                break;

            case SSSTPoliticsType.Technocracy:
                politics = new SSSTPolitics(
                    type,
                    "Technocracy",
                    ["The Future", "Hardware Dispatch", "TechNews"],
                    ["New Processor Hits 10 ZettaHerz!",
                     "Nanobot Output Exceeds Expectation.",
                     "Last Human Judge Retires.",
                     "Software Bug Causes Mass Confusion."],
                    1,
                    6,
                    3,
                    6,
                    SSSTTechLevel.EarlyIndustrial,
                    SSSTTechLevel.HighTech,
                    2,
                    true,
                    true,
                    SSSTTradeItemType.Water
                );
                break;

            case SSSTPoliticsType.Theocracy:
                politics = new SSSTPolitics(
                    type,
                    "Theocracy",
                    ["The Spiritual Advisor", "Church Tidings", "The Temple Tribune"],
                    ["High Priest to Hold Special Services.",
                     "Temple Restoration Fund at 81%.",
                     "Sacred Texts on Public Display.",
                     "Dozen Blasphemers Excommunicated!"],
                    5,
                    6,
                    1,
                    4,
                    SSSTTechLevel.PreAgricultural,
                    SSSTTechLevel.EarlyIndustrial,
                    0,
                    true,
                    true,
                    SSSTTradeItemType.Narcotics
                );
                break;

                default:
                    break;
            }

            if (politics) {
                this.sPolitics.set(type, politics);
            }
        }

        return politics;
    }
}
