class SSSTNewsViewController {
  constructor(div, game) {
    this.div = div
    this._game = game
  }

  _autoNewsValueChanged(event) {
    console.log(`Checkbox value changed: ${event.target.checked}`);
    console.log("game: " + this._game)
    this._game.autoNews = event.target.checked
    this._game.save()
  }

  _price() {
    return this._game.difficulty + 1;
  }

  _buyNews() {
    if (!this._game.alreadyPaidForNewspaper) {
      let credits = this._game.commander.getCredits()
      this._game.commander.setCredits(credits - this._price())
      this._game.alreadyPaidForNewspaper = true
      this._game.save()

      this._updateNewsStrDiv()
    }
  }

  presentView() {
    const containerDiv = this.div
    containerDiv.innerHTML = '';

    const nh = MAUtils.createElement('h1', { textContent: 'News' }, containerDiv);
    nh.classList.add('centered-div')
    nh.classList.add('news-header')

    containerDiv.appendChild(document.createElement('br'));


    if (!this._game.alreadyPaidForNewspaper) {
      if (this._game.commander.spendingMoney() < this._price()) {
        SSSTAlertViewController.presentAlertWithDismiss(`Sorry! A newspaper costs $${this._price()} in this system. You don't have enough money!`)
      } else {
        if (this._game.autoNews) {
          pLog.log(43)
          this._buyNews();
        }
      }
    }

    const newsStrDiv = document.createElement('div');
    newsStrDiv.id = "newsStrDiv";


    const button = document.createElement('div')
    button.classList.add('button-item')

    const a = document.createElement('a');
    a.id = "purchaseNews";
    a.classList.add('button-link')
    a.href = '#'; // Use # to make the link focusable/clickable without navigating

    const icon = document.createElement('img')
    icon.classList.add('button-icon')
    const iconName = "News"
    icon.src = PCEImageLibrary.pceImageForName(iconName).generatePNG(1)
    a.appendChild(icon)

    const title = document.createElement('span')
    title.textContent = `Pay $${this._price()} to read news`
    a.appendChild(title)

    button.appendChild(a)

    // Add click event listener
    actionLog.registerAEventListener(a, 'click', (event) => {
      event.preventDefault(); // Prevent the default link behavior

      this._buyNews()
    });

    newsStrDiv.appendChild(button)

    containerDiv.appendChild(newsStrDiv);

    this._updateNewsStrDiv();

    containerDiv.appendChild(document.createElement('br'));

    const autoNewsDiv = document.createElement('div')
    containerDiv.appendChild(autoNewsDiv)
    autoNewsDiv.classList.add('centered-div')

    // Create the checkbox input element
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'autoNewsCheckbox';
    checkbox.checked = this._game.autoNews;

    // Create the label for the checkbox
    const label = document.createElement('label');
    label.htmlFor = 'autoNewsCheckbox';
    label.innerText = 'Automatically buy newspaper';

    // Append the checkbox and label to the container div
    autoNewsDiv.appendChild(checkbox);
    autoNewsDiv.appendChild(label);

    actionLog.registerCheckboxEventListener(checkbox, 'change', (e) => {
      this._autoNewsValueChanged(e)
    });
  }

  _updateNewsStrDiv() {
    // User still hasn't paid for newspaper
		if (!this._game.alreadyPaidForNewspaper) { return }

    let newsStrDiv = document.getElementById('newsStrDiv')

    if (!newsStrDiv) { return }

    newsStrDiv.innerHTML = ''

    const mastheads = this._game.commander.getCurrentSystem().getPolitics().mastheads
    const hashCode = this._game.commander.getCurrentSystem().hashCode()
    const mastheadIndex = this._game.commander.getCurrentSystem().hashCode() % mastheads.length;
    let title = mastheads[mastheadIndex]
    title = title.replace(/%@/g, this._game.commander.getCurrentSystem().getName())


    const head = MAUtils.createElement('h4', { textContent: title }, null)

    const newsStr = this._newsString()
    newsStrDiv.innerHTML = "<br>" + newsStr.replace(/\n/g, '<br><br>');

    newsStrDiv.prepend(head)
  }

