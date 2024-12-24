const SSSTEncounterType = {
    None: 0,

    PoliceInspection: 1,
    PoliceIgnore: 2,
    PoliceAttack: 3,
    PoliceFlee: 4,

    PoliceStart: 1,
    PoliceEnd: 4,

    PirateIgnore: 5,
    PirateAttack: 6,
    PirateFlee: 7,
    PirateSurrender: 8,

    PirateStart: 5,
    PirateEnd: 8,

    TraderIgnore: 9,
    TraderAttack: 10,
    TraderFlee: 11,
    TraderSurrender: 12,
    TraderSell: 13,
    TraderBuy: 14,
    TraderNoTrade: 15,

    TraderStart: 9,
    TraderEnd: 15,

    FamousCaptainAhabEncounter: 16,
    FamousCaptainAhabAttack: 17,
    FamousCaptainConradEncounter: 18,
    FamousCaptainConradAttack: 19,
    FamousCaptainHuieEncounter: 20,
    FamousCaptainHuieAttack: 21,

    FamousCaptainStart: 16,
    FamousCaptainEnd: 21,

    MarieCelesteEncounter: 22,
    PostMarieCelestePoliceEncounter: 23,

    BottleGood: 24,
    BottleOld: 25,

    ScarabIgnore: 26,
    ScarabAttack: 27,

    ScarabStart: 26,
    ScarabEnd: 27,

    MonsterIgnore: 28,
    MonsterAttack: 29,

    MonsterStart: 28,
    MonsterEnd: 29,

    DragonflyIgnore: 30,
    DragonflyAttack: 31,

    DragonflyStart: 30,
    DragonflyEnd: 31,
};

const CAPTAIN_NAME_STR = (x) => {
    switch (x) {
        case SSSTEncounterType.FamousCaptainAhabEncounter:
        case SSSTEncounterType.FamousCaptainAhabAttack:
            return "Ahab";
        case SSSTEncounterType.FamousCaptainConradEncounter:
        case SSSTEncounterType.FamousCaptainConradAttack:
            return "Conrad";
        default:
            return "Huie";
    }
};

const ATTACK_CAPTAIN_NEWS = (x) => {
    switch (x) {
        case SSSTEncounterType.FamousCaptainAhabEncounter:
        case SSSTEncounterType.FamousCaptainAhabAttack:
            return "Thug Assaults Captain Ahab!";
        case SSSTEncounterType.FamousCaptainConradEncounter:
        case SSSTEncounterType.FamousCaptainConradAttack:
            return "Captain Conrad Comes Under Attack By Criminal!";
        default:
            return "Famed Captain Huie Attacked by Brigand!";
    }
};

const DESTROY_CAPTAIN_NEWS = (x) => {
    switch (x) {
        case SSSTEncounterType.FamousCaptainAhabEncounter:
        case SSSTEncounterType.FamousCaptainAhabAttack:
            return "Destruction of Captain Ahab's Ship Causes Anger!";
        case SSSTEncounterType.FamousCaptainConradEncounter:
        case SSSTEncounterType.FamousCaptainConradAttack:
            return "Captain Conrad's Ship Destroyed by Villain!";
        default:
            return "Citizens Mourn Destruction of Captain Huie's Ship!";
    }
};

const CAPTAIN_PROMPT_STR = (x) => {
    switch (x) {
        case SSSTEncounterType.FamousCaptainAhabEncounter:
        case SSSTEncounterType.FamousCaptainAhabAttack:
            return "Captain Ahab, one of the greatest pilots of all time, is in need of a shield for an upcoming mission. To save the time it would take to land and find a vendor, Ahab is offering to trade you some piloting lessons in exchange for one reflective shield.";
        case SSSTEncounterType.FamousCaptainConradEncounter:
        case SSSTEncounterType.FamousCaptainConradAttack:
            return "Captain Conrad, fleet historian and inventor of the modern warp drive, is in need of a laser to test her new shield design. Unfortunately, she's used up her R&D budget for the year. Instead of cash, she'll trade you some engineering lessons in exchange for one military laser.";
        default:
            return "Captain Huie, former Trade Commissioner of the Galactic Council, is in need of a laser for an upcoming mission. Huie is known for driving a hard bargain and is offering some secrets of doing business in exchange for one military laser.";
    }
};

const ENCOUNTERT = (T, TYPE) => T >= SSSTEncounterType[`${TYPE}Start`] && T <= SSSTEncounterType[`${TYPE}End`];
const ENCOUNTER = (type, TYPE) => ENCOUNTERT(type, TYPE);

// Update these with the other attack/ignore/flee types when they're added:
const ENCOUNTERT_FLEE = (T) => [SSSTEncounterType.PoliceFlee, SSSTEncounterType.PirateFlee, SSSTEncounterType.TraderFlee].includes(T);
const ENCOUNTER_FLEE = (type) => ENCOUNTERT_FLEE(type);

const ENCOUNTER_ATTACK = (type) => [
    SSSTEncounterType.PoliceAttack,
    SSSTEncounterType.PirateAttack,
    SSSTEncounterType.TraderAttack,
    SSSTEncounterType.FamousCaptainAhabAttack,
    SSSTEncounterType.FamousCaptainConradAttack,
    SSSTEncounterType.FamousCaptainHuieAttack,
    SSSTEncounterType.ScarabAttack,
    SSSTEncounterType.MonsterAttack,
    SSSTEncounterType.DragonflyAttack
].includes(type);

const ENCOUNTER_IGNORE = (type) => [
    SSSTEncounterType.PoliceIgnore,
    SSSTEncounterType.PirateIgnore,
    SSSTEncounterType.TraderIgnore,
    SSSTEncounterType.ScarabIgnore,
    SSSTEncounterType.MonsterIgnore,
    SSSTEncounterType.DragonflyIgnore
].includes(type);

const ENCOUNTER_SURRENDER = (type) => [
    SSSTEncounterType.PirateSurrender,
    SSSTEncounterType.TraderSurrender
].includes(type);

const FAMOUS_ATTACK_TYPE = (type) => ENCOUNTER_ATTACK(type) ? type : type + 1;

const SSSTEncounterMode = {
    Manual: 0,
    AutoAttack: 1,
    AutoFlee: 2,
};

const ENCOUNTER_MODE_AUTO = (encounterMode) => [SSSTEncounterMode.AutoAttack, SSSTEncounterMode.AutoFlee].includes(encounterMode);


class SSSTEncounterController {
    constructor(type, game, opponent) {
        MAUtils.ensureInteger(type)
        MAUtils.ensureType(game, "object")
        MAUtils.ensureType(opponent, "object")

        this._type = type;
        this._game = game;
        this._opponent = opponent;
        this._encounterActionUpdate = null;
        this._actionTaken = false;
        this._encounterMode = 0;
        this._autoEncounterSession = 0;
        this.delegate = null;
    }

    get type() {
      return this._type
    }

    get opponent() {
      return this._opponent
    }

    encounterText() {
        let text = "";

        let clicks = this._game.commander.travelClicksRemaining;
        text += `At ${clicks} click${clicks === 1 ? "" : "s"} from ${this._game.commander.currentSystem.name} you encounter`;

        if (ENCOUNTER(this._type, "Police")) {
            text += " a police ";
        } else if (ENCOUNTER(this._type, "Pirate")) {
            if (this._opponent.ship.type === SSSTShipModelType.Mantis) {
                text += " an alien ";
            } else {
                text += " a pirate ";
            }
        } else if (ENCOUNTER(this._type, "Trader")) {
            text += " a trader ";
        } else if (ENCOUNTER(this._type, "Scarab") || ENCOUNTER(this._type, "Dragonfly")) {
            text += " a stolen ";
        } else if (ENCOUNTER(this._type, "Monster")) {
            text += " the terrifying ";
        }

        if (ENCOUNTER(this._type, "FamousCaptain")) {
            text += ` the famous Captain ${CAPTAIN_NAME_STR(this._type)}.`;
        } else if (this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
            text += " the Customs Police.";
        } else if (this._type === SSSTEncounterType.MarieCelesteEncounter) {
            text += " a drifting ship.";
        } else if (this._type === SSSTEncounterType.BottleGood || this._type === SSSTEncounterType.BottleOld) {
            text += " a floating bottle.";
        } else {
            text += `${this._opponent.ship.model.name}.`;
        }

        text += "\n\n";

        if (this._type === SSSTEncounterType.PoliceInspection) {
            text += "The police summon you to submit to an inspection.";
        } else if (!this._actionTaken && this._type === SSSTEncounterType.PoliceAttack && this._game.commander.policeRecordScore > SSSTPoliceRecordScore.Criminal) {
            text += "The police hail that they want you to surrender.";
        } else if (ENCOUNTER_FLEE(this._type)) {
            text += "Your opponent is fleeing.";
        } else if (ENCOUNTER_ATTACK(this._type)) {
            text += "Your opponent attacks.";
        } else if (ENCOUNTER_IGNORE(this._type)) {
            if (this._game.commander.ship.shipOwnedByCommanderIsCloakedToOpponent(this._game.commander, this._opponent)) {
                text += "It doesn't notice you.";
            } else {
                text += "It ignores you.";
            }
        } else if (this._type === SSSTEncounterType.TraderSell || this._type === SSSTEncounterType.TraderBuy) {
            text += "You are hailed with an offer to trade goods.";
        } else if (this._type === SSSTEncounterType.TraderSurrender || this._type === SSSTEncounterType.PirateSurrender) {
            text += "Your opponent hails to surrender to you.";
        } else if (ENCOUNTER(this._type, "FamousCaptain") && !ENCOUNTER_ATTACK(this._type)) {
            text += "The captain requests a brief meeting with you.";
        } else if (this._type === SSSTEncounterType.MarieCelesteEncounter) {
            text += "The Marie Celeste appears to be completely abandoned.";
        } else if (this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
            text += 'The police hail with a warning, "We know you removed illegal goods from the Marie Celeste. You must give them up at once!"';
        } else if (this._type === SSSTEncounterType.BottleGood || this._type === SSSTEncounterType.BottleOld) {
            text += "It appears to be a rare bottle of Captain Marmoset's Amazing Skill Tonic!";
        }

        if (this._encounterActionUpdate) {
            if (!text.endsWith("\n")) {
                text += "\n";
            }
            text += this._encounterActionUpdate;
        }

        return text;
    }

