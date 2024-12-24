const MAX_HIGH_SCORES = 6;

function END_STATUS_STR(x) {
  switch (x) {
    case SSSTGameEndStatus.None:
      return "is still playing";
    case SSSTGameEndStatus.Retired:
      return "retired";
    case SSSTGameEndStatus.Killed:
      return "was killed";
    case SSSTGameEndStatus.Moon:
      return "claimed a moon";
    default:
      return "retired";
  }
}

class SSSTEndGameViewController {
  constructor(div, game, inProgress) {
    this.div = div
    this._game = game
    this._inProgress = inProgress
  }

  presentView() {
    const containerDiv = this.div
    containerDiv.innerHTML = '';

    if (!this._inProgress) {
      const title = "Game Over"
      const h = MAUtils.createElement('h1', { textContent: title }, containerDiv);
      h.classList.add('centered')
    }

    containerDiv.appendChild(document.createElement('br'))

    let currentGameText = `You ${this._inProgress ? 'currently have' : 'achieved'} a score of ${this._game.scorePercentageString()}.\n`;

    if (!this._inProgress) {
      if (this._isCurrentGameHighScoring()) {
        currentGameText += "\nCongratulations! You have made the high score list!\n\n";
      } else {
        currentGameText += "\nAlas! This is not enough to enter the high score list.\n\n";
      }
    }

    const currentGameDiv = document.createElement('div');
    currentGameDiv.id = 'end-message'
    currentGameDiv.classList.add('centered-div')
    currentGameDiv.classList.add('centered')
    containerDiv.appendChild(currentGameDiv);
    currentGameDiv.innerHTML = currentGameText.replace(/\n/g, '<br>');


    if (!this._inProgress) {
      pLog.log(62)
      const endGameButton = document.createElement('button');
      endGameButton.innerText = 'End Game and Start Over';
      endGameButton.id = "endgame"
      actionLog.registerButtonEventListener(endGameButton, 'click', () => {
        this.delegate.endGameViewControllerWantsContinue(this)
      });
      const egDiv = document.createElement('div')
      egDiv.classList.add('centered-div')
      egDiv.appendChild(endGameButton);
      containerDiv.appendChild(egDiv);
      containerDiv.appendChild(document.createElement('br'))
    }


    const hallOfFameTitle = MAUtils.createElement('h3', { textContent: 'Hall of Fame' }, containerDiv);
    hallOfFameTitle.classList.add('centered')
    const scoringGames = this.delegate.highScoringGamesWithinCount(MAX_HIGH_SCORES)

    let highScoresStr = ""
    let comma = ""

    if (scoringGames.length > 0) {
      for (let g of scoringGames) {
        console.log("serialized state: " + JSON.stringify(g))
        const game = SSSTGame.fromSerializedState(g)
        let gameStr = `${game.commander.name} ${END_STATUS_STR(game.endStatus)} after ${game.commander.days} day${game.commander.days === 1 ? '' : 's'}, worth $${game.commander.netWorth()} on ${DIFFICULTY_STR(game.difficulty)} level. Score: ${game.scorePercentageString()}.`;

        highScoresStr += comma + gameStr
        comma = "\n\n"
      }
    } else {
      highScoresStr = "None on record"
    }

    const highScoresDiv = document.createElement('div');
    highScoresDiv.id = 'highscores'
    highScoresDiv.classList.add('centered-div')
    highScoresDiv.classList.add('centered')
    containerDiv.appendChild(highScoresDiv);
    highScoresDiv.innerHTML = highScoresStr.replace(/\n/g, '<br>');

    if (scoringGames.length > 0) {
      containerDiv.appendChild(document.createElement('br'))

      const clearHighScoresButton = document.createElement('button');
      clearHighScoresButton.innerText = 'Clear All';
      clearHighScoresButton.id = "clearall"
      actionLog.registerButtonEventListener(clearHighScoresButton, 'click', () => {

        let aC = new SSSTAlertViewController("Clear all high scores? This can't be undone.")
        aC.addAction("Clear all", SSSTAlertActionType.Destructive, () => {
          pLog.log(93)
          this.delegate.clearAllHighScoringGames()
          this.presentView()
        })

        aC.addAction("Cancel", SSSTAlertActionType.Cancel, null)

        aC.presentView()
      });
      const bDiv = document.createElement('div')
      bDiv.classList.add('centered-div')
      bDiv.appendChild(clearHighScoresButton);
      containerDiv.appendChild(bDiv);
    }
  }

  _isCurrentGameHighScoring() {
    const scoringGames = this.delegate.highScoringGamesWithinCount(MAX_HIGH_SCORES)
    const matching = scoringGames.filter(g => g.uniqueID === this._game.uniqueID)
    return matching.length > 0
  }
}
