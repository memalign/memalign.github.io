document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('projects-grid');
    const gameGridOthers = document.getElementById('projects-grid-others');

    const memalignEntries = [];
    const otherEntries = [];

    for (const [gameId, game] of Object.entries(GameGenerators)) {
        if (game.submitter) {
            otherEntries.push([gameId, game]);
        } else {
            memalignEntries.push([gameId, game]);
        }
    }

    memalignEntries.sort((a, b) => a[1].displayOrder - b[1].displayOrder);
    otherEntries.sort((a, b) => a[1].displayOrder - b[1].displayOrder);

    const createGridEntry = (gameId, game) => {
        const gridEntry = document.createElement('div');
        gridEntry.id = 'projects-grid-entry';

        const gameLink = document.createElement('a');
        gameLink.href = `wolfer.html?g=${gameId}`;

        const title = document.createElement('div');
        title.id = 'projects-grid-title';
        title.textContent = game.name;

        const rectImgContainer = document.createElement('div');
        rectImgContainer.classList.add('rect-img-container');

        const icon = document.createElement('img');
        const iconURL = GameGeneratorIconURLForGameName(gameId);

        icon.src = iconURL;
        icon.alt = `${game.name} icon`;
        rectImgContainer.appendChild(icon);

        gameLink.appendChild(rectImgContainer);
        gameLink.appendChild(title);

        gridEntry.appendChild(gameLink);

        if (game.submitter) {
            const subtitle = document.createElement('div');
            subtitle.id = 'projects-grid-subtitle';
            subtitle.textContent = `by ${game.submitter}`;
            gridEntry.appendChild(subtitle);
        }

        const description = document.createElement('p');
        description.textContent = game.description || '';
        gridEntry.appendChild(description);

        return gridEntry;
    };

    for (const [gameId, game] of memalignEntries) {
        gameGrid.appendChild(createGridEntry(gameId, game));
    }

    for (const [gameId, game] of otherEntries) {
        gameGridOthers.appendChild(createGridEntry(gameId, game));
    }
});