    encounterButtons() {
        let buttons = [];

        MAUtils.ensureInteger(this._encounterMode)

        if (ENCOUNTER_MODE_AUTO(this._encounterMode)) {
            buttons.push("Interrupt");
        }

        if (this._type === SSSTEncounterType.PoliceInspection) {
            buttons.push("Attack", "Flee", "Submit", "Bribe");
        } else if ([SSSTEncounterType.PoliceFlee, SSSTEncounterType.TraderFlee, SSSTEncounterType.PirateFlee].includes(this._type)) {
            buttons.push("Attack", "Ignore");
        } else if ([SSSTEncounterType.PirateAttack, SSSTEncounterType.PoliceAttack, SSSTEncounterType.ScarabAttack].includes(this._type)) {
            buttons.push("Attack", "Flee", "Surrender");
        } else if ([SSSTEncounterType.TraderAttack, SSSTEncounterType.MonsterAttack, SSSTEncounterType.DragonflyAttack].includes(this._type) || (ENCOUNTER(this._type, "FamousCaptain") && ENCOUNTER_ATTACK(this._type))) {
            buttons.push("Attack", "Flee");
        } else if ([SSSTEncounterType.TraderIgnore, SSSTEncounterType.PoliceIgnore, SSSTEncounterType.PirateIgnore, SSSTEncounterType.ScarabIgnore, SSSTEncounterType.MonsterIgnore, SSSTEncounterType.DragonflyIgnore].includes(this._type)) {
            buttons.push("Attack", "Ignore");
        } else if ([SSSTEncounterType.TraderSurrender, SSSTEncounterType.PirateSurrender].includes(this._type)) {
            buttons.push("Attack", "Plunder");
        } else if ([SSSTEncounterType.TraderSell, SSSTEncounterType.TraderBuy].includes(this._type)) {
            buttons.push("Attack", "Ignore", "Trade");
        } else if (ENCOUNTER(this._type, "FamousCaptain") && !ENCOUNTER_ATTACK(this._type)) {
            buttons.push("Attack", "Ignore", "Meet");
        } else if (this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
            buttons.push("Attack", "Flee", "Yield", "Bribe");
        } else if (this._type === SSSTEncounterType.MarieCelesteEncounter) {
            buttons.push("Board", "Ignore");
        } else if ([SSSTEncounterType.BottleGood, SSSTEncounterType.BottleOld].includes(this._type)) {
            buttons.push("Drink", "Ignore");
        }

        this.constructor._addAutoFor("Attack", buttons);
        this.constructor._addAutoFor("Flee", buttons);

        this.constructor._pruneActionsFor(
            this._encounterMode === SSSTEncounterMode.AutoFlee ? "Flee" :
            this._encounterMode === SSSTEncounterMode.AutoAttack ? "Attack" : null,
            buttons
        );

        return buttons;
    }

    static _pruneActionsFor(toPrune, buttons) {
        if (!toPrune) {
            return;
        }

        const toRemoveIndexes = [];
        buttons.forEach((label, idx) => {
            if (label.endsWith(toPrune)) {
                toRemoveIndexes.push(idx);
            }
        });

        for (let i = toRemoveIndexes.length - 1; i >= 0; i--) {
            buttons.splice(toRemoveIndexes[i], 1);
        }
    }

    static _addAutoFor(label, buttons) {
        let addIndex = -1;
        buttons.forEach((buttonLabel, idx) => {
            if (buttonLabel === label) {
                addIndex = idx;
            }
        });

        if (addIndex !== -1) {
            buttons.splice(addIndex + 1, 0, `Auto-${label}`);
        }
    }

    invalidate() {
        this.delegate = null;
        this._endAutoEncounters();
    }

    performAction(action) {
        MAUtils.ensureType(action, "string")
        MAUtils.ensureInteger(this._encounterMode)

        this._actionTaken = true;

        // End auto-encounters before the action is performed and our delegate is called to update the UI
        if ((this._encounterMode === SSSTEncounterMode.AutoAttack) && !action.endsWith("Attack")) {
            pLog.log(48)
            this._endAutoEncounters();
        } else if ((this._encounterMode === SSSTEncounterMode.AutoFlee) && !action.endsWith("Flee")) {
            pLog.log(49)
            this._endAutoEncounters();
        }

        if (action === "Auto-Attack") {
            this._encounterMode = SSSTEncounterMode.AutoAttack;
            this.performAction("Attack");
            pLog.log(50)
            return;
        } else if (action === "Auto-Flee") {
            this._encounterMode = SSSTEncounterMode.AutoFlee;
            this.performAction("Flee");
            pLog.log(51)
            return;
        } else if (action === "Attack") {
            const performAttack = () => {
                const executeActionBlock = () => {
                    MAUtils.ensureInteger(this._type)

                    this._executeAction(false, (fightContinues) => {
                        MAUtils.ensureBool(fightContinues)
                        fightContinues = fightContinues && (this._game.commander.ship.hull > 0);
                        this.delegate.encounterControllerEncounterContinues(this, fightContinues);
                    });
                };

                if (ENCOUNTER(this._type, "Police") || this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
                    const executePoliceActionBlock = () => {
                        if (this._game.commander.policeRecordScore > SSSTPoliceRecordScore.Criminal) {
                            this._game.commander.policeRecordScore = SSSTPoliceRecordScore.Criminal;
                        }

                        this._game.commander.policeRecordScore = this._game.commander.policeRecordScore + ATTACK_POLICE_SCORE;

                        if (this._type !== SSSTEncounterType.PoliceFlee) {
                            this._type = SSSTEncounterType.PoliceAttack;
                        }

                        executeActionBlock();
                    };

                    if (this._game.commander.policeRecordScore > SSSTPoliceRecordScore.Criminal) {
                      const alertString = "Are you sure you wish to attack the police? This will turn you into a criminal!";

                      let aC = new SSSTAlertViewController(alertString)
                      aC.addAction("Ok, I won't.", SSSTAlertActionType.Default, null)

                      aC.addAction("Attack", SSSTAlertActionType.Destructive, () => {
                        executePoliceActionBlock();
                      })

                      this._presentAlertController(aC);

                      return;
                    }

                    executePoliceActionBlock();
                    return;

                } else if (ENCOUNTER(this._type, "Pirate")) {
                    if (this._type === SSSTEncounterType.PirateIgnore) {
                        this._type = SSSTEncounterType.PirateAttack;
                    }
                } else if (ENCOUNTER(this._type, "Trader")) {
                    const executeTraderActionBlock = () => {
                        if (this._type !== SSSTEncounterType.TraderFlee) {
                            if (this._opponent.ship.weapons.length <= 0) {
                                this._type = SSSTEncounterType.TraderFlee;
                            } else if (gameRand.randomIntBelow(SSSTReputationScore.Elite) <= (this._game.commander.reputationScore * 10 / (1 + this._opponent.ship.type))) {
                                this._type = SSSTEncounterType.TraderFlee;
                            } else {
                                this._type = SSSTEncounterType.TraderAttack;
                            }
                        }

                        executeActionBlock();
                    };

                    if ([SSSTEncounterType.TraderIgnore, SSSTEncounterType.TraderBuy, SSSTEncounterType.TraderSell].includes(this._type)) {
                        if (this._game.commander.policeRecordScore >= SSSTPoliceRecordScore.Clean) {
                            const alertString = "Are you sure you wish to attack the trader? This will make the police suspicious of you!";




                            let aC = new SSSTAlertViewController(alertString)
                            aC.addAction("Ok, I won't.", SSSTAlertActionType.Default, null)

                            aC.addAction("Attack", SSSTAlertActionType.Destructive, () => {
                                this._game.commander.policeRecordScore = SSSTPoliceRecordScore.Dubious;

                                executeTraderActionBlock();
                            })

                            this._presentAlertController(aC);

                            return;

                        } else {
                            this._game.commander.policeRecordScore = this._game.commander.policeRecordScore + ATTACK_TRADER_SCORE;
                        }
                    }

                    executeTraderActionBlock();
                    return;
                } else if (ENCOUNTER(this._type, "FamousCaptain")) {
                    const executeFamousCaptainActionBlock = () => {
                        this._type = FAMOUS_ATTACK_TYPE(this._type);
                        executeActionBlock();
                    };

                    if (!ENCOUNTER_ATTACK(this._type)) {
                        const alertString = "Famous captains get famous by, among other things, destroying everyone who attacks them. Do you really want to attack?";



                        let aC = new SSSTAlertViewController(alertString)
                        aC.addAction("Ok, I won't.", SSSTAlertActionType.Default, null)

                        aC.addAction("Attack", SSSTAlertActionType.Destructive, () => {
                            pLog.log(104)
                            let policeScore = this._game.commander.policeRecordScore;
                            policeScore = Math.min(policeScore, SSSTPoliceRecordScore.Villain) + ATTACK_TRADER_SCORE;
                            this._game.commander.policeRecordScore = policeScore;

                            this._game.addBreakingNewsItem(ATTACK_CAPTAIN_NEWS(this._type));

                            executeFamousCaptainActionBlock();
                        })

                        this._presentAlertController(aC);
                        return;
                    }

                    executeFamousCaptainActionBlock();
                    return;
                } else if (ENCOUNTER(this._type, "Scarab")) {
                    if (this._type === SSSTEncounterType.ScarabIgnore) {
                        this._type = SSSTEncounterType.ScarabAttack;
                    }
                } else if (ENCOUNTER(this._type, "Monster")) {
                    if (this._type === SSSTEncounterType.MonsterIgnore) {
                        this._type = SSSTEncounterType.MonsterAttack;
                    }
                } else if (ENCOUNTER(this._type, "Dragonfly")) {
                    if (this._type === SSSTEncounterType.DragonflyIgnore) {
                        this._type = SSSTEncounterType.DragonflyAttack;
                    }
                }

                executeActionBlock();
            };

            if (this._type === SSSTEncounterType.PoliceInspection &&
                this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Firearms) <= 0 &&
                this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics) <= 0) {
                const alertString = "Are you sure you want to attack? You're not carrying illegal goods so it should be safe to submit.";

                let aC = new SSSTAlertViewController(alertString)
                aC.addAction("Ok, I won't.", SSSTAlertActionType.Default, null)

                aC.addAction("Attack", SSSTAlertActionType.Destructive, () => {
                    performAttack();
                })

                this._presentAlertController(aC);
                return;
            }

