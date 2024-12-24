const SSSTOpponentType = {
    Police: 0,
    Trader: 1,
    Pirate: 2,
    FamousCaptain: 3,
    Scarab: 4,
    Dragonfly: 5,
    Monster: 6,
    MarieCeleste: 7,
    Bottle: 8,
    Mantis: 9,

    Count: 10
};

class SSSTOpponent extends SSSTCrewMember {
    constructor(type, engineer, pilot, fighter, trader, ship) {
        super("opponent", engineer, pilot, fighter, trader);
        MAUtils.ensureInteger(type)
        this.type = type;
        MAUtils.ensureType(ship, "object")
        this.ship = ship;
    }

    static generateOpponentWithType(type, game) {
        MAUtils.ensureInteger(type)
        MAUtils.ensureType(game, "object")

        let opponent = null;
        const difficulty = game.commander.difficulty;
        MAUtils.ensureInteger(difficulty)

        if (type === SSSTOpponentType.FamousCaptain) {
            const ship = SSSTShip.bestShipWithDifficulty(difficulty);
            opponent = new SSSTOpponent(
                type,
                MAX_SKILL_LEVEL,
                MAX_SKILL_LEVEL,
                MAX_SKILL_LEVEL,
                MAX_SKILL_LEVEL,
                ship
            );
        } else if (type === SSSTOpponentType.Dragonfly) {
            const ship = new SSSTShip(SSSTShipModelType.Dragonfly, difficulty);
            ship.addShieldOfType(SSSTAccessoryType.ShieldLightning);
            ship.addShieldOfType(SSSTAccessoryType.ShieldLightning);
            ship.addShieldOfType(SSSTAccessoryType.ShieldLightning);
            ship.addGadgetOfType(SSSTAccessoryType.GadgetAutoRepairSystem);
            ship.addGadgetOfType(SSSTAccessoryType.GadgetTargetingSystem);
            ship.addWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser);
            ship.addWeaponOfType(SSSTAccessoryType.WeaponPulseLaser);
            opponent = new SSSTOpponent(
                SSSTOpponentType.Dragonfly,
                6 + difficulty,
                4 + difficulty,
                6 + difficulty,
                1,
                ship
            );
        } else if (type === SSSTOpponentType.Scarab) {
            const ship = new SSSTShip(SSSTShipModelType.Scarab, difficulty);
            ship.addWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser);
            ship.addWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser);
            opponent = new SSSTOpponent(
                SSSTOpponentType.Scarab,
                6 + difficulty,
                5 + difficulty,
                6 + difficulty,
                1,
                ship
            );
        } else if (type === SSSTOpponentType.Monster) {
            const ship = new SSSTShip(SSSTShipModelType.SpaceMonster, difficulty);
            const currentHull = ship.hull;
            ship.damageHullByAmount(currentHull - game.monsterHull);
            ship.addWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser);
            ship.addWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser);
            ship.addWeaponOfType(SSSTAccessoryType.WeaponMilitaryLaser);
            opponent = new SSSTOpponent(
                SSSTOpponentType.Monster,
                1 + difficulty,
                8 + difficulty,
                8 + difficulty,
                1,
                ship
            );
        } else if (type === SSSTOpponentType.Bottle) {
            const ship = new SSSTShip(SSSTShipModelType.Bottle, game.difficulty);
            opponent = new SSSTOpponent(
                SSSTOpponentType.Bottle,
                0,
                0,
                0,
                0,
                ship
            );
        } else {
            let allNarcotics = false;
            if (type === SSSTOpponentType.MarieCeleste) {
                type = SSSTOpponentType.Trader;
                allNarcotics = true;
            }

            let tries = 1; // We'll roll a die `tries` times and pick the best roll
            let chosenShipType = SSSTShipModelType.Count;

            // Police are more likely to be stronger against worse police records
            if (type === SSSTOpponentType.Police) {
                if (game.commander.policeRecordScore < SSSTPoliceRecordScore.Villain && game.wildStatus !== SSSTWildQuestStatus.OnBoard) {
                    tries = 3;
                } else if (game.commander.policeRecordScore < SSSTPoliceRecordScore.Psycho || game.wildStatus === SSSTWildQuestStatus.OnBoard) {
                    tries = 5;
                }
                tries = Math.max(1, tries + game.difficulty - SSSTDifficulty.Normal);
            } else if (type === SSSTOpponentType.Pirate) {
                // Pirates can smell the money on you!
                tries = 1 + Math.floor(game.commander.netWorth() / 100000);
                tries = Math.max(1, tries + game.difficulty - SSSTDifficulty.Normal);
            } else if (type === SSSTOpponentType.Mantis) {
                tries = 1 + game.difficulty;
                chosenShipType = SSSTShipModelType.Mantis;
            }

            MAUtils.ensureInteger(tries)
            MAUtils.ensureInteger(chosenShipType)

            if (chosenShipType >= SSSTShipModelType.Count) {
                let handicap = Math.max(game.difficulty - SSSTDifficulty.Normal, 0);
                let totalShipOccurrence = 0;
                let possibleShipTypes = [type === SSSTOpponentType.Trader ? SSSTShipModelType.Flea : SSSTShipModelType.Gnat];

                for (let i = 0; i <= SSSTShipModelType.Best; ++i) {
                    let model = SSSTShipModel.shipModelForType(i);
                    if (type === SSSTOpponentType.Police &&
                        (model.police < 0 || (game.commander.currentSystem.politics.occurrencePolice + handicap) < model.police)) {
                        continue;
                    } else if (type === SSSTOpponentType.Pirate &&
                        (model.pirates < 0 || (game.commander.currentSystem.politics.occurrencePirates + handicap) < model.pirates)) {
                        continue;
                    } else if (type === SSSTOpponentType.Trader &&
                        (model.traders < 0 || (game.commander.currentSystem.politics.occurrenceTraders + handicap) < model.traders)) {
                        continue;
                    }
                    totalShipOccurrence += model.frequency;
                    MAUtils.addToOrderedSet(possibleShipTypes, i);
                }

                let shipChoice = 0;
                for (let i = 0; i < tries; ++i) {
                    shipChoice = Math.max(shipChoice, gameRand.randomIntBelow(totalShipOccurrence));
                }

                let frequencySum = 0;
                chosenShipType = possibleShipTypes[0];
                for (let shipType of possibleShipTypes) {
                    let model = SSSTShipModel.shipModelForType(shipType);
                    frequencySum += model.frequency;
                    if (frequencySum >= shipChoice) {
                        chosenShipType = shipType;
                        break;
                    }
                }
            }

            MAUtils.ensureInteger(chosenShipType)
            MAUtils.ensureInteger(game.difficulty)

            const ship = new SSSTShip(chosenShipType, game.difficulty);
            const model = SSSTShipModel.shipModelForType(chosenShipType);

            if (type === SSSTOpponentType.Mantis) {
                tries = 1 + game.difficulty;
            } else {
                tries = Math.max(1, Math.floor(game.commander.netWorth() / 150000) + game.difficulty - SSSTDifficulty.Normal);
            }

            MAUtils.ensureInteger(tries)

            let gadgetSlots = 0;
            if (model.gadgetSlots > 0) {
                if (game.difficulty <= SSSTDifficulty.Hard) {
                    gadgetSlots = gameRand.randomIntBelow(model.gadgetSlots + 1);
                    if (gadgetSlots < model.gadgetSlots) {
                        if (tries > 4) {
                            gadgetSlots++;
                        } else if (tries > 2) {
                            gadgetSlots += gameRand.randomIntBelow(2)
                        }
                    }
                } else {
                    gadgetSlots = model.gadgetSlots;
                }
            }

            MAUtils.ensureInteger(gadgetSlots)

            for (let i = 0; i < gadgetSlots; ++i) {
                let gadgetRoll = 0;
                for (let j = 0; j < tries; ++j) {
                    gadgetRoll = Math.max(gadgetRoll, gameRand.randomIntBelow(100))
                }
                let gadgetFreqSum = 0;
                let addedGadget = false;
                for (let gadgetType = SSSTAccessoryType.GadgetFirst; gadgetType <= SSSTAccessoryType.GadgetLastBuyable; ++gadgetType) {
                    const gadget = SSSTGadget.gadgetForType(gadgetType);
                    gadgetFreqSum += gadget.occurrence;
                    MAUtils.ensureInteger(gadgetFreqSum)
                    if (gadgetFreqSum >= gadgetRoll) {
                        if (!ship.hasGadgetOfType(gadgetType)) {
                            ship.addGadgetOfType(gadgetType);
                            addedGadget = true;
                            break;
                        }
                    }
                }
                if (!addedGadget) {
                    ship.addGadgetOfType(SSSTAccessoryType.GadgetFiveExtraCargoBays);
                }
            }

            const totalCargoBays = ship.totalCargoBays();
            MAUtils.ensureInteger(totalCargoBays)

            if (allNarcotics) {
                ship.boughtQuantity(Math.min(totalCargoBays, 5), SSSTTradeItemType.Narcotics, 0);
            } else if (type !== SSSTOpponentType.Police && totalCargoBays > 5) {
                let amountCargo = totalCargoBays;

                if (game.difficulty >= SSSTDifficulty.Normal) {
                    amountCargo = Math.min(15, 3 + gameRand.randomIntBelow(totalCargoBays - 5));
                }

                if (type === SSSTOpponentType.Pirate) {
                    if (game.difficulty < SSSTDifficulty.Normal) {
                        amountCargo = Math.floor((amountCargo * 4) / 5);
                    } else {
                        amountCargo = Math.floor(amountCargo / game.difficulty);
                    }
                }

                amountCargo = Math.max(1, amountCargo);

                let cargoToDistribute = amountCargo;
                MAUtils.ensureInteger(cargoToDistribute)

                while (cargoToDistribute > 0) {
                    const itemType = gameRand.randomIntBelow(SSSTTradeItemType.Count)
                    let amount = 1 + gameRand.randomIntBelow(1 + SSSTTradeItemType.Count - itemType); // Give fewer of the better items
                    amount = Math.min(cargoToDistribute, amount);

                    ship.boughtQuantity(amount, itemType, 0);
                    cargoToDistribute -= amount;
                }
            }

            let weaponSlots = model.weaponSlots;
            if (model.weaponSlots > 1 && game.difficulty <= SSSTDifficulty.Hard) {
                weaponSlots = 1 + gameRand.randomIntBelow(model.weaponSlots);
                if (weaponSlots < model.weaponSlots) {
                    if (tries > 4 && game.difficulty >= SSSTDifficulty.Hard) {
                        weaponSlots++;
                    } else if (tries > 3 || game.difficulty >= SSSTDifficulty.Hard) {
                        weaponSlots += gameRand.randomIntBelow(2);
                    }
                }
            }

            MAUtils.ensureInteger(weaponSlots)

            for (let i = 0; i < weaponSlots; ++i) {
                let weaponRoll = 0;
                weaponRoll = BEST_ROLL(weaponRoll, tries, 100);
                MAUtils.ensureInteger(weaponRoll)

                let weaponFreqSum = 0;
                for (let weaponType = SSSTAccessoryType.WeaponFirst; weaponType <= SSSTAccessoryType.WeaponLastBuyable; ++weaponType) {
                    const weapon = SSSTWeapon.weaponForType(weaponType);
                    weaponFreqSum += weapon.occurrence;
                    MAUtils.ensureInteger(weaponFreqSum)
                    if (weaponFreqSum >= weaponRoll) {
                        ship.addWeaponOfType(weaponType);
                        break;
                    }
                }
            }

            let shieldSlots = model.shieldSlots;
            if (model.shieldSlots > 0 && game.difficulty <= SSSTDifficulty.Hard) {
                shieldSlots = gameRand.randomIntBelow(1 + model.shieldSlots);
                if (shieldSlots < model.shieldSlots) {
                    if (tries > 3) {
                        shieldSlots++;
                    } else if (tries > 1) {
                        shieldSlots += gameRand.randomIntBelow(2);
                    }
                }
            }

            MAUtils.ensureInteger(shieldSlots)

            let totalShieldPower = 0;
            for (let i = 0; i < shieldSlots; ++i) {
                let shieldRoll = 0;
                shieldRoll = BEST_ROLL(shieldRoll, tries, 100);
                MAUtils.ensureInteger(shieldRoll)

                let shieldFreqSum = 0;
                for (let shieldType = SSSTAccessoryType.ShieldFirst; shieldType <= SSSTAccessoryType.ShieldLastBuyable; ++shieldType) {
                    const shield = SSSTShield.shieldForType(shieldType);
                    shieldFreqSum += shield.occurrence;
                    if (shieldFreqSum >= shieldRoll) {
                        ship.addShieldOfType(shieldType);

                        let shieldPower = 0;
                        shieldPower = BEST_ROLL(shieldPower, 5, shield.power);
                        totalShieldPower += shieldPower + 1;
                        break;
                    }
                }
            }

            MAUtils.ensureInteger(totalShieldPower)

            const damage = ship.currentShieldPower - totalShieldPower;
            ship.damageShieldsByAmount(damage);

            // Shields means there's likely a stronger hull
            if (ship.currentShieldPower > 0 && (gameRand.randomIntBelow(10) <= 7)) {
                // Hull is already at full strength
            } else if (type !== SSSTOpponentType.Mantis) {
                let hullStrength = 0;
                hullStrength = BEST_ROLL(hullStrength, 5, ship.hull);

                ship.damageHullByAmount(ship.hull - hullStrength);
            }

            let numMercenaries = model.mercenaryQuarters();
            if (game.difficulty <= SSSTDifficulty.Hard) {
                numMercenaries = 1 + gameRand.randomIntBelow(model.mercenaryQuarters());

                if (game.difficulty >= SSSTDifficulty.Hard && numMercenaries < model.mercenaryQuarters()) {
                    numMercenaries++;
                }
            }

            MAUtils.ensureInteger(numMercenaries)

            for (let i = 0; i < numMercenaries; ++i) {
                const mercenary = new SSSTCrewMember(SSSTCrewMember.mercenaryNames()[i]);
                mercenary.randomizeAttributes();
                ship.addCrewMember(mercenary);
            }

            const pilot = 1 + gameRand.randomIntBelow(MAX_SKILL_LEVEL);
            const fighter = 1 + gameRand.randomIntBelow(MAX_SKILL_LEVEL);
            const trader = 1 + gameRand.randomIntBelow(MAX_SKILL_LEVEL);
            let engineer = 1 + gameRand.randomIntBelow(MAX_SKILL_LEVEL);
            if (game.commander.currentSystem.name === "Kravat" && game.wildStatus === SSSTWildQuestStatus.OnBoard && gameRand.randomIntBelow(10) < game.difficulty + 1) {
                engineer = MAX_SKILL_LEVEL;
            }

            opponent = new SSSTOpponent(type, engineer, pilot, fighter, trader, ship);
        }

        return opponent;
    }
}

// Utility function to replicate BEST_ROLL macro
function BEST_ROLL(roll, tries, max) {
    for (let i = 0; i < tries; ++i) {
        roll = Math.max(roll, gameRand.randomIntBelow(max));
    }
    return roll
}
