class SSSTNewCommanderViewController {
  constructor(div) {
    this.div = div
  }

  _skills() {
    return [
      { id: 'engineer', name: 'Engineer' },
      { id: 'pilot', name: 'Pilot' },
      { id: 'fighter', name: 'Fighter' },
      { id: 'trader', name: 'Trader' }
    ];
  }

  _maxPoints() {
    const maxPoints = MAX_SKILL_LEVEL*2
    return maxPoints
  }

  presentView() {
    // Clear the div
    this.div.innerHTML = '';

    const containerDiv = document.createElement('div')
    this.div.appendChild(containerDiv)
    containerDiv.classList.add('centered')

    const icon = document.createElement('img')
    icon.classList.add('landing-page-icon')
    icon.src = './spacetrader-1000.png'
    containerDiv.appendChild(icon)

    const mainTitle = MAUtils.createElement('h1', { textContent: 'Space Trader' }, containerDiv);
    mainTitle.classList.add('centered-div')
    mainTitle.classList.add('main-title')

    const newCommanderTitle = MAUtils.createElement('h1', { textContent: 'New Commander' }, containerDiv);
    newCommanderTitle.classList.add("new-commander-title")

    // Create and append the name entry field
    MAUtils.createElement('label', { textContent: 'Name: ' }, containerDiv);
    const nameInput = MAUtils.createElement('input', { type: 'text', id: 'nameInput', value: 'Jean-Luc' }, containerDiv);
    containerDiv.appendChild(document.createElement('br'));

    // Create and append the difficulty drop-down

    const difficultyContainer = document.createElement('div')
    difficultyContainer.classList.add('difficulty')
    containerDiv.appendChild(difficultyContainer)

    MAUtils.createElement('label', { textContent: 'Difficulty: ' }, difficultyContainer);
    const difficultySelect = MAUtils.createElement('select', { id: 'difficultySelect' }, difficultyContainer);
    actionLog.registerSelectEventListener(difficultySelect, 'change', () => {
    });

    for (let i = 0; i < SSSTDifficulty.Count; i++) {
      const difficultyStr = DIFFICULTY_STR(i)
      const option = MAUtils.createElement('option', { value: difficultyStr, textContent: difficultyStr }, difficultySelect);
      if (i === SSSTDifficulty.Normal) {
        option.selected = true;
      }
    }

    // Total points allowed is MAX_SKILL_LEVEL*2. Spread across 4 skills.
    const defaultSkillLevel = Math.floor(this._maxPoints() / 4);

    // Skills and their initial values
    const skills = this._skills()
    const container = document.createElement('div');
    container.className = 'skill-container';
    containerDiv.appendChild(container)


    const table = document.createElement('table');
    table.classList.add('skill-table')
    container.appendChild(table)

    // Create sliders for each skill
    skills.forEach(skill => {
      const row = document.createElement('tr')
      table.appendChild(row)

      const labelCell = document.createElement('td')
      row.appendChild(labelCell)
      labelCell.classList.add('skill-label-cell')
      const title = document.createElement('span')
      title.textContent = skill.name
      labelCell.appendChild(title)

      const skillCell = document.createElement('td')
      row.appendChild(skillCell)


      // Create range input (slider) for skill
      const input = document.createElement('input');
      input.type = 'range';
      input.id = skill.id;
      input.min = '1';
      input.max = MAX_SKILL_LEVEL
      input.value = defaultSkillLevel;
      skillCell.appendChild(input);


      const valueCell = document.createElement('td')
      row.appendChild(valueCell)
      valueCell.classList.add('skill-value-cell')

      // Display the current value of the slider
      const valueDisplay = document.createElement('span');
      valueDisplay.id = `${skill.id}Val`;
      valueDisplay.textContent = input.value;
      valueCell.appendChild(valueDisplay);

      // Add event listener to update points dynamically
      input.addEventListener('input', (el) => this.updatePoints(skill.id));
      actionLog.registerSliderEventListener(input, 'input', () => {
        this.updatePoints(skill.id)
      });
    });

    // Display remaining points
    const pointsDisplay = document.createElement('div');
    pointsDisplay.className = 'points';
    pointsDisplay.innerHTML = `Skill Points Remaining: <span id="pointsRemaining">0</span> of ${this._maxPoints()}`;
    container.appendChild(pointsDisplay)


    // Create and append the "create" button
    const createButton = MAUtils.createElement('button', { textContent: 'Begin Adventure', id: "createCommander"}, containerDiv);
    actionLog.registerButtonEventListener(createButton, 'click', () => {
      const name = nameInput.value;
      const difficulty = difficultySelect.selectedIndex;
      const engineer = parseInt(document.getElementById('engineer').value, 10);
      const pilot = parseInt(document.getElementById('pilot').value, 10);
      const fighter = parseInt(document.getElementById('fighter').value, 10);
      const trader = parseInt(document.getElementById('trader').value, 10);

      console.log(`New Commander create action: difficulty: ${difficulty}; engineer ${engineer}  pilot ${pilot}  fighter ${fighter}  trader ${trader}`);
      this.delegate.newCommanderViewControllerDidCreateCommanderWithName(this, name, difficulty, engineer, pilot, fighter, trader);
    });
  }

  updatePoints(skill) {
    let total = 0;

    const skills = this._skills().sort((a, b) => {
      // Changed skill goes first so we fix overage by penalizing another skill
      if (a.id === skill) {
        return -1
      } else if (b.id === skill) {
        return 1
      }

      // Penalize the highest skill - sorting these lowest-to-highest happens to achieve this in practice
      // because the overage handling code below only subtracts after we exceed the max. We don't exceed
      // the max until we've added up the smaller-value skills.
      const aValue = parseInt(document.getElementById(a.id).value, 10)
      const bValue = parseInt(document.getElementById(b.id).value, 10)
      if (aValue != bValue) {
        return aValue - bValue
      }

      return a.id.localeCompare(b.id)
    })

    const maxPoints = this._maxPoints()

    // Calculate total used points
    skills.forEach(skill => {
      const slider = document.getElementById(skill.id);
      let value = parseInt(slider.value, 10);

      const remaining = maxPoints - (total + value)
      if (remaining < 0) {
        const overage = -remaining
        value -= Math.min(value, overage)
        slider.value = value
      }

      total += value;
    });

    const remaining = maxPoints - total;
    document.getElementById('pointsRemaining').textContent = remaining;

    skills.forEach(skill => {
      const slider = document.getElementById(skill.id);
      const value = parseInt(slider.value, 10);
      document.getElementById(`${skill.id}Val`).textContent = value;
    });
  }
}