	_newsString() {
		if (this._cachedNews && (this._cachedSolarSystem === this._game.commander.getCurrentSystem())) {
			return this._cachedNews;
		}

		let headlines = '';
		let comma = '';

    const breakingNews = this._game.getBreakingNews() || []
		for (const item of breakingNews) {
			headlines += comma + item;
			comma = '\n';
		}
		this._game.clearBreakingNews();

		let specialHeadline = null;
		const specialEvent = this._game.commander.getCurrentSystem().getSpecialEvent();
		const japoriQuestStatus = this._game.japoriQuestStatus;
		const scarabStatus = this._game.scarabStatus;
		const monsterStatus = this._game.monsterStatus;
		const dragonflyStatus = this._game.dragonflyStatus;
		const invasionStatus = this._game.invasionStatus;
		const experimentStatus = this._game.experimentStatus;
		const jarekStatus = this._game.jarekStatus;
		const wildStatus = this._game.wildStatus;

		switch (specialEvent) {
			case SSSTSpecialEvent.JaporiDisease:
				if (japoriQuestStatus === SSSTJaporiQuestStatus.Open) {
          pLog.log(113)
					specialHeadline = 'Editorial: We Must Help Japori!';
				}
				break;
			case SSSTSpecialEvent.MedicineDelivery:
				if (japoriQuestStatus === SSSTJaporiQuestStatus.HasMedicine) {
          pLog.log(114)
					specialHeadline = 'Disease Antidotes Arrive! Health Officials Optimistic.';
				}
				break;
			case SSSTSpecialEvent.Scarab:
				specialHeadline = 'Security Scandal: Test Craft Confirmed Stolen.';
				break;
			case SSSTSpecialEvent.ScarabDestroyed:
				if (scarabStatus === SSSTScarabQuestStatus.ScarabDestroyed) {
					specialHeadline = 'Wormhole Traffic Delayed as Stolen Craft Destroyed.';
				} else if (scarabStatus === SSSTScarabQuestStatus.ScarabExists) {
					specialHeadline = 'Wormhole Travelers Harassed by Unusual Ship!';
				}
				break;
			case SSSTSpecialEvent.MonsterKilled:
				if (monsterStatus === SSSTMonsterQuestStatus.ClosedMonsterDestroyed) {
					specialHeadline = 'Hero Slays Space Monster! Parade, Honors Planned for Today.';
				} else if (monsterStatus === SSSTMonsterQuestStatus.MonsterExists) {
					specialHeadline = 'Space Monster Threatens Homeworld!';
				}
				break;
			case SSSTSpecialEvent.Dragonfly:
				specialHeadline = 'Experimental Craft Stolen! Critics Demand Security Review.';
				break;
			case SSSTSpecialEvent.FlyBaratas:
				if (dragonflyStatus === SSSTDragonflyQuestStatus.GoToBaratas) {
					specialHeadline = 'Investigators Report Strange Craft.';
				}
				break;
			case SSSTSpecialEvent.FlyMelina:
				if (dragonflyStatus === SSSTDragonflyQuestStatus.GoToMelina) {
					specialHeadline = 'Rumors Continue: Melina Orbitted by Odd Starcraft.';
				}
				break;
			case SSSTSpecialEvent.FlyRegulas:
				if (dragonflyStatus === SSSTDragonflyQuestStatus.GoToRegulas) {
					specialHeadline = 'Strange Ship Observed in Regulas Orbit.';
				}
				break;
			case SSSTSpecialEvent.DragonflyDestroyed:
				if (dragonflyStatus === SSSTDragonflyQuestStatus.ClosedDragonflyDestroyed) {
					specialHeadline = 'Spectacular Display as Stolen Ship Destroyed in Fierce Space Battle.';
				} else if (dragonflyStatus === SSSTDragonflyQuestStatus.GoToZalkon) {
					specialHeadline = 'Unidentified Ship: A Threat to Zalkon?';
				}
				break;
			case SSSTSpecialEvent.GemulonRescued:
				if (invasionStatus >= SSSTInvasionQuestStatus.DaysUntilInvasion._7 && invasionStatus <= SSSTInvasionQuestStatus.DaysUntilInvasion._1) {
					specialHeadline = 'Invasion Imminent! Plans in Place to Repel Hostile Invaders.';
				} else if (invasionStatus === SSSTInvasionQuestStatus.ClosedTooLate) {
					specialHeadline = 'Alien Invasion Devastates Planet!';
				}
				break;
			case SSSTSpecialEvent.AlienInvasion:
				specialHeadline = 'Editorial: Who Will Warn Gemulon?';
				break;
			case SSSTSpecialEvent.ExperimentStopped:
				if (experimentStatus >= SSSTExperimentQuestStatus.DaysRemaining._10 && experimentStatus <= SSSTExperimentQuestStatus.DaysRemaining._1) {
					specialHeadline = 'Scientists Cancel High-profile Test! Committee to Investigate Design.';
				}
				break;
			case SSSTSpecialEvent.ExperimentNotStopped:
				specialHeadline = 'Huge Explosion Reported at Research Facility.';
				break;
			case SSSTSpecialEvent.ArtifactDelivered:
				if (this._game.commander.artifactOnBoard) {
					specialHeadline = 'Scientist Adds Alien Artifact to Museum Collection.';
				}
				break;
			case SSSTSpecialEvent.JarekGetsOut:
				if (jarekStatus === SSSTJarekQuestStatus.OnBoard) {
					specialHeadline = 'Ambassador Jarek Returns from Crisis.';
				}
				break;
			case SSSTSpecialEvent.WildGetsOut:
				if (wildStatus === SSSTWildQuestStatus.OnBoard) {
					specialHeadline = 'Rumors Suggest Known Criminal J. Wild May Come to Kravat!';
				}
				break;
		}

		if (specialHeadline) {
			headlines += comma + specialHeadline;
			comma = '\n';
		}

		const status = this._game.commander.getCurrentSystem().getStatus();
		const statusString = (status) => {
			switch (status) {
				case SSSTStatus.AtWar: return 'War News: Offensives Continue!';
				case SSSTStatus.Plague: return 'Plague Spreads! Outlook Grim.';
				case SSSTStatus.Drought: return 'No Rain in Sight';
				case SSSTStatus.Boredom: return 'Editors: Won\'t Someone Entertain Us?';
				case SSSTStatus.ColdSpell: return 'Cold Snap Continues!';
				case SSSTStatus.CropFailure: return 'Serious Crop Failure! Must We Ration?';
				case SSSTStatus.LackWorkers: return 'Jobless Rate at All-Time Low!';
				default: return null;
			}
		};

		const statusStr = statusString(status);
		if (statusStr) {
			headlines += comma + statusStr;
			comma = '\n';
		}

		const policeRecordScore = this._game.commander.policeRecordScore;
		if (policeRecordScore <= SSSTPoliceRecordScore.Villain) {
			headlines += comma;

			const villainHeadlines = [
				`Police Warning: ${this._game.commander.name} Will Dock at ${this._game.commander.getCurrentSystem().getName()}!`,
				`Notorious Criminal ${this._game.commander.name} Sighted in ${this._game.commander.getCurrentSystem().getName()}!`,
				`Locals Rally to Deny Spaceport Access to ${this._game.commander.name}!`,
				`Terror Strikes Locals on Arrival of ${this._game.commander.name}!`
			];

			headlines += villainHeadlines[gameRand.randomIntBelow(villainHeadlines.length)];
			comma = '\n';
		} else if (policeRecordScore === SSSTPoliceRecordScore.Hero) {
			headlines += comma;

			const heroHeadlines = [
				`Locals Welcome Visiting Hero ${this._game.commander.name}!`,
				`Famed Hero ${this._game.commander.name} to Visit System!`,
				`Large Turnout At Spaceport to Welcome ${this._game.commander.name}!`
			];

			headlines += heroHeadlines[gameRand.randomIntBelow(heroHeadlines.length)];

			comma = '\n';
		}


		// Actually valuable news - more likely to show up in a higher-tech system
		let realNews = false;
		const solarSystemsWithinRange = this._game.solarSystemsWithinRange();

		for (let i = 0; i < solarSystemsWithinRange.length; i++) {
			let solarSystem = solarSystemsWithinRange[i];

			if (solarSystem.getSpecialEvent() === SSSTSpecialEvent.MoonForSale) {
				headlines += `${comma}Seller in ${solarSystem.getName()} System has Utopian Moon Available.`;
				comma = '\n';
			} else if (solarSystem.specialEvent === SSSTSpecialEvent.BuyTribble) {
				headlines += `${comma}Collector in ${solarSystem.getName()} System Seeks to Purchase Tribbles.`;
				comma = '\n';
			}

			if (solarSystem.status !== SSSTStatus.Uneventful) {
				if (gameRand.randomIntBelow(100) <= (solarSystem.techLevel * 50 / SSSTTechLevel.Count) + 10 * (5 - this._game.difficulty)) {
					const storyPrefixes = ["Reports of", "News of", "New Rumors of", "Sources say", "Notice:", "Evidence Suggests"];

					const HEADLINE_STATUS_STR = (st) => {
						switch (st) {
							case SSSTStatus.AtWar:
								return "Strife and War";
							case SSSTStatus.Plague:
								return "Plague Outbreaks";
							case SSSTStatus.Drought:
								return "Severe Drought";
							case SSSTStatus.Boredom:
								return "Terrible Boredom";
							case SSSTStatus.ColdSpell:
								return "Cold Weather";
							case SSSTStatus.CropFailure:
								return "Crop Failures";
							default:
								return "Labor Shortages";
						}
					};

					headlines += `${comma}${storyPrefixes[gameRand.randomIntBelow(storyPrefixes.length)]} ${HEADLINE_STATUS_STR(solarSystem.getStatus())} in the ${solarSystem.getName()} System.`;
					comma = '\n';
					realNews = true;
				}
			}
		}

		if (!realNews) {
			headlines += comma;
			const systemHeadlines = this._game.commander.getCurrentSystem().getPolitics().headlines;
			headlines += systemHeadlines[gameRand.randomIntBelow(systemHeadlines.length)];
			comma = '\n';
		}

		this._cachedSolarSystem = this._game.commander.getCurrentSystem();
		this._cachedNews = headlines;
		return headlines;
	}


}