            performAttack();



        } else if (action === "Flee") {
            const performFlee = () => {
                if (this._type === SSSTEncounterType.PoliceInspection) {
                    this._type = SSSTEncounterType.PoliceAttack;

                    if (this._game.commander.policeRecordScore > SSSTPoliceRecordScore.Dubious) {
                        this._game.commander.policeRecordScore = SSSTPoliceRecordScore.Dubious - (this._game.difficulty < SSSTDifficulty.Normal ? 0 : 1);
                    } else {
                        this._game.commander.policeRecordScore = this._game.commander.policeRecordScore + FLEE_FROM_INSPECTION_SCORE;
                    }
                } else if (this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
                    this._type = SSSTEncounterType.PoliceAttack;
                    this._game.commander.policeRecordScore = Math.min(SSSTPoliceRecordScore.Criminal, this._game.commander.policeRecordScore + ATTACK_POLICE_SCORE);
                }

                this._executeAction(true, (fightContinues) => {
                    fightContinues = fightContinues && (this._game.commander.ship.hull > 0);
                    this.delegate.encounterControllerEncounterContinues(this, fightContinues);
                });
            };

            let alertString = null;
            if (
                this._type === SSSTEncounterType.PoliceInspection &&
                !this._game.commander.ship.hasIllegalGoods() &&
                this._game.wildStatus !== SSSTWildQuestStatus.OnBoard
            ) {
                alertString = "Are you sure you want to flee? You're not carrying illegal goods so it should be safe to submit.";
            } else if (this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
                alertString = "Are you sure you want to flee? The Customs Police know you have engaged in criminal activity and your police record will reflect this fact.";
            }

            if (alertString) {
                let aC = new SSSTAlertViewController(alertString)
                aC.addAction("Ok, I won't.", SSSTAlertActionType.Default, null)

                aC.addAction("Flee", SSSTAlertActionType.Destructive, () => {
                  performFlee();
                })

                this._presentAlertController(aC);
                return;
            }

            performFlee();
        }


        else if (action === "Ignore") {
            this.delegate.encounterControllerEncounterContinues(this, false);
        }


        else if (action === "Trade") {
            let itemType = SSSTTradeItemType.None;
            let onlyIllegal = this._game.commander.policeRecordScore < SSSTPoliceRecordScore.Dubious;
            let tradePrice = 0;
            let maxUnits = 0;
            let comparisonPrice = 0;
            let itemName = null;

            if (this._type === SSSTEncounterType.TraderBuy) {
                itemType = this._game.commander.ship.randomTradeableItemForSystem(this._game.commander.currentSystem, onlyIllegal);
                MAUtils.ensureInteger(itemType)

                if (itemType !== SSSTTradeItemType.None) {
                    tradePrice = this._game.commander.sellPriceForItem(itemType);
                    MAUtils.ensureInteger(tradePrice)

                    if (onlyIllegal) {
                        tradePrice *= gameRand.randomIntBelow(100) <= 45 ? 0.8 : 1.1;
                    } else {
                        tradePrice *= gameRand.randomIntBelow(100) <= 10 ? 0.9 : 1.1;
                    }

                    let tradeItem = SSSTTradeItem.tradeItemForType(itemType);
                    itemName = tradeItem.name;
                    tradePrice = Math.floor(tradePrice / tradeItem.roundOffPrice)
                    tradePrice = (tradePrice + 1) * tradeItem.roundOffPrice
                    tradePrice = Math.max(tradePrice, tradeItem.minTradePrice);
                    tradePrice = Math.min(tradePrice, tradeItem.maxTradePrice);

                    maxUnits = this._game.commander.ship.tradeItemQuantityForType(itemType);
                    comparisonPrice = this._game.commander.ship.tradeItemAverageBuyingPriceForType(itemType);
                }
            } else if (this._type === SSSTEncounterType.TraderSell) {
                itemType = this._opponent.ship.randomTradeableItemForSystem(this._game.commander.currentSystem, onlyIllegal);

                if (itemType !== SSSTTradeItemType.None) {
                    tradePrice = this._game.commander.buyPriceForItem(itemType);

                    if (onlyIllegal) {
                        tradePrice *= gameRand.randomIntBelow(100) <= 45 ? 1.1 : 0.8;
                    } else {
                        tradePrice *= gameRand.randomIntBelow(100) <= 10 ? 1.1 : 0.9;
                    }

                    let tradeItem = SSSTTradeItem.tradeItemForType(itemType);
                    itemName = tradeItem.name;
                    tradePrice = Math.floor(tradePrice / tradeItem.roundOffPrice)
                    tradePrice = (tradePrice + 1) * tradeItem.roundOffPrice
                    tradePrice = Math.max(tradePrice, tradeItem.minTradePrice);
                    tradePrice = Math.min(tradePrice, tradeItem.maxTradePrice);
                    const freeCargoBays = this._game.commander.ship.freeCargoBays()
                    maxUnits = Math.min(freeCargoBays, Math.floor(this._game.commander.credits / tradePrice));
                }
            }

            if (itemType !== SSSTTradeItemType.None) {
              this._presentTradeAlert(itemName, itemType, tradePrice, maxUnits, comparisonPrice, this._type === SSSTEncounterType.TraderSell)
            }
        }


        else if (action === "Surrender" || action === "Yield") {
            let surrenderAllowed = true;
            let surrenderPrompt = null;
            let surrenderBlock = null;

            if (this._opponent.type === SSSTOpponentType.Mantis) {
                if (this._game.commander.artifactOnBoard) {
                    surrenderAllowed = true;
                    surrenderPrompt = "If you surrender to the aliens, they will steal the artifact. Are you sure you wish to do that?";
                    surrenderBlock = () => {
                        pLog.log(55)
                        this._game.commander.artifactOnBoard = false;

                        const artifactStolenString = "The aliens have taken the artifact from you. Well, it's rightfully theirs, so you probably shouldn't complain. You won't receive any reward from Professor Berger, though.";

                        let aC = new SSSTAlertViewController(artifactStolenString)
                        aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                            this.delegate.encounterControllerEncounterContinues(this, false);
                        })

                        this._presentAlertController(aC);
                    };
                } else {
                    surrenderAllowed = false;
                    surrenderPrompt = "Surrender? Ha! We want your HEAD!";
                }
            } else if (ENCOUNTER(this._type, "Police") || this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
                if (this._type !== SSSTEncounterType.PostMarieCelestePoliceEncounter && this._game.commander.policeRecordScore <= SSSTPoliceRecordScore.Psycho) {
                    pLog.log(56)
                    surrenderAllowed = false;
                    surrenderPrompt = "Surrender? Ha! We want your HEAD!";
                } else {
                    surrenderAllowed = true;

                    const hasReactor = this._game.reactorStatus > SSSTReactorQuestStatus.Open && this._game.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate;
                    const hasWild = this._game.wildStatus === SSSTWildQuestStatus.OnBoard;
                    if (this._type !== SSSTEncounterType.PostMarieCelestePoliceEncounter || hasReactor || hasWild) {
                        let extraString = hasReactor ? " Additionally, the police will destroy the Ion Reactor." : "";
                        if (hasWild) {
                            extraString += " Wild will be arrested, too.";
                        }

                        surrenderPrompt = `If you surrender, you will spend some time in prison and will have to pay a hefty fine.${extraString} Are you sure you want to do that?`;
                        surrenderBlock = () => {
                            pLog.log(57)
                            this._processArrest();
                        };
                    } else {
                        surrenderBlock = () => {
                            pLog.log(58)
                            const numNarcotics = this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics);
                            const numFirearms = this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Firearms);

                            let yieldAlertString = "The Customs Police find nothing illegal in your cargo holds and apologize for the inconvenience."

                            if (numNarcotics + numFirearms > 0) {
                              pLog.log(102)
                              this._game.commander.policeRecordScore = Math.min(this._game.commander.policeRecordScore, SSSTPoliceRecordScore.Dubious);

                              this._game.commander.ship.soldQuantity(numNarcotics, SSSTTradeItemType.Narcotics);
                              this._game.commander.ship.soldQuantity(numFirearms, SSSTTradeItemType.Firearms);

                              yieldAlertString = "The Customs Police confiscated all of your illegal cargo. For being cooperative, you avoided stronger fines or penalties.";
                            }


                            let aC = new SSSTAlertViewController(yieldAlertString)

                            aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                                this.delegate.encounterControllerEncounterContinues(this, false);
                            })

                            this._presentAlertController(aC);
                        };
                    }
                }
            } else {
                surrenderAllowed = true;

                surrenderBlock = () => {
                    let wildString = null;
                    if (this._game.wildStatus === SSSTWildQuestStatus.OnBoard) {
                        if (this._opponent.ship.model.mercenaryQuarters() > 0) {
                            this._game.wildStatus = SSSTWildQuestStatus.Closed;
                            this._game.commander.ship.removeCrewMemberWithName("Jonathan Wild");
                            wildString = " The pirate captain turns out to be an old associate of Jonathan Wild. He invites Wild to go to Kravat aboard the pirate ship. Wild accepts the offer and thanks you for the ride.";
                        } else {
                            wildString = " The pirate captain turns out to be an old associate of Jonathan Wild. They talk about old times, and you get the feeling that Wild would switch ships if the Pirates had any quarters available.";
                        }
                    }

                    let questString = "";
                    if (this._game.reactorStatus > SSSTReactorQuestStatus.Open && this._game.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate) {
                        questString = " They also poke around the Ion Reactor while trying to figure out if it's valuable. They finally conclude that the reactor is worthless, not to mention dangerous, and leave it on your ship.";
                    }

                    this._game.commander.raided = true;

                    const totalCargo = this._game.commander.ship.totalCargoBays() - this._game.commander.ship.freeCargoBays();

                    MAUtils.ensureInteger(totalCargo)

                    if (totalCargo <= 0) {
                        const blackmail = Math.min(25000, Math.max(500, Math.floor(this._game.commander.netWorth() / 20)));
                        MAUtils.ensureInteger(blackmail)

                        let credits = this._game.commander.credits;
                        let debt = this._game.commander.debt;
                        if (credits >= blackmail) {
                            credits -= blackmail;
                        } else {
                            debt += (blackmail - credits);
                            credits = 0;
                        }
                        pLog.log(59)
                        this._game.commander.setCredits(credits);
                        this._game.commander.debt = debt;

                        const alertString = `The pirates are upset that they found no cargo on your ship. To save yourself, you have no choice but to pay them 5% of your current net worth.${questString}${wildString || ""}`;

                        let aC = new SSSTAlertViewController(alertString)

                        aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                            this.delegate.encounterControllerEncounterContinues(this, false);
                        })

                        this._presentAlertController(aC);

                    } else {
                        let freePirateBays = this._opponent.ship.freeCargoBays();
                        MAUtils.ensureInteger(freePirateBays)

                        do {
                            const itemType = this._game.commander.ship.randomTradeableItem();
                            if (itemType === SSSTTradeItemType.None) {
                                break;
                            }

                            this._game.commander.ship.soldQuantity(1, itemType);
                            freePirateBays--;
                        } while (freePirateBays > 0);

                        pLog.log(60)

                        const alertString = `The pirates board your ship and transfer as much of your cargo to their own ship as their cargo bays can hold.${questString}${wildString || ""}`;

                        let aC = new SSSTAlertViewController(alertString)

                        aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                            this.delegate.encounterControllerEncounterContinues(this, false);
                        })

                        this._presentAlertController(aC);
                    }
                };
            }

            MAUtils.ensureBool(surrenderAllowed)

            if (surrenderAllowed) {
                if (surrenderPrompt) {
                    let aC = new SSSTAlertViewController(surrenderPrompt)

                    aC.addAction("Surrender", SSSTAlertActionType.Destructive, () => {
                        if (surrenderBlock) {
                            surrenderBlock();
                        }
                    })

                    aC.addAction("Cancel", SSSTAlertActionType.Cancel, null)

                    this._presentAlertController(aC);

                } else if (surrenderBlock) {
                    surrenderBlock();
                }
            } else {

                let aC = new SSSTAlertViewController(surrenderPrompt)

                aC.addAction("Dismiss", SSSTAlertActionType.Default, null)

                this._presentAlertController(aC);

                return;
            }
        }


        else if (action === "Bribe") {
            let cantBribeAlertString = null;
            if (this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
              cantBribeAlertString = "We'd love to take your money, but Space Command already knows you've got illegal goods onboard.";
            } else if (this._game.commander.currentSystem.politics.bribeWillingness <= 0) {
              cantBribeAlertString = `The incorruptible police of ${this._game.commander.currentSystem.name} cannot be bribed.`;
            }

            if (cantBribeAlertString) {
                let aC = new SSSTAlertViewController(cantBribeAlertString)
                aC.addAction("Dismiss", SSSTAlertActionType.Default, null)

                this._presentAlertController(aC);
                return;
            }

            const bribeBlock = () => {
                let bribe = this._game.commander.netWorth() / ((10 + 5 * (SSSTDifficulty.Absurd - this._game.difficulty)) * this._game.commander.currentSystem.politics.bribeWillingness);

                bribe = Math.ceil(bribe / 100) * 100; // round up to the next 100
                MAUtils.ensureInteger(bribe)

                if (this._game.wildStatus === SSSTWildQuestStatus.OnBoard || (this._game.reactorStatus > SSSTReactorQuestStatus.Open && this._game.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate)) {
                    pLog.log(126)
                    bribe *= this._game.difficulty <= SSSTDifficulty.Normal ? 2 : 3;
                }

                bribe = Math.max(100, Math.min(bribe, 10000));
                MAUtils.ensureInteger(bribe)

                if (this._game.commander.credits < bribe) {
                    const alertString = "You don't have enough cash for a bribe.";

                    let aC = new SSSTAlertViewController(alertString)
                    aC.addAction("Dismiss", SSSTAlertActionType.Default, null)

                    this._presentAlertController(aC);
                } else {
                    const alertString = `These police officers are willing to forego inspection for $${bribe}.`;

                    let aC = new SSSTAlertViewController(alertString)

                    aC.addAction("Offer bribe", SSSTAlertActionType.Default, () => {
                        this._game.commander.setCredits(this._game.commander.credits - bribe);
                        this.delegate.encounterControllerEncounterContinues(this, false);
                    })

                    aC.addAction("Forget it", SSSTAlertActionType.Cancel, null)

                    this._presentAlertController(aC);
                }
            };

            if (this._type === SSSTEncounterType.PoliceInspection && !this._game.commander.ship.hasIllegalGoods() && this._game.wildStatus !== SSSTWildQuestStatus.OnBoard) {
                const alertString = "Are you sure you want to bribe the police? You are not carrying illegal goods, so you have nothing to fear!";

                let aC = new SSSTAlertViewController(alertString)

                aC.addAction("Yes, I still want to", SSSTAlertActionType.Destructive, () => {
                    bribeBlock();
                })

                aC.addAction("Ok, I won't", SSSTAlertActionType.Cancel, null)

                this._presentAlertController(aC);

            } else {
                bribeBlock();
            }
        }


        else if (action === "Submit") {
            const submitBlock = () => {
                if (this._game.reactorStatus > SSSTReactorQuestStatus.Open && this._game.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate) {

                    this._game.reactorStatus = SSSTReactorQuestStatus.ClosedTooLate;
                    this._game.commander.ship.soldQuantity(REACTOR_BAY_COUNT + REACTOR_MAX_FUEL, SSSTTradeItemType.FakeQuestCargoReactor);

                    const alertString = "The police confiscate the Ion Reactor as evidence of your dealings with unsavory characters. The bad news is that you've lost the Ion Reactor. The good news is that you no longer have to worry about managing its depleting fuel store."


                    let aC = new SSSTAlertViewController(alertString)

                    aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                        this.delegate.encounterControllerEncounterContinues(this, false);
                    })

                    this._presentAlertController(aC);

                } else if (this._game.wildStatus === SSSTWildQuestStatus.OnBoard) {
                    this._processArrest();
                } else if (this._game.commander.ship.hasIllegalGoods()) {
                    const numNarcotics = this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics);
                    const numFirearms = this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Firearms);
                    this._game.commander.ship.soldQuantity(numNarcotics, SSSTTradeItemType.Narcotics);
                    this._game.commander.ship.soldQuantity(numFirearms, SSSTTradeItemType.Firearms);

                    let fine = this._game.commander.netWorth() / ((SSSTDifficulty.Absurd + 2 - this._game.difficulty) * 10);
                    MAUtils.ensureNumber(fine)
                    fine = Math.ceil(fine / 50) * 50; // Round up to the nearest 50
                    fine = Math.max(100, Math.min(fine, 10000));

                    MAUtils.ensureInteger(fine)

                    let credits = this._game.commander.credits;
                    let debt = this._game.commander.debt;

                    if (credits >= fine) {
                        credits -= fine;
                    } else {
                        debt += (fine - credits);
                        credits = 0;
                    }
                    this._game.commander.setCredits(credits);
                    this._game.commander.debt = debt;

                    this._game.commander.policeRecordScore = this._game.commander.policeRecordScore + TRAFFICKING_SCORE;

                    const alertString = `The police discover illegal goods in your cargo holds. These goods are confiscated and you are fined $${fine}`

                    let aC = new SSSTAlertViewController(alertString)

                    aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                        this.delegate.encounterControllerEncounterContinues(this, false);
                    })

                    this._presentAlertController(aC);

                } else {
                    // Improve your police record score
                    this._game.commander.policeRecordScore = this._game.commander.policeRecordScore - TRAFFICKING_SCORE;

                    const alertString = "The police find nothing illegal in your cargo holds and apologize for the inconvenience."

                    let aC = new SSSTAlertViewController(alertString)

                    aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                        this.delegate.encounterControllerEncounterContinues(this, false);
                    })

                    this._presentAlertController(aC);
                }
            };

            if (this._type === SSSTEncounterType.PoliceInspection && (this._game.commander.ship.hasIllegalGoods() || this._game.wildStatus === SSSTWildQuestStatus.OnBoard)) {
                let alertString = "Are you sure you want to let the police search you? You are carrying illegal goods or crew!";
                if (this._game.wildStatus === SSSTWildQuestStatus.OnBoard) {
                    alertString = `${alertString} You and Wild will be arrested!`;
                }


                let aC = new SSSTAlertViewController(alertString)

                aC.addAction("Yes, I still want to", SSSTAlertActionType.Destructive, () => {
                    submitBlock();
                })

                aC.addAction("Nevermind!", SSSTAlertActionType.Cancel, null)

                this._presentAlertController(aC);
            } else {
                submitBlock();
            }
        }


        else if (action === "Plunder" || action === "Board") {

          const plunderBlock = () => {
            const plunderLabel = (this._type === SSSTEncounterType.MarieCelesteEncounter) ? "Take" : "Plunder";

            const plunderVC = new SSSTPlunderViewController(this._game, this._opponent, plunderLabel)
            plunderVC.delegate = this
            plunderVC.presentView()
          };

          if (this._type === SSSTEncounterType.MarieCelesteEncounter) {
            const alertString = "The Marie Celeste is completely abandoned and drifting through space. The ship's log is unremarkable except for a tribble infestation a few months ago shortly after visiting Lowry. The crew's quarters are in good shape, with no signs of struggle. Other than being abandoned, the ship is completely normal. By Intergalactic Salvage Law, you can claim the remaining cargo. Do you wish to?";


            let aC = new SSSTAlertViewController(alertString)

            aC.addAction("Yes, take cargo", SSSTAlertActionType.Default, () => {
              plunderBlock();
            })

            aC.addAction("Leave it", SSSTAlertActionType.Cancel, () => {
              this.delegate.encounterControllerEncounterContinues(this, false);
            })

            this._presentAlertController(aC);

            return;

          } else if (ENCOUNTER(this._type, "Trader")) {
            this._game.commander.policeRecordScore = this._game.commander.policeRecordScore + PLUNDER_TRADER_SCORE;
          } else {
            this._game.commander.policeRecordScore = this._game.commander.policeRecordScore + PLUNDER_PIRATE_SCORE;
          }

          plunderBlock();
        }


        else if (action === "Meet") {
            const alertString = CAPTAIN_PROMPT_STR(this._type);

            let aC = new SSSTAlertViewController(alertString)

            aC.addAction("Yes, trade!", SSSTAlertActionType.Default, () => {
                if (this._type === SSSTEncounterType.FamousCaptainAhabEncounter) {
                    this._game.commander.ship.removeAccessoryOfType(SSSTAccessoryType.ShieldReflective);
                    this._game.commander.pilot = Math.min(MAX_SKILL_LEVEL, this._game.commander.pilot + (this._game.difficulty < SSSTDifficulty.Hard ? 2 : 1));
                } else if (this._type === SSSTEncounterType.FamousCaptainConradEncounter) {
                    this._game.commander.ship.removeAccessoryOfType(SSSTAccessoryType.WeaponMilitaryLaser);
                    this._game.commander.engineer = Math.min(MAX_SKILL_LEVEL, this._game.commander.engineer + (this._game.difficulty < SSSTDifficulty.Hard ? 2 : 1));
                } else if (this._type === SSSTEncounterType.FamousCaptainHuieEncounter) {
                    this._game.commander.ship.removeAccessoryOfType(SSSTAccessoryType.WeaponMilitaryLaser);
                    this._game.commander.trader = Math.min(MAX_SKILL_LEVEL, this._game.commander.trader + (this._game.difficulty < SSSTDifficulty.Hard ? 2 : 1));
                }



                const trainStr = "After a few hours of training with a top expert, you feel your abilities have improved significantly."
                let aC2 = new SSSTAlertViewController(trainStr)

                aC2.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                    this.delegate.encounterControllerEncounterContinues(this, false);
                })

                this._presentAlertController(aC2);
            })

            aC.addAction("No thanks!", SSSTAlertActionType.Cancel, () => {
                this.delegate.encounterControllerEncounterContinues(this, false);
            })

            this._presentAlertController(aC);
        }

        else if (action === "Drink") {
            let alertString = null;
            let consumedString = null;
            let drinkAction = null;

            if (this._type === SSSTEncounterType.BottleGood) {
                alertString = "This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. In the old days, this stuff went for thousands of credits a bottle since people reported significant gains in their abilities after quaffing a bottle. Would you like to drink it?";
                consumedString = "Mmmmm. Captain Marmoset's Amazing Skill Tonic not only fills you with energy, but tastes like a fine single-malt. You feel a slight tingling in your fingertips.";
                drinkAction = () => {
                    pLog.log(105)
                    this._game.commander.increaseSkillRandomly();
                    if (this._game.difficulty < SSSTDifficulty.Hard) {
                        this._game.commander.increaseSkillRandomly();
                    }
                };
            } else {
                alertString = "This concoction has been extremely hard to find since the elusive Captain Marmoset left on a mission to the heart of a comet. The \"best used by\" date stamped on the bottle has become illegible. The tonic might still be good. Then again, it's not clear what happens when the Tonic breaks down...";
                consumedString = "While you don't know what it was supposed to taste like, you get the feeling that this dose of tonic was a bit off. This bottle tasted very strange, like slightly salty red wine. You feel a bit dizzy and your teeth itch for a while.";
                drinkAction = () => {
                    pLog.log(106)
                    this._game.commander.increaseSkillRandomly();
                    this._game.commander.decreaseSkillRandomly();
                    if (this._game.difficulty >= SSSTDifficulty.Hard) {
                        this._game.commander.increaseSkillRandomly();
                        this._game.commander.decreaseSkillRandomly();
                        this._game.commander.decreaseSkillRandomly();
                    }
                };
            }

            let aC = new SSSTAlertViewController(alertString)

            aC.addAction("Yes, drink it", SSSTAlertActionType.Default, () => {
                pLog.log(108)
                drinkAction();

                let aC2 = new SSSTAlertViewController(consumedString)

                aC2.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                    this.delegate.encounterControllerEncounterContinues(this, false);
                })

                this._presentAlertController(aC2);
            })

            aC.addAction("I'll pass", SSSTAlertActionType.Cancel, () => {
                pLog.log(107)
                this.delegate.encounterControllerEncounterContinues(this, false);
            })

            this._presentAlertController(aC);
        }


        else if (action === "Interrupt") {
            pLog.log(52)
            this._endAutoEncounters();
            this.delegate.encounterControllerEncounterContinues(this, true);
        }


        if (ENCOUNTER_MODE_AUTO(this._encounterMode)) {
          MAUtils.ensureInteger(this._autoEncounterSession)

          const sessionID = this._game.uniqueID + "-" + this._autoEncounterSession;
          const actionType = this._encounterMode === SSSTEncounterMode.AutoAttack ? "Attack" : "Flee";

          actionLog.performAsync(() => {
              if (sessionID === (this._game.uniqueID + "-" + this._autoEncounterSession)) {
                  console.log(`Auto-${actionType} action fired -- performed`);
                  pLog.log(53)
                  this.performAction(actionType);
              } else {
                  console.log(`Auto-${actionType} action fired -- ignored`);
              }
          }, 1500);
        }
    } // END OF performAction


    _endAutoEncounters() {
        this._autoEncounterSession++;
        this._encounterMode = SSSTEncounterMode.Manual;
        if (this.delegate) {
          this.delegate.encounterControllerHasUpdatedButtons(this);
        }
    }

    _presentAlertController(alertController) {
        this._endAutoEncounters();
        alertController.presentView();
    }

    _presentTradeAlert(itemName, itemType, tradePrice, maxUnits, comparisonPrice, traderSell) {
      MAUtils.ensureType(itemName, "string")
      MAUtils.ensureInteger(itemType)
      MAUtils.ensureInteger(tradePrice)
      MAUtils.ensureInteger(maxUnits)
      MAUtils.ensureInteger(comparisonPrice)
      MAUtils.ensureBool(traderSell)

      let needsDismiss = false
      let needsAll = false
      let needsNone = false
      let needsSelected = false

      let text = null;
      if (traderSell) {
        const canAfford = maxUnits > 0
        text = `The trader wants to sell ${itemName} for $${tradePrice} each. ${!canAfford ? "Unfortunately, you can't afford any." : "How many do you wish to buy?"}`;

        needsDismiss = !canAfford
        needsAll = canAfford
        needsNone = canAfford
        needsSelected = canAfford
      } else {
        if (maxUnits > 0) {
          text = `The trader wants to buy ${itemName} and offers $${tradePrice} each. You paid about $${comparisonPrice}/unit. How many do you wish to sell?`;

          needsDismiss = false
          needsAll = true
          needsNone = true
          needsSelected = true
        } else {
          text = `The trader wants to buy ${itemName} and offers $${tradePrice} each. Unfortunately, you don't have any.`;

          needsDismiss = true
        }
      }

      const aC = new SSSTAlertViewController(text)

      if (needsDismiss) {
        aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
          this._performTradeWithAmount(0, itemType, tradePrice, traderSell)
        })
      }

      if (needsNone) {
        aC.addAction("None", SSSTAlertActionType.Default, () => {
          this._performTradeWithAmount(0, itemType, tradePrice, traderSell)
        })
      }

      if (needsSelected) {
        aC.addAction("Selected", SSSTAlertActionType.Default, () => {
          const slider = document.getElementById("tradeslider")
          const amount = parseInt(slider.value, 10)
          if (amount > 0) {
            aC.completionHandler = () => {
              this._presentThanksForTheTrade(() => {
                this._performTradeWithAmount(amount, itemType, tradePrice, traderSell)
              })
            }
          }
        })
      }

      if (needsAll) {
        aC.addAction("All", SSSTAlertActionType.Default, () => {
          const amount = maxUnits
          if (amount > 0) {
            aC.completionHandler = () => {
              this._presentThanksForTheTrade(() => {
                this._performTradeWithAmount(amount, itemType, tradePrice, traderSell)
              })
            }
          }
        })
      }

      if (needsSelected) {
        aC.customViewHandler = (customViewDiv) => {
          const slider = document.createElement('input');
          slider.id = "tradeslider"
          slider.type = 'range';
          slider.min = '0';
          slider.max = `${maxUnits}`;
          slider.value = `${Math.floor(maxUnits/2)}`;  // default value
          slider.step = '1';   // step ensures only integer values
          customViewDiv.appendChild(slider)

          const selectedValueDiv = document.createElement('div');
          customViewDiv.appendChild(selectedValueDiv)
          selectedValueDiv.innerText = slider.value

          actionLog.registerSliderEventListener(slider, 'input', () => {
            selectedValueDiv.innerText = slider.value
          });
        }
      }

      aC.presentView()
    }

    _executeAction(commanderFlees, completionBlock) {
        MAUtils.ensureBool(commanderFlees)

        let opponentHull = this._opponent.ship.hull;
        MAUtils.ensureInteger(opponentHull)
        let commanderHull = this._game.commander.ship.hull;
        MAUtils.ensureInteger(commanderHull)
        let commanderGotHit = false;

        if (ENCOUNTER_ATTACK(this._type) || this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
            commanderGotHit = this._executeAttackWithAttacker(this._opponent, this._game.commander, commanderFlees);
        }

        let opponentGotHit = false;

        if (!commanderFlees) {
            opponentGotHit = this._executeAttackWithAttacker(this._game.commander, this._opponent, ENCOUNTER_FLEE(this._type));
        }

        if (this._game.commander.ship.hull <= 0 && this._opponent.ship.hull <= 0) {
            if (this._game.commander.hasEscapePod) {
                this._performPodEscape();
                return;
            } else {
                const alertString = "You and your opponent have managed to destroy each other."
                let aC = new SSSTAlertViewController(alertString)

                aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                    this.delegate.encounterControllerDidCompleteWithDestruction(this);
                })

                this._presentAlertController(aC);

                return;
            }
        } else if (this._opponent.ship.hull <= 0) {
            let getBounty = false;
            let alertString = "You have destroyed your opponent.";
            if (ENCOUNTER(this._type, "Pirate") && this._opponent.ship.type !== SSSTShipModelType.Mantis && this._game.commander.policeRecordScore >= SSSTPoliceRecordScore.Dubious) {
                pLog.log(54)
                getBounty = true;
                alertString = `You earned a bounty of $${this._opponent.ship.bountyForEnemyShipWithOpponent(this._opponent)}.`;
            }

            let attemptScoop = false;

            if (ENCOUNTER(this._type, "Police")) {
                this._game.commander.policeKills++;
                this._game.commander.policeRecordScore += KILL_POLICE_SCORE;
            } else if (ENCOUNTER(this._type, "Pirate")) {
                if (this._opponent.ship.type !== SSSTShipModelType.Mantis) {
                    if (getBounty) {
                        let bounty = this._opponent.ship.bountyForEnemyShipWithOpponent(this._opponent);
                        this._game.commander.credits += bounty;
                    }
                    this._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

                    attemptScoop = true;
                }
                this._game.commander.pirateKills++;
            } else if (ENCOUNTER(this._type, "Trader")) {
                this._game.commander.traderKills++;
                this._game.commander.policeRecordScore += KILL_TRADER_SCORE;

                attemptScoop = true;
            } else if (ENCOUNTER(this._type, "FamousCaptain")) {
                this._game.commander.reputationScore = Math.max(this._game.commander.reputationScore + 100, SSSTReputationScoreDangerous);
                this._game.replaceNewsContainingString(CAPTAIN_NAME_STR(this._type), DESTROY_CAPTAIN_NEWS(this._type));
            } else if (ENCOUNTER(this._type, "Scarab")) {
                this._game.commander.pirateKills++;
                this._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

                this._game.scarabStatus = SSSTScarabQuestStatus.ScarabDestroyed;
                pLog.log(166)
            } else if (ENCOUNTER(this._type, "Monster")) {
                this._game.commander.pirateKills++;
                this._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

                this._game.monsterStatus = SSSTMonsterQuestStatus.ClosedMonsterDestroyed;
            } else if (ENCOUNTER(this._type, "Dragonfly")) {
                this._game.commander.pirateKills++;
                this._game.commander.policeRecordScore += KILL_PIRATE_SCORE;

                this._game.dragonflyStatus = SSSTDragonflyQuestStatus.ClosedDragonflyDestroyed;
            }

            this._game.commander.reputationScore += 1 + Math.floor(this._opponent.ship.type / 2);



            let aC = new SSSTAlertViewController(alertString)

            aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                if (attemptScoop) {
                    this._scoopWithCompletion(() => {
                        completionBlock(false);
                    });
                } else {
                    completionBlock(false);
                }
            })

            this._presentAlertController(aC);
            return;

        } else if (this._game.commander.ship.hull <= 0) {
            this.delegate.encounterControllerHasUpdatedHP(this)

            if (this._game.commander.hasEscapePod) {
                this._performPodEscape();
                return;
            } else {

                const alertString = "Your ship has been destroyed by your opponent."
                let aC = new SSSTAlertViewController(alertString)

                aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                    pLog.log(65)
                    this.delegate.encounterControllerDidCompleteWithDestruction(this);
                })

                this._presentAlertController(aC);
                return;
            }
        }

        if (commanderFlees) {
            let escapeString = null;
            if (this._game.difficulty === SSSTDifficulty.Beginner) {
                escapeString = "You've managed to escape your opponent.";
            } else if (2 * (gameRand.randomIntBelow(7) + Math.floor(this._game.commander.ship.crewPilotSkillIncludingCommander(this._game.commander) / 3)) >=
                       gameRand.randomIntBelow((this._opponent.ship.crewPilotSkillIncludingCommander(this._opponent) * (2 + this._game.difficulty)))) {
                escapeString = "You've managed to escape your opponent.";
                if (commanderGotHit) {
                    escapeString = "You got hit but still managed to escape.";
                }
            }

            if (escapeString) {
                if (ENCOUNTER(this._type, "Monster")) {
                    this._game.monsterHull = this._opponent.ship.hull;
                    MAUtils.ensureInteger(this._game.monsterHull)
                    pLog.log(143)
                }

                let aC = new SSSTAlertViewController(escapeString)

                aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                    completionBlock(false);
                })

                this._presentAlertController(aC);

                return;
            }
        } else if (ENCOUNTER_SURRENDER(this._type) || ENCOUNTER_FLEE(this._type)) {
            if (4 * gameRand.randomIntBelow(this._game.commander.ship.crewPilotSkillIncludingCommander(this._game.commander)) <=
                2 * gameRand.randomIntBelow((7 + Math.floor(this._opponent.ship.crewPilotSkillIncludingCommander(this._opponent) / 3)))) {

                const alertString = "Your opponent has managed to escape."

                let aC = new SSSTAlertViewController(alertString)

                aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
                    completionBlock(false);
                })

                this._presentAlertController(aC);

                return;
            }
        }

        let prevType = this._type;

        if (this._opponent.ship.hull < opponentHull) {
            if (ENCOUNTER(this._type, "Police")) {
                if (this._opponent.ship.hull < opponentHull / 2) {
                    if (this._game.commander.ship.hull < commanderHull / 2) {
                        this._type = (gameRand.randomIntBelow(10) > 5) ? SSSTEncounterType.PoliceFlee : this._type;
                    } else {
                        this._type = SSSTEncounterType.PoliceFlee;
                    }
                }
            } else if (ENCOUNTER(this._type, "Pirate")) {
                if (this._opponent.ship.hull < 2 * opponentHull / 3) {
                    if (this._game.commander.ship.hull < 2 * commanderHull / 3) {
                        this._type = (gameRand.randomIntBelow(10) > 3) ? SSSTEncounterType.PirateFlee : this._type;
                    } else {
                        this._type = (gameRand.randomIntBelow(10) > 8 && this._opponent.ship.type <= SSSTShipModelType.Best) ? SSSTEncounterType.PirateSurrender : SSSTEncounterType.PirateFlee;
                    }
                }
            } else if (ENCOUNTER(this._type, "Trader")) {
                if (this._opponent.ship.hull < 2 * opponentHull / 3) {
                    this._type = (gameRand.randomIntBelow(10) > 3) ? SSSTEncounterType.TraderSurrender : SSSTEncounterType.TraderFlee;
                } else if (this._opponent.ship.hull < 9 * opponentHull / 10) {
                    if (this._game.commander.ship.hull < 2 * commanderHull / 3) {
                        // If you get damaged a lot, the trader keeps attacking
                        this._type = (gameRand.randomIntBelow(10) > 7) ? SSSTEncounterType.TraderFlee : this._type;
                    } else if (this._game.commander.ship.hull < 9 * commanderHull / 10) {
                        this._type = (gameRand.randomIntBelow(10) > 3) ? SSSTEncounterType.TraderFlee : this._type;
                    } else {
                        this._type = SSSTEncounterType.TraderFlee;
                    }
                }
            } else if (this._type === SSSTEncounterType.PostMarieCelestePoliceEncounter) {
                this._type = SSSTEncounterType.PoliceAttack;
            }
        }

        MAUtils.ensureInteger(this._type)

        if (prevType !== this._type) {
            if (!ENCOUNTER_FLEE(this._type) && this._encounterMode === SSSTEncounterMode.AutoAttack) {
                this._encounterMode = SSSTEncounterMode.Manual;
            } else if (this._encounterMode === SSSTEncounterMode.AutoFlee) {
                this._encounterMode = SSSTEncounterMode.Manual;
            }
        }

        this._encounterActionUpdate = "";

        let shipString = null;

        if (ENCOUNTERT(prevType, "Police")) {
            shipString = "police ship";
        } else if (ENCOUNTERT(prevType, "Pirate")) {
            shipString = (this._opponent.ship.type === SSSTShipModelType.Mantis) ? "alien ship" : "pirate ship";
        } else if (ENCOUNTERT(prevType, "Trader")) {
            shipString = "trader ship";
        } else if (ENCOUNTERT(prevType, "FamousCaptain")) {
            shipString = "captain";
        } else if (ENCOUNTERT(prevType, "Scarab")) {
            shipString = "Scarab";
        } else if (ENCOUNTERT(prevType, "Monster")) {
            shipString = "monster";
        } else if (ENCOUNTERT(prevType, "Dragonfly")) {
            shipString = "Dragonfly";
        }

        let delimit = "";
        if (commanderGotHit) {
            this._encounterActionUpdate += `The ${shipString} hits you.`;
            delimit = "\n";
        }

        if (!ENCOUNTERT_FLEE(prevType) && !commanderGotHit) {
            this._encounterActionUpdate += `${delimit}The ${shipString} missed you.`;
            delimit = "\n";
        }

        if (opponentGotHit) {
            this._encounterActionUpdate += `${delimit}You hit the ${shipString}.`;
            delimit = "\n";
        }

        if (!commanderFlees && !opponentGotHit) {
            let hasWeapons = (this._game.commander.ship.weapons.length > 0);
            if (hasWeapons) {
                this._encounterActionUpdate += `${delimit}You missed the ${shipString}.`;
            } else {
                this._encounterActionUpdate += `${delimit}You have no weapons!`;
            }
            delimit = "\n";
        }

        if (ENCOUNTERT_FLEE(prevType)) {
            this._encounterActionUpdate += `${delimit}The ${shipString} didn't get away.`;
            delimit = "\n";
        }

        if (commanderFlees) {
            this._encounterActionUpdate += `${delimit}The ${shipString} is still following you.`;
            delimit = "\n";
        }

        completionBlock(true);
    }

    _performPodEscape() {
        this.delegate.encounterControllerDidCompleteWithDestruction(this);
    }

    _scoopWithCompletion(completion) {
        let canScoop = (this._game.commander.ship.freeCargoBays() > 0);
        canScoop = canScoop && (this._game.difficulty < SSSTDifficulty.Normal || gameRand.randomIntBelow(this._game.difficulty) === 1);

        if (canScoop) {
            let itemType = gameRand.randomIntBelow(SSSTTradeItemType.Count);
            if (itemType >= SSSTTradeItemType.Firearms) {
                itemType = gameRand.randomIntBelow(SSSTTradeItemType.Count);
            }

            const alertString = `A canister from the destroyed ship, labelled ${SSSTTradeItem.tradeItemForType(itemType).name}, drifts within range of your scoops.`;

            let aC = new SSSTAlertViewController(alertString)

            aC.addAction("Pick it up!", SSSTAlertActionType.Default, () => {
                this._game.commander.ship.boughtQuantity(1, itemType, 0);
                completion();
            })

            aC.addAction("Let it go", SSSTAlertActionType.Cancel, () => {
                completion();
            })

            this._presentAlertController(aC);

            return;
        }

        completion();
    }


    _executeAttackWithAttacker(attacker, defender, defenderIsFleeing) {
        MAUtils.ensureType(attacker, "object")
        MAUtils.ensureType(defender, "object")
        MAUtils.ensureBool(defenderIsFleeing)

        const commanderUnderAttack = (defender === this._game.commander);

        if (this._game.difficulty === SSSTDifficulty.Beginner && commanderUnderAttack && defenderIsFleeing) {
            return false; // Escape unharmed
        }

        const attackDiceRoll = gameRand.randomIntBelow((attacker.ship.crewFighterSkillIncludingCommander(attacker) + defender.ship.model.size));
        MAUtils.ensureInteger(attackDiceRoll)

        const dodgeDiceRoll = (defenderIsFleeing ? 2 : 1) * gameRand.randomIntBelow((5 + Math.floor(defender.ship.crewPilotSkillIncludingCommander(defender) / 2)));
        MAUtils.ensureInteger(dodgeDiceRoll)

        if (attackDiceRoll < dodgeDiceRoll) {
            return false; // Defender dodged
        }

        // Ensure we truncate to integer wherever this factor is used
        const ATTACK_SCALE = (100 + 2 * attacker.ship.crewEngineerSkillIncludingCommander(attacker)) / 100;
        MAUtils.ensureNumber(ATTACK_SCALE)

        let damage = 0;
        if (attacker.ship.weapons.length <= 0) {
            damage = 0;
        } else if (defender.ship.type === SSSTShipModelType.Scarab) {
            const pulsePower = attacker.ship.weaponPowerBetweenMinMaxInclusive(SSSTAccessoryType.WeaponPulseLaser, SSSTAccessoryType.WeaponPulseLaser);
            MAUtils.ensureInteger(pulsePower)

            const morganPower = attacker.ship.weaponPowerBetweenMinMaxInclusive(SSSTAccessoryType.WeaponMorgansLaser, SSSTAccessoryType.WeaponMorgansLaser);
            MAUtils.ensureInteger(morganPower)

            if (pulsePower + morganPower <= 0) {
                damage = 0;
                pLog.log(167)
            } else {
                damage = gameRand.randomIntBelow((pulsePower + morganPower) * ATTACK_SCALE);
                pLog.log(168)
            }
        } else {
            const weaponPower = attacker.ship.weaponPowerBetweenMinMaxInclusive(SSSTAccessoryType.WeaponFirst, SSSTAccessoryType.WeaponLast);
            MAUtils.ensureInteger(weaponPower)

            damage = gameRand.randomIntBelow(weaponPower * ATTACK_SCALE);
        }

        MAUtils.ensureInteger(damage)
        if (damage <= 0) {
            return false;
        }

        // Reactor weakens our hull and shields
        if (commanderUnderAttack && this._game.reactorStatus > SSSTReactorQuestStatus.Open && this._game.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate) {
            damage *= Math.floor(1 + (this._game.difficulty + 1) * (this._game.difficulty < SSSTDifficulty.Normal ? 0.25 : 0.33));
        }

        MAUtils.ensureInteger(damage)
        damage = defender.ship.damageShieldsByAmount(damage);
        MAUtils.ensureInteger(damage)

        if (damage > 0) {
            damage -= gameRand.randomIntBelow(defender.ship.crewEngineerSkillIncludingCommander(defender));
            damage = Math.max(1, damage);

            // Our ship will survive at least 2 shots on Normal, 3 on Easy, 4 on Beginner, etc. Opponents survive at least 2.
            const scaleFactor = commanderUnderAttack ? Math.max(1, SSSTDifficulty.Absurd - this._game.difficulty) : 2;
            MAUtils.ensureInteger(scaleFactor)

            damage = Math.min(damage, Math.floor(defender.ship.maximumHullStrength() / scaleFactor));

            MAUtils.ensureInteger(damage)

            defender.ship.damageHullByAmount(damage);
        }

        return true;
    }


    _processArrest() {
        let fine = (1 + Math.floor((this._game.commander.netWorth() * Math.min(80, -this._game.commander.policeRecordScore)) / 100 / 500)) * 500;
        MAUtils.ensureInteger(fine)

        if (this._game.wildStatus === SSSTWildQuestStatus.OnBoard) {
            fine = Math.floor(fine * 1.05);
        }

        const imprisonment = Math.max(30, -this._game.commander.policeRecordScore);
        MAUtils.ensureInteger(imprisonment)

        let alertString = `You are arrested and taken to the space station where you are brought before a court of law.\nYou are sentenced to ${imprisonment} days in prison and a fine of $${fine}.`;

        const numNarcotics = this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Narcotics);
        const numFirearms = this._game.commander.ship.tradeItemQuantityForType(SSSTTradeItemType.Firearms);
        if (numFirearms > 0 || numNarcotics > 0) {
            alertString += "\nThe police impounded all of the illegal goods you had on board.";
            this._game.commander.ship.soldQuantity(numNarcotics, SSSTTradeItemType.Narcotics);
            this._game.commander.ship.soldQuantity(numFirearms, SSSTTradeItemType.Firearms);
        }

        if (this._game.commander.hasInsurance) {
            alertString += "\nSince you can't pay your insurance while you're in prison, your insurance contract has been voided.";
            this._game.commander.hasInsurance = false;
            this._game.commander.noClaim = 0;
        }

        if (this._game.commander.ship.crewCount() > 0) {
          if (this._game.commander.ship.crew.filter(x => !x.forQuest).length > 0) {
            alertString += "\nYour hired mercenaries have left.";
            pLog.log(141)
          }
          this._game.commander.ship.removeAllCrewMembers();
        }

        if (this._game.japoriQuestStatus === SSSTJaporiQuestStatus.HasMedicine) {
            alertString += "\nThe Space Corps removed the antidote for Japori from your ship and delivered it, fulfilling your assignment.";
            this._game.japoriQuestStatus = SSSTJaporiQuestStatus.Closed;
            this._game.commander.ship.soldQuantity(10, SSSTTradeItemType.FakeQuestCargo);
        }

        if (this._game.reactorStatus > SSSTReactorQuestStatus.Open && this._game.reactorStatus < SSSTReactorQuestStatus.ClosedTooLate) {
            alertString += "\nThe police confiscated the Ion Reactor as evidence of your dealings with unsavory characters. The bad news is that you've lost the Ion Reactor. The good news is that you no longer have to worry about managing its depleting fuel store.";
            this._game.reactorStatus = SSSTReactorQuestStatus.ClosedTooLate;
            this._game.commander.ship.soldQuantity(REACTOR_BAY_COUNT + REACTOR_MAX_FUEL, SSSTTradeItemType.FakeQuestCargoReactor);
            pLog.log(164)
        }

        if (this._game.jarekStatus === SSSTJarekQuestStatus.OnBoard) {
            alertString += "\nThe Space Corps decides to give Ambassador Jarek a lift home to Devidia.";
            this._game.jarekStatus = SSSTJarekQuestStatus.Closed;
            pLog.log(140)
        }

        if (this._game.wildStatus === SSSTWildQuestStatus.OnBoard) {
            alertString += "\nJonathan Wild is arrested and taken away to stand trial.";
            this._game.wildStatus = SSSTWildQuestStatus.Closed;
            this._game.addBreakingNewsItem("Notorious Criminal Jonathan Wild Arrested!");
            pLog.log(127)
        }

        this._game.handleArrival();
        this._game.timePassed(imprisonment);

        let credits = this._game.commander.credits;
        if (credits >= fine) {
            credits = credits - fine;
        } else {
            pLog.log(42)
            credits += this._game.commander.cargoAndShipValuationForInsurance(true);
            credits = Math.max(credits - fine, 0);

            alertString += "\nTo pay your fine, your ship had to be sold at auction. The police have given you a second-hand Flea so you can continue your travels.";

            const ship = SSSTShip.createFromPreviousShip(SSSTShipModelType.Flea, this._game.commander.ship)
            this._game.commander.ship = ship;
        }

        this._game.commander.policeRecordScore = SSSTPoliceRecordScore.Dubious;

        let debt = this._game.commander.debt;
        if (debt > 0) {
            if (credits >= debt) {
                credits -= debt;
                debt = 0;
            } else {
                debt -= credits;
                credits = 0;
            }
        }

        this._game.commander.credits = credits;
        this._game.commander.debt = debt;

        for (let i = 0; i < imprisonment; i++) {
            this._game.commander.payInterest();
        }


        let aC = new SSSTAlertViewController(alertString)

        aC.addAction("Dismiss", SSSTAlertActionType.Default, () => {
            this.delegate.encounterControllerDidCompleteWithArrest(this);
        })

        this._presentAlertController(aC);
    }

    _presentThanksForTheTrade(completion) {
      const aC = new SSSTAlertViewController("Thanks for the trade!")
      aC.addAction("Dismiss", SSSTAlertActionType.Default, completion)
      aC.presentView()
    }

    _performTradeWithAmount(amount, itemType, tradePrice, traderSell) {
        MAUtils.ensureInteger(amount)
        MAUtils.ensureInteger(itemType)
        MAUtils.ensureInteger(tradePrice)
        MAUtils.ensureBool(traderSell)

        if (amount > 0) {
            let credits = this._game.commander.credits;
            if (traderSell) {
                let actualAmount = this._game.commander.ship.boughtQuantity(
                    amount,
                    itemType,
                    tradePrice
                );
                this._game.commander.setCredits(credits - actualAmount * tradePrice);
            } else {
                this._game.commander.setCredits(credits + amount * tradePrice);
                this._game.commander.ship.soldQuantity(amount, itemType);
            }
        }

        this.delegate.encounterControllerEncounterContinues(this, false);
    }

// #pragma mark - SSSTPlunderViewControllerDelegate

    plunderViewControllerDidFinishPlundering(controller) {
      MAUtils.ensureBool(controller.plundered)

      if (controller.plundered) {
        this.delegate.encounterControllerDidPlunder(this, controller.plundered);
      }

      this.delegate.encounterControllerEncounterContinues(this, false);
    }

}
